'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    KeyRound,
    Loader2,
    RefreshCw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    UserRound,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Usuario = {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string | null;
    rol: string;
    estado: string;
    cantidadPermisos?: number | string;
};

type Modulo = {
    id: number | string;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    orden?: number;
    activo?: boolean | number;
};

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null;

const ROLES = [
    'TODOS',
    'ADMIN',
    'TECNICO',
    'SERVICIOCLIENTE',
    'CAJERO',
    'CLIENTE',
];

function nombreCompleto(usuario: Usuario) {
    return `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim() || 'Usuario sin nombre';
}

function normalizar(valor: unknown) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function nombreRol(rol: string) {
    const roles: Record<string, string> = {
        ADMIN: 'Administrador',
        TECNICO: 'Técnico',
        SERVICIOCLIENTE: 'Servicio al cliente',
        CAJERO: 'Cajero',
        CLIENTE: 'Cliente',
    };
    return roles[rol] || rol;
}

function estiloRol(rol: string) {
    const estilos: Record<string, string> = {
        ADMIN: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
        TECNICO: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
        SERVICIOCLIENTE: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
        CAJERO: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
        CLIENTE: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    };
    return estilos[rol] || 'border-slate-400/20 bg-slate-400/10 text-slate-300';
}

function extraerIdsPermisos(data: any): string[] {
    const lista = data?.permisos ?? data?.modulos ?? data?.usuario?.permisos ?? [];
    if (!Array.isArray(lista)) return [];

    return lista
        .filter((item: any) => item?.puedeVer === undefined || Boolean(item.puedeVer))
        .map((item: any) => String(item?.moduloId ?? item?.id ?? item))
        .filter(Boolean);
}

async function leerJson(response: Response) {
    const texto = await response.text();
    if (!texto) return {};
    try {
        return JSON.parse(texto);
    } catch {
        throw new Error('El servidor devolvió una respuesta inválida.');
    }
}

export default function PermisosUsuariosPage() {
    const router = useRouter();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [rol, setRol] = useState('TODOS');
    const [estado, setEstado] = useState('TODOS');
    const [usuarioModal, setUsuarioModal] = useState<Usuario | null>(null);
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
    const [cargandoPermisos, setCargandoPermisos] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [busquedaModulo, setBusquedaModulo] = useState('');
    const [aviso, setAviso] = useState<Aviso>(null);

    const headers = useCallback(() => {
        const token = getToken();
        if (!token) throw new Error('No se encontró una sesión activa. Inicia sesión nuevamente.');
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }, []);

    const cargarDatos = useCallback(async (inicial = false) => {
        inicial ? setLoading(true) : setActualizando(true);
        setError('');
        try {
            const cabeceras = headers();
            const [resUsuarios, resModulos] = await Promise.all([
                fetch(`${API_BASE}/permisos/usuarios`, { headers: cabeceras, cache: 'no-store' }),
                fetch(`${API_BASE}/permisos/modulos`, { headers: cabeceras, cache: 'no-store' }),
            ]);
            const [dataUsuarios, dataModulos] = await Promise.all([
                leerJson(resUsuarios),
                leerJson(resModulos),
            ]);

            if (!resUsuarios.ok || dataUsuarios?.ok === false) {
                throw new Error(dataUsuarios?.message || 'No se pudieron cargar los usuarios.');
            }
            if (!resModulos.ok || dataModulos?.ok === false) {
                throw new Error(dataModulos?.message || 'No se pudieron cargar los módulos.');
            }

            setUsuarios(Array.isArray(dataUsuarios?.usuarios) ? dataUsuarios.usuarios : []);
            const listaModulos = Array.isArray(dataModulos?.modulos) ? dataModulos.modulos : [];
            setModulos(
                listaModulos
                    .filter((m: Modulo) => m.activo === undefined || Boolean(m.activo))
                    .sort((a: Modulo, b: Modulo) => (a.orden ?? 0) - (b.orden ?? 0))
            );
        } catch (e: any) {
            setError(e?.message || 'No se pudo cargar la información.');
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    }, [headers]);

    useEffect(() => {
        cargarDatos(true);
    }, [cargarDatos]);

    useEffect(() => {
        if (!aviso) return;
        const timer = window.setTimeout(() => setAviso(null), 4000);
        return () => window.clearTimeout(timer);
    }, [aviso]);

    useEffect(() => {
        if (!usuarioModal) return;
        const cerrar = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !guardando) setUsuarioModal(null);
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', cerrar);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', cerrar);
        };
    }, [usuarioModal, guardando]);

    const usuariosFiltrados = useMemo(() => {
        const texto = normalizar(busqueda);
        return usuarios.filter((usuario) => {
            const coincideTexto = !texto || normalizar(
                `${nombreCompleto(usuario)} ${usuario.email} ${usuario.telefono} ${usuario.rol}`
            ).includes(texto);
            return coincideTexto
                && (rol === 'TODOS' || usuario.rol === rol)
                && (estado === 'TODOS' || usuario.estado === estado);
        });
    }, [usuarios, busqueda, rol, estado]);

    const modulosFiltrados = useMemo(() => {
        const texto = normalizar(busquedaModulo);
        return modulos.filter((modulo) => !texto || normalizar(
            `${modulo.nombre} ${modulo.codigo} ${modulo.descripcion}`
        ).includes(texto));
    }, [modulos, busquedaModulo]);

    async function abrirPermisos(usuario: Usuario) {
        if (usuario.rol === 'ADMIN') return;
        setUsuarioModal(usuario);
        setSeleccionados(new Set());
        setBusquedaModulo('');
        setCargandoPermisos(true);
        try {
            const response = await fetch(`${API_BASE}/permisos/usuarios/${usuario.id}`, {
                headers: headers(),
                cache: 'no-store',
            });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) {
                throw new Error(data?.message || 'No se pudieron consultar los permisos.');
            }
            setSeleccionados(new Set(extraerIdsPermisos(data)));
        } catch (e: any) {
            setAviso({ tipo: 'error', texto: e?.message || 'Error consultando permisos.' });
            setUsuarioModal(null);
        } finally {
            setCargandoPermisos(false);
        }
    }

    function alternarModulo(id: string) {
        setSeleccionados((actuales) => {
            const nuevos = new Set(actuales);
            nuevos.has(id) ? nuevos.delete(id) : nuevos.add(id);
            return nuevos;
        });
    }

    function seleccionarVisibles() {
        setSeleccionados((actuales) => {
            const nuevos = new Set(actuales);
            modulosFiltrados.forEach((modulo) => nuevos.add(String(modulo.id)));
            return nuevos;
        });
    }

    async function guardarPermisos() {
        if (!usuarioModal) return;
        setGuardando(true);
        try {
            const moduloIds = Array.from(seleccionados).map((id) => {
                const numero = Number(id);
                return Number.isNaN(numero) ? id : numero;
            });
            const response = await fetch(`${API_BASE}/permisos/usuarios/${usuarioModal.id}`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ moduloIds }),
            });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) {
                throw new Error(data?.message || 'No se pudieron guardar los permisos.');
            }

            setUsuarios((actuales) => actuales.map((usuario) =>
                usuario.id === usuarioModal.id
                    ? { ...usuario, cantidadPermisos: seleccionados.size }
                    : usuario
            ));
            setAviso({ tipo: 'ok', texto: `Permisos de ${nombreCompleto(usuarioModal)} actualizados.` });
            setUsuarioModal(null);
        } catch (e: any) {
            setAviso({ tipo: 'error', texto: e?.message || 'Error guardando permisos.' });
        } finally {
            setGuardando(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <button onClick={() => router.push('/usuarios')} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                        <ArrowLeft className="h-4 w-4" /> Gestión de usuarios
                    </button>
                    <button onClick={() => cargarDatos(false)} disabled={loading || actualizando} className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-400/15 disabled:opacity-50">
                        <RefreshCw className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''}`} /> Actualizar
                    </button>
                </div>

                <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
                            <KeyRound className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-violet-400">Control de acceso</p>
                            <h1 className="text-3xl font-black sm:text-4xl">Permisos de usuarios</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">Selecciona un usuario y define los módulos que podrá ver dentro del sistema Netcomp RF.</p>
                        </div>
                    </div>
                </section>

                <section className="mb-6 grid gap-4 sm:grid-cols-3">
                    <Resumen titulo="Usuarios" valor={usuarios.length} icono={Users} />
                    <Resumen titulo="Módulos activos" valor={modulos.length} icono={SlidersHorizontal} />
                    <Resumen titulo="Con permisos" valor={usuarios.filter((u) => u.rol === 'ADMIN' || Number(u.cantidadPermisos || 0) > 0).length} icono={ShieldCheck} />
                </section>

                <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nombre, correo o teléfono..." className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm outline-none focus:border-violet-400/40 focus:ring-4 focus:ring-violet-400/10" />
                        </div>
                        <select value={rol} onChange={(e) => setRol(e.target.value)} className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none">
                            {ROLES.map((item) => <option key={item} value={item}>{item === 'TODOS' ? 'Todos los roles' : nombreRol(item)}</option>)}
                        </select>
                        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none">
                            <option value="TODOS">Todos los estados</option>
                            <option value="ACTIVO">Activos</option>
                            <option value="INACTIVO">Inactivos</option>
                        </select>
                        <button onClick={() => { setBusqueda(''); setRol('TODOS'); setEstado('TODOS'); }} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-300 hover:bg-white/10">
                            <XCircle className="h-4 w-4" /> Limpiar
                        </button>
                    </div>
                </section>

                {error && <ErrorCarga mensaje={error} reintentar={() => cargarDatos(true)} />}

                {loading ? (
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                        <Loader2 className="h-10 w-10 animate-spin text-violet-400" /><p className="mt-4 font-bold">Cargando usuarios y módulos...</p>
                    </div>
                ) : !error && usuariosFiltrados.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 text-center">
                        <Users className="h-12 w-12 text-slate-600" /><h2 className="mt-4 text-xl font-black">No encontramos usuarios</h2><p className="mt-2 text-sm text-slate-500">Modifica la búsqueda o los filtros seleccionados.</p>
                    </div>
                ) : !error && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {usuariosFiltrados.map((usuario) => {
                            const admin = usuario.rol === 'ADMIN';
                            return (
                                <article key={usuario.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-black">
                                            {(usuario.nombres?.[0] || 'U')}{usuario.apellidos?.[0] || ''}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="truncate font-black">{nombreCompleto(usuario)}</h2>
                                            <p className="mt-1 truncate text-sm text-slate-400">{usuario.email}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${estiloRol(usuario.rol)}`}>{nombreRol(usuario.rol)}</span>
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${usuario.estado === 'ACTIVO' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>{usuario.estado}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 border-t border-white/[0.07] pt-4">
                                        <p className={`mb-4 flex items-center gap-2 text-sm ${admin ? 'font-bold text-violet-300' : 'text-slate-400'}`}>
                                            {admin ? <ShieldCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4 text-blue-400" />}
                                            {admin ? 'Acceso total automático' : `${Number(usuario.cantidadPermisos || 0)} permisos asignados`}
                                        </p>
                                        <button disabled={admin || usuario.estado !== 'ACTIVO'} onClick={() => abrirPermisos(usuario)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500">
                                            {admin ? <><ShieldCheck className="h-4 w-4" /> Acceso total</> : <><SlidersHorizontal className="h-4 w-4" /> Administrar permisos</>}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {usuarioModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !guardando) setUsuarioModal(null); }}>
                    <section className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-slate-900 sm:rounded-3xl">
                        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
                            <div className="flex min-w-0 gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><UserRound className="h-6 w-6" /></div>
                                <div className="min-w-0"><h2 id="titulo-permisos" className="truncate text-xl font-black">Asignar permisos</h2><p className="mt-1 truncate text-sm text-slate-400">{nombreCompleto(usuarioModal)} · {nombreRol(usuarioModal.rol)}</p></div>
                            </div>
                            <button aria-label="Cerrar" disabled={guardando} onClick={() => setUsuarioModal(null)} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50"><X className="h-5 w-5" /></button>
                        </header>

                        {cargandoPermisos ? (
                            <div className="flex min-h-80 flex-col items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-violet-400" /><p className="mt-3 font-bold">Consultando permisos...</p></div>
                        ) : (
                            <>
                                <div className="border-b border-white/10 p-5 sm:p-6">
                                    <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input value={busquedaModulo} onChange={(e) => setBusquedaModulo(e.target.value)} placeholder="Buscar módulo..." className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-12 pr-4 text-sm outline-none focus:border-violet-400/40" /></div>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-sm text-slate-400"><strong className="text-white">{seleccionados.size}</strong> de {modulos.length} seleccionados</p>
                                        <div className="flex gap-2"><button onClick={seleccionarVisibles} className="rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-400/15">Seleccionar visibles</button><button onClick={() => setSeleccionados(new Set())} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10">Quitar todos</button></div>
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 max-h-[50vh] overflow-y-auto overscroll-contain p-5 sm:p-6">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {modulosFiltrados.map((modulo) => {
                                            const marcado = seleccionados.has(String(modulo.id));
                                            return <button type="button" key={modulo.id} onClick={() => alternarModulo(String(modulo.id))} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${marcado ? 'border-violet-400/40 bg-violet-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                                                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${marcado ? 'border-violet-400 bg-violet-500 text-white' : 'border-slate-600 bg-slate-950'}`}>{marcado && <Check className="h-3.5 w-3.5" />}</span>
                                                <span><span className="block font-bold text-white">{modulo.nombre}</span><span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-violet-300/80">{modulo.codigo}</span>{modulo.descripcion && <span className="mt-2 block text-sm leading-5 text-slate-400">{modulo.descripcion}</span>}</span>
                                            </button>;
                                        })}
                                    </div>
                                    {modulosFiltrados.length === 0 && <p className="py-14 text-center text-sm text-slate-500">No hay módulos que coincidan con la búsqueda.</p>}
                                </div>

                                <footer className="flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/40 p-5 sm:flex-row sm:justify-end sm:p-6">
                                    <button disabled={guardando} onClick={() => setUsuarioModal(null)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10 disabled:opacity-50">Cancelar</button>
                                    <button disabled={guardando} onClick={guardarPermisos} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold hover:bg-violet-500 disabled:opacity-60">{guardando ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="h-4 w-4" /> Guardar permisos</>}</button>
                                </footer>
                            </>
                        )}
                    </section>
                </div>
            )}

            {aviso && <div className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-2xl ${aviso.tipo === 'ok' ? 'border-emerald-400/25 bg-emerald-950 text-emerald-200' : 'border-rose-400/25 bg-rose-950 text-rose-200'}`}>{aviso.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}<p className="text-sm font-semibold">{aviso.texto}</p></div>}
        </main>
    );
}

function Resumen({ titulo, valor, icono: Icono }: { titulo: string; valor: number; icono: React.ElementType }) {
    return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-400">{titulo}</p><p className="mt-2 text-3xl font-black">{valor}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/20"><Icono className="h-6 w-6" /></div></div></article>;
}

function ErrorCarga({ mensaje, reintentar }: { mensaje: string; reintentar: () => void }) {
    return <section className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" /><div className="flex-1"><h2 className="font-bold text-rose-200">No se pudo cargar la información</h2><p className="mt-1 text-sm text-rose-200/70">{mensaje}</p></div><button onClick={reintentar} className="rounded-lg border border-rose-300/20 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-300/10">Reintentar</button></section>;
}