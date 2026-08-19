'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import {
    ArrowRight,
    BadgeCheck,
    Blocks,
    ClipboardList,
    Code2,
    Eye,
    FileText,
    Flag,
    Hourglass,
    Mail,
    Plus,
    Rocket,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';

type Props = {
    onVolver: () => void;
    onAbrirSolicitudes: () => void;
    onCrearSolicitud: () => void;
    onAbrirDesarrollos: () => void;
    onAbrirPendientesCliente: () => void;
    onAbrirResponsables: () => void;
    onAbrirEntregados: () => void;
    onAbrirProyecto?: (proyectoId: string) => void;
};

type ProyectoReciente = {
    id: string;
    codigo: string;
    nombre: string;
    cliente: string;
    tipo: string;
    etapa: string;
    progreso: number;
    responsable: string;
    ultimaActualizacion: string;
    estadoCliente: 'AL_DIA' | 'PENDIENTE_CLIENTE' | 'EN_REVISION';
};

type ResumenDashboard = {
    solicitudes: number;
    activos: number;
    esperandoCliente: number;
    enRevision: number;
    proximosEntrega: number;
    entregados: number;
};

const RESUMEN_INICIAL: ResumenDashboard = {
    solicitudes: 0,
    activos: 0,
    esperandoCliente: 0,
    enRevision: 0,
    proximosEntrega: 0,
    entregados: 0,
};

function textoEnum(valor?: string | null) {
    if (!valor) return 'Sin definir';

    return valor
        .toLowerCase()
        .split('_')
        .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
}

function formatearFecha(valor?: string | null) {
    if (!valor) return 'Sin actualización';

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return 'Sin actualización';

    return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(fecha);
}

