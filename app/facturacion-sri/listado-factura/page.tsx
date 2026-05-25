'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';


type FacturaSri = {
    facturaId: number;
    numeroFactura: string;
    clienteId?: number | null;
    clienteExternoId?: number | null;
    tipoCliente?: 'ISP' | 'EXTERNO' | string;

    clienteNombre: string;
    clienteCedula: string;
    clienteCelular?: string;
    clienteEmail?: string;

    totalFinal: number;
    estadoFactura: string;
    fechaFactura: string;

    estadoSri?: string;
    claveAcceso?: string;
    numeroComprobante?: string;
    numeroAutorizacion?: string;
    pdfRideUrl?: string;
    mensajeSri?: string;
    estadoAnulacion?: string;
    sriComprobanteId: number;
};

export default function FacturacionSriPage() {
    const [facturas, setFacturas] = useState<FacturaSri[]>([]);
    const [loading, setLoading] = useState(false);
    const [procesandoId, setProcesandoId] = useState<number | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
    const [reenviandoId, setReenviandoId] = useState<number | null>(null);
    const [modalAnular, setModalAnular] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [procesandoAnulacion, setProcesandoAnulacion] = useState(false);

    function getToken() {
        if (typeof window === 'undefined') return '';

        return localStorage.getItem('isp_token') || '';
    }

    function authHeaders() {
        const token = getToken();

        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }


    useEffect(() => {
        cargarFacturas();
    }, []);

    async function cargarFacturas() {
        try {
            setLoading(true);

            const resp = await fetch(`${API_BASE}/facturacion-sri/facturas`);
            const data = await resp.json();

            if (data.ok) {
                setFacturas(data.data);
            }
        } catch (error) {
            console.error('Error cargando facturas SRI:', error);
        } finally {
            setLoading(false);
        }
    }

    async function procesarCompleto(facturaId: number) {
        try {
            setProcesandoId(facturaId);

            const resp = await fetch(
                `${API_BASE}/facturacion-sri/${facturaId}/procesar-completo`,
                { method: 'POST' }
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error procesando factura SRI');
                return;
            }

            alert('Factura procesada correctamente');
            await cargarFacturas();

        } catch (error) {
            console.error('Error procesando SRI:', error);
            alert('Error procesando factura SRI');
        } finally {
            setProcesandoId(null);
        }
    }

    function verRide(facturaId: number) {
        window.open(
            `${API_BASE}/facturacion-sri/${facturaId}/ride-pdf`,
            '_blank'
        );
    }

    const filtradas = facturas.filter((f) => {
        const texto = `
    ${f.numeroFactura || ''}
    ${f.clienteNombre || ''}
    ${f.clienteCedula || ''}
    ${f.clienteCelular || ''}
    ${f.clienteEmail || ''}
    ${f.tipoCliente || ''}
`.toLowerCase();
        const coincideTexto = texto.includes(busqueda.toLowerCase());

        const estado = f.estadoSri || 'SIN_PROCESAR';
        const coincideEstado =
            estadoFiltro === 'TODOS' || estadoFiltro === estado;

        return coincideTexto && coincideEstado;
    });

    function colorEstadoSri(estado?: string) {
        switch (estado) {
            case 'AUTORIZADO':
                return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
            case 'RECIBIDA':
                return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
            case 'FIRMADO':
                return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
            case 'GENERADO':
                return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
            case 'DEVUELTA':
            case 'NO_AUTORIZADO':
            case 'ERROR':
                return 'bg-red-500/15 text-red-300 border-red-500/30';
            default:
                return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
        }
    }

    const reenviarEmailSri = async (sriComprobanteId: number) => {
        try {
            setReenviandoId(sriComprobanteId);

            const token = localStorage.getItem('token');

            const resp = await fetch(
                `${API_BASE}/api/facturacion-sri/comprobantes/${sriComprobanteId}/reenviar-email`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await resp.json();

            if (!resp.ok || !data.ok) {
                alert(data.message || 'No se pudo reenviar el email');
                return;
            }

            alert('Email reenviado correctamente');

            await cargarFacturas();

        } catch (error) {
            console.error('Error reenviando email SRI:', error);
            alert('Error reenviando email SRI');
        } finally {
            setReenviandoId(null);
        }
    };

    const abrirModalAnular = (factura: any) => {
        setFacturaSeleccionada(factura);
        setMotivoAnulacion('');
        setModalAnular(true);
    };
    const solicitarAnulacionSri = async () => {
        if (!facturaSeleccionada) return;

        if (!motivoAnulacion.trim() || motivoAnulacion.trim().length < 5) {
            alert('Ingrese un motivo válido para la anulación.');
            return;
        }

        try {
            setProcesandoAnulacion(true);

            const resp = await fetch(
                `${API_BASE}/sri-anulaciones/factura/${facturaSeleccionada.sriComprobanteId}/solicitar`,
                {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        motivo: motivoAnulacion.trim(),
                    }),
                }
            );

            const data = await resp.json();

            if (!resp.ok || !data.ok) {
                throw new Error(data.message || 'Error solicitando anulación');
            }

            alert('Solicitud de anulación registrada correctamente.');

            setModalAnular(false);
            setFacturaSeleccionada(null);
            setMotivoAnulacion('');

            cargarFacturas();

        } catch (error: any) {
            console.error('Error solicitando anulación:', error);
            alert(error.message || 'Error solicitando anulación');
        } finally {
            setProcesandoAnulacion(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
            <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">


                <button
                    onClick={cargarFacturas}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold"
                >
                    Actualizar
                </button>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card titulo="Total facturas" valor={facturas.length} />
                <Card titulo="Autorizadas" valor={facturas.filter(f => f.estadoSri === 'AUTORIZADO').length} />
                <Card titulo="Pendientes" valor={facturas.filter(f => !f.estadoSri || f.estadoSri !== 'AUTORIZADO').length} />
                <Card titulo="Errores" valor={facturas.filter(f => ['DEVUELTA', 'NO_AUTORIZADO', 'ERROR'].includes(f.estadoSri || '')).length} />
            </section>

            <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 mb-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por factura, cliente o cédula..."
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 md:col-span-2"
                    />

                    <select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
                    >
                        <option value="TODOS">Todos los estados</option>
                        <option value="SIN_PROCESAR">Sin procesar</option>
                        <option value="GENERADO">Generado</option>
                        <option value="FIRMADO">Firmado</option>
                        <option value="RECIBIDA">Recibida</option>
                        <option value="AUTORIZADO">Autorizado</option>
                        <option value="DEVUELTA">Devuelta</option>
                        <option value="NO_AUTORIZADO">No autorizado</option>
                        <option value="ERROR">Error</option>
                        <option value="ANULACION_SOLICITADA">Anulación solicitada</option>

                    </select>
                </div>
            </section>

            <section className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">
                        Cargando facturas...
                    </div>
                ) : filtradas.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No hay facturas para mostrar.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-950/80 text-slate-300">
                                <tr>
                                    <th className="text-left p-4">Factura</th>
                                    <th className="text-left p-4">Cliente</th>
                                    <th className="text-left p-4">Total</th>
                                    <th className="text-left p-4">Estado SRI</th>
                                    <th className="text-left p-4">Autorización</th>
                                    <th className="text-right p-4">Acciones</th>
                                    <th className="text-right p-4">Reenviar email</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtradas.map((f) => (
                                    <tr
                                        key={f.facturaId}
                                        className="border-t border-slate-800 hover:bg-slate-800/40"
                                    >
                                        <td className="p-4">
                                            <div className="font-bold">{f.numeroFactura}</div>
                                            <div className="text-xs text-slate-500">
                                                ID: {f.facturaId}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-semibold">
                                                {f.clienteNombre || 'Consumidor final'}
                                            </div>

                                            <div className="text-xs text-slate-500">
                                                {f.clienteCedula || '9999999999999'}
                                            </div>

                                            <div className="text-[11px] mt-1">
                                                <span className={`px-2 py-0.5 rounded-full border ${f.tipoCliente === 'EXTERNO'
                                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                                    }`}>
                                                    {f.tipoCliente === 'EXTERNO' ? 'Cliente externo' : 'Cliente ISP'}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-4 font-bold">
                                            ${Number(f.totalFinal || 0).toFixed(2)}
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${colorEstadoSri(f.estadoSri)}`}>
                                                {f.estadoSri || 'SIN_PROCESAR'}
                                            </span>
                                        </td>

                                        <td className="p-4 max-w-[260px]">
                                            {f.numeroAutorizacion ? (
                                                <div className="text-xs text-slate-300 break-all">
                                                    {f.numeroAutorizacion}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 text-xs">
                                                    Sin autorización
                                                </span>

                                            )}
                                            {f.estadoAnulacion === 'SOLICITADA' && (
                                                <span className="text-yellow-400 text-xs">
                                                    Anulación solicitada
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => procesarCompleto(f.facturaId)}
                                                    disabled={procesandoId === f.facturaId}
                                                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-xs"
                                                >
                                                    {procesandoId === f.facturaId
                                                        ? 'Procesando...'
                                                        : 'Procesar SRI'}
                                                </button>

                                                <button
                                                    onClick={() => verRide(f.facturaId)}
                                                    disabled={f.estadoSri !== 'AUTORIZADO'}
                                                    className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 font-bold text-xs"
                                                >
                                                    RIDE PDF
                                                </button>
                                                {f.estadoSri === 'AUTORIZADO' && (
                                                    <button
                                                        onClick={() => abrirModalAnular(f)}
                                                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                                                    >
                                                        Anular
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => reenviarEmailSri(f.sriComprobanteId)}
                                                disabled={reenviandoId === f.facturaId}
                                                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold disabled:opacity-50"
                                            >
                                                {reenviandoId === f.facturaId ? 'Enviando...' : '📧 Reenviar email'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {modalAnular && facturaSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">

                        <h2 className="text-xl font-bold text-white mb-2">
                            Solicitar anulación SRI
                        </h2>

                        <p className="text-sm text-slate-400 mb-4">
                            Esta acción solo registra la solicitud interna de anulación.
                            Luego debes confirmar manualmente si el SRI aceptó o rechazó la anulación.
                        </p>

                        <div className="mb-4 rounded-xl bg-slate-800 border border-slate-700 p-4">
                            <p className="text-sm text-slate-300">
                                <span className="font-semibold text-white">Comprobante:</span>{' '}
                                {facturaSeleccionada.numeroComprobante}
                            </p>

                            <p className="text-sm text-slate-300 mt-1">
                                <span className="font-semibold text-white">Clave acceso:</span>{' '}
                                {facturaSeleccionada.claveAcceso}
                            </p>

                            <p className="text-sm text-slate-300 mt-1">
                                <span className="font-semibold text-white">Estado SRI:</span>{' '}
                                {facturaSeleccionada.estadoSri}
                            </p>
                        </div>

                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Motivo de anulación
                        </label>

                        <textarea
                            value={motivoAnulacion}
                            onChange={(e) => setMotivoAnulacion(e.target.value)}
                            rows={4}
                            placeholder="Ejemplo: Cliente solicitó anulación por error en los datos emitidos."
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 text-white px-4 py-3 outline-none focus:border-red-500"
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setModalAnular(false);
                                    setFacturaSeleccionada(null);
                                    setMotivoAnulacion('');
                                }}
                                disabled={procesandoAnulacion}
                                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={solicitarAnulacionSri}
                                disabled={procesandoAnulacion}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                            >
                                {procesandoAnulacion ? 'Procesando...' : 'Solicitar anulación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </main>
    );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-cyan-500/5">
            <p className="text-slate-400 text-sm">{titulo}</p>
            <h2 className="text-3xl font-black mt-2">{valor}</h2>
        </div>
    );
}