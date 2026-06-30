/**
 * DOM操作辅助函数
 * 用于安全地创建DOM元素，替代innerHTML，防止XSS攻击
 */

/**
 * HTML转义函数 - 防止XSS攻击
 * @param {string} str - 需要转义的字符串
 * @returns {string} - 转义后的字符串
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 安全的HTML模板函数
 * @param {Array} strings - 模板字符串数组
 * @param {Array} values - 插值数组
 * @returns {string} - 安全的HTML字符串
 */
function safeHTML(strings, ...values) {
    return strings.reduce((result, str, i) => {
        return result + str + (i < values.length ? escapeHtml(String(values[i])) : '');
    }, '');
}

/**
 * 创建一个详情行元素
 * @param {string} labelKey - i18n翻译键
 * @param {string} value - 显示的值
 * @returns {HTMLElement} - 创建的行元素
 */
function createDetailRow(labelKey, value) {
    const row = document.createElement('div');
    row.className = 'detail-row';

    const label = document.createElement('span');
    label.className = 'label';
    label.setAttribute('data-i18n', labelKey);
    label.textContent = i18n.t(labelKey);

    const val = document.createElement('span');
    val.className = 'value';
    val.textContent = value;  // textContent自动转义，防XSS

    row.appendChild(label);
    row.appendChild(val);
    return row;
}

/**
 * 创建一个表格行元素
 * @param {Array} cells - 单元格数据数组，每个元素可以是字符串或对象{text, className, attrs}
 * @returns {HTMLElement} - 创建的tr元素
 */
function createTableRow(cells) {
    const tr = document.createElement('tr');

    cells.forEach(cell => {
        const td = document.createElement('td');

        if (typeof cell === 'string') {
            td.textContent = cell;
        } else if (typeof cell === 'object') {
            if (cell.className) td.className = cell.className;
            if (cell.attrs) {
                Object.entries(cell.attrs).forEach(([key, value]) => {
                    td.setAttribute(key, value);
                });
            }
            if (cell.text) td.textContent = cell.text;
            if (cell.html) td.innerHTML = cell.html;  // 仅在明确需要时使用
            if (cell.i18n) {
                td.setAttribute('data-i18n', cell.i18n);
                td.textContent = i18n.t(cell.i18n);
            }
            if (cell.children) {
                cell.children.forEach(child => td.appendChild(child));
            }
        }

        tr.appendChild(td);
    });

    return tr;
}

/**
 * 创建一个选项元素
 * @param {string} value - 选项值
 * @param {string} text - 选项文本
 * @param {boolean} selected - 是否选中
 * @returns {HTMLElement} - 创建的option元素
 */
function createOption(value, text, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    if (selected) option.selected = true;
    return option;
}

/**
 * 创建一个带i18n的选项元素
 * @param {string} value - 选项值
 * @param {string} i18nKey - i18n翻译键
 * @param {boolean} selected - 是否选中
 * @returns {HTMLElement} - 创建的option元素
 */
function createI18nOption(value, i18nKey, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.setAttribute('data-i18n', i18nKey);
    option.textContent = i18n.t(i18nKey);
    if (selected) option.selected = true;
    return option;
}

/**
 * 创建一个按钮元素
 * @param {string} text - 按钮文本
 * @param {string} className - CSS类名
 * @param {Function} onclick - 点击事件处理函数
 * @returns {HTMLElement} - 创建的button元素
 */
function createButton(text, className, onclick) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = text;
    if (onclick) button.onclick = onclick;
    return button;
}

/**
 * 创建一个带i18n的按钮元素
 * @param {string} i18nKey - i18n翻译键
 * @param {string} className - CSS类名
 * @param {Function} onclick - 点击事件处理函数
 * @returns {HTMLElement} - 创建的button元素
 */
function createI18nButton(i18nKey, className, onclick) {
    const button = document.createElement('button');
    button.className = className;
    button.setAttribute('data-i18n', i18nKey);
    button.textContent = i18n.t(i18nKey);
    if (onclick) button.onclick = onclick;
    return button;
}

/**
 * 创建一个div元素
 * @param {string} className - CSS类名
 * @param {string|HTMLElement|Array} content - 内容（文本、元素或元素数组）
 * @returns {HTMLElement} - 创建的div元素
 */
