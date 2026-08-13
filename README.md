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

Papers/Talks は `data/papers.json` にまとめて登録します（1回の編集で日英両方に反映）。
各業績に英語欄・日本語欄を持てます。会場・会議 HP の URL、スライド URL、DOI などの追加リンク（`表示名|URL`）もここで設定できます。
所属の研究室名は `lab_name` / `lab_url` で自己紹介文中をリンク化します。
指導教員は各学歴エントリの `advisors` に登録し、清水先生のページと同様に「指導教員: 氏名」と表示します。
リンクマップ（researchmap / Google Scholar / ORCID など）は `links` に `表示名|URL` で登録します。
顔写真は `profile.photo`（`assets/uploads/` 配下や外部URL）、URLの「37」注記は `profile.url_note` です。

## ページ

- `index.html` / `en/index.html` — Home（写真枠・研究室リンク・リンクマップ・学歴下の指導教員）
- `papers.html` / `en/papers.html` — Papers/Talks（スライドリンク付き）
- `admin/` — 編集画面
- `data/site.json` / `data/site.en.json` — プロフィール・リンクマップ・学歴（指導教員含む）・経歴
- `data/papers.json` — Papers/Talks（日英共通・スライド含む）
- `assets/uploads/` — 写真などのアップロード先

## 検索エンジンに載せる（クロール）

公開ページはインデックス可能です（`admin/` だけ `noindex`）。  
**新しい個人サイトは、設定だけではすぐ検索に出ません。** Google に「登録して」と伝える必要があります。

### いまやること（Search Console）

1. [Google Search Console](https://search.google.com/search-console) を開く
2. プロパティ追加（URL プレフィックス）: `https://yutarofuse37.github.io/sites/`
3. 所有権確認（`googlefa359d70c6b997ed.html` は配置済み）
4. 左メニュー「サイトマップ」→ `sitemap.xml` を送信  
   （フルURL: `https://yutarofuse37.github.io/sites/sitemap.xml`）
5. 「URL 検査」で次を1つずつ開き、「インデックス登録をリクエスト」
   - `https://yutarofuse37.github.io/sites/`
   - `https://yutarofuse37.github.io/sites/papers.html`
6. 反映まで数日〜数週間かかることがあります。`site:yutarofuse37.github.io/sites` で確認できます。

### サイト側で入れてある対策

- `robots.txt` / `sitemap.xml`
- canonical・hreflang・Person JSON-LD
- **ビルド時プリレンダー**（HTML に本文を埋め込み。JS オフのクローラでも読める）

補足: GitHub Pages のプロジェクトサイトでは、ホスト直下の `robots.txt`（`https://yutarofuse37.github.io/robots.txt`）が優先されます。未設置（404）ならデフォルトでクロール可です。

## ローカルで確認

```bash
python3 -m http.server 8080
```
