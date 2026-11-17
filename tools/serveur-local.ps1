# ---------------------------------------------------------------------------
# Petit serveur web local pour tester le portfolio (sans Python ni installation)
# Usage : double-cliquer sur « lancer-site.bat », ou :
#   powershell -ExecutionPolicy Bypass -File tools\serveur-local.ps1 [-Port 8766]
# Arrêt : fermer la fenêtre ou Ctrl+C.
# Les requêtes sont traitées en parallèle : un navigateur lent ou une image
# annulée ne bloque ni n'arrête le serveur.
# ---------------------------------------------------------------------------
param([int]$Port = 8766, [switch]$NoBrowser)

$root = Split-Path -Parent $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch {
    Write-Host "Le port $Port est déjà utilisé. Le site tourne peut-être déjà : http://localhost:$Port/" -ForegroundColor Yellow
    Write-Host "Sinon, relancez avec un autre port : -Port 8770"
    if (-not $NoBrowser) { Read-Host "Entrée pour fermer" }
    exit 1
}
Write-Host "Portfolio servi depuis : $root"
Write-Host "Ouvrez : http://localhost:$Port/   (fermez cette fenêtre pour arrêter)" -ForegroundColor Green
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }

# Traitement d'une requête (exécuté dans un fil séparé)
$handler = {
    param($ctx, $root)
    $types = @{
        ".html" = "text/html; charset=utf-8"; ".css" = "text/css; charset=utf-8"; ".js" = "application/javascript; charset=utf-8"
        ".json" = "application/json; charset=utf-8"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"
        ".svg" = "image/svg+xml"; ".webp" = "image/webp"; ".pdf" = "application/pdf"; ".txt" = "text/plain; charset=utf-8"
        ".sh" = "text/plain; charset=utf-8"; ".ps1" = "text/plain; charset=utf-8"; ".md" = "text/plain; charset=utf-8"
        ".xlsx" = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    try {
        $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
        if ($path -eq "" -or $path.EndsWith("/")) { $path += "index.html" }
        $file = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $path))
        if ($file.StartsWith($root) -and [IO.File]::Exists($file)) {
            $bytes = [IO.File]::ReadAllBytes($file)
            $ext = [IO.Path]::GetExtension($file).ToLower()
            $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" }
            $ctx.Response.Headers.Add("Cache-Control", "no-store")
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $ctx.Response.StatusCode = 404
            $b = [Text.Encoding]::UTF8.GetBytes("404 - $path")
            $ctx.Response.OutputStream.Write($b, 0, $b.Length)
        }
    } catch {
        # connexion fermée par le navigateur (chargement annulé) : sans conséquence
    } finally {
        try { $ctx.Response.Close() } catch { }
    }
}

$pool = [runspacefactory]::CreateRunspacePool(1, 16)
$pool.Open()
$jobs = New-Object System.Collections.ArrayList

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $ps = [powershell]::Create()
        $ps.RunspacePool = $pool
        [void]$ps.AddScript($handler).AddArgument($ctx).AddArgument($root)
        [void]$jobs.Add([pscustomobject]@{ ps = $ps; h = $ps.BeginInvoke() })
        # Nettoyage des traitements terminés
        for ($i = $jobs.Count - 1; $i -ge 0; $i--) {
            if ($jobs[$i].h.IsCompleted) {
                try { $jobs[$i].ps.EndInvoke($jobs[$i].h) } catch { }
                $jobs[$i].ps.Dispose(); $jobs.RemoveAt($i)
            }
        }
    }
} finally {
    $listener.Stop(); $pool.Close()
}
