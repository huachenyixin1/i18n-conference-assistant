async function loadProfile() {
    try {
        const user = await get('/auth/me');
        if (user) {
            const packageName = document.querySelector('.package-name');
            const packageExpire = document.querySelector('.package-expire');
            const packageStatus = document.querySelector('.package-status');

            if (packageName) packageName.textContent = i18n.t('profile.basicPlan');

            if (packageExpire && user.subscription_end) {
                const endDate = new Date(user.subscription_end);
                const formattedDate = endDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).replace(/\//g, '-');
                packageExpire.textContent = i18n.t('profile.validUntil') + formattedDate;

                const now = new Date();
                if (endDate > now) {
                    if (packageStatus) {
                        packageStatus.textContent = i18n.t('profile.activated');
                        packageStatus.className = 'package-status status-active';
                    }
                } else {
                    if (packageStatus) {
                        packageStatus.textContent = i18n.t('profile.expired');
                        packageStatus.className = 'package-status status-ended';
                    }
                }
            }
        }

        // 加载邀请码使用记录
        loadCodeHistory();
    } catch (e) {
        console.error(i18n.t('profile.loadUserInfoFailed'), e);
    }
}

async function loadCodeHistory() {
    try {
        const codes = await get('/auth/invitation-codes/my-history');
        const codeList = document.getElementById('codeList');
        if (!codeList) return;

        if (codes && codes.length > 0) {
            codeList.innerHTML = codes.map(code => `
                <div class="order-item">
                    <div class="order-info">
                        <div class="order-id">${i18n.t('profile.invitationCode')}: ${code.code}</div>
                        <div class="order-date">${i18n.t('profile.usedTime')}: ${new Date(code.used_at).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <div class="order-status status-success">${i18n.t('profile.used')}</div>
                </div>
            `).join('');
        } else {
            codeList.innerHTML = '<div class="empty-state">' + i18n.t('profile.noCodeHistory') + '</div>';
        }
    } catch (e) {
        console.error(i18n.t('profile.loadCodeHistoryFailed'), e);
    }
}

function openCodeRenewModal() {
    const modal = document.getElementById('codeRenewModal');
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    } else {
        // 关闭默认的createModal
        const createModal = document.getElementById('createModal');
        if (createModal) createModal.classList.remove('active');
    }
}

async function submitCodeRenew() {
    const code = document.getElementById('renewCode').value.trim();
    if (!code) {
        showToast(i18n.t('profile.enterCode'));
        return;
    }

    try {
        const result = await post('/auth/invitation-codes/use', { code });
        if (result.message) {
            showToast(i18n.t('profile.renewSuccess', { date: new Date(result.subscription_end).toLocaleDateString('zh-CN') }));
            closeModal('codeRenewModal');
            document.getElementById('renewCode').value = '';
            loadProfile();
        } else if (result.detail) {
            showToast(result.detail);
        }
    } catch (e) {
        showToast(e.message || i18n.t('profile.renewFailed'));
    }
}

window.loadProfile = loadProfile;
window.openCodeRenewModal = openCodeRenewModal;
window.closeModal = closeModal;
window.submitCodeRenew = submitCodeRenew;