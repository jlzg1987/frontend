'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type ClienteExterno = {
    clienteExternoId?: number;
    nombres: string;
    apellidos: string;
    cedula: string;
    celular: string;
    email: string;
    direccion: string;
    tipoCliente: string;
    observacion: string;
    estado: 'ACTIVO' | 'INACTIVO';
};

const clienteVacio: ClienteExterno = {
    nombres: '',
    apellidos: '',
    cedula: '',
    celular: '',
    email: '',
    direccion: '',
    tipoCliente: 'NORMAL',
    observacion: '',
    estado: 'ACTIVO'
};

export default function ClientesExternosFacturacionPage() {
    const [clientes, setClientes] = useState<ClienteExterno[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [form, setForm] = useState<ClienteExterno>(clienteVacio);
    const [editando, setEditando] = useState(false);

    const cargarClientes = async () => {
        const res = await fetch(`${API_BASE}/clientes-externos-facturacion`);
        const data = await res.json();
        setClientes(data.data || []);
    };

    useEffect(() => {
        cargarClientes();
    }, []);

    const abrirNuevo = () => {
        setForm(clienteVacio);
        setEditando(false);
        setModalAbierto(true);
    };

    const abrirEditar = (cliente: ClienteExterno) => {
        setForm(cliente);
        setEditando(true);
        setModalAbierto(true);
    };

    const guardar = async () => {
        const url = editando
            ? `${API_BASE}/clientes-externos-facturacion/${form.clienteExternoId}`
            : `${API_BASE}/clientes-externos-facturacion`;

        const method = editando ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        setModalAbierto(false);
        cargarClientes();
    };

    const eliminar = async (id?: number) => {
        if (!id) return;
        if (!confirm('¿Seguro que deseas eliminar este cliente externo?')) return;

        await fetch(`${API_BASE}/clientes-externos-facturacion/${id}`, {
            method: 'DELETE'
        });

        cargarClientes();
    };

    const cambiarEstado = async (cliente: ClienteExterno) => {
        const nuevoEstado = cliente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

        await fetch(`${API_BASE}/clientes-externos-facturacion/${cliente.clienteExternoId}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        cargarClientes();
    };

    const clientesFiltrados = clientes.filter(c =>
        `${c.nombres} ${c.apellidos} ${c.cedula} ${c.celular} ${c.email}`
            .toLowerCase()
            .includes(busqueda.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">


                <button
                    onClick={abrirNuevo}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl"
                >
                    + Nuevo cliente
                </button>
            </div>

            <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, cédula, celular o email..."
                className="w-full mb-5 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
            />

            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
                <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-slate-300">
                        <tr>
                            <th className="p-3 text-left">Cliente</th>
                            <th className="p-3 text-left">Cédula/RUC</th>
                            <th className="p-3 text-left">Celular</th>
                            <th className="p-3 text-left">Email</th>
                            <th className="p-3 text-left">Tipo</th>
                            <th className="p-3 text-left">Estado</th>
                            <th className="p-3 text-center">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {clientesFiltrados.map((cliente) => (
                            <tr key={cliente.clienteExternoId} className="border-t border-slate-800">
                                <td className="p-3">
                                    <div className="font-bold">{cliente.nombres} {cliente.apellidos}</div>
                                    <div className="text-xs text-slate-400">{cliente.direccion}</div>
                                </td>
                                <td className="p-3">{cliente.cedula}</td>
                                <td className="p-3">{cliente.celular}</td>
                                <td className="p-3">{cliente.email}</td>
                                <td className="p-3">{cliente.tipoCliente}</td>
                                <td className="p-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cliente.estado === 'ACTIVO'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : 'bg-red-500/20 text-red-300'
                                        }`}>
                                        {cliente.estado}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => abrirEditar(cliente)} className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-300">
                                            Editar
                                        </button>
                                        <button onClick={() => cambiarEstado(cliente)} className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-300">
                                            Estado
                                        </button>
                                        <button onClick={() => eliminar(cliente.clienteExternoId)} className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300">
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {clientesFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-400">
                                    No hay clientes externos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6">
                        <h2 className="text-xl font-black mb-4">
                            {editando ? 'Editar cliente externo' : 'Nuevo cliente externo'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="input" placeholder="Nombres" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} />
                            <input className="input" placeholder="Apellidos" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })} />
                            <input className="input" placeholder="Cédula / RUC" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} />
                            <input className="input" placeholder="Celular" value={form.celular} onChange={e => setForm({ ...form, celular: e.target.value })} />
                            <input className="input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            <select className="input" value={form.tipoCliente} onChange={e => setForm({ ...form, tipoCliente: e.target.value })}>
                                <option value="NORMAL">Normal</option>
                                <option value="EMPRESA">Empresa</option>
                                <option value="CONSUMIDOR_FINAL">Consumidor final</option>
                            </select>
                            <input className="input md:col-span-2" placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
                            <textarea className="input md:col-span-2" placeholder="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setModalAbierto(false)} className="px-4 py-2 rounded-xl bg-slate-700">
                                Cancelar
                            </button>
                            <button onClick={guardar} className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold">
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .input {
                    background: #020617;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 10px 12px;
                    outline: none;
                    color: white;
                }

                .input:focus {
                    border-color: #22d3ee;
                }
            `}</style>
        </div>
    );
}