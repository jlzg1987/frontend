'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type SriConfig = {
    sriConfigId?: number;
    empresaId: number;
    ambiente: '1' | '2';
    tipoEmision: '1';
    establecimiento: string;
    puntoEmision: string;
    secuencialFactura: number;
    obligadoContabilidad: 'SI' | 'NO';
    contribuyenteRimpe: 'SI' | 'NO';
    agenteRetencion?: string;
    estado: 'ACTIVO' | 'INACTIVO';
};

export default function ConfiguracionSriPage() {
    const [empresaId, setEmpresaId] = useState('1');
    const [config, setConfig] = useState<SriConfig>({
        empresaId: 1,
        ambiente: '1',
        tipoEmision: '1',
        establecimiento: '001',
        puntoEmision: '001',
        secuencialFactura: 1,
        obligadoContabilidad: 'NO',
        contribuyenteRimpe: 'NO',
        agenteRetencion: '',
        estado: 'ACTIVO'
    });

    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    async function cargarConfiguracion() {
        try {
            const resp = await fetch(`${API_BASE}/facturacion-sri/configuracion/${empresaId}`);
            const data = await resp.json();

            if (data.ok && data.data) {
                setConfig(data.data);
            }
        } catch (error) {
            console.error('Error cargando configuración SRI:', error);
        }
    }

    async function guardarConfiguracion(e: React.FormEvent) {
        e.preventDefault();

        try {
            setCargando(true);

            const resp = await fetch(`${API_BASE}/facturacion-sri/configuracion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...config,
                    empresaId: Number(empresaId)
                })
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error guardando configuración');
                return;
            }

            alert('Configuración SRI guardada correctamente');
            await cargarConfiguracion();

        } catch (error) {
            console.error(error);
            alert('Error guardando configuración SRI');
        } finally {
            setCargando(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
            <section className="max-w-4xl mx-auto">


                <form
                    onSubmit={guardarConfiguracion}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Campo label="Empresa ID">
                            <input
                                type="number"
                                value={empresaId}
                                onChange={(e) => {
                                    setEmpresaId(e.target.value);
                                    setConfig({
                                        ...config,
                                        empresaId: Number(e.target.value)
                                    });
                                }}
                                onBlur={cargarConfiguracion}
                                className="input"
                            />
                        </Campo>

                        <Campo label="Ambiente">
                            <select
                                value={config.ambiente}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        ambiente: e.target.value as '1' | '2'
                                    })
                                }
                                className="input"
                            >
                                <option value="1">Pruebas</option>
                                <option value="2">Producción</option>
                            </select>
                        </Campo>

                        <Campo label="Estado">
                            <select
                                value={config.estado}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        estado: e.target.value as 'ACTIVO' | 'INACTIVO'
                                    })
                                }
                                className="input"
                            >
                                <option value="ACTIVO">Activo</option>
                                <option value="INACTIVO">Inactivo</option>
                            </select>
                        </Campo>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Campo label="Tipo emisión">
                            <input
                                value="1 - Normal"
                                disabled
                                className="input opacity-70"
                            />
                        </Campo>

                        <Campo label="Establecimiento">
                            <input
                                value={config.establecimiento}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        establecimiento: e.target.value.padStart(3, '0').slice(-3)
                                    })
                                }
                                className="input"
                                maxLength={3}
                            />
                        </Campo>

                        <Campo label="Punto emisión">
                            <input
                                value={config.puntoEmision}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        puntoEmision: e.target.value.padStart(3, '0').slice(-3)
                                    })
                                }
                                className="input"
                                maxLength={3}
                            />
                        </Campo>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Campo label="Secuencial factura">
                            <input
                                type="number"
                                value={config.secuencialFactura}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        secuencialFactura: Number(e.target.value)
                                    })
                                }
                                className="input"
                                min={1}
                            />
                        </Campo>

                        <Campo label="Obligado contabilidad">
                            <select
                                value={config.obligadoContabilidad}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        obligadoContabilidad: e.target.value as 'SI' | 'NO'
                                    })
                                }
                                className="input"
                            >
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </Campo>

                        <Campo label="Contribuyente RIMPE">
                            <select
                                value={config.contribuyenteRimpe}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        contribuyenteRimpe: e.target.value as 'SI' | 'NO'
                                    })
                                }
                                className="input"
                            >
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </Campo>
                    </div>

                    <Campo label="Agente de retención">
                        <input
                            value={config.agenteRetencion || ''}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    agenteRetencion: e.target.value
                                })
                            }
                            className="input"
                            placeholder="Opcional"
                        />
                    </Campo>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 font-black"
                    >
                        {cargando ? 'Guardando...' : 'Guardar configuración SRI'}
                    </button>
                </form>
            </section>

            <style jsx>{`
                .input {
                    width: 100%;
                    margin-top: 8px;
                    background: #020617;
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 12px 14px;
                    outline: none;
                    color: white;
                }

                .input:focus {
                    border-color: #06b6d4;
                }
            `}</style>
        </main>
    );
}

function Campo({
    label,
    children
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-sm text-slate-300">
                {label}
            </label>
            {children}
        </div>
    );
}