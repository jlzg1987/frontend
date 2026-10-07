'use client';



import { useEffect, useMemo, useState } from 'react';



import { API_BASE, getToken } from '@/src/lib/api';



import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



import { Building2, RefreshCw, Users, WalletCards, TrendingUp, Landmark, Plus, Pencil, Power, Percent, Download, HandCoins, Eye, X } from 'lucide-react';



const money = (v: any) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(v || 0));



async function api(path: string, init?: RequestInit) { const r = await fetch(`${API_BASE}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(init?.headers || {}) } }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.message || 'Error consultando finanzas'); return d; }



const hoy = () => new Date().toISOString().slice(0, 10);



export default function FinanzasIspPage() {



    const now = new Date(), [periodo, setPeriodo] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`), [sedeId, setSedeId] = useState(''), [routerId, setRouterId] = useState('');



    const [resumen, setResumen] = useState<any>(null), [evolucion, setEvolucion] = useState<any[]>([]), [sedes, setSedes] = useState<any[]>([]), [sociosCalc, setSociosCalc] = useState<any>(null), [socios, setSocios] = useState<any[]>([]), [liquidaciones, setLiquidaciones] = useState<any[]>([]), [loading, setLoading] = useState(false), [error, setError] = useState(''), [tab, setTab] = useState<'resumen' | 'socios' | 'cobros'>('resumen');



    const [modal, setModal] = useState(false), [editando, setEditando] = useState<any>(null), [form, setForm] = useState<any>({ sedeId: '', nombre: '', identificacion: '', telefono: '', email: '', porcentaje: '', vigenteDesde: hoy(), observacion: '' });

    const [socioCobroId, setSocioCobroId] = useState(''), [cobrosSocio, setCobrosSocio] = useState<any>(null), [loadingCobros, setLoadingCobros] = useState(false);
    const [tipoCobroReporte, setTipoCobroReporte] = useState<'ANUAL' | 'MENSUAL'>('ANUAL'), [periodoCobros, setPeriodoCobros] = useState(periodo);
    const [modalCobros, setModalCobros] = useState(false), [detalleCobros, setDetalleCobros] = useState<any>(null), [loadingDetalleCobros, setLoadingDetalleCobros] = useState(false);
    const [tipoDetalleCobros, setTipoDetalleCobros] = useState<'GLOBAL' | 'MENSUAL'>('GLOBAL'), [periodoDetalleCobros, setPeriodoDetalleCobros] = useState(periodo), [socioDetalleActivo, setSocioDetalleActivo] = useState<any>(null);



    const params = useMemo(() => { const p = new URLSearchParams({ periodo }); if (sedeId) p.set('sedeId', sedeId); if (routerId) p.set('routerId', routerId); return p.toString() }, [periodo, sedeId, routerId]);



    async function cargar() { setLoading(true); setError(''); try { const year = periodo.slice(0, 4); const [r, e, s, ls] = await Promise.all([api(`/finanzas-isp/resumen?${params}`), api(`/finanzas-isp/evolucion?anio=${year}${sedeId ? `&sedeId=${sedeId}` : ''}${routerId ? `&routerId=${routerId}` : ''}`), api(`/finanzas-isp/sedes?periodo=${periodo}`), api(`/finanzas-isp/socios/${sedeId || 'todos'}`)]); setResumen(r); setEvolucion(e.data || []); setSedes(s.data || []); setSocios(ls.data || []); if (sedeId) { const [lc, lq] = await Promise.all([api(`/finanzas-isp/liquidacion-socios?periodo=${periodo}&sedeId=${sedeId}`), api(`/finanzas-isp/liquidaciones?periodo=${periodo}&sedeId=${sedeId}`)]); setSociosCalc(lc); setLiquidaciones(lq.data || []) } else { setSociosCalc(null); setLiquidaciones([]) } } catch (e: any) { setError(e.message) } finally { setLoading(false) } }



    useEffect(() => { cargar() }, [params]);



    function nuevo() { setEditando(null); setForm({ sedeId: sedeId || '', nombre: '', identificacion: '', telefono: '', email: '', porcentaje: '', vigenteDesde: hoy(), observacion: '' }); setModal(true) }



    function editar(s: any) { setEditando(s); setForm({ sedeId: s.sedeId || '', nombre: s.nombre || '', identificacion: s.identificacion || '', telefono: s.telefono || '', email: s.email || '', porcentaje: s.porcentaje || '', vigenteDesde: s.vigenteDesde?.slice?.(0, 10) || hoy(), observacion: s.observacion || '' }); setModal(true) }



    async function guardar() { try { setError(''); if (!form.sedeId) throw new Error('Seleccione la sede del socio'); if (!form.nombre.trim()) throw new Error('El nombre es obligatorio'); if (editando) { await api(`/finanzas-isp/socios/${editando.socioId}`, { method: 'PUT', body: JSON.stringify(form) }); if (String(form.porcentaje) !== String(editando.porcentaje || '')) await api(`/finanzas-isp/socios/${editando.socioId}/participaciones`, { method: 'POST', body: JSON.stringify({ porcentaje: Number(form.porcentaje), vigenteDesde: form.vigenteDesde, observacion: 'Cambio desde Finanzas ISP' }) }); } else await api('/finanzas-isp/socios', { method: 'POST', body: JSON.stringify({ ...form, sedeId: form.sedeId, porcentaje: Number(form.porcentaje) }) }); setModal(false); await cargar() } catch (e: any) { setError(e.message) } }



    async function estado(s: any) { try { await api(`/finanzas-isp/socios/${s.socioId}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: s.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' }) }); await cargar() } catch (e: any) { setError(e.message) } }



    async function generar() { try { await api('/finanzas-isp/liquidaciones/generar', { method: 'POST', body: JSON.stringify({ periodo, sedeId }) }); await cargar() } catch (e: any) { setError(e.message) } }



    async function pagar(l: any) { const ref = window.prompt('Referencia del pago (opcional):', '') ?? ''; try { await api(`/finanzas-isp/liquidaciones/${l.liquidacionId}/pagar`, { method: 'PATCH', body: JSON.stringify({ referenciaPago: ref }) }); await cargar() } catch (e: any) { setError(e.message) } }



    async function descargarPdf(tipo: 'finanzas' | 'socios') { try { const q = tipo === 'finanzas' ? params : `periodo=${encodeURIComponent(periodo)}&sedeId=${encodeURIComponent(sedeId)}`; const r = await fetch(`${API_BASE}/reportes-pdf-isp/${tipo}?${q}`, { headers: { Authorization: `Bearer ${getToken()}` } }); if (!r.ok) throw new Error('No se pudo generar PDF'); const u = URL.createObjectURL(await r.blob()), a = document.createElement('a'); a.href = u; a.download = `${tipo}-${periodo}.pdf`; a.click(); URL.revokeObjectURL(u) } catch (e: any) { setError(e.message) } }



    async function cargarCobrosSocio(id = socioCobroId) { if (!id) { setCobrosSocio(null); return } try { setLoadingCobros(true); setError(''); const q = new URLSearchParams({ socioId: id, anio: periodoCobros.slice(0, 4) }); if (tipoCobroReporte === 'MENSUAL') q.set('periodo', periodoCobros); if (sedeId) q.set('sedeId', sedeId); setCobrosSocio(await api(`/finanzas-isp/cobros-socios?${q.toString()}`)) } catch (e: any) { setError(e.message); setCobrosSocio(null) } finally { setLoadingCobros(false) } }

    useEffect(() => { setPeriodoCobros(periodo); setPeriodoDetalleCobros(periodo); }, [periodo]);
    useEffect(() => { if (tab === 'cobros' && socioCobroId) void cargarCobrosSocio(socioCobroId) }, [tab, socioCobroId, tipoCobroReporte, periodoCobros, sedeId]);

    async function descargarCobrosPdf() { if (!socioCobroId) { setError('Selecciona un socio.'); return } try { const q = new URLSearchParams({ socioId: socioCobroId, anio: periodoCobros.slice(0, 4) }); if (tipoCobroReporte === 'MENSUAL') q.set('periodo', periodoCobros); if (sedeId) q.set('sedeId', sedeId); const r = await fetch(`${API_BASE}/finanzas-isp/cobros-socios/pdf?${q.toString()}`, { headers: { Authorization: `Bearer ${getToken()}` } }); if (!r.ok) throw new Error('No se pudo generar PDF'); const u = URL.createObjectURL(await r.blob()), a = document.createElement('a'); a.href = u; a.download = `cobros-socio-${tipoCobroReporte === 'MENSUAL' ? periodoCobros : periodoCobros.slice(0, 4)}.pdf`; a.click(); URL.revokeObjectURL(u) } catch (e: any) { setError(e.message) } }

    async function cargarDetalleCobros(s: any, tipo: 'GLOBAL' | 'MENSUAL' = tipoDetalleCobros, per = periodoDetalleCobros) {
        try {
            setLoadingDetalleCobros(true);
            setError('');
            const q = new URLSearchParams();
            if (tipo === 'MENSUAL') q.set('periodo', per);
            setDetalleCobros(await api(`/finanzas-isp/socios/${s.socioId}/cobros-en-poder${q.toString() ? `?${q.toString()}` : ''}`));
        } catch (e: any) {
            setError(e.message || 'No se pudo consultar el dinero en poder del socio');
            setDetalleCobros(null);
        } finally {
            setLoadingDetalleCobros(false);
        }
    }

    async function abrirDetalleCobros(s: any) {
        setSocioDetalleActivo(s);
        setTipoDetalleCobros('GLOBAL');
        setPeriodoDetalleCobros(periodo);
        setDetalleCobros(null);
        setModalCobros(true);
        await cargarDetalleCobros(s, 'GLOBAL', periodo);
    }

    async function imprimirDetalleCobros() {
        if (!detalleCobros?.socio?.socioId) return;
        try {
            const q = new URLSearchParams();
            if (tipoDetalleCobros === 'MENSUAL') q.set('periodo', periodoDetalleCobros);
            const r = await fetch(`${API_BASE}/finanzas-isp/socios/${detalleCobros.socio.socioId}/cobros-en-poder/pdf${q.toString() ? `?${q.toString()}` : ''}`, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || 'No se pudo generar el PDF'); }
            const u = URL.createObjectURL(await r.blob()), a = document.createElement('a');
            a.href = u;
            a.download = `cobros-en-poder-${String(detalleCobros.socio.nombre || 'socio').replace(/\s+/g, '-')}-${tipoDetalleCobros === 'MENSUAL' ? periodoDetalleCobros : 'global'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(u);
        } catch (e: any) { setError(e.message || 'No se pudo generar el PDF'); }
    }



    const cards = [['Facturado sin IVA', resumen?.ingresos?.facturado, WalletCards], ['IVA 15%', resumen?.ingresos?.ivaFacturado, Percent], ['Facturado + IVA', resumen?.ingresos?.totalFacturadoConIva, WalletCards], ['Cobrado', resumen?.ingresos?.cobrado, Landmark], ['Cartera', resumen?.ingresos?.cartera, Users], ['Gastos pagados', resumen?.gastos?.pagados, Building2], ['Utilidad', resumen?.resultado?.utilidadOperativa, TrendingUp]] as const;



    return <div className="space-y-6 text-white">



        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h2 className="text-2xl font-black">Finanzas ISP</h2><p className="text-sm text-slate-400">Ingresos, cartera, gastos, utilidad y socios por sede/router.</p></div><div className="flex flex-wrap gap-2"><input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" /><select value={sedeId} onChange={e => setSedeId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"><option value="">Toda la empresa</option>{sedes.map((s: any) => <option key={s.sedeId} value={s.sedeId}>{s.sede}</option>)}</select><input value={routerId} onChange={e => setRouterId(e.target.value)} placeholder="Router ID (opcional)" className="w-44 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" /><button onClick={() => void descargarPdf(tab === 'socios' && sedeId ? 'socios' : 'finanzas')} className="rounded-xl border border-cyan-500/40 px-4 py-2 font-bold"><Download className="inline h-4 w-4" /> PDF</button><button onClick={cargar} className="rounded-xl bg-cyan-600 px-4 py-2 font-bold"><RefreshCw className={`inline h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar</button></div></div>



        <div className="flex gap-2"><button onClick={() => setTab('resumen')} className={`rounded-xl px-4 py-2 font-bold ${tab === 'resumen' ? 'bg-cyan-600' : 'bg-slate-800'}`}>Resumen</button><button onClick={() => setTab('socios')} className={`rounded-xl px-4 py-2 font-bold ${tab === 'socios' ? 'bg-violet-600' : 'bg-slate-800'}`}><Users className="mr-1 inline h-4 w-4" /> Socios</button><button onClick={() => setTab('cobros')} className={`rounded-xl px-4 py-2 font-bold ${tab === 'cobros' ? 'bg-emerald-600' : 'bg-slate-800'}`}><HandCoins className="mr-1 inline h-4 w-4" /> Cobros de socios</button></div>



        {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}



        {tab === 'resumen' ? <>



            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">{cards.map(([t, v, I]) => <div key={t} className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-4"><I className="mb-3 h-5 w-5 text-cyan-300" /><p className="text-xs text-slate-400">{t}</p><p className="mt-1 text-xl font-black">{money(v)}</p></div>)}</div>



            <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="mb-4 font-black">Evolución anual</h3><div className="h-80"><ResponsiveContainer><AreaChart data={evolucion}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="periodo" /><YAxis /><Tooltip formatter={(v: any) => money(v)} /><Legend /><Area dataKey="cobrado" name="Cobrado" /><Area dataKey="gastos" name="Gastos" /><Area dataKey="utilidad" name="Utilidad" /></AreaChart></ResponsiveContainer></div></section><section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="mb-4 font-black">Comparativo por sede</h3><div className="h-80"><ResponsiveContainer><BarChart data={sedes}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="sede" /><YAxis /><Tooltip formatter={(v: any) => money(v)} /><Legend /><Bar dataKey="cobrado" name="Cobrado" /><Bar dataKey="gastosPagados" name="Gastos" /><Bar dataKey="utilidadOperativa" name="Utilidad" /></BarChart></ResponsiveContainer></div></section></div>



            {sociosCalc && <section className="rounded-2xl border border-violet-500/20 bg-slate-900 p-5"><h3 className="font-black">Distribución de utilidad de la sede</h3><div className="mt-4 grid gap-3 md:grid-cols-3"><div><span className="text-slate-400">Utilidad base</span><b className="block text-xl">{money(sociosCalc.utilidadBase)}</b></div><div><span className="text-slate-400">Socios</span><b className="block text-xl">{money(sociosCalc.totalSocios)}</b></div><div><span className="text-slate-400">Empresa</span><b className="block text-xl">{money(sociosCalc.utilidadEmpresa)}</b></div></div></section>}



        </> : tab === 'socios' ? <>



            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between"><div><h3 className="font-black">{sedeId ? 'Socios de la sede' : 'Socios de todas las sedes'}</h3><p className="text-sm text-slate-400">Datos, sede, participación vigente y cobros en su poder.</p></div><button onClick={nuevo} className="rounded-xl bg-violet-600 px-4 py-2 font-bold"><Plus className="mr-1 inline h-4 w-4" />Nuevo socio</button></div><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="py-2">Socio</th><th>Sede</th><th>Identificación</th><th>Contacto</th><th>Participación</th><th>Sin IVA</th><th>IVA 15%</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{socios.map(s => <tr key={s.socioId} className="border-t border-slate-800"><td className="py-3 font-bold">{s.nombre}</td><td>{s.sedeNombre || '—'}</td><td>{s.identificacion || '—'}</td><td>{s.telefono || s.email || '—'}</td><td>{s.porcentaje ? `${Number(s.porcentaje)}%` : 'Sin participación'}</td><td>{money(s.cobrosEnPoderSinIva)}</td><td>{money(s.cobrosEnPoderIva)}</td><td><button type="button" onClick={() => void abrirDetalleCobros(s)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 font-bold text-amber-300 hover:bg-amber-500/20" title="Ver clientes y cobros en poder"><Eye className="h-3.5 w-3.5" />{money(s.cobrosEnPoderTotal)}</button></td><td>{s.estado}</td><td className="space-x-2"><button onClick={() => editar(s)} className="rounded-lg bg-slate-800 p-2" title="Editar"><Pencil className="h-4 w-4" /></button><button onClick={() => estado(s)} className="rounded-lg bg-slate-800 p-2" title="Activar/Inactivar"><Power className="h-4 w-4" /></button></td></tr>)}</tbody></table>{!socios.length && <p className="py-5 text-center text-slate-500">No hay socios registrados para el filtro seleccionado.</p>}</div></section>

            {sedeId ? <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between"><div><h3 className="font-black">Liquidaciones · {periodo}</h3><p className="text-sm text-slate-400">Genera el valor mensual únicamente para los socios de la sede seleccionada.</p></div><button onClick={generar} className="rounded-xl bg-cyan-600 px-4 py-2 font-bold"><Percent className="mr-1 inline h-4 w-4" />Generar liquidaciones</button></div><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="py-2">Socio</th><th>%</th><th>Utilidad base</th><th>Participación</th><th>Estado</th><th>Pago</th></tr></thead><tbody>{liquidaciones.map(l => <tr key={l.liquidacionId} className="border-t border-slate-800"><td className="py-3">{l.socioNombre}</td><td>{Number(l.porcentajeAplicado)}%</td><td>{money(l.utilidadBase)}</td><td className="font-bold">{money(l.valorParticipacion)}</td><td>{l.estadoPago}</td><td>{l.estadoPago === 'PENDIENTE' ? <button onClick={() => pagar(l)} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold">Marcar pagado</button> : l.fechaPago ? new Date(l.fechaPago).toLocaleDateString('es-EC') : '—'}</td></tr>)}</tbody></table>{!liquidaciones.length && <p className="py-5 text-center text-slate-500">Aún no se han generado liquidaciones para este período y sede.</p>}</div></section> : <div className="rounded-2xl border border-violet-500/20 bg-slate-900 p-5 text-slate-300">Selecciona una sede para ver o generar sus liquidaciones.</div>}

        </> : <>

            {!sedeId ? <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-6 text-slate-300">Selecciona una sede arriba para consultar los cobros recibidos por sus socios.</div> : <>

                <section className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-black">Cobros recibidos por socios</h3><p className="text-sm text-slate-400">Consulta anual o mensual de las mensualidades cobradas directamente por cada socio.</p></div><div className="flex flex-wrap items-end gap-2"><select value={socioCobroId} onChange={e => setSocioCobroId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"><option value="">Seleccionar socio</option>{socios.filter(x => x.estado === 'ACTIVO').map(x => <option key={x.socioId} value={x.socioId}>{x.nombre}</option>)}</select><select value={tipoCobroReporte} onChange={e => setTipoCobroReporte(e.target.value as 'ANUAL' | 'MENSUAL')} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"><option value="ANUAL">Reporte anual</option><option value="MENSUAL">Reporte mensual</option></select>{tipoCobroReporte === 'MENSUAL' && <input type="month" value={periodoCobros} onChange={e => setPeriodoCobros(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />}<button onClick={() => void cargarCobrosSocio()} disabled={!socioCobroId} className="rounded-xl bg-emerald-600 px-4 py-2 font-bold disabled:opacity-50"><RefreshCw className={`mr-1 inline h-4 w-4 ${loadingCobros ? 'animate-spin' : ''}`} />Actualizar</button><button onClick={() => void descargarCobrosPdf()} disabled={!socioCobroId} className="rounded-xl border border-emerald-500/40 px-4 py-2 font-bold disabled:opacity-50"><Download className="mr-1 inline h-4 w-4" />{tipoCobroReporte === 'MENSUAL' ? 'PDF mensual' : 'PDF anual'}</button></div></div></section>

                {cobrosSocio && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Pagos recibidos', cobrosSocio.resumen?.pagos], ['Total recibido', money(cobrosSocio.resumen?.totalRecibido)], ['En poder del socio', money(cobrosSocio.resumen?.enPoderSocio)], ['Entregado a empresa', money(cobrosSocio.resumen?.entregadoEmpresa)]].map(([t, v]) => <div key={String(t)} className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-4"><p className="text-xs text-slate-400">{t}</p><p className="mt-1 text-xl font-black text-emerald-300">{v}</p></div>)}</div>

                    {tipoCobroReporte === 'ANUAL' && <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="mb-4 font-black">Cobros mensuales · {periodoCobros.slice(0, 4)}</h3><div className="h-80"><ResponsiveContainer><BarChart data={(cobrosSocio.meses || []).map((x: any) => ({ ...x, mesNombre: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][Number(x.mes) - 1] }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mesNombre" /><YAxis /><Tooltip formatter={(v: any) => money(v)} /><Legend /><Bar dataKey="valor" name="Valor cobrado" /></BarChart></ResponsiveContainer></div></section>}

                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="font-black">Quiénes pagaron a {cobrosSocio.socio?.nombre}{tipoCobroReporte === 'MENSUAL' ? ` · ${periodoCobros}` : ''}</h3><div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="py-2">Fecha</th><th>Cliente</th><th>Mensualidad</th><th>Valor</th><th>Forma</th><th>Referencia</th><th>Estado</th></tr></thead><tbody>{(cobrosSocio.detalle || []).map((d: any) => <tr key={d.cobroSocioId} className="border-t border-slate-800"><td className="py-3">{d.fechaRecepcion ? new Date(d.fechaRecepcion).toLocaleDateString('es-EC') : '—'}</td><td>{d.clienteId || '—'}</td><td>{d.periodo || '—'}</td><td className="font-bold text-emerald-300">{money(d.valor)}</td><td>{d.formaPagoId || '—'}</td><td>{d.referenciaPago || '—'}</td><td>{d.estado}</td></tr>)}</tbody></table>{!(cobrosSocio.detalle || []).length && <p className="py-5 text-center text-slate-500">Este socio no registra cobros para el periodo seleccionado.</p>}</div></section></>}

            </>}

        </>}



        {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 p-6"><h3 className="text-xl font-black">{editando ? 'Editar socio' : 'Nuevo socio'}</h3><label className="mt-5 block text-sm text-slate-300">Sede *<select value={form.sedeId || ''} onChange={e => setForm({ ...form, sedeId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"><option value="">Seleccione una sede</option>{sedes.map((s: any) => <option key={s.sedeId} value={s.sedeId}>{s.sede}</option>)}</select></label><div className="mt-5 grid gap-3 md:grid-cols-2">{[['nombre', 'Nombre *'], ['identificacion', 'Identificación'], ['telefono', 'Teléfono'], ['email', 'Email'], ['porcentaje', 'Participación %'], ['vigenteDesde', 'Vigente desde']].map(([k, l]) => <label key={k} className="text-sm text-slate-300">{l}<input type={k === 'vigenteDesde' ? 'date' : k === 'porcentaje' ? 'number' : 'text'} step={k === 'porcentaje' ? '0.01' : undefined} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" /></label>)}</div><label className="mt-3 block text-sm text-slate-300">Observación<textarea value={form.observacion || ''} onChange={e => setForm({ ...form, observacion: e.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" /></label><div className="mt-5 flex justify-end gap-2"><button onClick={() => setModal(false)} className="rounded-xl bg-slate-800 px-4 py-2">Cancelar</button><button onClick={guardar} className="rounded-xl bg-violet-600 px-4 py-2 font-bold">Guardar</button></div></div></div>}

        {modalCobros && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"><div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-amber-500/20 bg-slate-950 p-6 shadow-2xl"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-black">Dinero en poder del socio</h3><p className="mt-1 text-sm text-slate-400">Detalle global o mensual de los clientes cuyos pagos aún no han sido entregados a la empresa.</p></div><div className="flex flex-wrap items-center gap-2"><select value={tipoDetalleCobros} onChange={async e => { const t = e.target.value as 'GLOBAL' | 'MENSUAL'; setTipoDetalleCobros(t); if (socioDetalleActivo) await cargarDetalleCobros(socioDetalleActivo, t, periodoDetalleCobros); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"><option value="GLOBAL">Global</option><option value="MENSUAL">Mensual</option></select>{tipoDetalleCobros === 'MENSUAL' && <input type="month" value={periodoDetalleCobros} onChange={async e => { const v = e.target.value; setPeriodoDetalleCobros(v); if (socioDetalleActivo) await cargarDetalleCobros(socioDetalleActivo, 'MENSUAL', v); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" />}<button type="button" onClick={() => void imprimirDetalleCobros()} disabled={!detalleCobros || loadingDetalleCobros} className="rounded-xl border border-cyan-500/40 px-4 py-2 font-bold text-cyan-200 disabled:opacity-50"><Download className="mr-1 inline h-4 w-4" />{tipoDetalleCobros === 'MENSUAL' ? 'PDF mensual' : 'PDF global'}</button><button type="button" onClick={() => { setModalCobros(false); setDetalleCobros(null); setSocioDetalleActivo(null); }} className="rounded-xl bg-slate-800 p-2" title="Cerrar"><X className="h-5 w-5" /></button></div></div>

            {loadingDetalleCobros ? <div className="py-14 text-center text-slate-400">Cargando cobros...</div> : detalleCobros && <><div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4"><div className="font-bold text-white">{detalleCobros.socio?.nombre}</div><div className="mt-1 text-sm text-slate-400">Sede actual: {detalleCobros.socio?.sedeNombre || '—'} · Identificación: {detalleCobros.socio?.identificacion || '—'}{detalleCobros.periodo ? ` · Periodo: ${detalleCobros.periodo}` : ' · Todos los periodos pendientes'}</div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['Clientes / cobros', detalleCobros.resumen?.clientes], ['Sin IVA', money(detalleCobros.resumen?.valorSinIva)], ['IVA 15%', money(detalleCobros.resumen?.iva)], ['Total en poder', money(detalleCobros.resumen?.total)]].map(([t, v]) => <div key={String(t)} className="rounded-xl border border-amber-500/20 bg-slate-900 p-4"><p className="text-xs text-slate-400">{t}</p><p className="mt-1 text-xl font-black text-amber-300">{v}</p></div>)}</div><div className="mt-5 overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[950px] text-sm"><thead className="bg-slate-900"><tr className="text-left text-slate-400"><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Cédula</th><th className="p-3">Sede del cobro</th><th className="p-3">Periodo</th><th className="p-3 text-right">Sin IVA</th><th className="p-3 text-right">IVA</th><th className="p-3 text-right">Total</th><th className="p-3">Referencia</th></tr></thead><tbody>{(detalleCobros.detalle || []).map((d: any) => <tr key={d.cobroSocioId} className="border-t border-slate-800"><td className="p-3">{d.fechaRecepcion ? new Date(d.fechaRecepcion).toLocaleDateString('es-EC') : '—'}</td><td className="p-3 font-semibold">{d.clienteNombre || '—'}</td><td className="p-3">{d.cedula || '—'}</td><td className="p-3">{d.sedeCobro || '—'}</td><td className="p-3">{d.periodo || '—'}</td><td className="p-3 text-right">{money(d.valorSinIva)}</td><td className="p-3 text-right">{money(d.iva)}</td><td className="p-3 text-right font-bold text-amber-300">{money(d.total)}</td><td className="p-3">{d.referenciaPago || '—'}</td></tr>)}</tbody></table>{!(detalleCobros.detalle || []).length && <p className="p-8 text-center text-slate-500">Este socio no tiene dinero pendiente de entregar.</p>}</div></>}
        </div></div>}



    </div>;



}
