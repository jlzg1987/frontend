"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { API_BASE } from "@/src/lib/api";

export default function PagoPayphoneContenido() {
    const router = useRouter();
    const params = useSearchParams();

    const pedidoId = params.get("pedidoId");

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState(
        "Estamos verificando tu pago con PayPhone..."
    );

    async function consultarEstadoPedido() {
        if (!pedidoId) {
            setError("No se recibió el pedidoId.");
            setCargando(false);
            return;
        }

        try {
            setError("");

            const res = await fetch(
                `${API_BASE}/tienda/payphone/estado-pedido/${pedidoId}`,
                { method: "GET" }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo consultar el pedido.");
            }

            if (data.estado === "PAGADO" || data.pedidoEstado === "PAGADO") {
                localStorage.removeItem("tienda_pedido_activo");
                localStorage.removeItem("tienda_carrito");

                window.dispatchEvent(new Event("tienda-carrito-actualizado"));

                setMensaje("Pago confirmado correctamente. Redirigiendo...");

                router.push(`/inventario/tienda/pedido-exitoso?pedidoId=${pedidoId}`);
                return;
            }

            if (data.estado === "ANULADO") {
                setError("Este pedido fue anulado.");
                setCargando(false);
                return;
            }

            setMensaje(
                "Pago enviado. Estamos esperando la confirmación automática de PayPhone."
            );
            setCargando(false);
        } catch (err: any) {
            console.error("Error consultando estado del pedido:", err);
            setError(err.message || "Error consultando estado del pago.");
            setCargando(false);
        }
    }

    useEffect(() => {
        consultarEstadoPedido();

        if (!pedidoId) return;

        const timer = setInterval(() => {
            consultarEstadoPedido();
        }, 5000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pedidoId]);

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
            <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl">
                <button
                    onClick={() => router.push("/inventario/tienda")}
                    className="mb-6 flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"
                >
                    <ArrowLeft size={18} />
                    Volver a la tienda
                </button>

                {cargando && (
                    <div className="text-center">
                        <Clock className="mx-auto mb-4 text-cyan-300" size={56} />
                        <h1 className="text-2xl font-black">Verificando pago...</h1>
                        <p className="mt-2 text-slate-400">{mensaje}</p>
                    </div>
                )}

                {!cargando && error && (
                    <div className="text-center">
                        <XCircle className="mx-auto mb-4 text-red-400" size={64} />
                        <h1 className="text-2xl font-black">No se pudo confirmar</h1>

                        <p className="mt-3 rounded-2xl bg-red-500/10 p-3 text-red-200">
                            {error}
                        </p>

                        <button
                            onClick={() => {
                                setCargando(true);
                                consultarEstadoPedido();
                            }}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 hover:bg-amber-300"
                        >
                            <RefreshCw size={18} />
                            Reintentar verificación
                        </button>
                    </div>
                )}

                {!cargando && !error && (
                    <div className="text-center">
                        <CheckCircle className="mx-auto mb-4 text-emerald-400" size={70} />

                        <h1 className="text-3xl font-black text-emerald-300">
                            Pago en revisión
                        </h1>

                        <p className="mt-3 text-slate-300">{mensaje}</p>

                        <button
                            onClick={() => {
                                setCargando(true);
                                consultarEstadoPedido();
                            }}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300"
                        >
                            <RefreshCw size={18} />
                            Verificar otra vez
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}