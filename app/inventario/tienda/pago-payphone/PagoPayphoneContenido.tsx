"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE } from "@/src/lib/api";

export default function PagoPayphoneContenido() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const id = searchParams.get("id");
    const clientTransactionId = searchParams.get("clientTransactionId");

    const [estado, setEstado] = useState("Confirmando pago...");
    const [error, setError] = useState("");

    useEffect(() => {
        async function confirmarPago() {
            try {
                if (!id || !clientTransactionId) {
                    throw new Error("Faltan datos de PayPhone para confirmar el pago.");
                }

                const res = await fetch(`${API_BASE}/tienda/payphone-cajita/confirmar`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id,
                        clientTransactionId,
                    }),
                });

                const data = await res.json();

                if (!res.ok || !data.ok) {
                    throw new Error(data.mensaje || data.message || "No se pudo confirmar el pago.");
                }

                localStorage.removeItem("pedidoPayphonePendiente");
                localStorage.removeItem("carritoTiendaNetcomp");
                localStorage.removeItem("tienda_pedido_activo");

                setEstado("Pago aprobado. Redirigiendo al recibo...");

                setTimeout(() => {
                    router.replace(`/inventario/tienda/pedido-exitoso?pedidoId=${data.pedidoId}`);
                }, 1200);
            } catch (err: any) {
                setError(err.message || "Error confirmando el pago.");
                setEstado("");
            }
        }

        confirmarPago();
    }, [id, clientTransactionId, router]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
            <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                    ✅
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                    Confirmando pago
                </h1>

                {estado && (
                    <p className="mt-3 text-slate-600">
                        {estado}
                    </p>
                )}

                {error && (
                    <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <button
                    onClick={() => router.push("/inventario/tienda")}
                    className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                    Volver a la tienda
                </button>
            </section>
        </main>
    );
}