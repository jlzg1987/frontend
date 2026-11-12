"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Loader2, MessageCircle, Send, X } from "lucide-react";

type Msg = { id: number; role: "assistant" | "user"; text: string };
type Flujo = { tipo: string; etapa: string; datos: Record<string, string> };
// Selección explícita de backend, respetando las variables existentes del proyecto.
// En localhost se prefiere la API local. En producción, la API pública.
const PROD_API = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "";
const LOCAL_API = process.env.NEXT_PUBLIC_LOCAL_API_URL || "";
function obtenerEndpoint(): string {
  const esLocal = typeof window !== "undefined" && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const base = (esLocal ? (LOCAL_API || PROD_API) : (PROD_API || LOCAL_API)).trim().replace(/\/+$/, "");
  if (!base) return "";
  // Permite configurar tanto https://host como https://host/api.
  return `${base}${/\/api$/i.test(base) ? "" : "/api"}/dante-publico/mensaje`;
}
// Respuestas públicas limitadas de respaldo cuando la API no está disponible.
// No reemplazan una integración generativa con Dante Core.
const pasos = ["modalidad", "objetivo", "funciones", "plazo", "completo"];
function respuestaLocal(texto: string, flujo: Flujo | null): { respuesta: string; escalar: boolean; flujo?: Flujo } {
  const q = texto.toLocaleLowerCase("es").trim();
  if (/^(asesor|asesor humano|hablar con|whatsapp|persona|atenci[oó]n humana)/.test(q)) return { respuesta: "Claro, puedo preparar lo conversado para un asesor humano. Escribe tu nombre completo para continuar por WhatsApp.", escalar: true, flujo: flujo || undefined };
  if (flujo) {
    if (flujo.etapa === "completo") return { respuesta: "Ya tengo los datos principales. Indica tu nombre completo para enviarlos a un asesor por WhatsApp.", escalar: true, flujo };
    const datos = { ...flujo.datos, [flujo.etapa]: texto.slice(0, 400) };
    const siguiente = pasos[pasos.indexOf(flujo.etapa) + 1] || "completo";
    const nuevo = { ...flujo, etapa: siguiente, datos };
    if (siguiente === "completo") return { respuesta: `¡Gracias! Tengo este resumen de tu proyecto:\n• Tipo: ${flujo.tipo}\n• Modalidad: ${datos.modalidad}\n• Negocio y objetivo: ${datos.objetivo}\n• Funciones: ${datos.funciones}\n• Plazo: ${datos.plazo}\n\nPara pasarte con un asesor, escribe tu nombre completo y continúa por WhatsApp.`, escalar: true, flujo: nuevo };
    if (siguiente === "objetivo") return { respuesta: "¿A qué se dedica tu negocio y cuál es el objetivo principal del proyecto?", escalar: false, flujo: nuevo };
    if (siguiente === "funciones") return { respuesta: "¿Qué funciones o secciones necesitas? Por ejemplo: catálogo, reservas, pagos, reportes o panel administrativo.", escalar: false, flujo: nuevo };
    return { respuesta: "¿Para cuándo te gustaría tenerlo listo? Si no tienes fecha, responde 'por definir'.", escalar: false, flujo: nuevo };
  }
  if (/\b(servicios|qu[eé] ofrecen|portafolio|qu[eé] hacen)\b/.test(q)) return { respuesta: "NetcompRF ofrece internet residencial y empresarial, fibra óptica, enlaces inalámbricos, CCTV, cámaras de seguridad y paneles solares. También desarrollamos páginas web, apps, ERP, CRM, POS y asistentes virtuales. ¿Qué servicio te interesa?", escalar: false };
  if (/cobertura|tachina|esmeraldas|rioverde|anchayacu|san francisco|atacames|sector|zona/.test(q)) return { respuesta: "La web muestra 10 áreas referenciales de 10 km por punto. Puedes consultar Esmeraldas, Tachina y en Rioverde los sectores de las vías Anchayacu y San Francisco. Para Atacames y otras zonas hace falta confirmar factibilidad técnica. ¿Cuál es tu barrio o sector exacto?", escalar: false };
  if (/internet|plan|precio|megas|fibra|velocidad|contratar/.test(q)) return { respuesta: "Ofrecemos planes de internet residencial y empresarial. No tengo aquí una lista verificada de tarifas vigentes y no quiero darte un precio equivocado. ¿En qué sector estás? Si deseas, puedo pasarte con el equipo comercial por WhatsApp.", escalar: false };
  if (/soporte|se[nñ]al|aver[ií]a|factura|pago|falla/.test(q)) return { respuesta: "Puedo orientarte, pero para averías, pagos o datos de una cuenta debe ayudarte nuestro personal autorizado. No compartas contraseñas aquí. Puedo derivarte a WhatsApp.", escalar: true };
  let tipo = "";
  if (/p[aá]gina|sitio web|landing|website/.test(q)) tipo = "WEB";
  else if (/aplicaci[oó]n m[oó]vil|app m[oó]vil|android|ios/.test(q)) tipo = "APP";
  else if (/erp|inventario|administrativo|gesti[oó]n empresarial/.test(q)) tipo = "ERP";
  else if (/punto de venta|\bpos\b/.test(q)) tipo = "POS";
  else if (/automatizaci[oó]n|asistente|chatbot|inteligencia artificial/.test(q)) tipo = "AUTOMATIZACION";
  else if (/software|sistema|desarroll|programa/.test(q)) tipo = "OTRO";
  if (tipo) return { respuesta: tipo === "WEB" ? "¡Con gusto! ¿Quieres una página estática/informativa o administrable con un panel para actualizar contenido?" : "¡Excelente! Para empezar, ¿qué modalidad o tipo de solución necesitas y dónde se utilizará?", escalar: false, flujo: { tipo, etapa: "modalidad", datos: {} } };
  return { respuesta: "Puedo orientarte sobre servicios de NetcompRF, cobertura referencial, internet y desarrollo de software. ¿Te interesa internet, una página web, una app o un sistema empresarial?", escalar: false };
}
const inicio: Msg = { id: 1, role: "assistant", text: "¡Hola! Soy Dante, asistente de NetcompRF. Puedo ayudarte a definir una página web, aplicación o sistema empresarial, y orientarte sobre nuestros servicios. ¿Qué necesitas desarrollar?" };

