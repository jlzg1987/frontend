"use client";

import { useEffect, useRef, useState } from "react";

/** Cada centro tiene un radio geográfico real de 10 000 metros. */
const RADIO_METROS = 10000;
const PUNTOS = [
  { lat: 0.9622515476097936, lng: -79.62989425804703 },
  { lat: 0.955529, lng: -79.625666 },
  { lat: 0.920356, lng: -79.640134 },
  { lat: 0.960000, lng: -79.659743 },
  { lat: 1.011511, lng: -79.212525 },
  { lat: 1 + 1 / 60 + 4.9 / 3600, lng: -(79 + 10 / 60 + 3.8 / 3600) }, // 1°01'04.9"N 79°10'03.8"W
  { lat: 0.979772, lng: -79.144192 },
  { lat: 0.934824, lng: -79.166067 },
  { lat: 0.925663, lng: -79.151452 },
  { lat: 0.932435, lng: -79.604381 },
  { lat: 0.863168, lng: -79.854978 },


];

type LeafletMap = {
  fitBounds: (bounds: unknown, opts?: { padding?: number[] }) => void;
  setView: (center: [number, number], zoom: number) => LeafletMap;
  invalidateSize: () => void;
  remove: () => void;
};
type LeafletLayer = {
  addTo: (map: LeafletMap) => LeafletLayer;
  bindPopup: (content: string) => LeafletLayer;
  getBounds: () => unknown;
  on: (event: string, handler: () => void) => LeafletLayer;
  remove: () => void;
};
type LeafletApi = {
  map: (el: HTMLElement, opts: { scrollWheelZoom: boolean }) => LeafletMap;
  tileLayer: (url: string, opts: { attribution: string; maxZoom: number }) => LeafletLayer;
  circle: (
    coords: [number, number],
    opts: { radius: number; color: string; fillColor: string; fillOpacity: number; weight: number }
  ) => LeafletLayer;
  circleMarker: (
    coords: [number, number],
    opts: { radius: number; color: string; fillColor: string; fillOpacity: number; weight: number }
  ) => LeafletLayer;
  latLngBounds: (corners: [number, number][]) => unknown;
};

declare global {
  interface Window { L?: LeafletApi }
}

const WHATSAPP = "https://wa.me/593988899116?text=" + encodeURIComponent(
  "Hola, quisiera consultar si tienen cobertura de internet NetcompRF en mi domicilio. Mi ubicación es: "
);

// Varias alternativas evitan que el bloqueo de un único CDN deje el mapa sin funcionar.
const LEAFLET_JS = [
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];
const LEAFLET_CSS = [
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
];

let leafletEnCarga: Promise<LeafletApi> | null = null;

function cargarScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => { script.remove(); resolve(); };
    script.onerror = () => { script.remove(); reject(new Error(`No se pudo cargar ${url}`)); };
    document.head.appendChild(script);
  });
}

async function cargarLeaflet(): Promise<LeafletApi> {
  if (window.L?.map) return window.L;
  if (leafletEnCarga) return leafletEnCarga;

  leafletEnCarga = (async () => {
    if (!document.getElementById("netcomp-leaflet-css")) {
      const css = document.createElement("link");
      css.id = "netcomp-leaflet-css";
      css.rel = "stylesheet";
      css.href = LEAFLET_CSS[0];
      css.onerror = () => { css.href = LEAFLET_CSS[1]; };
      document.head.appendChild(css);
    }
    for (const url of LEAFLET_JS) {
      try {
        await cargarScript(url);
        if (window.L?.map) return window.L;
      } catch { /* Probar el siguiente servidor */ }
    }
    throw new Error("No fue posible obtener la biblioteca cartográfica desde ninguno de los servidores disponibles.");
  })();

  try { return await leafletEnCarga; }
  finally { leafletEnCarga = null; }
}

