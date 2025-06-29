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
        // 处理不同的HTTP状态码
        switch (response.status) {
          case 401:
            // Token过期，清除本地存储并跳转到登录页
            this.clearAuth();
            window.location.href = 'login.html';
            throw new Error('认证失败，请重新登录');
          case 403:
            throw new Error('权限不足，无法访问此资源');
          case 404:
            throw new Error('请求的资源不存在');
          case 409:
            throw new Error('数据冲突，可能是重复操作');
          case 422:
            throw new Error('请求数据格式错误');
          case 500:
            throw new Error('服务器内部错误，请稍后重试');
          case 502:
          case 503:
          case 504:
            throw new Error('服务器暂时不可用，请稍后重试');
          default:
            throw new Error(`请求失败 (${response.status}): ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 网络错误处理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查后端服务是否启动');
      }

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

  // 禁用/启用用户
  async toggleUserStatus(username, status) {
    return this.put(`/users/${username}/status`, { status });
  }

  // ==================== 在线用户API ====================
  
  // 获取在线用户列表
  async getOnlineUsers(params = {}) {
    return this.get('/users/online', params);
  }

  // 获取在线用户趋势数据
  async getOnlineUsersTrend(params = {}) {
    return this.get('/users/online/trend', params);
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

  // 获取疲劳统计数据
  async getFatigueStats(params = {}) {
    return this.get('/monitor/fatigue/stats', params);
  }

  // 获取疲劳趋势数据
  async getFatigueTrend(params = {}) {
    return this.get('/monitor/fatigue/trend', params);
  }

  // ==================== 用户详情API ====================

  // 获取用户详情
  async getUserDetail(username) {
    return this.get(`/users/${username}/detail`);
  }

  // 获取用户疲劳事件历史
  async getUserFatigueEvents(username, params = {}) {
    return this.get(`/users/${username}/fatigue-events`, params);
  }

  // 获取用户健康数据
  async getUserHealthData(username) {
    return this.get(`/users/${username}/health-data`);
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

  // ==================== 系统日志API ====================

  // 获取系统日志
  async getSystemLogs(params = {}) {
    return this.get('/logs', params);
  }

  // 导出系统日志
  async exportSystemLogs(params = {}) {
    return this.get('/export/logs', params);
  }

  // 清除本地logs.json文件（通过Electron IPC实现）
  async clearLocalLogs() {
    // 这个方法在Electron环境中通过window.api.clearLocalLogs()调用
    // 在非Electron环境中返回错误
    if (typeof window.api !== 'undefined' && window.api.clearLocalLogs) {
      return window.api.clearLocalLogs();
    } else {
      throw new Error('此功能仅在Electron环境中可用');
    }
  }
}

// ==================== 商业级API初始化系统 ====================

// API状态管理
const API_STATUS = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  ERROR: 'error',
  NETWORK_ERROR: 'network_error'
};

let apiStatus = API_STATUS.INITIALIZING;
let apiError = null;

// 商业级标准化错误消息
const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查后端服务是否启动',
  INITIALIZATION_ERROR: '系统初始化失败，请刷新页面重试',
  SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
  UNKNOWN_ERROR: '发生未知错误，请联系技术支持',
  API_METHOD_NOT_FOUND: '后端接口不可用，请检查服务器状态',
  AUTHENTICATION_ERROR: '身份验证失败，请重新登录',
  PERMISSION_ERROR: '权限不足，无法执行此操作',
  DATA_FORMAT_ERROR: '数据格式错误，请检查输入内容',
  SERVER_ERROR: '服务器内部错误，请稍后重试'
};

// 创建标准化的API错误
function createApiError(type, originalError = null) {
  const error = new Error(ERROR_MESSAGES[type] || ERROR_MESSAGES.UNKNOWN_ERROR);
  error.type = type;
  error.originalError = originalError;
  return error;
}

// 安全的API服务初始化
function initializeApiService() {
  try {
    if (typeof window === 'undefined') {
      throw createApiError('INITIALIZATION_ERROR', new Error('非浏览器环境'));
    }

    window.apiService = new ApiService();

    // 验证关键方法存在
    const requiredMethods = ['addUser', 'getUsers', 'updateUser', 'deleteUser', 'toggleUserStatus'];
    for (const method of requiredMethods) {
      if (typeof window.apiService[method] !== 'function') {
        throw createApiError('INITIALIZATION_ERROR', new Error(`缺少方法: ${method}`));
      }
    }

    apiStatus = API_STATUS.READY;
    console.log('✅ API服务初始化成功');
    return true;

  } catch (error) {
    apiStatus = API_STATUS.ERROR;
    apiError = error;
    console.error('❌ API服务初始化失败:', error);

    // 创建故障安全的API服务
    window.apiService = createFallbackApiService();
    return false;
  }
}

// 创建商业级故障安全的API服务
function createFallbackApiService() {
  console.warn('⚠️ 创建故障安全API服务，所有请求将返回网络错误');

  const networkError = createApiError('NETWORK_ERROR');

  // 创建统一的错误处理函数
  const createErrorHandler = (methodName) => {
    return () => {
      console.error(`❌ API调用失败: ${methodName}，后端服务不可用`);
      return Promise.reject(networkError);
    };
  };

  return {
    // 用户管理
    addUser: createErrorHandler('addUser'),
    getUsers: createErrorHandler('getUsers'),
    updateUser: createErrorHandler('updateUser'),
    deleteUser: createErrorHandler('deleteUser'),
    toggleUserStatus: createErrorHandler('toggleUserStatus'),

    // 监控数据
    getOnlineUsers: createErrorHandler('getOnlineUsers'),
    getOnlineUsersTrend: createErrorHandler('getOnlineUsersTrend'),
    getSystemLogs: createErrorHandler('getSystemLogs'),
    getMonitorDashboard: createErrorHandler('getMonitorDashboard'),
    getUserMonitorList: createErrorHandler('getUserMonitorList'),
    getFatigueStats: createErrorHandler('getFatigueStats'),
    getFatigueTrend: createErrorHandler('getFatigueTrend'),

    // 认证
    login: createErrorHandler('login'),
    logout: createErrorHandler('logout'),
    getCurrentUser: createErrorHandler('getCurrentUser'),

    // 日志
    getLogs: createErrorHandler('getLogs'),
    addLog: createErrorHandler('addLog')
  };
}

// 执行初始化
initializeApiService();

// 统一使用HTTP API与后端通信

// 检测是否在Electron环境中
const isElectron = typeof window !== 'undefined' &&
                  typeof window.process !== 'undefined' &&
                  window.process.type === 'renderer';

// 保存原有的Electron API（仅保留登录和日志功能）
let electronApi = null;
if (isElectron && typeof window.api !== 'undefined') {
  electronApi = {
    // 登录相关（临时保留用于调试）
    login: window.api.login,
    logout: window.api.logout,
    getCurrentUser: window.api.getCurrentUser,
    // 日志相关
    getLocalLogs: window.api.getLocalLogs,
    addLog: window.api.addLog,
    saveLogsToLocal: window.api.saveLogsToLocal,
    saveTextFile: window.api.saveTextFile,
    deleteLocalLogsFile: window.api.deleteLocalLogsFile,
    // 导航
    navigate: window.api.navigate
  };
  console.log('⚡ Electron环境：保留登录和日志功能');
}

// ==================== 商业级统一API接口 ====================

// API健康检查
function checkApiHealth() {
  return {
    status: apiStatus,
    error: apiError,
    serviceAvailable: !!window.apiService,
    timestamp: new Date().toISOString()
  };
}

// 商业级API调用包装器
function safeApiCall(apiMethod, ...args) {
  return new Promise(async (resolve, reject) => {
    try {
      // 检查API服务状态
      if (apiStatus === API_STATUS.ERROR) {
        console.error(`❌ API服务不可用，方法: ${apiMethod}`);
        reject(createApiError('NETWORK_ERROR'));
        return;
      }

      // 检查API服务是否存在
      if (!window.apiService) {
        console.error(`❌ API服务未初始化，方法: ${apiMethod}`);
        reject(createApiError('NETWORK_ERROR'));
        return;
      }

      // 检查方法是否存在
      if (typeof window.apiService[apiMethod] !== 'function') {
        console.error(`❌ API方法不存在: ${apiMethod}`);
        reject(createApiError('NETWORK_ERROR'));
        return;
      }

      console.log(`🔄 执行API调用: ${apiMethod}`, args.length > 0 ? args : '');

      // 执行API调用
      const result = await window.apiService[apiMethod](...args);

      console.log(`✅ API调用成功: ${apiMethod}`);
      resolve(result);

    } catch (error) {
      console.error(`❌ API调用失败: ${apiMethod}`, error);

      // 标准化错误处理
      if (error.name === 'TypeError') {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          reject(createApiError('NETWORK_ERROR', error));
        } else if (error.message.includes('is not a function')) {
          reject(createApiError('NETWORK_ERROR', error));
        } else {
          reject(createApiError('UNKNOWN_ERROR', error));
        }
      } else if (error.message && error.message.includes('Failed to fetch')) {
        reject(createApiError('NETWORK_ERROR', error));
      } else if (error.message && error.message.includes('NetworkError')) {
        reject(createApiError('NETWORK_ERROR', error));
      } else {
        // 保持原始错误信息（可能包含有用的业务逻辑错误）
        reject(error);
      }
    }
  });
}

// 创建统一的API接口
console.log('🔧 创建商业级API接口...');

window.api = {
  // ==================== 认证相关 ====================
  login: (data) => {
    // 在Electron环境中使用本地验证，Web环境中使用HTTP API
    if (electronApi && electronApi.login) {
      return electronApi.login(data);
    }
    return safeApiCall('login', data.username, data.password);
  },

  logout: () => {
    if (electronApi && electronApi.logout) {
      return electronApi.logout();
    }
    return safeApiCall('logout');
  },

  getCurrentUser: () => {
    if (electronApi && electronApi.getCurrentUser) {
      return electronApi.getCurrentUser();
    }
    return safeApiCall('getCurrentUser');
  },

  // ==================== 用户管理 ====================
  // 统一使用HTTP API，确保数据来源一致
  getUsers: (params = {}) => {
    return safeApiCall('getUsers', params);
  },

  addUser: (user) => {
    return safeApiCall('addUser', user);
  },

  updateUser: (user) => {
    return safeApiCall('updateUser', user.username, user);
  },

  deleteUser: (username) => {
    return safeApiCall('deleteUser', username);
  },

  toggleUserStatus: (username, status) => {
    return safeApiCall('toggleUserStatus', username, status);
  },

  // ==================== 监控数据 ====================
  getOnlineUsers: () => {
    return safeApiCall('getOnlineUsers');
  },

  getOnlineUsersTrend: (params = {}) => {
    return safeApiCall('getOnlineUsersTrend', params);
  },

  getSystemLogs: () => {
    return safeApiCall('getSystemLogs');
  },

  getMonitorDashboard: () => {
    return safeApiCall('getMonitorDashboard');
  },

  getUserMonitorList: (params = {}) => {
    return safeApiCall('getUserMonitorList', params);
  },

  getFatigueStats: (params = {}) => {
    return safeApiCall('getFatigueStats', params);
  },

  getFatigueTrend: (params = {}) => {
    return safeApiCall('getFatigueTrend', params);
  },

  // ==================== 用户详情 ====================
  getUserDetail: (username) => {
    return safeApiCall('getUserDetail', username);
  },

  getUserFatigueEvents: (username, params = {}) => {
    return safeApiCall('getUserFatigueEvents', username, params);
  },

  getUserHealthData: (username) => {
    return safeApiCall('getUserHealthData', username);
  },

  // ==================== 日志管理 ====================
  getLogs: () => {
    // 优先使用本地日志（Electron环境）
    if (electronApi && electronApi.getLocalLogs) {
      return electronApi.getLocalLogs();
    }
    return safeApiCall('getLogs');
  },

  addLog: (log) => {
    if (electronApi && electronApi.addLog) {
      return electronApi.addLog(log);
    }
    return safeApiCall('addLog', log);
  },

  saveLogsToLocal: (logs) => {
    if (electronApi && electronApi.saveLogsToLocal) {
      return electronApi.saveLogsToLocal(logs);
    }
    return Promise.reject(createApiError('SERVICE_UNAVAILABLE', new Error('本地日志保存功能仅在Electron环境中可用')));
  },

  saveTextFile: (content, defaultFileName) => {
    if (electronApi && electronApi.saveTextFile) {
      return electronApi.saveTextFile(content, defaultFileName);
    }
    return Promise.reject(createApiError('SERVICE_UNAVAILABLE', new Error('文本文件保存功能仅在Electron环境中可用')));
  },

  deleteLocalLogsFile: () => {
    if (electronApi && electronApi.deleteLocalLogsFile) {
      return electronApi.deleteLocalLogsFile();
    }
    return Promise.reject(createApiError('SERVICE_UNAVAILABLE', new Error('本地日志删除功能仅在Electron环境中可用')));
  },

  // ==================== 导航 ====================
  navigate: (page) => {
    if (electronApi && electronApi.navigate) {
      return electronApi.navigate(page);
    }
    window.location.href = page;
  }
  };

  // 立即验证API接口是否正确创建
  if (!window.api) {
    throw new Error('window.api 创建失败');
  }

  if (typeof window.api.addUser !== 'function') {
    throw new Error('window.api.addUser 方法创建失败');
  }

  if (typeof window.api.getUsers !== 'function') {
    throw new Error('window.api.getUsers 方法创建失败');
  }

// API健康检查方法
window.api.getApiHealth = checkApiHealth;

console.log('✅ 商业级API接口创建成功，包含方法:', Object.keys(window.api).length);

// 确保API接口正确初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    // 验证关键API方法是否存在
    if (!window.api || typeof window.api.addUser !== 'function' || typeof window.api.getUsers !== 'function') {
      console.warn('API接口异常，尝试修复...');

      // 强制重新创建API接口
      if (window.apiService) {
        window.api = {
          // 认证相关
          login: (data) => window.apiService.login(data.username, data.password),
          logout: () => window.apiService.logout(),
          getCurrentUser: () => window.apiService.getCurrentUser(),

          // 用户管理
          getUsers: (params = {}) => window.apiService.getUsers(params),
          addUser: (user) => window.apiService.addUser(user),
          updateUser: (user) => window.apiService.updateUser(user.username, user),
          deleteUser: (username) => window.apiService.deleteUser(username),
          toggleUserStatus: (username, status) => window.apiService.toggleUserStatus(username, status),

          // 监控数据
          getOnlineUsers: () => window.apiService.getOnlineUsers(),
          getOnlineUsersTrend: (params = {}) => window.apiService.getOnlineUsersTrend(params),
          getSystemLogs: () => window.apiService.getSystemLogs(),
          getMonitorDashboard: () => window.apiService.getMonitorDashboard(),
          getUserMonitorList: (params = {}) => window.apiService.getUserMonitorList(params),
          getFatigueStats: (params = {}) => window.apiService.getFatigueStats(params),
          getFatigueTrend: (params = {}) => window.apiService.getFatigueTrend(params),

          // 用户详情
          getUserDetail: (username) => window.apiService.getUserDetail(username),
          getUserFatigueEvents: (username, params = {}) => window.apiService.getUserFatigueEvents(username, params),
          getUserHealthData: (username) => window.apiService.getUserHealthData(username),

          // 日志
          getLogs: () => window.apiService.getLogs(),
          addLog: (log) => window.apiService.addLog(log),

          // 导航
          navigate: (page) => { window.location.href = page; }
        };
        console.log('✅ API接口修复完成');
      }
    }
  });
}
