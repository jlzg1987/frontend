'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type Ticket = {
    ticketId: string;
    codigoTicket?: string;
    titulo?: string;
    descripcion?: string;
    clienteNombre?: string;
    clienteId?: string;
    clienteCedula?: string;
    clienteFoto?: string;
    clienteDireccion?: string;

    estado?: string;
    prioridad?: string;
    tecnicoId?: number | null;
    tecnicoNombre?: string | null;
    fechaRegistro?: string;
    direccion?: string;
    fechaCreacion?: string;
    createdAt?: string;
    created_at?: string;
    tecnicoAsignadoId?: string | null;
};

export default function ListadoTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    const cargarTickets = async () => {
        try {
            setCargando(true);
            setError('');

            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error cargando tickets');
            }
            setTickets(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.data)
                        ? data.data
                        : []
            );
            console.table(data.data);
            console.log(data.data[0]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    const asignarmeTicket = async (ticketId: string) => {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets/${ticketId}/asignar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ asignarme: true }),
            });

            const data = await res.json();
            console.log('Respuesta asignar:', data);

            if (!res.ok) {
                throw new Error(data.message || 'No se pudo asignar el ticket');
            }

            alert('Ticket asignado correctamente');
            await cargarTickets();
        } catch (err: any) {
            alert(err.message);
        }
    };

    useEffect(() => {
        cargarTickets();
    }, []);
    const formatearFecha = (fecha?: string) => {
        if (!fecha) return 'Sin fecha de creación';

        const f = new Date(fecha);

        if (isNaN(f.getTime())) return 'Fecha inválida';

        return f.toLocaleString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const ticketsDisponibles = tickets.filter(t => !t.tecnicoAsignadoId);
    return (
        <div className="p-6 space-y-6">


            {cargando && (
                <div className="bg-white rounded-xl shadow p-6">
                    Cargando tickets...
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 rounded-xl p-4">
                    {error}
                </div>
            )}

            {!cargando && ticketsDisponibles.length === 0 && (
                <div className="bg-white rounded-xl shadow p-6 text-slate-500">
                    No hay tickets disponibles.
                </div>
            )}

            <div className="grid gap-4">
                {ticketsDisponibles.map((t) => (
                    <div
                        key={t.ticketId}
                        className="bg-white rounded-2xl shadow border border-slate-100 p-5"
                    >
                        <div className="flex justify-between gap-4">
                            <div className="flex-shrink-0">
                                {t.clienteFoto ? (
                                    <img
                                        src={t.clienteFoto}
                                        alt={t.clienteNombre}
                                        className="w-16 h-16 rounded-full object-cover border"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                        {(t.clienteNombre || 'CL').substring(0, 1)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    #{t.codigoTicket || t.ticketId} - {t.titulo || 'Ticket técnico'}
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Cliente: {t.clienteNombre}

                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Cédula: {t.clienteCedula || t.clienteId}

                                </p>
                                <p className="text-sm text-slate-500">
                                    📍 {t.clienteDireccion}
                                </p>
                                <p className="text-sm text-slate-600 mt-3">
                                    {t.descripcion || 'Sin descripción'}
                                </p>

                                {t.direccion && (
                                    <p className="text-sm text-slate-500 mt-2">
                                        📍 {t.direccion}
                                    </p>
                                )}
                            </div>

                            <div className="text-right space-y-2">
                                <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                                    {t.estado || 'PENDIENTE'}
                                </span>

                                <br />

                                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                    {t.prioridad || 'NORMAL'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-5 border-t pt-4">
                            <p className="text-xs text-slate-500">
                                Creado: {formatearFecha(
                                    t.fechaCreacion ||
                                    t.fechaRegistro ||
                                    t.createdAt ||
                                    t.created_at
                                )}
                            </p>
                            {!t.tecnicoAsignadoId ? (
                                <button
                                    onClick={() => asignarmeTicket(t.ticketId)}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                                >
                                    Asignármelo
                                </button>
                            ) : (
                                <span className="text-sm text-slate-500">
                                    Asignado a {t.tecnicoNombre || 'técnico'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}