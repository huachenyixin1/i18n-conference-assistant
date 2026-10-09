[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [**Монгол**](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Хурлын хүлээн авалтын туслах — Олон хэлний систем

Олон хэлний дэмжлэг бүхий хурлын хүлээн авалтын удирдлагын систем. Хэрэглэгчийн сонгосон хэлнээс хамаарч интерфейс болон өгөгдөл автоматаар солигдож, өөр өөр улс орны зочдод нутагшуулсан туршлага өгнө.

## Дэмжигдсэн хэлнүүд (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Үндсэн функцууд

1. **Оролцогчдын удирдлага** — нэмэх, засах, устгах; Excel загвараас бөөнөөр оруулах; өгөгдөл шалгах
2. **Хурлын статистик** — оролцогч, байр, хоол, тээврийн тоог бодит цагт харах
3. **Олон хэлний интерфейс** — товч, гарчиг, заавар бүхий бүх элемент орчуулагдсан
4. **Олон хэлний өгөгдөл** — демо өгөгдлийг хэлээр шүүж харах боломжтой
5. **Шууд турших** — бүртгэлгүйгээр демог харах

## Технологи

- Frontend: цэвэр JavaScript, фреймворкгүй, динамик хэл солих i18n систем
- Backend: Node.js + Cloudflare Workers (edge, дэлхий даяар)
- Өгөгдлийн сан: Cloudflare D1 (SQLite)
- Хостинг: Cloudflare Pages

## Хурдан эхлэх

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Cloudflare Pages рүү deployment:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**Туршилтын данс**: нэр `test`, нууц үг `test123` — эсвэл "Шууд турших" товчийг дарж нэвтэрч байхгүйгээр демог үзээрэй.

## Онлайн демо

https://hwi18n.106605.xyz/

## Лиценз

MIT
