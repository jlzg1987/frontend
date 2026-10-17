'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    CircleOff,
    Landmark,
    Mail,
    Pencil,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    UserRound,
    WalletCards,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type TipoCuenta = 'AHORROS' | 'CORRIENTE';
type EstadoCuenta = 'ACTIVA' | 'INACTIVA';

type CuentaBancaria = {
    id: number;
    banco: string;
    tipoCuenta: TipoCuenta;
    numeroCuenta: string;
    titular: string;
    identificacion: string;
    correo: string | null;
    instrucciones: string | null;
    orden: number;
    estado: EstadoCuenta;
    creadoEn?: string | null;
    actualizadoEn?: string | null;
};

type FormularioCuenta = {
    banco: string;
    tipoCuenta: TipoCuenta;
    numeroCuenta: string;
    titular: string;
    identificacion: string;
    correo: string;
    instrucciones: string;
    orden: string;
    estado: EstadoCuenta;
};

const FORMULARIO_INICIAL: FormularioCuenta = {
    banco: '',
    tipoCuenta: 'AHORROS',
    numeroCuenta: '',
    titular: '',
    identificacion: '',
    correo: '',
    instrucciones: '',
    orden: '0',
    estado: 'ACTIVA',
};

function authHeaders() {
    const token = getToken();

    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
    };
}

function mensajeError(error: unknown, respaldo: string) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return respaldo;
}

