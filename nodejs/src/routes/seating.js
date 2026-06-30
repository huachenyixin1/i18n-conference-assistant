import { Hono } from 'hono';
import { errorResponse } from '../utils/errors.js';
import { ALLOWED_AREA_FIELDS, validateUpdateData } from '../utils/database.js';

const app = new Hono();

function getSeatsFromArea(area) {
  const seats = [];
  const areaType = (area.area_type || '').trim();
  let config = {};
  try {
    config = JSON.parse(area.config || '{}');
  } catch (e) { }

  if (areaType === 'rect') {
    let rowsConfig = config.rows;
    let seatsPerRowList = [];

    if (typeof rowsConfig === 'string') {
      rowsConfig = rowsConfig.replace(/，/g, ',');
      seatsPerRowList = rowsConfig.split(',').map(x => parseInt(x.trim()) || 0).filter(x => x > 0);
    } else if (Array.isArray(rowsConfig)) {
      seatsPerRowList = rowsConfig.map(r => parseInt(r) || 0).filter(r => r > 0);
    }

    if (seatsPerRowList.length === 0) {
      seatsPerRowList = [10];
    }

    for (let rowIdx = 0; rowIdx < seatsPerRowList.length; rowIdx++) {
      const seatsCount = seatsPerRowList[rowIdx];
      for (let col = 1; col <= seatsCount; col++) {
        seats.push({
          seat_number: `${rowIdx + 1}-${col}`,
          row: rowIdx + 1,
          col: col
        });
      }
    }
  } else if (areaType === 'hollow') {
    const top = config.top || 0;
    const bottom = config.bottom || 0;
    const left = config.left || 0;
    const right = config.right || 0;

    for (let i = 0; i < top; i++) {
      seats.push({ seat_number: `T${i + 1}`, row: 0, col: i + 1 });
    }
    for (let i = 0; i < bottom; i++) {
      seats.push({ seat_number: `B${i + 1}`, row: left + right + 1, col: i + 1 });
    }
    for (let i = 0; i < left; i++) {
      seats.push({ seat_number: `L${i + 1}`, row: i + 1, col: 0 });
    }
    const cols = Math.max(top, bottom);
    for (let i = 0; i < right; i++) {
      seats.push({ seat_number: `R${i + 1}`, row: i + 1, col: cols + 1 });
    }
  } else if (areaType === 'face') {
    const leftCount = config.left_count || 4;
    const rightCount = config.right_count || 4;

    for (let i = 0; i < leftCount; i++) {
      seats.push({ seat_number: `L${i + 1}`, row: i + 1, col: 0 });
    }
    for (let i = 0; i < rightCount; i++) {
      seats.push({ seat_number: `R${i + 1}`, row: i + 1, col: 2 });
    }
  } else {
    let rowsConfig = config.rows;
    let seatsPerRowList = [];

    if (typeof rowsConfig === 'string') {
      rowsConfig = rowsConfig.replace(/，/g, ',');
      seatsPerRowList = rowsConfig.split(',').map(x => parseInt(x.trim()) || 0).filter(x => x > 0);
    } else if (Array.isArray(rowsConfig)) {
      seatsPerRowList = rowsConfig.map(r => parseInt(r) || 0).filter(r => r > 0);
    }

    if (seatsPerRowList.length === 0) {
      seatsPerRowList = [10];
    }

    for (let rowIdx = 0; rowIdx < seatsPerRowList.length; rowIdx++) {
      const seatsCount = seatsPerRowList[rowIdx];
      for (let col = 1; col <= seatsCount; col++) {
        seats.push({
          seat_number: `${rowIdx + 1}-${col}`,
          row: rowIdx + 1,
          col: col
        });
      }
    }
  }

  return seats;
}

function areaToDict(area) {
  let config = {};
  try {
    config = JSON.parse(area.config || '{}');
  } catch (e) { }

  return {
    id: area.id,
    conference_id: area.conference_id,
    name: area.name,
    area_type: area.area_type,
    config: config,
    position_x: area.position_x,
    position_y: area.position_y,
    scale: area.scale
  };
}

