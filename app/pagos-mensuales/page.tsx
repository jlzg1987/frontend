// app/mensualidades/page.tsx
'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Download, Search, X } from 'lucide-react';

type Mensualidad = {
    mensualidadId: string;
    routerId?: number | string | null;
    servicioId: string;
    clienteId: string;
    ipCliente: string;
    periodo: string;
    fechaVencimiento: string;
    fechaLimiteCorte: string;
    valorMensual: number;
    estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CORTADA' | 'ANULADA';
    nombres: string;
    apellidos: string;
    telefono: string;
    cedula: string;
    direccion: string;
    nombrePlan: string;
    velocidadBajada: string;
    velocidadSubida: string;
    nombreRouter: string;
};
type ServicioManual = {
    servicioId: string;
    clienteId: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    nombrePlan: string;
    precioMensual: number;
    velocidadBajada?: string;
    velocidadSubida?: string;
    nombreRouter?: string | null;
    routerId?: number | null;
    ipCliente?: string | null;
    estadoServicio: string;
};


type FacturacionInternaProps = {
    onAbrirFacturasinternas: () => void;
    onAbrirAppPagos: () => void;
};
export default function MensualidadesPage({
    onAbrirFacturasinternas,
    onAbrirAppPagos,
}: FacturacionInternaProps) {
    const router = useRouter();
    const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<'TODAS' | Mensualidad['estado']>('TODAS');
    const [filtroRouterId, setFiltroRouterId] = useState('');
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [descargandoPdf, setDescargandoPdf] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [pagoSeleccionado, setPagoSeleccionado] = useState<Mensualidad | null>(null);
    const [valorPagado, setValorPagado] = useState('');
    const [formaPago, setFormaPago] = useState('EFECTIVO');
    const [referenciaPago, setReferenciaPago] = useState('');

    const [modalManual, setModalManual] = useState(false);
    const [servicioIdManual, setServicioIdManual] = useState('');
    const [anioManual, setAnioManual] = useState(new Date().getFullYear());
    const [mesManual, setMesManual] = useState(new Date().getMonth() + 1);

    const [tipoBusquedaManual, setTipoBusquedaManual] =
        useState<'CEDULA' | 'CLIENTE_ID'>('CEDULA');

    const [busquedaManual, setBusquedaManual] = useState('');
    const [buscandoCliente, setBuscandoCliente] = useState(false);

    const [serviciosManual, setServiciosManual] =
        useState<ServicioManual[]>([]);

    const [clienteManual, setClienteManual] = useState<{
        clienteId: string;
        cedula: string;
        nombres: string;
        apellidos: string;
        telefono?: string;
    } | null>(null);

    function cambiarFormaPago(valor: string) {
        setFormaPago(valor);

        if (valor === 'EFECTIVO') {
            setReferenciaPago('PAGO EN EFECTIVO');
        } else {
            setReferenciaPago('');
        }
    }

    async function buscarClienteManual() {
        const valor = busquedaManual.trim();

        if (!valor) {
            setMensaje(
                tipoBusquedaManual === 'CEDULA'
                    ? 'Ingrese la cédula del cliente'
                    : 'Ingrese el clienteId'
            );
            return;
        }

        try {
            setBuscandoCliente(true);
            setMensaje('');
            setClienteManual(null);
            setServiciosManual([]);
            setServicioIdManual('');

            const data = await requestApi(
                '/mensualidades/buscar-servicios',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        cedula:
                            tipoBusquedaManual === 'CEDULA'
                                ? valor
                                : undefined,

                        clienteId:
                            tipoBusquedaManual === 'CLIENTE_ID'
                                ? valor
                                : undefined,
                    }),
                }
            );

            const servicios = Array.isArray(data.servicios)
                ? data.servicios
                : [];

            setClienteManual(data.cliente || null);
            setServiciosManual(servicios);

            // Seleccionar automáticamente si solamente tiene un contrato.
            if (servicios.length === 1) {
                setServicioIdManual(servicios[0].servicioId);
            }
        } catch (error: any) {
            setMensaje(
                error.message ||
                'No se pudo encontrar al cliente'
            );
        } finally {
            setBuscandoCliente(false);
        }
    }

    useEffect(() => {
        cargarMensualidades();
    }, []);

    async function requestApi(
        url: string,
        options: RequestInit = {}
    ) {
        const token = getToken();
        const direccion = `${API_BASE}${url}`;

        console.log("Consultando API:", direccion);

        if (!token) {
            throw new Error(
                "No se encontró el token de autenticación"
            );
        }

        const res = await fetch(direccion, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });

        const contentType =
            res.headers.get("content-type") || "";

        const texto = await res.text();

        if (!contentType.includes("application/json")) {
            console.error("Respuesta no JSON:", {
                direccion,
                estado: res.status,
                contentType,
                respuesta: texto.slice(0, 300),
            });

            throw new Error(
                `La ruta ${direccion} respondió HTTP ${res.status} y no devolvió JSON`
            );
        }

        let data: any;

        try {
            data = texto ? JSON.parse(texto) : {};
        } catch {
            throw new Error(
                "El backend devolvió un JSON inválido"
            );
        }

        if (!res.ok || data.ok === false) {
            throw new Error(
                data.mensaje ||
                data.message ||
                `Error HTTP ${res.status}`
            );
        }

        return data;
    }

    async function cargarMensualidades() {
        try {
            setLoading(true);
            setMensaje("");

            const data = await requestApi(
                "/mensualidades/todas"
            );

            const registros = Array.isArray(data.datos)
                ? data.datos
                : [];

            setMensualidades(registros);
        } catch (error: any) {
            setMensaje(
                error.message ||
                "Error cargando mensualidades"
            );
        } finally {
            setLoading(false);
        }
    }

    async function generarMensualidades() {
        try {
            setLoading(true);
            const data = await requestApi('/mensualidades/generar-mes-actual', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            setMensaje(`Generadas: ${data.creadas} | Existentes: ${data.existentes}`);
            await cargarMensualidades();
        } catch (error: any) {
            setMensaje(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function marcarVencida(mensualidadId: string) {
        try {
            setLoading(true);
            const data = await requestApi(`/mensualidades/${mensualidadId}/marcar-vencida`, {
                method: 'PATCH',
            });

            setMensaje(data.message || 'Mensualidad marcada como vencida');
            await cargarMensualidades();
        } catch (error: any) {
            setMensaje(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function procesarCorte(mensualidadId: string) {
        try {
            setLoading(true);
            const data = await requestApi(`/mensualidades/${mensualidadId}/procesar-corte`, {
                method: 'PATCH',
            });

            setMensaje(data.message || 'Servicio cortado correctamente');
            await cargarMensualidades();
        } catch (error: any) {
            setMensaje(error.message);
        } finally {
            setLoading(false);
        }
    }

    function obtenerFormaPagoId(forma: string): number {
        const formasPago: Record<string, number> = {
            EFECTIVO: 7,
            TRANSFERENCIA: 8,
            DEPOSITO: 9,
            CHEQUE: 8,
            DATAFAST: 10,
            LINK_PAGO_SEGURO: 11,
            CREDITO: 12,
        };

        return formasPago[forma] || 7;
    }

    async function registrarPago() {
        if (!pagoSeleccionado || loading) return;

        const valor = Number(
            valorPagado || pagoSeleccionado.valorMensual
        );

        if (!Number.isFinite(valor) || valor <= 0) {
            setMensaje("Ingrese un valor pagado válido");
            return;
        }

        if (
            formaPago !== "EFECTIVO" &&
            !referenciaPago.trim()
        ) {
            setMensaje(
                "Ingrese la referencia o número del comprobante"
            );
            return;
        }

        try {
            setLoading(true);
            setMensaje("");

            const respuesta = await requestApi(
                "/mensualidades/registrar-pago",
                {
                    method: "POST",
                    body: JSON.stringify({
                        mensualidadId:
                            pagoSeleccionado.mensualidadId,

                        valorPagado: valor,

                        formaPagoId:
                            obtenerFormaPagoId(formaPago),

                        referenciaPago:
                            referenciaPago.trim() || null,

                        observacion:
                            `Forma de pago: ${formaPago}`,
                    }),
                }
            );

            if (!respuesta?.ok) {
                throw new Error(
                    respuesta?.mensaje ||
                    respuesta?.message ||
                    "No se pudo registrar el pago"
                );
            }

            setMensaje(
                respuesta.message ||
                "Pago registrado y factura interna generada correctamente"
            );

            setPagoSeleccionado(null);
            setValorPagado("");
            setFormaPago("EFECTIVO");
            setReferenciaPago("");

            await cargarMensualidades();
        } catch (error: any) {
            console.error(
                "Error registrando pago:",
                error
            );

            setMensaje(
                error?.message ||
                "Ocurrió un error registrando el pago"
            );
        } finally {
            setLoading(false);
        }
    }

    function colorEstado(estado: string) {
        if (estado === 'PENDIENTE') return 'bg-yellow-500/20 text-yellow-300';
        if (estado === 'VENCIDA') return 'bg-orange-500/20 text-orange-300';
        if (estado === 'CORTADA') return 'bg-red-500/20 text-red-300';
        if (estado === 'PAGADA') return 'bg-green-500/20 text-green-300';
        return 'bg-slate-500/20 text-slate-300';
    }



    const routersDisponibles = useMemo(() => {
        const mapa = new Map<string, string>();

        mensualidades.forEach((mensualidad) => {
            const routerId = String(mensualidad.routerId || '');

            if (routerId && !mapa.has(routerId)) {
                mapa.set(
                    routerId,
                    mensualidad.nombreRouter || `Router ${routerId}`
                );
            }
        });

        return Array.from(mapa.entries())
            .map(([routerId, nombreRouter]) => ({ routerId, nombreRouter }))
            .sort((a, b) => a.nombreRouter.localeCompare(b.nombreRouter));
    }, [mensualidades]);

    const mensualidadesDelRouter = useMemo(() => {
        const termino = filtroBusqueda
            .trim()
            .toLocaleLowerCase('es');

        return mensualidades.filter((mensualidad) => {
            const coincideRouter = !filtroRouterId ||
                String(mensualidad.routerId || '') === filtroRouterId;

            if (!coincideRouter) return false;
            if (!termino) return true;

            const nombreCompleto = `${mensualidad.nombres || ''} ${mensualidad.apellidos || ''}`
                .replace(/\s+/g, ' ')
                .trim()
                .toLocaleLowerCase('es');

            return (
                nombreCompleto.includes(termino) ||
                String(mensualidad.cedula || '').toLocaleLowerCase('es').includes(termino) ||
                String(mensualidad.ipCliente || '').toLocaleLowerCase('es').includes(termino)
            );
        });
    }, [mensualidades, filtroRouterId, filtroBusqueda]);

    const mensualidadesFiltradas = filtroEstado === 'TODAS'
        ? mensualidadesDelRouter
        : mensualidadesDelRouter.filter(
            (mensualidad) => mensualidad.estado === filtroEstado
        );

    const totalCartera = mensualidadesDelRouter
        .filter((mensualidad) => ['PENDIENTE', 'VENCIDA', 'CORTADA'].includes(mensualidad.estado))
        .reduce((total, mensualidad) => total + Number(mensualidad.valorMensual || 0), 0);

    async function descargarReporteIngresosPdf() {
        try {
            setDescargandoPdf(true);
            setMensaje('');

            const token = getToken();
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }

            const params = new URLSearchParams();
            if (filtroEstado !== 'TODAS') {
                params.set('estado', filtroEstado);
            }
            if (filtroRouterId) {
                params.set('routerId', filtroRouterId);
            }

            const res = await fetch(
                `${API_BASE}/mensualidades/reporte-ingresos-pdf?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                const contentType = res.headers.get('content-type') || '';
                const data = contentType.includes('application/json')
                    ? await res.json().catch(() => ({}))
                    : {};

                throw new Error(
                    data.message ||
                    data.mensaje ||
                    'No se pudo generar el reporte de ingresos'
                );
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `reporte-ingresos-${filtroEstado.toLowerCase()}-${filtroRouterId || 'todos'}.pdf`;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            URL.revokeObjectURL(url);
        } catch (error: any) {
            setMensaje(error.message || 'Error descargando el reporte de ingresos');
        } finally {
            setDescargandoPdf(false);
        }
    }
    function cerrarModalManual() {
        setModalManual(false);
        setTipoBusquedaManual('CEDULA');
        setBusquedaManual('');
        setClienteManual(null);
        setServiciosManual([]);
        setServicioIdManual('');
    }

    async function crearMensualidadManual() {
        if (!servicioIdManual) {
            setMensaje('Seleccione el contrato del cliente');
            return;
        }

        try {
            setLoading(true);
            setMensaje('');

            const resultado = await requestApi(
                '/mensualidades/crear-manual',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        servicioId: servicioIdManual,
                        anio: anioManual,
                        mes: mesManual,
                    }),
                }
            );

            setMensaje(
                resultado.message ||
                `Mensualidad ${anioManual}-${String(
                    mesManual
                ).padStart(2, '0')} creada correctamente`
            );

            cerrarModalManual();
            await cargarMensualidades();
        } catch (error: any) {
            setMensaje(
                error.message ||
                'No se pudo crear la mensualidad'
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">


                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setModalManual(true)}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Crear manual
                    </button>

                    <button
                        onClick={generarMensualidades}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Generar mensualidades
                    </button>

                    <button
                        onClick={() => setFiltroEstado('TODAS')}
                        disabled={loading}
                        className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Todos
                    </button>

                    <button
                        onClick={() => setFiltroEstado('PENDIENTE')}
                        disabled={loading}
                        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Pendientes
                    </button>

                    <button
                        onClick={() => setFiltroEstado('PAGADA')}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Pagados
                    </button>

                    <button
                        onClick={() => setFiltroEstado('CORTADA')}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Cortados
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={descargarReporteIngresosPdf}
                        disabled={loading || descargandoPdf}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        <Download size={17} />
                        {descargandoPdf
                            ? 'Generando PDF...'
                            : 'Reporte de ingresos'}
                    </button>

                    <button
                        onClick={() => onAbrirFacturasinternas()}
                        disabled={loading}
                        className="bg-red-400 hover:bg-red-500 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Facturación
                    </button>

                    <button
                        onClick={() => onAbrirAppPagos()}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Ver pagos
                    </button>
                </div>
            </div>

            {mensaje && (
                <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
                    {mensaje}
                </div>
            )}

            <div className="mb-5 rounded-2xl border border-cyan-500/20 bg-slate-900 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                            Buscar cliente
                        </label>
                        <div className="relative">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                            />
                            <input
                                type="text"
                                value={filtroBusqueda}
                                onChange={(e) => setFiltroBusqueda(e.target.value)}
                                placeholder="Nombre, cédula o dirección IP"
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-11 text-white outline-none focus:border-cyan-500"
                            />
                            {filtroBusqueda && (
                                <button
                                    type="button"
                                    onClick={() => setFiltroBusqueda('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                            Filtrar por router
                        </label>
                        <select
                            value={filtroRouterId}
                            onChange={(e) => setFiltroRouterId(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                        >
                            <option value="">Todos los routers</option>
                            {routersDisponibles.map((router) => (
                                <option key={router.routerId} value={router.routerId}>
                                    {router.nombreRouter}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {(filtroBusqueda || filtroRouterId || filtroEstado !== 'TODAS') && (
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
                        <span className="text-sm text-slate-400">
                            {mensualidadesFiltradas.length} mensualidad(es) encontrada(s)
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setFiltroBusqueda('');
                                setFiltroRouterId('');
                                setFiltroEstado('TODAS');
                            }}
                            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold hover:bg-slate-700"
                        >
                            <X size={16} />
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                <Card titulo="Todas" valor={mensualidadesDelRouter.length} activo={filtroEstado === 'TODAS'} onClick={() => setFiltroEstado('TODAS')} />
                <Card titulo="Pendientes" valor={mensualidadesDelRouter.filter(x => x.estado === 'PENDIENTE').length} activo={filtroEstado === 'PENDIENTE'} onClick={() => setFiltroEstado('PENDIENTE')} />
                <Card titulo="Vencidas" valor={mensualidadesDelRouter.filter(x => x.estado === 'VENCIDA').length} activo={filtroEstado === 'VENCIDA'} onClick={() => setFiltroEstado('VENCIDA')} />
                <Card titulo="Cortadas" valor={mensualidadesDelRouter.filter(x => x.estado === 'CORTADA').length} activo={filtroEstado === 'CORTADA'} onClick={() => setFiltroEstado('CORTADA')} />
                <Card titulo="Pagadas" valor={mensualidadesDelRouter.filter(x => x.estado === 'PAGADA').length} activo={filtroEstado === 'PAGADA'} onClick={() => setFiltroEstado('PAGADA')} />
            </div>

            <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
                <p className="text-slate-400 text-sm">Total cartera pendiente</p>
                <h2 className="text-2xl font-bold mt-1">${totalCartera.toFixed(2)}</h2>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-slate-300">
                            <tr>
                                <th className="p-3 text-left">Cliente</th>
                                <th className="p-3 text-left">Plan</th>
                                <th className="p-3 text-left">Router</th>
                                <th className="p-3 text-left">IP</th>
                                <th className="p-3 text-left">Periodo</th>
                                <th className="p-3 text-left">Vence</th>
                                <th className="p-3 text-left">Corte</th>
                                <th className="p-3 text-left">Valor</th>
                                <th className="p-3 text-left">Estado</th>
                                <th className="p-3 text-left">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {mensualidadesFiltradas.map((m) => (
                                <tr key={m.mensualidadId} className="border-t border-slate-800 hover:bg-slate-800/60">
                                    <td className="p-3">
                                        <div className="font-semibold">
                                            {m.nombres} {m.apellidos}
                                        </div>
                                        <div className="text-slate-400">{m.cedula}</div>
                                        <div className="text-slate-500">{m.telefono}</div>
                                    </td>

                                    <td className="p-3">
                                        <div>{m.nombrePlan}</div>
                                        <div className="text-slate-400">
                                            {m.velocidadBajada}/{m.velocidadSubida}
                                        </div>
                                    </td>

                                    <td className="p-3">{m.nombreRouter || 'Sin router'}</td>
                                    <td className="p-3">{m.ipCliente || 'Sin IP'}</td>
                                    <td className="p-3">{m.periodo}</td>
                                    <td className="p-3">{formatearFecha(m.fechaVencimiento)}</td>
                                    <td className="p-3">{formatearFecha(m.fechaLimiteCorte)}</td>
                                    <td className="p-3 font-bold">${Number(m.valorMensual).toFixed(2)}</td>

                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorEstado(m.estado)}`}>
                                            {m.estado}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {m.estado === 'PENDIENTE' && (
                                                <button
                                                    onClick={() => marcarVencida(m.mensualidadId)}
                                                    disabled={loading}
                                                    className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
                                                >
                                                    Marcar vencida
                                                </button>
                                            )}

                                            {(m.estado === 'PENDIENTE' || m.estado === 'VENCIDA') && (
                                                <button
                                                    onClick={() => procesarCorte(m.mensualidadId)}
                                                    disabled={loading}
                                                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
                                                >
                                                    Cortar
                                                </button>
                                            )}

                                            {m.estado !== 'PAGADA' && m.estado !== 'ANULADA' ? (
                                                <button
                                                    onClick={() => {
                                                        setPagoSeleccionado(m);
                                                        setValorPagado(Number(m.valorMensual).toFixed(2));
                                                        setFormaPago('EFECTIVO');
                                                        setReferenciaPago('PAGO EN EFECTIVO');
                                                        setMensaje('');
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg font-semibold"
                                                >
                                                    Registrar pago
                                                </button>
                                            ) : (
                                                <span className="text-slate-500">Sin acciones</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!loading && mensualidadesFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="p-6 text-center text-slate-400">
                                        No hay mensualidades para el filtro seleccionado.
                                    </td>
                                </tr>
                            )}

                            {loading && (
                                <tr>
                                    <td colSpan={10} className="p-6 text-center text-slate-400">
                                        Cargando...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagoSeleccionado && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Registrar pago</h2>

                        <div className="mb-4 text-sm text-slate-300">
                            <p>
                                Cliente: <strong>{pagoSeleccionado.nombres} {pagoSeleccionado.apellidos}</strong>
                            </p>
                            <p>Periodo: {pagoSeleccionado.periodo}</p>
                            <p>Valor: ${Number(pagoSeleccionado.valorMensual).toFixed(2)}</p>
                        </div>

                        <label className="block text-sm mb-1">Valor pagado</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={valorPagado}
                            onChange={(e) => setValorPagado(e.target.value)}
                            disabled={loading}
                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none disabled:opacity-50"
                        />
                        <label className="block text-sm mb-1">Forma de pago</label>
                        <select
                            value={formaPago}
                            onChange={(e) => cambiarFormaPago(e.target.value)}
                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none"
                        >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="DEPOSITO">Depósito</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="DATAFAST">Datafast</option>
                            <option value="LINK_PAGO_SEGURO">Link Pago Seguro</option>
                        </select>
                        <label className="block text-sm mb-1">Referencia / comprobante</label>
                        <input
                            value={referenciaPago}
                            onChange={(e) => setReferenciaPago(e.target.value)}
                            disabled={loading || formaPago === 'EFECTIVO'}
                            placeholder={
                                formaPago === 'EFECTIVO'
                                    ? 'Pago en efectivo'
                                    : 'Número de comprobante, banco, autorización...'
                            }

                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none disabled:opacity-60"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setPagoSeleccionado(null);
                                    setValorPagado('');
                                    setFormaPago('EFECTIVO');
                                    setReferenciaPago('');
                                }}
                                disabled={loading}
                                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={registrarPago}
                                disabled={
                                    loading ||
                                    !valorPagado ||
                                    Number(valorPagado) <= 0 ||
                                    (formaPago !== 'EFECTIVO' && !referenciaPago.trim())
                                }
                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Registrando...' : 'Guardar pago'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalManual && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6">
                        <h2 className="mb-1 text-xl font-bold">
                            Crear mensualidad manual
                        </h2>

                        <p className="mb-5 text-sm text-slate-400">
                            Busque al cliente y seleccione el contrato al
                            que se generará la mensualidad.
                        </p>

                        <label className="mb-1 block text-sm">
                            Buscar mediante
                        </label>

                        <select
                            value={tipoBusquedaManual}
                            onChange={(e) => {
                                setTipoBusquedaManual(
                                    e.target.value as
                                    | 'CEDULA'
                                    | 'CLIENTE_ID'
                                );

                                setBusquedaManual('');
                                setClienteManual(null);
                                setServiciosManual([]);
                                setServicioIdManual('');
                            }}
                            className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-purple-500"
                        >
                            <option value="CEDULA">
                                Cédula del cliente
                            </option>

                            <option value="CLIENTE_ID">
                                Cliente ID
                            </option>
                        </select>

                        <label className="mb-1 block text-sm">
                            {tipoBusquedaManual === 'CEDULA'
                                ? 'Número de cédula'
                                : 'Cliente ID'}
                        </label>

                        <div className="mb-5 flex gap-2">
                            <input
                                value={busquedaManual}
                                onChange={(e) =>
                                    setBusquedaManual(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        buscarClienteManual();
                                    }
                                }}
                                placeholder={
                                    tipoBusquedaManual === 'CEDULA'
                                        ? 'Ejemplo: 0801234567'
                                        : 'Ingrese el clienteId'
                                }
                                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-purple-500"
                            />

                            <button
                                type="button"
                                onClick={buscarClienteManual}
                                disabled={
                                    buscandoCliente ||
                                    !busquedaManual.trim()
                                }
                                className="rounded-xl bg-cyan-600 px-4 py-3 font-semibold hover:bg-cyan-700 disabled:opacity-50"
                            >
                                {buscandoCliente
                                    ? 'Buscando...'
                                    : 'Buscar'}
                            </button>
                        </div>

                        {clienteManual && (
                            <div className="mb-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                                <p className="font-bold text-cyan-200">
                                    {clienteManual.nombres}{' '}
                                    {clienteManual.apellidos}
                                </p>

                                <p className="mt-1 text-sm text-slate-300">
                                    Cédula: {clienteManual.cedula}
                                </p>

                                <p className="text-sm text-slate-400">
                                    Cliente ID: {clienteManual.clienteId}
                                </p>
                            </div>
                        )}

                        {serviciosManual.length > 0 && (
                            <>
                                <label className="mb-2 block text-sm font-semibold">
                                    Seleccione el contrato
                                </label>

                                <div className="mb-5 space-y-3">
                                    {serviciosManual.map((servicio) => {
                                        const seleccionado =
                                            servicioIdManual ===
                                            servicio.servicioId;

                                        return (
                                            <button
                                                key={servicio.servicioId}
                                                type="button"
                                                onClick={() =>
                                                    setServicioIdManual(
                                                        servicio.servicioId
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 text-left transition ${seleccionado
                                                    ? 'border-purple-400 bg-purple-500/15'
                                                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="font-bold">
                                                        {servicio.nombrePlan}
                                                    </span>

                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs font-bold ${servicio.estadoServicio ===
                                                            'ACTIVO'
                                                            ? 'bg-green-500/20 text-green-300'
                                                            : 'bg-orange-500/20 text-orange-300'
                                                            }`}
                                                    >
                                                        {
                                                            servicio.estadoServicio
                                                        }
                                                    </span>
                                                </div>

                                                <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-300 sm:grid-cols-2">
                                                    <p>
                                                        Valor: $
                                                        {Number(
                                                            servicio.precioMensual
                                                        ).toFixed(2)}
                                                    </p>

                                                    <p>
                                                        Router:{' '}
                                                        {servicio.nombreRouter ||
                                                            'Sin router'}
                                                    </p>

                                                    <p>
                                                        IP:{' '}
                                                        {servicio.ipCliente ||
                                                            'Sin IP'}
                                                    </p>

                                                    <p>
                                                        Velocidad:{' '}
                                                        {servicio.velocidadBajada ||
                                                            '-'}
                                                        /
                                                        {servicio.velocidadSubida ||
                                                            '-'}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm">
                                    Año
                                </label>

                                <input
                                    type="number"
                                    value={anioManual}
                                    onChange={(e) =>
                                        setAnioManual(
                                            Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm">
                                    Mes
                                </label>

                                <select
                                    value={mesManual}
                                    onChange={(e) =>
                                        setMesManual(
                                            Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none"
                                >
                                    <option value={1}>Enero</option>
                                    <option value={2}>Febrero</option>
                                    <option value={3}>Marzo</option>
                                    <option value={4}>Abril</option>
                                    <option value={5}>Mayo</option>
                                    <option value={6}>Junio</option>
                                    <option value={7}>Julio</option>
                                    <option value={8}>Agosto</option>
                                    <option value={9}>Septiembre</option>
                                    <option value={10}>Octubre</option>
                                    <option value={11}>Noviembre</option>
                                    <option value={12}>Diciembre</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={cerrarModalManual}
                                className="rounded-xl bg-slate-700 px-4 py-2 hover:bg-slate-600"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={crearMensualidadManual}
                                disabled={
                                    loading ||
                                    buscandoCliente ||
                                    !servicioIdManual
                                }
                                className="rounded-xl bg-purple-600 px-4 py-2 font-semibold hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading
                                    ? 'Creando...'
                                    : 'Crear mensualidad'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function Card({
    titulo,
    valor,
    activo = false,
    onClick,
}: {
    titulo: string;
    valor: any;
    activo?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-5 text-left transition ${activo
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                }`}
        >
            <p className="text-slate-400 text-sm">{titulo}</p>
            <h2 className="text-2xl font-bold mt-1">{valor}</h2>
        </button>
    );
}

function formatearFecha(fecha: string) {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleDateString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}
