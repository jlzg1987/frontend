
'use client';

import {
    Activity,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Gauge,
    History,
    Loader2,
    PauseCircle,
    Play,
    RadioTower,
    RefreshCw,
    Router as RouterIcon,
    Search,
    Signal,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE, getToken } from '@/src/lib/api';

type EstadoMonitoreo =
    | 'PROGRAMADO'
    | 'ACTIVO'
    | 'FINALIZADO'
    | 'CANCELADO'
    | 'ERROR';

type ResumenMonitoreo = {
    totalMuestras?: number;
    muestrasConectado?: number;
    muestrasDesconectado?: number;
    disponibilidadPorcentaje?: number;
    latenciaPromedioMs?: number | null;
    latenciaMinimaMs?: number | null;
    latenciaMaximaMs?: number | null;
    perdidaPromedioPorcentaje?: number | null;
    perdidaMaximaPorcentaje?: number | null;
    descargaMaximaBps?: number;
    subidaMaximaBps?: number;
    bytesDescargadosDuranteMonitoreo?: number;
    bytesSubidosDuranteMonitoreo?: number;
    clasificacion?: string;
};

type Monitoreo = {
    monitoreoId: string;
    clienteId: number;
    contratoId?: number | null;
    routerId: number;
    routerNombre?: string | null;
    ipCliente: string;
    macCliente?: string | null;
    queueNombre?: string | null;
    intervaloSegundos: number;
    duracionMinutos: number;
    fechaInicio: string;
    fechaFinProgramada: string;
    fechaFinReal?: string | null;
    estado: EstadoMonitoreo;
    motivo?: string | null;
    resumen?: ResumenMonitoreo | string | null;
    totalMuestras?: number;
    ultimaMuestraEn?: string | null;
};

type Muestra = {
    muestraId: number;
    monitoreoId: string;
    conectado: number | boolean;
    latenciaMs: number | null;
    perdidaPorcentaje: number | null;
    descargaBps: number | null;
    subidaBps: number | null;
    bytesDescarga: number | null;
    bytesSubida: number | null;
    senalRx: number | null;
    senalTx: number | null;
    ccq: number | null;
    ruido: number | null;
    uptimeSegundos: number | null;
    observacion?: string | null;
    tomadoEn: string;
};

type Formulario = {
    clienteId: string;
    contratoId: string;
    routerId: string;
    ipCliente: string;
    macCliente: string;
    queueNombre: string;
    intervaloSegundos: string;
    duracionMinutos: string;
    motivo: string;
};

const FORMULARIO_INICIAL: Formulario = {
    clienteId: '',
    contratoId: '',
    routerId: '',
    ipCliente: '',
    macCliente: '',
    queueNombre: '',
    intervaloSegundos: '10',
    duracionMinutos: '30',
    motivo: '',
};

async function apiFetch(url: string, options: RequestInit = {}) {
    const token = getToken();

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(url, {
        ...options,
        cache: 'no-store',
        headers,
    });

    const texto = await response.text();
    let data: any = null;

    try {
        data = texto ? JSON.parse(texto) : {};
    } catch {
        throw new Error('El servidor devolvió una respuesta no válida');
    }

    if (!response.ok || data?.ok === false) {
        throw new Error(
            data?.message || data?.mensaje || 'No se pudo completar la solicitud'
        );
    }

    return data;
}

