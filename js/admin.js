// ================== 用户管理面板逻辑 ==================

// 确保API正确初始化
function ensureApiReady() {
  if (!window.api) {
    console.error('❌ window.api 未定义，尝试重新初始化...');
    if (window.apiService) {
      window.api = {
        addUser: (user) => window.apiService.addUser(user),
        getUsers: () => window.apiService.getUsers(),
        updateUser: (user) => window.apiService.updateUser(user.username, user),
        deleteUser: (username) => window.apiService.deleteUser(username),
        toggleUserStatus: (username, status) => window.apiService.toggleUserStatus(username, status)
      };
      console.log('🔧 已重新初始化基本API方法');
    } else {
      throw new Error('window.apiService 也未定义，无法初始化API');
    }
  }

  if (typeof window.api.addUser !== 'function') {
    console.error('❌ window.api.addUser 不是函数，尝试修复...');
    if (window.apiService && typeof window.apiService.addUser === 'function') {
      window.api.addUser = (user) => window.apiService.addUser(user);
      console.log('🔧 已修复 addUser 方法');
    } else {
      throw new Error('无法修复 addUser 方法');
    }
  }
}

// 创建用户项元素
function createUserItem(user) {
  const template = document.getElementById('user-item-template');
  const userItem = template.content.cloneNode(true);

  const roleDisplay = getRoleText(user.role);

  // 设置用户信息
  const userName = userItem.querySelector('.user-name');
  userName.textContent = user.username;

  // 如果用户被禁用，添加禁用样式
  if (user.status === 'disabled') {
    userName.style.textDecoration = 'line-through';
    userName.style.opacity = '0.6';
    userName.title = '该用户已被禁用';
  }

  userItem.querySelector('.user-phone').textContent = user.phone ? '手机号: ' + user.phone : '未设置手机号';

  // 设置角色徽章
  const badge = userItem.querySelector('.user-badge');
  badge.textContent = roleDisplay;
  badge.className = `user-badge role-${user.role}`;

  // 如果用户被禁用，角色徽章也添加禁用样式
  if (user.status === 'disabled') {
    badge.style.opacity = '0.6';
    badge.title = '已禁用';
  }

  // 设置按钮事件
  const editBtn = userItem.querySelector('.action-btn-edit');
  const toggleBtn = userItem.querySelector('.action-btn-toggle');
  const deleteBtn = userItem.querySelector('.action-btn-delete');

  editBtn.onclick = () => editUser(user.username);
  toggleBtn.onclick = () => toggleUserStatus(user.username, user.status);
  deleteBtn.onclick = () => confirmDeleteUser(user.username);

  // 设置禁用/启用按钮的状态和文本
  updateToggleButton(toggleBtn, user.status);

  return userItem;
}

// 创建在线用户项元素
function createOnlineUserItem(user) {
  const template = document.getElementById('online-user-item-template');
  const onlineUserItem = template.content.cloneNode(true);

  // 设置用户信息
  onlineUserItem.querySelector('.user-name').textContent = user.username;
  onlineUserItem.querySelector('.user-phone').textContent = user.phone;
  onlineUserItem.querySelector('.user-login-time').textContent = `登录时间: ${user.loginTime}`;

  // 设置角色徽章
  const badge = onlineUserItem.querySelector('.user-role-badge');
  badge.textContent = user.role;
  badge.className = `user-role-badge role-${user.role === '管理员' ? 'admin' : user.role === '监控人员' ? 'monitor' : 'driver'}`;

  return onlineUserItem;
}

// 创建日志项元素
function createLogItem(log) {
  const template = document.getElementById('log-item-template');
  const logItem = template.content.cloneNode(true);

  // 操作类型图标和颜色
  const actionIcons = {
    'login': { icon: 'fa-sign-in', color: '#28a745' },
    'logout': { icon: 'fa-sign-out', color: '#6c757d' },
    'addUser': { icon: 'fa-user-plus', color: '#007bff' },
    'deleteUser': { icon: 'fa-user-times', color: '#dc3545' },
    'updateUser': { icon: 'fa-user-edit', color: '#ffc107' }
  };

  const actionInfo = actionIcons[log.action] || { icon: 'fa-info-circle', color: '#6c757d' };

  // 设置图标
  const icon = logItem.querySelector('.log-icon');
  icon.className = `log-icon fa ${actionInfo.icon}`;
  icon.style.color = actionInfo.color;

  // 设置内容
  logItem.querySelector('.log-user').textContent = log.user || '系统';
  logItem.querySelector('.log-action').textContent = getActionText(log.action);
  logItem.querySelector('.log-time').textContent = new Date(log.time).toLocaleString();

  // 设置角色徽章
  // 设置日志级别徽章
  const levelBadge = logItem.querySelector('.log-level-badge');
  const logLevel = log.level || 'info';
  levelBadge.textContent = getLevelText(logLevel);
  levelBadge.className = 'badge me-2';

  // 设置日志级别对应的颜色样式
  if (logLevel === 'error') {
    levelBadge.style.backgroundColor = '#d32f2f';
    levelBadge.style.color = '#fff';
  } else if (logLevel === 'warning') {
    levelBadge.style.backgroundColor = '#f57c00';
    levelBadge.style.color = '#fff';
  } else if (logLevel === 'info') {
    levelBadge.style.backgroundColor = '#1976d2';
    levelBadge.style.color = '#fff';
  } else if (logLevel === 'success') {
    levelBadge.style.backgroundColor = '#388e3c';
    levelBadge.style.color = '#fff';
  }
  levelBadge.style.fontWeight = 'bold';

  // 角色徽章显示（只对用户操作日志显示）
  const roleBadge = logItem.querySelector('.log-role-badge');
  if (log.role && log.user !== 'System') {
    const roleText = getRoleText(log.role);
    roleBadge.textContent = roleText;
    roleBadge.className = 'badge ms-2';

    // 设置角色对应的颜色样式（和在线用户界面保持一致）
    if (roleText === '管理员') {
      roleBadge.style.backgroundColor = '#1976d2';
      roleBadge.style.color = '#fff';
    } else if (roleText === '监控人员') {
      roleBadge.style.backgroundColor = '#43a047';
      roleBadge.style.color = '#fff';
    } else if (roleText === '驾驶员') {
      roleBadge.style.backgroundColor = '#fbc02d';
      roleBadge.style.color = '#23272e';
    }
    roleBadge.style.fontWeight = 'bold';
    roleBadge.style.display = 'inline-block';
  } else {
    roleBadge.style.display = 'none';
  }

  // 设置下载按钮（仅对系统日志的error和warning级别显示）
  const downloadBtn = logItem.querySelector('.log-download-btn');
  if (log.user === 'System' && (logLevel === 'error' || logLevel === 'warning')) {
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => downloadLogItem(log);
  } else {
    downloadBtn.style.display = 'none';
  }

  // 设置详情（美化显示）
  const detail = logItem.querySelector('.log-detail');
  if (log.detail || log.error || log.stack) {
    detail.innerHTML = formatLogDetailHtml(log);
    detail.style.display = 'block';
  } else {
    detail.style.display = 'none';
  }

  return logItem;
}

