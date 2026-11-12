const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');
const { URL } = require('node:url');
const { appUrl } = require('./app-url.json');

const target = new URL(appUrl);
if (target.protocol !== 'https:' || !target.hostname) throw new Error('NETCOMP_APP_URL debe ser HTTPS');
const origin = target.origin;

function isAllowed(url) {
  try { const u = new URL(url); return u.protocol === 'https:' && u.origin === origin; }
  catch { return false; }
}
function openExternal(url) {
  try { const u = new URL(url); if (u.protocol === 'https:' || u.protocol === 'mailto:') shell.openExternal(url); }
  catch { /* URL inválida */ }
}

app.whenReady().then(() => {
  // El contenido remoto nunca debe acceder a Node.js ni a la API de Electron.
  const win = new BrowserWindow({
    width: 1320, height: 850, minWidth: 900, minHeight: 600,
    title: 'Netcomp RF ISP',
    icon: path.join(__dirname, 'assets', 'netcomp.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: false,
      partition: 'persist:netcomprf'
    }
  });
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} NetcompRFDesktop/1.0`);
  win.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowed(url)) { event.preventDefault(); openExternal(url); }
  });
  // Evita abrir popups de permisos desde sitios no deseados.
  session.fromPartition('persist:netcomprf').setPermissionRequestHandler((wc, permission, callback, details) => {
    const requestingUrl = details?.requestingUrl || wc.getURL();
    callback(isAllowed(requestingUrl) && ['notifications', 'media', 'clipboard-sanitized-write'].includes(permission));
  });
  win.loadURL(new URL('/login', origin).toString());
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
