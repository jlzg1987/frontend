'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ClipboardList,
    FileBarChart,
    MapPin,
    RadioTower,
    RefreshCw,
    Ticket,
    UserRoundCog,
    UsersRound,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type OpcionSoporte = {
    titulo: string;
    descripcion: string;
    icono: LucideIcon;
    color: string;
    fondoIcono: string;
    colorIcono: string;
    accion:
    | 'TICKETS'
    | 'FICHA_CLIENTES'
    | 'TECNICOS'
    | 'ATENCION_CAMPO'
    | 'MANTENIMIENTOS'
    | 'REPORTES'
    | 'MONITOREO_CLIENTE';
};

const opciones: OpcionSoporte[] = [
    {
        titulo: 'Tickets',
        descripcion:
            'Crear, listar y administrar solicitudes de soporte técnico.',
        icono: Ticket,
        color: 'from-blue-600 to-cyan-500',
        fondoIcono: 'bg-blue-50',
        colorIcono: 'text-blue-600',
        accion: 'TICKETS',
    },
    {
        titulo: 'Ficha Técnica de Clientes',
        descripcion:
            'Consulta información técnica, contratos, equipos y conexión del cliente.',
        icono: ClipboardList,
        color: 'from-indigo-600 to-blue-500',
        fondoIcono: 'bg-indigo-50',
        colorIcono: 'text-indigo-600',
        accion: 'FICHA_CLIENTES',
    },
    {
        titulo: 'Técnicos',
        descripcion:
            'Gestiona técnicos, zonas de trabajo, especialidades y estados.',
        icono: UserRoundCog,
        color: 'from-emerald-600 to-teal-500',
        fondoIcono: 'bg-emerald-50',
        colorIcono: 'text-emerald-600',
        accion: 'TECNICOS',
    },
    {
        titulo: 'Atención en Campo',
        descripcion:
            'Registra visitas, diagnósticos, soluciones y evidencias técnicas.',
        icono: MapPin,
        color: 'from-orange-600 to-amber-500',
        fondoIcono: 'bg-orange-50',
        colorIcono: 'text-orange-600',
        accion: 'ATENCION_CAMPO',
    },
    {
        titulo: 'Mantenimientos',
        descripcion:
            'Controla mantenimientos preventivos y correctivos de la red.',
        icono: Wrench,
        color: 'from-slate-700 to-slate-500',
        fondoIcono: 'bg-slate-100',
        colorIcono: 'text-slate-700',
        accion: 'MANTENIMIENTOS',
    },
    {
        titulo: 'Reportes',
        descripcion:
            'Consulta tickets resueltos, productividad y rendimiento técnico.',
        icono: FileBarChart,
        color: 'from-purple-600 to-pink-500',
        fondoIcono: 'bg-purple-50',
        colorIcono: 'text-purple-600',
        accion: 'REPORTES',
    },
    {
        titulo: 'Monitoreo de cliente',
        descripcion:
            'Analiza consumo, latencia, pérdidas y estabilidad de la conexión en tiempo real.',
        icono: RadioTower,
        color: 'from-cyan-500 via-blue-600 to-indigo-700',
        fondoIcono: 'bg-cyan-50',
        colorIcono: 'text-cyan-600',
        accion: 'MONITOREO_CLIENTE',
    },
];

