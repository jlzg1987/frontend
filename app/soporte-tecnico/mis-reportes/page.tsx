'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type Reporte = {
    reporteId: string;
    tipoReporte: 'PAGO' | 'ATENCION' | 'TECNICO';
    titulo: string;
    descripcion: string;
    monto?: number;
    periodoInicio?: string;
    periodoFin?: string;
    creadoPorNombre?: string;
    leido: number;
    fechaCreacion: string;
};
type Props = {
    tecnicoId: string;
};
export default function MisReportesTecnicoPage({ tecnicoId }: Props) {
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [seleccionado, setSeleccionado] = useState<Reporte | null>(null);

    const cargarReportes = async () => {
        const token = getToken();

        const res = await fetch(`${API_BASE}/reportes-tecnicos/mis-reportes`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setReportes(data.reportes || []);
    };

    useEffect(() => {
        cargarReportes();
    }, []);

    const abrirReporte = async (reporte: Reporte) => {
        setSeleccionado(reporte);

        if (!reporte.leido) {
            const token = getToken();

            await fetch(`${API_BASE}/reportes-tecnicos/${reporte.reporteId}/leido`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            cargarReportes();
        }
    };

    const colorTipo = (tipo: string) => {
        if (tipo === 'PAGO') return 'bg-emerald-100 text-emerald-700';
        if (tipo === 'ATENCION') return 'bg-blue-100 text-blue-700';
        return 'bg-purple-100 text-purple-700';
    };

    return (
        <div className="min-h-screen bg-[#081225] p-6 text-white">
            <div className="max-w-6xl mx-auto space-y-6">


                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {reportes.map((r) => (
                        <button
                            key={r.reporteId}
                            onClick={() => abrirReporte(r)}
                            className="relative text-left rounded-3xl border border-cyan-500/20 bg-[#0d1830]/95 p-5 shadow-2xl hover:border-orange-400/50 hover:scale-[1.02] transition overflow-hidden"
                        >
                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
                            <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-orange-500/20 blur-2xl" />

                            {!r.leido && (
                                <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                                    Nuevo
                                </span>
                            )}

                            <span className={`relative text-xs px-3 py-1 rounded-full border ${r.tipoReporte === 'PAGO'
                                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                                : r.tipoReporte === 'ATENCION'
                                    ? 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                                    : 'bg-violet-500/20 text-violet-200 border-violet-400/30'
                                }`}>
                                {r.tipoReporte}
                            </span>

                            <h2 className="relative font-bold text-xl mt-4 text-white">
                                {r.titulo}
                            </h2>

                            <p className="relative text-sm text-cyan-100 mt-2 line-clamp-3">
                                {r.descripcion}
                            </p>

                            {r.monto && (
                                <p className="relative mt-4 text-emerald-300 font-black text-lg">
                                    ${Number(r.monto).toFixed(2)}
                                </p>
                            )}

                            <p className="relative text-xs text-slate-400 mt-4">
                                Creado por: {r.creadoPorNombre || 'Administración'}
                            </p>
                        </button>
                    ))}

                    {reportes.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-cyan-500/30 bg-[#0d1830]/95 p-8 text-center shadow-2xl">
                            <div className="text-5xl mb-3">📭</div>
                            <p className="text-cyan-100 font-semibold">
                                No tienes reportes publicados.
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                Cuando administración publique uno, aparecerá aquí.
                            </p>
                        </div>
                    )}
                </div>

                {seleccionado && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="relative overflow-hidden w-full max-w-2xl rounded-3xl border border-cyan-500/20 bg-[#0d1830] p-6 shadow-2xl text-white">
                            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
                            <div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />

                            <div className="relative flex justify-between items-start mb-4">
                                <div>
                                    <span className={`text-xs px-3 py-1 rounded-full border ${seleccionado.tipoReporte === 'PAGO'
                                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                                        : seleccionado.tipoReporte === 'ATENCION'
                                            ? 'bg-blue-500/20 text-blue-200 border-blue-400/30'
                                            : 'bg-violet-500/20 text-violet-200 border-violet-400/30'
                                        }`}>
                                        {seleccionado.tipoReporte}
                                    </span>

                                    <h2 className="text-2xl font-black mt-3 text-white">
                                        {seleccionado.titulo}
                                    </h2>
                                </div>

                                <button
                                    onClick={() => setSeleccionado(null)}
                                    className="text-xl text-cyan-200 hover:text-orange-400"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="relative space-y-3 text-cyan-100">
                                <p>{seleccionado.descripcion}</p>

                                {seleccionado.monto && (
                                    <p>
                                        <b className="text-white">Monto:</b>{' '}
                                        <span className="text-emerald-300 font-bold">
                                            ${Number(seleccionado.monto).toFixed(2)}
                                        </span>
                                    </p>
                                )}

                                <p>
                                    <b className="text-white">Periodo:</b>{' '}
                                    {seleccionado.periodoInicio || 'N/A'} - {seleccionado.periodoFin || 'N/A'}
                                </p>

                                <p>
                                    <b className="text-white">Creado por:</b>{' '}
                                    {seleccionado.creadoPorNombre || 'Administración'}
                                </p>
                            </div>

                            <div className="relative mt-6 flex justify-end">
                                <button
                                    onClick={() => setSeleccionado(null)}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-violet-600 to-blue-600 text-white font-bold hover:scale-[1.02] transition"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}