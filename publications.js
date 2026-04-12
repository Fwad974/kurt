/**
 * Publications page: fetch latest works from ORCID and render them.
 * Configuration comes from window.SITE_CONFIG (see config.js).
 */
(function () {
  const cfg = window.SITE_CONFIG || {};
  const orcidId = cfg.orcidId;
  const limit = cfg.publicationsLimit || 20;

  const listEl = document.querySelector(".ed-list");
  if (!listEl || !orcidId) return;

  // Update profile button links from config
  const scholarBtn = document.querySelector('[data-link="scholar"]');
  if (scholarBtn && cfg.googleScholarUrl) scholarBtn.href = cfg.googleScholarUrl;
  const orcidBtn = document.querySelector('[data-link="orcid"]');
  if (orcidBtn && cfg.orcidUrl) orcidBtn.href = cfg.orcidUrl;

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

  // Convert ORCID work type like "journal-article" -> "Journal article"
  const formatType = (t) => {
    if (!t) return "Publication";
    const s = t.replace(/[-_]/g, " ").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Emphasize keywords in the title by wrapping them in <em>
  const KEYWORDS = [
    "cardiomyocytes",
    "cardiomyocyte",
    "organoid",
    "organoids",
    "stem cell",
    "stem cells",
    "hydrogel",
    "iPSC",
    "cardiac",
    "regenerative",
    "endothelial",
    "myocardial",
    "tissue engineering",
    "cell therapy",
    "scaffold",
    "biomaterial",
    "biomaterials",
  ];
  const emphasize = (title) => {
    let out = escape(title);
    KEYWORDS.forEach((kw) => {
      const re = new RegExp(`\\b(${kw})\\b`, "i");
      out = out.replace(re, "<em>$1</em>");
    });
    return out;
  };

  const getDate = (work) => {
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

  const renderWork = (work) => {
    const title =
      (work.title && work.title.title && work.title.title.value) || "Untitled";
    const year =
      (work["publication-date"] &&
        work["publication-date"].year &&
        work["publication-date"].year.value) ||
      "—";
    const journal =
      (work["journal-title"] && work["journal-title"].value) || "";
    const rawType = (work.type || "journal-article").toLowerCase();
    const type = formatType(rawType);
    const doi = getDoi(work);

    // Only show a type badge when it's NOT a regular journal article,
    // to cut visual noise for the common case.
    const showTypeBadge = rawType !== "journal-article";

    const metaParts = [];
    if (journal) metaParts.push(escape(journal));
    if (doi)
      metaParts.push(
        `<a href="${escape(doi.url)}" target="_blank" rel="noopener"><em>DOI</em></a>`
      );
    const meta = metaParts.join(" · ");

    const typeBadge = showTypeBadge
      ? `<span class="pub-type">${escape(type)}</span>`
      : "";

    return `
      <article class="pub-card">
        <header class="pub-head">
          <span class="pub-year">${escape(year)}</span>
          ${typeBadge}
        </header>
        <h3 class="pub-title">${emphasize(title)}</h3>
        <div class="pub-meta">${meta}</div>
      </article>
    `;
  };

  const showLoading = () => {
    listEl.innerHTML =
      '<article class="pub-card pub-status"><header class="pub-head"><span class="pub-year">—</span></header><h3 class="pub-title">Loading publications…</h3><div class="pub-meta">Fetching from ORCID</div></article>';
  };

  const showError = (msg) => {
    listEl.innerHTML = `<article class="pub-card pub-status"><header class="pub-head"><span class="pub-year">—</span></header><h3 class="pub-title">Could not load publications</h3><div class="pub-meta">${escape(
      msg
    )}</div></article>`;
  };

  showLoading();

  fetch(`https://pub.orcid.org/v3.0/${encodeURIComponent(orcidId)}/works`, {
    headers: { Accept: "application/json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`ORCID ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const groups = data.group || [];
      const works = groups
        .map((g) => (g["work-summary"] || [])[0])
        .filter(Boolean);

      if (works.length === 0) {
        showError("No publications found for this ORCID ID.");
        return;
      }

      works.sort((a, b) => getDate(b) - getDate(a));
      const top = works.slice(0, limit);
      listEl.innerHTML = top.map(renderWork).join("");
    })
    .catch((err) => {
      console.error("Publications load failed:", err);
      showError(
        "ORCID API is unreachable. Please try again later or visit the profile directly."
      );
    });
})();