let userFilter = {
  search: '',
  role: '',
  sort: 'username',
  page: 1,
  pageSize: 10
};
let userIdToDelete = null;

async function loadUsers() {
  try {
    console.log('🔄 正在从API加载用户数据...');

    // 构建查询参数
    const params = {};
    if (userFilter.role) params.role = userFilter.role;
    if (userFilter.search) params.search = userFilter.search;

    // 从API获取所有符合条件的用户数据
    const response = await window.api.getUsers(params);

    // 标准化响应数据处理
    let allUsers = [];
    if (response) {
      if (Array.isArray(response)) {
        // 直接返回数组格式
        allUsers = response;
      } else if (response.data && Array.isArray(response.data.users)) {
        // 标准API响应格式：{data: {users: [...]}}
        allUsers = response.data.users;
      } else if (response.data && Array.isArray(response.data)) {
        // 简化API响应格式：{data: [...]}
        allUsers = response.data;
      } else if (Array.isArray(response.users)) {
        // 直接users字段：{users: [...]}
        allUsers = response.users;
      } else {
        console.warn('未知的用户数据格式:', response);
        allUsers = [];
      }
    }

    // 确保每个用户都有状态字段
    allUsers = allUsers.map(user => ({
      ...user,
      status: user.status || 'active' // 默认状态为活跃
    }));

    console.log(`✅ 获取到 ${allUsers.length} 个用户数据`);

    // 前端进行搜索筛选（如果后端没有处理search参数）
    let filtered = allUsers;
    if (userFilter.search && !params.search) {
      filtered = filtered.filter(user =>
        user.username.includes(userFilter.search) || (user.phone && user.phone.includes(userFilter.search))
      );
    }

    // 前端排序
    if (userFilter.sort === 'username') {
      filtered = filtered.sort((a, b) => a.username.localeCompare(b.username));
    } else if (userFilter.sort === 'role') {
      filtered = filtered.sort((a, b) => a.role.localeCompare(b.role));
    }

    // 前端分页
    const total = filtered.length;
    const pageSize = userFilter.pageSize;
    const page = userFilter.page;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageUsers = filtered.slice(start, end);

    // 渲染用户列表
    const list = document.getElementById('userList');
    list.innerHTML = '';

    if (pageUsers.length === 0) {
      list.innerHTML = '<div class="text-center text-muted py-4">暂无用户数据</div>';
    } else {
      pageUsers.forEach(user => {
        const userItem = createUserItem(user);
        list.appendChild(userItem);
      });
    }

    // 渲染分页控件
    renderUserPagination(total, page, pageSize);
  } catch (error) {
    console.error('❌ 加载用户列表失败:', error);

    // 记录网络错误到本地日志
    await logNetworkError('load_users', error, '加载用户列表失败');

    // 根据错误类型显示专业的错误信息
    let errorMessage = '网络连接失败';
    if (error.type === 'NETWORK_ERROR') {
      errorMessage = error.message;
    } else if (error.message && !error.message.includes('is not a function')) {
      errorMessage = error.message;
    }

    // 显示错误信息
    showNetworkError('用户数据', errorMessage);
    const list = document.getElementById('userList');
    list.innerHTML = `<div class="text-center text-danger py-4">${errorMessage}</div>`;

    // 重新抛出错误，让调用者知道操作失败
    throw error;
  }
}

