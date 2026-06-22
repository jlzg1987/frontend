"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/src/lib/api";

type TipoPublicidad =
    | "IMAGEN"
    | "VIDEO"
    | "YOUTUBE"
    | "TIKTOK"
    | "FACEBOOK"
    | "INSTAGRAM"
    | "X";

type Publicidad = {
    publicidadId: number;
    titulo: string;
    descripcion: string | null;
    tipo: TipoPublicidad;
    url: string;
    fechaInicio: string | null;
    fechaFin: string | null;
    prioridad: number;
};

export default function PublicidadWebPage() {
    const [items, setItems] = useState<Publicidad[]>([]);
    const [actual, setActual] = useState(0);
    const [cargando, setCargando] = useState(true);

    async function cargarPublicidad() {
        try {
            setCargando(true);

            const res = await fetch(`${API_BASE}/publicidad/publicas/web`, {
                cache: "no-store",
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || "Error al cargar publicidad");
            }

            setItems(data);
        } catch (error) {
            console.error("Error cargarPublicidad:", error);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarPublicidad();
    }, []);

    useEffect(() => {
        if (items.length <= 1) return;

        const timer = setInterval(() => {
            setActual((prev) => (prev + 1) % items.length);
        }, 6000);

        return () => clearInterval(timer);
    }, [items]);

    function siguiente() {
        setActual((prev) => (prev + 1) % items.length);
    }

    function anterior() {
        setActual((prev) => (prev - 1 + items.length) % items.length);
    }

    function renderPublicidad(item: Publicidad) {
        if (item.tipo === "IMAGEN") {
            return (
                <img
                    src={item.url}
                    alt={item.titulo}
                    className="h-full w-full object-cover"
                />
            );
        }

        if (item.tipo === "VIDEO") {
            return (
                <video
                    src={item.url}
                    controls
                    autoPlay
                    muted
                    loop
                    className="h-full w-full bg-black object-cover"
                />
            );
        }

        return (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-pink-950 to-slate-950 p-8 text-center">
                <div>
                    <div className="mb-4 text-6xl">🔗</div>

                    <h2 className="text-3xl font-black text-white">
                        {item.titulo}
                    </h2>

                    {item.descripcion && (
                        <p className="mx-auto mt-3 max-w-xl text-slate-300">
                            {item.descripcion}
                        </p>
                    )}

                    <a
                        href={item.url}
                        target="_blank"
                        className="mt-6 inline-block rounded-full bg-pink-500 px-8 py-3 font-bold text-white hover:bg-pink-600"
                    >
                        Ver publicación
                    </a>

                    <p className="mt-4 text-sm uppercase tracking-widest text-pink-300">
                        {item.tipo}
                    </p>
                </div>
            </div>
        );
    }

    if (cargando) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                Cargando publicidad...
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
                No hay publicidad disponible.
            </main>
        );
    }

    const item = items[actual];

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <section className="relative h-screen w-full overflow-hidden">
                {renderPublicidad(item)}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

                <div className="absolute bottom-12 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-6 text-center">
                    {(item.tipo === "IMAGEN" || item.tipo === "VIDEO") && (
                        <>
                            <h1 className="text-4xl font-black md:text-6xl">
                                {item.titulo}
                            </h1>

                            {item.descripcion && (
                                <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-200">
                                    {item.descripcion}
                                </p>
                            )}
                        </>
                    )}

                    <div className="mt-6 flex justify-center gap-2">
                        {items.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActual(index)}
                                className={`h-3 rounded-full transition-all ${index === actual
                                        ? "w-10 bg-pink-500"
                                        : "w-3 bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {items.length > 1 && (
                    <>
                        <button
                            onClick={anterior}
                            className="absolute left-5 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/50 px-4 py-3 text-2xl hover:bg-black/70"
                        >
                            ‹
                        </button>

                        <button
                            onClick={siguiente}
                            className="absolute right-5 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/50 px-4 py-3 text-2xl hover:bg-black/70"
                        >
                            ›
                        </button>
                    </>
                )}
            </section>
        </main>
    );
}