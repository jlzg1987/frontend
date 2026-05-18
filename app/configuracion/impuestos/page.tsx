'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';



export default function ImpuestosPage() {
    const [items, setItems] = useState<any[]>([]);
    const [editandoId, setEditandoId] = useState<number | null>(null);

    const [form, setForm] = useState({
        nombre: '',
        codigo: '',
        porcentaje: 0,
        tipo: 'IVA',
        activo: 1,
    });

    const cargar = async () => {
        const res = await fetch(`${API_BASE}/facturacion/config/impuestos`);
        const data = await res.json();
        setItems(data.data || []);
    };

    useEffect(() => {
        cargar();
    }, []);

    const limpiar = () => {
        setEditandoId(null);
        setForm({
            nombre: '',
            codigo: '',
            porcentaje: 0,
            tipo: 'IVA',
            activo: 1,
        });
    };

    const guardar = async () => {
        const url = editandoId
            ? `${API_BASE}/facturacion/config/impuestos/${editandoId}`
            : `${API_BASE}/facturacion/config/impuestos`;

        const res = await fetch(url, {
            method: editandoId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        alert(data.message);
        limpiar();
        cargar();
    };

    const editar = (i: any) => {
        setEditandoId(i.id);
        setForm({
            nombre: i.nombre,
            codigo: i.codigo,
            porcentaje: i.porcentaje,
            tipo: i.tipo,
            activo: i.activo,
        });
    };

    const eliminar = async (id: number) => {
        if (!confirm('¿Eliminar impuesto?')) return;

        await fetch(`${API_BASE}/facturacion/config/impuestos/${id}`, {
            method: 'DELETE',
        });

        cargar();
    };
    const cambiarEstado = async (id: number, activoActual: number) => {
        const nuevoEstado = activoActual ? 0 : 1;

        const res = await fetch(`${API_BASE}/facturacion/config/impuestos/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: nuevoEstado }),
        });

        const data = await res.json();

        if (!data.ok) {
            alert(data.message || 'Error al cambiar estado');
            return;
        }

        cargar();
    };
    return (
        <div className="p-6 bg-slate-950 min-h-screen text-white">


            <div className="bg-slate-900 rounded-2xl p-5 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <input className="input" placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                <input className="input" placeholder="Código" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} />
                <input className="input" type="number" placeholder="Porcentaje" value={form.porcentaje} onChange={e => setForm({ ...form, porcentaje: Number(e.target.value) })} />

                <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                    <option value="IVA">IVA</option>
                    <option value="ICE">ICE</option>
                    <option value="OTRO">OTRO</option>
                </select>

                <select className="input" value={form.activo} onChange={e => setForm({ ...form, activo: Number(e.target.value) })}>
                    <option value={1}>Activo</option>
                    <option value={0}>Inactivo</option>
                </select>

                <button onClick={guardar} className="bg-cyan-500 px-5 py-2 rounded-xl font-bold">
                    {editandoId ? 'Actualizar' : 'Guardar'}
                </button>

                {editandoId && (
                    <button onClick={limpiar} className="bg-slate-700 px-5 py-2 rounded-xl">
                        Cancelar
                    </button>
                )}
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="p-3 text-left">Nombre</th>
                            <th>Código</th>
                            <th>Porcentaje</th>
                            <th>Tipo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(i => (
                            <tr key={i.id} className="border-t border-slate-800">
                                <td className="p-3">{i.nombre}</td>
                                <td>{i.codigo}</td>
                                <td>{i.porcentaje}%</td>
                                <td>{i.tipo}</td>
                                <td>{i.activo ? 'Activo' : 'Inactivo'}</td>
                                <td className="flex gap-2 p-3">
                                    <button onClick={() => editar(i)} className="bg-yellow-500 px-3 py-1 rounded-lg">Editar</button>
                                    <button onClick={() => eliminar(i.id)} className="bg-red-600 px-3 py-1 rounded-lg">Eliminar</button>
                                </td>
                                <td >
                                    <button
                                        onClick={() => cambiarEstado(i.id, i.activo)}
                                        className={i.activo ? 'bg-slate-600 px-3 py-1 rounded-lg' : 'bg-emerald-600 px-3 py-1 rounded-lg'}
                                    >
                                        {i.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}