(() => {
  const REPO = "yutarofuse37/sites";
  const BRANCH = "main";
  const TOKEN_KEY = "sites_github_token";

  const loginView = document.getElementById("login-view");
  const editorView = document.getElementById("editor-view");
  const tokenInput = document.getElementById("token-input");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginError = document.getElementById("login-error");
  const saveBtn = document.getElementById("save-btn");
  const statusEl = document.getElementById("status");
  const langJaBtn = document.getElementById("lang-ja");
  const langEnBtn = document.getElementById("lang-en");

  const panels = {
    profile: document.getElementById("panel-profile"),
    education: document.getElementById("panel-education"),
    experience: document.getElementById("panel-experience"),
    papers: document.getElementById("panel-papers"),
    slides: document.getElementById("panel-slides"),
  };

  let token = localStorage.getItem(TOKEN_KEY) || "";
  let fileSha = "";
  let data = null;
  let editLang = "ja";

  const filePath = () =>
    editLang === "en" ? "data/site.en.json" : "data/site.json";

  const api = async (path, options = {}) => {
    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { message: text };
    }
    if (!res.ok) {
      const message = body && body.message ? body.message : `HTTP ${res.status}`;
      throw new Error(message);
    }
    return body;
  };

  const setStatus = (message, isError = false) => {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#8e0000" : "#555";
  };

  const showLogin = (errorMessage = "") => {
    loginView.hidden = false;
    editorView.hidden = true;
    logoutBtn.hidden = true;
    if (errorMessage) {
      loginError.hidden = false;
      loginError.textContent = errorMessage;
    } else {
      loginError.hidden = true;
      loginError.textContent = "";
    }
  };

  const showEditor = () => {
    loginView.hidden = true;
    editorView.hidden = false;
    logoutBtn.hidden = false;
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const field = (label, name, value, multiline = false) => {
    const safe = escapeHtml(value);
    if (multiline) {
      return `<label class="field"><span>${escapeHtml(
        label
      )}</span><textarea data-name="${escapeHtml(
        name
      )}">${safe}</textarea></label>`;
    }
    return `<label class="field"><span>${escapeHtml(
      label
    )}</span><input data-name="${escapeHtml(name)}" value="${safe}" /></label>`;
  };

  const renderProfile = () => {
    const p = data.profile || {};
    const introText = (p.intro || [])
      .map((item) => (typeof item === "string" ? item : item.paragraph || ""))
      .join("\n\n");
    panels.profile.innerHTML = `
      <h2>プロフィール</h2>
      ${field("氏名（日本語）", "name_ja", p.name_ja || "")}
      ${field("氏名（英語）", "name_en", p.name_en || "")}
      ${field("所属", "affiliation", p.affiliation || "")}
      ${field("メール（表示用・リンクなし）", "email", p.email || "")}
      ${field("サイト説明（SEO）", "description", p.description || "", true)}
      ${field("自己紹介（段落は空行で区切る）", "intro", introText, true)}
    `;
  };

  const renderEducation = () => {
    const items = data.education || [];
    panels.education.innerHTML = `
      <h2>学歴</h2>
      <div id="education-list"></div>
      <button type="button" class="btn btn--small" data-add="education">＋ 追加</button>
    `;
    const list = panels.education.querySelector("#education-list");
    list.innerHTML = items
      .map(
        (item, index) => `
      <div class="item-card" data-index="${index}">
        ${field("期間", "period", item.period || "")}
        ${field("内容", "detail", item.detail || "", true)}
        <div class="row-actions">
          <button type="button" class="btn btn--small btn--danger" data-remove="education" data-index="${index}">削除</button>
        </div>
      </div>`
      )
      .join("");
  };

  const renderExperience = () => {
    const groups = data.experience || [];
    panels.experience.innerHTML = `
      <h2>各種経歴</h2>
      <div id="experience-list"></div>
      <button type="button" class="btn btn--small" data-add="experience-group">＋ グループ追加</button>
    `;
    const list = panels.experience.querySelector("#experience-list");
    list.innerHTML = groups
      .map((group, gi) => {
        const items = (group.items || [])
          .map(
            (item, ii) => `
          <div class="item-card" data-g="${gi}" data-i="${ii}">
            ${field("期間", "period", item.period || "")}
            ${field("内容", "detail", item.detail || "", true)}
            <div class="row-actions">
              <button type="button" class="btn btn--small btn--danger" data-remove="experience-item" data-g="${gi}" data-i="${ii}">削除</button>
            </div>
          </div>`
          )
          .join("");
        return `
          <div class="item-card" data-g="${gi}">
            ${field("見出し", "title", group.title || "")}
            <h3>項目</h3>
            ${items}
            <div class="row-actions">
              <button type="button" class="btn btn--small" data-add="experience-item" data-g="${gi}">＋ 項目追加</button>
              <button type="button" class="btn btn--small btn--danger" data-remove="experience-group" data-g="${gi}">グループ削除</button>
            </div>
          </div>`;
      })
      .join("");
  };

  const renderPapers = () => {
    const sections = data.paper_sections || [];
    panels.papers.innerHTML = `
      <h2>Papers / Talks</h2>
      <p class="status">会場URLを入れると会場名がリンクになります。追加リンクは「表示名|URL」を1行ずつ。</p>
      <div id="papers-list"></div>
      <button type="button" class="btn btn--small" data-add="paper-section">＋ セクション追加</button>
    `;
    const list = panels.papers.querySelector("#papers-list");
    list.innerHTML = sections
      .map((section, si) => {
        const items = (section.items || [])
          .map((item, ii) => {
            const linksText = (item.links || [])
              .map((link) => `${link.label || ""}|${link.url || ""}`)
              .join("\n");
            return `
          <div class="item-card" data-s="${si}" data-i="${ii}">
            ${field("著者", "authors", item.authors || "")}
            ${field("タイトル", "title", item.title || "")}
            ${field("掲載先・会議名など", "venue", item.venue || "", true)}
            ${field("会場 / 会議 HP URL", "venue_url", item.venue_url || "")}
            ${field("追加リンク（表示名|URL）", "links", linksText, true)}
            ${field("補足", "note", item.note || "", true)}
            <div class="row-actions">
              <button type="button" class="btn btn--small btn--danger" data-remove="paper-item" data-s="${si}" data-i="${ii}">削除</button>
            </div>
          </div>`;
          })
          .join("");
        return `
          <div class="item-card" data-s="${si}">
            ${field("セクション名", "title", section.title || "")}
            <h3>業績</h3>
            ${items}
            <div class="row-actions">
              <button type="button" class="btn btn--small" data-add="paper-item" data-s="${si}">＋ 業績追加</button>
              <button type="button" class="btn btn--small btn--danger" data-remove="paper-section" data-s="${si}">セクション削除</button>
            </div>
          </div>`;
      })
      .join("");
  };

  const renderSlides = () => {
    const items = data.slides || [];
    panels.slides.innerHTML = `
      <h2>Slides</h2>
      <div id="slides-list"></div>
      <button type="button" class="btn btn--small" data-add="slide">＋ 追加</button>
    `;
    const list = panels.slides.querySelector("#slides-list");
    list.innerHTML = items
      .map(
        (item, index) => `
      <div class="item-card" data-index="${index}">
        ${field("タイトル", "title", item.title || "")}
        ${field("URL", "url", item.url || "")}
        ${field("補足", "meta", item.meta || "")}
        <div class="row-actions">
          <button type="button" class="btn btn--small btn--danger" data-remove="slide" data-index="${index}">削除</button>
        </div>
      </div>`
      )
      .join("");
  };

  const renderAll = () => {
    renderProfile();
    renderEducation();
    renderExperience();
    renderPapers();
    renderSlides();
  };

  const readFields = (root) => {
    const result = {};
    root.querySelectorAll("[data-name]").forEach((el) => {
      result[el.dataset.name] = el.value;
    });
    return result;
  };

  const collectData = () => {
    const profileRoot = panels.profile;
    const profileFields = readFields(profileRoot);
    const intro = profileFields.intro
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    const education = [...panels.education.querySelectorAll(".item-card")].map(
      (card) => {
        const f = readFields(card);
        return { period: f.period || "", detail: f.detail || "" };
      }
    );

    const experience = [];
    panels.experience.querySelectorAll(":scope > #experience-list > .item-card").forEach((groupCard) => {
      const title = groupCard.querySelector('[data-name="title"]')?.value || "";
      const items = [...groupCard.querySelectorAll(".item-card")].map((card) => {
        const f = readFields(card);
        return { period: f.period || "", detail: f.detail || "" };
      });
      experience.push({ title, items });
    });

    const paper_sections = [];
    panels.papers.querySelectorAll(":scope > #papers-list > .item-card").forEach((sectionCard) => {
      const title = sectionCard.querySelector('[data-name="title"]')?.value || "";
      const items = [...sectionCard.querySelectorAll(".item-card")].map((card) => {
        const f = readFields(card);
        const links = String(f.links || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [label, ...rest] = line.split("|");
            return {
              label: (label || "").trim(),
              url: rest.join("|").trim(),
            };
          })
          .filter((link) => link.label && link.url);
        return {
          authors: f.authors || "",
          title: f.title || "",
          venue: f.venue || "",
          venue_url: f.venue_url || "",
          links,
          note: f.note || "",
        };
      });
      paper_sections.push({ title, items });
    });

    const slides = [...panels.slides.querySelectorAll(".item-card")].map((card) => {
      const f = readFields(card);
      return {
        title: f.title || "",
        url: f.url || "",
        meta: f.meta || "",
      };
    });

    return {
      profile: {
        name_ja: profileFields.name_ja || "",
        name_en: profileFields.name_en || "",
        affiliation: profileFields.affiliation || "",
        email: profileFields.email || "",
        description: profileFields.description || "",
        intro,
      },
      education,
      experience,
      paper_sections,
      slides,
    };
  };

  const loadContent = async () => {
    setStatus(`GitHub から読み込み中…（${filePath()}）`);
    const file = await api(
      `/repos/${REPO}/contents/${filePath()}?ref=${encodeURIComponent(BRANCH)}`
    );
    fileSha = file.sha;
    const decoded = decodeURIComponent(
      Array.prototype.map
        .call(atob(file.content.replace(/\n/g, "")), (c) =>
          "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    );
    data = JSON.parse(decoded);
    renderAll();
    setStatus(
      `編集中: ${filePath()} 。保存するとサイトに反映されます。`
    );
  };

  const saveContent = async () => {
    data = collectData();
    const json = JSON.stringify(data, null, 2) + "\n";
    const content = btoa(unescape(encodeURIComponent(json)));
    setStatus("保存中…");
    saveBtn.disabled = true;
    try {
      const result = await api(`/repos/${REPO}/contents/${filePath()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Update ${filePath()} via admin UI`,
          content,
          sha: fileSha,
          branch: BRANCH,
        }),
      });
      fileSha = result.content.sha;
      setStatus("保存しました。数分後にサイトへ反映されます。");
    } catch (error) {
      setStatus(`保存に失敗しました: ${error.message}`, true);
    } finally {
      saveBtn.disabled = false;
    }
  };

  const login = async () => {
    token = tokenInput.value.trim();
    if (!token) {
      showLogin("トークンを入力してください。");
      return;
    }
    loginBtn.disabled = true;
    loginError.hidden = true;
    try {
      await api("/user");
      localStorage.setItem(TOKEN_KEY, token);
      showEditor();
      await loadContent();
    } catch (error) {
      token = "";
      localStorage.removeItem(TOKEN_KEY);
      showLogin(
        `ログインに失敗しました: ${error.message}（Contents: Read and write 権限があるか確認してください）`
      );
    } finally {
      loginBtn.disabled = false;
    }
  };

  const logout = () => {
    token = "";
    fileSha = "";
    data = null;
    localStorage.removeItem(TOKEN_KEY);
    tokenInput.value = "";
    showLogin();
  };

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      const name = tab.dataset.tab;
      Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== name;
      });
    });
  });

  editorView.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn || !data) return;

    if (btn.dataset.add === "education") {
      data = collectData();
      data.education.push({ period: "", detail: "" });
      renderEducation();
    }
    if (btn.dataset.remove === "education") {
      data = collectData();
      data.education.splice(Number(btn.dataset.index), 1);
      renderEducation();
    }
    if (btn.dataset.add === "experience-group") {
      data = collectData();
      data.experience.push({ title: "", items: [{ period: "", detail: "" }] });
      renderExperience();
    }
    if (btn.dataset.remove === "experience-group") {
      data = collectData();
      data.experience.splice(Number(btn.dataset.g), 1);
      renderExperience();
    }
    if (btn.dataset.add === "experience-item") {
      data = collectData();
      data.experience[Number(btn.dataset.g)].items.push({ period: "", detail: "" });
      renderExperience();
    }
    if (btn.dataset.remove === "experience-item") {
      data = collectData();
      data.experience[Number(btn.dataset.g)].items.splice(Number(btn.dataset.i), 1);
      renderExperience();
    }
    if (btn.dataset.add === "paper-section") {
      data = collectData();
      data.paper_sections.push({
        title: "",
        items: [{ authors: "", title: "", venue: "", venue_url: "", links: [], note: "" }],
      });
      renderPapers();
    }
    if (btn.dataset.remove === "paper-section") {
      data = collectData();
      data.paper_sections.splice(Number(btn.dataset.s), 1);
      renderPapers();
    }
    if (btn.dataset.add === "paper-item") {
      data = collectData();
      data.paper_sections[Number(btn.dataset.s)].items.push({
        authors: "",
        title: "",
        venue: "",
        venue_url: "",
        links: [],
        note: "",
      });
      renderPapers();
    }
    if (btn.dataset.remove === "paper-item") {
      data = collectData();
      data.paper_sections[Number(btn.dataset.s)].items.splice(Number(btn.dataset.i), 1);
      renderPapers();
    }
    if (btn.dataset.add === "slide") {
      data = collectData();
      data.slides.push({ title: "", url: "", meta: "" });
      renderSlides();
    }
    if (btn.dataset.remove === "slide") {
      data = collectData();
      data.slides.splice(Number(btn.dataset.index), 1);
      renderSlides();
    }
  });

  loginBtn.addEventListener("click", login);
  logoutBtn.addEventListener("click", logout);
  saveBtn.addEventListener("click", saveContent);
  tokenInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") login();
  });

  const switchEditLang = async (nextLang) => {
    if (nextLang === editLang) return;
    editLang = nextLang;
    langJaBtn.classList.toggle("is-active", editLang === "ja");
    langEnBtn.classList.toggle("is-active", editLang === "en");
    try {
      await loadContent();
    } catch (error) {
      setStatus(`読み込みに失敗しました: ${error.message}`, true);
    }
  };

  langJaBtn.addEventListener("click", () => switchEditLang("ja"));
  langEnBtn.addEventListener("click", () => switchEditLang("en"));

  if (token) {
    showEditor();
    loadContent().catch((error) => {
      logout();
      showLogin(`再ログインが必要です: ${error.message}`);
    });
  } else {
    showLogin();
  }
})();
