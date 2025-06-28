// 监控人员首页和用户监控数据模拟与渲染
// 实际项目应通过 window.api.getMonitorData()、getOnlineUsers()、getUserDetail() 等接口获取

// 创建用户监控表格行
function createUserMonitorRow(user) {
  const template = document.getElementById('user-monitor-row-template');
  const userRow = template.content.cloneNode(true);

  // 设置用户信息
  const userIcon = userRow.querySelector('.user-icon');
  userIcon.className = `fa fa-user user-icon status-${user.status === '在线' ? 'online' : 'offline'}`;

  userRow.querySelector('.user-name').textContent = user.username;

  // 设置疲劳徽章
  const fatigueBadge = userRow.querySelector('.fatigue-badge');
  const fatigueLevel = user.fatigueCount >= 5 ? 'high' : user.fatigueCount >= 3 ? 'medium' : 'low';
  fatigueBadge.textContent = `${user.fatigueCount}次`;
  fatigueBadge.className = `fatigue-badge fatigue-level-${fatigueLevel}`;

  // 设置持续时间
  userRow.querySelector('.duration-text').textContent = `${user.fatigueDuration}秒`;

  // 设置查看按钮
  const viewBtn = userRow.querySelector('.user-view-btn');
  viewBtn.setAttribute('data-username', user.username);

  return userRow;
}

// 创建高风险用户表格行
function createDangerUserRow(user, index) {
  const template = document.getElementById('danger-user-row-template');
  const userRow = template.content.cloneNode(true);

  // 设置排名徽章
  const rankBadge = userRow.querySelector('.rank-badge');
  rankBadge.textContent = index + 1;
  rankBadge.className = `rank-badge rank-${Math.min(index + 1, 5)}`;

  // 设置用户名
  userRow.querySelector('.user-name').textContent = user.username;

  // 设置疲劳次数徽章
  const fatigueCountBadge = userRow.querySelector('.fatigue-count-badge');
  const fatigueLevel = user.fatigueCount >= 5 ? 'high' : user.fatigueCount >= 3 ? 'medium' : 'low';
  fatigueCountBadge.textContent = `${user.fatigueCount}次`;
  fatigueCountBadge.className = `fatigue-count-badge fatigue-level-${fatigueLevel}`;

  // 设置持续时间
  userRow.querySelector('.duration-text').textContent = `${user.fatigueDuration}秒`;

  // 设置查看按钮
  const viewBtn = userRow.querySelector('.user-view-btn');
  viewBtn.setAttribute('data-username', user.username);

  return userRow;
}

// 创建空状态行
function createEmptyStateRow(message) {
  const template = document.getElementById('empty-state-template');
  const emptyRow = template.content.cloneNode(true);

  emptyRow.querySelector('.empty-message').textContent = message;

  return emptyRow;
}

