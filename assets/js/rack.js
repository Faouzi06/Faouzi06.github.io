/* ==========================================================================
   Baie RACK-01 : panneau de détail, câbles de brassage, supervision
   ========================================================================== */
(function () {
    "use strict";
    const rack = document.getElementById("rack");
    if (!rack) return;

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const PROJECTS = window.PROJECTS || [];
    const DOMAINS = window.DOMAINS || {};
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Supervision (valeurs calculées) ---------- */
    const START = new Date("2025-08-18T00:00:00");
    const uptime = Math.max(0, Math.floor((Date.now() - START) / 86400000));
    const veille = { count: null, ago: null };
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set("m-uptime", uptime + " j");
    set("ups-lcd", "UPTIME " + uptime + " j");

    function agoText(iso) {
        const h = Math.round((Date.now() - new Date(iso)) / 3600000);
        if (h < 1) return "il y a moins d'1 h";
        if (h < 48) return "il y a " + h + " h";
        return "il y a " + Math.round(h / 24) + " j";
    }
    fetch("assets/data/veille.json", { cache: "no-cache" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
            veille.count = (d.items || []).length;
            veille.ago = agoText(d.updated);
            set("m-veille", veille.count + " articles");
            set("m-veille-sub", "MAJ " + veille.ago);
            set("spec-veille", "MAJ " + veille.ago + " · " + veille.count + " articles");
            set("fw-lcd", veille.count + " art. · OK");
        })
        .catch(() => { set("m-veille", "auto"); });

    /* ---------- Fiches des équipements ---------- */
    const DEVICES = {
        patch: { title: "Panneau de brassage", text: "La navigation du site : un port par page. Survolez un port pour brancher le câble vers l'équipement correspondant.", callout: [["Ports actifs", "6 / 12"], ["Câblage", "Cat6 · un câble = une page"]], link: ["#plan", "Plan du site →"] },
        sw: { title: "Projets", text: "Le switch de distribution : un port actif par projet documenté. La liste se filtre par domaine, par technologie ou par compétence.", callout: [["Projets", "7 en service"], ["Domaines", "réseau, systèmes, supervision, support, sécurité"]], link: ["projects.html", "Ouvrir la liste des projets →"] },
        fw: { title: "Veille technologique", text: "Filtre et classe automatiquement 8 flux d'actualité. Sujet approfondi : les vulnérabilités et la gestion des correctifs.", callout: () => [["Articles", veille.count != null ? String(veille.count) : "—"], ["Mise à jour", veille.ago || "toutes les 6 h"]], link: ["veille.html", "Ouvrir la veille →"] },
        rt: { title: "Compétences", text: "Route chaque compétence du référentiel BTS SIO vers les projets qui la prouvent, plus les compétences techniques par domaine.", callout: [["Bloc 1", "B1.1 → B1.6"], ["Domaines", "réseau, systèmes, scripts, supervision, sécurité"]], link: ["competences.html", "Ouvrir les compétences →"] },
        nas: { title: "Tableau de synthèse E5", text: "Archive les réalisations professionnelles selon la grille officielle (annexe 8-1), en page web imprimable et en Excel.", callout: [["Réalisations", "11"], ["Formats", "web · PDF · Excel"]], link: ["e5.html", "Ouvrir le tableau E5 →"] },
        kvm: { title: "Contact", text: "Le port console : e-mail, téléphone et CV. Un message se prépare en un clic.", callout: [["E-mail", "ahmedfaouzi55@gmail.com"], ["Site", "Montpellier"]], link: ["contact.html", "Se connecter au port console →"] },
        ups: { title: "Parcours", text: "Ce qui alimente le reste : alternance en support informatique à La Compagnie de Formation, BTS SIO SISR, formations et expériences.", callout: () => [["Uptime", uptime + " jours d'alternance"], ["Formation", "BTS SIO SISR · 2e année"]], link: ["about.html", "Ouvrir le parcours →"] }
    };

    const d = { kicker: $("#d-kicker"), title: $("#d-title"), text: $("#d-text"), callout: $("#d-callout"), tags: $("#d-tags"), link: $("#d-link") };
    const initial = d.kicker ? { k: d.kicker.innerHTML, t: d.title.innerHTML, x: d.text.innerHTML, c: d.callout.innerHTML, g: d.tags.innerHTML, h: d.link.getAttribute("href"), l: d.link.innerHTML } : null;

    function uRange(el) {
        const row = el.closest(".ru");
        const u = row ? $(".u", row) : null;
        if (!u) return "";
        const spans = $$("span", u);
        return spans.length ? spans.map((s) => s.textContent.trim()).join("-") : u.textContent.trim();
    }
    function fill(info) {
        if (!d.kicker) return;
        d.kicker.textContent = info.kicker;
        d.title.textContent = info.title;
        d.text.textContent = info.text;
        d.callout.innerHTML = info.callout.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
        d.tags.innerHTML = (info.tags || []).map((t) => `<li class="tag">${esc(t)}</li>`).join("");
        d.link.setAttribute("href", info.link[0]);
        d.link.textContent = info.link[1];
    }
    function infoFor(el) {
        const name = ($(".name b", el) || $(".name", el) || {}).textContent || "";
        const where = "U" + uRange(el) + " · " + name.trim();
        if (el.dataset.slug) {
            const p = PROJECTS.find((q) => q.slug === el.dataset.slug);
            if (!p) return null;
            return {
                kicker: where + " · " + (DOMAINS[p.domain] || ""),
                title: p.title, text: p.impact,
                callout: [["Rôle", p.role || "—"], ["Cadre", p.context], ["Période", p.period]],
                tags: p.tags, link: [el.getAttribute("href"), "Ouvrir la fiche →"]
            };
        }
        const dev = DEVICES[el.dataset.key];
        if (!dev) return null;
        return {
            kicker: where, title: dev.title, text: dev.text,
            callout: typeof dev.callout === "function" ? dev.callout() : dev.callout,
            link: dev.link
        };
    }
    function select(el) {
        $$(".dev.is-sel", rack).forEach((x) => x.classList.remove("is-sel"));
        if (!el) { if (initial) { d.kicker.innerHTML = initial.k; d.title.innerHTML = initial.t; d.text.innerHTML = initial.x; d.callout.innerHTML = initial.c; d.tags.innerHTML = initial.g; d.link.setAttribute("href", initial.h); d.link.innerHTML = initial.l; } return; }
        el.classList.add("is-sel");
        const info = infoFor(el);
        if (info) fill(info);
    }

    /* ---------- Câbles de brassage ---------- */
    const svg = document.getElementById("cables");
    const NS = "http://www.w3.org/2000/svg";
    function clearCable() {
        if (svg) svg.innerHTML = "";
        $$(".pp-port.is-on", rack).forEach((p) => p.classList.remove("is-on"));
    }
    function drawCable(port) {
        const target = rack.querySelector(`.dev[data-key="${port.dataset.target}"]`);
        if (!svg || !target) return target;
        clearCable();
        port.classList.add("is-on");
        const R = rack.getBoundingClientRect();
        const p = port.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        const color = getComputedStyle(port).getPropertyValue("--c").trim() || "#58A6FF";
        const x0 = p.left + p.width / 2 - R.left, y0 = p.bottom - R.top;
        const row = port.closest(".ru");
        const y1 = row ? row.getBoundingClientRect().bottom - R.top - 1 : y0 + 4;   // longe la séparation sous le panneau
        const gx = Math.max(10, t.left - R.left - 14);           // descente dans la gouttière des U
        const ty = t.top + t.height / 2 - R.top, tx = t.left - R.left + 2;
        const r = 6;
        const dPath = `M${x0},${y0} L${x0},${y1 - r} Q${x0},${y1} ${x0 - r},${y1} L${gx + r},${y1} Q${gx},${y1} ${gx},${y1 + r} L${gx},${ty - r} Q${gx},${ty} ${gx + r},${ty} L${tx},${ty}`;
        svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", dPath);
        path.setAttribute("stroke", color);
        svg.appendChild(path);
        const plug = document.createElementNS(NS, "rect");
        plug.setAttribute("x", tx - 2); plug.setAttribute("y", ty - 4); plug.setAttribute("width", 8); plug.setAttribute("height", 8);
        plug.setAttribute("fill", color);
        svg.appendChild(plug);
        if (!reduced) {
            const len = Math.ceil(path.getTotalLength());
            path.style.setProperty("--len", len);
            path.classList.add("draw");
        }
        return target;
    }

    /* ---------- Interactions ---------- */
    function onEnter(e) {
        const port = e.target.closest(".pp-port");
        if (port) { const t = drawCable(port); if (t) select(t); return; }
        const dev = e.target.closest(".dev");
        if (!dev || !rack.contains(dev)) return;
        clearCable();
        const linked = rack.querySelector(`.pp-port[data-target="${dev.dataset.key}"]`);
        if (linked && dev.dataset.key !== "patch") { drawCable(linked); }
        select(dev);
    }
    rack.addEventListener("mouseover", onEnter);
    rack.addEventListener("focusin", onEnter);
    rack.addEventListener("mouseleave", () => { clearCable(); select(null); });
    rack.addEventListener("focusout", (e) => { if (!rack.contains(e.relatedTarget)) { clearCable(); select(null); } });
    addEventListener("resize", clearCable);
})();
