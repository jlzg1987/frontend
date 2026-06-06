// app/atencion-campo/page.tsx
'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

export default function AtencionCampoPage({
    onVolver,
    onAbrirdetalletickets
}: {
    onVolver: () => void;
    onAbrirdetalletickets: (ticketsId: string) => void;
}) {
    const [tickets, setTickets] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargarTickets = async () => {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setTickets(data.data);
            }
        } catch (error) {
            console.error('Error cargando tickets:', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarTickets();
    }, []);

    if (cargando) {
        return <div className="p-6">Cargando atención en campo...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {tickets.map((t) => (
                    <div
                        key={t.ticketId}
                        onClick={() => {
                            onAbrirdetalletickets(t.ticketId);
                        }}
                        className="
                    group relative overflow-hidden cursor-pointer
                    rounded-3xl border border-cyan-500/20
                    bg-gradient-to-br from-[#071428] via-[#0b1b33] to-[#020617]
                    p-5 shadow-[0_0_25px_rgba(6,182,212,0.12)]
                    hover:border-cyan-400/60
                    hover:shadow-[0_0_35px_rgba(6,182,212,0.28)]
                    transition-all duration-300
                "
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition" />

                        <div className="relative flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img
                                        src={t.clienteFoto || '/img/user-default.png'}
                                        className="w-16 h-16 rounded-2xl object-cover border border-cyan-400/40 bg-slate-800"
                                    />

                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#071428]" />
                                </div>

                                <div>
                                    <h2 className="font-bold text-white leading-tight">
                                        {t.clienteNombre || 'Cliente sin nombre'}
                                    </h2>

                                    <p className="text-sm text-slate-300">
                                        {t.clienteCelular || 'Sin celular'}
                                    </p>

                                    <p className="text-xs text-cyan-300 mt-1">
                                        {t.codigoTicket || 'Sin ticket'}
                                    </p>
                                </div>
                            </div>

                            <span
                                className={`
                            px-3 py-1 rounded-full text-xs font-bold
                            ${t.prioridad === 'CRITICA'
                                        ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                                        : t.prioridad === 'ALTA'
                                            ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                                            : t.prioridad === 'MEDIA'
                                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                    }
                        `}
                            >
                                {t.prioridad || 'BAJA'}
                            </span>
                        </div>

                        <div className="relative mt-5 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                <p className="text-slate-400 text-xs">Categoría</p>
                                <p className="text-white font-semibold truncate">
                                    {t.categoria || 'Sin categoría'}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                <p className="text-slate-400 text-xs">Estado</p>
                                <span className="inline-block mt-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                                    {t.estado || 'SIN ESTADO'}
                                </span>
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                <p className="text-slate-400 text-xs">Técnico</p>
                                <p className="text-white font-semibold truncate">
                                    {t.tecnicoNombre || 'Sin asignar'}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                                <p className="text-slate-400 text-xs">Ubicación</p>
                                <p className="text-white font-semibold truncate">
                                    {t.clienteDireccion || 'Sin dirección'}
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-5 flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-400">
                                Click para abrir ficha técnica
                            </div>

                            <button
                                type="button"
                                className="
                            px-4 py-2 rounded-xl
                            bg-cyan-500/20 text-cyan-200
                            border border-cyan-400/30
                            text-sm font-bold
                            group-hover:bg-cyan-500
                            group-hover:text-white
                            transition
                        "
                            >
                                Ver ficha →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}