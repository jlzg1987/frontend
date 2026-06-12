// app/wireless/equipos/page.tsx
'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";


type RouterMikrotik = {
    id: number;
    nombre: string;
    parroquia: string;
    sector: string;
};

type EquipoWireless = {
    routerId: number | '';
    equipoId?: string;
    nombre: string;
    marca: string;
    modelo: string;
    tipoEquipo: string;
    ipGestion: string;
    mac: string;
    usuarioSsh: string;
    claveSsh: string;
    puertoSsh: number;
    snmpActivo: number;
    snmpComunidad: string;
    snmpVersion: string;
    ubicacion: string;
    estado: string;
    ultimoEstado?: string;
    ultimoPingMs?: number;
    routerNombre?: string;
    routerSector?: string;
};

const equipoInicial: EquipoWireless = {
    routerId: '',
    nombre: '',
    marca: 'UBIQUITI',
    modelo: '',
    tipoEquipo: 'CPE_CLIENTE',
    ipGestion: '',
    mac: '',
    usuarioSsh: '',
    claveSsh: '',
    puertoSsh: 22,
    snmpActivo: 1,
    snmpComunidad: 'public',
    snmpVersion: '2c',
    ubicacion: '',
    estado: 'ACTIVO',
    routerNombre: 'ACTIVO',
    routerSector: 'ACTIVO',
};

