'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';


type Ticket = {
    ticketId: string;
    codigoTicket: string;
    titulo: string;
    descripcion: string;
    categoria: string;
    prioridad: string;
    estado: string;
    clienteTipo: string;
    clienteId: string | null;
    tecnicoAsignadoId: string | null;
    fechaCreacion: string;
};

type Empresa = {
    id: number | string;
    nombreComercial?: string;
    razonSocial?: string;
    es_principal?: number;
};

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        empresaId: '',
        clienteTipo: 'ISP',
        clienteId: '',
        titulo: '',
        descripcion: '',
        categoria: 'INTERNET',
        prioridad: 'MEDIA'
    });

    const cargarEmpresaPrincipal = async () => {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/facturacion/config/empresa`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.ok && data.data.length > 0) {
                const principal =
                    data.data.find((e: Empresa) => Number(e.es_principal) === 1) || data.data[0];

                setEmpresa(principal);

                setForm((prev) => ({
                    ...prev,
                    empresaId: String(principal.id)
                }));
            }
        } catch (error) {
            console.error('Error cargando empresa principal:', error);
        }
    };

    const cargarTickets = async () => {
        try {
            setLoading(true);
            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.ok) {
                setTickets(data.data);
            }
        } catch (error) {
            console.error('Error cargando tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const crearTicket = async () => {
        try {
            const token = getToken();

            if (!form.empresaId || !form.titulo || !form.descripcion) {
                alert('Título y descripción son obligatorios');
                return;
            }

            const res = await fetch(`${API_BASE}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    clienteId: form.clienteId || null
                })
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'Error creando ticket');
                return;
            }

            alert(`Ticket creado correctamente: ${data.codigoTicket}`);

            setForm((prev) => ({
                ...prev,
                clienteTipo: 'ISP',
                clienteId: '',
                titulo: '',
                descripcion: '',
                categoria: 'INTERNET',
                prioridad: 'MEDIA'
            }));

            cargarTickets();
        } catch (error) {
            console.error('Error creando ticket:', error);
        }
    };

    const cambiarEstado = async (ticketId: string, estado: string) => {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    estado,
                    observacion: `Estado cambiado a ${estado}`
                })
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'Error cambiando estado');
                return;
            }

            cargarTickets();
        } catch (error) {
            console.error('Error cambiando estado:', error);
        }
    };

    const badgeEstado = (estado: string) => {
        const estilos: any = {
            ABIERTO: 'bg-blue-100 text-blue-700 border-blue-200',
            EN_PROCESO: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            ESPERANDO_CLIENTE: 'bg-purple-100 text-purple-700 border-purple-200',
            RESUELTO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            CERRADO: 'bg-slate-200 text-slate-700 border-slate-300',
            CANCELADO: 'bg-red-100 text-red-700 border-red-200'
        };

        return estilos[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const badgePrioridad = (prioridad: string) => {
        const estilos: any = {
            BAJA: 'bg-slate-100 text-slate-600',
            MEDIA: 'bg-blue-100 text-blue-700',
            ALTA: 'bg-orange-100 text-orange-700',
            CRITICA: 'bg-red-100 text-red-700'
        };

        return estilos[prioridad] || 'bg-slate-100 text-slate-700';
    };

    useEffect(() => {
        cargarEmpresaPrincipal();
        cargarTickets();
    }, []);

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <p className="text-sm text-slate-500">Total tickets</p>
                    <h3 className="text-3xl font-black text-slate-800">{tickets.length}</h3>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <p className="text-sm text-slate-500">Abiertos</p>
                    <h3 className="text-3xl font-black text-blue-600">
                        {tickets.filter(t => t.estado === 'ABIERTO').length}
                    </h3>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <p className="text-sm text-slate-500">En proceso</p>
                    <h3 className="text-3xl font-black text-yellow-600">
                        {tickets.filter(t => t.estado === 'EN_PROCESO').length}
                    </h3>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <p className="text-sm text-slate-500">Resueltos</p>
                    <h3 className="text-3xl font-black text-emerald-600">
                        {tickets.filter(t => t.estado === 'RESUELTO').length}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6">
                    <h2 className="text-xl font-bold text-white">Crear nuevo ticket</h2>
                    <p className="text-sm text-cyan-200">
                        Empresa principal: {empresa?.nombreComercial || empresa?.razonSocial || 'Cargando...'}
                    </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">

                    <select
                        className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.clienteTipo}
                        onChange={(e) => setForm({ ...form, clienteTipo: e.target.value })}
                    >
                        <option value="ISP">Cliente ISP</option>
                        <option value="EXTERNO">Cliente externo</option>
                    </select>

                    <input
                        className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Cliente ID opcional"
                        value={form.clienteId}
                        onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                    />

                    <select
                        className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.prioridad}
                        onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                    >
                        <option value="BAJA">Prioridad baja</option>
                        <option value="MEDIA">Prioridad media</option>
                        <option value="ALTA">Prioridad alta</option>
                        <option value="CRITICA">Prioridad crítica</option>
                    </select>

                    <input
                        className="border border-slate-300 rounded-xl px-4 py-3 md:col-span-2 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Título del problema"
                        value={form.titulo}
                        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    />

                    <select
                        className="border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.categoria}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    >
                        <option value="INTERNET">Internet</option>
                        <option value="FACTURACION">Facturación</option>
                        <option value="INSTALACION">Instalación</option>
                        <option value="CORTE_SERVICIO">Corte de servicio</option>
                        <option value="EQUIPO">Equipo</option>
                        <option value="OTRO">Otro</option>
                    </select>

                    <textarea
                        className="border border-slate-300 rounded-xl px-4 py-3 md:col-span-3 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe el problema del cliente..."
                        rows={4}
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    />

                    <div className="md:col-span-3 flex justify-end">
                        <button
                            onClick={crearTicket}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition"
                        >
                            + Crear ticket
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Lista de tickets</h2>
                        <p className="text-sm text-slate-500">Seguimiento general de soporte técnico.</p>
                    </div>

                    <button
                        onClick={cargarTickets}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                    >
                        Actualizar
                    </button>
                </div>

                {loading ? (
                    <p className="text-slate-500">Cargando tickets...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b">
                                    <th className="py-3">Código</th>
                                    <th>Ticket</th>
                                    <th>Categoría</th>
                                    <th>Prioridad</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {tickets.map((t) => (
                                    <tr key={t.ticketId} className="border-b hover:bg-slate-50">
                                        <td className="py-4 font-black text-blue-700">
                                            {t.codigoTicket}
                                        </td>

                                        <td>
                                            <p className="font-bold text-slate-800">{t.titulo}</p>
                                            <p className="text-xs text-slate-500 max-w-md truncate">
                                                {t.descripcion}
                                            </p>
                                        </td>

                                        <td>
                                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                                {t.categoria}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgePrioridad(t.prioridad)}`}>
                                                {t.prioridad}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${badgeEstado(t.estado)}`}>
                                                {t.estado}
                                            </span>
                                        </td>

                                        <td className="text-slate-500">
                                            {new Date(t.fechaCreacion).toLocaleString()}
                                        </td>

                                        <td>
                                            <select
                                                className="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                                                value={t.estado}
                                                onChange={(e) => cambiarEstado(t.ticketId, e.target.value)}
                                            >
                                                <option value="ABIERTO">Abierto</option>
                                                <option value="EN_PROCESO">En proceso</option>
                                                <option value="ESPERANDO_CLIENTE">Esperando cliente</option>
                                                <option value="RESUELTO">Resuelto</option>
                                                <option value="CERRADO">Cerrado</option>
                                                <option value="CANCELADO">Cancelado</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {tickets.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                No hay tickets registrados.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}