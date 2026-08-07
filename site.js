(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const lang = document.body.dataset.lang === "en" ? "en" : "ja";
  const dataUrl =
    lang === "en" ? "../data/site.en.json" : "./data/site.json";
  const base = lang === "en" ? "../" : "./";
  const enBase = lang === "en" ? "./" : "./en/";

  const copy =
    lang === "en"
      ? {
          loading: "Loading…",
          loadError: "Failed to load content. Please try again later.",
          about: "About",
          advisors: "Advisors",
          education: "Education",
          experience: "Experience",
          papersHint: 'See <a href="./papers.html">Papers/Talks</a>.',
          papersTitle: "Papers / Talks",
          emailLabel: "e-mail",
        }
      : {
          loading: "読み込み中…",
          loadError:
            "内容の読み込みに失敗しました。しばらくしてから再度お試しください。",
          about: "自己紹介",
          advisors: "指導教員",
          education: "学歴",
          experience: "各種経歴",
          papersHint:
            '論文・発表は <a href="./papers.html">Papers/Talks</a> を参照してください。',
          papersTitle: "Papers / Talks",
          emailLabel: "e-mail",
        };

  const escapeHtml = (text) =>
    String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const safeUrl = (url) => {
    const value = String(url || "").trim();
    if (!value) return "";
    try {
      const parsed = new URL(value, window.location.href);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.href;
      }
    } catch {
      return "";
    }
    return "";
  };

  const renderList = (items) => {
    if (!items || !items.length) return "";
    return `<ul class="list">${items
      .map(
        (item) =>
          `<li><span class="list__date">${escapeHtml(
            item.period
          )}</span><span>${escapeHtml(item.detail)}</span></li>`
      )
      .join("")}</ul>`;
  };

  const pickText = (item, key) => {
    if (!item) return "";
    if (lang === "ja") {
      return item[`${key}_ja`] || item[key] || "";
    }
    return item[key] || item[`${key}_ja`] || "";
  };

  const renderLinks = (item) => {
    const badges = [];
    const links = item.links || [];
    for (const link of links) {
      const href = safeUrl(link.url);
      if (!href || !link.label) continue;
      badges.push(
        `<a class="badge" href="${escapeHtml(
          href
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          link.label
        )}</a>`
      );
    }
    const slideHref = safeUrl(item.slide_url);
    if (slideHref) {
      const label =
        item.slide_label || (lang === "ja" ? "スライド" : "Slides");
      badges.push(
        `<a class="badge badge--slide" href="${escapeHtml(
          slideHref
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
      );
    }
    if (!badges.length) return "";
    return `<span class="pub-links">${badges.join("")}</span>`;
  };

  const renderVenue = (item) => {
    const venue = pickText(item, "venue");
    if (!venue) return "";
    const href = safeUrl(item.venue_url);
    if (href) {
      return `<a class="pub-venue" href="${escapeHtml(
        href
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(venue)}</a>`;
    }
    return `<span class="pub-venue">${escapeHtml(venue)}</span>`;
  };

  const linkifyLabName = (text, labName, labUrl) => {
    const safe = escapeHtml(text);
    if (!labName || !labUrl) return safe;
    const nameEsc = escapeHtml(labName);
    if (!safe.includes(nameEsc)) return safe;
    const href = escapeHtml(labUrl);
    return safe.split(nameEsc).join(
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${nameEsc}</a>`
    );
  };

  const renderAffiliation = (profile) => {
    const labUrl = safeUrl(profile.lab_url);
    return linkifyLabName(
      profile.affiliation || "",
      profile.lab_name || "",
      labUrl
    );
  };

  const renderAdvisors = (advisors) => {
    if (!advisors || !advisors.length) return "";
    const items = advisors
      .map((person) => {
        const name = escapeHtml(person.name || "");
        if (!name) return "";
        const role = person.role ? `（${escapeHtml(person.role)}）` : "";
        const href = safeUrl(person.url);
        const nameHtml = href
          ? `<a href="${escapeHtml(
              href
            )}" target="_blank" rel="noopener noreferrer">${name}</a>`
          : name;
        return `<li>${nameHtml}${role}</li>`;
      })
      .filter(Boolean)
      .join("");
    if (!items) return "";
    return `<section>
      <h2>${copy.advisors}</h2>
      <ul class="list list--plain">${items}</ul>
    </section>`;
  };

  const renderHome = (data, root) => {
    const p = data.profile || {};
    const displayName =
      lang === "en" ? p.name_en || p.name_ja : p.name_ja || p.name_en;
    const labUrl = safeUrl(p.lab_url);
    const intro = (p.intro || [])
      .map((paragraph) => {
        const text =
          typeof paragraph === "string"
            ? paragraph
            : paragraph.paragraph || paragraph.body || "";
        return text
          ? `<p>${linkifyLabName(text, p.lab_name || "", labUrl)}</p>`
          : "";
      })
      .join("");

    const experience = (data.experience || [])
      .map(
        (group) =>
          `<h3>${escapeHtml(group.title)}</h3>${renderList(group.items || [])}`
      )
      .join("");

    root.innerHTML = `
      <h1>${escapeHtml(displayName)}</h1>
      <p class="meta">${renderAffiliation(p)}<br />${
      copy.emailLabel
    }: ${escapeHtml(p.email)}</p>
      ${renderAdvisors(data.advisors)}
      <section>
        <h2>${copy.about}</h2>
        ${intro}
        <p>${copy.papersHint}</p>
      </section>
      <section>
        <h2>${copy.education}</h2>
        ${renderList(data.education || [])}
      </section>
      <section>
        <h2>${copy.experience}</h2>
        ${experience}
      </section>
    `;

    document.title = `${displayName} — Yutaro Fuse`;
    if (p.description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", p.description);
    }
  };

  const renderPapers = (data, root) => {
    const sections = (data.paper_sections || [])
      .map((section) => {
        const items = (section.items || [])
          .map((item) => {
            const authors = pickText(item, "authors");
            const title = pickText(item, "title");
            const note = pickText(item, "note");
            const authorsHtml = authors ? `${escapeHtml(authors)}: ` : "";
            const noteHtml = note
              ? `<div class="pub-note">${escapeHtml(note)}</div>`
              : "";
            return `<li>
              <div class="pub-authors">${authorsHtml}</div>
              <div class="pub-title"><strong>${escapeHtml(
                title
              )}</strong>.</div>
              <div class="pub-venue-line">${renderVenue(item)}</div>
              ${renderLinks(item)}
              ${noteHtml}
            </li>`;
          })
          .join("");
        return `<section>
          <h2>${escapeHtml(section.title)}</h2>
          <ol class="pub-list" reversed>${items}</ol>
        </section>`;
      })
      .join("");

    root.innerHTML = `<h1>${copy.papersTitle}</h1>${sections}`;
  };

  const papersUrl =
    lang === "en" ? "../data/papers.json" : "./data/papers.json";

  // Wire language switcher hrefs if present
  document.querySelectorAll("[data-lang-link]").forEach((el) => {
    const target = el.getAttribute("data-lang-link");
    const page = document.body.dataset.page || "home";
    const file = page === "papers" ? "papers.html" : "index.html";
    el.href = target === "en" ? `${enBase}${file}` : `${base}${file}`;
  });

  const page = document.body.dataset.page;
  const root = document.getElementById("content");
  if (!page || !root) return;

  root.innerHTML = `<p class="meta">${copy.loading}</p>`;

  const loadJson = (url) =>
    fetch(url, { cache: "no-cache" }).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

  if (page === "papers") {
    loadJson(papersUrl)
      .then((data) => renderPapers(data, root))
      .catch((error) => {
        console.error(error);
        root.innerHTML = `<p class="meta">${copy.loadError}</p>`;
      });
  } else if (page === "home") {
    loadJson(dataUrl)
      .then((data) => renderHome(data, root))
      .catch((error) => {
        console.error(error);
        root.innerHTML = `<p class="meta">${copy.loadError}</p>`;
      });
  }
})();
