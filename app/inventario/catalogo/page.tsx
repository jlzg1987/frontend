'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useMemo, useState } from 'react';



type TipoItem = 'PRODUCTO' | 'SERVICIO';
type EstadoItem = 'ACTIVO' | 'INACTIVO';

type Producto = {
    productoId: number;
    empresaId?: number;
    tipo_item: TipoItem;
    codigo: string;
    codigo_barra?: string;
    nombre: string;
    descripcion?: string;
    imagen_url?: string;
    categoria?: string;
    stock: number;
    stock_minimo: number;
    precio_compra: number;
    precio_venta: number;
    aplica_iva: 'SI' | 'NO';
    estado: EstadoItem;
};

const formInicial: Producto = {
    productoId: 0,
    tipo_item: 'PRODUCTO',
    codigo: '',
    codigo_barra: '',
    nombre: '',
    descripcion: '',
    imagen_url: '',
    categoria: '',
    stock: 0,
    stock_minimo: 0,
    precio_compra: 0,
    precio_venta: 0,
    aplica_iva: 'SI',
    estado: 'ACTIVO',
};

export default function CatalogoInventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [form, setForm] = useState<Producto>(formInicial);
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoItem>('TODOS');
    const [filtroEstado, setFiltroEstado] = useState<'TODOS' | EstadoItem>('TODOS');
    const [filtroStock, setFiltroStock] = useState<'TODOS' | 'BAJO' | 'DISPONIBLE'>('TODOS');

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
            console.error('Error cargando catálogo:', error);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const productosFiltrados = useMemo(() => {
        return productos.filter((p) => {
            const texto = filtroTexto.toLowerCase();

            const coincideTexto =
                !texto ||
                p.nombre?.toLowerCase().includes(texto) ||
                p.codigo?.toLowerCase().includes(texto) ||
                p.categoria?.toLowerCase().includes(texto);

            const coincideTipo =
                filtroTipo === 'TODOS' || p.tipo_item === filtroTipo;

            const coincideEstado =
                filtroEstado === 'TODOS' || p.estado === filtroEstado;

            const stockBajo =
                p.tipo_item === 'PRODUCTO' &&
                Number(p.stock) <= Number(p.stock_minimo);

            const stockDisponible =
                p.tipo_item === 'PRODUCTO' &&
                Number(p.stock) > Number(p.stock_minimo);

            const coincideStock =
                filtroStock === 'TODOS' ||
                (filtroStock === 'BAJO' && stockBajo) ||
                (filtroStock === 'DISPONIBLE' && stockDisponible);

            return coincideTexto && coincideTipo && coincideEstado && coincideStock;
        });
    }, [productos, filtroTexto, filtroTipo, filtroEstado, filtroStock]);

    const totalProductos = productos.filter(p => p.tipo_item === 'PRODUCTO').length;
    const totalServicios = productos.filter(p => p.tipo_item === 'SERVICIO').length;
    const totalStockBajo = productos.filter(
        p => p.tipo_item === 'PRODUCTO' && Number(p.stock) <= Number(p.stock_minimo)
    ).length;

    const abrirEditar = (p: Producto) => {
        setForm({
            productoId: p.productoId,
            empresaId: p.empresaId,
            tipo_item: p.tipo_item || 'PRODUCTO',
            codigo: p.codigo || '',
            codigo_barra: p.codigo_barra || p.codigo || '',
            nombre: p.nombre || '',
            descripcion: p.descripcion || '',
            imagen_url: p.imagen_url || '',
            categoria: p.categoria || '',
            stock: Number(p.stock || 0),
            stock_minimo: Number(p.stock_minimo || 0),
            precio_compra: Number(p.precio_compra || 0),
            precio_venta: Number(p.precio_venta || 0),
            aplica_iva: p.aplica_iva || 'SI',
            estado: p.estado || 'ACTIVO',
        });

        setModal(true);
    };

    const guardarCambios = async () => {
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

            const resp = await fetch(`${API_BASE}/inventario/productos/${form.productoId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    ...form,
                    codigo_barra: form.codigo_barra || form.codigo,
                    stock: form.tipo_item === 'SERVICIO' ? 0 : form.stock,
                    stock_minimo: form.tipo_item === 'SERVICIO' ? 0 : form.stock_minimo,
                    precio_compra: form.tipo_item === 'SERVICIO' ? 0 : form.precio_compra,
                }),
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo actualizar');
                return;
            }

            setModal(false);
            setForm(formInicial);
            cargarProductos();

        } catch (error) {
            console.error('Error actualizando:', error);
            alert('Error al actualizar producto o servicio');
        } finally {
            setLoading(false);
        }
    };

    const eliminarProducto = async (productoId: number) => {
        if (!confirm('¿Seguro que deseas eliminar este producto o servicio?')) return;

        try {
            const resp = await fetch(`${API_BASE}/inventario/productos/${productoId}`, {
                method: 'DELETE',
                headers,
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo eliminar');
                return;
            }

            cargarProductos();

        } catch (error) {
            console.error('Error eliminando:', error);
            alert('Error al eliminar');
        }
    };

    const limpiarFiltros = () => {
        setFiltroTexto('');
        setFiltroTipo('TODOS');
        setFiltroEstado('TODOS');
        setFiltroStock('TODOS');
    };

    const imprimirCodigoBarra = (p: Producto) => {
        const codigo = p.codigo_barra || p.codigo;

        const ventana = window.open('', '_blank', 'width=420,height=350');

        if (!ventana) return;

        ventana.document.write(`
            <html>
                <head>
                    <title>Código de barra</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 25px;
                        }
                        .box {
                            border: 1px solid #111;
                            padding: 20px;
                            border-radius: 10px;
                        }
                        .codigo {
                            font-size: 34px;
                            letter-spacing: 4px;
                            margin-top: 15px;
                            font-family: monospace;
                        }
                        .nombre {
                            font-weight: bold;
                            font-size: 18px;
                        }
                        .precio {
                            margin-top: 10px;
                            font-size: 16px;
                        }
                    </style>
                </head>
                <body>
                    <div class="box">
                        <div class="nombre">${p.nombre}</div>
                        <div class="codigo">||||||||||||</div>
                        <div>${codigo}</div>
                        <div class="precio">$${Number(p.precio_venta).toFixed(2)}</div>
                    </div>

                    <script>
                        window.print();
                    </script>
                </body>
            </html>
        `);

        ventana.document.close();
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">


                <button
                    onClick={cargarProductos}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3 rounded-xl"
                >
                    Actualizar catálogo
                </button>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Resumen titulo="Total ítems" valor={productos.length} icono="🧾" />
                <Resumen titulo="Productos" valor={totalProductos} icono="📦" />
                <Resumen titulo="Servicios" valor={totalServicios} icono="🛠️" />
                <Resumen titulo="Stock bajo" valor={totalStockBajo} icono="⚠️" alerta />
            </section>

            <section className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs text-slate-400">Buscar</label>
                        <input
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            placeholder="Nombre, código o categoría"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Tipo</label>
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value as any)}
                            className="input"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PRODUCTO">Producto</option>
                            <option value="SERVICIO">Servicio</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Estado</label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as any)}
                            className="input"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="ACTIVO">Activo</option>
                            <option value="INACTIVO">Inactivo</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Stock</label>
                        <select
                            value={filtroStock}
                            onChange={(e) => setFiltroStock(e.target.value as any)}
                            className="input"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="BAJO">Stock bajo</option>
                            <option value="DISPONIBLE">Disponible</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-slate-400">
                        Mostrando {productosFiltrados.length} resultado(s)
                    </p>

                    <button
                        onClick={limpiarFiltros}
                        className="text-sm text-emerald-300 hover:text-emerald-200 font-bold"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {productosFiltrados.map((p) => {
                    const stockBajo =
                        p.tipo_item === 'PRODUCTO' &&
                        Number(p.stock) <= Number(p.stock_minimo);

                    return (
                        <div
                            key={p.productoId}
                            className="bg-slate-900 border border-slate-700 rounded-2xl p-5 hover:border-emerald-500/50 transition"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge texto={p.tipo_item} tipo={p.tipo_item} />

                                        {stockBajo && (
                                            <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-xs font-black">
                                                Stock bajo
                                            </span>
                                        )}

                                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${p.estado === 'ACTIVO'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                            : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                                            }`}>
                                            {p.estado}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-black mt-3">{p.nombre}</h2>
                                    <p className="text-slate-400 text-sm">Código: {p.codigo}</p>
                                    <p className="text-slate-500 text-sm">
                                        Categoría: {p.categoria || 'Sin categoría'}
                                    </p>
                                </div>

                                {p.imagen_url ? (
                                    <img
                                        src={p.imagen_url}
                                        alt={p.nombre}
                                        className="w-20 h-20 object-cover rounded-xl border border-slate-700"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
                                        {p.tipo_item === 'SERVICIO' ? '🛠️' : '📦'}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-5">
                                <Dato titulo="Stock" valor={p.tipo_item === 'SERVICIO' ? 'N/A' : p.stock} />
                                <Dato titulo="Stock mínimo" valor={p.tipo_item === 'SERVICIO' ? 'N/A' : p.stock_minimo} />
                                <Dato titulo="Compra" valor={p.tipo_item === 'SERVICIO' ? 'N/A' : `$${Number(p.precio_compra).toFixed(2)}`} />
                                <Dato titulo="Venta" valor={`$${Number(p.precio_venta).toFixed(2)}`} />
                                <Dato titulo="IVA" valor={p.aplica_iva} />
                                <Dato titulo="Barra" valor={p.codigo_barra || p.codigo} />
                            </div>

                            {p.descripcion && (
                                <p className="text-sm text-slate-400 mt-4 line-clamp-2">
                                    {p.descripcion}
                                </p>
                            )}

                            <div className="grid grid-cols-3 gap-3 mt-5">
                                <button
                                    onClick={() => abrirEditar(p)}
                                    className="bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl py-2 font-bold"
                                >
                                    Editar
                                </button>

                                <button
                                    onClick={() => imprimirCodigoBarra(p)}
                                    className="bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl py-2 font-bold"
                                >
                                    Barra
                                </button>

                                <button
                                    onClick={() => eliminarProducto(p.productoId)}
                                    className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl py-2 font-bold"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    );
                })}
            </section>

            {productosFiltrados.length === 0 && (
                <div className="text-center text-slate-500 mt-12">
                    No hay productos o servicios con esos filtros.
                </div>
            )}

            {modal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl w-full max-w-4xl p-6">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-black text-emerald-300">
                                Editar producto / servicio
                            </h2>

                            <button
                                onClick={() => setModal(false)}
                                className="text-slate-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CampoSelect
                                label="Tipo"
                                value={form.tipo_item}
                                onChange={(v) => setForm({ ...form, tipo_item: v as TipoItem })}
                                options={[
                                    { value: 'PRODUCTO', label: 'Producto' },
                                    { value: 'SERVICIO', label: 'Servicio' },
                                ]}
                            />

                            <CampoInput
                                label="Código"
                                value={form.codigo}
                                onChange={(v) => setForm({ ...form, codigo: v, codigo_barra: v })}
                            />

                            <CampoInput
                                label="Categoría"
                                value={form.categoria || ''}
                                onChange={(v) => setForm({ ...form, categoria: v })}
                            />

                            <div className="md:col-span-2">
                                <CampoInput
                                    label="Nombre"
                                    value={form.nombre}
                                    onChange={(v) => setForm({ ...form, nombre: v })}
                                />
                            </div>

                            <CampoSelect
                                label="Aplica IVA"
                                value={form.aplica_iva}
                                onChange={(v) => setForm({ ...form, aplica_iva: v as 'SI' | 'NO' })}
                                options={[
                                    { value: 'SI', label: 'Sí' },
                                    { value: 'NO', label: 'No' },
                                ]}
                            />

                            <CampoInput
                                label="Stock"
                                type="number"
                                value={String(form.stock)}
                                disabled={form.tipo_item === 'SERVICIO'}
                                onChange={(v) => setForm({ ...form, stock: Number(v) })}
                            />

                            <CampoInput
                                label="Stock mínimo"
                                type="number"
                                value={String(form.stock_minimo)}
                                disabled={form.tipo_item === 'SERVICIO'}
                                onChange={(v) => setForm({ ...form, stock_minimo: Number(v) })}
                            />

                            <CampoSelect
                                label="Estado"
                                value={form.estado}
                                onChange={(v) => setForm({ ...form, estado: v as EstadoItem })}
                                options={[
                                    { value: 'ACTIVO', label: 'Activo' },
                                    { value: 'INACTIVO', label: 'Inactivo' },
                                ]}
                            />

                            <CampoInput
                                label="Precio compra"
                                type="number"
                                value={String(form.precio_compra)}
                                disabled={form.tipo_item === 'SERVICIO'}
                                onChange={(v) => setForm({ ...form, precio_compra: Number(v) })}
                            />

                            <CampoInput
                                label="Precio venta"
                                type="number"
                                value={String(form.precio_venta)}
                                onChange={(v) => setForm({ ...form, precio_venta: Number(v) })}
                            />

                            <CampoInput
                                label="URL imagen"
                                value={form.imagen_url || ''}
                                onChange={(v) => setForm({ ...form, imagen_url: v })}
                            />

                            <div className="md:col-span-3">
                                <label className="text-xs text-slate-400">Descripción</label>
                                <textarea
                                    value={form.descripcion || ''}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    className="input min-h-[90px]"
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
                                onClick={guardarCambios}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar cambios'}
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
                    border-color: #10b981;
                    box-shadow: 0 0 0 1px #10b981;
                }

                .input:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </main>
    );
}

