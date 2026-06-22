"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useState } from "react";

type Props = {
    equipoId: string;
    clienteWireless: any;
    onClose: () => void;
};

export default function WirelessScanSectorialModal({
    equipoId,
    clienteWireless,
    onClose,
}: Props) {
    const [escaneandoSectoriales, setEscaneandoSectoriales] = useState(false);
    const [sectorialesScan, setSectorialesScan] = useState<any[]>([]);

    const [credencialesCliente, setCredencialesCliente] = useState({
        usuarioCliente: "ubnt",
        claveCliente: "",
        puertoCliente: 22,
    });

    function parseScanSectoriales(salida: string) {
        const bloque = salida.split("---SCAN---")[1]?.split("---END---")[0] || "";
        const celdas = bloque.split("Cell ").slice(1);

        return celdas
            .map((cell) => {
                const mac = cell.match(/Address:\s*([A-Fa-f0-9:]+)/)?.[1] || "";
                const ssid = cell.match(/ESSID:"([^"]+)"/)?.[1] || "";
                const frecuencia = cell.match(/Frequency:([\d.]+)\s*GHz/)?.[1] || "";
                const canal = cell.match(/Channel[:=]\s*(\d+)/)?.[1] || "";
                const signal = cell.match(/Signal level=(-?\d+)/)?.[1] || "";
                const noise = cell.match(/Noise level=(-?\d+)/)?.[1] || "";
                const cifrado = cell.includes("Encryption key:on") ? "ACTIVO" : "ABIERTO";

                return {
                    mac,
                    ssid,
                    frecuencia,
                    canal,
                    signal,
                    noise,
                    cifrado,
                };
            })
            .filter((x) => x.mac || x.ssid);
    }

    async function escanearSectorialesCliente() {
        if (!equipoId || !clienteWireless?.lastip) return;

        if (!credencialesCliente.usuarioCliente || !credencialesCliente.claveCliente) {
            alert("Ingrese usuario y clave SSH del CPE cliente");
            return;
        }

        try {
            setEscaneandoSectoriales(true);
            setSectorialesScan([]);

            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoId}/cliente/scan-sectoriales`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        ipCliente: clienteWireless.lastip,
                        usuarioCliente: credencialesCliente.usuarioCliente,
                        claveCliente: credencialesCliente.claveCliente,
                        puertoCliente: Number(credencialesCliente.puertoCliente || 22),
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo escanear");
                return;
            }

            const lista = parseScanSectoriales(data.salida || "");

            const sinRepetidos = Array.from(
                new Map(lista.map((x: any) => [x.mac, x])).values()
            );

            setSectorialesScan(sinRepetidos);
        } catch (error) {
            console.error("Error escaneando sectoriales:", error);
            alert("Error escaneando sectoriales");
        } finally {
            setEscaneandoSectoriales(false);
        }
    }

    async function aplicarCambioSectorial(item: any) {
        if (!equipoId || !clienteWireless?.lastip) return;

        const confirmar = confirm(
            `¿Cambiar el CPE ${clienteWireless.lastip} al SSID ${item.ssid}?`
        );

        if (!confirmar) return;

        try {
            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoId}/cliente/cambiar-sectorial`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        ipCliente: clienteWireless.lastip,
                        usuarioCliente: credencialesCliente.usuarioCliente,
                        claveCliente: credencialesCliente.claveCliente,
                        puertoCliente: Number(credencialesCliente.puertoCliente || 22),
                        ssidNuevo: item.ssid,
                        bssidNuevo: item.mac,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "Error aplicando cambio");
                return;
            }

            alert(data.mensaje || "Cambio enviado correctamente");
            onClose();
        } catch (error) {
            console.error("Error aplicarCambioSectorial:", error);
            alert("Error aplicando cambio de sectorial");
        }
    }

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[80]">
            <div className="bg-slate-900 border border-blue-700 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Escaneo de sectoriales
                        </h2>

                        <p className="text-sm text-slate-400">
                            CPE: {clienteWireless?.remote?.hostname || clienteWireless?.name || "-"} —
                            IP: {clienteWireless?.lastip || "-"}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Usuario SSH CPE"
                        value={credencialesCliente.usuarioCliente}
                        onChange={(e) =>
                            setCredencialesCliente((prev) => ({
                                ...prev,
                                usuarioCliente: e.target.value,
                            }))
                        }
                    />

                    <input
                        type="password"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Clave SSH CPE"
                        value={credencialesCliente.claveCliente}
                        onChange={(e) =>
                            setCredencialesCliente((prev) => ({
                                ...prev,
                                claveCliente: e.target.value,
                            }))
                        }
                    />

                    <input
                        type="number"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Puerto"
                        value={credencialesCliente.puertoCliente}
                        onChange={(e) =>
                            setCredencialesCliente((prev) => ({
                                ...prev,
                                puertoCliente: Number(e.target.value || 22),
                            }))
                        }
                    />

                    <button
                        onClick={escanearSectorialesCliente}
                        disabled={escaneandoSectoriales}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 px-4 py-2 rounded-xl font-bold"
                    >
                        {escaneandoSectoriales ? "Escaneando..." : "Escanear"}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-300">
                                <th className="text-left py-2">SSID</th>
                                <th className="text-left py-2">MAC / BSSID</th>
                                <th className="text-left py-2">Señal</th>
                                <th className="text-left py-2">Ruido</th>
                                <th className="text-left py-2">Frecuencia</th>
                                <th className="text-left py-2">Canal</th>
                                <th className="text-left py-2">Cifrado</th>
                                <th className="text-right py-2">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sectorialesScan.map((s, i) => (
                                <tr key={i} className="border-b border-slate-800">
                                    <td className="py-3 font-bold text-white">{s.ssid || "-"}</td>
                                    <td>{s.mac || "-"}</td>
                                    <td className="text-green-400 font-bold">
                                        {s.signal ? `${s.signal} dBm` : "-"}
                                    </td>
                                    <td className="text-red-400 font-bold">
                                        {s.noise ? `${s.noise} dBm` : "-"}
                                    </td>
                                    <td>{s.frecuencia ? `${s.frecuencia} GHz` : "-"}</td>
                                    <td>{s.canal || "-"}</td>
                                    <td>{s.cifrado}</td>
                                    <td className="text-right">
                                        <button
                                            onClick={() => aplicarCambioSectorial(s)}
                                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg font-bold"
                                        >
                                            Aplicar
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {sectorialesScan.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-5 text-center text-slate-400">
                                        Sin resultados de escaneo.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}