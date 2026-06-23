"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";



export default function ProductosDestacados() {
    const [productos, setProductos] = useState<any[]>([]);

    useEffect(() => {
        cargar();
    }, []);

    async function cargar() {
        try {
            const res = await fetch(
                `${API_BASE}/tienda-publica/productos-destacados`
            );

            const data = await res.json();

            setProductos(data.productos || []);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <section className="py-20 px-6">
            <div className="mx-auto max-w-7xl">

                <div className="mb-12 text-center">
                    <h2 className="text-4xl font-black text-white">
                        🛒 Productos Destacados
                    </h2>

                    <p className="mt-3 text-slate-400">
                        Equipos tecnológicos seleccionados para ti.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                    {productos.map((producto) => (
                        <div
                            key={producto.productoId}
                            className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900 transition hover:-translate-y-2 hover:border-cyan-400"
                        >
                            <div className="aspect-square bg-slate-800">
                                <img
                                    src={
                                        producto.imagen_url ||
                                        "/producto-default.png"
                                    }
                                    alt={producto.nombre}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div className="p-4">
                                <h3 className="line-clamp-2 font-bold text-white">
                                    {producto.nombre}
                                </h3>

                                <p className="mt-1 text-xs text-cyan-300">
                                    {producto.categoria}
                                </p>

                                <p className="mt-3 text-2xl font-black text-cyan-400">
                                    $
                                    {Number(
                                        producto.precio_venta
                                    ).toFixed(2)}
                                </p>

                                <a
                                    href="/inventario/tienda"
                                    className="mt-4 block rounded-xl bg-cyan-500 px-4 py-3 text-center font-bold text-slate-950 transition hover:bg-cyan-400"
                                >
                                    Ver producto
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <a
                        href="/inventario/tienda"
                        className="inline-flex rounded-full bg-cyan-500 px-8 py-4 font-bold text-slate-950 transition hover:scale-105"
                    >
                        Ver tienda completa →
                    </a>
                </div>
            </div>
        </section>
    );
}