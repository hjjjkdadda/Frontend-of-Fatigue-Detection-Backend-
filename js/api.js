// API服务层 - 统一管理所有后端接口调用
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3000/api'; // 后端API基础URL
    this.token = localStorage.getItem('authToken') || '';
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token过期，清除本地存储并跳转到登录页
          this.clearAuth();
          window.location.href = 'login.html';
          throw new Error('认证失败，请重新登录');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // GET请求
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST请求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT请求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // 设置认证token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // 清除认证信息
  clearAuth() {
    this.token = '';
    localStorage.removeItem('authToken');
  }

  // ==================== 认证相关API ====================
  
  // 用户登录
  async login(username, password) {
    const response = await this.post('/auth/login', { username, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  // 用户注册
  async register(userData) {
    return this.post('/auth/register', userData);
  }

  // 用户登出
  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // ==================== 用户管理API ====================
  
  // 获取用户列表（返回所有符合条件的数据，前端分页）
  async getUsers(params = {}) {
    // 只传递筛选参数，不传递分页参数
    const filterParams = {};
    if (params.role) filterParams.role = params.role;
    if (params.status) filterParams.status = params.status;
    if (params.search) filterParams.search = params.search;

    return this.get('/users', filterParams);
  }

  // 获取单个用户详情
  async getUser(username) {
    return this.get(`/users/${username}`);
  }

  // 添加用户
  async addUser(userData) {
    return this.post('/users', userData);
  }

  // 更新用户
  async updateUser(username, userData) {
    return this.put(`/users/${username}`, userData);
  }

  // 删除用户
  async deleteUser(username) {
    return this.delete(`/users/${username}`);
  }

  // ==================== 在线用户API ====================
  
  // 获取在线用户列表
  async getOnlineUsers(params = {}) {
    return this.get('/users/online', params);
  }

  // 获取在线用户统计
  async getOnlineStats() {
    return this.get('/users/online/stats');
  }

  // 获取在线用户趋势数据
  async getOnlineTrend(params = {}) {
    return this.get('/users/online/trend', params);
  }

  // ==================== 监控数据API ====================
  
  // 获取监控仪表板数据
  async getMonitorDashboard() {
    return this.get('/monitor/dashboard');
  }

  // 获取用户监控列表
  async getUserMonitorList(params = {}) {
    return this.get('/monitor/users', params);
  }

  // 获取高风险用户TOP5
  async getDangerUsers(sortBy = 'fatigueCount') {
    return this.get('/monitor/danger-users', { sortBy });
  }

  // 获取疲劳事件统计
  async getFatigueStats() {
    return this.get('/monitor/fatigue/stats');
  }

  // 获取疲劳事件趋势
  async getFatigueTrend(params = {}) {
    return this.get('/monitor/fatigue/trend', params);
  }

  // ==================== 用户详情API ====================

  // 获取用户详细信息
  async getUserDetail(username) {
    return this.get(`/users/${username}/detail`);
  }

  // 获取用户疲劳事件历史
  async getUserFatigueEvents(username, params = {}) {
    return this.get(`/users/${username}/fatigue-events`, params);
  }

  // 获取用户实时监控流
  async getUserVideoStream(username) {
    return this.get(`/users/${username}/video-stream`);
  }

  // 获取用户实时事件
  async getUserRealtimeEvents(username) {
    return this.get(`/users/${username}/realtime-events`);
  }

  // 获取用户视频历史记录
  async getUserVideoHistory(username, params = {}) {
    return this.get(`/users/${username}/video-history`, params);
  }

  // 获取用户健康数据
  async getUserHealthData(username) {
    return this.get(`/users/${username}/health`);
  }

  // 更新用户健康数据
  async updateUserHealthData(username, healthData) {
    return this.put(`/users/${username}/health`, healthData);
  }

  // 获取用户驾驶统计
  async getUserDrivingStats(username, params = {}) {
    return this.get(`/users/${username}/driving-stats`, params);
  }

  // ==================== 系统日志API ====================
  
  // 获取系统日志
  async getLogs(params = {}) {
    return this.get('/logs', params);
  }

  // 添加系统日志
  async addLog(logData) {
    return this.post('/logs', logData);
  }

  // ==================== 疲劳事件API ====================

  // 添加疲劳事件
  async addFatigueEvent(username, eventData) {
    return this.post(`/users/${username}/fatigue-events`, eventData);
  }

  // 更新疲劳事件
  async updateFatigueEvent(username, eventId, eventData) {
    return this.put(`/users/${username}/fatigue-events/${eventId}`, eventData);
  }

  // 删除疲劳事件
  async deleteFatigueEvent(username, eventId) {
    return this.delete(`/users/${username}/fatigue-events/${eventId}`);
  }

  // 批量导入疲劳事件
  async batchImportFatigueEvents(username, events) {
    return this.post(`/users/${username}/fatigue-events/batch`, { events });
  }

  // ==================== 视频监控API ====================

  // 获取视频监控列表
  async getVideoMonitorList(params = {}) {
    return this.get('/video/monitors', params);
  }

  // 开始视频监控
  async startVideoMonitor(username) {
    return this.post(`/video/monitors/${username}/start`);
  }

  // 停止视频监控
  async stopVideoMonitor(username) {
    return this.post(`/video/monitors/${username}/stop`);
  }

  // 获取视频监控状态
  async getVideoMonitorStatus(username) {
    return this.get(`/video/monitors/${username}/status`);
  }

  // 获取视频录像列表
  async getVideoRecordings(username, params = {}) {
    return this.get(`/video/recordings/${username}`, params);
  }

  // 删除视频录像
  async deleteVideoRecording(username, recordingId) {
    return this.delete(`/video/recordings/${username}/${recordingId}`);
  }

  // ==================== 设备管理API ====================

  // 获取设备列表
  async getDevices(params = {}) {
    return this.get('/devices', params);
  }

  // 添加设备
  async addDevice(deviceData) {
    return this.post('/devices', deviceData);
  }

  // 更新设备
  async updateDevice(deviceId, deviceData) {
    return this.put(`/devices/${deviceId}`, deviceData);
  }

  // 删除设备
  async deleteDevice(deviceId) {
    return this.delete(`/devices/${deviceId}`);
  }

  // 获取设备状态
  async getDeviceStatus(deviceId) {
    return this.get(`/devices/${deviceId}/status`);
  }

  // 绑定设备到用户
  async bindDeviceToUser(deviceId, username) {
    return this.post(`/devices/${deviceId}/bind`, { username });
  }

  // 解绑设备
  async unbindDevice(deviceId) {
    return this.post(`/devices/${deviceId}/unbind`);
  }

  // ==================== 统计报表API ====================

  // 获取用户角色分布统计
  async getUserRoleStats() {
    return this.get('/stats/user-roles');
  }

  // 获取疲劳事件类型统计
  async getFatigueTypeStats(params = {}) {
    return this.get('/stats/fatigue-types', params);
  }

  // 获取系统使用统计
  async getSystemUsageStats(params = {}) {
    return this.get('/stats/system-usage', params);
  }

  // 获取时间段统计
  async getTimeRangeStats(params = {}) {
    return this.get('/stats/time-range', params);
  }

  // 获取部门统计
  async getDepartmentStats() {
    return this.get('/stats/departments');
  }

  // 获取车辆统计
  async getVehicleStats() {
    return this.get('/stats/vehicles');
  }

  // ==================== 系统配置API ====================

  // 获取系统配置
  async getSystemConfig() {
    return this.get('/config/system');
  }

  // 更新系统配置
  async updateSystemConfig(config) {
    return this.put('/config/system', config);
  }

  // 获取疲劳阈值配置
  async getFatigueThresholds() {
    return this.get('/config/fatigue-thresholds');
  }

  // 更新疲劳阈值配置
  async updateFatigueThresholds(thresholds) {
    return this.put('/config/fatigue-thresholds', thresholds);
  }

  // 获取告警配置
  async getAlertConfig() {
    return this.get('/config/alerts');
  }

  // 更新告警配置
  async updateAlertConfig(config) {
    return this.put('/config/alerts', config);
  }

  // ==================== 告警通知API ====================

  // 获取告警列表
  async getAlerts(params = {}) {
    return this.get('/alerts', params);
  }

  // 添加告警
  async addAlert(alertData) {
    return this.post('/alerts', alertData);
  }

  // 更新告警状态
  async updateAlertStatus(alertId, status) {
    return this.put(`/alerts/${alertId}/status`, { status });
  }

  // 删除告警
  async deleteAlert(alertId) {
    return this.delete(`/alerts/${alertId}`);
  }

  // 批量处理告警
  async batchProcessAlerts(alertIds, action) {
    return this.post('/alerts/batch', { alertIds, action });
  }

  // ==================== 数据导入导出API ====================

  // 导出用户数据
  async exportUsers(format = 'excel', params = {}) {
    return this.get('/export/users', { format, ...params });
  }

  // 导出疲劳事件数据
  async exportFatigueEvents(format = 'excel', params = {}) {
    return this.get('/export/fatigue-events', { format, ...params });
  }

  // 导出统计报表
  async exportStats(reportType, format = 'excel', params = {}) {
    return this.get(`/export/stats/${reportType}`, { format, ...params });
  }

  // 导入用户数据
  async importUsers(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    return this.post('/import/users', formData, {
      'Content-Type': 'multipart/form-data'
    });
  }

  // 导入疲劳事件数据
  async importFatigueEvents(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));
    return this.post('/import/fatigue-events', formData, {
      'Content-Type': 'multipart/form-data'
    });
  }

  // ==================== 实时数据API ====================

  // 获取实时在线用户
  async getRealtimeOnlineUsers() {
    return this.get('/realtime/online-users');
  }

  // 获取实时疲劳事件
  async getRealtimeFatigueEvents() {
    return this.get('/realtime/fatigue-events');
  }

  // 获取实时系统状态
  async getRealtimeSystemStatus() {
    return this.get('/realtime/system-status');
  }

  // 订阅实时数据（WebSocket）
  subscribeRealtimeData(callback) {
    const wsUrl = this.baseURL.replace('http', 'ws') + '/ws/realtime';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('WebSocket数据解析失败:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
    };

    return ws;
  }
}

// 创建全局API实例
window.apiService = new ApiService();

// 兼容原有的window.api接口
window.api = {
  // 认证相关
  login: (username, password) => window.apiService.login(username, password),
  logout: () => window.apiService.logout(),
  getCurrentUser: () => window.apiService.getCurrentUser(),
  
  // 用户管理
  getUsers: () => window.apiService.getUsers(),
  addUser: (user) => window.apiService.addUser(user),
  updateUser: (username, user) => window.apiService.updateUser(username, user),
  deleteUser: (username) => window.apiService.deleteUser(username),
  
  // 日志
  getLogs: () => window.apiService.getLogs(),
  addLog: (log) => window.apiService.addLog(log),
  
  // 导航（保持原有逻辑）
  navigate: (page) => {
    window.location.href = page;
  }
};
