'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '@/src/lib/api';
import { authHeaders } from '@/src/utils/authHeaders';

export default function HistorialAnulacionesNotasCreditoPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [estado, setEstado] = useState('');
    const [cedula, setCedula] = useState('');
    const [buscar, setBuscar] = useState('');

    const [modalLogs, setModalLogs] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [anulacionSeleccionada, setAnulacionSeleccionada] = useState<any>(null);

    const cargarHistorial = async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams();

            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);
            if (estado) params.append('estado', estado);
            if (cedula) params.append('cedula', cedula);
            if (buscar) params.append('buscar', buscar);

            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/historial?${params.toString()}`,
                { headers: authHeaders() }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'Error cargando historial');
            }

            setItems(data.data || []);
        } catch (error: any) {
            alert(error.message || 'Error cargando historial');
        } finally {
            setLoading(false);
        }
    };

    const limpiarFiltros = () => {
        setDesde('');
        setHasta('');
        setEstado('');
        setCedula('');
        setBuscar('');
    };

    const abrirLogs = async (item: any) => {
        setAnulacionSeleccionada(item);
        setModalLogs(true);
        setLoadingLogs(true);

        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/${item.anulacionNotaCreditoId}/logs`,
                { headers: authHeaders() }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'Error cargando logs');
            }

            setLogs(data.data || []);
        } catch (error: any) {
            alert(error.message || 'Error cargando logs');
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const aprobarAnulacion = async (id: number) => {
        if (!confirm('¿Aprobar y generar paquete SRI para esta anulación?')) return;

        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/${id}/aprobar`,
                {
                    method: 'PUT',
                    headers: authHeaders(),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'Error aprobando anulación');
            }

            alert(
                `${data.mensaje || 'Anulación aprobada correctamente'}\n\n` +
                `📦 El paquete CSV fue generado automáticamente.\n` +
                `⬇ Descargue el archivo CSV.\n` +
                `🌐 Luego súbalo manualmente al portal SRI para completar la anulación.`
            );
            cargarHistorial();
        } catch (error: any) {
            alert(error.message || 'Error aprobando anulación');
        }
    };

    const rechazarAnulacion = async (id: number) => {
        const motivo = prompt('Ingrese el motivo del rechazo:');

        if (!motivo || !motivo.trim()) return;

        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/${id}/rechazar`,
                {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify({ motivo }),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'Error rechazando anulación');
            }

            alert(data.mensaje || 'Anulación rechazada');
            cargarHistorial();
        } catch (error: any) {
            alert(error.message || 'Error rechazando anulación');
        }
    };

    const cancelarAnulacion = async (id: number) => {
        if (!confirm('¿Cancelar este proceso de anulación y regresar a SOLICITADA?')) {
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/${id}/cancelar`,
                {
                    method: 'PUT',
                    headers: authHeaders(),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'Error cancelando anulación');
            }

            alert(data.mensaje || 'Proceso cancelado');
            cargarHistorial();
        } catch (error: any) {
            alert(error.message || 'Error cancelando anulación');
        }
    };

    const confirmarAnulacionSri = async (id: number) => {
        const observacion = prompt(
            'Observación de confirmación SRI:',
            'Anulación confirmada en portal SRI'
        );

        if (observacion === null) return;

        if (!confirm('¿Confirmar que esta nota de crédito ya fue anulada en el SRI?')) {
            return;
        }

        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/${id}/confirmar-sri`,
                {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify({ observacion }),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'Error confirmando anulación');
            }

            alert(data.mensaje || 'Anulación confirmada');
            cargarHistorial();
        } catch (error: any) {
            alert(error.message || 'Error confirmando anulación');
        }
    };
    const API_ORIGIN = API_BASE.replace('/api', '');
    const descargarPaquete = async (id: number) => {
        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/${id}/paquete`,
                { headers: authHeaders() }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'No se pudo obtener el paquete');
            }

            window.open(`${API_ORIGIN}${data.archivoUrl}`, '_blank');
        } catch (error: any) {
            alert(error.message || 'Error descargando paquete');
        }
    };
    const abrirPdfAnulacion = async (id: number) => {
        try {
            const res = await fetch(
                `${API_BASE}/sri-notas-credito/anulaciones/${id}/pdf`,
                {
                    headers: authHeaders(),
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.mensaje || 'Error generando PDF');
            }

            window.open(`${API_ORIGIN}${data.archivoUrl}`, '_blank');
        } catch (error: any) {
            alert(error.message || 'Error abriendo PDF');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">


                <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="text-xs text-slate-400">Desde</label>
                        <input
                            type="date"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Hasta</label>
                        <input
                            type="date"
                            value={hasta}
                            onChange={(e) => setHasta(e.target.value)}
                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Estado</label>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                        >
                            <option value="">Todos</option>
                            <option value="SOLICITADA">Solicitada</option>
                            <option value="PENDIENTE_ANULAR_SRI">Pendiente anular SRI</option>
                            <option value="PENDIENTE_CONFIRMACION_RECEPTOR">Pendiente confirmación receptor</option>
                            <option value="ANULADA">Anulada</option>
                            <option value="RECHAZADA">Rechazada</option>
                            <option value="ERROR">Error</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Cédula/RUC</label>
                        <input
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            placeholder="Buscar por cédula"
                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Búsqueda general</label>
                        <input
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Cliente, clave, motivo..."
                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                        />
                    </div>

                    <div className="md:col-span-5 flex flex-wrap justify-end gap-3">
                        <button
                            onClick={limpiarFiltros}
                            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
                        >
                            Limpiar
                        </button>

                        <button
                            onClick={cargarHistorial}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex justify-between">
                        <h2 className="font-bold">Resultados</h2>
                        <span className="text-slate-400 text-sm">
                            {items.length} registros
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-6 text-slate-400">Cargando...</div>
                    ) : items.length === 0 ? (
                        <div className="p-6 text-slate-400">
                            No hay anulaciones registradas.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-950 text-slate-400">
                                    <tr>
                                        <th className="p-3 text-left">Fecha</th>
                                        <th className="p-3 text-left">Nota Crédito</th>
                                        <th className="p-3 text-left">Cliente</th>
                                        <th className="p-3 text-left">Cédula</th>
                                        <th className="p-3 text-left">Estado</th>
                                        <th className="p-3 text-right">Total</th>
                                        <th className="p-3 text-left">Límite SRI</th>
                                        <th className="p-3 text-left">Motivo</th>
                                        <th className="p-3 text-left">Descripción Estado</th>
                                        <th className="p-3 text-left">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {items.map((a) => (
                                        <tr
                                            key={a.anulacionId}
                                            className="border-t border-slate-800 hover:bg-slate-800/60"
                                        >
                                            <td className="p-3">
                                                {a.fechaSolicitud
                                                    ? new Date(a.fechaSolicitud).toLocaleString()
                                                    : '-'}
                                            </td>

                                            <td className="p-3 font-semibold">
                                                {a.numeroNotaCredito || a.numeroComprobante}
                                            </td>

                                            <td className="p-3">
                                                {a.nombres || 'Consumidor'} {a.apellidos || 'Final'}
                                            </td>

                                            <td className="p-3">
                                                {a.cedula || '-'}
                                            </td>

                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${a.estado === 'ANULADA'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : a.estado === 'RECHAZADA'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : a.estado === 'ERROR'
                                                            ? 'bg-orange-500/20 text-orange-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {a.estado}
                                                </span>
                                            </td>

                                            <td className="p-3 text-right">
                                                ${Number(a.totalNotaCredito || 0).toFixed(2)}
                                            </td>

                                            <td className="p-3">
                                                {a.fechaLimiteSri
                                                    ? new Date(a.fechaLimiteSri).toLocaleDateString()
                                                    : '-'}
                                            </td>

                                            <td className="p-3 max-w-xs truncate">
                                                {a.motivo || '-'}
                                            </td>
                                            <td className="p-3 max-w-xs truncate">
                                                {a.estado === 'PENDIENTE_CONFIRMACION_RECEPTOR' && (
                                                    <div className="mt-2 text-[11px] text-amber-400 font-medium">
                                                        ⚠ CSV generado. Debe subirse manualmente al portal SRI.
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 max-w-xs truncate gap-3">
                                                <div className="flex justify-end gap-3">

                                                    {a.estado === 'SOLICITADA' && (

                                                        <button
                                                            onClick={() => aprobarAnulacion(a.anulacionNotaCreditoId)}
                                                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                                        >
                                                            Aprobar
                                                        </button>

                                                    )}
                                                    {a.estado === 'SOLICITADA' && (
                                                        <button
                                                            onClick={() => rechazarAnulacion(a.anulacionNotaCreditoId)}
                                                            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    )}
                                                    {(a.estado === 'PENDIENTE_ANULAR_SRI' ||
                                                        a.estado === 'PENDIENTE_CONFIRMACION_RECEPTOR') && (
                                                            <button
                                                                onClick={() => cancelarAnulacion(a.anulacionNotaCreditoId)}
                                                                className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                    {a.estado === 'PENDIENTE_CONFIRMACION_RECEPTOR' && (
                                                        <button
                                                            onClick={() => confirmarAnulacionSri(a.anulacionNotaCreditoId)}
                                                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                                        >
                                                            Confirmar SRI
                                                        </button>
                                                    )}
                                                    {a.paqueteId && (
                                                        <button
                                                            title="Descargar paquete CSV para subir al portal SRI"
                                                            onClick={() => descargarPaquete(a.anulacionNotaCreditoId)}
                                                            className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold"
                                                        >
                                                            CSV SRI
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => abrirLogs(a)}
                                                        className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold"
                                                    >
                                                        Logs
                                                    </button>
                                                    <button
                                                        onClick={() => abrirPdfAnulacion(a.anulacionNotaCreditoId)}
                                                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                                                    >
                                                        PDF
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {modalLogs && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-700 p-6 space-y-5">

                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Logs de Anulación NC
                                </h2>

                                <p className="text-sm text-slate-400">
                                    {anulacionSeleccionada?.numeroNotaCredito ||
                                        anulacionSeleccionada?.numeroComprobante}
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setModalLogs(false);
                                    setLogs([]);
                                    setAnulacionSeleccionada(null);
                                }}
                                className="text-slate-400 hover:text-white text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {loadingLogs ? (
                            <p className="text-slate-400">Cargando logs...</p>
                        ) : logs.length === 0 ? (
                            <p className="text-slate-400">
                                No hay logs registrados para esta anulación.
                            </p>
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {logs.map((log) => (
                                    <div
                                        key={log.logId}
                                        className="flex gap-4 border-l-4 border-slate-700 pl-4"
                                    >
                                        <div
                                            className={`w-3 h-3 rounded-full mt-2 ${log.tipo === 'ERROR'
                                                ? 'bg-red-500'
                                                : log.tipo === 'SRI'
                                                    ? 'bg-blue-500'
                                                    : log.tipo === 'SISTEMA'
                                                        ? 'bg-purple-500'
                                                        : 'bg-emerald-500'
                                                }`}
                                        />

                                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                                            <div className="flex justify-between gap-3 mb-2">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${log.tipo === 'ERROR'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : log.tipo === 'SRI'
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : log.tipo === 'SISTEMA'
                                                                ? 'bg-purple-500/20 text-purple-400'
                                                                : 'bg-emerald-500/20 text-emerald-400'
                                                        }`}
                                                >
                                                    {log.tipo}
                                                </span>

                                                <span className="text-xs text-slate-500">
                                                    {log.createdAt
                                                        ? new Date(log.createdAt).toLocaleString()
                                                        : ''}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-200">
                                                {log.mensaje}
                                            </p>

                                            {log.usuario && (
                                                <p className="text-xs text-slate-500 mt-2">
                                                    Usuario: {log.usuario}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}