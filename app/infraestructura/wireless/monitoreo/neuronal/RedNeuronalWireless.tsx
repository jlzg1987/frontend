"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
});

type ResultadoMonitoreo = {
    ok: boolean;
    equipoId: string;
    nuevoEstado?: string;
    equipo?: {
        nombre: string;
        tipoEquipo: string;
        ipGestion: string;
        nodoAgent: string;
    };
    resultado?: {
        online: boolean;
        estado: string;
        sshOk: boolean;
        pingPromedioMs: number | null;
        recibidos: number;
        perdidos: number;
        modo: string;
    };
    mensaje?: string;
};

export default function RedNeuronalWireless({
    resultados,
}: {
    resultados: ResultadoMonitoreo[];
}) {
    const [nodoSeleccionado, setNodoSeleccionado] = useState<any | null>(null);

    const fgRef = useRef<any>(null);
    const graphData = useMemo(() => {
        const nodes: any[] = [];
        const links: any[] = [];
        const existe = new Set<string>();


        function addNode(id: string, tipo: string, estado?: string, extra: any = {}) {
            if (!id || existe.has(id)) return;

            existe.add(id);
            nodes.push({
                id,
                tipo,
                estado,
                ...extra,
            });
        }

        addNode("SISTEMA", "SISTEMA", "ONLINE");

        resultados.forEach((item) => {
            const nodo = item.equipo?.nodoAgent || "SIN_NODO";
            const equipoNombre = item.equipo?.nombre || item.equipoId;
            const tipoEquipo = item.equipo?.tipoEquipo || "EQUIPO";

            addNode(nodo, "NODO", "ONLINE");

            addNode(equipoNombre, tipoEquipo, item.nuevoEstado, {
                ip: item.equipo?.ipGestion,
                ping: item.resultado?.pingPromedioMs,
                sshOk: item.resultado?.sshOk,
                mensaje: item.mensaje,
                dataCompleta: item,
            });

            links.push({
                source: "SISTEMA",
                target: nodo,
            });

            links.push({
                source: nodo,
                target: equipoNombre,
            });
        });

        return { nodes, links };
    }, [resultados]);

    function colorNodo(node: any) {
        if (node.tipo === "SISTEMA") return "rgb(56, 189, 248)";
        if (node.tipo === "NODO") return "rgb(34, 211, 238)";

        if (node.estado === "ONLINE") return "rgb(0, 255, 136)";
        if (node.estado === "OFFLINE") return "rgb(255, 51, 85)";
        if (node.estado === "SSH_FALLA") return "rgb(255, 136, 0)";
        if (node.estado === "PING_ALTO") return "rgb(250, 204, 21)";

        return "rgb(148, 163, 184)";
    }

    function esNodoFinal(node: any, links: any[]) {
        return !links.some((link: any) => {
            const sourceId = typeof link.source === "object" ? link.source.id : link.source;
            return sourceId === node.id;
        });
    }

    useEffect(() => {
        if (!fgRef.current) return;

        fgRef.current.d3Force("link")?.distance((link: any) => {
            const sourceTipo = link.source?.tipo;
            const targetTipo = link.target?.tipo;

            if (sourceTipo === "SISTEMA" || targetTipo === "SISTEMA") return 180;
            if (sourceTipo === "NODO" || targetTipo === "NODO") return 120;

            return 90;
        });

        fgRef.current.d3Force("charge")?.strength(-350);
        fgRef.current.d3Force("center")?.strength(0.04);

        fgRef.current.d3ReheatSimulation();

        setTimeout(() => {
            fgRef.current?.centerAt(0, 0, 1000);
            fgRef.current?.zoom(0.65, 1000);
        }, 1200);
    }, [graphData]);
    return (
        <div className="w-full h-[650px] max-w-7xl mx-auto rounded-2xl border border-cyan-500/30 bg-slate-950 overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.15)]">
            <ForceGraph2D
                ref={fgRef}
                width={1275}
                height={650}
                graphData={graphData}
                autoPauseRedraw={false}
                onNodeClick={(node: any) => {
                    setNodoSeleccionado(node);
                }}
                backgroundColor="#020617"
                nodeRelSize={5}
                linkColor={() => "rgba(34,211,238,0.35)"}
                linkWidth={1.5}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 12 / globalScale;
                    const color = colorNodo(node);

                    const radio =
                        node.tipo === "SISTEMA"
                            ? 11
                            : node.tipo === "NODO"
                                ? 9
                                : 6;

                    // ===== PULSO PARA NODOS FINALES =====
                    const final = esNodoFinal(node, graphData.links);
                    const tiempo = Date.now() / 1000;
                    const pulso =
                        (Math.sin(tiempo * 3 + String(node.id).length) + 1) / 2;

                    if (
                        final &&
                        node.tipo !== "SISTEMA" &&
                        node.tipo !== "NODO"
                    ) {
                        const radioPulso = radio + 10 + pulso * 14;
                        const opacidad = 0.35 * (1 - pulso);

                        ctx.beginPath();
                        ctx.arc(
                            node.x,
                            node.y,
                            radioPulso,
                            0,
                            2 * Math.PI,
                            false
                        );

                        ctx.strokeStyle = color
                            .replace("rgb(", "rgba(")
                            .replace(")", `, ${opacidad})`);

                        ctx.lineWidth = 2;
                        ctx.shadowColor = color;
                        ctx.shadowBlur = 25;
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.arc(
                            node.x,
                            node.y,
                            radioPulso + 8,
                            0,
                            2 * Math.PI,
                            false
                        );

                        ctx.strokeStyle = color
                            .replace("rgb(", "rgba(")
                            .replace(")", `, ${opacidad * 0.5})`);

                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }

                    // ===== NODO PRINCIPAL =====
                    ctx.beginPath();
                    ctx.arc(
                        node.x,
                        node.y,
                        radio,
                        0,
                        2 * Math.PI,
                        false
                    );

                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 18;
                    ctx.fill();

                    // ===== TEXTO =====
                    ctx.font = `${fontSize}px Arial`;
                    ctx.fillStyle = "#e0f2fe";
                    ctx.shadowBlur = 0;
                    ctx.fillText(
                        label,
                        node.x + radio + 4,
                        node.y + 4
                    );
                }}
            />
            {nodoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-cyan-500/40 bg-slate-950 p-5 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-cyan-300">
                                    {nodoSeleccionado.id}
                                </h2>
                                <p className="text-sm text-slate-400">
                                    {nodoSeleccionado.tipo}
                                </p>
                            </div>

                            <button
                                onClick={() => setNodoSeleccionado(null)}
                                className="rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white hover:bg-red-500"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-slate-900 p-3">
                                <p className="text-slate-400">Estado</p>
                                <p className="font-bold text-white">
                                    {nodoSeleccionado.estado || "-"}
                                </p>
                            </div>

                            <div className="rounded-lg bg-slate-900 p-3">
                                <p className="text-slate-400">IP</p>
                                <p className="font-bold text-white">
                                    {nodoSeleccionado.ip || "-"}
                                </p>
                            </div>

                            <div className="rounded-lg bg-slate-900 p-3">
                                <p className="text-slate-400">Ping</p>
                                <p className="font-bold text-white">
                                    {nodoSeleccionado.ping ?? "-"} ms
                                </p>
                            </div>

                            <div className="rounded-lg bg-slate-900 p-3">
                                <p className="text-slate-400">SSH</p>
                                <p className="font-bold text-white">
                                    {nodoSeleccionado.sshOk === true
                                        ? "OK"
                                        : nodoSeleccionado.sshOk === false
                                            ? "FALLA"
                                            : "-"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-slate-900 p-3 text-sm">
                            <p className="text-slate-400">Mensaje</p>
                            <p className="font-bold text-white">
                                {nodoSeleccionado.mensaje || "-"}
                            </p>
                        </div>

                        <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-black p-3 text-xs text-cyan-200">
                            {JSON.stringify(nodoSeleccionado.dataCompleta, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}