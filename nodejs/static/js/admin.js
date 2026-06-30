async function loadAdmin() {
    await Promise.all([
        loadInvitationCodes(),
        loadUsers()
    ]);
}

async function loadInvitationCodes() {
    const container = document.getElementById('invitationCodesList');
    if (!container) return;
    
    try {
        const codes = await get('/admin/invitation-codes');
        
        if (!codes || codes.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无邀请码</div>';
            return;
        }
        
        container.innerHTML = codes.map(c => `
            <div class="code-item">
                <div class="code-info">
                    <div class="code-value">${c.code}</div>
                    <div class="code-meta">有效期: ${c.duration_days}天 | ${c.status === 'unused' ? '未使用' : '已使用'}</div>
                </div>
                <div class="code-status ${c.status === 'unused' ? 'status-active' : 'status-used'}">
                    ${c.status === 'unused' ? '可用' : '已用'}
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div class="error-tip">加载失败</div>';
    }
}

async function loadUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    try {
        const users = await get('/admin/users');
        
        if (!users || users.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无用户</div>';
            return;
        }
        
        container.innerHTML = users.map(u => `
            <div class="user-item">
                <div class="user-info">
                    <div class="user-name">${u.username} ${u.is_admin ? '<span class="admin-badge">管理员</span>' : ''}</div>
                    <div class="user-meta">${u.email || '无邮箱'} | 有效期: ${u.subscription_end ? u.subscription_end.split('T')[0] : '无'}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<div class="error-tip">加载失败</div>';
    }
}

function openGenerateCodeModal() {
    const count = prompt('生成数量:', '1');
    if (!count) return;
    
    const days = prompt('有效天数:', '365');
    if (!days) return;
    
    generateCodes(parseInt(count), parseInt(days));
}

async function generateCodes(count, days) {
    try {
        const result = await post('/admin/invitation-codes/generate', {
            count: count,
            duration_days: days
        });
        
        if (result.codes && result.codes.length > 0) {
            showToast(`成功生成 ${result.codes.length} 个邀请码`);
            loadInvitationCodes();
        }
    } catch (e) {
        showToast('生成失败');
    }
}

window.loadAdmin = loadAdmin;
window.openGenerateCodeModal = openGenerateCodeModal;
