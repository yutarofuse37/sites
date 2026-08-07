# sites

布施 祐大郎（Yutaro Fuse）の個人ホームページです。

**公開URL:** https://yutarofuse37.github.io/sites/  
**English:** https://yutarofuse37.github.io/sites/en/  
**編集画面:** https://yutarofuse37.github.io/sites/admin/

## 編集のしかた

1. https://yutarofuse37.github.io/sites/admin/ を開く
2. [Fine-grained token 作成](https://github.com/settings/personal-access-tokens/new)
   - Repository: `yutarofuse37/sites`
   - Contents: **Read and write**
3. トークンを貼ってログイン
4. 日本語 / English を切り替えて編集し、「GitHub に保存」

Papers/Talks では会場・会議 HP の URL と、DOI などの追加リンク（`表示名|URL`）を設定できます。

## ページ

- `index.html` / `en/index.html` — Home
- `papers.html` / `en/papers.html` — Papers/Talks
- `slides.html` / `en/slides.html` — Slides
- `admin/` — 編集画面
- `data/site.json` / `data/site.en.json` — コンテンツ

## ローカルで確認

```bash
python3 -m http.server 8080
```
