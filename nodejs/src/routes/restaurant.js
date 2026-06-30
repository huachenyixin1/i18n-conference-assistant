import { Hono } from 'hono';
import { authMiddleware, getCurrentUserId } from '../middleware/auth.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/:conference_id/restaurants', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  const result = await db.prepare(
    'SELECT * FROM restaurants WHERE conference_id = ? ORDER BY id'
  ).bind(conferenceId).all();

  return c.json(result.results);
});

app.post('/:conference_id/restaurants', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();

    const conference = await db.prepare(
      'SELECT user_id FROM conferences WHERE id = ?'
    ).bind(conferenceId).first();

    if (!conference) {
      return errorResponse(c, ErrorCodes.CONFERENCE_NOT_FOUND, 404);
    }

    const result = await db.prepare(`
      INSERT INTO restaurants (conference_id, user_id, name, address, capacity, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      conferenceId, conference.user_id, data.name, data.address || null, data.capacity || null, data.note || null,
      new Date().toISOString()
    ).run();

    return c.json({ id: result.meta.last_row_id, ...data });
  } catch (e) {
    return c.json({ detail: '创建餐厅失败: ' + e.message }, 500);
  }
});

app.put('/restaurants/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = await c.req.json();

  await db.prepare(`
    UPDATE restaurants SET
      name = COALESCE(?, name),
      address = COALESCE(?, address),
      capacity = COALESCE(?, capacity),
      note = COALESCE(?, note)
    WHERE id = ?
  `).bind(data.name, data.address, data.capacity, data.note, id).run();

  return c.json({ success: true });
});

app.delete('/restaurants/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('DELETE FROM restaurant_seats WHERE table_id IN (SELECT id FROM restaurant_tables WHERE restaurant_id = ?)').bind(id).run();
  await db.prepare('DELETE FROM restaurant_tables WHERE restaurant_id = ?').bind(id).run();
  await db.prepare('DELETE FROM restaurants WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

app.get('/:conference_id/tables', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const restaurantId = c.req.query('restaurant_id');

  let query = `
    SELECT t.*, r.name as restaurant_name
    FROM restaurant_tables t
    LEFT JOIN restaurants r ON t.restaurant_id = r.id
    WHERE t.conference_id = ?
  `;
  let params = [conferenceId];

  if (restaurantId && restaurantId !== '0') {
    query += ' AND t.restaurant_id = ?';
    params.push(restaurantId);
  }

  query += ' ORDER BY t.id';

  const result = await db.prepare(query).bind(...params).all();

  return c.json(result.results);
});

app.post('/:conference_id/tables', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const data = await c.req.json();

  const result = await db.prepare(`
    INSERT INTO restaurant_tables (conference_id, restaurant_id, name, table_type, capacity, position_x, position_y)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    conferenceId, data.restaurant_id, data.name, data.table_type || 'round',
    data.capacity || 10, data.position_x || null, data.position_y || null
  ).run();

  return c.json({ id: result.meta.last_row_id, ...data });
});

