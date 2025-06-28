async function loadLogs() {
  const logs = await window.api.getLogs();
  const list = document.getElementById('logList');
  list.innerHTML = '';
  logs.forEach(log => {
    const div = document.createElement('div');
    div.className = 'log-item';
    div.innerText = `[${new Date(log.time).toLocaleString()}] 用户:${log.user} 操作:${log.action} ${(log.role ? '角色:' + log.role : '')} ${(log.detail ? '详情:' + JSON.stringify(log.detail) : '')}`;
    list.appendChild(div);
  });
}
function back() {
  window.api.navigate('admin.html');
}
function logout() {
  if (confirm('确定要注销吗？')) {
    window.api.logout();
  }
}
window.onload = loadLogs;
