"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

type Props = {
    equipoId: string;
    onClose: () => void;
};

export default function WirelessMetricasModal({ equipoId, onClose }: Props) {
    const [cargandoMetricas, setCargandoMetricas] = useState(false);
    const [metricas, setMetricas] = useState<any>(null);
    const [historialTrafico, setHistorialTrafico] = useState<any[]>([]);
    const [ultimoTrafico, setUltimoTrafico] = useState<any>(null);

    const [modalClienteWireless, setModalClienteWireless] = useState(false);
    const [modalDetalleCliente, setModalDetalleCliente] = useState(false);
    const [clienteWireless, setClienteWireless] = useState<any>(null);

    const [historialCliente, setHistorialCliente] = useState<any[]>([]);
    const [ultimoCliente, setUltimoCliente] = useState<any>(null);
    const [macClienteGrafico, setMacClienteGrafico] = useState<string | null>(null);

    function parseMcaStatus(salida: string) {
        const bloque = salida.split("---IWCONFIG---")[0] || "";
        const lineas = bloque.split("\n");
        const data: any = {};

        lineas.forEach((linea) => {
            const texto = linea.trim();
            if (!texto || texto.includes("---MCA_STATUS---")) return;

            texto.split(",").forEach((parte) => {
                const [key, value] = parte.split("=");
                if (key && value !== undefined) {
                    data[key.trim()] = value.trim();
                }
            });
        });

        return data;
    }

    function parseStations(salida: string) {
        const bloque =
            salida.split("---STATIONS---")[1]?.split("---IWCONFIG---")[0]?.trim() || "";

        if (!bloque) return [];

        try {
            const inicioArray = bloque.indexOf("[");
            const finArray = bloque.lastIndexOf("]");

            if (inicioArray >= 0 && finArray > inicioArray) {
                const json = JSON.parse(bloque.substring(inicioArray, finArray + 1));
                if (Array.isArray(json)) return json;
            }

            const inicioObj = bloque.indexOf("{");
            const finObj = bloque.lastIndexOf("}");

            if (inicioObj >= 0 && finObj > inicioObj) {
                const json = JSON.parse(bloque.substring(inicioObj, finObj + 1));

                if (Array.isArray(json)) return json;
                if (Array.isArray(json.stations)) return json.stations;
                if (Array.isArray(json.hosts)) return json.hosts;
                if (Array.isArray(json.data)) return json.data;

                return [json];
            }

            return [];
        } catch (error) {
            console.error("Error parseando stations:", error);
            return [];
        }
    }

    function calcularMbps(actual: any, anterior: any, segundos: number) {
        if (!actual || !anterior) {
            return {
                wlanRxMbps: 0,
                wlanTxMbps: 0,
                lanRxMbps: 0,
                lanTxMbps: 0,
            };
        }

        const wlanRx = Number(actual.wlanRxBytes || 0) - Number(anterior.wlanRxBytes || 0);
        const wlanTx = Number(actual.wlanTxBytes || 0) - Number(anterior.wlanTxBytes || 0);
        const lanRx = Number(actual.lanRxBytes || 0) - Number(anterior.lanRxBytes || 0);
        const lanTx = Number(actual.lanTxBytes || 0) - Number(anterior.lanTxBytes || 0);

        return {
            wlanRxMbps: Number(((wlanRx * 8) / segundos / 1000000).toFixed(2)),
            wlanTxMbps: Number(((wlanTx * 8) / segundos / 1000000).toFixed(2)),
            lanRxMbps: Number(((lanRx * 8) / segundos / 1000000).toFixed(2)),
            lanTxMbps: Number(((lanTx * 8) / segundos / 1000000).toFixed(2)),
        };
    }

    function calcularCcq(signal?: string) {
        const s = Number(signal || 0);
        if (!s) return "-";
        if (s >= -55) return "Excelente";
        if (s >= -65) return "Bueno";
        if (s >= -75) return "Regular";
        return "Malo";
    }

    async function cargarMetricas() {
        try {
            setCargandoMetricas(true);

            const res = await fetch(`${API_BASE}/wireless/equipos/${equipoId}/metricas`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();
            setMetricas(data);
        } catch (error) {
            console.error("Error cargarMetricas:", error);
            alert("Error consultando métricas wireless");
        } finally {
            setCargandoMetricas(false);
        }
    }

    useEffect(() => {
        cargarMetricas();
    }, [equipoId]);

    useEffect(() => {
        const intervalo = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/wireless/equipos/${equipoId}/metricas`, {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                });

                const data = await res.json();
                setMetricas(data);

                if (!data.ok || !data.salida) return;

                const actual = parseMcaStatus(data.salida);

                setUltimoTrafico((anterior: any) => {
                    const mbps = calcularMbps(actual, anterior, 3);

                    if (anterior) {
                        setHistorialTrafico((prev) => [
                            ...prev,
                            {
                                tiempo: new Date().toLocaleTimeString(),
                                ...mbps,
                            },
                        ].slice(-20));
                    }

                    return actual;
                });
            } catch (error) {
                console.error("Error actualizando métricas:", error);
            }
        }, 3000);

        return () => clearInterval(intervalo);
    }, [equipoId]);

    useEffect(() => {
        if (!clienteWireless || !macClienteGrafico) return;

        const intervalo = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/wireless/equipos/${equipoId}/metricas`, {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                });

                const data = await res.json();
                if (!data.ok || !data.salida) return;

                const estacionesActuales = parseStations(data.salida);
                const clienteActual = estacionesActuales.find((c: any) => c.mac === macClienteGrafico);

                if (!clienteActual) return;

                setClienteWireless(clienteActual);

                setUltimoCliente((anterior: any) => {
                    if (anterior?.stats && clienteActual?.stats) {
                        const rxDiff =
                            Number(clienteActual.stats.rx_bytes || 0) -
                            Number(anterior.stats.rx_bytes || 0);

                        const txDiff =
                            Number(clienteActual.stats.tx_bytes || 0) -
                            Number(anterior.stats.tx_bytes || 0);

                        setHistorialCliente((prev) => [
                            ...prev,
                            {
                                tiempo: new Date().toLocaleTimeString(),
                                rxMbps: Math.max(Number(((rxDiff * 8) / 3 / 1000000).toFixed(2)), 0),
                                txMbps: Math.max(Number(((txDiff * 8) / 3 / 1000000).toFixed(2)), 0),
                            },
                        ].slice(-20));
                    }

                    return clienteActual;
                });
            } catch (error) {
                console.error("Error actualizando cliente:", error);
            }
        }, 3000);

        return () => clearInterval(intervalo);
    }, [equipoId, clienteWireless, macClienteGrafico]);

    const mca = metricas?.salida ? parseMcaStatus(metricas.salida) : {};
    const estaciones = metricas?.salida ? parseStations(metricas.salida) : [];

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-7xl max-h-[95vh] overflow-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Métricas Wireless</h2>
                            <p className="text-sm text-slate-400">
                                {mca.deviceName || metricas?.nombre || "Equipo sin nombre"} —{" "}
                                {mca.deviceIp || metricas?.ipGestion || "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                                {mca.platform || metricas?.modelo || "-"} | MAC: {mca.deviceId || "-"}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                        >
                            Cerrar
                        </button>
                    </div>

                    {cargandoMetricas ? (
                        <p className="text-slate-300">Consultando métricas...</p>
                    ) : !metricas ? (
                        <p className="text-slate-400">Sin datos.</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                                <Card titulo="Estado" valor={metricas.ok ? "ONLINE" : "OFFLINE"} className={metricas.ok ? "text-green-400" : "text-red-400"} />
                                <Card titulo="Modo" valor={metricas.modo || "-"} />
                                <Card titulo="Nodo" valor={metricas.nodo || "-"} />
                                <Card titulo="Tiempo" valor={`${metricas.tiempoMs || "-"} ms`} />
                                <Card titulo="CPU" valor={`${mca.cpuUsage || "-"}%`} className="text-yellow-400" />
                                <Card titulo="Calidad" valor={calcularCcq(mca.signal)} className="text-cyan-400" />
                            </div>

                            {estaciones.length > 0 && (
                                <div
                                    onClick={() => setModalClienteWireless(true)}
                                    className="bg-slate-800 border border-cyan-700 rounded-xl p-4 mb-6 cursor-pointer hover:bg-slate-700"
                                >
                                    <p className="text-xs text-slate-400">Clientes conectados</p>
                                    <p className="text-3xl font-bold text-cyan-400">{estaciones.length}</p>
                                    <p className="text-sm text-slate-300">Click para ver estaciones conectadas</p>
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-cyan-400 mb-3">Radio Wireless</h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                                <Card titulo="Frecuencia" valor={`${mca.freq || "-"} MHz`} />
                                <Card titulo="Canal" valor={`${mca.centerFreq || "-"} MHz`} />
                                <Card titulo="Ancho" valor={`${mca.chanbw || "-"} MHz`} />
                                <Card titulo="Señal" valor={`${mca.signal || "-"} dBm`} className="text-green-400" />
                                <Card titulo="Ruido" valor={`${mca.noise || "-"} dBm`} className="text-red-400" />
                                <Card titulo="Potencia TX" valor={`${mca.txPower || "-"} dBm`} />
                            </div>

                            <h3 className="text-lg font-bold text-emerald-400 mb-3">Tráfico en vivo</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <Grafico titulo="WLAN / ath0" data={historialTrafico} rxKey="wlanRxMbps" txKey="wlanTxMbps" />
                                <Grafico titulo="LAN / eth0" data={historialTrafico} rxKey="lanRxMbps" txKey="lanTxMbps" />
                            </div>

                            <details className="bg-black rounded-xl p-3">
                                <summary className="cursor-pointer text-slate-300 font-bold">
                                    Ver salida SSH completa
                                </summary>

                                <pre className="text-green-400 text-xs whitespace-pre-wrap mt-4">
                                    {metricas.salida}
                                </pre>
                            </details>
                        </>
                    )}
                </div>
            </div>

            {modalClienteWireless && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Estaciones conectadas</h2>

                            <button
                                onClick={() => setModalClienteWireless(false)}
                                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {estaciones.map((c: any, i: number) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setClienteWireless(c);
                                        setMacClienteGrafico(c.mac);
                                        setHistorialCliente([]);
                                        setUltimoCliente(null);
                                        setModalDetalleCliente(true);
                                    }}
                                    className="bg-slate-800 rounded-xl p-4 border border-slate-700 cursor-pointer hover:border-cyan-500"
                                >
                                    <p className="text-sm text-slate-400">Nombre equipo</p>
                                    <p className="font-bold text-white">
                                        {c.remote?.hostname || c.name || "Sin nombre"}
                                    </p>

                                    <p className="text-sm text-slate-400 mt-2">Última IP</p>
                                    <p className="font-bold text-cyan-400">{c.lastip || "-"}</p>

                                    <p className="text-sm text-slate-400 mt-2">MAC</p>
                                    <p className="font-bold text-white">{c.mac || "-"}</p>

                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <Mini titulo="Señal" valor={`${c.signal || c.remote?.signal || "-"} dBm`} />
                                        <Mini titulo="Ruido" valor={`${c.noisefloor || c.remote?.noisefloor || "-"} dBm`} />
                                        <Mini titulo="TX" valor={`${c.tx || "-"} Mbps`} />
                                        <Mini titulo="RX" valor={`${c.rx || "-"} Mbps`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {modalDetalleCliente && clienteWireless && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70]">
                    <div className="bg-slate-900 border border-cyan-700 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Detalle cliente wireless</h2>

                            <button
                                onClick={() => {
                                    setModalDetalleCliente(false);
                                    setClienteWireless(null);
                                    setMacClienteGrafico(null);
                                    setHistorialCliente([]);
                                    setUltimoCliente(null);
                                }}
                                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <Card titulo="Nombre" valor={clienteWireless.remote?.hostname || clienteWireless.name || "-"} />
                            <Card titulo="IP" valor={clienteWireless.lastip || "-"} className="text-cyan-400" />
                            <Card titulo="Señal" valor={`${clienteWireless.signal || "-"} dBm`} className="text-green-400" />
                            <Card titulo="ACK" valor={`${clienteWireless.ack || "-"} µs`} className="text-purple-400" />
                            <Card titulo="Modelo" valor={clienteWireless.remote?.platform || clienteWireless.platform || "-"} />
                            <Card titulo="Firmware" valor={clienteWireless.remote?.version || clienteWireless.version || "-"} />
                            <Card titulo="CPU" valor={`${clienteWireless.remote?.cpuload ?? clienteWireless.cpuload ?? "-"}%`} className="text-yellow-400" />
                            <Card titulo="RAM libre" valor={`${clienteWireless.remote?.freeram || "-"} KB`} className="text-green-400" />
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 h-72 mb-4">
                            <h4 className="font-bold text-cyan-400 mb-3">Consumo real del cliente</h4>

                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={historialCliente}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tiempo" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="rxMbps" name="RX Mbps" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="txMbps" name="TX Mbps" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <details className="bg-black rounded-xl p-3">
                            <summary className="cursor-pointer text-slate-300 font-bold">
                                Ver JSON cliente
                            </summary>

                            <pre className="text-green-400 text-xs whitespace-pre-wrap mt-4">
                                {JSON.stringify(clienteWireless, null, 2)}
                            </pre>
                        </details>
                    </div>
                </div>
            )}
        </>
    );
}

function Card({ titulo, valor, className = "text-white" }: any) {
    return (
        <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400">{titulo}</p>
            <p className={`font-bold ${className}`}>{valor}</p>
        </div>
    );
}

function Mini({ titulo, valor }: any) {
    return (
        <div>
            <p className="text-xs text-slate-400">{titulo}</p>
            <p className="font-bold text-cyan-400">{valor}</p>
        </div>
    );
}

function Grafico({ titulo, data, rxKey, txKey }: any) {
    return (
        <div className="bg-slate-800 rounded-xl p-4 h-72">
            <h4 className="font-bold text-cyan-400 mb-3">{titulo}</h4>

            <ResponsiveContainer width="100%" height="85%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tiempo" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey={rxKey} name="RX Mbps" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey={txKey} name="TX Mbps" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}