// 管理员-在线用户面板逻辑
(function(){
  // 在线用户数据
  let allUsers = [];
  let filterRole = '';
  let searchName = '';
  let sortType = 'username';

  // 加载在线用户数据
  async function loadOnlineUsers() {
    try {
      console.log('🔄 正在从API加载在线用户数据...');

      const response = await window.apiService.getOnlineUsers({
        page: 1,
        limit: 100
      });

      allUsers = response.data.onlineUsers || [];
      console.log('✅ 在线用户数据加载成功:', allUsers);

      // 更新显示
      renderUserList();
      updateStats();
    } catch (error) {
      console.warn('⚠️ API加载失败，使用模拟数据:', error);

      // API失败时使用模拟数据
      allUsers = [
        {username:'driver1',role:'驾驶员',phone:'13800000001',status:'在线'},
        {username:'driver2',role:'驾驶员',phone:'13800000002',status:'在线'},
        {username:'monitor1',role:'监控人员',phone:'13800000003',status:'在线'},
        {username:'admin',role:'管理员',phone:'13800000004',status:'在线'},
        {username:'driver3',role:'驾驶员',phone:'13800000005',status:'在线'},
        {username:'monitor2',role:'监控人员',phone:'13800000006',status:'在线'}
      ];

      console.log('使用模拟数据:', allUsers);
      renderUserList();
      updateStats();
    }
  }

  function renderUserList() {
    let users = allUsers.slice();
    if (filterRole) users = users.filter(u=>u.role===filterRole);
    if (searchName) users = users.filter(u=>u.username.includes(searchName));
    if (sortType==='username') users.sort((a,b)=>a.username.localeCompare(b.username));
    else if (sortType==='role') users.sort((a,b)=>a.role.localeCompare(b.role));
    // 主列表
    const list = document.getElementById('onlineList');
    if (list) {
      list.innerHTML = '';
      users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-item d-flex justify-content-between align-items-center';
        div.innerHTML = `<span><b>${user.username}</b></span><span class='badge user-role-badge' data-role='${user.role}'>${user.role}</span>`;
        list.appendChild(div);
      });
    }
    // 模拟列表（如有）
    const simList = document.getElementById('onlineUserSimList');
    if (simList) {
      simList.innerHTML = '';
      users.forEach(u => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `${u.username} <span class='badge user-role-badge' data-role='${u.role}'>${u.role}</span>`;
        simList.appendChild(li);
      });
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
    // 图表
    renderCharts(users);
  }

  function renderCharts(users) {
    // 统计各角色在线人数
    const roleMap = {};
    users.forEach(u => { roleMap[u.role] = (roleMap[u.role]||0)+1; });
    // 饼图
    const chartDom = document.getElementById('onlineUserChart');
    if (chartDom && window.echarts) {
      const chart = window.echarts.init(chartDom);
      chart.setOption({
        title: { text: '在线用户角色分布', left: 'center', top: 10, textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [
          {
            name: '在线用户数',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: { show: true, formatter: '{b}: {c}人 ({d}%)' },
            data: Object.keys(roleMap).map(role => ({ name: role, value: roleMap[role] }))
          }
        ]
      });
    }
    // 柱状图
    const barDom = document.getElementById('onlineRoleBarChart');
    if (barDom && window.echarts) {
      const barChart = window.echarts.init(barDom);
      barChart.setOption({
        title: { text: '各角色在线人数', left: 'center', top: 10, textStyle: { fontSize: 14 } },
        xAxis: { type: 'category', data: Object.keys(roleMap) },
        yAxis: {},
        series: [{ type: 'bar', data: Object.keys(roleMap).map(role => roleMap[role]), label: { show: true, position: 'top' } }]
      });
    }
    // 折线图（移除模拟趋势，仅保留空图或不渲染）
    const trendDom = document.getElementById('onlineTrendChart');
    if (trendDom && window.echarts) {
      const trendChart = window.echarts.init(trendDom);
      trendChart.setOption({
        title: { text: '近7天在线人数趋势', left: 'center', top: 10, textStyle: { fontSize: 14 } },
        xAxis: { type: 'category', data: [] },
        yAxis: {},
        series: [{ type: 'line', data: [], smooth: true, label: { show: true } }]
      });
    }
  }

  // 事件绑定
  window.initOnlinePanelUI = function() {
    // 类型筛选
    const roleSel = document.getElementById('onlineRoleFilter');
    if (roleSel) {
      roleSel.onchange = function() {
        filterRole = this.value;
        renderUserList();
      };
    }
    // 排序
    const sortSel = document.getElementById('onlineSortSelect');
    if (sortSel) {
      sortSel.onchange = function() {
        sortType = this.value;
        renderUserList();
      };
    }
    // 搜索
    const searchInput = document.getElementById('onlineSearchInput');
    if (searchInput) {
      searchInput.oninput = function() {
        searchName = this.value.trim();
        renderUserList();
      };
    }
    // 刷新
    const refreshBtn = document.getElementById('onlineRefreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = function() {
        loadOnlineUsers(); // 重新从API加载数据
      };
    }
    // 初始加载数据
    loadOnlineUsers();
  };

  // 面板切换时自动加载
  window.onloadOnlinePanel = function() {
    if (!window.echarts) {
      const script = document.createElement('script');
      script.src = '../node_modules/echarts/dist/echarts.min.js';
      script.onload = () => window.initOnlinePanelUI();
      document.head.appendChild(script);
    } else {
      window.initOnlinePanelUI();
    }
  };

  // 页面首次加载时如果已在在线用户面板，也自动加载
  if (document.getElementById('panel-online') && document.getElementById('panel-online').style.display !== 'none') {
    window.onloadOnlinePanel();
  }
})();
