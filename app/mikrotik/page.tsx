'use client';

import { useRouter } from 'next/navigation';

export default function MikroTikDashboardPage() {
    const router = useRouter();

    const stats = [
        { titulo: 'Nodos registrados', valor: '0', icono: '📡', color: '#38bdf8' },
        { titulo: 'Nodos en línea', valor: '0', icono: '🟢', color: '#22c55e' },
        { titulo: 'Nodos inactivos', valor: '0', icono: '🔴', color: '#ef4444' },
        { titulo: 'Agent / WireGuard', valor: '0', icono: '🔐', color: '#a855f7' },
        { titulo: 'API pública', valor: '0', icono: '🌐', color: '#f59e0b' },
        { titulo: 'Clientes MOROSOS', valor: '0', icono: '🚫', color: '#f97316' },
    ];

    const accesos = [
        {
            titulo: 'Administrar nodos',
            descripcion: 'Registrar, editar y probar conexión MikroTik',
            icono: '🛠️',
            ruta: '/mikrotik/routers',
        },
        {
            titulo: 'Cortes de clientes',
            descripcion: 'Cortar, restaurar y consultar estado por cliente',
            icono: '👥',
            ruta: '/mikrotik/clientes',
        },
        {
            titulo: 'Monitoreo de nodos',
            descripcion: 'CPU, RAM, uptime y estado general',
            icono: '📊',
            ruta: '/mikrotik/monitoreo',
        },
        {
            titulo: 'Firewall / MOROSOS',
            descripcion: 'Listas, reglas y bloqueo automático',
            icono: '🧱',
            ruta: '/mikrotik/firewall',
        },
        {
            titulo: 'Redes internas',
            descripcion: 'Redes LAN por nodo y rutas internas',
            icono: '🌍',
            ruta: '/mikrotik/redes',
        },
        {
            titulo: 'Reportes',
            descripcion: 'Historial de cortes, reconexiones y errores',
            icono: '📄',
            ruta: '/mikrotik/reportes',
        },
    ];

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div style={styles.topActions}>
                    <button
                        style={styles.backButton}
                        onClick={() => router.push('/dashboard')}
                    >
                        ← Volver al menú principal
                    </button>
                </div>
                <div>
                    <h1 style={styles.title}>Dashboard MikroTik</h1>
                    <p style={styles.subtitle}>
                        Centro de control para nodos, clientes, monitoreo, firewall y reportes.
                    </p>
                </div>

                <button
                    style={styles.primaryButton}
                    onClick={() => router.push('/mikrotik/routers')}
                >
                    + Administrar nodos
                </button>
            </section>

            <section style={styles.statsGrid}>
                {stats.map((item, index) => (
                    <div key={index} style={styles.statCard}>
                        <div style={{ ...styles.iconBox, boxShadow: `0 0 18px ${item.color}` }}>
                            <span>{item.icono}</span>
                        </div>

                        <div>
                            <p style={styles.statTitle}>{item.titulo}</p>
                            <h2 style={{ ...styles.statValue, color: item.color }}>
                                {item.valor}
                            </h2>
                        </div>
                    </div>
                ))}
            </section>

            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Accesos rápidos</h2>

                <div style={styles.accessGrid}>
                    {accesos.map((item, index) => (
                        <button
                            key={index}
                            style={styles.accessCard}
                            onClick={() => router.push(item.ruta)}
                        >
                            <div style={styles.accessIcon}>{item.icono}</div>
                            <h3 style={styles.accessTitle}>{item.titulo}</h3>
                            <p style={styles.accessDescription}>{item.descripcion}</p>
                        </button>
                    ))}
                </div>
            </section>
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    topActions: {
        width: '100%',
        marginBottom: 10,
    },

    backButton: {
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(56,189,248,0.35)',
        color: '#38bdf8',
        padding: '10px 16px',
        borderRadius: 12,
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 14,
        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
    },
    page: {
        minHeight: '100vh',
        padding: 24,
        background: 'linear-gradient(135deg, #020617, #0f172a)',
        color: '#e5e7eb',
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
        color: '#94a3b8',
        fontSize: 15,
    },
    primaryButton: {
        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
        color: 'white',
        border: 'none',
        padding: '12px 18px',
        borderRadius: 12,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(37,99,235,0.35)',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 18,
        marginBottom: 32,
    },
    statCard: {
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: 18,
        padding: 20,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        background: '#020617',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
    },
    statTitle: {
        margin: 0,
        color: '#94a3b8',
        fontSize: 14,
    },
    statValue: {
        margin: 0,
        marginTop: 4,
        fontSize: 30,
        fontWeight: 800,
    },
    section: {
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 22,
        marginBottom: 18,
        color: '#f8fafc',
    },
    accessGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
    },
    accessCard: {
        textAlign: 'left',
        background: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        borderRadius: 18,
        padding: 22,
        color: '#e5e7eb',
        cursor: 'pointer',
        transition: '0.2s',
        boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
    },
    accessIcon: {
        fontSize: 34,
        marginBottom: 14,
    },
    accessTitle: {
        margin: 0,
        fontSize: 18,
        color: '#f8fafc',
    },
    accessDescription: {
        marginTop: 8,
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 1.5,
    },
};