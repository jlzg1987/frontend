'use client';

import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Banknote,
    BarChart3,
    Building2,
    CircleSlash2,
    FileDown,
    Gauge,
    Megaphone,
    ReceiptText,
    Settings,
    Tags,
    Users,
    Wifi,
    WalletCards,
    type LucideIcon,
} from 'lucide-react';
import ImportarClientesInterno from '../dashboard/components/ImportarClientesInterno';

export default function AdminIspPageInterno({
    onVolver,
    onAbrirAdministracion,
    onAbrirClientes,
    onAbrirImportarclientes,
    onAbrirPagosmensuales,
    onAbrirFacturacion,
    onAbrirCortespormora,
    onAbrirConfiguraciónISP,
    onAbrirPublicidad,
    onAbrirReportesISP,
    onAbrirSpeedTestAnalytics,
    onAbrirConfiguracionSedes,
    onAbrirCategoriasGastos,
    onAbrirGastosMensuales,
}: {
    onVolver: () => void;
    onAbrirAdministracion: () => void;
    onAbrirClientes: () => void;
    onAbrirImportarclientes: () => void;
    onAbrirPagosmensuales: () => void;
    onAbrirFacturacion: () => void;
    onAbrirCortespormora: () => void;
    onAbrirConfiguraciónISP: () => void;
    onAbrirPublicidad: () => void;
    onAbrirReportesISP: () => void;
    onAbrirSpeedTestAnalytics: () => void;
    onAbrirConfiguracionSedes: () => void;
    onAbrirCategoriasGastos: () => void;
    onAbrirGastosMensuales: () => void;
}) {
    const router = useRouter();

    const cards: {
        titulo: string;
        descripcion: string;
        icono: LucideIcon;
        ruta: string;
        color: string;
    }[] = [
            {
                titulo: 'Planes de Internet',
                descripcion: 'Crear, editar y administrar planes, velocidades y precios.',
                icono: Wifi,
                ruta: '/adnib-isp/planes-internet',
                color: '#06b6d4',
            },
            {
                titulo: 'Clientes',
                descripcion: 'Registrar clientes, dirección, coordenadas y estado del servicio.',
                icono: Users,
                ruta: '/clientes',
                color: '#22c55e',
            },
            {
                titulo: 'Pagos y mensualidades',
                descripcion: 'Control de pagos, deudas, mensualidades pendientes e historial.',
                icono: Banknote,
                ruta: '/pagos',
                color: '#f59e0b',
            },
            {
                titulo: 'Facturas internas',
                descripcion: 'Generación y consulta de comprobantes internos del ISP.',
                icono: ReceiptText,
                ruta: '/facturas-internas',
                color: '#a855f7',
            },
            {
                titulo: 'Publicidad',
                descripcion: 'Administrar banners, anuncios y promociones del sistema.',
                icono: Megaphone,
                ruta: '/publicidad',
                color: '#ec4899',
            },
            {
                titulo: 'Cortes por mora',
                descripcion: 'Control automático de suspensión y reconexión por deuda.',
                icono: CircleSlash2,
                ruta: '/cortes-mora',
                color: '#ef4444',
            },
            {
                titulo: 'Reportes ISP',
                descripcion: 'Ingresos, clientes activos, morosos, suspendidos y estadísticas.',
                icono: BarChart3,
                ruta: '/reportes-isp',
                color: '#38bdf8',
            },
            {
                titulo: 'Configuración ISP',
                descripcion: 'Parámetros generales del negocio, cobros, avisos y reglas.',
                icono: Settings,
                ruta: '/configuracion-isp',
                color: '#64748b',
            },
            {
                titulo: 'Importar clientes',
                descripcion: 'Descargar formato Excel y cargar clientes masivamente.',
                icono: FileDown,
                ruta: '/dashboard/components/importarClientesInterno',
                color: '#14b8a6',
            },

            {
                titulo: "SpeedTest Analytics",
                descripcion: "Estadísticas del servidor de velocidad Netcomprf.",
                icono: Gauge,
                ruta: "/speedtest",
                color: "#06b6d4",
            },
            {
                titulo: 'Configuración de sedes',
                descripcion: 'Administrar sedes y asignar los routers de cada operación.',
                icono: Building2,
                ruta: '/admin-isp/gastos/sedes',
                color: '#0ea5e9',
            },
            {
                titulo: 'Categorías de gastos',
                descripcion: 'Crear y organizar las categorías utilizadas en los gastos.',
                icono: Tags,
                ruta: '/admin-isp/gastos/categorias',
                color: '#8b5cf6',
            },
            {
                titulo: 'Gastos mensuales',
                descripcion: 'Registrar gastos y consultar resultados por sede y periodo.',
                icono: WalletCards,
                ruta: '/admin-isp/gastos/mensuales',
                color: '#f97316',
            },
        ];

    return (
        <main style={styles.page}>

            <section style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Módulos</span>
                    <strong style={styles.statValue}>{cards.length}</strong>
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
                {cards.map((card) => {
                    const Icono = card.icono;

                    return (
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
                                if (card.titulo === 'Pagos y mensualidades') {
                                    onAbrirPagosmensuales();
                                    return;
                                }
                                if (card.titulo === 'Facturas internas') {
                                    onAbrirFacturacion();
                                    return;
                                }
                                if (card.titulo === 'Cortes por mora') {
                                    onAbrirCortespormora();
                                    return;
                                }
                                if (card.titulo === 'Configuración ISP') {
                                    onAbrirConfiguraciónISP();
                                    return;
                                }
                                if (card.titulo === 'Publicidad') {
                                    onAbrirPublicidad();
                                    return;
                                }

                                if (card.titulo === 'Reportes ISP') {
                                    onAbrirReportesISP();
                                    return;
                                }

                                if (card.titulo === "SpeedTest Analytics") {
                                    onAbrirSpeedTestAnalytics();
                                    return;
                                }
                                if (card.titulo === "Configuración de sedes") {
                                    onAbrirConfiguracionSedes();
                                    return;
                                }
                                if (card.titulo === "Categorías de gastos") {
                                    onAbrirCategoriasGastos();
                                    return;
                                }
                                if (card.titulo === "Gastos mensuales") {
                                    onAbrirGastosMensuales();
                                    return;
                                }

                            }}
                        >

                            <div
                                style={{
                                    ...styles.iconBox,
                                    background: `linear-gradient(135deg, ${card.color}35, ${card.color}12)`,
                                    color: card.color,
                                    border: `1px solid ${card.color}38`,
                                }}
                            >
                                <Icono size={29} strokeWidth={2.2} aria-hidden="true" />
                            </div>

                            <div>
                                <h2 style={styles.cardTitle}>{card.titulo}</h2>
                                <p style={styles.cardDescription}>{card.descripcion}</p>
                            </div>

                            <button
                                type="button"
                                style={{
                                    ...styles.cardButton,
                                    background: `linear-gradient(135deg, ${card.color}, ${card.color}BB)`,
                                }}
                            >
                                Entrar
                                <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
                            </button>
                        </article>
                    );
                })}
            </section>
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: '100vh',
        background:
            'radial-gradient(circle at top right, rgba(6,182,212,0.16), transparent 34%), radial-gradient(circle at bottom left, rgba(37,99,235,0.12), transparent 38%), linear-gradient(135deg, #020617 0%, #0f172a 52%, #082f49 100%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
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
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
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
