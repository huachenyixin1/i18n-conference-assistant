let currentConference = null;
let currentView = null;

document.addEventListener('DOMContentLoaded', function () {
    initRouter();
    handleRoute(location.hash || '#login');
});

function initRouter() {
    window.addEventListener('hashchange', function () {
        handleRoute(location.hash);
    });
}

function handleRoute(hash) {
    if (!hash) hash = '#login';

    const parts = hash.substring(1).split('/');
    const page = parts[0] || 'login';

    if (page !== 'login' && page !== 'register' && page !== 'forgot-password' && !isLoggedIn()) {
        location.hash = '#login';
        return;
    }

    switch (page) {
        case 'login':
            showPage('login');
            // 显示登录错误消息（如果有）
            if (typeof showLoginError === 'function') showLoginError();
            break;
        case 'register':
            showPage('register');
            break;
        case 'forgot-password':
            showPage('forgot-password');
            break;
        case 'dashboard':
            showPage('main');
            showView('dashboard');
            if (typeof loadDashboard === 'function') loadDashboard();
            break;
        case 'conference':
            showPage('main');
            if (parts[1] === 'create') {
                showView('conference-create');
                if (typeof initConferenceCreate === 'function') initConferenceCreate();
            } else if (parts[1]) {
                const conferenceId = parts[1];
                const tab = parts[2] || 'participants';
                showView('conference-manage');
                if (typeof loadConferenceManage === 'function') loadConferenceManage(conferenceId, tab);
                updateConferenceManageTab(tab);
            } else {
                showView('conference-list');
                if (typeof loadConferenceList === 'function') loadConferenceList();
            }
            break;
        case 'conference-list':
            showPage('main');
            showView('conference-list');
            if (typeof loadConferenceList === 'function') loadConferenceList();
            break;
        case 'participants':
            showPage('main');
            if (currentConference && currentConference.id) {
                showView('conference-manage');
                if (typeof loadConferenceManage === 'function') loadConferenceManage(currentConference.id, 'participants');
                updateConferenceManageTab('participants');
            } else {
                showView('conference-list');
                openConferenceModal();
            }
            break;
        case 'seating':
            showPage('main');
            if (currentConference && currentConference.id) {
                showView('conference-manage');
                if (typeof loadConferenceManage === 'function') loadConferenceManage(currentConference.id, 'seating');
                updateConferenceManageTab('seating');
            } else {
                showView('conference-list');
                openConferenceModal();
            }
            break;
        case 'hotel':
            showPage('main');
            if (currentConference && currentConference.id) {
                showView('conference-manage');
                if (typeof loadConferenceManage === 'function') loadConferenceManage(currentConference.id, 'hotel');
                updateConferenceManageTab('hotel');
            } else {
                showView('conference-list');
                openConferenceModal();
            }
            break;
        case 'restaurant':
            showPage('main');
            if (currentConference && currentConference.id) {
                showView('conference-manage');
                if (typeof loadConferenceManage === 'function') loadConferenceManage(currentConference.id, 'restaurant');
                updateConferenceManageTab('restaurant');
            } else {
                showView('conference-list');
                openConferenceModal();
            }
            break;
        case 'transport':
            showPage('main');
            if (currentConference && currentConference.id) {
                showView('transport');
                if (typeof loadTransport === 'function') loadTransport(currentConference.id);
            } else {
                showView('conference-list');
                openConferenceModal();
            }
            break;
        case 'profile':
            showPage('main');
            showView('profile');
            if (typeof loadProfile === 'function') loadProfile();
            break;
        case 'admin':
            showPage('main');
            showView('admin');
            if (typeof loadAdmin === 'function') loadAdmin();
            break;
        default:
            location.hash = '#login';
    }

    currentView = page;
    updateMenuActive(page);
}

function updateMenuActive(page) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    let menuPage = page;
    if (page === 'participants' || page === 'seating' || page === 'hotel' || page === 'restaurant') {
        menuPage = 'seating';
    }

    const menuItem = document.querySelector(`.menu-item[data-page="${menuPage}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }
}

function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const page = document.getElementById('page-' + name);
    if (page) {
        if (name === 'login' || name === 'register' || name === 'forgot-password') {
            page.style.display = 'flex';
        } else {
            page.style.display = 'block';
        }
    }

    if (name === 'main') {
        initCurrentConference();
        loadUserInfo();
    }
}

function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const view = document.getElementById('view-' + name);
    if (view) {
        view.style.display = 'block';
    }
}

function navigateTo(hash) {
    location.hash = hash;
    // 页面切换后更新翻译
    setTimeout(() => {
        if (window.i18n && window.i18n.updateAllText) {
            window.i18n.updateAllText();
        }
    }, 100);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('expanded');
}

function updateConferenceManageTab(tab) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const tabItem = document.querySelector(`.tab-item[data-tab="${tab}"]`);
    const tabContent = document.getElementById('tab-' + tab);

    if (tabItem) tabItem.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

function switchConferenceTab(tab) {
    if (currentConference && currentConference.id) {
        updateConferenceManageTab(tab);

        switch (tab) {
            case 'participants':
                if (typeof loadParticipants === 'function') loadParticipants(currentConference.id);
                break;
            case 'seating':
                if (typeof loadSeating === 'function') loadSeating(currentConference.id);
                break;
            case 'hotel':
                if (typeof loadHotel === 'function') loadHotel(currentConference.id);
                break;
            case 'restaurant':
                if (typeof loadRestaurant === 'function') loadRestaurant(currentConference.id);
                break;
        }

        location.hash = `#${tab}`;
    }
}

