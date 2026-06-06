// components/MapaNeuronalMantenimientos.tsx
'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type TicketNeurona = {
    ticketId: string;
    codigoTicket: string;
    titulo: string;
    clienteNombre?: string;
    estadoTicket: string;
    estadoAtencion?: string;
    tecnicoNombre?: string;
    fechaCreacion?: string;
    descripcion?: string;
};

type Props = {
    tecnicoId: string;
};

export default function MapaNeuronalMantenimientos({ tecnicoId }: Props) {
    const [tickets, setTickets] = useState<TicketNeurona[]>([]);
    const [cargando, setCargando] = useState(true);
    const [seleccionado, setSeleccionado] = useState<TicketNeurona | null>(null);

    const colorEstado = (estado?: string) => {
        // Resuelto
        if (estado === 'RESUELTO' || estado === 'SOLUCIONADO')
            return 'bg-emerald-400';

        // En proceso
        if (estado === 'EN_PROCESO' || estado === 'EN_DOMICILIO')
            return 'bg-blue-400';

        // Esperando cliente = Amarillo
        if (estado === 'ESPERANDO_CLIENTE')
            return 'bg-yellow-400';

        // Cancelado = Naranja
        if (estado === 'CANCELADO')
            return 'bg-orange-500';

        // Cerrado
        if (estado === 'CERRADO')
            return 'bg-slate-400';

        // Abierto / Asignado
        if (estado === 'ABIERTO' || estado === 'ASIGNADO')
            return 'bg-cyan-400';

        return 'bg-purple-400';
    };

    useEffect(() => {
        if (!tecnicoId) return;

        const cargarTrabajosTecnico = async () => {
            try {
                setCargando(true);

                const token = getToken();

                const res = await fetch(
                    `${API_BASE}/soporte/tecnicos/${tecnicoId}/trabajos-neuronal`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data?.mensaje || 'Error cargando trabajos del técnico');
                }

                setTickets(data.trabajos || []);
            } catch (error) {
                console.error('Error cargando trabajos técnico:', error);
                setTickets([]);
            } finally {
                setCargando(false);
            }
        };

        cargarTrabajosTecnico();
    }, [tecnicoId]);

    if (cargando) {
        return (
            <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 text-slate-400">
                Cargando mapa neuronal...
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-[650px] rounded-3xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.20),transparent_55%)]" />

            {tickets.length === 0 && (
                <div className="relative z-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-400">
                    Este técnico todavía no tiene mantenimientos asignados o realizados.
                </div>
            )}

            {tickets.length > 0 && (
                <div className="relative z-10 w-full h-[560px] overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                        <defs>
                            <linearGradient id="lineaNeuronal" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#60a5fa" />
                                <stop offset="50%" stopColor="#22d3ee" />
                                <stop offset="100%" stopColor="#34d399" />
                            </linearGradient>
                        </defs>

                        {tickets.map((_, index) => {
                            if (index === 0) return null;

                            const getPosicion = (i: number) => {
                                const nivel = Math.floor(Math.log2(i + 1));
                                const inicioNivel = Math.pow(2, nivel) - 1;
                                const posicionNivel = i - inicioNivel;
                                const nodosNivel = Math.pow(2, nivel);

                                const x = ((posicionNivel + 1) / (nodosNivel + 1)) * 100;
                                const y = 10 + nivel * 20;

                                return { x, y };
                            };

                            const padreIndex = Math.floor((index - 1) / 2);

                            const padre = getPosicion(padreIndex);
                            const hijo = getPosicion(index);

                            return (
                                <line
                                    key={index}
                                    x1={`${padre.x}%`}
                                    y1={`${padre.y}%`}
                                    x2={`${hijo.x}%`}
                                    y2={`${hijo.y}%`}
                                    stroke="url(#lineaNeuronal)"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                            );
                        })}
                    </svg>

                    {tickets.map((t, index) => {
                        const nivel = Math.floor(Math.log2(index + 1));
                        const inicioNivel = Math.pow(2, nivel) - 1;
                        const posicionNivel = index - inicioNivel;
                        const nodosNivel = Math.pow(2, nivel);

                        const x = ((posicionNivel + 1) / (nodosNivel + 1)) * 100;
                        const y = 10 + nivel * 20;

                        const estadoVisual = t.estadoAtencion || t.estadoTicket;

                        return (
                            <button
                                key={t.ticketId}
                                type="button"
                                onClick={() => setSeleccionado(t)}
                                className={`absolute group flex items-center justify-center w-8 h-8 rounded-full ${colorEstado(
                                    estadoVisual
                                )} shadow-xl shadow-cyan-500/30 hover:scale-150 transition-all duration-300 border border-white/40`}
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                                title={t.codigoTicket}
                            >
                                <span className="absolute w-16 h-16 rounded-full bg-white/10 animate-ping" />
                                <span className="absolute w-11 h-11 rounded-full border border-white/20" />

                                <span className="relative z-10 text-[10px] font-bold text-white">
                                    {index + 1}
                                </span>

                                <div className="hidden group-hover:block absolute bottom-10 left-1/2 -translate-x-1/2 w-64 rounded-2xl bg-white text-slate-800 text-xs p-3 shadow-2xl z-30">
                                    <b>{t.codigoTicket}</b>
                                    <p className="font-semibold">{t.titulo}</p>
                                    <p className="text-slate-500">{estadoVisual}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {seleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" >
                    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {seleccionado.codigoTicket}
                                </h3>
                                <p className="text-slate-500">{seleccionado.titulo}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSeleccionado(null)}
                                className="text-slate-500 hover:text-red-500 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-slate-700">
                            <p><b>Cliente:</b> {seleccionado.clienteNombre || 'No registrado'}</p>
                            <p><b>Técnico:</b> {seleccionado.tecnicoNombre || 'Sin asignar'}</p>
                            <p><b>Estado ticket:</b> {seleccionado.estadoTicket}</p>
                            <p><b>Estado atención:</b> {seleccionado.estadoAtencion || 'Sin atención'}</p>
                            <p><b>Fecha:</b> {seleccionado.fechaCreacion || 'Sin fecha'}</p>
                            <p><b>Descripción:</b> {seleccionado.descripcion || 'Sin descripción'}</p>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSeleccionado(null)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}