export default function EquiposWirelessPage() {
    const [routers, setRouters] = useState<RouterMikrotik[]>([]);
    const [equipos, setEquipos] = useState<EquipoWireless[]>([]);
    const [form, setForm] = useState<EquipoWireless>(equipoInicial);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [verificandoIds, setVerificandoIds] = useState<string[]>([]);

    const [modalMetricas, setModalMetricas] = useState(false);
    const [cargandoMetricas, setCargandoMetricas] = useState(false);
    const [metricas, setMetricas] = useState<any>(null);

    const [historialTrafico, setHistorialTrafico] = useState<any[]>([]);
    const [ultimoTrafico, setUltimoTrafico] = useState<any>(null);
    const [equipoMetricasId, setEquipoMetricasId] = useState<string | null>(null);

    const [modalClienteWireless, setModalClienteWireless] = useState(false);
    const [clienteWireless, setClienteWireless] = useState<any>(null);

    const [historialCliente, setHistorialCliente] = useState<any[]>([]);
    const [ultimoCliente, setUltimoCliente] = useState<any>(null);
    const [macClienteGrafico, setMacClienteGrafico] = useState<string | null>(null);
    const [modalDetalleCliente, setModalDetalleCliente] = useState(false);

    const [modalScanSectorial, setModalScanSectorial] = useState(false);
    const [escaneandoSectoriales, setEscaneandoSectoriales] = useState(false);
    const [sectorialesScan, setSectorialesScan] = useState<any[]>([]);

    const [ordenCampo, setOrdenCampo] = useState<'ipGestion' | 'ultimoPingMs' | null>(null);
    const [ordenAsc, setOrdenAsc] = useState(true);

    const [credencialesCliente, setCredencialesCliente] = useState({
        usuarioCliente: '',
        claveCliente: '',
        puertoCliente: 22,
    });

    const token = getToken();

    function ipToNumber(ip?: string) {
        return String(ip || "")
            .split(".")
            .reduce((acc, octeto) => (acc * 256) + Number(octeto || 0), 0);
    }

    function ordenarPor(campo: 'ipGestion' | 'ultimoPingMs') {
        if (ordenCampo === campo) {
            setOrdenAsc(!ordenAsc);
        } else {
            setOrdenCampo(campo);
            setOrdenAsc(true);
        }
    }

    const equiposOrdenados = [...equipos].sort((a, b) => {
        if (ordenCampo === "ipGestion") {
            const valorA = ipToNumber(a.ipGestion);
            const valorB = ipToNumber(b.ipGestion);
            return ordenAsc ? valorA - valorB : valorB - valorA;
        }

        if (ordenCampo === "ultimoPingMs") {
            const valorA = Number(a.ultimoPingMs ?? 999999);
            const valorB = Number(b.ultimoPingMs ?? 999999);
            return ordenAsc ? valorA - valorB : valorB - valorA;
        }

        return 0;
    });

    function parseStations(salida: string) {
        const bloque =
            salida.split("---STATIONS---")[1]?.split("---IWCONFIG---")[0]?.trim() || "";

        if (!bloque) return [];

        try {
            const inicioArray = bloque.indexOf("[");
            const finArray = bloque.lastIndexOf("]");

            if (inicioArray >= 0 && finArray > inicioArray) {
                const jsonLimpio = bloque.substring(inicioArray, finArray + 1);
                const json = JSON.parse(jsonLimpio);

                if (Array.isArray(json)) return json;
            }

            const inicioObj = bloque.indexOf("{");
            const finObj = bloque.lastIndexOf("}");

            if (inicioObj >= 0 && finObj > inicioObj) {
                const jsonLimpio = bloque.substring(inicioObj, finObj + 1);
                const json = JSON.parse(jsonLimpio);

                if (Array.isArray(json)) return json;
                if (Array.isArray(json.stations)) return json.stations;
                if (Array.isArray(json.hosts)) return json.hosts;
                if (Array.isArray(json.data)) return json.data;

                return [json];
            }

            return [];
        } catch (error) {
            console.error("Error parseando stations:", error, bloque);
            return [];
        }
    }
    async function cargarRouters() {
        try {
            const res = await fetch(`${API_BASE}/mikrotik/routers`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setRouters(data.datos || data.routers || []);
            }
        } catch (error) {
            console.error('Error cargando routers:', error);
        }
    }
    async function verMetricas(equipoId?: string) {
        if (!equipoId) return;

        try {
            setEquipoMetricasId(equipoId);
            setHistorialTrafico([]);
            setUltimoTrafico(null);
            setCargandoMetricas(true);
            setMetricas(null);
            setModalMetricas(true);

            const res = await fetch(`${API_BASE}/wireless/equipos/${equipoId}/metricas`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();
            setMetricas(data);

        } catch (error) {
            console.error("Error verMetricas:", error);
            alert("Error consultando métricas wireless");
        } finally {
            setCargandoMetricas(false);
        }
    }
    useEffect(() => {
        cargarEquipos();
        cargarRouters();
    }, []);

    useEffect(() => {
        if (!modalMetricas || !equipoMetricasId) return;

        const intervalo = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/wireless/equipos/${equipoMetricasId}/metricas`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                setMetricas(data);

                if (!data.ok || !data.salida) return;

                const actual = parseMcaStatus(data.salida);

                setUltimoTrafico((anterior: any) => {
                    const mbps = calcularMbps(actual, anterior, 3);

                    if (anterior) {
                        setHistorialTrafico((prev) => {
                            const nuevo = [
                                ...prev,
                                {
                                    tiempo: new Date().toLocaleTimeString(),
                                    ...mbps,
                                },
                            ];

                            return nuevo.slice(-20);
                        });
                    }

                    return actual;
                });

            } catch (error) {
                console.error("Error actualizando métricas:", error);
            }
        }, 3000);

        return () => clearInterval(intervalo);
    }, [modalMetricas, equipoMetricasId, token]);

    useEffect(() => {
        if (!modalMetricas || !clienteWireless || !equipoMetricasId || !macClienteGrafico) return;

        const intervalo = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/wireless/equipos/${equipoMetricasId}/metricas`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (!data.ok || !data.salida) return;

                const estacionesActuales = parseStations(data.salida);

                const clienteActual = estacionesActuales.find(
                    (c: any) => c.mac === macClienteGrafico
                );

                if (!clienteActual) return;

                setClienteWireless(clienteActual);

                setUltimoCliente((anterior: any) => {
                    if (anterior?.stats && clienteActual?.stats) {
                        const segundos = 3;

                        const rxDiff =
                            Number(clienteActual.stats.rx_bytes || 0) -
                            Number(anterior.stats.rx_bytes || 0);

                        const txDiff =
                            Number(clienteActual.stats.tx_bytes || 0) -
                            Number(anterior.stats.tx_bytes || 0);

                        const rxMbps = Number(((rxDiff * 8) / segundos / 1000000).toFixed(2));
                        const txMbps = Number(((txDiff * 8) / segundos / 1000000).toFixed(2));

                        setHistorialCliente((prev) => {
                            const nuevo = [
                                ...prev,
                                {
                                    tiempo: new Date().toLocaleTimeString(),
                                    rxMbps: rxMbps < 0 ? 0 : rxMbps,
                                    txMbps: txMbps < 0 ? 0 : txMbps,
                                },
                            ];

                            return nuevo.slice(-20);
                        });
                    }

                    return clienteActual;
                });

            } catch (error) {
                console.error("Error actualizando cliente wireless:", error);
            }
        }, 3000);

        return () => clearInterval(intervalo);
    }, [modalMetricas, clienteWireless, equipoMetricasId, macClienteGrafico, token]);


    function parseMcaStatus(salida: string) {
        const bloque = salida.split("---IWCONFIG---")[0] || "";
        const lineas = bloque.split("\n");

        const data: any = {};

        lineas.forEach((linea) => {
            const texto = linea.trim();
            if (!texto || texto.includes("---MCA_STATUS---")) return;

            const partes = texto.split(",");
            partes.forEach((parte) => {
                const [key, value] = parte.split("=");
                if (key && value !== undefined) {
                    data[key.trim()] = value.trim();
                }
            });
        });

        return data;
    }

    function calcularCcq(signal?: string) {
        const s = Number(signal || 0);
        if (!s) return "-";
        if (s >= -55) return "Excelente";
        if (s >= -65) return "Bueno";
        if (s >= -75) return "Regular";
        return "Malo";
    }

    async function verificarEquiposAutomaticamente(lista: EquipoWireless[]) {
        for (const eq of lista) {
            if (!eq.equipoId) continue;

            try {
                setVerificandoIds((prev) => [...prev, eq.equipoId!]);

                const res = await fetch(`${API_BASE}/wireless/equipos/${eq.equipoId}/estado`, {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                });

                const data = await res.json();

                setEquipos((prev) =>
                    prev.map((item) =>
                        item.equipoId === eq.equipoId
                            ? {
                                ...item,
                                ultimoEstado: data.online
                                    ? data.sshOk
                                        ? "ONLINE / SSH OK"
                                        : "ONLINE / SSH FALLA"
                                    : "OFFLINE",
                                ultimoPingMs: data.pingPromedioMs || null,
                            }
                            : item
                    )
                );
            } catch {
                setEquipos((prev) =>
                    prev.map((item) =>
                        item.equipoId === eq.equipoId
                            ? {
                                ...item,
                                ultimoEstado: 'OFFLINE',
                                ultimoPingMs: undefined,
                            }
                            : item
                    )
                );
            } finally {
                setVerificandoIds((prev) => prev.filter((id) => id !== eq.equipoId));
            }
        }
    }


    async function cargarEquipos() {
        try {
            setCargando(true);

            const res = await fetch(`${API_BASE}/wireless/equipos`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();
            const lista = Array.isArray(data.equipos)
                ? data.equipos
                : Array.isArray(data.data)
                    ? data.data
                    : [];
            if (data.ok) {

                setEquipos(data.equipos || []);
            }
            // Verificar automáticamente al cargar
            if (lista.length > 0) {
                verificarEquiposAutomaticamente(lista);
            }
        } catch (error) {
            console.error('Error cargarEquipos:', error);
        } finally {
            setCargando(false);
        }
    }
    async function probarSsh(equipoId?: string) {
        if (!equipoId) return;

        try {
            const res = await fetch(`${API_BASE}/wireless/equipos/${equipoId}/test-ssh`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                alert(
                    `ONLINE SSH ✅\n\nEquipo: ${data.nombre}\nIP: ${data.ipGestion}\nVersión: ${data.version}\nTiempo: ${data.pingMs} ms`
                );
            } else {
                alert(data.mensaje || 'Equipo offline por SSH');
            }

            cargarEquipos();

        } catch (error) {
            console.error('Error probarSsh:', error);
            alert('Error probando SSH');
        }
    }
    function cambiarCampo(campo: keyof EquipoWireless, valor: any) {
        setForm((prev) => ({
            ...prev,
            [campo]: valor,
        }));
    }

    async function guardarEquipo() {
        try {
            const metodo = editandoId ? 'PUT' : 'POST';
            const url = editandoId
                ? `${API_BASE}/wireless/equipos/${editandoId}`
                : `${API_BASE}/wireless/equipos`;

            const res = await fetch(url, {
                method: metodo,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'Error al guardar equipo');
                return;
            }

            alert(data.mensaje || 'Equipo guardado');
            setForm(equipoInicial);
            setEditandoId(null);
            cargarEquipos();
        } catch (error) {
            console.error('Error guardarEquipo:', error);
            alert('Error al guardar equipo wireless');
        }
    }

    function editarEquipo(equipo: EquipoWireless) {
        setEditandoId(equipo.equipoId || null);
        setForm({
            ...equipo,
            puertoSsh: equipo.puertoSsh || 22,
            snmpActivo: equipo.snmpActivo ?? 1,
            snmpComunidad: equipo.snmpComunidad || 'public',
            snmpVersion: equipo.snmpVersion || '2c',
        });
    }

    async function eliminarEquipo(equipoId?: string) {
        if (!equipoId) return;

        const confirmar = confirm('¿Seguro que deseas eliminar este equipo wireless?');
        if (!confirmar) return;

        try {
            const res = await fetch(`${API_BASE}/wireless/equipos/${equipoId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'Error al eliminar equipo');
                return;
            }

            cargarEquipos();
        } catch (error) {
            console.error('Error eliminarEquipo:', error);
            alert('Error al eliminar equipo');
        }
    }

    function cancelarEdicion() {
        setEditandoId(null);
        setForm(equipoInicial);
    }
    const mca = metricas?.salida ? parseMcaStatus(metricas.salida) : {};

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

    const estaciones = metricas?.salida ? parseStations(metricas.salida) : [];
    const detalleCliente = clienteWireless
        ? {
            ipAddress: clienteWireless.lastip || clienteWireless.remote?.ipaddr?.[0] || '',
            mascara: '-',
            gateway: '-',
            dns1: '-',
            dns2: '-',
            modoRed: clienteWireless.remote?.netrole || '-',
            natActivo: clienteWireless.remote?.netrole === 'router',
            dmz: false,
            bloqueoAdministrativo: false,
        }
        : null;
    const salidaMetricas = metricas?.salida || "";
    const cfg = salidaMetricas.split("---CFG---")[1]?.split("---ROUTES---")[0] || "";

    const routes = salidaMetricas.split("---ROUTES---")[1]?.split("---DNS---")[0] || "";

    const dns = salidaMetricas.split("---DNS---")[1]?.split("---NAT---")[0] || "";
    const nat = salidaMetricas.split("---NAT---")[1]?.split("---FILTER---")[0] || "";
    function parseRoutes(routes: string) {
        const lineas = routes
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

        const gatewayLinea = lineas.find(
            (l) => l.startsWith("0.0.0.0") || l.includes(" UG ")
        );

        if (!gatewayLinea) {
            return {
                gateway: "-",
                interfaz: "-",
            };
        }

        const partes = gatewayLinea.split(/\s+/);

        return {
            gateway: partes[1] || "-",
            interfaz: partes[7] || partes[partes.length - 1] || "-",
        };
    }
    function parseDns(dns: string) {
        const servidores = dns
            .split("\n")
            .filter((l) => l.includes("nameserver"))
            .map((l) => l.replace("nameserver", "").trim());

        return {
            dns1: servidores[0] || "-",
            dns2: servidores[1] || "-",
        };
    }
    const routeInfo = parseRoutes(routes);
    const dnsInfo = parseDns(dns);

    function obtenerValorCfg(cfg: string, clave: string) {
        const linea = cfg
            .split("\n")
            .find((l) => l.startsWith(`${clave}=`));

        return linea?.split("=")[1]?.trim() || "";
    }
    const frecuencia = obtenerValorCfg(cfg, "radio.1.freq");

    const anchoCanal = obtenerValorCfg(cfg, "radio.1.chanbw");

    const potenciaTx = obtenerValorCfg(cfg, "radio.1.txpower");
    const eth = clienteWireless?.remote?.ethlist?.[0] || null;

    function parseScanSectoriales(salida: string) {
        const bloque =
            salida.split("---SCAN---")[1]?.split("---END---")[0] || "";

        const celdas = bloque.split("Cell ").slice(1);

        return celdas.map((cell) => {
            const mac =
                cell.match(/Address:\s*([A-Fa-f0-9:]+)/)?.[1] || "";

            const ssid =
                cell.match(/ESSID:"([^"]+)"/)?.[1] || "";

            const frecuencia =
                cell.match(/Frequency:([\d.]+)\s*GHz/)?.[1] || "";

            const canal =
                cell.match(/Channel[:=]\s*(\d+)/)?.[1] || "";

            const signal =
                cell.match(/Signal level=(-?\d+)/)?.[1] || "";

            const noise =
                cell.match(/Noise level=(-?\d+)/)?.[1] || "";

            const cifrado =
                cell.includes("Encryption key:on") ? "ACTIVO" : "ABIERTO";

            return {
                mac,
                ssid,
                frecuencia,
                canal,
                signal,
                noise,
                cifrado,
            };
        }).filter((x) => x.mac || x.ssid);
    }

    async function escanearSectorialesCliente() {
        if (!equipoMetricasId || !clienteWireless?.lastip) return;

        if (!credencialesCliente.usuarioCliente || !credencialesCliente.claveCliente) {
            alert("Ingrese usuario y clave SSH del CPE cliente");
            return;
        }

        try {
            setEscaneandoSectoriales(true);
            setSectorialesScan([]);

            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoMetricasId}/cliente/scan-sectoriales`,
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
        if (!equipoMetricasId || !clienteWireless?.lastip) return;

        const confirmar = confirm(
            `¿Cambiar el CPE ${clienteWireless.lastip} al SSID ${item.ssid}?`
        );

        if (!confirmar) return;

        try {
            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoMetricasId}/cliente/cambiar-sectorial`,
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
            setModalScanSectorial(false);

        } catch (error) {
            console.error("Error aplicarCambioSectorial:", error);
            alert("Error aplicando cambio de sectorial");
        }
    }

    function formatearUptime(segundos: number) {
        if (!segundos) return "-";

        const dias = Math.floor(segundos / 86400);
        const horas = Math.floor((segundos % 86400) / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);

        return `${dias}d ${horas}h ${minutos}m`;
    }

    return (
        <div className="p-6 text-white">


            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 mb-6">


                <h2 className="text-lg font-bold mb-4">
                    {editandoId ? 'Editar equipo' : 'Nuevo equipo'}
                </h2>
                <select
                    value={form.routerId ?? ''}
                    onChange={(e) =>
                        cambiarCampo('routerId', e.target.value ? Number(e.target.value) : '')
                    }
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3"
                    style={{ marginBottom: 20 }}
                >
                    <option value="">Seleccione un Nodo-Servidor</option>
                    {routers.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.nombre} - {r.parroquia} - {r.sector}
                        </option>
                    ))}
                </select>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Nombre"
                        value={form.nombre}
                        onChange={(e) => cambiarCampo('nombre', e.target.value)}
                    />

                    <select
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        value={form.marca}
                        onChange={(e) => cambiarCampo('marca', e.target.value)}
                    >
                        <option value="UBIQUITI">Ubiquiti</option>
                        <option value="TPLINK">TP-Link</option>
                        <option value="MIKROTIK">MikroTik</option>
                        <option value="OTRO">Otro</option>
                    </select>

                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Modelo"
                        value={form.modelo || ''}
                        onChange={(e) => cambiarCampo('modelo', e.target.value)}
                    />

                    <select
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        value={form.tipoEquipo}
                        onChange={(e) => cambiarCampo('tipoEquipo', e.target.value)}
                    >
                        <option value="ENLACE">Enlace</option>
                        <option value="SECTORIAL">Sectorial</option>
                        <option value="CPE_CLIENTE">CPE Cliente</option>
                        <option value="AP">AP</option>
                        <option value="BACKBONE">Backbone</option>
                        <option value="OTRO">Otro</option>
                    </select>

                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="IP gestión"
                        value={form.ipGestion}
                        onChange={(e) => cambiarCampo('ipGestion', e.target.value)}
                    />

                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="MAC"
                        value={form.mac || ''}
                        onChange={(e) => cambiarCampo('mac', e.target.value)}
                    />

                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Usuario SSH"
                        value={form.usuarioSsh || ''}
                        onChange={(e) => cambiarCampo('usuarioSsh', e.target.value)}
                    />

                    <input
                        type="password"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Clave SSH"
                        value={form.claveSsh || ''}
                        onChange={(e) => cambiarCampo('claveSsh', e.target.value)}
                    />

                    <input
                        type="number"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Puerto SSH"
                        value={form.puertoSsh}
                        onChange={(e) => cambiarCampo('puertoSsh', Number(e.target.value))}
                    />

                    <select
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        value={form.snmpActivo}
                        onChange={(e) => cambiarCampo('snmpActivo', Number(e.target.value))}
                    >
                        <option value={1}>SNMP activo</option>
                        <option value={0}>SNMP inactivo</option>
                    </select>

                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        placeholder="Comunidad SNMP"
                        value={form.snmpComunidad || ''}
                        onChange={(e) => cambiarCampo('snmpComunidad', e.target.value)}
                    />

                    <select
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        value={form.snmpVersion}
                        onChange={(e) => cambiarCampo('snmpVersion', e.target.value)}
                    >
                        <option value="1">SNMP v1</option>
                        <option value="2c">SNMP v2c</option>
                        <option value="3">SNMP v3</option>
                    </select>

                    <input
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 md:col-span-2"
                        placeholder="Ubicación"
                        value={form.ubicacion || ''}
                        onChange={(e) => cambiarCampo('ubicacion', e.target.value)}
                    />

                    <select
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                        value={form.estado}
                        onChange={(e) => cambiarCampo('estado', e.target.value)}
                    >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="MANTENIMIENTO">Mantenimiento</option>
                    </select>
                </div>

                <div className="flex gap-3 mt-5">
                    <button
                        onClick={guardarEquipo}
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-2 font-semibold"
                    >
                        {editandoId ? 'Actualizar' : 'Guardar'}
                    </button>

                    {editandoId && (
                        <button
                            onClick={cancelarEdicion}
                            className="bg-slate-700 hover:bg-slate-600 rounded-xl px-5 py-2 font-semibold"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                <h2 className="text-lg font-bold mb-4">Listado de equipos</h2>

                {cargando ? (
                    <p className="text-slate-400">Cargando equipos...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-300">
                                    <th className="w-[180px]">
                                        Nodo Servidor
                                    </th>
                                    <th className="text-left py-2">Nombre</th>
                                    <th className="w-[90px]">Marca</th>
                                    <th className="w-[100px]">Tipo</th>
                                    <th
                                        onClick={() => ordenarPor("ipGestion")}
                                        className="text-left py-2 cursor-pointer hover:text-cyan-400"
                                    >
                                        IP {ordenCampo === "ipGestion" ? (ordenAsc ? "↑" : "↓") : ""}
                                    </th>
                                    <th className="w-[80px]">Estado</th>
                                    <th className="w-[100px]">Ping</th>
                                    <th className="w-[220px]">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {equiposOrdenados.map((eq) => (
                                    <tr key={eq.equipoId} className="border-b border-slate-800" >
                                        <td className="w-[180px]">
                                            <div

                                                title={`${eq.routerNombre || 'Sin router'}${eq.routerSector ? ` - ${eq.routerSector}` : ''}`}
                                            >
                                                {eq.routerNombre || 'Sin router'}
                                                {eq.routerSector ? ` - ${eq.routerSector}` : ''}
                                            </div>
                                        </td>
                                        <td className="w-[120px]">{eq.nombre}</td>
                                        <td className="px-3">
                                            <span className="
        px-2 py-1 rounded-lg
        bg-cyan-900/40
        text-cyan-300
        text-xs
        font-bold
    ">
                                                {eq.marca}
                                            </span>
                                        </td>

                                        <td className="px-3">
                                            <span className="
        px-2 py-1 rounded-lg
        bg-yellow-900/40
        text-yellow-300
        text-xs
        font-bold
    ">
                                                {eq.tipoEquipo}
                                            </span>
                                        </td>
                                        <td className="w-[110px]">{eq.ipGestion}</td>
                                        <td>
                                            <span className={
                                                eq.ultimoEstado === 'ONLINE'
                                                    ? 'text-green-400 font-bold'
                                                    : eq.ultimoEstado === 'OFFLINE'
                                                        ? 'text-red-400 font-bold'
                                                        : 'text-slate-400'
                                            }>
                                                {verificandoIds.includes(eq.equipoId || '') ? (
                                                    <span className="text-yellow-300 font-bold">
                                                        Verificando...
                                                    </span>
                                                ) : (
                                                    <span className={
                                                        eq.ultimoEstado?.startsWith("ONLINE")
                                                            ? "text-green-400 font-screen"
                                                            : eq.ultimoEstado === "OFFLINE"
                                                                ? "text-red-400 font-bold"
                                                                : "text-slate-400"
                                                    }>
                                                        {eq.ultimoEstado || 'DESCONOCIDO'}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="w-[80px]">
                                            {eq.ultimoPingMs !== undefined && eq.ultimoPingMs !== null
                                                ? `${Number(eq.ultimoPingMs).toFixed(2)} ms`
                                                : "-"}
                                        </td>
                                        <td className="w-[300px]">
                                            <button
                                                onClick={() => probarSsh(eq.equipoId)}
                                                className="bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1 mr-2"
                                            >
                                                Probar SSH
                                            </button>
                                            <button
                                                onClick={() => editarEquipo(eq)}
                                                className="bg-yellow-600 hover:bg-yellow-700 rounded-lg px-3 py-1 mr-2"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => verMetricas(eq.equipoId)}
                                                className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded-lg text-xs font-bold"
                                                style={{ marginRight: 8 }}
                                            >
                                                Métricas
                                            </button>
                                            <button
                                                onClick={() => eliminarEquipo(eq.equipoId)}
                                                className="bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1"
                                            >
                                                Eliminar
                                            </button>

                                        </td>
                                    </tr>
                                ))}

                                {equipos.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-5 text-center text-slate-400">
                                            No hay equipos wireless registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {modalMetricas && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-7xl max-h-[95vh] overflow-auto">

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                Métricas Wireless
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {mca.deviceName || metricas?.nombre || "Equipo sin nombre"}
                                {" "}—{" "}
                                {mca.deviceIp || metricas?.ipGestion || "-"}
                            </p>

                            <p className="text-xs text-slate-500">
                                {mca.platform || metricas?.modelo || "-"}
                                {" | "}
                                MAC: {mca.deviceId || "-"}
                            </p>
                            <button
                                onClick={() => setModalMetricas(false)}
                                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                            >
                                Cerrar
                            </button>
                        </div>

                        {cargandoMetricas ? (
                            <p className="text-slate-300">
                                Consultando métricas...
                            </p>
                        ) : !metricas ? (
                            <p className="text-slate-400">
                                Sin datos.
                            </p>
                        ) : (
                            <>
                                {/* ESTADO GENERAL */}

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">


                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Estado</p>
                                        <p className={metricas.ok
                                            ? "text-green-400 font-bold"
                                            : "text-red-400 font-bold"}>
                                            {metricas.ok ? "ONLINE" : "OFFLINE"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Modo</p>
                                        <p className="text-white font-bold">
                                            {metricas.modo || "-"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Nodo</p>
                                        <p className="text-white font-bold">
                                            {metricas.nodo || "-"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Tiempo</p>
                                        <p className="text-white font-bold">
                                            {metricas.tiempoMs || "-"} ms
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">CPU</p>
                                        <p className="text-yellow-400 font-bold">
                                            {mca.cpuUsage || "-"}%
                                        </p>
                                    </div>



                                </div>
                                {estaciones.length > 0 && (
                                    <div
                                        onClick={() => setModalClienteWireless(true)}
                                        className="bg-slate-800 border border-cyan-700 rounded-xl p-4 mb-6 cursor-pointer hover:bg-slate-700"
                                    >
                                        <p className="text-xs text-slate-400">Clientes conectados</p>
                                        <p className="text-3xl font-bold text-cyan-400">
                                            {estaciones.length}
                                        </p>
                                        <p className="text-sm text-slate-300">
                                            Click para ver estaciones conectadas
                                        </p>
                                    </div>
                                )}
                                {/* RADIO */}

                                <h3 className="text-lg font-bold text-cyan-400 mb-3">
                                    Radio Wireless
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Frecuencia</p>
                                        <p className="text-white font-bold">
                                            {mca.freq || "-"} MHz
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Canal</p>
                                        <p className="text-white font-bold">
                                            {mca.centerFreq || "-"} MHz
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Ancho</p>
                                        <p className="text-white font-bold">
                                            {mca.chanbw || "-"} MHz
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Señal</p>
                                        <p className="text-green-400 font-bold">
                                            {mca.signal || "-"} dBm
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Ruido</p>
                                        <p className="text-red-400 font-bold">
                                            {mca.noise || "-"} dBm
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Potencia TX</p>
                                        <p className="text-white font-bold">
                                            {mca.txPower || "-"} dBm
                                        </p>
                                    </div>

                                </div>

                                {/* CAPACIDAD */}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">TX Rate</p>
                                        <p className="text-cyan-400 font-bold">
                                            {mca.wlanTxRate || "-"} Mbps
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">RX Rate</p>
                                        <p className="text-cyan-400 font-bold">
                                            {mca.wlanRxRate || "-"} Mbps
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Downlink</p>
                                        <p className="text-green-400 font-bold">
                                            {mca.wlanDownlinkCapacity || "-"} Kbps
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">Uplink</p>
                                        <p className="text-green-400 font-bold">
                                            {mca.wlanUplinkCapacity || "-"} Kbps
                                        </p>
                                    </div>

                                </div>
                                <div className="bg-slate-800 rounded-xl p-3">
                                    <p className="text-xs text-slate-400">Calidad</p>
                                    <p className="text-cyan-400 font-bold">
                                        {calcularCcq(mca.signal)}
                                    </p>
                                </div>
                                {/* TRAFICO */}

                                <h3 className="text-lg font-bold text-emerald-400 mb-3">
                                    Tráfico Interfaces
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                                    <div className="bg-slate-800 rounded-xl p-4">
                                        <h4 className="font-bold text-cyan-400 mb-2">
                                            WLAN (ath0)
                                        </h4>

                                        <p className="text-sm text-slate-300">
                                            RX Bytes:
                                        </p>
                                        <p className="font-bold">
                                            {mca.wlanRxBytes || "-"}
                                        </p>

                                        <p className="text-sm text-slate-300 mt-2">
                                            TX Bytes:
                                        </p>
                                        <p className="font-bold">
                                            {mca.wlanTxBytes || "-"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-4">
                                        <h4 className="font-bold text-emerald-400 mb-2">
                                            LAN (eth0)
                                        </h4>

                                        <p className="text-sm text-slate-300">
                                            RX Bytes:
                                        </p>
                                        <p className="font-bold">
                                            {mca.lanRxBytes || "-"}
                                        </p>

                                        <p className="text-sm text-slate-300 mt-2">
                                            TX Bytes:
                                        </p>
                                        <p className="font-bold">
                                            {mca.lanTxBytes || "-"}
                                        </p>
                                    </div>

                                </div>
                                <h3 className="text-lg font-bold text-blue-400 mb-3">
                                    Tráfico en vivo
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                                    <div className="bg-slate-800 rounded-xl p-4 h-72">
                                        <h4 className="font-bold text-cyan-400 mb-3">
                                            WLAN / ath0
                                        </h4>

                                        <ResponsiveContainer width="100%" height="85%">
                                            <LineChart data={historialTrafico}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="tiempo" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line
                                                    type="monotone"
                                                    dataKey="wlanRxMbps"
                                                    name="RX Mbps"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="wlanTxMbps"
                                                    name="TX Mbps"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-4 h-72">
                                        <h4 className="font-bold text-emerald-400 mb-3">
                                            LAN / eth0
                                        </h4>

                                        <ResponsiveContainer width="100%" height="85%">
                                            <LineChart data={historialTrafico}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="tiempo" />
                                                <YAxis />
                                                <Tooltip />
                                                <Line
                                                    type="monotone"
                                                    dataKey="lanRxMbps"
                                                    name="RX Mbps"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="lanTxMbps"
                                                    name="TX Mbps"
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                </div>

                                {/* SALIDA CRUDA */}

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
            )}
            {modalClienteWireless && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">
                                Estaciones conectadas
                            </h2>

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
                                    }

                                    }
                                    className="bg-slate-800 rounded-xl p-4 border border-slate-700 cursor-pointer hover:border-cyan-500"
                                >
                                    <p className="text-sm text-slate-400">Nombre equipo</p>
                                    <p className="font-bold text-white">
                                        {c.remote?.hostname || c.name || "Sin nombre"}
                                    </p>

                                    <p className="text-sm text-slate-400 mt-2">Última IP</p>
                                    <p className="font-bold text-cyan-400">
                                        {c.lastip || "-"}
                                    </p>

                                    <p className="text-sm text-slate-400 mt-2">MAC</p>
                                    <p className="font-bold text-white">
                                        {c.mac || "-"}
                                    </p>

                                    <p className="text-sm text-slate-400 mt-2">Modelo</p>
                                    <p className="font-bold text-white">
                                        {c.remote?.platform || "-"}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <p className="text-xs text-slate-400">Señal</p>
                                            <p className="font-bold text-green-400">
                                                {c.signal || c.remote?.signal || "-"} dBm
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">Ruido</p>
                                            <p className="font-bold text-red-400">
                                                {c.noisefloor || c.remote?.noisefloor || "-"} dBm
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">Distancia</p>
                                            <p className="font-bold text-yellow-400">
                                                {c.distance || c.remote?.distance || "-"} m
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">Latencia ACK</p>
                                            <p className="font-bold text-purple-400">
                                                {c.ack || "-"} µs
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">TX</p>
                                            <p className="font-bold text-cyan-400">
                                                {c.tx || "-"} Mbps
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">RX</p>
                                            <p className="font-bold text-cyan-400">
                                                {c.rx || "-"} Mbps
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {modalDetalleCliente && clienteWireless && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70]">
                    <div className="bg-slate-900 border border-cyan-700 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">
                                Detalle cliente wireless
                            </h2>

                            <button
                                onClick={() => {
                                    setModalDetalleCliente(false);
                                    setClienteWireless(null);
                                    setMacClienteGrafico(null);
                                    setHistorialCliente([]);
                                    setUltimoCliente(null);
                                    setModalScanSectorial(false);
                                    setSectorialesScan([]);
                                    setEscaneandoSectoriales(false);
                                }}
                                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                            >
                                Cerrar
                            </button>
                        </div>


                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Nombre</p>
                                <p className="font-bold text-white">
                                    {clienteWireless.remote?.hostname || clienteWireless.name || "-"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">IP</p>
                                <p className="font-bold text-cyan-400">
                                    {clienteWireless.lastip || "-"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Señal</p>
                                <p className="font-bold text-green-400">
                                    {clienteWireless.signal || "-"} dBm
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">ACK</p>
                                <p className="font-bold text-purple-400">
                                    {clienteWireless.ack || "-"} µs
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">IP secundaria</p>
                                <p className="font-bold text-cyan-400">
                                    {clienteWireless.remote?.ipaddr?.[1] || "-"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Modo red</p>
                                <p className="font-bold text-yellow-400 uppercase">
                                    {clienteWireless.remote?.netrole || "-"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Modo inalámbrico</p>
                                <p className="font-bold text-white">
                                    {clienteWireless.remote?.netrole || "-"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Modelo</p>
                                <p className="font-bold text-white">
                                    {clienteWireless.remote?.platform ||
                                        clienteWireless.platform ||
                                        "-"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Firmware</p>
                                <p className="font-bold text-white text-xs">
                                    {clienteWireless.remote?.version ||
                                        clienteWireless.version ||
                                        "-"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">CPU</p>
                                <p className="font-bold text-yellow-400">
                                    {clienteWireless.remote?.cpuload ??
                                        clienteWireless.cpuload ??
                                        "-"}%
                                </p>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">RAM libre</p>
                                <p className="font-bold text-green-400">
                                    {clienteWireless.remote?.freeram || "-"} KB
                                </p>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">
                                    Tiempo conectado
                                </p>

                                <p className="font-bold text-green-400">
                                    {new Date(Date.now() - (clienteWireless.uptime * 1000)).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">
                                    Encendido desde
                                </p>

                                <p className="font-bold text-cyan-400 text-xs">
                                    {
                                        clienteWireless.remote?.uptime
                                            ? new Date(
                                                Date.now() -
                                                (clienteWireless.remote.uptime * 1000)
                                            ).toLocaleString()
                                            : "-"
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-4 mb-4">
                            <h4 className="font-bold text-emerald-400 mb-3">
                                LAN / Ethernet
                            </h4>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                    <p className="text-xs text-slate-400">Interface</p>
                                    <p className="font-bold text-white">
                                        {eth?.ifname || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-400">Conectado</p>
                                    <p className={eth?.plugged ? "font-bold text-green-400" : "font-bold text-red-400"}>
                                        {eth?.plugged ? "Sí" : "No"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-400">Velocidad</p>
                                    <p className="font-bold text-cyan-400">
                                        {eth?.speed ? `${eth.speed} Mbps` : "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-400">Duplex</p>
                                    <p className="font-bold text-white">
                                        {eth?.duplex ? "Full" : eth ? "Half" : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-3">
                            Radio Wireless
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Frecuencia</p>
                                <p className="text-cyan-400 font-bold">
                                    {frecuencia || "-"} MHz
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Ancho Canal</p>
                                <p className="text-cyan-400 font-bold">
                                    {anchoCanal || "-"} MHz
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Potencia TX</p>
                                <p className="text-yellow-400 font-bold">
                                    {potenciaTx || clienteWireless.tx_power || "-"} dBm
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Distancia</p>
                                <p className="text-green-400 font-bold">
                                    {clienteWireless.distance || "-"} m
                                </p>
                            </div>

                        </div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-3">
                            Configuración de Red
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">IP Cliente</p>
                                <p className="text-cyan-400 font-bold">
                                    {clienteWireless.lastip}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Gateway</p>
                                <p className="text-green-400 font-bold">
                                    {routeInfo.gateway}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">Interface WAN</p>
                                <p className="text-white font-bold">
                                    {routeInfo.interfaz}
                                </p>
                            </div>


                        </div>
                        <h3 className="text-lg font-bold text-cyan-400 mb-3">
                            DNS
                        </h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">DNS Primario</p>
                                <p className="text-cyan-400 font-bold">
                                    {dnsInfo.dns1}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">DNS Secundario</p>
                                <p className="text-cyan-400 font-bold">
                                    {dnsInfo.dns2}
                                </p>
                            </div>

                        </div>

                        <h3 className="text-lg font-bold text-orange-400 mb-3">
                            Servicios y Seguridad
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">NAT</p>

                                <p
                                    className={
                                        nat
                                            ? "text-green-400 font-bold"
                                            : "text-red-400 font-bold"
                                    }
                                >
                                    {nat ? "ACTIVADO" : "DESACTIVADO"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">DMZ</p>

                                <p
                                    className={
                                        detalleCliente?.dmz
                                            ? "text-green-400 font-bold"
                                            : "text-red-400 font-bold"
                                    }
                                >
                                    {detalleCliente?.dmz ? "ACTIVO" : "NO"}
                                </p>
                            </div>

                            <div className="bg-slate-800 rounded-xl p-3">
                                <p className="text-xs text-slate-400">
                                    Bloqueo Administrativo
                                </p>

                                <p
                                    className={
                                        detalleCliente?.bloqueoAdministrativo
                                            ? "text-red-400 font-bold"
                                            : "text-green-400 font-bold"
                                    }
                                >
                                    {detalleCliente?.bloqueoAdministrativo
                                        ? "BLOQUEADO"
                                        : "PERMITIDO"}
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={() => setModalScanSectorial(true)}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-bold mb-4"
                        >
                            Escanear sectoriales
                        </button>


                        <div className="bg-slate-800 rounded-xl p-4 h-72 mb-4">
                            <h4 className="font-bold text-cyan-400 mb-3">
                                Consumo real del cliente
                            </h4>

                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={historialCliente}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tiempo" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="rxMbps"
                                        name="RX Mbps"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="txMbps"
                                        name="TX Mbps"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>


                        <details className="bg-black rounded-xl p-3">
                            <summary className="cursor-pointer text-slate-300 font-bold">
                                Ver salida SSH completa
                            </summary>

                            <pre className="text-green-400 text-xs whitespace-pre-wrap mt-4">
                                {JSON.stringify(clienteWireless, null, 2)}
                            </pre>
                        </details>


                    </div>
                </div>
            )
            }

            {modalScanSectorial && clienteWireless && (
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
                                onClick={() => {
                                    setModalDetalleCliente(false);
                                    setModalScanSectorial(false);
                                    setClienteWireless(null);
                                    setMacClienteGrafico(null);
                                    setHistorialCliente([]);
                                    setUltimoCliente(null);
                                    setSectorialesScan([]);
                                    setEscaneandoSectoriales(false);
                                }}
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
                                            <td className="py-3 font-bold text-white">
                                                {s.ssid || "-"}
                                            </td>
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
            )}

        </div >
    );
}