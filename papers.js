(() => {
  const permalink = (window.SITE_CONFIG && window.SITE_CONFIG.researchmapPermalink || "").trim();
  const root = document.getElementById("papers-root");
  const status = document.getElementById("papers-status");
  const fallback = document.getElementById("papers-fallback");

  if (!root) return;

  if (!permalink) {
    if (status) status.hidden = true;
    return;
  }

  const API = "https://api.researchmap.jp";

  const pickLang = (obj, preferred = ["ja", "en"]) => {
    if (!obj || typeof obj !== "object") return "";
    for (const lang of preferred) {
      if (typeof obj[lang] === "string" && obj[lang].trim()) return obj[lang];
      if (Array.isArray(obj[lang])) return obj[lang];
    }
    for (const value of Object.values(obj)) {
      if (typeof value === "string" && value.trim()) return value;
      if (Array.isArray(value)) return value;
    }
    return "";
  };

  const namesFrom = (people) => {
    const list = pickLang(people);
    if (!Array.isArray(list)) return "";
    return list.map((p) => p.name).filter(Boolean).join(", ");
  };

  const escapeHtml = (text) =>
    String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const formatPaper = (item) => {
    const title = pickLang(item.paper_title) || "(無題)";
    const authors = namesFrom(item.authors);
    const venue = pickLang(item.publication_name);
    const date = item.publication_date || "";
    const volume = item.volume ? `Vol. ${item.volume}` : "";
    const number = item.number ? `No. ${item.number}` : "";
    const pages =
      item.starting_page || item.ending_page
        ? `pp. ${item.starting_page || ""}–${item.ending_page || ""}`
        : "";
    const meta = [venue, volume, number, date, pages].filter(Boolean).join(", ");
    const doi = item.identifiers && item.identifiers.doi && item.identifiers.doi[0];
    const doiHtml = doi
      ? `<br /><a href="https://doi.org/${escapeHtml(doi)}" target="_blank" rel="noopener noreferrer">doi:${escapeHtml(doi)}</a>`
      : "";

    return `<article class="pub"><p>${
      authors ? `${escapeHtml(authors)}<br />` : ""
    }<strong>${escapeHtml(title)}</strong>${
      meta ? `<br /><em>${escapeHtml(meta)}</em>` : ""
    }${doiHtml}</p></article>`;
  };

  const formatPresentation = (item) => {
    const title = pickLang(item.presentation_title) || "(無題)";
    const presenters = namesFrom(item.presenters);
    const event = pickLang(item.event);
    const date = item.publication_date || "";
    const invited = item.invited ? "（招待講演）" : "";
    const intl = item.is_international_presentation ? "（国際）" : "";
    const meta = [event, date, invited, intl].filter(Boolean).join("，");

    return `<article class="pub"><p>${
      presenters ? `${escapeHtml(presenters)}<br />` : ""
    }<strong>${escapeHtml(title)}</strong>${
      meta ? `<br />${escapeHtml(meta)}` : ""
    }</p></article>`;
  };

  const paperTypeLabel = {
    scientific_journal: "Journal Papers",
    international_conference_proceedings: "International Conference Proceedings",
    research_society: "Research Society",
    symposium: "Symposium",
    other: "Other Papers",
  };

  const fetchAll = async (path) => {
    const items = [];
    let start = 1;
    const limit = 100;
    for (;;) {
      const url = `${API}/${encodeURIComponent(permalink)}/${path}?limit=${limit}&start=${start}&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
      const data = await res.json();
      const batch = data.items || [];
      items.push(...batch);
      if (!batch.length || items.length >= (data.total_items || items.length)) break;
      start += limit;
    }
    return items;
  };

  const render = (papers, presentations) => {
    const groups = new Map();
    for (const paper of papers) {
      const type = paper.published_paper_type || "other";
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(paper);
    }

    const preferredOrder = [
      "scientific_journal",
      "international_conference_proceedings",
      "symposium",
      "research_society",
      "other",
    ];

    let html = "";
    for (const type of preferredOrder) {
      const list = groups.get(type);
      if (!list || !list.length) continue;
      html += `<section><h2>${escapeHtml(paperTypeLabel[type] || type)}</h2>${list
        .map(formatPaper)
        .join("")}</section>`;
      groups.delete(type);
    }
    for (const [type, list] of groups) {
      html += `<section><h2>${escapeHtml(paperTypeLabel[type] || type)}</h2>${list
        .map(formatPaper)
        .join("")}</section>`;
    }

    if (presentations.length) {
      html += `<section><h2>Presentations / Talks</h2>${presentations
        .map(formatPresentation)
        .join("")}</section>`;
    }

    html += `<p class="meta">researchmap から自動取得（<a href="https://researchmap.jp/${encodeURIComponent(
      permalink
    )}" target="_blank" rel="noopener noreferrer">${escapeHtml(permalink)}</a>）</p>`;

    root.innerHTML = html;
    if (fallback) fallback.hidden = true;
    if (status) {
      status.textContent = "";
      status.hidden = true;
    }
  };

  (async () => {
    try {
      if (status) {
        status.hidden = false;
        status.textContent = "researchmap から業績を読み込み中…";
      }
      const [papers, presentations] = await Promise.all([
        fetchAll("published_papers"),
        fetchAll("presentations"),
      ]);
      if (!papers.length && !presentations.length) {
        throw new Error("業績がありません");
      }
      render(papers, presentations);
    } catch (error) {
      console.error(error);
      if (status) {
        status.hidden = false;
        status.textContent =
          "researchmap からの取得に失敗したため、手書きの一覧を表示しています。";
      }
    }
  })();
})();