function renderUserPagination(total, page, pageSize) {
  const nav = document.getElementById('userPaginationNav');
  if (!nav) return;
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) {
    nav.innerHTML = '';
    return;
  }
  let html = '<ul class="pagination pagination-sm mb-0">';
  html += `<li class="page-item${page === 1 ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">上一页</a></li>`;
  for (let i = 1; i <= pageCount; i++) {
    html += `<li class="page-item${i === page ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  html += `<li class="page-item${page === pageCount ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">下一页</a></li>`;
  html += '</ul>';
  nav.innerHTML = html;
  // 事件绑定
  nav.querySelectorAll('a.page-link').forEach(a => {
    a.onclick = function(e) {
      e.preventDefault();
      const p = parseInt(this.getAttribute('data-page'));
      if (!isNaN(p) && p >= 1 && p <= pageCount && p !== userFilter.page) {
        userFilter.page = p;
        loadUsers();
      }
    };
  });
}



// 确认删除按钮事件
const deleteUserConfirmBtn = document.getElementById('deleteUserConfirmBtn');
if (deleteUserConfirmBtn) {
  deleteUserConfirmBtn.onclick = async function() {
    if (userIdToDelete) {
      try {
        // 显示加载状态
        this.disabled = true;
        this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 删除中...';

        await actuallyDeleteUser(userIdToDelete);
        userIdToDelete = null;
        closeDeleteUserModal();

        // 显示成功提示
        showToast('用户删除成功', 'success');
      } catch (error) {
        console.error('删除用户失败:', error);

        // 显示具体的错误信息
        showToast(error.message || '删除用户失败，请稍后重试', 'error');
      } finally {
        // 恢复按钮状态
        this.disabled = false;
        this.innerHTML = '确认删除';
      }
    }
  };
}

// 关闭删除确认弹窗
function closeDeleteUserModal() {
  const deleteModal = document.getElementById('deleteUserModal');
  if (deleteModal) {
    // 使用Bootstrap Modal API来隐藏弹窗
    const modal = bootstrap.Modal.getInstance(deleteModal);
    if (modal) {
      modal.hide();
    }
  }
}

async function actuallyDeleteUser(userId) {
  try {
    const result = await window.api.deleteUser(userId);

    // 检查返回结果
    if (result && result.success === true) {
      await loadUsers(); // 重新加载用户列表
    } else {
      throw new Error(result?.message || '删除失败');
    }
  } catch (error) {
    console.error('删除用户API调用失败:', error);

    // 直接抛出错误（API已经标准化了错误消息）
    throw new Error(error.message || '删除失败，请稍后重试');
  }
}



// 确认删除用户函数
window.confirmDeleteUser = function(username) {
  userIdToDelete = username;
  const deleteModal = document.getElementById('deleteUserModal');
  if (deleteModal) {
    // 使用Bootstrap Modal API来显示弹窗
    const modal = new bootstrap.Modal(deleteModal);
    modal.show();
  }
};

// 添加用户相关函数
function openAddUserModal() {
  document.getElementById('addUserModal').style.display = 'flex';
  document.getElementById('modalUser').value = '';
  document.getElementById('modalPwd').value = '';
  document.getElementById('modalRole').value = 'admin';
  document.getElementById('modalPhone').value = '';
  document.getElementById('modalMsg').innerText = '';
}

function closeAddUserModal() {
  document.getElementById('addUserModal').style.display = 'none';
}

// 添加用户按钮事件
document.getElementById('addUserBtn').onclick = async function() {
  const username = document.getElementById('modalUser').value.trim();
  const password = document.getElementById('modalPwd').value;
  const role = document.getElementById('modalRole').value;
  const phone = document.getElementById('modalPhone').value.trim();
  const msg = document.getElementById('modalMsg');
  const btn = document.getElementById('addUserBtn');

  // 表单验证
  if (!username || !password) {
    msg.innerText = '用户名和密码不能为空';
    return;
  }
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    msg.innerText = '手机号格式不正确';
    return;
  }

  // 禁用按钮，防止重复提交
  btn.disabled = true;
  btn.innerText = '添加中...';
  msg.innerText = '';

  try {
    // 确保API就绪
    ensureApiReady();

    // 调用后端API添加用户
    const result = await window.api.addUser({ username, password, role, phone });

    // 检查返回结果
    if (result && result.success === true) {
      msg.style.color = '#28a745';
      msg.innerText = result.message || '添加成功';

      // 记录添加用户日志
      await logUserAction('add_user', `添加用户: ${username} (${role})`, 'info');

      setTimeout(() => {
        closeAddUserModal();
        loadUsers();
      }, 600);
    } else {
      msg.style.color = '#d32f2f';
      msg.innerText = result?.message || '添加失败，请稍后重试';

      // 记录添加用户失败日志
      await logUserAction('add_user_failed', `添加用户失败: ${username} (${role}) - ${result?.message || '未知错误'}`, 'error');
    }
  } catch (error) {
    console.error('添加用户失败:', error);
    msg.style.color = '#d32f2f';

    // 记录网络错误到本地日志
    await logNetworkError('add_user', error, `添加用户失败: ${username} (${role})`);

    // 根据错误类型显示专业的错误信息
    let errorMessage = '网络连接失败';
    if (error.type === 'NETWORK_ERROR') {
      errorMessage = error.message;
    } else if (error.message && !error.message.includes('is not a function')) {
      errorMessage = error.message;
    }

    msg.innerText = errorMessage;
  } finally {
    // 恢复按钮状态
    btn.disabled = false;
    btn.innerText = '添加';
  }
};

// 编辑用户弹窗
window.editUser = function(username) {
  window.api.getUsers().then(users => {
    const user = users.find(u => u.username === username);
    if (!user) return;
    document.getElementById('editModalUser').value = user.username;
    document.getElementById('editModalPwd').value = '';
    document.getElementById('editModalRole').value = user.role;
    document.getElementById('editModalPhone').value = user.phone || '';
    document.getElementById('editModalMsg').innerText = '';
    document.getElementById('editUserModal').style.display = 'flex';
    document.getElementById('editUserBtn').onclick = async function() {
      const newUsername = document.getElementById('editModalUser').value.trim();
      const newPwd = document.getElementById('editModalPwd').value;
      const newRole = document.getElementById('editModalRole').value;
      const newPhone = document.getElementById('editModalPhone').value.trim();
      const msg = document.getElementById('editModalMsg');
      const btn = document.getElementById('editUserBtn');

      // 表单验证
      if (!newUsername) {
        msg.innerText = '用户名不能为空';
        return;
      }
      if (newPhone && !/^1[3-9]\d{9}$/.test(newPhone)) {
        msg.innerText = '手机号格式不正确';
        return;
      }

      // 禁用按钮，防止重复提交
      btn.disabled = true;
      btn.innerText = '保存中...';
      msg.innerText = '';

      try {
        // 调用后端API更新用户
        const result = await window.api.updateUser({ username: newUsername, password: newPwd, role: newRole, phone: newPhone });

        // 检查返回结果
        if (result && result.success === true) {
          msg.style.color = '#28a745';
          msg.innerText = result.message || '保存成功';
          setTimeout(() => {
            closeEditUserModal();
            loadUsers();
          }, 600);
        } else {
          msg.style.color = '#d32f2f';
          msg.innerText = result?.message || '保存失败，请稍后重试';
        }
      } catch (error) {
        console.error('更新用户失败:', error);
        msg.style.color = '#d32f2f';

        // 显示错误信息（API已经标准化了错误消息）
        msg.innerText = error.message || '保存失败，请稍后重试';
      } finally {
        // 恢复按钮状态
        btn.disabled = false;
        btn.innerText = '保存';
      }
    };
  });
};
function closeEditUserModal() {
  document.getElementById('editUserModal').style.display = 'none';
}

// 更新禁用/启用按钮的状态
function updateToggleButton(button, status) {
  const isDisabled = status === 'disabled';

  if (isDisabled) {
    button.className = 'btn btn-success btn-sm action-btn-toggle';
    button.innerHTML = '<i class="fa fa-check me-1"></i>启用';
    button.title = '启用用户';
  } else {
    button.className = 'btn btn-warning btn-sm action-btn-toggle';
    button.innerHTML = '<i class="fa fa-ban me-1"></i>禁用';
    button.title = '禁用用户';
  }
}

// 切换用户状态（禁用/启用）
async function toggleUserStatus(username, currentStatus) {
  const isCurrentlyDisabled = currentStatus === 'disabled';
  const newStatus = isCurrentlyDisabled ? 'active' : 'disabled';
  const action = isCurrentlyDisabled ? '启用' : '禁用';

  // 确认操作
  if (!confirm(`确定要${action}用户 "${username}" 吗？`)) {
    return;
  }

  try {
    console.log(`🔄 正在${action}用户: ${username}`);

    const result = await window.api.toggleUserStatus(username, newStatus);

    if (result && result.success === true) {
      showToast(`用户 ${username} ${action}成功`, 'success');

      // 记录用户状态切换日志
      await logUserAction('toggle_user_status', `${action}用户: ${username} (状态: ${newStatus})`, 'info');

      await loadUsers(); // 重新加载用户列表
    } else {
      // 记录操作失败日志
      await logUserAction('toggle_user_status_failed', `${action}用户失败: ${username} - ${result?.message || '未知错误'}`, 'error');
      throw new Error(result?.message || `${action}失败`);
    }
  } catch (error) {
    console.error(`${action}用户失败:`, error);

    // 记录网络错误到本地日志
    await logNetworkError('toggle_user_status', error, `${action}用户失败: ${username}`);

    // 根据错误类型显示专业的错误信息
    let errorMessage = '网络连接失败';
    if (error.type === 'NETWORK_ERROR') {
      errorMessage = error.message;
    } else if (error.message && !error.message.includes('is not a function')) {
      errorMessage = error.message;
    }

    showToast(errorMessage, 'error');
  }
}



function logout() {
  const modalEl = document.getElementById('logoutModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  // 只绑定一次，避免多次绑定导致卡死
  const confirmBtn = document.getElementById('logoutConfirmBtn');
  confirmBtn.onclick = async function() {
    modal.hide();

    // 记录登出日志
    await logUserAction('logout', '管理员登出系统', 'info');

    window.api.logout && window.api.logout();
    window.location.href = 'login.html';
  };
  // 取消按钮采用data-bs-dismiss="modal"，无需手动绑定事件，Bootstrap会自动关闭弹窗
}

function showPanel(panel) {
  document.getElementById('panel-users').style.display = panel === 'users' ? '' : 'none';
  document.getElementById('panel-online').style.display = panel === 'online' ? '' : 'none';
  document.getElementById('panel-logs').style.display = panel === 'logs' ? '' : 'none';
  document.getElementById('menu-users').classList.toggle('active', panel === 'users');
  document.getElementById('menu-online').classList.toggle('active', panel === 'online');
  document.getElementById('menu-logs').classList.toggle('active', panel === 'logs');
  if (panel === 'online') window.onloadOnlinePanel();
  if (panel === 'logs') loadLogs();
}

async function loadLogs() {
  const logs = await window.api.getLogs();
  const list = document.getElementById('logList');
  list.innerHTML = '';

  if (logs.length === 0) {
    list.innerHTML = '<div class="text-center text-muted py-4">暂无日志记录</div>';
  } else {
    logs.slice().reverse().forEach((log) => {
      const logItem = createLogItem(log);
      list.appendChild(logItem);
    });
  }
}

function getActionText(action) {
  const actionTexts = {
    'login': '登录系统',
    'logout': '退出系统',
    'addUser': '添加用户',
    'deleteUser': '删除用户',
    'updateUser': '更新用户'
  };
  return actionTexts[action] || action;
}

function getRoleText(role) {
  const roleTexts = {
    'admin': '管理员',
    'monitor': '监控人员',
    'driver': '驾驶员'
  };
  return roleTexts[role] || role;
}

function getLevelText(level) {
  const levelTexts = {
    'info': '信息',
    'success': '成功',
    'warning': '警告',
    'error': '错误'
  };
  return levelTexts[level] || level;
}

function formatSessionDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}

function formatLogDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object') {
    return Object.entries(detail).map(([key, value]) => `${key}: ${value}`).join(', ');
  }
  return JSON.stringify(detail);
}

// 美化的日志详情HTML格式化
function formatLogDetailHtml(log) {
  let html = '';

  // 判断是系统日志还是用户日志
  const isSystemLog = log.user === 'System';

  if (isSystemLog) {
    // 系统日志：显示详情、错误信息、堆栈跟踪

    // 基本详情
    if (log.detail) {
      html += `<div class="log-detail-section">
        <span class="log-detail-label">详情:</span>
        <span class="log-detail-content">${formatLogDetail(log.detail)}</span>
      </div>`;
    }

    // 错误信息（美化显示）
    if (log.error) {
      html += `<div class="log-detail-section log-error-section">
        <span class="log-detail-label">
          <i class="fa fa-exclamation-triangle text-danger"></i> 错误信息:
        </span>
        <div class="log-error-content">
          <code class="log-error-message">${log.error}</code>
        </div>
      </div>`;
    }

    // 堆栈跟踪（折叠显示）
    if (log.stack) {
      const stackId = `stack-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      html += `<div class="log-detail-section log-stack-section">
        <span class="log-detail-label">
          <i class="fa fa-code text-warning"></i> 堆栈跟踪:
        </span>
        <div class="log-stack-toggle">
          <button class="btn btn-sm btn-outline-secondary" type="button"
                  data-bs-toggle="collapse" data-bs-target="#${stackId}"
                  aria-expanded="false" style="font-size:11px;padding:2px 8px;">
            <i class="fa fa-chevron-down"></i> 展开详情
          </button>
        </div>
        <div class="collapse mt-2" id="${stackId}">
          <div class="log-stack-content">
            <pre class="log-stack-trace"><code>${log.stack}</code></pre>
          </div>
        </div>
      </div>`;
    }
  } else {
    // 用户日志：显示会话时长等用户相关信息

    if (log.sessionDuration !== undefined) {
      const duration = formatSessionDuration(log.sessionDuration);
      html += `<div class="log-detail-section">
        <span class="log-detail-label">会话时长:</span>
        <span class="log-detail-content">${duration}</span>
      </div>`;
    }

    if (log.detail) {
      html += `<div class="log-detail-section">
        <span class="log-detail-label">详情:</span>
        <span class="log-detail-content">${formatLogDetail(log.detail)}</span>
      </div>`;
    }
  }

  return html;
}

