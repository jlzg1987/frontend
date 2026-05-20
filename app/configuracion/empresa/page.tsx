'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';

export default function EmpresaPage() {
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [imagen, setImagen] = useState<File | null>(null);
    const [previewLogo, setPreviewLogo] = useState<string>('');

    const [form, setForm] = useState({
        razon_social: '',
        nombre_comercial: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: '',
        logo_url: '',
        obligado_contabilidad: 'NO',
        estado: 'ACTIVO',
        es_principal: 0,

        representante_legal: '',
        representante_cedula: '',
        representante_cargo: '',
        representante_telefono: '',
        representante_email: '',
    });

    const cargar = async () => {
        const res = await fetch(`${API_BASE}/facturacion/config/empresa`);
        const data = await res.json();
        setEmpresas(data.data || []);
    };

    useEffect(() => {
        cargar();
    }, []);

    const limpiar = () => {
        setEditandoId(null);
        setImagen(null);
        setPreviewLogo('');

        setForm({
            razon_social: '',
            nombre_comercial: '',
            ruc: '',
            direccion: '',
            telefono: '',
            email: '',
            logo_url: '',
            obligado_contabilidad: 'NO',
            estado: 'ACTIVO',
            es_principal: 0,

            representante_legal: '',
            representante_cedula: '',
            representante_cargo: '',
            representante_telefono: '',
            representante_email: '',

        });
    };

    const seleccionarLogo = (file: File | null) => {
        setImagen(file);

        if (file) {
            const urlTemporal = URL.createObjectURL(file);
            setPreviewLogo(urlTemporal);
        }
    };

    const guardar = async () => {
        const url = editandoId
            ? `${API_BASE}/facturacion/config/empresa/${editandoId}`
            : `${API_BASE}/facturacion/config/empresa`;

        const res = await fetch(url, {
            method: editandoId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!data.ok) {
            alert(data.message || 'Error al guardar');
            return;
        }

        const empresaId = editandoId || data.id;

        if (empresaId && imagen) {
            const fd = new FormData();
            fd.append('imagen', imagen);

            const resLogo = await fetch(`${API_BASE}/facturacion/config/empresa/${empresaId}/logo`, {
                method: 'PUT',
                body: fd,
            });

            const dataLogo = await resLogo.json();

            if (!dataLogo.ok) {
                alert(dataLogo.message || 'Empresa guardada, pero no se pudo subir el logo');
                return;
            }
        }

        alert(data.message);
        limpiar();
        cargar();
    };

    const editar = (e: any) => {
        setEditandoId(e.id);
        setImagen(null);
        setPreviewLogo(e.logo_url || '');

        setForm({
            razon_social: e.razon_social || '',
            nombre_comercial: e.nombre_comercial || '',
            ruc: e.ruc || '',
            direccion: e.direccion || '',
            telefono: e.telefono || '',
            email: e.email || '',
            logo_url: e.logo_url || '',
            obligado_contabilidad: e.obligado_contabilidad || 'NO',
            estado: e.estado || 'ACTIVO',
            es_principal: Number(e.es_principal) === 1 ? 1 : 0,

            representante_legal: e.representante_legal || '',
            representante_cedula: e.representante_cedula || '',
            representante_cargo: e.representante_cargo || '',
            representante_telefono: e.representante_telefono || '',
            representante_email: e.representante_email || '',

        });
    };

    const eliminar = async (id: number) => {
        if (!confirm('¿Eliminar empresa?')) return;

        await fetch(`${API_BASE}/facturacion/config/empresa/${id}`, {
            method: 'DELETE',
        });

        cargar();
    };

    return (
        <div className="p-6 bg-slate-950 min-h-screen text-white">
            <h1 className="text-2xl font-black mb-6">
                Datos de empresa
            </h1>

            <div className="bg-slate-900 rounded-2xl p-5 mb-6">
                <h2 className="text-lg font-bold mb-4 text-cyan-400">
                    Información de la empresa
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="input" placeholder="Razón social" value={form.razon_social} onChange={e => setForm({ ...form, razon_social: e.target.value })} />
                    <input className="input" placeholder="Nombre comercial" value={form.nombre_comercial} onChange={e => setForm({ ...form, nombre_comercial: e.target.value })} />
                    <input className="input" placeholder="RUC" value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} />
                    <input className="input" placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
                    <input className="input" placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                    <input className="input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

                    <select className="input" value={form.obligado_contabilidad} onChange={e => setForm({ ...form, obligado_contabilidad: e.target.value })}>
                        <option value="NO">No obligado a contabilidad</option>
                        <option value="SI">Sí obligado a contabilidad</option>
                    </select>

                    <select className="input" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                    </select>
                </div>

                <h2 className="text-lg font-bold mt-8 mb-4 text-cyan-400">
                    Representante legal
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="input" placeholder="Nombre del representante legal" value={form.representante_legal} onChange={e => setForm({ ...form, representante_legal: e.target.value })} />
                    <input className="input" placeholder="Cédula / Identificación" value={form.representante_cedula} onChange={e => setForm({ ...form, representante_cedula: e.target.value })} />
                    <input className="input" placeholder="Cargo" value={form.representante_cargo} onChange={e => setForm({ ...form, representante_cargo: e.target.value })} />
                    <input className="input" placeholder="Teléfono representante" value={form.representante_telefono} onChange={e => setForm({ ...form, representante_telefono: e.target.value })} />
                    <input className="input" placeholder="Email representante" value={form.representante_email} onChange={e => setForm({ ...form, representante_email: e.target.value })} />
                </div>
                <label style={{ marginTop: 8 }} className="flex items-center gap-3 bg-slate-950 border border-cyan-500/20 rounded-xl px-4 py-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={Number(form.es_principal) === 1}
                        onChange={e =>
                            setForm({
                                ...form,
                                es_principal: e.target.checked ? 1 : 0
                            })
                        }
                        className="w-5 h-5 accent-cyan-500"

                    />

                    <span className="font-bold text-cyan-300">
                        Empresa principal de facturación
                    </span>
                </label>
                <h2 className="text-lg font-bold mt-8 mb-4 text-cyan-400">
                    Logo de la empresa
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2">
                            Subir logo
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => seleccionarLogo(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:text-slate-950 file:font-bold hover:file:bg-cyan-400"
                        />
                    </div>

                    <div className="bg-slate-950 border border-cyan-500/20 rounded-2xl p-4 flex items-center justify-center min-h-[140px]">
                        {previewLogo ? (
                            <img
                                src={previewLogo}
                                alt="Logo empresa"
                                className="max-h-28 max-w-full object-contain"
                            />
                        ) : (
                            <span className="text-slate-500">
                                Vista previa del logo
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={guardar} className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2 rounded-xl font-bold">
                        {editandoId ? 'Actualizar empresa' : 'Guardar empresa'}
                    </button>

                    {editandoId && (
                        <button onClick={limpiar} className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-xl">
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {empresas.map(e => (
                    <div key={e.id} className="bg-slate-900 rounded-2xl p-5 border border-cyan-500/20">
                        <div className="bg-slate-950 rounded-xl p-3 h-28 flex items-center justify-center mb-3">
                            {e.logo_url ? (
                                <img src={e.logo_url} className="max-h-24 max-w-full object-contain" />
                            ) : (
                                <span className="text-slate-500">Sin logo</span>
                            )}
                        </div>
                        {Number(e.es_principal) === 1 && (
                            <span className="inline-block mt-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold">
                                Principal de facturación
                            </span>
                        )}

                        <h2 className="font-bold text-lg">{e.razon_social}</h2>
                        <p className="text-slate-400">{e.nombre_comercial}</p>
                        <p>RUC: {e.ruc}</p>
                        <p>{e.email}</p>

                        <div className="mt-3 border-t border-slate-800 pt-3">
                            <p className="text-cyan-400 font-bold">Representante legal</p>
                            <p>{e.representante_legal || 'No registrado'}</p>
                            <p className="text-slate-400">{e.representante_cedula || ''}</p>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button onClick={() => editar(e)} className="bg-yellow-500 px-4 py-2 rounded-xl text-slate-950 font-bold">
                                Editar
                            </button>

                            <button onClick={() => eliminar(e.id)} className="bg-red-600 px-4 py-2 rounded-xl font-bold">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}