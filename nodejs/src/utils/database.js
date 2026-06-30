/**
 * 数据库安全辅助函数
 * 用于防止SQL注入攻击
 */

// 白名单 - 允许更新的字段名
export const ALLOWED_AREA_FIELDS = ['name', 'area_type', 'config', 'position_x', 'position_y', 'scale', 'status'];
export const ALLOWED_TASK_FIELDS = ['status', 'started_at', 'completed_at', 'driver_name', 'vehicle_info', 'notes'];
export const ALLOWED_USER_FIELDS = ['is_active', 'email', 'username', 'language', 'password_hash', 'subscription_start', 'subscription_end'];
export const ALLOWED_PARTICIPANT_FIELDS = ['name', 'phone', 'email', 'company', 'department', 'position', 'hotel_id', 'meal_preference', 'transport_task_id', 'notes'];
export const ALLOWED_CONFERENCE_FIELDS = ['title', 'code', 'description', 'start_date', 'end_date', 'location', 'status'];
export const ALLOWED_HOTEL_FIELDS = ['name', 'address', 'phone', 'contact_person', 'total_rooms', 'available_rooms', 'notes'];
export const ALLOWED_RESTAURANT_FIELDS = ['name', 'address', 'phone', 'contact_person', 'capacity', 'available_seats', 'meal_type', 'notes'];

/**
 * 安全的数据库更新函数
 * @param {Object} db - 数据库连接对象
 * @param {string} table - 表名
 * @param {string|number} id - 记录ID
 * @param {Object} data - 更新数据
 * @param {Array} allowedFields - 允许的字段名白名单
 * @returns {Promise} - 更新结果
 */
export async function safeUpdate(db, table, id, data, allowedFields) {
  const updateFields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    // 白名单验证 - 只允许指定的字段名
    if (value !== undefined && allowedFields.includes(key)) {
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);
  const sql = `UPDATE ${table} SET ${updateFields.join(', ')} WHERE id = ?`;
  return await db.prepare(sql).bind(...values).run();
}

/**
 * 验证字段名是否在白名单中
 * @param {string} field - 字段名
 * @param {Array} allowedFields - 允许的字段名白名单
 * @returns {boolean} - 是否允许
 */
export function validateField(field, allowedFields) {
  const fieldName = field.split('=')[0].trim();
  return allowedFields.includes(fieldName);
}

/**
 * 获取表的白名单字段
 * @param {string} table - 表名
 * @returns {Array} - 允许的字段名白名单
 */
export function getAllowedFields(table) {
  const fieldWhitelist = {
    'seating_areas': ALLOWED_AREA_FIELDS,
    'transport_tasks': ALLOWED_TASK_FIELDS,
    'users': ALLOWED_USER_FIELDS,
    'participants': ALLOWED_PARTICIPANT_FIELDS,
    'conferences': ALLOWED_CONFERENCE_FIELDS,
    'hotels': ALLOWED_HOTEL_FIELDS,
    'restaurants': ALLOWED_RESTAURANT_FIELDS
  };

  return fieldWhitelist[table] || [];
}

/**
 * 批量更新验证
 * @param {Object} data - 更新数据
 * @param {Array} allowedFields - 允许的字段名白名单
 * @returns {Object} - 验证结果 {valid: boolean, fields: Array, values: Array}
 */
export function validateUpdateData(data, allowedFields) {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  return {
    valid: fields.length > 0,
    fields,
    values
  };
}