// ================== 在线用户面板逻辑 ==================
let onlineUsersData = [];

let onlineTrendData = [];

// 商业级在线用户数据加载
async function loadOnlineUsers() {
  console.log('🔄 正在从后端API加载在线用户数据...');

  try {
    const response = await window.api.getOnlineUsers();

    // 验证响应数据格式
    if (!response || !response.data) {
      throw new Error('服务器返回数据格式错误');
    }

    onlineUsersData = response.data.onlineUsers || [];
    console.log(`✅ 获取到 ${onlineUsersData.length} 个在线用户数据`);

    renderOnlineUserList();
    return onlineUsersData;

  } catch (error) {
    console.error('❌ 加载在线用户失败:', error);

    // 记录网络错误到本地日志
    await logNetworkError('load_online_users', error, '加载在线用户失败');

    // 根据错误类型显示专业的错误信息
    let errorMessage = '网络连接失败';
    if (error.type === 'NETWORK_ERROR') {
      errorMessage = error.message;
    } else if (error.message && !error.message.includes('is not a function')) {
      errorMessage = error.message;
    }

    showNetworkErrorInOnlinePanel(errorMessage);

    // 重新抛出错误，让调用者知道操作失败
    throw error;
  }
}

// 商业级趋势数据加载（可选数据，失败不影响主要功能）
async function loadOnlineUsersTrend() {
  try {
    console.log('🔄 正在从API加载在线用户趋势数据...');

    const today = new Date().toISOString().split('T')[0];
    const response = await window.api.getOnlineUsersTrend({
      date: today,
      interval: 'hour' // 按小时统计
    });

    // 验证响应数据格式
    if (!response || !response.data) {
      throw new Error('趋势数据格式错误');
    }

    onlineTrendData = response.data.trendData || [];
    console.log(`✅ 获取到在线用户趋势数据:`, onlineTrendData);

    // 重新渲染图表（如果在线用户数据已加载）
    if (onlineUsersData.length > 0) {
      renderOnlineCharts(onlineUsersData);
    }

    return onlineTrendData;

  } catch (error) {
    console.error('❌ 加载在线用户趋势失败:', error);

    // 趋势数据是可选的，失败时显示占位符但不阻止主要功能
    const onlineTrendChart = document.getElementById('onlineTrendChart');
    if (onlineTrendChart) {
      onlineTrendChart.innerHTML = `
        <div class="text-center text-muted p-3">
          <i class="fa fa-exclamation-triangle"></i>
          <p>趋势数据暂时不可用</p>
        </div>
      `;
    }

    // 对于趋势数据，我们不重新抛出错误，因为这不是关键功能
    return [];
  }
}
let onlineFilterRole = '';
let onlineSearchName = '';
let onlineSortType = 'username';

