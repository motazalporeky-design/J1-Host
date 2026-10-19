* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, sans-serif; }
body { background: #0f172a; color: #e2e8f0; min-height: 100vh; }

.hidden { display: none !important; }

/* شاشة الدخول */
.overlay {
  position: fixed; inset: 0; background: #0f172a;
  display: flex; align-items: center; justify-content: center; z-index: 999;
}
.login-box {
  background: #1e293b; padding: 40px; border-radius: 16px;
  width: 340px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,.5);
}
.login-box h1 { margin-bottom: 20px; }
.login-box input {
  width: 100%; padding: 12px; border-radius: 8px;
  border: 1px solid #334155; background: #0f172a; color: white; font-size: 16px;
}
.login-box button {
  width: 100%; margin-top: 12px; padding: 12px;
  background: #3b82f6; color: white; border: none; border-radius: 8px;
  font-size: 16px; cursor: pointer;
}
.login-box button:hover { background: #2563eb; }
.hint { margin-top: 10px; font-size: 13px; color: #94a3b8; }
.err { color: #f87171; margin-top: 10px; font-size: 14px; }

/* الهيدر */
header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; background: #1e293b; border-bottom: 1px solid #334155;
}
.status-dot {
  width: 14px; height: 14px; border-radius: 50%;
  background: #64748b; box-shadow: 0 0 10px transparent;
}
.status-dot.on { background: #22c55e; box-shadow: 0 0 12px #22c55e; }

/* التبويبات */
.tabs { display: flex; gap: 6px; padding: 12px 24px; background: #0f172a; }
.tab {
  padding: 10px 20px; background: #1e293b; color: #94a3b8;
  border: 1px solid #334155; border-radius: 8px; cursor: pointer;
}
.tab.active { background: #3b82f6; color: white; border-color: #3b82f6; }

.tab-content { display: none; padding: 0 24px 24px; }
.tab-content.active { display: block; }

/* شريط الأدوات */
.toolbar {
  display: flex; gap: 10px; align-items: center;
  padding: 12px 0; flex-wrap: wrap;
}
.toolbar button {
  padding: 8px 16px; border-radius: 8px; border: none;
  background: #334155; color: white; cursor: pointer; font-size: 14px;
}
.toolbar button:hover { background: #475569; }
.btn-green { background: #16a34a !important; }
.btn-green:hover { background: #15803d !important; }
.btn-red { background: #dc2626 !important; }
.btn-red:hover { background: #b91c1c !important; }
.btn-yellow { background: #ca8a04 !important; }
.btn-yellow:hover { background: #a16207 !important; }

.breadcrumb {
  margin-inline-start: auto; color: #94a3b8;
  background: #1e293b; padding: 6px 12px; border-radius: 6px;
  font-family: monospace; font-size: 13px;
}

/* قائمة الملفات */
.file-list {
  list-style: none; background: #1e293b; border-radius: 10px;
  overflow: hidden; max-height: 55vh; overflow-y: auto;
}
.file-list li {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-bottom: 1px solid #334155;
  cursor: pointer;
}
.file-list li:hover { background: #334155; }
.file-list li .name { flex: 1; }
.file-list li .size { color: #64748b; font-size: 12px; }
.file-list li .actions { display: flex; gap: 6px; }
.file-list li .actions button {
  background: transparent; border: 1px solid #475569; color: #cbd5e1;
  padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;
}
.file-list li .actions button:hover { background: #475569; }

/* المحرر */
#editor-wrap {
  margin-top: 16px; background: #1e293b; border-radius: 10px;
  overflow: hidden;
}
.editor-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; background: #334155;
}
.editor-header button {
  margin-inline-start: 8px; padding: 6px 14px;
  border: none; border-radius: 6px; cursor: pointer;
  background: #3b82f6; color: white;
}
.editor-header button:hover { background: #2563eb; }
#editor {
  width: 100%; min-height: 350px; background: #0f172a; color: #e2e8f0;
  border: none; padding: 16px; font-family: 'Consolas', monospace;
  font-size: 14px; resize: vertical;
}

/* الكونسل */
#console-output {
  background: #000; color: #e2e8f0; padding: 16px;
  border-radius: 10px; min-height: 400px; max-height: 65vh;
  overflow-y: auto; font-family: 'Consolas', monospace;
  font-size: 13px; white-space: pre-wrap; word-wrap: break-word;
  line-height: 1.5;
}
.log-line { margin-bottom: 2px; }
.log-info { color: #38bdf8; }
.log-out { color: #e2e8f0; }
.log-err { color: #f87171; }
.log-warn { color: #fbbf24; }
.log-start { color: #22c55e; font-weight: bold; }
.log-stop { color: #f87171; font-weight: bold; }

/* الإعدادات */
.settings-box {
  background: #1e293b; padding: 24px; border-radius: 10px;
  max-width: 500px;
}
.settings-box label { display: block; margin-bottom: 8px; }
.settings-box input {
  width: 100%; padding: 10px; border-radius: 8px;
  border: 1px solid #334155; background: #0f172a; color: white;
  font-family: monospace; font-size: 14px;
}
.settings-box button {
  margin-top: 12px; padding: 10px 20px; background: #3b82f6;
  border: none; color: white; border-radius: 8px; cursor: pointer;
}
.settings-box button:hover { background: #2563eb; }