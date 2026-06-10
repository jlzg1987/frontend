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

    const token = getToken();
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

                const res = await fetch(`${API_BASE}/wireless/equipos/${eq.equipoId}/test-ssh`, {
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
                                ultimoEstado: data.estado || 'OFFLINE',
                                ultimoPingMs: data.pingMs || null,
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

    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-6">
                Equipos Wireless
            </h1>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 mb-6">


                <h2 className="text-lg font-bold mb-4">
                    {editandoId ? 'Editar equipo' : 'Nuevo equipo'}
                </h2>
                <select
                    value={form.routerId}
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
                                    <th className="text-left py-2">Nodo-Servidor</th>
                                    <th className="text-left py-2">Nombre</th>
                                    <th className="text-left py-2">Marca</th>
                                    <th className="text-left py-2">Tipo</th>
                                    <th className="text-left py-2">IP</th>
                                    <th className="text-left py-2">Estado</th>
                                    <th className="text-left py-2">Ping</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {equipos.map((eq) => (
                                    <tr key={eq.equipoId} className="border-b border-slate-800">
                                        <td className="py-3 font-semibold">{eq.routerNombre || 'Sin router'}
                                            {eq.routerSector ? ` - ${eq.routerSector}` : ''}</td>
                                        <td>{eq.nombre}</td>
                                        <td>{eq.marca}</td>
                                        <td>{eq.tipoEquipo}</td>
                                        <td>{eq.ipGestion}</td>
                                        <td>
                                            <span className={
                                                eq.ultimoEstado === 'ONLINE'
                                                    ? 'text-green-400 font-bold'
                                                    : eq.ultimoEstado === 'OFFLINE'
                                                        ? 'text-red-400 font-bold'
                                                        : 'text-slate-400'
                                            }>
                                                {verificandoIds.includes(eq.equipoId || '') ? (
                                                    <span className="text-yellow-400 font-bold">
                                                        Verificando...
                                                    </span>
                                                ) : (
                                                    <span className={
                                                        eq.ultimoEstado === 'ONLINE'
                                                            ? 'text-green-400 font-bold'
                                                            : eq.ultimoEstado === 'OFFLINE'
                                                                ? 'text-red-400 font-bold'
                                                                : 'text-slate-400'
                                                    }>
                                                        {eq.ultimoEstado || 'DESCONOCIDO'}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            {eq.ultimoPingMs ? `${eq.ultimoPingMs} ms` : '-'}
                                        </td>
                                        <td className="text-right">
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
                                        <p className="text-xs text-slate-400">Clientes</p>
                                        <p className="text-cyan-400 font-bold">
                                            {mca.wlanConnections || "0"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-800 rounded-xl p-3">
                                        <p className="text-xs text-slate-400">CPU</p>
                                        <p className="text-yellow-400 font-bold">
                                            {mca.cpuUsage || "-"}%
                                        </p>
                                    </div>

                                </div>

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
        </div>
    );
}