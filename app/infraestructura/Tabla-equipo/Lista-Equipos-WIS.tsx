"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useState } from "react";
import WirelessMetricasModal from "../wireless/componentes/WirelessMetricasModal";

type Props = {
    titulo: string;
    endpoint: string;
};

export default function WirelessListadoPage({ titulo, endpoint }: Props) {
    const [equipos, setEquipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalMetricas, setModalMetricas] = useState(false);
    const [equipoMetricasId, setEquipoMetricasId] = useState<string | null>(null);
    const [filtroIp, setFiltroIp] = useState("");

    function abrirMetricas(equipoId: string) {
        setEquipoMetricasId(equipoId);
        setModalMetricas(true);
    }

    const equiposFiltrados = equipos.filter((e) =>
        String(e.ipGestion || "")
            .toLowerCase()
            .includes(filtroIp.toLowerCase())
    );

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

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                    <div>
                        <h1 className="text-2xl font-bold">{titulo}</h1>
                        <p className="text-sm text-slate-400">
                            Total: {equiposFiltrados.length} / {equipos.length}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <input
                            value={filtroIp}
                            onChange={(e) => setFiltroIp(e.target.value)}
                            placeholder="Buscar por IP..."
                            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500"
                        />

                        {filtroIp && (
                            <button
                                onClick={() => setFiltroIp("")}
                                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-semibold"
                            >
                                Limpiar
                            </button>
                        )}

                        <button
                            onClick={cargar}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
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
                            <th className="p-3 text-left">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {equiposFiltrados.map((e) => (
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
                                <td className="p-3">
                                    <button
                                        onClick={() => abrirMetricas(e.equipoId)}
                                        className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded-lg text-xs font-bold"
                                    >
                                        Métricas
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!loading && equiposFiltrados.length === 0 && (
                    <div className="p-6 text-center text-slate-400">
                        No hay equipos registrados.
                    </div>
                )}
                <div className="p-6 text-center text-slate-400">
                    {filtroIp ? "No hay equipos con esa IP." : "No hay equipos registrados."}
                </div>
            </div>
            {modalMetricas && equipoMetricasId && (
                <WirelessMetricasModal
                    equipoId={equipoMetricasId}
                    onClose={() => {
                        setModalMetricas(false);
                        setEquipoMetricasId(null);
                    }}
                />
            )}
        </div>
    );
}