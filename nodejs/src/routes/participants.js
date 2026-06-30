import { Hono } from 'hono';
import { authMiddleware, getCurrentUserId } from '../middleware/auth.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';
import { encryptPhone, decryptPhone } from '../utils/crypto.js';
import { read, utils } from 'xlsx';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/template/download', async (c) => {
  const headers = '姓名,电话,公司,部门,职位,头衔,是否参会,是否用餐,是否住宿,是否接送';
  const example = '张三,13800138000,示例公司,技术部,工程师,高级,是,是,是,是';
  const csv = headers + '\n' + example;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=participants_template.csv'
    }
  });
});

app.get('/:conference_id', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const key = c.env.ENCRYPTION_KEY;

  const result = await db.prepare(
    'SELECT * FROM participants WHERE conference_id = ? ORDER BY id'
  ).bind(conferenceId).all();

  const participants = await Promise.all(result.results.map(async p => ({
    ...p,
    phone: p.phone_encrypted ? await decryptPhone(p.phone_encrypted, key) : '',
    phone_encrypted: undefined
  })));

  return c.json(participants);
});

app.post('/', async (c) => {
  const db = c.env.DB;
  const key = c.env.ENCRYPTION_KEY;
  const data = await c.req.json();

  const conference = await db.prepare(
    'SELECT user_id FROM conferences WHERE id = ?'
  ).bind(data.conference_id).first();

  if (!conference) {
    return errorResponse(c, ErrorCodes.CONFERENCE_NOT_FOUND, 404);
  }

  const encryptedPhone = data.phone ? await encryptPhone(data.phone, key) : '';
  const now = new Date().toISOString();

  const result = await db.prepare(`
    INSERT INTO participants (conference_id, user_id, name, phone_encrypted, email, company, department, position, title, is_attending, has_meal, has_hotel, has_transport, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.conference_id, conference.user_id, data.name, encryptedPhone, data.email || null,
    data.company || null, data.department || null, data.position || null, data.title || null,
    data.is_attending !== false ? 1 : 0,
    data.has_meal ? 1 : 0, data.has_hotel ? 1 : 0, data.has_transport ? 1 : 0,
    now
  ).run();

  return c.json({
    id: result.meta.last_row_id,
    conference_id: data.conference_id,
    name: data.name,
    phone: data.phone || '',
    email: data.email || '',
    company: data.company || '',
    department: data.department || '',
    position: data.position || '',
    title: data.title || ''
  });
});

app.put('/:id', async (c) => {
  const db = c.env.DB;
  const key = c.env.ENCRYPTION_KEY;
  const id = c.req.param('id');
  const data = await c.req.json();

  const participant = await db.prepare(
    'SELECT id FROM participants WHERE id = ?'
  ).bind(id).first();

  if (!participant) {
    return errorResponse(c, ErrorCodes.PARTICIPANT_NOT_FOUND, 404);
  }

  const now = new Date().toISOString();
  const encryptedPhone = data.phone !== undefined ? await encryptPhone(data.phone, key) : null;

  await db.prepare(`
    UPDATE participants SET
      name = COALESCE(?, name),
      phone_encrypted = COALESCE(?, phone_encrypted),
      email = COALESCE(?, email),
      company = COALESCE(?, company),
      department = COALESCE(?, department),
      position = COALESCE(?, position),
      title = COALESCE(?, title),
      is_attending = COALESCE(?, is_attending),
      has_meal = COALESCE(?, has_meal),
      has_hotel = COALESCE(?, has_hotel),
      has_transport = COALESCE(?, has_transport),
      updated_at = ?
    WHERE id = ?
  `).bind(
    data.name, encryptedPhone, data.email, data.company, data.department,
    data.position, data.title,
    data.is_attending !== undefined ? (data.is_attending ? 1 : 0) : null,
    data.has_meal !== undefined ? (data.has_meal ? 1 : 0) : null,
    data.has_hotel !== undefined ? (data.has_hotel ? 1 : 0) : null,
    data.has_transport !== undefined ? (data.has_transport ? 1 : 0) : null,
    now, id
  ).run();

  return c.json({ success: true, message: '参会人更新成功' });
});

app.delete('/batch', async (c) => {
  const db = c.env.DB;
  const { ids } = await c.req.json();

  let deleted = 0;
  for (const id of ids) {
    const result = await db.prepare(
      'DELETE FROM participants WHERE id = ?'
    ).bind(id).run();
    if (result.meta.changes > 0) deleted++;
  }

  return c.json({ deleted });
});

app.post('/:conference_id/import', async (c) => {
  try {
    const db = c.env.DB;
    const key = c.env.ENCRYPTION_KEY;
    const conferenceId = c.req.param('conference_id');

    const conference = await db.prepare(
      'SELECT user_id FROM conferences WHERE id = ?'
    ).bind(conferenceId).first();

    if (!conference) {
      return errorResponse(c, ErrorCodes.CONFERENCE_NOT_FOUND, 404);
    }

    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file) {
      return errorResponse(c, ErrorCodes.UPLOAD_FILE_REQUIRED);
    }

    const parseBool = (value) => {
      if (!value) return false;
      const v = String(value).trim().toLowerCase();
      return v === '是' || v === 'yes' || v === 'true' || v === '1';
    };

    let rows = [];
    const fileName = file.name?.toLowerCase() || '';
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    // 安全限制 - 防止xlsx漏洞触发
    const MAX_FILE_SIZE = 10 * 1024 * 1024;  // 最大文件大小：10MB
    const MAX_ROWS = 10000;  // 最大行数：10000行

    if (isExcel) {
      try {
        const arrayBuffer = await file.arrayBuffer();

        // 检查文件大小
        if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
          return errorResponse(c, ErrorCodes.EMPTY_FILE, '文件大小超过限制（最大10MB）', 400);
        }

        const workbook = read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rows = utils.sheet_to_json(sheet, { header: 1 });

        // 检查行数
        if (rows.length > MAX_ROWS) {
          return errorResponse(c, ErrorCodes.EMPTY_FILE, '数据行数超过限制（最大10000行）', 400);
        }
      } catch (e) {
        return errorResponse(c, ErrorCodes.EXCEL_PARSE_ERROR);
      }
    } else {
      const text = await file.text();

      // 检查文件大小
      if (text.length > MAX_FILE_SIZE) {
        return errorResponse(c, ErrorCodes.EMPTY_FILE, '文件大小超过限制（最大10MB）', 400);
      }

      const lines = text.split('\n').filter(line => line.trim());
      rows = lines.map(line => line.split(',').map(c => c.trim()));

      // 检查行数
      if (rows.length > MAX_ROWS) {
        return errorResponse(c, ErrorCodes.EMPTY_FILE, '数据行数超过限制（最大10000行）', 400);
      }
    }

    if (rows.length < 2) {
      return errorResponse(c, ErrorCodes.EMPTY_FILE);
    }

    const batchSize = 200;
    let imported = 0;
    const now = new Date().toISOString();
    const userId = conference.user_id;

    for (let i = 1; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const statements = [];

      for (const row of batch) {
        const name = String(row[0] || '').trim();
        if (!name) continue;

        const phone = String(row[1] || '').trim();
        const company = String(row[2] || '').trim();
        const dept = String(row[3] || '').trim();
        const position = String(row[4] || '').trim();
        const title = String(row[5] || '').trim();
        const isAttending = parseBool(row[6]);
        const hasMeal = parseBool(row[7]);
        const hasHotel = parseBool(row[8]);
        const hasTransport = parseBool(row[9]);

        const encryptedPhone = phone ? await encryptPhone(phone, key) : '';

        statements.push(
          db.prepare(`
          INSERT INTO participants (conference_id, user_id, name, phone_encrypted, company, department, position, title, is_attending, has_meal, has_hotel, has_transport, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(conferenceId, userId, name, encryptedPhone, company, dept, position, title,
            isAttending ? 1 : 0, hasMeal ? 1 : 0, hasHotel ? 1 : 0, hasTransport ? 1 : 0, now)
        );
      }

      if (statements.length > 0) {
        await db.batch(statements);
        imported += statements.length;
      }
    }

    return c.json({ imported });
  } catch (e) {
    return c.json({ detail: '导入失败: ' + e.message, stack: e.stack }, 500);
  }
});

