(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const escapeHtml = (text) =>
    String(text ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

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

  const renderHome = (data, root) => {
    const p = data.profile || {};
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
      <h1>${escapeHtml(p.name_ja)}</h1>
      <p class="meta">${escapeHtml(p.affiliation)}<br />e-mail: ${escapeHtml(
      p.email
    )}</p>
      <section>
        <h2>自己紹介</h2>
        ${intro}
        <p>論文・発表は <a href="./papers.html">Papers/Talks</a>，スライドは <a href="./slides.html">Slides</a> を参照してください。</p>
      </section>
      <section>
        <h2>学歴</h2>
        ${renderList(data.education || [])}
      </section>
      <section>
        <h2>各種経歴</h2>
        ${experience}
      </section>
    `;

    if (p.name_en || p.name_ja) {
      document.title = `${p.name_ja || p.name_en} — ${p.name_en || ""}`.replace(
        /\s—\s$/,
        ""
      );
    }
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
              ? `${escapeHtml(item.authors)}<br />`
              : "";
            const venue = item.venue
              ? `<br /><em>${escapeHtml(item.venue)}</em>`
              : "";
            const note = item.note ? `<br />${escapeHtml(item.note)}` : "";
            return `<article class="pub"><p>${authors}<strong>${escapeHtml(
              item.title
            )}</strong>${venue}${note}</p></article>`;
          })
          .join("");
        return `<section><h2>${escapeHtml(section.title)}</h2>${items}</section>`;
      })
      .join("");

    root.innerHTML = `<h1>Papers / Talks</h1>${sections}`;
  };

  const renderSlides = (data, root) => {
    const items = (data.slides || [])
      .map((slide) => {
        const meta = slide.meta
          ? `<span class="slides__meta">${escapeHtml(slide.meta)}</span>`
          : "";
        return `<li><a href="${escapeHtml(
          slide.url
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          slide.title
        )}</a>${meta}</li>`;
      })
      .join("");

    root.innerHTML = `<h1>Slides</h1><ul class="slides">${items}</ul>`;
  };

  const page = document.body.dataset.page;
  const root = document.getElementById("content");
  if (!page || !root) return;

  root.innerHTML = `<p class="meta">読み込み中…</p>`;

  fetch("./data/site.json", { cache: "no-cache" })
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
      root.innerHTML =
        `<p class="meta">内容の読み込みに失敗しました。しばらくしてから再度お試しください。</p>`;
    });
})();
