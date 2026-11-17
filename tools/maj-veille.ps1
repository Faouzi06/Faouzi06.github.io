# ---------------------------------------------------------------------------
# Veille technologique - agrégation automatique des flux RSS / Atom
# Produit assets/data/veille.json, lu par veille.html.
#
# Lancement manuel (depuis le dossier du portfolio) :
#   powershell -ExecutionPolicy Bypass -File tools\maj-veille.ps1
# Lancement automatique : .github/workflows/veille.yml (toutes les 6 heures)
# Compatible Windows PowerShell 5.1 et PowerShell 7 (Linux).
# ---------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root    = Split-Path -Parent $PSScriptRoot
$outFile = Join-Path $root 'assets/data/veille.json'
$maxAge  = 30      # jours conservés
$maxItems = 120
$perSource = 20    # évite qu'une source très prolifique écrase les autres

# Sources : nom, URL du flux, langue
$sources = @(
    @{ name = 'CERT-FR';              url = 'https://www.cert.ssi.gouv.fr/feed/';                                            lang = 'fr' },
    @{ name = 'Cybermalveillance';    url = 'https://www.cybermalveillance.gouv.fr/feed/atom-flux-actualites';               lang = 'fr' },
    @{ name = 'LeMagIT';              url = 'https://www.lemagit.fr/rss/ContentSyndication.xml';                            lang = 'fr' },
    @{ name = 'Le Monde Informatique'; url = 'https://www.lemondeinformatique.fr/flux-rss/thematique/securite/rss.xml';      lang = 'fr' },
    @{ name = 'IT-Connect';           url = 'https://www.it-connect.fr/feed/';                                              lang = 'fr' },
    @{ name = 'ZATAZ';                url = 'https://www.zataz.com/feed/';                                                  lang = 'fr' },
    @{ name = 'BleepingComputer';     url = 'https://www.bleepingcomputer.com/feed/';                                       lang = 'en' },
    @{ name = 'The Hacker News';      url = 'https://feeds.feedburner.com/TheHackersNews';                                  lang = 'en' }
)

# Thèmes : détection par mots-clés dans le titre et le résumé (insensible à la casse)
$themes = [ordered]@{
    vulnerabilites = 'vuln[eé]rab|faille|\bCVE-|correctif|patch|zero-?day|0-day|exploit'
    rancongiciels  = 'ransom|ran[cç]ongiciel|ran[cç]on|extorsion|lockbit|akira|qilin|black ?basta'
    reseau         = 'r[eé]seau|network|cisco|fortinet|fortigate|palo alto|\bvpn\b|wi-?fi|firewall|pare-feu|routeur|router|switch|\bdns\b|ddos'
    systemes       = 'windows|linux|debian|ubuntu|proxmox|vmware|esxi|hyper-v|active directory|kerberos|serveur|server|docker|kubernetes'
    ia             = '\bIA\b|\bAI\b|intelligence artificielle|\bLLM|chatgpt|copilot|agent IA|AI agent'
    donnees        = 'fuite|leak|breach|vol de donn[eé]es|donn[eé]es personnelles|RGPD|GDPR'
}
# Contenus publicitaires écartés
$exclude = 'bon plan|promo|offre sp[eé]ciale|black friday|code promo|sponsoris'

function Get-Text($node, [string[]]$names) {
    foreach ($n in $names) {
        $c = $node.SelectSingleNode("*[local-name()='$n']")
        if ($c) {
            if ($n -eq 'link' -and $c.GetAttribute('href')) { return $c.GetAttribute('href') }
            if ($c.InnerText) { return $c.InnerText.Trim() }
        }
    }
    return ''
}

# Illustration de l'article : enclosure, media:content / media:thumbnail, sinon première <img> du contenu
function Get-Image($node, [string]$html) {
    $cands = @()
    foreach ($c in $node.SelectNodes("*[local-name()='enclosure' or local-name()='content' or local-name()='thumbnail']")) {
        $u = $c.GetAttribute('url'); if (-not $u) { $u = $c.GetAttribute('href') }
        $t = $c.GetAttribute('type'); $m = $c.GetAttribute('medium')
        if ($u -and ($t -like 'image*' -or $m -eq 'image' -or $c.LocalName -eq 'thumbnail' -or $u -match '\.(jpe?g|png|webp|gif)(\?|$)')) { $cands += $u }
    }
    foreach ($c in $node.SelectNodes("*[local-name()='link' and @rel='enclosure']")) { $cands += $c.GetAttribute('href') }
    if ($html) {
        $m2 = [regex]::Match($html, '<img[^>]+src=["'']([^"'']+)["'']', 'IgnoreCase')
        if ($m2.Success) { $cands += [System.Net.WebUtility]::HtmlDecode($m2.Groups[1].Value) }
    }
    foreach ($u in $cands) { if ($u -match '^https://' -and $u -notmatch 'feedburner|pixel|tracking|1x1|gravatar') { return $u } }
    return ''
}