export default function DesarrolloSoftwareDashboardPageInterno({
    onVolver,
    onAbrirSolicitudes,
    onCrearSolicitud,
    onAbrirDesarrollos,
    onAbrirPendientesCliente,
    onAbrirResponsables,
    onAbrirEntregados,
    onAbrirProyecto,
}: Props) {
    const [resumen, setResumen] = useState<ResumenDashboard>(RESUMEN_INICIAL);
    const [proyectosRecientes, setProyectosRecientes] = useState<ProyectoReciente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarDashboard = useCallback(async () => {
        try {
            setCargando(true);
            setError('');

            const token = getToken();

            if (!token) {
                throw new Error('No se encontró la sesión del usuario');
            }

            const respuesta = await fetch(`${API_BASE}/desarrollo-software/dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: 'no-store',
            });

            const data = await respuesta.json();

            if (!respuesta.ok || data.ok === false) {
                throw new Error(data.mensaje || 'No fue posible cargar el dashboard');
            }

            const datosResumen = data.resumen || {};

            setResumen({
                solicitudes: Number(datosResumen.solicitudes || 0),
                activos: Number(datosResumen.activos || 0),
                esperandoCliente: Number(datosResumen.esperandoCliente || 0),
                enRevision: Number(datosResumen.enRevision || 0),
                proximosEntrega: Number(datosResumen.proximosEntrega || 0),
                entregados: Number(datosResumen.entregados || 0),
            });

            setProyectosRecientes(
                (data.recientes || []).map((proyecto: any) => ({
                    id: String(proyecto.solicitudId),
                    codigo: proyecto.codigo || 'SIN-CÓDIGO',
                    nombre: proyecto.nombreProyecto || 'Proyecto sin nombre',
                    cliente: proyecto.nombreCliente || 'Cliente sin identificar',
                    tipo: textoEnum(proyecto.tipoDesarrollo),
                    etapa: textoEnum(proyecto.etapaActual),
                    progreso: Number(proyecto.porcentajeAvance || 0),
                    responsable: proyecto.responsable || 'Sin asignar',
                    ultimaActualizacion: formatearFecha(proyecto.updatedAt),
                    estadoCliente:
                        Number(proyecto.pendientesCliente || 0) > 0
                            ? 'PENDIENTE_CLIENTE'
                            : proyecto.etapaActual === 'REVISION_CLIENTE'
                                ? 'EN_REVISION'
                                : 'AL_DIA',
                }))
            );
        } catch (e: any) {
            console.error('Error cargando dashboard de desarrollo:', e);
            setError(e?.message || 'No fue posible cargar la información');
            setResumen(RESUMEN_INICIAL);
            setProyectosRecientes([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarDashboard();
    }, [cargarDashboard]);

    const stats = [
        { titulo: 'Solicitudes registradas', valor: cargando ? '...' : resumen.solicitudes, icono: FileText, color: '#38bdf8' },
        { titulo: 'Desarrollos activos', valor: cargando ? '...' : resumen.activos, icono: Code2, color: '#22c55e' },
        { titulo: 'Esperando al cliente', valor: cargando ? '...' : resumen.esperandoCliente, icono: Hourglass, color: '#f59e0b' },
        { titulo: 'En revisión del cliente', valor: cargando ? '...' : resumen.enRevision, icono: Eye, color: '#a855f7' },
        { titulo: 'Próximos a entregar', valor: cargando ? '...' : resumen.proximosEntrega, icono: Rocket, color: '#f97316' },
        { titulo: 'Proyectos entregados', valor: cargando ? '...' : resumen.entregados, icono: BadgeCheck, color: '#14b8a6' },
    ];

    const accesos = [
        {
            titulo: 'Solicitudes de desarrollo',
            descripcion: 'Consultar y administrar todas las solicitudes de los clientes',
            icono: ClipboardList,
            color: '#38bdf8',
            accion: onAbrirSolicitudes,
        },
        {
            titulo: 'Nueva solicitud',
            descripcion: 'Registrar una página web, aplicación, sistema u otro desarrollo',
            icono: Plus,
            color: '#22c55e',
            accion: onCrearSolicitud,
        },
        {
            titulo: 'Desarrollos en proceso',
            descripcion: 'Revisar etapas, avances y fechas estimadas de entrega',
            icono: Blocks,
            color: '#a855f7',
            accion: onAbrirDesarrollos,
        },
        {
            titulo: 'Pendientes del cliente',
            descripcion: 'Controlar información, archivos y aprobaciones solicitadas',
            icono: Mail,
            color: '#f59e0b',
            accion: onAbrirPendientesCliente,
        },
        {
            titulo: 'Responsables y equipos',
            descripcion: 'Administrar personas o grupos asignados a cada desarrollo',
            icono: Users,
            color: '#06b6d4',
            accion: onAbrirResponsables,
        },
        {
            titulo: 'Proyectos entregados',
            descripcion: 'Consultar el historial de aplicaciones y sistemas finalizados',
            icono: Flag,
            color: '#14b8a6',
            accion: onAbrirEntregados,
        },
    ];

    function obtenerEstadoCliente(estado: ProyectoReciente['estadoCliente']) {
        if (estado === 'PENDIENTE_CLIENTE') {
            return { texto: 'Pendiente del cliente', color: '#f59e0b', fondo: 'rgba(245,158,11,0.12)' };
        }

        if (estado === 'EN_REVISION') {
            return { texto: 'En revisión', color: '#c084fc', fondo: 'rgba(168,85,247,0.12)' };
        }

        return { texto: 'Al día', color: '#4ade80', fondo: 'rgba(34,197,94,0.12)' };
    }

    return (
        <main style={styles.page}>


            <header style={styles.header}>
                <button type="button" style={styles.primaryButton} onClick={onCrearSolicitud}>
                    <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
                    Nueva solicitud
                </button>
            </header>

            {error && (
                <div style={styles.errorBox}>
                    <div>
                        <strong>No se pudo cargar el dashboard</strong>
                        <p style={styles.errorText}>{error}</p>
                    </div>
                    <button type="button" style={styles.retryButton} onClick={cargarDashboard}>
                        Reintentar
                    </button>
                </div>
            )}

            <section style={styles.statsGrid}>
                {stats.map((item) => {
                    const Icono = item.icono;

                    return (
                        <div key={item.titulo} style={styles.statCard}>
                            <div style={{ ...styles.iconBox, color: item.color, boxShadow: `0 0 18px ${item.color}45` }}>
                                <Icono size={22} strokeWidth={2.2} aria-hidden="true" />
                            </div>

                            <div>
                                <p style={styles.statTitle}>{item.titulo}</p>
                                <h2 style={{ ...styles.statValue, color: item.color }}>{item.valor}</h2>
                            </div>
                        </div>
                    );
                })}
            </section>

            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Accesos rápidos</h2>

                <div style={styles.accessGrid}>
                    {accesos.map((item) => {
                        const Icono = item.icono;

                        return (
                            <button key={item.titulo} type="button" style={styles.accessCard} onClick={item.accion}>
                                <div style={{ ...styles.accessIcon, color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                                    <Icono size={27} strokeWidth={2.2} aria-hidden="true" />
                                </div>
                                <h3 style={styles.accessTitle}>{item.titulo}</h3>
                                <p style={styles.accessDescription}>{item.descripcion}</p>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section style={styles.projectsSection}>
                <div style={styles.sectionHeader}>
                    <div>
                        <h2 style={{ ...styles.sectionTitle, marginBottom: 4 }}>Desarrollos recientes</h2>
                        <p style={styles.sectionSubtitle}>Últimos proyectos registrados o actualizados</p>
                    </div>

                    <button type="button" style={styles.secondaryButton} onClick={onAbrirDesarrollos}>
                        Ver todos
                    </button>
                </div>

                {!cargando && !error && proyectosRecientes.length === 0 && (
                    <div style={styles.emptyBox}>
                        <div style={styles.emptyIcon}>
                            <Blocks size={34} strokeWidth={2} aria-hidden="true" />
                        </div>
                        <h3 style={styles.emptyTitle}>Todavía no hay desarrollos registrados</h3>
                        <p style={styles.emptyText}>Crea la primera solicitud para comenzar su seguimiento.</p>
                        <button type="button" style={styles.primaryButton} onClick={onCrearSolicitud}>
                            <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
                            Crear primera solicitud
                        </button>
                    </div>
                )}

                <div style={styles.projectsGrid}>
                    {proyectosRecientes.map((proyecto) => {
                        const estado = obtenerEstadoCliente(proyecto.estadoCliente);

                        return (
                            <article key={proyecto.id} style={styles.projectCard}>
                                <div style={styles.projectTop}>
                                    <span style={styles.projectCode}>{proyecto.codigo}</span>
                                    <span style={{ ...styles.statusBadge, color: estado.color, background: estado.fondo }}>
                                        {estado.texto}
                                    </span>
                                </div>

                                <h3 style={styles.projectTitle}>{proyecto.nombre}</h3>
                                <p style={styles.clientName}>{proyecto.cliente}</p>

                                <div style={styles.projectDetails}>
                                    <div>
                                        <span style={styles.detailLabel}>Tipo</span>
                                        <strong style={styles.detailValue}>{proyecto.tipo}</strong>
                                    </div>
                                    <div>
                                        <span style={styles.detailLabel}>Etapa actual</span>
                                        <strong style={styles.detailValue}>{proyecto.etapa}</strong>
                                    </div>
                                </div>

                                <div style={styles.progressHeader}>
                                    <span style={styles.detailLabel}>Avance del proyecto</span>
                                    <strong style={styles.progressValue}>{proyecto.progreso}%</strong>
                                </div>
                                <div style={styles.progressTrack}>
                                    <div style={{ ...styles.progressBar, width: `${proyecto.progreso}%` }} />
                                </div>

                                <div style={styles.responsibleBox}>
                                    <div>
                                        <span style={styles.detailLabel}>Responsable</span>
                                        <strong style={styles.detailValue}>{proyecto.responsable}</strong>
                                    </div>
                                    <div style={styles.updateBox}>
                                        <span style={styles.detailLabel}>Actualizado</span>
                                        <span style={styles.updateValue}>{proyecto.ultimaActualizacion}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    style={styles.openProjectButton}
                                    onClick={() => onAbrirProyecto?.(proyecto.id)}
                                >
                                    Ver seguimiento
                                    <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
                                </button>
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

const styles: Record<string, CSSProperties> = {
    page: {
        minHeight: '100vh',
        padding: 24,
        background: 'linear-gradient(135deg, #020617, #0f172a)',
        color: '#e5e7eb',
    },
    topActions: {
        width: '100%',
        marginBottom: 14,
    },
    backButton: {
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(56,189,248,0.35)',
        color: '#38bdf8',
        padding: '10px 14px',
        borderRadius: 12,
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 14,
        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 20,
        alignItems: 'center',
        marginBottom: 28,
        flexWrap: 'wrap',
    },
    title: {
        fontSize: 32,
        fontWeight: 800,
        margin: 0,
        color: '#f8fafc',
    },
    subtitle: {
        marginTop: 8,
        marginBottom: 0,
        color: '#94a3b8',
        fontSize: 15,
    },
    primaryButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
        color: '#fff',
        border: 'none',
        padding: '12px 18px',
        borderRadius: 12,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(37,99,235,0.35)',
    },
    errorBox: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        padding: 16,
        borderRadius: 14,
        border: '1px solid rgba(239,68,68,0.35)',
        background: 'rgba(127,29,29,0.18)',
        color: '#fecaca',
        flexWrap: 'wrap',
    },
    errorText: {
        margin: '5px 0 0',
        color: '#fca5a5',
        fontSize: 13,
    },
    retryButton: {
        padding: '9px 14px',
        borderRadius: 10,
        border: '1px solid rgba(248,113,113,0.4)',
        background: 'rgba(239,68,68,0.15)',
        color: '#fecaca',
        cursor: 'pointer',
        fontWeight: 700,
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6, minmax(145px, 1fr))',
        gap: 10,
        marginBottom: 32,
        overflowX: 'auto',
        paddingBottom: 4,
    },
    statCard: {
        background: 'rgba(15,23,42,0.9)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: 16,
        padding: 13,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
        minWidth: 0,
    },
    iconBox: {
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: 12,
        background: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statTitle: {
        margin: 0,
        color: '#94a3b8',
        fontSize: 12,
        lineHeight: 1.25,
    },
    statValue: {
        margin: '4px 0 0',
        fontSize: 24,
        fontWeight: 800,
    },
    section: {
        marginTop: 10,
    },
    sectionTitle: {
        marginTop: 0,
        marginBottom: 18,
        fontSize: 22,
        color: '#f8fafc',
    },
    sectionSubtitle: {
        margin: 0,
        color: '#64748b',
        fontSize: 14,
    },
    accessGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
    },
    accessCard: {
        textAlign: 'left',
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(56,189,248,0.22)',
        borderRadius: 18,
        padding: 22,
        color: '#e5e7eb',
        cursor: 'pointer',
        transition: '0.2s',
        boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
    },
    accessIcon: {
        width: 50,
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        marginBottom: 14,
    },
    accessTitle: {
        margin: 0,
        fontSize: 18,
        color: '#f8fafc',
    },
    accessDescription: {
        margin: '8px 0 0',
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 1.5,
    },
    projectsSection: {
        marginTop: 38,
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        marginBottom: 18,
        flexWrap: 'wrap',
    },
    secondaryButton: {
        background: 'rgba(14,165,233,0.1)',
        border: '1px solid rgba(56,189,248,0.3)',
        color: '#38bdf8',
        padding: '9px 14px',
        borderRadius: 10,
        cursor: 'pointer',
        fontWeight: 700,
    },
    projectsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: 18,
    },
    emptyBox: {
        padding: 32,
        borderRadius: 18,
        border: '1px dashed rgba(56,189,248,0.3)',
        background: 'rgba(15,23,42,0.75)',
        textAlign: 'center',
    },
    emptyIcon: {
        width: 58,
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
        borderRadius: 18,
        color: '#a855f7',
        background: 'rgba(168,85,247,0.12)',
        border: '1px solid rgba(168,85,247,0.22)',
    },
    emptyTitle: {
        margin: 0,
        color: '#f8fafc',
        fontSize: 18,
    },
    emptyText: {
        margin: '8px 0 18px',
        color: '#94a3b8',
        fontSize: 14,
    },
    projectCard: {
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(148,163,184,0.16)',
        borderRadius: 18,
        padding: 20,
        boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
    },
    projectTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    projectCode: {
        color: '#38bdf8',
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 0.5,
    },
    statusBadge: {
        display: 'inline-flex',
        padding: '6px 9px',
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 11,
        whiteSpace: 'nowrap',
    },
    projectTitle: {
        margin: 0,
        color: '#f8fafc',
        fontSize: 19,
    },
    clientName: {
        margin: '7px 0 18px',
        color: '#94a3b8',
        fontSize: 14,
    },
    projectDetails: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 14,
        padding: '14px 0',
        borderTop: '1px solid rgba(148,163,184,0.12)',
        borderBottom: '1px solid rgba(148,163,184,0.12)',
    },
    detailLabel: {
        display: 'block',
        color: '#64748b',
        fontSize: 11,
        marginBottom: 5,
    },
    detailValue: {
        display: 'block',
        color: '#cbd5e1',
        fontSize: 13,
    },
    progressHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    progressValue: {
        color: '#38bdf8',
        fontSize: 13,
    },
    progressTrack: {
        height: 8,
        overflow: 'hidden',
        borderRadius: 999,
        background: '#020617',
    },
    progressBar: {
        height: '100%',
        borderRadius: 999,
        background: 'linear-gradient(90deg, #0284c7, #22c55e)',
    },
    responsibleBox: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 15,
        marginTop: 17,
    },
    updateBox: {
        textAlign: 'right',
    },
    updateValue: {
        color: '#94a3b8',
        fontSize: 12,
    },
    openProjectButton: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        marginTop: 18,
        padding: '10px 14px',
        borderRadius: 11,
        border: '1px solid rgba(56,189,248,0.3)',
        background: 'rgba(14,165,233,0.08)',
        color: '#38bdf8',
        fontWeight: 800,
        cursor: 'pointer',
    },
};