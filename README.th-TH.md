[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [**ไทย**](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# ผู้ช่วยรับงานการประชุม — ระบบหลายภาษา

ระบบจัดการงานรับการประชุมที่รองรับหลายภาษาในตัว หน้าจอและข้อมูลจะเปลี่ยนตามภาษาที่ผู้ใช้เลือกโดยอัตโนมัติ เพื่อมอบประสบการณ์ที่เหมาะสมแก่แขกจากประเทศและภูมิภาคต่าง ๆ

## ภาษาที่รองรับ (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## ฟังก์ชันหลัก

1. **จัดการผู้เข้าร่วม** — เพิ่ม แก้ไข ลบ นำเข้าจากเทมเพลต Excel เป็นชุด และตรวจสอบข้อมูล
2. **สถิติการประชุม** — นับจำนวนผู้เข้าร่วม ที่พัก มื้ออาหาร และการเดินทางแบบเรียลไทม์
3. **อินเทอร์เฟซหลายภาษา** — ปุ่ม หัวข้อ ข้อความแจ้งเตือน แปลครบทุกองค์ประกอบ
4. **ข้อมูลหลายภาษา** — กรองข้อมูลตัวอย่างตามภาษา
5. **ทดลองใช้ทันที** — ดูตัวอย่างระบบได้โดยไม่ต้องสมัครสมาชิก

## เทคโนโลยีที่ใช้

- Frontend: JavaScript ล้วน ไม่ใช้เฟรมเวิร์ก พร้อมระบบ i18n สลับภาษาแบบไดนามิก
- Backend: Node.js + Cloudflare Workers (edge, ทั่วโลก)
- ฐานข้อมูล: Cloudflare D1 (SQLite)
- โฮสติ้ง: Cloudflare Pages

## เริ่มต้นอย่างรวดเร็ว

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

อัปโหลดไปยัง Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**บัญชีทดสอบ**: ชื่อผู้ใช้ `test` รหัสผ่าน `test123` — หรือกดปุ่ม "ทดลองใช้ทันที" เพื่อดูตัวอย่างโดยไม่ต้องเข้าสู่ระบบ

## ตัวอย่างออนไลน์

https://hwi18n.106605.xyz/

## สัญญาอนุญาต

MIT
