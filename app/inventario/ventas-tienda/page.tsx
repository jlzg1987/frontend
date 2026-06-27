"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    Eye,
    Receipt,
    ShoppingBag,
    DollarSign,
    CreditCard,
    Ban,
    X,
    CalendarDays,
    Phone,
    Mail,
    MapPin,
} from "lucide-react";
import { API_BASE } from "@/src/lib/api";

type Venta = {
    ventaId: string;
    pedidoId: string;
    clienteNombre: string;
    clienteTelefono: string;
    clienteEmail: string;
    clienteDireccion: string;
    subtotal: string | number;
    iva: string | number;
    total: string | number;
    metodoPago: "PAYPHONE" | "EFECTIVO" | "TRANSFERENCIA" | "OTRO";
    estado: "PAGADA" | "ANULADA";
    payphoneTransactionId?: string;
    payphoneClientTransactionId?: string;
    creadoEn: string;
};

type DetalleVenta = {
    detalleVentaId: number;
    productoId: number;
    codigo: string;
    nombre: string;
    tipo_item: "PRODUCTO" | "SERVICIO";
    cantidad: number;
    precioUnitario: string | number;
    subtotal: string | number;
    aplicaIva: "SI" | "NO";
};

type Resumen = {
    totalVentas: number;
    totalVendido: string | number;
    subtotalVendido: string | number;
    ivaVendido: string | number;
    totalPayphone: string | number;
    totalEfectivo: string | number;
    totalTransferencia: string | number;
    totalAnulado: string | number;
};

type VentaDetalleResponse = {
    venta: Venta;
    detalle: DetalleVenta[];
};

