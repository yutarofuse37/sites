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

公開ページはもともとインデックス可能です（`admin/` だけ `noindex`）。見つけてもらうには次を行います。

1. この PR マージ後、`robots.txt` と `sitemap.xml` がデプロイされるのを待つ
2. [Google Search Console](https://search.google.com/search-console) でプロパティを追加  
   - URL プレフィックス: `https://yutarofuse37.github.io/sites/`
3. 所有権確認（HTML タグ / Google アカウントなど）
4. 「サイトマップ」に `https://yutarofuse37.github.io/sites/sitemap.xml` を送信
5. 「URL 検査」でトップページを開き、「インデックス登録をリクエスト」

補足: GitHub Pages のプロジェクトサイトでは、ホスト直下の `robots.txt`（`https://yutarofuse37.github.io/robots.txt`）が優先されます。未設置ならデフォルトでクロール可です。確実にするには Search Console でのサイトマップ送信が有効です。

## ローカルで確認

```bash
python3 -m http.server 8080
```
