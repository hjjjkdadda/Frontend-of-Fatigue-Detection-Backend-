// 管理员-在线用户面板逻辑
(function(){
  // 在线用户数据
  let allUsers = [];
  let filterRole = '';
  let searchName = '';
  let sortType = 'username';

  // 商业级在线用户数据加载
  async function loadOnlineUsers() {
    try {
      console.log('🔄 正在从后端API加载在线用户数据...');

      // 使用统一的API接口
      const response = await window.api.getOnlineUsers({
        page: 1,
        limit: 100
      });

      // 验证响应数据格式
      if (!response || !response.data) {
        throw new Error('服务器返回数据格式错误');
      }

      allUsers = response.data.onlineUsers || [];
      console.log('✅ 在线用户数据加载成功:', allUsers);

      // 更新显示
      renderUserList();
      updateStats();

      return { success: true, data: allUsers };

    } catch (error) {
      console.error('❌ 加载在线用户失败:', error);

      // 根据错误类型显示专业的错误信息
      let errorMessage = '网络连接失败，请检查后端服务是否启动';
      if (error.type === 'NETWORK_ERROR') {
        errorMessage = error.message;
      } else if (error.message && !error.message.includes('is not a function')) {
        errorMessage = error.message;
      }

      // 显示网络错误，不使用模拟数据
      showNetworkErrorInOnlinePanel(errorMessage);

      // 清空用户列表
      allUsers = [];
      renderUserList();
      updateStats();

      // 重新抛出错误，让调用者知道操作失败
      throw error;
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
      refreshBtn.onclick = async function() {
        // 显示加载状态
        this.disabled = true;
        this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 刷新中...';

        try {
          await loadOnlineUsers();
          showToast('在线用户数据刷新成功', 'success');
        } catch (error) {
          console.error('刷新在线用户数据失败:', error);

          // 根据错误类型显示专业的错误信息
          let errorMessage = '网络连接失败，请检查后端服务是否启动';
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
    // 初始加载数据
    loadOnlineUsers();
  };

  // 在线用户面板显示网络错误
  function showNetworkErrorInOnlinePanel(message) {
    const onlineUserList = document.getElementById('onlineUserList');
    if (onlineUserList) {
      onlineUserList.innerHTML = `
        <div class="network-error" style="text-align: center; padding: 40px 20px; color: #666;">
          <i class="fa fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 15px;"></i>
          <h4 style="color: #e74c3c; margin-bottom: 10px;">网络连接失败</h4>
          <p style="margin-bottom: 20px;">${message}</p>
          <button onclick="loadOnlineUsers()" class="btn btn-primary btn-sm">
            <i class="fa fa-refresh"></i> 重试连接
          </button>
        </div>
      `;
    }

    // 也在趋势图区域显示错误
    const onlineTrendChart = document.getElementById('onlineTrendChart');
    if (onlineTrendChart) {
      onlineTrendChart.innerHTML = `
        <div class="network-error" style="text-align: center; padding: 20px; color: #666;">
          <i class="fa fa-exclamation-triangle" style="color: #f39c12; margin-right: 8px;"></i>
          <span>无法加载趋势数据</span>
        </div>
      `;
    }
  }

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
