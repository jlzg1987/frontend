'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getToken } from '@/src/lib/api';

export default function FichaTecnicaClientesPage({
    onVolver,
    onAbrirdetalleCliente
}: {
    onVolver: () => void;
    onAbrirdetalleCliente: (servicioId: string) => void;
}) {
    const router = useRouter();
    const [servicios, setServicios] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargarServicios = async () => {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/cliente-servicio`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setServicios(data.servicios || []);
            }
        } catch (error) {
            console.error('Error cargando servicios:', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarServicios();
    }, []);

    if (cargando) {
        return <div className="p-6">Cargando fichas técnicas...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {servicios.map((s) => (
                    <div
                        key={s.servicioId}
                        onClick={() => onAbrirdetalleCliente(s.servicioId)}
                        className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-5 cursor-pointer shadow-lg shadow-cyan-950/30 hover:border-cyan-400/60 hover:shadow-cyan-500/20 transition-all duration-300"
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <img
                                    src={s.fotoPerfil || '/user-default.png'}
                                    className="w-16 h-16 rounded-2xl object-cover border border-cyan-400/40 bg-slate-800"
                                    alt="Cliente"
                                />
                                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-900" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-white truncate">
                                    {s.nombres} {s.apellidos}
                                </h2>

                                <p className="text-xs text-slate-400">
                                    C.I/RUC: {s.cedula || 'No registrado'}
                                </p>

                                <p className="text-xs text-slate-400">
                                    Tel: {s.telefono || 'No registrado'}
                                </p>
                            </div>

                            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300 border border-blue-400/30">
                                {s.estadoServicio}
                            </span>
                        </div>

                        <div className="mt-5 rounded-xl bg-slate-950/60 border border-slate-700/60 p-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-slate-400">Contrato</span>
                                <span className="text-slate-200 font-mono text-xs text-right break-all">
                                    {s.servicioId}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-400">Plan</span>
                                <span className="text-white font-semibold">{s.nombrePlan}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-400">Megas</span>
                                <span className="text-cyan-300 font-bold">
                                    {s.velocidadBajada} / {s.velocidadSubida}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-400">Tipo</span>
                                <span className="text-purple-300 font-semibold">{s.tipoServicio}</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            {s.tecnicoNombre ? (
                                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                                    👨‍🔧 {s.tecnicoNombre} {s.tecnicoApellido}
                                </span>
                            ) : (
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                                    Sin técnico asignado
                                </span>
                            )}

                            <span className="text-xs text-cyan-300 font-semibold group-hover:translate-x-1 transition">
                                Ver ficha →
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}