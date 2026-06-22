"use client";

import { useEffect, useState } from "react";
import { API_BASE, getToken } from "@/src/lib/api";

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
    publicId: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    prioridad: number;
    activo: number;
    usuarioCreacionId: number | null;
    fechaCreacion: string;
    fechaActualizacion: string;
};

const tipos: TipoPublicidad[] = [
    "IMAGEN",
    "VIDEO",
    "YOUTUBE",
    "TIKTOK",
    "FACEBOOK",
    "INSTAGRAM",
    "X",
];

export default function PublicidadPage() {
    const [publicidades, setPublicidades] = useState<Publicidad[]>([]);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const [editandoId, setEditandoId] = useState<number | null>(null);

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [tipo, setTipo] = useState<TipoPublicidad>("IMAGEN");
    const [url, setUrl] = useState("");
    const [archivo, setArchivo] = useState<File | null>(null);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [prioridad, setPrioridad] = useState(1);
    const [activo, setActivo] = useState(true);

    async function cargarPublicidad() {
        try {
            setCargando(true);

            const res = await fetch(`${API_BASE}/publicidad`, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || "Error al cargar publicidad");
            }

            setPublicidades(data);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarPublicidad();
    }, []);

    function limpiarFormulario() {
        setEditandoId(null);
        setTitulo("");
        setDescripcion("");
        setTipo("IMAGEN");
        setUrl("");
        setArchivo(null);
        setFechaInicio("");
        setFechaFin("");
        setPrioridad(1);
        setActivo(true);
    }

    function cargarParaEditar(item: Publicidad) {
        setEditandoId(item.publicidadId);
        setTitulo(item.titulo || "");
        setDescripcion(item.descripcion || "");
        setTipo(item.tipo);
        setUrl(item.url || "");
        setFechaInicio(item.fechaInicio ? item.fechaInicio.slice(0, 16) : "");
        setFechaFin(item.fechaFin ? item.fechaFin.slice(0, 16) : "");
        setPrioridad(item.prioridad || 1);
        setActivo(Boolean(item.activo));
        setArchivo(null);
    }

    async function guardarPublicidad(e: React.FormEvent) {
        e.preventDefault();

        try {
            setGuardando(true);

            const formData = new FormData();

            formData.append("titulo", titulo);
            formData.append("descripcion", descripcion);
            formData.append("tipo", tipo);
            formData.append("url", url);
            formData.append("fechaInicio", fechaInicio);
            formData.append("fechaFin", fechaFin);
            formData.append("prioridad", String(prioridad));
            formData.append("activo", activo ? "1" : "0");

            if (archivo) {
                formData.append("archivo", archivo);
            }

            const endpoint = editandoId
                ? `${API_BASE}/publicidad/${editandoId}`
                : `${API_BASE}/publicidad`;

            const method = editandoId ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || "Error al guardar publicidad");
            }

            alert(data.mensaje || "Publicidad guardada correctamente");

            limpiarFormulario();
            await cargarPublicidad();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setGuardando(false);
        }
    }

    async function cambiarEstado(item: Publicidad) {
        try {
            const res = await fetch(
                `${API_BASE}/publicidad/${item.publicidadId}/estado`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        activo: item.activo ? 0 : 1,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || "Error al cambiar estado");
            }

            await cargarPublicidad();
        } catch (error: any) {
            alert(error.message);
        }
    }

    async function eliminarPublicidad(id: number) {
        const ok = confirm("¿Seguro que deseas eliminar esta publicidad?");
        if (!ok) return;

        try {
            const res = await fetch(`${API_BASE}/publicidad/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.mensaje || "Error al eliminar publicidad");
            }

            await cargarPublicidad();
        } catch (error: any) {
            alert(error.message);
        }
    }

    function esArchivoLocal() {
        return tipo === "IMAGEN" || tipo === "VIDEO";
    }

    function renderPreview(item: Publicidad) {
        if (item.tipo === "IMAGEN") {
            return (
                <img
                    src={item.url}
                    alt={item.titulo}
                    className="h-36 w-full rounded-xl object-cover"
                />
            );
        }

        if (item.tipo === "VIDEO") {
            return (
                <video
                    src={item.url}
                    controls
                    className="h-36 w-full rounded-xl bg-black object-cover"
                />
            );
        }

        return (
            <div className="flex h-36 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-center text-sm text-slate-300">
                <div>
                    <div className="text-3xl">🔗</div>
                    <p className="mt-2 font-semibold">{item.tipo}</p>
                    <a
                        href={item.url}
                        target="_blank"
                        className="mt-1 block text-cyan-400 hover:underline"
                    >
                        Abrir enlace
                    </a>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white">
            <section className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-black text-pink-400">
                            📢 Publicidad
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Administra banners, videos, anuncios y enlaces promocionales.
                        </p>
                    </div>

                    <button
                        onClick={limpiarFormulario}
                        className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
                    >
                        Nueva publicidad
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
                    <form
                        onSubmit={guardarPublicidad}
                        className="rounded-2xl border border-pink-500/30 bg-slate-900 p-5 shadow-lg"
                    >
                        <h2 className="mb-4 text-xl font-bold">
                            {editandoId ? "Editar publicidad" : "Crear publicidad"}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-slate-300">
                                    Título
                                </label>
                                <input
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-pink-400"
                                    placeholder="Ej: Promo internet fibra"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-slate-300">
                                    Descripción
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-pink-400"
                                    placeholder="Detalle corto de la publicidad"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm text-slate-300">
                                    Tipo
                                </label>
                                <select
                                    value={tipo}
                                    onChange={(e) =>
                                        setTipo(e.target.value as TipoPublicidad)
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-pink-400"
                                >
                                    {tipos.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {esArchivoLocal() ? (
                                <div>
                                    <label className="mb-1 block text-sm text-slate-300">
                                        Archivo imagen/video
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={(e) =>
                                            setArchivo(e.target.files?.[0] || null)
                                        }
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                                    />

                                    {editandoId && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Si no seleccionas archivo, se conserva el actual.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-1 block text-sm text-slate-300">
                                        URL externa
                                    </label>
                                    <input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-pink-400"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            {esArchivoLocal() && editandoId && (
                                <div>
                                    <label className="mb-1 block text-sm text-slate-300">
                                        URL actual
                                    </label>
                                    <input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-pink-400"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm text-slate-300">
                                        Fecha inicio
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-pink-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm text-slate-300">
                                        Fecha fin
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-pink-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm text-slate-300">
                                        Prioridad
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={prioridad}
                                        onChange={(e) =>
                                            setPrioridad(Number(e.target.value))
                                        }
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-pink-400"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
                                        <span className="text-sm text-slate-300">
                                            Activo
                                        </span>
                                        <input
                                            type="checkbox"
                                            checked={activo}
                                            onChange={(e) =>
                                                setActivo(e.target.checked)
                                            }
                                            className="h-5 w-5"
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                disabled={guardando}
                                className="w-full rounded-xl bg-pink-500 px-4 py-3 font-bold text-white hover:bg-pink-600 disabled:opacity-60"
                            >
                                {guardando
                                    ? "Guardando..."
                                    : editandoId
                                        ? "Actualizar publicidad"
                                        : "Guardar publicidad"}
                            </button>

                            {editandoId && (
                                <button
                                    type="button"
                                    onClick={limpiarFormulario}
                                    className="w-full rounded-xl bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600"
                                >
                                    Cancelar edición
                                </button>
                            )}
                        </div>
                    </form>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Listado</h2>
                            <span className="text-sm text-slate-400">
                                {publicidades.length} registros
                            </span>
                        </div>

                        {cargando ? (
                            <div className="rounded-xl bg-slate-950 p-6 text-center text-slate-400">
                                Cargando publicidad...
                            </div>
                        ) : publicidades.length === 0 ? (
                            <div className="rounded-xl bg-slate-950 p-6 text-center text-slate-400">
                                No hay publicidad registrada.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {publicidades.map((item) => (
                                    <article
                                        key={item.publicidadId}
                                        className="rounded-2xl border border-slate-700 bg-slate-950 p-4"
                                    >
                                        {renderPreview(item)}

                                        <div className="mt-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-white">
                                                    {item.titulo}
                                                </h3>

                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-bold ${item.activo
                                                            ? "bg-emerald-500/20 text-emerald-300"
                                                            : "bg-red-500/20 text-red-300"
                                                        }`}
                                                >
                                                    {item.activo ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>

                                            <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                                                {item.descripcion || "Sin descripción"}
                                            </p>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                                                <div className="rounded-lg bg-slate-900 p-2">
                                                    Tipo:{" "}
                                                    <span className="font-bold text-pink-300">
                                                        {item.tipo}
                                                    </span>
                                                </div>

                                                <div className="rounded-lg bg-slate-900 p-2">
                                                    Prioridad:{" "}
                                                    <span className="font-bold text-cyan-300">
                                                        {item.prioridad}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => cargarParaEditar(item)}
                                                    className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    onClick={() => cambiarEstado(item)}
                                                    className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-400"
                                                >
                                                    {item.activo
                                                        ? "Desactivar"
                                                        : "Activar"}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        eliminarPublicidad(
                                                            item.publicidadId
                                                        )
                                                    }
                                                    className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </section>
        </main>
    );
}