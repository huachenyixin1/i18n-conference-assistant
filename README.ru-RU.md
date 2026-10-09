[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [**Русский**](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Ассистент приёма конференций — Многоязычная система

Система управления приёмом участников конференций со встроенной многоязычной поддержкой. Интерфейс и данные автоматически переключаются в зависимости от языка, выбранного пользователем, обеспечивая локализованный опыт для гостей из разных стран и регионов.

## Поддерживаемые языки (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Основные функции

1. **Управление участниками** — добавление, редактирование, удаление; массовый импорт из шаблона Excel; проверка данных
2. **Статистика конференции** — подсчёт в реальном времени участников, проживания, питания и транспорта
3. **Многоязычный интерфейс** — все элементы (кнопки, заголовки, подсказки) переведены
4. **Многоязычные данные** — демо-данные можно фильтровать по языку
5. **Быстрый просмотр** — демо без регистрации

## Технологии

- Frontend: чистый JavaScript без фреймворков, собственная система i18n с динамическим переключением языков
- Backend: Node.js + Cloudflare Workers (edge, глобально)
- База данных: Cloudflare D1 (SQLite)
- Хостинг: Cloudflare Pages

## Быстрый старт

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Развертывание на Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**Тестовый аккаунт**: имя пользователя `test`, пароль `test123` — или нажмите кнопку «Быстрый просмотр», чтобы увидеть демо без входа.

## Онлайн-демо

https://hwi18n.106605.xyz/

## Лицензия

MIT
