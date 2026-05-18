'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '@/src/lib/api';

type FichaTecnica = {
    fichaId: string;
    servicioId: string;
    clienteId: string;
    cedula: string;
    telefono: string;
    nombres: string;
    apellidos: string;
    codigoFicha: string;
    fechaGeneracion: string;
    estadoServicio?: string;
    fechaInstalacion?: string;
    nombrePlan?: string;
    tipoServicio?: string;
    precioMensual?: number;
};

export default function FichasTecnicasPage() {
    const [fichas, setFichas] = useState<FichaTecnica[]>([]);
    const [loading, setLoading] = useState(false);

    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [buscar, setBuscar] = useState('');

    const cargarFichas = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);
            if (buscar.trim()) params.append('buscar', buscar.trim());

            const res = await fetch(
                `${API_BASE}/cliente-servicio/fichas-tecnicas/historial?${params.toString()}`
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo cargar el historial');
                return;
            }

            setFichas(data.fichas || []);

        } catch (error) {
            console.error('Error cargando fichas técnicas:', error);
            alert('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarFichas();
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

    const reimprimirFicha = (servicioId: string) => {
        window.open(
            `${API_BASE}/cliente-servicio/${servicioId}/ficha-tecnica-pdf`,
            '_blank'
        );
    };

    const limpiarFiltros = () => {
        setDesde('');
        setHasta('');
        setBuscar('');

        setTimeout(() => {
            cargarFichas();
        }, 100);
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Fichas Técnicas</h1>
                    <p style={styles.subtitle}>
                        Historial, búsqueda y reimpresión de fichas técnicas de instalación.
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

                <button style={styles.primaryButton} onClick={cargarFichas}>
                    Buscar
                </button>

                <button style={styles.secondaryButton} onClick={limpiarFiltros}>
                    Limpiar
                </button>
            </section>

            <section style={styles.summary}>
                <div style={styles.summaryCard}>
                    <span style={styles.summaryNumber}>{fichas.length}</span>
                    <span style={styles.summaryText}>Fichas encontradas</span>
                </div>
            </section>

            {loading ? (
                <p style={styles.loading}>Cargando fichas técnicas...</p>
            ) : (
                <div style={styles.grid}>
                    {fichas.map((f) => (
                        <div key={f.fichaId} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div>
                                    <h3 style={styles.clientName}>
                                        {f.nombres} {f.apellidos}
                                    </h3>

                                    <p style={styles.code}>
                                        {f.codigoFicha}
                                    </p>
                                </div>

                                <span style={styles.badge}>
                                    {f.tipoServicio || 'ISP'}
                                </span>
                            </div>

                            <div style={styles.infoBox}>
                                <p><strong>Cédula/RUC:</strong> {f.cedula || 'N/A'}</p>
                                <p><strong>Teléfono:</strong> {f.telefono || 'N/A'}</p>
                                <p><strong>Plan:</strong> {f.nombrePlan || 'N/A'}</p>
                                <p><strong>Precio:</strong> ${Number(f.precioMensual || 0).toFixed(2)}</p>
                                <p><strong>Estado servicio:</strong> {f.estadoServicio || 'N/A'}</p>
                            </div>

                            <div style={styles.dateBox}>
                                <p><strong>Ficha generada:</strong> {formatearFecha(f.fechaGeneracion)}</p>
                                <p><strong>Fecha instalación:</strong> {formatearFecha(f.fechaInstalacion)}</p>
                            </div>

                            <div style={styles.actions}>
                                <button
                                    style={styles.printButton}
                                    onClick={() => reimprimirFicha(f.servicioId)}
                                >
                                    Reimprimir ficha
                                </button>
                            </div>
                        </div>
                    ))}

                    {fichas.length === 0 && (
                        <div style={styles.empty}>
                            No hay fichas técnicas generadas con esos filtros.
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
        background: 'linear-gradient(135deg, #0F172A, #0891B2)',
        borderRadius: '18px',
        padding: '24px',
        marginBottom: '22px',
        boxShadow: '0 20px 50px rgba(8, 145, 178, 0.25)',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        fontWeight: 900,
        color: '#FFFFFF',
    },
    subtitle: {
        marginTop: '6px',
        color: '#CFFAFE',
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
        background: '#0891B2',
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
        border: '1px solid rgba(8, 145, 178, 0.35)',
        borderRadius: '14px',
        padding: '14px 18px',
    },
    summaryNumber: {
        fontSize: '26px',
        fontWeight: 900,
        color: '#22D3EE',
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
        background: '#0891B2',
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
        background: 'rgba(8, 145, 178, 0.12)',
        border: '1px solid rgba(8, 145, 178, 0.25)',
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