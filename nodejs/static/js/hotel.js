let hotels = [];
let hotelParticipants = [];
let hotelAssignments = [];
let currentAssignRoomId = null;
let hotelState = {
    conferenceId: null,
    showHotelDetail: false
};

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadHotel(conferenceId) {
    hotelState.conferenceId = conferenceId;

    try {
        const data = await get(`/hotel/${conferenceId}/summary`);

        if (data.hotels && data.hotels.length > 0) {
            document.getElementById('hotelSummary').style.display = 'block';
            document.getElementById('hotelCount').textContent = data.hotels.length;
            document.getElementById('hotelRoomCount').textContent = data.total_rooms;
            document.getElementById('hotelTotalCapacity').textContent = data.total_capacity;
            document.getElementById('hotelAvailableCount').textContent = data.available_capacity;
            document.getElementById('hotelParticipantCount').textContent = data.hotel_participants || 0;
            document.getElementById('hotelAssignedCount').textContent = data.total_assigned;
            document.getElementById('hotelUnassignedCount').textContent = data.unassigned_count;

            hotels = data.hotels;

            let html = '';
            for (const h of data.hotels) {
                html += `
                <div class="hotel-card" style="border:1px solid #ddd;border-radius:8px;padding:15px;margin-bottom:15px;background:#fff;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <h4 style="margin:0;">🏨 ${escapeHtml(h.hotel_name)}</h4>
                        <div>
                            <button class="btn btn-primary" style="padding:4px 8px;font-size:12px;margin-right:4px;" onclick="showRoomModal(${h.hotel_id})">➕ ${i18n.t('hotel.addRoom')}</button>
                            <button class="btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="deleteHotel(${h.hotel_id})">🗑️ ${i18n.t('hotel.deleteHotel')}</button>
                        </div>
                    </div>
                    <div style="color:#666;font-size:13px;margin-bottom:10px;">
                        ${i18n.t('hotel.roomInfo')}: ${h.room_count} | ${i18n.t('hotel.occupied')}: ${h.occupied} | ${i18n.t('hotel.available')}: ${h.available}
                    </div>
                    <div id="hotel-rooms-${h.hotel_id}"></div>
                </div>`;
            }
            document.getElementById('hotelList').innerHTML = html;

            for (const h of data.hotels) {
                loadHotelRooms(h.hotel_id);
            }
        } else {
            document.getElementById('hotelSummary').style.display = 'none';
            document.getElementById('hotelList').innerHTML = '<div style="text-align:center;color:#999;padding:40px;">' + i18n.t('hotel.noHotel') + '</div>';
        }
    } catch (e) {
        console.error(i18n.t('hotel.loadFailed'), e);
    }
}

