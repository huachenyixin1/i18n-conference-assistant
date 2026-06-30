# 会议接待助手 - 多语言国际化系统

## 项目简介

这是一个支持17种语言的会议接待管理系统，实现了完整的多语言国际化功能。系统可以根据用户选择的语言自动切换界面和数据显示，为不同国家和地区的用户提供本地化的服务体验。

## 主要功能

### 🌍 多语言支持
支持17种语言的实时切换：
- 中文（简体） - zh-CN
- 英语 - en-US
- 日语 - ja-JP
- 韩语 - ko-KR
- 越南语 - vi-VN
- 泰语 - th-TH
- 印尼语 - id-ID
- 马来语 - ms-MY
- 高棉语（柬埔寨） - km-KH
- 蒙语 - mn-MN
- 藏语 - bo-CN
- 印地语 - hi-IN
- 法语 - fr-FR
- 葡萄牙语（巴西） - pt-BR
- 俄语 - ru-RU
- 阿拉伯语 - ar-SA

### 🎯 核心功能
1. **参与者管理**：增删改查、批量导入、模板下载、数据验证
2. **会议统计**：实时统计参会人数、住宿、用餐、交通等信息
3. **多语言界面**：所有界面元素（按钮、标题、提示等）自动翻译
4. **多语言数据**：演示数据支持按语言过滤显示
5. **快速体验**：一键体验功能，无需注册即可查看系统功能

### 💡 技术特点
- 前端：原生JavaScript实现，无需框架依赖
- 国际化：自定义i18n系统，支持动态语言切换
- 后端：Node.js + Cloudflare Workers
- 数据库：Cloudflare D1（SQLite）
- 部署：Cloudflare Pages，支持自动部署

## 项目结构

```
i18n/
├── nodejs/
│   ├── static/
│   │   ├── index.html          # 主页面
│   │   ├── css/
│   │   │   └── main.css        # 样式文件
│   │   └── js/
│   │       ├── i18n/
│   │       │   ├── i18n.js     # 国际化核心逻辑
│   │       │   ├── zh-CN.js    # 中文语言包
│   │       │   ├── en-US.js    # 英语语言包
│   │       │   └── ...         # 其他语言包
│   │       ├── auth.js         # 登录认证
│   │       ├── participants.js # 司仪者管理
│   │       └── main.js         # 主逻辑
│   └── server.js               # 服务器入口
│   └── package.json            # 项目配置
├── cloudflare/
│   └── workers/                # Cloudflare Workers配置
│   └── d1/                     # 数据库配置
└── README.md                   # 项目说明文档
```

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/YOUR_USERNAME/i18n-conference-assistant.git
cd i18n-conference-assistant
```

### 2. 安装依赖
```bash
cd nodejs
npm install
```

### 3. 配置Cloudflare
- 创建Cloudflare账号
- 创建D1数据库
- 配置Workers和Pages

### 4. 本地开发
```bash
npm start
```

### 5. 部署到Cloudflare Pages
```bash
npx wrangler pages deploy static --project-name=hwi18n
```

## 使用说明

### 登录系统
- **测试账号**：用户名 `test`，密码 `test123`
- **快速体验**：点击"立即体验"按钮，无需登录即可查看演示数据

### 切换语言
在登录页面右上角选择语言，系统会自动切换：
- 所有界面文字翻译
- 表格标题和按钮翻译
- 演示数据按语言过滤显示

### 参与者管理
- **添加**：点击"添加"按钮，填写参与者信息
- **编辑**：点击表格中的"编辑"按钮
- **删除**：点击表格中的"删除"按钮
- **批量导入**：下载模板，填写Excel数据，批量导入
- **数据验证**：验证导入数据的正确性

## 技术架构

### 前端技术栈
- **原生JavaScript**：无框架依赖，轻量高效
- **CSS3**：现代化样式，支持响应式设计
- **HTML5**：语义化标签，良好的可访问性

### 国际化实现
- **语言包管理**：每个语言独立的语言包文件
- **动态翻译**：通过data-i18n属性自动翻译
- **语言切换**：实时切换，无需刷新页面
- **数据过滤**：根据语言过滤显示对应的演示数据

### 后端技术栈
- **Node.js**：轻量级后端服务
- **Cloudflare Workers**：边缘计算，全球部署
- **Cloudflare D1**：SQLite数据库，云端托管

## 数据库设计

### 主要表结构

#### participants（参与者表）
```sql
CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    conference_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    company TEXT NOT NULL,
    department TEXT,
    position TEXT,
    title TEXT,
    is_attending INTEGER DEFAULT 0,
    has_meal INTEGER DEFAULT 0,
    has_hotel INTEGER DEFAULT 0,
    has_transport INTEGER DEFAULT 0,
    language TEXT DEFAULT 'zh-CN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 部署说明

### Cloudflare Pages自动部署
1. 连接GitHub仓库到Cloudflare Pages
2. 配置构建命令：`cd nodejs && npm install`
3. 配置输出目录：`nodejs/static`
4. 每次推送代码到GitHub，自动触发部署

### 数据库配置
1. 创建D1数据库
2. 配置数据库ID和API Token
3. 运行数据库迁移脚本

## 开发团队

本项目是一个多语言国际化演示项目，展示了如何实现完整的多语言支持功能。

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues联系我们。

## 更新日志

### v1.0.0 (2025-06-30)
- ✅ 完成17种语言的国际化支持
- ✅ 实现参与者管理功能
- ✅ 实现多语言数据过滤显示
- ✅ 完成Cloudflare Pages部署
- ✅ 添加快速体验功能
- ✅ 修复所有语言数据显示问题
- ✅ 完善按钮样式和位置

---

**在线演示**：https://hwi18n.106605.xyz/

**项目地址**：https://github.com/YOUR_USERNAME/i18n-conference-assistant