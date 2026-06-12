'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getToken } from '@/src/lib/api';


type StatItem = {
    title: string;
    value: string;
    icon: string;
    color: string;
};

type ModuleItem = {
    title: string;
    desc: string;
    icon: string;
    href: string;
    color: string;
};

const modules: ModuleItem[] = [
    {
        title: 'Torres WISP',
        desc: 'Registrar y administrar torres inalámbricas.',
        icon: '🗼',
        href: '/infraestructura/torres-wisp',
        color: 'bg-orange-600',
    },

    {
        title: 'Equipos Wireless',
        desc: 'Administrar equipos Ubiquiti, TP-Link, enlaces y CPE.',
        icon: '📡',
        href: '/wireless/equipos',
        color: 'bg-sky-600',
    },
    {
        title: 'Sectoriales WISP',
        desc: 'Gestionar sectoriales, SSID, frecuencia e IP.',
        icon: '📶',
        href: '/wireless/sectoriales',
        color: 'bg-cyan-600',
    },
    {
        title: 'Enlaces Wireless',
        desc: 'Monitorear enlaces punto a punto y backbone.',
        icon: '🔗',
        href: '/wireless/enlaces',
        color: 'bg-violet-600',
    },
    {
        title: 'CPE Clientes',
        desc: 'Gestionar LiteBeam, NanoBeam y equipos de abonados.',
        icon: '🏠',
        href: '/wireless/cpe-clientes',
        color: 'bg-blue-600',
    },
    {
        title: 'Monitoreo Wireless',
        desc: 'Ver señal, CCQ, tráfico y estado de los equipos.',
        icon: '📊',
        href: '/wireless/monitoreo',
        color: 'bg-green-600',
    },
    {
        title: 'Equipos Offline',
        desc: 'Visualizar equipos sin respuesta o fuera de línea.',
        icon: '🔴',
        href: '/wireless/offline',
        color: 'bg-red-600',
    },
    {
        title: 'Alertas Wireless',
        desc: 'Gestionar alertas de señal, CCQ y disponibilidad.',
        icon: '🚨',
        href: '/wireless/alertas',
        color: 'bg-pink-600',
    },
    {
        title: 'Nodos Fibra',
        desc: 'Administrar nodos principales de fibra óptica.',
        icon: '🔌',
        href: '/infraestructura/nodos-fibra',
        color: 'bg-emerald-600',
    },
    {
        title: 'NAP / Splitter',
        desc: 'Controlar cajas NAP, splitters y distribución GPON.',
        icon: '📦',
        href: '/infraestructura/nap-splitter',
        color: 'bg-violet-600',
    },

];

