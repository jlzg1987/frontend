'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getToken } from '@/src/lib/api';
import { Banknote, CheckCircle2, CircleDollarSign, Clock3, Download, Edit3, Plus, ReceiptText, Trash2, TrendingUp, X, XCircle } from 'lucide-react';

type Item = { gastoMensualId: string; sedeId: string; categoriaGastoId: string; sede: string; categoria: string; descripcion: string; periodo: string; fechaGasto: string; valorSinIva: number; valorIva: number; valorTotal: number; tipoGasto: 'FIJO' | 'VARIABLE'; estadoPago: 'PENDIENTE' | 'PAGADO' | 'ANULADO'; proveedor?: string };
type Sede = { sedeId: string; nombre: string; estado: string }; type Categoria = { categoriaGastoId: string; nombre: string; estado: string };
const hoy = new Date().toISOString().slice(0, 10); const mes = hoy.slice(0, 7);
const inicial = { sedeId: '', categoriaGastoId: '', descripcion: '', periodo: mes, fechaGasto: hoy, fechaVencimiento: '', valorSinIva: '', aplicaIva: true, porcentajeIva: 15, tipoGasto: 'VARIABLE', proveedor: '', numeroDocumento: '', comprobanteUrl: '', observacion: '' };
const GASTOS_API = '/gastos-mensuales';
const money = (v: any) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(v || 0));
async function api(path: string, options: RequestInit = {}) { const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) } }); const j = await res.json().catch(() => ({})); if (!res.ok || j.ok === false) throw new Error(j.message || j.mensaje || 'No se pudo completar la operación.'); return j; }