function createDiv(className, content) {
    const div = document.createElement('div');
    if (className) div.className = className;

    if (typeof content === 'string') {
        div.textContent = content;
    } else if (content instanceof HTMLElement) {
        div.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(child => {
            if (child instanceof HTMLElement) {
                div.appendChild(child);
            }
        });
    }

    return div;
}

/**
 * 创建一个span元素
 * @param {string} className - CSS类名
 * @param {string} text - 文本内容
 * @returns {HTMLElement} - 创建的span元素
 */
function createSpan(className, text) {
    const span = document.createElement('span');
    if (className) span.className = className;
    if (text) span.textContent = text;
    return span;
}

/**
 * 创建一个带i18n的span元素
 * @param {string} className - CSS类名
 * @param {string} i18nKey - i18n翻译键
 * @returns {HTMLElement} - 创建的span元素
 */
function createI18nSpan(className, i18nKey) {
    const span = document.createElement('span');
    if (className) span.className = className;
    span.setAttribute('data-i18n', i18nKey);
    span.textContent = i18n.t(i18nKey);
    return span;
}

/**
 * 创建一个链接元素
 * @param {string} href - 链接地址
 * @param {string} text - 链接文本
 * @param {string} className - CSS类名
 * @returns {HTMLElement} - 创建的a元素
 */
function createLink(href, text, className) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (className) a.className = className;
    return a;
}

/**
 * 创建一个空状态提示元素
 * @param {string} i18nKey - i18n翻译键
 * @returns {HTMLElement} - 创建的div元素
 */
function createEmptyState(i18nKey) {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.setAttribute('data-i18n', i18nKey);
    div.textContent = i18n.t(i18nKey);
    return div;
}

/**
 * 清空容器并添加新内容
 * @param {HTMLElement|string} container - 容器元素或ID
 * @param {HTMLElement|Array} content - 新内容（元素或元素数组）
 */
function setContainerContent(container, content) {
    const el = typeof container === 'string'
        ? document.getElementById(container)
        : container;

    if (!el) return;

    // 清空
    el.innerHTML = '';

    // 添加新内容
    if (content instanceof HTMLElement) {
        el.appendChild(content);
    } else if (Array.isArray(content)) {
        content.forEach(child => {
            if (child instanceof HTMLElement) {
                el.appendChild(child);
            }
        });
    }

    // 更新i18n
    if (typeof i18n !== 'undefined' && i18n.updateAllText) {
        i18n.updateAllText();
    }
}

/**
 * 创建复选框元素
 * @param {string} value - 复选框值
 * @param {boolean} checked - 是否选中
 * @param {Function} onchange - 变化事件处理函数
 * @returns {HTMLElement} - 创建的input元素
 */
function createCheckbox(value, checked, onchange) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = value;
    if (checked) input.checked = true;
    if (onchange) input.onchange = onchange;
    return input;
}

/**
 * 创建文本输入框元素
 * @param {string} placeholder - 占位符文本
 * @param {string} value - 初始值
 * @param {string} className - CSS类名
 * @returns {HTMLElement} - 创建的input元素
 */
function createTextInput(placeholder, value, className) {
    const input = document.createElement('input');
    input.type = 'text';
    if (placeholder) input.placeholder = placeholder;
    if (value) input.value = value;
    if (className) input.className = className;
    return input;
}

/**
 * 创建下拉选择框并填充选项
 * @param {string} className - CSS类名
 * @param {Array} options - 选项数组，每个元素可以是字符串或对象{value, text, i18n}
 * @returns {HTMLElement} - 创建的select元素
 */
function createSelect(className, options) {
    const select = document.createElement('select');
    if (className) select.className = className;

    options.forEach(opt => {
        if (typeof opt === 'string') {
            select.appendChild(createOption(opt, opt));
        } else if (typeof opt === 'object') {
            if (opt.i18n) {
                select.appendChild(createI18nOption(opt.value, opt.i18n, opt.selected));
            } else {
                select.appendChild(createOption(opt.value, opt.text, opt.selected));
            }
        }
    });

    return select;
}

// 导出函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createDetailRow,
        createTableRow,
        createOption,
        createI18nOption,
        createButton,
        createI18nButton,
        createDiv,
        createSpan,
        createI18nSpan,
        createLink,
        createEmptyState,
        setContainerContent,
        createCheckbox,
        createTextInput,
        createSelect
    };
}