function renderOnlineUserList() {
  // 获取筛选后的用户列表（仅用于显示列表）
  let filteredUsers = onlineUsersData.slice();

  if (onlineFilterRole) filteredUsers = filteredUsers.filter(u=>u.role===onlineFilterRole);
  if (onlineSearchName) filteredUsers = filteredUsers.filter(u=>u.username.includes(onlineSearchName));
  if (onlineSortType==='username') filteredUsers.sort((a,b)=>a.username.localeCompare(b.username));
  else if (onlineSortType==='role') filteredUsers.sort((a,b)=>a.role.localeCompare(b.role));

  // 显示筛选后的用户数量和总用户数量
  const filteredCount = filteredUsers.length;
  const totalCount = onlineUsersData.length;

  // 渲染用户列表（使用筛选后的数据）
  const list = document.getElementById('onlineList');
  if (list) {
    const countText = onlineFilterRole || onlineSearchName ?
      `筛选结果: ${filteredCount} 人 / 总在线用户: ${totalCount} 人` :
      `当前在线用户: ${totalCount} 人`;

    list.innerHTML = `<div class="alert alert-info mb-3 mx-2">${countText}</div>`;

    if (filteredUsers.length === 0) {
      list.innerHTML += '<div class="text-center text-muted py-4 mx-2">没有找到符合条件的用户</div>';
    } else {
      filteredUsers.forEach(user => {
        const onlineUserItem = createOnlineUserItem(user);
        list.appendChild(onlineUserItem);
      });
    }
  }

  // 标签高对比色
  document.querySelectorAll('.user-role-badge').forEach(badge=>{
    const role = badge.getAttribute('data-role');
    if(role==='管理员') badge.style.background='#1976d2';
    else if(role==='监控人员') badge.style.background='#43a047';
    else if(role==='驾驶员') badge.style.background='#fbc02d';
    badge.style.color = (role==='驾驶员') ? '#23272e' : '#fff';
    badge.style.fontWeight = 'bold';
  });

  // 图表始终使用全部在线用户数据，不受筛选影响
  renderOnlineCharts(onlineUsersData);
}

function renderOnlineCharts(users) {
  // 统计各角色在线人数
  const roleStats = {};
  users.forEach(u => {
    const roleText = getRoleText(u.role);
    roleStats[roleText] = (roleStats[roleText] || 0) + 1;
  });
  // 饼图
  const chartDom = document.getElementById('onlineUserChart');
  if (chartDom && window.echarts) {
    const chart = window.echarts.init(chartDom);
    chart.setOption({
      title: { text: '在线用户角色分布', left: 'center', top: 10, textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { fontSize: 12 }
      },
      series: [
        {
          name: '在线用户数',
          type: 'pie',
          radius: ['30%', '60%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          label: { show: true, formatter: '{b}: {c}人' },
          emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold' } },
          data: Object.keys(roleStats).map(role => ({
            name: role,
            value: roleStats[role],
            itemStyle: {
              color: role === '管理员' ? '#1976d2' :
                     role === '监控人员' ? '#43a047' : '#fbc02d'
            }
          }))
        }
      ]
    });
  }

  // 趋势图（使用后端返回的真实历史数据）
  const trendDom = document.getElementById('onlineTrendChart');
  if (trendDom && window.echarts && onlineTrendData.length > 0) {
    const trendChart = window.echarts.init(trendDom);

    // 根据当前筛选角色设置图表标题和颜色
    let chartTitle = '今日在线人数趋势';
    let legendText = '所有角色';
    let lineColor = '#91cc75';

    if (onlineFilterRole) {
      chartTitle = `今日${onlineFilterRole}在线人数趋势`;
      legendText = onlineFilterRole;
      // 根据角色设置不同颜色
      if (onlineFilterRole === '管理员') {
        lineColor = '#1976d2';
      } else if (onlineFilterRole === '监控人员') {
        lineColor = '#43a047';
      } else if (onlineFilterRole === '驾驶员') {
        lineColor = '#fbc02d';
      }
    }

    // 从后端趋势数据中提取时间和数值
    const timeLabels = onlineTrendData.map(item => item.time || item.hour);
    let trendValues;

    if (onlineFilterRole) {
      // 如果有角色筛选，使用对应角色的数据
      const roleKey = onlineFilterRole === '管理员' ? 'admin' :
                     onlineFilterRole === '监控人员' ? 'monitor' : 'driver';
      trendValues = onlineTrendData.map(item => item[roleKey] || 0);
    } else {
      // 没有筛选时，使用总数
      trendValues = onlineTrendData.map(item => item.total || 0);
    }

    trendChart.setOption({
      title: { text: chartTitle, left: 'center', top: 10, textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `${params[0].axisValue}: ${params[0].value}人在线<br/>角色: ${legendText}`;
        }
      },
      legend: {
        data: [legendText],
        bottom: 10,
        textStyle: { fontSize: 12 }
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        axisLabel: { interval: 1 }
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: legendText,
        type: 'line',
        data: trendValues,
        smooth: true,
        itemStyle: { color: lineColor },
        areaStyle: { color: hexToRgba(lineColor, 0.3) },
        symbol: 'circle',
        symbolSize: 6
      }]
    });
  } else if (trendDom && window.echarts) {
    // 如果没有趋势数据，显示提示信息
    const trendChart = window.echarts.init(trendDom);
    trendChart.setOption({
      title: {
        text: '暂无趋势数据',
        left: 'center',
        top: 'middle',
        textStyle: { fontSize: 14, color: '#999' }
      }
    });
  }
}

