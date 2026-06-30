let conferences = [];

async function loadConferenceList() {
    try {
        conferences = await get('/conferences');
        renderConferences();
    } catch (e) {
        console.error(i18n.t('conference.loadFailed'), e);
        document.getElementById('conferenceList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <div class="empty-text" data-i18n="conference.loadFailed">加载失败，请刷新重试</div>
            </div>
        `;
    }
}

function getStatus(conference) {
    const today = new Date().toISOString().split('T')[0];
    const start = conference.start_date;
    const end = conference.end_date;

    if (end && end < today) {
        return { text: i18n.t('conference.statusEnded'), class: 'status-ended' };
    } else if (start && start > today) {
        return { text: i18n.t('conference.statusUpcoming'), class: 'status-upcoming' };
    } else {
        return { text: i18n.t('conference.statusActive'), class: 'status-active' };
    }
}

function renderConferences() {
    const container = document.getElementById('conferenceList');

    if (!conferences || conferences.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-text" data-i18n="conference.noConference">暂无会议</div>
                <div class="empty-hint" data-i18n="conference.createHint">点击右下角的 + 按钮创建新会议</div>
            </div>
        `;
        return;
    }

    container.innerHTML = conferences.map(c => {
        const status = getStatus(c);
        return `
            <div class="conference-card">
                <div class="card-header-row">
                    <div>
                        <div class="card-title">${c.title}</div>
                        <div class="card-code">${i18n.t('conference.code')}: ${c.code || '-'}</div>
                    </div>
                    <span class="card-status ${status.class}">${status.text}</span>
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-icon">👥</span>
                        <span class="info-label">${i18n.t('conference.scaleLabel')}</span>
                        <span class="info-value">${c.scale || 0} ${i18n.t('dashboard.people')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-icon">📅</span>
                        <span class="info-label">${i18n.t('conference.dateLabel')}</span>
                        <span class="info-value">${c.start_date || '-'} ${i18n.t('conference.dateTo')} ${c.end_date || '-'}</span>
                    </div>
                    ${c.location ? `
                        <div class="info-row">
                            <span class="info-icon">📍</span>
                            <span class="info-label">${i18n.t('conference.locationLabel')}</span>
                            <span class="info-value">${c.location}</span>
                        </div>
                    ` : ''}
                    <div class="info-row">
                        <span class="info-icon">⚙️</span>
                        <span class="info-label">${i18n.t('conference.serviceLabel')}</span>
                        <span class="info-value">
                            ${c.has_meal ? '🍽️' + i18n.t('conference.hasMeal') + ' ' : ''}
                            ${c.has_hotel ? '🏨' + i18n.t('conference.hasHotel') + ' ' : ''}
                            ${c.has_transport ? '🚗' + i18n.t('conference.hasTransport') : ''}
                            ${!c.has_meal && !c.has_hotel && !c.has_transport ? i18n.t('conference.noService') : ''}
                        </span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-small" onclick="editConference(${c.id})">${i18n.t('common.edit')}</button>
                    <button class="btn btn-primary btn-small" onclick="enterConference(${c.id}, '${c.title}', '${c.code || ''}')">${i18n.t('conference.enter')}</button>
                    <button class="btn btn-danger btn-small" onclick="deleteConference(${c.id})">${i18n.t('common.delete')}</button>
                </div>
            </div>
        `;
    }).join('');
}

function showCreateModal() {
    document.getElementById('modalTitle').textContent = i18n.t('conference.create');
    document.getElementById('conferenceForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('createModal').classList.add('active');

    // 强制重新渲染日期输入框，使其显示正确的语言
    document.querySelectorAll('input[type="date"]').forEach((input) => {
        const parent = input.parentNode;
        const nextSibling = input.nextSibling;
        const clone = input.cloneNode(true);
        clone.value = input.value;
        parent.removeChild(input);
        if (nextSibling) {
            parent.insertBefore(clone, nextSibling);
        } else {
            parent.appendChild(clone);
        }
    });
}

function closeModal(modalId) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    } else {
        document.getElementById('createModal').classList.remove('active');
    }
}

async function editConference(id) {
    const conference = conferences.find(c => c.id === id);
    if (!conference) return;

    document.getElementById('modalTitle').textContent = i18n.t('conference.edit');
    document.getElementById('editId').value = id;
    document.getElementById('title').value = conference.title || '';
    document.getElementById('scale').value = conference.scale || '';
    document.getElementById('startDate').value = conference.start_date || '';
    document.getElementById('endDate').value = conference.end_date || '';
    document.getElementById('location').value = conference.location || '';
    document.getElementById('purpose').value = conference.purpose || '';
    document.getElementById('hasMeal').checked = conference.has_meal || false;
    document.getElementById('hasHotel').checked = conference.has_hotel || false;
    document.getElementById('hasTransport').checked = conference.has_transport || false;

    document.getElementById('createModal').classList.add('active');

    // 强制重新渲染日期输入框，使其显示正确的语言
    document.querySelectorAll('input[type="date"]').forEach((input) => {
        const parent = input.parentNode;
        const nextSibling = input.nextSibling;
        const clone = input.cloneNode(true);
        clone.value = input.value;
        parent.removeChild(input);
        if (nextSibling) {
            parent.insertBefore(clone, nextSibling);
        } else {
            parent.appendChild(clone);
        }
    });
}

