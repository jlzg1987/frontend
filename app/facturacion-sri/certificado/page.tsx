'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';
type CertificadoSri = {
    certificadoId: number;
    empresaId: number;
    nombreArchivo: string;
    fechaVencimiento: string;
    estado: 'ACTIVO' | 'INACTIVO';
    createdAt: string;

    razon_social?: string;
    nombre_comercial?: string;
    ruc?: string;
};

export default function CertificadoSriPage() {
    const [empresaId, setEmpresaId] = useState('');
    const [claveCertificado, setClaveCertificado] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [cargando, setCargando] = useState(false);
    const [certificados, setCertificados] = useState<CertificadoSri[]>([]);
    const [verClave, setVerClave] = useState(false);
    const [editando, setEditando] = useState<CertificadoSri | null>(null);
    const [archivoEditar, setArchivoEditar] = useState<File | null>(null);
    const [claveEditar, setClaveEditar] = useState('');
    const [procesandoAccion, setProcesandoAccion] = useState<number | null>(null);

    async function cargarCertificados() {
        try {

            const resp = await fetch(
                `${API_BASE}/facturacion-sri/certificados`
            );

            const data = await resp.json();

            if (data.ok) {
                setCertificados(data.data || []);
            }

        } catch (error) {
            console.error(
                'Error cargando certificados:',
                error
            );
        }
    }

    useEffect(() => {
        cargarCertificados();
    }, []);

    function abrirEditar(cert: CertificadoSri) {
        setEditando(cert);
        setClaveEditar('');
        setArchivoEditar(null);
    }
    async function activarCertificado(certificadoId: number) {
        try {
            setProcesandoAccion(certificadoId);

            const resp = await fetch(
                `${API_BASE}/facturacion-sri/certificado/${certificadoId}/activar`,
                { method: 'PUT' }
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error activando certificado');
                return;
            }

            alert('Certificado activado correctamente');
            await cargarCertificados();

        } finally {
            setProcesandoAccion(null);
        }
    }
    async function eliminarCertificado(certificadoId: number) {
        const ok = confirm('¿Seguro que deseas eliminar este certificado?');

        if (!ok) return;

        try {
            setProcesandoAccion(certificadoId);

            const resp = await fetch(
                `${API_BASE}/facturacion-sri/certificado/${certificadoId}`,
                { method: 'DELETE' }
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error eliminando certificado');
                return;
            }

            alert('Certificado eliminado correctamente');
            await cargarCertificados();

        } finally {
            setProcesandoAccion(null);
        }
    }
    async function actualizarCertificado() {
        if (!editando || !archivoEditar || !claveEditar) {
            alert('Debe seleccionar nuevo .p12 y escribir la clave');
            return;
        }

        try {
            setProcesandoAccion(editando.certificadoId);

            const certificadoBase64 = await fileToBase64(archivoEditar);

            const resp = await fetch(
                `${API_BASE}/facturacion-sri/certificado/${editando.certificadoId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        empresaId: editando.empresaId,
                        nombreArchivo: archivoEditar.name,
                        certificadoBase64,
                        claveCertificado: claveEditar
                    })
                }
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error actualizando certificado');
                return;
            }

            alert('Certificado actualizado correctamente');
            setEditando(null);
            setArchivoEditar(null);
            setClaveEditar('');
            await cargarCertificados();

        } finally {
            setProcesandoAccion(null);
        }
    }

    async function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function subirCertificado(e: React.FormEvent) {
        e.preventDefault();

        if (!empresaId || !claveCertificado || !archivo) {
            alert('Complete todos los campos');
            return;
        }

        if (!archivo.name.toLowerCase().endsWith('.p12')) {
            alert('Solo se permite archivo .p12');
            return;
        }

        try {
            setCargando(true);

            const certificadoBase64 = await fileToBase64(archivo);

            const resp = await fetch(`${API_BASE}/facturacion-sri/certificado`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    empresaId: Number(empresaId),
                    nombreArchivo: archivo.name,
                    certificadoBase64,
                    claveCertificado
                })
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error subiendo certificado');
                return;
            }

            alert('Certificado SRI guardado correctamente');
            await cargarCertificados();
            setArchivo(null);
            setClaveCertificado('');

        } catch (error) {
            console.error(error);
            alert('Error subiendo certificado');
        } finally {
            setCargando(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
            <section className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-black mb-2">
                    Certificado Digital SRI
                </h1>

                <p className="text-slate-400 mb-6">
                    Sube el archivo .p12 de la empresa para firmar electrónicamente los XML.
                </p>

                <form
                    onSubmit={subirCertificado}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
                >
                    <div>
                        <label className="text-sm text-slate-300">
                            Empresa ID
                        </label>
                        <input
                            type="number"
                            value={empresaId}
                            onChange={(e) => setEmpresaId(e.target.value)}
                            className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
                            placeholder="Ej: 1"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-slate-300">
                            Archivo certificado .p12
                        </label>
                        <input
                            type="file"
                            accept=".p12"
                            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                            className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300"
                        />

                        {archivo && (
                            <p className="text-xs text-cyan-300 mt-2">
                                Archivo seleccionado: {archivo.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm text-slate-300">
                            Clave del certificado
                        </label>

                        <div className="flex mt-2">
                            <input
                                type={verClave ? 'text' : 'password'}
                                value={claveCertificado}
                                onChange={(e) => setClaveCertificado(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-l-xl px-4 py-3 outline-none focus:border-cyan-500"
                                placeholder="Clave del .p12"
                            />

                            <button
                                type="button"
                                onClick={() => setVerClave(!verClave)}
                                className="px-4 bg-slate-800 border border-slate-700 rounded-r-xl"
                            >
                                {verClave ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-black"
                    >
                        {cargando ? 'Guardando certificado...' : 'Guardar certificado'}
                    </button>
                </form>
            </section>
            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                    <h2 className="text-xl font-black">
                        Certificados registrados
                    </h2>

                    <p className="text-slate-400 text-sm mt-1">
                        Visualiza certificados activos, empresa asociada y vencimiento.
                    </p>
                </div>

                {certificados.length === 0 ? (

                    <div className="p-6 text-center text-slate-500">
                        No existen certificados registrados.
                    </div>

                ) : (

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-950/70">
                                <tr>
                                    <th className="text-left p-4">
                                        Empresa
                                    </th>

                                    <th className="text-left p-4">
                                        Archivo
                                    </th>

                                    <th className="text-left p-4">
                                        RUC
                                    </th>

                                    <th className="text-left p-4">
                                        Vencimiento
                                    </th>

                                    <th className="text-left p-4">
                                        Estado
                                    </th>

                                    <th className="text-left p-4">
                                        Tiempo restante
                                    </th>
                                    <th className="text-right p-4">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {certificados.map((cert) => {

                                    const dias =
                                        calcularDiasRestantes(
                                            cert.fechaVencimiento
                                        );

                                    return (
                                        <tr
                                            key={cert.certificadoId}
                                            className="border-t border-slate-800 hover:bg-slate-800/30"
                                        >
                                            <td className="p-4">
                                                <div className="font-bold">
                                                    {cert.razon_social}
                                                </div>

                                                <div className="text-xs text-slate-500">
                                                    ID Empresa: {cert.empresaId}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                {cert.nombreArchivo}
                                            </td>

                                            <td className="p-4">
                                                {cert.ruc || '-'}
                                            </td>

                                            <td className="p-4">
                                                {cert.fechaVencimiento
                                                    ? new Date(
                                                        cert.fechaVencimiento
                                                    ).toLocaleDateString()
                                                    : 'No definido'}
                                            </td>

                                            <td className="p-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold border ${cert.estado === 'ACTIVO'
                                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                                                        }`}
                                                >
                                                    {cert.estado}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                {dias === null
                                                    ? '-'
                                                    : dias <= 0
                                                        ? (
                                                            <span className="text-red-400 font-bold">
                                                                Expirado
                                                            </span>
                                                        )
                                                        : (
                                                            <span className="text-cyan-300">
                                                                {dias} días
                                                            </span>
                                                        )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    {cert.estado !== 'ACTIVO' && (
                                                        <button
                                                            onClick={() => activarCertificado(cert.certificadoId)}
                                                            disabled={procesandoAccion === cert.certificadoId}
                                                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold"
                                                        >
                                                            Activar
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => abrirEditar(cert)}
                                                        disabled={procesandoAccion === cert.certificadoId}
                                                        className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-bold"
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() => eliminarCertificado(cert.certificadoId)}
                                                        disabled={procesandoAccion === cert.certificadoId}
                                                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-bold"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {editando && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6">
                        <h2 className="text-2xl font-black mb-2">
                            Reemplazar certificado
                        </h2>

                        <p className="text-slate-400 text-sm mb-5">
                            Empresa ID: {editando.empresaId} — Archivo actual: {editando.nombreArchivo}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-300">
                                    Nuevo archivo .p12
                                </label>

                                <input
                                    type="file"
                                    accept=".p12"
                                    onChange={(e) => setArchivoEditar(e.target.files?.[0] || null)}
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-slate-300">
                                    Nueva clave
                                </label>

                                <input
                                    type="password"
                                    value={claveEditar}
                                    onChange={(e) => setClaveEditar(e.target.value)}
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
                                    placeholder="Clave del nuevo .p12"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditando(null)}
                                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={actualizarCertificado}
                                disabled={procesandoAccion === editando.certificadoId}
                                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-bold"
                            >
                                {procesandoAccion === editando.certificadoId
                                    ? 'Actualizando...'
                                    : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
function calcularDiasRestantes(
    fecha?: string
) {

    if (!fecha)
        return null;

    const hoy = new Date();

    const vence =
        new Date(fecha);

    const diferencia =
        vence.getTime() - hoy.getTime();

    return Math.ceil(
        diferencia / (1000 * 60 * 60 * 24)
    );
}