import Image from "next/image";
import { ArrowUpRight, Bot, Code2, Cpu, Globe2, Network, ShieldCheck, Wifi } from "lucide-react";

const productos = [
  {nombre:"Netcomp WISP ERP",sub:"ERP sectorial · ISP / WISP",resumen:"Clientes, planes, mensualidades, cartera, socios y gestión de redes en una sola plataforma.",icono:"/portfolio/netcomp.png",web:"https://www.netcomprf.com/",integracion:true},
  {nombre:"Cachuelo",sub:"Servicios · Talento · Inteligencia territorial",resumen:"Conectamos clientes, profesionales, empresas e instituciones mediante herramientas digitales.",icono:"/portfolio/cachuelo.png",web:"https://www.cachueloec.com/",integracion:true},
  {nombre:"Cinario",sub:"Eventos · Entretenimiento",resumen:"Organización y gestión de eventos, reservas y experiencias para el sector del entretenimiento.",icono:"/portfolio/cinario.png",web:"https://cinarioec.com/",integracion:true},
  {nombre:"POS NRF",sub:"ERP comercial · Punto de venta",resumen:"Ventas, inventario, caja, tesorería y reportes comerciales para negocios.",icono:"/portfolio/pos.png",web:"https://pos.netcomprf.com/",integracion:true},
];
export default function PortfolioNetcomp(){
return <section id="software" className="relative scroll-mt-24 overflow-hidden border-y border-cyan-400/15 bg-[#071422] px-6 py-20 md:py-28">
  <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
  <div className="relative mx-auto max-w-7xl">
    <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-cyan-300">NETCOMP RF · SOFTWARE DEVELOPMENT</p>
        <h2 className="mt-5 text-4xl font-black leading-tight text-white md:text-5xl">Transformamos ideas en <span className="text-cyan-300">soluciones digitales.</span></h2>
        <p className="mt-6 max-w-xl leading-8 text-slate-300">Desarrollamos plataformas empresariales, ERP sectoriales, facturación electrónica, aplicaciones a medida y asistentes virtuales con inteligencia artificial.</p>
        <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
          {['Software propio','Desarrollo a medida','Integración API','Asistentes con IA'].map(t=><span key={t} className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-cyan-100">{t}</span>)}
        </div>
        <a href="#solicitar-software" className="mt-9 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300">Solicitar demostración <ArrowUpRight size={18}/></a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {productos.map((p)=><a key={p.nombre} href={p.web} target="_blank" rel="noopener noreferrer" aria-label={`Visitar web de ${p.nombre}`} className="group relative flex min-h-60 flex-col items-start rounded-3xl border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-cyan-400/50 hover:bg-cyan-400/[0.09]">
          <div className="relative mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-2"><Image src={p.icono} alt={`Ícono de ${p.nombre}`} width={90} height={90} className="max-h-full w-auto object-contain" unoptimized/></div>
          <h3 className="text-xl font-black text-white">{p.nombre}</h3>
          <span className="mt-1 text-xs font-semibold text-cyan-300">{p.sub}</span>
          <p className="mt-3 text-sm leading-6 text-slate-300">{p.resumen}</p>
          <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-lime-300">Visitar sitio <ArrowUpRight size={15}/></span>
          <span className="absolute right-5 top-5 rounded-full border border-violet-300/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-200">IA integrable</span>
        </a>)}
      </div>
    </div>
    <div className="mt-7 grid gap-5 md:grid-cols-[1fr_1.1fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
        <h3 className="text-2xl font-black">Dos áreas. Una misma visión.</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div><Wifi className="text-cyan-300" size={27}/><h4 className="mt-3 font-bold">Netcomp Telecom</h4><p className="mt-2 text-sm leading-6 text-slate-300">Internet, conectividad, redes e infraestructura tecnológica.</p></div>
          <div><Code2 className="text-lime-300" size={27}/><h4 className="mt-3 font-bold">Netcomp Software</h4><p className="mt-2 text-sm leading-6 text-slate-300">Aplicaciones, ERP, automatizaciones, integraciones y desarrollo personalizado.</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-300"><Globe2 size={16}/> <span>Soluciones para empresas, comercios e instituciones</span></div>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-violet-400/40 bg-gradient-to-br from-[#24103b] via-[#141c3d] to-[#0b2634] p-7 shadow-[0_0_45px_rgba(139,92,246,0.11)]">
        <div className="flex items-center gap-4"><div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5 p-2"><Image src="/portfolio/dante.png" alt="Dante Core AI" width={110} height={110} className="max-h-full w-auto object-contain" unoptimized/></div><div><span className="text-xs font-bold uppercase tracking-[0.23em] text-violet-200">IA empresarial · Destacado</span><h3 className="mt-1 text-3xl font-black">Dante Core AI</h3></div></div>
        <p className="mt-5 leading-7 text-slate-200">Asistente virtual empresarial desarrollado para integrarse en sistemas y ayudar a equipos con procesos, consultas y operaciones digitales.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-violet-100"><span className="flex items-center gap-1"><Bot size={16}/> Asistentes empresariales</span><span className="flex items-center gap-1"><Network size={16}/> Integraciones</span><span className="flex items-center gap-1"><ShieldCheck size={16}/> Accesos controlados</span><span className="flex items-center gap-1"><Cpu size={16}/> Automatización</span></div>
        <a href="#solicitar-software" className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-violet-300">Consultar integración con IA <ArrowUpRight size={17}/></a>
      </div>
    </div>
    <p className="mt-5 text-center text-xs text-slate-400">Motor SRI de facturación electrónica: otra de nuestras soluciones tecnológicas para empresas en Ecuador.</p>
  </div>
</section>;
}