export default function InfraestructuraPage({
    onVolver,
    onAbrirtorre,
    onAbrirsectorial,
    onAbrirnodofibra,
    onAbrirNapSplitter,
    onAbrirEquiposWireless,
    onAbrirEnlaces,
    onAbrirCPEClientes,
    onAbrirAlertasWireless,
    onAbrirMonitoreoWireless,
}: {
    onVolver: () => void;
    onAbrirtorre: () => void;
    onAbrirsectorial: () => void;
    onAbrirnodofibra: () => void;
    onAbrirNapSplitter: () => void;
    onAbrirEquiposWireless: () => void;
    onAbrirEnlaces: () => void;
    onAbrirCPEClientes: () => void;
    onAbrirAlertasWireless: () => void;
    onAbrirMonitoreoWireless: () => void;
}) {
    const router = useRouter();

    const [totalTorres, setTotalTorres] = useState(0);
    const [totalSectoriales, setTotalSectoriales] = useState(0);
    const [totalNodosFibra, setTotalNodosFibra] = useState(0);
    const [totalNap, setTotalNap] = useState(0);
    const [totalNatRedes, setTotalNatRedes] = useState(0);
    const [loading, setLoading] = useState(true);

    const cargarResumenInfraestructura = async () => {
        try {
            setLoading(true);

            const [
                resTorres,
                resSectoriales,
                resNodosFibra,
                resNapSplitter
            ] = await Promise.all([
                fetch(`${API_BASE}/torres-wisp`),
                fetch(`${API_BASE}/sectoriales-wisp`),
                fetch(`${API_BASE}/nodos-fibra`),
                fetch(`${API_BASE}/nap-splitter`),
            ]);

            const torresData = await resTorres.json();
            const sectorialesData = await resSectoriales.json();
            const nodosFibraData = await resNodosFibra.json();
            const napSplitterData = await resNapSplitter.json();

            setTotalTorres(torresData.torres?.length || 0);
            setTotalSectoriales(sectorialesData.sectoriales?.length || 0);
            setTotalNodosFibra(nodosFibraData.nodos?.length || 0);
            setTotalNap(napSplitterData.naps?.length || 0);

            // Este queda en 0 hasta crear NAT / Redes
            setTotalNatRedes(0);

        } catch (error) {
            console.error('Error cargando resumen infraestructura:', error);
        } finally {
            setLoading(false);
        }
    };
    const token = getToken();


    useEffect(() => {
        cargarResumenInfraestructura();
    }, []);

    const stats: StatItem[] = [
        {
            title: 'Total torres',
            value: String(totalTorres),
            icon: '🗼',
            color: '#f97316',
        },
        {
            title: 'Total sectoriales',
            value: String(totalSectoriales),
            icon: '📶',
            color: '#06b6d4',
        },
        {
            title: 'Equipos Wireless',
            value: String(),
            icon: '📡',
            color: '#06b6d4',
        },
        {
            title: 'Nodos de fibra',
            value: String(totalNodosFibra),
            icon: '🔌',
            color: '#10b981',
        },
        {
            title: 'NAP / Splitter',
            value: String(totalNap),
            icon: '📦',
            color: '#8b5cf6',
        },

    ];

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <p style={styles.kicker}>Sistema Web ISP Netcomp RF</p>

                </div>

                <button
                    style={styles.refreshButton}
                    onClick={cargarResumenInfraestructura}
                >
                    {loading ? 'Actualizando...' : 'Actualizar resumen'}
                </button>
            </section>

            <section style={styles.statsGrid}>
                {stats.map((stat) => (
                    <article key={stat.title} style={styles.statCard}>
                        <div
                            style={{
                                ...styles.statIcon,
                                background: `${stat.color}22`,
                                borderColor: `${stat.color}66`,
                            }}
                        >
                            {stat.icon}
                        </div>

                        <div>
                            <p style={styles.statTitle}>{stat.title}</p>
                            <h2 style={styles.statValue}>{stat.value}</h2>
                        </div>
                    </article>
                ))}
            </section>


            <section style={styles.modulesGrid}>
                {modules.map((mod) => (
                    <article
                        key={mod.href}
                        style={styles.moduleCard}


                        onClick={() => {
                            if (mod.title === 'Torres WISP') {
                                onAbrirtorre();
                                return;
                            }
                            if (mod.title === 'Sectoriales WISP') {
                                onAbrirsectorial();
                                return;
                            }
                            if (mod.title === 'Enlaces Wireless') {
                                onAbrirEnlaces();
                                return;
                            }
                            if (mod.title === 'Nodos Fibra') {
                                onAbrirnodofibra();
                                return;
                            }
                            if (mod.title === 'NAP / Splitter') {
                                onAbrirNapSplitter();
                                return;
                            }
                            if (mod.title === 'Equipos Wireless') {
                                onAbrirEquiposWireless();
                                return;
                            }
                            if (mod.title === 'CPE Clientes') {
                                onAbrirCPEClientes();
                                return;
                            }
                            if (mod.title === 'Alertas Wireless') {
                                onAbrirAlertasWireless();
                                return;
                            }
                            if (mod.title === 'Monitoreo Wireless') {
                                onAbrirMonitoreoWireless();
                                return;
                            }

                            router.push(mod.href)
                        }}
                    >
                        <div style={styles.moduleTop}>
                            <div style={styles.moduleIcon}>{mod.icon}</div>

                            <div style={styles.moduleArrow}>
                                →
                            </div>
                        </div>

                        <h3 style={styles.moduleTitle}>{mod.title}</h3>
                        <p style={styles.moduleDesc}>{mod.desc}</p>

                        <button style={styles.moduleButton}>
                            Entrar al módulo
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
        background:
            'radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 32%), #020617',
        color: '#e5e7eb',
        padding: '28px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '26px',
        flexWrap: 'wrap',
    },
    kicker: {
        margin: 0,
        color: '#67e8f9',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontSize: '12px',
    },
    title: {
        margin: '6px 0 0',
        color: '#fff',
        fontSize: '34px',
        fontWeight: 900,
    },
    subtitle: {
        marginTop: '8px',
        color: '#94a3b8',
        maxWidth: '760px',
        lineHeight: 1.5,
    },
    refreshButton: {
        background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        padding: '12px 18px',
        fontWeight: 900,
        cursor: 'pointer',
        boxShadow: '0 14px 34px rgba(37,99,235,0.28)',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '16px',
        marginBottom: '30px',
    },
    statCard: {
        background: 'rgba(15,23,42,0.88)',
        border: '1px solid rgba(148,163,184,0.16)',
        borderRadius: '20px',
        padding: '18px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 18px 42px rgba(0,0,0,0.3)',
    },
    statIcon: {
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        border: '1px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '25px',
    },
    statTitle: {
        margin: 0,
        color: '#94a3b8',
        fontSize: '13px',
        fontWeight: 700,
    },
    statValue: {
        margin: '4px 0 0',
        color: '#fff',
        fontSize: '28px',
        fontWeight: 900,
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    sectionTitle: {
        margin: 0,
        color: '#fff',
        fontSize: '22px',
        fontWeight: 900,
    },
    sectionSubtitle: {
        marginTop: '6px',
        color: '#94a3b8',
    },
    modulesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '18px',
    },
    moduleCard: {
        background:
            'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))',
        border: '1px solid rgba(34,211,238,0.18)',
        borderRadius: '24px',
        padding: '20px',
        cursor: 'pointer',
        boxShadow: '0 18px 44px rgba(0,0,0,0.35)',
        transition: 'transform 0.2s ease, border 0.2s ease',
    },
    moduleTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
    },
    moduleIcon: {
        width: '58px',
        height: '58px',
        borderRadius: '18px',
        background: 'rgba(14,165,233,0.13)',
        border: '1px solid rgba(34,211,238,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
    },
    moduleArrow: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: '#0f172a',
        color: '#67e8f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
    },
    moduleTitle: {
        margin: 0,
        color: '#fff',
        fontSize: '20px',
        fontWeight: 900,
    },
    moduleDesc: {
        color: '#94a3b8',
        lineHeight: 1.5,
        minHeight: '48px',
    },
    moduleButton: {
        marginTop: '12px',
        width: '100%',
        background: '#0f172a',
        border: '1px solid rgba(34,211,238,0.25)',
        color: '#67e8f9',
        borderRadius: '12px',
        padding: '11px',
        fontWeight: 900,
        cursor: 'pointer',
    },
};