export default function DanteChatPublico() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Msg[]>([inicio]);
  const [escrito, setEscrito] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [escalar, setEscalar] = useState(false);
  const [flujo, setFlujo] = useState<Flujo | null>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(2);
  const mostrar = (role: Msg["role"], text: string) => setMensajes(prev => [...prev, { id: idRef.current++, role, text }]);

  useEffect(() => { if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [mensajes, abierto]);
  useEffect(() => { if (escalar && abierto) nombreRef.current?.focus(); }, [escalar, abierto]);
  const whatsapp = () => {
    const historial = mensajes.filter(m => m.id !== 1).map(m => `${m.role === "user" ? "Cliente" : "Dante"}: ${m.text}`).join("\n");
    const detalles = flujo?.datos ? Object.entries(flujo.datos).map(([k, v]) => `${k}: ${v}`).join("\n") : "";
    const texto = `Hola, equipo de NetcompRF. Conversé con el asistente Dante y deseo continuar con un asesor humano.\n\nNombre: ${nombre.trim()}\n${flujo ? `Proyecto: ${flujo.tipo}\n${detalles}\n` : ""}\nConversación:\n${historial.slice(-4500)}`;
    return `https://wa.me/593988899116?text=${encodeURIComponent(texto.slice(0, 6500))}`;
  };
  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const consulta = escrito.trim().slice(0, 1200);
    if (!consulta || cargando) return;
    setEscrito(""); mostrar("user", consulta); setCargando(true);
    try {
      const endpoint = obtenerEndpoint();
      if (!endpoint) throw new Error("API_BASE_NO_CONFIGURADA");
      const respuesta = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: consulta, flujo }),
      });
      const json = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok || typeof json.respuesta !== "string") throw new Error("Servicio temporalmente no disponible");
      mostrar("assistant", json.respuesta.slice(0, 2500));
      if (json.flujo && typeof json.flujo === "object") setFlujo(json.flujo as Flujo);
      if (json.escalar === true) setEscalar(true);
    } catch (error) {
      // El asistente sigue orientando en modo local, aun si falta la URL del API.
      // Para consultas privadas o precios concretos deriva a un humano.
      const local = respuestaLocal(consulta, flujo);
      mostrar("assistant", local.respuesta);
      if (local.flujo) setFlujo(local.flujo);
      if (local.escalar) setEscalar(true);
      console.warn("Chat NetcompRF: respuesta de respaldo local; revisar configuración de API", error);
    } finally { setCargando(false); }
  }
  function continuarWhatsApp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nombre.trim()) { nombreRef.current?.focus(); return; }
    window.open(whatsapp(), "_blank", "noopener,noreferrer");
  }
  return <div className="fixed bottom-5 left-4 z-[80] sm:left-6">
    {abierto && <section aria-label="Chat de atención NetcompRF" className="mb-3 flex h-[min(560px,75dvh)] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-cyan-400/30 bg-slate-950 text-white shadow-[0_20px_70px_rgba(0,0,0,0.65)]">
      <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-indigo-950 to-slate-900 p-3">
        <img src="/portfolio/dante.png" alt="Dante Core" className="h-12 w-12 rounded-xl object-contain" />
        <div className="flex-1"><p className="font-bold">Dante AI · NetcompRF</p><p className="text-xs text-cyan-200">Asistencia virtual · proyectos y servicios</p></div>
        <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar chat" className="rounded-lg p-2 hover:bg-white/10"><X size={20}/></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-900/70 p-4" role="log" aria-live="polite">
        {mensajes.map(m => <div key={m.id} className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-cyan-600 text-white" : "mr-auto border border-white/10 bg-slate-800 text-slate-100"}`}>{m.text}</div>)}
        {cargando && <div className="inline-flex items-center gap-2 text-sm text-slate-300"><Loader2 className="animate-spin" size={16}/> Dante está respondiendo...</div>}
        <div ref={finRef}/>
      </div>
      {escalar && <form onSubmit={continuarWhatsApp} className="space-y-2 border-t border-white/10 bg-slate-950 px-3 py-3">
        <label className="block text-xs text-slate-300">Tu nombre completo <span className="text-amber-300">(obligatorio)</span>
          <input ref={nombreRef} required minLength={2} maxLength={70} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y apellido" className="mt-1 w-full rounded-lg border border-white/20 bg-slate-800 p-2 text-sm outline-none focus:border-cyan-300" />
        </label>
        <button disabled={!nombre.trim() || cargando} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] p-3 text-sm font-bold text-slate-950 disabled:opacity-50"><MessageCircle size={18}/> Continuar por WhatsApp <ArrowUpRight size={16}/></button>
        <p className="text-[11px] text-slate-400">Abriremos WhatsApp con el resumen de tu proyecto y conversación. Tú confirmas el envío.</p>
      </form>}
      <form onSubmit={enviar} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input aria-label="Tu mensaje para Dante" value={escrito} onChange={e => setEscrito(e.target.value)} maxLength={1200} placeholder="Escribe tu consulta..." className="min-w-0 flex-1 rounded-xl border border-white/15 bg-slate-800 px-3 py-3 text-sm outline-none focus:border-cyan-400" />
        <button disabled={cargando || !escrito.trim()} type="submit" aria-label="Enviar mensaje" className="rounded-xl bg-cyan-400 p-3 text-slate-950 disabled:opacity-40"><Send size={19}/></button>
      </form>
      <p className="px-3 pb-2 text-center text-[10px] text-slate-400">No compartas contraseñas ni datos bancarios. El chat es una orientación inicial.</p>
    </section>}
    {!abierto && <button type="button" onClick={() => setAbierto(true)} className="group flex items-center gap-3 rounded-full border border-violet-400/40 bg-slate-900 px-4 py-3 text-white shadow-[0_10px_35px_rgba(82,50,180,0.45)] transition hover:scale-105" aria-label="Abrir chat con Dante">
      <img src="/portfolio/dante.png" alt="" className="h-9 w-9 rounded-full object-contain"/><span className="pr-1 text-sm font-bold">Chatea con Dante AI</span><span className="h-2 w-2 animate-pulse rounded-full bg-lime-400" />
    </button>}
  </div>;
}
