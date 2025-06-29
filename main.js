const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const LOG_PATH = path.join(__dirname, 'logs.json');

function createWindow(page = 'login.html') 
{

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

// 添加一些示例系统日志（仅在日志为空时添加）
if (0 === 0) {
  addSystemLog('info', 'system_startup', '疲劳检测系统启动');

  // 数据库相关错误
  addSystemLog('warning', 'database_connection', '数据库连接超时，正在重试',
    new Error('Connection timeout after 5000ms\n    at Database.connect (database.js:45:12)\n    at async connectToDatabase (app.js:23:5)'));

  // 传感器设备错误
  addSystemLog('error', 'sensor_malfunction', '传感器设备离线',
    new Error('Device not responding on port COM3\n    at SerialPort.open (serialport.js:156:23)\n    at SensorManager.connect (sensor.js:78:15)\n    at DeviceController.initialize (device.js:34:8)'));

  // API调用错误
  addSystemLog('error', 'api_request_failed', '后端API调用失败',
    new Error('HTTP 500 Internal Server Error\n    at fetch (/api/users)\n    Response: {"error": "Database query failed", "code": "DB_ERROR"}'));

  // 文件系统错误
  addSystemLog('warning', 'file_permission', '日志文件写入权限不足',
    new Error('EACCES: permission denied, open \'/var/log/fatigue.log\'\n    at Object.openSync (fs.js:498:3)\n    at Object.writeFileSync (fs.js:1467:35)'));

  // 网络连接错误
  addSystemLog('error', 'network_timeout', '网络请求超时',
    new Error('ETIMEDOUT: connect timeout\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1146:16)\n    Target: https://api.fatigue-detection.com/status'));

  addSystemLog('success', 'backup_completed', '数据备份完成，备份文件大小: 2.3MB');
}

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

// 添加系统日志（错误、警告等）
function addSystemLog(level, action, detail, error = null) {
  const logEntry = {
    time: new Date(),
    user: 'System',
    action: action,
    level: level,
    detail: detail
  };

  if (error) {
    logEntry.error = error.message;
    logEntry.stack = error.stack;
  }

  logs.push(logEntry);
  saveLogs();
  console.log(`📝 系统日志记录: [${level.toUpperCase()}] ${action} - ${detail}`);
}

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
      const backupLogs = [...logs]; // 备份当前日志用于记录
      fs.unlinkSync(LOG_PATH);
      logs = [];

      // 记录删除操作（在内存中，因为文件已删除）
      const deleteLog = {
        time: new Date(),
        user: currentUser?.username || 'System',
        action: 'delete_logs_file',
        level: 'warning',
        detail: `删除了包含 ${backupLogs.length} 条记录的日志文件`
      };
      logs.push(deleteLog);

      console.log('🗑️ 本地日志文件已删除');
      return { success: true, message: '本地日志文件已删除' };
    } else {
      console.log('📄 本地日志文件不存在');
      addSystemLog('info', 'delete_logs_file_not_found', '尝试删除不存在的日志文件');
      return { success: true, message: '本地日志文件不存在' };
    }
  } catch (error) {
    console.error('❌ 删除本地日志文件失败:', error);
    addSystemLog('error', 'delete_logs_file_failed', '删除日志文件失败', error);
    return { success: false, message: '删除失败' };
  }
});

// 用户管理相关代码已删除 - 所有用户数据现在从后端获取

// 临时保留登录功能用于调试 - 用户管理仍使用后端API
let currentUser = null;
let token = null;

// 登录处理（临时保留用于调试）
ipcMain.handle('login', (event, { username, password, role }) => {
  try {
    // 简单的本地验证用于调试
    if (username && password && ['admin', 'monitor'].includes(role)) {
      currentUser = { username, role };
      token = 'debug-token-' + Date.now();

      // 记录登录日志
      logs.push({
        time: new Date(),
        user: username,
        action: 'login',
        role: role,
        level: 'info'
      });
      saveLogs();

      console.log(`✅ 用户 ${username} (${role}) 登录成功 [调试模式]`);
      return { success: true, role, token };
    } else {
      console.log(`❌ 登录失败: ${username} (${role}) [调试模式]`);
      return { success: false, message: '用户名、密码或角色错误' };
    }
  } catch (error) {
    console.error('登录处理失败:', error);
    return { success: false, message: '登录异常，请稍后重试' };
  }
});

// 登出处理（临时保留用于调试）
ipcMain.handle('logout', () => {
  if (currentUser) {
    logs.push({
      time: new Date(),
      user: currentUser.username,
      action: 'logout',
      role: currentUser.role,
      level: 'info'
    });
    saveLogs();
    console.log(`✅ 用户 ${currentUser.username} (${currentUser.role}) 退出登录 [调试模式]`);
  }

  currentUser = null;
  token = null;
  if (mainWindow) mainWindow.loadFile('login.html');
});

// 获取当前用户（临时保留用于调试）
ipcMain.handle('getCurrentUser', () => currentUser);

// logout相关代码已删除 - 登出现在通过后端API处理

// 简单的页面导航（不做权限检查，权限检查由前端和后端处理）
ipcMain.handle('navigate', (event, page) => {
  mainWindow.loadFile(page);
});