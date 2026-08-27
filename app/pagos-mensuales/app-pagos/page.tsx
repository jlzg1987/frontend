'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import {
    ArrowLeft,
    BadgeCheck,
    Banknote,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    CreditCard,
    Eye,
    FileImage,
    Filter,
    LoaderCircle,
    RefreshCw,
    Search,
    X,
    XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type MetodoPago = 'PAYPHONE' | 'TRANSFERENCIA' | 'DEPOSITO';
type EstadoPago =
    | 'INICIADO'
    | 'PENDIENTE_VALIDACION'
    | 'APROBADO'
    | 'RECHAZADO'
    | 'ANULADO'
    | 'ERROR';

type PagoAdmin = {
    pagoId: string;
    clienteId: string;
    servicioId: string;
    metodoPago: MetodoPago;
    estado: EstadoPago;
    montoEsperado: number;
    montoDeclarado: number | null;
    montoDetectado: number | null;
    montoAprobado: number | null;
    bancoEmisor: string | null;
    numeroComprobante: string | null;
    fechaComprobante: string | null;
    payphoneTransactionId: string | null;
    payphoneClientTransactionId: string | null;
    payphoneAuthorizationCode: string | null;
    activacionProvisional: boolean;
    activacionDefinitiva: boolean;
    servicioReactivadoEn: string | null;
    motivoRechazo: string | null;
    observacionCliente: string | null;
    observacionRevision: string | null;
    revisadoEn: string | null;
    creadoEn: string;
    actualizadoEn: string;
    cedula: string | null;
    nombres: string | null;
    apellidos: string | null;
    email: string | null;
    telefono: string | null;
    estadoServicio: string | null;
    ipCliente: string | null;
    comprobanteUrl: string | null;
    periodos: string | null;
    cantidadMensualidades: number;
    permiteRevision: boolean;
};

type MensualidadDetalle = {
    mensualidadId: string;
    periodo: string;
    valorAplicado: number;
    valorMensual: number;
    estadoAplicacion: string;
    estadoMensualidad: string;
    fechaVencimiento: string;
    facturaInternaId: string | null;
    numeroFactura: string | null;
    estadoFactura: string | null;
    totalFactura: number | null;
    facturaPdfUrl: string | null;
};

type ComprobanteDetalle = {
    comprobanteId: string;
    archivoUrl: string;
    mimeType: string | null;
    tieneQr: boolean;
    bancoDetectado: string | null;
    numeroDetectado: string | null;
    fechaDetectada: string | null;
    montoDetectado: number | null;
    lecturaEstado: string;
    creadoEn: string;
};

type DetallePago = {
    pago: PagoAdmin;
    mensualidades: MensualidadDetalle[];
    comprobantes: ComprobanteDetalle[];
    eventos: Array<{
        eventoId: string;
        tipoEvento: string;
        descripcion: string | null;
        creadoEn: string;
    }>;
};

type RespuestaListado = {
    ok: boolean;
    pagos: PagoAdmin[];
    paginacion: {
        pagina: number;
        limite: number;
        total: number;
    };
};

const LIMITE = 20;

