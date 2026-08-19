"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";
import {
    Banknote,
    Ban,
    BarChart3,
    CircleCheck,
    CircleDollarSign,
    CircleOff,
    Clock3,
    Download,
    Eye,
    Filter,
    Globe2,
    RadioTower,
    ReceiptText,
    Ticket,
    TriangleAlert,
    Unplug,
    UserRoundX,
    Users,
    Wifi,
    Wrench,
    type LucideIcon,
} from "lucide-react";

type ReporteISP = any;

const MESES = [
    { value: "", label: "Todos" },
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
];

function money(value: any) {
    return `$ ${Number(value || 0).toFixed(2)}`;
}

function num(value: any) {
    return Number(value || 0).toLocaleString("es-EC");
}

function Card({
    titulo,
    valor,
    detalle,
    icono,
    color,
}: {
    titulo: string;
    valor: string;
    detalle?: string;
    icono: LucideIcon;
    color: string;
}) {
    return (
        <div
            className="rounded-2xl border p-5 shadow-lg"
            style={{
                background: `linear-gradient(145deg, ${color}16, rgba(2,6,23,0.92) 58%)`,
                borderColor: `${color}38`,
                boxShadow: `0 14px 34px ${color}12`,
            }}
        >
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-400">{titulo}</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{valor}</h3>
                    {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
                </div>

                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                        color,
                        background: `linear-gradient(135deg, ${color}30, ${color}0d)`,
                        border: `1px solid ${color}4d`,
                        boxShadow: `0 10px 26px ${color}20`,
                    }}
                >
                    {createElement(icono, {
                        size: 26,
                        strokeWidth: 2.2,
                    })}
                </div>
            </div>
        </div>
    );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section
            className="rounded-3xl border border-slate-800 p-5 shadow-xl"
            style={{
                background: "linear-gradient(145deg, rgba(15,23,42,0.94), rgba(2,6,23,0.88))",
            }}
        >
            <h2 className="mb-4 text-lg font-black text-white">{titulo}</h2>
            {children}
        </section>
    );
}

