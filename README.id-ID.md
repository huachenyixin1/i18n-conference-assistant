[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [**Bahasa Indonesia**](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Asisten Resepsi Konferensi — Sistem Multibahasa

Sistem manajemen resepsi konferensi dengan dukungan multibahasa bawaan. Tampilan dan data berubah otomatis sesuai bahasa yang dipilih pengguna, memberikan pengalaman terlokalisasi bagi tamu dari berbagai negara dan wilayah.

## Bahasa yang Didukung (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Fitur Utama

1. **Manajemen peserta** — tambah, ubah, hapus; impor massal dari templat Excel; validasi data
2. **Statistik konferensi** — hitungan real-time peserta, penginapan, makan, dan transportasi
3. **Antarmuka multibahasa** — semua elemen (tombol, judul, petunjuk) diterjemahkan
4. **Data multibahasa** — data demo dapat difilter per bahasa
5. **Coba sekarang** — lihat demo tanpa perlu mendaftar

## Teknologi

- Frontend: JavaScript murni tanpa framework, sistem i18n sendiri dengan pergantian bahasa dinamis
- Backend: Node.js + Cloudflare Workers (edge, global)
- Basis data: Cloudflare D1 (SQLite)
- Hosting: Cloudflare Pages

## Mulai Cepat

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

**Akun uji**: nama pengguna `test`, kata sandi `test123` — atau klik tombol "Coba sekarang" untuk melihat demo tanpa masuk.

## Demo Online

https://hwi18n.106605.xyz/

## Lisensi

MIT
