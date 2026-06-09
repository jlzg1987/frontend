// app/wireless/equipos/page.tsx
'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type EquipoWireless = {
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
};

const equipoInicial: EquipoWireless = {
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
};

export default function EquiposWirelessPage() {
    const [equipos, setEquipos] = useState<EquipoWireless[]>([]);
    const [form, setForm] = useState<EquipoWireless>(equipoInicial);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [verificandoIds, setVerificandoIds] = useState<string[]>([]);

    useEffect(() => {
        cargarEquipos();
    }, []);
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

    return (
        <div className="p-6 text-white">
            <h1 className="text-2xl font-bold mb-6">
                Equipos Wireless
            </h1>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 mb-6">
                <h2 className="text-lg font-bold mb-4">
                    {editandoId ? 'Editar equipo' : 'Nuevo equipo'}
                </h2>

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
                                        <td className="py-3 font-semibold">{eq.nombre}</td>
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
        </div>
    );
}