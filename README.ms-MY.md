[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [**Melayu**](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Pembantu Resepsi Persidangan — Sistem Pelbagai Bahasa

Sistem pengurusan resepsi persidangan dengan sokongan pelbagai bahasa terbina dalam. Paparan dan data bertukar secara automatik mengikut bahasa yang dipilih pengguna, memberikan pengalaman setempat kepada tetamu dari pelbagai negara dan wilayah.

## Bahasa yang Disokong (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Ciri Utama

1. **Pengurusan peserta** — tambah, sunting, padam; import pukal daripada templat Excel; pengesahan data
2. **Statistik persidangan** — kiraan masa nyata bilangan peserta, penginapan, makan dan pengangkutan
3. **Antara muka pelbagai bahasa** — semua elemen (butang, tajuk, petunjuk) diterjemahkan
4. **Data pelbagai bahasa** — data demo boleh ditapis mengikut bahasa
5. **Cuba sekarang** — lihat demo tanpa perlu mendaftar

## Teknologi

- Frontend: JavaScript tulen tanpa rangka kerja, sistem i18n tersendiri dengan penukaran bahasa dinamik
- Backend: Node.js + Cloudflare Workers (edge, global)
- Pangkalan data: Cloudflare D1 (SQLite)
- Penyimpanan: Cloudflare Pages

## Mula Pantas

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Deploy ke Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**Akaun ujian**: nama pengguna `test`, kata laluan `test123` — atau klik butang "Cuba sekarang" untuk melihat demo tanpa log masuk.

## Demo Dalam Talian

https://hwi18n.106605.xyz/

## Lesen

MIT