app.get('/:conference_id/areas', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');

    const result = await db.prepare(
      'SELECT * FROM seating_areas WHERE conference_id = ? ORDER BY id'
    ).bind(conferenceId).all();

    return c.json(result.results.map(area => areaToDict(area)));
  } catch (e) {
    return c.json({ detail: '获取区域失败: ' + e.message }, 500);
  }
});

app.post('/:conference_id/areas', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();

    const result = await db.prepare(`
      INSERT INTO seating_areas (conference_id, user_id, name, area_type, config, position_x, position_y)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      conferenceId,
      conference?.user_id || null,
      data.name,
      data.area_type || 'rect',
      JSON.stringify(data.config || {}),
      data.position_x || 0,
      data.position_y || 0
    ).run();

    const newArea = await db.prepare('SELECT * FROM seating_areas WHERE id = ?').bind(result.meta.last_row_id).first();

    return c.json({ success: true, message: '区域创建成功', area: areaToDict(newArea) });
  } catch (e) {
    return c.json({ detail: '创建区域失败: ' + e.message }, 500);
  }
});

app.put('/areas/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const data = await c.req.json();

    const area = await db.prepare('SELECT * FROM seating_areas WHERE id = ?').bind(id).first();
    if (!area) {
      return errorResponse(c, ErrorCodes.AREA_NOT_FOUND, 404);
    }

    // 白名单验证 - 只允许更新指定的字段
    const validation = validateUpdateData(data, ALLOWED_AREA_FIELDS);
    if (!validation.valid) {
      return errorResponse(c, ErrorCodes.INVALID_INPUT, 'No valid fields to update', 400);
    }

    if (validation.fields.length > 0) {
      validation.values.push(id);
      await db.prepare(`UPDATE seating_areas SET ${validation.fields.join(', ')} WHERE id = ?`)
        .bind(...validation.values).run();
    }

    const updatedArea = await db.prepare('SELECT * FROM seating_areas WHERE id = ?').bind(id).first();
    return c.json({ success: true, message: '区域更新成功', area: areaToDict(updatedArea) });
  } catch (e) {
    return c.json({ detail: '更新区域失败: ' + e.message }, 500);
  }
});

app.put('/areas/:id/position', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');
    const data = await c.req.json();

    const area = await db.prepare('SELECT * FROM seating_areas WHERE id = ?').bind(id).first();
    if (!area) {
      return errorResponse(c, ErrorCodes.AREA_NOT_FOUND, 404);
    }

    await db.prepare(`
      UPDATE seating_areas SET position_x = ?, position_y = ?, scale = COALESCE(?, scale) WHERE id = ?
    `).bind(data.position_x, data.position_y, data.scale, id).run();

    return c.json({ success: true, message: '位置更新成功' });
  } catch (e) {
    return c.json({ detail: '更新位置失败: ' + e.message }, 500);
  }
});

app.delete('/areas/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');

    const area = await db.prepare('SELECT * FROM seating_areas WHERE id = ?').bind(id).first();
    if (!area) {
      return errorResponse(c, ErrorCodes.AREA_NOT_FOUND, 404);
    }

    await db.prepare('DELETE FROM seating_assignments WHERE seating_area_id = ?').bind(id).run();
    await db.prepare('DELETE FROM seating_areas WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: '区域删除成功' });
  } catch (e) {
    return c.json({ detail: '删除区域失败: ' + e.message }, 500);
  }
});

app.get('/:conference_id/assignments', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');

    const assignmentsResult = await db.prepare(`
      SELECT sa.*, p.name as participant_name, p.company as participant_company, p.position as participant_position
      FROM seating_assignments sa
      LEFT JOIN participants p ON sa.participant_id = p.id
      WHERE sa.conference_id = ?
      ORDER BY sa.seating_area_id, sa.seat_number
    `).bind(conferenceId).all();

    const areasResult = await db.prepare(
      'SELECT * FROM seating_areas WHERE conference_id = ? ORDER BY id'
    ).bind(conferenceId).all();

    const assignmentsData = [];
    for (const a of assignmentsResult.results || []) {
      const area = areasResult.results.find(ar => ar.id === a.seating_area_id);
      assignmentsData.push({
        id: a.id,
        area_id: a.seating_area_id,
        area_name: area ? area.name : '',
        seat_number: a.seat_number,
        participant_id: a.participant_id,
        participant_name: a.participant_name || '',
        participant_company: a.participant_company || '',
        participant_position: a.participant_position || ''
      });
    }

    const areaSeats = {};
    for (const area of areasResult.results || []) {
      const seats = getSeatsFromArea(area);
      areaSeats[area.id] = {
        area: areaToDict(area),
        seats: seats
      };
    }

    return c.json({
      assignments: assignmentsData,
      area_seats: areaSeats
    });
  } catch (e) {
    return c.json({ detail: '加载排座数据失败: ' + e.message }, 500);
  }
});

app.post('/:conference_id/assignments', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();
    const areaId = data.area_id || data.seating_area_id;
    const { participant_id, seat_number } = data;

    if (!areaId) {
      return errorResponse(c, ErrorCodes.MISSING_AREA_ID);
    }

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const existing = await db.prepare(
      'SELECT * FROM seating_assignments WHERE seating_area_id = ? AND seat_number = ?'
    ).bind(areaId, seat_number).first();

    if (existing) {
      await db.prepare(
        'UPDATE seating_assignments SET participant_id = ? WHERE id = ?'
      ).bind(participant_id, existing.id).run();
    } else {
      await db.prepare(`
        INSERT INTO seating_assignments (conference_id, seating_area_id, area_id, participant_id, seat_number, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(conferenceId, areaId, areaId, participant_id, seat_number, userId).run();
    }

    return c.json({ success: true, message: '座位分配成功' });
  } catch (e) {
    return c.json({ detail: '分配座位失败: ' + e.message }, 500);
  }
});

