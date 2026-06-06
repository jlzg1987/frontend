'use client';

import { useEffect, useState } from 'react';
import { API_BASE, getToken } from '@/src/lib/api';
import { FaWhatsapp } from 'react-icons/fa';
type Props = {
    ticketsId: string | null;
    onVolver?: () => void;
};

export default function FichaTecnicaClientePage({ ticketsId, onVolver }: Props) {
    const ticketId = ticketsId;

    const [ticket, setTicket] = useState<any>(null);
    const [servicio, setServicio] = useState<any>(null);
    const [atenciones, setAtenciones] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [fotos, setFotos] = useState<File[]>([]);
    const [estadoAtencionEdit, setEstadoAtencionEdit] = useState('');
    const [estadoTicketEdit, setEstadoTicketEdit] = useState('');
    const [guardandoEstado, setGuardandoEstado] = useState(false);
    const [fotosHistorial, setFotosHistorial] = useState<any[]>([]);

    const [form, setForm] = useState({
        diagnostico: '',
        solucion: '',
        observacion: '',
        estadoAtencion: 'EN_DOMICILIO',
    });

    const cargarDatos = async () => {
        try {
            if (!ticketId) return;

            setCargando(true);
            const token = getToken();

            const resTicket = await fetch(`${API_BASE}/tickets/${ticketId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const dataTicket = await resTicket.json();

            if (dataTicket.ok) {
                const ticketData = dataTicket.ticket || dataTicket.data;
                setTicket(ticketData);

                const resServicios = await fetch(`${API_BASE}/cliente-servicio`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const dataServicios = await resServicios.json();

                if (dataServicios.ok) {
                    const listaServicios = dataServicios.servicios || dataServicios.data || [];

                    const servicioCliente = listaServicios.find((s: any) =>
                        s.clienteId === ticketData.clienteId ||
                        s.clienteId === ticketData.clienteServicioId ||
                        s.servicioClienteId === ticketData.clienteServicioId ||
                        s.id === ticketData.clienteServicioId
                    );

                    setServicio(servicioCliente || null);
                }
            }

            const resAtenciones = await fetch(
                `${API_BASE}/tickets/${ticketId}/atenciones`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const dataAtenciones = await resAtenciones.json();

            if (dataAtenciones.ok) {
                setAtenciones(dataAtenciones.data || []);
            }

            const resFotos = await fetch(`${API_BASE}/tickets/${ticketId}/fotos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const dataFotos = await resFotos.json();

            if (dataFotos.ok) {
                setFotosHistorial(dataFotos.data || []);
            }
        } catch (error) {
            console.error('Error cargando ficha técnica:', error);
        } finally {
            setCargando(false);
        }
    };

    const obtenerUbicacion = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('El navegador no soporta ubicación');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    resolve({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                },
                () => {
                    reject('No se pudo obtener la ubicación');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };


    const guardarAtencion = async () => {
        try {
            if (!ticketId) return;

            if (!ticket?.tecnicoAsignadoId) {
                alert('Este ticket no tiene técnico asignado');
                return;
            }

            if (!form.diagnostico.trim()) {
                alert('Debe ingresar el diagnóstico del problema');
                return;
            }

            if (form.estadoAtencion === 'SOLUCIONADO' && !form.solucion.trim()) {
                alert('Debe ingresar la solución aplicada');
                return;
            }

            if (fotos.length === 0) {
                alert('Debe subir al menos una foto como evidencia');
                return;
            }

            setGuardando(true);

            const token = getToken();

            let latAtencion = null;
            let lngAtencion = null;

            try {
                const ubicacion = await obtenerUbicacion();
                latAtencion = ubicacion.lat;
                lngAtencion = ubicacion.lng;
            } catch (error) {
                console.warn('No se obtuvo ubicación, se guardará sin GPS:', error);
            }
            const tecnicoAsignadoId =
                servicio?.tecnicoAsignadoId ||
                ticket?.tecnicoAsignadoId;

            if (!tecnicoAsignadoId) {
                alert('Este ticket no tiene técnico asignado');
                return;
            }
            const res = await fetch(`${API_BASE}/tickets/${ticketId}/atencion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tecnicoId: tecnicoAsignadoId,
                    diagnostico: form.diagnostico,
                    solucion: form.solucion,
                    observacion: form.observacion,
                    estadoAtencion: form.estadoAtencion,
                    finalizar: form.estadoAtencion === 'SOLUCIONADO',
                    latAtencion,
                    lngAtencion,
                    direccionAtencion:
                        servicio?.direccionInstalacion ||
                        ticket.direccionCliente ||
                        ticket.clienteDireccion ||
                        null,
                }),
            });

            const data = await res.json();

            console.log('RESPUESTA GUARDAR ATENCION:', data);
            console.log('TICKET:', ticket);
            console.log('SERVICIO:', servicio);
            console.log('TECNICO ENVIADO:', ticket.tecnicoAsignadoId);



            if (!data.ok) {
                alert(data.mensaje || 'No se pudo registrar la atención');
                return;
            }

            const atencionId = data.atencionId;

            if (atencionId && fotos.length > 0) {
                await subirFotosFichaTecnica(atencionId);
            }

            alert(
                form.estadoAtencion === 'SOLUCIONADO'
                    ? 'Atención registrada y ticket marcado como resuelto'
                    : 'Atención registrada correctamente'
            );

            setForm({
                diagnostico: '',
                solucion: '',
                observacion: '',
                estadoAtencion: 'EN_DOMICILIO',
            });

            setFotos([]);
            cargarDatos();
        } catch (error) {
            console.error('Error guardando atención:', error);
            alert('Error guardando atención técnica');
        } finally {
            setGuardando(false);
        }
    };


    const guardarEstadoAtencion = async (atencionId: string) => {
        try {
            const token = getToken();

            if (!estadoAtencionEdit || !estadoTicketEdit) {
                alert('Seleccione ambos estados');
                return;
            }

            setGuardandoEstado(true);

            const res = await fetch(
                `${API_BASE}/tickets/atencion/${atencionId}/estado`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        estadoAtencion: estadoAtencionEdit,
                        ticketEstado: estadoTicketEdit,
                    }),
                }
            );

            const data = await res.json();

            if (!data.ok) {
                alert(data.mensaje || 'No se pudo actualizar el estado');
                return;
            }

            alert('Estado actualizado correctamente');
            cargarDatos();
        } catch (error) {
            console.error('Error actualizando estado:', error);
            alert('Error actualizando estado');
        } finally {
            setGuardandoEstado(false);
        }
    };

    const subirFotosFichaTecnica = async (atencionId: string) => {
        if (fotos.length === 0) return;

        const token = getToken();

        const formData = new FormData();

        fotos.forEach((foto) => {
            formData.append('fotos', foto);
        });

        formData.append('clienteId', ticket.clienteId);
        formData.append('tecnicoId', ticket.tecnicoAsignadoId);
        formData.append('descripcion', 'Fotos de atención técnica en campo');

        const res = await fetch(
            `${API_BASE}/tickets/${ticketId}/atencion/${atencionId}/fotos`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }
        );

        const data = await res.json();

        if (!data.ok) {
            throw new Error(data.mensaje || 'No se pudieron subir las fotos');
        }

        return data;
    };

    useEffect(() => {
        if (ticketId) cargarDatos();
    }, [ticketId]);


    const abrirWhatsAppCliente = () => {
        const telefono =
            servicio?.telefono ||
            ticket?.clienteCelular ||
            '';

        if (!telefono) {
            alert('El cliente no tiene teléfono registrado');
            return;
        }

        const numero = telefono.replace(/\D/g, '');


        const mensaje = `
Hola ${servicio?.nombres || ''} ${servicio?.apellidos || ''},

Le saluda ${servicio?.tecnicoNombre || 'el técnico'} de Netcomp RF.

Me encuentro próximo a llegar a su domicilio para atender el ticket:

📋 ${servicio?.codigoTicket || ticket?.codigoTicket}

🛠 Motivo:
${servicio?.tituloTicket || ticket?.tituloTicket || 'Soporte técnico'}

Por favor, si se encuentra disponible, le agradecería me pueda recibir para realizar la revisión correspondiente.

Gracias por confiar en Netcomp RF.
`;
        const url = `https://wa.me/593${numero.substring(numero.length - 9)}?text=${encodeURIComponent(mensaje)}`;

        window.open(url, '_blank');
    };

    if (cargando) {
        return <div className="p-6">Cargando ficha técnica...</div>;
    }

    if (!ticket) {
        return (
            <div className="p-6">
                <p className="text-red-600 font-semibold">
                    No se encontró información del ticket.
                </p>

                {onVolver && (
                    <button
                        onClick={onVolver}
                        className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white"
                    >
                        Volver
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-[#020617] min-h-screen">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#071428] via-[#0b1b33] to-[#020617] shadow-[0_0_25px_rgba(6,182,212,0.12)] overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-800 text-white p-5">
                        <p className="text-xs text-cyan-100">Cliente / Contrato</p>
                        <h2 className="text-lg font-bold">
                            {`${servicio?.nombres || ''} ${servicio?.apellidos || ''}`.trim() ||
                                ticket.clienteNombre ||
                                'Cliente sin nombre'}
                        </h2>
                    </div>

                    <div className="p-5">
                        <div className="flex items-center gap-4">
                            <img
                                src={servicio?.fotoPerfil || ticket.clienteFoto || '/img/user-default.png'}
                                className="w-20 h-20 rounded-2xl object-cover border border-cyan-400/40 bg-slate-800"
                            />

                            <div>

                                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                                    {ticket.estado || 'SIN ESTADO'}
                                </span>

                                <button
                                    onClick={abrirWhatsAppCliente}
                                    className=" mt-3 w-full
        flex items-center justify-center gap-2
        w-full
        bg-green-600 hover:bg-green-700
        text-white
        rounded-xl
        py-3
        font-semibold
        transition-all
        shadow-lg shadow-green-500/20
    "
                                    style={{ width: 150 }}
                                >
                                    <FaWhatsapp size={20} />
                                    WhatsApp
                                </button>

                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
                            {[
                                ['Código ticket:', servicio?.codigoTicket || ticket.codigoTicket || 'No disponible'],

                                ['Cédula:', servicio?.cedula || 'No disponible'],

                                [
                                    'Teléfono:',
                                    servicio?.telefono ||
                                    ticket.clienteCelular ||
                                    'No disponible',
                                ],

                                [
                                    'Dirección:',
                                    servicio?.direccionInstalacion ||
                                    ticket.direccionCliente ||
                                    ticket.clienteDireccion ||
                                    'Sin dirección',
                                ],

                                [
                                    'Contrato / Servicio:',
                                    servicio?.servicioId || 'No disponible',
                                ],

                                [
                                    'Estado servicio:',
                                    servicio?.estadoServicio || 'No disponible',
                                ],

                                [
                                    'Plan contratado:',
                                    servicio?.nombrePlan || 'No disponible',
                                ],

                                [
                                    'Megas:',
                                    servicio?.velocidadBajada && servicio?.velocidadSubida
                                        ? `${servicio.velocidadBajada} / ${servicio.velocidadSubida}`
                                        : 'No disponible',
                                ],

                                [
                                    'Tipo servicio:',
                                    servicio?.tipoServicio || 'No disponible',
                                ],

                                [
                                    'Sectorial:',
                                    servicio?.sectorial || servicio?.ssid || 'No disponible',
                                ],

                                [
                                    'Modelo antena:',
                                    servicio?.modeloAntena || 'No disponible',
                                ],

                                [
                                    'IP antena:',
                                    servicio?.ipAntena || 'No disponible',
                                ],

                                [
                                    'IP cliente:',
                                    servicio?.ipCliente || 'No disponible',
                                ],

                                [
                                    'Frecuencia:',
                                    servicio?.frecuencia || 'No disponible',
                                ],
                            ].map(([label, value], index) => (
                                <div
                                    key={index}
                                    className="p-3 rounded-2xl bg-white/5 border border-white/10"
                                >
                                    <b className="text-cyan-300">{label}</b>
                                    <p className="text-white mt-1 break-words">
                                        {String(value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                    <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#071428] via-[#0b1b33] to-[#020617] shadow-[0_0_25px_rgba(6,182,212,0.12)] p-6">
                        <div className="flex items-center justify-between mb-5 gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    Registrar atención en campo
                                </h2>
                                <p className="text-sm text-slate-300">
                                    Este registro actualizará el estado del ticket según la atención.
                                </p>
                            </div>

                            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 text-xs font-semibold">
                                {ticket.prioridad || 'SIN PRIORIDAD'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <textarea
                                placeholder="Diagnóstico del problema encontrado"
                                className="bg-[#0d1f38] border border-cyan-500/30 rounded-2xl px-4 py-3 min-h-[110px] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                value={form.diagnostico}
                                onChange={(e) =>
                                    setForm({ ...form, diagnostico: e.target.value })
                                }
                            />

                            <textarea
                                placeholder="Solución aplicada"
                                className="bg-[#0d1f38] border border-cyan-500/30 rounded-2xl px-4 py-3 min-h-[110px] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                value={form.solucion}
                                onChange={(e) =>
                                    setForm({ ...form, solucion: e.target.value })
                                }
                            />

                            <textarea
                                placeholder="Observación adicional"
                                className="bg-[#0d1f38] border border-cyan-500/30 rounded-2xl px-4 py-3 min-h-[90px] text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                value={form.observacion}
                                onChange={(e) =>
                                    setForm({ ...form, observacion: e.target.value })
                                }
                            />

                            <select
                                className="bg-[#0d1f38] border border-cyan-500/30 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                value={form.estadoAtencion}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        estadoAtencion: e.target.value,
                                    })
                                }
                            >
                                <option value="EN_DOMICILIO">En domicilio</option>
                                <option value="REQUIERE_SEGUIMIENTO">Requiere seguimiento</option>
                                <option value="SOLUCIONADO">Problema solucionado</option>
                            </select>

                            <div className="border-2 border-dashed border-cyan-500/30 rounded-3xl p-5 bg-[#0d1f38]">
                                <label className="font-bold text-cyan-200">
                                    Evidencias fotográficas
                                </label>

                                <p className="text-sm text-slate-300 mb-3">
                                    Debe subir una o varias fotos del trabajo realizado.
                                </p>

                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    capture="environment"
                                    className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-cyan-600"
                                    onChange={(e) => {
                                        const archivos = Array.from(e.target.files || []);
                                        setFotos(archivos);
                                    }}
                                />

                                {fotos.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                        {fotos.map((foto, index) => (
                                            <div
                                                key={index}
                                                className="rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#071428]"
                                            >
                                                <img
                                                    src={URL.createObjectURL(foto)}
                                                    className="w-full h-24 object-cover"
                                                />
                                                <p className="text-xs p-2 truncate text-slate-300">
                                                    {foto.name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={guardarAtencion}
                                disabled={guardando}
                                className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-2xl px-5 py-3 font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                            >
                                {guardando
                                    ? 'Guardando atención...'
                                    : form.estadoAtencion === 'SOLUCIONADO'
                                        ? 'Guardar y marcar como resuelto'
                                        : 'Guardar atención técnica'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#071428] via-[#0b1b33] to-[#020617] shadow-[0_0_25px_rgba(6,182,212,0.12)] p-6">
                <h2 className="font-bold text-white mb-4">
                    Historial de mantenimientos
                </h2>

                {atenciones.length === 0 ? (
                    <p className="text-slate-300">
                        Este cliente aún no tiene mantenimientos registrados.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {atenciones.map((a) => {
                            const fotosDeAtencion = fotosHistorial.filter(
                                (f) => f.atencionId === a.atencionId
                            );
                            return (
                                <div
                                    key={a.atencionId}
                                    className="border border-cyan-500/20 rounded-2xl p-4 bg-white/5"
                                >
                                    <div className="flex justify-between gap-4 flex-wrap">
                                        <div>
                                            <p className="font-bold text-white">
                                                {a.nombres} {a.apellidos}
                                            </p>
                                            <p className="text-sm text-slate-300">
                                                {a.email}
                                            </p>
                                        </div>

                                        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold h-fit">
                                            {a.estadoAtencion}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-slate-300">
                                        <p><b className="text-cyan-300">Diagnóstico:</b> {a.diagnostico}</p>
                                        <p><b className="text-cyan-300">Solución:</b> {a.solucion || 'Sin solución registrada'}</p>
                                        <p><b className="text-cyan-300">Observación:</b> {a.observacion || 'Sin observación'}</p>
                                        <p><b className="text-cyan-300">Fecha inicio:</b> {a.fechaInicio || 'No disponible'}</p>
                                        <p><b className="text-cyan-300">Fecha fin:</b> {a.fechaFin || 'Pendiente'}</p>
                                        <p>
                                            <b className="text-cyan-300">Ubicación:</b>{' '}
                                            {a.latAtencion && a.lngAtencion
                                                ? `${a.latAtencion}, ${a.lngAtencion}`
                                                : 'No registrada'}
                                        </p>

                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                                        <select
                                            className="bg-[#0d1f38] border border-cyan-500/30 rounded-xl px-3 py-2 text-white"
                                            defaultValue={a.estadoAtencion}
                                            onChange={(e) => setEstadoAtencionEdit(e.target.value)}
                                        >
                                            <option value="EN_DOMICILIO">En domicilio</option>
                                            <option value="NO_ATENDIDO">No atendido</option>
                                            <option value="SOLUCIONADO">Solucionado</option>
                                            <option value="REQUIERE_SEGUIMIENTO">Requiere seguimiento</option>
                                            <option value="CLIENTE_AUSENTE">Cliente ausente</option>
                                        </select>

                                        <select
                                            className="bg-[#0d1f38] border border-cyan-500/30 rounded-xl px-3 py-2 text-white"
                                            defaultValue={ticket?.estado || 'EN_PROCESO'}
                                            onChange={(e) => setEstadoTicketEdit(e.target.value)}
                                        >
                                            <option value="ABIERTO">Abierto</option>
                                            <option value="EN_PROCESO">En proceso</option>
                                            <option value="ESPERANDO_CLIENTE">Esperando cliente</option>
                                            <option value="RESUELTO">Resuelto</option>
                                            <option value="CERRADO">Cerrado</option>
                                            <option value="CANCELADO">Cancelado</option>
                                        </select>

                                        <button
                                            onClick={() => guardarEstadoAtencion(a.atencionId)}
                                            disabled={guardandoEstado}
                                            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-4 py-2 font-bold"
                                        >
                                            {guardandoEstado ? 'Guardando...' : 'Guardar estado'}
                                        </button>
                                    </div>
                                    {fotosDeAtencion.length > 0 && (
                                        <div className="mt-5">
                                            <h3 className="text-cyan-300 font-bold text-sm mb-3">
                                                Evidencias fotográficas
                                            </h3>

                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {fotosDeAtencion.map((foto) => (
                                                    <a
                                                        key={foto.fotoId}
                                                        href={foto.urlArchivo}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#071428]"
                                                    >
                                                        <img
                                                            src={foto.urlArchivo}
                                                            alt={foto.nombreArchivo}
                                                            className="w-full h-24 object-cover group-hover:scale-105 transition"
                                                        />

                                                        <div className="p-2">
                                                            <p className="text-xs text-slate-300 truncate">
                                                                {foto.nombreArchivo}
                                                            </p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}