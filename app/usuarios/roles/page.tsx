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
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Modulo = {
    id: number | string;
    codigo: string;
    nombre: string;
    descripcion?: string | null;
    orden?: number;
    activo?: boolean | number;
};

type Rol = {
    codigo: string;
    nombre: string;
    descripcion: string;
    cantidadUsuarios: number;
    cantidadPermisos: number;
    accesoTotal?: boolean;
};

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null;

const ROLES_BASE: Rol[] = [
    { codigo: 'ADMIN', nombre: 'Administrador', descripcion: 'Acceso completo a todos los módulos y configuraciones.', cantidadUsuarios: 0, cantidadPermisos: 0, accesoTotal: true },
    { codigo: 'TECNICO', nombre: 'Técnico', descripcion: 'Personal encargado de instalaciones, soporte y operaciones técnicas.', cantidadUsuarios: 0, cantidadPermisos: 0 },
    { codigo: 'SERVICIOCLIENTE', nombre: 'Servicio al cliente', descripcion: 'Atención, seguimiento y gestión de solicitudes de clientes.', cantidadUsuarios: 0, cantidadPermisos: 0 },
    { codigo: 'CAJERO', nombre: 'Cajero', descripcion: 'Gestión de cobros, pagos y tareas relacionadas con caja.', cantidadUsuarios: 0, cantidadPermisos: 0 },
    { codigo: 'CLIENTE', nombre: 'Cliente', descripcion: 'Acceso exclusivo a las funciones habilitadas para clientes.', cantidadUsuarios: 0, cantidadPermisos: 0 },
];

