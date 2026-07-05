/* =========================================================
   Theme toggle + category filter + post-list rendering
   ========================================================= */

/* ---- Theme (light/dark, remembers choice) ---- */
(function () {
  const KEY = "blog-theme";
  const root = document.documentElement;
  const saved = localStorage.getItem(KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));

  window.toggleTheme = function () {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(KEY, next);
    syncIcon();
  };
  function syncIcon() {
    const btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = root.getAttribute("data-theme") === "dark" ? "☀" : "☾";
  }
  document.addEventListener("DOMContentLoaded", syncIcon);
})();

/* ---- Home page: render category filter + post list ---- */
(function () {
  const LANG_LABEL = { bn: "বাংলা", ar: "العربية", en: "English" };
  const LANG_DIR = { bn: "ltr", ar: "rtl", en: "ltr" };
  const READ_MORE = { bn: "পড়ুন", ar: "اقرأ المزيد", en: "Read" };

  function categories() { return window.CATEGORIES || []; }
  function catBy(slug) { return categories().find((c) => c.slug === slug) || null; }

  function fmtDate(iso, lang) {
    const d = new Date(iso + "T00:00:00");
    const locale = lang === "bn" ? "bn-BD" : lang === "ar" ? "ar" : "en-GB";
    try { return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" }); }
    catch (e) { return iso; }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* current category slug from the URL hash (#cat=slug); "" means all */
  function currentCat() {
    const m = (location.hash || "").match(/cat=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function bnNum(n) {
    return String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);
  }
  function catCounts() {
    const m = {};
    (window.POSTS || []).forEach((p) => {
      if (p.category) m[p.category] = (m[p.category] || 0) + 1;
    });
    return m;
  }

  function renderFilters() {
    const bar = document.getElementById("filters");
    if (!bar) return;
    const active = currentCat();
    const counts = catCounts();
    const total = (window.POSTS || []).length;
    let html = `<button class="filter-btn${active ? "" : " active"}" data-cat="">সব <span class="count">${bnNum(total)}</span></button>`;
    html += categories().map((c) =>
      `<button class="filter-btn${active === c.slug ? " active" : ""}" data-cat="${esc(c.slug)}" title="${esc(c.name)}">${esc(c.short || c.name)} <span class="count">${bnNum(counts[c.slug] || 0)}</span></button>`
    ).join("");
    bar.innerHTML = html;
    bar.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const slug = btn.dataset.cat;
        location.hash = slug ? "cat=" + encodeURIComponent(slug) : "";
      });
    });
  }

  function renderList() {
    const list = document.getElementById("post-list");
    if (!list || !window.POSTS) return;
    const filter = currentCat();

    // active pill state
    document.querySelectorAll("#filters .filter-btn").forEach((b) =>
      b.classList.toggle("active", (b.dataset.cat || "") === filter));

    // category heading
    const heading = document.getElementById("cat-heading");
    if (heading) {
      const c = filter ? catBy(filter) : null;
      if (c) { heading.textContent = c.name; heading.hidden = false; }
      else { heading.textContent = ""; heading.hidden = true; }
    }

    const posts = window.POSTS.slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .filter((p) => !filter || p.category === filter);

    if (!posts.length) {
      list.innerHTML = '<li class="empty">এই ক্যাটাগরিতে এখনো কোনো লেখা নেই।</li>';
      return;
    }

    list.innerHTML = posts.map((p) => {
      const dir = LANG_DIR[p.lang] || "ltr";
      const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
      const url = `posts/${encodeURIComponent(p.slug)}.html`;
      const c = catBy(p.category);
      const catChip = c
        ? `<a class="cat-chip" href="#cat=${esc(c.slug)}" title="${esc(c.name)}">${esc(c.short || c.name)}</a>`
        : "";
      return `
      <li class="post-item" data-lang="${p.lang}" dir="${dir}">
        <div class="post-meta">
          <span class="badge">${LANG_LABEL[p.lang] || p.lang}</span>
          ${catChip}
          <span>${fmtDate(p.date, p.lang)}</span>
          ${tags ? `<span class="dot-sep">·</span>${tags}` : ""}
        </div>
        <h2><a href="${url}">${esc(p.title)}</a></h2>
        <p class="excerpt">${esc(p.excerpt || "")}</p>
        <a class="read-more" href="${url}">${READ_MORE[p.lang] || "Read"}</a>
      </li>`;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("post-list")) return;
    renderFilters();
    renderList();
    window.addEventListener("hashchange", renderList);
  });
})();
