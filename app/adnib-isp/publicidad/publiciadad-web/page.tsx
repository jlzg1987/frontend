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
                    className="block h-auto max-h-[75vh] w-auto max-w-full object-contain"
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
                    className="block h-auto max-h-[75vh] w-auto max-w-full bg-black object-contain"
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
        <div className="w-full bg-slate-950 text-white">
            <section className="relative flex min-h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[320px]">
                <span className="absolute right-3 top-3 z-10 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-semibold text-cyan-200 shadow-md" aria-live="polite">
                    {actual + 1} de {items.length} anuncios
                </span>
                {/* Preservar siempre las proporciones originales del material publicitario. */}
                {renderPublicidad(item)}

                {items.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={anterior}
                            aria-label="Publicidad anterior"
                            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-2xl text-white transition hover:bg-black/85 sm:left-4"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={siguiente}
                            aria-label="Publicidad siguiente"
                            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/65 px-3 py-2 text-2xl text-white transition hover:bg-black/85 sm:right-4"
                        >
                            ›
                        </button>
                    </>
                )}
            </section>

            {/* Los indicadores quedan debajo para no cubrir textos o promociones del arte. */}
            {items.length > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {items.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setActual(index)}
                            aria-label={`Ver publicidad ${index + 1}`}
                            aria-current={index === actual ? "true" : undefined}
                            className={`h-2.5 rounded-full transition-all ${index === actual
                                ? "w-9 bg-cyan-400"
                                : "w-2.5 bg-white/40 hover:bg-white/70"
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
