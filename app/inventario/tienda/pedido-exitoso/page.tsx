"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Printer, ArrowLeft, ReceiptText } from "lucide-react";
import { API_BASE, getToken } from "@/src/lib/api";

type Item = {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
};

type Recibo = {
    pedido: {
        pedidoId: string;
        numeroPedido?: string;
        estado: string;
        total: number;
        creadoEn: string;
    };
    pago: {
        transactionId: number | null;
        authorizationCode: string | null;
        transactionStatus: string;
        amount: number;
        currency: string;
    } | null;
    cliente: {
        nombre?: string;
        cedula?: string;
        telefono?: string;
        email?: string;
        direccion?: string;
    };
    items: Item[];
};

export default function PedidoExitosoPage() {
    const router = useRouter();
    const params = useSearchParams();
    const pedidoId = params.get("pedidoId");

    const [recibo, setRecibo] = useState<Recibo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    async function cargarRecibo() {
        if (!pedidoId) {
            setError("No se recibió el pedidoId.");
            setCargando(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/tienda/pedidos/${pedidoId}/recibo`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || "No se pudo cargar el recibo.");
            }

            setRecibo(data.recibo);
        } catch (err: any) {
            setError(err.message || "Error cargando recibo.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarRecibo();
    }, [pedidoId]);

    const total = Number(recibo?.pedido.total || 0);

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-2xl print:shadow-none">
                <div className="mb-6 flex items-center justify-between print:hidden">
                    <button
                        onClick={() => router.push("/inventario/tienda")}
                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
                    >
                        <ArrowLeft size={18} />
                        Volver
                    </button>

                    {recibo && (
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-400"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
                    )}
                </div>

                {cargando && (
                    <div className="py-16 text-center">
                        <ReceiptText className="mx-auto mb-4 text-slate-500" size={60} />
                        <h1 className="text-2xl font-black">Cargando recibo...</h1>
                    </div>
                )}

                {!cargando && error && (
                    <div className="py-16 text-center">
                        <h1 className="text-2xl font-black text-red-600">Error</h1>
                        <p className="mt-3">{error}</p>
                    </div>
                )}

                {!cargando && recibo && (
                    <>
                        <div className="border-b pb-5 text-center">
                            <CheckCircle className="mx-auto mb-3 text-emerald-500" size={65} />
                            <h1 className="text-3xl font-black">Pago recibido</h1>
                            <p className="text-sm text-slate-500">
                                Pedido confirmado para despacho
                            </p>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div>
                                <h2 className="font-black">NETCOMP RF S.A.S.</h2>
                                <p className="text-sm text-slate-600">Comprobante de compra</p>
                                <p className="text-sm text-slate-600">
                                    Fecha: {new Date(recibo.pedido.creadoEn).toLocaleString()}
                                </p>
                            </div>

                            <div className="text-left sm:text-right">
                                <p className="text-sm">
                                    <b>Pedido:</b> {recibo.pedido.numeroPedido || recibo.pedido.pedidoId}
                                </p>
                                <p className="text-sm">
                                    <b>Estado:</b> {recibo.pedido.estado}
                                </p>
                                <p className="text-sm">
                                    <b>Transacción:</b> {recibo.pago?.transactionId || "N/A"}
                                </p>
                                <p className="text-sm">
                                    <b>Autorización:</b> {recibo.pago?.authorizationCode || "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl bg-slate-100 p-4">
                            <h3 className="mb-2 font-black">Datos del cliente / despacho</h3>
                            <p><b>Cliente:</b> {recibo.cliente.nombre || "Consumidor final"}</p>
                            <p><b>Cédula/RUC:</b> {recibo.cliente.cedula || "N/A"}</p>
                            <p><b>Teléfono:</b> {recibo.cliente.telefono || "N/A"}</p>
                            <p><b>Email:</b> {recibo.cliente.email || "N/A"}</p>
                            <p><b>Dirección:</b> {recibo.cliente.direccion || "N/A"}</p>
                        </div>

                        <div className="mt-6 overflow-hidden rounded-2xl border">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="p-3 text-left">Producto</th>
                                        <th className="p-3 text-center">Cant.</th>
                                        <th className="p-3 text-right">Precio</th>
                                        <th className="p-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recibo.items.map((item) => (
                                        <tr key={item.productoId} className="border-b">
                                            <td className="p-3">{item.nombre}</td>
                                            <td className="p-3 text-center">{item.cantidad}</td>
                                            <td className="p-3 text-right">
                                                ${Number(item.precioUnitario).toFixed(2)}
                                            </td>
                                            <td className="p-3 text-right font-bold">
                                                ${Number(item.subtotal).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div className="w-full max-w-xs rounded-2xl bg-slate-900 p-4 text-white">
                                <div className="flex justify-between text-lg font-black">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                                <p className="mt-2 text-xs text-slate-300">
                                    Pago confirmado mediante PayPhone.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 print:hidden">
                            ✅ Este pedido ya puede pasar a facturación interna/SRI y despacho.
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}