"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useMemo, useState } from "react";

type RedInterna = {
    routerId: number;
    routerNombre: string;
    parroquia: string | null;
    sector: string | null;
    host: string;
    usaWireGuard: boolean;
    ipWireGuard: string | null;
    redInterna: string;
    activa: boolean;
};

type RouterSinRed = {
    routerId: number;
    routerNombre: string;
    parroquia: string | null;
    sector: string | null;
    activo: boolean;
};

export default function RedesInternasPage() {
    const [redes, setRedes] = useState<RedInterna[]>([]);
    const [routersSinRedes, setRoutersSinRedes] =
        useState<RouterSinRed[]>([]);

    const [totalRouters, setTotalRouters] = useState(0);
    const [routersConRedes, setRoutersConRedes] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filtro, setFiltro] = useState("");
    const [soloActivos, setSoloActivos] = useState(false);

    async function cargarRedesInternas() {
        setLoading(true);

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/redes-internas`,
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
                    "Error cargando las redes internas"
                );
            }

            setRedes(
                Array.isArray(data.datos)
                    ? data.datos
                    : []
            );

            setRoutersSinRedes(
                Array.isArray(data.routersSinRedes)
                    ? data.routersSinRedes
                    : []
            );

            setTotalRouters(
                Number(data.totalRouters || 0)
            );

            setRoutersConRedes(
                Number(data.routersConRedes || 0)
            );

        } catch (error) {
            console.error(
                "Error cargarRedesInternas:",
                error
            );

            alert(
                error instanceof Error
                    ? error.message
                    : "Error cargando redes internas"
            );

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarRedesInternas();
    }, []);

    const redesFiltradas = useMemo(() => {
        const texto = filtro.trim().toLowerCase();

        return redes.filter((item) => {
            const coincideActivo =
                !soloActivos || item.activa;

            const coincideTexto =
                !texto ||
                item.redInterna
                    .toLowerCase()
                    .includes(texto) ||
                item.routerNombre
                    .toLowerCase()
                    .includes(texto) ||
                String(item.parroquia || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.sector || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(item.ipWireGuard || "")
                    .toLowerCase()
                    .includes(texto);

            return coincideActivo && coincideTexto;
        });
    }, [redes, filtro, soloActivos]);

    const totalWireGuard = new Set(
        redes
            .filter((item) => item.usaWireGuard)
            .map((item) => item.routerId)
    ).size;

    return (
        <main className="p-6 text-white">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">


                <div className="flex flex-wrap gap-2">
                    <input
                        value={filtro}
                        onChange={(event) =>
                            setFiltro(event.target.value)
                        }
                        placeholder="Buscar red, nodo o sector..."
                        className="min-w-64 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 outline-none focus:border-cyan-500"
                    />

                    <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm">
                        <input
                            type="checkbox"
                            checked={soloActivos}
                            onChange={(event) =>
                                setSoloActivos(
                                    event.target.checked
                                )
                            }
                            className="h-4 w-4"
                        />

                        Solo activos
                    </label>

                    <button
                        onClick={cargarRedesInternas}
                        disabled={loading}
                        className="rounded-xl bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700 disabled:bg-slate-700"
                    >
                        {loading
                            ? "Cargando..."
                            : "Actualizar"}
                    </button>
                </div>
            </div>

            <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">
                        Routers
                    </p>
                    <p className="text-2xl font-black text-cyan-400">
                        {totalRouters}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">
                        Con redes
                    </p>
                    <p className="text-2xl font-black text-green-400">
                        {routersConRedes}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">
                        Redes internas
                    </p>
                    <p className="text-2xl font-black text-violet-400">
                        {redes.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">
                        Nodos WireGuard
                    </p>
                    <p className="text-2xl font-black text-yellow-400">
                        {totalWireGuard}
                    </p>
                </div>
            </section>

            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900">
                <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-slate-300">
                        <tr>
                            <th className="p-3 text-left">
                                Red interna
                            </th>
                            <th className="p-3 text-left">
                                Nodo / Router
                            </th>
                            <th className="p-3 text-left">
                                Parroquia
                            </th>
                            <th className="p-3 text-left">
                                Sector
                            </th>
                            <th className="p-3 text-left">
                                Conexión
                            </th>
                            <th className="p-3 text-left">
                                IP WireGuard
                            </th>
                            <th className="p-3 text-left">
                                Estado
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {redesFiltradas.map(
                            (item, index) => (
                                <tr
                                    key={`${item.routerId}-${item.redInterna}-${index}`}
                                    className="border-t border-slate-700"
                                >
                                    <td className="p-3">
                                        <span className="rounded-lg bg-cyan-950 px-3 py-1 font-mono font-bold text-cyan-300">
                                            {item.redInterna}
                                        </span>
                                    </td>

                                    <td className="p-3 font-bold">
                                        {item.routerNombre}
                                    </td>

                                    <td className="p-3">
                                        {item.parroquia || "-"}
                                    </td>

                                    <td className="p-3">
                                        {item.sector || "-"}
                                    </td>

                                    <td className="p-3">
                                        <span
                                            className={
                                                item.usaWireGuard
                                                    ? "rounded-full bg-violet-600 px-3 py-1 text-xs font-bold"
                                                    : "rounded-full bg-blue-600 px-3 py-1 text-xs font-bold"
                                            }
                                        >
                                            {item.usaWireGuard
                                                ? "WIREGUARD"
                                                : "API DIRECTA"}
                                        </span>
                                    </td>

                                    <td className="p-3 font-mono text-yellow-300">
                                        {item.ipWireGuard ||
                                            "-"}
                                    </td>

                                    <td className="p-3">
                                        <span
                                            className={
                                                item.activa
                                                    ? "rounded-full bg-green-600 px-3 py-1 text-xs font-bold"
                                                    : "rounded-full bg-red-600 px-3 py-1 text-xs font-bold"
                                            }
                                        >
                                            {item.activa
                                                ? "ACTIVO"
                                                : "INACTIVO"}
                                        </span>
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>

                {!loading &&
                    redesFiltradas.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No existen redes internas para mostrar.
                        </div>
                    )}
            </div>

            {routersSinRedes.length > 0 && (
                <section className="mt-6 rounded-2xl border border-yellow-800 bg-yellow-950/30 p-5">
                    <h2 className="font-bold text-yellow-300">
                        Routers sin redes internas
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {routersSinRedes.map((router) => (
                            <span
                                key={router.routerId}
                                className="rounded-lg border border-yellow-800 bg-yellow-950 px-3 py-2 text-sm"
                            >
                                {router.routerNombre}
                                {router.sector
                                    ? ` — ${router.sector}`
                                    : ""}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}