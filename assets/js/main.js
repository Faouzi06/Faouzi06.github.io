/* ==========================================================================
   Portfolio — interactions
   Trois mécaniques : palette Ctrl+K · aperçu au survol · tiroir de projet
   ========================================================================== */
(function () {
    "use strict";

    const BASE = document.body.dataset.base || "";          // "" à la racine, "../" dans /projets
    const EMAIL = "ahmedfaouzi55@gmail.com";
    const PROJECTS = window.PROJECTS || [];
    const DOMAINS = window.DOMAINS || {};
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const pad = (n) => String(n).padStart(2, "0");
    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
    };

    /* ---------- Thème clair / sombre ---------- */
    const savedTheme = store.get("theme");
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;
    function toggleTheme() {
        const dark = document.documentElement.dataset.theme
            ? document.documentElement.dataset.theme === "dark"
            : matchMedia("(prefers-color-scheme: dark)").matches;
        const next = dark ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        store.set("theme", next);
    }
    $$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", toggleTheme));

    /* ---------- Toast ---------- */
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
    let toastTimer;
    function notify(msg) {
        toast.textContent = msg;
        toast.classList.add("on");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("on"), 1800);
    }

    /* ---------- Copier l'e-mail ---------- */
    async function copyEmail() {
        try { await navigator.clipboard.writeText(EMAIL); }
        catch (e) {
            const t = document.createElement("textarea");
            t.value = EMAIL; document.body.appendChild(t); t.select();
            try { document.execCommand("copy"); } catch (err) { /* ignore */ }
            t.remove();
        }
        notify("Adresse copiée ✓");
        return true;
    }
    $$("[data-copy-email]").forEach((btn) => {
        const hint = $(".copy-hint", btn);
        btn.addEventListener("click", async () => {
            await copyEmail();
            btn.classList.add("copied");
            if (hint) hint.textContent = "Copié ✓";
            setTimeout(() => { btn.classList.remove("copied"); if (hint) hint.textContent = "Cliquer pour copier"; }, 2000);
        });
    });

    /* ---------- En-tête & menu mobile ---------- */
    const header = $(".site-header");
    const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const menuBtn = $(".menu-btn");
    const navLinks = $(".nav-links");
    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", () => {
            const open = navLinks.classList.toggle("open");
            menuBtn.setAttribute("aria-expanded", open);
        });
    }

    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    /* ---------- Rendu des listes de projets ---------- */
    function rowHTML(p) {
        const i = PROJECTS.indexOf(p) + 1;
        return `<li>
            <button class="project-row" type="button" data-slug="${p.slug}" data-domain="${p.domain}" aria-haspopup="dialog">
                <span class="p-index">${pad(i)}</span>
                <span class="p-title">${esc(p.title)}<small>${esc(p.subtitle)}</small></span>
                <span class="p-impact">${esc(p.impact)}</span>
                <ul class="tags">${p.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>
                <span class="p-year">${/en cours/i.test(p.period) ? "En cours" : (p.period.match(/\d{4}/) || [p.period])[0]}</span>
            </button>
        </li>`;
    }
    $$("[data-project-list]").forEach((list) => {
        const mode = list.dataset.projectList;              // "featured" ou "all"
        const items = mode === "featured" ? PROJECTS.filter((p) => p.featured) : PROJECTS;
        list.innerHTML = items.map(rowHTML).join("");
    });

    /* ---------- Filtres par domaine (page Projets) ---------- */
    const filterBar = $("[data-filters]");
    function applyFilter(domain) {
        $$(".project-row").forEach((r) => {
            r.closest("li").style.display = !domain || r.dataset.domain === domain ? "" : "none";
        });
        $$(".filter").forEach((f) => f.setAttribute("aria-pressed", String((f.dataset.domain || "") === (domain || ""))));
        const url = new URL(location.href);
        if (domain) url.searchParams.set("d", domain); else url.searchParams.delete("d");
        history.replaceState(null, "", url);
    }
    if (filterBar) {
        const counts = PROJECTS.reduce((a, p) => ((a[p.domain] = (a[p.domain] || 0) + 1), a), {});
        filterBar.innerHTML =
            `<button class="filter" data-domain="" aria-pressed="true">Tous<span class="count">${PROJECTS.length}</span></button>` +
            Object.keys(DOMAINS).filter((d) => counts[d]).map((d) =>
                `<button class="filter" data-domain="${d}" aria-pressed="false">${DOMAINS[d]}<span class="count">${counts[d]}</span></button>`).join("");
        filterBar.addEventListener("click", (e) => {
            const b = e.target.closest(".filter");
            if (b) applyFilter(b.dataset.domain);
        });
        const initial = new URL(location.href).searchParams.get("d");
        if (initial && DOMAINS[initial]) applyFilter(initial);
    }

    /* ---------- Mécanique 2 : aperçu flottant avec inertie ---------- */
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (finePointer && $(".project-row")) {
        const pv = document.createElement("div");
        pv.className = "preview";
        pv.setAttribute("aria-hidden", "true");
        document.body.appendChild(pv);
        let tx = 0, ty = 0, x = 0, y = 0, raf = null, active = false;
        const W = 340, H = 212;

        function loop() {
            const k = reduced ? 1 : 0.14;                     // facteur d'inertie
            x += (tx - x) * k; y += (ty - y) * k;
            pv.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${active ? 1 : 0.92})`;
            if (active || Math.abs(tx - x) > 0.5) raf = requestAnimationFrame(loop); else raf = null;
        }
        function target(e) {
            const offX = e.clientX + 28 + W > innerWidth ? -W - 28 : 28;
            tx = e.clientX + offX;
            ty = Math.min(Math.max(e.clientY - H / 2, 12), innerHeight - H - 12);
        }
        document.addEventListener("pointerover", (e) => {
            const row = e.target.closest(".project-row");
            if (!row) return;
            const p = PROJECTS.find((q) => q.slug === row.dataset.slug);
            if (!p) return;
            pv.innerHTML = p.preview
                ? `<img src="${BASE + p.preview}" alt="">`
                : `<div class="preview-fallback"><span><b>${pad(PROJECTS.indexOf(p) + 1)}</b>${esc(p.tags.join(" · "))}</span></div>`;
            if (!active) { target(e); x = tx; y = ty; }
            active = true;
            pv.classList.add("on");
            if (!raf) raf = requestAnimationFrame(loop);
        });
        document.addEventListener("pointermove", (e) => { if (active) target(e); });
        document.addEventListener("pointerout", (e) => {
            const row = e.target.closest(".project-row");
            if (row && !row.contains(e.relatedTarget)) { active = false; pv.classList.remove("on"); }
        });
        addEventListener("scroll", () => { if (active) { active = false; pv.classList.remove("on"); } }, { passive: true });
    }

    /* ---------- Mécanique 3 : tiroir de projet ---------- */
    let drawer, scrim, lastFocus;
    function buildDrawer() {
        scrim = document.createElement("div");
        scrim.className = "scrim";
        drawer = document.createElement("aside");
        drawer.className = "drawer";
        drawer.setAttribute("role", "dialog");
        drawer.setAttribute("aria-modal", "true");
        drawer.setAttribute("aria-labelledby", "drawer-title");
        document.body.append(scrim, drawer);
        scrim.addEventListener("click", closeDrawer);
        drawer.addEventListener("keydown", (e) => {
            if (e.key !== "Tab") return;
            const f = $$("a, button", drawer).filter((el) => el.offsetParent !== null);
            if (!f.length) return;
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        });
    }
    function openDrawer(slug) {
        const p = PROJECTS.find((q) => q.slug === slug);
        if (!p) return;
        if (!drawer) buildDrawer();
        const pv = $(".preview");
        if (pv) pv.classList.remove("on");
        const i = PROJECTS.indexOf(p);
        const next = PROJECTS[(i + 1) % PROJECTS.length];
        drawer.innerHTML = `
            <div class="drawer-head">
                <span class="mono muted">${pad(i + 1)} / ${pad(PROJECTS.length)} · ${esc(DOMAINS[p.domain] || "")}</span>
                <button class="icon-btn" data-close aria-label="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
            </div>
            <div class="drawer-body">
                <span class="mono muted">${esc(p.subtitle)}</span>
                <h2 id="drawer-title">${esc(p.title)}</h2>
                <p class="lead">${esc(p.lead)}</p>
                ${p.preview ? `<figure class="drawer-figure"><img src="${BASE + p.preview}" alt="Aperçu du projet ${esc(p.title)}"></figure>` : ""}
                <dl class="drawer-meta">
                    <div><dt>Période</dt><dd>${esc(p.period)}</dd></div>
                    <div><dt>Cadre</dt><dd>${esc(p.context)}</dd></div>
                    ${p.role ? `<div><dt>Mon rôle</dt><dd>${esc(p.role)}</dd></div>` : ""}
                </dl>
                <h3>Ce qui a été réalisé</h3>
                <ul class="points">${p.points.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
                <h3>Environnement</h3>
                <ul class="tags">${p.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>
            </div>
            <div class="drawer-foot">
                <button class="link-arrow" data-next="${next.slug}">Suivant : ${esc(next.title)} →</button>
                <a class="btn btn-primary" href="${BASE}projets/${p.slug}.html">Fiche complète
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
            </div>`;
        $("[data-close]", drawer).addEventListener("click", closeDrawer);
        $("[data-next]", drawer).addEventListener("click", (e) => openDrawer(e.currentTarget.dataset.next));
        if (!drawer.classList.contains("on")) lastFocus = document.activeElement;
        document.documentElement.style.overflow = "hidden";
        requestAnimationFrame(() => { drawer.classList.add("on"); scrim.classList.add("on"); });
        $("[data-close]", drawer).focus({ preventScroll: true });
        $(".drawer-body", drawer).scrollTop = 0;
    }
    function closeDrawer() {
        if (!drawer || !drawer.classList.contains("on")) return;
        drawer.classList.remove("on");
        scrim.classList.remove("on");
        document.documentElement.style.overflow = "";
        if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    document.addEventListener("click", (e) => {
        const row = e.target.closest(".project-row");
        if (row) openDrawer(row.dataset.slug);
    });

    /* ---------- Mécanique 1 : palette de commandes ---------- */
    const PAGES = [
        ["Accueil", "index.html"], ["Projets", "projects.html"], ["Compétences", "competences.html"],
        ["Tableau de synthèse E5", "e5.html"], ["Veille technologique", "veille.html"],
        ["Parcours & CV", "about.html"], ["Contact", "contact.html"]
    ];
    function commands() {
        const onProjects = !!$("[data-filters]");
        return [
            ...PAGES.map(([label, href]) => ({ group: "Navigation", label, hint: "Page", run: () => (location.href = BASE + href) })),
            ...PROJECTS.map((p, i) => ({
                group: "Projets", label: `${pad(i + 1)}  ${p.title}`, keywords: [p.tags.join(" "), p.impact, p.subtitle, DOMAINS[p.domain]].join(" "), hint: "Aperçu",
                run: () => ($(".project-row") ? openDrawer(p.slug) : (location.href = `${BASE}projets/${p.slug}.html`))
            })),
            ...Object.entries(DOMAINS).map(([d, label]) => ({
                group: "Filtrer", label: `Projets : ${label}`, hint: "Filtre",
                run: () => (onProjects ? applyFilter(d) : (location.href = `${BASE}projects.html?d=${d}`))
            })),
            { group: "Actions", label: "Copier mon adresse e-mail", hint: EMAIL, run: copyEmail },
            { group: "Actions", label: "Ouvrir le CV (PDF)", hint: "PDF", run: () => window.open(BASE + "assets/docs/CV-Ahmed-Faouzi-BTS-SIO-SISR.pdf", "_blank", "noopener") },
            { group: "Actions", label: "Basculer thème clair / sombre", hint: "Thème", run: toggleTheme }
        ];
    }
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    let pal, palInput, palList, results = [], sel = 0;

    function buildPalette() {
        pal = document.createElement("div");
        pal.className = "palette-wrap";
        pal.innerHTML = `
            <div class="palette" role="dialog" aria-modal="true" aria-label="Palette de commandes">
                <div class="palette-input">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                    <input type="text" placeholder="Aller à une page, un projet, une technologie…" aria-label="Rechercher une commande"
                        role="combobox" aria-expanded="true" aria-controls="palette-list" autocomplete="off" spellcheck="false">
                    <kbd>Échap</kbd>
                </div>
                <ul class="palette-list" id="palette-list" role="listbox"></ul>
                <div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> naviguer</span><span><kbd>↵</kbd> ouvrir</span></div>
            </div>`;
        document.body.appendChild(pal);
        palInput = $("input", pal);
        palList = $(".palette-list", pal);
        pal.addEventListener("click", (e) => { if (e.target === pal) closePalette(); });
        palInput.addEventListener("input", renderPalette);
        palInput.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(results.length, 1); markSel(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + results.length) % Math.max(results.length, 1); markSel(); }
            else if (e.key === "Enter") { e.preventDefault(); runSel(); }
        });
        palList.addEventListener("click", (e) => {
            const it = e.target.closest(".palette-item");
            if (it) { sel = +it.dataset.i; runSel(); }
        });
        palList.addEventListener("mousemove", (e) => {
            const it = e.target.closest(".palette-item");
            if (it && +it.dataset.i !== sel) { sel = +it.dataset.i; markSel(false); }
        });
    }
    function renderPalette() {
        const q = norm(palInput.value.trim());
        results = commands().filter((c) => !q || q.split(/\s+/).every((w) => norm(c.label + " " + (c.keywords || "") + " " + c.group).includes(w)));
        sel = 0;
        if (!results.length) { palList.innerHTML = `<li class="palette-empty">Aucun résultat pour « ${esc(palInput.value)} »</li>`; return; }
        let html = "", group = "";
        results.forEach((c, i) => {
            if (c.group !== group) { group = c.group; html += `<li class="palette-group" role="presentation">${group}</li>`; }
            html += `<li class="palette-item" role="option" id="pal-${i}" data-i="${i}" aria-selected="false"><span>${esc(c.label)}</span><span class="hint">${esc(c.hint)}</span></li>`;
        });
        palList.innerHTML = html;
        markSel();
    }
    function markSel(scroll = true) {
        $$(".palette-item", palList).forEach((el) => el.setAttribute("aria-selected", String(+el.dataset.i === sel)));
        const cur = $(`#pal-${sel}`, palList);
        if (cur) { palInput.setAttribute("aria-activedescendant", cur.id); if (scroll) cur.scrollIntoView({ block: "nearest" }); }
    }
    function runSel() {
        const c = results[sel];
        if (!c) return;
        closePalette();
        c.run();
    }
    function openPalette() {
        if (!pal) buildPalette();
        closeDrawer();
        pal.classList.add("on");
        palInput.value = "";
        renderPalette();
        palInput.focus();
    }
    function closePalette() { if (pal) pal.classList.remove("on"); }

    $$("[data-palette]").forEach((b) => b.addEventListener("click", openPalette));
    $$("[data-kbd-mod]").forEach((k) => (k.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"));

    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            pal && pal.classList.contains("on") ? closePalette() : openPalette();
        } else if (e.key === "Escape") {
            if (pal && pal.classList.contains("on")) closePalette(); else closeDrawer();
        }
    });

    /* ---------- Apparition douce ---------- */
    const reveals = $$(".reveal");
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => entries.forEach((en) => {
            if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        }), { rootMargin: "0px 0px -8% 0px" });
        reveals.forEach((el) => io.observe(el));
    } else reveals.forEach((el) => el.classList.add("in"));
})();
