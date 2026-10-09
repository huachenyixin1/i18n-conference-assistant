[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [**हिन्दी**](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# सम्मेलन स्वागत सहायक — बहुभाषी अंतर्राष्ट्रीय प्रणाली

अंतर्निहित बहुभाषी समर्थन वाला सम्मेलन स्वागत प्रबंधन प्रणाली। उपयोगकर्ता द्वारा चुनी गई भाषा के अनुसार इंटरफ़ेस और डेटा स्वतः बदल जाता है, जिससे विभिन्न देशों और क्षेत्रों के अतिथियों को स्थानीयकृत अनुभव मिलता है।

## समर्थित भाषाएँ (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## मुख्य विशेषताएँ

1. **प्रतिभागी प्रबंधन** — जोड़ें, संपादित करें, हटाएँ; Excel टेम्पलेट से बैच आयात; डेटा सत्यापन
2. **सम्मेलन सांख्यिकी** — प्रतिभागियों, आवास, भोजन और परिवहन की वास्तविक समय गणना
3. **बहुभाषी इंटरफ़ेस** — सभी तत्व (बटन, शीर्षक, संकेत) अनुवादित
4. **बहुभाषी डेटा** — डेमो डेटा भाषा के अनुसार फ़िल्टर किया जा सकता है
5. **तुरंत आज़माएँ** — पंजीकरण के बिना डेमो देखें

## तकनीकी स्टैक

- फ्रंटएंड: शुद्ध जावास्क्रिप्ट, कोई फ्रेमवर्क नहीं, गतिशील भाषा परिवर्तन के लिए स्वयं का i18n
- बैकएंड: Node.js + Cloudflare Workers (एज, वैश्विक)
- डेटाबेस: Cloudflare D1 (SQLite)
- होस्टिंग: Cloudflare Pages

## त्वरित शुरुआत

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Cloudflare Pages पर तैनात करें:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**परीक्षण खाता**: उपयोगकर्ता नाम `test`, पासवर्ड `test123` — या बिना लॉगिन डेमो देखने के लिए "तुरंत आज़माएँ" बटन दबाएँ।

## ऑनलाइन डेमो

https://hwi18n.106605.xyz/

## लाइसेंस

MIT
