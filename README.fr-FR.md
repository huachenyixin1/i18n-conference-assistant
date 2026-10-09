[English](./README.en-US.md) | [**中文**](./README.md) | [日本語](./README.ja-JP.md) | [Melayu](./README.ms-MY.md) | [Tiếng Việt](./README.vi-VN.md) | [ភាសាខ្មែរ](./README.km-KH.md) | [Монгол](./README.mn-MN.md) | [བོད་](./README.bo-CN.md) | [ไทย](./README.th-TH.md) | [한국어](./README.ko-KR.md) | [Bahasa Indonesia](./README.id-ID.md) | [हिन्दी](./README.hi-IN.md) | [**Français**](./README.fr-FR.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [العربية](./README.ar-SA.md)

# Assistant d'accueil de conférence — Système multilingue

Système de gestion de l'accueil des conférences avec prise en charge multilingue intégrée. L'interface et les données basculent automatiquement selon la langue choisie par l'utilisateur, offrant une expérience localisée aux invités de différents pays et régions.

## Langues prises en charge (16)

中文简体 / English / 日本語 / 한국어 / ไทย / Tiếng Việt / Bahasa Indonesia / Bahasa Melayu / हिन्दी / བོད་ཡིག / Монгол / ភាសាខ្មែរ / العربية / Русский / Français / Português (BR)

## Fonctionnalités principales

1. **Gestion des participants** — ajout, modification, suppression ; import en masse depuis un modèle Excel ; validation des données
2. **Statistiques du congrès** — comptage en temps réel des participants, hébergements, repas et transports
3. **Interface multilingue** — tous les éléments (boutons, titres, aides) sont traduits
4. **Données multilingues** — les données de démo peuvent être filtrées par langue
5. **Démo instantanée** — découvrez le système sans inscription

## Stack technique

- Frontend : JavaScript pur, sans framework, système i18n maison avec changement de langue dynamique
- Backend : Node.js + Cloudflare Workers (edge, mondial)
- Base de données : Cloudflare D1 (SQLite)
- Hébergement : Cloudflare Pages

## Démarrage rapide

```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant/nodejs
npm install
npm start
```

Déploiement sur Cloudflare Pages :

```bash
npx wrangler pages deploy static --project-name=hwi18n
```

**Compte de test** : identifiant `test`, mot de passe `test123` — ou cliquez sur « Démo instantanée » pour explorer sans vous connecter.

## Démo en ligne

https://hwi18n.106605.xyz/

## Licence

MIT
