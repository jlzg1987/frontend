'use client';

import { API_BASE } from '@/src/lib/api';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

type Props = {
    onVolver: () => void;
    onAbrirSolicitud: (solicitudId: string) => void;
    onNuevaSolicitud: () => void;
};

type Solicitud = {
    solicitudId: string;
    codigo: string;
    nombreProyecto: string;
    nombreCliente: string;
    tipoDesarrollo: string;
    etapaActual: string;
    prioridad: string;
    porcentajeAvance: number;
    responsable?: string | null;
    fechaEntregaEstimada?: string | null;
    pendientesCliente?: number | string | null;
    updatedAt?: string | null;
};

type Columna = {
    id: string;
    titulo: string;
    icono: string;
    color: string;
    descripcion: string;
    etapas: string[];
};

const COLUMNAS: Columna[] = [
    {
        id: 'INICIO', titulo: 'Inicio y planificación', icono: '📋', color: '#38bdf8',
        descripcion: 'Solicitud, información y aprobación inicial',
        etapas: ['SOLICITUD_RECIBIDA', 'LEVANTAMIENTO_INFORMACION', 'COTIZACION', 'APROBADO'],
    },
    {
        id: 'DISENO', titulo: 'Diseño', icono: '🎨', color: '#a855f7',
        descripcion: 'Propuesta visual y estructura del proyecto', etapas: ['DISENO'],
    },
    {
        id: 'DESARROLLO', titulo: 'Desarrollo', icono: '💻', color: '#22c55e',
        descripcion: 'Construcción de funciones y módulos', etapas: ['DESARROLLO'],
    },
    {
        id: 'REVISION', titulo: 'Revisión y correcciones', icono: '👀', color: '#f59e0b',
        descripcion: 'Validación del cliente y ajustes', etapas: ['REVISION_CLIENTE', 'CORRECCIONES'],
    },
    {
        id: 'ENTREGA', titulo: 'Entrega y soporte', icono: '🚀', color: '#14b8a6',
        descripcion: 'Entrega final y acompañamiento', etapas: ['LISTO_ENTREGA', 'ENTREGADO', 'SOPORTE'],
    },
    {
        id: 'ESPERA', titulo: 'En espera o bloqueados', icono: '⏳', color: '#ef4444',
        descripcion: 'Requieren información, pago o reactivación',
        etapas: ['PAUSADO', 'ESPERANDO_INFORMACION', 'ESPERANDO_PAGO'],
    },
];

