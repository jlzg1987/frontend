'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type RouterMikrotik = {
    id: number;
    nombre: string;
    parroquia: string;
    sector: string;
};

type CorteCliente = {
    id: number;
    routerId: number;
    routerNombre: string;
    parroquia: string;
    sector: string;
    ipCliente: string;
    comentarioMikrotik: string;
    estado: 'ACTIVO' | 'CORTADO';
    disabled: string;
};

type FiltroEstado = '' | CorteCliente['estado'];

export default function MikrotikCortesPage() {
    const [routers, setRouters] = useState<RouterMikrotik[]>([]);
    const [routerId, setRouterId] = useState<number | ''>('');
    const [cortes, setCortes] = useState<CorteCliente[]>([]);
    const [loading, setLoading] = useState(false);

    const [ipCliente, setIpCliente] = useState('');
    const [comentario, setComentario] = useState('');

    const [sshActivo, setSshActivo] = useState<boolean | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>('');

    const token = getToken;

    async function cargarRouters() {
        const res = await fetch(`${API_BASE}/mikrotik/routers`, {
            headers: {
                Authorization: `Bearer ${token()}`,
            },
        });

        const data = await res.json();

        if (data.ok) {
            setRouters(data.datos || data.routers || []);
        }
    }

    async function cargarCortes() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/cortes-clientes`, {
                headers: {
                    Authorization: `Bearer ${token()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setCortes(data.datos);
            }
        } finally {
            setLoading(false);
        }
    }

    async function sincronizar() {
        if (!routerId) {
            alert('Seleccione un router');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/morosos/sincronizar`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token()}`,
                    },
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'Error sincronizando');
                return;
            }

            alert(
                `Sincronización completada\nTotal MikroTik: ${data.totalMikrotik}\nInsertados: ${data.insertados}\nActualizados: ${data.actualizados}`
            );

            await cargarCortes();
        } catch (error) {
            console.error('Error sincronizando MOROSOS:', error);
            alert('Error conectando con MikroTik');
        } finally {
            setLoading(false);
        }
    }


    async function cargarEstadoSsh() {

        if (!routerId) return;

        try {

            const res = await fetch(
                `${API_BASE}/mikrotik-conf/${routerId}/ssh-status`,
                {
                    headers: {
                        Authorization: `Bearer ${token()}`,
                    },
                }
            );

            const data = await res.json();

            if (data.ok) {
                setSshActivo(data.activo);
            }

        } catch (error) {
            console.error(error);
        }
    }

    async function cortar(id: number) {
        if (!confirm('¿Seguro desea cortar el servicio?')) return;

        const res = await fetch(`${API_BASE}/mikrotik-conf/cortes-clientes/${id}/cortar`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token()}`,
            },
        });

        const data = await res.json();

        if (!data.ok) {
            alert(data.mensaje || 'Error cortando servicio');
            return;
        }

        cargarCortes();
    }

    async function agregarMoroso() {
        try {
            if (!routerId || !ipCliente.trim()) {
                alert('Seleccione router e ingrese IP');
                return;
            }

            const payload = {
                ipCliente: ipCliente.trim(),
                comentario: comentario.trim(),
            };

            console.log('PAYLOAD:', payload);

            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/morosos/agregar`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token()}`,
                    },
                    body: JSON.stringify(payload),
                }
            );


            const texto = await res.text();

            alert('RESPUESTA CRUDA: ' + texto);

            const data = JSON.parse(texto);

            console.log('DATA:', data);

            if (!data.ok) {

                if (data.requiereActivarSSH) {
                    alert(
                        '⚠️ El servicio SSH está desactivado en el MikroTik.\n\n' +
                        'Presione primero el botón "Activar SSH" y vuelva a intentar.'
                    );
                    return;
                }

                alert(data.message || 'Error desconocido');
                return;
            }

            alert('✅ Moroso agregado correctamente');

        } catch (error: any) {

            console.error('Error agregarMoroso:', error);
            alert('Error agregando moroso: ' + String(error));
        }
    }

    async function activarSshRouter() {
        try {
            if (!routerId) {
                alert('Seleccione un router');
                return;
            }

            if (!confirm('¿Desea activar SSH en este MikroTik?')) return;

            const res = await fetch(`${API_BASE}/mikrotik-conf/activar-ssh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    routerId: Number(routerId),
                    port: '22',
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || data.mensaje || 'Error activando SSH');
                return;
            }

            alert(data.message || 'SSH activado correctamente');

        } catch (error) {
            console.error('Error activando SSH:', error);
            alert('Error activando SSH');
        }
    }

    async function removerMoroso(ipClienteRemover: string) {
        try {
            if (!routerId || !ipClienteRemover) {
                alert('Seleccione router e IP');
                return;
            }

            if (!confirm(`¿Seguro desea eliminar ${ipClienteRemover} de la lista?`)) {
                return;
            }

            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/morosos/remover`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token()}`,
                    },
                    body: JSON.stringify({
                        ipCliente: ipClienteRemover,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || data.mensaje || 'Error eliminando cliente');
                return;
            }

            alert(data.message || data.mensaje || 'Cliente eliminado correctamente');

            await cargarCortes();

        } catch (error) {
            console.error('Error removerMoroso:', error);
            alert('Error eliminando cliente: ' + String(error));
        }
    }


    async function activar(id: number) {
        if (!confirm('¿Seguro desea activar el servicio?')) return;

        const res = await fetch(`${API_BASE}/mikrotik-conf/cortes-clientes/${id}/activar`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token()}`,
            },
        });

        const data = await res.json();

        if (data.ok) {
            setSshActivo(true);
        }
        if (!data.ok) {
            alert(data.mensaje || 'Error activando servicio');
            return;
        }

        cargarCortes();
    }
    async function desactivarSshRouter() {
        try {

            if (!routerId) {
                alert('Seleccione un router');
                return;
            }

            const confirmar = confirm(
                '¿Desea desactivar SSH en este MikroTik?'
            );

            if (!confirmar) return;

            const res = await fetch(
                `${API_BASE}/mikrotik-conf/desactivar-ssh`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token()}`,
                    },
                    body: JSON.stringify({
                        routerId: Number(routerId),
                    }),
                }
            );

            const data = await res.json();

            console.log('DESACTIVAR SSH:', data);

            if (!data.ok) {
                alert(
                    data.message ||
                    data.mensaje ||
                    'Error desactivando SSH'
                );
                return;
            }

            alert(
                data.message ||
                data.mensaje ||
                'SSH desactivado correctamente'
            );

            setSshActivo(false);

        } catch (error) {
            console.error('Error desactivarSshRouter:', error);

            alert(
                'Error desactivando SSH: ' +
                String(error)
            );
        }
    }


    useEffect(() => {
        cargarRouters();
        cargarCortes();
    }, []);


    useEffect(() => {
        if (routerId) {
            cargarEstadoSsh();
        }
    }, [routerId]);

    const cortesFiltrados = cortes.filter((c) => {
        const coincideRouter =
            !routerId ||
            c.routerId === Number(routerId);

        const coincideEstado =
            !estadoFiltro ||
            c.estado === estadoFiltro;

        const texto = busqueda.trim().toLowerCase();

        const datosBusqueda = [
            c.comentarioMikrotik,
            c.ipCliente,
            c.routerNombre,
            c.parroquia,
            c.sector,
        ]
            .map((valor) => String(valor || '').toLowerCase())
            .join(' ');

        const coincideBusqueda =
            !texto ||
            datosBusqueda.includes(texto);

        return coincideRouter && coincideEstado && coincideBusqueda;
    });

    return (
        <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-white">


            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <h2 className="text-lg font-semibold mb-4">Router MikroTik</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select
                        value={routerId}
                        onChange={(e) => setRouterId(e.target.value ? Number(e.target.value) : '')}
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                    >
                        <option value="">Todos los routers</option>
                        {routers.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.nombre} - {r.parroquia} - {r.sector}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={sincronizar}
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 font-semibold"
                    >
                        Sincronizar MOROSOS
                    </button>

                    <button
                        onClick={cargarCortes}
                        className="bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2 font-semibold"
                    >
                        Recargar
                    </button>
                    <button
                        onClick={
                            sshActivo
                                ? desactivarSshRouter
                                : activarSshRouter
                        }
                        disabled={!routerId}
                        className={
                            sshActivo
                                ? "bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 font-semibold"
                                : "bg-red-600 hover:bg-red-700 rounded-xl px-4 py-2 font-semibold"
                        }
                    >
                        {
                            sshActivo
                                ? "SSH ACTIVADO"
                                : "SSH DESACTIVADO"
                        }
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                <h2 className="text-lg font-semibold mb-4">Agregar IP a MOROSOS</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                        value={ipCliente}
                        onChange={(e) => setIpCliente(e.target.value)}
                        placeholder="IP cliente"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
                    />

                    <input
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Nombre o comentario"
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 md:col-span-2"
                    />

                    <button
                        onClick={agregarMoroso}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-4 py-2 font-semibold"
                    >
                        Agregar
                    </button>

                </div>


            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Clientes sincronizados</h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Mostrando {cortesFiltrados.length} de {cortes.length} registros
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-3xl">
                            <input
                                type="search"
                                placeholder="Buscar cliente, comentario, IP, router o sector..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                            />

                            <select
                                value={estadoFiltro}
                                onChange={(e) => setEstadoFiltro(e.target.value as FiltroEstado)}
                                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 sm:min-w-44"
                            >
                                <option value="">Todos los estados</option>
                                <option value="ACTIVO">Activos</option>
                                <option value="CORTADO">Cortados</option>
                            </select>

                            {(busqueda || estadoFiltro) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBusqueda('');
                                        setEstadoFiltro('');
                                    }}
                                    className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-semibold text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-5 text-slate-400">Cargando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-slate-300">
                                <tr>
                                    <th className="p-3 text-left">Cliente / Comentario</th>
                                    <th className="p-3 text-left">IP</th>
                                    <th className="p-3 text-left">Router</th>
                                    <th className="p-3 text-left">Sector</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-center">Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cortesFiltrados.map((c) => (
                                    <tr key={c.id} className="border-b border-slate-800">
                                        <td className="p-3">
                                            {c.comentarioMikrotik || 'Sin comentario'}
                                        </td>
                                        <td className="p-3 font-mono">{c.ipCliente}</td>
                                        <td className="p-3">{c.routerNombre}</td>
                                        <td className="p-3">
                                            {c.parroquia} / {c.sector}
                                        </td>
                                        <td className="p-3">
                                            {c.estado === 'CORTADO' ? (
                                                <span className="px-3 py-1 rounded-full bg-red-900 text-red-200">
                                                    Cortado
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-green-900 text-green-200">
                                                    Activo
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {c.estado === 'CORTADO' ? (
                                                <button
                                                    onClick={() => activar(c.id)}
                                                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold"
                                                >
                                                    Activar
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => cortar(c.id)}
                                                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold"
                                                >
                                                    Cortar
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removerMoroso(c.ipCliente)}
                                                className="bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1 text-sm font-semibold"
                                                style={{ marginLeft: 10 }}
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {cortesFiltrados.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-5 text-center text-slate-400">
                                            {busqueda || estadoFiltro || routerId
                                                ? 'No se encontraron clientes con los filtros seleccionados.'
                                                : 'No hay clientes sincronizados.'}
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