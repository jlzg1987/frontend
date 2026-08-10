'use client';

import {
    ArrowLeft,
    ChevronRight,
    KeyRound,
    ShieldCheck,
    UserCog,
    Users,
    MenuSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type OpcionUsuarios = {
    titulo: string;
    descripcion: string;
    icono: React.ElementType;
    ruta: string;
    color: string;
    fondoIcono: string;
    disponible: boolean;
};

export default function UsuariosDashboardPage({

    onAbrirListado,
    onAbrirPermisosUsuarios,
    onAbrirAdministrarroles,
    onAbrirMenulateral,
    onAbrirCrearusuario,
}: {
    onAbrirPermisosUsuarios: () => void;
    onAbrirListado: () => void;
    onAbrirAdministrarroles: () => void;
    onAbrirMenulateral: () => void;
    onAbrirCrearusuario: () => void;
}) {
    const router = useRouter();

    const opciones: OpcionUsuarios[] = [
        {
            titulo: 'Permisos de usuarios',
            descripcion:
                'Asigna individualmente los módulos que puede utilizar cada usuario.',
            icono: KeyRound,
            ruta: '/usuarios/permisos',
            color: 'from-violet-500 to-purple-700',
            fondoIcono: 'bg-violet-500/20 text-violet-300',
            disponible: true,
        },
        {
            titulo: 'Lista de usuarios',
            descripcion:
                'Consulta todos los usuarios registrados, sus roles y estados.',
            icono: Users,
            ruta: '/usuarios/lista',
            color: 'from-blue-500 to-cyan-600',
            fondoIcono: 'bg-blue-500/20 text-blue-300',
            disponible: true,
        },
        {
            titulo: 'Administrar roles',
            descripcion:
                'Configura los roles disponibles para organizar a los usuarios.',
            icono: ShieldCheck,
            ruta: '/usuarios/roles',
            color: 'from-emerald-500 to-teal-700',
            fondoIcono: 'bg-emerald-500/20 text-emerald-300',
            disponible: true,
        },
        {
            titulo: 'Crear usuario',
            descripcion:
                'Registra un nuevo usuario y selecciona su rol dentro del sistema.',
            icono: UserCog,
            ruta: '/register',
            color: 'from-amber-500 to-orange-600',
            fondoIcono: 'bg-amber-500/20 text-amber-300',
            disponible: true,
        },
        {
            titulo: 'Menú lateral',
            descripcion:
                'Crea, edita, ordena, activa o elimina las opciones del menú lateral del sistema.',
            icono: MenuSquare,
            ruta: '/administrar-menu',
            color: 'from-amber-500 to-orange-600',
            fondoIcono: 'bg-amber-500/20 text-amber-300',
            disponible: true,
        },
    ];

    function abrirOpcion(opcion: OpcionUsuarios) {
        if (!opcion.disponible) return;
        if (opcion.titulo === 'Lista de usuarios') {
            onAbrirListado();
            return;
        }
        if (opcion.titulo === 'Permisos de usuarios') {
            onAbrirPermisosUsuarios();
            return;
        }
        if (opcion.titulo === 'Administrar roles') {
            onAbrirAdministrarroles();
            return;
        }
        if (opcion.titulo === 'Menú lateral') {
            onAbrirMenulateral();
            return;
        }
        if (opcion.titulo === 'Crear usuario') {
            onAbrirCrearusuario();
            return;
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">


                <section className="mb-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20">
                            <Users className="h-8 w-8" />
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-blue-400">
                                Administración
                            </p>

                            <h1 className="text-3xl font-black sm:text-4xl">
                                Gestión de usuarios
                            </h1>

                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                                Administra los usuarios, roles y permisos de acceso
                                a los diferentes módulos del sistema Netcomp RF.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white">
                            Opciones de administración
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Selecciona la opción que deseas gestionar.
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {opciones.map((opcion) => {
                            const Icono = opcion.icono;

                            return (
                                <button
                                    key={opcion.titulo}
                                    type="button"
                                    disabled={!opcion.disponible}
                                    onClick={() => abrirOpcion(opcion)}
                                    className={[
                                        'group relative overflow-hidden rounded-3xl border p-6 text-left transition duration-300',
                                        opcion.disponible
                                            ? 'border-white/10 bg-white/[0.04] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-2xl'
                                            : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-60',
                                    ].join(' ')}
                                >
                                    <div
                                        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${opcion.color}`}
                                    />

                                    <div className="mb-6 flex items-start justify-between gap-4">
                                        <div
                                            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${opcion.fondoIcono}`}
                                        >
                                            <Icono className="h-7 w-7" />
                                        </div>

                                        {opcion.disponible ? (
                                            <ChevronRight className="h-6 w-6 text-slate-600 transition group-hover:translate-x-1 group-hover:text-white" />
                                        ) : (
                                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                                                Próximamente
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-black text-white">
                                        {opcion.titulo}
                                    </h3>

                                    <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
                                        {opcion.descripcion}
                                    </p>

                                    {opcion.disponible && (
                                        <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-400 transition group-hover:text-blue-300">
                                            Abrir módulo
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-8 rounded-2xl border border-blue-400/15 bg-blue-400/[0.06] p-5">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

                        <div>
                            <h3 className="font-bold text-blue-200">
                                Control de acceso
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-slate-400">
                                Los administradores tienen acceso total
                                automáticamente. Los demás usuarios solo podrán
                                utilizar los módulos que les sean asignados.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}