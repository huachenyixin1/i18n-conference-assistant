[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [Français](./README.fr-FR.md) | [**Português**](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Assistente de Recepção de Conferências — Sistema Multilíngue

Sistema de gestão de recepção de conferências com suporte multilíngue integrado. A interface e os dados mudam automaticamente conforme o idioma escolhido pelo usuário, oferecendo uma experiência localizada para convidados de diversos países e regiões.

## Idiomas suportados (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Funcionalidades principais

1. **Gestão de participantes** — adicionar, editar, excluir; importação em lote via modelo Excel; validação de dados
2. **Estatísticas do evento** — contagem em tempo real de participantes, hospedagem, refeições e transporte
3. **Interface multilíngue** — todos os elementos (botões, títulos, avisos) traduzidos
4. **Dados multilíngues** — os dados de demonstração podem ser filtrados por idioma
5. **Demonstração instantânea** — explore o sistema sem cadastro

## Tecnologias

- Frontend: JavaScript puro, sem frameworks, sistema i18n próprio com troca dinâmica de idioma
- Backend: Node.js + Cloudflare Workers (edge, global)
- Banco de dados: Cloudflare D1 (SQLite)
- Hospedagem: Cloudflare Pages

## Início rápido

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Implantação no Cloudflare Pages:

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**Conta de teste**: usuário `test`, senha `test123` — ou clique no botão "Demonstração instantânea" para explorar sem login.

## Demonstração online

https://hwi18n.106605.xyz/

## Licença

MIT