app.post('/:conference_id/tables/batch', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const statements = [];

    if (data.name_prefix && data.quantity) {
      const { restaurant_id, name_prefix, quantity, capacity_per_table, table_type } = data;
      for (let i = 1; i <= quantity; i++) {
        statements.push(
          db.prepare(`
            INSERT INTO restaurant_tables (conference_id, restaurant_id, name, table_type, capacity, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(conferenceId, restaurant_id, `${name_prefix}${i}`, table_type || 'round', capacity_per_table || 10, userId)
        );
      }
    } else {
      const { restaurant_id, prefix, start, end, capacity } = data;
      for (let i = start; i <= end; i++) {
        statements.push(
          db.prepare(`
            INSERT INTO restaurant_tables (conference_id, restaurant_id, name, capacity, user_id)
            VALUES (?, ?, ?, ?, ?)
          `).bind(conferenceId, restaurant_id, `${prefix}${i}`, capacity || 10, userId)
        );
      }
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return c.json({ created: statements.length });
  } catch (e) {
    return c.json({ detail: '批量创建桌位失败: ' + e.message }, 500);
  }
});

app.put('/tables/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = await c.req.json();

  await db.prepare(`
    UPDATE restaurant_tables SET
      name = COALESCE(?, name),
      table_type = COALESCE(?, table_type),
      capacity = COALESCE(?, capacity),
      position_x = COALESCE(?, position_x),
      position_y = COALESCE(?, position_y)
    WHERE id = ?
  `).bind(data.name, data.table_type, data.capacity, data.position_x, data.position_y, id).run();

  return c.json({ success: true });
});

app.delete('/tables/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('DELETE FROM restaurant_seats WHERE table_id = ?').bind(id).run();
  await db.prepare('DELETE FROM restaurant_tables WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

app.get('/:conference_id/assignments', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const mealType = c.req.query('meal_type');

  let query = `
    SELECT rs.*, p.name as participant_name, p.company,
           rt.name as table_name, r.name as restaurant_name
    FROM restaurant_seats rs
    LEFT JOIN participants p ON rs.participant_id = p.id
    LEFT JOIN restaurant_tables rt ON rs.table_id = rt.id
    LEFT JOIN restaurants r ON rt.restaurant_id = r.id
    WHERE rs.conference_id = ?
  `;
  let params = [conferenceId];

  if (mealType) {
    query += ' AND rs.meal_type = ?';
    params.push(mealType);
  }

  query += ' ORDER BY rs.table_id, rs.seat_index';

  const result = await db.prepare(query).bind(...params).all();

  return c.json(result.results);
});

app.post('/:conference_id/assignments', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const { table_id, participant_id, meal_type, seat_index } = await c.req.json();

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const existing = await db.prepare(
      'SELECT id FROM restaurant_seats WHERE table_id = ? AND seat_index = ? AND meal_type = ?'
    ).bind(table_id, seat_index, meal_type || 'lunch').first();

    if (existing) {
      return errorResponse(c, ErrorCodes.TABLE_OCCUPIED);
    }

    const result = await db.prepare(`
      INSERT INTO restaurant_seats (conference_id, table_id, participant_id, meal_type, seat_index, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(conferenceId, table_id, participant_id, meal_type || 'lunch', seat_index, userId).run();

    return c.json({ success: true, id: result.meta.last_row_id });
  } catch (e) {
    return c.json({ detail: '分配失败: ' + e.message }, 500);
  }
});

app.delete('/:conference_id/assignments', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const { table_id, seat_index, meal_type } = await c.req.json();

  await db.prepare(`
    DELETE FROM restaurant_seats
    WHERE conference_id = ? AND table_id = ? AND seat_index = ? AND meal_type = ?
  `).bind(conferenceId, table_id, seat_index, meal_type || 'lunch').run();

  return c.json({ success: true });
});

app.delete('/:conference_id/assignments/all', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  await db.prepare('DELETE FROM restaurant_seats WHERE conference_id = ?').bind(conferenceId).run();

  return c.json({ success: true });
});

app.post('/:conference_id/assignments/swap', async (c) => {
  const db = c.env.DB;
  const { seat1_id, seat2_id } = await c.req.json();

  const s1 = await db.prepare('SELECT * FROM restaurant_seats WHERE id = ?').bind(seat1_id).first();
  const s2 = await db.prepare('SELECT * FROM restaurant_seats WHERE id = ?').bind(seat2_id).first();

  if (!s1 || !s2) {
    return errorResponse(c, ErrorCodes.TABLE_NOT_FOUND, 404);
  }

  await db.prepare('UPDATE restaurant_seats SET participant_id = ? WHERE id = ?').bind(s2.participant_id, s1.id).run();
  await db.prepare('UPDATE restaurant_seats SET participant_id = ? WHERE id = ?').bind(s1.participant_id, s2.id).run();

  return c.json({ success: true });
});

app.post('/:conference_id/assignments/move', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const { from_table_id, to_table_id, from_seat_index, to_seat_index, meal_type } = await c.req.json();

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const seat = await db.prepare(`
      SELECT id, conference_id, participant_id FROM restaurant_seats
      WHERE table_id = ? AND seat_index = ? AND meal_type = ?
    `).bind(from_table_id, from_seat_index, meal_type || 'lunch').first();

    if (!seat) {
      return errorResponse(c, ErrorCodes.SOURCE_TABLE_NOT_FOUND, 404);
    }

    await db.prepare(`
      DELETE FROM restaurant_seats WHERE id = ?
    `).bind(seat.id).run();

    await db.prepare(`
      INSERT INTO restaurant_seats (conference_id, table_id, participant_id, meal_type, seat_index, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(seat.conference_id, to_table_id, seat.participant_id, meal_type || 'lunch', to_seat_index, userId).run();

    return c.json({ success: true });
  } catch (e) {
    return c.json({ detail: '移动失败: ' + e.message }, 500);
  }
});

app.get('/:conference_id/summary', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const mealType = c.req.query('meal_type') || 'lunch';

  const restaurantsResult = await db.prepare('SELECT * FROM restaurants WHERE conference_id = ? ORDER BY id').bind(conferenceId).all();
  const restaurants = restaurantsResult.results || [];

  const restaurantData = [];
  let totalTables = 0;
  let totalCapacity = 0;
  let totalAssigned = 0;

  for (const r of restaurants) {
    const tablesResult = await db.prepare('SELECT * FROM restaurant_tables WHERE restaurant_id = ?').bind(r.id).all();
    const tables = tablesResult.results || [];

    const capacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);

    restaurantData.push({
      id: r.id,
      name: r.name,
      address: r.address,
      capacity: capacity
    });

    totalTables += tables.length;
    totalCapacity += capacity;
  }

  const assignmentsResult = await db.prepare('SELECT * FROM restaurant_seats WHERE conference_id = ? AND meal_type = ?').bind(conferenceId, mealType).all();
  totalAssigned = (assignmentsResult.results || []).filter(a => a.participant_id).length;

  const participantsResult = await db.prepare('SELECT id FROM participants WHERE conference_id = ? AND has_meal = 1').bind(conferenceId).all();
  const mealParticipants = (participantsResult.results || []).length;
  const unassignedCount = Math.max(0, mealParticipants - totalAssigned);

  return c.json({
    restaurants: restaurantData,
    table_count: totalTables,
    total_capacity: totalCapacity,
    assigned_count: totalAssigned,
    meal_participants: mealParticipants,
    unassigned_count: unassignedCount
  });
});

app.get('/tables/:id/participants', async (c) => {
  const db = c.env.DB;
  const tableId = c.req.param('id');
  const mealType = c.req.query('meal_type') || 'lunch';

  const result = await db.prepare(`
    SELECT rs.*, p.name as participant_name, p.company
    FROM restaurant_seats rs
    LEFT JOIN participants p ON rs.participant_id = p.id
    WHERE rs.table_id = ? AND rs.meal_type = ?
    ORDER BY rs.seat_index
  `).bind(tableId, mealType).all();

  return c.json(result.results);
});

app.post('/:conference_id/auto-assign', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json().catch(() => { });
    const meal_type = data?.meal_type || 'lunch';

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const tablesResult = await db.prepare(
      'SELECT * FROM restaurant_tables WHERE conference_id = ? ORDER BY id'
    ).bind(conferenceId).all();
    const tables = tablesResult.results || [];

    if (tables.length === 0) {
      return errorResponse(c, ErrorCodes.NO_TABLE);
    }

    const participantsResult = await db.prepare(
      'SELECT id FROM participants WHERE conference_id = ? AND has_meal = 1 ORDER BY id'
    ).bind(conferenceId).all();
    const participants = participantsResult.results || [];

    if (participants.length === 0) {
      return errorResponse(c, ErrorCodes.NO_DINING_PARTICIPANTS);
    }

    const existingSeatsResult = await db.prepare(
      'SELECT participant_id FROM restaurant_seats WHERE conference_id = ? AND meal_type = ?'
    ).bind(conferenceId, meal_type).all();
    const seatedIds = new Set(existingSeatsResult.results.map(s => s.participant_id));

    const unseated = participants.filter(p => !seatedIds.has(p.id));

    if (unseated.length === 0) {
      return c.json({ success: true, assigned_count: 0, message: '所有参会人已分配' });
    }

    const tableList = tables;
    let tableIdx = 0;
    let seatIdx = 0;
    const statements = [];
    let assignedCount = 0;

    for (const participant of unseated) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < tableList.length * 10) {
        const table = tableList[tableIdx];

        const tableSeatsResult = await db.prepare(
          'SELECT seat_index FROM restaurant_seats WHERE table_id = ? AND meal_type = ?'
        ).bind(table.id, meal_type).all();
        const usedIndices = new Set(tableSeatsResult.results.map(s => s.seat_index));

        if (seatIdx < table.capacity && !usedIndices.has(seatIdx)) {
          statements.push(
            db.prepare(`
              INSERT INTO restaurant_seats (conference_id, table_id, participant_id, meal_type, seat_index, user_id)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(conferenceId, table.id, participant.id, meal_type, seatIdx, userId)
          );
          assignedCount++;
          placed = true;
        }

        seatIdx++;
        if (seatIdx >= table.capacity) {
          seatIdx = 0;
          tableIdx = (tableIdx + 1) % tableList.length;
        }
        attempts++;
      }
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return c.json({ success: true, assigned_count: assignedCount, message: `已分配 ${assignedCount} 个座位` });
  } catch (e) {
    return c.json({ detail: '自动分配失败: ' + e.message }, 500);
  }
});

export default app;
