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
            setTimeout(() => {
                new window.PPaymentButtonBox(data.payphone).render("pp-button");
            }, 100);
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
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-8">
            <div className="mx-auto w-full max-w-xl rounded-3xl border border-cyan-400/20 bg-slate-900/95 p-5 text-white shadow-2xl">
                <div className="mb-5 text-center">
                    <h1 className="text-2xl font-black tracking-tight text-cyan-300">
                        Pago seguro Netcomp RF S.A.S.
                    </h1>
                    <p className="mt-2 text-sm text-slate-300">{mensaje}</p>
                </div>

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                        {error}
                    </div>
                )}

                {!id && !clientTransactionId && !error && (
                    <div className="mx-auto w-full max-w-[460px] rounded-[22px] border border-orange-500/70 bg-white p-4 shadow-2xl">
                        <div id="pp-button" className="payphone-box" />
                    </div>
                )}

                {confirmando && (
                    <div className="mt-4 rounded-xl bg-cyan-500/10 p-4 text-sm text-cyan-200">
                        Verificando con PayPhone, por favor espera...
                    </div>
                )}

                <button
                    onClick={() => router.push("/inventario/tienda")}
                    className="mx-auto mt-5 block w-full max-w-[460px] rounded-2xl bg-slate-800 px-4 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-700"
                >
                    Volver a la tienda
                </button>
            </div>

            <style jsx global>{`
            .payphone-box {
                width: 100% !important;
                max-width: 420px !important;
                margin: 0 auto !important;
                min-height: 560px !important;
                background: #ffffff !important;
                color: #111827 !important;
                font-family: Arial, Helvetica, sans-serif !important;
                overflow: hidden !important;
            }

            .payphone-box > div {
                width: 100% !important;
                max-width: 420px !important;
                margin: 0 auto !important;
            }

            .payphone-box .ppb-content,
            .payphone-box .ppb-body,
            .payphone-box .payment-box {
                width: 100% !important;
                max-width: 420px !important;
                margin: 0 auto !important;
                background: #ffffff !important;
                color: #111827 !important;
            }

            .payphone-box .payment-box > .ppb-mb-3 {
                display: flex !important;
                flex-wrap: wrap !important;
                align-items: center !important;
                gap: 10px !important;
                margin-bottom: 18px !important;
            }

            .payphone-box .payment-box > .ppb-mb-3 > p {
                width: 100% !important;
                flex: 0 0 100% !important;
                margin: 0 0 4px 0 !important;
                color: #111827 !important;
                font-size: 13px !important;
                font-weight: 700 !important;
            }

            .payphone-box .ppb-div-btn-control {
                display: inline-flex !important;
                width: auto !important;
                margin: 0 !important;
                flex: 1 1 0 !important;
            }

            .payphone-box .ppb-btn-control {
                width: 100% !important;
                min-height: 42px !important;
                border-radius: 12px !important;
                border: 1px solid #ff7300 !important;
                background: #ffffff !important;
                padding: 8px 10px !important;
            }

            .payphone-box .select-btn,
            .payphone-box .ppb-btn-control:hover {
                border-color: #ff7300 !important;
                box-shadow: 0 0 0 1px #ff7300 !important;
            }

            .payphone-box .ppb-row {
                display: flex !important;
                flex-wrap: wrap !important;
                width: 100% !important;
            }

            .payphone-box .ppb-col-12 {
                width: 100% !important;
            }

            .payphone-box .ppb-col-6 {
                width: 50% !important;
            }

            .payphone-box .ppb-g-2 {
                gap: 8px !important;
            }

            .payphone-box .ppb-g-2 .ppb-col-6 {
                width: calc(50% - 4px) !important;
                padding: 0 !important;
            }

            .payphone-box .message {
                color: #111827 !important;
                font-size: 13px !important;
                font-weight: 700 !important;
                margin-bottom: 8px !important;
            }

            .payphone-box input,
            .payphone-box select,
            .payphone-box .ppb-form-select {
                width: 100% !important;
                height: 42px !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 12px !important;
                background: #ffffff !important;
                color: #111827 !important;
                font-size: 13px !important;
                outline: none !important;
            }

            .payphone-box input {
                padding: 9px 12px !important;
            }

            .payphone-box select,
            .payphone-box .ppb-form-select {
                padding: 0 12px !important;
            }

            .payphone-box input::placeholder {
                color: #6b7280 !important;
            }

            .payphone-box .ppb-input-group {
                display: flex !important;
                align-items: center !important;
                width: 100% !important;
                margin-bottom: 10px !important;
            }

            .payphone-box .ppb-input-group-text {
                height: 42px !important;
                min-width: 42px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border: 1px solid #e5e7eb !important;
                border-right: 0 !important;
                border-radius: 12px 0 0 12px !important;
                background: #ffffff !important;
            }

            .payphone-box .ppb-input-group-text + input {
                border-left: 0 !important;
                border-radius: 0 12px 12px 0 !important;
            }

            .payphone-box .country-selector {
                display: flex !important;
                width: 100% !important;
                height: 42px !important;
                margin-bottom: 10px !important;
            }

            .payphone-box .flag-container {
                width: 94px !important;
                flex: 0 0 94px !important;
            }

            .payphone-box .selected-flag {
                height: 42px !important;
                border-radius: 12px 0 0 12px !important;
                background: #ff7300 !important;
                color: #ffffff !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 6px !important;
            }

            .payphone-box .selected-code {
                color: #ffffff !important;
                font-weight: 800 !important;
            }

            .payphone-box #phoneNumber {
                border-radius: 0 12px 12px 0 !important;
            }

            .payphone-box .ppb-hr {
                margin: 16px 0 !important;
                border-top: 1px dashed #d1d5db !important;
            }

            .payphone-box .ppb-text-total,
            .payphone-box .ppb-text-amount {
                width: 50% !important;
            }

            .payphone-box .ppb-text-total h4,
            .payphone-box .ppb-text-amount h4 {
                margin: 0 !important;
                font-size: 16px !important;
                font-weight: 900 !important;
                color: #111827 !important;
            }

            .payphone-box .ppb-text-amount {
                text-align: right !important;
            }

            .payphone-box .ppb-text-amount h4 {
                color: #ff7300 !important;
            }

            .payphone-box .ppb-btn-pay {
                width: 100% !important;
                height: 48px !important;
                border-radius: 14px !important;
                background: #ff7300 !important;
                color: #ffffff !important;
                font-size: 16px !important;
                font-weight: 900 !important;
                border: none !important;
                cursor: pointer !important;
                margin-top: 14px !important;
            }

            .payphone-box .message-button {
                color: #ffffff !important;
                font-weight: 900 !important;
            }

            .payphone-box img {
                max-width: 100% !important;
                height: auto !important;
            }

            .payphone-box .ppb-footer-image-container {
                margin-top: 16px !important;
            }

            .payphone-box .ppb-footer-image {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 10px !important;
                flex-wrap: nowrap !important;
            }
        `}</style>
        </main>
    );
}