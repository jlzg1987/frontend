'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getToken } from '@/src/lib/api';
import { Edit3, Plus, Tags, Trash2, X } from 'lucide-react';

type Categoria = { categoriaGastoId: string; nombre: string; descripcion?: string; estado: 'ACTIVA' | 'INACTIVA'; cantidadGastos?: number };
const inicial = { nombre: '', descripcion: '', estado: 'ACTIVA' };
const CATEGORIAS_API = '/gastos-mensuales/categorias';

async function api(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) throw new Error(json.message || json.mensaje || 'No se pudo completar la operación.');
    return json;
}

export default function CategoriasGastosPage() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [form, setForm] = useState<any>(inicial);
    const [editando, setEditando] = useState('');
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function cargar() { try { setLoading(true); setError(''); const j = await api(CATEGORIAS_API); setCategorias(j.categorias || j.data || []); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }
    useEffect(() => { cargar(); }, []);
    function nueva() { setEditando(''); setForm(inicial); setModal(true); }
    function editar(c: Categoria) { setEditando(c.categoriaGastoId); setForm({ nombre: c.nombre, descripcion: c.descripcion || '', estado: c.estado }); setModal(true); }
    async function guardar(e: React.FormEvent) { e.preventDefault(); try { await api(editando ? `${CATEGORIAS_API}/${editando}` : CATEGORIAS_API, { method: editando ? 'PUT' : 'POST', body: JSON.stringify(form) }); setModal(false); await cargar(); } catch (e: any) { alert(e.message); } }
    async function eliminar(c: Categoria) { if (!confirm(`¿Eliminar la categoría ${c.nombre}?`)) return; try { await api(`${CATEGORIAS_API}/${c.categoriaGastoId}`, { method: 'DELETE' }); await cargar(); } catch (e: any) { alert(e.message); } }

    return <main className="min-h-screen bg-slate-950 p-5 text-white md:p-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4" style={{ marginBottom: 20 }}>
            <button onClick={nueva} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-bold"><Plus size={18} /> Nueva categoría</button>
        </header>
        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{categorias.map(c => <article key={c.categoriaGastoId} className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-xl"><div className="flex justify-between"><div className="rounded-xl bg-violet-500/10 p-3 text-violet-300"><Tags /></div><span className={`h-fit rounded-full px-2.5 py-1 text-xs font-black ${c.estado === 'ACTIVA' ? 'bg-green-500/15 text-green-300' : 'bg-slate-700 text-slate-300'}`}>{c.estado}</span></div><h2 className="mt-4 text-lg font-black">{c.nombre}</h2><p className="mt-2 min-h-10 text-sm text-slate-400">{c.descripcion || 'Sin descripción'}</p><p className="mt-3 text-xs text-slate-500">{Number(c.cantidadGastos || 0)} gastos registrados</p><div className="mt-5 flex gap-2"><button onClick={() => editar(c)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500/15 p-2 text-sm font-bold text-blue-300"><Edit3 size={15} />Editar</button><button onClick={() => eliminar(c)} className="rounded-lg bg-red-500/15 px-3 text-red-300"><Trash2 size={16} /></button></div></article>)}</section>
        {!loading && !categorias.length && <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-400">No hay categorías registradas.</div>}
        {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 p-4 backdrop-blur-sm"><form onSubmit={guardar} className="w-full max-w-lg rounded-3xl border border-violet-500/25 bg-slate-900 p-6"><div className="mb-5 flex justify-between"><h2 className="text-xl font-black">{editando ? 'Editar categoría' : 'Nueva categoría'}</h2><button type="button" onClick={() => setModal(false)}><X /></button></div><div className="grid gap-4"><input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" className="min-h-24 rounded-xl border border-slate-700 bg-slate-950 p-3" /><select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><option>ACTIVA</option><option>INACTIVA</option></select></div><button className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3 font-black">Guardar categoría</button></form></div>}
    </main>;
}
