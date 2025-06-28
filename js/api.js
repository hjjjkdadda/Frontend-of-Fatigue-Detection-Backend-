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
  
  // 获取用户列表
  async getUsers(params = {}) {
    return this.get('/users', params);
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

  // ==================== 系统日志API ====================
  
  // 获取系统日志
  async getLogs(params = {}) {
    return this.get('/logs', params);
  }

  // 添加系统日志
  async addLog(logData) {
    return this.post('/logs', logData);
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
