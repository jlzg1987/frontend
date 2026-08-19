'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { ClipboardList, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type DashboardResponse = {
    ok: boolean;
    resumen: {
        tecnicosActivos: number;
        ticketsAsignados: number;
        abiertos: number;
        enProceso: number;
        resueltos: number;
        cerrados: number;
        criticosPendientes: number;
    };
    tecnicos: any[];
    ultimosTickets: any[];
};

export default function DashboardTecnicosPage({
    onVolver,
    onAbrirfichatecnico,
    onAbrirReporteAdmin
}: {
    onVolver: () => void;
    onAbrirfichatecnico: (tecnicoId: string) => void;

    onAbrirReporteAdmin: () => void;
}) {
    const router = useRouter();
    const [dashboard, setDashboard] =
        useState<DashboardResponse | null>(null);

    const [loading, setLoading] = useState(true);

    const [busquedaTicket, setBusquedaTicket] = useState('');
    const [estadoTicket, setEstadoTicket] = useState('TODOS');
    const [asignacionTicket, setAsignacionTicket] = useState('TODOS');

    const estadosTickets = Array.from(
        new Set(
            (dashboard?.ultimosTickets || [])
                .map((ticket: any) =>
                    String(ticket.estado || '').trim()
                )
                .filter(Boolean)
        )
    );

    const ticketsFiltrados = (
        dashboard?.ultimosTickets || []
    ).filter((ticket: any) => {
        const textoBusqueda = busquedaTicket
            .trim()
            .toLowerCase();

        const coincideBusqueda =
            !textoBusqueda ||
            String(ticket.codigoTicket || '')
                .toLowerCase()
                .includes(textoBusqueda) ||
            String(ticket.titulo || '')
                .toLowerCase()
                .includes(textoBusqueda) ||
            String(ticket.tecnicoNombre || '')
                .toLowerCase()
                .includes(textoBusqueda);

        const coincideEstado =
            estadoTicket === 'TODOS' ||
            String(ticket.estado || '') === estadoTicket;

        const tieneTecnico = Boolean(
            ticket.tecnicoAsignadoId
        );

        const coincideAsignacion =
            asignacionTicket === 'TODOS' ||
            (
                asignacionTicket === 'ASIGNADOS' &&
                tieneTecnico
            ) ||
            (
                asignacionTicket === 'SIN_ASIGNAR' &&
                !tieneTecnico
            );

        return (
            coincideBusqueda &&
            coincideEstado &&
            coincideAsignacion
        );
    });

    const cargarDashboard = async () => {
        try {
            setLoading(true);

            const token = getToken();

            const res = await fetch(
                `${API_BASE}/tickets/dashboard/tecnicos`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();

            setDashboard(data);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDashboard();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center text-slate-500">
                    Cargando dashboard técnicos...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                <button
                    onClick={cargarDashboard}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
                >
                    Actualizar
                </button>
                <div
                    onClick={() => { onAbrirReporteAdmin(); }}
                    className="cursor-pointer bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl transition"
                >
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 shadow-sm ring-1 ring-blue-600/15">
                        <ClipboardList
                            className="h-8 w-8"
                            strokeWidth={2.2}
                            aria-hidden="true"
                        />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                        Reportes Técnicos
                    </h3>

                    <p className="text-slate-500 mt-2">
                        Crear reportes de pagos, atención y desempeño para técnicos.
                    </p>
                </div>

            </div>

            {/* Cards */}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

                <Card
                    titulo="Técnicos activos"
                    valor={dashboard?.resumen?.tecnicosActivos}
                    color="text-blue-600"
                />

                <Card
                    titulo="Tickets asignados"
                    valor={dashboard?.resumen?.ticketsAsignados}
                    color="text-indigo-600"
                />

                <Card
                    titulo="En proceso"
                    valor={dashboard?.resumen?.enProceso}
                    color="text-yellow-600"
                />

                <Card
                    titulo="Resueltos"
                    valor={dashboard?.resumen?.resueltos}
                    color="text-emerald-600"
                />

                <Card
                    titulo="Críticos"
                    valor={dashboard?.resumen?.criticosPendientes}
                    color="text-red-600"
                />

            </div>

            {/* Tabla técnicos */}

            <div className="bg-white rounded-3xl border shadow-sm p-6">

                <div className="flex justify-between items-center mb-5">

                    <div>
                        <h2 className="text-xl font-bold">
                            Técnicos
                        </h2>

                        <p className="text-slate-500 text-sm">
                            Productividad y estado actual
                        </p>
                    </div>

                </div>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead>

                            <tr className="border-b text-slate-500">

                                <th className="text-left py-3">
                                    Técnico
                                </th>

                                <th className="text-left">
                                    Especialidad
                                </th>

                                <th className="text-left">
                                    Zona
                                </th>

                                <th className="text-center">
                                    Tickets
                                </th>

                                <th className="text-center">
                                    Proceso
                                </th>

                                <th className="text-center">
                                    Resueltos
                                </th>

                                <th className="text-left">
                                    Última ubicación
                                </th>

                                <th className="text-center">
                                    Acción
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {dashboard?.tecnicos?.map((t) => (

                                <tr
                                    key={t.tecnicoId}
                                    className="border-b hover:bg-slate-50"
                                >

                                    <td className="py-4">

                                        <div className="flex items-center gap-3">

                                            {t.fotoPerfil ? (
                                                <img
                                                    src={t.fotoPerfil}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200" />
                                            )}

                                            <div>

                                                <div className="font-bold text-slate-800">
                                                    {t.nombres} {t.apellidos}
                                                </div>

                                                <div className="text-xs text-slate-500">
                                                    {t.email}
                                                </div>

                                            </div>

                                        </div>

                                    </td>

                                    <td>
                                        {t.especialidad || '-'}
                                    </td>

                                    <td>
                                        {t.zonaTrabajo || '-'}
                                    </td>

                                    <td className="text-center font-bold">
                                        {t.totalTickets || 0}
                                    </td>

                                    <td className="text-center">
                                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            {t.enProceso || 0}
                                        </span>
                                    </td>

                                    <td className="text-center">
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            {t.resueltos || 0}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="max-w-xs truncate">
                                            {t.ultimaDireccion || '-'}
                                        </div>
                                    </td>

                                    <td className="text-center">
                                        <button
                                            onClick={() => {
                                                onAbrirfichatecnico(t.tecnicoId);

                                            }}
                                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                                        >
                                            Ver detalle
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* Últimos Tickets */}

            <div className="bg-white rounded-3xl border shadow-sm p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Últimos Tickets
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {ticketsFiltrados.length} de{' '}
                            {dashboard?.ultimosTickets?.length || 0} tickets
                        </p>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
                        {/* Buscador */}
                        <label className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            />

                            <input
                                type="search"
                                value={busquedaTicket}
                                onChange={(event) =>
                                    setBusquedaTicket(event.target.value)
                                }
                                placeholder="Código, título o técnico..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                        </label>

                        {/* Estado */}
                        <select
                            value={estadoTicket}
                            onChange={(event) =>
                                setEstadoTicket(event.target.value)
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        >
                            <option value="TODOS">
                                Todos los estados
                            </option>

                            {estadosTickets.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado.replaceAll('_', ' ')}
                                </option>
                            ))}
                        </select>

                        {/* Técnico asignado */}
                        <select
                            value={asignacionTicket}
                            onChange={(event) =>
                                setAsignacionTicket(event.target.value)
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        >
                            <option value="TODOS">
                                Todos los técnicos
                            </option>

                            <option value="ASIGNADOS">
                                Asignados
                            </option>

                            <option value="SIN_ASIGNAR">
                                Sin asignar
                            </option>
                        </select>
                    </div>
                </div>
                <div className="space-y-4">

                    {ticketsFiltrados.map((t: any) => (

                        <div
                            key={t.ticketId}
                            className="border rounded-2xl p-4 hover:bg-slate-50"
                        >

                            <div className="flex justify-between items-start">

                                <div>

                                    <h3 className="font-bold text-slate-800">
                                        {t.codigoTicket}
                                    </h3>

                                    <p className="text-slate-600">
                                        {t.titulo}
                                    </p>

                                </div>

                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                                    {t.estado}
                                </span>

                            </div>

                            <div className="mt-3 text-sm text-slate-500">

                                Técnico: {t.tecnicoAsignadoId ? (t.tecnicoNombre || 'Técnico asignado') : 'Sin asignar'}

                            </div>

                        </div>

                    ))}

                    {ticketsFiltrados.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                            <p className="font-bold text-slate-700">
                                No se encontraron tickets
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Cambia la búsqueda o selecciona otros filtros.
                            </p>
                        </div>
                    )}

                </div>

            </div>

        </div >
    );
}

function Card({
    titulo,
    valor,
    color
}: any) {
    return (
        <div className="bg-white rounded-3xl border shadow-sm p-5">

            <div className="text-slate-500 text-sm">
                {titulo}
            </div>

            <div
                className={`text-4xl font-black mt-2 ${color}`}
            >
                {valor || 0}
            </div>

        </div>
    );
}