export default function PagosPage() {
    const router = useRouter();
    const [pagos, setPagos] = useState<PagoAdmin[]>([]);
    const [pagina, setPagina] = useState(1);
    const [total, setTotal] = useState(0);
    const [estado, setEstado] = useState('');
    const [metodoPago, setMetodoPago] = useState('');
    const [buscar, setBuscar] = useState('');
    const [buscarAplicado, setBuscarAplicado] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [detalle, setDetalle] = useState<DetallePago | null>(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [pagoRechazar, setPagoRechazar] = useState<PagoAdmin | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const requestApi = useCallback(async (
        ruta: string,
        options: RequestInit = {}
    ) => {
        const token = getToken();

        if (!token) {
            throw new Error('No se encontró el token de autenticación.');
        }

        const response = await fetch(`${API_BASE}${ruta}`, {
            ...options,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });

        const contentType = response.headers.get('content-type') || '';
        const texto = await response.text();

        if (!contentType.includes('application/json')) {
            throw new Error(
                `El backend respondió HTTP ${response.status} y no devolvió JSON.`
            );
        }

        const data = texto ? JSON.parse(texto) : {};

        if (!response.ok || data.ok === false) {
            throw new Error(
                data.message || data.mensaje || `Error HTTP ${response.status}`
            );
        }

        return data;
    }, []);

    const cargarPagos = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const params = new URLSearchParams({
                pagina: String(pagina),
                limite: String(LIMITE),
            });

            if (estado) params.set('estado', estado);
            if (metodoPago) params.set('metodoPago', metodoPago);
            if (buscarAplicado) params.set('buscar', buscarAplicado);
            if (fechaDesde) params.set('fechaDesde', fechaDesde);
            if (fechaHasta) params.set('fechaHasta', fechaHasta);

            const data: RespuestaListado = await requestApi(
                `/admin/pagos?${params.toString()}`
            );

            setPagos(Array.isArray(data.pagos) ? data.pagos : []);
            setTotal(Number(data.paginacion?.total || 0));

        } catch (err: any) {
            setError(err?.message || 'No se pudieron cargar los pagos.');
        } finally {
            setLoading(false);
        }
    }, [
        buscarAplicado,
        estado,
        fechaDesde,
        fechaHasta,
        metodoPago,
        pagina,
        requestApi,
    ]);

    useEffect(() => {
        cargarPagos();
    }, [cargarPagos]);

    const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));
    const pendientes = useMemo(
        () => pagos.filter((pago) => pago.permiteRevision).length,
        [pagos]
    );
    const aprobados = useMemo(
        () => pagos.filter((pago) => pago.estado === 'APROBADO').length,
        [pagos]
    );
    const totalVisible = useMemo(
        () => pagos
            .filter(
                (pago) =>
                    pago.estado === 'APROBADO'
            )
            .reduce(
                (suma, pago) =>
                    suma + Number(
                        pago.montoAprobado ??
                        pago.montoEsperado ??
                        0
                    ),
                0
            ),
        [pagos]
    );

    async function abrirDetalle(pagoId: string) {
        try {
            setCargandoDetalle(true);
            setError('');
            const data = await requestApi(`/admin/pagos/${pagoId}`);
            setDetalle(data);
        } catch (err: any) {
            setError(err?.message || 'No se pudo obtener el detalle del pago.');
        } finally {
            setCargandoDetalle(false);
        }
    }

    async function aprobarPago(pago: PagoAdmin) {
        if (!pago.permiteRevision || procesando) return;

        const confirmado = window.confirm(
            `¿Aprobar el pago de ${nombreCliente(pago)} por ${formatearDinero(pago.montoEsperado)}?`
        );

        if (!confirmado) return;

        try {
            setProcesando(true);
            setError('');
            setMensaje('');

            const data = await requestApi(
                `/admin/pagos/${pago.pagoId}/aprobar`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        montoAprobado: pago.montoEsperado,
                        observacionRevision:
                            'Pago aprobado desde el panel administrativo web.',
                    }),
                }
            );

            setMensaje(data.mensaje || 'Pago aprobado correctamente.');
            setDetalle(null);
            await cargarPagos();

        } catch (err: any) {
            setError(err?.message || 'No se pudo aprobar el pago.');
        } finally {
            setProcesando(false);
        }
    }

    async function confirmarRechazo() {
        if (!pagoRechazar || procesando) return;

        if (!motivoRechazo.trim()) {
            setError('Debe ingresar el motivo del rechazo.');
            return;
        }

        try {
            setProcesando(true);
            setError('');
            setMensaje('');

            const data = await requestApi(
                `/admin/pagos/${pagoRechazar.pagoId}/rechazar`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        motivoRechazo: motivoRechazo.trim(),
                        observacionRevision:
                            'Pago rechazado desde el panel administrativo web.',
                    }),
                }
            );

            setMensaje(data.mensaje || 'Pago rechazado correctamente.');
            setPagoRechazar(null);
            setMotivoRechazo('');
            setDetalle(null);
            await cargarPagos();

        } catch (err: any) {
            setError(err?.message || 'No se pudo rechazar el pago.');
        } finally {
            setProcesando(false);
        }
    }

    function aplicarBusqueda() {
        setPagina(1);
        setBuscarAplicado(buscar.trim());
    }

    function limpiarFiltros() {
        setEstado('');
        setMetodoPago('');
        setBuscar('');
        setBuscarAplicado('');
        setFechaDesde('');
        setFechaHasta('');
        setPagina(1);
    }

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1700px]">
                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="mt-1 rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-slate-300 transition hover:border-cyan-500 hover:text-cyan-300"
                            title="Regresar"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div>
                            <div className="mb-1 flex items-center gap-2 text-cyan-300">
                                <CircleDollarSign size={21} />
                                <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                                    Conciliación de pagos
                                </span>
                            </div>
                            <h1 className="text-2xl font-black sm:text-3xl">
                                Pagos de la aplicación
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">
                                PayPhone se aprueba automáticamente. Revisa transferencias y depósitos pendientes.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={cargarPagos}
                        disabled={loading || procesando}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 font-bold transition hover:bg-cyan-500 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>

                <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ResumenCard
                        icono={<Banknote size={22} />}
                        titulo="Operaciones visibles"
                        valor={String(total)}
                        color="cyan"
                    />
                    <ResumenCard
                        icono={<CalendarDays size={22} />}
                        titulo="Pendientes en esta página"
                        valor={String(pendientes)}
                        color="amber"
                    />
                    <ResumenCard
                        icono={<BadgeCheck size={22} />}
                        titulo="Aprobados en esta página"
                        valor={String(aprobados)}
                        color="emerald"
                    />
                    <ResumenCard
                        icono={<CircleDollarSign size={22} />}
                        titulo="Valor visible"
                        valor={formatearDinero(totalVisible)}
                        color="violet"
                    />
                </section>

                <section className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl shadow-black/10">
                    <div className="mb-3 flex items-center gap-2 text-slate-300">
                        <Filter size={18} />
                        <h2 className="font-bold">Filtros</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_190px_210px_170px_170px_auto]">
                        <div className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                            <input
                                value={buscar}
                                onChange={(event) => setBuscar(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') aplicarBusqueda();
                                }}
                                placeholder="Cliente, cédula o comprobante"
                                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-600"
                            />
                            <button
                                type="button"
                                onClick={aplicarBusqueda}
                                className="border-l border-slate-700 px-3 text-cyan-300 hover:bg-slate-800"
                                title="Buscar"
                            >
                                <Search size={18} />
                            </button>
                        </div>

                        <select
                            value={metodoPago}
                            onChange={(event) => {
                                setMetodoPago(event.target.value);
                                setPagina(1);
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                        >
                            <option value="">Todos los métodos</option>
                            <option value="PAYPHONE">PayPhone</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="DEPOSITO">Depósito</option>
                        </select>

                        <select
                            value={estado}
                            onChange={(event) => {
                                setEstado(event.target.value);
                                setPagina(1);
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                        >
                            <option value="">Todos los estados</option>
                            <option value="PENDIENTE_VALIDACION">Pendiente de validación</option>
                            <option value="APROBADO">Aprobado</option>
                            <option value="RECHAZADO">Rechazado</option>
                            <option value="ANULADO">Anulado</option>
                            <option value="INICIADO">Iniciado</option>
                            <option value="ERROR">Error</option>
                        </select>

                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(event) => {
                                setFechaDesde(event.target.value);
                                setPagina(1);
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                            title="Fecha desde"
                        />

                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(event) => {
                                setFechaHasta(event.target.value);
                                setPagina(1);
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                            title="Fecha hasta"
                        />

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
                        >
                            Limpiar
                        </button>
                    </div>
                </section>

                {mensaje && (
                    <Aviso tipo="success" mensaje={mensaje} onCerrar={() => setMensaje('')} />
                )}

                {error && (
                    <Aviso tipo="error" mensaje={error} onCerrar={() => setError('')} />
                )}

                <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/20">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1320px] text-sm">
                            <thead className="bg-slate-800/90 text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 text-left">Cliente</th>
                                    <th className="px-4 py-3 text-left">Método</th>
                                    <th className="px-4 py-3 text-left">Periodos</th>
                                    <th className="px-4 py-3 text-left">Referencia</th>
                                    <th className="px-4 py-3 text-right">Valor</th>
                                    <th className="px-4 py-3 text-left">Fecha</th>
                                    <th className="px-4 py-3 text-left">Servicio</th>
                                    <th className="px-4 py-3 text-left">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {pagos.map((pago) => (
                                    <tr
                                        key={pago.pagoId}
                                        className="border-t border-slate-800 transition hover:bg-slate-800/55"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-white">{nombreCliente(pago)}</p>
                                            <p className="text-xs text-slate-400">{pago.cedula || 'Sin cédula'}</p>
                                            <p className="text-xs text-slate-500">{pago.telefono || pago.email || '-'}</p>
                                        </td>

                                        <td className="px-4 py-3">
                                            <MetodoBadge metodo={pago.metodoPago} />
                                        </td>

                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-200">{pago.periodos || '-'}</p>
                                            <p className="text-xs text-slate-500">
                                                {pago.cantidadMensualidades} mensualidad(es)
                                            </p>
                                        </td>

                                        <td className="max-w-[220px] px-4 py-3">
                                            <p className="truncate font-mono text-xs text-slate-300" title={referenciaPago(pago)}>
                                                {referenciaPago(pago)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {pago.bancoEmisor || (pago.metodoPago === 'PAYPHONE' ? 'PayPhone' : 'Banco no indicado')}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3 text-right font-black text-emerald-300">
                                            {formatearDinero(
                                                pago.montoAprobado ??
                                                pago.montoDeclarado ??
                                                pago.montoEsperado
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatearFechaHora(pago.creadoEn)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <p className="font-mono text-xs text-cyan-300">{pago.ipCliente || 'Sin IP'}</p>
                                            <p className="text-xs text-slate-500">{pago.estadoServicio || '-'}</p>
                                        </td>

                                        <td className="px-4 py-3">
                                            <EstadoBadge estado={pago.estado} />
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirDetalle(pago.pagoId)}
                                                    disabled={cargandoDetalle}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 font-bold text-slate-100 hover:bg-slate-600 disabled:opacity-50"
                                                >
                                                    <Eye size={16} />
                                                    Ver
                                                </button>

                                                {pago.permiteRevision && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => aprobarPago(pago)}
                                                            disabled={procesando}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-bold hover:bg-emerald-500 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Aprobar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPagoRechazar(pago);
                                                                setMotivoRechazo('');
                                                            }}
                                                            disabled={procesando}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 font-bold hover:bg-rose-500 disabled:opacity-50"
                                                        >
                                                            <XCircle size={16} />
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {!loading && pagos.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-14 text-center text-slate-400">
                                            No se encontraron operaciones con los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}

                                {loading && (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-14 text-center text-slate-400">
                                            <LoaderCircle className="mx-auto mb-2 animate-spin text-cyan-400" size={28} />
                                            Cargando pagos...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-400">
                            Página {pagina} de {totalPaginas} · {total} operación(es)
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
                                disabled={pagina <= 1 || loading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold disabled:opacity-40"
                            >
                                <ChevronLeft size={17} />
                                Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))}
                                disabled={pagina >= totalPaginas || loading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold disabled:opacity-40"
                            >
                                Siguiente
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {detalle && (
                <DetallePagoModal
                    detalle={detalle}
                    procesando={procesando}
                    onCerrar={() => setDetalle(null)}
                    onAprobar={() => aprobarPago(detalle.pago)}
                    onRechazar={() => {
                        setPagoRechazar(detalle.pago);
                        setMotivoRechazo('');
                    }}
                />
            )}

            {pagoRechazar && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black">Rechazar pago</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    {nombreCliente(pagoRechazar)} · {formatearDinero(pagoRechazar.montoEsperado)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPagoRechazar(null)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                            Rechazar esta operación no corta el servicio automáticamente.
                        </div>

                        <label className="mb-1.5 block text-sm font-bold text-slate-300">
                            Motivo del rechazo
                        </label>
                        <textarea
                            value={motivoRechazo}
                            onChange={(event) => setMotivoRechazo(event.target.value)}
                            rows={4}
                            placeholder="Ejemplo: el valor o la referencia no coincide..."
                            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-600 focus:border-rose-500"
                        />

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPagoRechazar(null)}
                                className="rounded-xl bg-slate-700 px-4 py-2.5 font-bold hover:bg-slate-600"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarRechazo}
                                disabled={procesando || !motivoRechazo.trim()}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 font-bold hover:bg-rose-500 disabled:opacity-50"
                            >
                                {procesando && <LoaderCircle size={17} className="animate-spin" />}
                                Confirmar rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function DetallePagoModal({
    detalle,
    procesando,
    onCerrar,
    onAprobar,
    onRechazar,
}: {
    detalle: DetallePago;
    procesando: boolean;
    onCerrar: () => void;
    onAprobar: () => void;
    onRechazar: () => void;
}) {
    const { pago, mensualidades, comprobantes, eventos } = detalle;
    const comprobante = comprobantes[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900/95 p-5 backdrop-blur">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <MetodoBadge metodo={pago.metodoPago} />
                            <EstadoBadge estado={pago.estado} />
                        </div>
                        <h2 className="text-xl font-black sm:text-2xl">{nombreCliente(pago)}</h2>
                        <p className="mt-1 font-mono text-xs text-slate-500">{pago.pagoId}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-5">
                        <Panel titulo="Información del pago">
                            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                                <Dato titulo="Valor esperado" valor={formatearDinero(pago.montoEsperado)} />
                                <Dato titulo="Valor declarado" valor={formatearDinero(pago.montoDeclarado)} />
                                <Dato titulo="Valor detectado" valor={formatearDinero(pago.montoDetectado)} />
                                <Dato titulo="Banco" valor={pago.bancoEmisor || '-'} />
                                <Dato titulo="Referencia" valor={referenciaPago(pago)} />
                                <Dato titulo="Fecha" valor={formatearFechaHora(pago.creadoEn)} />
                                <Dato titulo="IP del servicio" valor={pago.ipCliente || '-'} />
                                <Dato titulo="Estado servicio" valor={pago.estadoServicio || '-'} />
                                <Dato titulo="Reactivado" valor={pago.servicioReactivadoEn ? formatearFechaHora(pago.servicioReactivadoEn) : '-'} />
                            </div>
                        </Panel>

                        <Panel titulo="Mensualidades y facturas">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[650px] text-sm">
                                    <thead className="text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="pb-2 text-left">Periodo</th>
                                            <th className="pb-2 text-right">Valor</th>
                                            <th className="pb-2 text-left">Mensualidad</th>
                                            <th className="pb-2 text-left">Factura</th>
                                            <th className="pb-2 text-left">Número</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mensualidades.map((item) => (
                                            <tr key={item.mensualidadId} className="border-t border-slate-800">
                                                <td className="py-3 font-bold">{item.periodo}</td>
                                                <td className="py-3 text-right text-emerald-300">{formatearDinero(item.valorAplicado)}</td>
                                                <td className="py-3"><MiniEstado valor={item.estadoMensualidad} /></td>
                                                <td className="py-3"><MiniEstado valor={item.estadoFactura || 'SIN FACTURA'} /></td>
                                                <td className="py-3 text-slate-400">{item.numeroFactura || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Panel>

                        {eventos.length > 0 && (
                            <Panel titulo="Historial de la operación">
                                <div className="space-y-3">
                                    {eventos.slice(0, 8).map((evento) => (
                                        <div key={evento.eventoId} className="border-l-2 border-cyan-500/50 pl-3">
                                            <p className="text-sm font-bold text-slate-200">{evento.tipoEvento.replaceAll('_', ' ')}</p>
                                            <p className="text-xs text-slate-400">{evento.descripcion || '-'}</p>
                                            <p className="mt-1 text-xs text-slate-600">{formatearFechaHora(evento.creadoEn)}</p>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        )}
                    </div>

                    <div>
                        <Panel titulo="Comprobante">
                            {comprobante?.archivoUrl ? (
                                <div>
                                    <a
                                        href={comprobante.archivoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mb-3 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-bold hover:bg-cyan-500"
                                    >
                                        <FileImage size={17} />
                                        Abrir comprobante
                                    </a>

                                    {esImagen(comprobante) ? (
                                        <a href={comprobante.archivoUrl} target="_blank" rel="noreferrer">
                                            <img
                                                src={comprobante.archivoUrl}
                                                alt="Comprobante de pago"
                                                className="max-h-[520px] w-full rounded-xl border border-slate-700 bg-white object-contain"
                                            />
                                        </a>
                                    ) : (
                                        <div className="rounded-xl border border-slate-700 bg-slate-950 p-8 text-center text-slate-400">
                                            <FileImage className="mx-auto mb-2" size={36} />
                                            Usa “Abrir comprobante” para visualizar el archivo.
                                        </div>
                                    )}

                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <Dato titulo="Lectura" valor={comprobante.lecturaEstado || '-'} />
                                        <Dato titulo="Banco detectado" valor={comprobante.bancoDetectado || '-'} />
                                        <Dato titulo="Número detectado" valor={comprobante.numeroDetectado || '-'} />
                                        <Dato titulo="Monto detectado" valor={formatearDinero(comprobante.montoDetectado)} />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                                    <FileImage className="mx-auto mb-2" size={36} />
                                    Esta operación no tiene comprobante bancario.
                                </div>
                            )}
                        </Panel>
                    </div>
                </div>

                {pago.permiteRevision && (
                    <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-800 bg-slate-900/95 p-4 backdrop-blur">
                        <button
                            type="button"
                            onClick={onRechazar}
                            disabled={procesando}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 font-bold hover:bg-rose-500 disabled:opacity-50"
                        >
                            <XCircle size={18} />
                            Rechazar
                        </button>
                        <button
                            type="button"
                            onClick={onAprobar}
                            disabled={procesando}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold hover:bg-emerald-500 disabled:opacity-50"
                        >
                            <CheckCircle2 size={18} />
                            Aprobar pago
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ResumenCard({
    icono,
    titulo,
    valor,
    color,
}: {
    icono: ReactNode;
    titulo: string;
    valor: string;
    color: 'cyan' | 'amber' | 'emerald' | 'violet';
}) {
    const colores = {
        cyan: 'border-cyan-500/20 from-cyan-500/15 text-cyan-300',
        amber: 'border-amber-500/20 from-amber-500/15 text-amber-300',
        emerald: 'border-emerald-500/20 from-emerald-500/15 text-emerald-300',
        violet: 'border-violet-500/20 from-violet-500/15 text-violet-300',
    };

    return (
        <div className={`rounded-2xl border bg-gradient-to-br ${colores[color]} to-slate-900 p-4`}>
            <div className="mb-3 flex items-center justify-between">
                <span className="rounded-xl bg-white/5 p-2">{icono}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
            <p className="mt-1 text-2xl font-black text-white">{valor}</p>
        </div>
    );
}

function Panel({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="mb-4 font-black text-slate-200">{titulo}</h3>
            {children}
        </section>
    );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
    return (
        <div>
            <p className="text-xs text-slate-500">{titulo}</p>
            <p className="mt-0.5 break-words font-semibold text-slate-200">{valor}</p>
        </div>
    );
}

function Aviso({
    tipo,
    mensaje,
    onCerrar,
}: {
    tipo: 'success' | 'error';
    mensaje: string;
    onCerrar: () => void;
}) {
    return (
        <div className={`mb-4 flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${tipo === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
            }`}>
            <span>{mensaje}</span>
            <button type="button" onClick={onCerrar}><X size={17} /></button>
        </div>
    );
}

function MetodoBadge({ metodo }: { metodo: MetodoPago }) {
    const configuracion = {
        PAYPHONE: {
            clases: 'bg-violet-500/15 text-violet-300 ring-violet-500/25',
            icono: <CreditCard size={14} />,
            texto: 'PayPhone',
        },
        TRANSFERENCIA: {
            clases: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/25',
            icono: <Banknote size={14} />,
            texto: 'Transferencia',
        },
        DEPOSITO: {
            clases: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
            icono: <Banknote size={14} />,
            texto: 'Depósito',
        },
    }[metodo];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${configuracion.clases}`}>
            {configuracion.icono}
            {configuracion.texto}
        </span>
    );
}

function EstadoBadge({ estado }: { estado: EstadoPago }) {
    const estilos: Record<EstadoPago, string> = {
        INICIADO: 'bg-slate-500/15 text-slate-300 ring-slate-500/25',
        PENDIENTE_VALIDACION: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
        APROBADO: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
        RECHAZADO: 'bg-rose-500/15 text-rose-300 ring-rose-500/25',
        ANULADO: 'bg-slate-500/15 text-slate-400 ring-slate-500/25',
        ERROR: 'bg-red-500/15 text-red-300 ring-red-500/25',
    };

    const etiquetas: Record<EstadoPago, string> = {
        INICIADO: 'Iniciado',
        PENDIENTE_VALIDACION: 'Pendiente',
        APROBADO: 'Aprobado',
        RECHAZADO: 'Rechazado',
        ANULADO: 'Anulado',
        ERROR: 'Error',
    };

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${estilos[estado]}`}>
            {etiquetas[estado]}
        </span>
    );
}

function MiniEstado({ valor }: { valor: string }) {
    const positivo = ['PAGADA', 'APROBADO', 'APLICADA'].includes(valor);

    return (
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${positivo
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'bg-slate-700 text-slate-300'
            }`}>
            {valor}
        </span>
    );
}

function nombreCliente(pago: PagoAdmin) {
    return `${pago.nombres || ''} ${pago.apellidos || ''}`.trim() || 'Cliente sin nombre';
}

function referenciaPago(pago: PagoAdmin) {
    if (pago.metodoPago === 'PAYPHONE') {
        return pago.payphoneTransactionId ||
            pago.payphoneClientTransactionId ||
            'Sin referencia';
    }

    return pago.numeroComprobante || 'Sin referencia';
}

function formatearDinero(valor: number | null | undefined) {
    return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(Number(valor || 0));
}

function formatearFechaHora(fecha: string | null | undefined) {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function esImagen(comprobante: ComprobanteDetalle) {
    return Boolean(
        comprobante.mimeType?.startsWith('image/') ||
        /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(comprobante.archivoUrl)
    );
}
