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
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Mis reportes
                    </h1>
                    <p className="text-slate-500">
                        Reportes enviados por administración.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {reportes.map((r) => (
                        <button
                            key={r.reporteId}
                            onClick={() => abrirReporte(r)}
                            className="text-left bg-white rounded-3xl shadow p-5 hover:shadow-xl transition relative"
                        >
                            {!r.leido && (
                                <span className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    Nuevo
                                </span>
                            )}

                            <span className={`text-xs px-3 py-1 rounded-full ${colorTipo(r.tipoReporte)}`}>
                                {r.tipoReporte}
                            </span>

                            <h2 className="font-bold text-xl mt-4 text-slate-900">
                                {r.titulo}
                            </h2>

                            <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                                {r.descripcion}
                            </p>

                            {r.monto && (
                                <p className="mt-4 text-emerald-600 font-bold text-lg">
                                    ${Number(r.monto).toFixed(2)}
                                </p>
                            )}

                            <p className="text-xs text-slate-400 mt-4">
                                Creado por: {r.creadoPorNombre || 'Administración'}
                            </p>
                        </button>
                    ))}

                    {reportes.length === 0 && (
                        <div className="bg-white rounded-3xl shadow p-6 text-slate-500">
                            No tienes reportes publicados.
                        </div>
                    )}
                </div>

                {seleccionado && (
                    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`text-xs px-3 py-1 rounded-full ${colorTipo(seleccionado.tipoReporte)}`}>
                                        {seleccionado.tipoReporte}
                                    </span>

                                    <h2 className="text-2xl font-bold mt-3">
                                        {seleccionado.titulo}
                                    </h2>
                                </div>

                                <button
                                    onClick={() => setSeleccionado(null)}
                                    className="text-xl text-slate-500 hover:text-red-500"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-3 text-slate-700">
                                <p>{seleccionado.descripcion}</p>

                                {seleccionado.monto && (
                                    <p>
                                        <b>Monto:</b> ${Number(seleccionado.monto).toFixed(2)}
                                    </p>
                                )}

                                <p>
                                    <b>Periodo:</b>{' '}
                                    {seleccionado.periodoInicio || 'N/A'} - {seleccionado.periodoFin || 'N/A'}
                                </p>

                                <p>
                                    <b>Creado por:</b>{' '}
                                    {seleccionado.creadoPorNombre || 'Administración'}
                                </p>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
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
        </div>
    );
}