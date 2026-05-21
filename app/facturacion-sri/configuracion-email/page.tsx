'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';


type ConfigEmail = {
    id: number;
    activo: number;
    hora_envio: string | null;
    enviar_pdf: number;
    enviar_xml: number;
};

export default function ConfiguracionEmailSriPage() {
    const [config, setConfig] = useState<ConfigEmail | null>(null);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [pendientes, setPendientes] = useState<any[]>([]);

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

    const [modalInicial, setModalInicial] = useState(false);
    const [configInicial, setConfigInicial] = useState({
        activo: 1,
        hora_envio: '18:00',
        enviar_pdf: 1,
        enviar_xml: 1,
    });

    async function cargarPendientesEmail() {
        try {
            const res = await fetch(
                `${API_BASE}/facturacion-sri/sri/comprobantes/email-pendientes`,
                {
                    headers: authHeaders(),
                }
            );

            const data = await res.json();

            if (data.ok) {
                setPendientes(data.facturas || []);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function cargarConfig() {
        try {
            setLoading(true);

            const res = await fetch(`${API_BASE}/facturacion-sri/sri/email-config`, {
                headers: authHeaders(),
            });

            const data = await res.json();

            if (data.ok) {
                setConfig(data.config);
            }
        } catch (error) {
            console.error(error);
            setMensaje('Error cargando configuración');
        } finally {
            setLoading(false);
        }
    }

    async function guardarConfig() {
        if (!config) return;

        try {
            setGuardando(true);
            setMensaje('');

            const res = await fetch(`${API_BASE}/facturacion-sri/sri/email-config`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({
                    activo: config.activo,
                    hora_envio: config.hora_envio,
                    enviar_pdf: config.enviar_pdf,
                    enviar_xml: config.enviar_xml,
                }),
            });

            const data = await res.json();

            if (data.ok) {
                setMensaje('Configuración guardada correctamente');
                setConfig(data.config);
            } else {
                setMensaje(data.message || 'No se pudo guardar');
            }
        } catch (error) {
            console.error(error);
            setMensaje('Error guardando configuración');
        } finally {
            setGuardando(false);
        }
    }

    async function enviarFacturasDelDia() {
        try {
            setEnviando(true);
            setMensaje('');

            const res = await fetch(
                `${API_BASE}/facturacion-sri/sri/comprobantes/enviar-email-dia`,
                {
                    method: 'POST',
                    headers: authHeaders(),
                }
            );

            const data = await res.json();

            if (data.ok) {
                setMensaje(
                    `Proceso finalizado. Total: ${data.total || 0}, enviados: ${data.enviados || 0}, errores: ${data.errores || 0}`
                );
            } else {
                setMensaje(data.message || 'No se pudo ejecutar el envío');
            }
        } catch (error) {
            console.error(error);
            setMensaje('Error enviando facturas del día');
        } finally {
            setEnviando(false);
        }
    }

    useEffect(() => {
        cargarConfig();
        cargarPendientesEmail();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white p-6">
                Cargando configuración...
            </div>
        );
    }

    if (!config) {
        return (
            <main className="min-h-screen bg-slate-950 text-white p-6">
                <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-3">
                        No existe configuración inicial
                    </h2>

                    <p className="text-slate-400 mb-5">
                        Crea la configuración por defecto para comenzar a programar el envío automático.
                    </p>

                    <button
                        onClick={() => setModalInicial(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold"
                    >
                        Crear configuración inicial
                    </button>

                    {mensaje && (
                        <div className="mt-5 bg-slate-950 border border-blue-500/40 text-blue-200 rounded-xl p-4">
                            {mensaje}
                        </div>
                    )}
                </div>
                {modalInicial && (
                    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                        <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-2xl font-black text-white">
                                        Crear configuración inicial
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Define cómo se enviarán automáticamente las facturas SRI autorizadas.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setModalInicial(false)}
                                    className="text-slate-400 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-5">
                                <label className="flex items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                                    <div>
                                        <p className="font-bold text-white">Activar envío automático</p>
                                        <p className="text-sm text-slate-400">
                                            El sistema enviará las facturas autorizadas del día a la hora configurada.
                                        </p>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={configInicial.activo === 1}
                                        onChange={(e) =>
                                            setConfigInicial({
                                                ...configInicial,
                                                activo: e.target.checked ? 1 : 0,
                                            })
                                        }
                                        className="w-5 h-5"
                                    />
                                </label>

                                <div>
                                    <label className="text-sm text-slate-400">
                                        Hora de envío masivo
                                    </label>
                                    <input
                                        type="time"
                                        value={configInicial.hora_envio}
                                        onChange={(e) =>
                                            setConfigInicial({
                                                ...configInicial,
                                                hora_envio: e.target.value,
                                            })
                                        }
                                        className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="flex items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                                        <div>
                                            <p className="font-bold text-white">Adjuntar PDF RIDE</p>
                                            <p className="text-sm text-slate-400">
                                                Se genera temporalmente y luego se elimina.
                                            </p>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={configInicial.enviar_pdf === 1}
                                            onChange={(e) =>
                                                setConfigInicial({
                                                    ...configInicial,
                                                    enviar_pdf: e.target.checked ? 1 : 0,
                                                })
                                            }
                                            className="w-5 h-5"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                                        <div>
                                            <p className="font-bold text-white">Adjuntar XML</p>
                                            <p className="text-sm text-slate-400">
                                                XML autorizado por el SRI.
                                            </p>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={configInicial.enviar_xml === 1}
                                            onChange={(e) =>
                                                setConfigInicial({
                                                    ...configInicial,
                                                    enviar_xml: e.target.checked ? 1 : 0,
                                                })
                                            }
                                            className="w-5 h-5"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setModalInicial(false)}
                                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={async () => {
                                        setGuardando(true);
                                        setMensaje('');

                                        try {
                                            const res = await fetch(`${API_BASE}/facturacion-sri/sri/email-config`, {
                                                method: 'PUT',
                                                headers: authHeaders(),
                                                body: JSON.stringify(configInicial),
                                            });

                                            const data = await res.json();

                                            if (data.ok) {
                                                setConfig(data.config);
                                                setMensaje('Configuración creada correctamente');
                                                setModalInicial(false);
                                            } else {
                                                setMensaje(data.message || 'No se pudo crear la configuración');
                                            }
                                        } catch (error) {
                                            console.error(error);
                                            setMensaje('Error creando configuración');
                                        } finally {
                                            setGuardando(false);
                                        }
                                    }}
                                    disabled={guardando}
                                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold"
                                >
                                    {guardando ? 'Creando...' : 'Guardar configuración'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
            <section className="max-w-5xl mx-auto">


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                        <h2 className="text-xl font-bold mb-5">
                            Parámetros de envío
                        </h2>

                        <div className="space-y-5">
                            <label className="flex items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                                <div>
                                    <p className="font-bold">Envío automático</p>
                                    <p className="text-sm text-slate-400">
                                        Si está apagado, no se enviará nada automáticamente.
                                    </p>
                                </div>

                                <input
                                    type="checkbox"
                                    checked={config.activo === 1}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            activo: e.target.checked ? 1 : 0,
                                        })
                                    }
                                    className="w-5 h-5"
                                />
                            </label>

                            <div>
                                <label className="text-sm text-slate-400">
                                    Hora de envío masivo
                                </label>
                                <input
                                    type="time"
                                    value={config.hora_envio || ''}
                                    onChange={(e) =>
                                        setConfig({
                                            ...config,
                                            hora_envio: e.target.value,
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                                    <div>
                                        <p className="font-bold">Adjuntar PDF RIDE</p>
                                        <p className="text-sm text-slate-400">
                                            Se genera temporalmente y se elimina.
                                        </p>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={config.enviar_pdf === 1}
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                enviar_pdf: e.target.checked ? 1 : 0,
                                            })
                                        }
                                        className="w-5 h-5"
                                    />
                                </label>

                                <label className="flex items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
                                    <div>
                                        <p className="font-bold">Adjuntar XML</p>
                                        <p className="text-sm text-slate-400">
                                            XML autorizado del comprobante.
                                        </p>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={config.enviar_xml === 1}
                                        onChange={(e) =>
                                            setConfig({
                                                ...config,
                                                enviar_xml: e.target.checked ? 1 : 0,
                                            })
                                        }
                                        className="w-5 h-5"
                                    />
                                </label>
                            </div>

                            <button
                                onClick={guardarConfig}
                                disabled={guardando}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold"
                            >
                                {guardando ? 'Guardando...' : 'Guardar configuración'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">
                            Envío manual
                        </h2>

                        <p className="text-sm text-slate-400 mb-5">
                            Ejecuta ahora el envío de todas las facturas SRI autorizadas del día.
                        </p>

                        <button
                            onClick={enviarFacturasDelDia}
                            disabled={enviando}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-5 py-3 rounded-xl font-bold"
                        >
                            {enviando ? 'Enviando...' : 'Enviar facturas del día'}
                        </button>

                        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <p className="text-sm text-slate-400">
                                Estado actual
                            </p>
                            <p className="font-bold mt-1">
                                {config.activo ? 'Activo' : 'Inactivo'}
                            </p>
                            <p className="text-sm text-slate-400 mt-3">
                                Hora: {config.hora_envio || 'No configurada'}
                            </p>
                        </div>
                    </div>
                </div>

                {mensaje && (
                    <div className="mt-6 bg-slate-900 border border-blue-500/40 text-blue-200 rounded-xl p-4">
                        {mensaje}
                    </div>
                )}

            </section>
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold">
                            Emails pendientes por enviar
                        </h2>
                        <p className="text-sm text-slate-400">
                            Facturas autorizadas del día que todavía no han sido enviadas.
                        </p>
                    </div>

                    <button
                        onClick={cargarPendientesEmail}
                        className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold"
                    >
                        Actualizar
                    </button>
                </div>

                {pendientes.length === 0 ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-400">
                        No hay emails pendientes para enviar.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-400 border-b border-slate-800">
                                    <th className="py-3 px-3">Factura</th>
                                    <th className="py-3 px-3">Cliente</th>
                                    <th className="py-3 px-3">Email</th>
                                    <th className="py-3 px-3">Estado</th>
                                    <th className="py-3 px-3">Fecha</th>
                                </tr>
                            </thead>

                            <tbody>
                                {pendientes.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-slate-800 hover:bg-slate-950"
                                    ><td className="py-3 px-3">
                                            <div className="font-bold">
                                                {item.cliente || 'Sin cliente'}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {item.tipoCliente || 'Sin tipo'}
                                            </div>
                                        </td>

                                        <td className="py-3 px-3 font-bold">
                                            {item.numeroFactura}
                                        </td>

                                        <td className="py-3 px-3">
                                            {`${item.nombres || ''} ${item.apellidos || ''}`.trim() || 'Sin cliente'}
                                        </td>

                                        <td className="py-3 px-3">
                                            {item.email || (
                                                <span className="text-red-400">
                                                    Sin email
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3 px-3">
                                            <span className="bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                                                {item.estado}
                                            </span>
                                        </td>

                                        <td className="py-3 px-3 text-slate-400">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}