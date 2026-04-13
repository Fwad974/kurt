/**
 * News page: pull markdown files from the news/ folder and render them
 * into the .ed-list. Each file is a standalone news item with a small
 * YAML-style front matter block:
 *
 *   ---
 *   title: Cardiac organoid programme enters _Vol. 01_
 *   date: 2026-03
 *   tag: milestone
 *   summary: Research milestone · first volume of the atlas published
 *   ---
 *
 * Dropping a new .md file into news/ is enough — it shows up
 * automatically on the next page load.
 *
 * Discovery uses the GitHub contents API so no manifest edit is needed.
 * If the API is unreachable (rate limit, local preview over file://),
 * we fall back to reading news/index.json as a manifest.
 */
(function () {
  const listEl = document.querySelector(".ed-list");
  if (!listEl) return;

  const cfg = window.SITE_CONFIG || {};
  const repo = cfg.githubRepo || "";
  const branch = cfg.githubBranch || "main";
  const folder = cfg.newsFolder || "news";

  /* ---------- helpers ---------- */

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

  const parseFrontMatter = (text) => {
    const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
    if (!m) return { meta: {}, body: text };
    const meta = {};
    m[1].split(/\r?\n/).forEach((line) => {
      const kv = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
      if (!kv) return;
      let val = kv[2];
      // Strip surrounding single or double quotes if present
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      meta[kv[1].toLowerCase()] = val;
    });
    return { meta, body: m[2] };
  };

  // Accept "2026-03", "2026/03", "2026-03-15" and build a sort score.
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

  /* ---------- discovery ---------- */

  const fetchText = (url) =>
    fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url} → ${r.status}`);
      return r.text();
    });

  const discoverViaGithub = () => {
    if (!repo) return Promise.reject(new Error("githubRepo not configured"));
    const url = `https://api.github.com/repos/${repo}/contents/${folder}?ref=${encodeURIComponent(
      branch
    )}`;
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`);
        return r.json();
      })
      .then((items) =>
        items
          .filter((i) => i.type === "file" && /\.md$/i.test(i.name))
          .map((i) => ({
            name: i.name,
            url: i.download_url || `${folder}/${i.name}`,
          }))
      );
  };

  const discoverViaManifest = () =>
    fetchText(`${folder}/index.json`)
      .then((txt) => JSON.parse(txt))
      .then((names) =>
        (Array.isArray(names) ? names : [])
          .filter((n) => /\.md$/i.test(n))
          .map((n) => ({ name: n, url: `${folder}/${n}` }))
      );

  const discoverFiles = () =>
    discoverViaGithub().catch((e) => {
      console.warn("News: falling back to manifest —", e.message);
      return discoverViaManifest();
    });

  /* ---------- rendering ---------- */

  const renderItem = (item) => {
    const meta = item.meta;
    const year = formatYearMonth(meta.date);
    const rawTag = (meta.tag || "news").toLowerCase();
    const tagLabel = capitalize(rawTag);
    const title = applyTitleEmphasis(escapeHtml(meta.title || "Untitled"));
    const summary = escapeHtml(meta.summary || "");
    return `
      <div class="ed-item rv" data-tag="${escapeHtml(rawTag)}">
        <div class="year">${escapeHtml(year)}</div>
        <div class="body">
          <h3>${title}</h3>
          <div class="meta-line">${summary}</div>
        </div>
        <div class="tag">${escapeHtml(tagLabel)}</div>
      </div>
    `;
  };

  const showStatus = (msg) => {
    listEl.innerHTML = `<div class="mono" style="color:var(--muted); padding:24px 0; font-family:'JetBrains Mono',monospace; font-size:.7rem; letter-spacing:.08em">${escapeHtml(
      msg
    )}</div>`;
  };

  const renderAll = (items) => {
    if (!items.length) {
      showStatus("No news items yet.");
      return;
    }
    listEl.innerHTML = items.map(renderItem).join("");
    // The site uses IntersectionObserver on .rv elements to reveal them
    // on scroll. Those observers already ran before we injected content,
    // so trigger the reveal immediately for the new nodes.
    listEl.querySelectorAll(".ed-item.rv").forEach((el) => el.classList.add("in"));
  };

  /* ---------- go ---------- */

  showStatus("Loading news…");

  discoverFiles()
    .then((files) =>
      Promise.allSettled(
        files.map((f) =>
          fetchText(f.url).then((text) => ({
            ...parseFrontMatter(text),
            name: f.name,
          }))
        )
      )
    )
    .then((results) => {
      const items = results
        .filter(
          (r) =>
            r.status === "fulfilled" &&
            r.value &&
            r.value.meta &&
            r.value.meta.date
        )
        .map((r) => r.value);
      items.sort(
        (a, b) => sortScore(b.meta.date) - sortScore(a.meta.date)
      );
      renderAll(items);
    })
    .catch((err) => {
      console.error("News load failed:", err);
      showStatus("Could not load news. Please try again later.");
    });
})();
