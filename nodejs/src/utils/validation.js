/**
 * 输入验证辅助函数
 * 用于防止恶意输入和数据验证
 */

/**
 * 验证邮箱格式
 * @param {string} email - 需要验证的邮箱
 * @returns {boolean} - 是否有效
 */
export function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国）
 * @param {string} phone - 需要验证的手机号
 * @returns {boolean} - 是否有效
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证用户名格式
 * @param {string} username - 需要验证的用户名
 * @returns {boolean} - 是否有效
 */
export function validateUsername(username) {
  if (!username) return false;
  // 用户名：3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * 验证字符串长度
 * @param {string} str - 需要验证的字符串
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @returns {boolean} - 是否有效
 */
export function validateStringLength(str, min, max) {
  if (!str) return false;
  const length = str.length;
  return length >= min && length <= max;
}

/**
 * 验证数字范围
 * @param {number} num - 需要验证的数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} - 是否有效
 */
export function validateNumberRange(num, min, max) {
  if (typeof num !== 'number') return false;
  return num >= min && num <= max;
}

/**
 * 验证日期格式
 * @param {string} date - 需要验证的日期字符串
 * @returns {boolean} - 是否有效
 */
export function validateDate(date) {
  if (!date) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * 验证URL格式
 * @param {string} url - 需要验证的URL
 * @returns {boolean} - 是否有效
 */
export function validateUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证会议代码格式
 * @param {string} code - 需要验证的会议代码
 * @returns {boolean} - 是否有效
 */
export function validateConferenceCode(code) {
  if (!code) return false;
  // 会议代码：2-20个字符，只能包含字母、数字、下划线、横线
  const codeRegex = /^[a-zA-Z0-9_-]{2,20}$/;
  return codeRegex.test(code);
}

/**
 * 验证邀请码格式
 * @param {string} code - 需要验证的邀请码
 * @returns {boolean} - 是否有效
 */
export function validateInvitationCode(code) {
  if (!code) return false;
  // 邀请码：8-32个字符，只能包含字母、数字
  const codeRegex = /^[a-zA-Z0-9]{8,32}$/;
  return codeRegex.test(code);
}

/**
 * 验证ID格式
 * @param {string|number} id - 需要验证的ID
 * @returns {boolean} - 是否有效
 */
export function validateId(id) {
  if (!id) return false;
  const numId = Number(id);
  return !isNaN(numId) && numId > 0 && Number.isInteger(numId);
}

/**
 * 批量验证输入
 * @param {Object} data - 需要验证的数据对象
 * @param {Object} rules - 验证规则
 * @returns {Object} - {valid: boolean, errors: Array}
 */
export function validateInput(data, rules) {
  const errors = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    // 必填验证
    if (rule.required && !value) {
      errors.push(`${field}是必填项`);
      continue;
    }
    
    // 如果不是必填且值为空，跳过其他验证
    if (!rule.required && !value) {
      continue;
    }
    
    // 类型验证
    if (rule.type) {
      switch (rule.type) {
        case 'email':
          if (!validateEmail(value)) {
            errors.push(`${field}格式不正确`);
          }
          break;
        case 'phone':
          if (!validatePhone(value)) {
            errors.push(`${field}格式不正确`);
          }
          break;
        case 'username':
          if (!validateUsername(value)) {
            errors.push(`${field}格式不正确`);
          }
          break;
        case 'date':
          if (!validateDate(value)) {
            errors.push(`${field}格式不正确`);
          }
          break;
        case 'url':
          if (!validateUrl(value)) {
            errors.push(`${field}格式不正确`);
          }
          break;
        case 'id':
          if (!validateId(value)) {
            errors.push(`${field}格式不正确`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`${field}必须是数字`);
          }
          break;
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${field}必须是字符串`);
          }
          break;
      }
    }
    
    // 长度验证
    if (rule.minLength || rule.maxLength) {
      if (!validateStringLength(value, rule.minLength || 0, rule.maxLength || Infinity)) {
        if (rule.minLength && rule.maxLength) {
          errors.push(`${field}长度必须在${rule.minLength}-${rule.maxLength}个字符之间`);
        } else if (rule.minLength) {
          errors.push(`${field}长度至少${rule.minLength}个字符`);
        } else {
          errors.push(`${field}长度最多${rule.maxLength}个字符`);
        }
      }
    }
    
    // 数值范围验证
    if (rule.min || rule.max) {
      if (!validateNumberRange(value, rule.min || -Infinity, rule.max || Infinity)) {
        if (rule.min && rule.max) {
          errors.push(`${field}必须在${rule.min}-${rule.max}之间`);
        } else if (rule.min) {
          errors.push(`${field}至少${rule.min}`);
        } else {
          errors.push(`${field}最多${rule.max}`);
        }
      }
    }
    
    // 自定义验证函数
    if (rule.custom && typeof rule.custom === 'function') {
      const customResult = rule.custom(value);
      if (!customResult.valid) {
        errors.push(customResult.message || `${field}验证失败`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}