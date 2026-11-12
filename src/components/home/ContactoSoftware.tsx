"use client";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Mail, MessageCircle, Send } from "lucide-react";

const API_URL=(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_LOCAL_API_URL || '').replace(/\/+$/,'');
const WA='https://wa.me/593988899116?text='+encodeURIComponent('Hola Netcomp RF, deseo información sobre desarrollo de software o una demostración de sus soluciones.');
export default function ContactoSoftware(){
 const [estado,setEstado]=useState<'idle'|'loading'|'ok'|'error'>('idle');
 const [mensaje,setMensaje]=useState('');
 async function enviar(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); if(estado==='loading')return;
  const form=e.currentTarget; const fd=new FormData(form);
  setEstado('loading');setMensaje('');
  try{
   if(!API_URL)throw new Error('Falta configurar NEXT_PUBLIC_API_URL en el frontend.');
   const resp=await fetch(`${API_URL}${API_URL.endsWith('/api')?'':'/api'}/contacto-portafolio`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre:fd.get('nombre'),email:fd.get('email'),empresa:fd.get('empresa'),interes:fd.get('interes'),mensaje:fd.get('mensaje'),web:fd.get('web')})});
   const result=await resp.json().catch(()=>({}));
   if(!resp.ok)throw new Error(result.error||'No se pudo enviar la solicitud.');
   setEstado('ok');setMensaje('Tu solicitud fue enviada a Netcomp RF. Te responderemos al correo indicado.');form.reset();
  }catch(error){setEstado('error');setMensaje(error instanceof Error?error.message:'Ocurrió un error al enviar la solicitud.');}
 }
 return <section id="solicitar-software" className="scroll-mt-24 px-6 py-20"><div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-cyan-400/20 bg-slate-900/70 p-6 md:grid-cols-2 md:p-10">
  <div className="flex flex-col justify-center"><p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">Desarrollo a medida</p><h2 className="mt-4 text-3xl font-black md:text-5xl">¿Creamos tu próxima solución?</h2><p className="mt-5 leading-8 text-slate-300">Cuéntanos lo que necesita tu empresa. Podemos ayudarte con un ERP, plataforma web, facturación electrónica, software a medida o integración de un asistente con IA.</p>
   <div className="mt-7 flex flex-wrap gap-3"><a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-black text-slate-950"><MessageCircle size={19}/> WhatsApp directo</a><a href="mailto:netcomprf@hotmail.com" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 font-bold text-white"><Mail size={19}/> netcomprf@hotmail.com</a></div>
   <p className="mt-5 text-sm text-slate-400">WhatsApp: +593 988 899 116</p>
  </div>
  <form onSubmit={enviar} className="grid gap-4 rounded-3xl bg-slate-950/80 p-5 sm:p-7"><h3 className="text-xl font-black">Solicitar información o demostración</h3>
   <label className="grid gap-1.5 text-sm text-slate-200">Nombre *<input name="nombre" required minLength={2} maxLength={100} autoComplete="name" className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Tu nombre"/></label>
   <label className="grid gap-1.5 text-sm text-slate-200">Correo electrónico *<input name="email" type="email" required maxLength={180} autoComplete="email" className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400" placeholder="correo@empresa.com"/></label>
   <label className="grid gap-1.5 text-sm text-slate-200">Empresa (opcional)<input name="empresa" maxLength={120} className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Nombre de empresa"/></label>
   <label className="grid gap-1.5 text-sm text-slate-200">¿Qué te interesa?<select name="interes" className="rounded-xl border border-white/15 bg-slate-900 px-4 py-3" defaultValue="Demostración de software"><option>Demostración de software</option><option>Netcomp WISP ERP</option><option>Cachuelo</option><option>Cinario</option><option>POS NRF</option><option>Motor SRI</option><option>Dante Core AI</option><option>Desarrollo a medida</option></select></label>
   <label className="grid gap-1.5 text-sm text-slate-200">Mensaje *<textarea name="mensaje" required minLength={10} maxLength={2000} rows={4} className="resize-y rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Cuéntanos sobre tu proyecto..."/></label>
   <div className="hidden" aria-hidden="true"><label>No llenar<input name="web" tabIndex={-1} autoComplete="off"/></label></div>
   <button type="submit" disabled={estado==='loading'} className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-black text-slate-950 disabled:opacity-60"><Send size={18}/>{estado==='loading'?'Enviando solicitud…':'Enviar solicitud por correo'} <ArrowUpRight size={16}/></button>
   {mensaje&&<p role="status" className={`rounded-lg px-3 py-2 text-sm ${estado==='ok'?'bg-emerald-500/10 text-emerald-200':'bg-rose-500/10 text-rose-200'}`}>{mensaje}</p>}
   <p className="text-xs text-slate-400">Tu correo se utilizará para responder a esta solicitud comercial.</p>
  </form></div></section>
}
