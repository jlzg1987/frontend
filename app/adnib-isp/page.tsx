'use client';

import { useRouter } from 'next/navigation';
import ImportarClientesInterno from '../dashboard/components/ImportarClientesInterno';

export default function AdminIspPageInterno({
    onVolver,
    onAbrirAdministracion,
    onAbrirClientes,
    onAbrirImportarclientes,

}: {
    onVolver: () => void;
    onAbrirAdministracion: () => void;
    onAbrirClientes: () => void;
    onAbrirImportarclientes: () => void;
}) {
    const router = useRouter();

    const cards: {
        titulo: string;
        descripcion: string;
        icono: string;
        ruta: string;
        color: string;
    }[] = [
            {
                titulo: 'Planes de Internet',
                descripcion: 'Crear, editar y administrar planes, velocidades y precios.',
                icono: '📡',
                ruta: '/adnib-isp/planes-internet',
                color: '#06b6d4',
            },
            {
                titulo: 'Clientes',
                descripcion: 'Registrar clientes, dirección, coordenadas y estado del servicio.',
                icono: '👥',
                ruta: '/clientes',
                color: '#22c55e',
            },
            {
                titulo: 'Pagos y mensualidades',
                descripcion: 'Control de pagos, deudas, mensualidades pendientes e historial.',
                icono: '💵',
                ruta: '/pagos',
                color: '#f59e0b',
            },
            {
                titulo: 'Facturas internas',
                descripcion: 'Generación y consulta de comprobantes internos del ISP.',
                icono: '🧾',
                ruta: '/facturas-internas',
                color: '#a855f7',
            },
            {
                titulo: 'Publicidad',
                descripcion: 'Administrar banners, anuncios y promociones del sistema.',
                icono: '📢',
                ruta: '/publicidad',
                color: '#ec4899',
            },
            {
                titulo: 'Cortes por mora',
                descripcion: 'Control automático de suspensión y reconexión por deuda.',
                icono: '⛔',
                ruta: '/cortes-mora',
                color: '#ef4444',
            },
            {
                titulo: 'Reportes ISP',
                descripcion: 'Ingresos, clientes activos, morosos, suspendidos y estadísticas.',
                icono: '📊',
                ruta: '/reportes-isp',
                color: '#38bdf8',
            },
            {
                titulo: 'Configuración ISP',
                descripcion: 'Parámetros generales del negocio, cobros, avisos y reglas.',
                icono: '⚙️',
                ruta: '/configuracion-isp',
                color: '#64748b',
            },
            {
                titulo: 'Importar clientes',
                descripcion: 'Descargar formato Excel y cargar clientes masivamente.',
                icono: '📥',
                ruta: '/dashboard/components/importarClientesInterno',
                color: '#14b8a6',
            },
        ];

    return (
        <main style={styles.page}>

            <section style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Módulos</span>
                    <strong style={styles.statValue}>8</strong>
                    <small style={styles.statText}>Administrativos</small>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Objetivo</span>
                    <strong style={styles.statValue}>ERP</strong>
                    <small style={styles.statText}>ISP profesional</small>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Automatización</span>
                    <strong style={styles.statValue}>MikroTik</strong>
                    <small style={styles.statText}>Cortes y reconexión</small>
                </div>
            </section>

            <section style={styles.cardsGrid}>
                {cards.map((card) => (
                    <article
                        key={card.titulo}
                        style={{
                            ...styles.card,
                            boxShadow: `0 18px 45px ${card.color}22`,
                            border: `1px solid ${card.color}44`,
                        }}

                        onClick={() => {
                            if (card.titulo === 'Planes de Internet') {
                                onAbrirAdministracion();
                                return;
                            }
                            if (card.titulo === 'Clientes') {
                                onAbrirClientes();
                                return;
                            }
                            if (card.titulo === 'Importar clientes') {
                                onAbrirImportarclientes();
                                return;
                            }


                            router.push(card.ruta);
                        }}
                    >

                        <div
                            style={{
                                ...styles.iconBox,
                                background: `${card.color}22`,
                                color: card.color,
                            }}
                        >
                            {card.icono}
                        </div>

                        <div>
                            <h2 style={styles.cardTitle}>{card.titulo}</h2>
                            <p style={styles.cardDescription}>{card.descripcion}</p>
                        </div>

                        <button
                            style={{
                                ...styles.cardButton,
                                background: card.color,
                            }}
                        >
                            Entrar
                        </button>
                    </article>
                ))}
            </section>
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: '100vh',
        background: '#020617',
        color: '#fff',
        padding: '28px',
    },
    header: {
        background: 'linear-gradient(135deg, #0f172a, #111827)',
        border: '1px solid rgba(34,211,238,0.25)',
        borderRadius: '24px',
        padding: '26px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '18px',
        flexWrap: 'wrap',
        boxShadow: '0 20px 60px rgba(8,145,178,0.15)',
    },
    title: {
        fontSize: '32px',
        fontWeight: 900,
        margin: 0,
    },
    subtitle: {
        color: '#94a3b8',
        marginTop: '8px',
        fontSize: '15px',
        maxWidth: '720px',
    },
    backButton: {
        background: '#06b6d4',
        color: '#001016',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '14px',
        fontWeight: 900,
        cursor: 'pointer',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '26px',
    },
    statCard: {
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: '18px',
        padding: '20px',
    },
    statLabel: {
        color: '#94a3b8',
        fontSize: '13px',
    },
    statValue: {
        display: 'block',
        fontSize: '26px',
        marginTop: '8px',
    },
    statText: {
        color: '#64748b',
        marginTop: '6px',
        display: 'block',
    },
    cardsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
        gap: '20px',
    },
    card: {
        background: 'linear-gradient(180deg, #0f172a, #020617)',
        borderRadius: '22px',
        padding: '22px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    iconBox: {
        width: '56px',
        height: '56px',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        marginBottom: '18px',
    },
    cardTitle: {
        fontSize: '21px',
        fontWeight: 900,
        margin: 0,
    },
    cardDescription: {
        color: '#94a3b8',
        fontSize: '14px',
        lineHeight: 1.5,
        marginTop: '9px',
    },
    cardButton: {
        border: 'none',
        color: '#020617',
        padding: '11px 14px',
        borderRadius: '13px',
        fontWeight: 900,
        cursor: 'pointer',
        marginTop: '18px',
        width: 'fit-content',
    },
};