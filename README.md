# sites

布施 祐大郎（Yutaro Fuse）の個人ホームページです。

**公開URL:** https://yutarofuse37.github.io/sites/

**編集画面（ノーコード）:** https://yutarofuse37.github.io/sites/admin/

`main` への push / 編集画面からの保存で GitHub Actions が動き、GitHub Pages に反映されます。

## 編集のしかた

1. https://yutarofuse37.github.io/sites/admin/ を開く
2. GitHub アカウントでログインする（必要なら Personal Access Token）
3. 「サイト内容」からプロフィール・学歴・経歴・業績・スライドを編集して保存

内容は `data/site.json` に保存されます。HTML を直接書き換える必要はありません。

## ページ

- `index.html` — Home
- `papers.html` — Papers/Talks
- `slides.html` — Slides
- `admin/` — 編集用 UI（Sveltia CMS）

## ローカルで確認

```bash
python3 -m http.server 8080
```

- サイト: http://localhost:8080
- 編集画面: http://localhost:8080/admin/
