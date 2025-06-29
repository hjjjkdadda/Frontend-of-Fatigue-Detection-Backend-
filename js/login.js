async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const msg = document.getElementById('msg');
  const btn = document.querySelector('.form__button');
  if (!username || !password || !role) {
    msg.innerText = '请填写完整信息';
    return;
  }
  btn.disabled = true;
  btn.innerText = '登录中...';
  try {
    const res = await window.api.login({ username, password, role });
    if (res.success) {
      localStorage.setItem('token', res.token);

      // 记录登录成功日志
      await sendLoginLogToBackend(username, role, 'login_success', '用户登录成功');

      if (role === 'admin') {
        window.api.navigate('admin.html');
      } else if (role === 'driver') {
        window.api.navigate('driver.html');
      } else if (role === 'monitor') {
        window.api.navigate('monitor.html');
      }
    } else {
      msg.innerText = '登录失败，请检查用户名、密码和角色';

      // 记录登录失败日志
      await sendLoginLogToBackend(username, role, 'login_failed', '登录失败：用户名、密码或角色错误');
    }
  } catch (e) {
    msg.innerText = '登录异常，请稍后重试';

    // 记录登录异常日志
    await sendLoginLogToBackend(username, role, 'login_error', `登录异常：${e.message || '未知错误'}`);

    // 记录网络错误到本地日志
    await logNetworkError('login', e, `登录异常: ${username} (${role})`);
  }
  btn.disabled = false;
  btn.innerText = '登 录';
}

// 发送登录日志到后端
async function sendLoginLogToBackend(username, role, action, detail) {
  try {
    const logData = {
      time: new Date().toISOString(),
      user: username,
      action: action,
      level: action.includes('success') ? 'info' : 'warning',
      detail: detail,
      role: role
    };

    console.log('📤 发送登录日志到后端:', logData);
    await window.api.addLog(logData);
    console.log('✅ 登录日志已发送到后端');
  } catch (error) {
    console.warn('⚠️ 发送登录日志到后端失败:', error);
    // 不抛出错误，避免影响登录流程
  }
}

// 记录网络错误到本地日志
async function logNetworkError(action, error, detail = '') {
  try {
    const logData = {
      time: new Date().toISOString(),
      user: 'Unknown',
      action: `network_error_${action}`,
      level: 'error',
      detail: `网络错误: ${detail || action}`,
      role: null,
      error: error.message || '网络连接失败',
      stack: error.stack || null
    };

    console.log('📝 记录网络错误到本地日志:', logData);

    // 只记录到本地日志（因为网络有问题，无法发送到后端）
    if (window.api && window.api.addLog) {
      await window.api.addLog(logData);
      console.log('✅ 网络错误已记录到本地日志');
    }
  } catch (logError) {
    console.warn('⚠️ 记录网络错误日志失败:', logError);
    // 不抛出错误，避免影响主要功能
  }
}

window.onload = function() {
  if (document.getElementById('username')) document.getElementById('username').value = '';
  if (document.getElementById('password')) document.getElementById('password').value = '';
  if (document.getElementById('msg')) document.getElementById('msg').innerText = '';
};
