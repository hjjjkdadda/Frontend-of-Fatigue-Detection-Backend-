const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

let mainWindow;
let currentUser = null;
let token = null;
const LOG_PATH = path.join(__dirname, 'logs.json');

function createToken(user) {
  return crypto.randomBytes(16).toString('hex');
}

function createWindow(page = 'login.html') {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadFile(page);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 日志相关
let logs = [];
function loadLogs() {
  try {
    if (fs.existsSync(LOG_PATH)) {
      const data = fs.readFileSync(LOG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
}
function saveLogs() {
  try {
    fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {}
}
logs = loadLogs();

// 获取本地日志
ipcMain.handle('getLocalLogs', () => {
  try {
    logs = loadLogs(); // 重新从文件加载
    console.log(`📖 读取本地日志: ${logs.length} 条`);
    return logs;
  } catch (error) {
    console.error('❌ 读取本地日志失败:', error);
    return [];
  }
});

// 添加单条日志
ipcMain.handle('addLog', (event, log) => {
  logs.push({ ...log, time: new Date() });
  saveLogs();
});

// 保存日志数组到本地文件
ipcMain.handle('saveLogsToLocal', (event, logsData) => {
  try {
    // 合并新日志到现有日志中（去重）
    const existingLogs = loadLogs();
    const existingTimes = new Set(existingLogs.map(log => log.time));

    // 只添加不存在的新日志
    const newLogs = logsData.filter(log => !existingTimes.has(log.time));

    if (newLogs.length > 0) {
      logs = [...existingLogs, ...newLogs];
      // 按时间排序
      logs.sort((a, b) => new Date(a.time) - new Date(b.time));
      saveLogs();
      console.log(`💾 保存 ${newLogs.length} 条新日志到本地，总计 ${logs.length} 条`);
    } else {
      console.log('📝 没有新日志需要保存');
    }

    return { success: true, message: `保存了 ${newLogs.length} 条新日志`, totalLogs: logs.length };
  } catch (error) {
    console.error('❌ 保存日志到本地失败:', error);
    return { success: false, message: '保存失败' };
  }
});

// 删除本地日志文件
ipcMain.handle('deleteLocalLogsFile', () => {
  try {
    if (fs.existsSync(LOG_PATH)) {
      fs.unlinkSync(LOG_PATH);
      logs = [];
      console.log('🗑️ 本地日志文件已删除');
      return { success: true, message: '本地日志文件已删除' };
    } else {
      console.log('📄 本地日志文件不存在');
      return { success: true, message: '本地日志文件不存在' };
    }
  } catch (error) {
    console.error('❌ 删除本地日志文件失败:', error);
    return { success: false, message: '删除失败' };
  }
});

// 用户管理（管理员权限）
let users = [
  { username: 'admin', role: 'admin' },
  { username: 'driver1', role: 'driver' },
  { username: 'monitor1', role: 'monitor' }
];
ipcMain.handle('getUsers', () => users);
ipcMain.handle('addUser', (event, user) => {
  users.push(user);
  logs.push({ time: new Date(), user: currentUser?.username, action: 'addUser', detail: user });
  saveLogs();
});
ipcMain.handle('deleteUser', (event, username) => {
  users = users.filter(u => u.username !== username);
  logs.push({ time: new Date(), user: currentUser?.username, action: 'deleteUser', detail: username });
  saveLogs();
});
ipcMain.handle('updateUser', (event, user) => {
  users = users.map(u => u.username === user.username ? user : u);
  logs.push({ time: new Date(), user: currentUser?.username, action: 'updateUser', detail: user });
  saveLogs();
});

// 用户会话管理
let userSessions = new Map(); // 存储用户会话信息

// 登录处理
ipcMain.handle('login', (event, { username, password, role }) => {
  // 这里应接入后端校验，演示用静态数据
  if (username && password && ['admin', 'monitor'].includes(role)) {
    // 如果用户已经有会话，先记录退出
    if (currentUser && currentUser.username !== username) {
      logs.push({
        time: new Date(),
        user: currentUser.username,
        action: 'logout',
        role: currentUser.role
      });
    }

    // 创建新的用户会话
    const sessionInfo = {
      username,
      role,
      loginTime: new Date(),
      token: createToken({ username, role })
    };

    currentUser = { username, role };
    token = sessionInfo.token;

    // 存储会话信息
    userSessions.set(username, sessionInfo);

    // 记录登录日志
    logs.push({
      time: new Date(),
      user: username,
      action: 'login',
      role: role
    });
    saveLogs();

    console.log(`✅ 用户 ${username} 以 ${role} 角色登录成功`);
    return { success: true, role, token: sessionInfo.token };
  }
  return { success: false };
});

ipcMain.handle('logout', () => {
  // 记录退出日志，包含完整的会话信息
  if (currentUser) {
    const sessionInfo = userSessions.get(currentUser.username);

    logs.push({
      time: new Date(),
      user: currentUser.username,
      action: 'logout',
      role: currentUser.role,
      sessionDuration: sessionInfo ? Math.round((new Date() - sessionInfo.loginTime) / 1000) : 0
    });
    saveLogs();

    // 清除会话信息
    userSessions.delete(currentUser.username);
    console.log(`✅ 用户 ${currentUser.username} (${currentUser.role}) 退出登录`);
  }

  currentUser = null;
  token = null;
  if (mainWindow) mainWindow.loadFile('login.html');
});

// 路由拦截
ipcMain.handle('navigate', (event, page) => {
  // 允许未登录访问的页面
  const publicPages = ['login.html', 'register.html'];
  // 需要登录才能访问的页面
  const authPages = {
    'admin.html': 'admin',
    'driver.html': 'driver',
    'monitor.html': 'monitor',
    'log.html': 'admin'
  };
  if (publicPages.includes(page)) {
    mainWindow.loadFile(page);
    return;
  }
  if (!currentUser || !token) {
    if (mainWindow) mainWindow.loadFile('login.html');
    return;
  }
  if (authPages[page] && currentUser.role !== authPages[page]) {
    if (mainWindow) mainWindow.loadFile('login.html');
    return;
  }
  mainWindow.loadFile(page);
});

// 获取当前用户
ipcMain.handle('getCurrentUser', () => currentUser);
ipcMain.handle('getToken', () => token);