// app/infraestructura/wireless/alertas-criticas/page.tsx
"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useState } from "react";


type AlertaWireless = {
    id: number;
    equipoId?: string;
    nombreEquipo?: string;
    ipGestion?: string;
    tipoEquipo?: string;
    severidad?: string;
    titulo?: string;
    mensaje?: string;
    estado?: string;
    fechaCreacion?: string;
};

export default function AlertasCriticasWirelessPage() {
    const [alertas, setAlertas] = useState<AlertaWireless[]>([]);
    const [loading, setLoading] = useState(true);

    async function cargarAlertasCriticas() {
        try {
            setLoading(true);

            const token = getToken();

            const res = await fetch(`${API_BASE}/notificaciones-sistema/alertas/criticas`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            const lista = Array.isArray(data.datos) ? data.datos : [];
            setAlertas(lista);
        } catch (error) {
            console.error("Error cargando alertas críticas:", error);
            setAlertas([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarAlertasCriticas();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="flex items-center justify-between mb-6">


                <button
                    onClick={cargarAlertasCriticas}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold"
                >
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="text-slate-400">Cargando alertas críticas...</div>
            ) : alertas.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-300">
                    No hay alertas críticas por el momento.
                </div>
            ) : (
                <div className="grid gap-4">
                    {alertas.map((alerta) => (
                        <div
                            key={alerta.id}
                            className="rounded-2xl border border-red-500/40 bg-red-950/30 p-5 shadow-lg shadow-red-900/20"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-bold text-red-300">
                                    {alerta.titulo || "Alerta crítica"}
                                </h2>

                                <span className="text-xs bg-red-600 px-3 py-1 rounded-full font-bold">
                                    CRÍTICA
                                </span>
                            </div>

                            <p className="text-sm text-slate-300 mb-3">
                                {alerta.mensaje || "Sin descripción"}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-500">Equipo</p>
                                    <p className="font-semibold">
                                        {alerta.nombreEquipo || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">IP</p>
                                    <p className="font-semibold text-cyan-300">
                                        {alerta.ipGestion || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Tipo</p>
                                    <p className="font-semibold">
                                        {alerta.tipoEquipo || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Estado</p>
                                    <p className="font-semibold">
                                        {alerta.estado || "-"}
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 mt-3">
                                Fecha:{" "}
                                {alerta.fechaCreacion
                                    ? new Date(alerta.fechaCreacion).toLocaleString()
                                    : "-"}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}