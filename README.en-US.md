[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Conference Reception Assistant — Multilingual i18n System

A conference reception management system with built-in multilingual support. The interface and data switch automatically based on the language selected by the user, providing a localized experience for guests from different countries and regions.

## Supported Languages (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Core Features

1. **Participant management** — CRUD, batch import from Excel templates, data validation
2. **Conference statistics** — real-time counts of attendees, hotel stays, meals and transport
3. **Multilingual UI** — every interface element (buttons, titles, hints) is translated
4. **Multilingual data** — demo data can be filtered by language
5. **Instant demo** — one-click experience, no registration required

## Tech Stack

- Frontend: vanilla JavaScript, no framework, custom i18n with dynamic language switching
- Backend: Node.js + Cloudflare Workers (edge, globally deployed)
- Database: Cloudflare D1 (SQLite)
- Hosting: Cloudflare Pages

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Deploy to Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**Test account**: username `test`, password `test123` — or click "Instant demo" to explore without logging in.

## Online Demo

https://hwi18n.106605.xyz/

## License

MIT
