# 多语言会议接待系统 | Multi-language Conference Assistant

基于 Cloudflare Workers + Pages + D1 构建的多语言会议接待管理系统，原生支持 **16 种界面语言**，覆盖亚洲主要语言与常用国际语言。

Built on Cloudflare Workers + Pages + D1, with native support for **16 interface languages**.

## 支持语言 | Supported Languages

| # | 代码 Code | 语言 Language | 界面原名 Native Name |
|---|-----------|---------------|----------------------|
| 1 | `zh-CN` | 简体中文 | 中文 |
| 2 | `en-US` | 英语 English | English |
| 3 | `ja-JP` | 日语 Japanese | 日本語 |
| 4 | `ko-KR` | 韩语 Korean | 한국어 |
| 5 | `th-TH` | 泰语 Thai | ภาษาไทย |
| 6 | `vi-VN` | 越南语 Vietnamese | Tiếng Việt |
| 7 | `id-ID` | 印尼语 Indonesian | Bahasa Indonesia |
| 8 | `ms-MY` | 马来语 Malay | Bahasa Melayu |
| 9 | `hi-IN` | 印地语 Hindi | हिन्दी |
| 10 | `bo-CN` | 藏语 Tibetan | བོད་ཡིག |
| 11 | `mn-MN` | 蒙古语 Mongolian | Монгол |
| 12 | `km-KH` | 高棉语（柬埔寨）Khmer | ភាសាខ្មែរ |
| 13 | `ar-SA` | 阿拉伯语 Arabic | العربية |
| 14 | `ru-RU` | 俄语 Russian | Русский |
| 15 | `fr-FR` | 法语 French | Français |
| 16 | `pt-BR` | 葡萄牙语（巴西）Portuguese | Português |

> 语言切换在登录页与系统头部均可一键完成，选择结果自动记忆。

## 功能特性 | Features

- **多语言界面**：16 种语言全量翻译，含藏文、高棉文等复杂文字排版
- **会议接待管理**：会议信息、参会人员、座位安排、用餐、酒店住宿、车辆行程一站式管理
- **邀请码注册**：邀请码控制注册与订阅时长，支持次数限制
- **安全机制**：登录失败锁定（暴力破解防护）、HttpOnly Cookie 会话、密码哈希存储
- **订阅管理**：按邀请码时长自动计算订阅有效期

## 技术架构 | Architecture

| 组件 | 说明 |
|------|------|
| Cloudflare Workers | API 服务（Hono 框架），自定义域名接入 |
| Cloudflare Pages | 前端静态资源托管 + Functions 反向代理 |
| Cloudflare D1 | 主数据库（用户、会议、人员、邀请码等） |
| Cloudflare KV | 登录失败计数 / 锁定状态等临时状态 |
| 前端 | 原生 HTML/CSS/JS，无构建依赖 |

## 目录结构 | Structure

```
i18n/
└── nodejs/
    ├── src/                  # Worker API 源码（Hono）
    │   ├── routes/           # 路由：auth、会议、座位、酒店等
    │   ├── middleware/       # 认证中间件
    │   └── utils/            # 加密、校验、错误码
    ├── static/               # 前端静态文件（Pages 部署）
    │   ├── index.html        # 单页应用入口
    │   ├── js/i18n/          # 16 个语言包（zh-CN.js、en-US.js ...）
    │   └── css/              # 样式
    └── functions/api/        # Pages Functions 反向代理到 Worker
```

## 多语言实现 | i18n Implementation

- 语言包位于 `static/js/i18n/<lang>.js`，每个文件导出该语言的全量文案对象
- 页面通过 `switchLang(lang, scope)` 切换语言，选择结果持久化到本地
- 新增语言只需：
  1. 复制任意语言包为 `static/js/i18n/<新代码>.js` 并翻译
  2. 在 `index.html` 的登录页与头部语言列表各加一项 `<li data-lang="...">`
  3. 无需改动后端

## 部署 | Deployment

```bash
# API（Workers）
npx wrangler deploy

# 前端（Pages，生产分支为 main）
npx wrangler pages deploy static --project-name=hwi18n --branch main
```

密码策略：注册与修改密码仅要求**至少 6 位**，无复杂度限制（测试系统定位）。
