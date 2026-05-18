'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';



type FormaPago = {
    formaPagoId: number;
    nombre: string;
    descripcion: string | null;
    activo: number;
};

export default function FormasPagoPage() {
    const [formasPago, setFormasPago] = useState<FormaPago[]>([]);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [editando, setEditando] = useState<FormaPago | null>(null);
    const [loading, setLoading] = useState(false);
    const [incluirInactivos, setIncluirInactivos] = useState(true);

    useEffect(() => {
        cargarFormasPago();
    }, [incluirInactivos]);

    async function cargarFormasPago() {
        try {
            setLoading(true);

            const url = incluirInactivos
                ? `${API_BASE}/facturacion/config/formas-pago?incluirInactivos=1`
                : `${API_BASE}/facturacion/config/formas-pago`;

            const resp = await fetch(url);
            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error cargando formas de pago');
                return;
            }

            setFormasPago(data.data || []);
        } catch (error) {
            console.error(error);
            alert('Error cargando formas de pago');
        } finally {
            setLoading(false);
        }
    }

    async function guardarFormaPago() {
        if (!nombre.trim()) {
            alert('Ingrese el nombre');
            return;
        }

        try {
            setLoading(true);

            const url = editando
                ? `${API_BASE}/facturacion/config/formas-pago/${editando.formaPagoId}`
                : `${API_BASE}/facturacion/config/formas-pago`;

            const method = editando ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    descripcion
                })
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error guardando forma de pago');
                return;
            }

            alert(data.message || 'Guardado correctamente');
            limpiarFormulario();
            cargarFormasPago();

        } catch (error) {
            console.error(error);
            alert('Error guardando forma de pago');
        } finally {
            setLoading(false);
        }
    }

    function editarFormaPago(fp: FormaPago) {
        setEditando(fp);
        setNombre(fp.nombre || '');
        setDescripcion(fp.descripcion || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function eliminarFormaPago(fp: FormaPago) {
        const ok = confirm(`¿Eliminar la forma de pago ${fp.nombre}?`);

        if (!ok) return;

        try {
            setLoading(true);

            const resp = await fetch(`${API_BASE}/facturacion/config/formas-pago/${fp.formaPagoId}`, {
                method: 'DELETE'
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo eliminar');
                return;
            }

            alert(data.message || 'Eliminado correctamente');
            cargarFormasPago();

        } catch (error) {
            console.error(error);
            alert('Error eliminando forma de pago');
        } finally {
            setLoading(false);
        }
    }

    async function cambiarEstado(fp: FormaPago) {
        try {
            const nuevoEstado = fp.activo === 1 ? false : true;

            const resp = await fetch(`${API_BASE}/facturacion/config/formas-pago/${fp.formaPagoId}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activo: nuevoEstado
                })
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo cambiar el estado');
                return;
            }

            cargarFormasPago();

        } catch (error) {
            console.error(error);
            alert('Error cambiando estado');
        }
    }

    function limpiarFormulario() {
        setEditando(null);
        setNombre('');
        setDescripcion('');
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-6xl mx-auto">



                <section className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5 shadow-lg shadow-cyan-500/10 mb-6">
                    <h2 className="text-xl font-bold mb-4">
                        {editando ? 'Editar forma de pago' : 'Nueva forma de pago'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-300">Nombre</label>
                            <input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="EFECTIVO, TRANSFERENCIA..."
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">Descripción</label>
                            <input
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Descripción opcional"
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mt-5">
                        <button
                            onClick={guardarFormaPago}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold px-5 py-2 rounded-xl"
                        >
                            {editando ? 'Actualizar' : 'Guardar'}
                        </button>

                        {editando && (
                            <button
                                onClick={limpiarFormulario}
                                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold px-5 py-2 rounded-xl"
                            >
                                Cancelar edición
                            </button>
                        )}
                    </div>
                </section>

                <section className="bg-slate-900 border border-cyan-500/20 rounded-2xl shadow-lg shadow-cyan-500/10 overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">Listado</h2>
                            <p className="text-sm text-slate-400">
                                {formasPago.length} forma(s) de pago
                            </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={incluirInactivos}
                                onChange={(e) => setIncluirInactivos(e.target.checked)}
                            />
                            Ver inactivos
                        </label>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3 text-left">Nombre</th>
                                    <th className="px-4 py-3 text-left">Descripción</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {formasPago.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                                            No hay formas de pago registradas.
                                        </td>
                                    </tr>
                                )}

                                {formasPago.map((fp) => (
                                    <tr
                                        key={fp.formaPagoId}
                                        className="border-t border-slate-800 hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-4 font-bold text-cyan-300">
                                            {fp.nombre}
                                        </td>

                                        <td className="px-4 py-4 text-slate-300">
                                            {fp.descripcion || '-'}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <span
                                                className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${fp.activo === 1
                                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                    : 'bg-red-500/15 text-red-300 border-red-500/30'
                                                    }`}
                                            >
                                                {fp.activo === 1 ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex flex-col md:flex-row justify-center gap-2">
                                                <button
                                                    onClick={() => editarFormaPago(fp)}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-2 rounded-lg"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() => cambiarEstado(fp)}
                                                    className={
                                                        fp.activo === 1
                                                            ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-3 py-2 rounded-lg'
                                                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-lg'
                                                    }
                                                >
                                                    {fp.activo === 1 ? 'Desactivar' : 'Activar'}
                                                </button>

                                                <button
                                                    onClick={() => eliminarFormaPago(fp)}
                                                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-2 rounded-lg"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </main>
    );
}