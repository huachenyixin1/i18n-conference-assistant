import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';

import authRoutes from './routes/auth.js';
import conferencesRoutes from './routes/conferences.js';
import participantsRoutes from './routes/participants.js';
import seatingRoutes from './routes/seating.js';
import hotelRoutes from './routes/hotel.js';
import restaurantRoutes from './routes/restaurant.js';
import transportRoutes from './routes/transport.js';
import adminRoutes from './routes/admin.js';
import statsRoutes from './routes/stats.js';

const app = new Hono();

app.use('*', logger());

// 全局安全头中间件
app.use('*', async (c, next) => {
  // Content Security Policy - 防止XSS攻击
  c.header('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://cloudflareinsights.com; " +
    "frame-ancestors 'none';"
  );

  // 防止点击劫持
  c.header('X-Frame-Options', 'DENY');

  // HTTPS强制 - 防止降级攻击
  c.header('Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload');

  // 防止MIME类型嗅探
  c.header('X-Content-Type-Options', 'nosniff');

  // XSS保护（旧浏览器）
  c.header('X-XSS-Protection', '1; mode=block');

  // Referrer策略
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 权限策略
  c.header('Permissions-Policy',
    'geolocation=(), microphone=(), camera=()');

  await next();
});

// CORS配置 - 使用Hono的cors中间件
app.use('*', async (c, next) => {
  // 从环境变量获取允许的域名列表
  const allowedOrigins = c.env.ALLOWED_ORIGINS
    ? c.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
      'https://hwi18n.106605.xyz',
      'https://i18n.106605.xyz',
      'https://hwi18n.pages.dev',
      'http://localhost:8080'  // 开发环境
    ];

  const origin = c.req.header('Origin');

  // 使用cors中间件配置
  const corsMiddleware = cors({
    origin: (origin) => {
      // 如果origin在允许列表中，返回该origin
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      // 否则拒绝跨域请求
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  return corsMiddleware(c, next);
});

app.use('*', trimTrailingSlash());

// 支持 /api 前缀的路由（Pages代理用）
app.route('/api/auth', authRoutes);
app.route('/api/conferences', conferencesRoutes);
app.route('/api/participants', participantsRoutes);
app.route('/api/seating', seatingRoutes);
app.route('/api/hotel', hotelRoutes);
app.route('/api/restaurant', restaurantRoutes);
app.route('/api/transport', transportRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/stats', statsRoutes);

// 也支持不带 /api 前缀的路由（直接访问Workers用）
app.route('/auth', authRoutes);
app.route('/conferences', conferencesRoutes);
app.route('/participants', participantsRoutes);
app.route('/seating', seatingRoutes);
app.route('/hotel', hotelRoutes);
app.route('/restaurant', restaurantRoutes);
app.route('/transport', transportRoutes);
app.route('/admin', adminRoutes);
app.route('/stats', statsRoutes);

app.get('/', (c) => {
  return c.json({
    message: '会议接待助手 API',
    version: '3.0.0',
    platform: 'cloudflare-workers'
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
