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

    const [proxyInfo, setProxyInfo] = useState<any>(null);
    const [proxyAccess, setProxyAccess] = useState<any[]>([]);
    const [proxyPort, setProxyPort] = useState('8080');
    const [cargandoProxy, setCargandoProxy] = useState(false);
    const [modalProxyAccess, setModalProxyAccess] = useState(false);

    const [proxySrcAddress, setProxySrcAddress] = useState('');
    const [proxyDstHost, setProxyDstHost] = useState('');
    const [proxyPath, setProxyPath] = useState('');
    const [proxyAction, setProxyAction] = useState('deny');
    const [proxyRedirectTo, setProxyRedirectTo] = useState('');
    const [proxyComment, setProxyComment] = useState('');

    const [ipPools, setIpPools] = useState<any[]>([]);
    const [cargandoIpPool, setCargandoIpPool] = useState(false);
    const [modalIpPool, setModalIpPool] = useState(false);

    const [poolName, setPoolName] = useState('');
    const [poolRanges, setPoolRanges] = useState('');
    const [poolComment, setPoolComment] = useState('');

    const [ipRoutes, setIpRoutes] = useState<any[]>([]);
    const [cargandoIpRoutes, setCargandoIpRoutes] = useState(false);
    const [modalIpRoute, setModalIpRoute] = useState(false);

    const [routeDstAddress, setRouteDstAddress] = useState('');
    const [routeGateway, setRouteGateway] = useState('');
    const [routeDistance, setRouteDistance] = useState('1');
    const [routeComment, setRouteComment] = useState('');

    const [interfacesMk, setInterfacesMk] = useState<any[]>([]);
    const [interfaceSeleccionada, setInterfaceSeleccionada] = useState('');
    const [traficoInterfaces, setTraficoInterfaces] = useState<any[]>([]);
    const [monitoreandoInterface, setMonitoreandoInterface] = useState(false);
    const [cargandoInterfaces, setCargandoInterfaces] = useState(false);

    const [backupsMk, setBackupsMk] = useState<any[]>([]);
    const [cargandoBackups, setCargandoBackups] = useState(false);
    const [creandoBackup, setCreandoBackup] = useState(false);
    const [restaurandoBackup, setRestaurandoBackup] = useState(false);

    const [backupNombre, setBackupNombre] = useState('');
    const [backupTipo, setBackupTipo] = useState<'backup' | 'rsc'>('backup');

    const [systemUsers, setSystemUsers] = useState<any[]>([]);
    const [cargandoSystemUsers, setCargandoSystemUsers] = useState(false);

    const [userNameMk, setUserNameMk] = useState('');
    const [userPasswordMk, setUserPasswordMk] = useState('');
    const [userGroupMk, setUserGroupMk] = useState('read');
    const [userCommentMk, setUserCommentMk] = useState('');

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

    async function cargarProxy() {
        if (!routerId) return;

        setCargandoProxy(true);

        try {
            const [resStatus, resAccess] = await Promise.all([
                fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/proxy/status`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                }),
                fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/proxy/access`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                }),
            ]);

            const status = await resStatus.json();
            const access = await resAccess.json();

            if (status.ok) {
                setProxyInfo(status.proxy || null);
                setProxyPort(status.proxy?.port || '8080');
            }

            if (access.ok) {
                setProxyAccess(access.datos || []);
            }
        } catch (error) {
            console.error(error);
            alert('Error cargando proxy');
        } finally {
            setCargandoProxy(false);
        }
    }

    async function configurarProxy(enabled?: boolean) {
        if (!routerId) return;

        try {
            const body: any = {};

            if (typeof enabled === 'boolean') {
                body.enabled = enabled;
            }

            if (proxyPort) {
                body.port = proxyPort;
            }

            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/proxy/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error configurando proxy');
                return;
            }

            await cargarProxy();
        } catch (error) {
            console.error(error);
            alert('Error configurando proxy');
        }
    }

    async function agregarProxyAccess() {
        if (!routerId) return;

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/proxy/access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    srcAddress: proxySrcAddress,
                    dstHost: proxyDstHost,
                    path: proxyPath,
                    action: proxyAction,
                    redirectTo: proxyRedirectTo,
                    comment: proxyComment,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error agregando proxy access');
                return;
            }

            setModalProxyAccess(false);
            setProxySrcAddress('');
            setProxyDstHost('');
            setProxyPath('');
            setProxyAction('deny');
            setProxyRedirectTo('');
            setProxyComment('');

            await cargarProxy();
        } catch (error) {
            console.error(error);
            alert('Error agregando proxy access');
        }
    }

    async function eliminarProxyAccess(id: string) {
        if (!confirm('¿Eliminar esta regla Proxy Access?')) return;

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/proxy/access/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error eliminando regla');
                return;
            }

            await cargarProxy();
        } catch (error) {
            console.error(error);
            alert('Error eliminando proxy access');
        }
    }

    async function cargarIpPools() {
        if (!routerId) return;

        setCargandoIpPool(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/ip-pool`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setIpPools(data.datos || []);
            } else {
                alert(data.message || 'Error listando IP Pool');
            }
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setCargandoIpPool(false);
        }
    }

    async function guardarIpPool() {
        if (!routerId) return alert('Seleccione un router');
        if (!poolName.trim()) return alert('Ingrese el nombre del pool');
        if (!poolRanges.trim()) return alert('Ingrese el rango del pool');

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/ip-pool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    name: poolName.trim(),
                    ranges: poolRanges.trim(),
                    comment: poolComment.trim(),
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error creando IP Pool');
                return;
            }

            setModalIpPool(false);
            setPoolName('');
            setPoolRanges('');
            setPoolComment('');

            await cargarIpPools();
        } catch (error) {
            console.error(error);
            alert('Error creando IP Pool');
        }
    }

    async function eliminarIpPool(id: string) {
        if (!confirm('¿Eliminar este IP Pool?')) return;

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/ip-pool/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error eliminando IP Pool');
                return;
            }

            await cargarIpPools();
        } catch (error) {
            console.error(error);
            alert('Error eliminando IP Pool');
        }
    }

    async function cargarIpRoutes() {
        if (!routerId) return;

        setCargandoIpRoutes(true);

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/ip-routes`,
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                    },
                }
            );

            const data = await res.json();

            if (data.ok) {
                setIpRoutes(data.datos || []);
            } else {
                alert(data.message || 'Error listando rutas');
            }
        } catch (error) {
            console.error(error);
            alert('Error cargando rutas');
        } finally {
            setCargandoIpRoutes(false);
        }
    }

    async function guardarIpRoute() {
        if (!routerId) return;

        if (!routeDstAddress.trim()) {
            return alert('Ingrese destino');
        }

        if (!routeGateway.trim()) {
            return alert('Ingrese gateway');
        }

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/ip-routes`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        dstAddress: routeDstAddress,
                        gateway: routeGateway,
                        distance: routeDistance,
                        comment: routeComment,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error creando ruta');
                return;
            }

            setModalIpRoute(false);

            setRouteDstAddress('');
            setRouteGateway('');
            setRouteDistance('1');
            setRouteComment('');

            await cargarIpRoutes();

        } catch (error) {
            console.error(error);
            alert('Error creando ruta');
        }
    }

    async function eliminarIpRoute(id: string) {
        if (!confirm('¿Eliminar esta ruta?')) return;

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/ip-routes/remove`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({ id }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error eliminando ruta');
                return;
            }

            await cargarIpRoutes();

        } catch (error) {
            console.error(error);
            alert('Error eliminando ruta');
        }
    }

    async function cambiarEstadoIpRoute(
        id: string,
        disabledActual: string
    ) {
        const estaDeshabilitada = disabledActual === 'true';

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/ip-routes/disabled`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        id,
                        disabled: !estaDeshabilitada,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error cambiando estado');
                return;
            }

            await cargarIpRoutes();

        } catch (error) {
            console.error(error);
            alert('Error cambiando estado');
        }
    }

    async function cargarInterfaces() {
        if (!routerId) return alert('Seleccione un router');

        setCargandoInterfaces(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/interfaces`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setInterfacesMk(data.datos || []);
            } else {
                alert(data.message || 'Error cargando interfaces');
            }
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setCargandoInterfaces(false);
        }
    }

    async function consultarTraficoInterface() {
        if (!routerId || !interfaceSeleccionada) return;

        try {
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${routerId}/interfaces/traffic`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        interfaceName: interfaceSeleccionada,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) return;

            const hora = new Date().toLocaleTimeString();

            setTraficoInterfaces((prev) => {
                const nuevo = [
                    ...prev,
                    {
                        hora,
                        rxMbps: Number(data.rxMbps || 0),
                        txMbps: Number(data.txMbps || 0),
                    },
                ];

                return nuevo.slice(-20);
            });

        } catch (error) {
            console.error('Error consultando tráfico:', error);
        }
    }

    async function cargarBackups() {
        if (!routerId) return alert('Seleccione un router');

        setCargandoBackups(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/backup/files`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setBackupsMk(data.datos || []);
            } else {
                alert(data.message || 'Error cargando backups');
            }
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setCargandoBackups(false);
        }
    }

    async function crearBackup() {
        if (!routerId) return alert('Seleccione un router');

        const nombreFinal =
            backupNombre.trim() ||
            `backup-router-${routerId}-${new Date().toISOString().slice(0, 10)}`;

        if (!confirm(`¿Crear respaldo ${backupTipo.toUpperCase()} llamado ${nombreFinal}?`)) {
            return;
        }

        setCreandoBackup(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/backup/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    nombre: nombreFinal,
                    tipo: backupTipo,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error creando backup');
                return;
            }

            setBackupNombre('');
            await cargarBackups();

            alert(data.message || 'Backup creado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error creando backup');
        } finally {
            setCreandoBackup(false);
        }
    }

    async function restaurarBackup(fileName: string) {
        if (!routerId) return alert('Seleccione un router');

        if (!fileName.toLowerCase().endsWith('.backup')) {
            alert('Solo se puede restaurar archivos .backup');
            return;
        }

        const confirmar = confirm(
            `ADVERTENCIA:\n\nVas a restaurar el backup:\n${fileName}\n\nEl MikroTik puede reiniciarse y perder conexión temporalmente.\n\n¿Deseas continuar?`
        );

        if (!confirmar) return;

        setRestaurandoBackup(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/backup/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    fileName,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error restaurando backup');
                return;
            }

            alert(data.message || 'Restauración enviada al MikroTik');
        } catch (error) {
            console.error(error);
            alert('Error restaurando backup');
        } finally {
            setRestaurandoBackup(false);
        }
    }

    async function cargarSystemUsers() {
        if (!routerId) return alert('Seleccione un router');

        setCargandoSystemUsers(true);

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/system-users`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setSystemUsers(data.datos || []);
            } else {
                alert(data.message || 'Error cargando usuarios');
            }
        } catch (error) {
            console.error(error);
            alert('Error conectando con backend');
        } finally {
            setCargandoSystemUsers(false);
        }
    }

    async function agregarSystemUser() {
        if (!routerId) return alert('Seleccione un router');
        if (!userNameMk.trim()) return alert('Ingrese usuario');
        if (!userPasswordMk.trim()) return alert('Ingrese contraseña');

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/system-users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    name: userNameMk.trim(),
                    password: userPasswordMk.trim(),
                    group: userGroupMk,
                    comment: userCommentMk.trim(),
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error creando usuario');
                return;
            }

            setUserNameMk('');
            setUserPasswordMk('');
            setUserGroupMk('read');
            setUserCommentMk('');

            await cargarSystemUsers();

            alert(data.message || 'Usuario creado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error creando usuario');
        }
    }

    async function eliminarSystemUser(id: string, name: string) {
        if (!confirm(`¿Eliminar el usuario ${name}?`)) return;

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/system-users/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error eliminando usuario');
                return;
            }

            await cargarSystemUsers();
        } catch (error) {
            console.error(error);
            alert('Error eliminando usuario');
        }
    }

    async function cambiarEstadoSystemUser(id: string, disabledActual: string) {
        const estaDesactivado = disabledActual === 'true';

        try {
            const res = await fetch(`${API_BASE}/mikrotik-conf/routers/${routerId}/system-users/disabled`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    id,
                    disabled: !estaDesactivado,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error cambiando estado');
                return;
            }

            await cargarSystemUsers();
        } catch (error) {
            console.error(error);
            alert('Error cambiando estado del usuario');
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

    useEffect(() => {
        if (!monitoreandoInterface) return;
        if (!routerId || !interfaceSeleccionada) return;

        consultarTraficoInterface();

        const intervalo = setInterval(() => {
            consultarTraficoInterface();
        }, 3000);

        return () => clearInterval(intervalo);
    }, [monitoreandoInterface, routerId, interfaceSeleccionada]);

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


                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
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

                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
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

                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">Web Proxy Corte</h2>
                            <p className="text-sm text-slate-400">
                                Configuración del proxy usado para redirección de clientes cortados.
                            </p>
                        </div>

                        <button
                            onClick={cargarProxy}
                            disabled={!routerId || cargandoProxy}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            {cargandoProxy ? 'Cargando...' : 'Cargar'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                        <div className="rounded-xl bg-slate-800 border border-slate-700 p-3">
                            <p className="text-xs text-slate-400">Estado</p>
                            <p className={proxyInfo?.enabled === 'true' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                {proxyInfo?.enabled === 'true' ? 'Activo' : 'Inactivo'}
                            </p>
                        </div>

                        <input
                            value={proxyPort}
                            onChange={(e) => setProxyPort(e.target.value)}
                            placeholder="Puerto proxy Ej: 8080"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <button
                            onClick={() => configurarProxy(true)}
                            disabled={!routerId}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            Activar / Guardar puerto
                        </button>

                        <button
                            onClick={() => configurarProxy(false)}
                            disabled={!routerId}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            Desactivar Proxy
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Reglas Proxy Access</h3>

                        <button
                            onClick={() => setModalProxyAccess(true)}
                            disabled={!routerId}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            Agregar Access
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="text-left py-2">Src Address</th>
                                    <th className="text-left py-2">Dst Host</th>
                                    <th className="text-left py-2">Path</th>
                                    <th className="text-left py-2">Action</th>
                                    <th className="text-left py-2">Redirect To</th>
                                    <th className="text-left py-2">Comentario</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {proxyAccess.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-4 text-center text-slate-500">
                                            No hay reglas proxy access cargadas
                                        </td>
                                    </tr>
                                )}

                                {proxyAccess.map((item) => {
                                    const id = item['.id'];

                                    return (
                                        <tr key={id} className="border-b border-slate-800">
                                            <td className="py-2">{item['src-address'] || '-'}</td>
                                            <td className="py-2">{item['dst-host'] || '-'}</td>
                                            <td className="py-2">{item.path || '-'}</td>
                                            <td className="py-2">{item.action || '-'}</td>
                                            <td className="py-2">{item['redirect-to'] || '-'}</td>
                                            <td className="py-2">{item.comment || '-'}</td>
                                            <td className="py-2 text-right">
                                                <button
                                                    onClick={() => eliminarProxyAccess(id)}
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

                    {modalProxyAccess && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Agregar Proxy Access</h3>

                                    <button
                                        onClick={() => setModalProxyAccess(false)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={proxySrcAddress}
                                        onChange={(e) => setProxySrcAddress(e.target.value)}
                                        placeholder="Src Address Ej: 192.168.80.0/24"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />

                                    <input
                                        value={proxyDstHost}
                                        onChange={(e) => setProxyDstHost(e.target.value)}
                                        placeholder="Dst Host Ej: *"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />

                                    <input
                                        value={proxyPath}
                                        onChange={(e) => setProxyPath(e.target.value)}
                                        placeholder="Path Ej: *"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />

                                    <select
                                        value={proxyAction}
                                        onChange={(e) => setProxyAction(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    >
                                        <option value="deny">deny</option>
                                        <option value="allow">allow</option>
                                    </select>

                                    <input
                                        value={proxyRedirectTo}
                                        onChange={(e) => setProxyRedirectTo(e.target.value)}
                                        placeholder="Redirect To Ej: http://192.168.1.2/corte"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />

                                    <input
                                        value={proxyComment}
                                        onChange={(e) => setProxyComment(e.target.value)}
                                        placeholder="Comentario"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-5">
                                    <button
                                        onClick={() => setModalProxyAccess(false)}
                                        className="bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2 text-sm font-semibold"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={agregarProxyAccess}
                                        className="bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 text-sm font-semibold"
                                    >
                                        Guardar Access
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">IP Pool</h2>
                            <p className="text-sm text-slate-400">
                                Administra los rangos de IP usados por DHCP, PPPoE u otros servicios.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={cargarIpPools}
                                disabled={!routerId || cargandoIpPool}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                            >
                                {cargandoIpPool ? 'Cargando...' : 'Cargar'}
                            </button>

                            <button
                                onClick={() => setModalIpPool(true)}
                                disabled={!routerId}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                            >
                                Agregar Pool
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="text-left py-2">Nombre</th>
                                    <th className="text-left py-2">Rangos</th>
                                    <th className="text-left py-2">Next Pool</th>
                                    <th className="text-left py-2">Comentario</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ipPools.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-slate-500">
                                            No hay IP Pool cargados
                                        </td>
                                    </tr>
                                )}

                                {ipPools.map((item) => {
                                    const id = item['.id'];

                                    return (
                                        <tr key={id} className="border-b border-slate-800">
                                            <td className="py-2 font-semibold">{item.name || '-'}</td>
                                            <td className="py-2">{item.ranges || '-'}</td>
                                            <td className="py-2">{item['next-pool'] || '-'}</td>
                                            <td className="py-2">{item.comment || '-'}</td>
                                            <td className="py-2 text-right">
                                                <button
                                                    onClick={() => eliminarIpPool(id)}
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

                    {modalIpPool && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Agregar IP Pool</h3>

                                    <button
                                        onClick={() => setModalIpPool(false)}
                                        className="text-slate-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={poolName}
                                        onChange={(e) => setPoolName(e.target.value)}
                                        placeholder="Nombre Ej: pool-clientes"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />

                                    <input
                                        value={poolRanges}
                                        onChange={(e) => setPoolRanges(e.target.value)}
                                        placeholder="Rango Ej: 192.168.80.10-192.168.80.250"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />

                                    <input
                                        value={poolComment}
                                        onChange={(e) => setPoolComment(e.target.value)}
                                        placeholder="Comentario"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-5">
                                    <button
                                        onClick={() => setModalIpPool(false)}
                                        className="bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2 text-sm font-semibold"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={guardarIpPool}
                                        className="bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 text-sm font-semibold"
                                    >
                                        Guardar Pool
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold">IP Routes</h2>
                            <p className="text-sm text-slate-400">
                                Administración de rutas estáticas.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={cargarIpRoutes}
                                className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 text-sm font-semibold"
                            >
                                Cargar
                            </button>

                            <button
                                onClick={() => setModalIpRoute(true)}
                                className="bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2 text-sm font-semibold"
                            >
                                Agregar Ruta
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="text-left py-2">Destino</th>
                                    <th className="text-left py-2">Gateway</th>
                                    <th className="text-left py-2">Distance</th>
                                    <th className="text-left py-2">Comentario</th>
                                    <th className="text-left py-2">Estado</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ipRoutes.map((item) => {
                                    const id = item['.id'];
                                    const deshabilitada = item.disabled === 'true';

                                    return (
                                        <tr
                                            key={id}
                                            className="border-b border-slate-800"
                                        >
                                            <td className="py-2">
                                                {item['dst-address']}
                                            </td>

                                            <td className="py-2">
                                                {item.gateway}
                                            </td>

                                            <td className="py-2">
                                                {item.distance}
                                            </td>

                                            <td className="py-2">
                                                {item.comment || '-'}
                                            </td>

                                            <td className="py-2">
                                                <span
                                                    className={
                                                        deshabilitada
                                                            ? 'text-red-400'
                                                            : 'text-green-400'
                                                    }
                                                >
                                                    {deshabilitada
                                                        ? 'Desactivada'
                                                        : 'Activa'}
                                                </span>
                                            </td>

                                            <td className="py-2 text-right space-x-2">
                                                <button
                                                    onClick={() =>
                                                        cambiarEstadoIpRoute(
                                                            id,
                                                            item.disabled
                                                        )
                                                    }
                                                    className={
                                                        deshabilitada
                                                            ? 'bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1 text-xs'
                                                            : 'bg-yellow-600 hover:bg-yellow-700 rounded-lg px-3 py-1 text-xs'
                                                    }
                                                >
                                                    {deshabilitada
                                                        ? 'Activar'
                                                        : 'Desactivar'}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarIpRoute(id)
                                                    }
                                                    className="bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1 text-xs"
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
                    {modalIpRoute && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">
                                        Agregar Ruta
                                    </h3>

                                    <button
                                        onClick={() => setModalIpRoute(false)}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        value={routeDstAddress}
                                        onChange={(e) =>
                                            setRouteDstAddress(e.target.value)
                                        }
                                        placeholder="Destino Ej: 0.0.0.0/0"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                                    />

                                    <input
                                        value={routeGateway}
                                        onChange={(e) =>
                                            setRouteGateway(e.target.value)
                                        }
                                        placeholder="Gateway Ej: 192.168.1.1"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                                    />

                                    <input
                                        value={routeDistance}
                                        onChange={(e) =>
                                            setRouteDistance(e.target.value)
                                        }
                                        placeholder="Distance"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                                    />

                                    <input
                                        value={routeComment}
                                        onChange={(e) =>
                                            setRouteComment(e.target.value)
                                        }
                                        placeholder="Comentario"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-5">
                                    <button
                                        onClick={() => setModalIpRoute(false)}
                                        className="bg-slate-700 hover:bg-slate-600 rounded-xl px-4 py-2"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={guardarIpRoute}
                                        className="bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2"
                                    >
                                        Guardar Ruta
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-lg font-bold">Backup MikroTik</h2>
                            <p className="text-sm text-slate-400">
                                Lista archivos de respaldo, crea backup/export y permite restaurar archivos .backup.
                            </p>
                        </div>

                        <button
                            onClick={cargarBackups}
                            disabled={!routerId || cargandoBackups}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            {cargandoBackups ? 'Cargando...' : 'Cargar backups'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                        <input
                            value={backupNombre}
                            onChange={(e) => setBackupNombre(e.target.value)}
                            placeholder="Nombre respaldo Ej: respaldo-core"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <select
                            value={backupTipo}
                            onChange={(e) => setBackupTipo(e.target.value as 'backup' | 'rsc')}
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        >
                            <option value="backup">Backup .backup</option>
                            <option value="rsc">Export .rsc</option>
                        </select>

                        <button
                            onClick={crearBackup}
                            disabled={!routerId || creandoBackup}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            {creandoBackup ? 'Creando...' : 'Crear respaldo'}
                        </button>

                        <div className="rounded-xl bg-slate-950 border border-slate-700 px-4 py-2 text-sm">
                            <p className="text-slate-400 text-xs">Total archivos</p>
                            <p className="font-bold">{backupsMk.length}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="text-left py-2">Archivo</th>
                                    <th className="text-left py-2">Tipo</th>
                                    <th className="text-left py-2">Tamaño</th>
                                    <th className="text-left py-2">Fecha</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {backupsMk.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-slate-500">
                                            No hay backups cargados
                                        </td>
                                    </tr>
                                )}

                                {backupsMk.map((item) => {
                                    const name = item.name || '-';
                                    const esBackup = String(name).toLowerCase().endsWith('.backup');
                                    const esRsc = String(name).toLowerCase().endsWith('.rsc');

                                    return (
                                        <tr key={item['.id'] || name} className="border-b border-slate-800">
                                            <td className="py-2 font-semibold">{name}</td>

                                            <td className="py-2">
                                                <span
                                                    className={
                                                        esBackup
                                                            ? 'text-green-400 font-semibold'
                                                            : esRsc
                                                                ? 'text-cyan-400 font-semibold'
                                                                : 'text-slate-400'
                                                    }
                                                >
                                                    {esBackup ? '.backup' : esRsc ? '.rsc' : 'otro'}
                                                </span>
                                            </td>

                                            <td className="py-2">
                                                {item.size || item['size'] || '-'}
                                            </td>

                                            <td className="py-2">
                                                {item['creation-time'] || '-'}
                                            </td>

                                            <td className="py-2 text-right">
                                                {esBackup ? (
                                                    <button
                                                        onClick={() => restaurarBackup(name)}
                                                        disabled={restaurandoBackup}
                                                        className="bg-red-600 hover:bg-red-700 disabled:bg-slate-700 rounded-lg px-3 py-1 text-xs font-semibold"
                                                    >
                                                        {restaurandoBackup ? 'Restaurando...' : 'Restaurar'}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-slate-500">
                                                        Solo lectura
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 rounded-xl border border-yellow-700 bg-yellow-950/40 p-3 text-sm text-yellow-200">
                        Importante: restaurar un archivo .backup puede reiniciar el MikroTik y cortar la conexión temporalmente.
                        Los archivos .rsc son exportaciones de configuración y por ahora solo se crean/listan.
                    </div>
                </div>
                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-lg font-bold">Usuarios del Sistema MikroTik</h2>
                            <p className="text-sm text-slate-400">
                                Administra usuarios internos del MikroTik: listar, crear, activar, desactivar y eliminar.
                            </p>
                        </div>

                        <button
                            onClick={cargarSystemUsers}
                            disabled={!routerId || cargandoSystemUsers}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            {cargandoSystemUsers ? 'Cargando...' : 'Cargar usuarios'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
                        <input
                            value={userNameMk}
                            onChange={(e) => setUserNameMk(e.target.value)}
                            placeholder="Usuario"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <input
                            value={userPasswordMk}
                            onChange={(e) => setUserPasswordMk(e.target.value)}
                            type="password"
                            placeholder="Contraseña"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <select
                            value={userGroupMk}
                            onChange={(e) => setUserGroupMk(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        >
                            <option value="read">read</option>
                            <option value="write">write</option>
                            <option value="full">full</option>
                        </select>

                        <input
                            value={userCommentMk}
                            onChange={(e) => setUserCommentMk(e.target.value)}
                            placeholder="Comentario"
                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                        />

                        <button
                            onClick={agregarSystemUser}
                            disabled={!routerId}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                        >
                            Agregar usuario
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400">
                                    <th className="text-left py-2">Usuario</th>
                                    <th className="text-left py-2">Grupo</th>
                                    <th className="text-left py-2">Comentario</th>
                                    <th className="text-left py-2">Último login</th>
                                    <th className="text-left py-2">Estado</th>
                                    <th className="text-right py-2">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {systemUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center text-slate-500">
                                            No hay usuarios cargados
                                        </td>
                                    </tr>
                                )}

                                {systemUsers.map((item) => {
                                    const id = item['.id'];
                                    const desactivado = item.disabled === 'true';

                                    return (
                                        <tr key={id} className="border-b border-slate-800">
                                            <td className="py-2 font-semibold">{item.name || '-'}</td>
                                            <td className="py-2">{item.group || '-'}</td>
                                            <td className="py-2">{item.comment || '-'}</td>
                                            <td className="py-2">{item['last-logged-in'] || '-'}</td>

                                            <td className="py-2">
                                                <span
                                                    className={
                                                        desactivado
                                                            ? 'text-red-400 font-semibold'
                                                            : 'text-green-400 font-semibold'
                                                    }
                                                >
                                                    {desactivado ? 'Desactivado' : 'Activo'}
                                                </span>
                                            </td>

                                            <td className="py-2 text-right space-x-2">
                                                <button
                                                    onClick={() => cambiarEstadoSystemUser(id, item.disabled)}
                                                    className={
                                                        desactivado
                                                            ? 'bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1 text-xs font-semibold'
                                                            : 'bg-yellow-600 hover:bg-yellow-700 rounded-lg px-3 py-1 text-xs font-semibold'
                                                    }
                                                >
                                                    {desactivado ? 'Activar' : 'Desactivar'}
                                                </button>

                                                <button
                                                    onClick={() => eliminarSystemUser(id, item.name)}
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
                <div className="md:col-span-3 w-full rounded-2xl border border-slate-700 bg-slate-900 p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-lg font-bold">Tráfico de Interfaces</h2>
                            <p className="text-sm text-slate-400">
                                Monitoreo en vivo de consumo RX/TX por interface principal del MikroTik.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2">
                            <button
                                onClick={cargarInterfaces}
                                disabled={!routerId || cargandoInterfaces}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold"
                            >
                                {cargandoInterfaces ? 'Cargando...' : 'Cargar interfaces'}
                            </button>

                            <select
                                value={interfaceSeleccionada}
                                onChange={(e) => {
                                    setInterfaceSeleccionada(e.target.value);
                                    setTraficoInterfaces([]);
                                    setMonitoreandoInterface(false);
                                }}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
                            >
                                <option value="">Seleccione interface</option>
                                {interfacesMk.map((item) => (
                                    <option key={item['.id']} value={item.name}>
                                        {item.name} - {item.type || 'interface'}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => {
                                    if (!interfaceSeleccionada) {
                                        alert('Seleccione una interface');
                                        return;
                                    }

                                    setMonitoreandoInterface(!monitoreandoInterface);
                                }}
                                disabled={!routerId || !interfaceSeleccionada}
                                className={
                                    monitoreandoInterface
                                        ? 'bg-red-600 hover:bg-red-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold'
                                        : 'bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded-xl px-4 py-2 text-sm font-semibold'
                                }
                            >
                                {monitoreandoInterface ? 'Detener monitoreo' : 'Iniciar monitoreo'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                        <div className="rounded-xl bg-slate-950 border border-slate-700 p-4">
                            <p className="text-xs text-slate-400">Interface</p>
                            <p className="font-bold">{interfaceSeleccionada || 'Ninguna'}</p>
                        </div>

                        <div className="rounded-xl bg-slate-950 border border-slate-700 p-4">
                            <p className="text-xs text-slate-400">Bajada RX</p>
                            <p className="text-green-400 font-bold text-xl">
                                {traficoInterfaces.at(-1)?.rxMbps ?? 0} Mbps
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-950 border border-slate-700 p-4">
                            <p className="text-xs text-slate-400">Subida TX</p>
                            <p className="text-cyan-400 font-bold text-xl">
                                {traficoInterfaces.at(-1)?.txMbps ?? 0} Mbps
                            </p>
                        </div>
                    </div>

                    <div className="w-full h-80 rounded-xl bg-slate-950 border border-slate-700 p-4 overflow-hidden">
                        {traficoInterfaces.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                Sin datos. Inicie el monitoreo para ver el gráfico.
                            </div>
                        ) : (
                            <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                {(() => {
                                    const maxValor = Math.max(
                                        ...traficoInterfaces.map((x) => Math.max(x.rxMbps, x.txMbps)),
                                        1
                                    );

                                    const puntosRx = traficoInterfaces.map((item, index) => {
                                        const x = (index / Math.max(traficoInterfaces.length - 1, 1)) * 1000;
                                        const y = 280 - (item.rxMbps / maxValor) * 250;
                                        return `${x},${y}`;
                                    }).join(' ');

                                    const puntosTx = traficoInterfaces.map((item, index) => {
                                        const x = (index / Math.max(traficoInterfaces.length - 1, 1)) * 1000;
                                        const y = 280 - (item.txMbps / maxValor) * 250;
                                        return `${x},${y}`;
                                    }).join(' ');

                                    return (
                                        <>
                                            <line x1="0" y1="280" x2="1000" y2="280" stroke="#334155" strokeWidth="2" />
                                            <line x1="0" y1="30" x2="1000" y2="30" stroke="#1e293b" strokeWidth="1" />
                                            <line x1="0" y1="155" x2="1000" y2="155" stroke="#1e293b" strokeWidth="1" />

                                            <polyline
                                                points={puntosRx}
                                                fill="none"
                                                stroke="#22c55e"
                                                strokeWidth="4"
                                            />

                                            <polyline
                                                points={puntosTx}
                                                fill="none"
                                                stroke="#06b6d4"
                                                strokeWidth="4"
                                            />

                                            <text x="10" y="25" fill="#94a3b8" fontSize="18">
                                                Máx: {maxValor.toFixed(2)} Mbps
                                            </text>

                                            <text x="10" y="298" fill="#22c55e" fontSize="16">
                                                RX Bajada
                                            </text>

                                            <text x="140" y="298" fill="#06b6d4" fontSize="16">
                                                TX Subida
                                            </text>
                                        </>
                                    );
                                })()}
                            </svg>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}