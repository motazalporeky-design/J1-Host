const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const ROOT = path.join(__dirname, 'workspace');
if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: path.join(__dirname, 'uploads') });
if (!fs.existsSync(path.join(__dirname, 'uploads')))
  fs.mkdirSync(path.join(__dirname, 'uploads'));

// ===== إعدادات المشروع =====
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
function readSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) return { mainFile: 'index.js' };
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); }
  catch { return { mainFile: 'index.js' }; }
}
function saveSettings(s) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

app.get('/api/settings', (req, res) => res.json(readSettings()));
app.post('/api/settings', (req, res) => {
  const s = readSettings();
  if (typeof req.body.mainFile === 'string') s.mainFile = req.body.mainFile;
  saveSettings(s);
  res.json({ ok: true, settings: s });
});

// ===== استعراض الملفات =====
function safePath(p) {
  const full = path.join(ROOT, p || '');
  if (!full.startsWith(ROOT)) throw new Error('Invalid path');
  return full;
}

app.get('/api/files', (req, res) => {
  try {
    const dir = safePath(req.query.path || '');
    if (!fs.existsSync(dir)) return res.json({ items: [] });
    const items = fs.readdirSync(dir).map(name => {
      const stat = fs.statSync(path.join(dir, name));
      return { name, isDir: stat.isDirectory(), size: stat.size, mtime: stat.mtime };
    });
    res.json({ items });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/file', (req, res) => {
  try {
    const full = safePath(req.query.path);
    const content = fs.readFileSync(full, 'utf8');
    res.json({ content });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/file', (req, res) => {
  try {
    const full = safePath(req.body.path);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, req.body.content ?? '');
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/file', (req, res) => {
  try {
    const full = safePath(req.query.path);
    const stat = fs.lstatSync(full);
    if (stat.isDirectory()) fs.rmSync(full, { recursive: true, force: true });
    else fs.unlinkSync(full);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/mkdir', (req, res) => {
  try {
    const full = safePath(req.body.path);
    fs.mkdirSync(full, { recursive: true });
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ===== رفع ملف =====
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const targetDir = safePath(req.body.path || '');
    fs.mkdirSync(targetDir, { recursive: true });
    const dest = path.join(targetDir, req.file.originalname);
    fs.renameSync(req.file.path, dest);
    res.json({ ok: true, name: req.file.originalname });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ===== فك ضغط =====
app.post('/api/unzip', (req, res) => {
  try {
    const full = safePath(req.body.path);
    const targetDir = full.replace(/\.(zip|jar)$/i, '') + '_extracted';
    fs.mkdirSync(targetDir, { recursive: true });
    const zip = new AdmZip(full);
    zip.extractAllTo(targetDir, true);
    res.json({ ok: true, path: path.relative(ROOT, targetDir) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ===== ضغط (اختياري) =====
app.post('/api/zip', (req, res) => {
  try {
    const full = safePath(req.body.path);
    const out = full + '.zip';
    const zip = new AdmZip();
    zip.addLocalFolder(full);
    zip.writeZip(out);
    res.json({ ok: true, file: path.basename(out) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ===== إدارة عملية التشغيل =====
let runningProcess = null;

function sendLog(text, type = 'info') {
  io.emit('log', { text, type, time: Date.now() });
}

// فحص وجود الملف الرئيسي + node_modules
function checkProject(mainFile) {
  const mainPath = path.join(ROOT, mainFile);
  const issues = [];
  if (!fs.existsSync(mainPath)) issues.push(`الملف الرئيسي غير موجود: ${mainFile}`);
  if (!fs.existsSync(path.join(ROOT, 'node_modules')))
    issues.push('node_modules غير موجودة (يُفضّل تشغيل npm install)');
  return issues;
}

app.post('/api/start', (req, res) => {
  if (runningProcess) return res.status(400).json({ error: 'المشروع يعمل بالفعل' });

  const { mainFile } = readSettings();
  const issues = checkProject(mainFile);

  sendLog('🔍 فحص المشروع...', 'info');
  issues.forEach(i => sendLog('⚠️ ' + i, 'warn'));

  // لو ما فيه node_modules نشغّل npm install أولاً
  const runMain = () => {
    sendLog(`🚀 تشغيل: node ${mainFile}`, 'start');
    runningProcess = spawn('node', [mainFile], {
      cwd: ROOT,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    runningProcess.stdout.on('data', d => sendLog(d.toString(), 'out'));
    runningProcess.stderr.on('data', d => sendLog(d.toString(), 'err'));

    runningProcess.on('exit', code => {
      sendLog(`⛔ توقف المشروع (code: ${code})`, 'stop');
      runningProcess = null;
      io.emit('status', { running: false });
    });

    io.emit('status', { running: true });
    res.json({ ok: true, issues });
  };

  if (!fs.existsSync(path.join(ROOT, 'node_modules')) && fs.existsSync(path.join(ROOT, 'package.json'))) {
    sendLog('📦 تثبيت الحزم (npm install)...', 'info');
    const npm = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install'], { cwd: ROOT });
    npm.stdout.on('data', d => sendLog(d.toString(), 'out'));
    npm.stderr.on('data', d => sendLog(d.toString(), 'err'));
    npm.on('exit', code => {
      if (code === 0) sendLog('✅ تم تثبيت الحزم', 'info');
      else sendLog('❌ فشل تثبيت الحزم', 'err');
      runMain();
    });
  } else {
    runMain();
  }
});

app.post('/api/stop', (req, res) => {
  if (!runningProcess) return res.status(400).json({ error: 'لا يوجد مشروع يعمل' });
  sendLog('⏹️ إيقاف المشروع...', 'stop');
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', runningProcess.pid, '/f', '/t']);
  } else {
    runningProcess.kill('SIGTERM');
  }
  runningProcess = null;
  io.emit('status', { running: false });
  res.json({ ok: true });
});

app.post('/api/restart', async (req, res) => {
  if (runningProcess) {
    if (process.platform === 'win32')
      spawn('taskkill', ['/pid', runningProcess.pid, '/f', '/t']);
    else runningProcess.kill('SIGTERM');
    runningProcess = null;
    await new Promise(r => setTimeout(r, 800));
  }
  sendLog('🔄 إعادة تشغيل...', 'info');
  res.json({ ok: true });
  // نطلب من الكلاينت استدعاء /api/start بعد ثانية
  io.emit('restart-ready');
});

app.get('/api/status', (req, res) => {
  res.json({ running: !!runningProcess });
});

// ===== Socket.io =====
io.on('connection', socket => {
  socket.emit('status', { running: !!runningProcess });
  socket.emit('log', { text: '🟢 متصل بالخادم', type: 'info', time: Date.now() });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ الموقع يعمل على http://localhost:${PORT}`);
});
