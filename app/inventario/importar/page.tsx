'use client';

import { API_BASE } from '@/src/lib/api';
import { useState } from 'react';


export default function ImportarInventarioPage() {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    const token = typeof window !== 'undefined'
        ? localStorage.getItem('token')
        : '';

    const descargarPlantilla = () => {
        window.open(`${API_BASE}/inventario/plantilla-excel`, '_blank');
    };

    const importarExcel = async () => {
        if (!archivo) {
            alert('Selecciona un archivo Excel');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', archivo);

        try {
            setLoading(true);
            setResultado(null);

            const resp = await fetch(`${API_BASE}/inventario/importar-excel`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo importar el inventario');
                return;
            }

            setResultado(data);
            setArchivo(null);

        } catch (error) {
            console.error('Error importando inventario:', error);
            alert('Error al importar inventario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">


            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-emerald-500/20 rounded-2xl p-6">
                    <h2 className="text-xl font-black text-white mb-4">
                        Archivo Excel
                    </h2>

                    <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center bg-slate-950">
                        <div className="text-5xl mb-4">📊</div>

                        <p className="text-slate-300 font-bold">
                            Selecciona tu archivo de inventario
                        </p>

                        <p className="text-slate-500 text-sm mt-2">
                            Formatos permitidos: .xlsx, .xls
                        </p>

                        <label className="inline-block mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl cursor-pointer">
                            Elegir archivo
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setArchivo(file);
                                    setResultado(null);
                                }}
                            />
                        </label>

                        {archivo && (
                            <div className="mt-5 bg-slate-900 border border-slate-700 rounded-xl p-4">
                                <p className="text-emerald-300 font-bold">
                                    Archivo seleccionado:
                                </p>
                                <p className="text-slate-300 text-sm mt-1">
                                    {archivo.name}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mt-6">
                        <button
                            onClick={descargarPlantilla}
                            className="flex-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-xl py-3 font-black"
                        >
                            Descargar plantilla Excel
                        </button>

                        <button
                            onClick={importarExcel}
                            disabled={loading || !archivo}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl py-3 font-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Importando...' : 'Importar inventario'}
                        </button>
                    </div>

                    {resultado && (
                        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5">
                            <h3 className="text-emerald-300 font-black text-lg">
                                Importación completada
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="bg-slate-950 rounded-xl p-4">
                                    <p className="text-slate-500 text-sm">Creados</p>
                                    <p className="text-3xl font-black text-emerald-300">
                                        {resultado.creados || 0}
                                    </p>
                                </div>

                                <div className="bg-slate-950 rounded-xl p-4">
                                    <p className="text-slate-500 text-sm">Actualizados</p>
                                    <p className="text-3xl font-black text-blue-300">
                                        {resultado.actualizados || 0}
                                    </p>
                                </div>

                                <div className="bg-slate-950 rounded-xl p-4">
                                    <p className="text-slate-500 text-sm">Errores</p>
                                    <p className="text-3xl font-black text-red-300">
                                        {resultado.errores?.length || 0}
                                    </p>
                                </div>
                            </div>

                            {resultado.errores?.length > 0 && (
                                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                    <p className="text-red-300 font-black mb-2">
                                        Detalles de errores:
                                    </p>

                                    <ul className="text-sm text-red-200 space-y-1">
                                        {resultado.errores.map((err: string, index: number) => (
                                            <li key={index}>• {err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <aside className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-black text-cyan-300 mb-4">
                        Formato requerido
                    </h2>

                    <div className="space-y-3 text-sm text-slate-300">
                        <p>
                            El Excel debe tener estas columnas:
                        </p>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 overflow-x-auto">
                            <p>tipo_item</p>
                            <p>codigo</p>
                            <p>nombre</p>
                            <p>descripcion</p>
                            <p>categoria</p>
                            <p>stock</p>
                            <p>stock_minimo</p>
                            <p>precio_compra</p>
                            <p>precio_venta</p>
                            <p>aplica_iva</p>
                            <p>estado</p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <p className="font-black text-emerald-300">
                                Valores permitidos
                            </p>

                            <p className="mt-2">
                                <b>tipo_item:</b> PRODUCTO o SERVICIO
                            </p>

                            <p>
                                <b>aplica_iva:</b> SI o NO
                            </p>

                            <p>
                                <b>estado:</b> ACTIVO o INACTIVO
                            </p>
                        </div>

                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-200">
                            Si el código ya existe, el sistema actualizará el producto.
                            Si no existe, lo creará nuevo.
                        </div>
                    </div>
                </aside>
            </section>
        </main>
    );
}