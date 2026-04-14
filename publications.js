/**
 * Publications page: fetch works from every ORCID profile in
 * window.SITE_CONFIG.orcidIds, dedupe, filter by year, sort
 * newest-first, and render into the .ed-list as .ed-item cards.
 *
 * Each entry shows year + title + journal + a DOI link out to the
 * publisher. No external profile buttons, no limit by default.
 *
 * Configuration (config.js):
 *   orcidIds              [string]  — one ORCID iD per author
 *   publicationsSinceYear number    — earliest year to include (e.g. 2018)
 *   publicationsLimit     number    — cap on entries rendered, 0 = no cap
 */
(function () {
  const cfg = window.SITE_CONFIG || {};
  const orcidIds = Array.isArray(cfg.orcidIds) && cfg.orcidIds.length
    ? cfg.orcidIds.slice()
    : (cfg.orcidId ? [cfg.orcidId] : []);
  const sinceYear = Number(cfg.publicationsSinceYear) || 0;
  const limit = Number(cfg.publicationsLimit) || 0;

  const listEl = document.querySelector(".ed-list");
  if (!listEl || orcidIds.length === 0) return;

  /* ---------- helpers ---------- */

  // ORCID sometimes returns strings that already contain HTML entities
  // (e.g. "Stem Cell Research &amp; Therapy"). Decode them first so we
  // don't double-escape when we re-encode for safe insertion.
  const decodeEntities = (s) => {
    if (s == null) return "";
    const el = document.createElement("textarea");
    el.innerHTML = String(s);
    return el.value;
  };

  const escape = (s) =>
    decodeEntities(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // Format a work's type into a human-readable tag label
  const tagForType = (rawType) => {
    const t = (rawType || "journal-article").toLowerCase();
    if (t === "book-chapter") return { key: "chapter", label: "Chapter" };
    if (t === "book") return { key: "book", label: "Book" };
    if (t === "review-article") return { key: "review", label: "Review" };
    if (t === "preprint") return { key: "preprint", label: "Preprint" };
    if (t === "conference-paper") return { key: "conference", label: "Conference" };
    return { key: "publication", label: "Article" };
  };

  const getYear = (work) => {
    const pd = work && work["publication-date"];
    if (!pd) return 0;
    return parseInt((pd.year && pd.year.value) || "0", 10) || 0;
  };

  const getSortScore = (work) => {
    const pd = work && work["publication-date"];
    if (!pd) return 0;
    const y = parseInt((pd.year && pd.year.value) || "0", 10) || 0;
    const m = parseInt((pd.month && pd.month.value) || "0", 10) || 0;
    const d = parseInt((pd.day && pd.day.value) || "0", 10) || 0;
    return y * 10000 + m * 100 + d;
  };

  const getDoi = (work) => {
    const ids =
      (work["external-ids"] && work["external-ids"]["external-id"]) || [];
    const doi = ids.find(
      (e) => (e["external-id-type"] || "").toLowerCase() === "doi"
    );
    if (!doi) return null;
    const url =
      (doi["external-id-url"] && doi["external-id-url"].value) ||
      `https://doi.org/${doi["external-id-value"]}`;
    return { url, value: doi["external-id-value"] };
  };

  // Build a stable key for deduplication. DOI is the most reliable signal
  // for "same paper"; when a work has no DOI we fall back to a normalized
  // title + year combo so cross-profile duplicates still merge.
  const normalize = (s) =>
    decodeEntities(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const dedupKey = (work) => {
    const doi = getDoi(work);
    if (doi && doi.value) return "doi:" + doi.value.toLowerCase().trim();
    const title =
      (work.title && work.title.title && work.title.title.value) || "";
    const year = String(getYear(work) || "");
    return "t:" + normalize(title) + "|" + year;
  };

  const renderWork = (work) => {
    const title =
      (work.title && work.title.title && work.title.title.value) || "Untitled";
    const year = String(getYear(work) || "—");
    const journal =
      (work["journal-title"] && work["journal-title"].value) || "";
    const tag = tagForType(work.type);
    const doi = getDoi(work);

    const metaParts = [];
    if (journal) metaParts.push(`<em>${escape(journal)}</em>`);
    if (doi)
      metaParts.push(
        `<a href="${escape(doi.url)}" target="_blank" rel="noopener noreferrer"><em>DOI</em></a>`
      );
    const meta = metaParts.join(" &middot; ");

    return `
      <div class="ed-item rv" data-tag="${escape(tag.key)}">
        <div class="year">${escape(year)}</div>
        <div class="body">
          <h3>${escape(title)}</h3>
          <div class="meta-line">${meta}</div>
        </div>
        <div class="tag">${escape(tag.label)}</div>
      </div>
    `;
  };

  const showStatus = (msg) => {
    listEl.innerHTML = `<div class="mono" style="color:var(--muted); padding:24px 0; font-family:'JetBrains Mono',monospace; font-size:.78rem; letter-spacing:.08em">${escape(
      msg
    )}</div>`;
  };

  /* ---------- fetch + render ---------- */

  const fetchWorks = (id) =>
    fetch(`https://pub.orcid.org/v3.0/${encodeURIComponent(id)}/works`, {
      headers: { Accept: "application/json" },
    }).then((res) => {
      if (!res.ok) throw new Error(`ORCID ${id} returned ${res.status}`);
      return res.json();
    });

  showStatus("Loading publications…");

  Promise.allSettled(orcidIds.map(fetchWorks))
    .then((results) => {
      const merged = new Map();
      let anySuccess = false;

      results.forEach((r, idx) => {
        if (r.status !== "fulfilled") {
          console.warn(
            `ORCID fetch failed for ${orcidIds[idx]}:`,
            r.reason && r.reason.message
          );
          return;
        }
        anySuccess = true;
        const groups = (r.value && r.value.group) || [];
        groups.forEach((g) => {
          const summary = (g["work-summary"] || [])[0];
          if (!summary) return;

          // Skip years before the since-year filter
          if (sinceYear && getYear(summary) < sinceYear) return;

          // Skip non-publication types ORCID occasionally stores
          const t = (summary.type || "").toLowerCase();
          if (t === "data-set" || t === "test" || t === "other") return;

          const key = dedupKey(summary);
          if (!merged.has(key)) merged.set(key, summary);
        });
      });

      if (!anySuccess) {
        showStatus(
          "Could not load publications — ORCID API unreachable. Please try again later."
        );
        return;
      }

      const works = Array.from(merged.values());
      if (works.length === 0) {
        showStatus(`No publications since ${sinceYear || "—"} found.`);
        return;
      }

      // Sort newest first by full YYYYMMDD score
      works.sort((a, b) => getSortScore(b) - getSortScore(a));

      const top = limit > 0 ? works.slice(0, limit) : works;
      listEl.innerHTML = top.map(renderWork).join("");

      // The site uses IntersectionObserver on .rv elements to reveal
      // them on scroll. Those observers already ran before we injected
      // content, so trigger the reveal immediately for the new nodes.
      listEl
        .querySelectorAll(".ed-item.rv")
        .forEach((el) => el.classList.add("in"));
    })
    .catch((err) => {
      console.error("Publications load failed:", err);
      showStatus("Could not load publications. Please try again later.");
    });
})();
