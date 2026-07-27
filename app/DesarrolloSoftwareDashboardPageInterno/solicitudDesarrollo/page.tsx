'use client';

import { API_BASE } from '@/src/lib/api';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

type Props = {
    onVolver: () => void;
    onNuevaSolicitud: () => void;
    onAbrirSolicitud: (solicitudId: string) => void;
};

type Solicitud = {
    solicitudId: string;
    codigo: string;
    nombreProyecto: string;
    tipoDesarrollo: string;
    etapaActual: string;
    estado: string;
    prioridad: string;
    porcentajeAvance: number;
    fechaSolicitud?: string | null;
    fechaEntregaEstimada?: string | null;
    presupuestoAcordado?: number | string | null;
    nombreCliente: string;
    emailCliente?: string | null;
    responsable?: string | null;
    totalPagado?: number | string | null;
    saldoPendiente?: number | string | null;
    pendientesCliente?: number | string | null;
    updatedAt?: string | null;
};

const ETAPAS = [
    'SOLICITUD_RECIBIDA', 'LEVANTAMIENTO_INFORMACION', 'COTIZACION', 'APROBADO',
    'DISENO', 'DESARROLLO', 'REVISION_CLIENTE', 'CORRECCIONES', 'LISTO_ENTREGA',
    'ENTREGADO', 'SOPORTE', 'PAUSADO', 'ESPERANDO_INFORMACION', 'ESPERANDO_PAGO', 'CANCELADO',
];

function textoEnum(valor?: string | null) {
    if (!valor) return 'Sin definir';
    return valor.toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function fecha(valor?: string | null) {
    if (!valor) return 'Sin definir';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return 'Sin definir';
    return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function dinero(valor?: number | string | null) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(valor || 0));
}

function colorEstado(estado?: string) {
    if (['FINALIZADO', 'ENTREGADO', 'ACTIVO', 'APROBADO'].includes(estado || '')) return '#22c55e';
    if (['PAUSADO', 'ESPERANDO_INFORMACION', 'ESPERANDO_PAGO', 'REVISION_CLIENTE'].includes(estado || '')) return '#f59e0b';
    if (['CANCELADO', 'ARCHIVADO'].includes(estado || '')) return '#ef4444';
    return '#38bdf8';
}

