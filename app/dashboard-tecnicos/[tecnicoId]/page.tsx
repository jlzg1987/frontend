'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getToken } from '@/src/lib/api';
import { Router } from 'next/router';

export default function DetalleTecnicoPage({
    tecnicoId,
    onVolver,
}: {
    tecnicoId: string;
    onVolver: () => void;
}) {

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const cargarDetalle = async () => {
        try {
            setLoading(true);
            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets/dashboard/tecnicos/${tecnicoId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Error cargando detalle técnico:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tecnicoId) cargarDetalle();
    }, [tecnicoId]);

    if (loading) {
        return <div className="p-8 text-slate-500">Cargando detalle del técnico...</div>;
    }

    if (!data?.ok) {
        return <div className="p-8 text-red-600">No se pudo cargar el técnico.</div>;
    }

    const tecnico = data.tecnico;
    const resumen = data.resumen;
    const ubicacionActual = data.ubicaciones?.[0];

    return (
        <div className="space-y-6">

            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-6 text-white shadow">

                <div className="flex flex-col md:flex-row justify-between gap-5">

                    <div className="flex items-center gap-4">

                        {tecnico.fotoPerfil ? (
                            <img
                                src={tecnico.fotoPerfil}
                                alt=""
                                className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30" />
                        )}

                        <div>
                            <h1 className="text-3xl font-black">
                                {tecnico.nombres} {tecnico.apellidos}
                            </h1>

                            <p className="text-cyan-200">
                                {tecnico.especialidad || 'Técnico'}
                            </p>

                            <p className="text-sm text-slate-300">
                                Zona: {tecnico.zonaTrabajo || '-'}
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={cargarDetalle}
                        className="bg-white text-slate-900 px-5 py-3 rounded-xl font-bold h-fit"
                    >
                        Actualizar
                    </button>

                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

                <Card titulo="Total" valor={resumen.totalTickets} color="text-slate-800" />
                <Card titulo="Abiertos" valor={resumen.abiertos} color="text-blue-600" />
                <Card titulo="Proceso" valor={resumen.enProceso} color="text-yellow-600" />
                <Card titulo="Esperando" valor={resumen.esperandoCliente} color="text-purple-600" />
                <Card titulo="Resueltos" valor={resumen.resueltos} color="text-emerald-600" />
                <Card titulo="Críticos" valor={resumen.criticosPendientes} color="text-red-600" />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="bg-white rounded-3xl border shadow-sm p-6 lg:col-span-1">

                    <h2 className="text-xl font-bold mb-4">
                        Información del técnico
                    </h2>

                    <Info label="Email" value={tecnico.email} />
                    <Info label="Teléfono" value={tecnico.telefono} />
                    <Info label="Cédula" value={tecnico.cedula} />
                    <Info label="Emergencia" value={tecnico.telefonoEmergencia} />
                    <Info label="Estado" value={tecnico.estadoTecnico} />

                    <div className="mt-5 p-4 rounded-2xl bg-slate-100">
                        <p className="text-sm text-slate-500">Última ubicación</p>
                        <p className="font-bold text-slate-800">
                            {ubicacionActual?.direccion || 'Sin ubicación registrada'}
                        </p>

                        {ubicacionActual?.lat && ubicacionActual?.lng && (
                            <a
                                target="_blank"
                                href={`https://www.google.com/maps?q=${ubicacionActual.lat},${ubicacionActual.lng}`}
                                className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                            >
                                Ver en mapa
                            </a>
                        )}
                    </div>


                </div>

                <div className="bg-white rounded-3xl border shadow-sm p-6 lg:col-span-2">

                    <h2 className="text-xl font-bold mb-4">
                        Tickets asignados
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-slate-500 text-left">
                                    <th className="py-3">Código</th>
                                    <th>Ticket</th>
                                    <th>Prioridad</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.tickets?.map((t: any) => (
                                    <tr key={t.ticketId} className="border-b hover:bg-slate-50">
                                        <td className="py-4 font-black text-blue-700">
                                            {t.codigoTicket}
                                        </td>

                                        <td>
                                            <p className="font-bold text-slate-800">{t.titulo}</p>
                                            <p className="text-xs text-slate-500 max-w-md truncate">
                                                {t.descripcion}
                                            </p>
                                        </td>

                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgePrioridad(t.prioridad)}`}>
                                                {t.prioridad}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgeEstado(t.estado)}`}>
                                                {t.estado}
                                            </span>
                                        </td>

                                        <td className="text-slate-500">
                                            {t.fechaCreacion
                                                ? new Date(t.fechaCreacion).toLocaleString()
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {data.tickets?.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                Este técnico no tiene tickets asignados.
                            </div>
                        )}
                    </div>

                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white rounded-3xl border shadow-sm p-6">

                    <h2 className="text-xl font-bold mb-4">
                        Historial de atenciones
                    </h2>

                    <div className="space-y-4">
                        {data.atenciones?.map((a: any) => (
                            <div key={a.atencionId} className="border rounded-2xl p-4">
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <p className="font-black text-blue-700">
                                            {a.codigoTicket}
                                        </p>

                                        <p className="font-bold text-slate-800">
                                            {a.titulo}
                                        </p>
                                    </div>

                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold h-fit">
                                        {a.estadoAtencion}
                                    </span>
                                </div>

                                <div className="mt-3 text-sm text-slate-600 space-y-1">
                                    <p><b>Diagnóstico:</b> {a.diagnostico}</p>
                                    <p><b>Solución:</b> {a.solucion || '-'}</p>
                                    <p><b>Observación:</b> {a.observacion || '-'}</p>
                                </div>

                                <p className="mt-3 text-xs text-slate-400">
                                    {a.fechaInicio
                                        ? new Date(a.fechaInicio).toLocaleString()
                                        : '-'}
                                </p>
                            </div>
                        ))}

                        {data.atenciones?.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                No hay atenciones registradas.
                            </div>
                        )}
                    </div>

                </div>

                <div className="bg-white rounded-3xl border shadow-sm p-6">

                    <h2 className="text-xl font-bold mb-4">
                        Últimas ubicaciones
                    </h2>

                    <div className="space-y-3">
                        {data.ubicaciones?.map((u: any) => (
                            <div key={u.ubicacionId} className="border rounded-2xl p-4">
                                <div className="flex justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-slate-800">
                                            {u.direccion || 'Ubicación registrada'}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Lat: {u.lat} | Lng: {u.lng}
                                        </p>
                                    </div>

                                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold h-fit">
                                        {u.origen}
                                    </span>
                                </div>

                                <div className="mt-3 flex justify-between items-center">
                                    <p className="text-xs text-slate-400">
                                        {u.fechaRegistro
                                            ? new Date(u.fechaRegistro).toLocaleString()
                                            : '-'}
                                    </p>

                                    <a
                                        target="_blank"
                                        href={`https://www.google.com/maps?q=${u.lat},${u.lng}`}
                                        className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-semibold"
                                    >
                                        Mapa
                                    </a>
                                </div>
                            </div>
                        ))}

                        {data.ubicaciones?.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                No hay ubicaciones registradas.
                            </div>
                        )}
                    </div>

                </div>

            </div>

        </div>
    );
}

