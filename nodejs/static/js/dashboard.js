let dashboardConferenceId = null;

function goToCreateConference() {
    showPage('main');
    showView('conference-list');
    if (typeof loadConferenceList === 'function') loadConferenceList();
    setTimeout(() => {
        if (typeof showCreateModal === 'function') showCreateModal();
    }, 150);
}

async function loadDashboard() {
    let conference = getCurrentConference();

    if (!conference || !conference.id) {
        try {
            const conferences = await get('/conferences');
            if (conferences && conferences.length > 0) {
                conference = conferences[0];
                localStorage.setItem('currentConference', JSON.stringify(conference));
                if (typeof initCurrentConference === 'function') {
                    initCurrentConference();
                }
            } else {
                document.getElementById('currentSection').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                document.getElementById('alertBanner').classList.remove('show');
                document.querySelector('#emptyState .empty-state').innerHTML = `
                    <div class="empty-icon">📊</div>
                    <div data-i18n="conference.noConference">${i18n.t('conference.noConference')}</div>
                    <a href="javascript:void(0);" onclick="goToCreateConference()" class="select-btn" style="text-decoration:none;display:inline-block;margin-top:12px;" data-i18n="conference.create">${i18n.t('conference.create')}</a>
                `;
                return;
            }
        } catch (e) {
            console.error(i18n.t('dashboard.loadConferencesFailed'), e);
            document.getElementById('currentSection').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('alertBanner').classList.remove('show');
            document.querySelector('#emptyState .empty-state').innerHTML = `
                <div class="empty-icon">📊</div>
                <div data-i18n="common.error">${i18n.t('common.error')}</div>
                <a href="javascript:void(0);" onclick="loadDashboard()" class="select-btn" style="text-decoration:none;display:inline-block;margin-top:12px;" data-i18n="common.retry">${i18n.t('common.retry')}</a>
            `;
            return;
        }
    }

    dashboardConferenceId = conference.id;

    try {
        const data = await get(`/stats/conference/${conference.id}/overview`);
        renderConferenceStats(data);
    } catch (e) {
        console.error(i18n.t('dashboard.loadStatsFailed'), e);
    }
}

