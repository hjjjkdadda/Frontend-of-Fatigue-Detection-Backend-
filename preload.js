const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 登录相关（临时保留用于调试）
  login: (data) => ipcRenderer.invoke('login', data),
  logout: () => ipcRenderer.invoke('logout'),
  getCurrentUser: () => ipcRenderer.invoke('getCurrentUser'),

  // 导航
  navigate: (page) => ipcRenderer.invoke('navigate', page),

  // 本地日志操作（仅保留日志相关功能）
  getLocalLogs: () => ipcRenderer.invoke('getLocalLogs'),
  addLog: (log) => ipcRenderer.invoke('addLog', log),
  saveLogsToLocal: (logs) => ipcRenderer.invoke('saveLogsToLocal', logs),
  deleteLocalLogsFile: () => ipcRenderer.invoke('deleteLocalLogsFile')
});
