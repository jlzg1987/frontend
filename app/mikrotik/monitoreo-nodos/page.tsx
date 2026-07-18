"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type EquipoMonitoreado = {
    equipoId: string;
    routerId: number;
    nombre: string;
    marca?: string | null;
    modelo?: string | null;
    tipoEquipo: "SECTORIAL" | "ENLACE";
    ipGestion: string;
    ubicacion?: string | null;
    estado?: string | null;
    nombreRouter?: string | null;
    modoMonitoreo?: string;
    nodo?: string | null;
    online: boolean;
    estadoMonitoreo: "ONLINE" | "OFFLINE";
    pingPromedioMs: number | null;
    enviados: number;
    recibidos: number;
    perdidos: number;
    error?: string | null;
    ultimaLectura: string;
};

export default function MonitoreoNodosPage() {
    const [equipos, setEquipos] = useState<EquipoMonitoreado[]>([]);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState("");
    const [tipo, setTipo] = useState<
        "TODOS" | "SECTORIAL" | "ENLACE"
    >("TODOS");
    const [ultimaActualizacion, setUltimaActualizacion] =
        useState<string | null>(null);

    const consultandoRef = useRef(false);

    const cargarMonitoreo = useCallback(async () => {
        if (consultandoRef.current) return;

        consultandoRef.current = true;
        setLoading(true);

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/wireless/monitoreo-nodos`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                    cache: "no-store",
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(
                    data.message ||
                    "Error cargando el monitoreo"
                );
            }

            setEquipos(
                Array.isArray(data.datos)
                    ? data.datos
                    : []
            );

            setUltimaActualizacion(
                data.fechaMonitoreo ||
                new Date().toISOString()
            );

        } catch (error) {
            console.error(
                "Error cargarMonitoreo:",
                error
            );
        } finally {
            setLoading(false);
            consultandoRef.current = false;
        }
    }, []);

    useEffect(() => {
        cargarMonitoreo();

        const intervalo = window.setInterval(() => {
            cargarMonitoreo();
        }, 30000);

        return () => {
            window.clearInterval(intervalo);
        };
    }, [cargarMonitoreo]);

    const equiposFiltrados = useMemo(() => {
        const texto = filtro.trim().toLowerCase();

        return equipos.filter((equipo) => {
            const coincideTipo =
                tipo === "TODOS" ||
                equipo.tipoEquipo === tipo;

            const coincideTexto =
                !texto ||
                String(equipo.nombre || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(equipo.ipGestion || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(equipo.nombreRouter || "")
                    .toLowerCase()
                    .includes(texto);

            return coincideTipo && coincideTexto;
        });
    }, [equipos, filtro, tipo]);

    const totalOnline = equipos.filter(
        (equipo) => equipo.online
    ).length;

    const totalOffline =
        equipos.length - totalOnline;

    const totalSectoriales = equipos.filter(
        (equipo) =>
            equipo.tipoEquipo === "SECTORIAL"
    ).length;

    const totalEnlaces = equipos.filter(
        (equipo) =>
            equipo.tipoEquipo === "ENLACE"
    ).length;

    function mostrarFecha(fecha?: string | null) {
        if (!fecha) return "-";

        return new Date(fecha).toLocaleString(
            "es-EC"
        );
    }

    return (
        <main className="p-6 text-white">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>


                    <p className="mt-1 text-xs text-slate-500">
                        Última actualización:{" "}
                        {mostrarFecha(
                            ultimaActualizacion
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <input
                        value={filtro}
                        onChange={(event) =>
                            setFiltro(event.target.value)
                        }
                        placeholder="Buscar nombre, IP o router..."
                        className="min-w-64 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 outline-none focus:border-cyan-500"
                    />

                    <select
                        value={tipo}
                        onChange={(event) =>
                            setTipo(
                                event.target.value as
                                | "TODOS"
                                | "SECTORIAL"
                                | "ENLACE"
                            )
                        }
                        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 outline-none"
                    >
                        <option value="TODOS">
                            Todos
                        </option>
                        <option value="SECTORIAL">
                            Sectoriales
                        </option>
                        <option value="ENLACE">
                            Enlaces
                        </option>
                    </select>

                    <button
                        onClick={cargarMonitoreo}
                        disabled={loading}
                        className="rounded-xl bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700 disabled:bg-slate-700"
                    >
                        {loading
                            ? "Comprobando..."
                            : "Actualizar"}
                    </button>
                </div>
            </div>

            <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">
                        Total
                    </p>
                    <p className="text-2xl font-black text-cyan-400">
                        {equipos.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-green-900 bg-green-950/40 p-4">
                    <p className="text-xs text-green-300">
                        Online
                    </p>
                    <p className="text-2xl font-black text-green-400">
                        {totalOnline}
                    </p>
                </div>

                <div className="rounded-2xl border border-red-900 bg-red-950/40 p-4">
                    <p className="text-xs text-red-300">
                        Offline
                    </p>
                    <p className="text-2xl font-black text-red-400">
                        {totalOffline}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">
                        Sectoriales
                    </p>
                    <p className="text-2xl font-black">
                        {totalSectoriales}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">
                        Enlaces
                    </p>
                    <p className="text-2xl font-black">
                        {totalEnlaces}
                    </p>
                </div>
            </section>

            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900">
                <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-slate-300">
                        <tr>
                            <th className="p-3 text-left">
                                Estado
                            </th>
                            <th className="p-3 text-left">
                                Nombre
                            </th>
                            <th className="p-3 text-left">
                                IP
                            </th>
                            <th className="p-3 text-left">
                                Tipo
                            </th>
                            <th className="p-3 text-left">
                                Router
                            </th>
                            <th className="p-3 text-left">
                                Ping
                            </th>
                            <th className="p-3 text-left">
                                Pérdida
                            </th>
                            <th className="p-3 text-left">
                                Última lectura
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {equiposFiltrados.map((equipo) => (
                            <tr
                                key={equipo.equipoId}
                                className="border-t border-slate-700"
                            >
                                <td className="p-3">
                                    <span
                                        className={
                                            equipo.online
                                                ? "inline-flex rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white"
                                                : "inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white"
                                        }
                                    >
                                        {equipo.online
                                            ? "ONLINE"
                                            : "OFFLINE"}
                                    </span>
                                </td>

                                <td className="p-3 font-bold">
                                    {equipo.nombre || "-"}
                                </td>

                                <td className="p-3 font-semibold text-cyan-400">
                                    {equipo.ipGestion}
                                </td>

                                <td className="p-3">
                                    {equipo.tipoEquipo}
                                </td>

                                <td className="p-3">
                                    {equipo.nombreRouter ||
                                        "-"}
                                </td>

                                <td className="p-3">
                                    {equipo.pingPromedioMs !==
                                        null
                                        ? `${Number(
                                            equipo.pingPromedioMs
                                        ).toFixed(1)} ms`
                                        : "-"}
                                </td>

                                <td className="p-3">
                                    {equipo.perdidos}/
                                    {equipo.enviados}
                                </td>

                                <td className="p-3 text-slate-400">
                                    {mostrarFecha(
                                        equipo.ultimaLectura
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!loading &&
                    equiposFiltrados.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No existen equipos para mostrar.
                        </div>
                    )}

                {loading && equipos.length === 0 && (
                    <div className="p-8 text-center text-cyan-400">
                        Comprobando nodos...
                    </div>
                )}
            </div>
        </main>
    );
}