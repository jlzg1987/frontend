"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useState } from "react";

type Props = {
    titulo: string;
    endpoint: string;
};

export default function WirelessListadoPage({ titulo, endpoint }: Props) {
    const [equipos, setEquipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    async function cargar() {
        setLoading(true);

        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setEquipos(data.datos || []);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargar();
    }, []);

    return (
        <div className="p-6 text-white">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold">{titulo}</h1>

                <button
                    onClick={cargar}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
                >
                    Actualizar
                </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900">
                <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-slate-300">
                        <tr>
                            <th className="p-3 text-left">Nombre</th>
                            <th className="p-3 text-left">IP</th>
                            <th className="p-3 text-left">Marca</th>
                            <th className="p-3 text-left">Modelo</th>
                            <th className="p-3 text-left">Tipo</th>
                            <th className="p-3 text-left">Estado</th>
                            <th className="p-3 text-left">Ping</th>
                            <th className="p-3 text-left">Última lectura</th>
                        </tr>
                    </thead>

                    <tbody>
                        {equipos.map((e) => (
                            <tr key={e.equipoId} className="border-t border-slate-700">
                                <td className="p-3 font-semibold">
                                    {e.nombre || e.nombreEquipo || "-"}
                                </td>

                                <td className="p-3 text-cyan-400">
                                    {e.ipGestion || "-"}
                                </td>

                                <td className="p-3">{e.marca || "-"}</td>
                                <td className="p-3">{e.modelo || "-"}</td>
                                <td className="p-3">{e.tipoEquipo || "-"}</td>

                                <td className="p-3">
                                    <span
                                        className={
                                            e.ultimoEstado === "ONLINE"
                                                ? "text-green-400 font-bold"
                                                : e.ultimoEstado === "OFFLINE"
                                                    ? "text-red-400 font-bold"
                                                    : "text-yellow-400 font-bold"
                                        }
                                    >
                                        {e.ultimoEstado || "DESCONOCIDO"}
                                    </span>
                                </td>

                                <td className="p-3">
                                    {e.ultimoPingMs !== null && e.ultimoPingMs !== undefined
                                        ? `${Number(e.ultimoPingMs).toFixed(1)} ms`
                                        : "-"}
                                </td>

                                <td className="p-3 text-slate-400">
                                    {e.ultimaLectura || "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!loading && equipos.length === 0 && (
                    <div className="p-6 text-center text-slate-400">
                        No hay equipos registrados.
                    </div>
                )}
            </div>
        </div>
    );
}