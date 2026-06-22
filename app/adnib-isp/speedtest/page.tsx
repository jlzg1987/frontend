"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";

type PruebaVelocidad = {
    id: number;
    ip: string | null;
    ping: number | null;
    jitter: number | null;
    descarga: number | null;
    subida: number | null;
    proveedor: string | null;
    userAgent: string | null;
    esClienteNetcomp: number | boolean;
    fecha: string;
};

type Estadisticas = {
    totalPruebas: number;
    promedioDescarga: number | null;
    promedioSubida: number | null;
    promedioPing: number | null;
    clientesNetcomp: number;
    externos: number;
};

export default function SpeedTestAnalyticsPage() {
    const [pruebas, setPruebas] = useState<PruebaVelocidad[]>([]);
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<"TODOS" | "CLIENTES" | "EXTERNOS">("TODOS");
    const [busqueda, setBusqueda] = useState("");

    async function cargarDatos() {
        try {
            setLoading(true);
            const token = getToken();

            const [resPruebas, resStats] = await Promise.all([
                fetch(`${API_BASE}/pruebas-velocidad`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE}/pruebas-velocidad/estadisticas`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const jsonPruebas = await resPruebas.json();
            const jsonStats = await resStats.json();

            if (jsonPruebas.ok) setPruebas(jsonPruebas.data || []);
            if (jsonStats.ok) setEstadisticas(jsonStats.data || null);
        } catch (error) {
            console.error("Error cargando SpeedTest Analytics:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        cargarDatos();
    }, []);

    const pruebasFiltradas = useMemo(() => {
        return pruebas.filter((p) => {
            const esCliente = p.esClienteNetcomp === true || p.esClienteNetcomp === 1;

            if (filtro === "CLIENTES" && !esCliente) return false;
            if (filtro === "EXTERNOS" && esCliente) return false;

            const texto = `${p.ip || ""} ${p.proveedor || ""} ${p.userAgent || ""}`.toLowerCase();
            return texto.includes(busqueda.toLowerCase());
        });
    }, [pruebas, filtro, busqueda]);

    function formatoNumero(valor: number | null | undefined, decimales = 2) {
        if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "0.00";
        return Number(valor).toFixed(decimales);
    }

    function formatoFecha(fecha: string) {
        if (!fecha) return "-";
        return new Date(fecha).toLocaleString("es-EC");
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-black md:text-4xl">
                            🚀 SpeedTest Analytics
                        </h1>
                        <p className="mt-2 text-slate-400">
                            Estadísticas del servidor de velocidad Netcomprf.
                        </p>
                    </div>

                    <button
                        onClick={cargarDatos}
                        className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
                    >
                        Actualizar
                    </button>
                </div>

                {loading ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">
                        Cargando estadísticas...
                    </div>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                            <Card titulo="Total pruebas" valor={estadisticas?.totalPruebas || 0} icono="📊" />
                            <Card titulo="Prom. descarga" valor={`${formatoNumero(estadisticas?.promedioDescarga)} Mbps`} icono="⬇️" />
                            <Card titulo="Prom. subida" valor={`${formatoNumero(estadisticas?.promedioSubida)} Mbps`} icono="⬆️" />
                            <Card titulo="Prom. ping" valor={`${formatoNumero(estadisticas?.promedioPing)} ms`} icono="📡" />
                            <Card titulo="Clientes Netcomprf" valor={estadisticas?.clientesNetcomp || 0} icono="✅" />
                            <Card titulo="Usuarios externos" valor={estadisticas?.externos || 0} icono="🌎" />
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">
                            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <h2 className="text-xl font-black">
                                    Últimas pruebas realizadas
                                </h2>

                                <div className="flex flex-col gap-3 md:flex-row">
                                    <input
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        placeholder="Buscar IP, proveedor o navegador..."
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400 md:w-80"
                                    />

                                    <select
                                        value={filtro}
                                        onChange={(e) => setFiltro(e.target.value as any)}
                                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                                    >
                                        <option value="TODOS">Todos</option>
                                        <option value="CLIENTES">Clientes Netcomprf</option>
                                        <option value="EXTERNOS">Usuarios externos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-left text-slate-400">
                                            <th className="p-3">Tipo</th>
                                            <th className="p-3">IP</th>
                                            <th className="p-3">Proveedor</th>
                                            <th className="p-3">Descarga</th>
                                            <th className="p-3">Subida</th>
                                            <th className="p-3">Ping</th>
                                            <th className="p-3">Jitter</th>
                                            <th className="p-3">Fecha</th>
                                            <th className="p-3">Navegador</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {pruebasFiltradas.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="p-6 text-center text-slate-400">
                                                    No hay pruebas registradas.
                                                </td>
                                            </tr>
                                        ) : (
                                            pruebasFiltradas.map((p) => {
                                                const esCliente =
                                                    p.esClienteNetcomp === true || p.esClienteNetcomp === 1;

                                                return (
                                                    <tr
                                                        key={p.id}
                                                        className="border-b border-slate-800/70 hover:bg-slate-800/40"
                                                    >
                                                        <td className="p-3">
                                                            <span
                                                                className={`rounded-full px-3 py-1 text-xs font-bold ${esCliente
                                                                    ? "bg-emerald-500/15 text-emerald-300"
                                                                    : "bg-cyan-500/15 text-cyan-300"
                                                                    }`}
                                                            >
                                                                {esCliente ? "Cliente" : "Externo"}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-semibold text-slate-200">
                                                            {p.ip || "-"}
                                                        </td>
                                                        <td className="p-3 text-slate-300">
                                                            {p.proveedor || "No detectado"}
                                                        </td>
                                                        <td className="p-3 text-cyan-300">
                                                            {formatoNumero(p.descarga)} Mbps
                                                        </td>
                                                        <td className="p-3 text-sky-300">
                                                            {formatoNumero(p.subida)} Mbps
                                                        </td>
                                                        <td className="p-3 text-slate-300">
                                                            {formatoNumero(p.ping)} ms
                                                        </td>
                                                        <td className="p-3 text-slate-300">
                                                            {formatoNumero(p.jitter)} ms
                                                        </td>
                                                        <td className="p-3 text-slate-400">
                                                            {formatoFecha(p.fecha)}
                                                        </td>
                                                        <td className="max-w-[260px] truncate p-3 text-slate-500">
                                                            {p.userAgent || "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

function Card({
    titulo,
    valor,
    icono,
}: {
    titulo: string;
    valor: string | number;
    icono: string;
}) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="mb-3 text-3xl">{icono}</div>
            <p className="text-sm text-slate-400">{titulo}</p>
            <h3 className="mt-2 text-2xl font-black text-white">{valor}</h3>
        </div>
    );
}