async function loadHotelRooms(hotelId) {
    try {
        const rooms = await get(`/hotel/${hotelState.conferenceId}/rooms?hotel_id=${hotelId}`);
        const assignments = await get(`/hotel/${hotelState.conferenceId}/assignments`);
        hotelAssignments = assignments || [];

        const participants = await get(`/participants/${hotelState.conferenceId}`);
        hotelParticipants = participants || [];

        const showDetail = hotelState.showHotelDetail;
        const roomWidth = showDetail ? '280px' : '90px';
        const roomPadding = showDetail ? '12px' : '8px';

        let html = `<div style="display:flex;flex-wrap:wrap;gap:${showDetail ? '12px' : '8px'};">`;
        for (const r of rooms) {
            const roomAssignments = assignments.filter(a => a.room_id === r.id);
            const maxOccupancy = r.room_type === 'double' ? 2 : (r.room_type === 'suite' ? 4 : 1);
            const isFull = roomAssignments.length >= maxOccupancy;
            const isEmpty = roomAssignments.length === 0;

            let occupantsHtml = '';
            if (roomAssignments.length > 0) {
                if (showDetail) {
                    const names = [];
                    const companies = [];
                    const positions = [];
                    roomAssignments.forEach(a => {
                        const p = participants.find(p => p.id === a.participant_id);
                        names.push({
                            name: p ? p.name : '',
                            assignmentId: a.id
                        });
                        companies.push(p ? (p.company || '') : '');
                        positions.push(p ? (p.position || '') : '');
                    });

                    occupantsHtml = `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">
                        ${names.map((n, i) => `<div onclick="event.stopPropagation();unassignRoom(${n.assignmentId})" style="width:120px;font-size:11px;color:#fff;padding:8px 6px;background:#4a90d9;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#3a7bc8';this.style.transform='scale(1.02)'" onmouseout="this.style.background='#4a90d9';this.style.transform='scale(1)'" title="${escapeHtml(n.name)}${companies[i] ? ' - ' + escapeHtml(companies[i]) : ''}${positions[i] ? ' - ' + escapeHtml(positions[i]) : ''}&#10;${i18n.t('hotel.clickToUnassign')}">
                            <span style="font-weight:500;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;">${escapeHtml(n.name)}</span>
                            <span style="font-size:9px;opacity:0.85;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;">${escapeHtml(companies[i])}</span>
                            <span style="font-size:9px;opacity:0.75;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;">${escapeHtml(positions[i])}</span>
                        </div>`).join('')}
                    </div>`;
                } else {
                    occupantsHtml = roomAssignments.map(a => {
                        const p = participants.find(p => p.id === a.participant_id);
                        const name = p ? p.name : '';
                        return `<div onclick="event.stopPropagation();unassignRoom(${a.id})" style="font-size:11px;color:#fff;background:#4a90d9;padding:3px 6px;border-radius:4px;margin-top:4px;text-align:center;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#3a7bc8'" onmouseout="this.style.background='#4a90d9'" title="${i18n.t('hotel.clickToUnassign')}">${escapeHtml(name)}</div>`;
                    }).join('');
                }
            }

            const bgColor = isEmpty ? '#f5f5f5' : (isFull ? '#ffebee' : '#e8f5e9');
            const borderColor = isEmpty ? '#ddd' : (isFull ? '#f44336' : '#4caf50');

            html += `
            <div class="room-item" data-room-id="${r.id}" style="width:${roomWidth};padding:${roomPadding};border-radius:6px;text-align:center;cursor:pointer;background:${bgColor};border:2px solid ${borderColor};" onclick="showHotelAssignModal(${r.id}, ${roomAssignments.length})">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:bold;font-size:14px;">${escapeHtml(r.room_number)}</span>
                    <span onclick="event.stopPropagation();deleteRoom(${r.id})" style="cursor:pointer;color:#999;font-size:16px;padding:2px;" title="${i18n.t('hotel.deleteRoom')}">×</span>
                </div>
                <div style="font-size:12px;color:#666;margin-bottom:2px;">${r.room_type === 'single' ? i18n.t('hotel.singleRoom') : r.room_type === 'double' ? i18n.t('hotel.doubleRoom') : i18n.t('hotel.suiteRoom')} ${roomAssignments.length}/${maxOccupancy}</div>
                ${occupantsHtml}
            </div>`;
        }
        html += '</div>';
        document.getElementById(`hotel-rooms-${hotelId}`).innerHTML = html;
    } catch (e) {
        console.error(i18n.t('hotel.loadRoomsFailed'), e);
    }
}

function showHotelModal() {
    document.getElementById('hotelModalTitle').textContent = i18n.t('hotel.addHotel');
    document.getElementById('editHotelId').value = '';
    document.getElementById('hotelName').value = '';
    document.getElementById('hotelLocation').value = '';
    document.getElementById('hotelContact').value = '';
    document.getElementById('hotelNote').value = '';
    document.getElementById('hotelModal').classList.add('active');
    // 更新弹窗内所有元素的翻译
    i18n.updateAllElements();
}

function closeHotelModal() {
    document.getElementById('hotelModal').classList.remove('active');
}

