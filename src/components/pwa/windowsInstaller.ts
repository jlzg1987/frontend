// En producción se publica el .exe generado en /public/downloads/.
// La URL puede ser una ruta de este mismo dominio o HTTPS de una fuente confiable.
export const WINDOWS_INSTALLER_URL = process.env.NEXT_PUBLIC_NETCOMP_WINDOWS_INSTALLER_URL?.trim() || "";

export function isWindowsDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Windows/i.test(navigator.userAgent);
}

export function isNetcompDesktop(): boolean {
  if (typeof navigator === "undefined") return false;
  return /NetcompRFDesktop/i.test(navigator.userAgent);
}

export function getWindowsInstallerUrl(): string | null {
  if (!WINDOWS_INSTALLER_URL) return null;
  if (WINDOWS_INSTALLER_URL.startsWith("/") && !WINDOWS_INSTALLER_URL.startsWith("//")) return WINDOWS_INSTALLER_URL;
  try {
    const url = new URL(WINDOWS_INSTALLER_URL);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}
