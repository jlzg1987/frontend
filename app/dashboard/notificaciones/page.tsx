"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";
import Image from "next/image";

type Notificacion = {
    notificacionId: string;
    modulo:
    | "WIRELESS"
    | "MENSUALIDADES"
    | "SRI_EMAIL"
    | "SRI_ANULACION"
    | "SRI_NOTA_CREDITO"
    | "SISTEMA";
    tipo: string;
    nivel: "INFO" | "ADVERTENCIA" | "CRITICA";
    titulo: string;
    mensaje: string;
    total: number;
    estado: "NUEVA" | "VISTA" | "RESUELTA";
    creadoEn: string;
};

type Resumen = {
    totalNuevas: number;
    criticas: number;
    advertencias: number;
    info: number;
    wireless: number;
    mensualidades: number;
    sriEmail: number;
    sriAnulacion: number;
    sriNotaCredito: number;
};

export default function BotNotificaciones({
    onAbrirAlertas,
}: {
    onAbrirAlertas: () => void;
}) {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [resumen, setResumen] = useState<Resumen>({
        totalNuevas: 0,
        criticas: 0,
        advertencias: 0,
        info: 0,
        wireless: 0,
        mensualidades: 0,
        sriEmail: 0,
        sriAnulacion: 0,
        sriNotaCredito: 0,
    });

    const [abierto, setAbierto] = useState(false);
    const [pos, setPos] = useState({ x: 24, y: 120 });
    const [drag, setDrag] = useState(false);
    const [moviendo, setMoviendo] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    async function cargarNotificaciones() {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/notificaciones-sistema/resumen`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setResumen({
                    totalNuevas: Number(data.resumen?.totalNuevas || 0),
                    criticas: Number(data.resumen?.criticas || 0),
                    advertencias: Number(data.resumen?.advertencias || 0),
                    info: Number(data.resumen?.info || 0),
                    wireless: Number(data.resumen?.wireless || 0),
                    mensualidades: Number(data.resumen?.mensualidades || 0),
                    sriEmail: Number(data.resumen?.sriEmail || 0),
                    sriAnulacion: Number(data.resumen?.sriAnulacion || 0),
                    sriNotaCredito: Number(data.resumen?.sriNotaCredito || 0),
                });

                setNotificaciones(data.ultimas || []);
            }
        } catch (error) {
            console.error("Error cargando notificaciones:", error);
        }
    }

    async function marcarTodasVistas() {
        try {
            const token = getToken();

            await fetch(`${API_BASE}/notificaciones-sistema/marcar-todas-vistas`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            await cargarNotificaciones();
            setAbierto(false);
        } catch (error) {
            console.error("Error marcando notificaciones:", error);
        }
    }

    useEffect(() => {
        const guardado = localStorage.getItem("bot_notificaciones_pos");

        if (guardado) {
            try {
                setPos(JSON.parse(guardado));
            } catch { }
        }

        cargarNotificaciones();

        const intervalo = setInterval(() => {
            cargarNotificaciones();
        }, 60000);

        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        localStorage.setItem("bot_notificaciones_pos", JSON.stringify(pos));
    }, [pos]);

    useEffect(() => {
        function mover(e: MouseEvent) {
            if (!drag) return;

            setMoviendo(true);

            setPos({
                x: e.clientX - offset.x,
                y: e.clientY - offset.y,
            });
        }

        function soltar() {
            setTimeout(() => setMoviendo(false), 50);
            setDrag(false);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);

        return () => {
            window.removeEventListener("mousemove", mover);
            window.removeEventListener("mouseup", soltar);
        };
    }, [drag, offset]);

    const ultima = notificaciones[0];

    const total = useMemo(() => {
        return Number(resumen.totalNuevas || 0);
    }, [resumen]);

    function colorNivel(nivel: string) {
        if (nivel === "CRITICA") return "border-red-500/40 bg-red-500/10 text-red-300";
        if (nivel === "ADVERTENCIA") return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
        return "border-blue-500/40 bg-blue-500/10 text-blue-300";
    }

    function emojiModulo(modulo: string) {
        if (modulo === "WIRELESS") return "📡";
        if (modulo === "MENSUALIDADES") return "💳";
        if (modulo === "SRI_EMAIL") return "📧";
        if (modulo === "SRI_ANULACION") return "🧾";
        if (modulo === "SRI_NOTA_CREDITO") return "📄";
        return "⚙️";
    }

    if (total === 0) {
        return null;
    }

    function BotNetcompIcon({ totalCriticas = 0 }: { totalCriticas?: number }) {
        return (
            <div className="relative flex flex-col items-center">
                <div className="relative w-14 h-14 rounded-full bg-cyan-500 border-2 border-cyan-300 shadow-lg shadow-cyan-500/40 flex items-center justify-center">
                    <div className="absolute -top-3 w-6 h-3 border-t-2 border-cyan-200 rounded-full"></div>

                    <div className="w-9 h-8 rounded-lg bg-slate-900 border border-cyan-200 flex flex-col items-center justify-center">
                        <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-cyan-300 rounded-full"></span>
                        </div>
                        <div className="mt-1 w-4 h-1 bg-red-400 rounded-full"></div>
                    </div>

                    <span className="absolute -right-1 -top-2 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 border border-white">
                        {totalCriticas}
                    </span>
                </div>

                <span className="mt-1 text-[9px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                    NETCOMP RF
                </span>
            </div>
        );
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
                    if (!moviendo) setAbierto(!abierto);
                }}
                className="relative cursor-grab active:cursor-grabbing select-none"
            >
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border-4 border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.8)] overflow-hidden animate-pulse flex items-center justify-center">
                    <Image
                        src="/bot.png"
                        alt="Bot Netcomp RF"
                        width={100}
                        height={130}
                        className="w-[115%] h-[115%] object-cover scale-125"
                        priority
                    />
                </div>

                <div className="absolute -top-2 -right-2 min-w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white text-xs font-black">
                    {total}
                </div>

                {resumen.criticas > 0 && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap">
                        {resumen.criticas} CRÍTICA
                    </div>
                )}
            </div>

            {abierto && (
                <div className="mt-3 w-96 rounded-2xl border border-cyan-500/40 bg-slate-950/95 shadow-2xl shadow-cyan-500/20 overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="font-black text-white">
                            🤖 Bot de Notificaciones
                        </h3>
                        <p className="text-xs text-slate-400">
                            Tengo {total} notificaciones nuevas del sistema.
                        </p>
                    </div>

                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {ultima && (
                            <div className={`rounded-xl border p-3 ${colorNivel(ultima.nivel)}`}>
                                <p className="text-xs font-bold">
                                    Última notificación
                                </p>
                                <p className="text-white font-bold text-sm mt-1">
                                    {emojiModulo(ultima.modulo)} {ultima.titulo}
                                </p>
                                <p className="text-xs text-slate-300">
                                    {ultima.modulo} · {ultima.tipo}
                                </p>
                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                                    {ultima.mensaje}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-slate-900 border border-slate-700 p-2">
                                <p className="text-lg font-black text-white">{total}</p>
                                <p className="text-[10px] text-slate-400">Total</p>
                            </div>

                            <div className="rounded-xl bg-red-500/10 border border-red-500/40 p-2">
                                <p className="text-lg font-black text-red-400">
                                    {resumen.criticas}
                                </p>
                                <p className="text-[10px] text-slate-400">Críticas</p>
                            </div>

                            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/40 p-2">
                                <p className="text-lg font-black text-yellow-400">
                                    {resumen.advertencias}
                                </p>
                                <p className="text-[10px] text-slate-400">Avisos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-xl bg-slate-900 border border-slate-700 p-2">
                                📡 Wireless: {resumen.wireless}
                            </div>
                            <div className="rounded-xl bg-slate-900 border border-slate-700 p-2">
                                💳 Mensualidades: {resumen.mensualidades}
                            </div>
                            <div className="rounded-xl bg-slate-900 border border-slate-700 p-2">
                                📧 SRI Email: {resumen.sriEmail}
                            </div>
                            <div className="rounded-xl bg-slate-900 border border-slate-700 p-2">
                                🧾 SRI Anulación: {resumen.sriAnulacion}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {notificaciones.map((n) => (
                                <div
                                    key={n.notificacionId}
                                    className={`rounded-xl border p-3 ${colorNivel(n.nivel)}`}
                                >
                                    <p className="font-bold text-sm">
                                        {emojiModulo(n.modulo)} {n.titulo}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {n.mensaje}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onAbrirAlertas}
                                className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-xl py-2 font-bold text-white"
                            >
                                Ver alertas
                            </button>

                            <button
                                onClick={marcarTodasVistas}
                                className="w-full bg-slate-700 hover:bg-slate-600 rounded-xl py-2 font-bold text-white"
                            >
                                Marcar vistas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}