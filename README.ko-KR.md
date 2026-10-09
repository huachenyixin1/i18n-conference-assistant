[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [**한국어**](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# 회의 접수 도우미 — 다국어 국제화 시스템

다국어 지원이 내장된 회의 접수 관리 시스템입니다. 사용자가 선택한 언어에 따라 화면과 데이터가 자동으로 전환되어, 여러 국가와 지역의 참가자에게 현지화된 경험을 제공합니다.

## 지원 언어 (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## 핵심 기능

1. **참가자 관리** — 등록·수정·삭제, Excel 템플릿 일괄 가져오기, 데이터 검증
2. **회의 통계** — 참석자 수, 숙박, 식사, 교통 정보의 실시간 집계
3. **다국어 UI** — 버튼, 제목, 안내 문구 등 모든 화면 요소 번역
4. **다국어 데이터** — 데모 데이터를 언어별로 필터링하여 표시
5. **원클릭 체험** — 회원가입 없이 바로 데모 확인 가능

## 기술 스택

- 프런트엔드: 순수 JavaScript, 프레임워크 불필요, 자체 i18n으로 동적 언어 전환
- 백엔드: Node.js + Cloudflare Workers(엣지, 글로벌 배포)
- 데이터베이스: Cloudflare D1 (SQLite)
- 호스팅: Cloudflare Pages

## 빠른 시작

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Cloudflare Pages 배포:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**테스트 계정**: 아이디 `test`, 비밀번호 `test123` — 또는 "원클릭 체험" 버튼으로 로그인 없이 데모를 확인하세요.

## 온라인 데모

https://hwi18n.106605.xyz/

## 라이선스

MIT
