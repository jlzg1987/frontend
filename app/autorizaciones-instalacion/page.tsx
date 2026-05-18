'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '@/src/lib/api';

type Autorizacion = {
    autorizacionId: string;
    servicioId: string;
    clienteId: string;
    cedula: string;
    telefono: string;
    nombres: string;
    apellidos: string;
    fechaGeneracion: string;
    codigoAutorizacion: string;
    estadoServicio?: string;
    fechaInstalacion?: string;
    nombrePlan?: string;
    tipoServicio?: string;
    precioMensual?: number;
};

export default function AutorizacionesInstalacionPage() {
    const [autorizaciones, setAutorizaciones] = useState<Autorizacion[]>([]);
    const [loading, setLoading] = useState(false);

    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [buscar, setBuscar] = useState('');

    const cargarAutorizaciones = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);
            if (buscar.trim()) params.append('buscar', buscar.trim());

            const res = await fetch(
                `${API_BASE}/cliente-servicio/autorizaciones-instalacion/historial?${params.toString()}`
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo cargar el historial');
                return;
            }

            setAutorizaciones(data.autorizaciones || []);

        } catch (error) {
            console.error('Error cargando autorizaciones:', error);
            alert('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarAutorizaciones();
    }, []);

    const formatearFecha = (fecha?: string) => {
        if (!fecha) return 'No definido';

        return new Date(fecha).toLocaleString('es-EC', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const reimprimirAutorizacion = (servicioId: string) => {
        window.open(
            `${API_BASE}/cliente-servicio/${servicioId}/autorizacion-instalacion-pdf`,
            '_blank'
        );
    };

    const limpiarFiltros = () => {
        setDesde('');
        setHasta('');
        setBuscar('');

        setTimeout(() => {
            cargarAutorizaciones();
        }, 100);
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Autorizaciones de Instalación</h1>
                    <p style={styles.subtitle}>
                        Historial, búsqueda y reimpresión de autorizaciones PDF.
                    </p>
                </div>
            </header>

            <section style={styles.filters}>
                <div style={styles.field}>
                    <label style={styles.label}>Desde</label>
                    <input
                        type="date"
                        value={desde}
                        onChange={(e) => setDesde(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>Hasta</label>
                    <input
                        type="date"
                        value={hasta}
                        onChange={(e) => setHasta(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <div style={styles.fieldLarge}>
                    <label style={styles.label}>Buscar</label>
                    <input
                        type="text"
                        placeholder="Cédula, cliente, teléfono o código..."
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <button style={styles.primaryButton} onClick={cargarAutorizaciones}>
                    Buscar
                </button>

                <button style={styles.secondaryButton} onClick={limpiarFiltros}>
                    Limpiar
                </button>
            </section>

            <section style={styles.summary}>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryNumber}>{autorizaciones.length}</span>
                    <span style={styles.summaryText}>Autorizaciones encontradas</span>
                </div>
            </section>

            {loading ? (
                <p style={styles.loading}>Cargando autorizaciones...</p>
            ) : (
                <div style={styles.grid}>
                    {autorizaciones.map((a) => (
                        <div key={a.autorizacionId} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div>
                                    <h3 style={styles.clientName}>
                                        {a.nombres} {a.apellidos}
                                    </h3>

                                    <p style={styles.code}>
                                        {a.codigoAutorizacion}
                                    </p>
                                </div>

                                <span style={styles.badge}>
                                    {a.tipoServicio || 'ISP'}
                                </span>
                            </div>

                            <div style={styles.infoBox}>
                                <p><strong>Cédula/RUC:</strong> {a.cedula || 'N/A'}</p>
                                <p><strong>Teléfono:</strong> {a.telefono || 'N/A'}</p>
                                <p><strong>Plan:</strong> {a.nombrePlan || 'N/A'}</p>
                                <p><strong>Precio:</strong> ${Number(a.precioMensual || 0).toFixed(2)}</p>
                                <p><strong>Estado servicio:</strong> {a.estadoServicio || 'N/A'}</p>
                            </div>

                            <div style={styles.dateBox}>
                                <p><strong>Autorización generada:</strong> {formatearFecha(a.fechaGeneracion)}</p>
                                <p><strong>Fecha instalación:</strong> {formatearFecha(a.fechaInstalacion)}</p>
                            </div>

                            <div style={styles.actions}>
                                <button
                                    style={styles.printButton}
                                    onClick={() => reimprimirAutorizacion(a.servicioId)}
                                >
                                    Reimprimir autorización
                                </button>
                            </div>
                        </div>
                    ))}

                    {autorizaciones.length === 0 && (
                        <div style={styles.empty}>
                            No hay autorizaciones generadas con esos filtros.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: '#020617',
        color: '#E5E7EB',
        padding: '28px',
    },
    header: {
        background: 'linear-gradient(135deg, #0F172A, #EA580C)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '22px',
        boxShadow: '0 20px 50px rgba(234, 88, 12, 0.25)',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        fontWeight: 900,
        color: '#FFFFFF',
    },
    subtitle: {
        marginTop: '6px',
        color: '#FED7AA',
    },
    filters: {
        display: 'flex',
        gap: '14px',
        alignItems: 'end',
        flexWrap: 'wrap',
        background: '#0F172A',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        padding: '18px',
        borderRadius: '16px',
        marginBottom: '18px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '160px',
    },
    fieldLarge: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: '280px',
        flex: 1,
    },
    label: {
        fontSize: '13px',
        color: '#CBD5E1',
        fontWeight: 700,
    },
    input: {
        background: '#020617',
        border: '1px solid #334155',
        color: '#FFFFFF',
        borderRadius: '10px',
        padding: '11px 12px',
        outline: 'none',
        colorScheme: 'dark',
    },
    primaryButton: {
        background: '#EA580C',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        padding: '12px 18px',
        cursor: 'pointer',
        fontWeight: 800,
    },
    secondaryButton: {
        background: '#334155',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        padding: '12px 18px',
        cursor: 'pointer',
        fontWeight: 800,
    },
    summary: {
        marginBottom: '18px',
    },
    summaryCard: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        background: '#0F172A',
        border: '1px solid rgba(234, 88, 12, 0.35)',
        borderRadius: '14px',
        padding: '14px 18px',
    },
    summaryNumber: {
        fontSize: '26px',
        fontWeight: 900,
        color: '#FB923C',
    },
    summaryText: {
        color: '#CBD5E1',
        fontWeight: 700,
    },
    loading: {
        color: '#CBD5E1',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
        gap: '18px',
    },
    card: {
        background: '#0F172A',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '18px',
        padding: '18px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
    },
    cardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '14px',
    },
    clientName: {
        margin: 0,
        color: '#FFFFFF',
        fontSize: '18px',
    },
    code: {
        marginTop: '5px',
        color: '#94A3B8',
        fontSize: '12px',
        wordBreak: 'break-all',
    },
    badge: {
        height: 'fit-content',
        background: '#EA580C',
        color: '#FFFFFF',
        padding: '6px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 800,
    },
    infoBox: {
        background: '#020617',
        borderRadius: '12px',
        padding: '12px',
        fontSize: '13px',
        lineHeight: 1.5,
        marginBottom: '12px',
    },
    dateBox: {
        background: 'rgba(234, 88, 12, 0.12)',
        border: '1px solid rgba(234, 88, 12, 0.25)',
        borderRadius: '12px',
        padding: '12px',
        fontSize: '13px',
        lineHeight: 1.5,
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '14px',
    },
    printButton: {
        background: '#16A34A',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        padding: '11px 16px',
        cursor: 'pointer',
        fontWeight: 800,
    },
    empty: {
        gridColumn: '1 / -1',
        textAlign: 'center',
        background: '#0F172A',
        border: '1px dashed #334155',
        borderRadius: '16px',
        padding: '30px',
        color: '#94A3B8',
    },
};