async function saveHotel() {
    const name = document.getElementById('hotelName').value.trim();
    if (!name) {
        showToast(i18n.t('hotel.enterHotelName'));
        return;
    }
    const editId = document.getElementById('editHotelId').value;
    const location = document.getElementById('hotelLocation').value.trim();
    const contact = document.getElementById('hotelContact').value.trim();
    const note = document.getElementById('hotelNote').value.trim();

    try {
        if (editId) {
            await put(`/hotel/hotels/${editId}`, { name, location, contact, note });
        } else {
            await post(`/hotel/${hotelState.conferenceId}/hotels`, { name, location, contact, note });
        }
        showToast(i18n.t('hotel.saveSuccess'));
        closeHotelModal();
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.saveFailed'));
    }
}

async function deleteHotel(hotelId) {
    const confirmed = await showConfirm(i18n.t('hotel.deleteHotelConfirm'));
    if (!confirmed) return;
    try {
        await del(`/hotel/hotels/${hotelId}`);
        showToast(i18n.t('hotel.deleteSuccess'));
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.deleteFailed'));
    }
}

async function deleteRoom(roomId) {
    const confirmed = await showConfirm(i18n.t('hotel.deleteRoomConfirm'));
    if (!confirmed) return;
    try {
        await del(`/hotel/rooms/${roomId}`);
        showToast(i18n.t('hotel.deleteSuccess'));
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.deleteFailed'));
    }
}

function showRoomModal(hotelId) {
    document.getElementById('roomHotelId').value = hotelId;
    document.getElementById('roomNumbers').value = '';
    document.getElementById('roomType').value = 'single';
    document.getElementById('roomModal').classList.add('active');
    // 更新弹窗内所有元素的翻译
    i18n.updateAllElements();
}

function closeRoomModal() {
    document.getElementById('roomModal').classList.remove('active');
}

async function saveRooms() {
    const hotelId = document.getElementById('roomHotelId').value;
    const roomNumbersText = document.getElementById('roomNumbers').value.trim();
    const roomType = document.getElementById('roomType').value;

    if (!roomNumbersText) {
        showToast(i18n.t('hotel.enterRoomNumber'));
        return;
    }

    const lines = roomNumbersText.split('\n').map(l => l.trim()).filter(l => l);
    const roomNumbers = [];

    for (const line of lines) {
        if (line.includes('~')) {
            const parts = line.split('~');
            if (parts.length === 2) {
                const start = parts[0];
                const end = parseInt(parts[1]);
                const prefix = start.replace(/\d+$/, '');
                const startNum = parseInt(start.replace(/^\D+/, ''));
                const startDigits = start.match(/\d+$/);
                const digitLen = startDigits ? startDigits[0].length : 0;

                for (let i = startNum; i <= end; i++) {
                    let roomNum;
                    if (digitLen > 0) {
                        roomNum = prefix + i.toString().padStart(digitLen, '0');
                    } else {
                        roomNum = prefix + i;
                    }
                    roomNumbers.push(roomNum);
                }
            } else {
                roomNumbers.push(line);
            }
        } else {
            roomNumbers.push(line);
        }
    }

    const uniqueRoomNumbers = [...new Set(roomNumbers)];

    try {
        const existingRooms = await get(`/hotel/${hotelState.conferenceId}/rooms?hotel_id=${hotelId}`);
        if (existingRooms) {
            const existingNumbers = new Set(existingRooms.map(r => r.room_number));
            const duplicates = uniqueRoomNumbers.filter(n => existingNumbers.has(n));
            if (duplicates.length > 0) {
                showToast(i18n.t('hotel.duplicateRooms') + duplicates.join(', '));
                return;
            }
        }

        const rooms = uniqueRoomNumbers.map(num => ({
            room_number: num,
            room_type: roomType
        }));

        await post(`/hotel/${hotelState.conferenceId}/rooms/batch`, { hotel_id: parseInt(hotelId), rooms });
        showToast(i18n.t('hotel.saveSuccess'));
        closeRoomModal();
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.saveFailed'));
    }
}

