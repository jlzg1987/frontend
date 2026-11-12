"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      // No cacheamos respuestas, documentos, credenciales ni información privada.
      navigator.serviceWorker.register("/sw-netcomp.js", { scope: "/" }).catch((error) => {
        console.warn("No se pudo registrar la PWA de Netcomp RF:", error);
      });
    }
  }, []);
  return null;
}
