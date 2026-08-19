"use client";

import { createElement, useEffect, useMemo, useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";
import Image from "next/image";
import {
    BellRing,
    Bot,
    CheckCheck,
    CircleOff,
    CreditCard,
    Eye,
    FileText,
    Mail,
    RadioTower,
    ReceiptText,
    Settings,
    TriangleAlert,
    Wheat,
    type LucideIcon,
} from "lucide-react";

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

function corregirTextoUtf8(valor: unknown): string {
    const texto = String(valor ?? "");

    // Solo intenta reparar texto con señales típicas de UTF-8 leído como Latin-1.
    if (!/[ÃÂ]/.test(texto)) return texto;

    try {
        const bytes = Uint8Array.from(
            texto,
            (caracter) => caracter.charCodeAt(0)
        );

        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
        return texto;
    }
}

function normalizarNotificacion(item: Notificacion): Notificacion {
    return {
        ...item,
        titulo: corregirTextoUtf8(item.titulo),
        mensaje: corregirTextoUtf8(item.mensaje),
        tipo: corregirTextoUtf8(item.tipo),
    };
}

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

                setNotificaciones(
                    (data.ultimas || []).map(normalizarNotificacion)
                );
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

    function estiloNivel(nivel: string): React.CSSProperties {
        if (nivel === "CRITICA") {
            return {
                color: "#fca5a5",
                borderColor: "rgba(239,68,68,0.42)",
                background: "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(2,6,23,0.94))",
            };
        }

        if (nivel === "ADVERTENCIA") {
            return {
                color: "#fde047",
                borderColor: "rgba(234,179,8,0.42)",
                background: "linear-gradient(135deg, rgba(234,179,8,0.16), rgba(2,6,23,0.94))",
            };
        }

        return {
            color: "#93c5fd",
            borderColor: "rgba(59,130,246,0.42)",
            background: "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(2,6,23,0.94))",
        };
    }

    function iconoModulo(modulo: string): LucideIcon {
        if (modulo === "WIRELESS") return RadioTower;
        if (modulo === "MENSUALIDADES") return CreditCard;
        if (modulo === "SRI_EMAIL") return Mail;
        if (modulo === "SRI_ANULACION") return ReceiptText;
        if (modulo === "SRI_NOTA_CREDITO") return FileText;
        return Settings;
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
                <div
                    className="flex h-20 w-20 animate-pulse items-center justify-center overflow-hidden rounded-full border-4 border-cyan-300"
                    style={{
                        background: "linear-gradient(135deg, rgba(34,211,238,0.24), rgba(37,99,235,0.12))",
                        boxShadow: "0 0 30px rgba(34,211,238,0.8)",
                    }}
                >
                    <Image
                        src="/bot.png"
                        alt="Bot Netcomp RF"
                        width={100}
                        height={130}
                        className="w-[115%] h-[115%] object-cover scale-125"
                        priority
                    />
                </div>

                <div
                    className="absolute -right-2 -top-2 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white"
                    style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)" }}
                >
                    {total}
                </div>

                {resumen.criticas > 0 && (
                    <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-black text-white"
                        style={{ background: "linear-gradient(135deg, #ef4444, #991b1b)" }}
                    >
                        {resumen.criticas} CRÍTICA
                    </div>
                )}
            </div>

            {abierto && (
                <div
                    className="mt-3 w-96 overflow-hidden rounded-2xl border border-cyan-500/40 shadow-2xl"
                    style={{
                        background: "linear-gradient(160deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))",
                        boxShadow: "0 22px 55px rgba(6,182,212,0.18)",
                    }}
                >
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="flex items-center gap-2 font-black text-white">
                            <Bot size={20} className="text-cyan-400" strokeWidth={2.4} />
                            Bot de Notificaciones
                        </h3>
                        <p className="text-xs text-slate-400">
                            Tengo {total} notificaciones nuevas del sistema.
                        </p>
                    </div>

                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                        {ultima && (
                            <div
                                className="rounded-xl border p-3"
                                style={estiloNivel(ultima.nivel)}
                            >
                                <p className="text-xs font-bold">
                                    Última notificación
                                </p>
                                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
                                    {createElement(iconoModulo(ultima.modulo), {
                                        size: 17,
                                        strokeWidth: 2.3,
                                    })}
                                    {ultima.titulo}
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
                            <div
                                className="rounded-xl border border-slate-700 p-2"
                                style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(15,23,42,0.96))" }}
                            >
                                <p className="flex items-center justify-center gap-1.5 text-lg font-black text-white">
                                    <BellRing size={16} className="text-cyan-400" />
                                    {total}
                                </p>
                                <p className="text-[10px] text-slate-400">Total</p>
                            </div>

                            <div
                                className="rounded-xl border border-red-500/40 p-2"
                                style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(15,23,42,0.96))" }}
                            >
                                <p className="flex items-center justify-center gap-1.5 text-lg font-black text-red-400">
                                    <CircleOff size={16} />
                                    {resumen.criticas}
                                </p>
                                <p className="text-[10px] text-slate-400">Críticas</p>
                            </div>

                            <div
                                className="rounded-xl border border-yellow-500/40 p-2"
                                style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(15,23,42,0.96))" }}
                            >
                                <p className="flex items-center justify-center gap-1.5 text-lg font-black text-yellow-400">
                                    <TriangleAlert size={16} />
                                    {resumen.advertencias}
                                </p>
                                <p className="text-[10px] text-slate-400">Avisos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
                                <RadioTower size={15} className="text-cyan-400" />
                                <p style={{ color: "white" }}>
                                    Wireless: {resumen.wireless}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
                                <CreditCard size={15} className="text-emerald-400" />
                                <p style={{ color: "white" }}>
                                    Mensualidades: {resumen.mensualidades}</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
                                <Mail size={15} className="text-blue-400" />
                                <p style={{ color: "white" }}>
                                    SRI Email: {resumen.sriEmail}</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-2">
                                <ReceiptText size={15} className="text-orange-400" />
                                <p style={{ color: "white" }}>
                                    SRI Anulación: {resumen.sriAnulacion}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {notificaciones.map((n) => (
                                <div
                                    key={n.notificacionId}
                                    className="rounded-xl border p-3"
                                    style={estiloNivel(n.nivel)}
                                >
                                    <p className="flex items-center gap-2 text-sm font-bold">
                                        {createElement(iconoModulo(n.modulo), {
                                            size: 16,
                                            strokeWidth: 2.3,
                                        })}
                                        {n.titulo}
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
                                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 font-bold text-white"
                                style={{
                                    background: "linear-gradient(135deg, #0891b2, #2563eb)",
                                    boxShadow: "0 8px 22px rgba(6,182,212,0.18)",
                                }}
                            >
                                <Eye size={17} strokeWidth={2.4} />
                                Ver alertas
                            </button>

                            <button
                                onClick={marcarTodasVistas}
                                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 font-bold text-white"
                                style={{
                                    background: "linear-gradient(135deg, #475569, #1e293b)",
                                }}
                            >
                                <CheckCheck size={17} strokeWidth={2.4} />
                                Marcar vistas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}