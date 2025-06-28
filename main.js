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
ipcMain.handle('getLogs', () => logs);
ipcMain.handle('addLog', (event, log) => {
  logs.push({ ...log, time: new Date() });
  saveLogs();
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

// 登录处理
ipcMain.handle('login', (event, { username, password, role }) => {
  // 这里应接入后端校验，演示用静态数据
  if (username && password && ['admin', 'driver', 'monitor'].includes(role)) {
    currentUser = { username, role };
    token = createToken(currentUser);
    logs.push({ time: new Date(), user: username, action: 'login', role });
    saveLogs();
    return { success: true, role, token };
  }
  return { success: false };
});

ipcMain.handle('logout', () => {
  logs.push({ time: new Date(), user: currentUser?.username, action: 'logout' });
  saveLogs();
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