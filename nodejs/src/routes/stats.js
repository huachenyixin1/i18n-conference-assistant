import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { ErrorCodes, errorResponse } from '../utils/errors.js';

const app = new Hono();

app.use('*', authMiddleware);

app.get('/conference/:id/overview', async (c) => {
  const db = c.env.DB;
  const conferenceId = c.req.param('id');

  const conference = await db.prepare(
    'SELECT * FROM conferences WHERE id = ?'
  ).bind(conferenceId).first();

  if (!conference) {
    return errorResponse(c, ErrorCodes.CONFERENCE_NOT_FOUND, 404);
  }

  const participants = await db.prepare(
    'SELECT COUNT(*) as count FROM participants WHERE conference_id = ?'
  ).bind(conferenceId).first();

  const totalParticipants = participants?.count || 0;

  const seatingAssigned = await db.prepare(
    'SELECT COUNT(*) as count FROM seating_assignments WHERE conference_id = ?'
  ).bind(conferenceId).first();

  const seatingStats = {
    total: totalParticipants,
    assigned: seatingAssigned?.count || 0,
    unassigned: Math.max(0, totalParticipants - (seatingAssigned?.count || 0)),
    rate: totalParticipants > 0 ? ((seatingAssigned?.count || 0) / totalParticipants * 100) : 0
  };

  const hotelNeed = await db.prepare(
    'SELECT COUNT(*) as count FROM participants WHERE conference_id = ? AND has_hotel = 1'
  ).bind(conferenceId).first();

  const hotelAssigned = await db.prepare(
    'SELECT COUNT(*) as count FROM hotel_assignments WHERE conference_id = ?'
  ).bind(conferenceId).first();

  const hotelStats = {
    need_count: hotelNeed?.count || 0,
    assigned: hotelAssigned?.count || 0,
    unassigned: Math.max(0, (hotelNeed?.count || 0) - (hotelAssigned?.count || 0)),
    rate: (hotelNeed?.count || 0) > 0 ? ((hotelAssigned?.count || 0) / (hotelNeed?.count || 0) * 100) : 0
  };

  const restaurantNeed = await db.prepare(
    'SELECT COUNT(*) as count FROM participants WHERE conference_id = ? AND has_meal = 1'
  ).bind(conferenceId).first();

  const restaurantAssigned = await db.prepare(
    'SELECT COUNT(*) as count FROM restaurant_seats WHERE conference_id = ?'
  ).bind(conferenceId).first();

  const restaurantStats = {
    need_count: restaurantNeed?.count || 0,
    assigned: restaurantAssigned?.count || 0,
    unassigned: Math.max(0, (restaurantNeed?.count || 0) - (restaurantAssigned?.count || 0)),
    rate: (restaurantNeed?.count || 0) > 0 ? ((restaurantAssigned?.count || 0) / (restaurantNeed?.count || 0) * 100) : 0
  };

  const transportNeed = await db.prepare(
    'SELECT COUNT(*) as count FROM participants WHERE conference_id = ? AND has_transport = 1'
  ).bind(conferenceId).first();

  const transportAssigned = await db.prepare(
    'SELECT COUNT(*) as count FROM transport_task_passengers p JOIN transport_tasks t ON p.task_id = t.id WHERE t.conference_id = ?'
  ).bind(conferenceId).first();

  const transportStats = {
    need_count: transportNeed?.count || 0,
    assigned: transportAssigned?.count || 0,
    unassigned: Math.max(0, (transportNeed?.count || 0) - (transportAssigned?.count || 0)),
    rate: (transportNeed?.count || 0) > 0 ? ((transportAssigned?.count || 0) / (transportNeed?.count || 0) * 100) : 0
  };

  return c.json({
    conference: {
      id: conference.id,
      title: conference.title,
      start_date: conference.start_date,
      end_date: conference.end_date
    },
    total_participants: totalParticipants,
    seating: seatingStats,
    hotel: hotelStats,
    restaurant: restaurantStats,
    transport: transportStats
  });
});

export default app;
