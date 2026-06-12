"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useState } from "react";

type Notificacion = {
    notificacionId: string;
    modulo: string;
    tipo: string;
    nivel: "INFO" | "ADVERTENCIA" | "CRITICA";
    titulo: string;
    mensaje: string | null;
    estado: "NUEVA" | "VISTA" | "RESUELTA";
    total: number;
    creadoEn: string;
};

export default function TodasNotificacionesPage() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);

    const [ordenFecha, setOrdenFecha] = useState<"asc" | "desc">("desc");

    function ordenarPorFecha() {
        const nuevoOrden = ordenFecha === "desc" ? "asc" : "desc";

        const datosOrdenados = [...notificaciones].sort((a, b) => {
            const fechaA = new Date(a.creadoEn).getTime();
            const fechaB = new Date(b.creadoEn).getTime();

            return nuevoOrden === "desc"
                ? fechaB - fechaA
                : fechaA - fechaB;
        });

        setNotificaciones(datosOrdenados);
        setOrdenFecha(nuevoOrden);
    }
    const [ordenEstado, setOrdenEstado] = useState<"asc" | "desc">("asc");

    function ordenarPorEstado() {
        const nuevoOrden =
            ordenEstado === "asc" ? "desc" : "asc";

        const prioridadEstado: Record<string, number> = {
            NUEVA: 1,
            VISTA: 2,
            RESUELTA: 3,
        };

        const datosOrdenados = [...notificaciones].sort((a, b) => {
            const valorA = prioridadEstado[a.estado] || 99;
            const valorB = prioridadEstado[b.estado] || 99;

            return nuevoOrden === "asc"
                ? valorA - valorB
                : valorB - valorA;
        });

        setNotificaciones(datosOrdenados);
        setOrdenEstado(nuevoOrden);
    }


    async function cargarNotificaciones() {
        try {
            setCargando(true);

            const token = getToken();

            const res = await fetch(`${API_BASE}/notificaciones-sistema`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(data.mensaje || "Error cargando notificaciones");
            }

            setNotificaciones(data.datos || []);
        } catch (error) {
            console.error("Error cargando notificaciones:", error);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarNotificaciones();
    }, []);

    return (
        <div className="p-6 text-white">

            {cargando ? (
                <p className="text-slate-400">Cargando notificaciones...</p>
            ) : notificaciones.length === 0 ? (
                <div className="rounded-xl bg-slate-900 border border-slate-700 p-6">
                    <p className="text-slate-400">
                        No hay notificaciones registradas.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-slate-300">
                            <tr>
                                <th
                                    onClick={ordenarPorFecha}
                                    className="p-3 text-left cursor-pointer select-none hover:text-cyan-400"
                                >
                                    Fecha {ordenFecha === "desc" ? "↓" : "↑"}
                                </th>
                                <th className="p-3 text-left">Módulo</th>
                                <th className="p-3 text-left">Nivel</th>
                                <th
                                    onClick={ordenarPorEstado}
                                    className="p-3 text-left cursor-pointer select-none hover:text-cyan-400 w-[100px]"
                                >
                                    Estado {ordenEstado === "asc" ? "↑" : "↓"}
                                </th>
                                <th className="p-3 text-left">Título</th>
                                <th className="p-3 text-left">Mensaje</th>
                                <th className="p-3 text-center">Total</th>
                            </tr>
                        </thead>

                        <tbody>
                            {notificaciones.map((n) => (
                                <tr
                                    key={n.notificacionId}
                                    className="border-t border-slate-700 hover:bg-slate-800/60"
                                >
                                    <td className="p-3 text-slate-400 w-[160px]">
                                        {new Date(n.creadoEn).toLocaleString()}
                                    </td>

                                    <td className="p-3">
                                        {n.modulo}
                                    </td>

                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-bold ${n.nivel === "CRITICA"
                                                ? "bg-red-500/20 text-red-400"
                                                : n.nivel === "ADVERTENCIA"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-cyan-500/20 text-cyan-400"
                                                }`}
                                        >
                                            {n.nivel}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-bold ${n.estado === "NUEVA"
                                                ? "bg-green-500/20 text-green-400"
                                                : n.estado === "VISTA"
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : "bg-slate-500/20 text-slate-300"
                                                }`}
                                        >
                                            {n.estado}
                                        </span>
                                    </td>

                                    <td className="p-3 font-semibold w-[300px]">
                                        {n.titulo}
                                    </td>

                                    <td className="p-3 text-slate-400">
                                        {n.mensaje || "-"}
                                    </td>

                                    <td className="p-3 text-center">
                                        {n.total ?? 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}