"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";
import { API_BASE } from "@/src/lib/api";

export default function PagoPayphoneContenido() {
    const router = useRouter();
    const params = useSearchParams();

    const pedidoId = params.get("pedidoId");
    const id = params.get("id");
    const paymentId = params.get("paymentId");

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("Confirmando pago con PayPhone...");

    async function confirmarRetornoPayPhone() {
        if (!pedidoId) {
            setError("No se recibió el pedidoId.");
            setCargando(false);
            return;
        }

        if (!id && !paymentId) {
            const res = await fetch(
                `${API_BASE}/tienda/payphone/verificar-pedido/${pedidoId}`,
                {
                    method: "POST",
                }
            );

            const data = await res.json();

            if (data.estado === "PAGADO") {
                router.push(
                    `/inventario/tienda/pedido-exitoso?pedidoId=${pedidoId}`
                );
                return;
            }

            setMensaje("El pago aún no ha sido confirmado.");
            return;
        }

        try {
            setCargando(true);
            setError("");
            setMensaje("Confirmando pago con PayPhone...");

            const res = await fetch(`${API_BASE}/tienda/payphone/confirmar-retorno`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pedidoId,
                    id,
                    paymentId,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo confirmar el pago.");
            }

            if (data.estado === "PAGADO" || data.pedidoEstado === "PAGADO") {
                setMensaje("Pago confirmado correctamente. Redirigiendo...");
                localStorage.removeItem("tienda_pedido_activo");

                setTimeout(() => {
                    router.push(`/inventario/tienda/pedido-exitoso?pedidoId=${pedidoId}`);
                }, 1500);

                return;
            }

            setMensaje("El pago todavía está pendiente de confirmación.");
        } catch (err: any) {
            console.error("Error confirmarRetornoPayPhone:", err);
            setError(err.message || "Error confirmando pago.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        if (!pedidoId) return;

        confirmarRetornoPayPhone();
    }, [pedidoId, id, paymentId]);

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
                        <h1 className="text-2xl font-black">Consultando pago...</h1>
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
                            onClick={confirmarRetornoPayPhone}
                            className="mt-5 w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 hover:bg-amber-300"
                        >
                            Reintentar confirmación
                        </button>
                    </div>
                )}

                {!cargando && !error && (
                    <div className="text-center">
                        <CheckCircle className="mx-auto mb-4 text-emerald-400" size={70} />
                        <h1 className="text-3xl font-black text-emerald-300">
                            Pago confirmado
                        </h1>
                        <p className="mt-3 text-slate-300">{mensaje}</p>
                    </div>
                )}
            </section>
        </main>
    );
}