async function showHotelAssignModal(roomId, currentCount) {
    currentAssignRoomId = roomId;

    const participants = await get(`/participants/${hotelState.conferenceId}`);
    const assignments = await get(`/hotel/${hotelState.conferenceId}/assignments`);

    // 只获取需要住宿的参会人（has_hotel可能是1或true）
    const hotelParticipants = participants.filter(p => p.has_hotel === true || p.has_hotel === 1);

    // 只获取需要住宿的参会人的分配记录
    const assignedParticipantIds = assignments
        .filter(a => {
            const participant = participants.find(p => p.id === a.participant_id);
            return participant && (participant.has_hotel === true || participant.has_hotel === 1);
        })
        .map(a => a.participant_id);

    const availableParticipants = hotelParticipants.filter(p => !assignedParticipantIds.includes(p.id));

    if (availableParticipants.length === 0) {
        showToast(i18n.t('hotel.allAssigned'));
        return;
    }

    const rooms = await get(`/hotel/${hotelState.conferenceId}/rooms?hotel_id=0`);
    let roomType = i18n.t('hotel.singleRoom');
    let maxOcc = 1;
    if (rooms) {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            if (room.room_type === 'double') { roomType = i18n.t('hotel.doubleRoom'); maxOcc = 2; }
            else if (room.room_type === 'suite') { roomType = i18n.t('hotel.suiteRoom'); maxOcc = 4; }
        }
    }

    const remainingSlots = maxOcc - currentCount;
    let checkboxHtml = '<div style="max-height:250px;overflow-y:auto;">';
    for (const p of availableParticipants) {
        checkboxHtml += `<label style="display:block;padding:6px;border-bottom:1px solid #eee;cursor:pointer;">
            <input type="checkbox" class="participant-check" value="${p.id}" style="margin-right:8px;">
            ${escapeHtml(p.name)} <span style="color:#999;font-size:12px;">(${escapeHtml(p.company || i18n.t('hotel.noCompany'))})</span>
        </label>`;
    }
    checkboxHtml += '</div>';

    const modal = document.createElement('div');
    modal.id = 'hotelAssignModal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>${i18n.t('hotel.assignRoom')}</h3>
                <button class="modal-close" onclick="closeHotelAssignModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color:#666;">${i18n.t('hotel.roomTypeLabel')}: ${roomType} | ${i18n.t('hotel.currentOccupancy')}: <strong>${currentCount}</strong>/${maxOcc}${i18n.t('hotel.maxOccupancy')} | ${i18n.t('hotel.remainingSlots')}: <strong>${remainingSlots}</strong>${i18n.t('hotel.slotsUnit')}</p>
                ${remainingSlots <= 0 ? '<p style="color:#f44336;">' + i18n.t('hotel.roomFull') + '</p>' : checkboxHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeHotelAssignModal()">${i18n.t('common.cancel')}</button>
                ${remainingSlots > 0 ? '<button class="btn btn-primary" onclick="assignRoom()">' + i18n.t('common.confirm') + '</button>' : ''}
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function closeHotelAssignModal() {
    const modal = document.getElementById('hotelAssignModal');
    if (modal) modal.remove();
}

async function assignRoom() {
    const selected = document.querySelectorAll('.participant-check:checked');
    if (selected.length === 0) {
        showToast(i18n.t('hotel.selectParticipant'));
        return;
    }
    try {
        for (const cb of selected) {
            const participantId = parseInt(cb.value);
            await post(`/hotel/${hotelState.conferenceId}/assignments`, {
                room_id: currentAssignRoomId,
                participant_id: participantId
            });
        }
        showToast(i18n.t('hotel.assignSuccess'));
        closeHotelAssignModal();
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.assignFailed'));
    }
}

async function unassignRoom(assignmentId) {
    const confirmed = await showConfirm(i18n.t('hotel.unassignConfirm'));
    if (!confirmed) return;
    try {
        await del(`/hotel/assignments/${assignmentId}`);
        showToast(i18n.t('hotel.unassignSuccess'));
        closeHotelAssignModal();
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.unassignFailed'));
    }
}

async function autoAssignRooms() {
    const confirmed = await showConfirm(i18n.t('hotel.autoAssignConfirm'));
    if (!confirmed) return;
    try {
        const result = await post(`/hotel/${hotelState.conferenceId}/assignments/auto`, {});
        showToast(result.message || i18n.t('hotel.autoAssignSuccess'));
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.autoAssignFailed'));
    }
}

async function clearAllRoomAssignments() {
    const confirmed = await showConfirm(i18n.t('hotel.clearAssignConfirm'));
    if (!confirmed) return;
    try {
        const result = await del(`/hotel/${hotelState.conferenceId}/assignments/all`);
        showToast(result.message || i18n.t('hotel.clearAssignSuccess'));
        loadHotel(hotelState.conferenceId);
    } catch (e) {
        showToast(e.message || i18n.t('hotel.clearAssignFailed'));
    }
}

function toggleHotelDetail() {
    hotelState.showHotelDetail = !hotelState.showHotelDetail;
    const btn = document.getElementById('toggleHotelDetailBtn');
    if (btn) {
        btn.textContent = hotelState.showHotelDetail ? '📋 ' + i18n.t('hotel.hideDetail') : '📋 ' + i18n.t('hotel.showDetail');
    }
    loadHotel(hotelState.conferenceId);
}

async function exportHotelPDF() {
    const hotelList = document.getElementById('hotelList');
    if (!hotelList || hotelList.children.length === 0) {
        showToast(i18n.t('hotel.noDataToExport'));
        return;
    }

    const unassignedCount = parseInt(document.getElementById('hotelUnassignedCount').textContent) || 0;
    if (unassignedCount > 0) {
        showToast(i18n.t('hotel.unassignedWarning').replace('{count}', unassignedCount));
        return;
    }

    try {
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script1);
        await new Promise(resolve => script1.onload = resolve);

        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script2);
        await new Promise(resolve => script2.onload = resolve);

        const { jsPDF } = window.jspdf;

        const resp = await get(`/hotel/${hotelState.conferenceId}/summary`);
        const data = resp;

        let html = `<div style="font-family:Arial,sans-serif;padding:20px;background:#fff;color:#333;">
            <h2 style="text-align:center;margin-bottom:20px;">🏨 ${i18n.t('hotel.exportTitle')}</h2>
            <p style="text-align:center;color:#666;">${i18n.t('hotel.exportStats')}: ${i18n.t('hotel.hotelCount')} ${data.hotels?.length || 0} ${i18n.t('hotel.hotelUnit')} | ${i18n.t('hotel.roomCount')} ${data.total_rooms || 0} ${i18n.t('hotel.roomUnit')} | ${i18n.t('hotel.occupied')} ${data.total_assigned || 0} ${i18n.t('hotel.peopleUnit')}</p>`;

        for (const h of (data.hotels || [])) {
            html += `<div style="margin-bottom:20px;border:1px solid #ddd;padding:15px;border-radius:8px;">
                <h3 style="margin:0 0 10px 0;">🏨 ${escapeHtml(h.hotel_name)}</h3>
                <p style="margin:0 0 10px 0;color:#666;font-size:12px;">${i18n.t('hotel.roomCount')}: ${h.room_count} | ${i18n.t('hotel.occupiedCount')}: ${h.occupied} | ${i18n.t('hotel.availableCount')}: ${h.available}</p>
                <table style="width:100%;border-collapse:collapse;font-size:12px;">
                    <tr style="background:#f5f5f5;">
                        <th style="border:1px solid #ddd;padding:6px;text-align:left;">${i18n.t('hotel.roomNumber')}</th>
                        <th style="border:1px solid #ddd;padding:6px;text-align:left;">${i18n.t('hotel.roomType')}</th>
                        <th style="border:1px solid #ddd;padding:6px;text-align:left;">${i18n.t('hotel.occupant')}</th>
                        <th style="border:1px solid #ddd;padding:6px;text-align:left;">${i18n.t('hotel.company')}</th>
                        <th style="border:1px solid #ddd;padding:6px;text-align:left;">${i18n.t('hotel.position')}</th>
                    </tr>`;

            const roomsResp = await get(`/hotel/${hotelState.conferenceId}/rooms?hotel_id=${h.hotel_id}`);
            const rooms = roomsResp || [];
            const assignResp = await get(`/hotel/${hotelState.conferenceId}/assignments`);
            const assignments = assignResp || [];
            const partResp = await get(`/participants/${hotelState.conferenceId}`);
            const participants = partResp || [];

            for (const r of rooms) {
                const roomAssignments = assignments.filter(a => a.room_id === r.id);
                const roomTypeName = r.room_type === 'single' ? i18n.t('hotel.singleRoom') : (r.room_type === 'double' ? i18n.t('hotel.doubleRoom') : i18n.t('hotel.suiteRoom'));

                if (roomAssignments.length === 0) {
                    html += `<tr>
                        <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(r.room_number)}</td>
                        <td style="border:1px solid #ddd;padding:6px;">${roomTypeName}</td>
                        <td style="border:1px solid #ddd;padding:6px;color:#999;">-</td>
                        <td style="border:1px solid #ddd;padding:6px;color:#999;">-</td>
                        <td style="border:1px solid #ddd;padding:6px;color:#999;">-</td>
                    </tr>`;
                } else {
                    const rowspan = roomAssignments.length;
                    roomAssignments.forEach((a, idx) => {
                        const p = participants.find(p => p.id === a.participant_id);
                        const name = p ? p.name : '-';
                        const company = p ? (p.company || '-') : '-';
                        const position = p ? (p.position || '-') : '-';
                        const roomNumCell = idx === 0 ? `<td rowspan="${rowspan}" style="border:1px solid #ddd;padding:6px;vertical-align:middle;">${escapeHtml(r.room_number)}</td>` : '';
                        const roomTypeCell = idx === 0 ? `<td rowspan="${rowspan}" style="border:1px solid #ddd;padding:6px;vertical-align:middle;">${roomTypeName}</td>` : '';
                        html += `<tr>
                            ${roomNumCell}
                            ${roomTypeCell}
                            <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(name)}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(company)}</td>
                            <td style="border:1px solid #ddd;padding:6px;">${escapeHtml(position)}</td>
                        </tr>`;
                    });
                }
            }
            html += '</table></div>';
        }
        html += '</div>';

        const printArea = document.createElement('div');
        printArea.style.cssText = 'position:absolute;left:-9999px;top:0;background:#fff;width:800px;';
        printArea.innerHTML = html;
        document.body.appendChild(printArea);

        const htmlCanvas = await html2canvas(printArea, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = htmlCanvas.toDataURL('image/png');
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 10;
        const imgHeight = (htmlCanvas.height * imgWidth) / htmlCanvas.width;
        const pages = Math.ceil(imgHeight / (pageHeight - 10));

        for (let i = 0; i < pages; i++) {
            if (i > 0) pdf.addPage();
            const yOffset = -i * (pageHeight - 10);
            pdf.addImage(imgData, 'PNG', 5, yOffset + 10, imgWidth, imgHeight);
        }

        pdf.save(`住宿安排_${new Date().toLocaleDateString()}.pdf`);
        document.body.removeChild(printArea);
    } catch (e) {
        console.error(e);
        showToast(i18n.t('hotel.exportPdfFailed') + ': ' + e.message);
    }
}

window.loadHotel = loadHotel;
window.showHotelModal = showHotelModal;
window.closeHotelModal = closeHotelModal;
window.saveHotel = saveHotel;
window.deleteHotel = deleteHotel;
window.showRoomModal = showRoomModal;
window.closeRoomModal = closeRoomModal;
window.saveRooms = saveRooms;
window.deleteRoom = deleteRoom;
window.showHotelAssignModal = showHotelAssignModal;
window.closeHotelAssignModal = closeHotelAssignModal;
window.assignRoom = assignRoom;
window.unassignRoom = unassignRoom;
window.autoAssignRooms = autoAssignRooms;
window.clearAllRoomAssignments = clearAllRoomAssignments;
window.toggleHotelDetail = toggleHotelDetail;
window.exportHotelPDF = exportHotelPDF;

// 语言切换监听器
if (typeof i18n !== 'undefined' && typeof i18n.onLanguageChange === 'function') {
    i18n.onLanguageChange(() => {
        if (hotelState.conferenceId) {
            loadHotel(hotelState.conferenceId);
        }
    });
}
