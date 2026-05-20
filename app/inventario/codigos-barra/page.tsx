'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useMemo, useState } from 'react';



type Producto = {
    productoId: number;
    tipo_item: 'PRODUCTO' | 'SERVICIO';
    codigo: string;
    codigo_barra?: string;
    nombre: string;
    categoria?: string;
    stock: number;
    precio_venta: number;
    estado: 'ACTIVO' | 'INACTIVO';
};

export default function CodigosBarraPage() {
    const [items, setItems] = useState<Producto[]>([]);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'PRODUCTO' | 'SERVICIO'>('TODOS');
    const [cantidadEtiquetas, setCantidadEtiquetas] = useState(1);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    const cargarItems = async () => {
        try {
            const resp = await fetch(`${API_BASE}/inventario/productos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await resp.json();

            if (data.ok) {
                setItems(data.data || []);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    useEffect(() => {
        cargarItems();
    }, []);

    const itemsFiltrados = useMemo(() => {
        const txt = busqueda.toLowerCase();

        return items.filter((p) => {
            const coincideTexto =
                !txt ||
                p.nombre?.toLowerCase().includes(txt) ||
                p.codigo?.toLowerCase().includes(txt) ||
                p.categoria?.toLowerCase().includes(txt);

            const coincideTipo =
                tipoFiltro === 'TODOS' || p.tipo_item === tipoFiltro;

            return coincideTexto && coincideTipo && p.estado === 'ACTIVO';
        });
    }, [items, busqueda, tipoFiltro]);

    const toggleSeleccion = (id: number) => {
        setSeleccionados((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const seleccionarTodos = () => {
        const ids = itemsFiltrados.map((p) => p.productoId);
        setSeleccionados(ids);
    };

    const limpiarSeleccion = () => {
        setSeleccionados([]);
    };

    const imprimirEtiquetas = () => {
        const productosSeleccionados = items.filter((p) =>
            seleccionados.includes(p.productoId)
        );

        if (productosSeleccionados.length === 0) {
            alert('Selecciona al menos un producto o servicio');
            return;
        }

        const etiquetasHtml = productosSeleccionados
            .flatMap((p) => {
                const codigo = p.codigo_barra || p.codigo;

                return Array.from({ length: cantidadEtiquetas }).map(() => `
                    <div class="etiqueta">
                        <div class="nombre">${p.nombre}</div>
                        <div class="tipo">${p.tipo_item}</div>
                        <svg class="barcode"
                            jsbarcode-format="CODE128"
                            jsbarcode-value="${codigo}"
                            jsbarcode-textmargin="0"
                            jsbarcode-fontoptions="bold"
                            jsbarcode-width="1.5"
                            jsbarcode-height="45">
                        </svg>
                        <div class="precio">$${Number(p.precio_venta || 0).toFixed(2)}</div>
                    </div>
                `);
            })
            .join('');

        const ventana = window.open('', '_blank', 'width=900,height=700');

        if (!ventana) return;

        ventana.document.write(`
            <html>
                <head>
                    <title>Imprimir códigos de barra</title>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
                    <style>
                        * {
                            box-sizing: border-box;
                        }

                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 10px;
                            background: #fff;
                        }

                        .contenedor {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 8px;
                        }

                        .etiqueta {
                            width: 250px;
                            min-height: 130px;
                            border: 1px solid #111;
                            border-radius: 6px;
                            padding: 8px;
                            text-align: center;
                            overflow: hidden;
                            page-break-inside: avoid;
                        }

                        .nombre {
                            font-size: 12px;
                            font-weight: bold;
                            height: 30px;
                            overflow: hidden;
                        }

                        .tipo {
                            font-size: 9px;
                            margin: 2px 0;
                            color: #444;
                        }

                        .barcode {
                            width: 100%;
                        }

                        .precio {
                            font-size: 13px;
                            font-weight: bold;
                            margin-top: 2px;
                        }

                        @media print {
                            body {
                                padding: 0;
                            }

                            .etiqueta {
                                border: 1px solid #000;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="contenedor">
                        ${etiquetasHtml}
                    </div>

                    <script>
                        JsBarcode(".barcode").init();

                        setTimeout(() => {
                            window.print();
                        }, 500);
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
                    onClick={imprimirEtiquetas}
                    className="bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-6 py-3 rounded-xl"
                >
                    Imprimir etiquetas
                </button>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
                <div className="lg:col-span-2">
                    <label className="text-xs text-slate-400">Buscar</label>
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, código o categoría"
                        className="input"
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-400">Tipo</label>
                    <select
                        value={tipoFiltro}
                        onChange={(e) => setTipoFiltro(e.target.value as any)}
                        className="input"
                    >
                        <option value="TODOS">Todos</option>
                        <option value="PRODUCTO">Producto</option>
                        <option value="SERVICIO">Servicio</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-slate-400">Copias por ítem</label>
                    <input
                        type="number"
                        min={1}
                        value={cantidadEtiquetas}
                        onChange={(e) => setCantidadEtiquetas(Number(e.target.value || 1))}
                        className="input"
                    />
                </div>
            </section>

            <section className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={seleccionarTodos}
                    className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-4 py-2 rounded-xl font-bold"
                >
                    Seleccionar visibles
                </button>

                <button
                    onClick={limpiarSeleccion}
                    className="bg-slate-800 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl font-bold"
                >
                    Limpiar selección
                </button>

                <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-4 py-2 rounded-xl font-bold">
                    Seleccionados: {seleccionados.length}
                </span>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {itemsFiltrados.map((p) => {
                    const seleccionado = seleccionados.includes(p.productoId);

                    return (
                        <button
                            key={p.productoId}
                            onClick={() => toggleSeleccion(p.productoId)}
                            className={`text-left bg-slate-900 border rounded-2xl p-5 transition ${seleccionado
                                ? 'border-yellow-400 shadow-lg shadow-yellow-500/10'
                                : 'border-slate-700 hover:border-yellow-500/50'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black ${p.tipo_item === 'SERVICIO'
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'bg-cyan-500/20 text-cyan-300'
                                        }`}>
                                        {p.tipo_item}
                                    </span>

                                    <h2 className="text-lg font-black mt-3">
                                        {p.nombre}
                                    </h2>

                                    <p className="text-sm text-slate-400">
                                        Código: {p.codigo_barra || p.codigo}
                                    </p>

                                    <p className="text-sm text-slate-500">
                                        {p.categoria || 'Sin categoría'}
                                    </p>
                                </div>

                                <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${seleccionado
                                    ? 'bg-yellow-400 border-yellow-400 text-slate-950'
                                    : 'border-slate-600 text-slate-600'
                                    }`}>
                                    ✓
                                </div>
                            </div>

                            <div className="mt-4 bg-white rounded-xl p-3 text-center">
                                <div className="text-black text-xs font-bold truncate">
                                    {p.nombre}
                                </div>

                                <div className="text-black text-2xl tracking-widest font-mono">
                                    ||||||||||
                                </div>

                                <div className="text-black text-xs">
                                    {p.codigo_barra || p.codigo}
                                </div>
                            </div>

                            <p className="text-yellow-300 font-black mt-3">
                                ${Number(p.precio_venta || 0).toFixed(2)}
                            </p>
                        </button>
                    );
                })}
            </section>

            {itemsFiltrados.length === 0 && (
                <div className="text-center text-slate-500 mt-12">
                    No hay productos o servicios disponibles.
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
            `}</style>
        </main>
    );
}