export default function MapaCoberturaNetcomp() {
  const contenedor = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  const [advertencia, setAdvertencia] = useState("");
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    let mapa: LeafletMap | null = null;
    let ajuste: ReturnType<typeof setTimeout> | null = null;
    setError("");
    setAdvertencia("");

    async function iniciar() {
      try {
        const L = await cargarLeaflet();
        if (cancelado || !contenedor.current) return;
        // Leaflet necesita una vista inicial antes de calcular la geometría de los círculos.
        mapa = L.map(contenedor.current, { scrollWheelZoom: false });
        mapa.setView([0.97, -79.4], 9);

        const fuentes = [
          {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          },
          {
            url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> &copy; CARTO',
          },
        ];
        let fuenteActual = 0;
        let tiles: LeafletLayer | null = null;
        function mostrarFuente() {
          if (!mapa || cancelado) return;
          tiles?.remove();
          const fuente = fuentes[fuenteActual];
          let fallos = 0;
          let completos = false;
          tiles = L.tileLayer(fuente.url, { attribution: fuente.attribution, maxZoom: 19 });
          tiles.on("load", () => { completos = true; if (!cancelado) setAdvertencia(""); });
          tiles.on("tileerror", () => {
            fallos++;
            if (!completos && fallos >= 2 && !cancelado) {
              if (fuenteActual + 1 < fuentes.length) {
                fuenteActual++;
                mostrarFuente();
              } else {
                setAdvertencia("Los servidores de imágenes del mapa no responden. Los puntos de cobertura siguen disponibles; comprueba bloqueadores de contenido o restricciones de red.");
              }
            }
          });
          tiles.addTo(mapa);
        }
        mostrarFuente();

        // Límites geográficos calculados sin llamar getBounds() sobre los círculos.
        // Se amplían hasta el borde del radio de 10 km de cada punto.
        const extremos: [number, number][] = [];
        PUNTOS.forEach((p, index) => {
          const latDelta = (RADIO_METROS / 111320);
          const lngDelta = RADIO_METROS / (111320 * Math.cos(p.lat * Math.PI / 180));
          extremos.push([p.lat - latDelta, p.lng - lngDelta]);
          extremos.push([p.lat + latDelta, p.lng + lngDelta]);
          if (!mapa) return;
          const coords: [number, number] = [p.lat, p.lng];
          const popup = `<strong>Punto de cobertura ${index + 1}</strong><br/>Radio aproximado: 10 km<br/>Lat: ${p.lat.toFixed(6)}, Lon: ${p.lng.toFixed(6)}<br/>Disponibilidad sujeta a evaluación técnica.`;
          const zona = L.circle(coords, {
            radius: RADIO_METROS,
            color: "#06b6d4",
            fillColor: "#0891b2",
            fillOpacity: 0.16,
            weight: 2,
          }).addTo(mapa);
          zona.bindPopup(popup);
          L.circleMarker(coords, {
            radius: 6,
            color: "#ffffff",
            fillColor: "#0891b2",
            fillOpacity: 1,
            weight: 2,
          }).addTo(mapa).bindPopup(popup);
        });
        mapa.fitBounds(L.latLngBounds(extremos), { padding: [26, 26] });
        // El contenedor puede cambiar de tamaño después de pintar el layout de Next.js.
        ajuste = setTimeout(() => { if (!cancelado) mapa?.invalidateSize(); }, 250);
      } catch (e) {
        console.error("NETCOMP RF COBERTURA:", e);
        if (!cancelado) setError("No se pudo inicializar el mapa. Vuelve a intentarlo o revisa la consola del navegador para ver el error técnico.");
        mapa?.remove();
        mapa = null;
      }
    }
    void iniciar();
    return () => {
      cancelado = true;
      if (ajuste) clearTimeout(ajuste);
      mapa?.remove();
    };
  }, [reintento]);


  return (
    <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-900/80 text-left shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7">
        <div>
          <h3 className="text-lg font-bold text-white">Mapa interactivo de cobertura</h3>
          <p className="mt-1 text-sm text-slate-300">Selecciona un punto para conocer su ubicación y alcance aproximado.</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-300">10 puntos · 10 km por punto</span>
      </div>
      <div className="relative isolate">
        <div ref={contenedor} role="region" aria-label="Mapa interactivo de cobertura NetcompRF" className="h-[360px] w-full bg-slate-800 sm:h-[480px]" />
        {error && <div className="absolute inset-x-4 top-4 z-[500] rounded-lg bg-slate-900 p-3 text-sm text-white">
          <p>{error}</p>
          <button type="button" onClick={() => setReintento((v) => v + 1)} className="mt-2 rounded bg-cyan-500 px-3 py-1 font-semibold text-slate-950">Reintentar mapa</button>
        </div>}
        {advertencia && !error && <p className="absolute inset-x-4 bottom-4 z-[500] rounded-lg bg-slate-900/95 p-3 text-xs text-amber-200">{advertencia}</p>}
      </div>
      <div className="flex flex-col items-start justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
        <div className="space-y-1 text-sm text-slate-300">
          <p><span className="mr-2 inline-block h-3 w-3 rounded-full border border-cyan-400 bg-cyan-500/30" />Área de cobertura referencial (radio de 10 km)</p>
          <p className="text-xs text-slate-400">La señal y la instalación dependen de factibilidad técnica, relieve, obstáculos y disponibilidad de red. Los círculos no garantizan servicio.</p>
        </div>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
          Consultar disponibilidad por WhatsApp
        </a>
      </div>
    </div>
  );
}
