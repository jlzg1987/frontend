'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '@/src/lib/api';

type RouterMikrotik = {
    id: number;
    nombre: string;
    parroquia?: string;
    sector?: string;
    host: string;
    puerto: number;
    usuario: string;
    activo: number;
    created_at: string;

    usa_wireguard?: number;
    ip_wireguard?: string;
    redes_internas?: string;
    UsaWireGuard?: number;
    IpWireGuard?: string;
};

const formInicial = {
    nombre: '',
    parroquia: '',
    sector: '',
    host: '',
    puerto: '8728',
    usuario: '',
    password: '',
    usa_wireguard: false,
    ip_wireguard: '',
    redes_internas: '',
};

export default function MikrotikPageInterno() {
    const [routers, setRouters] = useState<RouterMikrotik[]>([]);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [form, setForm] = useState(formInicial);
    const [estadoRouters, setEstadoRouters] = useState<any>({});

    useEffect(() => {
        cargarRouters();
    }, []);

    const token = () => localStorage.getItem('isp_token');

    function esWireGuard(valor: any) {
        if (valor === 1 || valor === true) return true;
        if (valor?.data?.[0] === 1) return true;
        return false;
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
    }

    async function cargarRouters() {
        const res = await fetch(`${API_BASE}/api/mikrotik/routers`, {
            headers: { Authorization: `Bearer ${token()}` },
        });

        const data = await res.json();
        if (data.ok) {
            const lista = data.routers || [];
            setRouters(lista);

            lista.forEach((r: any) => {
                probarEstadoRouter(r);
            });
        }
        console.log('ROUTERS BACKEND:', data.routers);
    }

    async function guardarRouter(e: React.FormEvent) {
        e.preventDefault();
        setMensaje('');
        setError('');
        setLoading(true);

        try {
            const url = editandoId
                ? `${API_BASE}/api/mikrotik/routers/${editandoId}`
                : `${API_BASE}/api/mikrotik/routers`;

            const method = editandoId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token()}`,
                },
                body: JSON.stringify({
                    ...form,
                    puerto: Number(form.puerto || 8728),
                    usa_wireguard: form.usa_wireguard ? 1 : 0,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                setError(data.message || 'No se pudo guardar el router');
                return;
            }

            setMensaje(editandoId ? 'Router actualizado correctamente' : 'Router registrado correctamente');
            setForm(formInicial);
            setEditandoId(null);
            cargarRouters();

        } catch (err) {
            console.error(err);
            setError('Error conectando con el servidor');
        } finally {
            setLoading(false);
        }
    }

    function editarRouter(r: RouterMikrotik) {
        setEditandoId(r.id);

        const usaWG = esWireGuard(r.UsaWireGuard || r.usa_wireguard);

        setForm({
            nombre: r.nombre || '',
            parroquia: r.parroquia || '',
            sector: r.sector || '',
            host: r.host || '',
            puerto: String(r.puerto || 8728),
            usuario: r.usuario || '',
            password: '',

            usa_wireguard: usaWG,

            ip_wireguard:
                r.IpWireGuard ||
                r.ip_wireguard ||
                '',

            redes_internas:
                (r as any).RedesInternas ||
                r.redes_internas ||
                '',
        });
    }

    async function eliminarRouter(id: number) {
        if (!confirm('¿Seguro que deseas eliminar este router?')) return;

        const res = await fetch(`${API_BASE}/api/mikrotik/routers/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token()}` },
        });

        const data = await res.json();

        if (!data.ok) {
            alert(data.message || 'No se pudo eliminar');
            return;
        }

        cargarRouters();
    }

    async function probarConexion(id: number) {
        const res = await fetch(`${API_BASE}/api/mikrotik/routers/${id}/test`, {
            headers: { Authorization: `Bearer ${token()}` },
        });

        const data = await res.json();

        if (!data.ok) return alert(data.message || 'No se pudo conectar');

        alert(`✅ MikroTik conectado

Nombre: ${data.router.nombre}
Versión: ${data.router.version}
Board: ${data.router.board}
CPU: ${data.router.cpu}
Uptime: ${data.router.uptime}`);
    }

    async function probarWireGuard(id: number) {
        const res = await fetch(`${API_BASE}/api/mikrotik/routers/${id}/agent/estado`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token()}`,
            },
        });

        const data = await res.json();

        if (!data.ok) return alert(data.message || 'No conectó por Agent VPS');

        const nombreRouter =
            data.router?.router?.identity?.[0]?.name ||
            data.router?.identity?.[0]?.name ||
            data.nodo ||
            'Router sin nombre';

        alert(`✅ Agent VPS conectado

Nodo: ${data.nodo}
Router: ${nombreRouter}
Estado: ${data.conectado ? 'Activo' : 'Inactivo'}`);
    }

    async function verEstadoRouter(id: number) {
        const res = await fetch(`${API_BASE}/api/mikrotik/routers/${id}/estado`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token()}`,
            },
        });

        const data = await res.json();

        if (!data.ok) {
            return alert(data.message || 'Router inactivo');
        }

        alert(`✅ Router conectado

Tipo: ${data.tipoConexion}
Nodo: ${data.nodo || 'No aplica'}
Router: ${data.routerNombre || 'Sin nombre'}
Estado: ${data.conectado ? 'Activo' : 'Inactivo'}`);
    }

    async function verRedesInternas(id: number) {
        const res = await fetch(`${API_BASE}/api/mikrotik/routers/${id}/redes-internas`, {
            headers: { Authorization: `Bearer ${token()}` },
        });

        const data = await res.json();

        if (!data.ok) return alert(data.message || 'No se pudo obtener redes');

        alert(`🌐 Redes internas

Router: ${data.router}
IP VPN: ${data.ipWireGuard}

${data.redesInternas?.join('\n') || 'Sin redes registradas'}`);
    }

    async function verIpPublica(id: number) {
        const res = await fetch(`${API_BASE}/api/mikrotik/routers/${id}/ip-publica`, {
            headers: { Authorization: `Bearer ${token()}` },
        });

        const data = await res.json();

        if (!data.ok) return alert(data.message);

        const ips = data.ips.map((x: any) => x.address).join('\n');
        alert(`IPs públicas:\n\n${ips}`);
    }

    async function probarEstadoAgent(id: number) {
        try {
            setEstadoRouters((prev: any) => ({
                ...prev,
                [id]: { loading: true, conectado: false }
            }));

            const res = await fetch(`${API_BASE}/api/mikrotik/routers/${id}/agent/estado`, {
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            });

            const data = await res.json();

            setEstadoRouters((prev: any) => ({
                ...prev,
                [id]: {
                    loading: false,
                    conectado: data.conectado === true,
                    message: data.message || '',
                    nodo: data.nodo || '',
                    tipoConexion: data.tipoConexion || '',
                }
            }));

        } catch {
            setEstadoRouters((prev: any) => ({
                ...prev,
                [id]: {
                    loading: false,
                    conectado: false,
                    message: 'Sin conexión',
                }
            }));
        }
    }
    async function probarEstadoRouter(r: RouterMikrotik) {
        const id = r.id;

        try {
            setEstadoRouters((prev: any) => ({
                ...prev,
                [id]: { loading: true, conectado: false }
            }));

            const usaWG = esWireGuard(r.UsaWireGuard || r.usa_wireguard);

            const url = usaWG
                ? `${API_BASE}/api/mikrotik/routers/${id}/agent/estado`
                : `${API_BASE}/api/mikrotik/routers/${id}/test`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token()}`
                }
            });

            const data = await res.json();
            console.log('ESTADO ROUTER:', r.nombre, data);
            const conectado =
                data.ok === true ||
                data.conectado === true ||
                data.data?.ok === true ||
                data.router?.ok === true;

            setEstadoRouters((prev: any) => ({
                ...prev,
                [id]: {
                    loading: false,
                    conectado,
                    message: data.message || '',
                    nodo: data.nodo || '',
                    tipoConexion: usaWG ? 'WIREGUARD_AGENT' : 'API_PUBLICA',
                    routerNombre:
                        data.routerNombre ||
                        data.router?.nombre ||
                        data.router?.identity?.[0]?.name ||
                        'Sin nombre',
                }
            }));

        } catch {
            setEstadoRouters((prev: any) => ({
                ...prev,
                [id]: {
                    loading: false,
                    conectado: false,
                    tipoConexion:
                        Number(r.UsaWireGuard) === 1 ||
                            Number(r.usa_wireguard) === 1
                            ? 'WIREGUARD_AGENT'
                            : 'API_PUBLICA',
                    message: 'Sin conexión',
                }
            }));
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8">
            <div className="mx-auto max-w-7xl">


                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <section className="lg:col-span-1 rounded-3xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-black text-slate-900 mb-4">
                            {editandoId ? 'Editar router' : 'Registrar router'}
                        </h2>

                        {mensaje && <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm font-bold">{mensaje}</div>}
                        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-bold">{error}</div>}

                        <form onSubmit={guardarRouter} className="space-y-4">
                            <Input label="Nombre del router" name="nombre" value={form.nombre} onChange={handleChange} />
                            <Input label="Parroquia" name="parroquia" value={form.parroquia} onChange={handleChange} />
                            <Input label="Sector / nodo" name="sector" value={form.sector} onChange={handleChange} />
                            <Input label="Host / IP / Dominio" name="host" value={form.host} onChange={handleChange} />
                            <Input label="Puerto API" name="puerto" value={form.puerto} onChange={handleChange} />
                            <Input label="Usuario API" name="usuario" value={form.usuario} onChange={handleChange} />
                            <Input label="Password API" name="password" type="password" value={form.password} onChange={handleChange} />

                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <input
                                    type="checkbox"
                                    name="usa_wireguard"
                                    checked={form.usa_wireguard}
                                    onChange={handleChange}
                                />
                                Usa WireGuard
                            </label>

                            <Input label="IP WireGuard" name="ip_wireguard" value={form.ip_wireguard} onChange={handleChange} />
                            <Input label="Redes internas separadas por coma" name="redes_internas" value={form.redes_internas} onChange={handleChange} />

                            <button disabled={loading} className="w-full rounded-xl bg-blue-700 py-3 font-black text-white hover:bg-blue-800 disabled:opacity-60">
                                {loading ? 'Guardando...' : editandoId ? 'Actualizar MikroTik' : 'Guardar MikroTik'}
                            </button>

                            {editandoId && (
                                <button
                                    type="button"
                                    onClick={() => { setEditandoId(null); setForm(formInicial); }}
                                    className="w-full rounded-xl bg-slate-200 py-3 font-black text-slate-700 hover:bg-slate-300"
                                >
                                    Cancelar edición
                                </button>
                            )}
                        </form>
                    </section>

                    <section className="lg:col-span-3 rounded-3xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-black text-slate-900 mb-4">Routers registrados</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-slate-500">
                                        <th className="py-3">Nombre</th>
                                        <th className="py-3">Zona</th>
                                        <th className="py-3">Host</th>
                                        <th className="py-3 px-4 text-left">WG</th>
                                        <th className="py-3 px-6 text-left">Estado</th>
                                        <th className="py-3 px-6 text-left">Acciones WG</th>

                                        <th className="py-3 px-6 text-left">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routers.map((r) => (
                                        <tr key={r.id} className="border-b">
                                            <td className="py-3 font-black text-slate-700">{r.nombre}</td>
                                            <td className="py-3 text-slate-500 px-4 text-left">{r.parroquia} / {r.sector}</td>
                                            <td className="py-3 text-slate-600">{r.host}:{r.puerto}</td>
                                            <td className="py-3 px-4 text-left" >
                                                {esWireGuard(r.UsaWireGuard || r.usa_wireguard) ? 'Sí' : 'No'}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: 20,
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,

                                                        background: estadoRouters[r.id]?.loading
                                                            ? '#FEF3C7'
                                                            : estadoRouters[r.id]?.conectado
                                                                ? '#DCFCE7'
                                                                : '#FEE2E2',

                                                        color: estadoRouters[r.id]?.loading
                                                            ? '#92400E'
                                                            : estadoRouters[r.id]?.conectado
                                                                ? '#166534'
                                                                : '#991B1B',
                                                    }}
                                                >
                                                    {estadoRouters[r.id]?.loading
                                                        ? '⏳ Probando...'
                                                        : estadoRouters[r.id]?.conectado
                                                            ? '🟢 Activo'
                                                            : '🔴 Inactivo'}

                                                    {!estadoRouters[r.id]?.loading && (
                                                        <span
                                                            style={{
                                                                marginLeft: 6,
                                                                padding: '2px 6px',
                                                                borderRadius: 10,
                                                                background:
                                                                    estadoRouters[r.id]?.tipoConexion === 'WIREGUARD_AGENT'
                                                                        ? '#2563EB'
                                                                        : '#7C3AED',
                                                                color: '#fff',
                                                                fontSize: 10,
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {estadoRouters[r.id]?.tipoConexion === 'WIREGUARD_AGENT'
                                                                ? 'AGENT'
                                                                : 'API'}
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex flex-wrap gap-2">

                                                    <Btn text="IP" onClick={() => verIpPublica(r.id)} />
                                                    <Btn text="Test" onClick={() => probarWireGuard(r.id)} />
                                                    <Btn text="Estado" onClick={() => verEstadoRouter(r.id)} />
                                                    <Btn text="Redes" onClick={() => verRedesInternas(r.id)} />
                                                </div>
                                            </td>

                                            <td className="py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Btn text="Test" onClick={() => probarConexion(r.id)} />
                                                    <Btn text="Editar" onClick={() => editarRouter(r)} />
                                                    <Btn danger text="Eliminar" onClick={() => eliminarRouter(r.id)} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div >
        </main >
    );
}

function Input({ label, ...props }: any) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
            <input
                {...props}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
            />
        </label>
    );
}

function Btn({ text, onClick, danger = false }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg px-3 py-2 text-xs font-black text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-900'
                }`}
        >
            {text}
        </button>
    );
}