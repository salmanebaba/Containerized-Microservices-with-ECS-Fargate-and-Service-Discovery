const el = (id) => document.getElementById(id);
const state = {
  history: [],
  token: sessionStorage.getItem('microservices.jwt') || ''
};

el('token').value = state.token;

function cleanBase(value) {
  return (value || '').trim().replace(/\/$/, '');
}

function cleanPrefix(value) {
  let prefix = (value || '').trim();
  if (!prefix.startsWith('/')) prefix = '/' + prefix;
  return prefix.replace(/\/$/, '');
}

function config() {
  return {
    base: cleanBase(el('apiBase').value),
    auth: cleanPrefix(el('authPrefix').value),
    order: cleanPrefix(el('orderPrefix').value),
    notification: cleanPrefix(el('notificationPrefix').value)
  };
}

function url(path) {
  const base = config().base;
  return `${base}${path}`;
}

function refreshEndpointLabels() {
  const c = config();
  el('authHealthPath').textContent = `GET ${c.auth}/health`;
  el('orderHealthPath').textContent = `GET ${c.order}/health`;
  el('notificationHealthPath').textContent = `GET ${c.notification}/health`;
}

['apiBase', 'authPrefix', 'orderPrefix', 'notificationPrefix'].forEach((id) => {
  el(id).addEventListener('input', refreshEndpointLabels);
});

function setServiceStatus(service, mode, text) {
  const node = el(`${service}Status`);
  node.className = `status ${mode}`;
  node.textContent = text;
}

function showResponse({ method, path, status, duration, body, error }) {
  const good = status >= 200 && status < 300;
  el('responseMeta').textContent = `${method} ${path} · ${status || 'NETWORK ERROR'} · ${duration} ms`;
  el('responseMeta').style.color = good ? 'var(--success)' : 'var(--danger)';
  el('responseBody').textContent = error
    ? String(error)
    : typeof body === 'string'
      ? body
      : JSON.stringify(body, null, 2);
}

function addHistory(entry) {
  state.history.unshift(entry);
  state.history = state.history.slice(0, 12);
  const body = el('historyBody');
  body.innerHTML = '';
  state.history.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.method}</td><td>${item.path}</td><td>${item.status}</td><td>${item.duration} ms</td>`;
    body.appendChild(row);
  });
}

async function request(path, options = {}) {
  const method = options.method || 'GET';
  const started = performance.now();
  try {
    const response = await fetch(url(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const raw = await response.text();
    let body = raw;
    try { body = raw ? JSON.parse(raw) : null; } catch (_) {}

    const duration = Math.round(performance.now() - started);
    const result = { method, path, status: response.status, duration, body };
    showResponse(result);
    addHistory(result);
    return { ok: response.ok, response, body };
  } catch (error) {
    const duration = Math.round(performance.now() - started);
    const result = { method, path, status: 'ERR', duration, error: error.message };
    showResponse(result);
    addHistory(result);
    return { ok: false, error };
  }
}

async function checkHealth(service) {
  const c = config();
  const prefix = c[service];
  setServiceStatus(service, 'testing', 'Testing...');
  const result = await request(`${prefix}/health`);
  if (result.ok) setServiceStatus(service, 'healthy', 'Healthy');
  else setServiceStatus(service, 'unhealthy', 'Unhealthy');
  return result;
}

document.querySelectorAll('[data-health]').forEach((button) => {
  button.addEventListener('click', () => checkHealth(button.dataset.health));
});

el('runAllHealth').addEventListener('click', async () => {
  await Promise.all(['auth', 'order', 'notification'].map(checkHealth));
});

el('loginBtn').addEventListener('click', async () => {
  const c = config();
  const result = await request(`${c.auth}/login`, {
    method: 'POST',
    body: JSON.stringify({
      username: el('username').value.trim(),
      password: el('password').value
    })
  });

  if (result.ok && result.body?.token) {
    state.token = result.body.token;
    sessionStorage.setItem('microservices.jwt', state.token);
    el('token').value = state.token;
  }
});

el('validateBtn').addEventListener('click', async () => {
  const c = config();
  const token = el('token').value.trim();
  await request(`${c.auth}/validate`, {
    headers: token ? { Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` } : {}
  });
});

el('clearTokenBtn').addEventListener('click', () => {
  state.token = '';
  sessionStorage.removeItem('microservices.jwt');
  el('token').value = '';
});

el('token').addEventListener('input', () => {
  state.token = el('token').value.trim();
  if (state.token) sessionStorage.setItem('microservices.jwt', state.token);
  else sessionStorage.removeItem('microservices.jwt');
});

el('listOrdersBtn').addEventListener('click', async () => {
  const c = config();
  await request(`${c.order}/orders`);
});

el('createOrderBtn').addEventListener('click', async () => {
  const c = config();
  const token = el('token').value.trim();
  await request(`${c.order}/orders`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` } : {},
    body: JSON.stringify({
      item: el('orderItem').value.trim(),
      total: Number(el('orderTotal').value || 0)
    })
  });
});

el('listNotificationsBtn').addEventListener('click', async () => {
  const c = config();
  await request(`${c.notification}/notifications`);
});

el('sendNotificationBtn').addEventListener('click', async () => {
  const c = config();
  await request(`${c.notification}/notify`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'frontend_test',
      message: el('notificationMessage').value.trim()
    })
  });
});

el('clearResponseBtn').addEventListener('click', () => {
  el('responseMeta').textContent = 'No request yet.';
  el('responseMeta').style.color = '';
  el('responseBody').textContent = 'Run a request to inspect its response here.';
});

refreshEndpointLabels();
