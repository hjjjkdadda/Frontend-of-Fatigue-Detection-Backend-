// ================== 用户管理面板逻辑 ==================

// 创建用户项元素
function createUserItem(user) {
  const template = document.getElementById('user-item-template');
  const userItem = template.content.cloneNode(true);

  const roleDisplay = getRoleText(user.role);

  // 设置用户信息
  userItem.querySelector('.user-name').textContent = user.username;
  userItem.querySelector('.user-phone').textContent = user.phone ? '手机号: ' + user.phone : '未设置手机号';

  // 设置角色徽章
  const badge = userItem.querySelector('.user-badge');
  badge.textContent = roleDisplay;
  badge.className = `user-badge role-${user.role}`;

  // 设置按钮事件
  const editBtn = userItem.querySelector('.action-btn-edit');
  const deleteBtn = userItem.querySelector('.action-btn-delete');

  editBtn.onclick = () => editUser(user.username);
  deleteBtn.onclick = () => confirmDeleteUser(user.username);

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
  const roleBadge = logItem.querySelector('.log-role-badge');
  if (log.role) {
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
  } else {
    roleBadge.style.display = 'none';
  }

  // 设置详情
  const detail = logItem.querySelector('.log-detail');
  if (log.detail) {
    detail.textContent = `详情: ${formatLogDetail(log.detail)}`;
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
    const response = await window.apiService.getUsers(params);
    const allUsers = response.data.users || [];

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
    showNetworkError('用户数据');
    const list = document.getElementById('userList');
    list.innerHTML = '<div class="text-center text-danger py-4">加载用户列表失败，请刷新页面重试</div>';
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
      } catch (error) {
        console.error('删除用户失败:', error);
        alert('删除用户失败，请稍后重试');
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
    await window.api.deleteUser(userId);
    await loadUsers(); // 重新加载用户列表
  } catch (error) {
    console.error('删除用户API调用失败:', error);
    throw error; // 重新抛出错误，让调用者处理
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
document.getElementById('addUserBtn').onclick = async function() {
  const username = document.getElementById('modalUser').value;
  const password = document.getElementById('modalPwd').value;
  const role = document.getElementById('modalRole').value;
  const phone = document.getElementById('modalPhone').value;
  const msg = document.getElementById('modalMsg');
  if (!username || !password) {
    msg.innerText = '用户名和密码不能为空';
    return;
  }
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    msg.innerText = '手机号格式不正确';
    return;
  }
  const users = await window.api.getUsers();
  if (users.find(u => u.username === username)) {
    msg.innerText = '用户名已存在';
    return;
  }
  await window.api.addUser({ username, password, role, phone });
  msg.innerText = '添加成功';
  setTimeout(() => {
    closeAddUserModal();
    loadUsers();
  }, 600);
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
      const newUsername = document.getElementById('editModalUser').value;
      const newPwd = document.getElementById('editModalPwd').value;
      const newRole = document.getElementById('editModalRole').value;
      const newPhone = document.getElementById('editModalPhone').value;
      const msg = document.getElementById('editModalMsg');
      if (!newUsername) {
        msg.innerText = '用户名不能为空';
        return;
      }
      if (newPhone && !/^1[3-9]\d{9}$/.test(newPhone)) {
        msg.innerText = '手机号格式不正确';
        return;
      }
      await window.api.updateUser({ username: newUsername, password: newPwd, role: newRole, phone: newPhone });
      msg.innerText = '保存成功';
      setTimeout(() => {
        closeEditUserModal();
        loadUsers();
      }, 600);
    };
  });
};
function closeEditUserModal() {
  document.getElementById('editUserModal').style.display = 'none';
}



