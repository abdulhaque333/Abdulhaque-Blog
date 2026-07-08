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

  /* ---- Full-text search ---- */
  let query = "";               // বর্তমান সার্চ-টোকেনসমূহ (স্পেসে ভাগ)
  let indexState = "none";      // none | loading | ready
  let lowerIndex = null;        // slug → ছোট-হাতের পূর্ণ টেক্সট

  /* একসাথে সব না এঁকে ধাপে ধাপে দেখাই — টাইপিং মসৃণ থাকে */
  const PAGE = 60;
  let shownCount = PAGE;
  let lastKey = null;

  function normalize(s) {
    return String(s).normalize("NFC").toLowerCase();
  }
  function tokens() {
    return query ? query.split(/\s+/).filter(Boolean) : [];
  }

  /* প্রথম সার্চেই ইনডেক্সটা (search-index.js) নামিয়ে নেয় */
  function ensureIndex() {
    if (indexState !== "none") return;
    indexState = "loading";
    const s = document.createElement("script");
    s.src = "search-index.js";
    s.onload = function () {
      lowerIndex = {};
      for (const slug in (window.SEARCH_INDEX || {}))
        lowerIndex[slug] = normalize(window.SEARCH_INDEX[slug]);
      indexState = "ready";
      renderList();
    };
    s.onerror = function () { indexState = "none"; };
    document.head.appendChild(s);
  }

  function haystack(p) {
    if (indexState === "ready" && lowerIndex && lowerIndex[p.slug] !== undefined)
      return lowerIndex[p.slug];
    const c = catBy(p.category);
    return normalize([p.title, p.excerpt || "", (p.tags || []).join(" "),
                      c ? c.name : ""].join(" "));
  }
  function matches(p, toks) {
    const h = haystack(p);
    return toks.every((t) => h.includes(t));
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  /* এস্কেপ-করা টেক্সটে টোকেনগুলো <mark> দিয়ে চিহ্নিত করে */
  function highlight(escaped, toks) {
    let out = escaped;
    toks.forEach((t) => {
      out = out.replace(new RegExp(escapeRe(esc(t)), "gi"), '<mark class="hl">$&</mark>');
    });
    return out;
  }
  /* ম্যাচের আশপাশ থেকে ~১৬০ অক্ষরের অংশ তুলে আনে */
  function snippet(p, toks) {
    if (indexState !== "ready" || !window.SEARCH_INDEX || !window.SEARCH_INDEX[p.slug])
      return highlight(esc(p.excerpt || ""), toks);
    const raw = window.SEARCH_INDEX[p.slug];
    const low = lowerIndex[p.slug];
    let pos = -1;
    for (const t of toks) { pos = low.indexOf(t); if (pos !== -1) break; }
    if (pos === -1) return highlight(esc(p.excerpt || ""), toks);
    const start = Math.max(0, pos - 60);
    const end = Math.min(raw.length, pos + 120);
    const piece = (start > 0 ? "…" : "") + raw.slice(start, end).trim() +
                  (end < raw.length ? "…" : "");
    return highlight(esc(piece), toks);
  }

  function updateStatus(shown) {
    const el = document.getElementById("search-status");
    if (!el) return;
    if (!query) { el.hidden = true; el.textContent = ""; return; }
    el.hidden = false;
    if (indexState === "loading")
      el.innerHTML = "পূর্ণ লেখার সূচি লোড হচ্ছে… আপাতত শিরোনামে খোঁজা হলো — <b>" + bnNum(shown) + "টি</b> লেখা";
    else
      el.innerHTML = shown
        ? "<b>" + bnNum(shown) + "টি</b> লেখা মিলেছে"
        : "কিছু মেলেনি — অন্য শব্দ চেষ্টা করুন";
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

    const toks = tokens();
    const key = query + "|" + filter;
    if (key !== lastKey) { shownCount = PAGE; lastKey = key; }

    if (!renderList._sorted)
      renderList._sorted = window.POSTS.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const posts = renderList._sorted
      .filter((p) => !filter || p.category === filter)
      .filter((p) => !toks.length || matches(p, toks));

    updateStatus(posts.length);

    if (!posts.length) {
      list.innerHTML = toks.length
        ? '<li class="empty">এই খোঁজে কোনো লেখা মেলেনি।</li>'
        : '<li class="empty">এই ক্যাটাগরিতে এখনো কোনো লেখা নেই।</li>';
      return;
    }

    const visible = posts.slice(0, shownCount);
    const remaining = posts.length - visible.length;

    list.innerHTML = visible.map((p) => {
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
        <h2><a href="${url}">${toks.length ? highlight(esc(p.title), toks) : esc(p.title)}</a></h2>
        <p class="excerpt">${toks.length ? snippet(p, toks) : esc(p.excerpt || "")}</p>
        <a class="read-more" href="${url}">${READ_MORE[p.lang] || "Read"}</a>
      </li>`;
    }).join("") + (remaining > 0
      ? `<li class="load-more"><button class="load-more-btn" type="button">আরও দেখুন <span class="count">(${bnNum(remaining)}টি বাকি)</span></button></li>`
      : "");
  }

  function wireSearch() {
    const input = document.getElementById("search-input");
    const clear = document.getElementById("search-clear");
    if (!input) return;
    /* বক্সে হাত দেওয়ামাত্রই সূচি নামা শুরু — প্রথম খোঁজায় আর অপেক্ষা নয় */
    input.addEventListener("focus", ensureIndex, { once: true });
    let timer = null;
    input.addEventListener("input", function () {
      if (clear) clear.hidden = !input.value;
      clearTimeout(timer);
      timer = setTimeout(function () {
        query = normalize(input.value).trim();
        if (query) ensureIndex();
        renderList();
      }, 120);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { input.value = ""; input.dispatchEvent(new Event("input")); }
    });
    if (clear) clear.addEventListener("click", function () {
      input.value = "";
      input.dispatchEvent(new Event("input"));
      input.focus();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const list = document.getElementById("post-list");
    if (!list) return;
    renderFilters();
    renderList();
    wireSearch();
    list.addEventListener("click", function (e) {
      if (e.target.closest(".load-more-btn")) { shownCount += PAGE * 2; renderList(); }
    });
    window.addEventListener("hashchange", renderList);
  });
})();
