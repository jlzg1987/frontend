"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/src/lib/api";

declare global {
    interface Window {
        PPaymentButtonBox?: any;
    }
}

export default function PagoCajitaContenido() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const pedidoId = searchParams.get("pedidoId");
    const id = searchParams.get("id");
    const clientTransactionId = searchParams.get("clientTransactionId");

    const [mensaje, setMensaje] = useState("Preparando pago...");
    const [error, setError] = useState("");
    const [confirmando, setConfirmando] = useState(false);

    const yaRenderizo = useRef(false);
    const yaConfirmo = useRef(false);

    useEffect(() => {
        if (id && clientTransactionId) {
            confirmarPago();
            return;
        }

        if (pedidoId) {
            prepararCajita();
            return;
        }

        setError("No se encontró el pedido para pagar.");
    }, []);

    const cargarScriptPayphone = () => {
        return new Promise<void>((resolve, reject) => {
            if (window.PPaymentButtonBox) {
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src = "https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js";
            script.async = true;

            script.onload = () => resolve();
            script.onerror = () => reject(new Error("No se pudo cargar PayPhone"));

            document.body.appendChild(script);
        });
    };

    const prepararCajita = async () => {
        try {
            if (!pedidoId) return;

            setMensaje("Preparando Cajita PayPhone...");

            const res = await fetch(`${API_BASE}/tienda/payphone-cajita/preparar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ pedidoId }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || data.message || "No se pudo preparar el pago");
            }

            await cargarScriptPayphone();

            if (!window.PPaymentButtonBox) {
                throw new Error("PayPhone no está disponible");
            }

            if (yaRenderizo.current) return;
            yaRenderizo.current = true;

            setMensaje("Completa tu pago de forma segura.");

            new window.PPaymentButtonBox(data.payphone).render("pp-button");
        } catch (err: any) {
            setError(err.message || "Error preparando pago PayPhone");
        }
    };

    const confirmarPago = async () => {
        try {
            if (yaConfirmo.current) return;
            yaConfirmo.current = true;

            setConfirmando(true);
            setMensaje("Confirmando pago...");

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
                throw new Error(data.mensaje || data.message || "Pago no aprobado");
            }

            setMensaje("Pago aprobado correctamente.");

            router.replace(`/inventario/tienda/pedido-exitoso/${data.pedidoId}`);
        } catch (err: any) {
            setError(err.message || "Error confirmando el pago");
        } finally {
            setConfirmando(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
                <h1 className="mb-2 text-2xl font-bold text-cyan-300">
                    Pago seguro NETCOMP
                </h1>

                <p className="mb-6 text-sm text-slate-300">{mensaje}</p>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {!id && !clientTransactionId && !error && (
                    <div
                        id="pp-button"
                        className="flex min-h-[120px] items-center justify-center rounded-2xl bg-white p-4"
                    />
                )}

                {confirmando && (
                    <div className="mt-4 rounded-xl bg-cyan-500/10 p-4 text-sm text-cyan-200">
                        Verificando con PayPhone, por favor espera...
                    </div>
                )}

                <button
                    onClick={() => router.push("/inventario/tienda")}
                    className="mt-6 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                >
                    Volver a la tienda
                </button>
            </div>
        </main>
    );
}