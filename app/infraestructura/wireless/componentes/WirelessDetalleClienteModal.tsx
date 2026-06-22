"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useState } from "react";
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
    clienteWireless: any;
    metricas: any;
    historialCliente: any[];
    onClose: () => void;
};

export default function WirelessDetalleClienteModal({
    equipoId,
    clienteWireless,
    metricas,
    historialCliente,
    onClose,
}: Props) {
    const [modalScanSectorial, setModalScanSectorial] = useState(false);
    const [modalReiniciarCpe, setModalReiniciarCpe] = useState(false);
    const [modalCambiarNombre, setModalCambiarNombre] = useState(false);
    const [modalWanConfig, setModalWanConfig] = useState(false);
    const [modalDmzConfig, setModalDmzConfig] = useState(false);
    const [modalPortForward, setModalPortForward] = useState(false);

    const [escaneandoSectoriales, setEscaneandoSectoriales] = useState(false);
    const [sectorialesScan, setSectorialesScan] = useState<any[]>([]);

    const [frecuenciaCliente, setFrecuenciaCliente] = useState("");
    const [aplicandoFrecuencia, setAplicandoFrecuencia] = useState(false);
    const [aplicandoWanConfig, setAplicandoWanConfig] = useState(false);
    const [aplicandoDmz, setAplicandoDmz] = useState(false);
    const [aplicandoPortForward, setAplicandoPortForward] = useState(false);

    const [credencialesCliente, setCredencialesCliente] = useState({
        usuarioCliente: "ubnt",
        claveCliente: "",
        puertoCliente: 22,
    });

    const [datosReinicio, setDatosReinicio] = useState({
        usuario: "ubnt",
        clave: "",
        puerto: 22,
    });

    const [datosNombreEquipo, setDatosNombreEquipo] = useState({
        usuario: "ubnt",
        clave: "",
        puerto: 22,
        nuevoNombre: "",
    });

    const [wanConfig, setWanConfig] = useState({
        ipAddress: "",
        netmask: "255.255.255.0",
        gateway: "",
        dns1: "8.8.8.8",
        dns2: "1.1.1.1",
    });

    const [dmzConfig, setDmzConfig] = useState({
        dmzActivo: true,
        dmzIp: "",
        dmzManagementPorts: false,
        usuario: "ubnt",
        clave: "",
        puerto: 22,
    });

    const [portForwardConfig, setPortForwardConfig] = useState({
        nombre: "NETCOMP_FORWARD",
        protocolo: "tcp",
        puertoExterno: "",
        ipDestino: "",
        puertoInterno: "",
        usuario: "ubnt",
        clave: "",
        puerto: 22,
    });

    const salidaMetricas = metricas?.salida || "";
    const cfg = salidaMetricas.split("---CFG---")[1]?.split("---ROUTES---")[0] || "";
    const routes = salidaMetricas.split("---ROUTES---")[1]?.split("---DNS---")[0] || "";
    const dns = salidaMetricas.split("---DNS---")[1]?.split("---NAT---")[0] || "";
    const nat = salidaMetricas.split("---NAT---")[1]?.split("---FILTER---")[0] || "";

    const eth = clienteWireless?.remote?.ethlist?.[0] || null;

    const detalleCliente = {
        dmz: false,
        bloqueoAdministrativo: false,
    };

    function obtenerValorCfg(texto: string, clave: string) {
        const linea = texto.split("\n").find((l) => l.startsWith(`${clave}=`));
        return linea?.split("=")[1]?.trim() || "";
    }

    const frecuencia = obtenerValorCfg(cfg, "radio.1.freq");
    const anchoCanal = obtenerValorCfg(cfg, "radio.1.chanbw");
    const potenciaTx = obtenerValorCfg(cfg, "radio.1.txpower");

    function parseRoutes(texto: string) {
        const lineas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
        const gatewayLinea = lineas.find(
            (l) => l.startsWith("0.0.0.0") || l.includes(" UG ")
        );

        if (!gatewayLinea) {
            return { gateway: "-", interfaz: "-" };
        }

        const partes = gatewayLinea.split(/\s+/);

        return {
            gateway: partes[1] || "-",
            interfaz: partes[7] || partes[partes.length - 1] || "-",
        };
    }

    function parseDns(texto: string) {
        const servidores = texto
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

    function calcularGatewayPorIp(ip?: string) {
        const partes = String(ip || "").split(".");
        if (partes.length !== 4) return "100.100.3.1";
        return `${partes[0]}.${partes[1]}.${partes[2]}.1`;
    }

    function abrirModalWanCliente() {
        const ipActual = clienteWireless?.lastip || "";

        const gatewayActual =
            routeInfo.gateway && routeInfo.gateway !== "-"
                ? routeInfo.gateway
                : calcularGatewayPorIp(ipActual);

        setWanConfig({
            ipAddress: ipActual,
            netmask: "255.255.255.0",
            gateway: gatewayActual,
            dns1: dnsInfo.dns1 && dnsInfo.dns1 !== "-" ? dnsInfo.dns1 : "8.8.8.8",
            dns2: dnsInfo.dns2 && dnsInfo.dns2 !== "-" ? dnsInfo.dns2 : "1.1.1.1",
        });

        setModalWanConfig(true);
    }

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

                return { mac, ssid, frecuencia, canal, signal, noise, cifrado };
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
            setModalScanSectorial(false);
        } catch (error) {
            console.error("Error aplicarCambioSectorial:", error);
            alert("Error aplicando cambio de sectorial");
        }
    }

    async function reiniciarClienteWireless() {
        const confirmar = confirm(
            `¿Seguro que deseas reiniciar el CPE?\n\nIP: ${clienteWireless.lastip}`
        );

        if (!confirmar) return;

        try {
            const res = await fetch(`${API_BASE}/wireless/equipos/${equipoId}/reiniciar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    ipCliente: clienteWireless.lastip,
                    usuarioCliente: datosReinicio.usuario,
                    claveCliente: datosReinicio.clave,
                    puertoCliente: Number(datosReinicio.puerto || 22),
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo reiniciar el CPE");
                return;
            }

            alert(data.mensaje || "Reinicio enviado correctamente");
            setModalReiniciarCpe(false);
        } catch (error) {
            console.error(error);
            alert("Error reiniciando CPE");
        }
    }

    async function cambiarFrecuenciaClienteWireless() {
        const frecuencia = Number(frecuenciaCliente);

        if (!frecuencia || frecuencia < 5000 || frecuencia > 6100) {
            alert("Ingrese una frecuencia válida entre 5000 y 6100 MHz");
            return;
        }

        if (!credencialesCliente.usuarioCliente || !credencialesCliente.claveCliente) {
            alert("Ingrese usuario y clave SSH del CPE cliente.");
            setModalScanSectorial(true);
            return;
        }

        const confirmar = confirm(
            `¿Cambiar frecuencia del CPE?\n\nIP: ${clienteWireless.lastip}\nFrecuencia: ${frecuencia} MHz`
        );

        if (!confirmar) return;

        setAplicandoFrecuencia(true);

        try {
            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoId}/cliente/cambiar-frecuencia`,
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
                        frecuencia,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo cambiar la frecuencia");
                return;
            }

            alert(data.mensaje || "Frecuencia aplicada correctamente");
        } catch (error) {
            console.error(error);
            alert("Error cambiando frecuencia");
        } finally {
            setAplicandoFrecuencia(false);
        }
    }

    async function aplicarWanConfigCliente() {
        if (!credencialesCliente.usuarioCliente || !credencialesCliente.claveCliente) {
            alert("Ingrese usuario y clave SSH del CPE cliente.");
            setModalScanSectorial(true);
            return;
        }

        if (!wanConfig.ipAddress || !wanConfig.netmask || !wanConfig.gateway) {
            alert("IP, máscara y gateway son obligatorios");
            return;
        }

        setAplicandoWanConfig(true);

        try {
            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoId}/cliente/config-wan`,
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
                        ...wanConfig,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo aplicar configuración WAN");
                return;
            }

            alert(data.mensaje || "Configuración aplicada correctamente");
            setModalWanConfig(false);
        } catch (error) {
            console.error(error);
            alert("Error aplicando configuración WAN");
        } finally {
            setAplicandoWanConfig(false);
        }
    }

    async function cambiarNombreEquipoWireless() {
        try {
            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoId}/cliente/cambiar-nombre`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        ipCliente: clienteWireless.lastip,
                        usuarioCliente: datosNombreEquipo.usuario,
                        claveCliente: datosNombreEquipo.clave,
                        puertoCliente: Number(datosNombreEquipo.puerto || 22),
                        nuevoNombre: datosNombreEquipo.nuevoNombre,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "Error cambiando nombre");
                return;
            }

            alert(data.mensaje || "Nombre actualizado");
            setModalCambiarNombre(false);
        } catch (error) {
            console.error(error);
            alert("Error cambiando nombre");
        }
    }

    async function aplicarDmzConfigCliente() {
        if (!dmzConfig.usuario || !dmzConfig.clave) {
            alert("Ingrese usuario y clave SSH");
            return;
        }

        if (dmzConfig.dmzActivo && !dmzConfig.dmzIp) {
            alert("Ingrese la IP DMZ");
            return;
        }

        setAplicandoDmz(true);

        try {
            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoId}/cliente/config-dmz`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        ipCliente: clienteWireless.lastip,
                        usuarioCliente: dmzConfig.usuario,
                        claveCliente: dmzConfig.clave,
                        puertoCliente: Number(dmzConfig.puerto || 22),
                        dmzActivo: dmzConfig.dmzActivo,
                        dmzIp: dmzConfig.dmzIp,
                        dmzManagementPorts: dmzConfig.dmzManagementPorts,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo configurar DMZ");
                return;
            }

            alert(data.mensaje || "DMZ configurado correctamente");
            setModalDmzConfig(false);
        } catch (error) {
            console.error(error);
            alert("Error configurando DMZ");
        } finally {
            setAplicandoDmz(false);
        }
    }

    async function aplicarPortForwardCliente() {
        if (!portForwardConfig.usuario || !portForwardConfig.clave) {
            alert("Ingrese usuario y clave SSH");
            return;
        }

        if (
            !portForwardConfig.protocolo ||
            !portForwardConfig.puertoExterno ||
            !portForwardConfig.ipDestino ||
            !portForwardConfig.puertoInterno
        ) {
            alert("Protocolo, puerto externo, IP destino y puerto interno son obligatorios");
            return;
        }

        setAplicandoPortForward(true);

        try {
            const res = await fetch(
                `${API_BASE}/wireless/equipos/${equipoId}/cliente/port-forward`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        ipCliente: clienteWireless.lastip,
                        usuarioCliente: portForwardConfig.usuario,
                        claveCliente: portForwardConfig.clave,
                        puertoCliente: Number(portForwardConfig.puerto || 22),
                        nombre: portForwardConfig.nombre,
                        protocolo: portForwardConfig.protocolo,
                        puertoExterno: Number(portForwardConfig.puertoExterno),
                        ipDestino: portForwardConfig.ipDestino,
                        puertoInterno: Number(portForwardConfig.puertoInterno),
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || "No se pudo agregar el Port Forward");
                return;
            }

            alert(data.mensaje || "Port Forward agregado correctamente");
            setModalPortForward(false);
        } catch (error) {
            console.error(error);
            alert("Error agregando Port Forward");
        } finally {
            setAplicandoPortForward(false);
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70]">
                <div className="bg-slate-900 border border-cyan-700 rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Detalle cliente wireless</h2>

                        <button
                            onClick={onClose}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <Card titulo="Nombre" valor={clienteWireless.remote?.hostname || clienteWireless.name || "-"} />
                        <Card titulo="IP" valor={clienteWireless.lastip || "-"} color="text-cyan-400" />
                        <Card titulo="Señal" valor={`${clienteWireless.signal || "-"} dBm`} color="text-green-400" />
                        <Card titulo="ACK" valor={`${clienteWireless.ack || "-"} µs`} color="text-purple-400" />
                        <Card titulo="IP secundaria" valor={clienteWireless.remote?.ipaddr?.[1] || "-"} color="text-cyan-400" />
                        <Card titulo="Modo red" valor={clienteWireless.remote?.netrole || "-"} color="text-yellow-400 uppercase" />
                        <Card titulo="Modelo" valor={clienteWireless.remote?.platform || clienteWireless.platform || "-"} />
                        <Card titulo="Firmware" valor={clienteWireless.remote?.version || clienteWireless.version || "-"} />
                        <Card titulo="CPU" valor={`${clienteWireless.remote?.cpuload ?? clienteWireless.cpuload ?? "-"}%`} color="text-yellow-400" />
                        <Card titulo="RAM libre" valor={`${clienteWireless.remote?.freeram || "-"} KB`} color="text-green-400" />
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 mb-4">
                        <h4 className="font-bold text-emerald-400 mb-3">LAN / Ethernet</h4>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Mini titulo="Interface" valor={eth?.ifname || "-"} />
                            <Mini titulo="Conectado" valor={eth?.plugged ? "Sí" : "No"} />
                            <Mini titulo="Velocidad" valor={eth?.speed ? `${eth.speed} Mbps` : "-"} />
                            <Mini titulo="Duplex" valor={eth?.duplex ? "Full" : eth ? "Half" : "-"} />
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-cyan-400 mb-3">Radio Wireless</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <Card titulo="Frecuencia" valor={`${frecuencia || "-"} MHz`} color="text-cyan-400" />
                        <Card titulo="Ancho Canal" valor={`${anchoCanal || "-"} MHz`} color="text-cyan-400" />
                        <Card titulo="Potencia TX" valor={`${potenciaTx || clienteWireless.tx_power || "-"} dBm`} color="text-yellow-400" />
                        <Card titulo="Distancia" valor={`${clienteWireless.distance || "-"} m`} color="text-green-400" />
                    </div>

                    <h3 className="text-lg font-bold text-cyan-400 mb-3">Configuración de Red</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <Card titulo="IP Cliente" valor={clienteWireless.lastip || "-"} color="text-cyan-400" />
                        <Card titulo="Gateway" valor={routeInfo.gateway} color="text-green-400" />
                        <Card titulo="Interface WAN" valor={routeInfo.interfaz} />
                        <Card titulo="DNS 1" valor={dnsInfo.dns1} color="text-cyan-400" />
                        <Card titulo="DNS 2" valor={dnsInfo.dns2} color="text-cyan-400" />
                    </div>

                    <h3 className="text-lg font-bold text-orange-400 mb-3">Servicios y Seguridad</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                        <Card titulo="NAT" valor={nat ? "ACTIVADO" : "DESACTIVADO"} color={nat ? "text-green-400" : "text-red-400"} />
                        <Card titulo="DMZ" valor={detalleCliente.dmz ? "ACTIVO" : "NO"} color={detalleCliente.dmz ? "text-green-400" : "text-red-400"} />
                        <Card titulo="Bloqueo Administrativo" valor={detalleCliente.bloqueoAdministrativo ? "BLOQUEADO" : "PERMITIDO"} color={detalleCliente.bloqueoAdministrativo ? "text-red-400" : "text-green-400"} />
                    </div>

                    <h3 className="text-lg font-bold text-pink-400 mb-3">Soporte - Online</h3>

                    <div className="bg-slate-800 rounded-xl p-4 mb-4">
                        <div className="flex flex-wrap gap-3 mb-4">
                            <button onClick={() => setModalScanSectorial(true)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-bold">
                                Escanear SSID
                            </button>

                            <button onClick={() => setModalReiniciarCpe(true)} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-bold">
                                Reiniciar CPE
                            </button>

                            <button onClick={abrirModalWanCliente} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl font-bold">
                                Configurar WAN
                            </button>

                            <button onClick={() => setModalDmzConfig(true)} className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-xl font-bold">
                                Configurar DMZ
                            </button>

                            <button onClick={() => setModalPortForward(true)} className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-xl font-bold">
                                Port Forward
                            </button>

                            <button onClick={() => setModalCambiarNombre(true)} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl font-bold">
                                Cambiar Nombre
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <input
                                type="number"
                                min={5000}
                                max={6100}
                                value={frecuenciaCliente}
                                onChange={(e) => setFrecuenciaCliente(e.target.value)}
                                placeholder="Frecuencia 5000-6100"
                                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                            />

                            <button
                                onClick={cambiarFrecuenciaClienteWireless}
                                disabled={aplicandoFrecuencia}
                                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 px-4 py-2 rounded-xl font-bold"
                            >
                                {aplicandoFrecuencia ? "Aplicando..." : "Cambiar frecuencia"}
                            </button>
                        </div>
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
                            Ver salida SSH completa
                        </summary>

                        <pre className="text-green-400 text-xs whitespace-pre-wrap mt-4">
                            {JSON.stringify(clienteWireless, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>

            {modalScanSectorial && (
                <ScanModal
                    clienteWireless={clienteWireless}
                    credencialesCliente={credencialesCliente}
                    setCredencialesCliente={setCredencialesCliente}
                    sectorialesScan={sectorialesScan}
                    escaneandoSectoriales={escaneandoSectoriales}
                    escanearSectorialesCliente={escanearSectorialesCliente}
                    aplicarCambioSectorial={aplicarCambioSectorial}
                    onClose={() => setModalScanSectorial(false)}
                />
            )}

            {modalReiniciarCpe && (
                <ModalSimple titulo="Reiniciar CPE" onClose={() => setModalReiniciarCpe(false)}>
                    <Input label="Usuario SSH" value={datosReinicio.usuario} onChange={(v: string) => setDatosReinicio((p) => ({ ...p, usuario: v }))} />
                    <Input label="Clave SSH" type="password" value={datosReinicio.clave} onChange={(v: string) => setDatosReinicio((p) => ({ ...p, clave: v }))} />
                    <Input label="Puerto SSH" type="number" value={datosReinicio.puerto} onChange={(v: string) => setDatosReinicio((p) => ({ ...p, puerto: Number(v || 22) }))} />

                    <button onClick={reiniciarClienteWireless} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-bold">
                        Reiniciar
                    </button>
                </ModalSimple>
            )}

            {modalCambiarNombre && (
                <ModalSimple titulo="Cambiar Nombre del Equipo" onClose={() => setModalCambiarNombre(false)}>
                    <Input label="Nuevo nombre" value={datosNombreEquipo.nuevoNombre} onChange={(v: string) => setDatosNombreEquipo((p) => ({ ...p, nuevoNombre: v }))} />
                    <Input label="Usuario SSH" value={datosNombreEquipo.usuario} onChange={(v: string) => setDatosNombreEquipo((p) => ({ ...p, usuario: v }))} />
                    <Input label="Clave SSH" type="password" value={datosNombreEquipo.clave} onChange={(v: string) => setDatosNombreEquipo((p) => ({ ...p, clave: v }))} />
                    <Input label="Puerto SSH" type="number" value={datosNombreEquipo.puerto} onChange={(v: string) => setDatosNombreEquipo((p) => ({ ...p, puerto: Number(v || 22) }))} />

                    <button onClick={cambiarNombreEquipoWireless} className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl font-bold">
                        Guardar
                    </button>
                </ModalSimple>
            )}

            {modalWanConfig && (
                <ModalSimple titulo="Configuración WAN / Red" onClose={() => setModalWanConfig(false)} max="max-w-2xl">
                    <Input label="Nueva IP" value={wanConfig.ipAddress} onChange={(v: string) => setWanConfig((p) => ({ ...p, ipAddress: v }))} />
                    <Input label="Máscara" value={wanConfig.netmask} onChange={(v: string) => setWanConfig((p) => ({ ...p, netmask: v }))} />
                    <Input label="Gateway" value={wanConfig.gateway} onChange={(v: string) => setWanConfig((p) => ({ ...p, gateway: v }))} />
                    <Input label="DNS 1" value={wanConfig.dns1} onChange={(v: string) => setWanConfig((p) => ({ ...p, dns1: v }))} />
                    <Input label="DNS 2" value={wanConfig.dns2} onChange={(v: string) => setWanConfig((p) => ({ ...p, dns2: v }))} />

                    <button onClick={aplicarWanConfigCliente} disabled={aplicandoWanConfig} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 px-4 py-2 rounded-xl font-bold">
                        {aplicandoWanConfig ? "Aplicando..." : "Guardar y aplicar"}
                    </button>
                </ModalSimple>
            )}

            {modalDmzConfig && (
                <ModalSimple titulo="Configurar DMZ" onClose={() => setModalDmzConfig(false)}>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={dmzConfig.dmzActivo}
                            onChange={(e) => setDmzConfig((p) => ({ ...p, dmzActivo: e.target.checked }))}
                        />
                        <span>DMZ Enable</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={dmzConfig.dmzManagementPorts}
                            onChange={(e) => setDmzConfig((p) => ({ ...p, dmzManagementPorts: e.target.checked }))}
                        />
                        <span>DMZ Management Ports</span>
                    </label>

                    <Input label="DMZ IP" value={dmzConfig.dmzIp} onChange={(v: string) => setDmzConfig((p) => ({ ...p, dmzIp: v }))} />
                    <Input label="Usuario SSH" value={dmzConfig.usuario} onChange={(v: string) => setDmzConfig((p) => ({ ...p, usuario: v }))} />
                    <Input label="Clave SSH" type="password" value={dmzConfig.clave} onChange={(v: string) => setDmzConfig((p) => ({ ...p, clave: v }))} />
                    <Input label="Puerto SSH" type="number" value={dmzConfig.puerto} onChange={(v: string) => setDmzConfig((p) => ({ ...p, puerto: Number(v || 22) }))} />

                    <button onClick={aplicarDmzConfigCliente} disabled={aplicandoDmz} className="bg-pink-600 hover:bg-pink-700 disabled:bg-slate-700 px-4 py-2 rounded-xl font-bold">
                        {aplicandoDmz ? "Aplicando..." : "Guardar y aplicar"}
                    </button>
                </ModalSimple>
            )}

            {modalPortForward && (
                <ModalSimple titulo="Configurar Port Forward" onClose={() => setModalPortForward(false)} max="max-w-xl">
                    <Input label="Nombre regla" value={portForwardConfig.nombre} onChange={(v: string) => setPortForwardConfig((p) => ({ ...p, nombre: v }))} />

                    <select
                        value={portForwardConfig.protocolo}
                        onChange={(e) => setPortForwardConfig((p) => ({ ...p, protocolo: e.target.value }))}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                    >
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                        <option value="tcpudp">TCP/UDP</option>
                    </select>

                    <Input label="Puerto externo" type="number" value={portForwardConfig.puertoExterno} onChange={(v: string) => setPortForwardConfig((p) => ({ ...p, puertoExterno: v }))} />
                    <Input label="IP destino LAN" value={portForwardConfig.ipDestino} onChange={(v: string) => setPortForwardConfig((p) => ({ ...p, ipDestino: v }))} />
                    <Input label="Puerto interno" type="number" value={portForwardConfig.puertoInterno} onChange={(v: string) => setPortForwardConfig((p) => ({ ...p, puertoInterno: v }))} />
                    <Input label="Usuario SSH" value={portForwardConfig.usuario} onChange={(v: string) => setPortForwardConfig((p) => ({ ...p, usuario: v }))} />
                    <Input label="Clave SSH" type="password" value={portForwardConfig.clave} onChange={(v: string) => setPortForwardConfig((p) => ({ ...p, clave: v }))} />
                    <Input label="Puerto SSH" type="number" value={portForwardConfig.puerto} onChange={(v: string) => setPortForwardConfig((p) => ({ ...p, puerto: Number(v || 22) }))} />

                    <button onClick={aplicarPortForwardCliente} disabled={aplicandoPortForward} className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 px-4 py-2 rounded-xl font-bold">
                        {aplicandoPortForward ? "Aplicando..." : "Guardar Port Forward"}
                    </button>
                </ModalSimple>
            )}
        </>
    );
}

function Card({ titulo, valor, color = "text-white" }: any) {
    return (
        <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400">{titulo}</p>
            <p className={`font-bold ${color}`}>{valor}</p>
        </div>
    );
}

function Mini({ titulo, valor }: any) {
    return (
        <div>
            <p className="text-xs text-slate-400">{titulo}</p>
            <p className="font-bold text-white">{valor}</p>
        </div>
    );
}

function Input({ label, value, onChange, type = "text" }: any) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={label}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
        />
    );
}

function ModalSimple({ titulo, children, onClose, max = "max-w-lg" }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
            <div className={`w-full ${max} rounded-2xl border border-slate-700 bg-slate-900 p-6`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{titulo}</h2>

                    <button
                        onClick={onClose}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-bold"
                    >
                        Cerrar
                    </button>
                </div>

                <div className="space-y-3">{children}</div>
            </div>
        </div>
    );
}

function ScanModal({
    clienteWireless,
    credencialesCliente,
    setCredencialesCliente,
    sectorialesScan,
    escaneandoSectoriales,
    escanearSectorialesCliente,
    aplicarCambioSectorial,
    onClose,
}: any) {
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[80]">
            <div className="bg-slate-900 border border-blue-700 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Escaneo de sectoriales</h2>
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
                            setCredencialesCliente((prev: any) => ({
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
                            setCredencialesCliente((prev: any) => ({
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
                            setCredencialesCliente((prev: any) => ({
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
                            {sectorialesScan.map((s: any, i: number) => (
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