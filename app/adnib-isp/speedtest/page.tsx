"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";
import {
    Activity,
    ArrowDownToLine,
    ArrowUpFromLine,
    CheckCircle2,
    Gauge,
    Globe2,
    LoaderCircle,
    RefreshCw,
    Search,
    Users,
    type LucideIcon,
} from "lucide-react";

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
        <main
            className="min-h-screen p-6 text-white"
            style={{
                background:
                    "radial-gradient(circle at top left, rgba(6,182,212,0.13), transparent 30%), radial-gradient(circle at bottom right, rgba(37,99,235,0.10), transparent 34%), #020617",
            }}
        >
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                                background: "linear-gradient(135deg, #06b6d4, #2563eb)",
                                boxShadow: "0 12px 30px rgba(6,182,212,0.28)",
                            }}
                        >
                            <Gauge className="h-8 w-8 text-white" strokeWidth={2.2} />
                        </div>

                        <div>
                            <h1
                                className="text-3xl font-black md:text-4xl"
                                style={{
                                    background: "linear-gradient(90deg, #ffffff, #a5f3fc, #60a5fa)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                SpeedTest Analytics
                            </h1>
                            <p className="mt-2 text-slate-400">
                                Estadísticas del servidor de velocidad Netcomprf.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={cargarDatos}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                            background: "linear-gradient(90deg, #06b6d4, #2563eb)",
                            boxShadow: "0 10px 25px rgba(6,182,212,0.22)",
                        }}
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                        Actualizar
                    </button>
                </div>

                {loading ? (
                    <div
                        className="flex min-h-52 flex-col items-center justify-center rounded-3xl border p-8 text-center text-slate-300"
                        style={{
                            borderColor: "rgba(34,211,238,0.18)",
                            background: "linear-gradient(145deg, rgba(15,23,42,0.96), rgba(8,15,30,0.96))",
                        }}
                    >
                        <LoaderCircle className="mb-3 h-9 w-9 animate-spin text-cyan-400" />
                        <span className="font-semibold">Cargando estadísticas...</span>
                    </div>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                            <Card titulo="Total pruebas" valor={estadisticas?.totalPruebas || 0} icono={Activity} color="#22d3ee" colorFinal="#2563eb" />
                            <Card titulo="Prom. descarga" valor={`${formatoNumero(estadisticas?.promedioDescarga)} Mbps`} icono={ArrowDownToLine} color="#10b981" colorFinal="#22c55e" />
                            <Card titulo="Prom. subida" valor={`${formatoNumero(estadisticas?.promedioSubida)} Mbps`} icono={ArrowUpFromLine} color="#38bdf8" colorFinal="#6366f1" />
                            <Card titulo="Prom. ping" valor={`${formatoNumero(estadisticas?.promedioPing)} ms`} icono={Gauge} color="#f59e0b" colorFinal="#f97316" />
                            <Card titulo="Clientes Netcomprf" valor={estadisticas?.clientesNetcomp || 0} icono={CheckCircle2} color="#34d399" colorFinal="#059669" />
                            <Card titulo="Usuarios externos" valor={estadisticas?.externos || 0} icono={Globe2} color="#a78bfa" colorFinal="#7c3aed" />
                        </section>

                        <section
                            className="mt-8 rounded-3xl border p-5"
                            style={{
                                borderColor: "rgba(34,211,238,0.16)",
                                background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(8,15,30,0.97))",
                                boxShadow: "0 22px 55px rgba(2,6,23,0.38)",
                            }}
                        >
                            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                                        style={{ background: "linear-gradient(135deg, #06b6d4, #2563eb)" }}
                                    >
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black">Últimas pruebas realizadas</h2>
                                </div>

                                <div className="flex flex-col gap-3 md:flex-row">
                                    <div className="relative w-full md:w-80">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <input
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                            placeholder="Buscar IP, proveedor o navegador..."
                                            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-400"
                                        />
                                    </div>

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
    color,
    colorFinal,
}: {
    titulo: string;
    valor: string | number;
    icono: LucideIcon;
    color: string;
    colorFinal: string;
}) {
    const Icono = icono;

    return (
        <div
            className="group min-w-0 rounded-3xl border p-4 transition duration-300 hover:-translate-y-1"
            style={{
                borderColor: `${color}35`,
                background: `radial-gradient(circle at top right, ${color}22, transparent 45%), linear-gradient(145deg, rgba(15,23,42,0.98), rgba(8,15,30,0.96))`,
                boxShadow: `0 16px 38px ${color}12`,
            }}
        >
            <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110"
                style={{
                    background: `linear-gradient(135deg, ${color}, ${colorFinal})`,
                    boxShadow: `0 10px 24px ${color}35`,
                }}
            >
                <Icono className="h-5 w-5 text-white" strokeWidth={2.3} />
            </div>
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
            <h3 className="mt-2 truncate text-xl font-black text-white" title={String(valor)}>{valor}</h3>
        </div>
    );
}