export default function SolicitudesDesarrolloPageInterno({
    onVolver,
    onNuevaSolicitud,
    onAbrirSolicitud,
}: Props) {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [buscar, setBuscar] = useState('');
    const [estado, setEstado] = useState('');
    const [etapa, setEtapa] = useState('');
    const [vista, setVista] = useState<'TARJETAS' | 'TABLA'>('TARJETAS');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const cargarSolicitudes = useCallback(async () => {
        try {
            setCargando(true);
            setError('');

            const token = localStorage.getItem('isp_token');
            if (!token) throw new Error('No se encontró la sesión del usuario');

            const params = new URLSearchParams();
            if (buscar.trim()) params.set('buscar', buscar.trim());
            if (estado) params.set('estado', estado);
            if (etapa) params.set('etapa', etapa);

            const respuesta = await fetch(
                `${API_BASE}/desarrollo-software/solicitudes${params.toString() ? `?${params}` : ''}`,
                { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
            );
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cargar las solicitudes');

            setSolicitudes((data.solicitudes || []).map((item: any) => ({
                ...item,
                porcentajeAvance: Number(item.porcentajeAvance || 0),
            })));
        } catch (e: any) {
            console.error('Error cargando solicitudes de desarrollo:', e);
            setError(e?.message || 'No fue posible cargar las solicitudes');
            setSolicitudes([]);
        } finally { setCargando(false); }
    }, [buscar, estado, etapa]);

    useEffect(() => {
        const temporizador = window.setTimeout(cargarSolicitudes, 300);
        return () => window.clearTimeout(temporizador);
    }, [cargarSolicitudes]);

    const resumen = useMemo(() => ({
        total: solicitudes.length,
        activos: solicitudes.filter((s) => s.estado === 'ACTIVO').length,
        esperando: solicitudes.filter((s) => ['ESPERANDO_INFORMACION', 'ESPERANDO_PAGO', 'REVISION_CLIENTE'].includes(s.etapaActual)).length,
        entregados: solicitudes.filter((s) => s.estado === 'FINALIZADO' || s.etapaActual === 'ENTREGADO').length,
    }), [solicitudes]);

    async function archivarSolicitud(solicitud: Solicitud) {
        if (!window.confirm(`¿Archivar la solicitud ${solicitud.codigo}?`)) return;

        try {
            setError('');
            setMensaje('');
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes/${solicitud.solicitudId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('isp_token')}` },
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible archivar la solicitud');

            setMensaje(`${solicitud.codigo} fue archivada correctamente`);
            await cargarSolicitudes();
        } catch (e: any) {
            setError(e?.message || 'No fue posible archivar la solicitud');
        }
    }

    function limpiarFiltros() {
        setBuscar('');
        setEstado('');
        setEtapa('');
    }

    return (
        <main style={styles.page}>
            <header style={styles.header}>
                <h1 style={styles.title}>Solicitudes de desarrollo</h1>
            </header>
            <div style={styles.topBar}>
                <button type="button" style={styles.primaryButton} onClick={onNuevaSolicitud}>+ Nueva solicitud</button>
            </div>



            {error && <div style={styles.errorBox}>⚠️ {error}<button style={styles.retryButton} onClick={cargarSolicitudes}>Reintentar</button></div>}
            {mensaje && <div style={styles.successBox}>✅ {mensaje}</div>}

            <section style={styles.statsGrid}>
                <Stat icono="📋" titulo="Resultados" valor={cargando ? '...' : resumen.total} color="#38bdf8" />
                <Stat icono="💻" titulo="Activos" valor={cargando ? '...' : resumen.activos} color="#22c55e" />
                <Stat icono="⏳" titulo="Esperando" valor={cargando ? '...' : resumen.esperando} color="#f59e0b" />
                <Stat icono="✅" titulo="Entregados" valor={cargando ? '...' : resumen.entregados} color="#14b8a6" />
            </section>

            <section style={styles.filtersCard}>
                <div style={styles.searchBox}>
                    <span>🔎</span>
                    <input style={styles.searchInput} value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por código, proyecto o cliente..." />
                </div>
                <select style={styles.select} value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    {['ACTIVO', 'FINALIZADO', 'CANCELADO', 'ARCHIVADO'].map((v) => <option key={v} value={v}>{textoEnum(v)}</option>)}
                </select>
                <select style={styles.select} value={etapa} onChange={(e) => setEtapa(e.target.value)}>
                    <option value="">Todas las etapas</option>
                    {ETAPAS.map((v) => <option key={v} value={v}>{textoEnum(v)}</option>)}
                </select>
                {(buscar || estado || etapa) && <button style={styles.clearButton} onClick={limpiarFiltros}>Limpiar</button>}
                <div style={styles.viewButtons}>
                    <button style={{ ...styles.viewButton, ...(vista === 'TARJETAS' ? styles.viewActive : {}) }} onClick={() => setVista('TARJETAS')}>▦</button>
                    <button style={{ ...styles.viewButton, ...(vista === 'TABLA' ? styles.viewActive : {}) }} onClick={() => setVista('TABLA')}>☷</button>
                </div>
            </section>

            {cargando && <div style={styles.loadingBox}>Cargando solicitudes...</div>}

            {!cargando && solicitudes.length === 0 && (
                <div style={styles.emptyBox}>
                    <span style={styles.emptyIcon}>🧩</span>
                    <h2 style={styles.emptyTitle}>No encontramos solicitudes</h2>
                    <p style={styles.emptyText}>{buscar || estado || etapa ? 'Prueba con otros filtros.' : 'Registra el primer desarrollo solicitado por un cliente.'}</p>
                    {!buscar && !estado && !etapa && <button style={styles.primaryButton} onClick={onNuevaSolicitud}>+ Crear primera solicitud</button>}
                </div>
            )}

            {!cargando && solicitudes.length > 0 && vista === 'TARJETAS' && (
                <section style={styles.cardsGrid}>
                    {solicitudes.map((solicitud) => (
                        <article key={solicitud.solicitudId} style={styles.projectCard}>
                            <div style={styles.cardTop}>
                                <span style={styles.code}>{solicitud.codigo}</span>
                                <span style={{ ...styles.badge, color: colorEstado(solicitud.estado), background: `${colorEstado(solicitud.estado)}18` }}>{textoEnum(solicitud.estado)}</span>
                            </div>
                            <h2 style={styles.projectTitle}>{solicitud.nombreProyecto}</h2>
                            <p style={styles.clientName}>👤 {solicitud.nombreCliente}</p>
                            <div style={styles.tags}>
                                <span style={styles.tag}>{textoEnum(solicitud.tipoDesarrollo)}</span>
                                <span style={{ ...styles.tag, color: colorEstado(solicitud.etapaActual) }}>{textoEnum(solicitud.etapaActual)}</span>
                            </div>
                            <div style={styles.progressHeader}><span>Avance</span><strong>{solicitud.porcentajeAvance}%</strong></div>
                            <div style={styles.progressTrack}><div style={{ ...styles.progressBar, width: `${solicitud.porcentajeAvance}%` }} /></div>
                            <div style={styles.infoGrid}>
                                <Info label="Responsable" value={solicitud.responsable || 'Sin asignar'} />
                                <Info label="Entrega" value={fecha(solicitud.fechaEntregaEstimada)} />
                                <Info label="Presupuesto" value={dinero(solicitud.presupuestoAcordado)} />
                                <Info label="Saldo" value={dinero(solicitud.saldoPendiente)} />
                            </div>
                            {Number(solicitud.pendientesCliente || 0) > 0 && <div style={styles.pendingAlert}>⏳ {solicitud.pendientesCliente} pendiente(s) del cliente</div>}
                            <div style={styles.cardActions}>
                                <button style={styles.openButton} onClick={() => onAbrirSolicitud(solicitud.solicitudId)}>Ver seguimiento →</button>
                                {solicitud.estado !== 'ARCHIVADO' && <button style={styles.archiveButton} onClick={() => archivarSolicitud(solicitud)} title="Archivar">🗃️</button>}
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {!cargando && solicitudes.length > 0 && vista === 'TABLA' && (
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead><tr><Th>Proyecto</Th><Th>Cliente</Th><Th>Etapa</Th><Th>Avance</Th><Th>Responsable</Th><Th>Entrega</Th><Th>Acciones</Th></tr></thead>
                        <tbody>{solicitudes.map((s) => <tr key={s.solicitudId}>
                            <Td><strong style={styles.tableCode}>{s.codigo}</strong><span style={styles.tableMain}>{s.nombreProyecto}</span></Td>
                            <Td>{s.nombreCliente}</Td><Td><span style={{ color: colorEstado(s.etapaActual) }}>{textoEnum(s.etapaActual)}</span></Td>
                            <Td>{s.porcentajeAvance}%</Td><Td>{s.responsable || 'Sin asignar'}</Td><Td>{fecha(s.fechaEntregaEstimada)}</Td>
                            <Td><div style={styles.tableActions}><button style={styles.smallOpenButton} onClick={() => onAbrirSolicitud(s.solicitudId)}>Abrir</button>{s.estado !== 'ARCHIVADO' && <button style={styles.smallArchiveButton} onClick={() => archivarSolicitud(s)}>🗃️</button>}</div></Td>
                        </tr>)}</tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

function Stat({ icono, titulo, valor, color }: any) { return <div style={styles.statCard}><span style={{ ...styles.statIcon, boxShadow: `0 0 16px ${color}44` }}>{icono}</span><div><span style={styles.statTitle}>{titulo}</span><strong style={{ ...styles.statValue, color }}>{valor}</strong></div></div>; }
function Info({ label, value }: any) { return <div><span style={styles.infoLabel}>{label}</span><strong style={styles.infoValue}>{value}</strong></div>; }
function Th({ children }: any) { return <th style={styles.th}>{children}</th>; }
function Td({ children }: any) { return <td style={styles.td}>{children}</td>; }

const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', padding: 24, background: 'linear-gradient(135deg,#020617,#0f172a)', color: '#e5e7eb' }, topBar: { display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 17 }, backButton: { padding: '10px 14px', borderRadius: 11, border: '1px solid rgba(56,189,248,.35)', background: '#0f172a', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }, primaryButton: { padding: '11px 16px', border: 'none', borderRadius: 11, background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', cursor: 'pointer', fontWeight: 800, boxShadow: '0 9px 22px rgba(37,99,235,.28)' },
    header: { marginBottom: 24 }, eyebrow: { color: '#38bdf8', fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }, title: { margin: '6px 0 0', fontSize: 31, color: '#f8fafc' }, subtitle: { margin: '8px 0 0', color: '#94a3b8' }, errorBox: { display: 'flex', alignItems: 'center', gap: 10, padding: 14, marginBottom: 16, borderRadius: 12, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(127,29,29,.2)', color: '#fecaca' }, successBox: { padding: 14, marginBottom: 16, borderRadius: 12, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(20,83,45,.2)', color: '#bbf7d0' }, retryButton: { marginLeft: 'auto', padding: '7px 11px', borderRadius: 8, border: '1px solid rgba(248,113,113,.35)', background: 'transparent', color: '#fecaca', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13, marginBottom: 18 }, statCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)' }, statIcon: { display: 'grid', placeItems: 'center', width: 43, height: 43, borderRadius: 12, background: '#020617', fontSize: 20 }, statTitle: { display: 'block', color: '#94a3b8', fontSize: 12 }, statValue: { display: 'block', marginTop: 3, fontSize: 24 },
    filtersCard: { display: 'flex', gap: 10, alignItems: 'center', padding: 14, marginBottom: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(15,23,42,.92)', flexWrap: 'wrap' }, searchBox: { display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 280px', padding: '0 11px', borderRadius: 10, border: '1px solid rgba(148,163,184,.22)', background: '#020617' }, searchInput: { width: '100%', padding: '10px 0', border: 'none', outline: 'none', background: 'transparent', color: '#e5e7eb' }, select: { padding: '10px 11px', borderRadius: 10, border: '1px solid rgba(148,163,184,.22)', background: '#020617', color: '#e5e7eb' }, clearButton: { padding: '10px 11px', borderRadius: 9, border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.08)', color: '#fca5a5', cursor: 'pointer' }, viewButtons: { display: 'flex', gap: 4, marginLeft: 'auto' }, viewButton: { width: 38, height: 38, borderRadius: 9, border: '1px solid rgba(148,163,184,.2)', background: '#020617', color: '#64748b', cursor: 'pointer' }, viewActive: { color: '#38bdf8', borderColor: 'rgba(56,189,248,.4)', background: 'rgba(14,165,233,.12)' },
    loadingBox: { padding: 35, textAlign: 'center', color: '#94a3b8' }, emptyBox: { padding: 45, textAlign: 'center', borderRadius: 18, border: '1px dashed rgba(56,189,248,.25)', background: 'rgba(15,23,42,.7)' }, emptyIcon: { display: 'block', fontSize: 43 }, emptyTitle: { margin: '10px 0 0', color: '#f8fafc' }, emptyText: { margin: '7px 0 17px', color: '#94a3b8' },
    cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,310px),1fr))', gap: 16 }, projectCard: { padding: 18, borderRadius: 17, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(15,23,42,.92)', boxShadow: '0 14px 32px rgba(0,0,0,.22)' }, cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, code: { color: '#38bdf8', fontSize: 12, fontWeight: 900 }, badge: { padding: '5px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800 }, projectTitle: { margin: '13px 0 5px', fontSize: 18, color: '#f8fafc' }, clientName: { margin: '0 0 12px', color: '#94a3b8', fontSize: 13 }, tags: { display: 'flex', gap: 7, flexWrap: 'wrap' }, tag: { padding: '5px 8px', borderRadius: 8, background: '#020617', color: '#cbd5e1', fontSize: 10, fontWeight: 700 }, progressHeader: { display: 'flex', justifyContent: 'space-between', margin: '15px 0 6px', color: '#94a3b8', fontSize: 11 }, progressTrack: { height: 7, borderRadius: 999, overflow: 'hidden', background: '#020617' }, progressBar: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#0284c7,#22c55e)' }, infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(148,163,184,.12)' }, infoLabel: { display: 'block', color: '#64748b', fontSize: 10 }, infoValue: { display: 'block', marginTop: 3, color: '#cbd5e1', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }, pendingAlert: { marginTop: 13, padding: 8, borderRadius: 8, background: 'rgba(245,158,11,.1)', color: '#fbbf24', fontSize: 11 }, cardActions: { display: 'flex', gap: 8, marginTop: 15 }, openButton: { flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(56,189,248,.3)', background: 'rgba(14,165,233,.1)', color: '#38bdf8', cursor: 'pointer', fontWeight: 800 }, archiveButton: { width: 40, borderRadius: 10, border: '1px solid rgba(239,68,68,.18)', background: 'rgba(239,68,68,.06)', cursor: 'pointer' },
    tableWrap: { overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(148,163,184,.15)' }, table: { width: '100%', borderCollapse: 'collapse', background: 'rgba(15,23,42,.92)' }, th: { padding: '12px 14px', textAlign: 'left', background: '#020617', color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }, td: { padding: '13px 14px', borderTop: '1px solid rgba(148,163,184,.1)', color: '#cbd5e1', fontSize: 12, whiteSpace: 'nowrap' }, tableCode: { display: 'block', color: '#38bdf8', fontSize: 10 }, tableMain: { display: 'block', marginTop: 3, color: '#f8fafc' }, tableActions: { display: 'flex', gap: 6 }, smallOpenButton: { padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(56,189,248,.3)', background: 'rgba(14,165,233,.1)', color: '#38bdf8', cursor: 'pointer' }, smallArchiveButton: { padding: '7px 9px', borderRadius: 8, border: '1px solid rgba(239,68,68,.18)', background: 'rgba(239,68,68,.06)', cursor: 'pointer' },
};