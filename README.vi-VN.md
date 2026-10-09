[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [**Tiếng Việt**](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Trợ lý tiếp khách hội nghị — Hệ thống đa ngôn ngữ

Hệ thống quản lý tiếp khách hội nghị hỗ trợ đa ngôn ngữ ngay từ đầu. Giao diện và dữ liệu tự động chuyển đổi theo ngôn ngữ người dùng lựa chọn, mang lại trải nghiệm bản địa hóa cho khách mời từ các quốc gia và khu vực khác nhau.

## Ngôn ngữ hỗ trợ (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Tính năng chính

1. **Quản lý người tham dự** — thêm, sửa, xóa; nhập hàng loạt từ mẫu Excel; kiểm tra dữ liệu
2. **Thống kê hội nghị** — đếm thời gian thực số người tham dự, lưu trú, ăn uống, đi lại
3. **Giao diện đa ngôn ngữ** — mọi thành phần giao diện (nút, tiêu đề, gợi ý) đều được dịch
4. **Dữ liệu đa ngôn ngữ** — lọc dữ liệu demo theo từng ngôn ngữ
5. **Trải nghiệm ngay** — xem demo không cần đăng ký

## Công nghệ

- Frontend: JavaScript thuần, không framework, hệ i18n riêng hỗ trợ chuyển ngôn ngữ động
- Backend: Node.js + Cloudflare Workers (edge, toàn cầu)
- Cơ sở dữ liệu: Cloudflare D1 (SQLite)
- Lưu trữ: Cloudflare Pages

## Bắt đầu nhanh

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Triển khai lên Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**Tài khoản thử nghiệm**: tên đăng nhập `test`, mật khẩu `test123` — hoặc nhấn nút "Trải nghiệm ngay" để xem demo không cần đăng nhập.

## Demo trực tuyến

https://hwi18n.106605.xyz/

## Giấy phép

MIT
