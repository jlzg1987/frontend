"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useMemo, useState } from "react";



type ResultadoMonitoreo = {
    ok: boolean;
    equipoId: string;
    nuevoEstado?: string;
    equipo?: {
        nombre: string;
        tipoEquipo: string;
        ipGestion: string;
        nodoAgent: string;
    };
    resultado?: {
        online: boolean;
        estado: string;
        sshOk: boolean;
        pingPromedioMs: number | null;
        recibidos: number;
        perdidos: number;
        modo: string;
    };
    mensaje?: string;
};

export default function WirelessMonitoreoProPage() {
    const [resultados, setResultados] = useState<ResultadoMonitoreo[]>([]);
    const [cargando, setCargando] = useState(false);
    const [auto, setAuto] = useState(false);
    const [ultimaRevision, setUltimaRevision] = useState<string | null>(null);
    const [error, setError] = useState("");

    const token = getToken();

    async function ejecutarMonitoreo() {
        try {
            setCargando(true);
            setError("");

            const res = await fetch(
                `${API_BASE}/wireless-monitoreo/equipos/revisar-todos`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(data.mensaje || "Error ejecutando monitoreo");
            }

            setResultados(data.resultados || []);
            setUltimaRevision(new Date().toLocaleString());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        ejecutarMonitoreo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!auto) return;

        const interval = setInterval(() => {
            ejecutarMonitoreo();
        }, 60000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auto]);

    const resumen = useMemo(() => {
        const total = resultados.length;

        const online = resultados.filter(
            (r) => r.nuevoEstado === "ONLINE"
        ).length;

        const offline = resultados.filter(
            (r) => r.nuevoEstado === "OFFLINE"
        ).length;

        const pingAlto = resultados.filter(
            (r) => r.nuevoEstado === "PING_ALTO"
        ).length;

        const sshFalla = resultados.filter(
            (r) => r.nuevoEstado === "SSH_FALLA"
        ).length;

        return {
            total,
            online,
            offline,
            pingAlto,
            sshFalla,
        };
    }, [resultados]);

    function estadoColor(estado?: string) {
        if (estado === "ONLINE") return "text-green-400 bg-green-500/10 border-green-500/40";
        if (estado === "OFFLINE") return "text-red-400 bg-red-500/10 border-red-500/40";
        if (estado === "PING_ALTO") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/40";
        if (estado === "SSH_FALLA") return "text-orange-400 bg-orange-500/10 border-orange-500/40";
        return "text-slate-400 bg-slate-500/10 border-slate-500/40";
    }

    return (
        <div className="p-6 text-white space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div>

                    {ultimaRevision && (
                        <p className="text-xs text-slate-500 mt-1">
                            Última revisión: {ultimaRevision}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setAuto(!auto)}
                        className={
                            auto
                                ? "bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 font-semibold"
                                : "bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2 font-semibold"
                        }
                    >
                        {auto ? "Auto ON 60s" : "Auto OFF"}
                    </button>

                    <button
                        onClick={ejecutarMonitoreo}
                        disabled={cargando}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl px-4 py-2 font-semibold"
                    >
                        {cargando ? "Revisando..." : "Revisar ahora"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-3xl font-bold">{resumen.total}</p>
                </div>

                <div className="rounded-2xl border border-green-700/40 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Online</p>
                    <p className="text-3xl font-bold text-green-400">{resumen.online}</p>
                </div>

                <div className="rounded-2xl border border-red-700/40 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Offline</p>
                    <p className="text-3xl font-bold text-red-400">{resumen.offline}</p>
                </div>

                <div className="rounded-2xl border border-yellow-700/40 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Ping alto</p>
                    <p className="text-3xl font-bold text-yellow-400">{resumen.pingAlto}</p>
                </div>

                <div className="rounded-2xl border border-orange-700/40 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">SSH falla</p>
                    <p className="text-3xl font-bold text-orange-400">{resumen.sshFalla}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="font-bold">Resultado de monitoreo</h2>
                    {cargando && (
                        <span className="text-xs text-blue-400">
                            Consultando agent...
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-slate-300">
                            <tr>
                                <th className="text-left p-3">Equipo</th>
                                <th className="text-left p-3">Nodo</th>
                                <th className="text-left p-3">Estado</th>
                                <th className="text-left p-3">Ping</th>
                                <th className="text-left p-3">SSH</th>
                                <th className="text-left p-3">Paquetes</th>
                                <th className="text-left p-3">Modo</th>
                                <th className="text-left p-3">Mensaje</th>
                            </tr>
                        </thead>

                        <tbody>
                            {resultados.map((r, index) => (
                                <tr
                                    key={r.equipoId || index}
                                    className="border-t border-slate-800 hover:bg-slate-800/60"
                                >
                                    <td className="p-3">
                                        <p className="font-semibold">
                                            {r.equipo?.nombre || r.equipoId}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {r.equipo?.ipGestion || "-"} · {r.equipo?.tipoEquipo || "-"}
                                        </p>
                                    </td>

                                    <td className="p-3 text-slate-300">
                                        {r.equipo?.nodoAgent || "-"}
                                    </td>

                                    <td className="p-3">
                                        <span className={`border rounded-full px-3 py-1 text-xs font-bold ${estadoColor(r.nuevoEstado)}`}>
                                            {r.nuevoEstado || "ERROR"}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        {r.resultado?.pingPromedioMs != null
                                            ? `${Number(r.resultado.pingPromedioMs).toFixed(2)} ms`
                                            : "-"}
                                    </td>

                                    <td className="p-3">
                                        {r.resultado?.sshOk === true && (
                                            <span className="text-green-400 font-bold">OK</span>
                                        )}

                                        {r.resultado?.sshOk === false && (
                                            <span className="text-red-400 font-bold">FALLA</span>
                                        )}

                                        {r.resultado?.sshOk === undefined && "-"}
                                    </td>

                                    <td className="p-3 text-slate-300">
                                        {r.resultado
                                            ? `${r.resultado.recibidos ?? 0} / ${(r.resultado.recibidos ?? 0) + (r.resultado.perdidos ?? 0)}`
                                            : "-"}
                                    </td>

                                    <td className="p-3 text-slate-400">
                                        {r.resultado?.modo || "-"}
                                    </td>

                                    <td className="p-3 text-slate-400 max-w-[320px]">
                                        <p className="line-clamp-2">
                                            {r.mensaje || r.resultado?.estado || "-"}
                                        </p>
                                    </td>
                                </tr>
                            ))}

                            {!cargando && resultados.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        No hay resultados todavía.
                                    </td>
                                </tr>
                            )}

                            {cargando && resultados.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        Ejecutando monitoreo...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}