[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [**ភាសាខ្មែរ**](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# ជំនួយការទទួលកិច្ចប្រជុំ — ប្រព័ន្ធភាសាច្រើន

ប្រព័ន្ធគ្រប់គ្រងការទទួលកិច្ចប្រជុំដែលមានការគាំទ្រភាសាច្រើនជាមួយ។ ចំណុចប្រទាក់ និងទិន្នន័យផ្លាស់ប្តូរស្វ័យប្រវត្តិតាមភាសាដែលអ្នកប្រើជ្រើសរើស ដើម្បីផ្តល់បទពិសោធន៍តំបន់ដល់ភ្ញៀវពីប្រទេសនិងតំបន់ផ្សេងៗ។

## ភាសាដែលគាំទ្រ (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## មុខងារសំខាន់ៗ

1. **ការគ្រប់គ្រងអ្នកចូលរួម** — បន្ថែម កែសម្រួល លុប; នាំចូលជាបាច់ពីគំរូ Excel; ផ្ទៀងផ្ទាត់ទិន្នន័យ
2. **ស្ថិតិកិច្ចប្រជុំ** — រាប់ចំនួនអ្នកចូលរួម កន្លែងស្នាក់នៅ អាហារ និងការធ្វើដំណើរតាមពេលវេលាពិត
3. **ចំណុចប្រទាក់ភាសាច្រើន** — ប៊ូតុង ចំណងជើង សារជូនដំណឹង ត្រូវបានបកប្រែទាំងអស់
4. **ទិន្នន័យភាសាច្រើន** — អាចត្រងទិន្នន័យសាកល្បងតាមភាសា
5. **សាកល្បងភ្លាមៗ** — មើលការបង្ហាញសាកល្បងដោយមិនចាំបាច់ចុះឈ្មោះ

## បច្ចេកវិទ្យា

- Frontend: JavaScript សុទ្ធ គ្មាន framework មានប្រព័ន្ធ i18n ផ្លាស់ប្តូរភាសាភ្លាមៗ
- Backend: Node.js + Cloudflare Workers (edge, ពិព័រណ៍)
- មូលដ្ឋានទិន្នន័យ: Cloudflare D1 (SQLite)
- គ្រោងការ: Cloudflare Pages

## ចាប់ផ្តើមរហ័ស

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

ដាក់ពង្រូលលើ Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**គណនីសាកល្បង**: ឈ្មោះអ្នកប្រើ `test` ពាក្យសម្ងាត់ `test123` — ឬចុចប៊ូតុង "សាកល្បងភ្លាមៗ" ដើម្បីមើលការបង្ហាញដោយមិនចាំបាច់ចូល។

## ការបង្ហាញលើអ៊ីនធឺណិត

https://hwi18n.106605.xyz/

## អាជ្ញាបណ្ណ

MIT
