/* ==========================================================================
   Fiches projets : coloration syntaxique légère, copie du code, sommaire actif
   Langages : ios (Cisco), bash, powershell, sql, text
   ========================================================================== */
(function () {
    "use strict";

    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

    // Chaque règle : [classe CSS, motif]. L'ordre compte (le premier qui correspond gagne).
    const RULES = {
        ios: [
            ["c", /![^\n]*/],
            ["p", /^[\w-]+(?:\([\w-]+\))?[#>]/m],
            ["n", /\b\d{1,3}(?:\.\d{1,3}){3}\b|\b\d+(?:\/\d+)*(?:\.\d+)?\b/],
            ["k", /\b(?:access-list|access-group|snmp-server|interface|switchport|mode|access|trunk|allowed|vlan|nonegotiate|name|encapsulation|dot1Q|ip|address|no|shutdown|deny|permit|any|host|in|out|group|user|v3|priv|auth|sha|aes|logging|trap|warnings|enable|configure|terminal)\b(?!-)/]
        ],
        bash: [
            ["c", /#[^\n]*/],
            ["s", /"(?:\\.|[^"\\])*"|'[^']*'/],
            ["v", /\$\{?[\w@#?]+\}?|\$\(/],
            ["k", /\b(?:if|then|else|elif|fi|for|in|do|done|while|case|esac|function|return|exit|set|exec|trap|export|local|echo|printf|cd|cat|grep|sed|tee|ping|apt-get|systemctl|mariadb|runuser|chown|chmod|tar|a2enmod|a2ensite|a2dissite|php|openssl|ufw|ssh|ssh-keygen|ssh-copy-id|fail2ban-client|aa-status|ss|sudo|nmap)\b/],
            ["n", /\b\d+(?:\.\d+)*\b/]
        ],
        powershell: [
            ["c", /#[^\n]*/],
            ["s", /"(?:`.|[^"`])*"|'[^']*'/],
            ["v", /\$[\w:]+/],
            ["k", /\b[A-Z][a-z]+-[A-Z][\w]+\b|\b(?:if|else|elseif|foreach|in|return|function)\b/],
            ["a", /\s-[A-Za-z][\w]*/],
            ["n", /\b\d+(?:\.\d+)*\b/]
        ],
        cmd: [
            ["c", /(?:^|\n)\s*(?:REM|::)[^\n]*/],
            ["p", /^[A-Z]:\\[^>\n]*>/m],
            ["a", /\s\/[\w:]+/],
            ["k", /\b(?:net|accounts|gpresult|ipconfig|dcdiag|nslookup)\b/],
            ["n", /\b\d+\b/]
        ]
    };
    const CLS = { c: "tk-c", s: "tk-s", v: "tk-v", k: "tk-k", n: "tk-n", p: "tk-p", a: "tk-v" };

    function highlight(src, lang) {
        const rules = RULES[lang];
        if (!rules) return esc(src);
        const big = new RegExp(rules.map(([, re]) => "(" + re.source + ")").join("|"), "gm");
        let out = "", last = 0, m;
        while ((m = big.exec(src))) {
            if (m[0] === "") { big.lastIndex++; continue; }
            const g = m.slice(1).findIndex((x) => x !== undefined);
            out += esc(src.slice(last, m.index));
            const text = m[0];
            // Pour les paramètres PowerShell (« -Name »), garder l'espace hors du span
            const lead = rules[g][0] === "a" ? text.match(/^\s*/)[0] : "";
            out += esc(lead) + `<span class="${CLS[rules[g][0]]}">${esc(text.slice(lead.length))}</span>`;
            last = m.index + text.length;
        }
        return out + esc(src.slice(last));
    }

    document.querySelectorAll(".code").forEach((box) => {
        const code = box.querySelector("code");
        if (!code) return;
        const raw = code.textContent.replace(/^\n/, "").replace(/\s+$/, "");
        code.innerHTML = highlight(raw, code.dataset.lang);
        const btn = box.querySelector(".code-copy");
        if (btn) btn.addEventListener("click", async () => {
            try { await navigator.clipboard.writeText(raw); btn.textContent = "Copié ✓"; }
            catch (e) { btn.textContent = "Échec"; }
            setTimeout(() => (btn.textContent = "Copier"), 1600);
        });
    });

    // Sommaire : section active au défilement
    const links = Array.from(document.querySelectorAll(".toc a"));
    if (links.length && "IntersectionObserver" in window) {
        const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    links.forEach((a) => a.classList.remove("on"));
                    const a = map.get(e.target.id);
                    if (a) a.classList.add("on");
                }
            });
        }, { rootMargin: "-20% 0px -70% 0px" });
        map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    }
})();


/* ==========================================================================
   V2 · Façade serveur, galerie lightbox, schémas interactifs
   ========================================================================== */
(function () {
    "use strict";
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- 1. Façade du serveur (en-tête de fiche) ---------- */
    const slug = (location.pathname.split("/").pop() || "").replace(/\.html$/, "");
    const p = (window.PROJECTS || []).find((x) => x.slug === slug);
    const meta = $(".case-meta");
    if (p && meta) {
        const SKILLS = window.SKILLS || {};
        const warn = /cours/i.test(p.status || "");
        const fp = document.createElement("div");
        fp.className = "faceplate";
        fp.innerHTML = `
            <div class="fp-id"><b>${esc(p.srv || "")}</b><span>${esc(p.u || "")} · 2U · rack-01</span>
                <span class="state"><span class="status-led${warn ? " warn" : ""}" aria-hidden="true"></span>${esc(p.status || "")}</span></div>
            <div class="fp-badges">
                <div><span class="k">Technologies</span>${(p.stack || p.tags).map((t) => `<a class="tag" href="../projects.html?tech=${encodeURIComponent(t)}" title="Autres projets avec ${esc(t)}">${esc(t)}</a>`).join("")}</div>
                <div><span class="k">Référentiel</span>${(p.skills || []).map((s) => `<a class="skill-badge" href="../projects.html?skill=${s}" title="${esc(SKILLS[s] || "")}">${s} · ${esc(SKILLS[s] || "")}</a>`).join("")}</div>
            </div>`;
        meta.after(fp);
    }

    /* ---------- 2. Galerie : lightbox avec zoom ---------- */
    const links = $$(".fig a");
    if (links.length) {
        const lb = document.createElement("div");
        lb.className = "lightbox";
        lb.setAttribute("role", "dialog");
        lb.setAttribute("aria-modal", "true");
        lb.setAttribute("aria-label", "Galerie de captures");
        lb.innerHTML = `
            <div class="lb-bar"><span class="lb-count"></span>
                <div class="lb-tools">
                    <button type="button" data-a="out" aria-label="Dézoomer">−</button>
                    <button type="button" data-a="reset" aria-label="Taille d'origine">1:1</button>
                    <button type="button" data-a="in" aria-label="Zoomer">+</button>
                    <button type="button" data-a="close" aria-label="Fermer la galerie">✕</button>
                </div></div>
            <div class="lb-stage"><img alt=""><button type="button" class="lb-prev" aria-label="Image précédente">‹</button><button type="button" class="lb-next" aria-label="Image suivante">›</button></div>
            <div class="lb-caption"></div>`;
        document.body.appendChild(lb);
        const img = $("img", lb), stage = $(".lb-stage", lb), cap = $(".lb-caption", lb), counter = $(".lb-count", lb);
        let i = 0, scale = 1, tx = 0, ty = 0, last = null;
        const single = links.length < 2;
        $(".lb-prev", lb).hidden = $(".lb-next", lb).hidden = single;

        function render() { img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; }
        function zoom(f) { scale = Math.min(5, Math.max(1, scale * f)); if (scale === 1) { tx = ty = 0; } render(); }
        function show(n) {
            i = (n + links.length) % links.length;
            const a = links[i], im = $("img", a), fc = a.closest("figure") ? $("figcaption", a.closest("figure")) : null;
            img.src = a.getAttribute("href");
            img.alt = im ? im.alt : "";
            const fb = fc ? $("b", fc) : null;
            cap.textContent = fc ? (fb ? fb.textContent.trim() + " · " + fc.textContent.replace(fb.textContent, "").trim() : fc.textContent.trim()) : img.alt;
            counter.textContent = `${i + 1} / ${links.length}`;
            scale = 1; tx = ty = 0; render();
        }
        function open(n) { last = document.activeElement; show(n); lb.classList.add("on"); document.documentElement.style.overflow = "hidden"; $('[data-a="close"]', lb).focus(); }
        function close() { lb.classList.remove("on"); document.documentElement.style.overflow = ""; if (last) last.focus(); }

        links.forEach((a, n) => a.addEventListener("click", (e) => { e.preventDefault(); open(n); }));
        lb.addEventListener("click", (e) => {
            const b = e.target.closest("button");
            if (!b) { if (e.target === stage) close(); return; }
            if (b.dataset.a === "in") zoom(1.4);
            else if (b.dataset.a === "out") zoom(1 / 1.4);
            else if (b.dataset.a === "reset") { scale = 1; tx = ty = 0; render(); }
            else if (b.dataset.a === "close") close();
            else if (b.classList.contains("lb-prev")) show(i - 1);
            else if (b.classList.contains("lb-next")) show(i + 1);
        });
        img.addEventListener("dblclick", () => { if (scale > 1) { scale = 1; tx = ty = 0; render(); } else zoom(2.2); });
        stage.addEventListener("wheel", (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
        let drag = null;
        stage.addEventListener("pointerdown", (e) => { if (scale === 1 || e.target !== img) return; drag = { x: e.clientX - tx, y: e.clientY - ty }; stage.classList.add("dragging"); stage.setPointerCapture(e.pointerId); });
        stage.addEventListener("pointermove", (e) => { if (!drag) return; tx = e.clientX - drag.x; ty = e.clientY - drag.y; render(); });
        stage.addEventListener("pointerup", () => { drag = null; stage.classList.remove("dragging"); });
        document.addEventListener("keydown", (e) => {
            if (!lb.classList.contains("on")) return;
            if (e.key === "Escape") close();
            else if (e.key === "ArrowRight" && !single) show(i + 1);
            else if (e.key === "ArrowLeft" && !single) show(i - 1);
            else if (e.key === "+" || e.key === "=") zoom(1.4);
            else if (e.key === "-") zoom(1 / 1.4);
            else if (e.key === "Tab") {
                const f = $$("button:not([hidden])", lb);
                const k = f.indexOf(document.activeElement);
                if (e.shiftKey && k <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && k === f.length - 1) { e.preventDefault(); f[0].focus(); }
            }
        });
    }

    /* ---------- 3. Schémas interactifs ---------- */
    $$(".diagram").forEach((dg) => {
        let data = {};
        try { data = JSON.parse($("script.dg-data", dg).textContent); } catch (e) { return; }
        const info = $(".dg-info", dg);
        const nodes = $$(".dg-node", dg), lines = $$(".dg-link", dg);
        function fill(d) {
            info.innerHTML = `<span class="k">${esc(d.k || "")}</span><h4>${esc(d.title || "")}</h4><p>${esc(d.text || "")}</p>` +
                (d.facts ? `<dl>${d.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : "");
        }
        function focus(node) {
            const id = node.dataset.id;
            dg.classList.add("focus");
            nodes.forEach((n) => n.classList.remove("on", "rel"));
            node.classList.add("on");
            lines.forEach((l) => {
                const hit = l.dataset.a === id || l.dataset.b === id;
                l.classList.toggle("hl", hit);
                if (hit) { const other = l.dataset.a === id ? l.dataset.b : l.dataset.a; const o = $(`.dg-node[data-id="${other}"]`, dg); if (o) o.classList.add("rel"); }
            });
            if (data[id]) fill(data[id]);
        }
        function reset() { dg.classList.remove("focus"); nodes.forEach((n) => n.classList.remove("on", "rel")); lines.forEach((l) => l.classList.remove("hl")); if (data._default) fill(data._default); }
        nodes.forEach((n) => {
            n.setAttribute("tabindex", "0");
            n.setAttribute("role", "button");
            if (data[n.dataset.id]) n.setAttribute("aria-label", data[n.dataset.id].title);
            n.addEventListener("mouseenter", () => focus(n));
            n.addEventListener("focus", () => focus(n));
            n.addEventListener("click", () => focus(n));
        });
        $(".dg-body svg", dg).addEventListener("mouseleave", reset);
        dg.addEventListener("focusout", (e) => { if (!dg.contains(e.relatedTarget)) reset(); });
        reset();
    });
})();
