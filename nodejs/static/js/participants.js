let participants = [];
let selectedIds = new Set();
let currentPage = 1;
let pageSize = 20;
let searchKeyword = '';
let validationResults = null;
let participantsConferenceId = null;

async function loadParticipants(conferenceId) {
    participantsConferenceId = conferenceId;
    try {
        const data = await get(`/participants/${conferenceId}`);
        participants = data || [];

        // 语言过滤：test 用户只显示对应语言的演示数据
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.username === 'test') {
            const currentLanguage = i18n.getLanguage() || 'zh-CN';
            participants = participants.filter(p => p.language === currentLanguage);
            console.log(`[Language Filter] Test user detected, showing ${currentLanguage} data (${participants.length} participants)`);
        }

        selectedIds.clear();
        currentPage = 1;
        validationResults = null;
        renderParticipantsTable();
        updateButtons();
        updateParticipantsSummary();
    } catch (e) {
        console.error(i18n.t('participants.loadFailed'), e);
        const tbody = document.getElementById('participantsTable');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;">' + i18n.t('participants.loadFailed') + '</td></tr>';
        }
    }
}

function updateParticipantsSummary() {
    const total = participants.length;
    const attending = participants.filter(p => p.is_attending !== false).length;
    const hotel = participants.filter(p => p.has_hotel === true || p.has_hotel === 1).length;
    const meal = participants.filter(p => p.has_meal === true || p.has_meal === 1).length;
    const transport = participants.filter(p => p.has_transport === true || p.has_transport === 1).length;

    const totalEl = document.getElementById('totalParticipantCount');
    const attendingEl = document.getElementById('attendingCount');
    const hotelEl = document.getElementById('hotelNeedCount');
    const mealEl = document.getElementById('mealNeedCount');
    const transportEl = document.getElementById('transportNeedCount');

    if (totalEl) totalEl.textContent = total;
    if (attendingEl) attendingEl.textContent = attending;
    if (hotelEl) hotelEl.textContent = hotel;
    if (mealEl) mealEl.textContent = meal;
    if (transportEl) transportEl.textContent = transport;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderParticipantsTable() {
    const filtered = participants.filter(p => {
        if (!searchKeyword) return true;
        const kw = searchKeyword.toLowerCase();
        return (p.name && p.name.toLowerCase().includes(kw)) ||
            (p.company && p.company.toLowerCase().includes(kw)) ||
            (p.department && p.department.toLowerCase().includes(kw)) ||
            (p.position && p.position.toLowerCase().includes(kw)) ||
            (p.title && p.title.toLowerCase().includes(kw)) ||
            (p.phone && p.phone.includes(kw));
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    const tbody = document.getElementById('participantsTable');
    if (!tbody) return;

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;">' + i18n.t('participants.noData') + '</td></tr>';
    } else {
        tbody.innerHTML = pageData.map(p => {
            const validation = validationResults ? validationResults.find(v => v.id === p.id) : null;
            return `
            <tr data-id="${p.id}">
                <td><input type="checkbox" class="participant-checkbox" value="${p.id}" 
                    ${selectedIds.has(p.id) ? 'checked' : ''} 
                    onchange="toggleSelect(${p.id})"></td>
                <td>${p.id}</td>
                <td>${escapeHtml(p.name || '')}</td>
                <td>${escapeHtml(p.phone || '')}</td>
                <td>${escapeHtml(p.company || '')}</td>
                <td>${escapeHtml(p.department || '')}</td>
                <td>${escapeHtml(p.position || '')}</td>
                <td>${escapeHtml(p.title || '')}</td>
                ${getStatusCell(p.is_attending !== false, validation ? validation.attending_valid : true, p.id)}
                ${getStatusCell(p.has_meal === true || p.has_meal === 1, validation ? validation.meal_valid : true, p.id)}
                ${getStatusCell(p.has_hotel === true || p.has_hotel === 1, validation ? validation.hotel_valid : true, p.id)}
                ${getStatusCell(p.has_transport === true || p.has_transport === 1, validation ? validation.transport_valid : true, p.id)}
            </tr>`;
        }).join('');
    }

    document.getElementById('pageInfo').textContent = i18n.t('participants.pageInfo', { current: currentPage, total: totalPages });
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function getStatusCell(value, isValid, participantId) {
    if (!validationResults) {
        return `<td>${value ? '✓' : '✗'}</td>`;
    }
    if (value && !isValid) {
        return `<td><span style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border:2px solid #e74c3c;border-radius:3px;color:#e74c3c;font-weight:bold;">✓</span></td>`;
    }
    return `<td>${value ? '✓' : '✗'}</td>`;
}

function toggleSelect(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    updateButtons();
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.participant-checkbox');

    checkboxes.forEach(cb => {
        const id = parseInt(cb.value);
        if (selectAll.checked) {
            selectedIds.add(id);
        } else {
            selectedIds.delete(id);
        }
        cb.checked = selectAll.checked;
    });

    updateButtons();
}

function updateButtons() {
    const count = selectedIds.size;
    const selectedCountEl = document.getElementById('selectedCount');
    const deleteBtnEl = document.getElementById('deleteBtn');
    const editBtnEl = document.getElementById('editBtn');
    if (selectedCountEl) selectedCountEl.textContent = count;
    if (deleteBtnEl) deleteBtnEl.disabled = count === 0;
    if (editBtnEl) editBtnEl.disabled = count !== 1;
}

function searchParticipants() {
    searchKeyword = document.getElementById('searchInput').value;
    currentPage = 1;
    renderParticipantsTable();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderParticipantsTable();
    }
}

function nextPage() {
    const filtered = participants.filter(p => {
        if (!searchKeyword) return true;
        const kw = searchKeyword.toLowerCase();
        return (p.name && p.name.toLowerCase().includes(kw)) ||
            (p.company && p.company.toLowerCase().includes(kw)) ||
            (p.department && p.department.toLowerCase().includes(kw)) ||
            (p.position && p.position.toLowerCase().includes(kw)) ||
            (p.title && p.title.toLowerCase().includes(kw)) ||
            (p.phone && p.phone.includes(kw));
    });
    const totalPages = Math.ceil(filtered.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        renderParticipantsTable();
    }
}

function showAddParticipantModal() {
    document.getElementById('participantModalTitle').textContent = i18n.t('participants.addParticipant');
    document.getElementById('editParticipantId').value = '';
    document.getElementById('participantName').value = '';
    document.getElementById('participantPhone').value = '';
    document.getElementById('participantCompany').value = '';
    document.getElementById('participantDepartment').value = '';
    document.getElementById('participantPosition').value = '';
    document.getElementById('participantTitle').value = '';
    document.getElementById('participantAttending').checked = true;
    document.getElementById('participantMeal').checked = false;
    document.getElementById('participantHotel').checked = false;
    document.getElementById('participantTransport').checked = false;
    document.getElementById('participantModal').classList.add('active');
    // 更新弹窗内所有元素的翻译
    i18n.updateAllElements();
}

function closeParticipantModal() {
    document.getElementById('participantModal').classList.remove('active');
}

async function saveParticipant() {
    if (!participantsConferenceId) {
        showToast(i18n.t('participants.selectConferenceFirst'));
        return;
    }

    const editId = document.getElementById('editParticipantId').value;
    const name = document.getElementById('participantName').value.trim();

    if (!name) {
        showToast(i18n.t('participants.enterName'));
        return;
    }

    const data = {
        conference_id: participantsConferenceId,
        name: name,
        phone: document.getElementById('participantPhone').value.trim(),
        company: document.getElementById('participantCompany').value.trim(),
        department: document.getElementById('participantDepartment').value.trim(),
        position: document.getElementById('participantPosition').value.trim(),
        title: document.getElementById('participantTitle').value.trim(),
        is_attending: document.getElementById('participantAttending').checked,
        has_meal: document.getElementById('participantMeal').checked,
        has_hotel: document.getElementById('participantHotel').checked,
        has_transport: document.getElementById('participantTransport').checked
    };

    try {
        let result;
        if (editId) {
            result = await put(`/participants/${editId}`, data);
        } else {
            result = await post(`/participants/`, data);
        }

        showToast(editId ? i18n.t('participants.saveSuccess') : i18n.t('participants.addSuccess'));
        closeParticipantModal();
        loadParticipants(participantsConferenceId);
    } catch (e) {
        showToast(i18n.t('participants.operationFailed'));
    }
}

function editSelectedParticipants() {
    if (selectedIds.size !== 1) {
        showToast(i18n.t('participants.selectOneToEdit'));
        return;
    }

    const id = [...selectedIds][0];
    const participant = participants.find(p => p.id === id);
    if (!participant) return;

    document.getElementById('participantModalTitle').textContent = i18n.t('participants.editParticipant');
    document.getElementById('editParticipantId').value = participant.id;
    document.getElementById('participantName').value = participant.name || '';
    document.getElementById('participantPhone').value = participant.phone || '';
    document.getElementById('participantCompany').value = participant.company || '';
    document.getElementById('participantDepartment').value = participant.department || '';
    document.getElementById('participantPosition').value = participant.position || '';
    document.getElementById('participantTitle').value = participant.title || '';
    document.getElementById('participantAttending').checked = participant.is_attending !== false;
    document.getElementById('participantMeal').checked = participant.has_meal === true || participant.has_meal === 1;
    document.getElementById('participantHotel').checked = participant.has_hotel === true || participant.has_hotel === 1;
    document.getElementById('participantTransport').checked = participant.has_transport === true || participant.has_transport === 1;
    document.getElementById('participantModal').classList.add('active');
}

async function deleteSelectedParticipants() {
    if (selectedIds.size === 0) {
        showToast(i18n.t('participants.selectToDelete'));
        return;
    }

    if (!participantsConferenceId) return;

    const confirmed = await showConfirm(i18n.t('participants.confirmDelete', { count: selectedIds.size }));
    if (!confirmed) return;

    try {
        const result = await del(`/participants/batch`, { ids: Array.from(selectedIds) });
        showToast(i18n.t('participants.deleteSuccess', { count: result.deleted || selectedIds.size }));
        selectedIds.clear();
        loadParticipants(participantsConferenceId);
    } catch (e) {
        showToast(i18n.t('participants.deleteFailed'));
    }
}

function downloadTemplate() {
    window.open('/api/participants/template/download', '_blank');
}

function showImportModal() {
    document.getElementById('importFile').value = '';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importModal').classList.add('active');
    // 更新弹窗内所有元素的翻译
    i18n.updateAllElements();
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('active');
}

function handleFileSelect(input) {
    const file = input.files[0];
    if (file) {
        document.getElementById('importPreview').style.display = 'block';
        document.getElementById('importPreviewContent').innerHTML = `
            <div style="padding: 10px; background: #f5f5f5; border-radius: 6px;">
                <div style="font-weight: 500;">${file.name}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    ${i18n.t('participants.fileSize', { size: (file.size / 1024).toFixed(1) })}
                </div>
            </div>
        `;
    }
}

async function confirmImport() {
    await importParticipants();
}

async function importParticipants() {
    if (!participantsConferenceId) {
        showToast(i18n.t('participants.selectConferenceFirst'));
        return;
    }

    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) {
        showToast(i18n.t('participants.selectFile'));
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        showToast(i18n.t('participants.importing'));
        const result = await postForm(`/participants/${participantsConferenceId}/import`, formData);

        if (result.imported !== undefined) {
            showToast(i18n.t('participants.importSuccess', { count: result.imported }));
            closeImportModal();
            loadParticipants(participantsConferenceId);
        } else {
            showToast(result.detail || i18n.t('participants.importFailed'));
        }
    } catch (e) {
        showToast(i18n.t('participants.importFailed') + ': ' + (e.message || i18n.t('participants.tryLater')));
    }
}

async function validateParticipants() {
    if (!participantsConferenceId) {
        showToast(i18n.t('participants.selectConferenceFirst'));
        return;
    }

    try {
        const result = await get(`/participants/${participantsConferenceId}/validate`);
        validationResults = result;

        let invalidCount = 0;
        validationResults.forEach(v => {
            if (!v.attending_valid || !v.meal_valid || !v.hotel_valid || !v.transport_valid) {
                invalidCount++;
            }
        });

        if (invalidCount > 0) {
            showToast(i18n.t('participants.validationComplete', { count: invalidCount }));
        } else {
            showToast(i18n.t('participants.validationPassed'));
        }

        renderParticipantsTable();
    } catch (e) {
        showToast(i18n.t('participants.validationFailed') + ': ' + (e.message || i18n.t('participants.tryLater')));
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

window.loadParticipants = loadParticipants;
window.searchParticipants = searchParticipants;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.toggleSelectAll = toggleSelectAll;
window.toggleSelect = toggleSelect;
window.showAddParticipantModal = showAddParticipantModal;
window.closeParticipantModal = closeParticipantModal;
window.saveParticipant = saveParticipant;
window.editSelectedParticipants = editSelectedParticipants;
window.deleteSelectedParticipants = deleteSelectedParticipants;
window.downloadTemplate = downloadTemplate;
window.showImportModal = showImportModal;
window.closeImportModal = closeImportModal;
window.handleFileSelect = handleFileSelect;
window.confirmImport = confirmImport;
window.importParticipants = importParticipants;
window.validateParticipants = validateParticipants;

// 注册语言切换监听器
if (typeof i18n !== 'undefined' && typeof i18n.onLanguageChange === 'function') {
    i18n.onLanguageChange(() => {
        if (participants.length > 0) {
            renderParticipantsTable();
        }
    });
}
