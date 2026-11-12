"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Check, Info } from "lucide-react";
import { getWindowsInstallerUrl, isNetcompDesktop, isWindowsDevice } from "./windowsInstaller";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "netcomp-pwa-banner-dismissed";

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

export default function FloatingInstallNetcomp() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [windows, setWindows] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setWindows(isWindowsDevice());
    setDesktop(isNetcompDesktop());
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch { /* almacenamiento deshabilitado */ }
    setReady(true);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setHelpOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const close = () => {
    setDismissed(true);
    setHelpOpen(false);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* almacenamiento deshabilitado */ }
  };

  const windowsUrl = windows ? getWindowsInstallerUrl() : null;

  const install = async () => {
    if (!installPrompt && windowsUrl) {
      window.location.assign(windowsUrl);
      return;
    }
    if (!installPrompt) {
      setHelpOpen((previous) => !previous);
      return;
    }
    setBusy(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        // La confirmación real de instalación llega mediante "appinstalled".
      }
    } catch (error) {
      console.warn("No se pudo mostrar el instalador de NetcompRF", error);
      setHelpOpen(true);
    } finally {
      setBusy(false);
    }
  };

  if (!ready || installed || desktop || dismissed) return null;

  return (
    <aside
      role="region"
      aria-label="Instalar aplicación NetcompRF"
      className="fixed bottom-4 right-4 z-[80] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-cyan-400/40 bg-slate-900/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-md sm:bottom-6 sm:right-6"
    >
      <button
        type="button"
        aria-label="Cerrar aviso de instalación"
        onClick={close}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex items-start gap-3 pr-7">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
          <Smartphone className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p className="text-base font-extrabold">NetcompRF en tu dispositivo</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Instala nuestro sitio como aplicación y accede desde tu pantalla de inicio.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={install}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {busy ? "Abriendo instalador…" : windows && !installPrompt ? "Descargar para Windows" : "Instalar aplicación"}
      </button>
      {helpOpen && (
        <div role="status" className="mt-3 rounded-xl border border-white/10 bg-slate-800 p-3 text-xs leading-relaxed text-slate-200">
          <div className="mb-1 flex items-center gap-2 font-bold text-cyan-300"><Info className="h-4 w-4" aria-hidden="true" /> Instalación manual</div>
          <p><strong>Android:</strong> menú del navegador → Instalar aplicación o Añadir a pantalla de inicio.</p>
          <p className="mt-1"><strong>iPhone/iPad:</strong> Safari → Compartir → Añadir a pantalla de inicio.</p>
          <p className="mt-1"><strong>PC:</strong> Chrome/Edge → menú → Instalar esta página como aplicación.</p>
          <p className="mt-2 flex items-center gap-1 text-emerald-300"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Necesita HTTPS y conexión a internet.</p>
        </div>
      )}
    </aside>
  );
}
