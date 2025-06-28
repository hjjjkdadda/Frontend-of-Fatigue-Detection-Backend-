const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  login: (data) => ipcRenderer.invoke('login', data),
  navigate: (page) => ipcRenderer.invoke('navigate', page),
  getCurrentUser: () => ipcRenderer.invoke('getCurrentUser'),
  getLogs: () => ipcRenderer.invoke('getLogs'),
  addLog: (log) => ipcRenderer.invoke('addLog', log),
  getUsers: () => ipcRenderer.invoke('getUsers'),
  addUser: (user) => ipcRenderer.invoke('addUser', user),
  deleteUser: (username) => ipcRenderer.invoke('deleteUser', username),
  updateUser: (user) => ipcRenderer.invoke('updateUser', user),
  logout: () => ipcRenderer.invoke('logout')
});
