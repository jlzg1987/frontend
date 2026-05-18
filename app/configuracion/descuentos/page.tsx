'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';


export default function DescuentosPage() {
    const [items, setItems] = useState<any[]>([]);
    const [editandoId, setEditandoId] = useState<number | null>(null);

    const [form, setForm] = useState({
        nombre: '',
        descripcion: '',
        tipo: 'VALOR',
        valor: 0,
        activo: 1,
    });

    const cargar = async () => {
        const res = await fetch(`${API_BASE}/facturacion/config/descuentos`);
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
            descripcion: '',
            tipo: 'VALOR',
            valor: 0,
            activo: 1,
        });
    };

    const guardar = async () => {
        const url = editandoId
            ? `${API_BASE}/facturacion/config/descuentos/${editandoId}`
            : `${API_BASE}/facturacion/config/descuentos`;

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

    const editar = (d: any) => {
        setEditandoId(d.id);
        setForm({
            nombre: d.nombre,
            descripcion: d.descripcion,
            tipo: d.tipo,
            valor: d.valor,
            activo: d.activo,
        });
    };

    const eliminar = async (id: number) => {
        if (!confirm('¿Eliminar descuento?')) return;

        await fetch(`${API_BASE}/facturacion/config/descuentos/${id}`, {
            method: 'DELETE',
        });

        cargar();
    };

    const cambiarEstado = async (id: number, activoActual: number) => {
        const nuevoEstado = activoActual ? 0 : 1;

        const res = await fetch(`${API_BASE}/facturacion/config/descuentos/${id}/estado`, {
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
                <input className="input" placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />

                <select className="input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                    <option value="VALOR">Valor fijo</option>
                    <option value="PORCENTAJE">Porcentaje</option>
                </select>

                <input className="input" type="number" placeholder="Valor" value={form.valor} onChange={e => setForm({ ...form, valor: Number(e.target.value) })} />

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

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(d => (
                    <div key={d.id} className="bg-slate-900 rounded-2xl p-5 border border-cyan-500/20">
                        <h2 className="font-bold text-lg">{d.nombre}</h2>
                        <p className="text-slate-400">{d.descripcion}</p>
                        <p>Tipo: {d.tipo}</p>
                        <p>Valor: {d.tipo === 'PORCENTAJE' ? `${d.valor}%` : `$${d.valor}`}</p>
                        <p>Estado: {d.activo ? 'Activo' : 'Inactivo'}</p>

                        <div className="flex gap-2 mt-4">
                            <button onClick={() => editar(d)} className="bg-yellow-500 px-4 py-2 rounded-xl">
                                Editar
                            </button>
                            <button
                                onClick={() => cambiarEstado(d.id, d.activo)}
                                className={d.activo ? 'bg-slate-600 px-4 py-2 rounded-xl' : 'bg-emerald-600 px-4 py-2 rounded-xl'}
                            >
                                {d.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button onClick={() => eliminar(d.id)} className="bg-red-600 px-4 py-2 rounded-xl">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}