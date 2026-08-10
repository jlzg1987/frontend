'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import {
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    Mail,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    UserCheck,
    UserCog,
    Users,
    UserX,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | string;

type Usuario = {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string | null;
    rol: string;
    estado: EstadoUsuario;
    fotoPerfil: string | null;
    created_at: string | null;
    cantidadPermisos: number | string;
};

type RespuestaUsuarios = {
    ok: boolean;
    total?: number;
    usuarios?: Usuario[];
    message?: string;
};

const ROLES = [
    'TODOS',
    'ADMIN',
    'TECNICO',
    'SERVICIOCLIENTE',
    'CAJERO',
    'CLIENTE',
];

const ESTADOS = ['TODOS', 'ACTIVO', 'INACTIVO'];

function normalizarTexto(texto: unknown) {
    return String(texto ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function obtenerIniciales(usuario: Usuario) {
    const nombre = usuario.nombres?.trim()?.charAt(0) || '';
    const apellido = usuario.apellidos?.trim()?.charAt(0) || '';

    return `${nombre}${apellido}`.toUpperCase() || 'U';
}

function obtenerNombreCompleto(usuario: Usuario) {
    return `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim()
        || 'Usuario sin nombre';
}

function formatearRol(rol: string) {
    const nombres: Record<string, string> = {
        ADMIN: 'Administrador',
        TECNICO: 'Técnico',
        SERVICIOCLIENTE: 'Servicio al cliente',
        CAJERO: 'Cajero',
        CLIENTE: 'Cliente',
    };

    return nombres[rol] || rol;
}

function colorRol(rol: string) {
    const colores: Record<string, string> = {
        ADMIN:
            'border-violet-400/20 bg-violet-400/10 text-violet-300',
        TECNICO:
            'border-blue-400/20 bg-blue-400/10 text-blue-300',
        SERVICIOCLIENTE:
            'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
        CAJERO:
            'border-amber-400/20 bg-amber-400/10 text-amber-300',
        CLIENTE:
            'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    };

    return (
        colores[rol] ||
        'border-slate-400/20 bg-slate-400/10 text-slate-300'
    );
}

function formatearFecha(fecha: string | null) {
    if (!fecha) return 'Fecha no disponible';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(valor);
}

export default function ListaUsuariosPage() {
    const router = useRouter();

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState('');

    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('TODOS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    const cargarUsuarios = useCallback(async (mostrarCarga = true) => {
        if (mostrarCarga) {
            setLoading(true);
        } else {
            setActualizando(true);
        }

        setError('');

        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    'No se encontró una sesión activa. Inicia sesión nuevamente.'
                );
            }

            const response = await fetch(
                `${API_BASE}/permisos/usuarios`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                }
            );

            const data: RespuestaUsuarios = await response.json();

            if (!response.ok || !data.ok) {
                if (response.status === 401) {
                    throw new Error(
                        'Tu sesión venció. Inicia sesión nuevamente.'
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        'No tienes permisos de administrador para consultar usuarios.'
                    );
                }

                throw new Error(
                    data.message || 'No se pudo obtener la lista de usuarios.'
                );
            }

            setUsuarios(
                Array.isArray(data.usuarios) ? data.usuarios : []
            );
        } catch (error: any) {
            console.error('Error cargando usuarios:', error);

            setError(
                error?.message ||
                'Ocurrió un error cargando los usuarios.'
            );
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    }, []);

    useEffect(() => {
        cargarUsuarios();
    }, [cargarUsuarios]);

    const usuariosFiltrados = useMemo(() => {
        const texto = normalizarTexto(busqueda);

        return usuarios.filter((usuario) => {
            const coincideBusqueda =
                !texto ||
                normalizarTexto(
                    `${usuario.nombres} ${usuario.apellidos}`
                ).includes(texto) ||
                normalizarTexto(usuario.email).includes(texto) ||
                normalizarTexto(usuario.telefono).includes(texto) ||
                normalizarTexto(usuario.rol).includes(texto);

            const coincideRol =
                filtroRol === 'TODOS' ||
                usuario.rol === filtroRol;

            const coincideEstado =
                filtroEstado === 'TODOS' ||
                usuario.estado === filtroEstado;

            return (
                coincideBusqueda &&
                coincideRol &&
                coincideEstado
            );
        });
    }, [usuarios, busqueda, filtroRol, filtroEstado]);

    const resumen = useMemo(() => {
        return {
            total: usuarios.length,
            activos: usuarios.filter(
                (usuario) => usuario.estado === 'ACTIVO'
            ).length,
            inactivos: usuarios.filter(
                (usuario) => usuario.estado === 'INACTIVO'
            ).length,
            administradores: usuarios.filter(
                (usuario) => usuario.rol === 'ADMIN'
            ).length,
        };
    }, [usuarios]);

    function limpiarFiltros() {
        setBusqueda('');
        setFiltroRol('TODOS');
        setFiltroEstado('TODOS');
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">


                    <button
                        type="button"
                        onClick={() => cargarUsuarios(false)}
                        disabled={loading || actualizando}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''
                                }`}
                        />
                        Actualizar listado
                    </button>
                </div>

                <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20">
                            <Users className="h-8 w-8" />
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
                                Administración
                            </p>

                            <h1 className="text-3xl font-black sm:text-4xl">
                                Lista de usuarios
                            </h1>

                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                                Consulta todos los usuarios registrados en el
                                sistema, incluidos administradores, técnicos,
                                cajeros, personal de servicio y clientes.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <ResumenCard
                        titulo="Total de usuarios"
                        valor={resumen.total}
                        icono={Users}
                        color="blue"
                    />

                    <ResumenCard
                        titulo="Usuarios activos"
                        valor={resumen.activos}
                        icono={UserCheck}
                        color="emerald"
                    />

                    <ResumenCard
                        titulo="Usuarios inactivos"
                        valor={resumen.inactivos}
                        icono={UserX}
                        color="rose"
                    />

                    <ResumenCard
                        titulo="Administradores"
                        valor={resumen.administradores}
                        icono={ShieldCheck}
                        color="violet"
                    />
                </section>

                <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                            <input
                                type="search"
                                value={busqueda}
                                onChange={(event) =>
                                    setBusqueda(event.target.value)
                                }
                                placeholder="Buscar por nombre, correo, teléfono o rol..."
                                className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/10"
                            />
                        </div>

                        <select
                            value={filtroRol}
                            onChange={(event) =>
                                setFiltroRol(event.target.value)
                            }
                            className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-slate-200 outline-none transition focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/10"
                        >
                            {ROLES.map((rol) => (
                                <option key={rol} value={rol}>
                                    {rol === 'TODOS'
                                        ? 'Todos los roles'
                                        : formatearRol(rol)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroEstado}
                            onChange={(event) =>
                                setFiltroEstado(event.target.value)
                            }
                            className="h-12 rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-slate-200 outline-none transition focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/10"
                        >
                            {ESTADOS.map((estado) => (
                                <option key={estado} value={estado}>
                                    {estado === 'TODOS'
                                        ? 'Todos los estados'
                                        : estado}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                            <XCircle className="h-4 w-4" />
                            Limpiar
                        </button>
                    </div>
                </section>

                {error && (
                    <section className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5">
                        <div className="flex items-start gap-3">
                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />

                            <div className="flex-1">
                                <h2 className="font-bold text-rose-200">
                                    No se pudo cargar el listado
                                </h2>

                                <p className="mt-1 text-sm text-rose-200/70">
                                    {error}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => cargarUsuarios()}
                                className="rounded-lg border border-rose-300/20 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-300/10"
                            >
                                Reintentar
                            </button>
                        </div>
                    </section>
                )}

                {loading ? (
                    <EstadoCargando />
                ) : usuariosFiltrados.length === 0 ? (
                    <EstadoVacio
                        hayUsuarios={usuarios.length > 0}
                        onLimpiar={limpiarFiltros}
                    />
                ) : (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                Mostrando{' '}
                                <span className="font-bold text-white">
                                    {usuariosFiltrados.length}
                                </span>{' '}
                                de{' '}
                                <span className="font-bold text-white">
                                    {usuarios.length}
                                </span>{' '}
                                usuarios
                            </p>
                        </div>

                        <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] lg:block">
                            <table className="w-full">
                                <thead className="border-b border-white/10 bg-white/[0.04]">
                                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                        <th className="px-6 py-4">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-4">
                                            Contacto
                                        </th>
                                        <th className="px-6 py-4">
                                            Rol
                                        </th>
                                        <th className="px-6 py-4">
                                            Estado
                                        </th>
                                        <th className="px-6 py-4">
                                            Permisos
                                        </th>
                                        <th className="px-6 py-4">
                                            Registro
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-white/[0.06]">
                                    {usuariosFiltrados.map((usuario) => (
                                        <FilaUsuario
                                            key={usuario.id}
                                            usuario={usuario}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 lg:hidden">
                            {usuariosFiltrados.map((usuario) => (
                                <TarjetaUsuario
                                    key={usuario.id}
                                    usuario={usuario}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

type ResumenCardProps = {
    titulo: string;
    valor: number;
    icono: React.ElementType;
    color: 'blue' | 'emerald' | 'rose' | 'violet';
};

function ResumenCard({
    titulo,
    valor,
    icono: Icono,
    color,
}: ResumenCardProps) {
    const colores = {
        blue: 'bg-blue-400/10 text-blue-300 ring-blue-400/20',
        emerald:
            'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
        rose: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
        violet:
            'bg-violet-400/10 text-violet-300 ring-violet-400/20',
    };

    return (
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-400">{titulo}</p>

                    <p className="mt-2 text-3xl font-black text-white">
                        {valor}
                    </p>
                </div>

                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${colores[color]}`}
                >
                    <Icono className="h-6 w-6" />
                </div>
            </div>
        </article>
    );
}

function AvatarUsuario({ usuario }: { usuario: Usuario }) {
    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-black text-white ring-2 ring-white/10">
            {obtenerIniciales(usuario)}
        </div>
    );
}

function FilaUsuario({ usuario }: { usuario: Usuario }) {
    const esActivo = usuario.estado === 'ACTIVO';
    const esAdmin = usuario.rol === 'ADMIN';

    return (
        <tr className="transition hover:bg-white/[0.035]">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <AvatarUsuario usuario={usuario} />

                    <div className="min-w-0">
                        <p className="truncate font-bold text-white">
                            {obtenerNombreCompleto(usuario)}
                        </p>

                        <p
                            className="mt-1 max-w-52 truncate text-xs text-slate-500"
                            title={usuario.id}
                        >
                            ID: {usuario.id}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-6 py-4">
                <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        {usuario.email || 'Sin correo'}
                    </p>

                    <p className="flex items-center gap-2 text-slate-500">
                        <Phone className="h-3.5 w-3.5" />
                        {usuario.telefono || 'Sin teléfono'}
                    </p>
                </div>
            </td>

            <td className="px-6 py-4">
                <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${colorRol(
                        usuario.rol
                    )}`}
                >
                    {formatearRol(usuario.rol)}
                </span>
            </td>

            <td className="px-6 py-4">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${esActivo
                        ? 'bg-emerald-400/10 text-emerald-300'
                        : 'bg-rose-400/10 text-rose-300'
                        }`}
                >
                    {esActivo ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                        <XCircle className="h-3.5 w-3.5" />
                    )}

                    {usuario.estado}
                </span>
            </td>

            <td className="px-6 py-4">
                {esAdmin ? (
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-violet-300">
                        <ShieldCheck className="h-4 w-4" />
                        Acceso total
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                        <KeyRound className="h-4 w-4 text-blue-400" />
                        {Number(usuario.cantidadPermisos || 0)} asignados
                    </span>
                )}
            </td>

            <td className="px-6 py-4 text-sm text-slate-400">
                {formatearFecha(usuario.created_at)}
            </td>
        </tr>
    );
}

function TarjetaUsuario({ usuario }: { usuario: Usuario }) {
    const esActivo = usuario.estado === 'ACTIVO';
    const esAdmin = usuario.rol === 'ADMIN';

    return (
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-start gap-3">
                <AvatarUsuario usuario={usuario} />

                <div className="min-w-0 flex-1">
                    <h2 className="truncate font-black text-white">
                        {obtenerNombreCompleto(usuario)}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-2">
                        <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${colorRol(
                                usuario.rol
                            )}`}
                        >
                            {formatearRol(usuario.rol)}
                        </span>

                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${esActivo
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-rose-400/10 text-rose-300'
                                }`}
                        >
                            {esActivo ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <XCircle className="h-3 w-3" />
                            )}

                            {usuario.estado}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-4">
                <p className="flex items-center gap-2 text-sm text-slate-300">
                    <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">
                        {usuario.email || 'Sin correo'}
                    </span>
                </p>

                <p className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                    {usuario.telefono || 'Sin teléfono'}
                </p>

                <p className="flex items-center gap-2 text-sm text-slate-400">
                    {esAdmin ? (
                        <>
                            <ShieldCheck className="h-4 w-4 text-violet-400" />
                            <span className="font-semibold text-violet-300">
                                Acceso total
                            </span>
                        </>
                    ) : (
                        <>
                            <KeyRound className="h-4 w-4 text-blue-400" />
                            {Number(usuario.cantidadPermisos || 0)} permisos
                            asignados
                        </>
                    )}
                </p>

                <p className="flex items-center gap-2 text-sm text-slate-500">
                    <UserCog className="h-4 w-4" />
                    Registrado: {formatearFecha(usuario.created_at)}
                </p>
            </div>
        </article>
    );
}

function EstadoCargando() {
    return (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <RefreshCw className="h-9 w-9 animate-spin text-blue-400" />

            <p className="mt-4 font-bold text-white">
                Cargando usuarios...
            </p>

            <p className="mt-1 text-sm text-slate-500">
                Consultando los usuarios registrados.
            </p>
        </section>
    );
}

function EstadoVacio({
    hayUsuarios,
    onLimpiar,
}: {
    hayUsuarios: boolean;
    onLimpiar: () => void;
}) {
    return (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
            <Users className="h-12 w-12 text-slate-600" />

            <h2 className="mt-4 text-xl font-black text-white">
                {hayUsuarios
                    ? 'No encontramos coincidencias'
                    : 'No existen usuarios registrados'}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hayUsuarios
                    ? 'Prueba con otro nombre o modifica los filtros seleccionados.'
                    : 'Los usuarios registrados aparecerán en este listado.'}
            </p>

            {hayUsuarios && (
                <button
                    type="button"
                    onClick={onLimpiar}
                    className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                    Limpiar filtros
                </button>
            )}
        </section>
    );
}