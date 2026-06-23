"use client";

import { useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";

export default function ImportarInventarioPdfPage() {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [porcentajeGanancia, setPorcentajeGanancia] = useState("25");
    const [stockInicial, setStockInicial] = useState("0");
    const [actualizarExistentes, setActualizarExistentes] = useState(true);
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    const importarPdf = async () => {
        if (!archivo) {
            alert("Seleccione un archivo PDF");
            return;
        }

        try {
            setLoading(true);
            setResultado(null);

            const token = getToken();

            const formData = new FormData();
            formData.append("archivo", archivo);
            formData.append("porcentajeGanancia", porcentajeGanancia);
            formData.append("stockInicial", stockInicial);
            formData.append("actualizarExistentes", String(actualizarExistentes));

            const resp = await fetch(`${API_BASE}/inventario/importar-pdf`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || "No se pudo importar el PDF");
                return;
            }

            setResultado(data.data);
            alert("PDF importado correctamente");
        } catch (error) {
            console.error("Error importarPdf:", error);
            alert("Error al importar PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white">
            <div className="mx-auto max-w-5xl space-y-6">
                <section className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6 shadow-xl">
                    <h1 className="text-2xl font-black text-cyan-300">
                        Importar inventario desde PDF
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Sube listas de precios en PDF. El sistema detecta código,
                        descripción y precio costo.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-xs text-slate-400">
                                Archivo PDF
                            </label>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">
                                % ganancia para precio venta
                            </label>
                            <input
                                type="number"
                                value={porcentajeGanancia}
                                onChange={(e) => setPorcentajeGanancia(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-400">
                                Stock inicial
                            </label>
                            <input
                                type="number"
                                value={stockInicial}
                                onChange={(e) => setStockInicial(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
                            />
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
                            <input
                                type="checkbox"
                                checked={actualizarExistentes}
                                onChange={(e) => setActualizarExistentes(e.target.checked)}
                            />
                            Actualizar productos existentes por código
                        </label>
                    </div>

                    <button
                        onClick={importarPdf}
                        disabled={loading}
                        className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                    >
                        {loading ? "Importando..." : "Importar PDF"}
                    </button>
                </section>

                {resultado && (
                    <section className="rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-6">
                        <h2 className="text-xl font-bold text-emerald-300">
                            Resultado de importación
                        </h2>

                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                            <Card titulo="Detectados" valor={resultado.totalDetectados} />
                            <Card titulo="Creados" valor={resultado.creados} />
                            <Card titulo="Actualizados" valor={resultado.actualizados} />
                            <Card titulo="Omitidos" valor={resultado.omitidos} />
                        </div>

                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-slate-400">
                                    <tr className="border-b border-slate-700">
                                        <th className="py-2 text-left">Código</th>
                                        <th className="py-2 text-left">Producto</th>
                                        <th className="py-2 text-right">Costo</th>
                                        <th className="py-2 text-right">Venta</th>
                                        <th className="py-2 text-left">Categoría</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultado.productos?.map((p: any) => (
                                        <tr key={p.codigo} className="border-b border-slate-800">
                                            <td className="py-2 text-cyan-300">{p.codigo}</td>
                                            <td className="py-2">{p.nombre}</td>
                                            <td className="py-2 text-right">
                                                ${Number(p.precioCosto).toFixed(2)}
                                            </td>
                                            <td className="py-2 text-right text-emerald-300">
                                                ${Number(p.precioVenta).toFixed(2)}
                                            </td>
                                            <td className="py-2">{p.categoria}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

function Card({ titulo, valor }: { titulo: string; valor: any }) {
    return (
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <p className="text-xs text-slate-400">{titulo}</p>
            <p className="mt-1 text-2xl font-black text-white">{valor ?? 0}</p>
        </div>
    );
}