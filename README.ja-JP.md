[English](./README.en-US.md) | [**中文**](./README.md) | [**日本語**](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# 会議受付アシスタント — 多言語国際化システム

多言語サポートを内蔵した会議受付管理システムです。ユーザーが選択した言語に応じて、画面表示とデータが自動的に切り替わり、さまざまな国や地域のお客様にローカライズされた体験を提供します。

## 対応言語（16）

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## 主な機能

1. **参加者管理** — 登録・編集・削除、Excelテンプレートによる一括インポート、データ検証
2. **会議統計** — 出席者数・宿泊・食事・交通情報のリアルタイム集計
3. **多言語UI** — ボタン・タイトル・案内など、すべての画面要素を翻訳
4. **多言語データ** — デモデータを言語別に絞り込み表示
5. **ワンクリック体験** — 登録不要でデモをすぐに確認可能

## 技術スタック

- フロントエンド：素のJavaScript、フレームワーク不要、独自i18nによる動的な言語切替
- バックエンド：Node.js + Cloudflare Workers（エッジ、グローバル配信）
- データベース：Cloudflare D1（SQLite）
- ホスティング：Cloudflare Pages

## クイックスタート

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Cloudflare Pagesへのデプロイ：

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**テストアカウント**：ユーザー名 `test`、パスワード `test123` — または「ワンクリック体験」ボタンでログイン不要のデモをご覧ください。

## オンラインデモ

https://hwi18n.106605.xyz/

## ライセンス

MIT
