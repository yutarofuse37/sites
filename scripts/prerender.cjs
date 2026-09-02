#!/usr/bin/env node
/**
 * Prerender home/papers content into static HTML so crawlers see real text
 * without waiting for client-side JS. site.js still replaces #content at runtime.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const escapeHtml = (text) =>
  String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const safeUrl = (url, base = "https://yutarofuse37.github.io/sites/") => {
  const value = String(url || "").trim();
  if (!value) return "";
  try {
    const parsed = new URL(value, base);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return "";
  }
  return "";
};

const mediaUrl = (url, lang) => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return safeUrl(value);
  const relative = value.replace(/^\.?\//, "");
  const encoded = relative
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return lang === "en" ? `../${encoded}` : `./${encoded}`;
};

const pickText = (item, key, lang) => {
  if (!item) return "";
  if (lang === "ja") return item[`${key}_ja`] || item[key] || "";
  return item[key] || item[`${key}_ja`] || "";
};

const linkifyLabName = (text, labName, labUrl) => {
  const safe = escapeHtml(text);
  if (!labName || !labUrl) return safe;
  const nameEsc = escapeHtml(labName);
  if (!safe.includes(nameEsc)) return safe;
  const href = escapeHtml(labUrl);
  return safe
    .split(nameEsc)
    .join(
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${nameEsc}</a>`
    );
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

const renderAdvisorNames = (advisors, lang) => {
  if (!advisors || !advisors.length) return "";
  const label = lang === "ja" ? "指導教員" : "Advisor";
  const names = advisors
    .map((person) => {
      const name = escapeHtml(person.name || "");
      if (!name) return "";
      const href = safeUrl(person.url);
      return href
        ? `<a href="${escapeHtml(
            href
          )}" target="_blank" rel="noopener noreferrer">${name}</a>`
        : name;
    })
    .filter(Boolean);
  if (!names.length) return "";
  const joiner = lang === "ja" ? "，" : ", ";
  return `<div class="list__advisor">${label}: ${names.join(joiner)}</div>`;
};

const renderEducation = (items, lang) => {
  if (!items || !items.length) return "";
  return `<ul class="list">${items
    .map((item) => {
      const advisorsHtml = renderAdvisorNames(item.advisors, lang);
      return `<li><span class="list__date">${escapeHtml(
        item.period
      )}</span><span>${escapeHtml(item.detail)}${advisorsHtml}</span></li>`;
    })
    .join("")}</ul>`;
};

const renderLinkMap = (links, lang) => {
  if (!links || !links.length) return "";
  const title = lang === "ja" ? "リンクマップ" : "Links";
  const items = links
    .map((link) => {
      const label = escapeHtml(link.label || "");
      const href = safeUrl(link.url);
      if (!label || !href) return "";
      return `<li><a href="${escapeHtml(
        href
      )}" target="_blank" rel="noopener noreferrer">${label}</a></li>`;
    })
    .filter(Boolean)
    .join("");
  if (!items) return "";
  return `<h3>${title}</h3><ul class="link-map">${items}</ul>`;
};

const renderPhoto = (profile, lang) => {
  const src = mediaUrl(profile.photo, lang);
  const alt =
    lang === "ja"
      ? "黒板に書かれた数式の図"
      : "Mathematical diagram on a chalkboard";
  if (src) {
    return `<img class="hero__bg" src="${escapeHtml(src)}" alt="${escapeHtml(
      alt
    )}" width="890" height="1188" loading="eager" decoding="async" />`;
  }
  return `<div class="hero__bg hero__bg--empty" aria-hidden="true"></div>`;
};

const renderHome = (data, lang) => {
  const p = data.profile || {};
  const displayName =
    lang === "en" ? p.name_en || p.name_ja : p.name_ja || p.name_en;
  const labUrl = safeUrl(p.lab_url);
  const about = lang === "ja" ? "自己紹介" : "About";
  const education = lang === "ja" ? "学歴" : "Education";
  const experience = lang === "ja" ? "各種経歴" : "Experience";
  const emailLabel = "e-mail";
  const papersHint =
    lang === "ja"
      ? '論文・発表は <a href="./papers.html">Papers/Talks</a> を参照してください。'
      : 'See <a href="./papers.html">Papers/Talks</a>.';

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

  const experienceHtml = (data.experience || [])
    .map(
      (group) =>
        `<h3>${escapeHtml(group.title)}</h3>${renderList(group.items || [])}`
    )
    .join("");

  const urlNote = String(p.url_note || "").trim();
  const urlNoteHtml = urlNote
    ? `<p class="site-note">${escapeHtml(urlNote)}</p>`
    : "";

  return `
      <header class="hero">
        ${renderPhoto(p, lang)}
        <div class="hero__veil" aria-hidden="true"></div>
        <div class="hero__copy">
          <h1>${escapeHtml(displayName)}</h1>
          <p class="meta">${escapeHtml(p.affiliation || "")}<br />${emailLabel}: ${escapeHtml(
    p.email
  )}</p>
        </div>
      </header>
      <div class="page-body">
        <section>
          <h2>${about}</h2>
          ${intro}
          ${renderLinkMap(data.links, lang)}
          <p>${papersHint}</p>
        </section>
        <section>
          <h2>${education}</h2>
          ${renderEducation(data.education || [], lang)}
        </section>
        <section>
          <h2>${experience}</h2>
          ${experienceHtml}
        </section>
        ${urlNoteHtml}
      </div>
    `;
};

const renderLinks = (item, lang) => {
  const badges = [];
  for (const link of item.links || []) {
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

const renderVenue = (item, lang) => {
  const venue = pickText(item, "venue", lang);
  if (!venue) return "";
  const href = safeUrl(item.venue_url);
  if (href) {
    return `<a class="pub-venue" href="${escapeHtml(
      href
    )}" target="_blank" rel="noopener noreferrer">${escapeHtml(venue)}</a>`;
  }
  return `<span class="pub-venue">${escapeHtml(venue)}</span>`;
};

const renderPapers = (data, lang) => {
  const title = "Papers / Talks";
  const sections = (data.paper_sections || [])
    .map((section) => {
      const items = (section.items || [])
        .map((item) => {
          const authors = pickText(item, "authors", lang);
          const paperTitle = pickText(item, "title", lang);
          const note = pickText(item, "note", lang);
          const authorsHtml = authors ? `${escapeHtml(authors)}: ` : "";
          const noteHtml = note
            ? `<div class="pub-note">${escapeHtml(note)}</div>`
            : "";
          return `<li>
              <div class="pub-authors">${authorsHtml}</div>
              <div class="pub-title"><strong>${escapeHtml(
                paperTitle
              )}</strong>.</div>
              <div class="pub-venue-line">${renderVenue(item, lang)}</div>
              ${renderLinks(item, lang)}
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
  return `<h1>${title}</h1>${sections}`;
};

const injectContent = (htmlPath, contentHtml, pageClass = "page") => {
  const absolute = path.join(root, htmlPath);
  let html = fs.readFileSync(absolute, "utf8");
  const replacement = `<main class="${pageClass}" id="content">${contentHtml}\n    </main>`;
  if (!/<main class="page(?: page--home)?" id="content">/.test(html)) {
    throw new Error(`Missing content main in ${htmlPath}`);
  }
  html = html.replace(
    /<main class="page(?: page--home)?" id="content">[\s\S]*?<\/main>/,
    replacement
  );
  // Drop noscript duplicate once real content is present
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>\s*/g, "");
  fs.writeFileSync(absolute, html);
  console.log("prerendered", htmlPath);
};

const siteJa = JSON.parse(
  fs.readFileSync(path.join(root, "data/site.json"), "utf8")
);
const siteEn = JSON.parse(
  fs.readFileSync(path.join(root, "data/site.en.json"), "utf8")
);
const papers = JSON.parse(
  fs.readFileSync(path.join(root, "data/papers.json"), "utf8")
);

injectContent("index.html", renderHome(siteJa, "ja"), "page page--home");
injectContent("en/index.html", renderHome(siteEn, "en"), "page page--home");
injectContent("papers.html", renderPapers(papers, "ja"));
injectContent("en/papers.html", renderPapers(papers, "en"));