async function saveConference() {
    const editId = document.getElementById('editId').value;
    const data = {
        title: document.getElementById('title').value,
        scale: parseInt(document.getElementById('scale').value) || 0,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        location: document.getElementById('location').value,
        purpose: document.getElementById('purpose').value,
        has_meal: document.getElementById('hasMeal').checked,
        has_hotel: document.getElementById('hasHotel').checked,
        has_transport: document.getElementById('hasTransport').checked
    };

    try {
        let result;
        if (editId) {
            result = await put(`/conferences/${editId}`, data);
        } else {
            result = await post('/conferences', data);
        }

        if (result.success || result.id || result.code) {
            showToast(editId ? i18n.t('conference.saveSuccess') : i18n.t('conference.createSuccess'));
            closeModal();
            loadConferenceList();
        } else {
            showToast(result.message || result.detail || i18n.t('common.operationFailed'));
        }
    } catch (e) {
        console.error('[saveConference] Error:', e);
        showToast(i18n.t('common.operationFailedRetry'));
    }
}

async function deleteConference(id) {
    const confirmed = await showConfirm(i18n.t('conference.deleteConfirm'));
    if (!confirmed) return;

    try {
        const result = await del(`/conferences/${id}`);
        if (result.success !== false) {
            showToast(i18n.t('conference.deleteSuccess'));
            loadConferenceList();
        } else {
            showToast(result.detail || i18n.t('conference.deleteFailed'));
        }
    } catch (e) {
        showToast(i18n.t('conference.deleteFailedRetry'));
    }
}

function enterConference(id, title, code) {
    selectConference(id, title, code);
    location.hash = `#conference/${id}`;
}

function initConferenceCreate() {
    document.getElementById('conferenceCreateForm')?.reset();
}

async function handleConferenceCreate() {
    const form = document.getElementById('conferenceCreateForm');
    const formData = new FormData(form);

    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');

    if (new Date(endDate) < new Date(startDate)) {
        showCreateResult('error', i18n.t('conference.submitFailed'), i18n.t('conference.dateError'));
        return;
    }

    const data = {
        title: formData.get('title'),
        scale: parseInt(formData.get('scale')) || 0,
        start_date: startDate,
        end_date: endDate,
        purpose: formData.get('purpose') || '',
        has_meal: formData.get('hasMeal') === 'on',
        has_hotel: formData.get('hasHotel') === 'on',
        has_transport: formData.get('hasTransport') === 'on'
    };

    try {
        const result = await post('/conferences', data);
        if (result.id || result.code) {
            showCreateResult('success', i18n.t('conference.createSuccessTitle'), `
                <div class="info-row">
                    <span class="info-label">${i18n.t('conference.conferenceCodeLabel')}</span>
                    <span class="info-value">${result.code || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">${i18n.t('conference.conferenceNameLabel')}</span>
                    <span class="info-value">${result.title || '-'}</span>
                </div>
            `);
        } else {
            showCreateResult('error', i18n.t('conference.createFailedTitle'), result.detail || i18n.t('conference.unknownError'));
        }
    } catch (e) {
        showCreateResult('error', i18n.t('conference.networkErrorTitle'), i18n.t('conference.requestFailed') + ': ' + e.message);
    }
}

function showCreateResult(type, title, message) {
    const resultDiv = document.getElementById('createResult');
    if (resultDiv) {
        resultDiv.className = `result ${type}`;
        resultDiv.innerHTML = `<h4>${title}</h4>${message}`;
        resultDiv.style.display = 'block';
    }
}

async function loadConferenceManage(conferenceId, tab) {
    try {
        const conferences = await get('/conferences');
        const conf = conferences.find(c => c.id == conferenceId);
        if (conf) {
            currentConference = { id: conferenceId, title: conf.title, code: conf.code || '' };
            localStorage.setItem('currentConference', JSON.stringify(currentConference));

            const nameEl = document.getElementById('conferenceName');
            const codeEl = document.getElementById('conferenceCode');
            if (nameEl) nameEl.textContent = conf.title;
            if (codeEl) codeEl.textContent = conf.code || '';

            const conferenceInfo = document.querySelector('.conference-info');
            if (conferenceInfo) {
                conferenceInfo.classList.remove('hidden');
            }
        } else {
            // 会议不存在，显示错误提示并重定向到会议列表
            showToast(i18n.t('error.CONFERENCE_NOT_FOUND'));
            setTimeout(() => {
                location.hash = '#conference-list';
            }, 1500);
            return;
        }
    } catch (e) {
        console.error(i18n.t('conference.getConferenceFailed'), e);
        // 显示错误提示并重定向到会议列表
        showToast(i18n.t('error.NETWORK_ERROR'));
        setTimeout(() => {
            location.hash = '#conference-list';
        }, 1500);
        return;
    }

    switch (tab) {
        case 'participants':
            if (typeof loadParticipants === 'function') loadParticipants(conferenceId);
            break;
        case 'seating':
            if (typeof loadSeating === 'function') loadSeating(conferenceId);
            break;
        case 'hotel':
            if (typeof loadHotel === 'function') loadHotel(conferenceId);
            break;
        case 'restaurant':
            if (typeof loadRestaurant === 'function') loadRestaurant(conferenceId);
            break;
    }
}

window.loadConferenceList = loadConferenceList;
window.showCreateModal = showCreateModal;
window.closeModal = closeModal;
window.editConference = editConference;
window.saveConference = saveConference;
window.deleteConference = deleteConference;
window.enterConference = enterConference;

// 注册语言切换监听器
if (typeof i18n !== 'undefined' && typeof i18n.onLanguageChange === 'function') {
    i18n.onLanguageChange(() => {
        if (conferences.length > 0) {
            renderConferences();
        }
    });
}
window.initConferenceCreate = initConferenceCreate;
window.handleConferenceCreate = handleConferenceCreate;
window.loadConferenceManage = loadConferenceManage;
