import { Hono } from 'hono';
import { authMiddleware, getCurrentUserId } from '../middleware/auth.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/', async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);

  const result = await db.prepare(
    'SELECT * FROM conferences WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  return c.json(result.results);
});

app.post('/', async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);
  const data = await c.req.json();

  // 检查用户有效期
  const user = await db.prepare(
    'SELECT subscription_end FROM users WHERE id = ?'
  ).bind(userId).first();

  if (user && user.subscription_end) {
    const now = new Date();
    const subscriptionEnd = new Date(user.subscription_end);
    if (subscriptionEnd < now) {
      return errorResponse(c, ErrorCodes.SUBSCRIPTION_EXPIRED, 403);
    }
  }

  const code = 'C' + Date.now().toString(36).toUpperCase();
  const now = new Date().toISOString();

  const result = await db.prepare(`
    INSERT INTO conferences (user_id, code, title, purpose, scale, schedule, location, has_meal, has_hotel, has_transport, start_date, end_date, year, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, code, data.title, data.purpose || null, data.scale || null,
    data.schedule || null, data.location || null,
    data.has_meal ? 1 : 0, data.has_hotel ? 1 : 0, data.has_transport ? 1 : 0,
    data.start_date || null, data.end_date || null,
    data.year || new Date().getFullYear(), 'active', now
  ).run();

  return c.json({
    success: true,
    message: '会议创建成功',
    id: result.meta.last_row_id,
    code
  });
});

app.get('/stats/summary', async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);

  const conferences = await db.prepare(
    'SELECT id FROM conferences WHERE user_id = ?'
  ).bind(userId).all();

  const conferenceIds = conferences.results.map(c => c.id);
  if (conferenceIds.length === 0) {
    return c.json({ conferences: 0, participants: 0, hotels: 0, restaurants: 0 });
  }

  const placeholders = conferenceIds.map(() => '?').join(',');

  const participants = await db.prepare(
    `SELECT COUNT(*) as count FROM participants WHERE conference_id IN (${placeholders})`
  ).bind(...conferenceIds).first();

  return c.json({
    conferences: conferenceIds.length,
    participants: participants?.count || 0
  });
});

app.get('/:id', async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);
  const id = c.req.param('id');

  const conference = await db.prepare(
    'SELECT * FROM conferences WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!conference) {
    return errorResponse(c, ErrorCodes.CONFERENCE_NOT_FOUND, 404);
  }

  return c.json(conference);
});

app.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const userId = getCurrentUserId(c);
    const id = c.req.param('id');
    const data = await c.req.json();

    console.log('[PUT Conference] userId:', userId, 'id:', id, 'data:', JSON.stringify(data));

    const conference = await db.prepare(
      'SELECT id FROM conferences WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!conference) {
      console.log('[PUT Conference] Conference not found');
      return errorResponse(c, ErrorCodes.CONFERENCE_NOT_FOUND, 404);
    }

    const now = new Date().toISOString();
    const result = await db.prepare(`
      UPDATE conferences SET
        title = COALESCE(?, title),
        purpose = COALESCE(?, purpose),
        scale = COALESCE(?, scale),
        schedule = COALESCE(?, schedule),
        location = COALESCE(?, location),
        has_meal = COALESCE(?, has_meal),
        has_hotel = COALESCE(?, has_hotel),
        has_transport = COALESCE(?, has_transport),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        updated_at = ?
      WHERE id = ?
    `).bind(
      data.title || null,
      data.purpose || null,
      data.scale || null,
      data.schedule || null,
      data.location || null,
      data.has_meal !== undefined ? (data.has_meal ? 1 : 0) : null,
      data.has_hotel !== undefined ? (data.has_hotel ? 1 : 0) : null,
      data.has_transport !== undefined ? (data.has_transport ? 1 : 0) : null,
      data.start_date || null,
      data.end_date || null,
      now,
      id
    ).run();

    console.log('[PUT Conference] Update result:', JSON.stringify(result));
    return c.json({ success: true, message: '会议更新成功' });
  } catch (error) {
    console.error('[PUT Conference] Error:', error.message, error.stack);
    return c.json({
      code: 'INTERNAL_ERROR',
      message: error.message,
      stack: error.stack
    }, 500);
  }
});

app.delete('/:id', async (c) => {
  const db = c.env.DB;
  const userId = getCurrentUserId(c);
  const id = c.req.param('id');

  const conference = await db.prepare(
    'SELECT id FROM conferences WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();

  if (!conference) {
    return errorResponse(c, ErrorCodes.CONFERENCE_NOT_FOUND, 404);
  }

  await db.prepare('DELETE FROM conferences WHERE id = ?').bind(id).run();

  return c.json({ success: true, message: '会议删除成功' });
});

export default app;
