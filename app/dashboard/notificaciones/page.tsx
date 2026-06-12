"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";

type Alerta = {
    alertaId: string;
    equipoNombre: string;
    ipGestion: string;
    tipo: string;
    nivel: "INFO" | "ADVERTENCIA" | "CRITICA";
    mensaje: string;
    creadoEn: string;
};

export default function BotNotificaciones({
    onAbrirAlertas,
}: {
    onAbrirAlertas: () => void;
}) {
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [abierto, setAbierto] = useState(false);
    const [pos, setPos] = useState({ x: 24, y: 120 });
    const [drag, setDrag] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    async function cargarAlertas() {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/wireless-alertas?estado=ABIERTA`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setAlertas(data.datos || []);
            }
        } catch (error) {
            console.error("Error cargando notificaciones:", error);
        }
    }

    useEffect(() => {
        const guardado = localStorage.getItem("bot_notificaciones_pos");

        if (guardado) {
            try {
                setPos(JSON.parse(guardado));
            } catch { }
        }

        cargarAlertas();

        const intervalo = setInterval(() => {
            cargarAlertas();
        }, 60000);

        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        localStorage.setItem("bot_notificaciones_pos", JSON.stringify(pos));
    }, [pos]);

    useEffect(() => {
        function mover(e: MouseEvent) {
            if (!drag) return;

            setPos({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y,
            });
        }

        function soltar() {
            setDrag(false);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);

        return () => {
            window.removeEventListener("mousemove", mover);
            window.removeEventListener("mouseup", soltar);
        };
    }, [drag, offset]);

    const resumen = useMemo(() => {
        return {
            total: alertas.length,
            criticas: alertas.filter((a) => a.nivel === "CRITICA").length,
            advertencias: alertas.filter((a) => a.nivel === "ADVERTENCIA").length,
        };
    }, [alertas]);

    const ultima = alertas[0];

    if (resumen.total === 0) {
        return null;
    }

    return (
        <div
            className="fixed z-[9999]"
            style={{
                left: pos.x,
                top: pos.y,
            }}
        >
            <div
                onMouseDown={(e) => {
                    setDrag(true);
                    setOffset({
                        x: e.clientX - pos.x,
                        y: e.clientY - pos.y,
                    });
                }}
                onClick={() => {
                    if (!drag) setAbierto(!abierto);
                }}
                className="relative cursor-grab active:cursor-grabbing select-none"
            >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 border-4 border-cyan-300 shadow-2xl shadow-cyan-500/40 flex items-center justify-center animate-pulse">
                    <span className="text-4xl">🤖</span>
                </div>

                <div className="absolute -top-2 -right-2 min-w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white text-xs font-black">
                    {resumen.total}
                </div>

                {resumen.criticas > 0 && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap">
                        {resumen.criticas} CRÍTICA
                    </div>
                )}
            </div>

            {abierto && (
                <div className="mt-3 w-80 rounded-2xl border border-cyan-500/40 bg-slate-950/95 shadow-2xl shadow-cyan-500/20 overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="font-black text-white">
                            Bot de Notificaciones
                        </h3>
                        <p className="text-xs text-slate-400">
                            Alertas críticas y advertencias del monitoreo.
                        </p>
                    </div>

                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                        {ultima && (
                            <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-3">
                                <p className="text-xs text-red-300 font-bold">
                                    Última alerta
                                </p>
                                <p className="text-white font-bold text-sm mt-1">
                                    {ultima.equipoNombre || "Equipo wireless"}
                                </p>
                                <p className="text-xs text-slate-300">
                                    {ultima.tipo} · {ultima.ipGestion}
                                </p>
                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                                    {ultima.mensaje}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-slate-900 border border-slate-700 p-2">
                                <p className="text-lg font-black text-white">
                                    {resumen.total}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    Total
                                </p>
                            </div>

                            <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-2">
                                <p className="text-lg font-black text-red-400">
                                    {resumen.criticas}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    Críticas
                                </p>
                            </div>

                            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/40 p-2">
                                <p className="text-lg font-black text-yellow-400">
                                    {resumen.advertencias}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    Avisos
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onAbrirAlertas}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-xl py-2 font-bold text-white"
                        >
                            Ver alertas wireless
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}