// 生成更丰富的模拟数据
function generateMockMonitorData() {
  const users = [];
  const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '冯十三', '陈十四', '褚十五', '卫十六', '蒋十七', '沈十八', '韩十九', '杨二十'];

  for (let i = 0; i < 18; i++) {
    const fatigueCount = Math.floor(Math.random() * 8);
    const fatigueDuration = fatigueCount * (Math.floor(Math.random() * 30) + 10);
    const status = Math.random() > 0.3 ? '在线' : '离线';

    // 生成事件数据
    const events = [];
    for (let j = 0; j < fatigueCount; j++) {
      const eventDate = new Date();
      eventDate.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60), 0, 0);
      events.push({
        time: eventDate.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        duration: Math.floor(Math.random() * 40) + 10,
        type: ['打哈欠', '闭眼', '点头', '眨眼', '分神'][Math.floor(Math.random() * 5)]
      });
    }

    users.push({
      username: userNames[i],
      phone: `138${String(i).padStart(4, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      fatigueCount: fatigueCount,
      fatigueDuration: fatigueDuration,
      status: status,
      events: events.sort((a, b) => new Date(b.time) - new Date(a.time))
    });
  }

  const onlineUsers = users.filter(u => u.status === '在线');
  const totalFatigueCount = users.reduce((sum, u) => sum + u.fatigueCount, 0);

  return {
    onlineCount: onlineUsers.length,
    totalCount: users.length,
    fatigueCount: totalFatigueCount,
    users: users,
    fatigueTrend: [12, 8, 15, 10, 18, 14, 20], // 近7天疲劳事件数
    fatigueTrendDate: ['6-22','6-23','6-24','6-25','6-26','6-27','6-28']
  };
}

let monitorData = generateMockMonitorData();

// 加载监控数据
async function loadMonitorData() {
  try {
    console.log('🔄 正在从API加载监控数据...');

    // 从API获取监控仪表板数据
    const dashboardResponse = await window.apiService.getMonitorDashboard();
    monitorData = dashboardResponse.data;

    // 获取用户监控列表
    const userListResponse = await window.apiService.getUserMonitorList({
      page: 1,
      limit: 50
    });
    monitorData.users = userListResponse.data.users;

    // 获取疲劳统计数据
    const fatigueStatsResponse = await window.apiService.getFatigueStats();
    monitorData.fatigueStats = fatigueStatsResponse.data;

    // 获取疲劳趋势数据
    const fatigueTrendResponse = await window.apiService.getFatigueTrend({
      period: 'week'
    });
    monitorData.fatigueTrend = fatigueTrendResponse.data.trendData;
    monitorData.fatigueTrendDate = fatigueTrendResponse.data.dates;

    console.log('✅ API数据加载成功:', monitorData);

    // 更新页面显示
    renderDashboard();
    renderUserMonitorList();
  } catch (error) {
    console.warn('⚠️ API加载失败，使用模拟数据:', error);
    // API失败时使用模拟数据作为降级方案
    monitorData = generateMockMonitorData();
    console.log('使用模拟数据:', monitorData);

    // 更新页面显示
    renderDashboard();
    renderUserMonitorList();
  }
}

function showMonitorTab(tab) {
  document.getElementById('monitor-dashboard').style.display = tab === 'dashboard' ? '' : 'none';
  document.getElementById('monitor-user-monitor').style.display = tab === 'user-monitor' ? '' : 'none';
  document.getElementById('tab-dashboard').classList.toggle('active', tab === 'dashboard');
  document.getElementById('tab-user-monitor').classList.toggle('active', tab === 'user-monitor');
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'user-monitor') renderUserMonitorList();
}

// 用户监控Tab相关逻辑
let userMonitorPage = 1;
let userMonitorPageSize = 10;
let userMonitorSearchVal = '';
let userMonitorSort = 'username';
function renderUserMonitorList() {
  // 显示所有用户
  let users = [...monitorData.users];
  if (userMonitorSearchVal) {
    users = users.filter(u=>u.username.includes(userMonitorSearchVal)||u.phone.includes(userMonitorSearchVal));
  }
  // 排序
  if(userMonitorSort==='username'){
    users.sort((a,b)=>a.username.localeCompare(b.username));
  }else if(userMonitorSort==='fatigueCount'){
    users.sort((a,b)=>b.fatigueCount-a.fatigueCount);
  }else if(userMonitorSort==='fatigueDuration'){
    users.sort((a,b)=>b.fatigueDuration-a.fatigueDuration);
  }
  // 分页
  const total = users.length;
  const pageCount = Math.ceil(total/userMonitorPageSize);
  if (userMonitorPage > pageCount) userMonitorPage = 1;
  const start = (userMonitorPage-1)*userMonitorPageSize;
  const pageUsers = users.slice(start, start+userMonitorPageSize);
  // 渲染表格
  const tbody = document.getElementById('userMonitorTableBody');
  tbody.innerHTML = '';

  if (pageUsers.length === 0) {
    const emptyRow = createEmptyStateRow('暂无用户数据');
    tbody.appendChild(emptyRow);
  } else {
    pageUsers.forEach(u=>{
      const userRow = createUserMonitorRow(u);
      tbody.appendChild(userRow);
    });
  }
  // 绑定查看按钮
  tbody.querySelectorAll('.user-view-btn').forEach(btn => {
    btn.onclick = function() {
      const username = this.getAttribute('data-username');
      goUserDetailPage(username);
    };
  });
  // 渲染分页
  const pagDiv = document.getElementById('userMonitorPagination');
  pagDiv.innerHTML = '';
  if(pageCount>1){
    // 创建分页信息和页数选择框
    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'd-flex align-items-center justify-content-between';

    // 左侧：分页信息
    const infoSpan = document.createElement('span');
    infoSpan.className = 'text-muted';
    infoSpan.textContent = `共 ${total} 条记录，第 ${userMonitorPage} 页，共 ${pageCount} 页`;

    // 右侧：页数选择和导航
    const navDiv = document.createElement('div');
    navDiv.className = 'd-flex align-items-center gap-2';

    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = `btn btn-sm btn-outline-primary ${userMonitorPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fa fa-chevron-left"></i>';
    prevBtn.disabled = userMonitorPage === 1;
    prevBtn.onclick = () => {
      if(userMonitorPage > 1) {
        userMonitorPage--;
        renderUserMonitorList();
      }
    };

    // 页数选择框
    const pageSelect = document.createElement('select');
    pageSelect.className = 'form-select form-select-sm';
    pageSelect.style.width = '80px';
    pageSelect.style.minWidth = '80px';
    for(let i = 1; i <= pageCount; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      option.selected = i === userMonitorPage;
      pageSelect.appendChild(option);
    }
    pageSelect.onchange = () => {
      userMonitorPage = parseInt(pageSelect.value);
      renderUserMonitorList();
    };

    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = `btn btn-sm btn-outline-primary ${userMonitorPage === pageCount ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fa fa-chevron-right"></i>';
    nextBtn.disabled = userMonitorPage === pageCount;
    nextBtn.onclick = () => {
      if(userMonitorPage < pageCount) {
        userMonitorPage++;
        renderUserMonitorList();
      }
    };

    // 组装导航元素
    navDiv.appendChild(prevBtn);
    navDiv.appendChild(pageSelect);
    navDiv.appendChild(nextBtn);

    // 组装整个分页区域
    paginationInfo.appendChild(infoSpan);
    paginationInfo.appendChild(navDiv);
    pagDiv.appendChild(paginationInfo);
  }
}

let dangerSortType = 'fatigueCount'; // 默认按疲劳次数排序
let chartInstances = {}; // 存储图表实例，避免重复初始化

function renderDashboard() {
  // 卡片数据更新
  document.getElementById('onlineCount').innerText = monitorData.onlineCount;
  document.getElementById('totalCount').innerText = monitorData.totalCount;
  document.getElementById('fatigueCount').innerText = monitorData.fatigueCount;

  // 饼图 - 疲劳次数占比
  if (!chartInstances.pie) {
    chartInstances.pie = echarts.init(document.getElementById('pie-fatigue'));
  }
  let pie = chartInstances.pie;
  let pieData = monitorData.users.filter(u=>u.fatigueCount>0).map(u=>({name:u.username,value:u.fatigueCount}));
  pie.setOption({
    title: {
      text: '疲劳次数占比',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, color: '#2e7d32' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)'
    },

    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: pieData,
      label: {
        show: true,
        formatter: '{b}: {c}次'
      },
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(67, 160, 71, 0.5)'
        }
      }
    }],
    color: ['#43a047', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e8']
  });

  // 柱状图 - 疲劳时间排行
  if (!chartInstances.bar) {
    chartInstances.bar = echarts.init(document.getElementById('bar-duration'));
  }
  let bar = chartInstances.bar;
  let barData = monitorData.users.filter(u=>u.fatigueDuration>0).sort((a,b)=>b.fatigueDuration-a.fatigueDuration).slice(0,8);
  bar.setOption({
    title: {
      text: '疲劳时间排行',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, color: '#2e7d32' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}秒'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: barData.map(u=>u.username),
      axisLabel: {
        rotate: 45,
        textStyle: { fontSize: 12 }
      }
    },
    yAxis: {
      type: 'value',
      name: '时间(秒)',
      nameTextStyle: { color: '#666' }
    },
    series: [{
      type: 'bar',
      data: barData.map(u=>u.fatigueDuration),
      label: {
        show: true,
        position: 'top',
        textStyle: { fontSize: 11 }
      },
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#66bb6a' },
          { offset: 1, color: '#43a047' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#81c784' },
            { offset: 1, color: '#66bb6a' }
          ])
        }
      }
    }]
  });

  // 折线图 - 疲劳事件趋势
  if (!chartInstances.line) {
    chartInstances.line = echarts.init(document.getElementById('line-trend'));
  }
  let line = chartInstances.line;
  line.setOption({
    title: {
      text: '疲劳事件趋势',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, color: '#2e7d32' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}次事件'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: monitorData.fatigueTrendDate,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '事件数',
      nameTextStyle: { color: '#666' }
    },
    series: [{
      type: 'line',
      data: monitorData.fatigueTrend,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: '#43a047',
        width: 3
      },
      itemStyle: {
        color: '#43a047',
        borderColor: '#fff',
        borderWidth: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(67, 160, 71, 0.3)' },
          { offset: 1, color: 'rgba(67, 160, 71, 0.1)' }
        ])
      },
      label: {
        show: true,
        position: 'top',
        textStyle: { fontSize: 11 }
      }
    }]
  });
  // 高风险用户TOP5表格
  let users = monitorData.users.filter(u=>u.fatigueCount>0);
  if (dangerSortType === 'fatigueCount') {
    users = users.sort((a,b)=>b.fatigueCount-a.fatigueCount);
  } else if (dangerSortType === 'fatigueDuration') {
    users = users.sort((a,b)=>b.fatigueDuration-a.fatigueDuration);
  }
  let dangerList = users.slice(0,5);
  let dangerDiv = document.getElementById('dangerList');
  dangerDiv.innerHTML = `
    <div class="table-container">
      <table class='table table-sm mb-0'>
        <thead>
          <tr>
            <th><i class="fa fa-user"></i> 用户名</th>
            <th><i class="fa fa-exclamation-circle"></i> 疲劳次数</th>
            <th><i class="fa fa-clock-o"></i> 疲劳时长</th>
            <th style='width:70px;text-align:center;'><i class="fa fa-cogs"></i> 操作</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
  let tbody = dangerDiv.querySelector('tbody');

  if (dangerList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">暂无高风险用户</td></tr>';
  } else {
    dangerList.forEach((u, index)=>{
      let tr = document.createElement('tr');
      tr.style.transition = 'background-color 0.3s ease';

      // 排名颜色
      const rankColors = ['#f44336', '#ff9800', '#ffc107', '#43a047', '#2196f3'];
      const rankColor = rankColors[index] || '#6c757d';

      tr.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <span class="badge me-2" style="background-color: ${rankColor}; color: white; font-size: 10px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
              ${index + 1}
            </span>
            <strong>${u.username}</strong>
          </div>
        </td>
        <td>
          <span class="badge" style="background-color: ${u.fatigueCount >= 5 ? '#f44336' : u.fatigueCount >= 3 ? '#ff9800' : '#43a047'}; color: white; font-size: 11px;">
            ${u.fatigueCount}次
          </span>
        </td>
        <td>
          <span class="text-muted">${u.fatigueDuration}秒</span>
        </td>
        <td>
          <button type='button' class='btn btn-sm btn-info user-view-btn' data-username='${u.username}' style="font-size: 11px; padding: 4px 8px; width: 60px;">
            <i class="fa fa-eye me-1"></i>查看
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  // 绑定排序下拉框
  const dangerSortSel = document.getElementById('dangerSortSelect');
  if(dangerSortSel){
    dangerSortSel.value = dangerSortType;
    dangerSortSel.onchange = function(){
      dangerSortType = this.value;
      renderDashboard();
    };
  }
  // 绑定查看按钮
  tbody.querySelectorAll('.user-view-btn').forEach(btn => {
    btn.onclick = function() {
      const username = this.getAttribute('data-username');
      goUserDetailPage(username);
    };
  });
}

function renderUserList(filter) {
  let users = monitorData.users.filter(u=>u.status==='在线');
  if (filter) {
    users = users.filter(u=>u.username.includes(filter)||u.phone.includes(filter));
  }
  let tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '';
  users.forEach(u=>{
    let tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.username}</td><td>${u.fatigueCount}</td><td>${u.fatigueDuration}</td><td>${u.status}</td><td><button type='button' class='btn btn-sm btn-info user-view-btn' data-username='${u.username}'>查看</button></td>`;
    tbody.appendChild(tr);
  });
  // 事件委托，渲染后绑定
  tbody.querySelectorAll('.user-view-btn').forEach(btn => {
    btn.onclick = function() {
      const username = this.getAttribute('data-username');
      goUserDetailPage(username);
    };
  });
}
function searchUserList() {
  let val = document.getElementById('searchUser').value.trim();
  renderUserList(val);
}
function resetUserList() {
  document.getElementById('searchUser').value = '';
  renderUserList();
}
function showUserDetail(username) {
  let user = monitorData.users.find(u=>u.username===username);
  if (!user) return;
  // 实时监控（模拟）
  let videoEl = document.getElementById('userVideo');
  if (videoEl) {
    videoEl.src = 'https://www.w3schools.com/html/mov_bbb.mp4'; // 可替换为实时流
    videoEl.style.display = '';
  }
  let monitorDiv = document.getElementById('userRealtimeMonitor');
  if (monitorDiv) {
    monitorDiv.innerHTML = '<span style="color:#0d6efd;font-weight:bold;">实时监控画面（模拟）</span>';
  }
  // 联系方式
  let contactDiv = document.getElementById('userContact');
  if (contactDiv) {
    contactDiv.innerHTML = `<div><b>用户名：</b>${user.username}</div><div><b>手机号：</b>${user.phone}</div>`;
  }
  // 统计数据
  document.getElementById('userDetailStats').innerHTML = `
    <div><b>疲劳次数：</b>${user.fatigueCount}</div>
    <div><b>疲劳时长：</b>${user.fatigueDuration} 秒</div>
    <div><b>状态：</b>${user.status}</div>
  `;
  // 统计图
  let chart = echarts.init(document.getElementById('userDetailChart'));
  chart.setOption({
    title:{text:'疲劳事件分布',left:'center'},
    xAxis:{type:'category',data:user.events.map(e=>e.time)},
    yAxis:{},
    series:[{type:'bar',data:user.events.map(e=>e.duration),label:{show:true,position:'top'}}]
  });
  // 事件表
  let tbody = document.getElementById('userEventTable');
  tbody.innerHTML = '';
  user.events.forEach(e=>{
    let tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.time}</td><td>${e.duration}</td>`;
    tbody.appendChild(tr);
  });
  // 显示弹窗
  let modal = new bootstrap.Modal(document.getElementById('userDetailModal'));
  modal.show();
}
// 注销按钮逻辑
function logoutMonitor() {
  const modalEl = document.getElementById('logoutModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  // 解绑旧的，防止多次绑定导致卡死
  const confirmBtn = document.getElementById('logoutConfirmBtn');
  confirmBtn.onclick = null;
  confirmBtn.onclick = function() {
    modal.hide();
    window.location.href = 'login.html';
  };
  // 取消按钮采用data-bs-dismiss="modal"，Bootstrap会自动关闭弹窗，无需手动绑定
}
function goUserDetailPage(username) {
  // 缓存数据到localStorage，便于详情页读取
  localStorage.setItem('monitorDataCache', JSON.stringify(monitorData));
  window.open(`user-detail.html?username=${encodeURIComponent(username)}&role=monitor`, '_blank');
}


window.onload = async function() {
  // 首先加载数据
  await loadMonitorData();

  // 显示默认标签页
  showMonitorTab('dashboard');

  // 注销按钮事件绑定
  let logoutBtn = document.getElementById('monitor-logout-btn');
  if (logoutBtn) logoutBtn.onclick = logoutMonitor;
  // 用户监控Tab事件绑定
  const searchInput = document.getElementById('userMonitorSearch');
  if(searchInput){
    searchInput.oninput = function(){
      userMonitorSearchVal = this.value.trim();
      userMonitorPage = 1;
      renderUserMonitorList();
    };
  }
  const pageSizeSel = document.getElementById('userMonitorPageSize');
  if(pageSizeSel){
    pageSizeSel.onchange = function(){
      userMonitorPageSize = parseInt(this.value);
      userMonitorPage = 1;
      renderUserMonitorList();
    };
  }
  const sortSel = document.getElementById('userMonitorSort');
  if(sortSel){
    sortSel.onchange = function(){
      userMonitorSort = this.value;
      renderUserMonitorList();
    };
  }

  // 导出总体疲劳报告按钮事件绑定
  const exportAllBtn = document.getElementById('exportAllReportBtn');
  if(exportAllBtn){
    exportAllBtn.onclick = exportAllFatigueReport;
  }
}

// 导出所有驾驶人员总体疲劳报告
async function exportAllFatigueReport() {
  const exportBtn = document.getElementById('exportAllReportBtn');

  if (!exportBtn) return;

  try {
    // 检查XLSX库
    if (typeof XLSX === 'undefined') {
      throw new Error('Excel处理库未加载，无法生成报告');
    }

    // 更新按钮状态
    exportBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>生成中...';
    exportBtn.disabled = true;

    // 准备报告数据
    const reportData = prepareAllUsersReportData();

    // 生成Excel报告
    await generateExcelAllReport(reportData);

    // 显示成功消息
    alert('Excel总体疲劳报告已成功生成并下载！');

  } catch (error) {
    console.error('生成总体疲劳报告失败:', error);
    alert(`生成报告失败: ${error.message}`);
  } finally {
    // 恢复按钮状态
    exportBtn.innerHTML = '<i class="fa fa-file-excel-o me-2"></i>导出总体疲劳报告';
    exportBtn.disabled = false;
  }
}

// 准备所有用户的报告数据
function prepareAllUsersReportData() {
  const now = new Date();
  const users = monitorData.users;

  // 整体统计
  const overallStats = {
    totalUsers: users.length,
    onlineUsers: users.filter(u => u.status === '在线').length,
    offlineUsers: users.filter(u => u.status === '离线').length,
    totalFatigueEvents: users.reduce((sum, u) => sum + u.fatigueCount, 0),
    totalFatigueDuration: users.reduce((sum, u) => sum + u.fatigueDuration, 0),
    avgFatiguePerUser: users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.fatigueCount, 0) / users.length) : 0,
    avgDurationPerUser: users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.fatigueDuration, 0) / users.length) : 0
  };

  // 风险等级分类
  const riskLevels = {
    high: users.filter(u => u.fatigueCount >= 5 || u.fatigueDuration >= 100).length,
    medium: users.filter(u => (u.fatigueCount >= 2 && u.fatigueCount < 5) || (u.fatigueDuration >= 40 && u.fatigueDuration < 100)).length,
    low: users.filter(u => u.fatigueCount < 2 && u.fatigueDuration < 40).length
  };

  // 按疲劳次数排序的用户
  const usersByFatigueCount = [...users].sort((a, b) => b.fatigueCount - a.fatigueCount);

  // 按疲劳时长排序的用户
  const usersByFatigueDuration = [...users].sort((a, b) => b.fatigueDuration - a.fatigueDuration);

  // 趋势数据（使用现有的fatigueTrend数据）
  const trendData = monitorData.fatigueTrend || [];
  const trendDates = monitorData.fatigueTrendDate || [];

  return {
    reportDate: now.toISOString().split('T')[0],
    reportTime: now.toTimeString().split(' ')[0].substring(0, 5),
    overallStats,
    riskLevels,
    users,
    usersByFatigueCount,
    usersByFatigueDuration,
    trendData,
    trendDates
  };
}

// 添加概览工作表
function addOverviewSheet(workbook, reportData) {
  const data = [
    ['驾驶人员总体疲劳监测报告'],
    [''],
    ['报告生成时间', `${reportData.reportDate} ${reportData.reportTime}`],
    ['监控范围', '所有驾驶人员'],
    [''],
    ['整体统计概览'],
    ['总驾驶人员数', `${reportData.overallStats.totalUsers}人`],
    ['在线人员数', `${reportData.overallStats.onlineUsers}人`],
    ['离线人员数', `${reportData.overallStats.offlineUsers}人`],
    ['总疲劳事件数', `${reportData.overallStats.totalFatigueEvents}次`],
    ['总疲劳时长', `${reportData.overallStats.totalFatigueDuration}秒`],
    ['人均疲劳事件', `${reportData.overallStats.avgFatiguePerUser}次`],
    ['人均疲劳时长', `${reportData.overallStats.avgDurationPerUser}秒`],
    [''],
    ['风险等级分布'],
    ['高风险人员', `${reportData.riskLevels.high}人`],
    ['中风险人员', `${reportData.riskLevels.medium}人`],
    ['低风险人员', `${reportData.riskLevels.low}人`],
    [''],
    ['疲劳事件最多的前5名驾驶员'],
    ['排名', '姓名', '手机号', '疲劳次数', '疲劳时长(秒)', '状态']
  ];

  // 添加前5名数据
  reportData.usersByFatigueCount.slice(0, 5).forEach((user, index) => {
    data.push([
      index + 1,
      user.username,
      user.phone,
      user.fatigueCount,
      user.fatigueDuration,
      user.status
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  worksheet['!cols'] = [
    { width: 8 },   // 排名
    { width: 20 },  // 内容
    { width: 15 },  // 手机号
    { width: 12 },  // 疲劳次数
    { width: 15 },  // 疲劳时长
    { width: 10 }   // 状态
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '报告概览');
}

// 添加用户汇总工作表
function addUserSummarySheet(workbook, reportData) {
  const headers = ['序号', '姓名', '手机号', '状态', '疲劳次数', '疲劳时长(秒)', '风险等级'];
  const data = [headers];

  reportData.users.forEach((user, index) => {
    let riskLevel = '低风险';
    if (user.fatigueCount >= 5 || user.fatigueDuration >= 100) {
      riskLevel = '高风险';
    } else if (user.fatigueCount >= 2 || user.fatigueDuration >= 40) {
      riskLevel = '中风险';
    }

    data.push([
      index + 1,
      user.username,
      user.phone,
      user.status,
      user.fatigueCount,
      user.fatigueDuration,
      riskLevel
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  worksheet['!cols'] = [
    { width: 8 },   // 序号
    { width: 15 },  // 姓名
    { width: 15 },  // 手机号
    { width: 10 },  // 状态
    { width: 12 },  // 疲劳次数
    { width: 15 },  // 疲劳时长
    { width: 12 }   // 风险等级
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '人员汇总');
}

// 添加统计分析工作表
function addStatisticsSheet(workbook, reportData) {
  const data = [
    ['统计分析'],
    [''],
    ['按状态统计'],
    ['状态', '人数', '占比(%)'],
    ['在线', reportData.overallStats.onlineUsers, Math.round(reportData.overallStats.onlineUsers / reportData.overallStats.totalUsers * 100)],
    ['离线', reportData.overallStats.offlineUsers, Math.round(reportData.overallStats.offlineUsers / reportData.overallStats.totalUsers * 100)],
    [''],
    ['按风险等级统计'],
    ['风险等级', '人数', '占比(%)'],
    ['高风险', reportData.riskLevels.high, Math.round(reportData.riskLevels.high / reportData.overallStats.totalUsers * 100)],
    ['中风险', reportData.riskLevels.medium, Math.round(reportData.riskLevels.medium / reportData.overallStats.totalUsers * 100)],
    ['低风险', reportData.riskLevels.low, Math.round(reportData.riskLevels.low / reportData.overallStats.totalUsers * 100)],
    [''],
    ['疲劳次数分布'],
    ['疲劳次数范围', '人数'],
    ['0次', reportData.users.filter(u => u.fatigueCount === 0).length],
    ['1-2次', reportData.users.filter(u => u.fatigueCount >= 1 && u.fatigueCount <= 2).length],
    ['3-4次', reportData.users.filter(u => u.fatigueCount >= 3 && u.fatigueCount <= 4).length],
    ['5次以上', reportData.users.filter(u => u.fatigueCount >= 5).length],
    [''],
    ['疲劳时长分布'],
    ['疲劳时长范围', '人数'],
    ['0-20秒', reportData.users.filter(u => u.fatigueDuration >= 0 && u.fatigueDuration <= 20).length],
    ['21-60秒', reportData.users.filter(u => u.fatigueDuration >= 21 && u.fatigueDuration <= 60).length],
    ['61-120秒', reportData.users.filter(u => u.fatigueDuration >= 61 && u.fatigueDuration <= 120).length],
    ['120秒以上', reportData.users.filter(u => u.fatigueDuration > 120).length]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  worksheet['!cols'] = [
    { width: 20 },
    { width: 12 },
    { width: 12 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '统计分析');
}

// 添加趋势分析工作表
function addTrendAnalysisSheet(workbook, reportData) {
  const data = [
    ['疲劳事件趋势分析'],
    [''],
    ['近7天疲劳事件趋势'],
    ['日期', '事件总数']
  ];

  // 添加趋势数据
  reportData.trendDates.forEach((date, index) => {
    if (reportData.trendData[index] !== undefined) {
      data.push([date, reportData.trendData[index]]);
    }
  });

  data.push(['']);
  data.push(['疲劳次数排行榜（前10名）']);
  data.push(['排名', '姓名', '手机号', '疲劳次数', '疲劳时长(秒)']);

  reportData.usersByFatigueCount.slice(0, 10).forEach((user, index) => {
    data.push([
      index + 1,
      user.username,
      user.phone,
      user.fatigueCount,
      user.fatigueDuration
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  worksheet['!cols'] = [
    { width: 8 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '趋势分析');
}

// 添加风险分析工作表
async function addRiskAnalysisSheet(workbook, reportData) {
  const data = [
    ['风险分析与建议'],
    [''],
    ['高风险人员名单'],
    ['姓名', '手机号', '疲劳次数', '疲劳时长(秒)', '风险因素']
  ];

  const highRiskUsers = reportData.users.filter(u => u.fatigueCount >= 5 || u.fatigueDuration >= 100);

  if (highRiskUsers.length > 0) {
    highRiskUsers.forEach(user => {
      let riskFactors = [];
      if (user.fatigueCount >= 5) riskFactors.push('疲劳次数过多');
      if (user.fatigueDuration >= 100) riskFactors.push('疲劳时长过长');

      data.push([
        user.username,
        user.phone,
        user.fatigueCount,
        user.fatigueDuration,
        riskFactors.join('、')
      ]);
    });
  } else {
    data.push(['暂无高风险人员', '', '', '', '']);
  }

  data.push(['']);
  data.push(['管理建议']);
  data.push(['序号', '建议内容', '建议来源']);

  // 使用星火认知大模型生成建议
  let recommendations = [];
  try {
    if (window.aiFatigueAdvisor) {
      console.log('🤖 正在调用星火认知大模型生成总体管理建议...');
      const aiRecommendations = await window.aiFatigueAdvisor.generateOverallRecommendations(reportData);
      recommendations = aiRecommendations.map(rec => ({ content: rec, source: '星火AI分析' }));
      console.log(`✅ 星火AI生成了 ${aiRecommendations.length} 条总体管理建议`);

      // 如果AI建议充足，直接使用
      if (recommendations.length >= 6) {
        // AI建议已足够，继续使用
      } else {
        // AI建议不足，补充传统建议
        const traditionalRecommendations = [
          '对高风险人员进行重点监控，增加休息频率',
          '定期组织安全驾驶培训，提高驾驶员安全意识',
          '建立疲劳驾驶预警机制，及时发现和处理疲劳状态',
          '合理安排驾驶班次，避免长时间连续驾驶',
          '加强驾驶员健康管理，定期进行体检',
          '完善疲劳监测设备，提高监测精度和覆盖率'
        ];

        traditionalRecommendations.forEach(rec => {
          recommendations.push({ content: rec, source: '规则分析' });
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ 星火AI总体建议生成失败，使用传统建议:', error.message);

    // AI失败时使用传统建议
    const traditionalRecommendations = [
      '对高风险人员进行重点监控，增加休息频率',
      '定期组织安全驾驶培训，提高驾驶员安全意识',
      '建立疲劳驾驶预警机制，及时发现和处理疲劳状态',
      '合理安排驾驶班次，避免长时间连续驾驶',
      '加强驾驶员健康管理，定期进行体检',
      '完善疲劳监测设备，提高监测精度和覆盖率'
    ];

    recommendations = traditionalRecommendations.map(rec => ({ content: rec, source: '规则分析' }));
  }

  recommendations.forEach((rec, index) => {
    data.push([index + 1, rec.content, rec.source]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 设置列宽
  worksheet['!cols'] = [
    { width: 8 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 30 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '风险分析');
}

// 生成Excel格式的总体报告
async function generateExcelAllReport(reportData) {
  const workbook = XLSX.utils.book_new();

  addOverviewSheet(workbook, reportData);
  addUserSummarySheet(workbook, reportData);
  addStatisticsSheet(workbook, reportData);
  addTrendAnalysisSheet(workbook, reportData);
  await addRiskAnalysisSheet(workbook, reportData);

  const fileName = `总体疲劳报告_${reportData.reportDate}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}