function Get-Date2([string]$s) {
    if (-not $s) { return $null }
    $s = $s -replace '\s+([+-]\d{2})(\d{2})$', ' $1:$2' -replace '\s+GMT$', ' +00:00' -replace '\s+UT$', ' +00:00'
    $d = [DateTimeOffset]::MinValue
    if ([DateTimeOffset]::TryParse($s, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeUniversal, [ref]$d)) { return $d.ToUniversalTime() }
    return $null
}

function Clean([string]$html, [int]$max) {
    $t = [regex]::Replace($html, '<[^>]+>', ' ')
    $t = [System.Net.WebUtility]::HtmlDecode($t)
    $t = [regex]::Replace($t, '\s+', ' ').Trim()
    if ($t.Length -gt $max) { $t = $t.Substring(0, $max).TrimEnd() + '…' }
    return $t
}

$limit = [DateTimeOffset]::UtcNow.AddDays(-$maxAge)
$all = New-Object System.Collections.Generic.List[object]
$status = @()

foreach ($src in $sources) {
    try {
        $resp = Invoke-WebRequest -Uri $src.url -UseBasicParsing -TimeoutSec 25 -UserAgent 'Mozilla/5.0 (portfolio-veille; +github-actions)'
        # Décodage UTF-8 explicite (certains serveurs annoncent mal l'encodage)
        $bytes = $resp.RawContentStream.ToArray()
        $xmlText = [Text.Encoding]::UTF8.GetString($bytes)
        $xml = New-Object System.Xml.XmlDocument
        $xml.XmlResolver = $null
        $xml.LoadXml($xmlText.TrimStart([char]0xFEFF))
        $nodes = $xml.SelectNodes("//*[local-name()='item' or local-name()='entry']")
        $count = 0
        foreach ($n in $nodes) {
            if ($count -ge $perSource) { break }
            $title = Clean (Get-Text $n @('title')) 200
            $link  = Get-Text $n @('link', 'guid', 'id')
            $date  = Get-Date2 (Get-Text $n @('pubDate', 'published', 'updated', 'date'))
            if (-not $title -or -not $link -or -not $date -or $date -lt $limit) { continue }
            if ($title -match $exclude) { continue }
            $rawBody = Get-Text $n @('encoded', 'content', 'description', 'summary')
            $summary = Clean (Get-Text $n @('description', 'summary', 'content', 'encoded')) 240
            $hay = "$title $summary"
            $tags = @($themes.Keys | Where-Object { $hay -match $themes[$_] })
            $all.Add([pscustomobject]@{
                title   = $title
                link    = $link
                date    = $date.ToString('yyyy-MM-ddTHH:mm:ssZ')
                source  = $src.name
                lang    = $src.lang
                summary = $summary
                themes  = $tags
                image   = Get-Image $n $rawBody
            })
            $count++
        }
        $status += [pscustomobject]@{ source = $src.name; ok = $true; items = $count }
        Write-Host ("[OK] {0,-22} {1} articles" -f $src.name, $count)
    } catch {
        $status += [pscustomobject]@{ source = $src.name; ok = $false; items = 0 }
        Write-Warning ("[KO] {0} : {1}" -f $src.name, $_.Exception.Message)
    }
}

# Dédoublonnage par lien, tri du plus récent au plus ancien
$items = $all | Sort-Object link -Unique | Sort-Object date -Descending | Select-Object -First $maxItems

# Images manquantes : réutiliser le passage précédent, sinon lire og:image sur la page (60 requêtes max)
$cache = @{}
if (Test-Path $outFile) {
    try { (Get-Content $outFile -Raw -Encoding UTF8 | ConvertFrom-Json).items | Where-Object { $_.image } | ForEach-Object { $cache[$_.link] = $_.image } } catch { }
}
$fetched = 0
foreach ($it in $items) {
    if ($it.image) { continue }
    if ($cache.ContainsKey($it.link)) { $it.image = $cache[$it.link]; continue }
    if ($it.source -eq 'CERT-FR' -or $fetched -ge 60) { continue }
    $fetched++
    try {
        $page = Invoke-WebRequest -Uri $it.link -UseBasicParsing -TimeoutSec 10 -UserAgent 'Mozilla/5.0 (portfolio-veille)'
        $m = [regex]::Match($page.Content, '<meta[^>]+(?:property|name)=["''](?:og:image|twitter:image)["''][^>]+content=["'']([^"'']+)["'']', 'IgnoreCase')
        if (-not $m.Success) { $m = [regex]::Match($page.Content, '<meta[^>]+content=["'']([^"'']+)["''][^>]+(?:property|name)=["'']og:image["'']', 'IgnoreCase') }
        if ($m.Success) {
            $u = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)
            if ($u -match '^https://') { $it.image = $u }
        }
    } catch { }
}
Write-Host ("Images : {0} / {1} articles ({2} pages consultées)" -f @($items | Where-Object { $_.image }).Count, @($items).Count, $fetched)

if (-not $items) { throw "Aucun article récupéré : le fichier existant est conservé." }

$payload = [ordered]@{
    updated = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
    sources = $status
    items   = @($items)
}
New-Item -ItemType Directory -Force (Split-Path $outFile) | Out-Null
$json = $payload | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText($outFile, $json, (New-Object Text.UTF8Encoding $false))
Write-Host ("=> {0} articles écrits dans {1}" -f @($items).Count, $outFile)
