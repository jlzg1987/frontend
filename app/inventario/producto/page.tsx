'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';



type ProductoForm = {
    productoId?: number;
    tipo_item: 'PRODUCTO' | 'SERVICIO';
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria: string;
    stock: number;
    stock_minimo: number;
    precio_compra: number;
    precio_venta: number;
    aplica_iva: 'SI' | 'NO';
    estado: 'ACTIVO' | 'INACTIVO';
    imagen_url?: string;
};

const formInicial: ProductoForm = {
    tipo_item: 'PRODUCTO',
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    stock: 0,
    stock_minimo: 0,
    precio_compra: 0,
    precio_venta: 0,
    aplica_iva: 'SI',
    estado: 'ACTIVO',
    imagen_url: '',
};

export default function ProductosServiciosPage() {
    const [productos, setProductos] = useState<ProductoForm[]>([]);
    const [form, setForm] = useState<ProductoForm>(formInicial);
    const [editando, setEditando] = useState(false);
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    const cargarProductos = async () => {
        try {
            const resp = await fetch(`${API_BASE}/inventario/productos`, {
                headers,
            });

            const data = await resp.json();

            if (data.ok) {
                setProductos(data.data || []);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const abrirNuevo = () => {
        setForm(formInicial);
        setEditando(false);
        setModal(true);
    };

    const abrirEditar = (item: any) => {
        setForm({
            productoId: item.productoId,
            tipo_item: item.tipo_item || 'PRODUCTO',
            codigo: item.codigo || '',
            nombre: item.nombre || '',
            descripcion: item.descripcion || '',
            categoria: item.categoria || '',
            stock: Number(item.stock || 0),
            stock_minimo: Number(item.stock_minimo || 0),
            precio_compra: Number(item.precio_compra || 0),
            precio_venta: Number(item.precio_venta || 0),
            aplica_iva: item.aplica_iva || 'SI',
            estado: item.estado || 'ACTIVO',
            imagen_url: item.imagen_url || '',
        });

        setEditando(true);
        setModal(true);
    };

    const guardar = async () => {
        try {
            if (!form.nombre.trim()) {
                alert('El nombre es obligatorio');
                return;
            }

            if (!form.codigo.trim()) {
                alert('El código es obligatorio');
                return;
            }

            setLoading(true);

            const url = editando
                ? `${API_BASE}/inventario/productos/${form.productoId}`
                : `${API_BASE}/inventario/productos`;

            const method = editando ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method,
                headers,
                body: JSON.stringify({
                    ...form,
                    codigo_barra: form.codigo,
                }),
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo guardar');
                return;
            }

            setModal(false);
            setForm(formInicial);
            cargarProductos();

        } catch (error) {
            console.error('Error guardando:', error);
            alert('Error al guardar producto o servicio');
        } finally {
            setLoading(false);
        }
    };

    const eliminar = async (id?: number) => {
        if (!id) return;

        if (!confirm('¿Seguro que deseas eliminar este producto/servicio?')) return;

        try {
            const resp = await fetch(`${API_BASE}/inventario/productos/${id}`, {
                method: 'DELETE',
                headers,
            });

            const data = await resp.json();

            if (data.ok) {
                cargarProductos();
            } else {
                alert(data.message || 'No se pudo eliminar');
            }
        } catch (error) {
            console.error('Error eliminando:', error);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">


                <button
                    onClick={abrirNuevo}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/20"
                >
                    + Nuevo producto / servicio
                </button>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {productos.map((p) => (
                    <div
                        key={p.productoId}
                        className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5 shadow-xl shadow-cyan-500/5"
                    >
                        <div className="flex justify-between items-start gap-3">
                            <div>
                                <span className={`text-xs font-black px-3 py-1 rounded-full ${p.tipo_item === 'SERVICIO'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-cyan-500/20 text-cyan-300'
                                    }`}>
                                    {p.tipo_item}
                                </span>

                                <h2 className="text-xl font-black mt-3">
                                    {p.nombre}
                                </h2>

                                <p className="text-slate-400 text-sm">
                                    Código: {p.codigo}
                                </p>
                            </div>

                            {p.imagen_url ? (
                                <img
                                    src={p.imagen_url}
                                    className="w-16 h-16 object-cover rounded-xl border border-slate-700"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                                    📦
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                            <div className="bg-slate-950 rounded-xl p-3">
                                <p className="text-slate-500">Stock</p>
                                <p className="font-black">{p.stock}</p>
                            </div>

                            <div className="bg-slate-950 rounded-xl p-3">
                                <p className="text-slate-500">Precio venta</p>
                                <p className="font-black">${Number(p.precio_venta).toFixed(2)}</p>
                            </div>

                            <div className="bg-slate-950 rounded-xl p-3">
                                <p className="text-slate-500">IVA</p>
                                <p className="font-black">{p.aplica_iva}</p>
                            </div>

                            <div className="bg-slate-950 rounded-xl p-3">
                                <p className="text-slate-500">Estado</p>
                                <p className="font-black">{p.estado}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => abrirEditar(p)}
                                className="flex-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl py-2 font-bold"
                            >
                                Editar
                            </button>

                            <button
                                onClick={() => eliminar(p.productoId)}
                                className="flex-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl py-2 font-bold"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </section>

            {modal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-4xl p-6 shadow-2xl shadow-cyan-500/10">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-black text-cyan-300">
                                {editando ? 'Editar producto / servicio' : 'Nuevo producto / servicio'}
                            </h2>

                            <button
                                onClick={() => setModal(false)}
                                className="text-slate-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-slate-400">Tipo</label>
                                <select
                                    value={form.tipo_item}
                                    onChange={(e) => setForm({ ...form, tipo_item: e.target.value as any })}
                                    className="input"
                                >
                                    <option value="PRODUCTO">Producto</option>
                                    <option value="SERVICIO">Servicio</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Código</label>
                                <input
                                    value={form.codigo}
                                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                                    className="input"
                                    placeholder="Ej: PROD-001"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Categoría</label>
                                <input
                                    value={form.categoria}
                                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                    className="input"
                                    placeholder="Ej: Equipos, instalación..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-xs text-slate-400">Nombre</label>
                                <input
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    className="input"
                                    placeholder="Nombre del producto o servicio"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Aplica IVA</label>
                                <select
                                    value={form.aplica_iva}
                                    onChange={(e) => setForm({ ...form, aplica_iva: e.target.value as any })}
                                    className="input"
                                >
                                    <option value="SI">Sí</option>
                                    <option value="NO">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Stock</label>
                                <input
                                    type="number"
                                    value={form.stock}
                                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                                    className="input"
                                    disabled={form.tipo_item === 'SERVICIO'}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Stock mínimo</label>
                                <input
                                    type="number"
                                    value={form.stock_minimo}
                                    onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })}
                                    className="input"
                                    disabled={form.tipo_item === 'SERVICIO'}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Estado</label>
                                <select
                                    value={form.estado}
                                    onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
                                    className="input"
                                >
                                    <option value="ACTIVO">Activo</option>
                                    <option value="INACTIVO">Inactivo</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Precio compra</label>
                                <input
                                    type="number"
                                    value={form.precio_compra}
                                    onChange={(e) => setForm({ ...form, precio_compra: Number(e.target.value) })}
                                    className="input"
                                    disabled={form.tipo_item === 'SERVICIO'}
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">Precio venta</label>
                                <input
                                    type="number"
                                    value={form.precio_venta}
                                    onChange={(e) => setForm({ ...form, precio_venta: Number(e.target.value) })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400">URL imagen</label>
                                <input
                                    value={form.imagen_url || ''}
                                    onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
                                    className="input"
                                    placeholder="Luego lo cambiamos por upload"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <label className="text-xs text-slate-400">Descripción</label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    className="input min-h-[90px]"
                                    placeholder="Detalle del producto o servicio"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setModal(false)}
                                className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={guardar}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar'}
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
                    border-color: #06b6d4;
                    box-shadow: 0 0 0 1px #06b6d4;
                }

                .input:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </main>
    );
}