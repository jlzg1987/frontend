'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchConTimeout(url: string, options: any = {}, ms = 4000) {
    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), ms);

    try {
        const resp = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        return resp;
    } finally {
        clearTimeout(timeout);
    }
}

export default function MikroTikDashboardPageInterno({
    onVolver,
    onAbrirRouters,
}: {
    onVolver: () => void;
    onAbrirRouters: () => void;
}) {
    const router = useRouter();
    const [loadingStats, setLoadingStats] = useState(true);

    const [resumen, setResumen] = useState({
        total: 0,
        enLinea: 0,
        inactivos: 0,
        wireguard: 0,
        apiPublica: 0,
    });

    function esWireGuard(valor: any): boolean {
        if (valor === 1 || valor === true) return true;
        if (valor === '1' || valor === 'true') return true;
        if (valor?.data?.[0] === 1) return true;
        return false;
    }
    const token = () => localStorage.getItem('isp_token');

    async function cargarResumenMikrotik() {
        try {
            setLoadingStats(true);

            const res = await fetch(`${API_BASE}/mikrotik/routers`, {
                headers: {
                    Authorization: `Bearer ${token()}`,
                },
            });

            const data = await res.json();

            console.log('Routers respuesta:', data);

            const routers = data.routers || [];

            let total = routers.length;
            let wireguard = 0;
            let apiPublica = 0;

            const resultados = await Promise.all(
                routers.map(async (r: any) => {
                    const usaWG = esWireGuard(r.UsaWireGuard ?? r.usa_wireguard ?? r.WireGuard);

                    if (usaWG) wireguard++;
                    else apiPublica++;

                    const routerId = r.id ?? r.Id ?? r.RouterId ?? r.routerId;

                    const url = usaWG
                        ? `${API_BASE}/mikrotik/routers/${routerId}/agent/estado`
                        : `${API_BASE}/mikrotik/routers/${routerId}/test`;

                    console.log('Consultando router:', r.Nombre, url);

                    try {
                        const resp = await fetchConTimeout(url, {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${token()}`,
                            },
                        }, 4000);

                        const estado = await resp.json();

                        console.log('Estado router:', r.Nombre, estado);

                        const conectado =
                            estado?.ok === true &&
                            (
                                estado?.estado === 'ACTIVO' ||
                                estado?.estado === 'Activo' ||
                                estado?.conectado === true ||
                                estado?.agent?.ok === true ||
                                estado?.api?.ok === true
                            );

                        return {
                            conectado,
                        };

                    } catch (err: any) {
                        const nombreRouter =
                            r.Nombre ??
                            r.nombre ??
                            r.NombreRouter ??
                            r.alias ??
                            'Router sin nombre';

                        if (err?.name === 'AbortError') {
                            console.warn('Timeout router inactivo:', nombreRouter);
                        } else {
                            console.error('Error consultando router:', nombreRouter, err);
                        }

                        return {
                            conectado: false,
                        };
                    }
                })
            );

            const enLinea = resultados.filter(r => r.conectado).length;
            const inactivos = total - enLinea;

            setResumen({
                total,
                enLinea,
                inactivos,
                wireguard,
                apiPublica,
            });

        } catch (error) {
            console.error('Error general dashboard MikroTik:', error);
        } finally {
            setLoadingStats(false);
        }
    }

    useEffect(() => {
        cargarResumenMikrotik();
    }, []);

    const stats = [
        {
            titulo: 'Nodos registrados',
            valor: loadingStats ? '...' : String(resumen.total),
            icono: '📡',
            color: '#38bdf8'
        },
        {
            titulo: 'Nodos en línea',
            valor: loadingStats ? '...' : String(resumen.enLinea),
            icono: '🟢',
            color: '#22c55e'
        },
        {
            titulo: 'Nodos inactivos',
            valor: loadingStats ? '...' : String(resumen.inactivos),
            icono: '🔴',
            color: '#ef4444'
        },
        {
            titulo: 'Agent / WireGuard',
            valor: loadingStats ? '...' : String(resumen.wireguard),
            icono: '🔐',
            color: '#a855f7'
        },
        {
            titulo: 'API pública',
            valor: loadingStats ? '...' : String(resumen.apiPublica),
            icono: '🌐',
            color: '#f59e0b'
        },
        {
            titulo: 'Clientes MOROSOS',
            valor: '0',
            icono: '🚫',
            color: '#f97316'
        },
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
                            onClick={() => {
                                if (item.titulo === 'Administrar nodos') {
                                    onAbrirRouters();
                                    return;
                                }

                                router.push(item.ruta);
                            }}
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
        padding: '10px 10',
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