function getCurrentConference() {
    const saved = localStorage.getItem('currentConference');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function renderConferenceStats(data) {
    document.getElementById('currentSection').style.display = 'block';
    document.getElementById('emptyState').style.display = 'none';

    document.getElementById('confTitle').textContent = data.conference?.title || '-';
    document.getElementById('confDate').textContent =
        data.conference?.start_date && data.conference?.end_date
            ? `${data.conference.start_date} ~ ${data.conference.end_date}`
            : '-';
    document.getElementById('confParticipants').textContent = (data.total_participants || 0) + i18n.t('dashboard.people');

    renderStatCard('seating', data.seating, data.total_participants);
    renderStatCard('hotel', data.hotel, data.hotel?.need_count);
    renderStatCard('restaurant', data.restaurant, data.restaurant?.need_count);
    renderStatCard('transport', data.transport, data.transport?.need_count);

    updateAlertBanner(data);
}

function renderStatCard(type, stats, total) {
    if (!stats) return;

    const rate = stats.rate || 0;
    const isComplete = rate >= 100;
    const hasWarning = stats.unassigned > 0;
    const isNoNeed = type === 'seating'
        ? (stats.total || 0) === 0
        : (stats.need_count || 0) === 0;

    const rateEl = document.getElementById(`${type}Rate`);
    const progressEl = document.getElementById(`${type}Progress`);
    const badgeEl = document.getElementById(`${type}Badge`);
    const cardEl = document.getElementById(`${type}Card`);

    if (rateEl) {
        if (isNoNeed) {
            rateEl.textContent = '0.0';
        } else {
            rateEl.textContent = rate.toFixed(1);
        }
    }
    if (progressEl) {
        if (isNoNeed) {
            progressEl.style.width = '0%';
            progressEl.style.background = '#e0e0e0';
        } else {
            progressEl.style.width = rate + '%';
            progressEl.style.background = '';
        }
    }

    if (badgeEl) {
        if (isNoNeed) {
            badgeEl.className = 'stat-badge';
            badgeEl.textContent = i18n.t('dashboard.statusNoNeed');
        } else {
            badgeEl.className = 'stat-badge ' + (isComplete ? 'success' : 'warning');
            badgeEl.textContent = isComplete ? i18n.t('dashboard.statusComplete') : i18n.t('dashboard.statusInProgress');
        }
    }

    if (cardEl) {
        if (isNoNeed) {
            cardEl.className = 'stat-card';
        } else {
            cardEl.className = 'stat-card ' + (isComplete ? 'success' : (hasWarning ? 'warning' : ''));
        }
    }

    const assignedEl = document.getElementById(`${type}Assigned`);
    const needEl = document.getElementById(`${type}Need`);
    const totalEl = document.getElementById(`${type}Total`);
    const unassignedEl = document.getElementById(`${type}Unassigned`);

    if (type === 'seating') {
        if (assignedEl) assignedEl.textContent = stats.assigned || 0;
        if (totalEl) totalEl.textContent = stats.total || 0;
        if (unassignedEl) {
            unassignedEl.innerHTML =
                (stats.total || 0) === 0
                    ? i18n.t('dashboard.statusNoNeed')
                    : ((stats.unassigned || 0) > 0
                        ? `<span class="highlight">⚠️ ${i18n.t('dashboard.statusUnassigned')}: ${stats.unassigned}${i18n.t('dashboard.people')}</span>`
                        : '✅ ' + i18n.t('dashboard.statusAllAssigned'));
        }
    } else {
        if (assignedEl) assignedEl.textContent = stats.assigned || 0;
        if (needEl) needEl.textContent = stats.need_count || 0;
        if (unassignedEl) {
            unassignedEl.innerHTML =
                (stats.need_count || 0) === 0
                    ? i18n.t('dashboard.statusNoNeed')
                    : ((stats.unassigned || 0) > 0
                        ? `<span class="highlight">⚠️ ${i18n.t('dashboard.statusUnassigned')}: ${stats.unassigned}${i18n.t('dashboard.people')}</span>`
                        : '✅ ' + i18n.t('dashboard.statusAllAssigned'));
        }
    }
}

function updateAlertBanner(data) {
    const alerts = [];

    if (data.seating?.unassigned > 0) {
        alerts.push(`${i18n.t('nav.seating')} ${data.seating.unassigned}${i18n.t('dashboard.people')} ${i18n.t('dashboard.statusUnassigned')}`);
    }
    if (data.hotel?.need_count > 0 && data.hotel?.unassigned > 0) {
        alerts.push(`${i18n.t('nav.hotel')} ${data.hotel.unassigned}${i18n.t('dashboard.people')} ${i18n.t('dashboard.statusUnassigned')}`);
    }
    if (data.restaurant?.need_count > 0 && data.restaurant?.unassigned > 0) {
        alerts.push(`${i18n.t('nav.restaurant')} ${data.restaurant.unassigned}${i18n.t('dashboard.people')} ${i18n.t('dashboard.statusUnassigned')}`);
    }
    if (data.transport?.need_count > 0 && data.transport?.unassigned > 0) {
        alerts.push(`${i18n.t('nav.transport')} ${data.transport.unassigned}${i18n.t('dashboard.people')} ${i18n.t('dashboard.statusUnassigned')}`);
    }

    const alertBanner = document.getElementById('alertBanner');
    const alertText = document.getElementById('alertText');

    if (alerts.length > 0 && alertBanner && alertText) {
        alertText.textContent = '⚠️ ' + i18n.t('dashboard.statusPending') + ': ' + alerts.join(', ');
        alertBanner.classList.add('show');
    } else if (alertBanner) {
        alertBanner.classList.remove('show');
    }
}

function goToSeating() {
    const conference = getCurrentConference();
    if (conference && conference.id) {
        location.hash = `#conference/${conference.id}/seating`;
    }
}

function goToHotel() {
    const conference = getCurrentConference();
    if (conference && conference.id) {
        location.hash = `#conference/${conference.id}/hotel`;
    }
}

function goToRestaurant() {
    const conference = getCurrentConference();
    if (conference && conference.id) {
        location.hash = `#conference/${conference.id}/restaurant`;
    }
}

function goToTransport() {
    location.hash = '#transport';
}

window.loadDashboard = loadDashboard;
window.goToSeating = goToSeating;
window.goToHotel = goToHotel;
window.goToRestaurant = goToRestaurant;
window.goToTransport = goToTransport;

// 注册语言切换监听器
if (typeof i18n !== 'undefined' && typeof i18n.onLanguageChange === 'function') {
    i18n.onLanguageChange(() => {
        // 只在登录后页面才触发loadDashboard
        const loginPage = document.getElementById('page-login');
        if (!loginPage || loginPage.style.display !== 'none') {
            return; // 如果是登录页，不触发loadDashboard
        }
        loadDashboard();
    });
}
