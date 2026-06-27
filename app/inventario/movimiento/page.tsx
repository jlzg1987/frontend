'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useMemo, useState } from 'react';


type Producto = {
    productoId: number;
    tipo_item: 'PRODUCTO' | 'SERVICIO';
    codigo: string;
    nombre: string;
    categoria?: string;
    stock: number;
    stock_minimo: number;
    precio_venta: number;
    estado: 'ACTIVO' | 'INACTIVO';
};

type Movimiento = {
    movimientoId: number;
    productoId: number;
    tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    origen: 'TIENDA' | 'VENTA' | 'COMPRA' | 'AJUSTE' | 'MANUAL';
    referenciaId?: string;
    referenciaTipo?: string;
    cantidad: number;
    stockAnterior: number;
    stockNuevo: number;
    observacion?: string;
    creadoEn: string;
    codigo: string;
    nombre: string;
    categoria?: string;
};

export default function MovimientosInventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [productoId, setProductoId] = useState('');
    const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA');
    const [cantidad, setCantidad] = useState('');
    const [motivo, setMotivo] = useState('');
    const [referencia, setReferencia] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(false);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    const cargarDatos = async () => {
        try {
            const [respProductos, respMovimientos] = await Promise.all([
                fetch(`${API_BASE}/inventario/productos`, { headers }),
                fetch(`${API_BASE}/inventario/movimientos`, { headers }),
            ]);

            const dataProductos = await respProductos.json();
            const dataMovimientos = await respMovimientos.json();

            if (dataProductos.ok) {
                const soloProductos = (dataProductos.data || []).filter(
                    (p: Producto) => p.tipo_item === 'PRODUCTO' && p.estado === 'ACTIVO'
                );

                setProductos(soloProductos);
            }

            if (dataMovimientos.ok) {
                setMovimientos(dataMovimientos.data || []);
            }

        } catch (error) {
            console.error('Error cargando movimientos:', error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const productoSeleccionado = useMemo(() => {
        return productos.find(p => String(p.productoId) === String(productoId));
    }, [productos, productoId]);

    const movimientosFiltrados = useMemo(() => {
        const txt = busqueda.toLowerCase();

        return movimientos.filter(m =>
            !txt ||
            m.nombre?.toLowerCase().includes(txt) ||
            m.codigo?.toLowerCase().includes(txt) ||
            m.tipoMovimiento?.toLowerCase().includes(txt) ||
            m.origen?.toLowerCase().includes(txt) ||
            m.referenciaId?.toLowerCase().includes(txt)
        );
    }, [movimientos, busqueda]);

    const registrarMovimiento = async () => {
        if (!productoId) {
            alert('Selecciona un producto');
            return;
        }

        if (!cantidad || Number(cantidad) <= 0) {
            alert('La cantidad debe ser mayor a 0');
            return;
        }

        try {
            setLoading(true);

            const resp = await fetch(`${API_BASE}/inventario/productos/${productoId}/movimiento`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    tipo,
                    cantidad: Number(cantidad),
                    motivo,
                    referencia,
                }),
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo registrar movimiento');
                return;
            }

            alert(`Movimiento registrado. Stock nuevo: ${data.stockNuevo}`);

            setCantidad('');
            setMotivo('');
            setReferencia('');
            setTipo('ENTRADA');
            setProductoId('');

            cargarDatos();

        } catch (error) {
            console.error('Error registrando movimiento:', error);
            alert('Error al registrar movimiento');
        } finally {
            setLoading(false);
        }
    };

    const colorTipo = (tipo: string) => {
        if (tipo === 'ENTRADA') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
        if (tipo === 'SALIDA') return 'bg-red-500/20 text-red-300 border-red-500/40';
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">


            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-slate-900 border border-orange-500/20 rounded-2xl p-6">
                    <h2 className="text-xl font-black text-orange-300 mb-5">
                        Nuevo movimiento
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400">Producto</label>
                            <select
                                value={productoId}
                                onChange={(e) => setProductoId(e.target.value)}
                                className="input"
                            >
                                <option value="">Seleccione producto</option>
                                {productos.map((p) => (
                                    <option key={p.productoId} value={p.productoId}>
                                        {p.codigo} - {p.nombre} | Stock: {p.stock}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {productoSeleccionado && (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <p className="text-slate-400 text-sm">Stock actual</p>
                                <p className="text-3xl font-black text-cyan-300">
                                    {productoSeleccionado.stock}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Stock mínimo: {productoSeleccionado.stock_minimo}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-slate-400">Tipo movimiento</label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as any)}
                                className="input"
                            >
                                <option value="ENTRADA">Entrada - Sumar stock</option>
                                <option value="SALIDA">Salida - Restar stock</option>
                                <option value="AJUSTE">Ajuste - Fijar stock exacto</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">
                                {tipo === 'AJUSTE' ? 'Nuevo stock exacto' : 'Cantidad'}
                            </label>
                            <input
                                type="number"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                className="input"
                                placeholder="Ej: 5"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">Motivo</label>
                            <input
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="input"
                                placeholder="Compra, instalación, corrección..."
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">Referencia</label>
                            <input
                                value={referencia}
                                onChange={(e) => setReferencia(e.target.value)}
                                className="input"
                                placeholder="Factura, orden, técnico..."
                            />
                        </div>

                        <button
                            onClick={registrarMovimiento}
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-black py-3 rounded-xl disabled:opacity-50"
                        >
                            {loading ? 'Registrando...' : 'Registrar movimiento'}
                        </button>
                    </div>
                </div>

                <div className="xl:col-span-2 bg-slate-900 border border-slate-700 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-xl font-black text-white">
                                Historial de movimientos
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Entradas, salidas y ajustes registrados.
                            </p>
                        </div>

                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="input md:max-w-xs"
                            placeholder="Buscar por producto, código o referencia"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-800">
                                    <th className="text-left py-3">Fecha</th>
                                    <th className="text-left py-3">Producto</th>
                                    <th className="text-left py-3">Tipo</th>
                                    <th className="text-left py-3">Cantidad</th>
                                    <th className="text-left py-3">Antes</th>
                                    <th className="text-left py-3">Nuevo</th>
                                    <th className="text-left py-3">Motivo</th>
                                </tr>
                            </thead>

                            <tbody>
                                {movimientosFiltrados.map((m) => (
                                    <tr key={m.movimientoId} className="border-b border-slate-800/60">
                                        <td className="py-3 text-slate-400">
                                            {new Date(m.creadoEn).toLocaleString('es-EC')}
                                        </td>

                                        <td className="py-3">
                                            <p className="font-bold">{m.nombre}</p>
                                            <p className="text-xs text-slate-500">{m.codigo}</p>
                                        </td>

                                        <td className="py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black border ${colorTipo(m.tipoMovimiento)}`}>
                                                {m.tipoMovimiento}
                                            </span>
                                        </td>

                                        <td className="py-3 font-black">{m.cantidad}</td>
                                        <td className="py-3">{m.stockAnterior}</td>
                                        <td className="py-3 text-cyan-300 font-black">{m.stockNuevo}</td>

                                        <td className="py-3 text-slate-400">
                                            {m.observacion || 'Sin observación'}

                                            <div className="text-xs text-slate-500 mt-1">
                                                Origen: {m.origen}
                                            </div>

                                            {m.referenciaId && (
                                                <p className="text-xs text-slate-500">
                                                    Ref: {m.referenciaId}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {movimientosFiltrados.length === 0 && (
                            <div className="text-center text-slate-500 py-10">
                                No hay movimientos registrados.
                            </div>
                        )}
                    </div>
                </div>
            </section>

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
                    border-color: #f97316;
                    box-shadow: 0 0 0 1px #f97316;
                }
            `}</style>
        </main>
    );
}