app.get('/:conference_id/validate', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  const participants = await db.prepare(
    'SELECT id, name, is_attending, has_meal, has_hotel, has_transport FROM participants WHERE conference_id = ?'
  ).bind(conferenceId).all();

  const seating = await db.prepare(
    'SELECT DISTINCT participant_id FROM seating_assignments WHERE conference_id = ?'
  ).bind(conferenceId).all();
  const seatingIds = new Set(seating.results.map(s => s.participant_id));

  const hotel = await db.prepare(
    'SELECT DISTINCT participant_id FROM hotel_assignments WHERE conference_id = ?'
  ).bind(conferenceId).all();
  const hotelIds = new Set(hotel.results.map(h => h.participant_id));

  const restaurant = await db.prepare(
    'SELECT DISTINCT participant_id FROM restaurant_seats WHERE conference_id = ? AND participant_id IS NOT NULL'
  ).bind(conferenceId).all();
  const restaurantIds = new Set(restaurant.results.map(r => r.participant_id));

  const results = participants.results.map(p => ({
    id: p.id,
    name: p.name,
    is_attending: p.is_attending === 1,
    has_meal: p.has_meal === 1,
    has_hotel: p.has_hotel === 1,
    has_transport: p.has_transport === 1,
    attending_valid: !p.is_attending || seatingIds.has(p.id),
    meal_valid: !p.has_meal || restaurantIds.has(p.id),
    hotel_valid: !p.has_hotel || hotelIds.has(p.id),
    transport_valid: true
  }));

  return c.json(results);
});

export default app;