function openConferenceModal() {
    const modal = document.getElementById('conference-select-modal');
    if (modal) {
        modal.classList.add('active');
        loadConferenceOptions();
    }
}

function closeConferenceModal() {
    const modal = document.getElementById('conference-select-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function selectConference(id, title, code) {
    currentConference = { id, title, code };
    localStorage.setItem('currentConference', JSON.stringify(currentConference));

    document.getElementById('conferenceName').textContent = title;
    document.getElementById('conferenceCode').textContent = code;

    const conferenceInfo = document.querySelector('.conference-info');
    if (conferenceInfo) {
        conferenceInfo.classList.remove('hidden');
    }

    closeConferenceModal();

    const hash = location.hash;

    if (hash === '#dashboard' || hash === '' || hash === '#') {
        if (typeof loadDashboard === 'function') loadDashboard();
    } else if (hash === '#seating') {
        if (typeof loadSeating === 'function') loadSeating(currentConference.id);
    } else if (hash === '#hotel') {
        if (typeof loadHotel === 'function') loadHotel(currentConference.id);
    } else if (hash === '#restaurant') {
        if (typeof loadRestaurant === 'function') loadRestaurant(currentConference.id);
    } else if (hash === '#participants') {
        if (typeof loadParticipants === 'function') loadParticipants(currentConference.id);
    } else if (hash === '#transport') {
        if (typeof loadTransport === 'function') loadTransport(currentConference.id);
    } else {
        location.hash = '#participants';
    }
}

function clearCurrentConference() {
    currentConference = null;
    localStorage.removeItem('currentConference');

    document.getElementById('conferenceName').textContent = i18n.t('common.noConferenceSelected');
    document.getElementById('conferenceCode').textContent = '';

    const conferenceInfo = document.querySelector('.conference-info');
    if (conferenceInfo) {
        conferenceInfo.classList.add('hidden');
    }
}

async function initCurrentConference() {
    const saved = localStorage.getItem('currentConference');
    if (saved) {
        try {
            currentConference = JSON.parse(saved);

            document.getElementById('conferenceName').textContent = currentConference.title || i18n.t('common.noConferenceSelected');
            document.getElementById('conferenceCode').textContent = currentConference.code || '';

            const conferenceInfo = document.querySelector('.conference-info');
            if (conferenceInfo) {
                conferenceInfo.classList.remove('hidden');
            }
        } catch (e) {
            clearCurrentConference();
        }
    }
}

async function loadConferenceOptions() {
    const listContainer = document.getElementById('conference-options-list');
    if (!listContainer) return;

    listContainer.innerHTML = `<div class="loading">${i18n.t('common.loading')}</div>`;

    try {
        const data = await get('/conferences');
        if (data && data.length > 0) {
            // 使用escapeHtml防止XSS攻击
            listContainer.innerHTML = data.map(c => `
                <div class="conference-option" onclick="selectConference('${escapeHtml(c.id)}', '${escapeHtml(c.title)}', '${escapeHtml(c.code || '')}')">
                    <div class="option-title">${escapeHtml(c.title)}</div>
                    <div class="option-code">${escapeHtml(c.code || '')}</div>
                </div>
            `).join('');
        } else {
            listContainer.innerHTML = `<div class="empty-tip">${i18n.t('conference.noConference')}</div>`;
        }
    } catch (e) {
        listContainer.innerHTML = `<div class="error-tip">${i18n.t('common.loadFailed')}</div>`;
    }
}

async function loadUserInfo() {
    try {
        const user = await get('/auth/me');
        if (user) {
            document.getElementById('userName').textContent = user.username;
            document.getElementById('userAvatar').textContent = user.username[0].toUpperCase();
        }
    } catch (e) {
        console.error(i18n.t('user.loadUserFailed'), e);
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

function openPasswordModal() {
    const userMenu = document.getElementById('userMenu');
    const passwordModal = document.getElementById('passwordModal');
    if (userMenu) userMenu.classList.remove('show');
    if (passwordModal) passwordModal.classList.add('active');
}

function closePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) passwordModal.classList.remove('active');
}

async function submitPassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        showToast(i18n.t('user.fillAllFields'));
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast(i18n.t('user.passwordMismatch'));
        return;
    }

    if (newPassword.length < 6) {
        showToast(i18n.t('user.passwordLengthError'));
        return;
    }

    try {
        const data = await post('/auth/change-password', {
            old_password: oldPassword,
            new_password: newPassword
        });

        if (data.success) {
            showToast(i18n.t('user.passwordChangeSuccess'));
            logout();
        } else {
            showToast(data.detail || i18n.t('user.passwordChangeFailed'));
        }
    } catch (e) {
        showToast(i18n.t('user.passwordChangeFailed'));
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        if (!modal || !msgEl || !okBtn || !cancelBtn) {
            resolve(confirm(message));
            return;
        }

        msgEl.textContent = message;
        modal.classList.add('active');

        const handleOk = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

document.addEventListener('click', function (e) {
    const menu = document.getElementById('userMenu');
    const userInfo = document.querySelector('.user-info');
    if (menu && userInfo && !userInfo.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
    }
});

function goToSeating() {
    location.hash = '#seating';
}

function goToHotel() {
    location.hash = '#hotel';
}

function goToRestaurant() {
    location.hash = '#restaurant';
}

function goToTransport() {
    location.hash = '#transport';
}

window.navigateTo = navigateTo;
window.toggleSidebar = toggleSidebar;
window.switchConferenceTab = switchConferenceTab;
window.openConferenceModal = openConferenceModal;
window.closeConferenceModal = closeConferenceModal;
window.selectConference = selectConference;
window.clearCurrentConference = clearCurrentConference;
window.toggleUserMenu = toggleUserMenu;
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.submitPassword = submitPassword;
window.showToast = showToast;
window.showConfirm = showConfirm;
window.goToSeating = goToSeating;
window.goToHotel = goToHotel;
window.goToRestaurant = goToRestaurant;
window.goToTransport = goToTransport;

// 自定义语言切换下拉框功能
function toggleLangMenu(type) {
    const menuId = type === 'login' ? 'langSelectMenuLogin' : 'langSelectMenuHeader';
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.toggle('show');
    }
}

