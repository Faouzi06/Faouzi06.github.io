/* ==========================================================================
   Compétences V2 (RT-01) : un voyant allumé = une preuve documentée
   ========================================================================== */
(function () {
    "use strict";
    const PROJECTS = window.PROJECTS || [];
    const SKILLS = window.SKILLS || {};
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const SLOTS = 4;

    /* Preuves hors fiches projet */
    const EXTRA = {
        alternance: ["about.html#alternance", "Alternance"],
        portfolio: ["index.html", "Ce portfolio"],
        veille: ["veille.html", "Veille"],
        parcours: ["about.html", "Parcours"]
    };
    function proof(ref) {
        if (ref.startsWith("self:")) return { self: true, label: ref.slice(5) };
        if (EXTRA[ref]) return { href: EXTRA[ref][0], label: EXTRA[ref][1] };
        const p = PROJECTS.find((x) => x.slug === ref);
        return p ? { href: "projets/" + p.slug + ".html", label: p.srv + " · " + p.title } : { self: true, label: ref };
    }

    /* Domaines → compétences → preuves */
    const DATA = [
        { id: "reseau", slot: 1, title: "Réseau", items: [
            ["VLAN et trunk 802.1Q", "Cisco IOS", ["vlanne"]],
            ["Routage inter-VLAN", "Router-on-a-Stick", ["vlanne"]],
            ["Filtrage par ACL étendues", "ACL 101 / 102", ["vlanne"]],
            ["Wi-Fi Cisco et portail captif", "Mobility Express", ["borne-wifi-cisco"]],
            ["Adressage IP et diagnostic", "plan d'adressage, ping, nmap", ["vlanne", "infra-proxmox", "borne-wifi-cisco"]],
            ["Brassage et raccordement", "baie de brassage", ["alternance"]]
        ] },
        { id: "systemes", slot: 2, title: "Systèmes", items: [
            ["Windows Server · AD DS / DNS", "contrôleur de domaine", ["infra-proxmox", "superviz"]],
            ["Linux Debian", "administration, services", ["glpi-novaservices", "securisation-debian"]],
            ["Virtualisation", "Proxmox VE, VirtualBox", ["infra-proxmox", "glpi-novaservices"]],
            ["Services web", "Apache, PHP, MariaDB", ["glpi-novaservices"]]
        ] },
        { id: "scripts", slot: 3, title: "Scripts", items: [
            ["Bash", "installation idempotente, cron", ["glpi-novaservices", "superviz", "securisation-debian"]],
            ["PowerShell", "audit AD, administration Windows", ["superviz", "infra-proxmox", "durcissement-windows"]],
            ["Python", "bases", ["self:Autoformation"]]
        ] },
        { id: "supervision", slot: 4, title: "Supervision & ITSM", items: [
            ["Supervision Zabbix / SNMPv3", "collecte chiffrée", ["superviz"]],
            ["Centralisation des journaux", "Syslog", ["superviz"]],
            ["GLPI · ticketing et inventaire", "profils, entités, recette", ["superviz", "glpi-novaservices", "alternance"]],
            ["Recette et tests d'intégration", "journal, anomalies, PV", ["glpi-novaservices", "vlanne"]],
            ["Support utilisateurs", "suivi et traitement des demandes", ["alternance", "glpi-novaservices"]]
        ] },
        { id: "securite", slot: 5, title: "Sécurité", items: [
            ["Segmentation réseau", "VLAN + ACL", ["vlanne"]],
            ["Durcissement Windows", "CIS niveau 1", ["durcissement-windows"]],
            ["Durcissement Linux", "SSH par clé, Fail2ban, UFW, AppArmor", ["securisation-debian"]],
            ["Protocoles chiffrés", "SNMPv3 authPriv, SSH", ["superviz", "securisation-debian"]],
            ["Habilitations et profils", "GLPI, comptes invités", ["glpi-novaservices", "borne-wifi-cisco"]]
        ] }
    ];

    /* ---------- Modules ---------- */
    const chassis = document.getElementById("chassis");
    const summary = document.getElementById("sk-summary");
    if (chassis) {
        chassis.innerHTML = DATA.map((d) => {
            const proven = d.items.filter((it) => it[2].some((r) => !r.startsWith("self:"))).length;
            const rows = d.items.map(([name, sub, refs]) => {
                const ps = refs.map(proof);
                const n = ps.filter((p) => !p.self).length;
                const mods = Array.from({ length: SLOTS }, (_, k) => `<i class="${k < n ? "on" : ""}"></i>`).join("");
                return `<li class="sk-row">
                    <span class="sk-name">${esc(name)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>
                    <span class="modules" role="img" aria-label="${n} preuve${n > 1 ? "s" : ""}">${mods}<b>${n ? n + " preuve" + (n > 1 ? "s" : "") : "à prouver"}</b></span>
                    <span class="sk-proofs">${ps.map((p) => p.self ? `<span class="self">${esc(p.label)}</span>` : `<a href="${p.href}">${esc(p.label)}</a>`).join("")}</span>
                </li>`;
            }).join("");
            return `<section class="chassis" id="dom-${d.id}" aria-labelledby="h-${d.id}">
                <div class="chassis-head"><h3 id="h-${d.id}"><span>SLOT ${d.slot}</span>${esc(d.title)}</h3><span class="meta">${proven} / ${d.items.length} prouvées <span class="status-led" aria-hidden="true"></span></span></div>
                <ul class="sk-rows">${rows}</ul>
            </section>`;
        }).join("");
        summary.innerHTML = DATA.map((d) => {
            const proven = d.items.filter((it) => it[2].some((r) => !r.startsWith("self:"))).length;
            const proofs = new Set(d.items.flatMap((it) => it[2].filter((r) => !r.startsWith("self:"))));
            return `<a href="#dom-${d.id}">Slot ${d.slot} · ${esc(d.title)}<b>${proofs.size} preuve${proofs.size > 1 ? "s" : ""}</b><span class="gauge" role="img" aria-label="${proven} compétences prouvées sur ${d.items.length}"><i style="width:${Math.round(proven / d.items.length * 100)}%"></i></span></a>`;
        }).join("");
    }

    /* ---------- Table de routage du référentiel ---------- */
    const DESC = {
        "B1.1": "Recenser les ressources, exploiter des référentiels et normes, gérer les habilitations, la continuité de service et les sauvegardes.",
        "B1.2": "Collecter, suivre et orienter les demandes ; traiter les demandes sur les services réseau, système et applicatifs.",
        "B1.3": "Valoriser l'image sur les médias numériques, référencer les services en ligne, faire évoluer un site web.",
        "B1.4": "Analyser les objectifs, planifier les activités, suivre les indicateurs et les écarts.",
        "B1.5": "Réaliser les tests d'intégration et d'acceptation, déployer un service, accompagner les utilisateurs.",
        "B1.6": "Environnement d'apprentissage, veille informationnelle, identité et projet professionnels."
    };
    const EXTRA_ROUTES = { "B1.1": ["alternance"], "B1.2": ["alternance"], "B1.3": ["portfolio"], "B1.5": ["alternance"], "B1.6": ["veille", "portfolio", "parcours"] };
    const tbody = document.querySelector("#route-table tbody");
    if (tbody) {
        tbody.innerHTML = Object.keys(SKILLS).map((code) => {
            const refs = PROJECTS.filter((p) => (p.skills || []).includes(code)).map((p) => p.slug).concat(EXTRA_ROUTES[code] || []);
            const via = refs.map(proof).map((p) => `<a href="${p.href}">${esc(p.label)}</a>`).join("");
            return `<tr><td class="code-c">${code}</td><td class="name-c">${esc(SKILLS[code])}<small>${esc(DESC[code] || "")}</small></td><td class="via-c"><span class="via">${via}</span></td><td class="metric">[${refs.length}]</td></tr>`;
        }).join("");
    }

    /* ---------- Langues (niveaux CECRL du CV) ---------- */
    const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const LANGS = [["Français", "C2"], ["Anglais", "B2"], ["Italien", "B2"], ["Arabe", "B2"], ["Espagnol", "A2"]];
    const cefr = document.getElementById("cefr");
    if (cefr) {
        cefr.innerHTML = LANGS.map(([l, lv]) => {
            const n = LEVELS.indexOf(lv) + 1;
            return `<li><span>${l}</span><span class="scale" role="img" aria-label="${l} : niveau ${lv}">${LEVELS.map((x, k) => `<i class="${k < n ? "on" : ""}" data-l="${x}"></i>`).join("")}</span><b>${lv}</b></li>`;
        }).join("");
    }
})();
