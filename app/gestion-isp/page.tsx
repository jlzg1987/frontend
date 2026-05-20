'use client';

import { useRouter } from 'next/navigation';

export default function GestionIspPage({
    onVolver,
    onAbrirCliente,
    onAbrirServicioCliente,
    onAbrirImprimirServicioCliente,
    onAbrirImprimirAutorizacionCliente,
    onAbrirImprimirfichaCliente,
    onAbrirclientesexternos,
}: {
    onVolver: () => void;
    onAbrirCliente: () => void;
    onAbrirServicioCliente: () => void;
    onAbrirImprimirServicioCliente: () => void;
    onAbrirImprimirAutorizacionCliente: () => void;
    onAbrirImprimirfichaCliente: () => void;
    onAbrirclientesexternos: () => void;
}) {
    const router = useRouter();

    const cards = [
        {
            title: 'Clientes',
            desc: 'Registrar, buscar y administrar clientes ISP.',
            icon: '👥',
            href: '/Clientes',
            color: '#2563EB',
        },
        {
            title: 'Contratos de Servicio',
            desc: 'Crear servicios, planes, contrato, suspensión y reconexión.',
            icon: '📡',
            href: '/contratos-servicios',
            color: '#7C3AED',
        },
        {
            title: 'Imprimir ISP',
            desc: 'Generar documentos PDF para cliente y técnicos.',
            icon: '🖨️',
            href: '/contratos-pdf',
            color: '#16A34A',
        },
        {
            title: 'Autorizaciones',
            desc: 'Listado y reimpresión de autorizaciones de instalación.',
            icon: '🛠️',
            href: '/autorizaciones-instalacion',
            color: '#EA580C',
        },
        {
            title: 'Fichas Cliente',
            desc: 'Listado y reimpresión de fichas técnicas para instalación.',
            icon: '📋',
            href: '/fichas-tecnicas',
            color: '#0891B2',
        },
        {
            title: 'Clientes Externos',
            desc: 'Gestiona clientes externos para facturación interna, recibos y ventas rápidas.',
            icon: '🧾',
            href: '/facturacion-interna/clientes-externos',
            color: '#480ee9',
        },
    ];

    return (
        <main style={styles.page}>
            <section style={styles.hero}>
                <div>
                    <span style={styles.badge}>NETCOMP RF</span>

                </div>

                <div style={styles.heroIcon}>🌐</div>
            </section>

            <section style={styles.grid}>
                {cards.map((card) => (
                    <button
                        key={card.title}
                        style={styles.card}
                        onClick={() => {
                            if (card.title === 'Clientes') {
                                onAbrirCliente();
                                return;
                            }
                            if (card.title === 'Contratos de Servicio') {
                                onAbrirServicioCliente();
                                return;
                            }
                            if (card.title === 'Imprimir ISP') {
                                onAbrirImprimirServicioCliente();
                                return;
                            }
                            if (card.title === 'Autorizaciones') {
                                onAbrirImprimirAutorizacionCliente();
                                return;
                            }
                            if (card.title === 'Fichas Cliente') {
                                onAbrirImprimirfichaCliente();
                                return;
                            }
                            if (card.title === 'Clientes Externos') {
                                onAbrirclientesexternos();
                                return;
                            }


                            router.push(card.href)
                        }}
                    >
                        <div
                            style={{
                                ...styles.iconBox,
                                background: card.color,
                                boxShadow: `0 18px 40px ${card.color}55`,
                            }}
                        >
                            {card.icon}
                        </div>

                        <div style={styles.cardContent}>
                            <h2 style={styles.cardTitle}>{card.title}</h2>
                            <p style={styles.cardDesc}>{card.desc}</p>
                        </div>

                        <span style={styles.arrow}>→</span>
                    </button>
                ))}
            </section>
        </main>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        padding: '32px',
        background:
            'radial-gradient(circle at top left, rgba(37,99,235,0.25), transparent 35%), #020617',
        color: '#E5E7EB',
    },
    hero: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        padding: '32px',
        borderRadius: '26px',
        background: 'linear-gradient(135deg, #0F172A, #1E293B)',
        border: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
        marginBottom: '28px',
    },
    badge: {
        display: 'inline-block',
        padding: '7px 12px',
        borderRadius: '999px',
        background: 'rgba(56,189,248,0.15)',
        color: '#67E8F9',
        fontWeight: 900,
        fontSize: '12px',
        letterSpacing: '1px',
        marginBottom: '12px',
    },
    title: {
        margin: 0,
        fontSize: '36px',
        fontWeight: 900,
        color: '#FFFFFF',
    },
    subtitle: {
        maxWidth: '760px',
        marginTop: '10px',
        color: '#CBD5E1',
        fontSize: '15px',
        lineHeight: 1.6,
    },
    heroIcon: {
        minWidth: '92px',
        height: '92px',
        borderRadius: '26px',
        background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '44px',
        boxShadow: '0 22px 55px rgba(37,99,235,0.45)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
    },
    card: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        textAlign: 'left',
        padding: '22px',
        minHeight: '145px',
        borderRadius: '24px',
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(148,163,184,0.16)',
        color: '#FFFFFF',
        cursor: 'pointer',
        boxShadow: '0 18px 45px rgba(0,0,0,0.28)',
        transition: 'transform .2s ease, border .2s ease',
    },
    iconBox: {
        width: '58px',
        height: '58px',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        flexShrink: 0,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 900,
    },
    cardDesc: {
        marginTop: '7px',
        color: '#CBD5E1',
        fontSize: '13px',
        lineHeight: 1.45,
    },
    arrow: {
        fontSize: '24px',
        color: '#94A3B8',
    },
};