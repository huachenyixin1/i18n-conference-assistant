import { verifyToken } from '../utils/jwt.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';
import { getCookie } from 'hono/cookie';

export async function authMiddleware(c, next) {
  // 从Cookie读取Token（安全改进）
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
    || getCookie(c, 'auth_token');  // 优先从Cookie读取

  if (!token) {
    return errorResponse(c, ErrorCodes.PERMISSION_DENIED, 401);
  }

  const secret = c.env.JWT_SECRET_KEY;
  const payload = await verifyToken(token, secret);

  if (!payload) {
    return errorResponse(c, ErrorCodes.SESSION_EXPIRED, 401);
  }

  c.set('userId', parseInt(payload.sub));
  await next();
}

export async function adminMiddleware(c, next) {
  const db = c.env.DB;
  const userId = c.get('userId');

  const result = await db.prepare(
    'SELECT is_admin FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!result || !result.is_admin) {
    return errorResponse(c, ErrorCodes.PERMISSION_DENIED, 403);
  }

  await next();
}

export function getCurrentUserId(c) {
  return c.get('userId');
}