export default function VentasTiendaPage() {
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [metodoFiltro, setMetodoFiltro] = useState("TODOS");
    const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
    const [loading, setLoading] = useState(true);
    const [detalleLoading, setDetalleLoading] = useState(false);
    const [detalle, setDetalle] = useState<VentaDetalleResponse | null>(null);

    const money = (valor: string | number | undefined) => {
        const numero = Number(valor || 0);
        return numero.toLocaleString("es-EC", {
            style: "currency",
            currency: "USD",
        });
    };

    const fecha = (valor: string) => {
        if (!valor) return "-";
        return new Date(valor).toLocaleString("es-EC", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const cargarDatos = async () => {
        try {
            setLoading(true);

            const [resVentas, resResumen] = await Promise.all([
                fetch(`${API_BASE}/tienda/ventas`),
                fetch(`${API_BASE}/tienda/ventas/resumen`),
            ]);

            const dataVentas = await resVentas.json();
            const dataResumen = await resResumen.json();

            if (dataVentas.ok) setVentas(dataVentas.ventas || []);
            if (dataResumen.ok) setResumen(dataResumen.resumen || null);
        } catch (error) {
            console.error("Error cargando ventas tienda:", error);
        } finally {
            setLoading(false);
        }
    };

    const verDetalle = async (ventaId: string) => {
        try {
            setDetalleLoading(true);
            const res = await fetch(`${API_BASE}/tienda/ventas/${ventaId}`);
            const data = await res.json();

            if (data.ok) {
                setDetalle({
                    venta: data.venta,
                    detalle: data.detalle || [],
                });
            }
        } catch (error) {
            console.error("Error obteniendo detalle:", error);
        } finally {
            setDetalleLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const ventasFiltradas = useMemo(() => {
        const texto = busqueda.toLowerCase().trim();

        return ventas.filter((venta) => {
            const coincideBusqueda =
                venta.clienteNombre?.toLowerCase().includes(texto) ||
                venta.clienteTelefono?.toLowerCase().includes(texto) ||
                venta.clienteEmail?.toLowerCase().includes(texto) ||
                venta.ventaId?.toLowerCase().includes(texto) ||
                venta.pedidoId?.toLowerCase().includes(texto);

            const coincideMetodo =
                metodoFiltro === "TODOS" || venta.metodoPago === metodoFiltro;

            const coincideEstado =
                estadoFiltro === "TODOS" || venta.estado === estadoFiltro;

            return coincideBusqueda && coincideMetodo && coincideEstado;
        });
    }, [ventas, busqueda, metodoFiltro, estadoFiltro]);

    return (
        <div className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-cyan-500/20 p-3 text-cyan-300">
                                <ShoppingBag size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold md:text-3xl">
                                    Ventas Tienda Online
                                </h1>
                                <p className="text-sm text-slate-400">
                                    Monitoreo de ventas pagadas desde la tienda
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={cargarDatos}
                        className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                        <RefreshCw size={18} />
                        Actualizar
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <ResumenCard
                        titulo="Ventas"
                        valor={String(resumen?.totalVentas || 0)}
                        icono={<Receipt size={24} />}
                    />
                    <ResumenCard
                        titulo="Total vendido"
                        valor={money(resumen?.totalVendido)}
                        icono={<DollarSign size={24} />}
                    />
                    <ResumenCard
                        titulo="PayPhone"
                        valor={money(resumen?.totalPayphone)}
                        icono={<CreditCard size={24} />}
                    />
                    <ResumenCard
                        titulo="Anuladas"
                        valor={money(resumen?.totalAnulado)}
                        icono={<Ban size={24} />}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <ResumenMini titulo="Subtotal" valor={money(resumen?.subtotalVendido)} />
                    <ResumenMini titulo="IVA" valor={money(resumen?.ivaVendido)} />
                    <ResumenMini titulo="Transferencia" valor={money(resumen?.totalTransferencia)} />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-3 text-slate-400"
                            />
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar cliente, teléfono, correo..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <select
                            value={metodoFiltro}
                            onChange={(e) => setMetodoFiltro(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400"
                        >
                            <option value="TODOS">Todos los métodos</option>
                            <option value="PAYPHONE">PayPhone</option>
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="OTRO">Otro</option>
                        </select>

                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="PAGADA">Pagada</option>
                            <option value="ANULADA">Anulada</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">
                            Cargando ventas...
                        </div>
                    ) : ventasFiltradas.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            No hay ventas registradas.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[950px] text-sm">
                                <thead className="bg-slate-950 text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Fecha</th>
                                        <th className="px-4 py-3 text-left">Cliente</th>
                                        <th className="px-4 py-3 text-left">Teléfono</th>
                                        <th className="px-4 py-3 text-left">Correo</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 text-center">Pago</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                        <th className="px-4 py-3 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventasFiltradas.map((venta) => (
                                        <tr
                                            key={venta.ventaId}
                                            className="border-t border-slate-800 hover:bg-slate-800/60"
                                        >
                                            <td className="px-4 py-3 text-slate-300">
                                                {fecha(venta.creadoEn)}
                                            </td>
                                            <td className="px-4 py-3 font-semibold">
                                                {venta.clienteNombre}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {venta.clienteTelefono || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {venta.clienteEmail || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-300">
                                                {money(venta.total)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
                                                    {venta.metodoPago}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${venta.estado === "PAGADA"
                                                            ? "bg-emerald-500/15 text-emerald-300"
                                                            : "bg-red-500/15 text-red-300"
                                                        }`}
                                                >
                                                    {venta.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => verDetalle(venta.ventaId)}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold hover:bg-cyan-500 hover:text-slate-950"
                                                >
                                                    <Eye size={16} />
                                                    Ver
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {detalle && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setDetalle(null)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Detalle de venta
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {detalle.venta.ventaId}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetalle(null)}
                                className="rounded-xl bg-slate-800 p-2 hover:bg-red-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {detalleLoading ? (
                            <div className="p-8 text-center text-slate-400">
                                Cargando detalle...
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <InfoItem
                                        icono={<Receipt size={18} />}
                                        titulo="Pedido"
                                        valor={detalle.venta.pedidoId}
                                    />
                                    <InfoItem
                                        icono={<CalendarDays size={18} />}
                                        titulo="Fecha"
                                        valor={fecha(detalle.venta.creadoEn)}
                                    />
                                    <InfoItem
                                        icono={<Phone size={18} />}
                                        titulo="Teléfono"
                                        valor={detalle.venta.clienteTelefono || "-"}
                                    />
                                    <InfoItem
                                        icono={<Mail size={18} />}
                                        titulo="Correo"
                                        valor={detalle.venta.clienteEmail || "-"}
                                    />
                                </div>

                                <div className="mt-3 rounded-xl bg-slate-950 p-4">
                                    <p className="text-sm text-slate-400">Cliente</p>
                                    <p className="text-lg font-bold">
                                        {detalle.venta.clienteNombre}
                                    </p>

                                    <div className="mt-3 flex gap-2 text-sm text-slate-300">
                                        <MapPin size={18} className="text-cyan-300" />
                                        <span>
                                            {detalle.venta.clienteDireccion || "Sin dirección"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
                                    <table className="w-full min-w-[700px] text-sm">
                                        <thead className="bg-slate-950 text-slate-300">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Código</th>
                                                <th className="px-4 py-3 text-left">Producto</th>
                                                <th className="px-4 py-3 text-center">Tipo</th>
                                                <th className="px-4 py-3 text-center">Cant.</th>
                                                <th className="px-4 py-3 text-right">Precio</th>
                                                <th className="px-4 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detalle.detalle.map((item) => (
                                                <tr
                                                    key={item.detalleVentaId}
                                                    className="border-t border-slate-800"
                                                >
                                                    <td className="px-4 py-3 text-slate-400">
                                                        {item.codigo}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold">
                                                        {item.nombre}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.tipo_item}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.cantidad}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {money(item.precioUnitario)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold">
                                                        {money(item.subtotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <TotalBox titulo="Subtotal" valor={money(detalle.venta.subtotal)} />
                                    <TotalBox titulo="IVA" valor={money(detalle.venta.iva)} />
                                    <TotalBox titulo="Total" valor={money(detalle.venta.total)} destacado />
                                </div>

                                <div className="mt-5 rounded-xl bg-slate-950 p-4 text-sm">
                                    <p>
                                        <span className="text-slate-400">Método pago:</span>{" "}
                                        <b>{detalle.venta.metodoPago}</b>
                                    </p>
                                    <p className="mt-2 break-all">
                                        <span className="text-slate-400">
                                            PayPhone Transaction:
                                        </span>{" "}
                                        {detalle.venta.payphoneTransactionId || "-"}
                                    </p>
                                    <p className="mt-2 break-all">
                                        <span className="text-slate-400">
                                            Client Transaction:
                                        </span>{" "}
                                        {detalle.venta.payphoneClientTransactionId || "-"}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ResumenCard({
    titulo,
    valor,
    icono,
}: {
    titulo: string;
    valor: string;
    icono: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400">{titulo}</p>
                    <p className="mt-2 text-2xl font-bold">{valor}</p>
                </div>
                <div className="rounded-xl bg-cyan-500/15 p-3 text-cyan-300">
                    {icono}
                </div>
            </div>
        </div>
    );
}

function ResumenMini({ titulo, valor }: { titulo: string; valor: string }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">{titulo}</p>
            <p className="mt-1 text-lg font-bold text-cyan-300">{valor}</p>
        </div>
    );
}

function InfoItem({
    icono,
    titulo,
    valor,
}: {
    icono: React.ReactNode;
    titulo: string;
    valor: string;
}) {
    return (
        <div className="rounded-xl bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-cyan-300">
                {icono}
                <span className="text-sm">{titulo}</span>
            </div>
            <p className="mt-2 break-all font-semibold text-white">{valor}</p>
        </div>
    );
}

function TotalBox({
    titulo,
    valor,
    destacado = false,
}: {
    titulo: string;
    valor: string;
    destacado?: boolean;
}) {
    return (
        <div
            className={`rounded-xl p-4 ${destacado
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-950 text-white"
                }`}
        >
            <p className="text-sm opacity-80">{titulo}</p>
            <p className="mt-1 text-xl font-bold">{valor}</p>
        </div>
    );
}