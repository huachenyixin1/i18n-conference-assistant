import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { authMiddleware, getCurrentUserId } from '../middleware/auth.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { createToken } from '../utils/jwt.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';
import { validateEmail, validateUsername, validateStringLength, validateInvitationCode } from '../utils/validation.js';

const app = new Hono();

// 暴力破解防护配置
const MAX_ATTEMPTS = 5;  // 最大失败次数
const LOCKOUT_TIME = 15 * 60 * 1000;  // 锁定时间（15分钟）

// 密码强度验证函数
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('密码至少8个字符');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  // 检查常见弱密码
  const weakPasswords = [
    'password', '12345678', 'admin123', 'qwerty123',
    'letmein', 'welcome', 'monkey', 'dragon'
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('密码过于简单，请选择其他密码');
  }

  // 检查连续字符
  if (/(.)\1{2,}/.test(password)) {
    errors.push('密码不应包含连续重复字符');
  }

  // 检查顺序字符
  if (/abc|123|qwe|asd/i.test(password)) {
    errors.push('密码不应包含顺序字符');
  }

  return errors;
}

/**
 * 检查账户是否被锁定
 * @param {Object} c - Hono context
 * @param {string} username - 用户名
 * @returns {Object} - {locked: boolean, remainingTime: number}
 */
async function checkLoginAttempts(c, username) {
  if (!c.env.KV) {
    // 如果没有KV，跳过检查（开发环境）
    return { locked: false };
  }

  const attempts = await c.env.KV.get(`login_attempts:${username}`);
  const lockTime = await c.env.KV.get(`login_lock:${username}`);

  if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
    if (lockTime && Date.now() - parseInt(lockTime) < LOCKOUT_TIME) {
      const remainingTime = Math.ceil((LOCKOUT_TIME - (Date.now() - parseInt(lockTime))) / 60000);
      return {
        locked: true,
        remainingTime
      };
    }
    // 锁定时间已过，清除记录
    await c.env.KV.delete(`login_attempts:${username}`);
    await c.env.KV.delete(`login_lock:${username}`);
  }

  return { locked: false };
}

/**
 * 记录登录失败
 * @param {Object} c - Hono context
 * @param {string} username - 用户名
 * @returns {number} - 当前失败次数
 */
async function recordFailedAttempt(c, username) {
  if (!c.env.KV) {
    // 如果没有KV，跳过记录（开发环境）
    return 1;
  }

  const attempts = await c.env.KV.get(`login_attempts:${username}`);
  const newAttempts = (attempts ? parseInt(attempts) : 0) + 1;

  await c.env.KV.put(`login_attempts:${username}`, String(newAttempts), {
    expirationTtl: 3600  // 1小时后自动清除
  });

  if (newAttempts >= MAX_ATTEMPTS) {
    await c.env.KV.put(`login_lock:${username}`, String(Date.now()), {
      expirationTtl: LOCKOUT_TIME / 1000  // 锁定时间后自动清除
    });
  }

  return newAttempts;
}

/**
 * 清除登录失败记录
 * @param {Object} c - Hono context
 * @param {string} username - 用户名
 */
async function clearLoginAttempts(c, username) {
  if (!c.env.KV) {
    return;
  }

  await c.env.KV.delete(`login_attempts:${username}`);
  await c.env.KV.delete(`login_lock:${username}`);
}

