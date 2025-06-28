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
      if (role === 'admin') {
        window.api.navigate('admin.html');
      } else if (role === 'driver') {
        window.api.navigate('driver.html');
      } else if (role === 'monitor') {
        window.api.navigate('monitor.html');
      }
    } else {
      msg.innerText = '登录失败，请检查用户名、密码和角色';
    }
  } catch (e) {
    msg.innerText = '登录异常，请稍后重试';
  }
  btn.disabled = false;
  btn.innerText = '登 录';
}

window.onload = function() {
  if (document.getElementById('username')) document.getElementById('username').value = '';
  if (document.getElementById('password')) document.getElementById('password').value = '';
  if (document.getElementById('msg')) document.getElementById('msg').innerText = '';
};
