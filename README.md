# sites

布施 祐大郎（Yutaro Fuse）の個人ホームページです。

**公開URL:** https://yutarofuse37.github.io/sites/

**編集画面:** https://yutarofuse37.github.io/sites/admin/

## 編集のしかた（トークンログイン）

GitHub の「Sign in with GitHub」は使わず、Personal Access Token で編集します。

1. https://yutarofuse37.github.io/sites/admin/ を開く
2. [Fine-grained token 作成](https://github.com/settings/personal-access-tokens/new)
3. Repository access で `yutarofuse37/sites` を選択
4. Permissions → **Contents: Read and write**
5. 発行したトークンを編集画面に貼ってログイン
6. プロフィール / 学歴 / 経歴 / 論文 / スライドを編集して「GitHub に保存」

保存すると `data/site.json` が更新され、Actions 経由でサイトに反映されます。

## ページ

- `index.html` — Home
- `papers.html` — Papers/Talks
- `slides.html` — Slides
- `admin/` — 編集画面

## ローカルで確認

```bash
python3 -m http.server 8080
```

- サイト: http://localhost:8080
- 編集画面: http://localhost:8080/admin/
