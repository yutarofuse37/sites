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
          education: "Education",
          experience: "Experience",
          papersHint:
            'See <a href="./papers.html">Papers/Talks</a> and <a href="./slides.html">Slides</a>.',
          papersTitle: "Papers / Talks",
          slidesTitle: "Slides",
          emailLabel: "e-mail",
        }
      : {
          loading: "読み込み中…",
          loadError:
            "内容の読み込みに失敗しました。しばらくしてから再度お試しください。",
          about: "自己紹介",
          education: "学歴",
          experience: "各種経歴",
          papersHint:
            '論文・発表は <a href="./papers.html">Papers/Talks</a>，スライドは <a href="./slides.html">Slides</a> を参照してください。',
          papersTitle: "Papers / Talks",
          slidesTitle: "Slides",
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

  const renderLinks = (links) => {
    if (!links || !links.length) return "";
    return `<span class="pub-links">${links
      .map((link) => {
        const href = safeUrl(link.url);
        if (!href || !link.label) return "";
        return `<a class="badge" href="${escapeHtml(
          href
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          link.label
        )}</a>`;
      })
      .join("")}</span>`;
  };

  const renderVenue = (item) => {
    const venue = item.venue || "";
    if (!venue) return "";
    const href = safeUrl(item.venue_url);
    if (href) {
      return `<a class="pub-venue" href="${escapeHtml(
        href
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(venue)}</a>`;
    }
    return `<span class="pub-venue">${escapeHtml(venue)}</span>`;
  };

  const renderHome = (data, root) => {
    const p = data.profile || {};
    const displayName =
      lang === "en" ? p.name_en || p.name_ja : p.name_ja || p.name_en;
    const intro = (p.intro || [])
      .map((paragraph) => {
        const text =
          typeof paragraph === "string"
            ? paragraph
            : paragraph.paragraph || paragraph.body || "";
        return text ? `<p>${escapeHtml(text)}</p>` : "";
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
      <p class="meta">${escapeHtml(p.affiliation)}<br />${
      copy.emailLabel
    }: ${escapeHtml(p.email)}</p>
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
            const authors = item.authors
              ? `${escapeHtml(item.authors)}: `
              : "";
            const note = item.note
              ? `<div class="pub-note">${escapeHtml(item.note)}</div>`
              : "";
            return `<li>
              <div class="pub-authors">${authors}</div>
              <div class="pub-title"><strong>${escapeHtml(
                item.title
              )}</strong>.</div>
              <div class="pub-venue-line">${renderVenue(item)}</div>
              ${renderLinks(item.links || [])}
              ${note}
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

  const renderSlides = (data, root) => {
    const items = (data.slides || [])
      .map((slide) => {
        const href = safeUrl(slide.url);
        const meta = slide.meta
          ? `<span class="slides__meta">${escapeHtml(slide.meta)}</span>`
          : "";
        const title = href
          ? `<a href="${escapeHtml(
              href
            )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
              slide.title
            )}</a>`
          : escapeHtml(slide.title);
        return `<li>${title}${meta}</li>`;
      })
      .join("");

    root.innerHTML = `<h1>${copy.slidesTitle}</h1><ol class="slides pub-list" reversed>${items}</ol>`;
  };

  // Wire language switcher hrefs if present
  document.querySelectorAll("[data-lang-link]").forEach((el) => {
    const target = el.getAttribute("data-lang-link");
    const page = document.body.dataset.page || "home";
    const file =
      page === "home"
        ? "index.html"
        : page === "papers"
          ? "papers.html"
          : "slides.html";
    el.href = target === "en" ? `${enBase}${file}` : `${base}${file}`;
  });

  const page = document.body.dataset.page;
  const root = document.getElementById("content");
  if (!page || !root) return;

  root.innerHTML = `<p class="meta">${copy.loading}</p>`;

  fetch(dataUrl, { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (page === "home") renderHome(data, root);
      else if (page === "papers") renderPapers(data, root);
      else if (page === "slides") renderSlides(data, root);
    })
    .catch((error) => {
      console.error(error);
      root.innerHTML = `<p class="meta">${copy.loadError}</p>`;
    });
})();