// 辅助函数：将十六进制颜色转换为rgba
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initOnlinePanelUI() {
  // 类型筛选
  const roleSel = document.getElementById('onlineRoleFilter');
  if (roleSel) {
    roleSel.onchange = function() {
      onlineFilterRole = this.value;
      renderOnlineUserList();
      // 角色筛选变化时，重新渲染图表以显示对应角色的趋势
      renderOnlineCharts(onlineUsersData);
    };
  }
  // 排序
  const sortSel = document.getElementById('onlineSortSelect');
  if (sortSel) {
    sortSel.onchange = function() {
      onlineSortType = this.value;
      renderOnlineUserList();
    };
  }
  // 搜索
  const searchInput = document.getElementById('onlineSearchInput');
  if (searchInput) {
    searchInput.oninput = function() {
      onlineSearchName = this.value.trim();
      renderOnlineUserList();
    };
  }
  // 刷新
  const refreshBtn = document.getElementById('onlineRefreshBtn');
  if (refreshBtn) {
    refreshBtn.onclick = async function() {
      // 显示加载状态
      this.disabled = true;
      this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 刷新中...';

      try {
        // 重新从后端获取在线用户数据（关键数据）
        await loadOnlineUsers();

        // 重新获取趋势数据（可选数据，失败不影响成功提示）
        try {
          await loadOnlineUsersTrend();
        } catch (trendError) {
          console.warn('趋势数据加载失败，但主要数据加载成功:', trendError);
        }

        showToast('在线用户数据刷新成功', 'success');
      } catch (error) {
        console.error('刷新在线用户数据失败:', error);

        // 根据错误类型显示专业的错误信息
        let errorMessage = '网络连接失败';
        if (error.type === 'NETWORK_ERROR') {
          errorMessage = error.message;
        } else if (error.message && !error.message.includes('is not a function')) {
          errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
      } finally {
        // 恢复按钮状态
        this.disabled = false;
        this.innerHTML = '<i class="fa fa-refresh"></i> 刷新';
      }
    };
  }

  renderOnlineUserList();
}

window.onloadOnlinePanel = function() {
  // 加载在线用户数据
  loadOnlineUsers();

  if (!window.echarts) {
    const script = document.createElement('script');
    script.src = './node_modules/echarts/dist/echarts.min.js';
    script.onload = () => initOnlinePanelUI();
    script.onerror = () => initOnlinePanelUI();
    document.head.appendChild(script);
  } else {
    initOnlinePanelUI();
  }
}

// 搜索、筛选、排序事件绑定
window.addEventListener('DOMContentLoaded', function() {
  document.getElementById('userSearchBtn').onclick = function() {
    userFilter.search = document.getElementById('userSearchInput').value.trim();
    loadUsers();
  };
  document.getElementById('userSearchInput').onkeydown = function(e) {
    if (e.key === 'Enter') {
      userFilter.search = this.value.trim();
      loadUsers();
    }
  };
  document.getElementById('userRoleFilter').onchange = function() {
    userFilter.role = this.value;
    loadUsers();
  };
  document.getElementById('userSortSelect').onchange = function() {
    userFilter.sort = this.value;
    loadUsers();
  };
  document.getElementById('userPageSizeSelect').onchange = function() {
    userFilter.pageSize = parseInt(this.value);
    userFilter.page = 1;
    loadUsers();
  };
});

window.onload = function() {
  // 确保API就绪
  try {
    ensureApiReady();
    console.log('✅ API检查通过，开始加载页面数据');
  } catch (error) {
    console.error('❌ API初始化失败:', error);
    alert('系统初始化失败，请刷新页面重试');
    return;
  }

  // 绑定事件监听器
  bindEventListeners();

  // 商业级数据加载 - 独立处理每个数据源
  initializePageData();
  showPanel('users');
};

// 商业级页面数据初始化
async function initializePageData() {
  // 并行加载不相关的数据源
  const loadPromises = [
    loadUsersWithErrorHandling(),
    loadLocalLogsWithErrorHandling()
  ];

  // 等待所有数据加载完成（失败的不影响其他数据）
  await Promise.allSettled(loadPromises);
}

// 带错误处理的用户数据加载
async function loadUsersWithErrorHandling() {
  try {
    await loadUsers();
  } catch (error) {
    console.error('初始用户数据加载失败:', error);
    // 错误已经在loadUsers中处理，这里不需要额外操作
  }
}

// 带错误处理的日志数据加载
async function loadLocalLogsWithErrorHandling() {
  try {
    await loadLocalLogs();
  } catch (error) {
    console.error('初始日志数据加载失败:', error);
    // 日志加载失败不影响其他功能
  }
}

// 绑定所有事件监听器
function bindEventListeners() {
  // 导航相关
  const menuUsers = document.getElementById('menu-users');
  if (menuUsers) {
    menuUsers.onclick = (e) => { e.preventDefault(); showPanel('users'); };
  }

  const menuOnline = document.getElementById('menu-online');
  if (menuOnline) {
    menuOnline.onclick = (e) => { e.preventDefault(); showPanel('online'); };
  }

  const menuLogs = document.getElementById('menu-logs');
  if (menuLogs) {
    menuLogs.onclick = (e) => { e.preventDefault(); showPanel('logs'); };
  }

  // 登出按钮
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }

  // 添加用户相关
  const openAddUserBtn = document.getElementById('openAddUserBtn');
  if (openAddUserBtn) {
    openAddUserBtn.onclick = openAddUserModal;
  }

  const closeAddUserModalBtn = document.getElementById('closeAddUserModalBtn');
  if (closeAddUserModalBtn) {
    closeAddUserModalBtn.onclick = closeAddUserModal;
  }

  const cancelAddUserBtn = document.getElementById('cancelAddUserBtn');
  if (cancelAddUserBtn) {
    cancelAddUserBtn.onclick = closeAddUserModal;
  }

  // 编辑用户相关
  const closeEditUserModalBtn = document.getElementById('closeEditUserModalBtn');
  if (closeEditUserModalBtn) {
    closeEditUserModalBtn.onclick = closeEditUserModal;
  }

  const cancelEditUserBtn = document.getElementById('cancelEditUserBtn');
  if (cancelEditUserBtn) {
    cancelEditUserBtn.onclick = closeEditUserModal;
  }

  // 日志相关
  const refreshLogsBtn = document.getElementById('refreshLogsBtn');
  if (refreshLogsBtn) {
    refreshLogsBtn.onclick = refreshLogsFromLocal;
  }

  const exportLogsBtn = document.getElementById('exportLogsBtn');
  if (exportLogsBtn) {
    exportLogsBtn.onclick = exportLogsToLocal;
  }

  const deleteLogsBtn = document.getElementById('deleteLogsBtn');
  if (deleteLogsBtn) {
    deleteLogsBtn.onclick = () => {
      const modal = new bootstrap.Modal(document.getElementById('deleteLogsModal'));
      modal.show();
    };
  }

  const confirmDeleteLogsBtn = document.getElementById('confirmDeleteLogsBtn');
  if (confirmDeleteLogsBtn) {
    confirmDeleteLogsBtn.onclick = deleteLocalLogs;
  }
}