export default function GastosMensualesPage() {
    const [gastos, setGastos] = useState<Item[]>([]), [sedes, setSedes] = useState<Sede[]>([]), [categorias, setCategorias] = useState<Categoria[]>([]), [resumen, setResumen] = useState<any>(null);
    const [periodo, setPeriodo] = useState(mes), [sedeId, setSedeId] = useState(''), [estado, setEstado] = useState(''), [buscar, setBuscar] = useState('');
    const [form, setForm] = useState<any>(inicial), [editando, setEditando] = useState(''), [modal, setModal] = useState(false), [loading, setLoading] = useState(true), [descargandoPdf, setDescargandoPdf] = useState(false), [error, setError] = useState('');
    async function cargar() { try { setLoading(true); setError(''); const p = new URLSearchParams({ periodo }); if (sedeId) p.set('sedeId', sedeId); if (estado) p.set('estadoPago', estado); if (buscar) p.set('buscar', buscar); const rp = new URLSearchParams({ periodo }); if (sedeId) rp.set('sedeId', sedeId); const [g, r, s, c] = await Promise.all([api(`${GASTOS_API}?${p.toString()}`), api(`${GASTOS_API}/resumen?${rp.toString()}`), api(`${GASTOS_API}/sedes`), api(`${GASTOS_API}/categorias`)]); setGastos(g.gastos || g.data || []); setResumen(r.resumen || r.data || r); setSedes(s.sedes || s.data || []); setCategorias(c.categorias || c.data || []); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }
    useEffect(() => { cargar(); }, [periodo, sedeId, estado]);
    function nuevo() { setEditando(''); setForm({ ...inicial, periodo, sedeId }); setModal(true); } function editar(g: Item) { setEditando(g.gastoMensualId); setForm({ ...g, periodo: String(g.periodo).slice(0, 7), fechaGasto: String(g.fechaGasto).slice(0, 10), aplicaIva: Boolean((g as any).aplicaIva) }); setModal(true); }
    async function guardar(e: React.FormEvent) { e.preventDefault(); try { await api(editando ? `${GASTOS_API}/${editando}` : GASTOS_API, { method: editando ? 'PUT' : 'POST', body: JSON.stringify(form) }); setModal(false); await cargar(); } catch (e: any) { alert(e.message); } }
    async function pagar(g: Item) { const metodoPago = prompt('Método: EFECTIVO, TRANSFERENCIA, TARJETA, DEBITO_AUTOMATICO u OTRO', 'TRANSFERENCIA'); if (!metodoPago) return; try { await api(`${GASTOS_API}/${g.gastoMensualId}/pagar`, { method: 'PATCH', body: JSON.stringify({ fechaPago: hoy, metodoPago: metodoPago.toUpperCase() }) }); await cargar(); } catch (e: any) { alert(e.message); } }
    async function anular(g: Item) { const observacion = prompt('Motivo de anulación:'); if (!observacion) return; try { await api(`${GASTOS_API}/${g.gastoMensualId}/anular`, { method: 'PATCH', body: JSON.stringify({ observacion }) }); await cargar(); } catch (e: any) { alert(e.message); } }
    async function eliminar(g: Item) { if (!confirm(`¿Eliminar ${g.descripcion}?`)) return; try { await api(`${GASTOS_API}/${g.gastoMensualId}`, { method: 'DELETE' }); await cargar(); } catch (e: any) { alert(e.message); } }
    async function descargarReportePdf() {
        try {
            setDescargandoPdf(true);

            const params = new URLSearchParams({ periodo });
            if (sedeId) params.set('sedeId', sedeId);
            if (estado) params.set('estadoPago', estado);
            if (buscar.trim()) params.set('buscar', buscar.trim());

            const res = await fetch(
                `${API_BASE}${GASTOS_API}/reporte-pdf?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );

            if (!res.ok) {
                const contentType = res.headers.get('content-type') || '';
                const errorData = contentType.includes('application/json')
                    ? await res.json().catch(() => ({}))
                    : {};

                throw new Error(
                    errorData.message ||
                    errorData.mensaje ||
                    'No se pudo generar el reporte PDF.'
                );
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const disposition = res.headers.get('content-disposition') || '';
            const match = disposition.match(/filename="?([^";]+)"?/i);
            const nombreArchivo = match?.[1] || `reporte-gastos-${periodo}.pdf`;
            const enlace = document.createElement('a');

            enlace.href = url;
            enlace.download = nombreArchivo;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert(e.message || 'Error descargando el reporte PDF.');
        } finally {
            setDescargandoPdf(false);
        }
    }
    const ing = resumen?.ingresos || {}, gas = resumen?.gastos || {};
    return <main className="min-h-screen bg-slate-950 p-5 text-white md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-end gap-3"><button type="button" onClick={descargarReportePdf} disabled={descargandoPdf || loading} className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 font-black text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"><Download size={18} />{descargandoPdf ? 'Generando PDF...' : 'Descargar reporte PDF'}</button><button type="button" onClick={nuevo} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-black"><Plus size={18} />Nuevo gasto</button></header>
        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>}
        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Ingresos", ing.ingresoTotal, TrendingUp, '#22c55e'], ["Gastos", gas.gastoTotal, ReceiptText, '#f97316'], ["Pagado", gas.totalPagado, CheckCircle2, '#38bdf8'], ["Pendiente", gas.totalPendiente, Clock3, '#fbbf24'], ["Utilidad neta", resumen?.utilidadNeta, CircleDollarSign, '#a78bfa']].map(([t, v, I, c]: any) => <article key={t} className="rounded-2xl border bg-slate-900 p-4" style={{ borderColor: `${c}35` }}><div className="flex justify-between"><div><p className="text-xs text-slate-400">{t}</p><strong className="mt-2 block text-xl" style={{ color: c }}>{money(v)}</strong></div><I style={{ color: c }} /></div></article>)}</section>
        <section className="mb-5 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-4"><input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><select value={sedeId} onChange={e => setSedeId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><option value="">Todas las sedes</option>{sedes.map(s => <option key={s.sedeId} value={s.sedeId}>{s.nombre}</option>)}</select><select value={estado} onChange={e => setEstado(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><option value="">Todos los estados</option><option>PENDIENTE</option><option>PAGADO</option><option>ANULADO</option></select><div className="flex gap-2"><input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar gasto..." className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 p-3" /><button onClick={cargar} className="rounded-xl bg-cyan-600 px-4 font-bold">Buscar</button></div></section>
        <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-950 text-xs uppercase text-slate-400"><tr><th className="p-4">Fecha</th><th>Sede</th><th>Categoría</th><th>Descripción</th><th>Tipo</th><th>Sin IVA</th><th>IVA</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody className="divide-y divide-slate-800">{gastos.map(g => <tr key={g.gastoMensualId}><td className="p-4">{String(g.fechaGasto).slice(0, 10)}</td><td className="font-bold text-cyan-200">{g.sede}</td><td>{g.categoria}</td><td>{g.descripcion}</td><td>{g.tipoGasto}</td><td>{money(g.valorSinIva)}</td><td>{money(g.valorIva)}</td><td className="font-black">{money(g.valorTotal)}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${g.estadoPago === 'PAGADO' ? 'bg-green-500/15 text-green-300' : g.estadoPago === 'ANULADO' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>{g.estadoPago}</span></td><td><div className="flex gap-2">{g.estadoPago === 'PENDIENTE' && <><button title="Editar" onClick={() => editar(g)} className="rounded-lg bg-blue-500/15 p-2 text-blue-300"><Edit3 size={15} /></button><button title="Pagar" onClick={() => pagar(g)} className="rounded-lg bg-green-500/15 p-2 text-green-300"><Banknote size={15} /></button><button title="Anular" onClick={() => anular(g)} className="rounded-lg bg-amber-500/15 p-2 text-amber-300"><XCircle size={15} /></button></>} {g.estadoPago !== 'PAGADO' && <button title="Eliminar" onClick={() => eliminar(g)} className="rounded-lg bg-red-500/15 p-2 text-red-300"><Trash2 size={15} /></button>}</div></td></tr>)}</tbody></table>{!loading && !gastos.length && <p className="p-10 text-center text-slate-400">No hay gastos para los filtros seleccionados.</p>}</section>
        {modal && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm"><form onSubmit={guardar} className="my-5 w-full max-w-3xl rounded-3xl border border-orange-500/25 bg-slate-900 p-6"><div className="mb-5 flex justify-between"><h2 className="text-xl font-black">{editando ? 'Editar gasto' : 'Nuevo gasto'}</h2><button type="button" onClick={() => setModal(false)}><X /></button></div><div className="grid gap-4 sm:grid-cols-2"><select required value={form.sedeId} onChange={e => setForm({ ...form, sedeId: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><option value="">Seleccionar sede</option>{sedes.filter(s => s.estado === 'ACTIVA').map(s => <option key={s.sedeId} value={s.sedeId}>{s.nombre}</option>)}</select><select required value={form.categoriaGastoId} onChange={e => setForm({ ...form, categoriaGastoId: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><option value="">Seleccionar categoría</option>{categorias.filter(c => c.estado === 'ACTIVA').map(c => <option key={c.categoriaGastoId} value={c.categoriaGastoId}>{c.nombre}</option>)}</select><input required value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" className="rounded-xl border border-slate-700 bg-slate-950 p-3 sm:col-span-2" /><input required type="month" value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><input required type="date" value={form.fechaGasto} onChange={e => setForm({ ...form, fechaGasto: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><input required type="number" min="0" step="0.01" value={form.valorSinIva} onChange={e => setForm({ ...form, valorSinIva: e.target.value })} placeholder="Valor sin IVA" className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><select value={form.tipoGasto} onChange={e => setForm({ ...form, tipoGasto: e.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-3"><option>VARIABLE</option><option>FIJO</option></select><label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 p-3"><input type="checkbox" checked={form.aplicaIva} onChange={e => setForm({ ...form, aplicaIva: e.target.checked })} />Aplica IVA (15 %)</label><input value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} placeholder="Proveedor" className="rounded-xl border border-slate-700 bg-slate-950 p-3" /><textarea value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Observación" className="rounded-xl border border-slate-700 bg-slate-950 p-3 sm:col-span-2" /></div><button className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-3 font-black">Guardar gasto</button></form></div>}
    </main>;
}
