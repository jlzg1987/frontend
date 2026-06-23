"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    Package,
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    ShoppingBag,
    CreditCard,
} from "lucide-react";
import { API_BASE, getToken } from "@/src/lib/api";

type Pedido = {
    pedidoId: string;
    empresaId: number;
    clienteNombre: string;
    clienteTelefono: string;
    clienteEmail: string | null;
    clienteDireccion: string | null;
    observacion: string | null;
    subtotal: string | number;
    iva: string | number;
    total: string | number;
    estado: "PENDIENTE" | "PAGADO" | "ENTREGADO" | "ANULADO";
    creadoEn: string;
};

type DetallePedido = {
    detalleId: number;
    pedidoId: string;
    productoId: number;
    codigo: string | null;
    nombre: string;
    tipo_item: "PRODUCTO" | "SERVICIO";
    cantidad: number;
    precioUnitario: string | number;
    subtotal: string | number;
    aplicaIva: "SI" | "NO";
};

function money(valor: string | number) {
    return Number(valor || 0).toFixed(2);
}
export default function PedidoTiendaPage() {
    const params = useParams();
    const router = useRouter();

    const pedidoId = params.pedidoId as string;

    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [detalles, setDetalles] = useState<DetallePedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [pagando, setPagando] = useState(false);
    const [errorPago, setErrorPago] = useState("");

    const [verificandoPago, setVerificandoPago] = useState(false);
    const [linkPagoGenerado, setLinkPagoGenerado] = useState(false);

    const token = getToken();


    async function cargarPedido() {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${API_BASE}/tienda-pedidos/${pedidoId}`, {
                cache: "no-store",
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo cargar el pedido.");
            }

            setPedido(data.pedido);
            setDetalles(data.detalles || []);
        } catch (err: any) {
            console.error("Error cargarPedido:", err);
            setError(err.message || "Error cargando pedido.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (pedidoId) cargarPedido();
    }, [pedidoId]);

    function whatsappPedido() {
        if (!pedido) return "#";

        const detalleTexto = detalles
            .map((item, index) => {
                return `${index + 1}. ${item.nombre}
Código: ${item.codigo || "N/A"}
Cantidad: ${item.cantidad}
Precio: $${money(item.precioUnitario)}
Subtotal: $${money(item.subtotal)}`;
            })
            .join("\n\n");

        const texto = `Hola Netcomp RF, acabo de crear un pedido en la tienda online.

Pedido: ${pedido.pedidoId}
Cliente: ${pedido.clienteNombre}
Teléfono: ${pedido.clienteTelefono}

Detalle:
${detalleTexto}

Subtotal: $${money(pedido.subtotal)}
IVA: $${money(pedido.iva)}
TOTAL: $${money(pedido.total)}

Quiero continuar con la compra.`;

        return `https://wa.me/593988899116?text=${encodeURIComponent(texto)}`;
    }

    async function pagarConPayPhone() {
        try {
            setPagando(true);

            const res = await fetch(`${API_BASE}/tienda/payphone/crear-link`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pedidoId,
                }),
            });

            const data = await res.json().catch(() => null);

            console.log("RESPUESTA PAYPHONE:", {
                status: res.status,
                okHttp: res.ok,
                data,
            });

            if (!res.ok || !data?.ok) {
                throw new Error(
                    data?.mensaje ||
                    data?.message ||
                    "No se pudo generar el link de pago."
                );
            }

            window.open(data.linkPago, "_blank", "noopener,noreferrer");
            setLinkPagoGenerado(true);
        } catch (error: any) {
            console.error("Error pagarConPayPhone:", error);
            alert(error.message || "No se pudo generar el link de pago.");
        } finally {
            setPagando(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                    <Clock className="mx-auto mb-4 animate-spin text-cyan-300" size={42} />
                    <p className="font-bold text-slate-300">Cargando pedido...</p>
                </div>
            </main>
        );
    }

    if (error || !pedido) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-white">
                <div className="max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
                    <h1 className="text-2xl font-black">Pedido no encontrado</h1>
                    <p className="mt-3 text-red-200">{error || "No existe este pedido."}</p>

                    <button
                        onClick={() => router.push("/inventario/tienda")}
                    >
                        Volver a la tienda
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
            <div className="mx-auto max-w-6xl">
                <button
                    onClick={() => router.push("/inventario/tienda")}
                    className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10"
                >
                    <ArrowLeft size={18} />
                    Volver a la tienda
                </button>


                <section className="overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-fuchsia-500/10 p-6 shadow-2xl">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-3 flex w-fit items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950">
                                <CheckCircle size={18} />
                                Pedido creado
                            </div>

                            <h1 className="text-3xl font-black md:text-5xl">
                                Tu pedido está pendiente
                            </h1>

                            <p className="mt-3 max-w-2xl text-slate-300">
                                Hemos registrado tu pedido. Puedes continuar por WhatsApp o pagar con PayPhone cuando activemos la siguiente fase.
                            </p>

                            <p className="mt-4 break-all text-sm text-slate-400">
                                Código de pedido:{" "}
                                <span className="font-black text-cyan-300">{pedido.pedidoId}</span>
                            </p>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-center">
                            <p className="text-sm text-slate-400">Total a pagar</p>
                            <p className="text-5xl font-black text-cyan-300">
                                ${money(pedido.total)}
                            </p>

                            <span className="mt-3 inline-flex rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-slate-950">
                                {pedido.estado}
                            </span>
                        </div>
                    </div>
                </section>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                        <div className="mb-5 flex items-center gap-3">
                            <ShoppingBag className="text-cyan-300" size={26} />
                            <h2 className="text-2xl font-black">Detalle del pedido</h2>
                        </div>

                        <div className="space-y-4">
                            {detalles.map((item) => (
                                <div
                                    key={item.detalleId}
                                    className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h3 className="text-lg font-black">{item.nombre}</h3>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Código: {item.codigo || "N/A"} · {item.tipo_item}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-400">
                                                IVA: {item.aplicaIva}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-slate-400">
                                                {item.cantidad} x ${money(item.precioUnitario)}
                                            </p>
                                            <p className="text-2xl font-black text-cyan-300">
                                                ${money(item.subtotal)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                            <div className="flex justify-between text-slate-300">
                                <span>Subtotal</span>
                                <span>${money(pedido.subtotal)}</span>
                            </div>

                            <div className="mt-2 flex justify-between text-slate-300">
                                <span>IVA</span>
                                <span>${money(pedido.iva)}</span>
                            </div>

                            <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
                                <span className="text-xl font-black">Total</span>
                                <span className="text-3xl font-black text-cyan-300">
                                    ${money(pedido.total)}
                                </span>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                            <h2 className="mb-5 text-2xl font-black">Datos del cliente</h2>

                            <div className="space-y-4 text-slate-300">
                                <div className="flex gap-3">
                                    <Package className="mt-1 text-cyan-300" size={20} />
                                    <div>
                                        <p className="text-xs text-slate-500">Cliente</p>
                                        <p className="font-bold">{pedido.clienteNombre}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Phone className="mt-1 text-cyan-300" size={20} />
                                    <div>
                                        <p className="text-xs text-slate-500">Teléfono</p>
                                        <p className="font-bold">{pedido.clienteTelefono}</p>
                                    </div>
                                </div>

                                {pedido.clienteEmail && (
                                    <div className="flex gap-3">
                                        <Mail className="mt-1 text-cyan-300" size={20} />
                                        <div>
                                            <p className="text-xs text-slate-500">Correo</p>
                                            <p className="font-bold">{pedido.clienteEmail}</p>
                                        </div>
                                    </div>
                                )}

                                {pedido.clienteDireccion && (
                                    <div className="flex gap-3">
                                        <MapPin className="mt-1 text-cyan-300" size={20} />
                                        <div>
                                            <p className="text-xs text-slate-500">Dirección</p>
                                            <p className="font-bold">{pedido.clienteDireccion}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                            <h2 className="mb-4 text-xl font-black">Continuar compra</h2>

                            <a
                                href={whatsappPedido()}
                                target="_blank"
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white transition hover:bg-emerald-400"
                            >
                                <MessageCircle size={22} />
                                Confirmar por WhatsApp
                            </a>
                            {linkPagoGenerado && pedido.estado === "PENDIENTE" && (
                                <div className="mt-4 rounded-2xl border border-amber-400 bg-amber-500/10 p-4 text-center">
                                    <p className="text-sm font-bold text-amber-300">
                                        ⏳ Si ya realizaste el pago en PayPhone, presiona el botón de abajo
                                        para confirmar tu compra inmediatamente.
                                    </p>
                                </div>
                            )}

                            {!linkPagoGenerado ? (
                                <button
                                    onClick={pagarConPayPhone}
                                    disabled={pagando || pedido.estado !== "PENDIENTE"}
                                    className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                                >
                                    <CreditCard size={22} />
                                    {pagando ? "Generando link..." : "💳 Pagar con PayPhone"}
                                </button>
                            ) : (
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/inventario/tienda/pago-payphone?pedidoId=${pedido.pedidoId}`
                                        )
                                    }
                                    disabled={verificandoPago || pedido.estado === "PAGADO"}
                                    className="
            mt-3
            flex
            w-full
            animate-pulse
            items-center
            justify-center
            gap-3
            rounded-2xl
            border-2
            border-amber-300
            bg-gradient-to-r
            from-amber-400
            via-yellow-300
            to-amber-400
            px-5
            py-5
            font-black
            text-slate-950
            shadow-lg
            shadow-amber-500/40
            transition
            hover:scale-[1.02]
            hover:from-amber-300
            hover:to-yellow-200
            disabled:cursor-not-allowed
            disabled:animate-none
            disabled:bg-slate-700
            disabled:text-slate-400
        "
                                >
                                    ⚠️
                                    {verificandoPago
                                        ? "Verificando pago con PayPhone..."
                                        : "YA PAGUÉ • VERIFICAR MI PAGO"}
                                </button>
                            )}

                            {errorPago && (
                                <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-200">
                                    {errorPago}
                                </p>
                            )}
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}