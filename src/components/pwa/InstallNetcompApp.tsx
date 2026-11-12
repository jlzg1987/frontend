"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { getWindowsInstallerUrl, isNetcompDesktop, isWindowsDevice } from "./windowsInstaller";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallNetcompApp({ variant = "login" }: { variant?: "login" | "header" }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [windows, setWindows] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setInstalled(isInstalled());
    setWindows(isWindowsDevice());
    setDesktop(isNetcompDesktop());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); setShowHelp(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || desktop) return null;
  const windowsUrl = windows ? getWindowsInstallerUrl() : null;
  const onInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === "accepted") setInstallPrompt(null);
      } catch (error) {
        console.warn("No fue posible abrir la instalación:", error);
        setShowHelp(true);
      }
    } else if (windowsUrl) {
      window.location.assign(windowsUrl);
    } else {
      setShowHelp((previous) => !previous);
    }
  };
  return (
    <div className={variant === "header" ? "relative" : "w-full"}>
      <button type="button" onClick={onInstall}
        className={variant === "header"
          ? "inline-flex items-center gap-2 rounded-full border border-cyan-400/50 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-400/10"
          : "flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-700"}>
        <Download size={17} aria-hidden="true" /> {windows && !installPrompt ? "Descargar para Windows" : "Instalar aplicación"}
      </button>
      {showHelp && (
        <div role="status" className={variant === "header"
          ? "absolute right-0 top-full z-[60] mt-2 w-72 rounded-xl border border-slate-600 bg-slate-900 p-3 text-xs text-white shadow-xl"
          : "mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700"}>
          {windows && !windowsUrl ? "El instalador de Windows todavía no está publicado. El administrador debe compilar el .exe, subirlo al servidor y configurar NEXT_PUBLIC_NETCOMP_WINDOWS_INSTALLER_URL. " : ""}
          En Chrome o Edge (PC), abre el menú del navegador y elige «Instalar Netcomp RF» o «Instalar esta página como aplicación».
          En iPhone (Safari), usa Compartir → «Añadir a pantalla de inicio». En Android, abre el menú del navegador → «Instalar aplicación».
          Se requiere HTTPS y conexión a internet.
        </div>
      )}
    </div>
  );
}
