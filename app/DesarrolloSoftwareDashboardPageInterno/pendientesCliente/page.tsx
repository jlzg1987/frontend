'use client';

import { API_BASE } from '@/src/lib/api';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

type Props = {
    onVolver: () => void;
    onAbrirSolicitud: (solicitudId: string) => void;
};

type Pendiente = {
    pendienteId: string;
    solicitudId: string;
    codigo: string;
    nombreProyecto: string;
    nombreCliente: string;
    emailCliente?: string | null;
    telefonoCliente?: string | null;
    responsable?: string | null;
    titulo: string;
    descripcion: string;
    tipo: string;
    prioridad: string;
    estado: string;
    fechaSolicitud?: string | null;
    fechaLimite?: string | null;
    fechaRespuesta?: string | null;
    respuestaCliente?: string | null;
};

const TIPOS = ['INFORMACION', 'ARCHIVO', 'APROBACION', 'PAGO', 'ACCESO', 'DECISION', 'OTRO'];

function textoEnum(valor?: string | null) {
    if (!valor) return 'Sin definir';
    return valor.toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function fecha(valor?: string | null, hora = false) {
    if (!valor) return 'Sin fecha';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit', month: 'short', year: 'numeric',
        ...(hora ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(d);
}

function diasHasta(valor?: string | null) {
    if (!valor) return null;
    const d = new Date(`${String(valor).slice(0, 10)}T23:59:59`);
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function colorEstado(estado?: string) {
    if (estado === 'RESUELTO') return '#22c55e';
    if (estado === 'RECIBIDO') return '#38bdf8';
    if (estado === 'CANCELADO') return '#64748b';
    return '#f59e0b';
}

function colorPrioridad(prioridad?: string) {
    if (prioridad === 'URGENTE') return '#ef4444';
    if (prioridad === 'ALTA') return '#f97316';
    if (prioridad === 'MEDIA') return '#f59e0b';
    return '#38bdf8';
}

function iconoTipo(tipo?: string) {
    return ({ INFORMACION: 'ℹ️', ARCHIVO: '📎', APROBACION: '✅', PAGO: '💵', ACCESO: '🔑', DECISION: '⚖️', OTRO: '📌' } as any)[tipo || ''] || '📌';
}

export default function PendientesClienteDesarrolloPageInterno({ onVolver, onAbrirSolicitud }: Props) {
    const [pendientes, setPendientes] = useState<Pendiente[]>([]);
    const [buscar, setBuscar] = useState('');
    const [estado, setEstado] = useState('PENDIENTE');
    const [tipo, setTipo] = useState('');
    const [soloVencidos, setSoloVencidos] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [procesandoId, setProcesandoId] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const cargar = useCallback(async () => {
        try {
            setCargando(true); setError('');
            const token = localStorage.getItem('isp_token');
            if (!token) throw new Error('No se encontró la sesión del usuario');

            const respuesta = await fetch(`${API_BASE}/desarrollo-software/pendientes-clientes`, {
                headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cargar los pendientes');
            setPendientes(data.pendientes || []);
        } catch (e: any) {
            console.error('Error cargando pendientes del cliente:', e);
            setError(e?.message || 'No fue posible cargar los pendientes');
            setPendientes([]);
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const resumen = useMemo(() => ({
        pendientes: pendientes.filter((p) => p.estado === 'PENDIENTE').length,
        vencidos: pendientes.filter((p) => p.estado === 'PENDIENTE' && (diasHasta(p.fechaLimite) ?? 0) < 0).length,
        recibidos: pendientes.filter((p) => p.estado === 'RECIBIDO').length,
        resueltos: pendientes.filter((p) => p.estado === 'RESUELTO').length,
    }), [pendientes]);

    const filtrados = useMemo(() => {
        const q = buscar.trim().toLowerCase();
        return pendientes.filter((p) => {
            const coincide = !q || [p.codigo, p.nombreProyecto, p.nombreCliente, p.titulo, p.descripcion, p.responsable]
                .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
            const vencido = (diasHasta(p.fechaLimite) ?? 0) < 0;
            return coincide && (!estado || p.estado === estado) && (!tipo || p.tipo === tipo) && (!soloVencidos || (p.estado === 'PENDIENTE' && vencido));
        });
    }, [buscar, estado, tipo, soloVencidos, pendientes]);

    async function marcarResuelto(pendiente: Pendiente) {
        if (!window.confirm(`¿Marcar como resuelto: ${pendiente.titulo}?`)) return;
        try {
            setProcesandoId(pendiente.pendienteId); setError(''); setMensaje('');
            const respuesta = await fetch(
                `${API_BASE}/desarrollo-software/solicitudes/${pendiente.solicitudId}/pendientes/${pendiente.pendienteId}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('isp_token')}` },
                    body: JSON.stringify({ estado: 'RESUELTO' }),
                }
            );
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible resolver el pendiente');
            setMensaje('Pendiente marcado como resuelto');
            await cargar();
        } catch (e: any) { setError(e?.message || 'No fue posible resolver el pendiente'); }
        finally { setProcesandoId(''); }
    }

    function abrirWhatsApp(p: Pendiente) {
        const numero = String(p.telefonoCliente || '').replace(/\D/g, '');
        if (!numero) return;
        const telefono = numero.startsWith('593') ? numero : numero.startsWith('0') ? `593${numero.slice(1)}` : `593${numero}`;
        const texto = `Hola ${p.nombreCliente}, te contactamos por el proyecto ${p.nombreProyecto} (${p.codigo}). Tenemos pendiente: ${p.titulo}. ${p.descripcion}`;
        window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
    }

    function limpiar() { setBuscar(''); setEstado('PENDIENTE'); setTipo(''); setSoloVencidos(false); }

    return (
        <main style={styles.page}>
            <div style={styles.topBar}>
                <button style={styles.backButton} onClick={onVolver}>← Volver</button>
                <button style={styles.refreshButton} onClick={cargar}>↻ Actualizar</button>
            </div>

            <header style={styles.header}>
                <span style={styles.eyebrow}>SEGUIMIENTO DEL CLIENTE</span>
                <h1 style={styles.title}>Pendientes del cliente</h1>
                <p style={styles.subtitle}>Controla la información, archivos, aprobaciones, accesos y pagos que cada cliente debe completar.</p>
            </header>

            {error && <div style={styles.errorBox}>⚠️ {error}<button style={styles.retryButton} onClick={cargar}>Reintentar</button></div>}
            {mensaje && <div style={styles.successBox}>✅ {mensaje}</div>}

            <section style={styles.statsGrid}>
                <Stat icono="⏳" titulo="Pendientes" valor={cargando ? '...' : resumen.pendientes} color="#f59e0b" onClick={() => { setEstado('PENDIENTE'); setSoloVencidos(false); }} />
                <Stat icono="🚨" titulo="Vencidos" valor={cargando ? '...' : resumen.vencidos} color="#ef4444" onClick={() => { setEstado('PENDIENTE'); setSoloVencidos(true); }} />
                <Stat icono="📨" titulo="Respuesta recibida" valor={cargando ? '...' : resumen.recibidos} color="#38bdf8" onClick={() => { setEstado('RECIBIDO'); setSoloVencidos(false); }} />
                <Stat icono="✅" titulo="Resueltos" valor={cargando ? '...' : resumen.resueltos} color="#22c55e" onClick={() => { setEstado('RESUELTO'); setSoloVencidos(false); }} />
            </section>

            <section style={styles.filters}>
                <div style={styles.searchBox}><span>🔎</span><input style={styles.searchInput} value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar cliente, proyecto o pendiente..." /></div>
                <select style={styles.select} value={estado} onChange={(e) => { setEstado(e.target.value); setSoloVencidos(false); }}>
                    <option value="">Todos los estados</option>
                    {['PENDIENTE', 'RECIBIDO', 'RESUELTO', 'CANCELADO'].map((v) => <option key={v} value={v}>{textoEnum(v)}</option>)}
                </select>
                <select style={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="">Todos los tipos</option>
                    {TIPOS.map((v) => <option key={v} value={v}>{textoEnum(v)}</option>)}
                </select>
                <label style={styles.checkLabel}><input type="checkbox" checked={soloVencidos} onChange={(e) => { setSoloVencidos(e.target.checked); if (e.target.checked) setEstado('PENDIENTE'); }} /> Solo vencidos</label>
                {(buscar || estado !== 'PENDIENTE' || tipo || soloVencidos) && <button style={styles.clearButton} onClick={limpiar}>Limpiar</button>}
            </section>

            {cargando && <div style={styles.loading}>Cargando pendientes...</div>}

            {!cargando && filtrados.length === 0 && (
                <div style={styles.empty}>
                    <span style={styles.emptyIcon}>✅</span>
                    <h2 style={styles.emptyTitle}>No hay pendientes en esta vista</h2>
                    <p style={styles.emptyText}>Los proyectos están al día o no coinciden con los filtros seleccionados.</p>
                </div>
            )}

            {!cargando && filtrados.length > 0 && (
                <section style={styles.list}>
                    {filtrados.map((p) => {
                        const dias = diasHasta(p.fechaLimite);
                        const vencido = p.estado === 'PENDIENTE' && dias !== null && dias < 0;
                        const proximo = p.estado === 'PENDIENTE' && dias !== null && dias >= 0 && dias <= 5;
                        return (
                            <article key={p.pendienteId} style={{ ...styles.card, borderLeftColor: vencido ? '#ef4444' : colorEstado(p.estado) }}>
                                <div style={styles.typeIcon}>{iconoTipo(p.tipo)}</div>
                                <div style={styles.cardMain}>
                                    <div style={styles.cardTop}>
                                        <div style={styles.tags}>
                                            <span style={styles.code}>{p.codigo}</span>
                                            <span style={{ ...styles.badge, color: colorEstado(p.estado), background: `${colorEstado(p.estado)}18` }}>{textoEnum(p.estado)}</span>
                                            <span style={{ ...styles.badge, color: colorPrioridad(p.prioridad), background: `${colorPrioridad(p.prioridad)}18` }}>{textoEnum(p.prioridad)}</span>
                                        </div>
                                        <span style={styles.type}>{textoEnum(p.tipo)}</span>
                                    </div>
                                    <h2 style={styles.cardTitle}>{p.titulo}</h2>
                                    <p style={styles.description}>{p.descripcion}</p>
                                    <div style={styles.projectBox}>
                                        <div><span style={styles.infoLabel}>Proyecto</span><strong style={styles.infoValue}>{p.nombreProyecto}</strong></div>
                                        <div><span style={styles.infoLabel}>Cliente</span><strong style={styles.infoValue}>{p.nombreCliente}</strong></div>
                                        <div><span style={styles.infoLabel}>Responsable</span><strong style={styles.infoValue}>{p.responsable || 'Sin asignar'}</strong></div>
                                        <div><span style={styles.infoLabel}>Fecha límite</span><strong style={{ ...styles.infoValue, color: vencido ? '#f87171' : proximo ? '#fb923c' : '#cbd5e1' }}>{fecha(p.fechaLimite)}</strong></div>
                                    </div>
                                    {vencido && <div style={styles.overdue}>🚨 Vencido hace {Math.abs(dias!)} día(s)</div>}
                                    {!vencido && proximo && <div style={styles.upcoming}>📅 Vence en {dias} día(s)</div>}
                                    {p.respuestaCliente && <div style={styles.response}><strong>Respuesta del cliente:</strong><p>{p.respuestaCliente}</p><span>{fecha(p.fechaRespuesta, true)}</span></div>}
                                    <div style={styles.actions}>
                                        <button style={styles.openButton} onClick={() => onAbrirSolicitud(p.solicitudId)}>Ver proyecto →</button>
                                        {p.telefonoCliente && p.estado === 'PENDIENTE' && <button style={styles.whatsappButton} onClick={() => abrirWhatsApp(p)}>WhatsApp</button>}
                                        {['PENDIENTE', 'RECIBIDO'].includes(p.estado) && <button style={styles.resolveButton} disabled={procesandoId === p.pendienteId} onClick={() => marcarResuelto(p)}>{procesandoId === p.pendienteId ? 'Guardando...' : '✓ Marcar resuelto'}</button>}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

function Stat({ icono, titulo, valor, color, onClick }: any) {
    return <button style={styles.statCard} onClick={onClick}><span style={{ ...styles.statIcon, boxShadow: `0 0 16px ${color}44` }}>{icono}</span><span><span style={styles.statTitle}>{titulo}</span><strong style={{ ...styles.statValue, color }}>{valor}</strong></span></button>;
}

const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', padding: 24, background: 'linear-gradient(135deg,#020617,#0f172a)', color: '#e5e7eb' }, topBar: { display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 18 }, backButton: { padding: '10px 14px', borderRadius: 11, border: '1px solid rgba(56,189,248,.35)', background: '#0f172a', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }, refreshButton: { padding: '10px 14px', borderRadius: 11, border: '1px solid rgba(148,163,184,.22)', background: '#0f172a', color: '#cbd5e1', cursor: 'pointer' },
    header: { marginBottom: 24 }, eyebrow: { color: '#38bdf8', fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }, title: { margin: '6px 0 0', fontSize: 31, color: '#f8fafc' }, subtitle: { margin: '8px 0 0', color: '#94a3b8' }, errorBox: { display: 'flex', alignItems: 'center', gap: 10, padding: 14, marginBottom: 16, borderRadius: 12, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(127,29,29,.2)', color: '#fecaca' }, successBox: { padding: 14, marginBottom: 16, borderRadius: 12, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(20,83,45,.2)', color: '#bbf7d0' }, retryButton: { marginLeft: 'auto', padding: '7px 11px', borderRadius: 8, border: '1px solid rgba(248,113,113,.35)', background: 'transparent', color: '#fecaca', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13, marginBottom: 18 }, statCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, textAlign: 'left', borderRadius: 16, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)', cursor: 'pointer' }, statIcon: { display: 'grid', placeItems: 'center', width: 43, height: 43, borderRadius: 12, background: '#020617', fontSize: 20 }, statTitle: { display: 'block', color: '#94a3b8', fontSize: 12 }, statValue: { display: 'block', marginTop: 3, fontSize: 24 },
    filters: { display: 'flex', gap: 10, alignItems: 'center', padding: 14, marginBottom: 20, borderRadius: 16, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(15,23,42,.92)', flexWrap: 'wrap' }, searchBox: { display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 300px', padding: '0 11px', borderRadius: 10, border: '1px solid rgba(148,163,184,.22)', background: '#020617' }, searchInput: { width: '100%', padding: '10px 0', border: 'none', outline: 'none', background: 'transparent', color: '#e5e7eb' }, select: { padding: '10px 11px', borderRadius: 10, border: '1px solid rgba(148,163,184,.22)', background: '#020617', color: '#e5e7eb' }, checkLabel: { display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 12 }, clearButton: { padding: '10px 11px', borderRadius: 9, border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.08)', color: '#fca5a5', cursor: 'pointer' },
    loading: { padding: 40, textAlign: 'center', color: '#94a3b8' }, empty: { padding: 45, textAlign: 'center', borderRadius: 18, border: '1px dashed rgba(56,189,248,.25)', background: 'rgba(15,23,42,.7)' }, emptyIcon: { display: 'block', fontSize: 43 }, emptyTitle: { margin: '10px 0 0', color: '#f8fafc' }, emptyText: { margin: '7px 0 0', color: '#94a3b8' }, list: { display: 'grid', gap: 13 },
    card: { display: 'flex', gap: 14, padding: 17, borderRadius: 16, border: '1px solid rgba(148,163,184,.15)', borderLeft: '4px solid', background: 'rgba(15,23,42,.92)', boxShadow: '0 12px 28px rgba(0,0,0,.18)' }, typeIcon: { display: 'grid', placeItems: 'center', width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: '#020617', fontSize: 21 }, cardMain: { flex: 1, minWidth: 0 }, cardTop: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }, tags: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }, code: { color: '#38bdf8', fontSize: 10, fontWeight: 900 }, badge: { padding: '4px 7px', borderRadius: 999, fontSize: 9, fontWeight: 900 }, type: { color: '#64748b', fontSize: 10, fontWeight: 700 }, cardTitle: { margin: '10px 0 4px', fontSize: 17, color: '#f8fafc' }, description: { margin: '0 0 13px', color: '#94a3b8', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }, projectBox: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, padding: 12, borderRadius: 11, background: '#020617' }, infoLabel: { display: 'block', color: '#64748b', fontSize: 9 }, infoValue: { display: 'block', marginTop: 3, color: '#cbd5e1', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }, overdue: { marginTop: 9, padding: 8, borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#f87171', fontSize: 10 }, upcoming: { marginTop: 9, padding: 8, borderRadius: 8, background: 'rgba(249,115,22,.1)', color: '#fb923c', fontSize: 10 }, response: { marginTop: 10, padding: 11, borderRadius: 9, border: '1px solid rgba(56,189,248,.18)', background: 'rgba(14,165,233,.07)', color: '#cbd5e1', fontSize: 11 }, actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, flexWrap: 'wrap' }, openButton: { padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(56,189,248,.28)', background: 'rgba(14,165,233,.09)', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }, whatsappButton: { padding: '9px 12px', borderRadius: 9, border: '1px solid rgba(34,197,94,.28)', background: 'rgba(34,197,94,.09)', color: '#4ade80', cursor: 'pointer', fontWeight: 700 }, resolveButton: { padding: '9px 12px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#16a34a,#059669)', color: '#fff', cursor: 'pointer', fontWeight: 800 },
};