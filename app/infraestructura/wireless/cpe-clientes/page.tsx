"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useState } from "react";

export default function CpeClientesPage() {
    const [cpeGuardados, setCpeGuardados] = useState<any[]>([]);
    const [sectoriales, setSectoriales] = useState<any[]>([]);
    const [sectorialId, setSectorialId] = useState("");
    const [clientesDetectados, setClientesDetectados] = useState<any[]>([]);
    const [sectorialSeleccionada, setSectorialSeleccionada] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [escaneando, setEscaneando] = useState(false);
    const [agregandoIp, setAgregandoIp] = useState<string | null>(null);

    async function cargarCpeGuardados() {
        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/wireless/clientes-cpe`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setCpeGuardados(data.datos || []);
            }
        } catch (error) {
            console.error("Error cargando CPE:", error);
        }
    }

    async function cargarSectoriales() {
        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/wireless/sectoriales`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setSectoriales(data.datos || []);
            }
        } catch (error) {
            console.error("Error cargando sectoriales:", error);
        }
    }

    async function cargarTodo() {
        setLoading(true);
        await Promise.all([
            cargarCpeGuardados(),
            cargarSectoriales(),
        ]);
        setLoading(false);
    }

    useEffect(() => {
        cargarTodo();
    }, []);

    async function descubrirClientes() {
        if (!sectorialId) {
            alert("Seleccione una sectorial");
            return;
        }

        try {
            setEscaneando(true);
            setClientesDetectados([]);
            setSectorialSeleccionada(null);

            const res = await fetch(
                `${API_BASE}/wireless/equipos/clientes-cpe/descubrir-sectorial`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        sectorialId,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo descubrir clientes");
                return;
            }

            setClientesDetectados(data.datos || []);
            setSectorialSeleccionada(data.sectorial || null);

        } catch (error) {
            console.error("Error descubrirClientes:", error);
            alert("Error descubriendo clientes CPE");
        } finally {
            setEscaneando(false);
        }
    }

    async function agregarCpe(cliente: any) {
        if (!sectorialSeleccionada) return;

        let ipGestion = cliente.lastip || cliente.remote?.ipaddr?.[0] || "";

        if (!ipGestion || ipGestion === "0.0.0.0") {
            const ipManual = prompt(
                `Este CPE no entregó IP válida.\nIngrese la IP de gestión para:\n${cliente.remote?.hostname || cliente.name || cliente.mac}`
            );

            if (!ipManual) return;

            ipGestion = ipManual.trim();
        }

        const usuarioSsh = prompt(
            `Ingrese usuario SSH para:\n${cliente.remote?.hostname || cliente.name || ipGestion}`
        );

        if (!usuarioSsh) {
            alert("El usuario SSH es obligatorio");
            return;
        }

        const claveSsh = prompt(
            `Ingrese clave SSH para:\n${cliente.remote?.hostname || cliente.name || ipGestion}`
        );

        if (!claveSsh) {
            alert("La clave SSH es obligatoria");
            return;
        }

        const puertoTexto = prompt("Ingrese puerto SSH", "22");
        const puertoSsh = Number(puertoTexto || 22);

        try {
            setAgregandoIp(cliente.mac || ipGestion);

            const res = await fetch(
                `${API_BASE}/wireless/equipos/clientes-cpe/agregar-desde-sectorial`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        routerId: sectorialSeleccionada.routerId,
                        nombre:
                            cliente.remote?.hostname ||
                            cliente.name ||
                            `CPE ${ipGestion}`,
                        ipGestion,
                        mac: cliente.mac || "",
                        modelo:
                            cliente.remote?.platform ||
                            cliente.platform ||
                            "",
                        usuarioSsh: usuarioSsh.trim(),
                        claveSsh: claveSsh.trim(),
                        puertoSsh,
                        ubicacion: `Detectado desde sectorial ${sectorialSeleccionada.nombre}`,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo agregar CPE");
                return;
            }

            alert("CPE agregado correctamente");

            setClientesDetectados((prev) =>
                prev.map((item) =>
                    (item.mac || item.lastip) === (cliente.mac || ipGestion)
                        ? {
                            ...item,
                            lastip: ipGestion,
                            registrado: true,
                            equipoIdRegistrado: data.equipoId,
                        }
                        : item
                )
            );

            cargarCpeGuardados();

        } catch (error) {
            console.error("Error agregarCpe:", error);
            alert("Error agregando CPE");
        } finally {
            setAgregandoIp(null);
        }
    }

    return (
        <div className="p-6 text-white">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold">CPE Clientes</h1>
                    <p className="text-slate-400 text-sm">
                        Clientes guardados y clientes detectados desde sectoriales.
                    </p>
                </div>

                <button
                    onClick={cargarTodo}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
                >
                    Actualizar
                </button>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 mb-6">
                <h2 className="text-lg font-bold mb-4">Buscar clientes por sectorial</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                        value={sectorialId}
                        onChange={(e) => setSectorialId(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 md:col-span-2"
                    >
                        <option value="">Seleccione una sectorial</option>

                        {sectoriales.map((s) => (
                            <option key={s.equipoId} value={s.equipoId}>
                                {s.nombre || s.nombreEquipo} - {s.ipGestion}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={descubrirClientes}
                        disabled={escaneando}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 px-4 py-2 rounded-xl font-bold"
                    >
                        {escaneando ? "Consultando..." : "Ver clientes conectados"}
                    </button>
                </div>
            </div>

            {clientesDetectados.length > 0 && (
                <div className="rounded-2xl border border-cyan-700 bg-slate-900 p-5 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-cyan-400">
                            Clientes detectados
                        </h2>

                        <span className="text-sm text-slate-400">
                            Total: {clientesDetectados.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-slate-300">
                                <tr>
                                    <th className="p-3 text-left">Nombre</th>
                                    <th className="p-3 text-left">IP</th>
                                    <th className="p-3 text-left">MAC</th>
                                    <th className="p-3 text-left">Modelo</th>
                                    <th className="p-3 text-left">Señal</th>
                                    <th className="p-3 text-left">TX/RX</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-right">Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {clientesDetectados.map((c, i) => {
                                    const ip = c.lastip || c.remote?.ipaddr?.[0] || c.mac || "";
                                    const nombre = c.remote?.hostname || c.name || "-";
                                    const modelo = c.remote?.platform || c.platform || "-";

                                    return (
                                        <tr key={`${c.mac}-${i}`} className="border-t border-slate-700">
                                            <td className="p-3 font-semibold">{nombre}</td>
                                            <td className="p-3 text-cyan-400">{ip || "-"}</td>
                                            <td className="p-3">{c.mac || "-"}</td>
                                            <td className="p-3">{modelo}</td>
                                            <td className="p-3 text-green-400 font-bold">
                                                {c.signal || c.remote?.signal || "-"} dBm
                                            </td>
                                            <td className="p-3">
                                                {c.tx || "-"} / {c.rx || "-"} Mbps
                                            </td>
                                            <td className="p-3">
                                                {c.registrado ? (
                                                    <span className="text-green-400 font-bold">
                                                        Registrado
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-400 font-bold">
                                                        Nuevo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                {!c.registrado && (
                                                    <button
                                                        onClick={() => agregarCpe(c)}
                                                        disabled={agregandoIp === ip}
                                                        className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 px-3 py-1 rounded-lg font-bold"
                                                    >
                                                        {agregandoIp === ip ? "Agregando..." : "Agregar CPE"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">CPE registrados</h2>

                    <span className="text-sm text-slate-400">
                        Total: {cpeGuardados.length}
                    </span>
                </div>

                {loading ? (
                    <p className="text-slate-400">Cargando...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-slate-300">
                                <tr>
                                    <th className="p-3 text-left">Nombre</th>
                                    <th className="p-3 text-left">IP</th>
                                    <th className="p-3 text-left">Marca</th>
                                    <th className="p-3 text-left">Modelo</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-left">Ping</th>
                                    <th className="p-3 text-left">Última lectura</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cpeGuardados.map((e) => (
                                    <tr key={e.equipoId} className="border-t border-slate-700">
                                        <td className="p-3 font-semibold">
                                            {e.nombre || e.nombreEquipo || "-"}
                                        </td>
                                        <td className="p-3 text-cyan-400">
                                            {e.ipGestion || "-"}
                                        </td>
                                        <td className="p-3">{e.marca || "-"}</td>
                                        <td className="p-3">{e.modelo || "-"}</td>
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

                        {cpeGuardados.length === 0 && (
                            <div className="p-6 text-center text-slate-400">
                                No hay CPE registrados.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}