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
  };

  const requirePanel = (key) => {
    const panel = panels[key];
    if (!panel) {
      throw new Error(
        `編集パネル (${key}) が見つかりません。ページを再読み込みしてください。`
      );
    }
    return panel;
  };

  let token = localStorage.getItem(TOKEN_KEY) || "";
  let siteSha = "";
  let papersSha = "";
  let data = null;
  let papersData = { paper_sections: [] };
  let editLang = "ja";
  let activeTab = "profile";

  const siteFilePath = () =>
    editLang === "en" ? "data/site.en.json" : "data/site.json";
  const papersFilePath = "data/papers.json";

  const decodeGithubFile = (file) =>
    decodeURIComponent(
      Array.prototype.map
        .call(atob(file.content.replace(/\n/g, "")), (c) =>
          "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join("")
    );

  const putGithubFile = async (path, sha, payload, message) => {
    const json = JSON.stringify(payload, null, 2) + "\n";
    const content = btoa(unescape(encodeURIComponent(json)));
    const result = await api(`/repos/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content,
        sha,
        branch: BRANCH,
      }),
    });
    return result.content.sha;
  };

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
    const linksText = (data.links || [])
      .map((link) => `${link.label || ""}|${link.url || ""}`)
      .join("\n");
    requirePanel("profile").innerHTML = `
      <h2>プロフィール</h2>
      ${field("氏名（日本語）", "name_ja", p.name_ja || "")}
      ${field("氏名（英語）", "name_en", p.name_en || "")}
      ${field("所属", "affiliation", p.affiliation || "")}
      ${field("研究室名（自己紹介文中でリンク化）", "lab_name", p.lab_name || "")}
      ${field("研究室 URL", "lab_url", p.lab_url || "")}
      ${field(
        "写真 URL（例: assets/uploads/photo.jpg または https://...）",
        "photo",
        p.photo || ""
      )}
      ${field("メール（表示用・リンクなし）", "email", p.email || "")}
      ${field("サイト説明（SEO）", "description", p.description || "", true)}
      ${field("自己紹介（段落は空行で区切る）", "intro", introText, true)}
      ${field(
        "URLの37についての注記（小さく表示・空なら非表示）",
        "url_note",
        p.url_note || "",
        true
      )}
      ${field(
        "リンクマップ（表示名|URL を1行ずつ。researchmap / Google Scholar / ORCID など）",
        "links",
        linksText,
        true
      )}
    `;
  };

  const renderEducation = () => {
    const items = data.education || [];
    const panel = requirePanel("education");
    panel.innerHTML = `
      <h2>学歴</h2>
      <p class="status">指導教員は「氏名|URL」を1行ずつ（清水先生のページと同じく、学歴の下に「指導教員: …」と出ます）。</p>
      <div id="education-list"></div>
      <button type="button" class="btn btn--small" data-add="education">＋ 追加</button>
    `;
    const list = panel.querySelector("#education-list");
    list.innerHTML = items
      .map((item, index) => {
        const advisorsText = (item.advisors || [])
          .map((person) => `${person.name || ""}|${person.url || ""}`)
          .join("\n");
        return `
      <div class="item-card" data-index="${index}">
        ${field("期間", "period", item.period || "")}
        ${field("内容", "detail", item.detail || "", true)}
        ${field("指導教員（氏名|URL）", "advisors", advisorsText, true)}
        <div class="row-actions">
          <button type="button" class="btn btn--small btn--danger" data-remove="education" data-index="${index}">削除</button>
        </div>
      </div>`;
      })
      .join("");
  };

  const renderExperience = () => {
    const groups = data.experience || [];
    const panel = requirePanel("experience");
    panel.innerHTML = `
      <h2>各種経歴</h2>
      <div id="experience-list"></div>
      <button type="button" class="btn btn--small" data-add="experience-group">＋ グループ追加</button>
    `;
    const list = panel.querySelector("#experience-list");
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
    const sections = papersData.paper_sections || [];
    const panel = requirePanel("papers");
    panel.innerHTML = `
      <h2>Papers / Talks（日英まとめて登録）</h2>
      <p class="status">1回の登録で日本語・英語の両方に反映されます。英語欄が空なら日本語欄を表示します。会場URLを入れると会場名がリンクになります。スライドURLもここに付けます。追加リンクは「表示名|URL」を1行ずつ。</p>
      <div id="papers-list"></div>
      <button type="button" class="btn btn--small" data-add="paper-section">＋ セクション追加</button>
    `;
    const list = panel.querySelector("#papers-list");
    list.innerHTML = sections
      .map((section, si) => {
        const items = (section.items || [])
          .map((item, ii) => {
            const linksText = (item.links || [])
              .map((link) => `${link.label || ""}|${link.url || ""}`)
              .join("\n");
            return `
          <div class="item-card" data-s="${si}" data-i="${ii}">
            ${field("著者（英語）", "authors", item.authors || "")}
            ${field("著者（日本語）", "authors_ja", item.authors_ja || "")}
            ${field("タイトル（英語）", "title", item.title || "")}
            ${field("タイトル（日本語）", "title_ja", item.title_ja || "")}
            ${field("掲載先・会議名（英語）", "venue", item.venue || "", true)}
            ${field("掲載先・会議名（日本語）", "venue_ja", item.venue_ja || "", true)}
            ${field("会場 / 会議 HP URL", "venue_url", item.venue_url || "")}
            ${field("スライド URL", "slide_url", item.slide_url || "")}
            ${field("スライド表示名（空なら「スライド」/ Slides）", "slide_label", item.slide_label || "")}
            ${field("追加リンク（表示名|URL）", "links", linksText, true)}
            ${field("補足（英語）", "note", item.note || "", true)}
            ${field("補足（日本語）", "note_ja", item.note_ja || "", true)}
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

  const renderAll = () => {
    renderProfile();
    renderEducation();
    renderExperience();
    renderPapers();
  };

  const readFields = (root) => {
    const result = {};
    root.querySelectorAll("[data-name]").forEach((el) => {
      result[el.dataset.name] = el.value;
    });
    return result;
  };

  const collectSiteData = () => {
    const profilePanel = requirePanel("profile");
    const educationPanel = requirePanel("education");
    const experiencePanel = requirePanel("experience");
    const profileFields = readFields(profilePanel);
    const intro = profileFields.intro
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    const education = [...educationPanel.querySelectorAll(".item-card")].map(
      (card) => {
        const f = readFields(card);
        const advisors = String(f.advisors || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [name, ...rest] = line.split("|");
            return {
              name: (name || "").trim(),
              url: rest.join("|").trim(),
            };
          })
          .filter((person) => person.name);
        return {
          period: f.period || "",
          detail: f.detail || "",
          advisors,
        };
      }
    );

    const experience = [];
    experiencePanel
      .querySelectorAll(":scope > #experience-list > .item-card")
      .forEach((groupCard) => {
        const title =
          groupCard.querySelector('[data-name="title"]')?.value || "";
        const items = [...groupCard.querySelectorAll(".item-card")].map(
          (card) => {
            const f = readFields(card);
            return { period: f.period || "", detail: f.detail || "" };
          }
        );
        experience.push({ title, items });
      });

    const links = String(profileFields.links || "")
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
      .filter((link) => link.label);

    return {
      profile: {
        name_ja: profileFields.name_ja || "",
        name_en: profileFields.name_en || "",
        affiliation: profileFields.affiliation || "",
        lab_name: profileFields.lab_name || "",
        lab_url: profileFields.lab_url || "",
        photo: profileFields.photo || "",
        email: profileFields.email || "",
        description: profileFields.description || "",
        intro,
        url_note: profileFields.url_note || "",
      },
      links,
      education,
      experience,
    };
  };

  const collectPapersData = () => {
    const paper_sections = [];
    requirePanel("papers")
      .querySelectorAll(":scope > #papers-list > .item-card")
      .forEach((sectionCard) => {
        const title =
          sectionCard.querySelector('[data-name="title"]')?.value || "";
        const items = [...sectionCard.querySelectorAll(".item-card")].map(
          (card) => {
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
            const entry = {
              authors: f.authors || "",
              authors_ja: f.authors_ja || "",
              title: f.title || "",
              title_ja: f.title_ja || "",
              venue: f.venue || "",
              venue_ja: f.venue_ja || "",
              venue_url: f.venue_url || "",
              links,
              note: f.note || "",
              note_ja: f.note_ja || "",
              slide_url: f.slide_url || "",
              slide_label: f.slide_label || "",
            };
            return entry;
          }
        );
        paper_sections.push({ title, items });
      });
    return { paper_sections };
  };

  const loadContent = async () => {
    setStatus("GitHub から読み込み中…");
    const [siteFile, papersFile] = await Promise.all([
      api(
        `/repos/${REPO}/contents/${siteFilePath()}?ref=${encodeURIComponent(
          BRANCH
        )}`
      ),
      api(
        `/repos/${REPO}/contents/${papersFilePath}?ref=${encodeURIComponent(
          BRANCH
        )}`
      ),
    ]);
    siteSha = siteFile.sha;
    papersSha = papersFile.sha;
    data = JSON.parse(decodeGithubFile(siteFile));
    papersData = JSON.parse(decodeGithubFile(papersFile));
    if (!papersData.paper_sections) papersData.paper_sections = [];
    if (!data.links) data.links = [];
    renderAll();
    setStatus(
      activeTab === "papers"
        ? `編集中: ${papersFilePath}（日英共通）。保存で両方の Papers/Talks に反映されます。`
        : `編集中: ${siteFilePath()} 。Papers/Talks は共通データです。`
    );
  };

  const saveContent = async () => {
    setStatus("保存中…");
    saveBtn.disabled = true;
    try {
      if (activeTab === "papers") {
        papersData = collectPapersData();
        papersSha = await putGithubFile(
          papersFilePath,
          papersSha,
          papersData,
          `Update ${papersFilePath} via admin UI`
        );
        setStatus(
          "Papers/Talks を保存しました（日英共通）。数分後に両方へ反映されます。"
        );
      } else {
        data = collectSiteData();
        siteSha = await putGithubFile(
          siteFilePath(),
          siteSha,
          data,
          `Update ${siteFilePath()} via admin UI`
        );
        setStatus(`保存しました（${siteFilePath()}）。数分後にサイトへ反映されます。`);
      }
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
      try {
        await loadContent();
      } catch (loadError) {
        setStatus(`読み込みに失敗しました: ${loadError.message}`, true);
        showLogin(
          `ログインはできましたが、内容の読み込みに失敗しました: ${loadError.message}。ページを再読み込みしてください。`
        );
      }
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
    siteSha = "";
    papersSha = "";
    data = null;
    papersData = { paper_sections: [] };
    localStorage.removeItem(TOKEN_KEY);
    tokenInput.value = "";
    showLogin();
  };

  document.querySelectorAll(".tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tabs .tab").forEach((t) =>
        t.classList.remove("is-active")
      );
      tab.classList.add("is-active");
      activeTab = tab.dataset.tab;
      Object.entries(panels).forEach(([key, panel]) => {
        panel.hidden = key !== activeTab;
      });
      if (activeTab === "papers") {
        setStatus(
          `編集中: ${papersFilePath}（日英共通）。保存で両方の Papers/Talks に反映されます。`
        );
      } else {
        setStatus(`編集中: ${siteFilePath()} 。Papers/Talks は共通データです。`);
      }
    });
  });

  editorView.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn || !data) return;

    if (btn.dataset.add === "education") {
      data = collectSiteData();
      data.education.push({ period: "", detail: "", advisors: [] });
      renderEducation();
    }
    if (btn.dataset.remove === "education") {
      data = collectSiteData();
      data.education.splice(Number(btn.dataset.index), 1);
      renderEducation();
    }
    if (btn.dataset.add === "experience-group") {
      data = collectSiteData();
      data.experience.push({ title: "", items: [{ period: "", detail: "" }] });
      renderExperience();
    }
    if (btn.dataset.remove === "experience-group") {
      data = collectSiteData();
      data.experience.splice(Number(btn.dataset.g), 1);
      renderExperience();
    }
    if (btn.dataset.add === "experience-item") {
      data = collectSiteData();
      data.experience[Number(btn.dataset.g)].items.push({
        period: "",
        detail: "",
      });
      renderExperience();
    }
    if (btn.dataset.remove === "experience-item") {
      data = collectSiteData();
      data.experience[Number(btn.dataset.g)].items.splice(
        Number(btn.dataset.i),
        1
      );
      renderExperience();
    }
    if (btn.dataset.add === "paper-section") {
      papersData = collectPapersData();
      papersData.paper_sections.push({
        title: "",
        items: [
          {
            authors: "",
            authors_ja: "",
            title: "",
            title_ja: "",
            venue: "",
            venue_ja: "",
            venue_url: "",
            slide_url: "",
            slide_label: "",
            links: [],
            note: "",
            note_ja: "",
          },
        ],
      });
      renderPapers();
    }
    if (btn.dataset.remove === "paper-section") {
      papersData = collectPapersData();
      papersData.paper_sections.splice(Number(btn.dataset.s), 1);
      renderPapers();
    }
    if (btn.dataset.add === "paper-item") {
      papersData = collectPapersData();
      papersData.paper_sections[Number(btn.dataset.s)].items.push({
        authors: "",
        authors_ja: "",
        title: "",
        title_ja: "",
        venue: "",
        venue_ja: "",
        venue_url: "",
        slide_url: "",
        slide_label: "",
        links: [],
        note: "",
        note_ja: "",
      });
      renderPapers();
    }
    if (btn.dataset.remove === "paper-item") {
      papersData = collectPapersData();
      papersData.paper_sections[Number(btn.dataset.s)].items.splice(
        Number(btn.dataset.i),
        1
      );
      renderPapers();
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
    if (activeTab !== "papers") {
      data = collectSiteData();
    } else {
      papersData = collectPapersData();
    }
    editLang = nextLang;
    langJaBtn.classList.toggle("is-active", editLang === "ja");
    langEnBtn.classList.toggle("is-active", editLang === "en");
    try {
      // Reload only the language-specific site file; keep shared papers as edited in memory
      setStatus("GitHub から読み込み中…");
      const siteFile = await api(
        `/repos/${REPO}/contents/${siteFilePath()}?ref=${encodeURIComponent(
          BRANCH
        )}`
      );
      siteSha = siteFile.sha;
      data = JSON.parse(decodeGithubFile(siteFile));
      if (!data.links) data.links = [];
      renderProfile();
      renderEducation();
      renderExperience();
      setStatus(
        activeTab === "papers"
          ? `編集中: ${papersFilePath}（日英共通）。保存で両方の Papers/Talks に反映されます。`
          : `編集中: ${siteFilePath()} 。Papers/Talks は共通データです。`
      );
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
