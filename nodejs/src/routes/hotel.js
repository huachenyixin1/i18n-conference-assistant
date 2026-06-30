import { Hono } from 'hono';
import { authMiddleware, getCurrentUserId } from '../middleware/auth.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/:conference_id/hotels', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  const result = await db.prepare(
    'SELECT * FROM hotels WHERE conference_id = ? ORDER BY id'
  ).bind(conferenceId).all();

  return c.json(result.results);
});

app.post('/:conference_id/hotels', async (c) => {
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
      INSERT INTO hotels (conference_id, user_id, name, location, contact, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      conferenceId, conference.user_id, data.name, data.location || null, data.contact || null, data.note || null,
      new Date().toISOString()
    ).run();

    return c.json({ id: result.meta.last_row_id, ...data });
  } catch (e) {
    return c.json({ detail: '创建酒店失败: ' + e.message }, 500);
  }
});

app.put('/hotels/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = await c.req.json();

  await db.prepare(`
    UPDATE hotels SET
      name = COALESCE(?, name),
      location = COALESCE(?, location),
      contact = COALESCE(?, contact),
      note = COALESCE(?, note)
    WHERE id = ?
  `).bind(data.name, data.location, data.contact, data.note, id).run();

  return c.json({ success: true });
});

app.delete('/hotels/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('DELETE FROM hotel_assignments WHERE room_id IN (SELECT id FROM hotel_rooms WHERE hotel_id = ?)').bind(id).run();
  await db.prepare('DELETE FROM hotel_rooms WHERE hotel_id = ?').bind(id).run();
  await db.prepare('DELETE FROM hotels WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

app.get('/:conference_id/rooms', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const hotelId = c.req.query('hotel_id');

  let query = `
    SELECT r.*, h.name as hotel_name
    FROM hotel_rooms r
    LEFT JOIN hotels h ON r.hotel_id = h.id
    WHERE r.conference_id = ?
  `;
  let params = [conferenceId];

  if (hotelId && hotelId !== '0') {
    query += ' AND r.hotel_id = ?';
    params.push(hotelId);
  }

  query += ' ORDER BY r.id';

  const result = await db.prepare(query).bind(...params).all();

  return c.json(result.results);
});

app.post('/:conference_id/rooms', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');
  const data = await c.req.json();

  const result = await db.prepare(`
    INSERT INTO hotel_rooms (conference_id, hotel_id, room_number, room_type, floor, position_x, position_y, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    conferenceId, data.hotel_id, data.room_number, data.room_type || 'single',
    data.floor || null, data.position_x || null, data.position_y || null, 'available'
  ).run();

  return c.json({ id: result.meta.last_row_id, ...data });
});

app.post('/:conference_id/rooms/batch', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const statements = [];

    if (data.rooms && Array.isArray(data.rooms)) {
      const hotelId = parseInt(data.hotel_id);
      for (const room of data.rooms) {
        statements.push(
          db.prepare(`
            INSERT INTO hotel_rooms (conference_id, hotel_id, room_number, room_type, status, user_id)
            VALUES (?, ?, ?, ?, 'available', ?)
          `).bind(conferenceId, hotelId, room.room_number, room.room_type || 'single', userId)
        );
      }
    } else {
      const { hotel_id, prefix, start, end, floor, room_type } = data;
      for (let i = start; i <= end; i++) {
        const roomNumber = `${prefix}${i}`;
        statements.push(
          db.prepare(`
            INSERT INTO hotel_rooms (conference_id, hotel_id, room_number, room_type, floor, status, user_id)
            VALUES (?, ?, ?, ?, ?, 'available', ?)
          `).bind(conferenceId, hotel_id, roomNumber, room_type || 'single', floor, userId)
        );
      }
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return c.json({ created: statements.length });
  } catch (e) {
    return c.json({ detail: '批量创建房间失败: ' + e.message }, 500);
  }
});

app.put('/rooms/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = await c.req.json();

  await db.prepare(`
    UPDATE hotel_rooms SET
      room_number = COALESCE(?, room_number),
      room_type = COALESCE(?, room_type),
      floor = COALESCE(?, floor),
      position_x = COALESCE(?, position_x),
      position_y = COALESCE(?, position_y)
    WHERE id = ?
  `).bind(data.room_number, data.room_type, data.floor, data.position_x, data.position_y, id).run();

  return c.json({ success: true });
});

app.delete('/rooms/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  await db.prepare('DELETE FROM hotel_assignments WHERE room_id = ?').bind(id).run();
  await db.prepare('DELETE FROM hotel_rooms WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

app.get('/:conference_id/assignments', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  const result = await db.prepare(`
    SELECT ha.*, p.name as participant_name, p.company,
           hr.room_number, hr.room_type, h.name as hotel_name
    FROM hotel_assignments ha
    LEFT JOIN participants p ON ha.participant_id = p.id
    LEFT JOIN hotel_rooms hr ON ha.room_id = hr.id
    LEFT JOIN hotels h ON hr.hotel_id = h.id
    WHERE ha.conference_id = ?
    ORDER BY ha.id
  `).bind(conferenceId).all();

  return c.json(result.results);
});

app.post('/:conference_id/assignments', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const userId = getCurrentUserId(c);
    const { room_id, participant_id, check_in_date, check_out_date } = await c.req.json();

    const room = await db.prepare('SELECT * FROM hotel_rooms WHERE id = ?').bind(room_id).first();
    if (!room) {
      return errorResponse(c, ErrorCodes.ROOM_NOT_FOUND, 404);
    }

    const roomCapacity = { 'single': 1, 'double': 2, 'suite': 4 };
    const maxOccupancy = roomCapacity[room.room_type] || 1;

    const existingCountResult = await db.prepare(
      'SELECT COUNT(*) as count FROM hotel_assignments WHERE conference_id = ? AND room_id = ?'
    ).bind(conferenceId, room_id).first();
    const existingCount = existingCountResult?.count || 0;

    if (existingCount >= maxOccupancy) {
      const roomTypeName = room.room_type === 'single' ? '单人间' : (room.room_type === 'double' ? '双人间' : '套房');
      return c.json({ detail: `该${roomTypeName}最多可住${maxOccupancy}人，已住满` }, 400);
    }

    const existingParticipant = await db.prepare(
      'SELECT id FROM hotel_assignments WHERE room_id = ? AND participant_id = ?'
    ).bind(room_id, participant_id).first();
    if (existingParticipant) {
      return errorResponse(c, ErrorCodes.PARTICIPANT_ALREADY_IN_ROOM);
    }

    const result = await db.prepare(`
      INSERT INTO hotel_assignments (user_id, conference_id, room_id, participant_id, check_in, check_out)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, conferenceId, room_id, participant_id, check_in_date || null, check_out_date || null).run();

    if (existingCount === 0) {
      await db.prepare('UPDATE hotel_rooms SET status = ? WHERE id = ?').bind('occupied', room_id).run();
    }

    return c.json({ success: true, message: '分配成功', id: result.meta.last_row_id });
  } catch (e) {
    return c.json({ detail: '分配失败: ' + e.message }, 500);
  }
});

