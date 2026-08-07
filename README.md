# sites

布施 祐大郎（Yutaro Fuse）の個人ホームページです。

**公開URL:** https://yutarofuse37.github.io/sites/

`main` への push で GitHub Actions から GitHub Pages にデプロイされます。

## ページ

- `index.html` — Home（自己紹介・学歴・経歴）
- `papers.html` — Papers/Talks
- `slides.html` — Slides

## researchmap 連携

`config.js` の `researchmapPermalink` に researchmap の ID を入れると、
Papers/Talks を API から自動取得します。

```js
window.SITE_CONFIG = {
  researchmapPermalink: "your-id", // https://researchmap.jp/your-id
};
```

未設定時は `papers.html` の手書き一覧を表示します。

## ローカルで確認

```bash
python3 -m http.server 8080
```

http://localhost:8080 を開いてください。