app.post('/register', async (c) => {
  const db = c.env.DB;
  const { username, email, password, invitation_code } = await c.req.json();

  // 输入验证
  if (!validateUsername(username)) {
    return errorResponse(c, ErrorCodes.INVALID_INPUT,
      '用户名格式不正确（3-20个字符，只能包含字母、数字、下划线）', 400);
  }

  if (email && !validateEmail(email)) {
    return errorResponse(c, ErrorCodes.INVALID_INPUT, '邮箱格式不正确', 400);
  }

  if (!validateStringLength(password, 8, 100)) {
    return errorResponse(c, ErrorCodes.INVALID_INPUT, '密码长度必须在8-100个字符之间', 400);
  }

  if (!validateInvitationCode(invitation_code)) {
    return errorResponse(c, ErrorCodes.INVALID_INPUT, '邀请码格式不正确', 400);
  }

  // 密码强度验证
  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    return errorResponse(c, ErrorCodes.WEAK_PASSWORD,
      `密码强度不足：${passwordErrors.join(', ')}`, 400);
  }

  if (!invitation_code) {
    return errorResponse(c, ErrorCodes.INVALID_INVITATION_CODE);
  }

  const existingUser = await db.prepare(
    'SELECT id FROM users WHERE username = ?'
  ).bind(username).first();

  if (existingUser) {
    return errorResponse(c, ErrorCodes.USER_ALREADY_EXISTS);
  }

  if (email) {
    const existingEmail = await db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    if (existingEmail) {
      return errorResponse(c, ErrorCodes.EMAIL_ALREADY_REGISTERED);
    }
  }

  const invitation = await db.prepare(
    'SELECT id, duration_days, max_uses, used_count FROM invitation_codes WHERE code = ?'
  ).bind(invitation_code).first();

  if (!invitation) {
    return errorResponse(c, ErrorCodes.INVALID_INVITATION_CODE);
  }

  if (invitation.used_count >= invitation.max_uses) {
    return errorResponse(c, ErrorCodes.INVITATION_CODE_LIMIT);
  }

  const hashedPassword = await hashPassword(password);
  const now = new Date().toISOString();
  const subscriptionEnd = new Date(Date.now() + invitation.duration_days * 24 * 60 * 60 * 1000).toISOString();

  const result = await db.prepare(`
    INSERT INTO users (username, email, hashed_password, invitation_code_id, subscription_start, subscription_end, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(username, email || null, hashedPassword, invitation.id, now, subscriptionEnd, now).run();

  const userId = result.meta.last_row_id;

  const newUsedCount = (invitation.used_count || 0) + 1;
  const newStatus = newUsedCount >= invitation.max_uses ? 'used' : 'active';

  await db.prepare(
    'UPDATE invitation_codes SET status = ?, used_count = ?, last_used_at = ? WHERE id = ?'
  ).bind(newStatus, newUsedCount, now, invitation.id).run();

  return c.json({
    id: userId,
    username,
    email: email || null,
    subscription_start: now,
    subscription_end: subscriptionEnd
  });
});

app.post('/login', async (c) => {
  const db = c.env.DB;
  const contentType = c.req.header('content-type') || '';
  let username, password;

  if (contentType.includes('application/json')) {
    const body = await c.req.json();
    username = body.username;
    password = body.password;
  } else {
    const formData = await c.req.formData();
    username = formData.get('username');
    password = formData.get('password');
  }

  // 检查是否被锁定（暴力破解防护）
  const lockStatus = await checkLoginAttempts(c, username);
  if (lockStatus.locked) {
    return errorResponse(c, ErrorCodes.ACCOUNT_LOCKED,
      `账户已锁定，请${lockStatus.remainingTime}分钟后重试`, 403);
  }

  const user = await db.prepare(
    'SELECT * FROM users WHERE username = ?'
  ).bind(username).first();

  if (!user || !(await verifyPassword(password, user.hashed_password))) {
    // 记录失败次数
    const attempts = await recordFailedAttempt(c, username);
    return errorResponse(c, ErrorCodes.INVALID_CREDENTIALS,
      `用户名或密码错误（剩余尝试次数：${MAX_ATTEMPTS - attempts}）`, 401);
  }

  if (!user.is_active) {
    return errorResponse(c, ErrorCodes.USER_DISABLED);
  }

  // 登录成功，清除失败记录
  await clearLoginAttempts(c, username);

  const now = new Date().toISOString();
  await db.prepare(
    'UPDATE users SET last_active_at = ? WHERE id = ?'
  ).bind(now, user.id).run();

  const token = await createToken({ sub: String(user.id) }, c.env.JWT_SECRET_KEY);

  // 设置HttpOnly Cookie（安全改进）
  setCookie(c, 'auth_token', token, {
    httpOnly: true,  // JavaScript无法访问，防止XSS窃取
    secure: true,    // 只在HTTPS传输
    sameSite: 'Strict',  // CSRF保护
    maxAge: 24 * 3600,   // 24小时有效期
    path: '/'  // 全站可用
  });

  // 返回用户信息（不再返回Token）
  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email || null
    },
    message: '登录成功'
  });
});

// Logout接口 - 清除Cookie
app.post('/logout', async (c) => {
  // 清除HttpOnly Cookie
  c.cookie('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 0,  // 立即过期
    path: '/'
  });

  return c.json({ message: '已退出登录' });
});

app.get('/me', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);

  const user = await db.prepare(
    'SELECT id, username, email, is_admin, subscription_start, subscription_end, last_active_at, created_at FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return errorResponse(c, ErrorCodes.USER_NOT_FOUND, 404);
  }

  return c.json(user);
});

app.post('/change-password', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);
  const { old_password, new_password } = await c.req.json();

  const user = await db.prepare(
    'SELECT hashed_password FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!(await verifyPassword(old_password, user.hashed_password))) {
    return errorResponse(c, ErrorCodes.CURRENT_PASSWORD_ERROR);
  }

  if (new_password.length < 6) {
    return errorResponse(c, ErrorCodes.PASSWORD_LENGTH_ERROR);
  }

  const hashedPassword = await hashPassword(new_password);
  await db.prepare(
    'UPDATE users SET hashed_password = ? WHERE id = ?'
  ).bind(hashedPassword, userId).run();

  return c.json({ message: '密码修改成功' });
});

app.post('/forgot-password', async (c) => {
  const db = c.env.DB;
  const { email } = await c.req.json();

  // 验证邮箱格式
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse(c, ErrorCodes.INVALID_INPUT, '邮箱格式不正确', 400);
  }

  const user = await db.prepare(
    'SELECT id, username FROM users WHERE email = ?'
  ).bind(email).first();

  // 安全改进：统一响应，防止用户枚举
  const responseMessage = '如果该邮箱已注册，密码将重置为默认密码';

  if (user) {
    // 生成随机临时密码（更安全）
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(tempPassword);

    await db.prepare(
      'UPDATE users SET hashed_password = ? WHERE id = ?'
    ).bind(hashedPassword, user.id).run();

    // TODO: 实际应用中应该发送邮件通知用户
    // sendResetEmail(email, tempPassword).catch(err => console.error('发送邮件失败:', err));
  }

  // 统一返回成功响应（无论用户是否存在）
  return c.json({ message: responseMessage });
});

app.post('/invitation-codes/validate', async (c) => {
  const db = c.env.DB;
  const code = c.req.query('code');

  const invitation = await db.prepare(
    'SELECT duration_days FROM invitation_codes WHERE code = ? AND status IN (?, ?)'
  ).bind(code, 'active', 'unused').first();

  if (!invitation) {
    return errorResponse(c, ErrorCodes.INVALID_INVITATION_CODE);
  }

  return c.json({ valid: true, duration_days: invitation.duration_days });
});

app.post('/invitation-codes/use', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);
  const { code } = await c.req.json();
  const now = new Date();

  const invitation = await db.prepare(
    'SELECT id, duration_days, created_at FROM invitation_codes WHERE code = ? AND status IN (?, ?)'
  ).bind(code, 'active', 'unused').first();

  if (!invitation) {
    return errorResponse(c, ErrorCodes.INVALID_INVITATION_CODE);
  }

  const user = await db.prepare(
    'SELECT subscription_end FROM users WHERE id = ?'
  ).bind(userId).first();

  // 邀请码的有效期 = 创建日期 + 有效天数
  const codeEndDate = new Date(invitation.created_at);
  codeEndDate.setDate(codeEndDate.getDate() + invitation.duration_days);

  // 用户最终有效期 = max(当前有效期, 邀请码有效期)
  const currentEnd = user.subscription_end ? new Date(user.subscription_end) : null;
  const newEnd = currentEnd && currentEnd > codeEndDate ? currentEnd : codeEndDate;

  await db.prepare(
    'UPDATE users SET subscription_end = ? WHERE id = ?'
  ).bind(newEnd.toISOString(), userId).run();

  await db.prepare(
    'UPDATE invitation_codes SET status = ?, used_by = ?, used_at = ? WHERE id = ?'
  ).bind('used', userId, now.toISOString(), invitation.id).run();

  return c.json({ message: '续期成功', subscription_end: newEnd.toISOString() });
});

// 获取用户的邀请码使用记录
app.get('/invitation-codes/my-history', authMiddleware, async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);

  const codes = await db.prepare(
    'SELECT code, used_at, duration_days FROM invitation_codes WHERE used_by = ? ORDER BY used_at DESC'
  ).bind(userId).all();

  return c.json(codes.results || []);
});

export default app;