export default function MonitoreoClientePage({
    onVolver,
}: {
    onVolver: () => void;
}) {
    const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_INICIAL);
    const [monitoreo, setMonitoreo] = useState<Monitoreo | null>(null);
    const [muestras, setMuestras] = useState<Muestra[]>([]);
    const [historial, setHistorial] = useState<Monitoreo[]>([]);
    const [iniciando, setIniciando] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    const [consultando, setConsultando] = useState(false);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const monitoreoId = monitoreo?.monitoreoId || '';
    const activo = monitoreo?.estado === 'ACTIVO';

    const cargarMonitoreo = useCallback(
        async (id: string, mostrarCarga = false) => {
            if (!id) return;

            try {
                if (mostrarCarga) setConsultando(true);

                const [detalle, listaMuestras] = await Promise.all([
                    apiFetch(`${API_BASE}/cliente-monitoreo/${id}`),
                    apiFetch(
                        `${API_BASE}/cliente-monitoreo/${id}/muestras?limite=10000`
                    ),
                ]);

                setMonitoreo(detalle.data);
                setMuestras(listaMuestras.datos || []);
                setError('');
            } catch (err: any) {
                setError(err.message || 'Error actualizando el monitoreo');
            } finally {
                if (mostrarCarga) setConsultando(false);
            }
        },
        []
    );

    useEffect(() => {
        if (!monitoreoId || !activo) return;

        const intervalo = window.setInterval(() => {
            void cargarMonitoreo(monitoreoId, false);
        }, 5000);

        return () => window.clearInterval(intervalo);
    }, [activo, cargarMonitoreo, monitoreoId]);

    const cambiarCampo = (
        campo: keyof Formulario,
        valor: string
    ) => {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
    };

    const iniciarMonitoreo = async () => {
        try {
            setIniciando(true);
            setError('');
            setMensaje('');

            if (!formulario.clienteId || !formulario.routerId || !formulario.ipCliente) {
                throw new Error('Cliente, router e IP son obligatorios');
            }

            const respuesta = await apiFetch(
                `${API_BASE}/cliente-monitoreo`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        clienteId: Number(formulario.clienteId),
                        contratoId: formulario.contratoId
                            ? Number(formulario.contratoId)
                            : null,
                        routerId: Number(formulario.routerId),
                        ipCliente: formulario.ipCliente.trim(),
                        macCliente: formulario.macCliente.trim() || null,
                        queueNombre: formulario.queueNombre.trim() || null,
                        intervaloSegundos: Number(formulario.intervaloSegundos),
                        duracionMinutos: Number(formulario.duracionMinutos),
                        motivo: formulario.motivo.trim() || null,
                    }),
                }
            );

            setMonitoreo(respuesta.data);
            setMuestras([]);
            setMensaje('Monitoreo iniciado correctamente');

            window.setTimeout(() => {
                void cargarMonitoreo(respuesta.data.monitoreoId, false);
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'No se pudo iniciar el monitoreo');
        } finally {
            setIniciando(false);
        }
    };

    const cancelarMonitoreo = async () => {
        if (!monitoreoId) return;

        const confirmar = window.confirm(
            '¿Deseas detener este monitoreo antes del tiempo programado?'
        );

        if (!confirmar) return;

        try {
            setCancelando(true);
            setError('');

            const respuesta = await apiFetch(
                `${API_BASE}/cliente-monitoreo/${monitoreoId}/cancelar`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        motivo: 'Cancelado manualmente desde el panel',
                    }),
                }
            );

            setMonitoreo(respuesta.data);
            setMensaje('Monitoreo detenido correctamente');
            await cargarMonitoreo(monitoreoId, false);
        } catch (err: any) {
            setError(err.message || 'No se pudo cancelar el monitoreo');
        } finally {
            setCancelando(false);
        }
    };

    const cargarHistorial = async () => {
        const clienteId = Number(formulario.clienteId || monitoreo?.clienteId || 0);

        if (!clienteId) {
            setError('Ingresa el ID del cliente para consultar su historial');
            return;
        }

        try {
            setCargandoHistorial(true);
            setError('');

            const respuesta = await apiFetch(
                `${API_BASE}/cliente-monitoreo/cliente/${clienteId}?limite=50`
            );

            setHistorial(respuesta.datos || []);
        } catch (err: any) {
            setError(err.message || 'No se pudo consultar el historial');
        } finally {
            setCargandoHistorial(false);
        }
    };

    const abrirMonitoreo = async (item: Monitoreo) => {
        setMonitoreo(item);
        setMuestras([]);
        await cargarMonitoreo(item.monitoreoId, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const ultimaMuestra = muestras[muestras.length - 1];
    const resumen = useMemo(() => {
        if (monitoreo?.resumen && typeof monitoreo.resumen === 'object') {
            return monitoreo.resumen;
        }
        return null;
    }, [monitoreo?.resumen]);

    const disponibilidadActual = useMemo(() => {
        if (!muestras.length) return 0;
        const conectadas = muestras.filter((m) => Boolean(m.conectado)).length;
        return (conectadas / muestras.length) * 100;
    }, [muestras]);

    return (
        <div className="space-y-6 pb-10">


            <button
                type="button"
                onClick={onVolver}
                className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-white/20"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>
            {monitoreo && (
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                        Sesión actual
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                        <EstadoPunto estado={monitoreo.estado} />
                        <div>
                            <p className="font-black">{monitoreo.ipCliente}</p>
                            <p className="text-xs text-slate-300">
                                {monitoreo.routerNombre || `Router ${monitoreo.routerId}`}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {(error || mensaje) && (
                <div
                    className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${error
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                >
                    {error || mensaje}
                </div>
            )}

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
                <div className="rounded-3xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                            <Play className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">
                                Nuevo monitoreo
                            </h2>
                            <p className="text-sm text-slate-500">
                                Configura el cliente y la duración.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <Campo
                            label="ID del cliente *"
                            type="number"
                            value={formulario.clienteId}
                            onChange={(v) => cambiarCampo('clienteId', v)}
                            placeholder="Ej. 25"
                        />
                        <Campo
                            label="ID del contrato"
                            type="number"
                            value={formulario.contratoId}
                            onChange={(v) => cambiarCampo('contratoId', v)}
                            placeholder="Opcional"
                        />
                        <div className="col-span-2">
                            <Campo
                                label="ID del router MikroTik *"
                                type="number"
                                value={formulario.routerId}
                                onChange={(v) => cambiarCampo('routerId', v)}
                                placeholder="Ej. 1"
                            />
                        </div>
                        <div className="col-span-2">
                            <Campo
                                label="IP del cliente *"
                                value={formulario.ipCliente}
                                onChange={(v) => cambiarCampo('ipCliente', v)}
                                placeholder="192.168.10.25"
                            />
                        </div>
                        <Campo
                            label="MAC del CPE"
                            value={formulario.macCliente}
                            onChange={(v) => cambiarCampo('macCliente', v)}
                            placeholder="Opcional"
                        />
                        <Campo
                            label="Simple Queue"
                            value={formulario.queueNombre}
                            onChange={(v) => cambiarCampo('queueNombre', v)}
                            placeholder="Automática por IP"
                        />

                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Intervalo
                            </span>
                            <select
                                value={formulario.intervaloSegundos}
                                onChange={(e) =>
                                    cambiarCampo('intervaloSegundos', e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="5">Cada 5 segundos</option>
                                <option value="10">Cada 10 segundos</option>
                                <option value="30">Cada 30 segundos</option>
                                <option value="60">Cada minuto</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Duración
                            </span>
                            <select
                                value={formulario.duracionMinutos}
                                onChange={(e) =>
                                    cambiarCampo('duracionMinutos', e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="15">15 minutos</option>
                                <option value="30">30 minutos</option>
                                <option value="60">1 hora</option>
                                <option value="360">6 horas</option>
                                <option value="720">12 horas</option>
                                <option value="1440">24 horas</option>
                            </select>
                        </label>

                        <label className="col-span-2 block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Motivo
                            </span>
                            <textarea
                                value={formulario.motivo}
                                onChange={(e) => cambiarCampo('motivo', e.target.value)}
                                rows={3}
                                placeholder="Ej. Cliente reporta microcortes"
                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={iniciarMonitoreo}
                        disabled={iniciando || activo}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {iniciando ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Play className="h-5 w-5" />
                        )}
                        {activo ? 'Hay un monitoreo activo' : 'Iniciar monitoreo'}
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Metrica
                            icono={ultimaMuestra?.conectado ? Wifi : WifiOff}
                            titulo="Estado"
                            valor={
                                !ultimaMuestra
                                    ? 'Sin datos'
                                    : ultimaMuestra.conectado
                                        ? 'Conectado'
                                        : 'Sin conexión'
                            }
                            color={
                                ultimaMuestra?.conectado
                                    ? 'emerald'
                                    : ultimaMuestra
                                        ? 'red'
                                        : 'slate'
                            }
                        />
                        <Metrica
                            icono={Gauge}
                            titulo="Latencia"
                            valor={formatearMs(ultimaMuestra?.latenciaMs)}
                            color="blue"
                        />
                        <Metrica
                            icono={Activity}
                            titulo="Pérdidas"
                            valor={formatearPorcentaje(
                                ultimaMuestra?.perdidaPorcentaje
                            )}
                            color={
                                Number(ultimaMuestra?.perdidaPorcentaje || 0) > 3
                                    ? 'red'
                                    : 'amber'
                            }
                        />
                        <Metrica
                            icono={Signal}
                            titulo="Disponibilidad"
                            valor={`${(
                                resumen?.disponibilidadPorcentaje ??
                                disponibilidadActual
                            ).toFixed(1)}%`}
                            color="cyan"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <MetricaGrande
                            icono={ArrowDown}
                            titulo="Descarga actual"
                            valor={formatearBps(ultimaMuestra?.descargaBps)}
                            detalle={`Máxima: ${formatearBps(
                                resumen?.descargaMaximaBps ??
                                maximo(muestras.map((m) => m.descargaBps))
                            )}`}
                            color="blue"
                        />
                        <MetricaGrande
                            icono={ArrowUp}
                            titulo="Subida actual"
                            valor={formatearBps(ultimaMuestra?.subidaBps)}
                            detalle={`Máxima: ${formatearBps(
                                resumen?.subidaMaximaBps ??
                                maximo(muestras.map((m) => m.subidaBps))
                            )}`}
                            color="violet"
                        />
                    </div>

                    <div className="rounded-3xl border bg-white p-5 shadow-sm md:p-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">
                                    Actividad en tiempo real
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Las últimas 60 muestras tomadas por el MikroTik.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={!monitoreoId || consultando}
                                    onClick={() =>
                                        void cargarMonitoreo(monitoreoId, true)
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${consultando ? 'animate-spin' : ''
                                            }`}
                                    />
                                    Actualizar
                                </button>

                                {activo && (
                                    <button
                                        type="button"
                                        disabled={cancelando}
                                        onClick={cancelarMonitoreo}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {cancelando ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <PauseCircle className="h-4 w-4" />
                                        )}
                                        Detener
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
                            <GraficaLineal
                                titulo="Latencia"
                                unidad="ms"
                                color="#2563eb"
                                datos={muestras
                                    .slice(-60)
                                    .map((m) => Number(m.latenciaMs || 0))}
                            />
                            <GraficaLineal
                                titulo="Pérdida de paquetes"
                                unidad="%"
                                color="#dc2626"
                                datos={muestras
                                    .slice(-60)
                                    .map((m) => Number(m.perdidaPorcentaje || 0))}
                            />
                            <GraficaLineal
                                titulo="Descarga"
                                unidad="Mbps"
                                color="#0891b2"
                                datos={muestras
                                    .slice(-60)
                                    .map((m) => Number(m.descargaBps || 0) / 1_000_000)}
                            />
                            <GraficaLineal
                                titulo="Subida"
                                unidad="Mbps"
                                color="#7c3aed"
                                datos={muestras
                                    .slice(-60)
                                    .map((m) => Number(m.subidaBps || 0) / 1_000_000)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {monitoreo && (
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-3xl border bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <RouterIcon className="h-6 w-6 text-blue-600" />
                            <h2 className="text-xl font-black">Sesión</h2>
                        </div>
                        <div className="mt-5 space-y-3">
                            <Info label="Cliente" value={`#${monitoreo.clienteId}`} />
                            <Info label="IP" value={monitoreo.ipCliente} />
                            <Info
                                label="Router"
                                value={
                                    monitoreo.routerNombre ||
                                    `Router #${monitoreo.routerId}`
                                }
                            />
                            <Info
                                label="Simple Queue"
                                value={monitoreo.queueNombre || 'Buscando por IP'}
                            />
                            <Info
                                label="Inicio"
                                value={formatearFecha(monitoreo.fechaInicio)}
                            />
                            <Info
                                label="Fin programado"
                                value={formatearFecha(monitoreo.fechaFinProgramada)}
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
                        <div className="flex items-center gap-3">
                            <Activity className="h-6 w-6 text-cyan-600" />
                            <h2 className="text-xl font-black">Diagnóstico</h2>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                            <MiniDato
                                label="Muestras"
                                value={String(resumen?.totalMuestras ?? muestras.length)}
                            />
                            <MiniDato
                                label="Latencia promedio"
                                value={formatearMs(
                                    resumen?.latenciaPromedioMs ??
                                    promedioNumeros(muestras.map((m) => m.latenciaMs))
                                )}
                            />
                            <MiniDato
                                label="Pérdida promedio"
                                value={formatearPorcentaje(
                                    resumen?.perdidaPromedioPorcentaje ??
                                    promedioNumeros(
                                        muestras.map((m) => m.perdidaPorcentaje)
                                    )
                                )}
                            />
                            <MiniDato
                                label="Clasificación"
                                value={resumen?.clasificacion || 'EN PROCESO'}
                            />
                            <MiniDato
                                label="Descargado"
                                value={formatearBytes(
                                    resumen?.bytesDescargadosDuranteMonitoreo
                                )}
                            />
                            <MiniDato
                                label="Subido"
                                value={formatearBytes(
                                    resumen?.bytesSubidosDuranteMonitoreo
                                )}
                            />
                            <MiniDato
                                label="Desconexiones"
                                value={String(
                                    resumen?.muestrasDesconectado ??
                                    muestras.filter((m) => !m.conectado).length
                                )}
                            />
                            <MiniDato
                                label="Estado"
                                value={monitoreo.estado}
                            />
                        </div>

                        {ultimaMuestra?.observacion && (
                            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <b>Última observación:</b> {ultimaMuestra.observacion}
                            </div>
                        )}
                    </div>
                </section>
            )}

            <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">
                                Historial del cliente
                            </h2>
                            <p className="text-sm text-slate-500">
                                Monitoreos anteriores y diagnósticos guardados.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={cargarHistorial}
                        disabled={cargandoHistorial}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {cargandoHistorial ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        Consultar historial
                    </button>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[850px] text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-3">Inicio</th>
                                <th>IP</th>
                                <th>Router</th>
                                <th>Duración</th>
                                <th>Muestras</th>
                                <th>Estado</th>
                                <th>Resultado</th>
                                <th className="text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map((item) => {
                                const itemResumen =
                                    item.resumen && typeof item.resumen === 'object'
                                        ? item.resumen
                                        : null;

                                return (
                                    <tr
                                        key={item.monitoreoId}
                                        className="border-b transition hover:bg-slate-50"
                                    >
                                        <td className="py-4 font-semibold text-slate-700">
                                            {formatearFecha(item.fechaInicio)}
                                        </td>
                                        <td className="font-bold text-slate-900">
                                            {item.ipCliente}
                                        </td>
                                        <td>{item.routerNombre || `#${item.routerId}`}</td>
                                        <td>{item.duracionMinutos} min</td>
                                        <td>{item.totalMuestras || 0}</td>
                                        <td>
                                            <EstadoBadge estado={item.estado} />
                                        </td>
                                        <td>
                                            {itemResumen?.clasificacion || '-'}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => void abrirMonitoreo(item)}
                                                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                                            >
                                                Ver monitoreo
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {!historial.length && (
                        <div className="py-10 text-center text-sm text-slate-500">
                            Ingresa el ID del cliente y consulta su historial.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function Campo({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
        </label>
    );
}

function Metrica({ icono: Icono, titulo, valor, color }: any) {
    const colores: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-700',
        red: 'bg-red-50 text-red-700',
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        slate: 'bg-slate-100 text-slate-700',
    };

    return (
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-xl p-2.5 ${colores[color]}`}>
                <Icono className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                {titulo}
            </p>
            <p className="mt-1 text-xl font-black text-slate-900 md:text-2xl">
                {valor}
            </p>
        </div>
    );
}

function MetricaGrande({ icono: Icono, titulo, valor, detalle, color }: any) {
    const esBlue = color === 'blue';

    return (
        <div
            className={`rounded-3xl border p-6 shadow-sm ${esBlue
                ? 'border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50'
                : 'border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50'
                }`}
        >
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-slate-300">{titulo}</p>
                    <p className="mt-2 text-3xl font-black text-white">{valor}</p>
                    <p className="mt-1 text-xs text-slate-200">{detalle}</p>
                </div>
                <div
                    className={`rounded-2xl p-4 ${esBlue
                        ? 'bg-blue-600 text-white'
                        : 'bg-violet-600 text-white'
                        }`}
                >
                    <Icono className="h-7 w-7" />
                </div>
            </div>
        </div>
    );
}

function GraficaLineal({
    titulo,
    unidad,
    color,
    datos,
}: {
    titulo: string;
    unidad: string;
    color: string;
    datos: number[];
}) {
    const ancho = 600;
    const alto = 180;
    const padding = 18;
    const max = Math.max(...datos, 1);
    const min = Math.min(...datos, 0);
    const rango = Math.max(max - min, 1);

    const puntos = datos
        .map((valor, index) => {
            const x =
                datos.length <= 1
                    ? ancho / 2
                    : padding +
                    (index / (datos.length - 1)) * (ancho - padding * 2);
            const y =
                alto -
                padding -
                ((valor - min) / rango) * (alto - padding * 2);
            return `${x},${y}`;
        })
        .join(' ');

    const ultimo = datos[datos.length - 1];

    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-800">{titulo}</p>
                <p className="text-lg font-black" style={{ color }}>
                    {ultimo === undefined ? '--' : ultimo.toFixed(2)} {unidad}
                </p>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl bg-white">
                {datos.length < 2 ? (
                    <div className="flex h-44 items-center justify-center text-sm text-slate-400">
                        Esperando muestras...
                    </div>
                ) : (
                    <svg
                        viewBox={`0 0 ${ancho} ${alto}`}
                        className="h-44 w-full"
                        preserveAspectRatio="none"
                        aria-label={`Gráfica de ${titulo}`}
                    >
                        {[0.25, 0.5, 0.75].map((fraccion) => (
                            <line
                                key={fraccion}
                                x1="0"
                                x2={ancho}
                                y1={alto * fraccion}
                                y2={alto * fraccion}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                            />
                        ))}
                        <polyline
                            fill="none"
                            stroke={color}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={puntos}
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}

function EstadoPunto({ estado }: { estado: EstadoMonitoreo }) {
    return (
        <span
            className={`h-3 w-3 rounded-full ${estado === 'ACTIVO'
                ? 'animate-pulse bg-emerald-400'
                : estado === 'FINALIZADO'
                    ? 'bg-blue-400'
                    : estado === 'CANCELADO'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                }`}
        />
    );
}

function EstadoBadge({ estado }: { estado: EstadoMonitoreo }) {
    const estilos: Record<EstadoMonitoreo, string> = {
        PROGRAMADO: 'bg-slate-100 text-slate-700',
        ACTIVO: 'bg-emerald-100 text-emerald-700',
        FINALIZADO: 'bg-blue-100 text-blue-700',
        CANCELADO: 'bg-amber-100 text-amber-700',
        ERROR: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${estilos[estado]}`}>
            {estado}
        </span>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-right text-sm font-bold text-slate-800">{value}</span>
        </div>
    );
}

function MiniDato({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 break-words text-lg font-black text-slate-900">
                {value}
            </p>
        </div>
    );
}

function formatearFecha(fecha?: string | null) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-EC');
}

function formatearMs(valor?: number | null) {
    if (valor === null || valor === undefined) return '--';
    return `${Number(valor).toFixed(1)} ms`;
}

function formatearPorcentaje(valor?: number | null) {
    if (valor === null || valor === undefined) return '--';
    return `${Number(valor).toFixed(1)}%`;
}

function formatearBps(valor?: number | null) {
    const bps = Number(valor || 0);

    if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
    if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
    if (bps >= 1_000) return `${(bps / 1_000).toFixed(2)} Kbps`;
    return `${bps.toFixed(0)} bps`;
}

function formatearBytes(valor?: number | null) {
    const bytes = Number(valor || 0);

    if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes.toFixed(0)} B`;
}

function maximo(valores: Array<number | null | undefined>) {
    return Math.max(...valores.map((v) => Number(v || 0)), 0);
}

function promedioNumeros(valores: Array<number | null | undefined>) {
    const validos = valores
        .filter((v) => v !== null && v !== undefined)
        .map(Number);

    if (!validos.length) return null;
    return validos.reduce((a, b) => a + b, 0) / validos.length;
}

