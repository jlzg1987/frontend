'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type Tecnico = {
    id: string;
    nombres: string;
    apellidos: string;
};

type Reporte = {
    reporteId: string;
    tecnicoId: string;
    tecnicoNombre: string;
    tipoReporte: 'PAGO' | 'ATENCION' | 'TECNICO';
    titulo: string;
    descripcion: string;
    monto?: number;
    estado: 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
    visibleTecnico: number;
    fechaCreacion: string;
};

export default function ReportesTecnicosAdminPage() {
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [editandoId, setEditandoId] = useState<string | null>(null);

    const [form, setForm] = useState({
        tecnicoId: '',
        tipoReporte: 'TECNICO',
        titulo: '',
        descripcion: '',
        periodoInicio: '',
        periodoFin: '',
        monto: '',
        totalTickets: 0,
        totalAtendidos: 0,
        totalResueltos: 0,
        totalCancelados: 0,
        estado: 'BORRADOR',
        visibleTecnico: false,
    });

    const cargarReportes = async () => {
        const token = getToken();

        const res = await fetch(`${API_BASE}/reportes-tecnicos/admin`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setReportes(data.reportes || []);
    };

    const cargarTecnicos = async () => {
        const token = getToken();

        const res = await fetch(`${API_BASE}/tecnicos/activos`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setTecnicos(data.tecnicos || []);
    };

    useEffect(() => {
        cargarReportes();
        cargarTecnicos();
    }, []);

    const limpiar = () => {
        setEditandoId(null);
        setForm({
            tecnicoId: '',
            tipoReporte: 'TECNICO',
            titulo: '',
            descripcion: '',
            periodoInicio: '',
            periodoFin: '',
            monto: '',
            totalTickets: 0,
            totalAtendidos: 0,
            totalResueltos: 0,
            totalCancelados: 0,
            estado: 'BORRADOR',
            visibleTecnico: false,
        });
    };

    const guardar = async () => {
        const token = getToken();

        const payload = {
            ...form,
            monto: form.monto ? Number(form.monto) : null,
        };

        const url = editandoId
            ? `${API_BASE}/reportes-tecnicos/${editandoId}`
            : `${API_BASE}/reportes-tecnicos`;

        const method = editandoId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.mensaje || 'Error guardando reporte');
            return;
        }

        limpiar();
        cargarReportes();
    };

    const editar = (r: Reporte) => {
        setEditandoId(r.reporteId);
        setForm({
            tecnicoId: r.tecnicoId,
            tipoReporte: r.tipoReporte,
            titulo: r.titulo,
            descripcion: r.descripcion || '',
            periodoInicio: '',
            periodoFin: '',
            monto: r.monto ? String(r.monto) : '',
            totalTickets: 0,
            totalAtendidos: 0,
            totalResueltos: 0,
            totalCancelados: 0,
            estado: r.estado,
            visibleTecnico: Boolean(r.visibleTecnico),
        });
    };

    const eliminar = async (reporteId: string) => {
        if (!confirm('¿Eliminar este reporte?')) return;

        const token = getToken();

        const res = await fetch(`${API_BASE}/reportes-tecnicos/${reporteId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.mensaje || 'Error eliminando reporte');
            return;
        }

        cargarReportes();
    };

    return (
        <div className="min-h-screen bg-[#081225] p-6 text-white">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-[#0b1730] via-[#121a3d] to-[#24113f] p-6 shadow-2xl">
                    <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
                    <div className="absolute left-10 bottom-0 h-28 w-28 rounded-full bg-violet-500/20 blur-3xl" />

                    <h1 className="relative text-3xl font-black text-white">
                        📋 Reportes para técnicos
                    </h1>
                    <p className="relative text-cyan-200 mt-1">
                        Crear reportes de pagos, atención o técnicos.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 rounded-3xl border border-cyan-500/20 bg-[#0d1830]/95 shadow-2xl p-5">
                        <h2 className="text-xl font-bold mb-4 text-white">
                            {editandoId ? '✏️ Editar reporte' : '🆕 Nuevo reporte'}
                        </h2>

                        <div className="space-y-3">
                            <select
                                className="w-full border border-cyan-500/20 bg-[#081225] text-white rounded-xl p-3 outline-none focus:border-orange-400"
                                value={form.tecnicoId}
                                onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}
                            >
                                <option value="">Seleccione técnico</option>
                                {tecnicos.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombres} {t.apellidos}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="w-full border border-cyan-500/20 bg-[#081225] text-white rounded-xl p-3 outline-none focus:border-violet-400"
                                value={form.tipoReporte}
                                onChange={(e) => setForm({ ...form, tipoReporte: e.target.value })}
                            >
                                <option value="PAGO">Reporte de pago</option>
                                <option value="ATENCION">Reporte de atención</option>
                                <option value="TECNICO">Reporte técnico</option>
                            </select>

                            <input
                                className="w-full border border-cyan-500/20 bg-[#081225] text-white placeholder:text-slate-400 rounded-xl p-3 outline-none focus:border-orange-400"
                                placeholder="Título"
                                value={form.titulo}
                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                            />

                            <textarea
                                className="w-full border border-cyan-500/20 bg-[#081225] text-white placeholder:text-slate-400 rounded-xl p-3 min-h-32 outline-none focus:border-violet-400"
                                placeholder="Descripción del reporte"
                                value={form.descripcion}
                                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    className="border border-cyan-500/20 bg-[#081225] text-white rounded-xl p-3 outline-none focus:border-orange-400"
                                    value={form.periodoInicio}
                                    onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
                                />

                                <input
                                    type="date"
                                    className="border border-cyan-500/20 bg-[#081225] text-white rounded-xl p-3 outline-none focus:border-orange-400"
                                    value={form.periodoFin}
                                    onChange={(e) => setForm({ ...form, periodoFin: e.target.value })}
                                />
                            </div>

                            <input
                                type="number"
                                className="w-full border border-cyan-500/20 bg-[#081225] text-white placeholder:text-slate-400 rounded-xl p-3 outline-none focus:border-emerald-400"
                                placeholder="Monto, si aplica"
                                value={form.monto}
                                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                            />

                            <select
                                className="w-full border border-cyan-500/20 bg-[#081225] text-white rounded-xl p-3 outline-none focus:border-violet-400"
                                value={form.estado}
                                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                            >
                                <option value="BORRADOR">Borrador</option>
                                <option value="PUBLICADO">Publicado</option>
                                <option value="ARCHIVADO">Archivado</option>
                            </select>

                            <label className="flex items-center gap-3 text-sm text-cyan-100 rounded-xl border border-cyan-500/10 bg-white/5 p-3">
                                <input
                                    type="checkbox"
                                    checked={form.visibleTecnico}
                                    onChange={(e) => setForm({ ...form, visibleTecnico: e.target.checked })}
                                />
                                Visible para el técnico
                            </label>

                            <button
                                onClick={guardar}
                                className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-orange-500 via-violet-600 to-blue-600 hover:scale-[1.02] transition shadow-lg shadow-violet-900/40"
                            >
                                {editandoId ? 'Actualizar reporte' : 'Guardar reporte'}
                            </button>

                            {editandoId && (
                                <button
                                    onClick={limpiar}
                                    className="w-full bg-white/10 text-cyan-100 rounded-xl py-3 font-bold hover:bg-white/20 transition"
                                >
                                    Cancelar edición
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 rounded-3xl border border-violet-500/20 bg-[#0d1830]/95 shadow-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">
                                📑 Reportes creados
                            </h2>

                            <span className="text-xs rounded-full bg-orange-500/20 text-orange-200 px-3 py-1 border border-orange-400/20">
                                Total: {reportes.length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {reportes.map((r) => (
                                <div
                                    key={r.reporteId}
                                    className="border border-cyan-500/10 bg-[#081225]/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:border-orange-400/40 transition"
                                >
                                    <div>
                                        <span className="text-xs bg-violet-500/20 text-violet-200 px-3 py-1 rounded-full border border-violet-400/20">
                                            {r.tipoReporte}
                                        </span>

                                        <h3 className="font-bold text-lg mt-2 text-white">
                                            {r.titulo}
                                        </h3>

                                        <p className="text-sm text-cyan-100">
                                            Técnico: {r.tecnicoNombre || 'Sin técnico'}
                                        </p>

                                        <p className="text-sm text-slate-400">
                                            Estado: {r.estado} · Visible: {r.visibleTecnico ? 'Sí' : 'No'}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => editar(r)}
                                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            onClick={() => eliminar(r.reporteId)}
                                            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {reportes.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-[#081225]/80 p-8 text-center">
                                    <p className="text-cyan-100 font-semibold">
                                        No hay reportes registrados.
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        Crea el primer reporte para un técnico.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}