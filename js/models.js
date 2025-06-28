// 数据模型和状态管理
class DataStore {
  constructor() {
    this.cache = new Map();
    this.subscribers = new Map();
  }

  // 设置数据
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    this.notify(key, data);
  }

  // 获取数据
  get(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  // 检查缓存是否过期
  isExpired(key, maxAge = 5 * 60 * 1000) { // 默认5分钟过期
    const cached = this.cache.get(key);
    if (!cached) return true;
    return Date.now() - cached.timestamp > maxAge;
  }

  // 订阅数据变化
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
  }

  // 取消订阅
  unsubscribe(key, callback) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  // 通知订阅者
  notify(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // 清除缓存
  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// 用户数据管理
class UserDataManager {
  constructor(apiService, dataStore) {
    this.api = apiService;
    this.store = dataStore;
  }

  // 获取用户列表（带缓存）
  async getUsers(forceRefresh = false) {
    const cacheKey = 'users';
    
    if (!forceRefresh && !this.store.isExpired(cacheKey)) {
      return this.store.get(cacheKey);
    }

    try {
      const users = await this.api.getUsers();
      this.store.set(cacheKey, users);
      return users;
    } catch (error) {
      console.error('获取用户列表失败:', error);
      // 返回缓存数据作为降级方案
      return this.store.get(cacheKey) || [];
    }
  }

  // 添加用户
  async addUser(userData) {
    try {
      const result = await this.api.addUser(userData);
      // 清除用户列表缓存，强制下次重新获取
      this.store.clear('users');
      return result;
    } catch (error) {
      console.error('添加用户失败:', error);
      throw error;
    }
  }

  // 更新用户
  async updateUser(username, userData) {
    try {
      const result = await this.api.updateUser(username, userData);
      this.store.clear('users');
      return result;
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  // 删除用户
  async deleteUser(username) {
    try {
      const result = await this.api.deleteUser(username);
      this.store.clear('users');
      return result;
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }
}

// 在线用户数据管理
class OnlineUserManager {
  constructor(apiService, dataStore) {
    this.api = apiService;
    this.store = dataStore;
    this.refreshInterval = null;
  }

  // 获取在线用户列表
  async getOnlineUsers(forceRefresh = false) {
    const cacheKey = 'onlineUsers';
    
    if (!forceRefresh && !this.store.isExpired(cacheKey, 30000)) { // 30秒缓存
      return this.store.get(cacheKey);
    }

    try {
      const onlineUsers = await this.api.getOnlineUsers();
      this.store.set(cacheKey, onlineUsers);
      return onlineUsers;
    } catch (error) {
      console.error('获取在线用户失败:', error);
      return this.store.get(cacheKey) || [];
    }
  }

  // 获取在线用户统计
  async getOnlineStats() {
    try {
      return await this.api.getOnlineStats();
    } catch (error) {
      console.error('获取在线统计失败:', error);
      return { total: 0, byRole: {} };
    }
  }

  // 获取在线趋势数据
  async getOnlineTrend(params = {}) {
    try {
      return await this.api.getOnlineTrend(params);
    } catch (error) {
      console.error('获取在线趋势失败:', error);
      return { dates: [], counts: [] };
    }
  }

  // 开始自动刷新
  startAutoRefresh(interval = 30000) {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      this.getOnlineUsers(true);
    }, interval);
  }

  // 停止自动刷新
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// 监控数据管理
class MonitorDataManager {
  constructor(apiService, dataStore) {
    this.api = apiService;
    this.store = dataStore;
  }

  // 获取监控仪表板数据
  async getDashboardData(forceRefresh = false) {
    const cacheKey = 'monitorDashboard';
    
    if (!forceRefresh && !this.store.isExpired(cacheKey, 60000)) { // 1分钟缓存
      return this.store.get(cacheKey);
    }

    try {
      const dashboardData = await this.api.getMonitorDashboard();
      this.store.set(cacheKey, dashboardData);
      return dashboardData;
    } catch (error) {
      console.error('获取监控数据失败:', error);
      return this.store.get(cacheKey) || this.getDefaultDashboardData();
    }
  }

  // 获取用户监控列表
  async getUserMonitorList(params = {}) {
    try {
      return await this.api.getUserMonitorList(params);
    } catch (error) {
      console.error('获取用户监控列表失败:', error);
      return { users: [], total: 0, page: 1, pageSize: 10 };
    }
  }

  // 获取高风险用户
  async getDangerUsers(sortBy = 'fatigueCount') {
    try {
      return await this.api.getDangerUsers(sortBy);
    } catch (error) {
      console.error('获取高风险用户失败:', error);
      return [];
    }
  }

  // 获取疲劳统计数据
  async getFatigueStats() {
    try {
      return await this.api.getFatigueStats();
    } catch (error) {
      console.error('获取疲劳统计失败:', error);
      return { pieData: [], trendData: [] };
    }
  }

  // 默认仪表板数据
  getDefaultDashboardData() {
    return {
      onlineCount: 0,
      totalCount: 0,
      fatigueCount: 0,
      users: [],
      fatigueTrend: [],
      fatigueTrendDate: []
    };
  }
}

// 用户详情数据管理
class UserDetailManager {
  constructor(apiService, dataStore) {
    this.api = apiService;
    this.store = dataStore;
    this.realtimeEventInterval = null;
  }

  // 获取用户详情
  async getUserDetail(username) {
    try {
      return await this.api.getUserDetail(username);
    } catch (error) {
      console.error('获取用户详情失败:', error);
      throw error;
    }
  }

  // 获取用户疲劳事件历史
  async getUserFatigueEvents(username, params = {}) {
    try {
      return await this.api.getUserFatigueEvents(username, params);
    } catch (error) {
      console.error('获取用户疲劳事件失败:', error);
      return [];
    }
  }

  // 获取用户实时事件
  async getUserRealtimeEvents(username) {
    try {
      return await this.api.getUserRealtimeEvents(username);
    } catch (error) {
      console.error('获取实时事件失败:', error);
      return [];
    }
  }

  // 开始实时事件监听
  startRealtimeEventMonitoring(username, callback, interval = 5000) {
    this.stopRealtimeEventMonitoring();
    
    const fetchEvents = async () => {
      try {
        const events = await this.getUserRealtimeEvents(username);
        callback(events);
      } catch (error) {
        console.error('实时事件监听失败:', error);
      }
    };

    // 立即执行一次
    fetchEvents();
    
    // 设置定时器
    this.realtimeEventInterval = setInterval(fetchEvents, interval);
  }

  // 停止实时事件监听
  stopRealtimeEventMonitoring() {
    if (this.realtimeEventInterval) {
      clearInterval(this.realtimeEventInterval);
      this.realtimeEventInterval = null;
    }
  }
}

// 创建全局数据管理实例
window.dataStore = new DataStore();
window.userDataManager = new UserDataManager(window.apiService, window.dataStore);
window.onlineUserManager = new OnlineUserManager(window.apiService, window.dataStore);
window.monitorDataManager = new MonitorDataManager(window.apiService, window.dataStore);
window.userDetailManager = new UserDetailManager(window.apiService, window.dataStore);
