const API_BASE = window.APP_CONFIG?.API_BASE || '/api';

async function request(url, options = {}) {
    const lang = window.i18n ? window.i18n.getLanguage() : 'zh-CN';

    const defaultOptions = {
        credentials: 'include',  // 自动发送Cookie（HttpOnly Cookie）
        headers: {
            'Accept-Language': lang  // 告诉后端当前语言
        }
    };

    // 不再需要从localStorage读取Token
    // Token已自动存储在HttpOnly Cookie中

    if (!(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${url}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        // 处理错误响应
        if (!response.ok) {
            let errorMsg = i18n.t('error.OPERATION_FAILED');

            // 如果后端返回了错误码，就翻译
            if (data.code) {
                errorMsg = i18n.t(`error.${data.code}`);
            } else if (data.detail) {
                // 后端还没改，暂时用detail
                errorMsg = data.detail;
            }

            // 特殊处理401错误
            if (response.status === 401 && url !== '/auth/login') {
                // 存储错误消息到 localStorage，登录页面会显示
                localStorage.setItem('loginError', 'SESSION_EXPIRED');
                location.hash = '#login';
                throw new Error(i18n.t('error.SESSION_EXPIRED'));
            }

            throw new Error(errorMsg);
        }

        return data;
    }

    // 处理非JSON响应
    if (response.status === 401 && url !== '/auth/login') {
        // 存储错误消息到 localStorage，登录页面会显示
        localStorage.setItem('loginError', 'SESSION_EXPIRED');
        location.hash = '#login';
        throw new Error(i18n.t('error.SESSION_EXPIRED'));
    }

    const text = await response.text();
    throw new Error(text || i18n.t('error.NETWORK_ERROR'));
}

async function get(url) {
    const result = await request(url);
    if (result instanceof Error) throw result;
    return result;
}

async function post(url, data) {
    const result = await request(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    if (result instanceof Error) throw result;
    return result;
}

async function postForm(url, formData) {
    const result = await request(url, {
        method: 'POST',
        body: formData
    });
    if (result instanceof Error) throw result;
    return result;
}

async function put(url, data) {
    return await request(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

async function del(url, data) {
    const options = {
        method: 'DELETE',
        credentials: 'include'  // 自动发送Cookie
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    return await request(url, options);
}
