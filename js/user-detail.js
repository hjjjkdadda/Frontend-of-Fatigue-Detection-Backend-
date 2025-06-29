// 用户详情页面逻辑
class UserDetailPage {
  constructor() {
    this.username = null;
    this.user = null;
    this.realtimeEvents = [];
    this.eventTypes = ['打哈欠', '闭眼', '点头', '眨眼', '分神'];
    this.realtimeInterval = null;
    this.charts = {
      detail: null,
      trend: null
    };
  }

  // 获取URL参数
  getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);    
  }

  // 初始化页面
  async init() {
    this.username = this.getQueryParam('username') || '默认用户';

    // 直接加载模拟数据
    await this.loadUserDetail();

    // 渲染页面内容
    this.renderUserInfo();
    this.setupVideo();
    this.renderCharts();
    this.renderHistoryTable();
    this.startRealtimeEventMonitoring();
    this.setupExportButton();
    this.setupVideoHistory();
  }

  // 从API加载用户详情
  async loadUserDetail() {
    try {
      // 尝试从统一API获取用户详情
      const userDetailResponse = await window.api.getUserDetail(this.username);
      this.user = userDetailResponse.data.user;

      // 获取用户疲劳事件历史
      const eventsResponse = await window.api.getUserFatigueEvents(this.username, {
        limit: 50,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 最近30天
      });
      this.user.events = eventsResponse.data.events;

      // 获取用户健康数据
      try {
        const healthResponse = await window.api.getUserHealthData(this.username);
        this.user.healthData = healthResponse.data.healthData;
      } catch (error) {
        console.warn('获取健康数据失败，使用默认数据:', error);
        this.enhanceUserData(); // 使用模拟健康数据
      }

      console.log('✅ 从API加载用户数据成功:', this.user);
    } catch (error) {
      console.warn('⚠️ API加载失败，使用模拟数据:', error);
      // API失败时使用模拟数据作为降级方案
      this.user = this.generateMockUser();
      this.enhanceUserData();
      this.user.events = this.generateMockEvents();
      console.log('使用模拟数据:', this.user);
    }
  }



  // 生成模拟用户数据
  generateMockUser() {
    const mockUserTemplates = [
      {
        username: this.username,
        phone: '138****5678',
        status: Math.random() > 0.3 ? '在线' : '离线',
        role: '驾驶员',
        lastLoginTime: new Date().toISOString()
      },
      {
        username: this.username,
        phone: '139****8765',
        status: Math.random() > 0.2 ? '在线' : '离线',
        role: '驾驶员',
        lastLoginTime: new Date().toISOString()
      },
      {
        username: this.username,
        phone: '137****4321',
        status: Math.random() > 0.4 ? '在线' : '离线',
        role: '监控人员',
        lastLoginTime: new Date().toISOString()
      }
    ];

    // 随机选择一个模板
    const template = mockUserTemplates[Math.floor(Math.random() * mockUserTemplates.length)];
    template.username = this.username; // 确保用户名正确
    return template;
  }

  // 增强用户数据
  enhanceUserData() {
    if (!this.user) return;

    // 添加驾驶统计数据
    this.user.drivingStats = {
      totalDistance: Math.floor(Math.random() * 80000) + 20000, // 总里程 20000-100000km
      totalHours: Math.floor(Math.random() * 5000) + 1000, // 总驾驶时长 1000-6000小时
      avgSpeed: Math.floor(Math.random() * 25) + 55, // 平均速度 55-80km/h
      fuelConsumption: (Math.random() * 3 + 7).toFixed(1), // 油耗 7-10L/100km
      accidentCount: Math.floor(Math.random() * 4), // 事故次数 0-3次
      violationCount: Math.floor(Math.random() * 8), // 违章次数 0-7次
      nightDrivingHours: Math.floor(Math.random() * 500) + 100, // 夜间驾驶时长
      overtimeHours: Math.floor(Math.random() * 200) + 50, // 超时驾驶时长
      continuousDrivingMax: Math.floor(Math.random() * 3) + 4, // 最长连续驾驶时间(小时)
      restBreakCount: Math.floor(Math.random() * 50) + 20 // 休息次数
    };

    // 添加健康数据
    const baseHeartRate = Math.floor(Math.random() * 25) + 65; // 基础心率 65-90
    const baseFatigueLevel = Math.floor(Math.random() * 80) + 10; // 基础疲劳度 10-90

    this.user.healthData = {
      heartRate: baseHeartRate, // 心率
      bloodPressure: `${Math.floor(Math.random() * 40) + 110}/${Math.floor(Math.random() * 25) + 70}`, // 血压
      fatigueLevel: baseFatigueLevel, // 疲劳度
      stressLevel: Math.floor(Math.random() * 70) + 20, // 压力值 20-90
      sleepQuality: Math.floor(Math.random() * 60) + 40, // 睡眠质量 40-100
      bodyTemperature: (Math.random() * 1.5 + 36.2).toFixed(1), // 体温 36.2-37.7°C
      bloodOxygen: Math.floor(Math.random() * 5) + 95, // 血氧饱和度 95-100%
      reactionTime: Math.floor(Math.random() * 200) + 300, // 反应时间 300-500ms
      alertnessLevel: Math.max(10, 100 - baseFatigueLevel + Math.floor(Math.random() * 20) - 10) // 警觉度
    };

    // 添加车辆信息
    const vehicleModels = ['东风天龙', '解放J6', '重汽豪沃', '陕汽德龙', '福田欧曼'];
    const fuelTypes = ['柴油', '天然气', '混合动力'];
    const engineStatuses = ['正常', '良好', '需保养'];

    this.user.vehicleInfo = {
      model: vehicleModels[Math.floor(Math.random() * vehicleModels.length)],
      year: 2018 + Math.floor(Math.random() * 6), // 2018-2023年
      mileage: Math.floor(Math.random() * 200000) + 50000, // 里程 50000-250000km
      fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
      engineStatus: engineStatuses[Math.floor(Math.random() * engineStatuses.length)],
      lastMaintenance: this.generateRandomDate(30), // 最近30天内的随机日期
      nextMaintenance: this.generateRandomDate(-30), // 未来30天内的随机日期
      tireCondition: Math.floor(Math.random() * 40) + 60, // 轮胎状况 60-100%
      brakeCondition: Math.floor(Math.random() * 30) + 70, // 刹车状况 70-100%
      fuelLevel: Math.floor(Math.random() * 80) + 20 // 油量 20-100%
    };

    // 添加工作记录
    this.user.workRecord = {
      todayDrivingTime: Math.floor(Math.random() * 8) + 1, // 今日驾驶时间 1-8小时
      weeklyDrivingTime: Math.floor(Math.random() * 40) + 20, // 本周驾驶时间 20-60小时
      monthlyDrivingTime: Math.floor(Math.random() * 120) + 80, // 本月驾驶时间 80-200小时
      lastRestTime: this.generateRandomTime(), // 最后休息时间
      nextShiftTime: this.generateRandomTime(true), // 下次班次时间
      currentRoute: this.generateRandomRoute(), // 当前路线
      estimatedArrival: this.generateRandomTime(true) // 预计到达时间
    };
  }

  // 生成随机日期
  generateRandomDate(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset + Math.floor(Math.random() * Math.abs(daysOffset) * 2) - Math.abs(daysOffset));
    return date.toISOString().split('T')[0];
  }

  // 生成随机时间
  generateRandomTime(future = false) {
    const now = new Date();
    const offset = future ? Math.floor(Math.random() * 8) + 1 : -(Math.floor(Math.random() * 8) + 1);
    now.setHours(now.getHours() + offset);
    return now.toTimeString().split(' ')[0].substring(0, 5);
  }

  // 生成随机路线
  generateRandomRoute() {
    const routes = [
      '北京 → 上海',
      '北京 → 广州',
      '北京 → 深圳',
      '北京 → 天津',
      '北京 → 石家庄',
      '北京 → 济南',
      '北京 → 郑州',
      '北京 → 西安'
    ];
    return routes[Math.floor(Math.random() * routes.length)];
  }

  // 生成模拟事件数据
  generateMockEvents() {
    const events = [];
    const now = new Date();

    // 生成过去7天的疲劳事件数据
    for (let day = 6; day >= 0; day--) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() - day);

      // 每天随机生成2-8个事件
      const eventsPerDay = Math.floor(Math.random() * 7) + 2;

      for (let i = 0; i < eventsPerDay; i++) {
        // 随机生成时间（工作时间8:00-18:00）
        const hour = Math.floor(Math.random() * 10) + 8;
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);

        eventDate.setHours(hour, minute, second, 0);

        const dateStr = `${eventDate.getFullYear()}-${(eventDate.getMonth()+1).toString().padStart(2,'0')}-${eventDate.getDate().toString().padStart(2,'0')} ${eventDate.getHours().toString().padStart(2,'0')}:${eventDate.getMinutes().toString().padStart(2,'0')}:${eventDate.getSeconds().toString().padStart(2,'0')}`;

        // 根据事件类型设置不同的持续时间范围
        const eventType = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];
        let duration;

        switch(eventType) {
          case '打哈欠':
            duration = Math.floor(Math.random() * 15) + 5; // 5-20秒
            break;
          case '闭眼':
            duration = Math.floor(Math.random() * 25) + 10; // 10-35秒
            break;
          case '点头':
            duration = Math.floor(Math.random() * 20) + 8; // 8-28秒
            break;
          case '眨眼':
            duration = Math.floor(Math.random() * 8) + 2; // 2-10秒
            break;
          case '分神':
            duration = Math.floor(Math.random() * 30) + 15; // 15-45秒
            break;
          default:
            duration = Math.floor(Math.random() * 20) + 10;
        }

        events.push({
          time: dateStr,
          duration: duration,
          type: eventType,
          severity: duration >= 30 ? '高' : duration >= 15 ? '中' : '低',
          location: this.generateRandomLocation()
        });
      }
    }

    // 按时间倒序排列（最新的在前）
    return events.sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  // 生成随机位置信息
  generateRandomLocation() {
    const locations = [
      '北京市朝阳区建国路',
      '北京市海淀区中关村大街',
      '北京市西城区西单大街',
      '北京市东城区王府井大街',
      '北京市丰台区南三环',
      '北京市石景山区石景山路',
      '北京市通州区通惠河北路',
      '北京市昌平区回龙观',
      '北京市大兴区亦庄开发区',
      '北京市房山区良乡大街',
      '北京市顺义区后沙峪',
      '北京市密云区密云大街',
      '天津市和平区南京路',
      '天津市河西区友谊路',
      '河北省石家庄市中山路',
      '河北省保定市朝阳大街',
      '山东省济南市经十路',
      '山东省青岛市香港中路',
      '河南省郑州市中原路',
      '河南省洛阳市王城大道',
      '上海市浦东新区陆家嘴',
      '上海市黄浦区南京东路',
      '江苏省南京市中山路',
      '江苏省苏州市观前街',
      '浙江省杭州市西湖大道',
      '浙江省宁波市中山路'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  // 渲染用户信息
  renderUserInfo() {
    const userInfoCard = document.getElementById('userInfoCard');
    if (!userInfoCard) return;

    const statusColor = this.user.status === '在线' ? '#43a047' : '#6c757d';

    userInfoCard.innerHTML = `
      <div class="user-info-item">
        <i class="fa fa-user"></i>
        <span class="user-info-label">用户名：</span>
        <span class="user-info-value">${this.user.username}</span>
      </div>
      <div class="user-info-item">
        <i class="fa fa-phone"></i>
        <span class="user-info-label">手机号：</span>
        <span class="user-info-value">${this.user.phone || '未设置'}</span>
      </div>
      <div class="user-info-item">
        <i class="fa fa-circle" style="color: ${statusColor};"></i>
        <span class="user-info-label">状态：</span>
        <span class="user-info-value" style="color: ${statusColor};">${this.user.status || '在线'}</span>
      </div>
    `;
  }

  // 设置视频
  setupVideo() {
    const video = document.getElementById('userVideo');
    if (video) {
      // 这里可以设置实际的视频流URL
      video.src = this.user.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4';
    }
  }

  // 渲染图表
  renderCharts() {
    this.renderDetailChart();
    this.renderTrendChart();

    // 添加窗口resize监听，确保图表自适应
    window.addEventListener('resize', () => {
      if (this.charts.detail) {
        this.charts.detail.resize();
      }
      if (this.charts.trend) {
        this.charts.trend.resize();
      }
    });
  }

  // 渲染详情柱状图
  renderDetailChart() {
    const chartDom = document.getElementById('userDetailChart');
    if (!chartDom || !window.echarts) return;

    this.charts.detail = window.echarts.init(chartDom);
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>持续时间: {c}秒'
      },
      grid: {
        left: '10%',
        right: '5%',
        top: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: this.user.events.map(e => e.time.split(' ')[1]), // 只显示时间部分
        axisLabel: {
          rotate: 45,
          textStyle: { fontSize: 11 }
        }
      },
      yAxis: {
        type: 'value',
        name: '持续时间(秒)',
        nameTextStyle: { color: '#666' }
      },
      series: [{
        type: 'bar',
        data: this.user.events.map(e => e.duration),
        label: {
          show: true,
          position: 'top',
          textStyle: { fontSize: 11 }
        },
        itemStyle: {
          color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#66bb6a' },
            { offset: 1, color: '#43a047' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#81c784' },
              { offset: 1, color: '#66bb6a' }
            ])
          }
        }
      }]
    };

    this.charts.detail.setOption(option);
  }

  // 渲染趋势折线图
  renderTrendChart() {
    const chartDom = document.getElementById('userTrendChart');
    if (!chartDom || !window.echarts) return;

    this.charts.trend = window.echarts.init(chartDom);
    
    const trendData = this.user.events.map((_, i) => ({
      date: `6-${20 + i}`,
      count: Math.floor(Math.random() * 3 + 1)
    }));

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}次事件'
      },
      grid: {
        left: '10%',
        right: '5%',
        top: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: trendData.map(e => e.date),
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '事件数',
        nameTextStyle: { color: '#666' }
      },
      series: [{
        type: 'line',
        data: trendData.map(e => e.count),
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
          color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
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
    };

    this.charts.trend.setOption(option);
  }

  // 渲染历史事件表格
  renderHistoryTable() {
    const tbody = document.getElementById('userEventTable');
    const noEventTip = document.getElementById('noEventTip');
    
    if (!tbody || !noEventTip) return;

    tbody.innerHTML = '';
    
    if (this.user.events.length === 0) {
      noEventTip.style.display = 'block';
    } else {
      noEventTip.style.display = 'none';
      
      this.user.events.forEach((e) => {
        const tr = this.createEventTableRow(e);
        tbody.appendChild(tr);
      });
    }
  }

  // 创建事件表格行
  createEventTableRow(event) {
    const tr = document.createElement('tr');
    tr.className = 'history-event-row';

    // 事件类型图标和颜色
    const typeIcons = {
      '打哈欠': { icon: 'fa-yawn', color: '#ff9800' },
      '闭眼': { icon: 'fa-eye-slash', color: '#f44336' },
      '点头': { icon: 'fa-arrow-down', color: '#9c27b0' },
      '眨眼': { icon: 'fa-eye', color: '#2196f3' },
      '分神': { icon: 'fa-question-circle', color: '#607d8b' }
    };

    const typeInfo = typeIcons[event.type] || { icon: 'fa-exclamation-triangle', color: '#6c757d' };
    const durationColor = event.duration >= 30 ? '#f44336' : event.duration >= 20 ? '#ff9800' : '#43a047';

    tr.innerHTML = `
      <td class="event-time-cell">
        <div class="d-flex align-items-center">
          <i class="fa fa-clock-o me-2" style="color: #43a047;"></i>
          ${event.time}
        </div>
      </td>
      <td>
        <span class="event-duration-badge duration-${event.duration >= 30 ? 'high' : event.duration >= 20 ? 'medium' : 'low'}" style="background-color: ${durationColor}; color: white; font-size: 11px;">
          ${event.duration}秒
        </span>
      </td>
      <td class="event-type-cell">
        <div class="d-flex align-items-center">
          <i class="fa ${typeInfo.icon} me-2 event-type-${event.type.replace(/\s+/g, '-')}" style="color: ${typeInfo.color};"></i>
          <strong>${event.type || '未知'}</strong>
        </div>
      </td>
    `;

    return tr;
  }

  // 开始实时事件监控
  startRealtimeEventMonitoring() {
    this.renderRealtimeLog();

    // 暂时注释掉API调用，直接使用模拟数据
    // if (window.userDetailManager) {
    //   window.userDetailManager.startRealtimeEventMonitoring(
    //     this.username,
    //     (events) => {
    //       this.realtimeEvents = events;
    //       this.renderRealtimeLog();
    //     }
    //   );
    // } else {
    //   // 降级到模拟数据
    //   this.startMockRealtimeEvents();
    // }

    // 直接使用模拟实时事件
    this.startMockRealtimeEvents();
  }

  // 模拟实时事件（降级方案）
  startMockRealtimeEvents() {
    const pushEvent = () => {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
      const type = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];
      
      this.realtimeEvents.unshift({time: dateStr, type});
      if (this.realtimeEvents.length > 20) this.realtimeEvents.length = 20;
      
      this.renderRealtimeLog();
      
      // 随机5-10秒后再生成
      setTimeout(pushEvent, Math.random() * 5000 + 5000);
    };
    
    pushEvent();
  }

  // 渲染实时事件日志
  renderRealtimeLog() {
    const logBox = document.getElementById('fatigueLogBox');
    if (!logBox) return;

    logBox.innerHTML = '';
    
    if (this.realtimeEvents.length === 0) {
      logBox.innerHTML = '<div class="realtime-empty"><i class="fa fa-info-circle me-2"></i>暂无实时事件</div>';
    } else {
      this.realtimeEvents.forEach(e => {
        const div = document.createElement('div');
        div.className = 'event-item';
        div.innerHTML = `
          <div class="event-time">
            <i class="fa fa-clock-o me-1"></i>${e.time}
          </div>
          <div class="event-content">
            <i class="fa fa-exclamation-triangle me-1" style="color: #f44336;"></i>
            <strong>${e.type}</strong>
          </div>
        `;
        logBox.appendChild(div);
      });
    }
  }

  // 设置导出按钮
  setupExportButton() {
    const exportBtn = document.getElementById('exportReportBtn');

    if (!exportBtn) return;

    // 检查用户角色，只有监控人员可以看到导出按钮
    const currentUserRole = this.getCurrentUserRole();
    if (currentUserRole === 'monitor' || currentUserRole === 'admin') {
      exportBtn.style.display = 'inline-block';
      exportBtn.addEventListener('click', () => this.handleExportReport());
    } else {
      exportBtn.style.display = 'none';
    }
  }

  // 获取当前用户角色
  getCurrentUserRole() {
    // 从localStorage或URL参数获取当前用户角色
    const urlParams = new URLSearchParams(window.location.search);
    const roleFromUrl = urlParams.get('role');

    if (roleFromUrl) {
      return roleFromUrl;
    }

    // 从localStorage获取
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.role || 'monitor'; // 默认为监控人员
  }

  // 处理导出报告
  async handleExportReport() {
    const exportBtn = document.getElementById('exportReportBtn');
    if (!exportBtn) return;

    try {
      // 显示加载状态
      exportBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-2"></i>生成中...';
      exportBtn.disabled = true;

      // 生成Excel报告
      if (window.fatigueReportGenerator) {
        await window.fatigueReportGenerator.generateReport(this.user);

        // 显示成功消息
        this.showSuccessMessage('Excel疲劳报告已成功生成并下载！');
      } else {
        throw new Error('Excel报告生成器未加载');
      }
    } catch (error) {
      console.error('导出报告失败:', error);
      this.showErrorMessage('导出报告失败，请稍后重试');
    } finally {
      // 恢复按钮状态
      exportBtn.innerHTML = '<i class="fa fa-file-excel-o me-2"></i>导出疲劳报告';
      exportBtn.disabled = false;
    }
  }

  // 显示成功消息
  showSuccessMessage(message) {
    this.showToast(message, 'success');
  }

  // 显示错误消息
  showErrorMessage(message) {
    this.showToast(message, 'error');
  }

  // 使用全局Toast组件
  showToast(message, type = 'info') {
    return window.showToast(message, type);
  }

  // 显示错误信息（页面级错误）
  showError(message) {
    document.body.innerHTML = `
      <div class="user-detail-content">
        <div class="detail-card error-state">
          <i class="fa fa-exclamation-triangle"></i>
          <h4>加载失败</h4>
          <p>${message}</p>
          <a href="javascript:history.back()" class="btn btn-info">
            <i class="fa fa-arrow-left me-2"></i>返回
          </a>
        </div>
      </div>
    `;
  }

  // 设置历史录像功能
  setupVideoHistory() {
    // 生成模拟录像数据
    this.videoHistory = this.generateMockVideoHistory();

    // 默认只显示最近3个录像
    this.renderVideoList(this.videoHistory.slice(0, 3));

    // 设置搜索功能
    this.setupVideoSearch();

    // 设置视频播放模态框
    this.setupVideoModal();
  }

  // 生成模拟录像数据
  generateMockVideoHistory() {
    const videos = [];
    const now = new Date();

    // 生成过去30天的录像数据
    for (let day = 29; day >= 0; day--) {
      const videoDate = new Date(now);
      videoDate.setDate(videoDate.getDate() - day);

      // 每天随机生成1-4个录像
      const videosPerDay = Math.floor(Math.random() * 4) + 1;

      for (let i = 0; i < videosPerDay; i++) {
        // 随机生成时间
        const hour = Math.floor(Math.random() * 16) + 6; // 6:00-22:00
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);

        videoDate.setHours(hour, minute, second, 0);

        const duration = Math.floor(Math.random() * 3600) + 300; // 5分钟到1小时
        const fileSize = Math.floor(Math.random() * 500) + 50; // 50MB-550MB

        videos.push({
          id: `video_${videoDate.getTime()}_${i}`,
          datetime: new Date(videoDate),
          duration: duration,
          fileSize: fileSize,
          filename: `monitor_${this.user.username}_${videoDate.getFullYear()}${(videoDate.getMonth()+1).toString().padStart(2,'0')}${videoDate.getDate().toString().padStart(2,'0')}_${videoDate.getHours().toString().padStart(2,'0')}${videoDate.getMinutes().toString().padStart(2,'0')}.mp4`,
          url: 'https://www.w3schools.com/html/mov_bbb.mp4' // 示例视频URL
        });
      }
    }

    // 按时间倒序排列
    return videos.sort((a, b) => b.datetime - a.datetime);
  }

  // 渲染录像列表
  renderVideoList(videos, isSearchResult = false) {
    const videoList = document.getElementById('videoList');
    const noVideoTip = document.getElementById('noVideoTip');
    const videoListTip = document.querySelector('.video-list-tip');

    if (!videoList || !noVideoTip) return;

    videoList.innerHTML = '';

    // 根据是否是搜索结果来控制提示信息的显示
    if (videoListTip) {
      videoListTip.style.display = isSearchResult ? 'none' : 'block';
    }

    if (videos.length === 0) {
      noVideoTip.style.display = 'block';
      return;
    }

    noVideoTip.style.display = 'none';

    videos.forEach(video => {
      const videoItem = this.createVideoItem(video);
      videoList.appendChild(videoItem);
    });
  }

  // 创建录像项目元素
  createVideoItem(video) {
    const div = document.createElement('div');
    div.className = 'video-item';

    const formatDuration = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2,'0')}`;
    };

    const formatFileSize = (mb) => {
      if (mb >= 1024) {
        return `${(mb / 1024).toFixed(1)} GB`;
      }
      return `${mb} MB`;
    };

    div.innerHTML = `
      <div class="video-item-header">
        <div class="video-time">
          <i class="fa fa-calendar me-1"></i>
          ${video.datetime.toLocaleString('zh-CN')}
        </div>
        <div class="video-duration">
          <i class="fa fa-clock-o me-1"></i>
          ${formatDuration(video.duration)}
        </div>
      </div>
      <div class="video-info">
        <div class="video-size">
          <i class="fa fa-file-video-o me-1"></i>
          ${formatFileSize(video.fileSize)}
        </div>
        <div class="video-actions">
          <button class="btn-video-play" onclick="window.userDetailPage.playVideo('${video.id}')">
            <i class="fa fa-play me-1"></i>查看
          </button>
          <button class="btn-video-download" onclick="window.userDetailPage.downloadVideo('${video.id}')">
            <i class="fa fa-download me-1"></i>下载
          </button>
        </div>
      </div>
    `;

    return div;
  }

  // 设置录像搜索功能
  setupVideoSearch() {
    const searchBtn = document.getElementById('searchVideoBtn');
    const resetBtn = document.getElementById('resetVideoBtn');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.searchVideos());
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetVideoSearch());
    }
  }

  // 搜索录像
  searchVideos() {
    const startDateTime = document.getElementById('startDateTime')?.value;
    const endDateTime = document.getElementById('endDateTime')?.value;

    // 如果没有输入任何搜索条件，提示用户
    if (!startDateTime && !endDateTime) {
      this.showErrorMessage('请选择搜索时间条件');
      return;
    }

    let filteredVideos = [...this.videoHistory];

    if (startDateTime && endDateTime) {
      // 时间区间搜索
      const startTime = new Date(startDateTime);
      const endTime = new Date(endDateTime);

      filteredVideos = filteredVideos.filter(video =>
        video.datetime >= startTime && video.datetime <= endTime
      );
    } else if (startDateTime) {
      // 只有开始时间
      const startTime = new Date(startDateTime);
      filteredVideos = filteredVideos.filter(video => video.datetime >= startTime);
    } else if (endDateTime) {
      // 只有结束时间
      const endTime = new Date(endDateTime);
      filteredVideos = filteredVideos.filter(video => video.datetime <= endTime);
    }

    // 渲染搜索结果，隐藏默认提示
    this.renderVideoList(filteredVideos, true);

    // 显示搜索结果提示
    this.showSuccessMessage(`找到 ${filteredVideos.length} 个录像文件`);
  }

  // 重置录像搜索
  resetVideoSearch() {
    document.getElementById('startDateTime').value = '';
    document.getElementById('endDateTime').value = '';

    // 重置时只显示最近3个录像，显示默认提示
    this.renderVideoList(this.videoHistory.slice(0, 3), false);
    this.showSuccessMessage('已重置搜索条件，显示最近3个录像');
  }

  // 设置视频播放模态框
  setupVideoModal() {
    // 创建模态框HTML
    const modalHTML = `
      <div id="videoModal" class="video-modal">
        <div class="video-modal-content">
          <div class="video-modal-header">
            <h5 class="video-modal-title">监控录像播放</h5>
            <button class="video-modal-close" onclick="window.userDetailPage.closeVideoModal()">
              <i class="fa fa-times"></i>
            </button>
          </div>
          <video id="modalVideo" controls>
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 播放视频
  playVideo(videoId) {
    const video = this.videoHistory.find(v => v.id === videoId);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalTitle = document.querySelector('.video-modal-title');

    if (modal && modalVideo && modalTitle) {
      modalTitle.textContent = `监控录像 - ${video.datetime.toLocaleString('zh-CN')}`;
      modalVideo.src = video.url;
      modal.style.display = 'flex';

      // 点击模态框背景关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeVideoModal();
        }
      });
    }
  }

  // 关闭视频模态框
  closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');

    if (modal && modalVideo) {
      modal.style.display = 'none';
      modalVideo.pause();
      modalVideo.src = '';
    }
  }

  // 下载视频
  downloadVideo(videoId) {
    const video = this.videoHistory.find(v => v.id === videoId);
    if (!video) return;

    // 模拟下载
    this.showSuccessMessage(`正在下载录像文件: ${video.filename}`);

    // 实际项目中这里应该是真实的下载逻辑
    // window.open(video.downloadUrl, '_blank');
  }

  // 清理资源
  destroy() {
    // 停止实时事件监控
    if (window.userDetailManager) {
      window.userDetailManager.stopRealtimeEventMonitoring();
    }

    // 销毁图表
    if (this.charts.detail) {
      this.charts.detail.dispose();
    }
    if (this.charts.trend) {
      this.charts.trend.dispose();
    }
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.userDetailPage = new UserDetailPage();
  window.userDetailPage.init();
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  if (window.userDetailPage) {
    window.userDetailPage.destroy();
  }
});
