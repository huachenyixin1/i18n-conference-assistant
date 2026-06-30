async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    if (!username || !password) {
        errorMessage.textContent = i18n.t('auth.login.inputRequired');
        errorMessage.setAttribute('data-i18n', 'auth.login.inputRequired');
        errorMessage.style.display = 'block';
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = i18n.t('auth.login.loggingIn');
    errorMessage.style.display = 'none';
    errorMessage.removeAttribute('data-i18n');

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await postForm('/auth/login', formData);

        if (response.user) {
            // Token已自动存储在HttpOnly Cookie中（安全改进）
            // 存储用户信息到 localStorage（用于语言过滤）
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.removeItem('currentConference');
            location.hash = '#dashboard';
        } else {
            // 从 response.code 获取错误码
            const errorCode = response.code || 'INVALID_CREDENTIALS';
            errorMessage.textContent = i18n.t('error.' + errorCode);
            errorMessage.setAttribute('data-i18n', 'error.' + errorCode);
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = error.message || i18n.t('error.NETWORK_ERROR');
        errorMessage.setAttribute('data-i18n', 'error.NETWORK_ERROR');
        errorMessage.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = i18n.t('auth.login.button');
    }
}

async function handleRegister() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirmPassword').value;
    const invitationCode = document.getElementById('reg-invitationCode').value;
    const registerBtn = document.getElementById('registerBtn');
    const errorMessage = document.getElementById('reg-errorMessage');
    const successMessage = document.getElementById('reg-successMessage');

    if (password !== confirmPassword) {
        errorMessage.textContent = i18n.t('auth.register.passwordMismatch');
        errorMessage.setAttribute('data-i18n', 'auth.register.passwordMismatch');
        errorMessage.style.display = 'block';
        return;
    }

    if (!invitationCode) {
        errorMessage.textContent = i18n.t('error.INVALID_INVITATION_CODE');
        errorMessage.setAttribute('data-i18n', 'error.INVALID_INVITATION_CODE');
        errorMessage.style.display = 'block';
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = i18n.t('auth.register.registering');
    errorMessage.style.display = 'none';
    errorMessage.removeAttribute('data-i18n');
    successMessage.style.display = 'none';

    try {
        const response = await post('/auth/register', {
            username: username,
            email: email,
            password: password,
            invitation_code: invitationCode
        });

        if (response.id) {
            successMessage.textContent = i18n.t('auth.register.successMessage');
            successMessage.setAttribute('data-i18n', 'auth.register.successMessage');
            successMessage.style.display = 'block';
            setTimeout(() => {
                location.hash = '#login';
            }, 1500);
        } else {
            // 从 response.code 获取错误码
            const errorCode = response.code || 'OPERATION_FAILED';
            errorMessage.textContent = i18n.t('error.' + errorCode);
            errorMessage.setAttribute('data-i18n', 'error.' + errorCode);
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = error.message || i18n.t('error.NETWORK_ERROR');
        errorMessage.setAttribute('data-i18n', 'error.NETWORK_ERROR');
        errorMessage.style.display = 'block';
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = i18n.t('auth.register.button');
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('forgot-email').value;
    const forgotBtn = document.getElementById('forgotBtn');
    const forgotMessage = document.getElementById('forgotMessage');

    if (!email) {
        forgotMessage.textContent = i18n.t('auth.forgotPassword.enterEmail');
        forgotMessage.setAttribute('data-i18n', 'auth.forgotPassword.enterEmail');
        forgotMessage.className = 'message error';
        forgotMessage.style.display = 'block';
        return;
    }

    forgotBtn.disabled = true;
    forgotBtn.textContent = i18n.t('auth.forgotPassword.processing');
    forgotMessage.style.display = 'none';
    forgotMessage.removeAttribute('data-i18n');

    try {
        const response = await post('/auth/forgot-password', { email: email });

        forgotMessage.textContent = response.message || i18n.t('auth.forgotPassword.emailSent');
        forgotMessage.setAttribute('data-i18n', 'auth.forgotPassword.emailSent');
        forgotMessage.className = 'message success';
        forgotMessage.style.display = 'block';

        document.getElementById('forgot-email').value = '';

        setTimeout(() => {
            location.hash = '#login';
        }, 3000);
    } catch (error) {
        // 从 error.code 获取错误码
        const errorCode = error.code || 'NETWORK_ERROR';
        forgotMessage.textContent = i18n.t('error.' + errorCode);
        forgotMessage.setAttribute('data-i18n', 'error.' + errorCode);
        forgotMessage.className = 'message error';
        forgotMessage.style.display = 'block';
    } finally {
        forgotBtn.disabled = false;
        forgotBtn.textContent = i18n.t('auth.forgotPassword.button');
    }
}

async function logout() {
    try {
        // 调用后端logout接口清除HttpOnly Cookie
        await post('/auth/logout', {});
    } catch (error) {
        console.error('Logout error:', error);
    }
    location.hash = '#login';
}

async function isLoggedIn() {
    try {
        // 通过API检查登录状态（Token在Cookie中自动发送）
        const response = await get('/auth/me');
        return !!response.id;
    } catch (error) {
        return false;
    }
}

window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleForgotPassword = handleForgotPassword;
window.logout = logout;
window.isLoggedIn = isLoggedIn;

function checkAuth() {
    if (!isLoggedIn()) {
        location.hash = '#login';
        return false;
    }
    return true;
}

// 显示登录页面的错误消息（从 localStorage 中读取）
function showLoginError() {
    const loginError = localStorage.getItem('loginError');
    if (loginError) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = i18n.t('error.' + loginError);
            errorMessage.setAttribute('data-i18n', 'error.' + loginError);
            errorMessage.style.display = 'block';
        }
        localStorage.removeItem('loginError');
    }
}

// 立即体验功能 - 自动登录演示账户
async function quickDemoLogin() {
    const quickDemoBtn = document.getElementById('quickDemoBtn');
    const errorMessage = document.getElementById('errorMessage');

    quickDemoBtn.disabled = true;
    quickDemoBtn.textContent = i18n.t('auth.login.loggingIn');
    errorMessage.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('username', 'test');
        formData.append('password', '1');

        const response = await postForm('/auth/login', formData);

        if (response.user) {
            // Token已自动存储在HttpOnly Cookie中
            // 存储用户信息到 localStorage（用于语言过滤）
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.removeItem('currentConference');
            location.hash = '#dashboard';
        } else {
            const errorCode = response.code || 'INVALID_CREDENTIALS';
            errorMessage.textContent = i18n.t('error.' + errorCode);
            errorMessage.setAttribute('data-i18n', 'error.' + errorCode);
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        errorMessage.textContent = error.message || i18n.t('error.NETWORK_ERROR');
        errorMessage.setAttribute('data-i18n', 'error.NETWORK_ERROR');
        errorMessage.style.display = 'block';
    } finally {
        quickDemoBtn.disabled = false;
        quickDemoBtn.textContent = i18n.t('auth.login.quickDemo');
    }
}

window.showLoginError = showLoginError;
window.quickDemoLogin = quickDemoLogin;