app.delete('/assignments/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = c.req.param('id');

    const assignment = await db.prepare('SELECT * FROM seating_assignments WHERE id = ?').bind(id).first();
    if (!assignment) {
      return c.json({ success: true, message: '座位分配本来就不存在' });
    }

    await db.prepare('DELETE FROM seating_assignments WHERE id = ?').bind(id).run();

    return c.json({ success: true, message: '座位已清空' });
  } catch (e) {
    return c.json({ detail: '清除座位失败: ' + e.message }, 500);
  }
});

app.delete('/:conference_id/assignments', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');

    await db.prepare('DELETE FROM seating_assignments WHERE conference_id = ?').bind(conferenceId).run();

    return c.json({ success: true, message: '已清空所有座位分配' });
  } catch (e) {
    return c.json({ detail: '清空分配失败: ' + e.message }, 500);
  }
});

app.post('/swap', async (c) => {
  try {
    const db = c.env.DB;
    const data = await c.req.json();

    const a1 = await db.prepare('SELECT * FROM seating_assignments WHERE id = ?').bind(data.assignment_id_1).first();
    const a2 = await db.prepare('SELECT * FROM seating_assignments WHERE id = ?').bind(data.assignment_id_2).first();

    if (!a1 || !a2) {
      return errorResponse(c, ErrorCodes.SEAT_ASSIGNMENT_NOT_FOUND, 404);
    }

    await db.prepare('UPDATE seating_assignments SET participant_id = ? WHERE id = ?').bind(a2.participant_id, a1.id).run();
    await db.prepare('UPDATE seating_assignments SET participant_id = ? WHERE id = ?').bind(a1.participant_id, a2.id).run();

    return c.json({ success: true, message: '座位交换成功' });
  } catch (e) {
    return c.json({ detail: '交换座位失败: ' + e.message }, 500);
  }
});

