"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE } from "@/src/lib/api";

export default function PagoPayphoneContenido() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [estado, setEstado] = useState("Verificando pago...");
    const [error, setError] = useState("");
    const [pedidoMostrado, setPedidoMostrado] = useState("");

    useEffect(() => {
        async function verificarPago() {
            try {
                const pedidoIdUrl = searchParams.get("pedidoId");
                const pedidoIdLocal = localStorage.getItem("pedidoPayphonePendiente");

                const pedidoId = pedidoIdUrl || pedidoIdLocal;

                if (!pedidoId) {
                    setError("No se encontró el pedido pendiente para verificar el pago.");
                    setEstado("");
                    return;
                }

                setPedidoMostrado(pedidoId);

                const res = await fetch(
                    `${API_BASE}/tienda/payphone/verificar-pedido/${pedidoId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                const data = await res.json();

                if (!res.ok || !data.ok) {
                    throw new Error(data.mensaje || "No se pudo verificar el pago.");
                }

                if (data.estado === "PAGADO" || data.pedidoEstado === "PAGADO") {
                    setEstado("Pago aprobado. Redirigiendo...");

                    localStorage.removeItem("pedidoPayphonePendiente");
                    localStorage.removeItem("carritoTiendaNetcomp");

                    setTimeout(() => {
                        router.push(`/inventario/tienda/pedido-exitoso?pedidoId=${pedidoId}`);
                    }, 1500);

                    return;
                }

                setEstado("Pago pendiente o no confirmado todavía. Reintentando...");

                setTimeout(() => {
                    verificarPago();
                }, 4000);
            } catch (err: any) {
                setError(err.message || "Error verificando el pago.");
                setEstado("");
            }
        }

        verificarPago();
    }, [searchParams, router]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
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

                {pedidoMostrado && (
                    <p className="mt-4 text-xs text-slate-400">
                        Pedido: {pedidoMostrado}
                    </p>
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