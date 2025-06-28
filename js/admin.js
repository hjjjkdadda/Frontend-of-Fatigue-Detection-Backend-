// ================== 用户管理面板逻辑 ==================

// 创建用户项元素
function createUserItem(user) {
  const template = document.getElementById('user-item-template');
  const userItem = template.content.cloneNode(true);

  // 角色显示映射
  const roleMap = {
    'admin': '管理员',
    'monitor': '监控人员',
    'driver': '驾驶员'
  };
  const roleDisplay = roleMap[user.role] || user.role;

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
    roleBadge.textContent = getRoleText(log.role);
    roleBadge.className = 'badge bg-secondary ms-2';
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
    const users = await window.api.getUsers();
    let filtered = users;
    // 搜索
    if (userFilter.search) {
      filtered = filtered.filter(user =>
        user.username.includes(userFilter.search) || (user.phone && user.phone.includes(userFilter.search))
      );
    }
    // 角色筛选
    if (userFilter.role) {
      filtered = filtered.filter(user => user.role === userFilter.role);
    }
    // 排序
    if (userFilter.sort === 'username') {
      filtered = filtered.sort((a, b) => a.username.localeCompare(b.username));
    } else if (userFilter.sort === 'role') {
      filtered = filtered.sort((a, b) => a.role.localeCompare(b.role));
    }
    // 分页
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
    console.error('加载用户列表失败:', error);
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
window.closeDeleteUserModal = function() {
  const deleteModal = document.getElementById('deleteUserModal');
  if (deleteModal) {
    // 使用Bootstrap Modal API来隐藏弹窗
    const modal = bootstrap.Modal.getInstance(deleteModal);
    if (modal) {
      modal.hide();
    }
  }
};

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

document.getElementById('showAddUser').onclick = function() {
  document.getElementById('addUserModal').style.display = 'flex';
  document.getElementById('modalUser').value = '';
  document.getElementById('modalPwd').value = '';
  document.getElementById('modalRole').value = 'admin';
  document.getElementById('modalPhone').value = '';
  document.getElementById('modalMsg').innerText = '';
};
window.closeAddUserModal = function() {
  document.getElementById('addUserModal').style.display = 'none';
};
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
window.closeEditUserModal = function() {
  document.getElementById('editUserModal').style.display = 'none';
}

function gotoLog() {
  window.api.navigate('log.html');
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
const onlineUsersData = [
  {username:'driver1',role:'驾驶员',phone:'13800000001',status:'在线',loginTime:'2024-01-15 09:30:00'},
  {username:'driver2',role:'驾驶员',phone:'13800000002',status:'在线',loginTime:'2024-01-15 08:45:00'},
  {username:'monitor1',role:'监控人员',phone:'13800000003',status:'在线',loginTime:'2024-01-15 07:20:00'},
  {username:'admin',role:'管理员',phone:'13800000004',status:'在线',loginTime:'2024-01-15 06:00:00'},
  {username:'driver3',role:'驾驶员',phone:'13800000005',status:'在线',loginTime:'2024-01-15 10:15:00'},
  {username:'monitor2',role:'监控人员',phone:'13800000006',status:'在线',loginTime:'2024-01-15 09:00:00'},
  {username:'driver4',role:'驾驶员',phone:'13800000007',status:'在线',loginTime:'2024-01-15 11:30:00'},
  {username:'supervisor1',role:'管理员',phone:'13800000008',status:'在线',loginTime:'2024-01-15 08:00:00'}
];
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
  const roleMap = {};
  users.forEach(u => { roleMap[u.role] = (roleMap[u.role]||0)+1; });
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
          data: Object.keys(roleMap).map(role => ({
            name: role,
            value: roleMap[role],
            itemStyle: {
              color: role === '管理员' ? '#1976d2' :
                     role === '监控人员' ? '#43a047' : '#fbc02d'
            }
          }))
        }
      ]
    });
  }

  // 趋势图（根据筛选角色显示数据）
  const trendDom = document.getElementById('onlineTrendChart');
  if (trendDom && window.echarts) {
    const trendChart = window.echarts.init(trendDom);
    const hours = Array.from({length: 12}, (_, i) => `${8+i}:00`);

    // 根据当前筛选角色生成趋势数据
    let filteredUsers = users;
    let chartTitle = '今日在线人数趋势';
    let legendText = '所有角色';
    let lineColor = '#91cc75';

    if (onlineFilterRole) {
      filteredUsers = users.filter(u => u.role === onlineFilterRole);
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

    const trendData = hours.map((_, i) => {
      // 模拟一天中的在线人数变化，早上少，中午多，晚上逐渐减少
      const baseCount = filteredUsers.length;
      const variation = Math.sin((i / 12) * Math.PI) * 2;
      return Math.max(1, Math.floor(baseCount + variation + Math.random() * 2 - 1));
    });

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
        data: hours,
        axisLabel: { interval: 1 }
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: legendText,
        type: 'line',
        data: trendData,
        smooth: true,
        itemStyle: { color: lineColor },
        areaStyle: { color: hexToRgba(lineColor, 0.3) },
        symbol: 'circle',
        symbolSize: 6
      }]
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
  showPanel('users');
};