// ================== 商业级网络错误处理 ==================
function showNetworkError(dataType, customMessage = null) {
  const errorMessage = customMessage || `无法加载${dataType}，请检查网络连接或刷新页面重试。`;

  const errorHtml = `
    <div class="alert alert-danger text-center">
      <i class="fa fa-exclamation-triangle"></i>
      <strong>网络连接失败</strong><br>
      ${errorMessage}
      <br><br>
      <button class="btn btn-sm btn-primary" onclick="location.reload()">
        <i class="fa fa-refresh"></i> 刷新页面
      </button>
    </div>
  `;

  // 根据数据类型显示错误信息
  if (dataType === '用户数据') {
    const userList = document.getElementById('userList');
    if (userList) userList.innerHTML = errorHtml;
  } else if (dataType === '在线用户数据') {
    const onlineList = document.getElementById('onlineList');
    if (onlineList) onlineList.innerHTML = errorHtml;
  } else if (dataType === '系统日志') {
    const logList = document.getElementById('logList');
    if (logList) logList.innerHTML = errorHtml;
  }
}

// 在线用户面板显示网络错误
function showNetworkErrorInOnlinePanel(message) {
  const onlineUserList = document.getElementById('onlineUserList');
  if (onlineUserList) {
    onlineUserList.innerHTML = `
      <div class="network-error">
        <i class="fa fa-exclamation-triangle"></i>
        <p>${message}</p>
        <button onclick="loadOnlineUsers()" class="btn btn-primary btn-sm">
          <i class="fa fa-refresh"></i> 重试
        </button>
      </div>
    `;
  }

  // 也在趋势图区域显示错误
  const onlineTrendChart = document.getElementById('onlineTrendChart');
  if (onlineTrendChart) {
    onlineTrendChart.innerHTML = `
      <div class="network-error">
        <i class="fa fa-exclamation-triangle"></i>
        <p>无法加载趋势数据</p>
      </div>
    `;
  }
}

// ================== 系统日志管理 ==================
let localLogs = [];

// 首次加载：读取本地日志
async function loadLocalLogs() {
  try {
    console.log('📖 正在读取本地日志文件...');

    if (typeof window.api !== 'undefined' && window.api.getLocalLogs) {
      localLogs = await window.api.getLocalLogs();
      console.log(`✅ 读取到 ${localLogs.length} 条本地日志`);
    } else {
      console.log('⚠️ Electron API不可用，使用空日志');
      localLogs = [];
    }

    renderLocalLogs();
  } catch (error) {
    console.error('❌ 读取本地日志失败:', error);
    localLogs = [];
    renderLocalLogs();
  }
}

// 刷新本地日志文件
async function refreshLogsFromLocal() {
  // 获取刷新按钮并设置加载状态
  const refreshBtn = document.getElementById('refreshLogsBtn');

  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 刷新中...';
  }

  try {
    console.log('🔄 正在重新加载本地日志文件...');

    // 重新加载本地logs.json文件
    await loadLocalLogs();

    console.log(`✅ 重新加载完成，当前共 ${localLogs.length} 条日志`);

    showToast(`成功刷新本地日志，当前共 ${localLogs.length} 条日志`, 'success');

    // 记录刷新日志操作
    await logUserAction('refresh_local_logs', `刷新本地日志文件，当前共 ${localLogs.length} 条日志`, 'info');

  } catch (error) {
    console.error('❌ 刷新本地日志失败:', error);

    // 记录错误到本地日志
    await logUserAction('refresh_local_logs_failed', `刷新本地日志失败: ${error.message}`, 'error');

    showToast('刷新本地日志失败，请检查日志文件是否存在', 'error');
  } finally {
    // 恢复按钮状态
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<i class="fa fa-refresh"></i> 刷新';
    }
  }
}

// 导出本地日志为美观的文本格式
async function exportLogsToLocal() {
  try {
    console.log('📥 正在导出本地日志文件...');

    if (localLogs.length === 0) {
      showToast('没有本地日志数据可以导出', 'warning');
      return;
    }

    // 生成美观的文本格式
    const textContent = generateLogTextContent(localLogs);

    if (typeof window.api !== 'undefined' && window.api.saveTextFile) {
      // Electron环境：弹窗选择保存位置
      const result = await window.api.saveTextFile(textContent, 'system_logs.txt');

      if (result.success) {
        showToast(`成功导出 ${localLogs.length} 条日志到 ${result.filePath}`, 'success');
      } else {
        throw new Error(result.message);
      }
    } else {
      // Web环境：创建下载链接
      const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'system_logs.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`成功下载 ${localLogs.length} 条日志到 system_logs.txt`, 'success');
    }
  } catch (error) {
    console.error('❌ 导出本地日志失败:', error);
    showToast('导出本地日志文件失败', 'error');
  }
}

// 生成美观的日志文本格式
function generateLogTextContent(logs) {
  const header = `
================================================================================
                              系统日志报告
================================================================================
导出时间: ${new Date().toLocaleString('zh-CN')}
日志总数: ${logs.length} 条
================================================================================

`;

  let content = header;

  // 按时间分组日志
  const logsByDate = {};
  logs.forEach(log => {
    const date = new Date(log.time).toLocaleDateString('zh-CN');
    if (!logsByDate[date]) {
      logsByDate[date] = [];
    }
    logsByDate[date].push(log);
  });

  // 按日期排序并生成内容
  Object.keys(logsByDate).sort().forEach(date => {
    content += `\n📅 ${date}\n`;
    content += '─'.repeat(80) + '\n';

    logsByDate[date].forEach((log, index) => {
      const time = new Date(log.time).toLocaleTimeString('zh-CN');
      const levelIcon = getLevelIcon(log.level);
      const userInfo = log.user ? `[${log.user}${log.role ? `/${log.role}` : ''}]` : '[系统]';

      content += `\n${index + 1}. ${levelIcon} ${time} ${userInfo}\n`;
      content += `   操作: ${log.action}\n`;
      content += `   详情: ${log.detail}\n`;

      if (log.error) {
        content += `   错误: ${log.error}\n`;
      }

      if (log.stack) {
        content += `   堆栈: ${log.stack.substring(0, 200)}...\n`;
      }

      content += '\n';
    });
  });

  // 添加统计信息
  const stats = generateLogStats(logs);
  content += '\n\n';
  content += '================================================================================\n';
  content += '                              统计信息\n';
  content += '================================================================================\n';
  content += stats;

  content += '\n\n';
  content += '================================================================================\n';
  content += '                            报告生成完成\n';
  content += '================================================================================\n';

  return content;
}

// 获取日志级别图标
function getLevelIcon(level) {
  const icons = {
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'success': '✅',
    'debug': '🔍'
  };
  return icons[level] || 'ℹ️';
}