function Resumen({
    titulo,
    valor,
    icono,
    alerta,
}: {
    titulo: string;
    valor: number;
    icono: string;
    alerta?: boolean;
}) {
    return (
        <div className={`bg-slate-900 border rounded-2xl p-5 ${alerta
            ? 'border-red-500/30'
            : 'border-emerald-500/20'
            }`}>
            <div className="text-3xl">{icono}</div>
            <p className="text-slate-400 text-sm mt-2">{titulo}</p>
            <h3 className={`text-3xl font-black ${alerta ? 'text-red-300' : 'text-emerald-300'
                }`}>
                {valor}
            </h3>
        </div>
    );
}

function Badge({ texto, tipo }: { texto: string; tipo: TipoItem }) {
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-black border ${tipo === 'SERVICIO'
            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
            {texto}
        </span>
    );
}

function Dato({ titulo, valor }: { titulo: string; valor: any }) {
    return (
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
            <p className="text-slate-500 text-xs">{titulo}</p>
            <p className="font-black text-sm mt-1">{valor}</p>
        </div>
    );
}

function CampoInput({
    label,
    value,
    onChange,
    type = 'text',
    disabled = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="text-xs text-slate-400">{label}</label>
            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className="input"
            />
        </div>
    );
}

function CampoSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div>
            <label className="text-xs text-slate-400">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input"
            >
                {options.map((op) => (
                    <option key={op.value} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>
        </div>
    );
}