app.delete('/assignments/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');

  const assignment = await db.prepare('SELECT room_id FROM hotel_assignments WHERE id = ?').bind(id).first();
  if (assignment) {
    await db.prepare('UPDATE hotel_rooms SET status = ? WHERE id = ?').bind('available', assignment.room_id).run();
  }

  await db.prepare('DELETE FROM hotel_assignments WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

app.delete('/:conference_id/assignments/all', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  await db.prepare('UPDATE hotel_rooms SET status = ? WHERE conference_id = ?').bind('available', conferenceId).run();
  await db.prepare('DELETE FROM hotel_assignments WHERE conference_id = ?').bind(conferenceId).run();

  return c.json({ success: true });
});

app.get('/:conference_id/summary', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('conference_id');

  const hotelsResult = await db.prepare('SELECT * FROM hotels WHERE conference_id = ? ORDER BY id').bind(conferenceId).all();
  const hotels = hotelsResult.results || [];

  const hotelData = [];
  let totalRooms = 0;
  let totalCapacity = 0;
  let totalOccupied = 0;

  for (const h of hotels) {
    const roomsResult = await db.prepare('SELECT * FROM hotel_rooms WHERE hotel_id = ?').bind(h.id).all();
    const rooms = roomsResult.results || [];
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const available = rooms.filter(r => r.status === 'available').length;

    hotelData.push({
      hotel_id: h.id,
      hotel_name: h.name,
      room_count: rooms.length,
      occupied: occupied,
      available: available
    });

    totalRooms += rooms.length;
    totalOccupied += occupied;
  }

  totalCapacity = totalRooms;

  const assignmentsResult = await db.prepare(`
    SELECT ha.* FROM hotel_assignments ha
    JOIN participants p ON ha.participant_id = p.id
    WHERE ha.conference_id = ? AND p.has_hotel = 1
  `).bind(conferenceId).all();
  const totalAssigned = (assignmentsResult.results || []).length;

  const participantsResult = await db.prepare('SELECT id FROM participants WHERE conference_id = ? AND has_hotel = 1').bind(conferenceId).all();
  const hotelParticipants = (participantsResult.results || []).length;
  const unassignedCount = Math.max(0, hotelParticipants - totalAssigned);

  return c.json({
    hotels: hotelData,
    total_rooms: totalRooms,
    total_capacity: totalCapacity,
    available_capacity: totalRooms - totalOccupied,
    total_assigned: totalAssigned,
    hotel_participants: hotelParticipants,
    unassigned_count: unassignedCount
  });
});

