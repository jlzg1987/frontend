// app/sri/anulaciones/page.tsx
'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useMemo, useState } from 'react';



type Anulacion = {
    anulacionId: number;
    sriComprobanteId: number;
    facturaId: number;
    numeroComprobante: string;
    claveAcceso: string;
    motivo: string;
    estado: string;
    observacion?: string;
    fechaSolicitud?: string;
    fechaRespuesta?: string;
    clienteNombre?: string;
    total?: number;
    estadoSri?: string;
    paqueteId?: number;
    paqueteArchivoUrl?: string;
    paqueteFechaGeneracion?: string;
};

const estados = [
    'TODOS',
    'SOLICITADA',
    'PENDIENTE_ANULAR_SRI',
    'PENDIENTE_CONFIRMACION_RECEPTOR',
    'ANULADA',
    'RECHAZADA',
];

const colorEstado = (estado: string) => {
    switch (estado) {
        case 'SOLICITADA':
            return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
        case 'PENDIENTE_ANULAR_SRI':
            return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
        case 'PENDIENTE_CONFIRMACION_RECEPTOR':
            return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
        case 'ANULADA':
            return 'bg-green-500/15 text-green-300 border-green-500/30';
        case 'RECHAZADA':
            return 'bg-red-500/15 text-red-300 border-red-500/30';
        default:
            return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
};

const textoEstado = (estado: string) => {
    switch (estado) {
        case 'SOLICITADA':
            return 'Solicitada';
        case 'PENDIENTE_ANULAR_SRI':
            return 'Pendiente anular SRI';
        case 'PENDIENTE_CONFIRMACION_RECEPTOR':
            return 'Pendiente confirmación';
        case 'ANULADA':
            return 'Anulada';
        case 'RECHAZADA':
            return 'Rechazada';
        default:
            return estado || 'Sin estado';
    }
};

export default function AnulacionesSriPage() {
    const [data, setData] = useState<Anulacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState('TODOS');

    const cargar = async () => {
        try {
            setLoading(true);

            const resp = await fetch(`${API_BASE}/sri-anulaciones`);
            const json = await resp.json();

            if (!json.ok) {
                throw new Error(json.message || 'Error cargando anulaciones');
            }

            setData(json.data || []);
        } catch (error) {
            console.error(error);
            alert('Error cargando anulaciones SRI');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const filtradas = useMemo(() => {
        return data.filter((a) => {
            const texto = `
                ${a.numeroComprobante || ''}
                ${a.claveAcceso || ''}
                ${a.motivo || ''}
                ${a.clienteNombre || ''}
                ${a.estado || ''}
            `.toLowerCase();

            const coincideTexto = texto.includes(busqueda.toLowerCase());

            const coincideEstado =
                estadoFiltro === 'TODOS' || a.estado === estadoFiltro;

            return coincideTexto && coincideEstado;
        });
    }, [data, busqueda, estadoFiltro]);

    const resumen = useMemo(() => {
        return {
            total: data.length,
            solicitadas: data.filter(x => x.estado === 'SOLICITADA').length,
            pendientesSri: data.filter(x => x.estado === 'PENDIENTE_ANULAR_SRI').length,
            pendientesConfirmacion: data.filter(x => x.estado === 'PENDIENTE_CONFIRMACION_RECEPTOR').length,
            anuladas: data.filter(x => x.estado === 'ANULADA').length,
            rechazadas: data.filter(x => x.estado === 'RECHAZADA').length,
        };
    }, [data]);

    const confirmar = async (anulacionId: number, estado: 'ANULADA' | 'RECHAZADA') => {
        const observacion = prompt(
            estado === 'ANULADA'
                ? 'Observación de confirmación SRI'
                : 'Motivo de rechazo'
        );

        if (observacion === null) return;

        try {
            const resp = await fetch(`${API_BASE}/sri-anulaciones/${anulacionId}/confirmar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado, observacion }),
            });

            const json = await resp.json();

            if (!json.ok) {
                throw new Error(json.message);
            }

            alert(json.message);
            cargar();
        } catch (error: any) {
            alert(error.message || 'Error confirmando anulación');
        }
    };

    const marcarAnuladaSri = async (anulacionId: number) => {
        const observacion = prompt('Observación de anulación confirmada en portal SRI');

        if (observacion === null) return;

        try {
            const resp = await fetch(`${API_BASE}/sri-anulaciones/${anulacionId}/marcar-anulada-sri`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ observacion }),
            });

            const json = await resp.json();

            if (!json.ok) {
                throw new Error(json.message);
            }

            alert(json.message);
            cargar();
        } catch (error: any) {
            alert(error.message || 'Error marcando anulada en SRI');
        }
    };

    const generarPaquete = async () => {
        try {
            const resp = await fetch(`${API_BASE}/sri-anulaciones/paquete/generar`, {
                method: 'POST',
            });

            const json = await resp.json();

            if (!json.ok) {
                throw new Error(json.message);
            }

            alert(json.message);

            if (json.archivoUrl) {
                window.open(`${API_BASE.replace('/api', '')}${json.archivoUrl}`, '_blank');
            }

            cargar();
        } catch (error: any) {
            alert(error.message || 'Error generando paquete');
        }
    };
    const descargarPaquete = (archivoUrl?: string) => {
        if (!archivoUrl) {
            alert('Esta anulación aún no tiene paquete CSV generado');
            return;
        }

        const baseUrl = API_BASE.replace('/api', '');
        window.open(`${baseUrl}${archivoUrl}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">


                    <button
                        onClick={generarPaquete}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl font-semibold"
                    >
                        Generar paquete SRI
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Card title="Total" value={resumen.total} />
                    <Card title="Solicitadas" value={resumen.solicitadas} />
                    <Card title="Pend. SRI" value={resumen.pendientesSri} />
                    <Card title="Pend. confirmación" value={resumen.pendientesConfirmacion} />
                    <Card title="Anuladas" value={resumen.anuladas} />
                    <Card title="Rechazadas" value={resumen.rechazadas} />
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid md:grid-cols-2 gap-4">
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por factura, clave, cliente o motivo..."
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 outline-none"
                    />

                    <select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 outline-none"
                    >
                        {estados.map((e) => (
                            <option key={e} value={e}>
                                {e === 'TODOS' ? 'Todos los estados' : textoEstado(e)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-6 text-slate-400">Cargando anulaciones...</div>
                    ) : filtradas.length === 0 ? (
                        <div className="p-6 text-slate-400">No hay anulaciones registradas.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-950 text-slate-300">
                                    <tr>
                                        <th className="p-3 text-left">Factura</th>
                                        <th className="p-3 text-left">Cliente</th>
                                        <th className="p-3 text-left">Motivo</th>
                                        <th className="p-3 text-left">Estado</th>
                                        <th className="p-3 text-left">Observación</th>
                                        <th className="p-3 text-right">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filtradas.map((a) => (
                                        <tr key={a.anulacionId} className="border-t border-slate-800">
                                            <td className="p-3">
                                                <div className="font-semibold">{a.numeroComprobante}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[220px]">
                                                    {a.claveAcceso}
                                                </div>
                                            </td>

                                            <td className="p-3 text-slate-300">
                                                {a.clienteNombre || 'Sin cliente'}
                                            </td>

                                            <td className="p-3 text-slate-300 max-w-[260px]">
                                                {a.motivo}
                                            </td>

                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full border text-xs ${colorEstado(a.estado)}`}>
                                                    {textoEstado(a.estado)}
                                                </span>
                                            </td>

                                            <td className="p-3 text-slate-400 max-w-[260px]">
                                                {a.observacion || '-'}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex justify-end gap-2">
                                                    {a.estado === 'SOLICITADA' && (
                                                        <>
                                                            <button
                                                                onClick={() => confirmar(a.anulacionId, 'ANULADA')}
                                                                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg"
                                                            >
                                                                Aprobar
                                                            </button>

                                                            <button
                                                                onClick={() => confirmar(a.anulacionId, 'RECHAZADA')}
                                                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
                                                            >
                                                                Rechazar
                                                            </button>
                                                            {a.paqueteArchivoUrl && (
                                                                <button
                                                                    onClick={() => descargarPaquete(a.paqueteArchivoUrl)}
                                                                    className="bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded-lg"
                                                                >
                                                                    Descargar CSV
                                                                </button>
                                                            )}

                                                        </>
                                                    )}

                                                    {a.estado === 'PENDIENTE_CONFIRMACION_RECEPTOR' && (
                                                        <button
                                                            onClick={() => marcarAnuladaSri(a.anulacionId)}
                                                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg"
                                                        >
                                                            Confirmar SRI
                                                        </button>
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
        </div>
    );
}

function Card({ title, value }: { title: string; value: number }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400">{title}</p>
            <h2 className="text-2xl font-bold mt-1">{value}</h2>
        </div>
    );
}