export default function SoporteTecnicoPage({
    onVolver,
    OpenListadoTickets,
    onAbrirfichatecnico,
    onAbrirfichaCliente,
    onAbrirAtencionCampo,
    onAbrirMantenimiento,
    onAbrirReportes,
    onAbrirMonitoreoCliente,
}: {
    onVolver: () => void;
    OpenListadoTickets: () => void;
    onAbrirfichatecnico: (usuarioId: string) => void;
    onAbrirfichaCliente: () => void;
    onAbrirAtencionCampo: (usuarioId: string) => void;
    onAbrirMantenimiento: (usuarioId: string) => void;
    onAbrirReportes: (usuarioId: string) => void;
    onAbrirMonitoreoCliente: () => void;
}) {
    const [usuario, setUsuario] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    const [resumen, setResumen] = useState({
        ticketsAbiertos: 0,
        enProceso: 0,
        resueltosHoy: 0,
        criticos: 0,
    });

    const cargarResumen = async () => {
        try {
            setCargando(true);

            const token = getToken();

            const res = await fetch(
                `${API_BASE}/cliente-servicio/resumen-soporte`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(
                    data.message ||
                    'No se pudo cargar el resumen de soporte'
                );
            }

            setResumen({
                ticketsAbiertos: Number(
                    data.resumen?.ticketsAbiertos || 0
                ),
                enProceso: Number(
                    data.resumen?.enProceso || 0
                ),
                resueltosHoy: Number(
                    data.resumen?.resueltosHoy || 0
                ),
                criticos: Number(
                    data.resumen?.criticos || 0
                ),
            });
        } catch (error) {
            console.error(
                'Error cargando resumen de soporte:',
                error
            );
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarResumen();
    }, []);

    useEffect(() => {
        const usuarioStorage =
            localStorage.getItem('isp_usuario');

        if (!usuarioStorage) {
            setUsuario(null);
            return;
        }

        try {
            setUsuario(JSON.parse(usuarioStorage));
        } catch {
            setUsuario(null);
        }
    }, []);

    const usuarioId = String(
        usuario?.usuarioId || usuario?.id || ''
    );

    const ejecutarOpcion = (accion: OpcionSoporte['accion']) => {
        switch (accion) {
            case 'TICKETS':
                OpenListadoTickets();
                break;

            case 'FICHA_CLIENTES':
                onAbrirfichaCliente();
                break;

            case 'TECNICOS':
                onAbrirfichatecnico(usuarioId);
                break;

            case 'ATENCION_CAMPO':
                onAbrirAtencionCampo(usuarioId);
                break;

            case 'MANTENIMIENTOS':
                onAbrirMantenimiento(usuarioId);
                break;

            case 'REPORTES':
                onAbrirReportes(usuarioId);
                break;

            case 'MONITOREO_CLIENTE':
                onAbrirMonitoreoCliente();
                break;
        }
    };

    return (
        <div className="space-y-7">
            {/* Encabezado */}


            {/* Resumen */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Resumen
                    titulo="Tickets abiertos"
                    valor={resumen.ticketsAbiertos}
                    icono={Ticket}
                    color="blue"
                />

                <Resumen
                    titulo="En proceso"
                    valor={resumen.enProceso}
                    icono={Activity}
                    color="amber"
                />

                <Resumen
                    titulo="Resueltos hoy"
                    valor={resumen.resueltosHoy}
                    icono={CheckCircle2}
                    color="emerald"
                />

                <Resumen
                    titulo="Críticos"
                    valor={resumen.criticos}
                    icono={AlertTriangle}
                    color="red"
                />
            </div>



            {/* Opciones */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                style={{ marginTop: 40 }}
            >
                {opciones.map((op) => {
                    const Icono = op.icono;
                    const esMonitoreo =
                        op.accion === 'MONITOREO_CLIENTE';

                    return (
                        <button
                            type="button"
                            key={op.titulo}
                            onClick={() =>
                                ejecutarOpcion(op.accion)
                            }
                            className={`group relative overflow-hidden rounded-3xl border text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${esMonitoreo
                                ? 'border-cyan-200 bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950'
                                : 'border-slate-200 bg-white'
                                }`}
                        >
                            <div
                                className={`h-2 bg-gradient-to-r ${op.color}`}
                            />

                            {esMonitoreo && (
                                <>
                                    <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-cyan-400/10 blur-2xl" />

                                    <div className="absolute right-5 top-6 flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-300/20">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                        Tiempo real
                                    </div>
                                </>
                            )}

                            <div className="relative p-6">
                                <div className="flex items-center justify-between">
                                    <div
                                        className={`rounded-2xl p-4 transition duration-300 group-hover:scale-110 ${esMonitoreo
                                            ? 'bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/20'
                                            : `${op.fondoIcono} ${op.colorIcono}`
                                            }`}
                                    >
                                        <Icono className="h-8 w-8" />
                                    </div>

                                    {!esMonitoreo && (
                                        <div className="rounded-full bg-slate-100 p-2 text-slate-400 transition group-hover:bg-blue-600 group-hover:text-white">
                                            <ArrowRight className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>

                                <h2
                                    className={`mt-5 text-xl font-black ${esMonitoreo
                                        ? 'text-white'
                                        : 'text-slate-900'
                                        }`}
                                >
                                    {op.titulo}
                                </h2>

                                <p
                                    className={`mt-2 min-h-12 text-sm leading-relaxed ${esMonitoreo
                                        ? 'text-cyan-100/70'
                                        : 'text-slate-500'
                                        }`}
                                >
                                    {op.descripcion}
                                </p>

                                {esMonitoreo && (
                                    <div className="mt-5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                                            <RadioTower className="h-4 w-4" />
                                            Abrir monitoreo
                                        </div>

                                        <div className="rounded-full bg-cyan-400/15 p-2 text-cyan-300 transition group-hover:translate-x-1">
                                            <ArrowRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Resumen({
    titulo,
    valor,
    icono: Icono,
    color,
}: {
    titulo: string;
    valor: number;
    icono: LucideIcon;
    color: 'blue' | 'amber' | 'emerald' | 'red';
}) {
    const estilos = {
        blue: {
            fondo: 'bg-blue-50',
            icono: 'bg-blue-100 text-blue-700',
            valor: 'text-blue-700',
        },
        amber: {
            fondo: 'bg-blue-50',
            icono: 'bg-amber-100 text-amber-700',
            valor: 'text-amber-700',
        },
        emerald: {
            fondo: 'bg-blue-50',
            icono: 'bg-emerald-100 text-emerald-700',
            valor: 'text-emerald-700',
        },
        red: {
            fondo: 'bg-red-50',
            icono: 'bg-red-100 text-red-700',
            valor: 'text-red-700',
        },
    };

    const estilo = estilos[color];

    return (
        <div
            className={`rounded-3xl border border-slate-200 p-5 shadow-sm ${estilo.fondo}`}
        >
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500">
                        {titulo}
                    </p>

                    <h3
                        className={`mt-2 text-4xl font-black ${estilo.valor}`}
                    >
                        {valor}
                    </h3>
                </div>

                <div
                    className={`rounded-2xl p-3 ${estilo.icono}`}
                >
                    <Icono className="h-7 w-7" />
                </div>
            </div>
        </div>
    );
}