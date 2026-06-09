'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getToken } from '@/src/lib/api';

type RouterMikrotik = {
    id: number;
    nombre: string;
    parroquia: string;
    sector: string;
};

export default function ConfiguracionMikrotikPage() {
    const [routers, setRouters] = useState<RouterMikrotik[]>([]);
    const [routerId, setRouterId] = useState<number | ''>('');

    const [sshActivo, setSshActivo] = useState(false);
    const [firewallSshProtegido, setFirewallSshProtegido] = useState(false);

    const [cargando, setCargando] = useState(false);
    const [procesandoSsh, setProcesandoSsh] = useState(false);
    const [procesandoFirewall, setProcesandoFirewall] = useState(false);

    const [ipPing, setIpPing] = useState('');
    const [resultadoPing, setResultadoPing] = useState<any>(null);

    const [procesandoApiFirewall, setProcesandoApiFirewall] = useState(false);
    const [apiFirewallProtegido, setApiFirewallProtegido] = useState(false);

    const [statusFirewall, setStatusFirewall] = useState<any>(null);
    const [procesandoPing, setProcesandoPing] = useState(false);

    const [ipAddresses, setIpAddresses] = useState<any[]>([]);
    const [addressNueva, setAddressNueva] = useState('');
    const [interfaceNueva, setInterfaceNueva] = useState('');
    const [commentNueva, setCommentNueva] = useState('');
    const [cargandoIpAddress, setCargandoIpAddress] = useState(false);

    const [natRules, setNatRules] = useState<any[]>([]);
    const [cargandoNat, setCargandoNat] = useState(false);
    const [modalNat, setModalNat] = useState(false);

    const [tipoNat, setTipoNat] = useState<'INTERNET' | 'CORTE'>('INTERNET');
    const [outInterfaceNat, setOutInterfaceNat] = useState('');
    const [addressListNat, setAddressListNat] = useState('MOROSOS');
    const [toAddressNat, setToAddressNat] = useState('');
    const [toPortNat, setToPortNat] = useState('80');
    const [commentNat, setCommentNat] = useState('');

    const token = () => getToken();

    async function cargarRouters() {
        try {
            const res = await fetch(`${API_BASE}/mikrotik/routers`, {
                headers: {
                    Authorization: `Bearer ${token()}`,
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

    async function cargarEstadoSsh(idRouter?: number) {
        const id = idRouter || routerId;

        if (!id) return;

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/${id}/ssh-status`, {
                headers: {
                    Authorization: `Bearer ${token()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setSshActivo(Boolean(data.activo));
            }
        } catch (error) {
            console.error('Error cargando estado SSH:', error);
        }
    }

    async function sincronizarMorosos() {
        if (!routerId) {
            alert('Seleccione un router');
            return;
        }

        setCargando(true);

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
                alert(data.mensaje || data.message || 'Error sincronizando MOROSOS');
                return;
            }

            alert(data.mensaje || 'MOROSOS sincronizados correctamente');
        } catch (error) {
            console.error(error);
            alert('Error conectando con MikroTik');
        } finally {
            setCargando(false);
        }
    }

    async function cambiarEstadoSsh() {
        if (!routerId) {
            alert('Seleccione un router');
            return;
        }

        const accion = sshActivo ? 'desactivar' : 'activar';

        if (!confirm(`¿Desea ${accion} SSH en este MikroTik?`)) return;

        setProcesandoSsh(true);

        try {
            const url = sshActivo
                ? `${API_BASE}/mikrotik-conf/desactivar-ssh`
                : `${API_BASE}/mikrotik-conf/activar-ssh`;

            const body = sshActivo
                ? { routerId: Number(routerId) }
                : { routerId: Number(routerId), port: '22' };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || data.mensaje || 'Error cambiando estado SSH');
                return;
            }

            await cargarEstadoSsh(Number(routerId));

            alert(data.message || data.mensaje || 'SSH actualizado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setProcesandoSsh(false);
        }
    }

    async function protegerSshFirewall() {
        if (!routerId) {
            alert('Seleccione un router');
            return;
        }

        if (!confirm('Esto permitirá SSH solo desde el VPS/WireGuard y bloqueará el puerto 22 para los demás. ¿Continuar?')) {
            return;
        }

        setProcesandoFirewall(true);

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/firewall/proteger-ssh`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token()}`,
                    },
                }
            );

            const text = await res.text();

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                console.error("Respuesta no JSON:", text);
                alert("El backend respondió HTML. Revisa la ruta o API_BASE.");
                return;
            }

            if (!data.ok) {
                alert(data.mensaje || data.message || 'Error aplicando firewall SSH');
                return;
            }

            setFirewallSshProtegido(true);
            await cargarStatusFirewall();
            alert(data.mensaje || data.message || 'Firewall SSH protegido correctamente');
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setProcesandoFirewall(false);
        }
    }

    async function protegerApiFirewall() {
        if (!routerId) {
            alert("Seleccione un router");
            return;
        }

        if (!confirm("Se permitirá API MikroTik solo desde el VPS y se bloqueará el resto. ¿Continuar?")) {
            return;
        }

        setProcesandoApiFirewall(true);

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/firewall/proteger-api`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token()}`,
                    },
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || data.message || "Error creando reglas API");
                return;
            }

            setApiFirewallProtegido(true);
            await cargarStatusFirewall();
            alert(data.mensaje || "Reglas API creadas correctamente");

        } catch (error) {
            console.error(error);
            alert("Error conectando con backend");
        } finally {
            setProcesandoApiFirewall(false);
        }
    }

    async function hacerPingCliente() {
        if (!routerId) {
            alert('Seleccione un router');
            return;
        }

        if (!ipPing.trim()) {
            alert('Ingrese la IP del cliente');
            return;
        }
        setProcesandoPing(true);
        setResultadoPing(null);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/ping-cliente`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    routerId: Number(routerId),
                    ipCliente: ipPing.trim(),
                }),
            });

            const data = await res.json();
            setResultadoPing(data);
        } catch (error) {
            console.error(error);
            alert('Error haciendo ping al cliente');
        } finally {
            setProcesandoPing(false);
        }
    }
    async function cargarStatusFirewall() {
        if (!routerId) return;

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/firewall/status-accesos`,
                {
                    headers: {
                        Authorization: `Bearer ${token()}`,
                    },
                }
            );

            const data = await res.json();

            console.log("STATUS FIREWALL:", data);

            if (!data.ok) return;

            const firewall = data.data?.firewall || data.firewall;

            setStatusFirewall(firewall);
            setFirewallSshProtegido(Boolean(firewall?.ssh?.protegido));
            setApiFirewallProtegido(Boolean(firewall?.api?.protegido));

        } catch (error) {
            console.error("Error cargando status firewall:", error);
        }
    }

    async function cargarIpAddresses() {
        if (!routerId) return;

        setCargandoIpAddress(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/ip-address`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setIpAddresses(data.datos || []);
            } else {
                alert(data.message || 'Error listando IP Address');
            }
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setCargandoIpAddress(false);
        }
    }

    async function agregarIpAddress() {
        if (!routerId) return alert('Seleccione un router');
        if (!addressNueva) return alert('Ingrese la IP con máscara. Ej: 192.168.88.1/24');
        if (!interfaceNueva) return alert('Ingrese la interface. Ej: ether1');

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/ip-address`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    address: addressNueva,
                    interfaceName: interfaceNueva,
                    comment: commentNueva,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error agregando IP Address');
                return;
            }

            setAddressNueva('');
            setInterfaceNueva('');
            setCommentNueva('');

            await cargarIpAddresses();

            alert(data.message || 'IP Address agregada');
        } catch (error) {
            console.error(error);
            alert('Error agregando IP Address');
        }
    }

    async function eliminarIpAddress(id: string) {
        if (!confirm('¿Eliminar esta IP Address del MikroTik?')) return;

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/ip-address/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error eliminando IP Address');
                return;
            }

            await cargarIpAddresses();

            alert(data.message || 'IP Address eliminada');
        } catch (error) {
            console.error(error);
            alert('Error eliminando IP Address');
        }
    }

    async function cambiarEstadoIpAddress(id: string, disabledActual: string) {
        const estaDesactivada = disabledActual === 'true';

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/ip-address/disabled`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    id,
                    disabled: !estaDesactivada,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error cambiando estado');
                return;
            }

            await cargarIpAddresses();
        } catch (error) {
            console.error(error);
            alert('Error cambiando estado IP Address');
        }
    }
    async function cargarNatRules() {
        if (!routerId) return;

        setCargandoNat(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/nat`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setNatRules(data.datos || []);
            } else {
                alert(data.message || 'Error listando NAT');
            }
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setCargandoNat(false);
        }
    }

    async function guardarNat() {
        if (!routerId) return alert('Seleccione un router');

        let url = '';
        let body: any = {};

        if (tipoNat === 'INTERNET') {
            if (!outInterfaceNat) return alert('Ingrese la interface de salida');

            url = `${API_BASE}/mikrotik-conf/routers/${routerId}/nat/internet`;
            body = {
                outInterface: outInterfaceNat,
                comment: commentNat || 'SALIDA DE INTERNET NAT GENERAL',
            };
        }

        if (tipoNat === 'CORTE') {
            if (!toAddressNat) return alert('Ingrese la IP destino del portal de corte');

            url = `${API_BASE}/mikrotik-conf/routers/${routerId}/nat/corte`;
            body = {
                addressList: addressListNat || 'MOROSOS',
                toAddress: toAddressNat,
                toPort: toPortNat || '80',
                comment: commentNat || 'CORTE DE SERVICIO CLIENTE',
            };
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error creando NAT');
                return;
            }

            setModalNat(false);
            setOutInterfaceNat('');
            setToAddressNat('');
            setToPortNat('80');
            setAddressListNat('MOROSOS');
            setCommentNat('');

            await cargarNatRules();

            alert(data.message || 'NAT creado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error creando NAT');
        }
    }

    async function eliminarNat(id: string) {
        if (!confirm('¿Eliminar esta regla NAT?')) return;

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/nat/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error eliminando NAT');
                return;
            }

            await cargarNatRules();
        } catch (error) {
            console.error(error);
            alert('Error eliminando NAT');
        }
    }

    async function cambiarEstadoNat(id: string, disabledActual: string) {
        const estaDesactivada = disabledActual === 'true';

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/nat/disabled`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    id,
                    disabled: !estaDesactivada,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error cambiando estado NAT');
                return;
            }

            await cargarNatRules();
        } catch (error) {
            console.error(error);
            alert('Error cambiando estado NAT');
        }
    }

    useEffect(() => {
        cargarRouters();
    }, []);

    useEffect(() => {
        if (routerId) {
            cargarEstadoSsh(Number(routerId));
            cargarStatusFirewall();
            setResultadoPing(null);
            console.log("STATUS FIREWALL:", statusFirewall);
        }
    }, [routerId]);

    return (
        <main className="min-h-screen bg-slate-950 text-white p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Configuración MikroTik</h1>
                <p className="text-slate-400">
                    Servicios, firewall, cortes, address-list, NAT y herramientas operativas.
                </p>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                    value={routerId}
                    onChange={(e) => setRouterId(e.target.value ? Number(e.target.value) : '')}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3"
                >
                    <option value="">Seleccione un router</option>
                    {routers.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.nombre} - {r.parroquia} - {r.sector}
                        </option>
                    ))}
                </select>

                <button
                    onClick={sincronizarMorosos}
                    disabled={!routerId || cargando}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl px-4 py-3 font-semibold"
                >
                    {cargando ? 'Sincronizando...' : 'Sincronizar MOROSOS'}
                </button>

                <div className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
                    Router seleccionado: {routerId || 'Ninguno'}
                </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <h2 className="text-lg font-bold mb-2">Servicio SSH</h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Activa o desactiva el servicio SSH del MikroTik por puerto 22.
                    </p>

                    <div className="mb-4">
                        <span
                            className={
                                sshActivo
                                    ? 'rounded-full bg-green-600 px-3 py-1 text-sm'
                                    : 'rounded-full bg-red-600 px-3 py-1 text-sm'
                            }
                        >
                            {sshActivo ? 'SSH ACTIVADO' : 'SSH DESACTIVADO'}
                        </span>
                    </div>

                    <button
                        onClick={cambiarEstadoSsh}
                        disabled={!routerId || procesandoSsh}
                        className={
                            sshActivo
                                ? 'w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl px-4 py-3 font-semibold'
                                : 'w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl px-4 py-3 font-semibold'
                        }
                    >
                        {procesandoSsh
                            ? 'Procesando...'
                            : sshActivo
                                ? 'Desactivar SSH'
                                : 'Activar SSH'}
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <h2 className="text-lg font-bold mb-2">Firewall SSH Seguro</h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Crea reglas para permitir SSH solo desde el VPS/WireGuard y bloquear los demás accesos por puerto 22.
                    </p>
                    <p className="text-sm text-slate-400 mb-4">
                        Permite API MikroTik solo desde el VPS/WireGuard y bloquea los demás accesos a los puertos 8728 y 8729.
                    </p>

                    <div className="mb-4">
                        <span
                            className={
                                statusFirewall?.ssh?.protegido
                                    ? 'rounded-full bg-green-600 px-3 py-1 text-sm'
                                    : 'rounded-full bg-yellow-600 px-3 py-1 text-sm'
                            }
                        >
                            {statusFirewall?.ssh?.protegido ? 'PROTEGIDO' : 'PENDIENTE'}
                        </span>

                        <span
                            className={
                                statusFirewall?.api?.protegido
                                    ? 'rounded-full bg-green-600 px-3 py-1 text-sm'
                                    : 'rounded-full bg-yellow-600 px-3 py-1 text-sm'
                            }
                            style={{ marginLeft: 8 }}
                        >
                            {statusFirewall?.api?.protegido ? 'API PROTEGIDA' : 'PENDIENTE'}
                        </span>
                    </div>


                    <button
                        onClick={protegerSshFirewall}
                        disabled={!routerId || procesandoFirewall}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl px-4 py-3 font-semibold"
                    >
                        {procesandoFirewall ? 'Aplicando reglas...' : 'Proteger SSH por Firewall'}
                    </button>
                    <button
                        onClick={protegerApiFirewall}
                        disabled={!routerId || procesandoApiFirewall}
                        style={{ marginTop: 10 }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl px-4 py-3 font-semibold"
                    >
                        {procesandoApiFirewall
                            ? "Creando reglas..."
                            : apiFirewallProtegido
                                ? "Reglas API creadas"
                                : "Proteger API por Firewall"}
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <h2 className="text-lg font-bold mb-2">Ping Cliente</h2>
                    <p className="text-sm text-slate-400 mb-4">
                        Verifica si un cliente, enlace o sectorial responde desde el MikroTik.
                    </p>

                    <input
                        value={ipPing}
                        onChange={(e) => setIpPing(e.target.value)}
                        placeholder="Ej: 192.168.84.10"
                        className="w-full mb-3 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
                    />

                    <button
                        onClick={hacerPingCliente}
                        disabled={!routerId || procesandoPing}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-xl px-4 py-3 font-semibold"
                    >
                        {procesandoPing ? 'Realizando ping de 25 paquetes...' : 'Hacer Ping'}
                    </button>

                    {resultadoPing && (
                        <div className="mt-4 rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm">
                            <p>Online: {resultadoPing.online ? 'Sí' : 'No'}</p>
                            <p>Ping promedio: {resultadoPing.pingPromedioMs ?? 'Sin respuesta'} ms</p>
                            <p>Latencia: {resultadoPing.latencia || 'N/A'}</p>
                            <p>Recibidos: {resultadoPing.recibidos ?? 0}</p>
                            <p>Perdidos: {resultadoPing.perdidos ?? 0}</p>
                        </div>
                    )}
                </div>


                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">IP Address</h2>
                            <p className="text-sm text-slate-400">
                                Lista las IP configuradas en IP &gt; Addresses del MikroTik.
                            </p>
                        </div>

                        <button
                            onClick={cargarIpAddresses}
                            disabled={!routerId || cargandoIpAddress}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            {cargandoIpAddress ? 'Cargando...' : 'Cargar'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                        <input
                            value={addressNueva}
                            onChange={(e) => setAddressNueva(e.target.value)}
                            placeholder="IP/Máscara Ej: 192.168.88.1/24"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <input
                            value={interfaceNueva}
                            onChange={(e) => setInterfaceNueva(e.target.value)}
                            placeholder="Interface Ej: ether1"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <input
                            value={commentNueva}
                            onChange={(e) => setCommentNueva(e.target.value)}
                            placeholder="Comentario"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <button
                            onClick={agregarIpAddress}
                            disabled={!routerId}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            Agregar IP
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="text-left py-2">Address</th>
                                    <th className="text-left py-2">Network</th>
                                    <th className="text-left py-2">Interface</th>
                                    <th className="text-left py-2">Comentario</th>
                                    <th className="text-left py-2">Estado</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ipAddresses.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-slate-500">
                                            No hay IP Address cargadas
                                        </td>
                                    </tr>
                                )}

                                {ipAddresses.map((item) => {
                                    const id = item['.id'];
                                    const desactivada = item.disabled === 'true';

                                    return (
                                        <tr key={id} className="border-b border-slate-800">
                                            <td className="py-2 font-semibold">{item.address}</td>
                                            <td className="py-2">{item.network || '-'}</td>
                                            <td className="py-2">{item.interface || '-'}</td>
                                            <td className="py-2">{item.comment || '-'}</td>
                                            <td className="py-2">
                                                <span
                                                    className={
                                                        desactivada
                                                            ? 'text-red-400 font-semibold'
                                                            : 'text-green-400 font-semibold'
                                                    }
                                                >
                                                    {desactivada ? 'Desactivada' : 'Activa'}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right space-x-2">
                                                <button
                                                    onClick={() => cambiarEstadoIpAddress(id, item.disabled)}
                                                    className={
                                                        desactivada
                                                            ? 'bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1 text-xs font-semibold'
                                                            : 'bg-yellow-600 hover:bg-yellow-700 rounded-lg px-3 py-1 text-xs font-semibold'
                                                    }
                                                >
                                                    {desactivada ? 'Activar' : 'Desactivar'}
                                                </button>

                                                <button
                                                    onClick={() => eliminarIpAddress(id)}
                                                    className="bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1 text-xs font-semibold"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">NAT</h2>
                            <p className="text-sm text-slate-400">
                                Aquí configuraremos masquerade, redirecciones y reglas NAT.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={cargarNatRules}
                                disabled={!routerId || cargandoNat}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                            >
                                {cargandoNat ? 'Cargando...' : 'Cargar'}
                            </button>

                            <button
                                onClick={() => setModalNat(true)}
                                disabled={!routerId}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                            >
                                Agregar NAT
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="text-left py-2">Chain</th>
                                    <th className="text-left py-2">Action</th>
                                    <th className="text-left py-2">Interface</th>
                                    <th className="text-left py-2">Src List</th>
                                    <th className="text-left py-2">Dst Port</th>
                                    <th className="text-left py-2">To Address</th>
                                    <th className="text-left py-2">Comentario</th>
                                    <th className="text-left py-2">Estado</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {natRules.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-4 text-center text-slate-500">
                                            No hay reglas NAT cargadas
                                        </td>
                                    </tr>
                                )}

                                {natRules.map((item) => {
                                    const id = item['.id'];
                                    const desactivada = item.disabled === 'true';

                                    return (
                                        <tr key={id} className="border-b border-slate-800">
                                            <td className="py-2">{item.chain || '-'}</td>
                                            <td className="py-2">{item.action || '-'}</td>
                                            <td className="py-2">{item['out-interface'] || '-'}</td>
                                            <td className="py-2">{item['src-address-list'] || '-'}</td>
                                            <td className="py-2">{item['dst-port'] || '-'}</td>
                                            <td className="py-2">{item['to-addresses'] || '-'}</td>
                                            <td className="py-2">{item.comment || '-'}</td>
                                            <td className="py-2">
                                                <span className={desactivada ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                                                    {desactivada ? 'Desactivada' : 'Activa'}
                                                </span>
                                            </td>
                                            <td className="py-2 text-right space-x-2">
                                                <button
                                                    onClick={() => cambiarEstadoNat(id, item.disabled)}
                                                    className={
                                                        desactivada
                                                            ? 'bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1 text-xs font-semibold'
                                                            : 'bg-yellow-600 hover:bg-yellow-700 rounded-lg px-3 py-1 text-xs font-semibold'
                                                    }
                                                >
                                                    {desactivada ? 'Activar' : 'Desactivar'}
                                                </button>

                                                <button
                                                    onClick={() => eliminarNat(id)}
                                                    className="bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1 text-xs font-semibold"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {modalNat && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Agregar regla NAT</h3>

                                    <button
                                        onClick={() => setModalNat(false)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <select
                                        value={tipoNat}
                                        onChange={(e) => setTipoNat(e.target.value as 'INTERNET' | 'CORTE')}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    >
                                        <option value="INTERNET">NAT salida internet - Masquerade</option>
                                        <option value="CORTE">NAT corte cliente - Redirección</option>
                                    </select>

                                    {tipoNat === 'INTERNET' && (
                                        <input
                                            value={outInterfaceNat}
                                            onChange={(e) => setOutInterfaceNat(e.target.value)}
                                            placeholder="Interface salida internet Ej: ether1, pppoe-out1"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                        />
                                    )}

                                    {tipoNat === 'CORTE' && (
                                        <>
                                            <input
                                                value={addressListNat}
                                                onChange={(e) => setAddressListNat(e.target.value)}
                                                placeholder="Address List Ej: MOROSOS"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                            />

                                            <input
                                                value={toAddressNat}
                                                onChange={(e) => setToAddressNat(e.target.value)}
                                                placeholder="IP destino portal corte Ej: 192.168.1.2"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                            />

                                            <input
                                                value={toPortNat}
                                                onChange={(e) => setToPortNat(e.target.value)}
                                                placeholder="Puerto destino Ej: 80"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                            />
                                        </>
                                    )}

                                    <input
                                        value={commentNat}
                                        onChange={(e) => setCommentNat(e.target.value)}
                                        placeholder="Comentario"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-5">
                                    <button
                                        onClick={() => setModalNat(false)}
                                        className="bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2 text-sm font-semibold"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={guardarNat}
                                        className="bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 text-sm font-semibold"
                                    >
                                        Guardar NAT
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <h2 className="text-lg font-bold mb-2">Backup</h2>
                    <p className="text-sm text-slate-400">
                        Aquí luego agregamos export, backup y respaldo automático.
                    </p>
                </div>
            </section>
        </main>
    );
}