// ====== كلمة المرور الافتراضية ======
const DEFAULT_PASSWORD = '1234';
const PASSWORD_KEY = 'pm_password';

// ===== شاشة الدخول =====
const loginScreen = document.getElementById('login-screen');
const app = document.getElementById('app');
const passInput = document.getElementById('pass-input');
const loginBtn = document.getElementById('login-btn');
const loginErr = document.getElementById('login-err');

function getPassword() {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
}

function tryLogin() {
  if (passInput.value === getPassword()) {
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
    initApp();
  } else {
    loginErr.textContent = 'كلمة مرور خاطئة';
  }
}
loginBtn.onclick = tryLogin;
passInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

// ===== متغيرات =====
let currentPath = '';
let editingPath = null;
const socket = io();

// ===== التبويبات =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  };
});

// ===== الملفات =====
const fileList = document.getElementById('file-list');
const breadcrumb = document.getElementById('breadcrumb');
const fileInput = document.getElementById('file-input');

async function loadFiles(p = '') {
  currentPath = p;
  breadcrumb.textContent = '/' + p;
  const res = await fetch('/api/files?path=' + encodeURIComponent(p));
  const data = await res.json();
  fileList.innerHTML = '';

  // زر الرجوع
  if (p) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="name">⬅️ ..</span>`;
    li.onclick = () => loadFiles(p.split('/').slice(0, -1).join('/'));
    fileList.appendChild(li);
  }

  data.items.sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name));

  data.items.forEach(item => {
    const li = document.createElement('li');
    const icon = item.isDir ? '📁' : getIcon(item.name);
    const fullPath = p ? p + '/' + item.name : item.name;
    li.innerHTML = `
      <span class="name">${icon} ${item.name}</span>
      <span class="size">${item.isDir ? '' : formatSize(item.size)}</span>
      <span class="actions"></span>
    `;
    const actions = li.querySelector('.actions');

    // فك الضغط إذا zip
    if (/\.(zip|jar)$/i.test(item.name)) {
      const btn = document.createElement('button');
      btn.textContent = '📦 فك الضغط';
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm('فك ضغط ' + item.name + '؟')) return;
        const r = await fetch('/api/unzip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: fullPath })
        });
        const d = await r.json();
        if (d.ok) { alert('تم فك الضغط ✅'); loadFiles(p); }
        else alert('خطأ: ' + d.error);
      };
      actions.appendChild(btn);
    }

    // حذف
    const del = document.createElement('button');
    del.textContent = '🗑️';
    del.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('حذف ' + item.name + '؟')) return;
      await fetch('/api/file?path=' + encodeURIComponent(fullPath), { method: 'DELETE' });
      loadFiles(p);
    };
    actions.appendChild(del);

    li.onclick = () => {
      if (item.isDir) loadFiles(fullPath);
      else openEditor(fullPath);
    };
    fileList.appendChild(li);
  });
}

function getIcon(name) {
  if (/\.(js|mjs|cjs)$/.test(name)) return '🟨';
  if (/\.json$/.test(name)) return '🟦';
  if (/\.(html|htm)$/.test(name)) return '🟧';
  if (/\.css$/.test(name)) return '🟪';
  if (/\.(png|jpg|jpeg|gif|svg)$/.test(name)) return '🖼️';
  if (/\.(zip|jar)$/.test(name)) return '📦';
  if (/^\.env/.test(name)) return '🔑';
  return '📄';
}

function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

// ===== المحرر =====
const editorWrap = document.getElementById('editor-wrap');
const editor = document.getElementById('editor');
const editorFilename = document.getElementById('editor-filename');

async function openEditor(path) {
  editingPath = path;
  editorFilename.textContent = '📝 ' + path;
  const res = await fetch('/api/file?path=' + encodeURIComponent(path));
  const data = await res.json();
  editor.value = data.content || '';
  editorWrap.classList.remove('hidden');
}

document.getElementById('btn-save-file').onclick = async () => {
  const r = await fetch('/api/file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: editingPath, content: editor.value })
  });
  const d = await r.json();
  if (d.ok) { alert('تم الحفظ ✅'); loadFiles(currentPath); }
};

document.getElementById('btn-close-editor').onclick = () => {
  editorWrap.classList.add('hidden');
  editingPath = null;
};

// ===== الرفع =====
document.getElementById('btn-upload').onclick = () => fileInput.click();

fileInput.onchange = async () => {
  if (!fileInput.files.length) return;
  const form = new FormData();
  form.append('file', fileInput.files[0]);
  form.append('path', currentPath);

  await fetch('/api/upload', { method: 'POST', body: form });
  fileInput.value = '';
  loadFiles(currentPath);
};

// ===== مجلد جديد =====
document.getElementById('btn-mkdir').onclick = async () => {
  const name = prompt('اسم المجلد:');
  if (!name) return;
  const full = currentPath ? currentPath + '/' + name : name;
  await fetch('/api/mkdir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: full })
  });
  loadFiles(currentPath);
};

// ===== الكونسل =====
const consoleOut = document.getElementById('console-output');
const statusDot = document.getElementById('status-dot');

function appendLog(text, type = 'info') {
  const line = document.createElement('div');
  line.className = 'log-line log-' + type;
  line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + text;
  consoleOut.appendChild(line);
  consoleOut.scrollTop = consoleOut.scrollHeight;
}

socket.on('log', ({ text, type }) => appendLog(text.trimEnd(), type));
socket.on('status', ({ running }) => {
  statusDot.classList.toggle('on', running);
});

document.getElementById('btn-start').onclick = async () => {
  const r = await fetch('/api/start', { method: 'POST' });
  const d = await r.json();
  if (!d.ok) appendLog('⚠️ ' + d.error, 'warn');
};

document.getElementById('btn-stop').onclick = async () => {
  const r = await fetch('/api/stop', { method: 'POST' });
  const d = await r.json();
  if (!d.ok) appendLog('⚠️ ' + d.error, 'warn');
};

document.getElementById('btn-restart').onclick = async () => {
  await fetch('/api/restart', { method: 'POST' });
};

socket.on('restart-ready', async () => {
  await fetch('/api/start', { method: 'POST' });
});

document.getElementById('btn-clear').onclick = () => { consoleOut.innerHTML = ''; };

// ===== الإعدادات =====
const mainFileInput = document.getElementById('main-file-input');

async function loadSettings() {
  const r = await fetch('/api/settings');
  const d = await r.json();
  mainFileInput.value = d.mainFile || '';
}

document.getElementById('btn-save-settings').onclick = async () => {
  const r = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mainFile: mainFileInput.value.trim() })
  });
  const d = await r.json();
  if (d.ok) alert('تم الحفظ ✅\nالملف الرئيسي: ' + d.settings.mainFile);
};

// ===== بدء التطبيق =====
function initApp() {
  loadFiles('');
  loadSettings();
}

// إذا كلمة المرور صحيحة مخزنة مسبقاً... لا، نطلب الدخول كل مرة لأمان أكثر.