'use client';

import { API_BASE, getToken } from '@/src/lib/api';
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
                    <div className="text-4xl mb-3">📋</div>

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

                <h2 className="text-xl font-bold mb-5">
                    Últimos Tickets
                </h2>

                <div className="space-y-4">

                    {dashboard?.ultimosTickets?.map((t) => (

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

                </div>

            </div>

        </div>
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