function logout() {
  const modalEl = document.getElementById('logoutModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  // 只绑定一次，避免多次绑定导致卡死
  const confirmBtn = document.getElementById('logoutConfirmBtn');
  confirmBtn.onclick = function() {
    modal.hide();
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

function formatLogDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object') {
    return Object.entries(detail).map(([key, value]) => `${key}: ${value}`).join(', ');
  }
  return JSON.stringify(detail);
}

// ================== 在线用户面板逻辑 ==================
let onlineUsersData = [];

let onlineTrendData = [];

async function loadOnlineUsers() {
  try {
    console.log('🔄 正在从API加载在线用户数据...');

    const response = await window.apiService.getOnlineUsers();
    onlineUsersData = response.data.onlineUsers || [];

    console.log(`✅ 获取到 ${onlineUsersData.length} 个在线用户数据`);
    renderOnlineUserList();

    // 同时加载趋势数据
    await loadOnlineUsersTrend();
  } catch (error) {
    console.error('❌ 加载在线用户失败:', error);
    showNetworkError('在线用户数据');
  }
}

async function loadOnlineUsersTrend() {
  try {
    console.log('🔄 正在从API加载在线用户趋势数据...');

    const today = new Date().toISOString().split('T')[0];
    const response = await window.apiService.getOnlineUsersTrend({
      date: today,
      interval: 'hour' // 按小时统计
    });

    onlineTrendData = response.data.trendData || [];

    console.log(`✅ 获取到在线用户趋势数据:`, onlineTrendData);

    // 重新渲染图表（如果在线用户数据已加载）
    if (onlineUsersData.length > 0) {
      renderOnlineCharts(onlineUsersData);
    }
  } catch (error) {
    console.error('❌ 加载在线用户趋势失败:', error);
    // 趋势数据加载失败时，仍然可以显示用户列表和饼图
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
    refreshBtn.onclick = function() {
      renderOnlineUserList();
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
  loadUsers();
  loadLocalLogs(); // 首次进入读取本地日志
  showPanel('users');
};

// ================== 网络错误处理 ==================
function showNetworkError(dataType) {
  const errorHtml = `
    <div class="alert alert-danger text-center">
      <i class="fa fa-exclamation-triangle"></i>
      <strong>网络错误</strong><br>
      无法加载${dataType}，请检查网络连接或刷新页面重试。
      <br><br>
      <button class="btn btn-sm btn-primary" onclick="location.reload()">
        <i class="fa fa-refresh"></i> 刷新页面
      </button>
    </div>
  `;

  // 根据数据类型显示错误信息
  if (dataType === '用户数据') {
    document.getElementById('userList').innerHTML = errorHtml;
  } else if (dataType === '在线用户数据') {
    document.getElementById('onlineList').innerHTML = errorHtml;
  } else if (dataType === '系统日志') {
    document.getElementById('logList').innerHTML = errorHtml;
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

// 从后端刷新日志
async function refreshLogsFromBackend() {
  try {
    console.log('🔄 正在从后端获取新日志...');

    // 从后端API获取日志
    const response = await window.apiService.getSystemLogs();
    const backendLogs = response.data.logs || [];

    console.log(`✅ 从后端获取到 ${backendLogs.length} 条日志`);

    if (backendLogs.length > 0) {
      // 保存新日志到本地
      if (typeof window.api !== 'undefined' && window.api.saveLogsToLocal) {
        const result = await window.api.saveLogsToLocal(backendLogs);

        if (result.success) {
          console.log(`💾 ${result.message}`);
          // 重新读取本地日志
          await loadLocalLogs();
          alert(`成功从后端获取并保存了新日志，当前总计 ${result.totalLogs} 条日志`);
        } else {
          throw new Error(result.message);
        }
      } else {
        // 如果不是Electron环境，直接显示后端日志
        localLogs = backendLogs;
        renderLocalLogs();
        alert(`从后端获取到 ${backendLogs.length} 条日志`);
      }
    } else {
      alert('后端没有新的日志数据');
    }
  } catch (error) {
    console.error('❌ 从后端刷新日志失败:', error);
    alert('从后端获取日志失败，请检查网络连接');
  }
}

// 导出日志到本地
async function exportLogsToLocal() {
  try {
    console.log('📥 正在导出日志到本地...');

    if (localLogs.length === 0) {
      alert('没有日志数据可以导出');
      return;
    }

    // 从后端获取最新的完整日志数据
    const response = await window.apiService.getSystemLogs();
    const allLogs = response.data.logs || [];

    if (allLogs.length === 0) {
      alert('后端没有日志数据可以导出');
      return;
    }

    // 保存到本地
    if (typeof window.api !== 'undefined' && window.api.saveLogsToLocal) {
      const result = await window.api.saveLogsToLocal(allLogs);

      if (result.success) {
        // 重新读取本地日志
        await loadLocalLogs();
        alert(`成功导出 ${allLogs.length} 条日志到本地logs.json文件`);
      } else {
        throw new Error(result.message);
      }
    } else {
      // 在Web环境中，创建下载链接
      const dataStr = JSON.stringify(allLogs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'logs.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert(`成功下载 ${allLogs.length} 条日志到logs.json文件`);
    }
  } catch (error) {
    console.error('❌ 导出日志失败:', error);
    alert('导出日志失败，请稍后重试');
  }
}

// 删除本地日志文件
function deleteLocalLogs() {
  const modal = new bootstrap.Modal(document.getElementById('deleteLogsModal'));
  modal.show();
}

async function confirmDeleteLocalLogs() {
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
        alert('本地日志文件已删除');
      } else {
        throw new Error(result.message || '删除失败');
      }
    } else {
      alert('此功能仅在Electron环境中可用');
    }
  } catch (error) {
    console.error('❌ 删除本地日志文件失败:', error);
    alert('删除失败，请稍后重试');
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