// 生成日志统计信息
function generateLogStats(logs) {
  const stats = {
    total: logs.length,
    byLevel: {},
    byUser: {},
    byAction: {},
    timeRange: {
      start: null,
      end: null
    }
  };

  logs.forEach(log => {
    // 按级别统计
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

    // 按用户统计
    const user = log.user || '系统';
    stats.byUser[user] = (stats.byUser[user] || 0) + 1;

    // 按操作统计
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

    // 时间范围
    const logTime = new Date(log.time);
    if (!stats.timeRange.start || logTime < stats.timeRange.start) {
      stats.timeRange.start = logTime;
    }
    if (!stats.timeRange.end || logTime > stats.timeRange.end) {
      stats.timeRange.end = logTime;
    }
  });

  let statsText = '';

  // 基本统计
  statsText += `总日志数: ${stats.total}\n`;
  if (stats.timeRange.start && stats.timeRange.end) {
    statsText += `时间范围: ${stats.timeRange.start.toLocaleString('zh-CN')} ~ ${stats.timeRange.end.toLocaleString('zh-CN')}\n\n`;
  }

  // 按级别统计
  statsText += '按级别统计:\n';
  Object.entries(stats.byLevel).sort((a, b) => b[1] - a[1]).forEach(([level, count]) => {
    const icon = getLevelIcon(level);
    statsText += `  ${icon} ${level}: ${count} 条\n`;
  });

  // 按用户统计（前10名）
  statsText += '\n按用户统计 (前10名):\n';
  Object.entries(stats.byUser).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([user, count]) => {
    statsText += `  👤 ${user}: ${count} 条\n`;
  });

  // 按操作统计（前10名）
  statsText += '\n按操作统计 (前10名):\n';
  Object.entries(stats.byAction).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([action, count]) => {
    statsText += `  🔧 ${action}: ${count} 条\n`;
  });

  return statsText;
}

// 删除本地日志文件（通过事件监听器调用）

async function deleteLocalLogs() {
  try {
    console.log('🗑️ 正在删除本地日志文件...');

    if (typeof window.api !== 'undefined' && window.api.deleteLocalLogsFile) {
      const result = await window.api.deleteLocalLogsFile();

      if (result.success) {
        // 清空本地日志数组并重新渲染
        localLogs = [];
        renderLocalLogs();

        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteLogsModal'));
        modal.hide();

        console.log('✅ 本地日志文件删除成功');
        showToast('本地日志文件已删除', 'success');

        // 记录删除日志操作
        await logUserAction('delete_logs_file', '删除本地日志文件', 'warning');
      } else {
        throw new Error(result.message || '删除失败');
      }
    } else {
      showToast('此功能仅在Electron环境中可用', 'warning');
    }
  } catch (error) {
    console.error('❌ 删除本地日志文件失败:', error);
    showToast(error.message || '删除失败，请稍后重试', 'error');
  }
}

// 下载单个日志项
function downloadLogItem(log) {
  try {
    const logData = {
      时间: new Date(log.time).toLocaleString(),
      用户: log.user || '系统',
      操作: getActionText(log.action),
      级别: getLevelText(log.level || 'info'),
      角色: log.role ? getRoleText(log.role) : '无',
      详情: log.detail ? formatLogDetail(log.detail) : '无',
      错误信息: log.error || '无',
      堆栈跟踪: log.stack || '无'
    };

    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `日志_${log.level}_${new Date(log.time).toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ 日志项下载成功: ${log.level} - ${log.action}`);
  } catch (error) {
    console.error('❌ 下载日志项失败:', error);
    alert('下载失败，请稍后重试');
  }
}

// 渲染本地日志
function renderLocalLogs() {
  const list = document.getElementById('logList');
  if (!list) return;

  if (localLogs.length === 0) {
    list.innerHTML = '<div class="text-center text-muted py-4">暂无本地日志数据<br><small>点击"刷新"获取最新日志</small></div>';
    return;
  }

  list.innerHTML = '';
  // 按时间倒序显示（最新的在前面）
  const sortedLogs = [...localLogs].sort((a, b) => new Date(b.time) - new Date(a.time));

  sortedLogs.forEach(log => {
    const logItem = createLogItem(log);
    list.appendChild(logItem);
  });
}

// ================== 日志发送到后端功能 ==================

// 发送日志到后端
async function sendLogToBackend(logData) {
  try {
    // 构造标准日志格式
    const logEntry = {
      time: new Date().toISOString(),
      user: logData.user || 'Unknown',
      action: logData.action,
      level: logData.level || 'info',
      detail: logData.detail || '',
      role: logData.role || null,
      error: logData.error || null,
      stack: logData.stack || null
    };

    console.log('📤 发送日志到后端:', logEntry);

    // 调用后端API
    await window.api.addLog(logEntry);
    console.log('✅ 日志已发送到后端');
  } catch (error) {
    console.warn('⚠️ 发送日志到后端失败:', error);
    // 不抛出错误，避免影响主要功能
  }
}

// 记录用户操作日志（同时发送到后端）
async function logUserAction(action, detail, level = 'info', user = null) {
  const currentUser = await getCurrentUserSafely();
  const logData = {
    user: user || currentUser?.username || 'Unknown',
    action: action,
    level: level,
    detail: detail,
    role: currentUser?.role || null
  };

  // 发送到后端
  await sendLogToBackend(logData);

  // 同时添加到本地日志（如果是Electron环境）
  if (window.api && window.api.addLog) {
    try {
      await window.api.addLog(logData);
    } catch (error) {
      console.warn('⚠️ 添加本地日志失败:', error);
    }
  }
}

// 安全获取当前用户信息
async function getCurrentUserSafely() {
  try {
    return await window.api.getCurrentUser();
  } catch (error) {
    console.warn('⚠️ 获取当前用户失败:', error);
    return null;
  }
}

// 记录网络错误到本地日志
async function logNetworkError(action, error, detail = '') {
  try {
    const currentUser = await getCurrentUserSafely();
    const logData = {
      time: new Date().toISOString(),
      user: currentUser?.username || 'Unknown',
      action: `network_error_${action}`,
      level: 'error',
      detail: `网络错误: ${detail || action}`,
      role: currentUser?.role || null,
      error: error.message || '网络连接失败',
      stack: error.stack || null
    };

    console.log('📝 记录网络错误到本地日志:', logData);

    // 只记录到本地日志（因为网络有问题，无法发送到后端）
    if (window.api && window.api.addLog) {
      await window.api.addLog(logData);
      console.log('✅ 网络错误已记录到本地日志');
    }
  } catch (logError) {
    console.warn('⚠️ 记录网络错误日志失败:', logError);
    // 不抛出错误，避免影响主要功能
  }
}
