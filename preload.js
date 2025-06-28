const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (data) => ipcRenderer.invoke('login', data),
  navigate: (page) => ipcRenderer.invoke('navigate', page),
  getCurrentUser: () => ipcRenderer.invoke('getCurrentUser'),

  // 本地日志操作
  getLocalLogs: () => ipcRenderer.invoke('getLocalLogs'),
  addLog: (log) => ipcRenderer.invoke('addLog', log),
  saveLogsToLocal: (logs) => ipcRenderer.invoke('saveLogsToLocal', logs),
  deleteLocalLogsFile: () => ipcRenderer.invoke('deleteLocalLogsFile'),

  getUsers: () => ipcRenderer.invoke('getUsers'),
  addUser: (user) => ipcRenderer.invoke('addUser', user),
  deleteUser: (username) => ipcRenderer.invoke('deleteUser', username),
  updateUser: (user) => ipcRenderer.invoke('updateUser', user),
  logout: () => ipcRenderer.invoke('logout')
});
