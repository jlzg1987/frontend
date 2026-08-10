'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import {
    ArrowLeft,
    CheckCircle2,
    Edit3,
    Eye,
    EyeOff,
    LayoutList,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Modulo = {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    orden: number;
    activo: boolean;
    created_at?: string;
    cantidadUsuarios?: number;
    cantidadRoles?: number;
};

type Formulario = {
    codigo: string;
    nombre: string;
    descripcion: string;
    orden: string;
    activo: boolean;
};

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null;

const FORMULARIO_VACIO: Formulario = {
    codigo: '',
    nombre: '',
    descripcion: '',
    orden: '',
    activo: true,
};

async function leerJson(response: Response) {
    const texto = await response.text();
    if (!texto) return {};
    try {
        return JSON.parse(texto);
    } catch {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }
}

function normalizar(valor: unknown) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export default function AdministrarMenuPage() {
    const router = useRouter();
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [procesandoId, setProcesandoId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [estado, setEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState<Modulo | null>(null);
    const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
    const [eliminando, setEliminando] = useState<Modulo | null>(null);
    const [aviso, setAviso] = useState<Aviso>(null);

    const headers = useCallback(() => {
        const token = getToken();
        if (!token) throw new Error('No se encontró una sesión activa.');
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }, []);

    const cargarModulos = useCallback(async (inicial = false) => {
        inicial ? setLoading(true) : setActualizando(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/permisos/modulos-admin`, {
                headers: headers(),
                cache: 'no-store',
            });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) {
                throw new Error(data?.message || 'No se pudieron cargar las opciones del menú.');
            }
            const lista = Array.isArray(data?.modulos) ? data.modulos : [];
            setModulos(lista.map((item: any) => ({
                ...item,
                id: Number(item.id),
                orden: Number(item.orden || 0),
                activo: Boolean(item.activo),
                cantidadUsuarios: Number(item.cantidadUsuarios || 0),
                cantidadRoles: Number(item.cantidadRoles || 0),
            })));
        } catch (e: any) {
            setError(e?.message || 'No se pudo cargar la información.');
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    }, [headers]);

    useEffect(() => { cargarModulos(true); }, [cargarModulos]);

    useEffect(() => {
        if (!aviso) return;
        const timer = window.setTimeout(() => setAviso(null), 4000);
        return () => window.clearTimeout(timer);
    }, [aviso]);

    useEffect(() => {
        if (!modalAbierto && !eliminando) return;
        const cerrar = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || guardando || procesandoId !== null) return;
            setModalAbierto(false);
            setEliminando(null);
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', cerrar);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', cerrar);
        };
    }, [modalAbierto, eliminando, guardando, procesandoId]);

    const filtrados = useMemo(() => {
        const texto = normalizar(busqueda);
        return modulos
            .filter((modulo) => {
                const coincide = !texto || normalizar(
                    `${modulo.nombre} ${modulo.codigo} ${modulo.descripcion}`
                ).includes(texto);
                const coincideEstado = estado === 'TODOS'
                    || (estado === 'ACTIVOS' && modulo.activo)
                    || (estado === 'INACTIVOS' && !modulo.activo);
                return coincide && coincideEstado;
            })
            .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
    }, [modulos, busqueda, estado]);

    function abrirCrear() {
        const siguienteOrden = Math.max(0, ...modulos.map((m) => m.orden)) + 1;
        setEditando(null);
        setFormulario({ ...FORMULARIO_VACIO, orden: String(siguienteOrden) });
        setModalAbierto(true);
    }

    function abrirEditar(modulo: Modulo) {
        setEditando(modulo);
        setFormulario({
            codigo: modulo.codigo,
            nombre: modulo.nombre,
            descripcion: modulo.descripcion || '',
            orden: String(modulo.orden),
            activo: modulo.activo,
        });
        setModalAbierto(true);
    }

    function cambiarFormulario(campo: keyof Formulario, valor: string | boolean) {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    }

    async function guardarModulo(event: FormEvent) {
        event.preventDefault();
        if (!formulario.codigo.trim() || !formulario.nombre.trim()) {
            setAviso({ tipo: 'error', texto: 'Completa el código y el nombre.' });
            return;
        }
        const orden = Number(formulario.orden);
        if (!Number.isInteger(orden) || orden < 1) {
            setAviso({ tipo: 'error', texto: 'El orden debe ser un entero mayor que cero.' });
            return;
        }

        setGuardando(true);
        try {
            const url = editando
                ? `${API_BASE}/permisos/modulos-admin/${editando.id}`
                : `${API_BASE}/permisos/modulos-admin`;
            const response = await fetch(url, {
                method: editando ? 'PUT' : 'POST',
                headers: headers(),
                body: JSON.stringify({
                    codigo: formulario.codigo,
                    nombre: formulario.nombre,
                    descripcion: formulario.descripcion,
                    orden,
                    activo: formulario.activo,
                }),
            });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) {
                throw new Error(data?.message || 'No se pudo guardar la opción del menú.');
            }
            const recibido = data.modulo as Modulo;
            setModulos((actuales) => editando
                ? actuales.map((item) => item.id === editando.id ? { ...item, ...recibido, activo: Boolean(recibido.activo) } : item)
                : [...actuales, { ...recibido, activo: Boolean(recibido.activo) }]
            );
            setModalAbierto(false);
            setAviso({ tipo: 'ok', texto: editando ? 'Opción actualizada correctamente.' : 'Opción creada correctamente.' });
        } catch (e: any) {
            setAviso({ tipo: 'error', texto: e?.message || 'Error guardando la opción.' });
        } finally {
            setGuardando(false);
        }
    }

    async function cambiarEstado(modulo: Modulo) {
        setProcesandoId(modulo.id);
        try {
            const response = await fetch(`${API_BASE}/permisos/modulos-admin/${modulo.id}/estado`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify({ activo: !modulo.activo }),
            });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) {
                throw new Error(data?.message || 'No se pudo cambiar el estado.');
            }
            setModulos((actuales) => actuales.map((item) =>
                item.id === modulo.id ? { ...item, activo: !modulo.activo } : item
            ));
            setAviso({ tipo: 'ok', texto: !modulo.activo ? 'Opción activada.' : 'Opción desactivada.' });
        } catch (e: any) {
            setAviso({ tipo: 'error', texto: e?.message || 'Error cambiando el estado.' });
        } finally {
            setProcesandoId(null);
        }
    }

    async function confirmarEliminar() {
        if (!eliminando) return;
        setProcesandoId(eliminando.id);
        try {
            const response = await fetch(`${API_BASE}/permisos/modulos-admin/${eliminando.id}`, {
                method: 'DELETE',
                headers: headers(),
            });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) {
                throw new Error(data?.message || 'No se pudo eliminar la opción.');
            }
            setModulos((actuales) => actuales.filter((item) => item.id !== eliminando.id));
            setEliminando(null);
            setAviso({ tipo: 'ok', texto: 'Opción eliminada correctamente.' });
        } catch (e: any) {
            setAviso({ tipo: 'error', texto: e?.message || 'Error eliminando la opción.' });
        } finally {
            setProcesandoId(null);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <button onClick={() => router.back()} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10">
                        <ArrowLeft className="h-4 w-4" /> Volver
                    </button>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => cargarModulos(false)} disabled={loading || actualizando} className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-300 disabled:opacity-50">
                            <RefreshCw className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''}`} /> Actualizar
                        </button>
                        <button onClick={abrirCrear} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black hover:bg-amber-500">
                            <Plus className="h-4 w-4" /> Nueva opción
                        </button>
                    </div>
                </div>

                <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20"><LayoutList className="h-8 w-8" /></div>
                        <div><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-amber-400">Configuración del sistema</p><h1 className="text-3xl font-black sm:text-4xl">Menú lateral</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">Crea, edita, ordena y controla las opciones disponibles en el menú del sistema.</p></div>
                    </div>
                </section>

                <section className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_220px]">
                    <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, código o descripción..." className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-12 pr-4 text-sm outline-none focus:border-amber-400/40" /></div>
                    <select value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className="h-12 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm font-semibold outline-none focus:border-amber-400/40"><option value="TODOS">Todos los estados</option><option value="ACTIVOS">Solo activos</option><option value="INACTIVOS">Solo inactivos</option></select>
                </section>

                {error && <section className="mb-6 flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5"><XCircle className="h-5 w-5 shrink-0 text-rose-400" /><div className="flex-1"><h2 className="font-bold text-rose-200">No se pudo cargar el menú</h2><p className="mt-1 text-sm text-rose-200/70">{error}</p></div><button onClick={() => cargarModulos(true)} className="text-xs font-bold text-rose-200">Reintentar</button></section>}

                {loading ? <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]"><Loader2 className="h-10 w-10 animate-spin text-amber-400" /><p className="mt-4 font-bold">Cargando menú lateral...</p></div> : !error && (
                    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Orden</th><th className="px-5 py-4">Opción</th><th className="px-5 py-4">Código</th><th className="px-5 py-4">Asignaciones</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr></thead>
                                <tbody className="divide-y divide-white/[0.07]">
                                    {filtrados.map((modulo) => <tr key={modulo.id} className="hover:bg-white/[0.03]"><td className="px-5 py-4"><span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-white/5 px-3 font-black text-amber-300">{modulo.orden}</span></td><td className="px-5 py-4"><p className="font-bold">{modulo.nombre}</p><p className="mt-1 max-w-md text-sm text-slate-500">{modulo.descripcion || 'Sin descripción'}</p></td><td className="px-5 py-4"><code className="rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-cyan-300">{modulo.codigo}</code></td><td className="px-5 py-4 text-sm text-slate-400"><p>{modulo.cantidadRoles || 0} roles</p><p>{modulo.cantidadUsuarios || 0} usuarios</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${modulo.activo ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-400/20 bg-slate-400/10 text-slate-400'}`}>{modulo.activo ? 'Activo' : 'Inactivo'}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button title="Editar" onClick={() => abrirEditar(modulo)} className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2.5 text-blue-300 hover:bg-blue-400/20"><Edit3 className="h-4 w-4" /></button><button title={modulo.activo ? 'Desactivar' : 'Activar'} disabled={procesandoId === modulo.id} onClick={() => cambiarEstado(modulo)} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5 text-amber-300 hover:bg-amber-400/20 disabled:opacity-50">{procesandoId === modulo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : modulo.activo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button title="Eliminar" onClick={() => setEliminando(modulo)} className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-2.5 text-rose-300 hover:bg-rose-400/20"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}
                                </tbody>
                            </table>
                        </div>
                        {!filtrados.length && <div className="px-6 py-16 text-center"><LayoutList className="mx-auto h-10 w-10 text-slate-600" /><p className="mt-4 font-bold text-slate-300">No se encontraron opciones</p><p className="mt-1 text-sm text-slate-500">Cambia los filtros o crea una nueva opción.</p></div>}
                        <footer className="border-t border-white/10 px-5 py-4 text-sm text-slate-400">Mostrando <strong className="text-white">{filtrados.length}</strong> de {modulos.length} opciones</footer>
                    </section>
                )}
            </div>

            {modalAbierto && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !guardando) setModalAbierto(false); }}><form onSubmit={guardarModulo} className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"><header className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6"><div><h2 className="text-xl font-black">{editando ? 'Editar opción' : 'Crear opción del menú'}</h2><p className="mt-1 text-sm text-slate-400">El código identifica la vista y se guardará en mayúsculas.</p></div><button type="button" disabled={guardando} onClick={() => setModalAbierto(false)} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10"><X className="h-5 w-5" /></button></header><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-300">Código *</span><input required maxLength={60} value={formulario.codigo} onChange={(e) => cambiarFormulario('codigo', e.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="EJ: REPORTES" className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 font-mono text-sm uppercase outline-none focus:border-amber-400/40" /></label><label className="block"><span className="mb-2 block text-sm font-bold text-slate-300">Nombre *</span><input required maxLength={100} value={formulario.nombre} onChange={(e) => cambiarFormulario('nombre', e.target.value)} placeholder="Ej: Reportes" className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm outline-none focus:border-amber-400/40" /></label></div><label className="block"><span className="mb-2 block text-sm font-bold text-slate-300">Descripción</span><textarea maxLength={255} rows={4} value={formulario.descripcion} onChange={(e) => cambiarFormulario('descripcion', e.target.value)} placeholder="Describe qué permite hacer esta opción..." className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 p-4 text-sm outline-none focus:border-amber-400/40" /><span className="mt-1 block text-right text-xs text-slate-500">{formulario.descripcion.length}/255</span></label><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold text-slate-300">Orden *</span><input required min={1} step={1} type="number" value={formulario.orden} onChange={(e) => cambiarFormulario('orden', e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-4 text-sm outline-none focus:border-amber-400/40" /></label><label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950 p-4"><span><span className="block text-sm font-bold">Opción activa</span><span className="mt-1 block text-xs text-slate-500">Disponible para asignar y mostrar.</span></span><input type="checkbox" checked={formulario.activo} onChange={(e) => cambiarFormulario('activo', e.target.checked)} className="h-5 w-5 accent-amber-500" /></label></div></div><footer className="flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/40 p-5 sm:flex-row sm:justify-end"><button type="button" disabled={guardando} onClick={() => setModalAbierto(false)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300">Cancelar</button><button disabled={guardando} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black hover:bg-amber-500 disabled:opacity-60">{guardando ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4" /> {editando ? 'Guardar cambios' : 'Crear opción'}</>}</button></footer></form></div>}

            {eliminando && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && procesandoId === null) setEliminando(null); }}><section className="w-full max-w-md rounded-3xl border border-rose-400/20 bg-slate-900 p-6 shadow-2xl"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300"><Trash2 className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-black">¿Eliminar {eliminando.nombre}?</h2><p className="mt-3 text-sm leading-6 text-slate-400">También se eliminarán sus asignaciones en roles y usuarios. Esta acción no se puede deshacer.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button disabled={procesandoId !== null} onClick={() => setEliminando(null)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300">Cancelar</button><button disabled={procesandoId !== null} onClick={confirmarEliminar} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black hover:bg-rose-500 disabled:opacity-60">{procesandoId !== null ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</> : <><Trash2 className="h-4 w-4" /> Sí, eliminar</>}</button></div></section></div>}

            {aviso && <div className={`fixed bottom-5 right-5 z-[60] flex max-w-sm gap-3 rounded-2xl border p-4 shadow-2xl ${aviso.tipo === 'ok' ? 'border-emerald-400/25 bg-emerald-950 text-emerald-200' : 'border-rose-400/25 bg-rose-950 text-rose-200'}`}>{aviso.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}<p className="text-sm font-semibold">{aviso.texto}</p></div>}
        </main>
    );
}