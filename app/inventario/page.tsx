'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/src/lib/api';



type Producto = {
    productoId: number;
    tipo_item: 'PRODUCTO' | 'SERVICIO';
    codigo: string;
    nombre: string;
    categoria?: string;
    stock: number;
    stock_minimo: number;
    precio_compra: number;
    precio_venta: number;
    aplica_iva: 'SI' | 'NO';
    estado: 'ACTIVO' | 'INACTIVO';
    imagen_url?: string;
};

export default function DashboardInventarioPage({
    onVolver,
    onAbrirProductoServicio,
    onAbrirCatalogoInventario,
    onAbrirImportarInventario,
    onAbrirMoviminetoStock,
    onAbrirCodigoBarra,
    onAbrirKitsInstalacion,
}: {
    onVolver: () => void;
    onAbrirProductoServicio: () => void;
    onAbrirCatalogoInventario: () => void;
    onAbrirImportarInventario: () => void;
    onAbrirMoviminetoStock: () => void;
    onAbrirCodigoBarra: () => void;
    onAbrirKitsInstalacion: () => void;
}) {
    const router = useRouter();

    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== 'undefined'
        ? localStorage.getItem('token')
        : '';

    const cargarProductos = async () => {
        try {
            setLoading(true);

            const resp = await fetch(`${API_BASE}/inventario/productos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await resp.json();

            if (data.ok) {
                setProductos(data.data || []);
            }

        } catch (error) {
            console.error('Error cargando dashboard inventario:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const stats = useMemo(() => {
        const productosSolo = productos.filter(p => p.tipo_item === 'PRODUCTO');
        const serviciosSolo = productos.filter(p => p.tipo_item === 'SERVICIO');

        const activos = productos.filter(p => p.estado === 'ACTIVO').length;
        const inactivos = productos.filter(p => p.estado === 'INACTIVO').length;

        const stockTotal = productosSolo.reduce((acc, p) => {
            return acc + Number(p.stock || 0);
        }, 0);

        const stockBajo = productosSolo.filter(p => {
            return Number(p.stock || 0) <= Number(p.stock_minimo || 0);
        }).length;

        const sinStock = productosSolo.filter(p => {
            return Number(p.stock || 0) <= 0;
        }).length;

        const valorCompra = productosSolo.reduce((acc, p) => {
            return acc + (Number(p.stock || 0) * Number(p.precio_compra || 0));
        }, 0);

        const valorVenta = productosSolo.reduce((acc, p) => {
            return acc + (Number(p.stock || 0) * Number(p.precio_venta || 0));
        }, 0);

        return {
            totalItems: productos.length,
            productos: productosSolo.length,
            servicios: serviciosSolo.length,
            activos,
            inactivos,
            stockTotal,
            stockBajo,
            sinStock,
            valorCompra,
            valorVenta,
        };
    }, [productos]);

    const productosStockBajo = productos
        .filter(p =>
            p.tipo_item === 'PRODUCTO' &&
            Number(p.stock || 0) <= Number(p.stock_minimo || 0)
        )
        .slice(0, 6);

    const ultimosItems = [...productos]
        .sort((a, b) => Number(b.productoId) - Number(a.productoId))
        .slice(0, 6);

    const cards = [
        {
            title: 'Crear productos y servicios',
            desc: 'Registrar productos, servicios, precios, stock y código de barra.',
            icon: '➕',
            href: '/inventario/productos',
            color: 'from-cyan-500 to-blue-600',
        },
        {
            title: 'Catálogo e Inventario',
            desc: 'Ver stock, buscar, filtrar, editar y eliminar productos o servicios.',
            icon: '🧾',
            href: '/inventario/catalogo',
            color: 'from-emerald-500 to-green-600',
        },
        {
            title: 'Importar Inventario',
            desc: 'Subir productos y servicios desde Excel con plantilla automática.',
            icon: '📊',
            href: '/inventario/importar',
            color: 'from-purple-500 to-fuchsia-600',
        },
        {
            title: 'Movimientos de Stock',
            desc: 'Entradas, salidas, ajustes y trazabilidad del inventario.',
            icon: '🔄',
            href: '/inventario/movimientos',
            color: 'from-orange-500 to-red-600',
            disabled: false,
        },
        {
            title: 'Códigos de Barra',
            desc: 'Imprimir etiquetas de productos y servicios para lectura rápida.',
            icon: '🏷️',
            href: '/inventario/codigos-barra',
            color: 'from-slate-500 to-slate-700',
            disabled: false,
        },
        {
            title: 'Kits de Instalación',
            desc: 'Crear kits con router, cable, conectores, ONU, antenas y servicios.',
            icon: '🧰',
            href: '/inventario/kits',
            color: 'from-yellow-500 to-amber-600',
            disabled: false,
        },
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
            <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">


                <button
                    onClick={cargarProductos}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/20"
                >
                    {loading ? 'Actualizando...' : 'Actualizar datos'}
                </button>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <StatCard titulo="Total ítems" valor={stats.totalItems} icono="🧾" color="cyan" />
                <StatCard titulo="Productos" valor={stats.productos} icono="📦" color="emerald" />
                <StatCard titulo="Servicios" valor={stats.servicios} icono="🛠️" color="purple" />
                <StatCard titulo="Stock total" valor={stats.stockTotal} icono="📚" color="blue" />
                <StatCard titulo="Stock bajo" valor={stats.stockBajo} icono="⚠️" color="red" />
                <StatCard titulo="Sin stock" valor={stats.sinStock} icono="⛔" color="orange" />
                <StatCard titulo="Activos" valor={stats.activos} icono="✅" color="emerald" />
                <StatCard titulo="Inactivos" valor={stats.inactivos} icono="🚫" color="slate" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
                <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5">
                    <h2 className="text-xl font-black text-cyan-300 mb-4">
                        Valor estimado del inventario
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800">
                            <p className="text-slate-400 text-sm">Costo aproximado</p>
                            <h3 className="text-3xl font-black text-orange-300 mt-2">
                                ${stats.valorCompra.toFixed(2)}
                            </h3>
                        </div>

                        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800">
                            <p className="text-slate-400 text-sm">Venta estimada</p>
                            <h3 className="text-3xl font-black text-emerald-300 mt-2">
                                ${stats.valorVenta.toFixed(2)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-5">
                    <h2 className="text-xl font-black text-red-300 mb-4">
                        Alertas de stock bajo
                    </h2>

                    {productosStockBajo.length === 0 ? (
                        <p className="text-slate-400">
                            No hay productos con stock bajo.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {productosStockBajo.map((p) => (
                                <div
                                    key={p.productoId}
                                    className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3"
                                >
                                    <div>
                                        <p className="font-black">{p.nombre}</p>
                                        <p className="text-xs text-slate-500">
                                            {p.codigo} · mínimo {p.stock_minimo}
                                        </p>
                                    </div>

                                    <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-sm font-black">
                                        {p.stock}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-black text-white mb-4">
                    Módulos de inventario
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {cards.map((card, index) => (
                        <button
                            key={index}
                            disabled={card.disabled}
                            onClick={() => {
                                if (card.title === 'Crear productos y servicios') {
                                    onAbrirProductoServicio();
                                    return;
                                }
                                if (card.title === 'Catálogo e Inventario') {
                                    onAbrirCatalogoInventario();
                                    return;
                                }

                                if (card.title === 'Importar Inventario') {
                                    onAbrirImportarInventario();
                                    return;
                                }

                                if (card.title === 'Movimientos de Stock') {
                                    onAbrirMoviminetoStock();
                                    return;
                                }
                                if (card.title === 'Códigos de Barra') {
                                    onAbrirCodigoBarra();
                                    return;
                                }
                                if (card.title === 'Kits de Instalación') {
                                    onAbrirKitsInstalacion();
                                    return;
                                }

                                !card.disabled && router.push(card.href)

                            }}
                            className={`text-left rounded-2xl p-5 border transition relative overflow-hidden ${card.disabled
                                ? 'bg-slate-900/60 border-slate-800 opacity-60 cursor-not-allowed'
                                : 'bg-slate-900 border-slate-700 hover:border-cyan-400 hover:-translate-y-1'
                                }`}
                        >
                            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.color}`} />

                            <div className="text-4xl mb-4">{card.icon}</div>

                            <h3 className="text-xl font-black">
                                {card.title}
                            </h3>

                            <p className="text-slate-400 text-sm mt-2">
                                {card.desc}
                            </p>

                            {card.disabled && (
                                <span className="inline-block mt-4 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-3 py-1 rounded-full text-xs font-black">
                                    Próximamente
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </section>

            <section className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-white">
                        Últimos productos / servicios registrados
                    </h2>

                    <button
                        onClick={() => router.push('/inventario/catalogo')}
                        className="text-cyan-300 hover:text-cyan-200 font-bold text-sm"
                    >
                        Ver catálogo
                    </button>
                </div>

                {ultimosItems.length === 0 ? (
                    <p className="text-slate-400">
                        Todavía no hay productos o servicios registrados.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-800">
                                    <th className="text-left py-3">Código</th>
                                    <th className="text-left py-3">Nombre</th>
                                    <th className="text-left py-3">Tipo</th>
                                    <th className="text-left py-3">Stock</th>
                                    <th className="text-left py-3">Precio</th>
                                    <th className="text-left py-3">Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {ultimosItems.map((p) => (
                                    <tr key={p.productoId} className="border-b border-slate-800/60">
                                        <td className="py-3 text-slate-300">{p.codigo}</td>
                                        <td className="py-3 font-bold">{p.nombre}</td>
                                        <td className="py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${p.tipo_item === 'SERVICIO'
                                                ? 'bg-purple-500/20 text-purple-300'
                                                : 'bg-cyan-500/20 text-cyan-300'
                                                }`}>
                                                {p.tipo_item}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {p.tipo_item === 'SERVICIO' ? 'N/A' : p.stock}
                                        </td>
                                        <td className="py-3">
                                            ${Number(p.precio_venta || 0).toFixed(2)}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black ${p.estado === 'ACTIVO'
                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                {p.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

function StatCard({
    titulo,
    valor,
    icono,
    color,
}: {
    titulo: string;
    valor: number;
    icono: string;
    color: 'cyan' | 'emerald' | 'purple' | 'blue' | 'red' | 'orange' | 'slate';
}) {
    const colors: any = {
        cyan: 'border-cyan-500/30 text-cyan-300',
        emerald: 'border-emerald-500/30 text-emerald-300',
        purple: 'border-purple-500/30 text-purple-300',
        blue: 'border-blue-500/30 text-blue-300',
        red: 'border-red-500/30 text-red-300',
        orange: 'border-orange-500/30 text-orange-300',
        slate: 'border-slate-600 text-slate-300',
    };

    return (
        <div className={`bg-slate-900 border rounded-2xl p-5 ${colors[color]}`}>
            <div className="text-3xl">{icono}</div>
            <p className="text-slate-400 text-sm mt-3">{titulo}</p>
            <h3 className="text-3xl font-black mt-1">
                {valor}
            </h3>
        </div>
    );
}