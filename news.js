/**
 * News page: renders a simple in-file list of news items into .ed-list.
 *
 * HOW TO ADD A NEWS ITEM
 * ----------------------
 * Just add an object to the NEWS_ITEMS array below. The newest item goes
 * at the top, but order in the file doesn't actually matter — items are
 * sorted by date before rendering.
 *
 * Fields:
 *   date     "YYYY-MM" or "YYYY-MM-DD"       required
 *   title    Headline. Wrap words in _…_ to italicize them.  required
 *   tag      Short key: milestone | funding | publication |
 *            award | conference | collaboration | news      required
 *   summary  One-line description shown under the title     required
 *
 * To remove an item, delete its object. That's it. No manifest, no
 * external files, no network calls — everything lives in this file.
 */
(function () {
  const NEWS_ITEMS = [
    {
      date: "2025-06",
      tag: "milestone",
      title: "Scalable production of _cardiac organoids_ — critical milestone achieved",
      summary:
        "Research milestone · Dr. Sarkawt Hamad and Ebru Aksoy scale up cardiac organoid differentiation for cell replacement therapy",
    },
    {
      date: "2025-05",
      tag: "funding",
      title: "_BiRonCa_ bioreactor project funded by ZukunftBio.NRW",
      summary:
        "Funding · ~€850,000 over two years for bubble-free bioreactor scale-up with Biothrust GmbH",
    },
    {
      date: "2025-03",
      tag: "award",
      title: "Ebru Aksoy wins _Best Poster Award_ at 3rd Dubai Stem Cell Congress",
      summary: "Award · 3rd Dubai Stem Cell Congress",
    },
    {
      date: "2025-02",
      tag: "publication",
      title: "Engineered in vitro multi-cell type _ventricle model_ published",
      summary:
        "Publication · Adv. Healthcare Materials — Kuckelkorn, Aksoy, Stojanovic, Oulahyane, Ritter, Pfannkuche, Fischer",
    },
    {
      date: "2023-06-22",
      tag: "milestone",
      title: "Official opening of the _Marga and Walter Boll Laboratory_",
      summary:
        "Milestone · Inauguration event at the Medical Faculty, University of Cologne",
    },
    {
      date: "2023-06-21",
      tag: "collaboration",
      title: "_Hortman Stem Cell Laboratory_ collaboration launched",
      summary:
        "Collaboration · Dr. Fatma Alhashimi joins the MWB Lab opening as guest of honour",
    },
    {
      date: "2022-12",
      tag: "funding",
      title: "_PERIDIAN_ project receives ZukunftBIO.NRW funding recommendation",
      summary:
        "Funding · Joint project with innoVitro GmbH and Fraunhofer Institute for Laser Technology",
    },
    {
      date: "2022-06",
      tag: "publication",
      title:
        "High-efficient serum-free differentiation of _endothelial cells_ from hiPSCs",
      summary:
        "Publication · Stem Cell Research & Therapy 13(1):251 — Hamad, Derichsweiler, Gaspar, Brockmeier, Hescheler, Sachinidis, Pfannkuche",
    },
    {
      date: "2022-05",
      tag: "publication",
      title: "Generation of cardiac _microtissues_ by microfluidic cell encapsulation",
      summary:
        "Publication · Biofabrication — Jahn, Karger, Khalaf, Hamad, Peinkofer et al.",
    },
  ];

  /* ---------- rendering ---------- */

  const listEl = document.querySelector(".ed-list");
  if (!listEl) return;

  const escapeHtml = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  // Convert _word_ / *word* in a title to <em>word</em>.
  // The title value is already HTML-escaped before this runs.
  const applyTitleEmphasis = (escaped) =>
    escaped
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  const sortScore = (dateStr) => {
    const m = String(dateStr || "").match(
      /^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/
    );
    if (!m) return 0;
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) || 0;
    const d = parseInt(m[3] || "0", 10) || 0;
    return y * 10000 + mo * 100 + d;
  };

  const formatYearMonth = (dateStr) => {
    const m = String(dateStr || "").match(/^(\d{4})[-/](\d{1,2})/);
    if (!m) return escapeHtml(dateStr);
    return `${m[1]} · ${m[2].padStart(2, "0")}`;
  };

  const capitalize = (s) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

  const renderItem = (item) => {
    const year = formatYearMonth(item.date);
    const rawTag = (item.tag || "news").toLowerCase();
    const tagLabel = capitalize(rawTag);
    const title = applyTitleEmphasis(escapeHtml(item.title || "Untitled"));
    const summary = escapeHtml(item.summary || "");
    return `
      <div class="ed-item rv in" data-tag="${escapeHtml(rawTag)}">
        <div class="year">${escapeHtml(year)}</div>
        <div class="body">
          <h3>${title}</h3>
          <div class="meta-line">${summary}</div>
        </div>
        <div class="tag">${escapeHtml(tagLabel)}</div>
      </div>
    `;
  };

  const sorted = NEWS_ITEMS
    .filter((i) => i && i.date)
    .slice()
    .sort((a, b) => sortScore(b.date) - sortScore(a.date));

  if (!sorted.length) {
    listEl.innerHTML = `<div class="mono" style="color:var(--muted); padding:24px 0; font-family:'JetBrains Mono',monospace; font-size:.7rem; letter-spacing:.08em">No news items yet.</div>`;
    return;
  }

  listEl.innerHTML = sorted.map(renderItem).join("");
})();
