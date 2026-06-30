// i18n 核心模块
// 语言包通过全局变量加载（zh-CN.js和en-US.js会设置window.zhCN和window.enUS）

// 默认语言
const DEFAULT_LANG = 'en-US'

// 当前语言
let currentLang = DEFAULT_LANG

// 语言切换监听器列表
const languageChangeListeners = []

// 获取语言包（延迟获取，确保语言包已加载）
function getLanguages() {
  return {
    'zh-CN': window.zhCN,
    'en-US': window.enUS,
    'ja-JP': window.jaJP,
    'ms-MY': window.msMY,
    'vi-VN': window.viVN,
    'km-KH': window.kmKH,
    'mn-MN': window.mnMN,
    'bo-CN': window.boCN,
    'th-TH': window.thTH,
    'ko-KR': window.koKR,
    'id-ID': window.idID,
    'hi-IN': window.hiIN,
    'fr-FR': window.frFR,
    'pt-BR': window.ptBR,
    'ru-RU': window.ruRU,
    'ar-SA': window.arSA,
  }
}

/**
 * 注册语言切换监听器
 * @param {function} callback - 语言切换时调用的回调函数
 */
function onLanguageChange(callback) {
  if (typeof callback === 'function') {
    languageChangeListeners.push(callback)
  }
}

/**
 * 初始化语言设置
 * 从 localStorage 读取用户偏好，或使用默认语言
 */
function init() {
  const savedLang = localStorage.getItem('language')
  const langs = getLanguages()
  if (savedLang && langs[savedLang]) {
    currentLang = savedLang
  } else {
    // 默认使用英语，不检测浏览器语言
    currentLang = DEFAULT_LANG
    localStorage.setItem('language', currentLang)
  }

  // 设置 HTML lang 属性和 RTL 支持
  document.documentElement.lang = currentLang
  // RTL语言支持（阿拉伯语等）
  const rtlLanguages = ['ar-SA', 'ar', 'he', 'fa', 'ur']
  if (rtlLanguages.some(rtl => currentLang.startsWith(rtl))) {
    document.documentElement.dir = 'rtl'
  } else {
    document.documentElement.dir = 'ltr'
  }

  // 更新语言切换按钮文本
  if (window.updateLangBtnText) {
    window.updateLangBtnText()
  }
}

/**
 * 获取翻译文本
 * @param {string} key - 翻译键，如 'auth.login.title'
 * @param {object} params - 可选参数，用于替换占位符
 * @returns {string} 翻译后的文本
 */
function t(key, params = null) {
  const langs = getLanguages()
  const langPack = langs[currentLang] || langs[DEFAULT_LANG]

  // 按点分隔获取嵌套值
  const keys = key.split('.')
  let value = langPack

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // 找不到翻译，返回键名
      console.warn(`[i18n] Translation not found: ${key}`)
      return key
    }
  }

  // 如果不是字符串，返回键名
  if (typeof value !== 'string') {
    return key
  }

  // 处理参数替换（如 "{name} 已登录" → "张三 已登录"）
  if (params && typeof params === 'object') {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match
    })
  }

  return value
}

/**
 * 设置当前语言
 * @param {string} lang - 语言代码，如 'zh-CN' 或 'en-US'
 */
function setLanguage(lang) {
  const langs = getLanguages()
  if (!langs[lang]) {
    console.warn(`[i18n] Language not supported: ${lang}`)
    return
  }

  currentLang = lang
  localStorage.setItem('language', lang)

  // 更新页面所有文本
  updateAllText()

  // 更新语言切换按钮文本
  if (window.updateLangBtnText) {
    window.updateLangBtnText()
  }

  // 更新 HTML lang 属性和 RTL 支持
  document.documentElement.lang = lang
  // RTL语言支持（阿拉伯语等）
  const rtlLanguages = ['ar-SA', 'ar', 'he', 'fa', 'ur']
  if (rtlLanguages.some(rtl => lang.startsWith(rtl))) {
    document.documentElement.dir = 'rtl'
  } else {
    document.documentElement.dir = 'ltr'
  }

  // 强制重新渲染日期输入框，使其显示正确的语言
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    const parent = input.parentNode
    const nextSibling = input.nextSibling
    const clone = input.cloneNode(true)
    clone.value = input.value // 保持原有的值
    parent.removeChild(input)
    if (nextSibling) {
      parent.insertBefore(clone, nextSibling)
    } else {
      parent.appendChild(clone)
    }
  })

  // 更新语言切换下拉框的选中值
  const langSelect = document.querySelector('.lang-select')
  if (langSelect) {
    langSelect.value = lang
  }

  // 更新语言切换下拉框的值（如果有）
  document.querySelectorAll('.lang-select, .lang-select-header').forEach((select) => {
    select.value = lang
  })

  // 触发所有语言切换监听器
  languageChangeListeners.forEach(callback => {
    try {
      callback(lang)
    } catch (e) {
      console.error('[i18n] Language change listener error:', e)
    }
  })

  console.log(`[i18n] Language set to: ${lang}`)
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
function getLanguage() {
  return currentLang
}

/**
 * 更新页面所有带有 data-i18n 属性的元素
 */
function updateAllText() {
  // 更新文本内容
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    if (key) {
      el.textContent = t(key)
    }
  })

  // 更新 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder')
    if (key) {
      el.placeholder = t(key)
    }
  })

  // 更新 title 属性
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title')
    if (key) {
      el.title = t(key)
    }
  })

  // 更新 aria-label 属性
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')
    if (key) {
      el.setAttribute('aria-label', t(key))
    }
  })
}

/**
 * 获取支持的语言列表
 * @returns {Array} 语言代码数组
 */
function getSupportedLanguages() {
  return Object.keys(languages)
}

// 初始化
init()

// 导出全局对象
window.i18n = {
  t,
  setLanguage,
  getLanguage,
  updateAllText,
  updateAllElements: updateAllText, // 别名，方便调用
  getSupportedLanguages,
  onLanguageChange,
}

// 页面加载完成后自动更新文本和下拉框
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[i18n] DOM loaded, initializing...')
    console.log('[i18n] window.zhCN:', !!window.zhCN)
    console.log('[i18n] window.enUS:', !!window.enUS)
    init()
    updateAllText()
    console.log('[i18n] Initialization complete, current language:', currentLang)
    // 设置下拉框初始值
    const langSelect = document.querySelector('.lang-select')
    if (langSelect) {
      langSelect.value = currentLang
    }
  })
} else {
  // DOM 已加载完成
  console.log('[i18n] DOM already loaded, initializing...')
  console.log('[i18n] window.zhCN:', !!window.zhCN)
  console.log('[i18n] window.enUS:', !!window.enUS)
  init()
  updateAllText()
  console.log('[i18n] Initialization complete, current language:', currentLang)
  // 设置下拉框初始值
  const langSelect = document.querySelector('.lang-select')
  if (langSelect) {
    langSelect.value = currentLang
  }
}

console.log('[i18n] Module initialized, current language:', currentLang)