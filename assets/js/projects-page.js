/* Page Projets V2 : baie de serveurs + filtres (domaine, technologie, compétence) */
(function () {
    "use strict";
    const rack = document.getElementById("srv-rack");
    if (!rack) return;
    const PROJECTS = window.PROJECTS || [];
    const DOMAINS = window.DOMAINS || {};
    const SKILLS = window.SKILLS || {};
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    /* Rendu des serveurs */
    rack.innerHTML = PROJECTS.map((p) => {
        const [hi, lo] = (p.u || "").replace("U", "").split("-");
        const warn = /cours/i.test(p.status || "");
        return `<div class="srv-row" data-slug="${p.slug}">
            <div class="u"><span>${hi || ""}</span><span>${lo || ""}</span></div>
            <div class="slot">
                <a class="srv-card" href="projets/${p.slug}.html">
                    <div class="srv-id"><b>${esc(p.srv || "")}</b><span>${esc(p.u || "")} · 2U</span><span class="bays" aria-hidden="true"><i></i><i></i></span></div>
                    <div class="srv-main">
                        <h2>${esc(p.title)}<small>${esc(DOMAINS[p.domain] || "")}</small></h2>
                        <p>${esc(p.impact)}</p>
                        <ul class="tags">${(p.stack || p.tags).map((t) => `<li class="tag">${esc(t)}</li>`).join("")}</ul>
                    </div>
                    <div class="srv-side">
                        <span class="state"><span class="status-led${warn ? " warn" : ""}" aria-hidden="true"></span>${esc(p.status || "")}</span>
                        <span>${esc(p.period)}</span>
                        <span class="skill-badges">${(p.skills || []).map((s) => `<span class="skill-badge" title="${esc(SKILLS[s] || "")}">${s}</span>`).join("")}</span>
                    </div>
                </a>
            </div>
            <div class="u r"><span>${hi || ""}</span><span>${lo || ""}</span></div>
        </div>`;
    }).join("") + `<p class="srv-empty" id="srv-empty" hidden>Aucun serveur ne correspond à ces filtres.</p>`;

    /* Construction des filtres */
    const state = { domain: "", tech: "", skill: "" };
    const count = (fn) => PROJECTS.filter(fn).length;
    function chips(el, key, items) {
        el.innerHTML = `<button class="filter" data-k="${key}" data-v="" aria-pressed="true">Tous</button>` +
            items.map(([v, label, n, title]) => `<button class="filter" data-k="${key}" data-v="${esc(v)}" aria-pressed="false"${title ? ` title="${esc(title)}"` : ""}>${esc(label)}<span class="count">${n}</span></button>`).join("");
    }
    const domains = Object.keys(DOMAINS).filter((d) => count((p) => p.domain === d)).map((d) => [d, DOMAINS[d], count((p) => p.domain === d)]);
    const techs = [...new Set(PROJECTS.flatMap((p) => p.stack || []))].sort((a, b) => count((p) => (p.stack || []).includes(b)) - count((p) => (p.stack || []).includes(a)) || a.localeCompare(b, "fr"))
        .map((t) => [t, t, count((p) => (p.stack || []).includes(t))]);
    const skills = Object.keys(SKILLS).map((s) => [s, s, count((p) => (p.skills || []).includes(s)), SKILLS[s]]).filter((s) => s[2]);
    chips(document.getElementById("f-domain"), "domain", domains);
    chips(document.getElementById("f-tech"), "tech", techs);
    chips(document.getElementById("f-skill"), "skill", skills);

    /* Technologies : les 12 plus fréquentes, le reste derrière un bouton */
    const techBox = document.getElementById("f-tech");
    const extra = Array.from(techBox.querySelectorAll(".filter")).slice(13);
    if (extra.length) {
        extra.forEach((b) => (b.hidden = true));
        const more = document.createElement("button");
        more.type = "button"; more.className = "filter"; more.setAttribute("aria-expanded", "false");
        more.textContent = `+ ${extra.length}`;
        more.addEventListener("click", () => {
            const open = more.getAttribute("aria-expanded") !== "true";
            extra.forEach((b) => (b.hidden = !open && b.getAttribute("aria-pressed") !== "true"));
            more.setAttribute("aria-expanded", String(open));
            more.textContent = open ? "moins" : `+ ${extra.length}`;
        });
        techBox.appendChild(more);
    }

    function apply() {
        let shown = 0;
        PROJECTS.forEach((p) => {
            const ok = (!state.domain || p.domain === state.domain) &&
                (!state.tech || (p.stack || []).includes(state.tech)) &&
                (!state.skill || (p.skills || []).includes(state.skill));
            rack.querySelector(`.srv-row[data-slug="${p.slug}"]`).classList.toggle("is-off", !ok);
            if (ok) shown++;
        });
        document.getElementById("f-count").textContent = `${shown} / ${PROJECTS.length} serveurs affichés`;
        document.getElementById("srv-empty").hidden = shown > 0;
        document.querySelectorAll(".filter[data-k]").forEach((b) => b.setAttribute("aria-pressed", String(state[b.dataset.k] === b.dataset.v)));
        const url = new URL(location.href);
        ["domain", "tech", "skill"].forEach((k) => (state[k] ? url.searchParams.set(k === "domain" ? "d" : k, state[k]) : url.searchParams.delete(k === "domain" ? "d" : k)));
        history.replaceState(null, "", url);
    }
    document.querySelector(".filter-panel").addEventListener("click", (e) => {
        const b = e.target.closest(".filter[data-k]");
        if (!b) return;
        state[b.dataset.k] = state[b.dataset.k] === b.dataset.v ? "" : b.dataset.v;
        apply();
    });
    document.getElementById("f-reset").addEventListener("click", () => { state.domain = state.tech = state.skill = ""; apply(); });

    /* Filtres passés dans l'URL (palette Ctrl+K, liens depuis la page Compétences) */
    const q = new URL(location.href).searchParams;
    if (q.get("d") && DOMAINS[q.get("d")]) state.domain = q.get("d");
    if (q.get("tech")) state.tech = q.get("tech");
    if (q.get("skill") && SKILLS[q.get("skill")]) state.skill = q.get("skill");
    apply();
})();