function normalizar(valor: unknown) {
    return String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function leerJson(response: Response) {
    const texto = await response.text();
    if (!texto) return {};
    try { return JSON.parse(texto); } catch { throw new Error('El servidor devolvió una respuesta inválida.'); }
}

function extraerIds(data: any): string[] {
    const lista = data?.permisos ?? data?.modulos ?? data?.rol?.permisos ?? [];
    if (!Array.isArray(lista)) return [];
    return lista
        .filter((item: any) => item?.puedeVer === undefined || Boolean(item.puedeVer))
        .map((item: any) => String(item?.moduloId ?? item?.id ?? item))
        .filter(Boolean);
}

export default function AdministrarRolesPage() {
    const router = useRouter();
    const [roles, setRoles] = useState<Rol[]>(ROLES_BASE);
    const [modulos, setModulos] = useState<Modulo[]>([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState('');
    const [rolModal, setRolModal] = useState<Rol | null>(null);
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
    const [busqueda, setBusqueda] = useState('');
    const [cargandoPermisos, setCargandoPermisos] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [aviso, setAviso] = useState<Aviso>(null);

    const headers = useCallback(() => {
        const token = getToken();
        if (!token) throw new Error('No se encontró una sesión activa.');
        return { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    }, []);

    const cargarDatos = useCallback(async (inicial = false) => {
        inicial ? setLoading(true) : setActualizando(true);
        setError('');
        try {
            const cabeceras = headers();
            const [resRoles, resModulos] = await Promise.all([
                fetch(`${API_BASE}/permisos/roles`, { headers: cabeceras, cache: 'no-store' }),
                fetch(`${API_BASE}/permisos/modulos`, { headers: cabeceras, cache: 'no-store' }),
            ]);
            const [dataRoles, dataModulos] = await Promise.all([leerJson(resRoles), leerJson(resModulos)]);
            if (!resRoles.ok || dataRoles?.ok === false) throw new Error(dataRoles?.message || 'No se pudieron cargar los roles.');
            if (!resModulos.ok || dataModulos?.ok === false) throw new Error(dataModulos?.message || 'No se pudieron cargar los módulos.');

            const recibidos: any[] = Array.isArray(dataRoles?.roles) ? dataRoles.roles : [];
            setRoles(ROLES_BASE.map((base) => {
                const remoto = recibidos.find((item) => item.codigo === base.codigo || item.rol === base.codigo);
                return remoto ? {
                    ...base,
                    cantidadUsuarios: Number(remoto.cantidadUsuarios ?? remoto.totalUsuarios ?? 0),
                    cantidadPermisos: base.accesoTotal ? 0 : Number(remoto.cantidadPermisos ?? remoto.totalPermisos ?? 0),
                } : base;
            }));
            setModulos((Array.isArray(dataModulos?.modulos) ? dataModulos.modulos : [])
                .filter((m: Modulo) => m.activo === undefined || Boolean(m.activo))
                .sort((a: Modulo, b: Modulo) => (a.orden ?? 0) - (b.orden ?? 0)));
        } catch (e: any) {
            setError(e?.message || 'No se pudo cargar la información.');
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    }, [headers]);

    useEffect(() => { cargarDatos(true); }, [cargarDatos]);
    useEffect(() => {
        if (!aviso) return;
        const timer = window.setTimeout(() => setAviso(null), 4000);
        return () => window.clearTimeout(timer);
    }, [aviso]);

    const modulosFiltrados = useMemo(() => {
        const texto = normalizar(busqueda);
        return modulos.filter((m) => !texto || normalizar(`${m.nombre} ${m.codigo} ${m.descripcion}`).includes(texto));
    }, [modulos, busqueda]);

    async function abrirRol(rol: Rol) {
        if (rol.accesoTotal) return;
        setRolModal(rol);
        setSeleccionados(new Set());
        setBusqueda('');
        setCargandoPermisos(true);
        try {
            const response = await fetch(`${API_BASE}/permisos/roles/${rol.codigo}`, { headers: headers(), cache: 'no-store' });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) throw new Error(data?.message || 'No se pudieron consultar los permisos del rol.');
            setSeleccionados(new Set(extraerIds(data)));
        } catch (e: any) {
            setAviso({ tipo: 'error', texto: e?.message || 'Error consultando el rol.' });
            setRolModal(null);
        } finally { setCargandoPermisos(false); }
    }

    function alternar(id: string) {
        setSeleccionados((actuales) => {
            const nuevos = new Set(actuales);
            nuevos.has(id) ? nuevos.delete(id) : nuevos.add(id);
            return nuevos;
        });
    }

    async function guardar() {
        if (!rolModal) return;
        setGuardando(true);
        try {
            const moduloIds = Array.from(seleccionados).map((id) => Number.isNaN(Number(id)) ? id : Number(id));
            const response = await fetch(`${API_BASE}/permisos/roles/${rolModal.codigo}`, {
                method: 'PUT', headers: headers(), body: JSON.stringify({ moduloIds }),
            });
            const data = await leerJson(response);
            if (!response.ok || data?.ok === false) throw new Error(data?.message || 'No se pudieron guardar los permisos del rol.');
            setRoles((actuales) => actuales.map((r) => r.codigo === rolModal.codigo ? { ...r, cantidadPermisos: seleccionados.size } : r));
            setAviso({ tipo: 'ok', texto: `Permisos del rol ${rolModal.nombre} actualizados.` });
            setRolModal(null);
        } catch (e: any) {
            setAviso({ tipo: 'error', texto: e?.message || 'Error guardando los permisos.' });
        } finally { setGuardando(false); }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <button onClick={() => cargarDatos(false)} disabled={loading || actualizando} className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-300 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''}`} /> Actualizar</button>
                </div>

                <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"><ShieldCheck className="h-8 w-8" /></div>
                        <div><p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">Control por roles</p><h1 className="text-3xl font-black sm:text-4xl">Administrar roles</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">Define los módulos base que recibirá cada tipo de usuario dentro del sistema Netcomp RF.</p></div>
                    </div>
                </section>

                {error && <section className="mb-6 flex gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5"><XCircle className="h-5 w-5 shrink-0 text-rose-400" /><div className="flex-1"><h2 className="font-bold text-rose-200">No se pudo cargar la información</h2><p className="mt-1 text-sm text-rose-200/70">{error}</p></div><button onClick={() => cargarDatos(true)} className="text-xs font-bold text-rose-200">Reintentar</button></section>}

                {loading ? <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]"><Loader2 className="h-10 w-10 animate-spin text-emerald-400" /><p className="mt-4 font-bold">Cargando roles...</p></div> : !error && (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {roles.map((rol) => <article key={rol.codigo} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/20">
                            <div className="flex items-start justify-between gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"><ShieldCheck className="h-6 w-6" /></div><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">{rol.codigo}</span></div>
                            <h2 className="mt-5 text-xl font-black">{rol.nombre}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{rol.descripcion}</p>
                            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-5"><div><p className="text-xs text-slate-500">Usuarios</p><p className="mt-1 flex items-center gap-2 font-black"><Users className="h-4 w-4 text-blue-400" />{rol.cantidadUsuarios}</p></div><div><p className="text-xs text-slate-500">Permisos</p><p className={`mt-1 flex items-center gap-2 font-black ${rol.accesoTotal ? 'text-violet-300' : ''}`}><KeyRound className="h-4 w-4" />{rol.accesoTotal ? 'Todos' : rol.cantidadPermisos}</p></div></div>
                            <button disabled={rol.accesoTotal} onClick={() => abrirRol(rol)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-violet-500/15 disabled:text-violet-300">{rol.accesoTotal ? <><ShieldCheck className="h-4 w-4" /> Acceso total automático</> : <><KeyRound className="h-4 w-4" /> Configurar permisos</>}</button>
                        </article>)}
                    </div>
                )}
            </div>

            {rolModal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget && !guardando) setRolModal(null); }}>
                <section className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-slate-900 sm:rounded-3xl">
                    <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6"><div><h2 className="text-xl font-black">Permisos de {rolModal.nombre}</h2><p className="mt-1 text-sm text-slate-400">Estos permisos serán la base para los usuarios con este rol.</p></div><button disabled={guardando} onClick={() => setRolModal(null)} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10"><X className="h-5 w-5" /></button></header>
                    {cargandoPermisos ? <div className="flex min-h-80 flex-col items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-emerald-400" /><p className="mt-3 font-bold">Consultando permisos...</p></div> : <>
                        <div className="border-b border-white/10 p-5 sm:p-6"><div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar módulo..." className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-12 pr-4 text-sm outline-none focus:border-emerald-400/40" /></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-400"><strong className="text-white">{seleccionados.size}</strong> de {modulos.length} seleccionados</p><div className="flex gap-2"><button onClick={() => setSeleccionados((a) => { const n = new Set(a); modulosFiltrados.forEach((m) => n.add(String(m.id))); return n; })} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300">Seleccionar visibles</button><button onClick={() => setSeleccionados(new Set())} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300">Quitar todos</button></div></div></div>
                        <div className="min-h-0 flex-1 max-h-[50vh] overflow-y-auto overscroll-contain p-5 sm:p-6">
                            <div className="grid gap-3 sm:grid-cols-2">{modulosFiltrados.map((m) => { const marcado = seleccionados.has(String(m.id)); return <button key={m.id} onClick={() => alternar(String(m.id))} className={`flex items-start gap-3 rounded-2xl border p-4 text-left ${marcado ? 'border-emerald-400/40 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03]'}`}><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${marcado ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600 bg-slate-950'}`}>{marcado && <Check className="h-3.5 w-3.5" />}</span><span><span className="block font-bold">{m.nombre}</span><span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-emerald-300/80">{m.codigo}</span>{m.descripcion && <span className="mt-2 block text-sm text-slate-400">{m.descripcion}</span>}</span></button>; })}</div></div>
                        <footer className="flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-950/40 p-5 sm:flex-row sm:justify-end"><button disabled={guardando} onClick={() => setRolModal(null)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300">Cancelar</button><button disabled={guardando} onClick={guardar} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold hover:bg-emerald-500 disabled:opacity-60">{guardando ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><CheckCircle2 className="h-4 w-4" /> Guardar permisos</>}</button></footer>
                    </>}
                </section>
            </div>}

            {aviso && <div className={`fixed bottom-5 right-5 z-[60] flex max-w-sm gap-3 rounded-2xl border p-4 shadow-2xl ${aviso.tipo === 'ok' ? 'border-emerald-400/25 bg-emerald-950 text-emerald-200' : 'border-rose-400/25 bg-rose-950 text-rose-200'}`}>{aviso.tipo === 'ok' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}<p className="text-sm font-semibold">{aviso.texto}</p></div>}
        </main>
    );
}