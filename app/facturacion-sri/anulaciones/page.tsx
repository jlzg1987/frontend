'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useMemo, useState } from 'react';

type EstadoAnulacion = 'SOLICITADA' | 'ANULADA' | 'RECHAZADA';

type AnulacionSri = {
    anulacionId: number;
    sriComprobanteId: number;
    facturaId: string;
    empresaId: number;
    claveAcceso: string;
    numeroComprobante: string;
    motivo: string;
    estado: EstadoAnulacion;
    fechaSolicitud: string | null;
    fechaRespuesta: string | null;
    observacion: string | null;
    estadoSri: string;
    tipoComprobante: string;
    numeroAutorizacion: string | null;
    fechaAutorizacion: string | null;
    pdfRideUrl: string | null;
    nombre_comercial: string | null;
    razon_social: string | null;
    ruc: string | null;
};

export default function AnulacionesInternatPage() {
    const [anulaciones, setAnulaciones] = useState<AnulacionSri[]>([]);
    const [cargando, setCargando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'TODOS' | EstadoAnulacion>('TODOS');
    const [procesandoId, setProcesandoId] = useState<number | null>(null);

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
    const cargarAnulacionesSri = async () => {
        try {
            setCargando(true);

            const resp = await fetch(`${API_BASE}/sri-anulaciones`, {
                headers: authHeaders(),
            });

            const data = await resp.json();

            if (!resp.ok || !data.ok) {
                throw new Error(data.message || 'Error cargando anulaciones SRI');
            }

            setAnulaciones(data.data || []);
        } catch (error: any) {
            console.error('Error cargando anulaciones SRI:', error);
            alert(error.message || 'Error cargando anulaciones SRI');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarAnulacionesSri();
    }, []);

    const confirmarAnulacionSri = async (
        anulacionId: number,
        estado: 'ANULADA' | 'RECHAZADA'
    ) => {
        const mensaje =
            estado === 'ANULADA'
                ? 'Escriba la observación de la anulación aceptada:'
                : 'Escriba el motivo por el cual fue rechazada:';

        const observacion = window.prompt(mensaje);

        if (observacion === null) return;

        try {
            setProcesandoId(anulacionId);

            const resp = await fetch(
                `${API_BASE}/sri-anulaciones/${anulacionId}/confirmar`,
                {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify({
                        estado,
                        observacion,
                    }),
                }
            );

            const data = await resp.json();

            if (!resp.ok || !data.ok) {
                throw new Error(data.message || 'Error confirmando anulación');
            }

            alert(data.message || 'Anulación actualizada correctamente');
            await cargarAnulacionesSri();
        } catch (error: any) {
            console.error('Error confirmando anulación:', error);
            alert(error.message || 'Error confirmando anulación');
        } finally {
            setProcesandoId(null);
        }
    };

    const anulacionesFiltradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return anulaciones.filter((a) => {
            const cumpleEstado =
                filtroEstado === 'TODOS' || a.estado === filtroEstado;

            const cumpleBusqueda =
                !texto ||
                a.numeroComprobante?.toLowerCase().includes(texto) ||
                a.claveAcceso?.toLowerCase().includes(texto) ||
                a.motivo?.toLowerCase().includes(texto) ||
                a.nombre_comercial?.toLowerCase().includes(texto) ||
                a.razon_social?.toLowerCase().includes(texto) ||
                a.ruc?.toLowerCase().includes(texto);

            return cumpleEstado && cumpleBusqueda;
        });
    }, [anulaciones, busqueda, filtroEstado]);

    const colorEstado = (estado: string) => {
        switch (estado) {
            case 'SOLICITADA':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'ANULADA':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'RECHAZADA':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const colorEstadoSri = (estadoSri: string) => {
        switch (estadoSri) {
            case 'AUTORIZADO':
                return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'ANULACION_SOLICITADA':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            case 'ANULADO':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'ERROR':
            case 'DEVUELTA':
            case 'NO_AUTORIZADO':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const formatearFecha = (fecha: string | null) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleString('es-EC');
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">


                    <button
                        onClick={cargarAnulacionesSri}
                        disabled={cargando}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-semibold"
                    >
                        {cargando ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                        <p className="text-slate-400 text-sm">Total</p>
                        <p className="text-2xl font-bold">{anulaciones.length}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                        <p className="text-slate-400 text-sm">Solicitadas</p>
                        <p className="text-2xl font-bold text-yellow-300">
                            {anulaciones.filter((a) => a.estado === 'SOLICITADA').length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                        <p className="text-slate-400 text-sm">Anuladas</p>
                        <p className="text-2xl font-bold text-emerald-300">
                            {anulaciones.filter((a) => a.estado === 'ANULADA').length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                        <p className="text-slate-400 text-sm">Rechazadas</p>
                        <p className="text-2xl font-bold text-red-300">
                            {anulaciones.filter((a) => a.estado === 'RECHAZADA').length}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por comprobante, clave, empresa, RUC o motivo..."
                            className="md:col-span-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as any)}
                            className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="SOLICITADA">Solicitadas</option>
                            <option value="ANULADA">Anuladas</option>
                            <option value="RECHAZADA">Rechazadas</option>
                        </select>
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                    {cargando ? (
                        <div className="p-8 text-center text-slate-400">
                            Cargando anulaciones...
                        </div>
                    ) : anulacionesFiltradas.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            No hay anulaciones para mostrar.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-950/80">
                                    <tr className="text-slate-400 border-b border-slate-800">
                                        <th className="p-4 text-left">Comprobante</th>
                                        <th className="p-4 text-left">Empresa</th>
                                        <th className="p-4 text-left">Motivo</th>
                                        <th className="p-4 text-left">Estado</th>
                                        <th className="p-4 text-left">Estado SRI</th>
                                        <th className="p-4 text-left">Fechas</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {anulacionesFiltradas.map((a) => (
                                        <tr
                                            key={a.anulacionId}
                                            className="border-b border-slate-800 hover:bg-slate-800/40"
                                        >
                                            <td className="p-4 align-top">
                                                <div className="font-bold text-white">
                                                    {a.numeroComprobante}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 break-all max-w-xs">
                                                    {a.claveAcceso}
                                                </div>
                                                {a.numeroAutorizacion && (
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        Aut: {a.numeroAutorizacion}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-4 align-top">
                                                <div className="font-semibold">
                                                    {a.nombre_comercial || a.razon_social || 'Empresa'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {a.ruc || '-'}
                                                </div>
                                            </td>

                                            <td className="p-4 align-top max-w-sm">
                                                <p className="text-slate-300">
                                                    {a.motivo}
                                                </p>

                                                {a.observacion && (
                                                    <p className="text-xs text-slate-500 mt-2">
                                                        Obs: {a.observacion}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="p-4 align-top">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${colorEstado(
                                                        a.estado
                                                    )}`}
                                                >
                                                    {a.estado}
                                                </span>
                                            </td>

                                            <td className="p-4 align-top">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${colorEstadoSri(
                                                        a.estadoSri
                                                    )}`}
                                                >
                                                    {a.estadoSri}
                                                </span>
                                            </td>

                                            <td className="p-4 align-top text-xs text-slate-400">
                                                <div>
                                                    Solicitud:
                                                    <br />
                                                    <span className="text-slate-300">
                                                        {formatearFecha(a.fechaSolicitud)}
                                                    </span>
                                                </div>

                                                <div className="mt-2">
                                                    Respuesta:
                                                    <br />
                                                    <span className="text-slate-300">
                                                        {formatearFecha(a.fechaRespuesta)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="p-4 align-top">
                                                <div className="flex flex-col items-end gap-2">
                                                    {a.pdfRideUrl && (
                                                        <button
                                                            onClick={() => window.open(a.pdfRideUrl!, '_blank')}
                                                            className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold"
                                                        >
                                                            Ver RIDE
                                                        </button>
                                                    )}

                                                    {a.estado === 'SOLICITADA' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                disabled={procesandoId === a.anulacionId}
                                                                onClick={() =>
                                                                    confirmarAnulacionSri(
                                                                        a.anulacionId,
                                                                        'ANULADA'
                                                                    )
                                                                }
                                                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold"
                                                            >
                                                                Confirmar
                                                            </button>

                                                            <button
                                                                disabled={procesandoId === a.anulacionId}
                                                                onClick={() =>
                                                                    confirmarAnulacionSri(
                                                                        a.anulacionId,
                                                                        'RECHAZADA'
                                                                    )
                                                                }
                                                                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold"
                                                            >
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">
                                                            Finalizada
                                                        </span>
                                                    )}
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
        </main>
    );
}