function MiniTable({
    columns,
    rows,
    empty,
}: {
    columns: string[];
    rows: any[];
    empty: string;
}) {
    return (
        <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-800">
            <table className="min-w-[750px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-950 text-xs uppercase text-slate-400">
                    <tr>
                        {columns.map((c) => (
                            <th
                                key={c}
                                className="whitespace-nowrap px-4 py-3"
                            >
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                    {rows?.length ? (
                        rows.map((row, idx) => (
                            <tr
                                key={idx}
                                className="text-slate-300 hover:bg-slate-800/50"
                            >
                                {columns.map((c) => (
                                    <td
                                        key={c}
                                        className="whitespace-nowrap px-4 py-3"
                                    >
                                        {row[c] ?? "-"}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-6 text-center text-slate-500"
                            >
                                {empty}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function SimpleBars({ data }: { data: any[] }) {
    const max = useMemo(() => {
        return Math.max(...(data || []).map((x) => Number(x.pagado || 0)), 1);
    }, [data]);

    return (
        <div className="space-y-3">
            {(data || []).map((item) => {
                const width = Math.max((Number(item.pagado || 0) / max) * 100, 4);

                return (
                    <div key={item.periodo}>
                        <div className="mb-1 flex justify-between text-xs text-slate-400">
                            <span>{item.periodo}</span>
                            <span>{money(item.pagado)}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${width}%`,
                                    background: "linear-gradient(90deg, #22d3ee, #2563eb)",
                                    boxShadow: "0 0 16px rgba(34,211,238,0.32)",
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function ReportesIspPage() {
    const hoy = new Date();

    const [anio, setAnio] = useState(String(hoy.getFullYear()));
    const [mes, setMes] = useState(String(hoy.getMonth() + 1));
    const [routerId, setRouterId] = useState("");
    const [loading, setLoading] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState<ReporteISP | null>(null);

    async function cargarReporte() {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();
            if (anio) params.set("anio", anio);
            if (mes) params.set("mes", mes);
            if (routerId) params.set("routerId", routerId);

            const res = await fetch(`${API_BASE}/reportes-isp/resumen?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const json = await res.json();

            if (!res.ok || !json.ok) {
                throw new Error(json.mensaje || "No se pudo cargar el reporte ISP");
            }

            setData(json.data);
        } catch (err: any) {
            setError(err.message || "Error cargando reporte");
        } finally {
            setLoading(false);
        }
    }

    async function descargarPdf() {
        try {
            setDescargando(true);

            const params = new URLSearchParams();
            if (anio) params.set("anio", anio);
            if (mes) params.set("mes", mes);
            if (routerId) params.set("routerId", routerId);

            const res = await fetch(`${API_BASE}/reportes-isp/pdf?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            if (!res.ok) throw new Error("No se pudo generar el PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `reporte-isp-${anio || "todos"}-${mes || "todos"}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err.message || "Error descargando PDF");
        } finally {
            setDescargando(false);
        }
    }

    useEffect(() => {
        cargarReporte();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const r = data || {};

    const topMorosos = (r.alertas?.topMorosos || []).map((x: any) => ({
        Cliente: `${x.nombres || ""} ${x.apellidos || ""}`.trim() || "Sin nombre",
        Cedula: x.cedula || "-",
        Telofono: x.telefono || "-",
        Cuotas: num(x.cuotasPendientes),
        Deuda: money(x.deudaTotal),
    }));

    const equiposCriticos = (r.alertas?.equiposCriticos || []).map((x: any) => ({
        Nombre: x.nombre || "-",
        Marca: x.marca || "-",
        Tipo: x.tipoEquipo || "-",
        IP: x.ipGestion || "-",
        Estado: x.ultimoEstado || "-",
    }));

    return (
        <main
            className="min-h-screen p-4 text-white md:p-8"
            style={{
                background: "radial-gradient(circle at top left, rgba(6,182,212,0.14), transparent 30%), linear-gradient(135deg, #020617, #0f172a)",
            }}
        >
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-black md:text-4xl">
                            <BarChart3 className="text-cyan-400" size={36} strokeWidth={2.3} />
                            Reportes ISP
                        </h1>
                        <p className="mt-2 text-slate-400">
                            Ingresos, clientes, morosos, suspendidos, soporte y wireless.
                        </p>
                    </div>

                    <button
                        onClick={descargarPdf}
                        disabled={descargando || !data}
                        className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-slate-950 shadow-lg disabled:opacity-50"
                        style={{
                            background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
                            boxShadow: "0 12px 30px rgba(6,182,212,0.24)",
                        }}
                    >
                        <Download size={18} strokeWidth={2.4} />
                        {descargando ? "Generando PDF..." : "Descargar PDF Global"}
                    </button>
                </div>

                <section
                    className="rounded-3xl border border-slate-800 p-5"
                    style={{
                        background: "linear-gradient(145deg, rgba(15,23,42,0.94), rgba(2,6,23,0.88))",
                    }}
                >
                    <div className="grid gap-4 md:grid-cols-5">
                        <div>
                            <label className="text-xs text-slate-400">Año</label>
                            <input
                                value={anio}
                                onChange={(e) => setAnio(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">Mes</label>
                            <select
                                value={mes}
                                onChange={(e) => setMes(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-400"
                            >
                                {MESES.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">Router ID</label>
                            <input
                                value={routerId}
                                onChange={(e) => setRouterId(e.target.value)}
                                placeholder="Todos"
                                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-end">
                            <button
                                onClick={cargarReporte}
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
                                style={{
                                    background: "linear-gradient(135deg, #f8fafc, #cbd5e1)",
                                }}
                            >
                                <Filter size={18} strokeWidth={2.4} />
                                {loading ? "Cargando..." : "Aplicar filtros"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                </section>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card
                        titulo="Clientes activos"
                        valor={num(r.resumenClientes?.clientesActivos)}
                        detalle={`Total: ${num(r.resumenClientes?.totalClientes)}`}
                        icono={Users}
                        color="#22c55e"
                    />
                    <Card
                        titulo="Clientes suspendidos"
                        valor={num(r.resumenClientes?.clientesSuspendidos)}
                        detalle={`Retirados: ${num(r.resumenClientes?.clientesRetirados)}`}
                        icono={UserRoundX}
                        color="#f97316"
                    />
                    <Card
                        titulo="Ingresos pagados"
                        valor={money(r.resumenMensualidades?.totalPagado)}
                        detalle="Mensualidades pagadas"
                        icono={Banknote}
                        color="#38bdf8"
                    />
                    <Card
                        titulo="Pendiente por cobrar"
                        valor={money(r.resumenMensualidades?.totalPendienteCobro)}
                        detalle="Pendiente + vencido + cortado"
                        icono={CircleDollarSign}
                        color="#facc15"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card
                        titulo="Servicios activos"
                        valor={num(r.resumenServicios?.serviciosActivos)}
                        detalle={`Pendientes: ${num(r.resumenServicios?.serviciosPendientes)}`}
                        icono={Globe2}
                        color="#06b6d4"
                    />
                    <Card
                        titulo="Morosos / pendientes"
                        valor={num(r.resumenMensualidades?.mensualidadesPendientes)}
                        detalle={`Vencidas: ${num(r.resumenMensualidades?.mensualidadesVencidas)}`}
                        icono={TriangleAlert}
                        color="#fb7185"
                    />
                    <Card
                        titulo="Tickets abiertos"
                        valor={num(r.resumenTickets?.ticketsAbiertos)}
                        detalle={`CrÃ­ticos: ${num(r.resumenTickets?.ticketsCriticos)}`}
                        icono={Ticket}
                        color="#a78bfa"
                    />
                    <Card
                        titulo="Equipos offline"
                        valor={num(r.resumenWireless?.equiposOffline)}
                        detalle={`Online: ${num(r.resumenWireless?.equiposOnline)}`}
                        icono={RadioTower}
                        color="#ef4444"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section titulo="Finanzas">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Card titulo="Total emitido" valor={money(r.resumenMensualidades?.totalEmitido)} icono={ReceiptText} color="#38bdf8" />
                            <Card titulo="Total vencido" valor={money(r.resumenMensualidades?.totalVencido)} icono={Clock3} color="#fb7185" />
                            <Card titulo="Total cortado" valor={money(r.resumenMensualidades?.totalCortado)} icono={Unplug} color="#f97316" />
                            <Card titulo="Anuladas" valor={num(r.resumenMensualidades?.mensualidadesAnuladas)} icono={Ban} color="#94a3b8" />
                        </div>
                    </Section>

                    <Section titulo="Ingresos por mes">
                        <SimpleBars data={r.graficas?.ingresosPorMes || []} />
                    </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Section titulo="Clientes y servicios">
                        <div className="space-y-3">
                            <Card titulo="Servicios suspendidos" valor={num(r.resumenServicios?.serviciosSuspendidos)} icono={CircleOff} color="#f97316" />
                            <Card titulo="Servicios operativos" valor={num(r.resumenServicios?.serviciosOperativos)} icono={CircleCheck} color="#22c55e" />
                            <Card titulo="Sin asignación técnico" valor={num(r.resumenServicios?.sinAsignacionTecnico)} icono={Wrench} color="#facc15" />
                        </div>
                    </Section>

                    <Section titulo="Soporte técnico">
                        <div className="space-y-3">
                            <Card titulo="Tickets en proceso" valor={num(r.resumenTickets?.ticketsEnProceso)} icono={Wrench} color="#38bdf8" />
                            <Card titulo="Tickets resueltos" valor={num(r.resumenTickets?.ticketsResueltos)} icono={CircleCheck} color="#22c55e" />
                            <Card titulo="Requiere seguimiento" valor={num(r.resumenAtenciones?.requiereSeguimiento)} icono={Eye} color="#facc15" />
                        </div>
                    </Section>

                    <Section titulo="Wireless">
                        <div className="space-y-3">
                            <Card titulo="Equipos online" valor={num(r.resumenWireless?.equiposOnline)} icono={CircleCheck} color="#22c55e" />
                            <Card titulo="Ping alto / SSH falla" valor={`${num(r.resumenWireless?.equiposPingAlto)} / ${num(r.resumenWireless?.equiposSshFalla)}`} icono={Wifi} color="#f97316" />
                            <Card titulo="Sectoriales / CPE" valor={`${num(r.resumenWireless?.sectoriales)} / ${num(r.resumenWireless?.cpeClientes)}`} icono={RadioTower} color="#38bdf8" />
                        </div>
                    </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section titulo="Top 10 clientes morosos">
                        <MiniTable
                            columns={["Cliente", "Cédula", "Teléfono", "Cuotas", "Deuda"]}
                            rows={topMorosos}
                            empty="No hay clientes morosos para este filtro."
                        />
                    </Section>

                    <Section titulo="Equipos wireless críticos">
                        <MiniTable
                            columns={["Nombre", "Marca", "Tipo", "IP", "Estado"]}
                            rows={equiposCriticos}
                            empty="No hay equipos críticos."
                        />
                    </Section>
                </div>
            </div>
        </main>
    );
}