'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PerfilInterno from '../perfil/page';
import MikroTikDashboardPageInterno from '../mikrotik/page';
import MikrotikPageInterno from '../mikrotik/routers/page';
import AdminIspPageInterno from '../adnib-isp/page';
import PlanesInternetPage from '../adnib-isp/planes-internet/page';
import ClientesInterno from './components/ClientesInterno';
import ImportarClientesInterno from './components/ImportarClientesInterno';
import { API_BASE, getToken } from '@/src/lib/api';
import ContratosServiciosPage from '../contratos-servicios/page';
import InfraestructuraPage from '../infraestructura/page';
import TorresWispPage from '../infraestructura/torres-wips/page';
import SectorialesWispPage from '../infraestructura/sectoriales-wisp/page';
import NodosFibraPage from '../infraestructura/nodos-fibra/page';
import NapSplitterPage from '../infraestructura/nap-splitter/page';

export default function DashboardPage() {
    const router = useRouter();
    const [usuario, setUsuario] = useState<any>(null);
    const [clientesActivos, setClientesActivos] = useState(0);

    const [vistaActual, setVistaActual] = useState<
        'dashboard' | 'perfil' | 'mikrotik' | 'mikrotikRouters' | 'administracion' | 'PlanInternet'
        | 'Clientes' | 'ImportarClientes' | 'contratosServicios' | 'infraestructura' | 'torre' | 'sectorial'
        | 'nodofibra' | 'NapSplitter'
    >('dashboard');


    const cargarResumenClientes = async () => {
        try {
            const token = await getToken();

            const res = await fetch(`${API_BASE}/clientes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                const activos = (data.clientes || []).filter(
                    (c: any) => c.estadoCliente === 'ACTIVO'
                ).length;

                setClientesActivos(activos);
            }
        } catch (error) {
            console.error('Error cargando resumen clientes:', error);
        }
    };

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('isp_usuario');

        if (usuarioStorage) {
            try {
                setUsuario(JSON.parse(usuarioStorage));
            } catch {
                setUsuario(null);
            }
        }
        cargarResumenClientes();
    }, []);



    const nombreUsuario =
        usuario?.nombreCompleto ||
        `${usuario?.nombres || ''} ${usuario?.apellidos || ''}`.trim() ||
        usuario?.nombre ||
        'Usuario';

    const emailUsuario =
        usuario?.email ||
        usuario?.correo ||
        '';

    const fotoUsuario =
        usuario?.fotoPerfil ||
        usuario?.foto ||
        usuario?.avatar ||
        usuario?.imagen ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreUsuario)}&background=2563eb&color=fff`;


    const cards = [
        {
            title: 'Clientes',
            desc: 'Registrar, buscar y administrar clientes ISP.',
            icon: '👥',
            href: '/Clientes',
            color: 'bg-blue-600',
        },
        {
            title: 'Contratos Servicios',
            desc: 'Administrar servicios de internet, planes, PPPoE, GPON y estados.',
            icon: '📡',
            href: '/contratos-servicios',
            color: 'bg-cyan-600',
        },
        {
            title: 'Pagos',
            desc: 'Control de mensualidades, deudas y cortes.',
            icon: '💳',
            href: '/pagos',
            color: 'bg-green-600',
        },
        {
            title: 'Facturación',
            desc: 'Facturas, notas de venta y comprobantes.',
            icon: '🧾',
            href: '/facturacion',
            color: 'bg-indigo-600',
        },
        {
            title: 'MikroTik',
            desc: 'Control de cortes, perfiles y clientes activos.',
            icon: '📡',
            color: 'bg-orange-600',
            href: '/mikrotik',
        },
        {
            title: 'Tickets',
            desc: 'Soporte técnico y atención al cliente.',
            icon: '🛠️',
            href: '/tickets',
            color: 'bg-red-600',
        },
        {
            title: 'Usuarios',
            desc: 'Administrar técnicos, cajeros y administradores.',
            icon: '🔐',
            href: '/usuarios',
            color: 'bg-slate-700',
        },
    ];

    function cerrarSesion() {
        localStorage.removeItem('isp_token');
        localStorage.removeItem('isp_usuario');
        router.push('/login');
    }

    function getHeaderInfo() {
        if (vistaActual === 'perfil') {
            return {
                titulo: 'Perfil de usuario',
                subtitulo: 'Administra tu información personal, foto y datos del sistema',
            };
        }

        if (vistaActual === 'mikrotik') {
            return {
                titulo: 'Dashboard MikroTik',
                subtitulo: 'Centro de control para nodos, clientes, monitoreo, firewall y reportes',
            };
        }
        if (vistaActual === 'mikrotikRouters') {
            return {
                titulo: 'Administrar nodos MikroTik',
                subtitulo: 'Registrar, editar, probar conexión y validar WireGuard de tus routers',
            };
        }
        if (vistaActual === 'administracion') {
            return {
                titulo: 'Administración ISP',
                subtitulo: ' Centro de control para clientes, planes, pagos, publicidad, cortes y reportes.',
            };
        }
        if (vistaActual === 'PlanInternet') {
            return {
                titulo: 'Planes de Internet',
                subtitulo: 'Crear, editar y administrar planes, velocidades y precios.',
            };
        }
        if (vistaActual === 'Clientes') {
            return {
                titulo: 'Clientes',
                subtitulo: 'Registro, ubicación, estado y perfil de clientes ISP.',
            };
        }
        if (vistaActual === 'ImportarClientes') {
            return {
                titulo: 'Importar clientes',
                subtitulo: 'Descarga el formato Excel oficial e importa clientes masivamente.',
            };
        }

        if (vistaActual === 'contratosServicios') {
            return {
                titulo: 'Contratos de Servicios',
                subtitulo: ' Servicios de internet asignados a clientes, planes, MikroTik y datos técnicos.',
            };
        }
        if (vistaActual === 'infraestructura') {
            return {
                titulo: 'Infraestructura',
                subtitulo: '  Centro de control para WISP, fibra óptica, NAP, nodos, NAT y red física del ISP.',
            };

        }
        if (vistaActual === 'torre') {
            return {
                titulo: 'Torres WISP',
                subtitulo: 'Administración de torres inalámbricas, ubicación, IP pública y estado operativo.',
            };

        }
        if (vistaActual === 'sectorial') {
            return {
                titulo: 'Sectoriales WISP',
                subtitulo: 'Administra sectoriales, IP, SSID y frecuencia por cada torre',
            };

        }
        if (vistaActual === 'nodofibra') {
            return {
                titulo: 'Módulos de infraestructura',
                subtitulo: 'Selecciona un módulo para administrar la red física y lógica del ISP.',
            };

        }

        if (vistaActual === 'NapSplitter') {
            return {
                titulo: 'NAP / Splitter',
                subtitulo: 'Controla cajas NAP, splitters, capacidad de puertos y distribución GPON.',
            };

        }

        return {
            titulo: 'Dashboard principal',
            subtitulo: 'Bienvenido al panel administrativo ISP NetComp RF',
        };
    }

    const headerInfo = getHeaderInfo();

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950">
            <div className="flex min-h-screen">
                <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800 p-6 flex-col">
                    <div className="mb-10">
                        <h1 className="text-2xl font-black text-white">Netcomp RF</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Sistema Web ISP
                        </p>
                    </div>

                    <nav className="space-y-3 flex-1">

                        <MenuItem
                            label="Dashboard"
                            active={vistaActual === 'dashboard'}
                            onClick={() => setVistaActual('dashboard')}
                        />

                        <MenuItem
                            label="Clientes"
                            active={vistaActual === 'Clientes'}
                            onClick={() => setVistaActual('Clientes')}
                        />

                        <MenuItem
                            label="Pagos"
                            href="/pagos"
                        />

                        <MenuItem
                            label="Facturación"
                            href="/facturacion"
                        />

                        <MenuItem
                            label="MikroTik"
                            active={vistaActual === 'mikrotik'}
                            onClick={() => setVistaActual('mikrotik')}
                        />
                        <MenuItem
                            label="Infraestructura"
                            active={vistaActual === 'infraestructura'}
                            onClick={() => setVistaActual('infraestructura')}

                        />
                        <MenuItem
                            label="Tickets"
                            href="/tickets"
                        />
                        <MenuItem
                            label="Administracion"
                            active={vistaActual === 'administracion'}
                            onClick={() => setVistaActual('administracion')}
                        />

                        <MenuItem
                            label="Usuarios"
                            href="/usuarios"
                        />

                        <MenuItem
                            label="Inventario"
                            href="/inventario"
                        />

                        <MenuItem
                            label="Desarrollo Sistema"
                            href="/desarrollo-sistema"
                        />

                    </nav>

                    <button
                        onClick={cerrarSesion}
                        className="rounded-xl bg-red-600 px-4 py-3 text-white font-bold hover:bg-red-700"
                    >
                        Cerrar sesión
                    </button>
                </aside>

                <section className="flex-1">
                    <header className="bg-slate-950/90 border-b border-cyan-500/20 px-5 md:px-8 py-5 flex items-center justify-between gap-4 shadow-lg shadow-cyan-500/10">    <div>
                        <h2 className="text-2xl font-black text-white">
                            {headerInfo.titulo}
                        </h2>
                        <p className="text-cyan-200/70 text-sm">
                            {headerInfo.subtitulo}
                        </p>
                    </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"

                                onClick={() => setVistaActual('perfil')}
                                className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900 px-4 py-2 hover:bg-slate-800 transition shadow-lg shadow-cyan-500/10"
                            >
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-black text-white">
                                        {nombreUsuario}
                                    </p>
                                    <p className="text-xs text-cyan-200/70">
                                        {emailUsuario}
                                    </p>
                                </div>

                                <img
                                    src={fotoUsuario}
                                    alt="Avatar usuario"
                                    className="h-12 w-12 rounded-2xl object-cover border border-blue-200"
                                />
                            </button>

                            <button
                                onClick={cerrarSesion}
                                className="md:hidden rounded-xl bg-red-600 px-4 py-2 text-white font-bold"
                            >
                                Salir
                            </button>
                        </div>
                    </header>
                    <div className="p-5 md:p-8">
                        {vistaActual === 'dashboard' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                                    <StatCard title="Clientes activos" value={String(clientesActivos)} />
                                    <StatCard title="Pagos pendientes" value="0" />
                                    <StatCard title="Tickets abiertos" value="0" />
                                    <StatCard title="Equipos online" value="0" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {cards.map((item) => (
                                        <button
                                            key={item.title}
                                            onClick={() => {
                                                if (item.title === 'MikroTik') {
                                                    setVistaActual('mikrotik');
                                                    return;
                                                }
                                                if (item.title === 'Clientes') {
                                                    setVistaActual('Clientes');
                                                    return;
                                                }
                                                if (item.title === 'Contratos Servicios') {
                                                    setVistaActual('contratosServicios');
                                                    return;
                                                }


                                                router.push(item.href);
                                            }}
                                            className="text-left rounded-3xl bg-slate-900/95 p-6 shadow-xl shadow-cyan-500/10 hover:scale-[1.02] transition border border-cyan-500/25 hover:border-cyan-400/60"
                                        >
                                            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                                                {item.icon}
                                            </div>

                                            <h3 className="text-xl font-black text-white">
                                                {item.title}
                                            </h3>

                                            <p className="text-cyan-100/70 mt-2 text-sm leading-6">
                                                {item.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {vistaActual === 'perfil' && (
                            <PerfilInterno onVolver={() => setVistaActual('dashboard')} />
                        )}
                        {vistaActual === 'mikrotik' && (
                            <MikroTikDashboardPageInterno
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirRouters={() => setVistaActual('mikrotikRouters')}
                            />
                        )}
                        {vistaActual === 'mikrotikRouters' && (
                            <MikrotikPageInterno />
                        )}
                        {vistaActual === 'administracion' && (
                            <AdminIspPageInterno
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirAdministracion={() => setVistaActual('PlanInternet')}
                                onAbrirClientes={() => setVistaActual('Clientes')}
                                onAbrirImportarclientes={() => setVistaActual('ImportarClientes')}
                            />
                        )}
                        {vistaActual === 'PlanInternet' && (
                            <PlanesInternetPage />
                        )}
                        {vistaActual === 'Clientes' && (
                            <ClientesInterno />
                        )}
                        {vistaActual === 'ImportarClientes' && (
                            <ImportarClientesInterno />
                        )}
                        {vistaActual === 'contratosServicios' && (
                            <ContratosServiciosPage />
                        )}
                        {vistaActual === 'infraestructura' && (
                            <InfraestructuraPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirtorre={() => setVistaActual('torre')}
                                onAbrirsectorial={() => setVistaActual('sectorial')}
                                onAbrirnodofibra={() => setVistaActual('nodofibra')}
                                onAbrirNapSplitter={() => setVistaActual('NapSplitter')}
                            />
                        )}
                        {vistaActual === 'torre' && (
                            <TorresWispPage />
                        )}
                        {vistaActual === 'sectorial' && (
                            <SectorialesWispPage />
                        )}
                        {vistaActual === 'nodofibra' && (
                            <NodosFibraPage />
                        )}
                        {vistaActual === 'NapSplitter' && (
                            <NapSplitterPage />
                        )}


                    </div>
                </section>
            </div>
        </main>
    );
}

function MenuItem({
    label,
    href,
    active = false,
    onClick,
}: {
    label: string;
    href?: string;
    active?: boolean;
    onClick?: () => void;
}) {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => {
                if (onClick) {
                    onClick();
                    return;
                }

                if (href) {
                    router.push(href);
                }
            }}
            className={`w-full text-left rounded-xl px-4 py-3 font-bold transition ${active
                ? 'bg-blue-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
        >
            {label}
        </button>
    );
}
function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-900/95 p-5 shadow-lg shadow-cyan-500/10 border border-cyan-500/25">
            <p className="text-sm font-bold text-cyan-200/70">{title}</p>
            <h3 className="text-3xl font-black text-cyan-400 mt-2">{value}</h3>
        </div>
    );
}

