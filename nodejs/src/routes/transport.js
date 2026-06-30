import { Hono } from 'hono';
import { authMiddleware, getCurrentUserId } from '../middleware/auth.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';
import { ALLOWED_TASK_FIELDS, validateUpdateData } from '../utils/database.js';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/:conference_id/vehicles', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  const result = await db.prepare(
    'SELECT * FROM transport_vehicles WHERE conference_id = ? ORDER BY id'
  ).bind(conferenceId).all();

  return c.json({ vehicles: result.results });
});

app.post('/:conference_id/vehicles', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();

    const result = await db.prepare(`
      INSERT INTO transport_vehicles (conference_id, plate, model, seats, driver_name, driver_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      conferenceId, data.plate, data.model || null, data.seats || 5,
      data.driver_name || null, data.driver_phone || null, 'standby'
    ).run();

    return c.json({ id: result.meta.last_row_id, ...data });
  } catch (e) {
    return errorResponse(c, ErrorCodes.CREATE_VEHICLE_FAILED, 500);
  }
});

app.put('/vehicles/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = await c.req.json();

  await db.prepare(`
    UPDATE transport_vehicles SET
      plate = COALESCE(?, plate),
      model = COALESCE(?, model),
      seats = COALESCE(?, seats),
      driver_name = COALESCE(?, driver_name),
      driver_phone = COALESCE(?, driver_phone),
      status = COALESCE(?, status)
    WHERE id = ?
  `).bind(data.plate, data.model, data.seats, data.driver_name, data.driver_phone, data.status, id).run();

  return c.json({ success: true });
});

app.delete('/vehicles/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('DELETE FROM transport_task_passengers WHERE task_id IN (SELECT id FROM transport_tasks WHERE vehicle_id = ?)').bind(id).run();
  await db.prepare('DELETE FROM transport_tasks WHERE vehicle_id = ?').bind(id).run();
  await db.prepare('DELETE FROM transport_vehicles WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

app.post('/vehicles/:id/location', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const { lat, lng } = await c.req.json();

  await db.prepare(`
    UPDATE transport_vehicles SET
      last_lat = ?,
      last_lng = ?,
      last_location_time = ?
    WHERE id = ?
  `).bind(lat, lng, new Date().toISOString(), id).run();

  return c.json({ success: true });
});

app.get('/:conference_id/tasks', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const date = c.req.query('date');

  let query = `
    SELECT t.*, v.plate, v.model, v.driver_name, v.driver_phone
    FROM transport_tasks t
    LEFT JOIN transport_vehicles v ON t.vehicle_id = v.id
    WHERE t.conference_id = ?
  `;
  let params = [conferenceId];

  if (date) {
    query += ' AND t.task_date = ?';
    params.push(date);
  }

  query += ' ORDER BY t.task_date, t.start_time';

  const result = await db.prepare(query).bind(...params).all();

  const tasksWithPassengers = [];
  for (const task of result.results || []) {
    const passengersResult = await db.prepare(`
      SELECT p.id, p.name, p.company, p.position as title
      FROM transport_task_passengers ttp
      LEFT JOIN participants p ON ttp.participant_id = p.id
      WHERE ttp.task_id = ?
    `).bind(task.id).all();

    tasksWithPassengers.push({
      ...task,
      passengers: passengersResult.results || []
    });
  }

  return c.json({ tasks: tasksWithPassengers });
});

app.post('/:conference_id/tasks', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();

    const result = await db.prepare(`
      INSERT INTO transport_tasks (
        conference_id, vehicle_id, task_type, task_date, start_time, end_time,
        from_location, from_lat, from_lng, to_location, to_lat, to_lng,
        escort_name, escort_phone, note, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      conferenceId, data.vehicle_id, data.task_type || null, data.task_date,
      data.start_time, data.end_time || null,
      data.from_location || null, data.from_lat || null, data.from_lng || null,
      data.to_location || null, data.to_lat || null, data.to_lng || null,
      data.escort_name || null, data.escort_phone || null, data.note || null,
      'pending'
    ).run();

    const taskId = result.meta.last_row_id;

    if (data.participant_ids && data.participant_ids.length > 0) {
      const statements = [];
      for (const participantId of data.participant_ids) {
        statements.push(
          db.prepare(`
            INSERT INTO transport_task_passengers (task_id, participant_id)
            VALUES (?, ?)
          `).bind(taskId, participantId)
        );
      }
      if (statements.length > 0) {
        await db.batch(statements);
      }
    }

    return c.json({ id: taskId, ...data });
  } catch (e) {
    console.error('创建行程失败:', e);
    return errorResponse(c, ErrorCodes.CREATE_TRIP_FAILED, 500);
  }
});

app.put('/tasks/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = await c.req.json();

  await db.prepare(`
    UPDATE transport_tasks SET
      vehicle_id = COALESCE(?, vehicle_id),
      task_type = COALESCE(?, task_type),
      task_date = COALESCE(?, task_date),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      from_location = COALESCE(?, from_location),
      from_lat = COALESCE(?, from_lat),
      from_lng = COALESCE(?, from_lng),
      to_location = COALESCE(?, to_location),
      to_lat = COALESCE(?, to_lat),
      to_lng = COALESCE(?, to_lng),
      escort_name = COALESCE(?, escort_name),
      escort_phone = COALESCE(?, escort_phone),
      note = COALESCE(?, note)
    WHERE id = ?
  `).bind(
    data.vehicle_id, data.task_type, data.task_date, data.start_time, data.end_time,
    data.from_location, data.from_lat, data.from_lng,
    data.to_location, data.to_lat, data.to_lng,
    data.escort_name, data.escort_phone, data.note, id
  ).run();

  return c.json({ success: true });
});

app.delete('/tasks/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('DELETE FROM transport_task_passengers WHERE task_id = ?').bind(id).run();
  await db.prepare('DELETE FROM transport_tasks WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

app.put('/tasks/:id/status', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const { status } = await c.req.json();
  const now = new Date().toISOString();

  // 构建更新数据
  const updateData = { status };
  if (status === 'in_progress') {
    updateData.started_at = now;
  } else if (status === 'completed') {
    updateData.completed_at = now;
  }

  // 白名单验证 - 只允许更新指定的字段
  const validation = validateUpdateData(updateData, ALLOWED_TASK_FIELDS);
  if (!validation.valid) {
    return errorResponse(c, ErrorCodes.INVALID_INPUT, 'No valid fields to update', 400);
  }

  validation.values.push(id);
  await db.prepare(`UPDATE transport_tasks SET ${validation.fields.join(', ')} WHERE id = ?`)
    .bind(...validation.values).run();

  return c.json({ success: true });
});

export default app;
