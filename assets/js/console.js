/* ==========================================================================
   Console RACK-01 : mini CLI façon Cisco IOS
   - abréviations (sh proj), historique (↑ ↓), complétion (Tab)
   ========================================================================== */
(function () {
    "use strict";
    const out = document.getElementById("cli-out");
    const form = document.getElementById("cli-form");
    const input = document.getElementById("cli-input");
    if (!out || !form || !input) return;

    const BASE = document.body.dataset.base || "";
    const PROJECTS = window.PROJECTS || [];
    const DOMAINS = window.DOMAINS || {};
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const pad = (n) => String(n).padStart(2, "0");
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const PROMPT = "rack-01#";

    const PAGES = {
        accueil: ["index.html", "Accueil"], projets: ["projects.html", "Projets"], competences: ["competences.html", "Compétences"],
        e5: ["e5.html", "Tableau E5"], veille: ["veille.html", "Veille"], parcours: ["about.html", "Parcours"], contact: ["contact.html", "Contact"], cv: ["assets/docs/CV-Ahmed-Faouzi-BTS-SIO-SISR.pdf", "CV (PDF)"]
    };
    const link = (href, label) => `<a href="${BASE + href}">${esc(label)}</a>`;

    function print(html, cls) {
        const div = document.createElement("div");
        if (cls) div.className = cls;
        div.innerHTML = html;
        out.appendChild(div);
        out.scrollTop = out.scrollHeight;
    }
    function go(href, label) {
        print(`<span class="m">Connexion à ${esc(label)}…</span>`);
        setTimeout(() => { location.href = BASE + href; }, 350);
    }
    function findProject(arg) {
        if (!arg) return null;
        const n = parseInt(arg, 10);
        if (!isNaN(n) && PROJECTS[n - 1]) return PROJECTS[n - 1];
        const a = norm(arg);
        return PROJECTS.find((p) => norm(p.slug).includes(a) || norm(p.title).includes(a)) || null;
    }

    /* Table des commandes : mots-clés (abréviables) + action */
    const COMMANDS = [
        { words: ["help"], desc: "liste des commandes", run: () => {
            const rows = COMMANDS.filter((c) => c.desc).map((c) => `<span class="ok">${esc(c.words.join(" ") + (c.arg ? " " + c.arg : ""))}</span> <span class="m">· ${esc(c.desc)}</span>`);
            print(rows.join("<br>"));
            print('<span class="m">Abréviations acceptées (ex. <b>sh proj</b>), ↑ ↓ pour l\'historique, Tab pour compléter.</span>');
        } },
        { words: ["show", "projects"], desc: "projets en service", run: () => {
            print(PROJECTS.map((p, i) => `${pad(i + 1)}  ${link("projets/" + p.slug + ".html", p.title)} <span class="m">· ${esc(DOMAINS[p.domain] || "")}</span>`).join("<br>"));
            print('<span class="m">Ouvrir : <b>open 1</b> ou <b>open vlanne</b></span>');
        } },
        { words: ["show", "project"], arg: "<n>", desc: "détail d'un projet", run: (args) => {
            const p = findProject(args[0]);
            if (!p) return print('<span class="w">% Projet introuvable. Essayez <b>show projects</b>.</span>');
            print(`<b>${esc(p.title)}</b> <span class="m">· ${esc(p.subtitle)}</span><br>${esc(p.impact)}<br><span class="m">Rôle :</span> ${esc(p.role || "—")}<br><span class="m">Technos :</span> ${esc(p.tags.join(", "))}<br>${link("projets/" + p.slug + ".html", "→ ouvrir la fiche")}`);
        } },
        { words: ["show", "skills"], desc: "compétences du bloc 1", run: () => {
            print(["B1.1 Gérer le patrimoine informatique", "B1.2 Répondre aux incidents et aux demandes", "B1.3 Développer la présence en ligne", "B1.4 Travailler en mode projet", "B1.5 Mettre à disposition un service", "B1.6 Organiser son développement professionnel"].map((s) => `<span class="ok">●</span> ${esc(s)}`).join("<br>") + "<br>" + link("competences.html", "→ voir les compétences"));
        } },
        { words: ["show", "e5"], desc: "tableau de synthèse", run: () => print(`11 réalisations · 6 compétences · formats web, PDF, Excel<br>${link("e5.html", "→ ouvrir le tableau E5")}`) },
        { words: ["show", "veille"], desc: "veille technologique", run: () => {
            fetch(BASE + "assets/data/veille.json", { cache: "no-cache" }).then((r) => r.json()).then((d) => {
                const items = (d.items || []).slice(0, 3);
                print(`${(d.items || []).length} articles · 8 sources<br>` + items.map((i) => `<span class="m">${esc(i.source)} ·</span> ${esc(i.title)}`).join("<br>") + "<br>" + link("veille.html", "→ ouvrir la veille"));
            }).catch(() => print(`Veille automatisée · 8 sources<br>${link("veille.html", "→ ouvrir la veille")}`));
        } },
        { words: ["show", "inventory"], desc: "inventaire de la baie", run: () => {
            print("PP-01 brassage · SW-01 projets · SRV-01→07 projets<br>FW-01 veille · RT-01 compétences · NAS-01 E5<br>KVM-01 contact · UPS-01 parcours<br><span class=\"m\">14 équipements · 23U / 42U</span>");
        } },
        { words: ["whoami"], desc: "qui suis-je", run: () => {
            print(`<b>Ahmed Faouzi</b> · alternant BTS SIO option SISR (2e année)<br>Support informatique · La Compagnie de Formation, depuis le 18/08/2025<br>Réseau · systèmes · supervision · cybersécurité · Montpellier<br>${link("about.html", "→ parcours complet")}`);
        } },
        { words: ["contact"], desc: "coordonnées", run: () => {
            print(`<a href="mailto:ahmedfaouzi55@gmail.com">ahmedfaouzi55@gmail.com</a> · <a href="tel:+33749027565">07 49 02 75 65</a><br>${link("contact.html", "→ page contact")} · ${link(PAGES.cv[0], "CV (PDF)")}`);
        } },
        { words: ["uptime"], desc: "durée de l'alternance", run: () => {
            const days = Math.floor((Date.now() - new Date("2025-08-18")) / 86400000);
            print(`rack-01 uptime is ${days} days <span class="m">(alternance depuis le 18/08/2025)</span>`);
        } },
        { words: ["ping"], arg: "<cible>", desc: "test de connectivité", run: (args) => {
            const t = args[0] || "rack-01";
            print(`Sending 5, 100-byte ICMP Echos to ${esc(t)}, timeout is 2 seconds:<br><span class="ok">!!!!!</span><br>Success rate is 100 percent (5/5)`);
        } },
        { words: ["open"], arg: "<n|page>", desc: "ouvrir un projet ou une page", run: (args) => {
            const a = norm(args.join(" "));
            const page = Object.keys(PAGES).find((k) => k.startsWith(a) && a);
            if (page) return go(PAGES[page][0], PAGES[page][1]);
            const p = findProject(args[0]);
            if (p) return go("projets/" + p.slug + ".html", p.title);
            print('<span class="w">% Cible inconnue. Pages : ' + Object.keys(PAGES).join(", ") + "</span>");
        } },
        { words: ["clear"], desc: "effacer l'écran", run: () => { out.innerHTML = ""; } },
        { words: ["exit"], run: () => print('<span class="m">Session conservée : la baie ne s\'éteint jamais.</span>') },
        { words: ["enable"], run: () => print('<span class="m">Déjà en mode privilégié.</span>') }
    ];
    const ALIASES = { "ls": "show projects", "cd": "open", "goto": "open", "projets": "show projects", "skills": "show skills" };

    function match(tokens) {
        // Choisit la commande dont chaque mot commence par le jeton saisi (style IOS)
        // Score : plus de mots reconnus > mots exacts > commande à argument si des arguments suivent
        let best = null, bestScore = -1;
        COMMANDS.forEach((c) => {
            if (tokens.length < c.words.length) return;
            if (!c.words.every((w, i) => w.startsWith(tokens[i]))) return;
            const exact = c.words.filter((w, i) => w === tokens[i]).length;
            const hasArgs = tokens.length > c.words.length;
            const score = c.words.length * 100 + exact * 10 + (hasArgs === !!c.arg ? 5 : 0);
            if (score > bestScore) { best = c; bestScore = score; }
        });
        return best;
    }

    const history = [];
    let hIndex = -1;

    function exec(raw) {
        const line = raw.trim();
        print(`<span class="p">${PROMPT}</span> ${esc(line)}`);
        if (!line) return;
        history.unshift(line); hIndex = -1;
        let tokens = norm(line).split(/\s+/);
        if (ALIASES[tokens[0]]) tokens = ALIASES[tokens[0]].split(" ").concat(tokens.slice(1));
        const cmd = match(tokens);
        if (!cmd) {
            print('<span class="w">% Invalid input detected. Tapez <b>help</b>.</span>');
            return;
        }
        cmd.run(tokens.slice(cmd.words.length));
    }

    form.addEventListener("submit", (e) => { e.preventDefault(); exec(input.value); input.value = ""; });
    input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp" && history.length) {
            e.preventDefault(); hIndex = Math.min(hIndex + 1, history.length - 1); input.value = history[hIndex];
        } else if (e.key === "ArrowDown") {
            e.preventDefault(); hIndex = Math.max(hIndex - 1, -1); input.value = hIndex >= 0 ? history[hIndex] : "";
        } else if (e.key === "Tab" && input.value.trim()) {
            const v = norm(input.value).replace(/\s+/g, " ").trimStart();
            const all = COMMANDS.filter((c) => c.desc).map((c) => c.words.join(" "));
            const hits = all.filter((c) => c.startsWith(v));
            if (hits.length) { e.preventDefault(); input.value = hits.length === 1 ? hits[0] + " " : hits.reduce((a, b) => { let i = 0; while (a[i] && a[i] === b[i]) i++; return a.slice(0, i); }); }
            if (hits.length > 1) print(`<span class="m">${hits.map(esc).join(" · ")}</span>`);
        }
    });
    document.querySelectorAll("[data-cmd]").forEach((b) => b.addEventListener("click", () => { exec(b.dataset.cmd); input.focus({ preventScroll: true }); }));
})();
