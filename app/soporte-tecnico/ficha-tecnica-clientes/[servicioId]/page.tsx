'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE, getToken } from '@/src/lib/api';
type Props = {
    servicioId: string | null;
    onVolver?: () => void;
};
export default function DetalleFichaTecnicaClientePage({
    servicioId,
    onVolver
}: Props) {
    //const { servicioId } = useParams();
    const router = useRouter();

    const [servicio, setServicio] = useState<any>(null);
    const [guardando, setGuardando] = useState(false);

    const cargarServicio = async () => {
        try {
            console.log('Cargando servicioId:', servicioId);

            const token = getToken();

            const res = await fetch(`${API_BASE}/cliente-servicio/${servicioId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            console.log('Respuesta ficha técnica:', data);

            if (data.ok) {
                setServicio(data.servicio);
            } else {
                alert(data.message || 'No se encontró el servicio');
            }
        } catch (error) {
            console.error('Error cargando ficha técnica:', error);
        }
    };

    useEffect(() => {
        cargarServicio();
    }, [servicioId]);

    const cambiar = (campo: string, valor: any) => {
        setServicio((prev: any) => ({
            ...prev,
            [campo]: valor,
        }));
    };

    const guardarCambios = async () => {
        try {
            setGuardando(true);
            const token = getToken();

            const res = await fetch(`${API_BASE}/cliente-servicio/${servicioId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(servicio),
            });

            const data = await res.json();

            if (data.ok) {
                alert('Ficha técnica actualizada correctamente');
                cargarServicio();
            } else {
                alert(data.message || 'No se pudo guardar');
            }
        } catch (error) {
            console.error(error);
            alert('Error guardando ficha técnica');
        } finally {
            setGuardando(false);
        }
    };

    const abrirPdf = () => {
        window.open(
            `${API_BASE}/cliente-servicio/${servicioId}/ficha-tecnica-pdf`,
            '_blank'
        );
    };

    const capturarUbicacion = () => {
        if (!navigator.geolocation) {
            alert('Tu navegador no permite capturar ubicación');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                cambiar('latitudInstalacion', position.coords.latitude.toString());
                cambiar('longitudInstalacion', position.coords.longitude.toString());

                alert('Ubicación capturada correctamente');
            },
            (error) => {
                alert(
                    `Error GPS:
Código: ${error.code}
Mensaje: ${error.message}`
                );
            },
            {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: 60000,
            }
        );
    };

    if (!servicio) {
        return <div className="p-6">Cargando ficha técnica...</div>;
    }

    return (
        <div className="p-6 space-y-6 text-slate-100">

            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6 shadow-xl shadow-cyan-950/30">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <img
                        src={servicio.fotoPerfil || '/user-default.png'}
                        className="w-24 h-24 rounded-3xl object-cover border border-cyan-400/40 bg-slate-800"
                        alt="Cliente"
                    />

                    <div className="flex-1">
                        <h1 className="text-3xl font-black text-white">
                            {servicio.nombres} {servicio.apellidos}
                        </h1>

                        <p className="text-sm text-slate-400">
                            Contrato/Servicio:
                            <span className="ml-2 font-mono text-cyan-300">
                                {servicio.servicioId}
                            </span>
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                                {servicio.estadoServicio}
                            </span>

                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                                {servicio.estadoAtencion || 'SIN_ASIGNACION_TECNICO'}
                            </span>

                            <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                                {servicio.tipoServicio}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-lg">
                <h2 className="text-xl font-black text-white mb-5">
                    Plan contratado
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Dato label="Plan" value={servicio.nombrePlan} />
                    <Dato label="Tipo servicio" value={servicio.tipoServicio} />
                    <Dato label="Megas" value={`${servicio.velocidadBajada} / ${servicio.velocidadSubida}`} />
                    <Dato label="Estado contrato" value={servicio.estadoServicio} />
                    <Dato label="Día de pago" value={servicio.diaPago} />
                    <Dato label="Fecha instalación" value={servicio.fechaInstalacion} />
                </div>
            </section>

            <section className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 shadow-lg space-y-6">
                <div>
                    <h2 className="text-xl font-black text-white">
                        Datos técnicos editables
                    </h2>
                    <p className="text-sm text-slate-400">
                        Aquí solo se modifican los datos técnicos del servicio.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="PPPoE" value={servicio.pppSecret} onChange={(v: string) => cambiar('pppSecret', v)} />
                    <Input label="Queue" value={servicio.queueName} onChange={(v: string) => cambiar('queueName', v)} />
                    <Input label="IP cliente" value={servicio.ipCliente} onChange={(v: string) => cambiar('ipCliente', v)} />
                    <Input label="MAC" value={servicio.mac} onChange={(v: string) => cambiar('mac', v)} />
                    <Input label="Router ID" value={servicio.routerId} onChange={(v: string) => cambiar('routerId', v)} />
                    <Input label="Estado atención" value={servicio.estadoAtencion} onChange={(v: string) => cambiar('estadoAtencion', v)} />
                </div>

                <h3 className="text-lg font-black text-cyan-300">
                    Fibra / GPON
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="ONU ID" value={servicio.onuId} onChange={(v: string) => cambiar('onuId', v)} />
                    <Input label="VLAN" value={servicio.vlan} onChange={(v: string) => cambiar('vlan', v)} />
                    <Input label="Puerto OLT" value={servicio.puertoOlt} onChange={(v: string) => cambiar('puertoOlt', v)} />
                    <Input label="Caja NAP" value={servicio.cajaNap} onChange={(v: string) => cambiar('cajaNap', v)} />
                    <Input label="Splitter" value={servicio.splitter} onChange={(v: string) => cambiar('splitter', v)} />
                    <Input label="Señal RX" value={servicio.senalRx} onChange={(v: string) => cambiar('senalRx', v)} />
                    <Input label="Señal TX" value={servicio.senalTx} onChange={(v: string) => cambiar('senalTx', v)} />
                </div>

                <h3 className="text-lg font-black text-purple-300">
                    WISP / Radio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Torre ID" value={servicio.torreId} onChange={(v: string) => cambiar('torreId', v)} />
                    <Input label="Sectorial ID" value={servicio.sectorialId} onChange={(v: string) => cambiar('sectorialId', v)} />
                    <Input label="Sectorial" value={servicio.sectorial} onChange={(v: string) => cambiar('sectorial', v)} />
                    <Input label="Frecuencia" value={servicio.frecuencia} onChange={(v: string) => cambiar('frecuencia', v)} />
                    <Input label="SSID" value={servicio.ssid} onChange={(v: string) => cambiar('ssid', v)} />
                    <Input label="Usuario CPE" value={servicio.usuarioCpe} onChange={(v: string) => cambiar('usuarioCpe', v)} />
                    <Input label="IP antena" value={servicio.ipAntena} onChange={(v: string) => cambiar('ipAntena', v)} />
                    <Input label="Modelo antena" value={servicio.modeloAntena} onChange={(v: string) => cambiar('modeloAntena', v)} />
                </div>

                <h3 className="text-lg font-black text-emerald-300">
                    Ubicación de instalación
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Latitud"
                        value={servicio.latitudInstalacion}
                        onChange={(v: string) => cambiar('latitudInstalacion', v)}
                    />

                    <Input
                        label="Longitud"
                        value={servicio.longitudInstalacion}
                        onChange={(v: string) => cambiar('longitudInstalacion', v)}
                    />

                    <Input
                        label="Dirección instalación"
                        value={servicio.direccionInstalacion}
                        onChange={(v: string) => cambiar('direccionInstalacion', v)}
                    />

                    <Input
                        label="Referencia"
                        value={servicio.referenciaInstalacion}
                        onChange={(v: string) => cambiar('referenciaInstalacion', v)}
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={capturarUbicacion}
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                        📍 Capturar ubicación
                    </button>

                    {servicio.latitudInstalacion && servicio.longitudInstalacion && (
                        <button
                            type="button"
                            onClick={() =>
                                window.open(
                                    `https://www.google.com/maps?q=${servicio.latitudInstalacion},${servicio.longitudInstalacion}`,
                                    '_blank'
                                )
                            }
                            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                        >
                            Ver en mapa
                        </button>
                    )}
                </div>


                <div className="flex flex-wrap gap-3 pt-4">
                    <button
                        onClick={guardarCambios}
                        disabled={guardando}
                        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-blue-950/40"
                    >
                        {guardando ? 'Guardando...' : 'Guardar ficha técnica'}
                    </button>

                    <button
                        onClick={abrirPdf}
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
                    >
                        Generar PDF
                    </button>
                </div>
                {servicio.latitud && servicio.longitud && (
                    <button
                        onClick={() =>
                            window.open(
                                `https://www.google.com/maps?q=${servicio.latitud},${servicio.longitud}`,
                                '_blank'
                            )
                        }
                        className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                        Ver en mapa
                    </button>
                )}
            </section>


        </div>
    );
}

function Dato({ label, value }: any) {
    return (
        <div>
            <p className="text-slate-400">{label}</p>
            <p className="font-semibold text-slate-700">{value || 'No definido'}</p>
        </div>
    );
}

type InputProps = {
    label: string;
    value?: string | number | null;
    onChange: (value: string) => void;
};

function Input({ label, value, onChange }: InputProps) {
    return (
        <div>
            <label className="text-sm text-slate-500">{label}</label>
            <input
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full mt-1 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}