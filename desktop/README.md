# Netcomp RF — instalador independiente para Windows

El proyecto `desktop/` genera un instalador `.exe` con Electron/NSIS. No depende de Chrome ni de su botón PWA. Se conecta por HTTPS al **frontend web existente** y reutiliza su backend. Requiere Internet; no es un servidor local/offline.

## Generar en Windows 10/11

Requisitos: Node.js 22 y conexión a Internet para descargar Electron/NSIS.

```powershell
cd desktop
$env:NETCOMP_APP_URL="https://URL-REAL-DEL-FRONTEND-NETCOMP"
npm install
npm run dist:win
```

El resultado estará en `desktop/dist/NetcompRF-Setup.exe`. El instalador ofrece icono y accesos directos, instalación por usuario y desinstalación en Windows.

**Alternativa GitHub Actions:** subir el proyecto a GitHub → Actions → "Compilar instalador Netcomp RF para Windows" → Run workflow → introducir la URL HTTPS real del frontend → descargar el artifact `NetcompRF-Instalador-Windows`.

## Activar el botón de descarga web

1. Construir el `.exe` con la URL real de Netcomp.
2. Publicarlo en la web bajo `public/downloads/NetcompRF-Setup.exe` (sin guardarlo en Git si no deseas un binario pesado), o en una URL HTTPS confiable.
3. Configurar `NEXT_PUBLIC_NETCOMP_WINDOWS_INSTALLER_URL=/downloads/NetcompRF-Setup.exe` en el despliegue del frontend y **reconstruir/republicar Next.js**. Si se utiliza URL externa, configurarla completa con `https://`.
4. Verificar el enlace de descarga mediante HTTPS antes de anunciarlo.

Con `beforeinstallprompt` disponible, se mantiene la instalación PWA. Sin ese evento en Windows, se habilita la descarga del `.exe`. En móviles se mantienen las instrucciones PWA. Si no hay URL configurada, se informa que falta publicar el instalador en lugar de enviar a una descarga rota.

### Notas de seguridad

- No se incluyen credenciales, ni se abre acceso Node.js al sitio remoto. Se restringe la navegación dentro de la aplicación al origen configurado.
- Las pestañas/enlaces externos HTTPS se abren en el navegador por defecto.
- La autenticación del ERP sigue a cargo de la plataforma web existente.
- Para distribuirlo públicamente a usuarios finales, se recomienda firmar digitalmente el `.exe` para reducir avisos de SmartScreen; el binario generado sin certificado puede mostrar advertencias.
- Si la aplicación necesita redirecciones a otros dominios para login/PayPhone, debe evaluarse y habilitarse explícitamente el flujo correspondiente; no se deshabilita la seguridad del navegador.
- El ZIP entregado contiene **el código para compilar** el .exe; no incluye un binario compilado en Windows.
