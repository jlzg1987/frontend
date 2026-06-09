// app/mensualidades/page.tsx
'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type Mensualidad = {
    mensualidadId: string;
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

export default function MensualidadesPage() {
    const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [pagoSeleccionado, setPagoSeleccionado] = useState<Mensualidad | null>(null);
    const [valorPagado, setValorPagado] = useState('');
    const [referenciaPago, setReferenciaPago] = useState('');

    const [modalManual, setModalManual] = useState(false);
    const [servicioIdManual, setServicioIdManual] = useState('');
    const [anioManual, setAnioManual] = useState(new Date().getFullYear());
    const [mesManual, setMesManual] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        cargarMensualidades();
    }, []);

    async function requestApi(url: string, options: RequestInit = {}) {
        const token = getToken();

        const res = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });

        const data = await res.json();

        if (!res.ok || data.ok === false) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    }

    async function cargarMensualidades() {
        try {
            setLoading(true);
            setMensaje('');

            const data = await requestApi('/mensualidades/pendientes');

            setMensualidades(data.datos || []);
        } catch (error: any) {
            setMensaje(error.message);
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

    async function marcarVencidas() {
        try {
            setLoading(true);
            const data = await requestApi('/mensualidades/marcar-vencidas', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            setMensaje(`Mensualidades vencidas: ${data.vencidas}`);
            await cargarMensualidades();
        } catch (error: any) {
            setMensaje(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function procesarCortes() {
        try {
            setLoading(true);
            const data = await requestApi('/mensualidades/procesar-cortes', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            setMensaje(`Cortadas: ${data.cortadas} | Errores: ${data.errores}`);
            await cargarMensualidades();
        } catch (error: any) {
            setMensaje(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function registrarPago() {
        if (!pagoSeleccionado) return;

        try {
            setLoading(true);

            await requestApi('/mensualidades/registrar-pago', {
                method: 'POST',
                body: JSON.stringify({
                    mensualidadId: pagoSeleccionado.mensualidadId,
                    valorPagado: Number(valorPagado || pagoSeleccionado.valorMensual),
                    referenciaPago,
                    observacion: 'Pago registrado desde mensualidades',
                }),
            });

            setMensaje('Pago registrado correctamente');
            setPagoSeleccionado(null);
            setValorPagado('');
            setReferenciaPago('');
            await cargarMensualidades();
        } catch (error: any) {
            setMensaje(error.message);
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

    async function crearMensualidadManual() {
        try {
            setLoading(true);

            await requestApi('/mensualidades/crear-manual', {
                method: 'POST',
                body: JSON.stringify({
                    servicioId: servicioIdManual,
                    anio: anioManual,
                    mes: mesManual,
                }),
            });

            setMensaje('Mensualidad creada manualmente');
            setModalManual(false);
            setServicioIdManual('');
            await cargarMensualidades();

        } catch (error: any) {
            setMensaje(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Mensualidades y Corte Automático</h1>
                    <p className="text-slate-400">
                        Control de facturación mensual, mora y cortes MikroTik.
                    </p>
                </div>

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
                        onClick={marcarVencidas}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Marcar vencidas
                    </button>

                    <button
                        onClick={procesarCortes}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Procesar cortes
                    </button>

                    <button
                        onClick={cargarMensualidades}
                        disabled={loading}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                    >
                        Recargar
                    </button>
                </div>
            </div>

            {mensaje && (
                <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
                    {mensaje}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card titulo="Pendientes" valor={mensualidades.filter(x => x.estado === 'PENDIENTE').length} />
                <Card titulo="Vencidas" valor={mensualidades.filter(x => x.estado === 'VENCIDA').length} />
                <Card titulo="Cortadas" valor={mensualidades.filter(x => x.estado === 'CORTADA').length} />
                <Card titulo="Total cartera" valor={`$${mensualidades.reduce((a, b) => a + Number(b.valorMensual || 0), 0).toFixed(2)}`} />
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
                            {mensualidades.map((m) => (
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
                                        <button
                                            onClick={() => {
                                                setPagoSeleccionado(m);
                                                setValorPagado(String(m.valorMensual));
                                            }}
                                            className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg font-semibold"
                                        >
                                            Registrar pago
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {!loading && mensualidades.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="p-6 text-center text-slate-400">
                                        No hay mensualidades pendientes.
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
                            value={valorPagado}
                            onChange={(e) => setValorPagado(e.target.value)}
                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none"
                        />

                        <label className="block text-sm mb-1">Referencia / comprobante</label>
                        <input
                            value={referenciaPago}
                            onChange={(e) => setReferenciaPago(e.target.value)}
                            placeholder="Transferencia, efectivo, comprobante..."
                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setPagoSeleccionado(null)}
                                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={registrarPago}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                            >
                                Guardar pago
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalManual && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">
                            Crear mensualidad manual
                        </h2>

                        <label className="block text-sm mb-1">
                            Servicio ID
                        </label>
                        <input
                            value={servicioIdManual}
                            onChange={(e) => setServicioIdManual(e.target.value)}
                            placeholder="Pega aquí el servicioId"
                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none"
                        />

                        <label className="block text-sm mb-1">
                            Año
                        </label>
                        <input
                            type="number"
                            value={anioManual}
                            onChange={(e) => setAnioManual(Number(e.target.value))}
                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none"
                        />

                        <label className="block text-sm mb-1">
                            Mes
                        </label>
                        <select
                            value={mesManual}
                            onChange={(e) => setMesManual(Number(e.target.value))}
                            className="w-full mb-4 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 outline-none"
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

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setModalManual(false)}
                                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={crearMensualidadManual}
                                disabled={loading || !servicioIdManual}
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function Card({ titulo, valor }: { titulo: string; valor: any }) {
    return (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <p className="text-slate-400 text-sm">{titulo}</p>
            <h2 className="text-2xl font-bold mt-1">{valor}</h2>
        </div>
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