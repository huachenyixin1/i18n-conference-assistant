// Cloudflare Pages Functions - API代理
// 通过环境变量 API_BASE_URL 配置后端地址

export async function onRequest(context) {
  const { request, env } = context;

  // 从环境变量获取后端API地址
  const API_BASE_URL = env.API_BASE_URL || 'https://hwi18n.j3713212.workers.dev';

  // 获取请求路径
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const targetUrl = `${API_BASE_URL}${path}${url.search}`;

  // 从环境变量获取允许的域名列表
  const allowedOrigins = env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
      'https://hwi18n.106605.xyz',
      'https://i18n.106605.xyz',
      'https://hwi18n.pages.dev',
      'http://localhost:8080'  // 开发环境
    ];

  const origin = request.headers.get('Origin');

  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    const headers = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true'
    };

    // 如果origin在允许列表中，设置对应的CORS头
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }

    return new Response(null, {
      status: 204,
      headers
    });
  }

  // 构建代理请求headers
  const proxyHeaders = new Headers();
  request.headers.forEach((value, key) => {
    // 转发必要的headers，排除一些不需要的
    if (key.toLowerCase() !== 'host' &&
      key.toLowerCase() !== 'origin' &&
      key.toLowerCase() !== 'referer') {
      proxyHeaders.set(key, value);
    }
  });

  // 构建代理请求
  const proxyOptions = {
    method: request.method,
    headers: proxyHeaders
  };

  // 对于有body的请求，需要读取并转发
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // 获取Content-Type判断请求类型
    const contentType = request.headers.get('Content-Type') || '';

    if (contentType.includes('multipart/form-data')) {
      // FormData请求，直接传递body
      proxyOptions.body = request.body;
    } else if (contentType.includes('application/json')) {
      // JSON请求
      const bodyText = await request.text();
      proxyOptions.body = bodyText;
    } else {
      // 其他类型（如application/x-www-form-urlencoded）
      const bodyText = await request.text();
      proxyOptions.body = bodyText;
    }
  }

  // 发送请求到后端
  try {
    const response = await fetch(targetUrl, proxyOptions);

    // 构建响应headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    // 安全响应头
    responseHeaders.set('X-Frame-Options', 'DENY');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    responseHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    responseHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none';");
    responseHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    responseHeaders.set('X-XSS-Protection', '1; mode=block');

    // CORS配置 - 只允许指定域名
    if (origin && allowedOrigins.includes(origin)) {
      responseHeaders.set('Access-Control-Allow-Origin', origin);
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    }
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('API代理请求失败:', error);
    return new Response(JSON.stringify({ detail: 'API代理请求失败: ' + error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  }
}