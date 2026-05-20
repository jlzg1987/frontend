'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useMemo, useState } from 'react';


type Producto = {
    productoId: number;
    tipo_item: 'PRODUCTO' | 'SERVICIO';
    codigo: string;
    nombre: string;
    stock: number;
    precio_venta: number;
    estado: 'ACTIVO' | 'INACTIVO';
};

type DetalleKit = {
    productoId: number;
    codigo?: string;
    nombre?: string;
    tipo_item?: 'PRODUCTO' | 'SERVICIO';
    stock?: number;
    cantidad: number;
    tipo_consumo: 'DESCUENTA_STOCK' | 'REFERENCIAL';
};

type Kit = {
    kitId: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    precio_venta: number;
    estado: 'ACTIVO' | 'INACTIVO';
};

const kitInicial = {
    codigo: '',
    nombre: '',
    descripcion: '',
    precio_venta: 0,
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
};

export default function KitsInstalacionPage() {
    const [kits, setKits] = useState<Kit[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [detalle, setDetalle] = useState<DetalleKit[]>([]);
    const [form, setForm] = useState<any>(kitInicial);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [modal, setModal] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [productoId, setProductoId] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [loading, setLoading] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    const cargarDatos = async () => {
        const [rk, rp] = await Promise.all([
            fetch(`${API_BASE}/inventario/kits`, { headers }),
            fetch(`${API_BASE}/inventario/productos`, { headers }),
        ]);

        const dk = await rk.json();
        const dp = await rp.json();

        if (dk.ok) setKits(dk.data || []);
        if (dp.ok) setProductos((dp.data || []).filter((p: Producto) => p.estado === 'ACTIVO'));
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const kitsFiltrados = useMemo(() => {
        const t = busqueda.toLowerCase();
        return kits.filter(k =>
            !t ||
            k.codigo?.toLowerCase().includes(t) ||
            k.nombre?.toLowerCase().includes(t)
        );
    }, [kits, busqueda]);

    const abrirNuevo = () => {
        setForm(kitInicial);
        setDetalle([]);
        setEditandoId(null);
        setModal(true);
    };

    const abrirEditar = async (kitId: number) => {
        const resp = await fetch(`${API_BASE}/inventario/kits/${kitId}`, { headers });
        const data = await resp.json();

        if (!data.ok) {
            alert(data.message || 'No se pudo cargar el kit');
            return;
        }

        setForm({
            codigo: data.kit.codigo,
            nombre: data.kit.nombre,
            descripcion: data.kit.descripcion || '',
            precio_venta: Number(data.kit.precio_venta || 0),
            estado: data.kit.estado || 'ACTIVO',
        });

        setDetalle((data.detalle || []).map((d: any) => ({
            productoId: d.productoId,
            codigo: d.codigo,
            nombre: d.nombre,
            tipo_item: d.tipo_item,
            stock: Number(d.stock || 0),
            cantidad: Number(d.cantidad || 1),
            tipo_consumo: d.tipo_consumo || 'DESCUENTA_STOCK',
        })));

        setEditandoId(kitId);
        setModal(true);
    };

    const agregarProducto = () => {
        const prod = productos.find(p => String(p.productoId) === String(productoId));

        if (!prod) {
            alert('Selecciona un producto o servicio');
            return;
        }

        const yaExiste = detalle.some(d => d.productoId === prod.productoId);

        if (yaExiste) {
            alert('Este producto/servicio ya está agregado al kit');
            return;
        }

        setDetalle([
            ...detalle,
            {
                productoId: prod.productoId,
                codigo: prod.codigo,
                nombre: prod.nombre,
                tipo_item: prod.tipo_item,
                stock: Number(prod.stock || 0),
                cantidad: Number(cantidad || 1),
                tipo_consumo: prod.tipo_item === 'SERVICIO' ? 'REFERENCIAL' : 'DESCUENTA_STOCK',
            }
        ]);

        setProductoId('');
        setCantidad(1);
    };

    const guardarKit = async () => {
        if (!form.codigo.trim() || !form.nombre.trim()) {
            alert('Código y nombre son obligatorios');
            return;
        }

        if (detalle.length === 0) {
            alert('Agrega productos o servicios al kit');
            return;
        }

        try {
            setLoading(true);

            const url = editandoId
                ? `${API_BASE}/inventario/kits/${editandoId}`
                : `${API_BASE}/inventario/kits`;

            const method = editandoId ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({
                    ...form,
                    productos: detalle.map(d => ({
                        productoId: d.productoId,
                        cantidad: d.cantidad,
                        tipo_consumo: d.tipo_consumo,
                    }))
                }),
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo guardar kit');
                return;
            }

            setModal(false);
            cargarDatos();

        } finally {
            setLoading(false);
        }
    };

    const eliminarKit = async (kitId: number) => {
        if (!confirm('¿Seguro que deseas eliminar este kit?')) return;

        const resp = await fetch(`${API_BASE}/inventario/kits/${kitId}`, {
            method: 'DELETE',
            headers,
        });

        const data = await resp.json();

        if (!data.ok) {
            alert(data.message || 'No se pudo eliminar');
            return;
        }

        cargarDatos();
    };

    const usarKit = async (kitId: number) => {
        if (!confirm('Esto descontará del inventario todos los productos del kit. ¿Continuar?')) return;

        const resp = await fetch(`${API_BASE}/inventario/kits/${kitId}/usar`, {
            method: 'POST',
            headers,
        });

        const data = await resp.json();

        if (!data.ok) {
            alert(data.message || 'No se pudo usar el kit');
            return;
        }

        alert('Kit utilizado correctamente. Stock descontado.');
        cargarDatos();
    };

    const totalEstimado = detalle.reduce((acc, d) => {
        const prod = productos.find(p => p.productoId === d.productoId);
        return acc + (Number(prod?.precio_venta || 0) * Number(d.cantidad || 0));
    }, 0);

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">


                <button onClick={abrirNuevo} className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-6 py-3 rounded-xl font-black">
                    + Nuevo kit
                </button>
            </section>

            <section className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-5 mb-6">
                <label className="text-xs text-slate-400">Buscar kit</label>
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="input"
                    placeholder="Buscar por código o nombre"
                />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {kitsFiltrados.map(k => (
                    <div key={k.kitId} className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                        <div className="flex justify-between gap-3">
                            <div>
                                <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-3 py-1 rounded-full text-xs font-black">
                                    KIT
                                </span>
                                <h2 className="text-xl font-black mt-3">{k.nombre}</h2>
                                <p className="text-slate-400 text-sm">Código: {k.codigo}</p>
                            </div>

                            <span className={`h-fit px-3 py-1 rounded-full text-xs font-black ${k.estado === 'ACTIVO'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                                }`}>
                                {k.estado}
                            </span>
                        </div>

                        <p className="text-slate-400 text-sm mt-4 line-clamp-2">
                            {k.descripcion || 'Sin descripción'}
                        </p>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-4">
                            <p className="text-slate-500 text-sm">Precio venta kit</p>
                            <p className="text-2xl font-black text-yellow-300">
                                ${Number(k.precio_venta || 0).toFixed(2)}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-5">
                            <button onClick={() => abrirEditar(k.kitId)} className="bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl py-2 font-bold">
                                Editar
                            </button>

                            <button onClick={() => usarKit(k.kitId)} className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl py-2 font-bold">
                                Usar
                            </button>

                            <button onClick={() => eliminarKit(k.kitId)} className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl py-2 font-bold">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </section>

            {modal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl w-full max-w-6xl p-6 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-black text-yellow-300">
                                {editandoId ? 'Editar kit' : 'Nuevo kit'}
                            </h2>
                            <button onClick={() => setModal(false)} className="text-2xl text-slate-400 hover:text-white">×</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Campo label="Código" value={form.codigo} onChange={(v) => setForm({ ...form, codigo: v })} />
                            <Campo label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
                            <Campo label="Precio venta" type="number" value={String(form.precio_venta)} onChange={(v) => setForm({ ...form, precio_venta: Number(v) })} />

                            <div>
                                <label className="text-xs text-slate-400">Estado</label>
                                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="input">
                                    <option value="ACTIVO">Activo</option>
                                    <option value="INACTIVO">Inactivo</option>
                                </select>
                            </div>

                            <div className="md:col-span-4">
                                <label className="text-xs text-slate-400">Descripción</label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    className="input min-h-[80px]"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6">
                            <h3 className="font-black text-cyan-300 mb-4">Agregar producto o servicio al kit</h3>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="md:col-span-3">
                                    <label className="text-xs text-slate-400">Producto / servicio</label>
                                    <select value={productoId} onChange={(e) => setProductoId(e.target.value)} className="input">
                                        <option value="">Seleccione</option>
                                        {productos.map(p => (
                                            <option key={p.productoId} value={p.productoId}>
                                                {p.codigo} - {p.nombre} | {p.tipo_item} | Stock: {p.tipo_item === 'SERVICIO' ? 'N/A' : p.stock}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Campo label="Cantidad" type="number" value={String(cantidad)} onChange={(v) => setCantidad(Number(v))} />

                                <button onClick={agregarProducto} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black mt-5">
                                    Agregar
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-white">Detalle del kit</h3>
                                <span className="text-yellow-300 font-black">
                                    Estimado: ${totalEstimado.toFixed(2)}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-400 border-b border-slate-800">
                                            <th className="text-left py-3">Ítem</th>
                                            <th className="text-left py-3">Tipo</th>
                                            <th className="text-left py-3">Stock</th>
                                            <th className="text-left py-3">Cantidad</th>
                                            <th className="text-left py-3">Consumo</th>
                                            <th className="text-left py-3">Alerta</th>
                                            <th className="text-left py-3">Acción</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {detalle.map((d, index) => {
                                            const sinStock =
                                                d.tipo_item === 'PRODUCTO' &&
                                                d.tipo_consumo === 'DESCUENTA_STOCK' &&
                                                Number(d.stock || 0) < Number(d.cantidad || 0);

                                            return (
                                                <tr key={d.productoId} className="border-b border-slate-800/70">
                                                    <td className="py-3">
                                                        <p className="font-bold">{d.nombre}</p>
                                                        <p className="text-xs text-slate-500">{d.codigo}</p>
                                                    </td>

                                                    <td className="py-3">{d.tipo_item}</td>
                                                    <td className="py-3">{d.tipo_item === 'SERVICIO' ? 'N/A' : d.stock}</td>

                                                    <td className="py-3">
                                                        <input
                                                            type="number"
                                                            value={d.cantidad}
                                                            onChange={(e) => {
                                                                const nuevo = [...detalle];
                                                                nuevo[index].cantidad = Number(e.target.value);
                                                                setDetalle(nuevo);
                                                            }}
                                                            className="input max-w-[100px]"
                                                        />
                                                    </td>

                                                    <td className="py-3">
                                                        <select
                                                            value={d.tipo_consumo}
                                                            onChange={(e) => {
                                                                const nuevo = [...detalle];
                                                                nuevo[index].tipo_consumo = e.target.value as any;
                                                                setDetalle(nuevo);
                                                            }}
                                                            className="input"
                                                            disabled={d.tipo_item === 'SERVICIO'}
                                                        >
                                                            <option value="DESCUENTA_STOCK">Descuenta stock</option>
                                                            <option value="REFERENCIAL">Referencial</option>
                                                        </select>
                                                    </td>

                                                    <td className="py-3">
                                                        {sinStock ? (
                                                            <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-xs font-black">
                                                                Stock insuficiente
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-300 text-xs font-bold">
                                                                OK
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="py-3">
                                                        <button
                                                            onClick={() => setDetalle(detalle.filter((_, i) => i !== index))}
                                                            className="text-red-300 font-bold"
                                                        >
                                                            Quitar
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {detalle.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">
                                        No hay productos agregados al kit.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setModal(false)} className="bg-slate-800 text-slate-300 px-5 py-3 rounded-xl font-bold">
                                Cancelar
                            </button>

                            <button onClick={guardarKit} disabled={loading} className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-6 py-3 rounded-xl font-black disabled:opacity-50">
                                {loading ? 'Guardando...' : 'Guardar kit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .input {
                    width: 100%;
                    margin-top: 4px;
                    background: #020617;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 10px 12px;
                    color: white;
                    outline: none;
                }

                .input:focus {
                    border-color: #facc15;
                    box-shadow: 0 0 0 1px #facc15;
                }

                .input:disabled {
                    opacity: .6;
                    cursor: not-allowed;
                }
            `}</style>
        </main>
    );
}

function Campo({
    label,
    value,
    onChange,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div>
            <label className="text-xs text-slate-400">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input"
            />
        </div>
    );
}