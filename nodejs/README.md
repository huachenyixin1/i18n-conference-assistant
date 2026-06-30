# 会议接待助手系统 (Node.js版)

基于 Cloudflare Workers + D1 数据库的会议接待管理系统。

## 项目结构

```
nodejs/
├── src/                    # 后端源代码
│   ├── index.js            # 主入口
│   ├── middleware/         # 中间件
│   │   └── auth.js         # 认证中间件
│   ├── routes/             # API路由
│   │   ├── admin.js        # 管理员接口
│   │   ├── auth.js         # 认证接口
│   │   ├── conferences.js  # 会议接口
│   │   ├── hotel.js        # 住宿接口
│   │   ├── participants.js # 参会人接口
│   │   ├── restaurant.js   # 用餐接口
│   │   ├── seating.js      # 座位接口
│   │   ├── stats.js        # 统计接口
│   │   └── transport.js    # 接送接口
│   └── utils/              # 工具函数
│       ├── crypto.js       # 加密工具
│       └── jwt.js          # JWT工具
│
├── static/                 # 前端静态文件
│   ├── index.html          # 主页面(SPA)
│   ├── admin.html          # 管理后台页面
│   ├── conference_create.html # 会议创建页面
│   ├── css/
│   │   └── main.css        # 主样式文件
│   └── js/
│       ├── api.js          # API请求封装
│       ├── app.js          # 应用主逻辑
│       ├── auth.js         # 认证逻辑
│       ├── conference.js   # 会议管理
│       ├── dashboard.js    # 数据看板
│       ├── hotel.js        # 住宿管理
│       ├── participants.js # 参会人管理
│       ├── profile.js      # 用户信息
│       ├── restaurant.js   # 用餐管理
│       ├── seating.js      # 座位管理
│       └── transport.js    # 接送管理
│
├── schema.sql             # 数据库表结构定义
├── schema_export.sql      # 从D1导出的完整数据备份
├── wrangler.toml          # Cloudflare配置
├── package.json           # Node.js依赖
└── functions/api/[[path]].js # Pages Functions入口
```

## 功能模块

### 1. 用户认证
- 用户注册（需邀请码）
- 用户登录
- 密码重置
- 邀请码续期

### 2. 会议管理
- 创建/编辑/删除会议
- 会议列表
- 会议详情
- 会议切换

### 3. 参会人管理
- 导入参会人（Excel）
- 参会人列表
- 参会人编辑
- 参会人签到

### 4. 座位分配
- 座位区域配置
- 自动座位分配
- 手动座位调整
- 座位导出PDF

### 5. 住宿管理
- 酒店房间配置
- 房间分配
- 房间状态管理

### 6. 用餐管理
- 餐厅桌位配置
- 桌位分配
- 用餐安排

### 7. 接送管理
- 车辆管理
- 行程任务
- 乘客分配
- 行程导出PDF

### 8. 管理后台
- 邀请码生成
- 用户管理
- 数据统计

## 部署说明

### Cloudflare Workers 部署

```bash
# 安装依赖
npm install

# 部署Worker
npx wrangler deploy

# 部署前端Pages
npx wrangler pages deploy static --project-name=hwnodejs
```

### 环境变量配置

在 Cloudflare Dashboard 设置以下环境变量：

- `JWT_SECRET_KEY`: JWT密钥
- `ENCRYPTION_KEY`: 数据加密密钥
- `DOMAIN`: 前端域名（用于邮件链接）

### D1 数据库初始化

```bash
# 创建数据库
npx wrangler d1 create jdyspa-db

# 执行schema初始化
npx wrangler d1 execute jdyspa-db --file=schema.sql --remote

# 导出当前数据库结构（备份）
npx wrangler d1 export jdyspa-db --remote --output=schema_export.sql
```

## 管理员账号

- 用户名: `admin`
- 密码: `admin123`

## API 接口

### 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码
- `POST /api/auth/invitation-codes/use` - 使用邀请码续期

### 会议接口
- `GET /api/conferences` - 获取会议列表
- `POST /api/conferences` - 创建会议
- `GET /api/conferences/:id` - 获取会议详情
- `PUT /api/conferences/:id` - 更新会议
- `DELETE /api/conferences/:id` - 删除会议

### 参会人接口
- `GET /api/participants` - 获取参会人列表
- `POST /api/participants/import` - 导入参会人
- `PUT /api/participants/:id` - 更新参会人
- `DELETE /api/participants/:id` - 删除参会人

### 其他接口
详见各路由文件。

## 邀请码有效期逻辑

邀请码续期采用"取最晚"逻辑：

```
用户最终有效期 = max(当前有效期, 邀请码创建日期 + 有效天数)
```

示例：
- 用户当前有效期: 2028-06-06
- 邀请码创建日期: 2026-06-07，有效天数: 365
- 邀请码有效期: 2027-06-07
- 最终有效期: max(2028-06-06, 2027-06-07) = 2028-06-06

## 开发说明

### 本地开发

```bash
# 启动本地开发服务器
npx wrangler dev
```

### 前端访问地址

- 用户端: `https://hwnodejs.pages.dev/`
- 管理后台: `https://hwnodejs.pages.dev/admin`

### 后端API地址

- `https://hwnodejs.j3713212.workers.dev/`

## 技术栈

- **后端**: Hono (Cloudflare Workers)
- **数据库**: Cloudflare D1 (SQLite)
- **认证**: JWT
- **加密**: PBKDF2 + AES
- **前端**: 纯HTML/CSS/JS (SPA)
- **部署**: Cloudflare Workers + Pages

## 版本历史

- 2026-06: Node.js版本重构完成
- 2026-05: 添加邀请码续期功能
- 2026-04: 添加用户有效期控制
- 2026-03: 初始版本

## 注意事项

1. 邀请码状态: `active`（管理员创建）和 `unused`（系统默认）都可用于续期
2. 用户有效期过期后禁止创建新会议，但可查看已有数据
3. 前端部署后需清除Cloudflare缓存才能看到更新
4. `schema.sql` 是干净的表结构定义，`schema_export.sql` 是包含数据的完整备份

## 联系方式

如有问题请联系开发团队。