'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';


type EmailSri = {
    historialId: number;
    sriComprobanteId: number;
    facturaId: string;
    numeroFactura: string;
    emailDestino: string;
    cliente: string;
    estado: 'ENVIADO' | 'ERROR';
    mensajeError: string | null;
    tipoEnvio: 'MANUAL' | 'AUTOMATICO' | 'REENVIO';
    fechaEnvio: string;
    claveAcceso: string;
    estadoSri: string;
};

export default function HistorialEmailsSriPage() {
    const [emails, setEmails] = useState<EmailSri[]>([]);
    const [loading, setLoading] = useState(false);

    const [buscar, setBuscar] = useState('');
    const [estado, setEstado] = useState('');
    const [tipoEnvio, setTipoEnvio] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');

    const cargarHistorial = async () => {
        try {
            setLoading(true);

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

            const params = new URLSearchParams();

            if (buscar) params.append('buscar', buscar);
            if (estado) params.append('estado', estado);
            if (tipoEnvio) params.append('tipoEnvio', tipoEnvio);
            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);

            const resp = await fetch(
                `${API_BASE}/facturacion-sri/emails/historial?${params.toString()}`,
                {
                    headers: authHeaders(),
                }
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error cargando historial');
                return;
            }

            setEmails(data.data || []);

        } catch (error) {
            console.error('Error cargando historial emails SRI:', error);
            alert('Error cargando historial emails SRI');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarHistorial();
    }, []);

    const colorEstado = (e: string) => {
        if (e === 'ENVIADO') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
        return 'bg-red-500/15 text-red-300 border-red-500/40';
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">


            <section className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
                <input
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    placeholder="Buscar factura, cliente, email..."
                    className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                />

                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                >
                    <option value="">Todos los estados</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="ERROR">Error</option>
                </select>

                <select
                    value={tipoEnvio}
                    onChange={(e) => setTipoEnvio(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                >
                    <option value="">Todos los tipos</option>
                    <option value="MANUAL">Manual</option>
                    <option value="AUTOMATICO">Automático</option>
                    <option value="REENVIO">Reenvío</option>
                </select>

                <input
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                />

                <input
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                />

                <button
                    onClick={cargarHistorial}
                    className="md:col-span-6 bg-cyan-600 hover:bg-cyan-500 rounded-xl px-4 py-2 font-bold"
                >
                    {loading ? 'Buscando...' : 'Filtrar historial'}
                </button>
            </section>

            <section className="bg-slate-900/70 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-950 text-slate-300">
                            <tr>
                                <th className="text-left p-3">Fecha</th>
                                <th className="text-left p-3">Factura</th>
                                <th className="text-left p-3">Cliente</th>
                                <th className="text-left p-3">Email</th>
                                <th className="text-left p-3">Tipo</th>
                                <th className="text-left p-3">Estado</th>
                                <th className="text-left p-3">Detalle</th>
                            </tr>
                        </thead>

                        <tbody>
                            {emails.map((item) => (
                                <tr
                                    key={item.historialId}
                                    className="border-t border-slate-800 hover:bg-slate-800/50"
                                >
                                    <td className="p-3 text-slate-300">
                                        {new Date(item.fechaEnvio).toLocaleString()}
                                    </td>

                                    <td className="p-3 font-bold">
                                        {item.numeroFactura}
                                    </td>

                                    <td className="p-3">
                                        {item.cliente || 'Sin cliente'}
                                    </td>

                                    <td className="p-3 text-cyan-300">
                                        {item.emailDestino}
                                    </td>

                                    <td className="p-3">
                                        {item.tipoEnvio}
                                    </td>

                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-full border text-xs font-bold ${colorEstado(item.estado)}`}>
                                            {item.estado}
                                        </span>
                                    </td>

                                    <td className="p-3 text-slate-400 max-w-[300px] truncate">
                                        {item.mensajeError || 'Enviado correctamente'}
                                    </td>
                                </tr>
                            ))}

                            {emails.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-slate-400">
                                        No hay historial de emails SRI.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}