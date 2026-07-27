'use client';

import { API_BASE } from '@/src/lib/api';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

type Props = { onVolver: () => void; onAbrirSolicitud: (solicitudId: string) => void; };
type Solicitud = {
    solicitudId: string; codigo: string; nombreProyecto: string; nombreCliente: string;
    tipoDesarrollo: string; etapaActual: string; estado: string; porcentajeAvance: number;
    fechaEntregaReal?: string | null; fechaEntregaEstimada?: string | null; updatedAt?: string | null;
    responsable?: string | null; presupuestoAcordado?: number | string | null;
    totalPagado?: number | string | null; saldoPendiente?: number | string | null;
};

function textoEnum(v?: string | null) {
    return v ? v.toLowerCase().split('_').map((p) => p[0].toUpperCase() + p.slice(1)).join(' ') : 'Sin definir';
}
function fecha(v?: string | null) {
    if (!v) return 'Sin registrar'; const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 'Sin registrar' : new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}
function dinero(v?: number | string | null) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(v || 0));
}
function fechaEntrega(s: Solicitud) { return s.fechaEntregaReal || s.fechaEntregaEstimada || s.updatedAt; }

export default function ProyectosEntregadosDesarrolloPageInterno({ onVolver, onAbrirSolicitud }: Props) {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [buscar, setBuscar] = useState(''); const [anio, setAnio] = useState(''); const [tipo, setTipo] = useState('');
    const [vista, setVista] = useState<'TARJETAS' | 'TABLA'>('TARJETAS');
    const [cargando, setCargando] = useState(true); const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        try {
            setCargando(true); setError('');
            const token = localStorage.getItem('isp_token');
            if (!token) throw new Error('No se encontró la sesión del usuario');
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes`, {
                headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cargar los proyectos entregados');
            setSolicitudes((data.solicitudes || []).filter((s: Solicitud) => s.estado === 'FINALIZADO' || s.etapaActual === 'ENTREGADO').map((s: Solicitud) => ({ ...s, porcentajeAvance: Number(s.porcentajeAvance || 0) })));
        } catch (e: any) { console.error('Error cargando proyectos entregados:', e); setError(e?.message || 'No fue posible cargar los proyectos'); setSolicitudes([]); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const anios = useMemo(() => Array.from(new Set(solicitudes.map((s) => {
        const v = fechaEntrega(s); return v ? String(new Date(v).getFullYear()) : '';
    }).filter(Boolean))).sort((a, b) => b.localeCompare(a)), [solicitudes]);
    const tipos = useMemo(() => Array.from(new Set(solicitudes.map((s) => s.tipoDesarrollo).filter(Boolean))).sort(), [solicitudes]);
    const filtradas = useMemo(() => solicitudes.filter((s) => {
        const q = buscar.trim().toLowerCase(); const f = fechaEntrega(s); const y = f ? String(new Date(f).getFullYear()) : '';
        return (!q || [s.codigo, s.nombreProyecto, s.nombreCliente, s.responsable].some((v) => String(v || '').toLowerCase().includes(q))) && (!anio || y === anio) && (!tipo || s.tipoDesarrollo === tipo);
    }), [solicitudes, buscar, anio, tipo]);
    const resumen = useMemo(() => ({
        entregados: filtradas.length,
        contratado: filtradas.reduce((a, s) => a + Number(s.presupuestoAcordado || 0), 0),
        pagado: filtradas.reduce((a, s) => a + Number(s.totalPagado || 0), 0),
        pendiente: filtradas.reduce((a, s) => a + Number(s.saldoPendiente || 0), 0),
    }), [filtradas]);

    return <main style={styles.page}>
        <div style={styles.topBar}><button style={styles.back} onClick={onVolver}>← Volver</button><button style={styles.refresh} onClick={cargar}>↻ Actualizar</button></div>
        <header style={styles.header}><span style={styles.eyebrow}>HISTORIAL DE ENTREGAS</span><h1 style={styles.title}>Proyectos entregados</h1><p style={styles.subtitle}>Consulta los desarrollos finalizados, sus responsables y el resumen económico de cada entrega.</p></header>
        {error && <div style={styles.error}>⚠️ {error}<button style={styles.retry} onClick={cargar}>Reintentar</button></div>}
        <section style={styles.stats}>
            <Stat icono="✅" titulo="Proyectos entregados" valor={cargando ? '...' : resumen.entregados} color="#22c55e" />
            <Stat icono="💼" titulo="Valor contratado" valor={cargando ? '...' : dinero(resumen.contratado)} color="#38bdf8" />
            <Stat icono="💵" titulo="Total pagado" valor={cargando ? '...' : dinero(resumen.pagado)} color="#14b8a6" />
            <Stat icono="🧾" titulo="Saldo pendiente" valor={cargando ? '...' : dinero(resumen.pendiente)} color="#f59e0b" />
        </section>
        <section style={styles.filters}>
            <div style={styles.search}><span>🔎</span><input style={styles.input} value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar proyecto, código, cliente o responsable..." /></div>
            <select style={styles.select} value={anio} onChange={(e) => setAnio(e.target.value)}><option value="">Todos los años</option>{anios.map((v) => <option key={v}>{v}</option>)}</select>
            <select style={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos los tipos</option>{tipos.map((v) => <option key={v} value={v}>{textoEnum(v)}</option>)}</select>
            <div style={styles.viewSwitch}><button style={vista === 'TARJETAS' ? styles.viewActive : styles.viewButton} onClick={() => setVista('TARJETAS')}>▦</button><button style={vista === 'TABLA' ? styles.viewActive : styles.viewButton} onClick={() => setVista('TABLA')}>☷</button></div>
            {(buscar || anio || tipo) && <button style={styles.clear} onClick={() => { setBuscar(''); setAnio(''); setTipo(''); }}>Limpiar</button>}
        </section>
        {cargando && <div style={styles.state}>Cargando proyectos entregados...</div>}
        {!cargando && solicitudes.length === 0 && <div style={styles.empty}><span style={styles.emptyIcon}>📦</span><h2>Aún no hay proyectos entregados</h2><p>Cuando un desarrollo llegue a la etapa Entregado o sea finalizado aparecerá aquí.</p></div>}
        {!cargando && solicitudes.length > 0 && filtradas.length === 0 && <div style={styles.state}>No encontramos proyectos con los filtros seleccionados.</div>}
        {!cargando && filtradas.length > 0 && vista === 'TARJETAS' && <section style={styles.grid}>{filtradas.map((s) => <Card key={s.solicitudId} s={s} abrir={() => onAbrirSolicitud(s.solicitudId)} />)}</section>}
        {!cargando && filtradas.length > 0 && vista === 'TABLA' && <section style={styles.tableWrap}><table style={styles.table}><thead><tr><th style={styles.th}>Proyecto</th><th style={styles.th}>Cliente</th><th style={styles.th}>Tipo</th><th style={styles.th}>Entrega</th><th style={styles.th}>Responsable</th><th style={styles.th}>Contratado</th><th style={styles.th}>Pagado</th><th style={styles.th}></th></tr></thead><tbody>{filtradas.map((s) => <tr key={s.solicitudId}><td style={styles.td}><b>{s.nombreProyecto}</b><small style={styles.code}>{s.codigo}</small></td><td style={styles.td}>{s.nombreCliente}</td><td style={styles.td}>{textoEnum(s.tipoDesarrollo)}</td><td style={styles.td}>{fecha(fechaEntrega(s))}</td><td style={styles.td}>{s.responsable || 'Sin asignar'}</td><td style={styles.td}>{dinero(s.presupuestoAcordado)}</td><td style={styles.td}>{dinero(s.totalPagado)}</td><td style={styles.td}><button style={styles.open} onClick={() => onAbrirSolicitud(s.solicitudId)}>Ver detalle →</button></td></tr>)}</tbody></table></section>}
    </main>;
}

function Stat({ icono, titulo, valor, color }: { icono: string; titulo: string; valor: string | number; color: string }) { return <div style={{ ...styles.stat, borderColor: `${color}55` }}><span style={{ ...styles.statIcon, background: `${color}18` }}>{icono}</span><div><div style={styles.statTitle}>{titulo}</div><div style={{ ...styles.statValue, color }}>{valor}</div></div></div>; }
function Card({ s, abrir }: { s: Solicitud; abrir: () => void }) {
    const saldo = Number(s.saldoPendiente || 0); return <article style={styles.card}>
        <div style={styles.cardTop}><span style={styles.badge}>✓ ENTREGADO</span><span style={styles.cardDate}>{fecha(fechaEntrega(s))}</span></div>
        <span style={styles.code}>{s.codigo}</span><h2 style={styles.cardTitle}>{s.nombreProyecto}</h2><p style={styles.client}>👤 {s.nombreCliente}</p>
        <div style={styles.meta}><span>🧩 {textoEnum(s.tipoDesarrollo)}</span><span>👨‍💻 {s.responsable || 'Sin asignar'}</span></div>
        <div style={styles.money}><div><small>Contratado</small><b>{dinero(s.presupuestoAcordado)}</b></div><div><small>Pagado</small><b style={{ color: '#22c55e' }}>{dinero(s.totalPagado)}</b></div><div><small>Saldo</small><b style={{ color: saldo > 0 ? '#f59e0b' : '#94a3b8' }}>{dinero(saldo)}</b></div></div>
        <button style={styles.detail} onClick={abrir}>Ver detalle del desarrollo →</button>
    </article>;
}

const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', padding: '28px', color: '#e5edf8', background: 'radial-gradient(circle at 15% 0%, #112750 0, #071225 35%, #040a16 75%)', fontFamily: 'Inter, system-ui, sans-serif' },
    topBar: { display: 'flex', justifyContent: 'space-between', maxWidth: 1450, margin: '0 auto 22px' }, back: { background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 10, padding: '10px 15px', cursor: 'pointer' }, refresh: { background: '#12213b', border: '1px solid #334155', color: '#dbeafe', borderRadius: 10, padding: '10px 15px', cursor: 'pointer' },
    header: { maxWidth: 1450, margin: '0 auto 24px' }, eyebrow: { color: '#38bdf8', fontSize: 12, fontWeight: 800, letterSpacing: 1.5 }, title: { fontSize: 34, margin: '8px 0' }, subtitle: { margin: 0, color: '#94a3b8' },
    error: { maxWidth: 1450, margin: '0 auto 18px', border: '1px solid #7f1d1d', background: '#2b101b', borderRadius: 12, padding: 14, color: '#fecaca', display: 'flex', justifyContent: 'space-between' }, retry: { background: '#4c1d27', border: '1px solid #9f3347', color: '#fff', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' },
    stats: { maxWidth: 1450, margin: '0 auto 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }, stat: { display: 'flex', gap: 13, alignItems: 'center', background: '#0a1426d9', border: '1px solid', borderRadius: 14, padding: 17 }, statIcon: { width: 43, height: 43, display: 'grid', placeItems: 'center', borderRadius: 11, fontSize: 21 }, statTitle: { color: '#94a3b8', fontSize: 13 }, statValue: { fontWeight: 800, fontSize: 22, marginTop: 3 },
    filters: { maxWidth: 1450, margin: '0 auto 20px', display: 'flex', flexWrap: 'wrap', gap: 10, padding: 13, background: '#0a1426d9', border: '1px solid #1e293b', borderRadius: 14 }, search: { flex: '1 1 320px', display: 'flex', alignItems: 'center', gap: 8, background: '#07101f', border: '1px solid #26364c', borderRadius: 9, padding: '0 12px' }, input: { width: '100%', padding: '11px 0', background: 'transparent', border: 0, outline: 0, color: '#fff' }, select: { background: '#07101f', border: '1px solid #26364c', color: '#dbeafe', borderRadius: 9, padding: '10px 12px' }, viewSwitch: { display: 'flex', border: '1px solid #26364c', borderRadius: 9, overflow: 'hidden' }, viewButton: { background: '#07101f', border: 0, color: '#64748b', padding: '8px 13px', cursor: 'pointer' }, viewActive: { background: '#0c4a6e', border: 0, color: '#7dd3fc', padding: '8px 13px', cursor: 'pointer' }, clear: { background: 'transparent', border: 0, color: '#fca5a5', cursor: 'pointer' },
    grid: { maxWidth: 1450, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }, card: { padding: 19, border: '1px solid #1e3a4a', borderRadius: 15, background: 'linear-gradient(145deg, #0c1a2c, #091321)', boxShadow: '0 10px 30px #0005' }, cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, badge: { fontSize: 11, fontWeight: 800, letterSpacing: .8, padding: '5px 8px', color: '#86efac', background: '#14532d55', border: '1px solid #166534', borderRadius: 7 }, cardDate: { fontSize: 12, color: '#94a3b8' }, code: { display: 'block', color: '#38bdf8', fontSize: 12, marginTop: 4 }, cardTitle: { fontSize: 20, margin: '5px 0 8px' }, client: { color: '#cbd5e1', margin: '0 0 14px' }, meta: { display: 'grid', gap: 7, color: '#94a3b8', fontSize: 13, padding: '12px 0', borderTop: '1px solid #1e293b', borderBottom: '1px solid #1e293b' }, money: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '14px 0' }, detail: { width: '100%', padding: 10, background: '#0c4a6e55', border: '1px solid #075985', borderRadius: 9, color: '#7dd3fc', cursor: 'pointer' },
    tableWrap: { maxWidth: 1450, margin: '0 auto', overflowX: 'auto', border: '1px solid #1e293b', borderRadius: 14, background: '#091321' }, table: { width: '100%', borderCollapse: 'collapse', minWidth: 1050 }, th: { textAlign: 'left', color: '#94a3b8', fontSize: 12, padding: 13, borderBottom: '1px solid #26364c', background: '#0d192b' }, td: { padding: 13, borderBottom: '1px solid #172235', color: '#cbd5e1', fontSize: 13 }, open: { background: 'transparent', border: 0, color: '#38bdf8', cursor: 'pointer', whiteSpace: 'nowrap' }, state: { maxWidth: 1450, margin: '0 auto', padding: 45, textAlign: 'center', color: '#94a3b8' }, empty: { maxWidth: 650, margin: '40px auto', padding: 48, textAlign: 'center', background: '#0a1426', border: '1px dashed #334155', borderRadius: 16, color: '#94a3b8' }, emptyIcon: { fontSize: 46 },
};