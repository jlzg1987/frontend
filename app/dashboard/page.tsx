'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const router = useRouter();
    const [usuario, setUsuario] = useState<any>(null);

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('isp_usuario');

        if (usuarioStorage) {
            try {
                setUsuario(JSON.parse(usuarioStorage));
            } catch {
                setUsuario(null);
            }
        }
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
        usuario?.foto ||
        usuario?.avatar ||
        usuario?.imagen ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreUsuario)}&background=2563eb&color=fff`;


    const cards = [
        {
            title: 'Clientes',
            desc: 'Registrar, buscar y administrar clientes ISP.',
            icon: '👥',
            href: '/clientes',
            color: 'bg-blue-600',
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
            href: '/mikrotik',
            color: 'bg-orange-600',
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

    return (
        <main className="min-h-screen bg-slate-950">
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
                            href="/dashboard"
                            active
                        />

                        <MenuItem
                            label="Clientes"
                            href="/clientes"
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
                            href="/mikrotik"
                        />

                        <MenuItem
                            label="Tickets"
                            href="/tickets"
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
                    <header className="bg-white border-b border-slate-200 px-5 md:px-8 py-5 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">
                                Dashboard principal
                            </h2>
                            <p className="text-slate-500 text-sm">
                                Bienvenido al panel administrativo ISP NetComp RF
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/perfil')}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 hover:bg-slate-100 transition"
                            >
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-black text-slate-900">
                                        {nombreUsuario}
                                    </p>
                                    <p className="text-xs text-slate-500">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                            <StatCard title="Clientes activos" value="0" />
                            <StatCard title="Pagos pendientes" value="0" />
                            <StatCard title="Tickets abiertos" value="0" />
                            <StatCard title="Equipos online" value="0" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {cards.map((item) => (
                                <button
                                    key={item.title}
                                    onClick={() => router.push(item.href)}
                                    className="text-left rounded-3xl bg-white p-6 shadow-xl hover:scale-[1.02] transition border border-slate-100"
                                >
                                    <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                                        {item.icon}
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900">
                                        {item.title}
                                    </h3>

                                    <p className="text-slate-500 mt-2 text-sm leading-6">
                                        {item.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
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
}: {
    label: string;
    href: string;
    active?: boolean;
}) {

    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => router.push(href)}
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
        <div className="rounded-2xl bg-white p-5 shadow-lg border border-slate-100">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{value}</h3>
        </div>
    );
}