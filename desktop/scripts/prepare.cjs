const fs = require('node:fs');
const path = require('node:path');
const urlText = process.env.NETCOMP_APP_URL?.trim();
if (!urlText) { console.error('Falta NETCOMP_APP_URL (URL HTTPS pública del frontend de Netcomp RF).'); process.exit(1); }
let url;
try { url = new URL(urlText); } catch { console.error('NETCOMP_APP_URL inválida'); process.exit(1); }
if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) { console.error('La URL debe ser HTTPS, sin usuario ni contraseña'); process.exit(1); }
fs.writeFileSync(path.join(__dirname, '..', 'app-url.json'), JSON.stringify({ appUrl: url.origin }, null, 2) + '\n');
console.log('URL del sistema configurada:', url.origin);
