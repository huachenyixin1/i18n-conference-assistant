[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [**العربية**](./README.ar-SA.md)

# مساعد استقبال المؤتمرات — نظام متعدد اللغات

نظام لإدارة استقبال المؤتمرات مع دعم مدمج للغات متعددة. تتغير الواجهة والبيانات تلقائياً حسب اللغة التي يختارها المستخدم، مما يوفر تجربة محلية للضيوف من مختلف الدول والمناطق.

## اللغات المدعومة (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## الميزات الرئيسية

1. **إدارة المشاركين** — إضافة وتعديل وحذف؛ استيراد جماعي من قوالب Excel؛ التحقق من البيانات
2. **إحصاءات المؤتمر** — عدّ فوري لأرقام المشاركين والإقامة والوجبات والنقل
3. **واجهة متعددة اللغات** — جميع العناصر (الأزرار والعناوين والتلميحات) مترجمة
4. **بيانات متعددة اللغات** — يمكن تصفية البيانات التجريبية حسب اللغة
5. **تجربة فورية** — استعرض النظام دون الحاجة إلى التسجيل

## التقنيات

- الواجهة الأمامية: JavaScript خالص بدون أطر، نظام i18n خاص مع تبديل ديناميكي للغة
- الواجهة الخلفية: Node.js + Cloudflare Workers (حوسبة الطرف، عالمية)
- قاعدة البيانات: Cloudflare D1 (SQLite)
- الاستضافة: Cloudflare Pages

## البدء السريع

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

النشر على Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**حساب الاختبار**: اسم المستخدم `test` وكلمة المرور `test123` — أو اضغط زر "تجربة فورية" لاستعراض النظام دون تسجيل الدخول.

## العرض التجريبي

https://hwi18n.106605.xyz/

## الترخيص

MIT