app.get('/:conference_id/priority', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');

    const result = await db.prepare(
      'SELECT * FROM seating_priorities WHERE conference_id = ?'
    ).bind(conferenceId).first();

    if (!result) {
      return c.json({
        arrange_mode: 'middle',
        priority_fields: [],
        position_priority: {},
        company_priority: {}
      });
    }

    let positionPriority = {};
    let companyPriority = {};
    try {
      positionPriority = JSON.parse(result.position_priority || '{}');
    } catch (e) { }
    try {
      companyPriority = JSON.parse(result.company_priority || '{}');
    } catch (e) { }

    return c.json({
      arrange_mode: result.arrange_mode || 'middle',
      priority_fields: result.priority_fields ? JSON.parse(result.priority_fields) : [],
      position_priority: positionPriority,
      company_priority: companyPriority
    });
  } catch (e) {
    return c.json({ detail: '获取优先级配置失败: ' + e.message }, 500);
  }
});

app.put('/:conference_id/priority', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json();

    const existing = await db.prepare(
      'SELECT id FROM seating_priorities WHERE conference_id = ?'
    ).bind(conferenceId).first();

    if (existing) {
      await db.prepare(`
        UPDATE seating_priorities SET
          arrange_mode = ?,
          priority_fields = ?,
          position_priority = ?,
          company_priority = ?
        WHERE conference_id = ?
      `).bind(
        data.arrange_mode || 'middle',
        JSON.stringify(data.priority_fields || []),
        JSON.stringify(data.position_priority || {}),
        JSON.stringify(data.company_priority || {}),
        conferenceId
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO seating_priorities (conference_id, arrange_mode, priority_fields, position_priority, company_priority)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        conferenceId,
        data.arrange_mode || 'middle',
        JSON.stringify(data.priority_fields || []),
        JSON.stringify(data.position_priority || {}),
        JSON.stringify(data.company_priority || {})
      ).run();
    }

    return c.json({ success: true, message: '优先级配置已保存' });
  } catch (e) {
    return c.json({ detail: '保存优先级配置失败: ' + e.message }, 500);
  }
});

app.get('/:conference_id/participant-fields', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');

    const result = await db.prepare(
      'SELECT position, company FROM participants WHERE conference_id = ? AND is_attending = 1'
    ).bind(conferenceId).all();

    const positions = new Set();
    const companies = new Set();

    for (const p of result.results || []) {
      if (p.position) positions.add(p.position.trim());
      if (p.company) companies.add(p.company.trim());
    }

    return c.json({
      positions: Array.from(positions).sort(),
      companies: Array.from(companies).sort()
    });
  } catch (e) {
    return c.json({ detail: '获取参会人字段失败: ' + e.message }, 500);
  }
});