function switchLang(lang, type) {
    // 切换语言
    if (window.i18n && window.i18n.setLanguage) {
        window.i18n.setLanguage(lang);
    }

    // 更新按钮文本
    updateLangBtnText();

    // 更新菜单项的active状态
    const menuId = type === 'login' ? 'langSelectMenuLogin' : 'langSelectMenuHeader';
    const menu = document.getElementById(menuId);
    if (menu) {
        menu.querySelectorAll('li').forEach(li => {
            if (li.dataset.lang === lang) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
        // 关闭菜单
        menu.classList.remove('show');
    }
}

function updateLangBtnText() {
    const currentLang = window.i18n ? window.i18n.getLanguage() : 'en-US';
    const btnTextLogin = document.getElementById('langSelectBtnText');
    const btnTextHeader = document.getElementById('langSelectHeaderBtnText');

    const langLabels = {
        'zh-CN': '中文',
        'en-US': 'English',
        'ja-JP': '日本語',
        'ms-MY': 'Melayu',
        'vi-VN': 'Tiếng Việt',
        'km-KH': 'ភាសាខ្មែរ',
        'mn-MN': 'Монгол',
        'bo-CN': 'བོད་',
        'th-TH': 'ภาษาไทย',
        'ko-KR': '한국어',
        'id-ID': 'Bahasa Indonesia',
        'hi-IN': 'हिन्दी',
        'fr-FR': 'Français',
        'pt-BR': 'Português',
        'ru-RU': 'Русский'
    };

    if (btnTextLogin) {
        btnTextLogin.textContent = langLabels[currentLang] || 'English';
    }
    if (btnTextHeader) {
        btnTextHeader.textContent = langLabels[currentLang] || 'English';
    }

    // 更新菜单项的active状态
    const menuLogin = document.getElementById('langSelectMenuLogin');
    const menuHeader = document.getElementById('langSelectMenuHeader');

    if (menuLogin) {
        menuLogin.querySelectorAll('li').forEach(li => {
            if (li.dataset.lang === currentLang) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
    }

    if (menuHeader) {
        menuHeader.querySelectorAll('li').forEach(li => {
            if (li.dataset.lang === currentLang) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
    }
}

// 点击其他地方关闭菜单
document.addEventListener('click', function (e) {
    const wrapperLogin = document.querySelector('.lang-select-wrapper');
    const wrapperHeader = document.querySelector('.lang-select-header-wrapper');
    const menuLogin = document.getElementById('langSelectMenuLogin');
    const menuHeader = document.getElementById('langSelectMenuHeader');

    if (wrapperLogin && menuLogin && !wrapperLogin.contains(e.target)) {
        menuLogin.classList.remove('show');
    }

    if (wrapperHeader && menuHeader && !wrapperHeader.contains(e.target)) {
        menuHeader.classList.remove('show');
    }
});

window.toggleLangMenu = toggleLangMenu;
window.switchLang = switchLang;
window.updateLangBtnText = updateLangBtnText;