export default function BancosPage({
    onVolver,
}: {
    onVolver?: () => void;
}) {
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
    const [formulario, setFormulario] = useState<FormularioCuenta>(
        FORMULARIO_INICIAL
    );
    const [editando, setEditando] = useState<CuentaBancaria | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState<'TODAS' | EstadoCuenta>('TODAS');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cambiandoEstadoId, setCambiandoEstadoId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarCuentas();
    }, []);

    const cuentasFiltradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        return cuentas.filter((cuenta) => {
            if (estadoFiltro !== 'TODAS' && cuenta.estado !== estadoFiltro) {
                return false;
            }

            if (!termino) {
                return true;
            }

            return [
                cuenta.banco,
                cuenta.tipoCuenta,
                cuenta.numeroCuenta,
                cuenta.titular,
                cuenta.identificacion,
                cuenta.correo || '',
            ].some((valor) => String(valor).toLowerCase().includes(termino));
        });
    }, [cuentas, busqueda, estadoFiltro]);

    const resumen = useMemo(
        () => ({
            total: cuentas.length,
            activas: cuentas.filter((cuenta) => cuenta.estado === 'ACTIVA').length,
            inactivas: cuentas.filter((cuenta) => cuenta.estado === 'INACTIVA').length,
        }),
        [cuentas]
    );

    async function cargarCuentas() {
        try {
            setCargando(true);
            setError(null);

            const respuesta = await fetch(`${API_BASE}/cuentas-bancarias`, {
                method: 'GET',
                headers: authHeaders(),
            });

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(data.message || 'No se pudieron cargar las cuentas bancarias.');
            }

            setCuentas(Array.isArray(data.cuentas) ? data.cuentas : []);
        } catch (error: unknown) {
            console.error(error);
            setError(mensajeError(error, 'No se pudieron cargar las cuentas bancarias.'));
        } finally {
            setCargando(false);
        }
    }

    function actualizarCampo<K extends keyof FormularioCuenta>(
        campo: K,
        valor: FormularioCuenta[K]
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }));
    }

    function limpiarFormulario() {
        setEditando(null);
        setFormulario(FORMULARIO_INICIAL);
    }

    function editarCuenta(cuenta: CuentaBancaria) {
        setEditando(cuenta);
        setFormulario({
            banco: cuenta.banco || '',
            tipoCuenta: cuenta.tipoCuenta || 'AHORROS',
            numeroCuenta: cuenta.numeroCuenta || '',
            titular: cuenta.titular || '',
            identificacion: cuenta.identificacion || '',
            correo: cuenta.correo || '',
            instrucciones: cuenta.instrucciones || '',
            orden: String(cuenta.orden ?? 0),
            estado: cuenta.estado || 'ACTIVA',
        });

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    function validarFormulario() {
        if (!formulario.banco.trim()) {
            alert('Ingrese el nombre del banco.');
            return false;
        }

        if (!formulario.numeroCuenta.trim()) {
            alert('Ingrese el número de cuenta.');
            return false;
        }

        if (!formulario.titular.trim()) {
            alert('Ingrese el titular de la cuenta.');
            return false;
        }

        if (!formulario.identificacion.trim()) {
            alert('Ingrese la cédula o RUC del titular.');
            return false;
        }

        const orden = Number(formulario.orden || 0);

        if (!Number.isInteger(orden) || orden < 0) {
            alert('El orden debe ser un número entero mayor o igual a 0.');
            return false;
        }

        return true;
    }

    async function guardarCuenta() {
        if (!validarFormulario()) {
            return;
        }

        try {
            setGuardando(true);
            setError(null);

            const url = editando
                ? `${API_BASE}/cuentas-bancarias/${editando.id}`
                : `${API_BASE}/cuentas-bancarias`;

            const respuesta = await fetch(url, {
                method: editando ? 'PUT' : 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    banco: formulario.banco.trim(),
                    tipoCuenta: formulario.tipoCuenta,
                    numeroCuenta: formulario.numeroCuenta.trim(),
                    titular: formulario.titular.trim(),
                    identificacion: formulario.identificacion.trim(),
                    correo: formulario.correo.trim() || null,
                    instrucciones: formulario.instrucciones.trim() || null,
                    orden: Number(formulario.orden || 0),
                    estado: formulario.estado,
                }),
            });

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(data.message || 'No se pudo guardar la cuenta bancaria.');
            }

            alert(
                data.message ||
                    (editando
                        ? 'Cuenta bancaria actualizada correctamente.'
                        : 'Cuenta bancaria creada correctamente.')
            );

            limpiarFormulario();
            await cargarCuentas();
        } catch (error: unknown) {
            console.error(error);
            alert(mensajeError(error, 'No se pudo guardar la cuenta bancaria.'));
        } finally {
            setGuardando(false);
        }
    }

    async function cambiarEstado(cuenta: CuentaBancaria) {
        const nuevoEstado: EstadoCuenta =
            cuenta.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';

        const confirmar = window.confirm(
            nuevoEstado === 'INACTIVA'
                ? `¿Desactivar la cuenta ${cuenta.banco} - ${cuenta.numeroCuenta}? Dejará de mostrarse en la app.`
                : `¿Activar la cuenta ${cuenta.banco} - ${cuenta.numeroCuenta}? Volverá a mostrarse en la app.`
        );

        if (!confirmar) {
            return;
        }

        try {
            setCambiandoEstadoId(cuenta.id);

            const respuesta = await fetch(
                `${API_BASE}/cuentas-bancarias/${cuenta.id}/estado`,
                {
                    method: 'PATCH',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        estado: nuevoEstado,
                    }),
                }
            );

            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(data.message || 'No se pudo cambiar el estado.');
            }

            await cargarCuentas();
        } catch (error: unknown) {
            console.error(error);
            alert(mensajeError(error, 'No se pudo cambiar el estado de la cuenta.'));
        } finally {
            setCambiandoEstadoId(null);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {onVolver && (
                            <button
                                onClick={onVolver}
                                className="w-11 h-11 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 flex items-center justify-center transition"
                                title="Volver al dashboard"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        <div>
                            <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold uppercase tracking-wide">
                                <Landmark className="w-4 h-4" />
                                Administración bancaria
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black mt-1">Cuentas bancarias</h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Administra las cuentas que se muestran a los clientes en la app de Netcomp RF.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={cargarCuentas}
                        disabled={cargando}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ResumenCard
                        titulo="Total registradas"
                        valor={resumen.total}
                        icono={<WalletCards className="w-5 h-5" />}
                        clases="text-cyan-300 border-cyan-500/20"
                    />
                    <ResumenCard
                        titulo="Activas en la app"
                        valor={resumen.activas}
                        icono={<CheckCircle2 className="w-5 h-5" />}
                        clases="text-emerald-300 border-emerald-500/20"
                    />
                    <ResumenCard
                        titulo="Desactivadas"
                        valor={resumen.inactivas}
                        icono={<CircleOff className="w-5 h-5" />}
                        clases="text-amber-300 border-amber-500/20"
                    />
                </section>

                <section className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-5 md:p-6 shadow-xl shadow-cyan-500/5">
                    <div className="flex items-center justify-between gap-4 mb-5">
                        <div>
                            <h2 className="text-xl font-bold">
                                {editando ? 'Editar cuenta bancaria' : 'Registrar cuenta bancaria'}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {editando
                                    ? `Modificando la cuenta #${editando.id}`
                                    : 'Completa los datos que verá el cliente antes de realizar su pago.'}
                            </p>
                        </div>

                        {editando ? (
                            <button
                                onClick={limpiarFormulario}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-sm"
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </button>
                        ) : (
                            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center border border-cyan-500/20">
                                <Plus className="w-5 h-5" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <Campo label="Banco *">
                            <input
                                value={formulario.banco}
                                onChange={(e) => actualizarCampo('banco', e.target.value)}
                                placeholder="Ej. BANCO PICHINCHA"
                                className={inputClass}
                            />
                        </Campo>

                        <Campo label="Tipo de cuenta *">
                            <select
                                value={formulario.tipoCuenta}
                                onChange={(e) =>
                                    actualizarCampo('tipoCuenta', e.target.value as TipoCuenta)
                                }
                                className={inputClass}
                            >
                                <option value="AHORROS">Ahorros</option>
                                <option value="CORRIENTE">Corriente</option>
                            </select>
                        </Campo>

                        <Campo label="Número de cuenta *">
                            <input
                                value={formulario.numeroCuenta}
                                onChange={(e) => actualizarCampo('numeroCuenta', e.target.value)}
                                placeholder="Número de cuenta"
                                className={inputClass}
                            />
                        </Campo>

                        <Campo label="Titular *">
                            <div className="relative">
                                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    value={formulario.titular}
                                    onChange={(e) => actualizarCampo('titular', e.target.value)}
                                    placeholder="Titular de la cuenta"
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                        </Campo>

                        <Campo label="Cédula / RUC *">
                            <input
                                value={formulario.identificacion}
                                onChange={(e) => actualizarCampo('identificacion', e.target.value)}
                                placeholder="Identificación del titular"
                                className={inputClass}
                            />
                        </Campo>

                        <Campo label="Correo">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={formulario.correo}
                                    onChange={(e) => actualizarCampo('correo', e.target.value)}
                                    placeholder="correo@empresa.com"
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                        </Campo>

                        <Campo label="Orden de visualización">
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={formulario.orden}
                                onChange={(e) => actualizarCampo('orden', e.target.value)}
                                className={inputClass}
                            />
                        </Campo>

                        <Campo label="Estado">
                            <select
                                value={formulario.estado}
                                onChange={(e) =>
                                    actualizarCampo('estado', e.target.value as EstadoCuenta)
                                }
                                className={inputClass}
                            >
                                <option value="ACTIVA">Activa</option>
                                <option value="INACTIVA">Inactiva</option>
                            </select>
                        </Campo>

                        <div className="md:col-span-2 xl:col-span-1">
                            <Campo label="Instrucciones para el cliente">
                                <textarea
                                    value={formulario.instrucciones}
                                    onChange={(e) => actualizarCampo('instrucciones', e.target.value)}
                                    placeholder="Ej. Enviar el comprobante después de realizar el pago."
                                    rows={3}
                                    maxLength={255}
                                    className={`${inputClass} resize-none`}
                                />
                            </Campo>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-5">
                        <button
                            onClick={guardarCuenta}
                            disabled={guardando}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-black transition"
                        >
                            <Save className="w-4 h-4" />
                            {guardando
                                ? 'Guardando...'
                                : editando
                                  ? 'Guardar cambios'
                                  : 'Crear cuenta'}
                        </button>

                        {editando && (
                            <button
                                onClick={limpiarFormulario}
                                disabled={guardando}
                                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold transition"
                            >
                                Nueva cuenta
                            </button>
                        )}
                    </div>
                </section>

                <section className="bg-slate-900 border border-cyan-500/20 rounded-3xl overflow-hidden shadow-xl shadow-cyan-500/5">
                    <div className="p-5 border-b border-slate-800 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold">Cuentas registradas</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Las cuentas activas se publican automáticamente en la app.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative min-w-[260px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar banco, cuenta, titular..."
                                    className={`${inputClass} pl-10`}
                                />
                            </div>

                            <select
                                value={estadoFiltro}
                                onChange={(e) =>
                                    setEstadoFiltro(
                                        e.target.value as 'TODAS' | EstadoCuenta
                                    )
                                }
                                className={`${inputClass} min-w-[150px]`}
                            >
                                <option value="TODAS">Todas</option>
                                <option value="ACTIVA">Activas</option>
                                <option value="INACTIVA">Inactivas</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="m-5 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-sm">
                            <thead className="bg-slate-950/80 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3 text-left">Banco</th>
                                    <th className="px-4 py-3 text-left">Cuenta</th>
                                    <th className="px-4 py-3 text-left">Titular</th>
                                    <th className="px-4 py-3 text-left">Identificación</th>
                                    <th className="px-4 py-3 text-left">Correo</th>
                                    <th className="px-4 py-3 text-center">Orden</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                            <div className="inline-flex items-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Cargando cuentas bancarias...
                                            </div>
                                        </td>
                                    </tr>
                                ) : cuentasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                                            No hay cuentas que coincidan con los filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    cuentasFiltradas.map((cuenta) => (
                                        <tr
                                            key={cuenta.id}
                                            className="border-t border-slate-800 hover:bg-slate-800/40 transition"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center">
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{cuenta.banco}</div>
                                                        <div className="text-xs text-slate-500">ID #{cuenta.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-cyan-300">{cuenta.numeroCuenta}</div>
                                                <div className="text-xs text-slate-400 mt-1">{cuenta.tipoCuenta}</div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-200">{cuenta.titular}</td>
                                            <td className="px-4 py-4 text-slate-300">{cuenta.identificacion}</td>
                                            <td className="px-4 py-4 text-slate-300">{cuenta.correo || '-'}</td>
                                            <td className="px-4 py-4 text-center font-bold">{cuenta.orden}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${
                                                        cuenta.estado === 'ACTIVA'
                                                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                                    }`}
                                                >
                                                    {cuenta.estado === 'ACTIVA' ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <CircleOff className="w-3.5 h-3.5" />
                                                    )}
                                                    {cuenta.estado}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => editarCuenta(cuenta)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() => cambiarEstado(cuenta)}
                                                        disabled={cambiandoEstadoId === cuenta.id}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition disabled:opacity-50 ${
                                                            cuenta.estado === 'ACTIVA'
                                                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                                        }`}
                                                    >
                                                        {cuenta.estado === 'ACTIVA' ? (
                                                            <CircleOff className="w-4 h-4" />
                                                        ) : (
                                                            <ShieldCheck className="w-4 h-4" />
                                                        )}
                                                        {cambiandoEstadoId === cuenta.id
                                                            ? 'Procesando...'
                                                            : cuenta.estado === 'ACTIVA'
                                                              ? 'Desactivar'
                                                              : 'Activar'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

const inputClass =
    'w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition';

function Campo({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-slate-300">{label}</span>
            {children}
        </label>
    );
}

function ResumenCard({
    titulo,
    valor,
    icono,
    clases,
}: {
    titulo: string;
    valor: number;
    icono: React.ReactNode;
    clases: string;
}) {
    return (
        <div className={`rounded-2xl bg-slate-900 border p-4 ${clases}`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{titulo}</p>
                    <p className="text-3xl font-black text-white mt-1">{valor}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {icono}
                </div>
            </div>
        </div>
    );
}
