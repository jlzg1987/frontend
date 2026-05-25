'use client';

import { API_BASE } from '@/src/lib/api';
import { navigate } from 'next/dist/client/components/segment-cache/navigation';
import { networkInterfaces } from 'node:os';
import { useEffect, useState } from 'react';


export default function NotasCreditoPage() {
    const [notas, setNotas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [modalNueva, setModalNueva] = useState(false);

    const [facturas, setFacturas] = useState<any[]>([]);

    const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);

    const [motivo, setMotivo] = useState('');

    const [loadingCrear, setLoadingCrear] = useState(false);

    const [modalAnular, setModalAnular] = useState(false);
    const [notaAnular, setNotaAnular] = useState<any>(null);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [loadingAnular, setLoadingAnular] = useState(false);


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
    const cargarNotas = async () => {
        const res = await fetch(`${API_BASE}/sri/notas-credito`);
        const data = await res.json();
        setNotas(data.data || []);
    };

    const procesarSri = async (id: number) => {
        if (!confirm('¿Procesar esta nota de crédito en el SRI?')) return;

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/sri/notas-credito/${id}/procesar-sri`, {
                method: 'POST'
            });

            const data = await res.json();

            alert(data.message || 'Proceso finalizado');
            cargarNotas();
        } catch (error) {
            alert('Error procesando nota de crédito');
        } finally {
            setLoading(false);
        }
    };

    const cargarFacturasAutorizadas = async () => {
        try {

            const res = await fetch(
                `${API_BASE}/sri/notas-credito/facturas-autorizadas`
            );

            const data = await res.json();

            setFacturas(data.data || []);

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        cargarNotas();
    }, []);
    const crearNotaCredito = async () => {

        if (!facturaSeleccionada) {
            alert('Seleccione factura');
            return;
        }

        if (!motivo.trim()) {
            alert('Ingrese motivo');
            return;
        }

        setLoadingCrear(true);

        try {

            const detalles = facturaSeleccionada.detalles || [];

            if (detalles.length === 0) {
                alert('La factura seleccionada no tiene detalles cargados');
                return;
            }
            const items = detalles.map((d: any) => ({
                facturaDetalleId: d.detalleId,
                descripcion: d.descripcion,
                cantidad: Number(d.cantidad),
                precioUnitario: Number(d.precioUnitario),
                descuento: Number(d.valorDescuento || 0),
                ivaPorcentaje: 15
            }));

            const res = await fetch(
                `${API_BASE}/sri/notas-credito`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        facturaId: facturaSeleccionada.facturaId,
                        motivo,
                        items
                    })
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'Error');
                return;
            }

            alert('Nota crédito creada');

            setModalNueva(false);

            setMotivo('');
            setFacturaSeleccionada(null);

            cargarNotas();

        } catch (error) {

            console.error(error);

            alert('Error creando nota crédito');

        } finally {
            setLoadingCrear(false);
        }
    };

    const solicitarAnulacionNotaCredito = async () => {
        if (!notaAnular) {
            alert('Seleccione una nota de crédito');
            return;
        }

        if (!motivoAnulacion.trim()) {
            alert('Ingrese el motivo de anulación');
            return;
        }

        if (!confirm('¿Solicitar anulación de esta nota de crédito ante el SRI?')) return;

        setLoadingAnular(true);

        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/solicitar`,
                {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        notaCreditoId: notaAnular.notaCreditoId,
                        motivo: motivoAnulacion,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.message || data.mensaje || 'Error solicitando anulación');
            }

            alert(data.mensaje || 'Solicitud de anulación creada correctamente');

            setModalAnular(false);
            setNotaAnular(null);
            setMotivoAnulacion('');

            cargarNotas();

        } catch (error: any) {
            alert(error.message || 'Error solicitando anulación');
        } finally {
            setLoadingAnular(false);
        }
    };

    const abrirRideNotaCredito = async (notaCreditoId: number) => {
        try {

            const response = await fetch(
                `${API_BASE}/sri-notas-credito/${notaCreditoId}/ride-pdf`,
                {
                    headers: authHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error('No se pudo abrir el PDF');
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            window.open(url, '_blank');

        } catch (error) {
            console.error(error);
            alert('Error abriendo RIDE PDF');
        }
    };
    const reenviarEmailNotaCredito = async (notaCreditoId: number) => {
        try {

            const res = await fetch(`${API_BASE}/sri-notas-credito/${notaCreditoId}/reenviar-email`, {
                method: 'POST',
                headers: authHeaders(),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.message || 'Error enviando email');
            }

            alert('Email enviado correctamente');
        } catch (error: any) {
            alert(error.message || 'Error enviando email');
        }
    };

    const abrirWhatsAppNotaCredito = (nota: any) => {
        const mensaje = encodeURIComponent(
            `📄 *NOTA DE CRÉDITO ELECTRÓNICA*\n\n` +
            `Empresa: *Netcomp RF ISP*\n` +
            `No.: ${nota.numeroComprobante}\n` +
            `Cliente: ${nota.nombres || ''} ${nota.apellidos || ''}\n` +
            `Motivo: ${nota.motivo || ''}\n` +
            `Total: $${Number(nota.total || 0).toFixed(2)}\n` +
            `Estado SRI: ${nota.estadoSri}\n\n` +
            `Su nota de crédito fue autorizada por el SRI.`
        );

        const telefono = String(nota.telefono || '').replace(/\D/g, '');

        if (!telefono) {
            alert('Este cliente no tiene teléfono registrado: ' + nota.telefono);
            return;
        }

        window.open(`https://wa.me/593${telefono.slice(-9)}?text=${mensaje}`, '_blank');
    };


    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex justify-between items-center">


                    <button
                        onClick={() => {
                            setModalNueva(true);
                            cargarFacturasAutorizadas();
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl"
                    >
                        + Nueva nota crédito
                    </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-slate-300">
                            <tr>
                                <th className="p-3 text-left">#</th>
                                <th className="p-3 text-left">Factura</th>
                                <th className="p-3 text-left">Nota Crédito</th>
                                <th className="p-3 text-left">Motivo</th>
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3 text-center">Estado</th>
                                <th className="p-3 text-center">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {notas.map((n) => (
                                <tr key={n.notaCreditoId} className="border-t border-slate-800">
                                    <td className="p-3">{n.notaCreditoId}</td>
                                    <td className="p-3">{n.facturaNumero || n.facturaId}</td>
                                    <td className="p-3">{n.numeroComprobante || 'Pendiente'}</td>
                                    <td className="p-3">{n.motivo}</td>
                                    <td className="p-3 text-right">
                                        ${Number(n.total || 0).toFixed(2)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs ${n.estadoSri === 'AUTORIZADO'
                                            ? 'bg-green-600'
                                            : n.estadoSri === 'RECHAZADO'
                                                ? 'bg-red-600'
                                                : 'bg-yellow-600'
                                            }`}>
                                            {n.estadoSri}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center space-x-2">


                                        {n.estadoSri === 'AUTORIZADA' && (
                                            <div className="flex items-center justify-center gap-2 mt-3 whitespace-nowrap">
                                                <button
                                                    disabled={loading}
                                                    onClick={() => procesarSri(n.notaCreditoId)}
                                                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                                                >
                                                    Procesar SRI
                                                </button>
                                                <button
                                                    onClick={() => abrirRideNotaCredito(n.notaCreditoId)}
                                                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
                                                >
                                                    📄 Ver RIDE
                                                </button>

                                                <button
                                                    onClick={() => reenviarEmailNotaCredito(n.notaCreditoId)}
                                                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                                                >
                                                    ✉️ Reenviar Email
                                                </button>

                                                <button
                                                    onClick={() => abrirWhatsAppNotaCredito(n)}
                                                    className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
                                                >
                                                    🟢 WhatsApp
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setNotaAnular(n);
                                                        setMotivoAnulacion('');
                                                        setModalAnular(true);
                                                    }}
                                                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition"
                                                >
                                                    🛑 Anular
                                                </button>

                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {notas.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-slate-400">
                                        No hay notas de crédito registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {
                modalNueva && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

                        <div className="bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-700 p-6 space-y-5">

                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        Nueva Nota Crédito
                                    </h2>

                                    <p className="text-slate-400 text-sm">
                                        Crear devolución o reverso parcial/total.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setModalNueva(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div>
                                <label className="text-sm text-slate-300">
                                    Factura autorizada
                                </label>

                                <select
                                    value={facturaSeleccionada?.facturaId || ''}
                                    onChange={(e) => {

                                        const factura = facturas.find(
                                            (f: any) =>
                                                f.facturaId === e.target.value
                                        );

                                        setFacturaSeleccionada(factura);
                                    }}
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
                                >
                                    <option value="">
                                        Seleccione factura
                                    </option>

                                    {facturas.map((f: any) => (
                                        <option
                                            key={f.facturaId}
                                            value={f.facturaId}
                                        >
                                            {f.numeroComprobante}
                                            {' - '}
                                            {f.nombres}
                                            {' '}
                                            {f.apellidos}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {
                                facturaSeleccionada && (
                                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">

                                        <div className="grid grid-cols-2 gap-4 text-sm">

                                            <div>
                                                <span className="text-slate-400">
                                                    Cliente:
                                                </span>

                                                <div>
                                                    {facturaSeleccionada.nombres}
                                                    {' '}
                                                    {facturaSeleccionada.apellidos}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-slate-400">
                                                    Total factura:
                                                </span>

                                                <div>
                                                    $
                                                    {Number(
                                                        facturaSeleccionada.total
                                                    ).toFixed(2)}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )
                            }

                            <div>
                                <label className="text-sm text-slate-300">
                                    Motivo
                                </label>

                                <textarea
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    rows={4}
                                    placeholder="Ejemplo: devolución parcial por error de facturación"
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3"
                                />
                            </div>

                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() => setModalNueva(false)}
                                    className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
                                >
                                    Cancelar
                                </button>

                                <button
                                    disabled={loadingCrear}
                                    onClick={crearNotaCredito}
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {
                                        loadingCrear
                                            ? 'Creando...'
                                            : 'Crear Nota Crédito'
                                    }
                                </button>

                            </div>

                        </div>

                    </div>
                )
            }

            {modalAnular && notaAnular && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-700 p-6 space-y-5">

                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-red-400">
                                    Anular Nota de Crédito
                                </h2>

                                <p className="text-slate-400 text-sm">
                                    Esta solicitud será enviada al flujo de anulación SRI.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setModalAnular(false);
                                    setNotaAnular(null);
                                    setMotivoAnulacion('');
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm space-y-2">
                            <div>
                                <span className="text-slate-400">Nota crédito:</span>{' '}
                                {notaAnular.numeroComprobante}
                            </div>

                            <div>
                                <span className="text-slate-400">Cliente:</span>{' '}
                                {notaAnular.nombres} {notaAnular.apellidos}
                            </div>

                            <div>
                                <span className="text-slate-400">Total:</span>{' '}
                                ${Number(notaAnular.total || 0).toFixed(2)}
                            </div>

                            <div>
                                <span className="text-slate-400">Estado SRI:</span>{' '}
                                {notaAnular.estadoSri}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">
                                Motivo de anulación
                            </label>

                            <textarea
                                value={motivoAnulacion}
                                onChange={(e) => setMotivoAnulacion(e.target.value)}
                                rows={4}
                                placeholder="Ejemplo: nota de crédito emitida por error"
                                className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setModalAnular(false);
                                    setNotaAnular(null);
                                    setMotivoAnulacion('');
                                }}
                                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
                            >
                                Cancelar
                            </button>

                            <button
                                disabled={loadingAnular}
                                onClick={solicitarAnulacionNotaCredito}
                                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60"
                            >
                                {loadingAnular ? 'Solicitando...' : 'Solicitar anulación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}