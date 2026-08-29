'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_BASE, getToken } from '@/src/lib/api';
import { Building2, Edit3, MapPin, Plus, Router, Trash2, X } from 'lucide-react';

type Sede = {
    sedeId: string;
    nombre: string;
    provincia: string;
    ciudadCanton?: string | null;
    direccion?: string | null;
    estado: 'ACTIVA' | 'INACTIVA';
    cantidadRouters?: number;
};

type RouterSede = {
    sedeRouterId?: string | null;
    routerMikrotikId: number;
    router: string;
    parroquia?: string;
    sector?: string;
    activo?: number;
    sedeId?: string | null;
    sede?: string | null;
};

const sedeInicial = {
    nombre: '', provincia: 'Esmeraldas', ciudadCanton: '', direccion: '', estado: 'ACTIVA',
};

const GASTOS_BASE = '/gastos-mensuales';

async function api(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
            ...(options.headers || {}),
        },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) throw new Error(json.message || json.mensaje || 'No se pudo completar la operación.');
    return json;
}

export default function ConfiguracionSedesPage() {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [routers, setRouters] = useState<RouterSede[]>([]);
    const [form, setForm] = useState<any>(sedeInicial);
    const [editandoId, setEditandoId] = useState('');
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [buscar, setBuscar] = useState('');

    async function cargar() {
        try {
            setLoading(true); setError('');
            const [s, r] = await Promise.all([
                api(`${GASTOS_BASE}/sedes`),
                api(`${GASTOS_BASE}/sedes-routers`),
            ]);
            setSedes(s.sedes || s.data || []);
            setRouters(r.routers || r.data || []);
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
    }

    useEffect(() => { cargar(); }, []);

    const routersFiltrados = useMemo(() => {
        const q = buscar.toLowerCase();
        return routers.filter(r => `${r.router} ${r.parroquia} ${r.sector} ${r.sede}`.toLowerCase().includes(q));
    }, [routers, buscar]);

    function nuevaSede() { setEditandoId(''); setForm(sedeInicial); setModal(true); }
    function editarSede(s: Sede) {
        setEditandoId(s.sedeId);
        setForm({ nombre: s.nombre, provincia: s.provincia, ciudadCanton: s.ciudadCanton || '', direccion: s.direccion || '', estado: s.estado });
        setModal(true);
    }

    async function guardarSede(e: React.FormEvent) {
        e.preventDefault();
        try {
            setGuardando(true);
            await api(editandoId ? `${GASTOS_BASE}/sedes/${editandoId}` : `${GASTOS_BASE}/sedes`, {
                method: editandoId ? 'PUT' : 'POST', body: JSON.stringify(form),
            });
            setModal(false); await cargar();
        } catch (e: any) { alert(e.message); }
        finally { setGuardando(false); }
    }

    async function eliminarSede(s: Sede) {
        if (!confirm(`¿Eliminar la sede ${s.nombre}?`)) return;
        try { await api(`${GASTOS_BASE}/sedes/${s.sedeId}`, { method: 'DELETE' }); await cargar(); }
        catch (e: any) { alert(e.message); }
    }

    async function asignar(router: RouterSede, sedeId: string) {
        try {
            if (!sedeId && router.sedeRouterId) {
                await api(`${GASTOS_BASE}/sedes-routers/${router.sedeRouterId}`, { method: 'DELETE' });
            } else if (sedeId) {
                await api(
                    router.sedeRouterId
                        ? `${GASTOS_BASE}/sedes-routers/${router.sedeRouterId}`
                        : `${GASTOS_BASE}/sedes-routers`,
                    {
                        method: router.sedeRouterId ? 'PUT' : 'POST',
                        body: JSON.stringify({ sedeId, routerMikrotikId: router.routerMikrotikId }),
                    }
                );
            }
            await cargar();
        } catch (e: any) { alert(e.message); }
    }

    return (
        <main className="min-h-screen bg-slate-950 p-5 text-white md:p-8">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <button onClick={nuevaSede} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 font-bold"><Plus size={18} /> Nueva sede</button>
            </header>
            {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}

            <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ marginBottom: 20 }}>
                {sedes.map(s => (
                    <article key={s.sedeId} className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl">
                        <div className="mb-4 flex justify-between"><div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300"><Building2 /></div><span className={`h-fit rounded-full px-2.5 py-1 text-xs font-black ${s.estado === 'ACTIVA' ? 'bg-green-500/15 text-green-300' : 'bg-slate-700 text-slate-300'}`}>{s.estado}</span></div>
                        <h2 className="text-xl font-black">{s.nombre}</h2>
                        <p className="mt-2 flex gap-2 text-sm text-slate-400"><MapPin size={16} />{s.ciudadCanton || s.provincia}</p>
                        <p className="mt-2 flex gap-2 text-sm text-slate-400"><Router size={16} />{Number(s.cantidadRouters || routers.filter(r => r.sedeId === s.sedeId).length)} routers</p>
                        <div className="mt-5 flex gap-2"><button onClick={() => editarSede(s)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500/15 px-3 py-2 text-sm font-bold text-blue-300"><Edit3 size={15} /> Editar</button><button onClick={() => eliminarSede(s)} className="rounded-lg bg-red-500/15 px-3 text-red-300"><Trash2 size={16} /></button></div>
                    </article>
                ))}
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-black">Asignación de routers</h2><p className="text-xs text-slate-400">La asignación no modifica la configuración de MikroTik.</p></div><input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar router..." className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 outline-none focus:border-cyan-500" /></div>
                <div className="overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-950 text-xs uppercase text-slate-400"><tr><th className="p-4">Router</th><th>Parroquia</th><th>Sector</th><th>Estado</th><th className="pr-4">Sede asignada</th></tr></thead><tbody className="divide-y divide-slate-800">{routersFiltrados.map(r => <tr key={r.routerMikrotikId}><td className="p-4 font-bold text-cyan-200">{r.router}</td><td>{r.parroquia || '-'}</td><td>{r.sector || '-'}</td><td><span className={r.activo ? 'text-green-300' : 'text-slate-500'}>{r.activo ? 'Activo' : 'Inactivo'}</span></td><td className="pr-4"><select value={r.sedeId || ''} onChange={e => asignar(r, e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5"><option value="">Sin sede</option>{sedes.filter(s => s.estado === 'ACTIVA').map(s => <option key={s.sedeId} value={s.sedeId}>{s.nombre}</option>)}</select></td></tr>)}</tbody></table></div>
                {loading && <p className="py-6 text-center text-slate-400">Cargando configuración...</p>}
            </section>

            {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 p-4 backdrop-blur-sm"><form onSubmit={guardarSede} className="w-full max-w-xl rounded-3xl border border-cyan-500/25 bg-slate-900 p-6 shadow-2xl"><div className="mb-5 flex justify-between"><h2 className="text-xl font-black">{editandoId ? 'Editar sede' : 'Nueva sede'}</h2><button type="button" onClick={() => setModal(false)}><X /></button></div><div className="grid gap-4 sm:grid-cols-2"><input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><input required value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value })} placeholder="Provincia" className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><input value={form.ciudadCanton} onChange={e => setForm({ ...form, ciudadCanton: e.target.value })} placeholder="Ciudad o cantón" className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><option>ACTIVA</option><option>INACTIVA</option></select><textarea value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección" className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 p-3" /></div><button disabled={guardando} className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 p-3 font-black">{guardando ? 'Guardando...' : 'Guardar sede'}</button></form></div>}
        </main >
    );
}
