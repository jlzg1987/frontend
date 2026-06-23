"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    PackageCheck,
    Truck,
    CheckCircle,
    RefreshCcw,
    Eye,
    Printer,
    Search,
} from "lucide-react";
import { API_BASE, getToken } from "@/src/lib/api";

type PedidoDespacho = {
    pedidoId: string;
    numeroPedido?: string;
    estado: "PAGADO" | "DESPACHANDO" | "DESPACHADO";
    total: number;
    creadoEn: string;

    clienteNombre?: string;
    clienteCedula?: string;
    clienteTelefono?: string;
    clienteDireccion?: string;

    transactionId?: number;
    authorizationCode?: string;
    estadoPago?: string;
};

export default function DespachoTiendaPage() {
    const router = useRouter();

    const [pedidos, setPedidos] = useState<PedidoDespacho[]>([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");

    async function cargarPedidos() {
        try {
            setCargando(true);
            setError("");

            const res = await fetch(`${API_BASE}/tienda/pedidos/despacho/listar`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudieron cargar los pedidos.");
            }

            setPedidos(data.pedidos || []);
        } catch (err: any) {
            setError(err.message || "Error cargando pedidos.");
        } finally {
            setCargando(false);
        }
    }

    async function cambiarEstado(pedidoId: string, estado: "DESPACHANDO" | "DESPACHADO") {
        try {
            setActualizando(pedidoId);

            const res = await fetch(`${API_BASE}/tienda/pedidos/despacho/${pedidoId}/estado`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ estado }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo actualizar el pedido.");
            }

            await cargarPedidos();
        } catch (err: any) {
            alert(err.message || "Error actualizando pedido.");
        } finally {
            setActualizando(null);
        }
    }

    useEffect(() => {
        cargarPedidos();
    }, []);

    const pedidosFiltrados = pedidos.filter((p) => {
        const texto = `
            ${p.numeroPedido || ""}
            ${p.pedidoId}
            ${p.clienteNombre || ""}
            ${p.clienteCedula || ""}
            ${p.clienteTelefono || ""}
            ${p.estado}
        `.toLowerCase();

        return texto.includes(busqueda.toLowerCase());
    });

    const totalPendientes = pedidos.filter((p) => p.estado === "PAGADO").length;
    const totalDespachando = pedidos.filter((p) => p.estado === "DESPACHANDO").length;
    const totalDespachados = pedidos.filter((p) => p.estado === "DESPACHADO").length;

    function badgeEstado(estado: PedidoDespacho["estado"]) {
        if (estado === "PAGADO") {
            return "bg-yellow-400/15 text-yellow-300 border-yellow-400/30";
        }

        if (estado === "DESPACHANDO") {
            return "bg-cyan-400/15 text-cyan-300 border-cyan-400/30";
        }

        return "bg-emerald-400/15 text-emerald-300 border-emerald-400/30";
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <section className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-black">
                            <PackageCheck className="text-cyan-300" />
                            Pedidos para despacho
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Pedidos pagados en tienda online listos para facturar, imprimir y entregar.
                        </p>
                    </div>

                    <button
                        onClick={cargarPedidos}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
                    >
                        <RefreshCcw size={18} />
                        Actualizar
                    </button>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                        <p className="text-sm font-bold text-yellow-200">Pagados pendientes</p>
                        <p className="mt-2 text-4xl font-black">{totalPendientes}</p>
                    </div>

                    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                        <p className="text-sm font-bold text-cyan-200">En despacho</p>
                        <p className="mt-2 text-4xl font-black">{totalDespachando}</p>
                    </div>

                    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                        <p className="text-sm font-bold text-emerald-200">Despachados</p>
                        <p className="mt-2 text-4xl font-black">{totalDespachados}</p>
                    </div>
                </div>

                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
                    <Search size={20} className="text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por cliente, cédula, teléfono, pedido o estado..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                    />
                </div>

                {cargando && (
                    <div className="rounded-3xl border border-white/10 bg-slate-900 p-10 text-center text-slate-300">
                        Cargando pedidos...
                    </div>
                )}

                {!cargando && error && (
                    <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-red-200">
                        {error}
                    </div>
                )}

                {!cargando && !error && pedidosFiltrados.length === 0 && (
                    <div className="rounded-3xl border border-white/10 bg-slate-900 p-10 text-center text-slate-400">
                        No hay pedidos para despacho.
                    </div>
                )}

                {!cargando && !error && pedidosFiltrados.length > 0 && (
                    <div className="grid gap-4">
                        {pedidosFiltrados.map((p) => (
                            <article
                                key={p.pedidoId}
                                className="rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-xl"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-lg font-black">
                                                Pedido #{p.numeroPedido || p.pedidoId.slice(0, 8)}
                                            </span>

                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-black ${badgeEstado(
                                                    p.estado
                                                )}`}
                                            >
                                                {p.estado}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-400">
                                            Fecha: {new Date(p.creadoEn).toLocaleString()}
                                        </p>

                                        <div className="grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                                            <p>
                                                <b>Cliente:</b>{" "}
                                                {p.clienteNombre || "Consumidor final"}
                                            </p>
                                            <p>
                                                <b>Cédula:</b> {p.clienteCedula || "N/A"}
                                            </p>
                                            <p>
                                                <b>Teléfono:</b> {p.clienteTelefono || "N/A"}
                                            </p>
                                            <p>
                                                <b>Dirección:</b> {p.clienteDireccion || "N/A"}
                                            </p>
                                        </div>

                                        <div className="text-sm text-slate-400">
                                            <p>
                                                <b>PayPhone:</b>{" "}
                                                {p.transactionId || "Sin transacción"} /{" "}
                                                {p.authorizationCode || "Sin autorización"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 lg:min-w-[260px]">
                                        <div className="rounded-2xl bg-slate-950 p-4 text-right">
                                            <p className="text-xs text-slate-400">Total pagado</p>
                                            <p className="text-3xl font-black text-emerald-300">
                                                ${Number(p.total || 0).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/inventario/tienda/pedido-exitoso?pedidoId=${p.pedidoId}`
                                                    )
                                                }
                                                className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-black text-slate-950 hover:bg-slate-200"
                                            >
                                                <Eye size={16} />
                                                Ver
                                            </button>

                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/inventario/tienda/pedido-exitoso?pedidoId=${p.pedidoId}&print=1`
                                                    )
                                                }
                                                className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-3 py-3 text-sm font-black text-white hover:bg-slate-600"
                                            >
                                                <Printer size={16} />
                                                Imprimir
                                            </button>
                                        </div>

                                        {p.estado === "PAGADO" && (
                                            <button
                                                disabled={actualizando === p.pedidoId}
                                                onClick={() =>
                                                    cambiarEstado(p.pedidoId, "DESPACHANDO")
                                                }
                                                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                                            >
                                                <Truck size={18} />
                                                Pasar a despacho
                                            </button>
                                        )}

                                        {p.estado === "DESPACHANDO" && (
                                            <button
                                                disabled={actualizando === p.pedidoId}
                                                onClick={() =>
                                                    cambiarEstado(p.pedidoId, "DESPACHADO")
                                                }
                                                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
                                            >
                                                <CheckCircle size={18} />
                                                Marcar despachado
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}