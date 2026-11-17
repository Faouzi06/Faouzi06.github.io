/* ==========================================================================
   Veille V2 (FW-01) : tableau de bord, infographie, frise, cartes d'articles
   Données : assets/data/veille.json (généré par tools/maj-veille.ps1)
   ========================================================================== */
(function () {
    "use strict";
    const THEMES = { vulnerabilites: "Vulnérabilités", rancongiciels: "Rançongiciels", reseau: "Réseau", systemes: "Systèmes", ia: "IA", donnees: "Fuites de données" };
    const SRC_COLOR = { "CERT-FR": "#58A6FF", "Cybermalveillance": "#3FB950", "LeMagIT": "#D29922", "Le Monde Informatique": "#BC8CFF", "IT-Connect": "#39C5CF", "ZATAZ": "#F85149", "BleepingComputer": "#F778BA", "The Hacker News": "#A7B3C2" };
    const PRODUCTS = [["Microsoft / Windows", /windows|microsoft/i], ["Linux", /linux|debian|ubuntu/i], ["Cisco", /cisco/i], ["Fortinet", /fortinet|fortigate|forti/i], ["VMware", /vmware|vcenter|esxi/i], ["Google / Chrome", /chrome|google|android/i], ["Apple", /apple|ios |macos|iphone/i], ["Ivanti", /ivanti/i], ["Palo Alto", /palo alto|pan-os/i], ["WordPress", /wordpress/i]];
    const $ = (s) => document.querySelector(s);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
    const dfmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });
    const ago = (iso) => {
        const diff = (new Date(iso) - Date.now()) / 1000;
        for (const [u, s] of [["day", 86400], ["hour", 3600], ["minute", 60]]) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
        return "à l'instant";
    };
    const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch (e) { return ""; } };

    /* ---------- Infographie : cycle (sans données, toujours affichée) ---------- */
    const STEPS = [
        { t: "Surveiller", d: "Lire les avis et alertes du CERT-FR et le fil de veille, filtrés sur les produits de mon périmètre.", l: ["#fil", "Voir le fil d'actualité"] },
        { t: "Inventorier", d: "Pas de correctif sans inventaire : savoir quels postes, serveurs et versions sont concernés. C'est le rôle de GLPI.", l: ["projets/glpi-novaservices.html", "GLPI NovaServices"] },
        { t: "Évaluer", d: "Croiser la gravité (CVSS, exploitation active, catalogue KEV) avec l'exposition réelle : accessible depuis Internet ? dans quel VLAN ?", l: ["projets/vlanne.html", "Segmentation VLANNE"] },
        { t: "Tester", d: "Appliquer d'abord sur une instance de recette ou après un snapshot, pour pouvoir revenir en arrière.", l: ["projets/infra-proxmox.html", "Snapshots Proxmox"] },
        { t: "Déployer", d: "Par vagues, en commençant par un groupe pilote : une erreur ne touche alors qu'une dizaine d'utilisateurs.", l: ["projets/glpi-novaservices.html", "Stratégie par vagues"] },
        { t: "Vérifier", d: "Contrôler la version installée, tracer le changement dans un ticket et surveiller le service. Si un correctif tarde : segmentation, réduction de la surface d'attaque, durcissement.", l: ["projets/securisation-debian.html", "Réduction de la surface d'attaque"] }
    ];
    const segs = $("#cycle-segs"), cinfo = $("#cycle-info");
    if (segs && cinfo) {
        const NS = "http://www.w3.org/2000/svg";
        const cx = 210, cy = 200, R = 138;
        STEPS.forEach((s, i) => {
            const a = (-90 + i * 60) * Math.PI / 180;
            const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
            // flèche vers l'étape suivante, le long de l'anneau
            const a2 = (-90 + (i + 1) * 60) * Math.PI / 180;
            const p1 = [cx + R * Math.cos(a + 0.33), cy + R * Math.sin(a + 0.33)], p2 = [cx + R * Math.cos(a2 - 0.33), cy + R * Math.sin(a2 - 0.33)];
            const arc = document.createElementNS(NS, "path");
            arc.setAttribute("d", `M${p1[0]},${p1[1]} A${R},${R} 0 0 1 ${p2[0]},${p2[1]}`);
            arc.setAttribute("fill", "none"); arc.setAttribute("stroke", "#58A6FF"); arc.setAttribute("stroke-width", "1.5"); arc.setAttribute("marker-end", "url(#arr)");
            segs.appendChild(arc);
            const g = document.createElementNS(NS, "g");
            g.setAttribute("class", "seg"); g.setAttribute("tabindex", "0"); g.setAttribute("role", "button");
            g.setAttribute("aria-label", `Étape ${i + 1} : ${s.t}`); g.dataset.i = i;
            g.innerHTML = `<circle cx="${x}" cy="${y}" r="40" fill="#111821" stroke="#58A6FF"/><text x="${x}" y="${y - 6}" text-anchor="middle" fill="#58A6FF" font-size="10">0${i + 1}</text><text x="${x}" y="${y + 10}" text-anchor="middle" font-weight="700">${s.t}</text>`;
            segs.appendChild(g);
        });
        const show = (i) => {
            segs.querySelectorAll(".seg").forEach((g) => g.classList.toggle("on", +g.dataset.i === i));
            const s = STEPS[i];
            cinfo.innerHTML = `<span class="k">Étape 0${i + 1} / 06</span><h3>${s.t}</h3><p>${esc(s.d)}</p><a href="${s.l[0]}">→ ${esc(s.l[1])}</a>`;
        };
        segs.addEventListener("mouseover", (e) => { const g = e.target.closest(".seg"); if (g) show(+g.dataset.i); });
        segs.addEventListener("focusin", (e) => { const g = e.target.closest(".seg"); if (g) show(+g.dataset.i); });
        segs.addEventListener("click", (e) => { const g = e.target.closest(".seg"); if (g) show(+g.dataset.i); });
        show(0);
    }

    /* ---------- Cartes ---------- */
    function card(it) {
        const url = safeUrl(it.link), img = safeUrl(it.image || "");
        const color = SRC_COLOR[it.source] || "#58A6FF";
        const initials = it.source.split(/[\s-]+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
        const media = img
            ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
            : "";
        return `<article class="news">
            <div class="news-media"><div class="news-ph" style="--ph:${color}"><span><b>${esc(initials)}</b>${esc((it.themes || []).map((t) => THEMES[t]).filter(Boolean)[0] || "Actualité")}</span></div>${media}<span class="news-src">${esc(it.source)}</span></div>
            <div class="news-body">
                <div class="news-meta"><span>${dfmt.format(new Date(it.date))}</span><span>${ago(it.date)}</span>${it.lang === "en" ? '<span class="lang-badge">EN</span>' : ""}</div>
                <a class="t" href="${esc(url || "#")}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a>
                ${it.summary ? `<p>${esc(it.summary)}</p>` : ""}
                ${(it.themes || []).length ? `<ul class="tags">${it.themes.map((t) => `<li class="tag">${THEMES[t] || t}</li>`).join("")}</ul>` : ""}
            </div>
        </article>`;
    }
    function bars(el, rows) {
        const max = Math.max(1, ...rows.map((r) => r[1]));
        el.innerHTML = rows.map(([label, n]) => `<li><span title="${esc(label)}">${esc(label)}</span><span class="track" role="img" aria-label="${esc(label)} : ${n}"><i style="width:${Math.round((n / max) * 100)}%"></i></span><b>${n}</b></li>`).join("");
    }

    /* ---------- Données ---------- */
    fetch("assets/data/veille.json", { cache: "no-cache" })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then(init)
        .catch(() => {
            const msg = location.protocol === "file:" ? "Le fil s'affiche une fois le site servi par un serveur web (voir le README)." : "Le fil d'actualité est momentanément indisponible.";
            ["#feed", "#topic-cards"].forEach((s) => { const el = $(s); if (el) el.innerHTML = `<p class="muted">${msg}</p>`; });
            const h = $("#history-now"); if (h) h.textContent = "Données indisponibles pour le moment.";
        });

    function init(data) {
        const items = data.items || [];
        const vulns = items.filter((i) => (i.themes || []).includes("vulnerabilites"));
        const cves = new Set();
        items.forEach((i) => ((i.title + " " + i.summary).match(/CVE-\d{4}-\d{4,7}/gi) || []).forEach((c) => cves.add(c.toUpperCase())));
        const okSources = (data.sources || []).filter((s) => s.ok).length;

        /* Tableau de bord */
        $("#d-total").textContent = items.length;
        $("#d-vuln").textContent = vulns.length;
        $("#d-cve").textContent = cves.size;
        $("#d-src").textContent = `${okSources} / ${(data.sources || []).length || 8}`;
        $("#dash-updated").textContent = "MAJ " + ago(data.updated);
        const themeCount = Object.keys(THEMES).map((t) => [THEMES[t], items.filter((i) => (i.themes || []).includes(t)).length]).filter((r) => r[1]).sort((a, b) => b[1] - a[1]);
        bars($("#bars-theme"), themeCount);
        const srcCount = {};
        items.forEach((i) => (srcCount[i.source] = (srcCount[i.source] || 0) + 1));
        bars($("#bars-source"), Object.entries(srcCount).sort((a, b) => b[1] - a[1]));
        const prod = PRODUCTS.map(([label, re]) => [label, items.filter((i) => re.test(i.title + " " + i.summary)).length]).filter((r) => r[1]).sort((a, b) => b[1] - a[1]).slice(0, 7);
        bars($("#bars-product"), prod);

        /* Frise : point « aujourd'hui » calculé */
        const top = prod[0];
        $("#history-now").textContent = `${vulns.length} articles sur les vulnérabilités et ${cves.size} CVE citées dans le fil${top ? `, produit le plus cité : ${top[0]}` : ""}. Mis à jour ${ago(data.updated)}.`;

        /* À la une : les vulnérabilités les plus récentes, avec image en priorité */
        const featured = vulns.filter((i) => i.image).slice(0, 3);
        const rest = vulns.filter((i) => !featured.includes(i)).slice(0, 3 - featured.length);
        $("#topic-cards").innerHTML = featured.concat(rest).map(card).join("") || '<p class="muted">Aucune vulnérabilité relevée sur la période.</p>';

        /* Fil complet */
        const feed = $("#feed"), more = $("#feed-more"), bar = $("#feed-filters"), input = $("#feed-search");
        let theme = "", query = "", lang = "", limit = 12;
        const counts = {};
        items.forEach((i) => (i.themes || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
        bar.innerHTML = `<button class="filter" data-t="" aria-pressed="true">Tout<span class="count">${items.length}</span></button>` +
            Object.keys(THEMES).filter((t) => counts[t]).map((t) => `<button class="filter" data-t="${t}" aria-pressed="false">${THEMES[t]}<span class="count">${counts[t]}</span></button>`).join("") +
            `<button class="filter" data-l="fr" aria-pressed="false">FR uniquement</button>`;
        function apply() {
            const q = norm(query);
            const res = items.filter((i) => (!theme || (i.themes || []).includes(theme)) && (!lang || i.lang === lang) && (!q || norm(i.title + " " + i.summary + " " + i.source).includes(q)));
            feed.innerHTML = res.slice(0, limit).map(card).join("") || '<p class="muted">Aucun article ne correspond.</p>';
            more.hidden = res.length <= limit;
        }
        bar.addEventListener("click", (e) => {
            const b = e.target.closest(".filter");
            if (!b) return;
            if (b.dataset.l !== undefined) { lang = lang ? "" : "fr"; b.setAttribute("aria-pressed", String(!!lang)); }
            else { theme = b.dataset.t; bar.querySelectorAll("[data-t]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }
            limit = 12; apply();
        });
        input.addEventListener("input", () => { query = input.value; limit = 12; apply(); });
        more.addEventListener("click", () => { limit += 12; apply(); });
        apply();
    }
})();
