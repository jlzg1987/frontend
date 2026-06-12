"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useMemo, useState } from "react";

type EstadoAlerta = "ABIERTA" | "EN_REVISION" | "ATENDIDA" | "CERRADA";
type NivelAlerta = "INFO" | "ADVERTENCIA" | "CRITICA";

type AlertaWireless = {
    alertaId: string;
    equipoId: string;
    tipo: string;
    nivel: NivelAlerta;
    mensaje: string;
    estado: EstadoAlerta;
    creadoEn: string;
    atendidoEn: string | null;
    equipoNombre: string;
    ipGestion: string;
    tipoEquipo: string;
    ultimoEstado: string;
    ultimoPingMs: number | null;
    ultimaLectura: string | null;
};


export default function AlertasWirelessPage() {
    const [alertas, setAlertas] = useState<AlertaWireless[]>([]);
    const [estadoFiltro, setEstadoFiltro] = useState<string>("ABIERTA");
    const [nivelFiltro, setNivelFiltro] = useState<string>("TODOS");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const token = getToken();

    async function cargarAlertas() {
        try {
            setCargando(true);
            setError("");

            const query =
                estadoFiltro && estadoFiltro !== "TODOS"
                    ? `?estado=${estadoFiltro}`
                    : "";

            const res = await fetch(`${API_BASE}/wireless-alertas${query}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(data.mensaje || "Error cargando alertas");
            }

            setAlertas(data.datos || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

    async function cambiarEstado(alertaId: string, estado: EstadoAlerta) {
        try {
            const res = await fetch(
                `${API_BASE}/wireless-alertas/${alertaId}/estado`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ estado }),
                }
            );

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(data.mensaje || "Error actualizando alerta");
            }

            await cargarAlertas();
        } catch (err: any) {
            alert(err.message);
        }
    }

    useEffect(() => {
        cargarAlertas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estadoFiltro]);

    const alertasFiltradas = useMemo(() => {
        if (nivelFiltro === "TODOS") return alertas;
        return alertas.filter((a) => a.nivel === nivelFiltro);
    }, [alertas, nivelFiltro]);

    const resumen = useMemo(() => {
        return {
            total: alertasFiltradas.length,
            criticas: alertasFiltradas.filter((a) => a.nivel === "CRITICA").length,
            advertencias: alertasFiltradas.filter((a) => a.nivel === "ADVERTENCIA").length,
            info: alertasFiltradas.filter((a) => a.nivel === "INFO").length,
        };
    }, [alertasFiltradas]);

    function claseNivel(nivel: NivelAlerta) {
        if (nivel === "CRITICA") return "bg-red-500/15 text-red-400 border-red-500/40";
        if (nivel === "ADVERTENCIA") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/40";
        return "bg-blue-500/15 text-blue-400 border-blue-500/40";
    }

    function claseEstado(estado: EstadoAlerta) {
        if (estado === "ABIERTA") return "text-red-400";
        if (estado === "EN_REVISION") return "text-yellow-400";
        if (estado === "ATENDIDA") return "text-blue-400";
        return "text-green-400";
    }

    return (
        <div className="p-6 text-white space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">


                <button
                    onClick={cargarAlertas}
                    disabled={cargando}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl px-4 py-2 font-semibold"
                >
                    {cargando ? "Actualizando..." : "Refrescar"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4">
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-2xl font-bold">{resumen.total}</p>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-red-700/40 p-4">
                    <p className="text-sm text-slate-400">Críticas</p>
                    <p className="text-2xl font-bold text-red-400">{resumen.criticas}</p>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-yellow-700/40 p-4">
                    <p className="text-sm text-slate-400">Advertencias</p>
                    <p className="text-2xl font-bold text-yellow-400">{resumen.advertencias}</p>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-blue-700/40 p-4">
                    <p className="text-sm text-slate-400">Info</p>
                    <p className="text-2xl font-bold text-blue-400">{resumen.info}</p>
                </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4 flex flex-col md:flex-row gap-3">
                <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                >
                    <option value="TODOS">Todos los estados</option>
                    <option value="ABIERTA">Abiertas</option>
                    <option value="EN_REVISION">En revisión</option>
                    <option value="ATENDIDA">Atendidas</option>
                    <option value="CERRADA">Cerradas</option>
                </select>

                <select
                    value={nivelFiltro}
                    onChange={(e) => setNivelFiltro(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                >
                    <option value="TODOS">Todos los niveles</option>
                    <option value="CRITICA">Crítica</option>
                    <option value="ADVERTENCIA">Advertencia</option>
                    <option value="INFO">Info</option>
                </select>
            </div>

            {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-4 text-red-300">
                    {error}
                </div>
            )}

            <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-slate-300">
                            <tr>
                                <th className="text-left p-3">Equipo</th>
                                <th className="text-left p-3">Tipo alerta</th>
                                <th className="text-left p-3">Nivel</th>
                                <th className="text-left p-3">Estado</th>
                                <th className="text-left p-3">Ping</th>
                                <th className="text-left p-3">Mensaje</th>
                                <th className="text-left p-3">Fecha</th>
                                <th className="text-right p-3">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {alertasFiltradas.map((a) => (
                                <tr
                                    key={a.alertaId}
                                    className="border-t border-slate-800 hover:bg-slate-800/60"
                                >
                                    <td className="p-3">
                                        <p className="font-semibold">{a.equipoNombre || "Sin nombre"}</p>
                                        <p className="text-xs text-slate-400">
                                            {a.ipGestion} · {a.tipoEquipo}
                                        </p>
                                    </td>

                                    <td className="p-3">
                                        <span className="text-slate-200">{a.tipo}</span>
                                    </td>

                                    <td className="p-3">
                                        <span className={`border rounded-full px-3 py-1 text-xs ${claseNivel(a.nivel)}`}>
                                            {a.nivel}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <span className={`font-bold ${claseEstado(a.estado)}`}>
                                            {a.estado}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        {a.ultimoPingMs !== null ? `${a.ultimoPingMs} ms` : "-"}
                                    </td>

                                    <td className="p-3 max-w-[320px]">
                                        <p className="line-clamp-2 text-slate-300">
                                            {a.mensaje}
                                        </p>
                                    </td>

                                    <td className="p-3 text-slate-400">
                                        {a.creadoEn
                                            ? new Date(a.creadoEn).toLocaleString()
                                            : "-"}
                                    </td>

                                    <td className="p-3">
                                        <div className="flex justify-end gap-2">
                                            {a.estado === "ABIERTA" && (
                                                <button
                                                    onClick={() =>
                                                        cambiarEstado(a.alertaId, "EN_REVISION")
                                                    }
                                                    className="bg-yellow-600 hover:bg-yellow-700 rounded-lg px-3 py-1 text-xs font-semibold"
                                                >
                                                    Revisar
                                                </button>
                                            )}

                                            {a.estado !== "ATENDIDA" && a.estado !== "CERRADA" && (
                                                <button
                                                    onClick={() =>
                                                        cambiarEstado(a.alertaId, "ATENDIDA")
                                                    }
                                                    className="bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1 text-xs font-semibold"
                                                >
                                                    Atendida
                                                </button>
                                            )}

                                            {a.estado !== "CERRADA" && (
                                                <button
                                                    onClick={() =>
                                                        cambiarEstado(a.alertaId, "CERRADA")
                                                    }
                                                    className="bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1 text-xs font-semibold"
                                                >
                                                    Cerrar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!cargando && alertasFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        No hay alertas para mostrar.
                                    </td>
                                </tr>
                            )}

                            {cargando && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        Cargando alertas...
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