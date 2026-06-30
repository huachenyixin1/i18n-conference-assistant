import { Hono } from 'hono';
import { authMiddleware, adminMiddleware, getCurrentUserId } from '../middleware/auth.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';
import { ALLOWED_USER_FIELDS, validateUpdateData } from '../utils/database.js';

const app = new Hono();

app.use('*', authMiddleware);
app.use('*', adminMiddleware);

app.get('/stats', async (c) => {
  const db = c.env.DB;

  const users = await db.prepare('SELECT COUNT(*) as count FROM users').first();
  const conferences = await db.prepare('SELECT COUNT(*) as count FROM conferences').first();
  const participants = await db.prepare('SELECT COUNT(*) as count FROM participants').first();
  const invitationCodes = await db.prepare('SELECT COUNT(*) as count FROM invitation_codes').first();
  const usedCodes = await db.prepare("SELECT COUNT(*) as count FROM invitation_codes WHERE status = 'used'").first();

  return c.json({
    users: users?.count || 0,
    conferences: conferences?.count || 0,
    participants: participants?.count || 0,
    invitation_codes: invitationCodes?.count || 0,
    used_codes: usedCodes?.count || 0
  });
});

app.get('/users', async (c) => {
  const db = c.env.DB;

  const result = await db.prepare(`
    SELECT id, username, email, is_admin, subscription_start, subscription_end, last_active_at, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  return c.json(result.results);
});

app.post('/users/:id/renew', async (c) => {
  const db = c.env.DB;
  const userId = c.req.param('id');
  const { days } = await c.req.json();

  const user = await db.prepare(
    'SELECT subscription_end FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return errorResponse(c, ErrorCodes.USER_NOT_FOUND, 404);
  }

  const now = new Date();
  let newEnd;
  if (user.subscription_end && new Date(user.subscription_end) > now) {
    newEnd = new Date(user.subscription_end);
  } else {
    newEnd = now;
  }
  newEnd.setDate(newEnd.getDate() + (days || 30));

  await db.prepare(
    'UPDATE users SET subscription_end = ? WHERE id = ?'
  ).bind(newEnd.toISOString(), userId).run();

  return c.json({ success: true, subscription_end: newEnd.toISOString() });
});

app.put('/users/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.req.param('id');
  const { subscription_start, subscription_end, is_active } = await c.req.json();

  // 构建更新数据
  const updateData = {};
  if (subscription_start !== undefined) updateData.subscription_start = subscription_start;
  if (subscription_end !== undefined) updateData.subscription_end = subscription_end;
  if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

  // 白名单验证 - 只允许更新指定的字段
  const validation = validateUpdateData(updateData, ALLOWED_USER_FIELDS);
  if (!validation.valid) {
    return errorResponse(c, ErrorCodes.NO_UPDATE_FIELDS);
  }

  validation.values.push(userId);
  await db.prepare(`UPDATE users SET ${validation.fields.join(', ')} WHERE id = ?`)
    .bind(...validation.values).run();

  return c.json({ success: true });
});

app.delete('/users/:id', async (c) => {
  const db = c.env.DB;
  const userId = c.req.param('id');

  const user = await db.prepare('SELECT is_admin FROM users WHERE id = ?').bind(userId).first();

  if (!user) {
    return errorResponse(c, ErrorCodes.USER_NOT_FOUND, 404);
  }

  if (user.is_admin) {
    return errorResponse(c, ErrorCodes.CANNOT_DELETE_ADMIN);
  }

  const conferences = await db.prepare('SELECT id FROM conferences WHERE user_id = ?').bind(userId).all();

  for (const conf of conferences.results) {
    await db.prepare('DELETE FROM participants WHERE conference_id = ?').bind(conf.id).run();
    await db.prepare('DELETE FROM hotels WHERE conference_id = ?').bind(conf.id).run();
    await db.prepare('DELETE FROM restaurants WHERE conference_id = ?').bind(conf.id).run();
    await db.prepare('DELETE FROM transport_tasks WHERE conference_id = ?').bind(conf.id).run();
    await db.prepare('DELETE FROM seating_assignments WHERE conference_id = ?').bind(conf.id).run();
  }

  await db.prepare('DELETE FROM conferences WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

  return c.json({ success: true });
});

app.post('/invitation-codes/generate', async (c) => {
  const db = c.env.DB;
  const { count, duration_days, max_uses } = await c.req.json();

  const codes = [];
  const statements = [];
  const now = new Date().toISOString();

  for (let i = 0; i < (count || 1); i++) {
    const code = generateCode();
    codes.push(code);
    statements.push(
      db.prepare(`
        INSERT INTO invitation_codes (code, duration_days, max_uses, used_count, status, created_at)
        VALUES (?, ?, ?, 0, 'active', ?)
      `).bind(code, duration_days || 30, max_uses || 1, now)
    );
  }

  await db.batch(statements);

  return c.json({ codes });
});

app.get('/invitation-codes', async (c) => {
  const db = c.env.DB;

  const result = await db.prepare(`
    SELECT ic.*
    FROM invitation_codes ic
    ORDER BY ic.created_at DESC
  `).all();

  return c.json(result.results);
});

app.get('/invitation-codes/export', async (c) => {
  const db = c.env.DB;

  const result = await db.prepare(`
    SELECT code, duration_days, status, created_at
    FROM invitation_codes
    ORDER BY created_at DESC
  `).all();

  const header = '邀请码,有效天数,状态,创建时间\n';
  const rows = result.results.map(r =>
    `${r.code},${r.duration_days},${r.status === 'unused' ? '未使用' : '已使用'},${r.created_at}`
  ).join('\n');

  const csv = header + rows;

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=invitation_codes.csv'
    }
  });
});

app.put('/invitation-codes/:code', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');
  const { duration_days, max_uses } = await c.req.json();

  const updates = [];
  const values = [];

  if (duration_days !== undefined) {
    updates.push('duration_days = ?');
    values.push(duration_days);
  }
  if (max_uses !== undefined) {
    updates.push('max_uses = ?');
    values.push(max_uses);
  }

  if (updates.length === 0) {
    return errorResponse(c, ErrorCodes.NO_UPDATE_FIELDS);
  }

  values.push(code);

  const result = await db.prepare(
    `UPDATE invitation_codes SET ${updates.join(', ')} WHERE code = ?`
  ).bind(...values).run();

  if (result.meta.changes === 0) {
    return errorResponse(c, ErrorCodes.INVITATION_CODE_NOT_FOUND, 404);
  }

  return c.json({ success: true });
});

app.delete('/invitation-codes/:code', async (c) => {
  const db = c.env.DB;
  const code = c.req.param('code');

  const result = await db.prepare(
    'DELETE FROM invitation_codes WHERE code = ?'
  ).bind(code).run();

  if (result.meta.changes === 0) {
    return errorResponse(c, ErrorCodes.INVITATION_CODE_NOT_FOUND, 404);
  }

  return c.json({ success: true });
});

app.get('/user-stats', async (c) => {
  const db = c.env.DB;

  const users = await db.prepare(`
    SELECT id, username, email, subscription_start, subscription_end, last_active_at, created_at
    FROM users
    WHERE is_admin = 0
    ORDER BY last_active_at DESC
  `).all();

  const stats = [];
  for (const user of users.results) {
    const conferences = await db.prepare(
      'SELECT id FROM conferences WHERE user_id = ?'
    ).bind(user.id).all();

    let participants = 0;
    let hotels = 0;
    let restaurants = 0;
    let transports = 0;
    let seating = 0;

    for (const conf of conferences.results) {
      const p = await db.prepare('SELECT COUNT(*) as count FROM participants WHERE conference_id = ?').bind(conf.id).first();
      const h = await db.prepare('SELECT COUNT(*) as count FROM hotels WHERE conference_id = ?').bind(conf.id).first();
      const r = await db.prepare('SELECT COUNT(*) as count FROM restaurants WHERE conference_id = ?').bind(conf.id).first();
      const t = await db.prepare('SELECT COUNT(*) as count FROM transport_tasks WHERE conference_id = ?').bind(conf.id).first();
      const s = await db.prepare('SELECT COUNT(*) as count FROM seating_assignments WHERE conference_id = ?').bind(conf.id).first();

      participants += p?.count || 0;
      hotels += h?.count || 0;
      restaurants += r?.count || 0;
      transports += t?.count || 0;
      seating += s?.count || 0;
    }

    stats.push({
      user_id: user.id,
      username: user.username,
      email: user.email,
      subscription_start: user.subscription_start,
      subscription_end: user.subscription_end,
      conference_count: conferences.results.length,
      participant_count: participants,
      hotel_count: hotels,
      restaurant_count: restaurants,
      transport_count: transports,
      seating_count: seating,
      last_active_at: user.last_active_at,
      created_at: user.created_at
    });
  }

  return c.json(stats);
});

app.get('/conferences', async (c) => {
  const db = c.env.DB;
  const userId = c.req.query('user_id');

  let query = 'SELECT id, title, user_id FROM conferences';
  const params = [];

  if (userId) {
    query += ' WHERE user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY created_at DESC';

  const result = await db.prepare(query).bind(...params).all();
  return c.json(result.results);
});

app.get('/participants/count', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.query('conference_id');

  if (!conferenceId) {
    return c.json({ count: 0 });
  }

  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM participants WHERE conference_id = ?'
  ).bind(conferenceId).first();

  return c.json({ count: result?.count || 0 });
});

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default app;