app.post('/:conference_id/assignments/auto', async (c) => {
  try {
    const db = c.env.DB;
    const conferenceId = c.req.param('conference_id');
    const data = await c.req.json().catch(() => null);

    const priorities = data?.priorities || ['position', 'company', 'dept'];

    const conference = await db.prepare('SELECT user_id FROM conferences WHERE id = ?').bind(conferenceId).first();
    const userId = conference?.user_id || null;

    const priorityConfig = await db.prepare(
      'SELECT * FROM seating_priorities WHERE conference_id = ?'
    ).bind(conferenceId).first();

    let positionPriority = {};
    let companyPriority = {};
    let arrangeMode = 'middle';
    if (priorityConfig) {
      try {
        positionPriority = JSON.parse(priorityConfig.position_priority || '{}');
      } catch (e) { }
      try {
        companyPriority = JSON.parse(priorityConfig.company_priority || '{}');
      } catch (e) { }
      arrangeMode = priorityConfig.arrange_mode || 'middle';
    }

    const mode = arrangeMode;

    const participantsResult = await db.prepare(
      'SELECT * FROM participants WHERE conference_id = ? AND is_attending = 1 ORDER BY id'
    ).bind(conferenceId).all();
    const participants = participantsResult.results || [];

    const areasResult = await db.prepare(
      'SELECT * FROM seating_areas WHERE conference_id = ? ORDER BY id'
    ).bind(conferenceId).all();
    const areas = areasResult.results || [];

    if (participants.length === 0) {
      return errorResponse(c, ErrorCodes.NO_PARTICIPANTS);
    }

    if (areas.length === 0) {
      return errorResponse(c, ErrorCodes.NO_SEAT_AREA);
    }

    await db.prepare('DELETE FROM seating_assignments WHERE conference_id = ?').bind(conferenceId).run();

    function sortSeatsForRow(seats, mode) {
      if (mode === 'left') {
        return seats.sort((a, b) => a.col - b.col);
      } else if (mode === 'back') {
        return seats.sort((a, b) => b.col - a.col);
      } else {
        const sortedSeats = seats.sort((a, b) => a.col - b.col);
        const n = sortedSeats.length;
        const mid = Math.floor(n / 2);
        const result = [];
        for (let i = 0; i < mid; i++) {
          result.push(sortedSeats[mid - 1 - i]);
          if (mid + i < n) {
            result.push(sortedSeats[mid + i]);
          }
        }
        if (n % 2 === 1 && n > 0) {
          result.push(sortedSeats[n - 1]);
        }
        return result;
      }
    }

    const sortedParticipants = participants.map(p => {
      let priority = 0;
      for (let idx = 0; idx < priorities.length; idx++) {
        const weight = (priorities.length - idx) * 100;
        const priorityType = priorities[idx];

        if (priorityType === 'position') {
          if (p.position) {
            const posVal = positionPriority[p.position.trim()];
            if (posVal !== undefined) {
              priority += (priorities.length - idx) * 1000 + (100 - posVal);
            }
          }
          if (p.notes && (p.notes.includes('VIP') || p.notes.includes('vip') || p.notes.includes('重要'))) {
            priority += weight * 3;
          }
        } else if (priorityType === 'company') {
          if (p.company) {
            const companyVal = companyPriority[p.company.trim()];
            if (companyVal !== undefined) {
              priority += (priorities.length - idx) * 1000 + (100 - companyVal);
            }
          }
        } else if (priorityType === 'dept') {
          if (p.notes) {
            if (p.notes.includes('重要')) {
              priority += weight * 2;
            } else if (p.notes.includes('普通')) {
              priority += weight;
            }
          }
        }
      }
      return { ...p, priority };
    });

    sortedParticipants.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id - b.id;
    });

    let assignedCount = 0;
    let participantIdx = 0;
    const statements = [];

    for (const area of areas) {
      const seats = getSeatsFromArea(area);
      if (seats.length === 0) continue;

      const seatsByRow = {};
      for (const seat of seats) {
        const row = seat.row || 1;
        if (!seatsByRow[row]) seatsByRow[row] = [];
        seatsByRow[row].push(seat);
      }

      const areaSeats = [];
      for (const row of Object.keys(seatsByRow).map(Number).sort((a, b) => a - b)) {
        const rowSeats = seatsByRow[row];
        const sortedRow = sortSeatsForRow(rowSeats, mode);
        areaSeats.push(...sortedRow);
      }

      for (const seat of areaSeats) {
        if (participantIdx >= sortedParticipants.length) break;
        const participant = sortedParticipants[participantIdx];
        statements.push(
          db.prepare(`
            INSERT INTO seating_assignments (conference_id, seating_area_id, area_id, participant_id, seat_number, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(conferenceId, area.id, area.id, participant.id, seat.seat_number, userId)
        );
        assignedCount++;
        participantIdx++;
      }

      if (participantIdx >= sortedParticipants.length) break;
    }

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return c.json({ success: true, message: `自动分配完成，已分配 ${assignedCount} 个座位`, assigned: assignedCount });
  } catch (e) {
    return c.json({ detail: '自动分配失败: ' + e.message }, 500);
  }
});

export default app;