app.post('/:conference_id/assignments/auto', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const participantsResult = await db.prepare(
      'SELECT id FROM participants WHERE conference_id = ? AND has_hotel = 1 ORDER BY id'
    ).bind(conferenceId).all();
    const participants = participantsResult.results || [];

    const existingAssignments = await db.prepare(
      'SELECT participant_id FROM hotel_assignments WHERE conference_id = ?'
    ).bind(conferenceId).all();
    const assignedIds = new Set(existingAssignments.results.map(a => a.participant_id));

    const unassigned = participants.filter(p => !assignedIds.has(p.id));

    if (unassigned.length === 0) {
      return c.json({ success: true, message: '没有需要分配的参会人员', assigned: 0 });
    }

    const roomsResult = await db.prepare(
      'SELECT * FROM hotel_rooms WHERE conference_id = ? ORDER BY hotel_id, room_number'
    ).bind(conferenceId).all();
    const rooms = roomsResult.results || [];

    if (rooms.length === 0) {
      return errorResponse(c, ErrorCodes.NO_AVAILABLE_ROOM);
    }

    const roomCapacity = { 'single': 1, 'double': 2, 'suite': 4 };

    const roomOccupancy = {};
    for (const room of rooms) {
      const countResult = await db.prepare(
        'SELECT COUNT(*) as count FROM hotel_assignments WHERE room_id = ?'
      ).bind(room.id).first();
      roomOccupancy[room.id] = countResult?.count || 0;
    }

    const statements = [];
    let assignedCount = 0;
    let participantIdx = 0;

    for (const room of rooms) {
      const maxCap = roomCapacity[room.room_type] || 1;
      const current = roomOccupancy[room.id] || 0;
      let available = maxCap - current;

      while (available > 0 && participantIdx < unassigned.length) {
        const participant = unassigned[participantIdx];

        statements.push(
          db.prepare(`
            INSERT INTO hotel_assignments (conference_id, room_id, participant_id, user_id)
            VALUES (?, ?, ?, ?)
          `).bind(conferenceId, room.id, participant.id, userId)
        );

        if (current === 0) {
          statements.push(
            db.prepare('UPDATE hotel_rooms SET status = ? WHERE id = ?').bind('occupied', room.id)
          );
        }

        assignedCount++;
        available--;
        participantIdx++;
      }

      if (participantIdx >= unassigned.length) break;
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return c.json({ success: true, message: `成功分配 ${assignedCount} 人`, assigned: assignedCount });
  } catch (e) {
    return c.json({ detail: '自动分配失败: ' + e.message }, 500);
  }
});

export default app;
