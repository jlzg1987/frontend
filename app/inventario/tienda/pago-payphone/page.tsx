"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Clock, XCircle, ArrowLeft } from "lucide-react";
import { API_BASE, getToken } from "@/src/lib/api";

type Pago = {
    pagoId: string;
    pedidoId: string;
    clientTransactionId: string;
    transactionId: number | null;
    amount: number;
    currency: string;
    transactionStatus: string;
    statusCode: number | null;
    authorizationCode: string | null;
    estado: "PENDIENTE" | "APROBADO" | "CANCELADO" | "ERROR";
    linkPago: string | null;
};

export default function PagoPayphonePage() {
    const router = useRouter();
    const params = useSearchParams();
    const pagoId = params.get("pagoId");

    const [pago, setPago] = useState<Pago | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    async function cargarEstado() {
        if (!pagoId) {
            setError("No se recibió el ID del pago.");
            setCargando(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/tienda/payphone/estado/${pagoId}`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo consultar el pago.");
            }

            setPago(data.pago);
        } catch (err: any) {
            setError(err.message || "Error consultando pago.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarEstado();

        const timer = setInterval(() => {
            cargarEstado();
        }, 5000);

        return () => clearInterval(timer);
    }, [pagoId]);

    useEffect(() => {
        if (pago?.estado === "APROBADO") {
            const timer = setTimeout(() => {
                router.push(`/inventario/tienda/pedido-exitoso?pedidoId=${pago.pedidoId}`);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [pago, router]);


    const estado = pago?.estado || "PENDIENTE";

    const monto = pago
        ? `$${(Number(pago.amount || 0) / 100).toFixed(2)}`
        : "$0.00";

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
                        <p className="mt-2 text-slate-400">
                            Estamos verificando la respuesta de PayPhone.
                        </p>
                    </div>
                )}

                {!cargando && error && (
                    <div className="text-center">
                        <XCircle className="mx-auto mb-4 text-red-400" size={64} />
                        <h1 className="text-2xl font-black">Error en la pasarela</h1>
                        <p className="mt-3 rounded-2xl bg-red-500/10 p-3 text-red-200">
                            {error}
                        </p>
                    </div>
                )}

                {!cargando && !error && pago && estado === "APROBADO" && (
                    <div className="text-center">
                        <CheckCircle className="mx-auto mb-4 text-emerald-400" size={70} />
                        <h1 className="text-3xl font-black text-emerald-300">
                            Pago confirmado
                        </h1>
                        <p className="mt-3 text-slate-300">
                            Tu compra fue aprobada correctamente.
                        </p>

                        <div className="mt-6 rounded-2xl bg-slate-950/70 p-4 text-left text-sm">
                            <p><b>Monto:</b> {monto}</p>
                            <p><b>Autorización:</b> {pago.authorizationCode || "N/A"}</p>
                            <p><b>Transacción:</b> {pago.transactionId || "N/A"}</p>
                            <p><b>Pedido:</b> {pago.pedidoId}</p>
                        </div>
                    </div>
                )}

                {!cargando && !error && pago && estado === "PENDIENTE" && (
                    <div className="text-center">
                        <Clock className="mx-auto mb-4 text-yellow-300" size={70} />
                        <h1 className="text-3xl font-black text-yellow-200">
                            Pago pendiente
                        </h1>
                        <p className="mt-3 text-slate-300">
                            Todavía no recibimos la confirmación de PayPhone.
                        </p>

                        {pago.linkPago && (
                            <a
                                href={pago.linkPago}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 block rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 hover:bg-cyan-300"
                            >
                                Abrir link de pago otra vez
                            </a>
                        )}
                    </div>
                )}

                {!cargando && !error && pago && estado !== "PENDIENTE" && estado !== "APROBADO" && (
                    <div className="text-center">
                        <XCircle className="mx-auto mb-4 text-red-400" size={70} />
                        <h1 className="text-3xl font-black text-red-300">
                            Pago rechazado o cancelado
                        </h1>
                        <p className="mt-3 text-slate-300">
                            PayPhone no confirmó este pago como aprobado.
                        </p>

                        <div className="mt-6 rounded-2xl bg-slate-950/70 p-4 text-left text-sm">
                            <p><b>Estado:</b> {pago.transactionStatus}</p>
                            <p><b>Código:</b> {pago.statusCode || "N/A"}</p>
                            <p><b>Pedido:</b> {pago.pedidoId}</p>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}