function textoEnum(valor?: string | null) {
    if (!valor) return 'Sin definir';
    return valor.toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function fecha(valor?: string | null) {
    if (!valor) return 'Sin fecha';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function diasRestantes(valor?: string | null) {
    if (!valor) return null;
    const entrega = new Date(`${String(valor).slice(0, 10)}T23:59:59`);
    if (Number.isNaN(entrega.getTime())) return null;
    return Math.ceil((entrega.getTime() - Date.now()) / 86400000);
}

function colorPrioridad(prioridad?: string) {
    if (prioridad === 'URGENTE') return '#ef4444';
    if (prioridad === 'ALTA') return '#f97316';
    if (prioridad === 'MEDIA') return '#f59e0b';
    return '#38bdf8';
}

export default function DesarrollosEnProcesoPageInterno({
    onVolver,
    onAbrirSolicitud,
    onNuevaSolicitud,
}: Props) {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [buscar, setBuscar] = useState('');
    const [prioridad, setPrioridad] = useState('');
    const [responsable, setResponsable] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            setError('');
            const token = localStorage.getItem('isp_token');
            if (!token) throw new Error('No se encontró la sesión del usuario');

            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes?estado=ACTIVO`, {
                headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cargar los desarrollos');

            setSolicitudes((data.solicitudes || []).map((s: any) => ({
                ...s,
                porcentajeAvance: Number(s.porcentajeAvance || 0),
            })));
        } catch (e: any) {
            console.error('Error cargando desarrollos en proceso:', e);
            setError(e?.message || 'No fue posible cargar los proyectos');
            setSolicitudes([]);
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const responsables = useMemo(() => Array.from(new Set(
        solicitudes.map((s) => s.responsable).filter((v): v is string => Boolean(v && v !== 'Sin asignar'))
    )).sort(), [solicitudes]);

    const filtradas = useMemo(() => {
        const q = buscar.trim().toLowerCase();
        return solicitudes.filter((s) => {
            const coincideTexto = !q || [s.codigo, s.nombreProyecto, s.nombreCliente, s.responsable]
                .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
            return coincideTexto && (!prioridad || s.prioridad === prioridad) && (!responsable || s.responsable === responsable);
        });
    }, [buscar, prioridad, responsable, solicitudes]);

    const resumen = useMemo(() => {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        return {
            activos: solicitudes.length,
            atrasados: solicitudes.filter((s) => {
                const dias = diasRestantes(s.fechaEntregaEstimada);
                return dias !== null && dias < 0;
            }).length,
            proximos: solicitudes.filter((s) => {
                const dias = diasRestantes(s.fechaEntregaEstimada);
                return dias !== null && dias >= 0 && dias <= 15;
            }).length,
            esperando: solicitudes.filter((s) => ['PAUSADO', 'ESPERANDO_INFORMACION', 'ESPERANDO_PAGO'].includes(s.etapaActual)).length,
        };
    }, [solicitudes]);

    function limpiar() { setBuscar(''); setPrioridad(''); setResponsable(''); }

    return (
        <main style={styles.page}>

            <header style={styles.header}>
                <span style={styles.eyebrow}>SEGUIMIENTO OPERATIVO</span>
            </header>
            <div style={styles.topBar}>

                <div style={styles.topActions}>
                    <button style={styles.refreshButton} onClick={cargar}>↻ Actualizar</button>
                    <button style={styles.primaryButton} onClick={onNuevaSolicitud}>+ Nueva solicitud</button>
                </div>
            </div>



            {error && <div style={styles.errorBox}>⚠️ {error}<button style={styles.retryButton} onClick={cargar}>Reintentar</button></div>}

            <section style={styles.statsGrid}>
                <Stat icono="💻" titulo="Proyectos activos" valor={cargando ? '...' : resumen.activos} color="#22c55e" />
                <Stat icono="🚨" titulo="Atrasados" valor={cargando ? '...' : resumen.atrasados} color="#ef4444" />
                <Stat icono="📅" titulo="Próximos a entregar" valor={cargando ? '...' : resumen.proximos} color="#f97316" />
                <Stat icono="⏳" titulo="En espera" valor={cargando ? '...' : resumen.esperando} color="#f59e0b" />
            </section>

            <section style={styles.filters}>
                <div style={styles.searchBox}><span>🔎</span><input style={styles.searchInput} value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar proyecto, código, cliente o responsable..." /></div>
                <select style={styles.select} value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                    <option value="">Todas las prioridades</option>
                    {['BAJA', 'MEDIA', 'ALTA', 'URGENTE'].map((p) => <option key={p} value={p}>{textoEnum(p)}</option>)}
                </select>
                <select style={styles.select} value={responsable} onChange={(e) => setResponsable(e.target.value)}>
                    <option value="">Todos los responsables</option>
                    {responsables.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {(buscar || prioridad || responsable) && <button style={styles.clearButton} onClick={limpiar}>Limpiar</button>}
            </section>

            {cargando && <div style={styles.loading}>Cargando proyectos activos...</div>}

            {!cargando && solicitudes.length === 0 && (
                <div style={styles.empty}>
                    <span style={styles.emptyIcon}>🧩</span>
                    <h2 style={styles.emptyTitle}>No hay desarrollos activos</h2>
                    <p style={styles.emptyText}>Crea una solicitud para comenzar el seguimiento.</p>
                    <button style={styles.primaryButton} onClick={onNuevaSolicitud}>+ Nueva solicitud</button>
                </div>
            )}

            {!cargando && solicitudes.length > 0 && (
                <section style={styles.board}>
                    {COLUMNAS.map((columna) => {
                        const proyectos = filtradas.filter((s) => columna.etapas.includes(s.etapaActual));
                        return (
                            <div key={columna.id} style={styles.column}>
                                <div style={{ ...styles.columnHeader, borderTopColor: columna.color }}>
                                    <div style={styles.columnTitleRow}>
                                        <span>{columna.icono}</span>
                                        <h2 style={styles.columnTitle}>{columna.titulo}</h2>
                                        <span style={{ ...styles.count, color: columna.color, background: `${columna.color}18` }}>{proyectos.length}</span>
                                    </div>
                                    <p style={styles.columnDescription}>{columna.descripcion}</p>
                                </div>

                                <div style={styles.columnBody}>
                                    {proyectos.length === 0 && <div style={styles.columnEmpty}>Sin proyectos</div>}
                                    {proyectos.map((s) => (
                                        <ProyectoCard key={s.solicitudId} solicitud={s} color={columna.color} onAbrir={() => onAbrirSolicitud(s.solicitudId)} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            {!cargando && solicitudes.length > 0 && filtradas.length === 0 && (
                <div style={styles.noResults}>No encontramos proyectos con los filtros seleccionados.</div>
            )}
        </main>
    );
}

function ProyectoCard({ solicitud: s, color, onAbrir }: { solicitud: Solicitud; color: string; onAbrir: () => void }) {
    const dias = diasRestantes(s.fechaEntregaEstimada);
    const atrasado = dias !== null && dias < 0;
    const proximo = dias !== null && dias >= 0 && dias <= 15;

    return (
        <article style={styles.projectCard} onClick={onAbrir}>
            <div style={styles.cardTop}>
                <span style={{ ...styles.code, color }}>{s.codigo}</span>
                <span style={{ ...styles.priority, color: colorPrioridad(s.prioridad), background: `${colorPrioridad(s.prioridad)}18` }}>{textoEnum(s.prioridad)}</span>
            </div>
            <h3 style={styles.projectTitle}>{s.nombreProyecto}</h3>
            <p style={styles.client}>👤 {s.nombreCliente}</p>
            <span style={styles.stage}>{textoEnum(s.etapaActual)}</span>

            <div style={styles.progressTop}><span>Avance</span><strong>{s.porcentajeAvance}%</strong></div>
            <div style={styles.progressTrack}><div style={{ ...styles.progressBar, width: `${s.porcentajeAvance}%`, background: color }} /></div>

            <div style={styles.cardInfo}>
                <div><span style={styles.infoLabel}>Responsable</span><strong style={styles.infoValue}>{s.responsable || 'Sin asignar'}</strong></div>
                <div style={styles.dateBox}><span style={styles.infoLabel}>Entrega</span><strong style={styles.infoValue}>{fecha(s.fechaEntregaEstimada)}</strong></div>
            </div>

            {atrasado && <div style={styles.overdue}>🚨 Atrasado por {Math.abs(dias!)} día(s)</div>}
            {!atrasado && proximo && <div style={styles.upcoming}>📅 Faltan {dias} día(s)</div>}
            {Number(s.pendientesCliente || 0) > 0 && <div style={styles.pending}>⏳ {s.pendientesCliente} pendiente(s) del cliente</div>}

            <button style={styles.openButton} onClick={(e) => { e.stopPropagation(); onAbrir(); }}>Abrir seguimiento →</button>
        </article>
    );
}

function Stat({ icono, titulo, valor, color }: any) {
    return <div style={styles.statCard}><span style={{ ...styles.statIcon, boxShadow: `0 0 16px ${color}44` }}>{icono}</span><div><span style={styles.statTitle}>{titulo}</span><strong style={{ ...styles.statValue, color }}>{valor}</strong></div></div>;
}

const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', padding: 24, background: 'linear-gradient(135deg,#020617,#0f172a)', color: '#e5e7eb' }, topBar: { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }, topActions: { display: 'flex', gap: 9 }, backButton: { padding: '10px 14px', borderRadius: 11, border: '1px solid rgba(56,189,248,.35)', background: '#0f172a', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }, refreshButton: { padding: '10px 13px', borderRadius: 11, border: '1px solid rgba(148,163,184,.22)', background: '#0f172a', color: '#cbd5e1', cursor: 'pointer' }, primaryButton: { padding: '11px 15px', border: 'none', borderRadius: 11, background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', cursor: 'pointer', fontWeight: 800 },
    header: { marginBottom: 24 }, eyebrow: { color: '#38bdf8', fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }, title: { margin: '6px 0 0', fontSize: 31, color: '#f8fafc' }, subtitle: { margin: '8px 0 0', color: '#94a3b8' }, errorBox: { display: 'flex', alignItems: 'center', gap: 10, padding: 14, marginBottom: 16, borderRadius: 12, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(127,29,29,.2)', color: '#fecaca' }, retryButton: { marginLeft: 'auto', padding: '7px 11px', borderRadius: 8, border: '1px solid rgba(248,113,113,.35)', background: 'transparent', color: '#fecaca', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13, marginBottom: 18 }, statCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)' }, statIcon: { display: 'grid', placeItems: 'center', width: 43, height: 43, borderRadius: 12, background: '#020617', fontSize: 20 }, statTitle: { display: 'block', color: '#94a3b8', fontSize: 12 }, statValue: { display: 'block', marginTop: 3, fontSize: 24 },
    filters: { display: 'flex', gap: 10, alignItems: 'center', padding: 14, marginBottom: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(15,23,42,.92)', flexWrap: 'wrap' }, searchBox: { display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 300px', padding: '0 11px', borderRadius: 10, border: '1px solid rgba(148,163,184,.22)', background: '#020617' }, searchInput: { width: '100%', padding: '10px 0', border: 'none', outline: 'none', background: 'transparent', color: '#e5e7eb' }, select: { padding: '10px 11px', borderRadius: 10, border: '1px solid rgba(148,163,184,.22)', background: '#020617', color: '#e5e7eb' }, clearButton: { padding: '10px 11px', borderRadius: 9, border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.08)', color: '#fca5a5', cursor: 'pointer' },
    loading: { padding: 40, textAlign: 'center', color: '#94a3b8' }, empty: { padding: 45, textAlign: 'center', borderRadius: 18, border: '1px dashed rgba(56,189,248,.25)', background: 'rgba(15,23,42,.7)' }, emptyIcon: { display: 'block', fontSize: 43 }, emptyTitle: { margin: '10px 0 0', color: '#f8fafc' }, emptyText: { margin: '7px 0 17px', color: '#94a3b8' }, noResults: { padding: 25, textAlign: 'center', color: '#94a3b8' },
    board: { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(285px,1fr))', gap: 14, overflowX: 'auto', paddingBottom: 16, alignItems: 'start' }, column: { borderRadius: 16, border: '1px solid rgba(148,163,184,.14)', background: 'rgba(15,23,42,.72)', overflow: 'hidden' }, columnHeader: { padding: 14, borderTop: '3px solid', background: 'rgba(15,23,42,.97)' }, columnTitleRow: { display: 'flex', alignItems: 'center', gap: 8 }, columnTitle: { margin: 0, flex: 1, fontSize: 14, color: '#f8fafc' }, count: { padding: '4px 7px', borderRadius: 999, fontSize: 10, fontWeight: 900 }, columnDescription: { margin: '6px 0 0', color: '#64748b', fontSize: 10, lineHeight: 1.4 }, columnBody: { display: 'grid', gap: 10, padding: 10, maxHeight: '65vh', overflowY: 'auto' }, columnEmpty: { padding: 22, textAlign: 'center', color: '#475569', fontSize: 12 },
    projectCard: { padding: 14, borderRadius: 13, border: '1px solid rgba(148,163,184,.14)', background: '#0f172a', cursor: 'pointer', boxShadow: '0 9px 20px rgba(0,0,0,.18)' }, cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 7 }, code: { fontSize: 10, fontWeight: 900 }, priority: { padding: '4px 6px', borderRadius: 999, fontSize: 9, fontWeight: 900 }, projectTitle: { margin: '10px 0 4px', fontSize: 14, color: '#f8fafc' }, client: { margin: '0 0 9px', color: '#94a3b8', fontSize: 11 }, stage: { display: 'inline-block', padding: '4px 7px', borderRadius: 7, background: '#020617', color: '#cbd5e1', fontSize: 9, fontWeight: 700 }, progressTop: { display: 'flex', justifyContent: 'space-between', margin: '12px 0 5px', color: '#94a3b8', fontSize: 9 }, progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden', background: '#020617' }, progressBar: { height: '100%', borderRadius: 999 }, cardInfo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(148,163,184,.1)' }, dateBox: { textAlign: 'right' }, infoLabel: { display: 'block', color: '#64748b', fontSize: 8 }, infoValue: { display: 'block', marginTop: 3, color: '#cbd5e1', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis' }, overdue: { marginTop: 9, padding: 7, borderRadius: 7, background: 'rgba(239,68,68,.1)', color: '#f87171', fontSize: 9 }, upcoming: { marginTop: 9, padding: 7, borderRadius: 7, background: 'rgba(249,115,22,.1)', color: '#fb923c', fontSize: 9 }, pending: { marginTop: 7, padding: 7, borderRadius: 7, background: 'rgba(245,158,11,.1)', color: '#fbbf24', fontSize: 9 }, openButton: { width: '100%', marginTop: 10, padding: '8px 9px', borderRadius: 8, border: '1px solid rgba(56,189,248,.25)', background: 'rgba(14,165,233,.08)', color: '#38bdf8', cursor: 'pointer', fontSize: 10, fontWeight: 800 },
};