function Card({ titulo, valor, color }: any) {
    return (
        <div className="bg-white rounded-3xl border shadow-sm p-5">
            <div className="text-slate-500 text-sm">{titulo}</div>
            <div className={`text-4xl font-black mt-2 ${color}`}>
                {valor || 0}
            </div>
        </div>
    );
}

function Info({ label, value }: any) {
    return (
        <div className="border-b py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800">{value || '-'}</p>
        </div>
    );
}

function badgePrioridad(prioridad: string) {
    const estilos: any = {
        BAJA: 'bg-slate-100 text-slate-600',
        MEDIA: 'bg-blue-100 text-blue-700',
        ALTA: 'bg-orange-100 text-orange-700',
        CRITICA: 'bg-red-100 text-red-700'
    };

    return estilos[prioridad] || 'bg-slate-100 text-slate-700';
}

function badgeEstado(estado: string) {
    const estilos: any = {
        ABIERTO: 'bg-blue-100 text-blue-700',
        EN_PROCESO: 'bg-yellow-100 text-yellow-700',
        ESPERANDO_CLIENTE: 'bg-purple-100 text-purple-700',
        RESUELTO: 'bg-emerald-100 text-emerald-700',
        CERRADO: 'bg-slate-200 text-slate-700',
        CANCELADO: 'bg-red-100 text-red-700'
    };

    return estilos[estado] || 'bg-slate-100 text-slate-700';
}