"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BadgeDollarSign } from "lucide-react";
import { Copy, Check } from "lucide-react";

import { API_BASE, getToken } from "@/src/lib/api";

export default function PerfilAdministrativoPage({
    servicioId,
    onVolver,
    onAbrirListadoMorosos,
}: {
    servicioId: string;
    onVolver: () => void;
    onAbrirListadoMorosos: () => void;
}) {


    const [loading, setLoading] = useState(true);
    const [perfil, setPerfil] = useState<any>(null);
    const [estadoConexion, setEstadoConexion] = useState<any>(null);
    const [cargandoPing, setCargandoPing] = useState(false);
    const [modalTicket, setModalTicket] = useState(false);
    const [pagoSeleccionado, setPagoSeleccionado] = useState<any | null>(null);
    const [valorPagado, setValorPagado] = useState("");
    const [formaPago, setFormaPago] = useState("EFECTIVO");
    const [referenciaPago, setReferenciaPago] = useState("");
    const [loadingPago, setLoadingPago] = useState(false);
    const [datosCopiados, setDatosCopiados] = useState(false);
    const [campoCopiado, setCampoCopiado] = useState<string | null>(null);

    const [nuevoTicket, setNuevoTicket] = useState({
        titulo: "",
        descripcion: "",
        categoria: "SOPORTE",
        prioridad: "MEDIA",
    });


    useEffect(() => {
        cargarPerfil();
    }, [servicioId]);

    useEffect(() => {
        consultarEstadoConexion();

        const intervalo = setInterval(() => {
            consultarEstadoConexion();
        }, 45000);

        return () => clearInterval(intervalo);
    }, [servicioId]);

    function cambiarFormaPago(valor: string) {
        setFormaPago(valor);

        if (valor === "EFECTIVO") {
            setReferenciaPago("PAGO EN EFECTIVO");
        } else {
            setReferenciaPago("");
        }
    }

    async function registrarPagoMensualidad() {
        if (!pagoSeleccionado) return;

        try {
            setLoadingPago(true);

            const token = getToken();

            const res = await fetch(`${API_BASE}/mensualidades/registrar-pago`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    mensualidadId: pagoSeleccionado.mensualidadId,
                    valorPagado: Number(valorPagado || pagoSeleccionado.valorMensual),
                    referenciaPago,
                    observacion: `Forma de pago: ${formaPago}`,
                }),
            });

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(data.message || data.mensaje || "Error registrando pago");
            }

            alert("Pago registrado correctamente");

            setPagoSeleccionado(null);
            setValorPagado("");
            setFormaPago("EFECTIVO");
            setReferenciaPago("");

            cargarPerfil();

        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoadingPago(false);
        }
    }

    async function consultarEstadoConexion() {
        try {
            setCargandoPing(true);

            const token = getToken();

            const res = await fetch(
                `${API_BASE}/clientes/perfiles/administrativo/${servicioId}/ping`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(data.mensaje || "Error consultando conexión");
            }

            setEstadoConexion(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setCargandoPing(false);
        }
    }

    async function cargarPerfil() {
        try {
            const token = getToken();

            const res = await fetch(
                `${API_BASE}/clientes/perfiles/administrativo/${servicioId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (data.ok) {
                setPerfil(data.datos);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    function formatearFecha(fecha?: string) {
        if (!fecha) return "—";
        return new Date(fecha).toLocaleDateString("es-EC");
    }

    async function crearTicket() {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    clienteId: perfil.cliente.clienteId,
                    servicioId: perfil.servicio.servicioId,

                    titulo: nuevoTicket.titulo,
                    descripcion: nuevoTicket.descripcion,
                    categoria: nuevoTicket.categoria,
                    prioridad: nuevoTicket.prioridad,
                }),
            });

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(
                    data.mensaje || "No se pudo crear el ticket"
                );
            }

            alert("Ticket creado correctamente");

            setModalTicket(false);

            setNuevoTicket({
                titulo: "",
                descripcion: "",
                categoria: "SOPORTE",
                prioridad: "MEDIA",
            });

            cargarPerfil();

        } catch (error: any) {
            alert(error.message);
        }
    }

    if (loading) {
        return (
            <div className="p-8 text-white">
                Cargando perfil...
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="p-8 text-red-400">
                No se pudo cargar el perfil.
            </div>
        );
    }
    const copiarDatosCliente = async () => {
        const datos = [
            `Nombre: ${perfil.cliente?.nombres || ""} ${perfil.cliente?.apellidos || ""}`,
            `Cédula: ${perfil.cliente?.cedula || "N/A"}`,
            `Cliente ID: ${perfil.cliente?.clienteId || "N/A"}`,
            `Servicio ID: ${perfil.servicio?.servicioId || "N/A"}`,
            `IP Cliente: ${perfil.servicio?.ipCliente || "N/A"}`,
        ].join("\n");

        try {
            await navigator.clipboard.writeText(datos);

            setDatosCopiados(true);

            setTimeout(() => {
                setDatosCopiados(false);
            }, 2000);

        } catch (error) {
            console.error("Error copiando datos:", error);
        }
    };
    const copiarDato = async (
        valor: string | number | null | undefined,
        campo: string
    ) => {
        if (valor === null || valor === undefined || valor === "") return;

        try {
            await navigator.clipboard.writeText(String(valor));

            setCampoCopiado(campo);

            setTimeout(() => {
                setCampoCopiado(null);
            }, 1500);

        } catch (error) {
            console.error("Error copiando dato:", error);
        }
    };

    return (
        <div className="p-6 space-y-6 text-white">

            {/* CABECERA */}

            <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-6">
                <div className="flex gap-6 items-center">

                    {/* FOTO / INICIALES */}
                    <div className="shrink-0">
                        {perfil.cliente?.fotoPerfil ? (
                            <Image
                                src={perfil.cliente.fotoPerfil}
                                alt={`${perfil.cliente?.nombres || ""} ${perfil.cliente?.apellidos || ""}`}
                                width={120}
                                height={120}
                                className="w-[120px] h-[120px] rounded-full border-4 border-cyan-500 object-cover"
                            />
                        ) : (
                            <div
                                className="
                        w-[120px] h-[120px]
                        rounded-full
                        border-4 border-cyan-500
                        bg-gradient-to-br from-cyan-500/20 to-blue-600/20
                        flex items-center justify-center
                        shadow-lg shadow-cyan-500/10
                    "
                            >
                                <span className="text-4xl font-bold text-cyan-400 uppercase">
                                    {`${perfil.cliente?.nombres?.charAt(0) || ""}${perfil.cliente?.apellidos?.charAt(0) || ""
                                        }`}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1">

                        <div className="flex flex-wrap items-center justify-between gap-3">

                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-white">
                                    {perfil.cliente?.nombres}{" "}
                                    {perfil.cliente?.apellidos}
                                </h1>

                                <button
                                    type="button"
                                    onClick={() =>
                                        copiarDato(
                                            `${perfil.cliente?.nombres || ""} ${perfil.cliente?.apellidos || ""}`.trim(),
                                            "nombre"
                                        )
                                    }
                                    className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                                    title="Copiar nombre"
                                >
                                    {campoCopiado === "nombre" ? (
                                        <Check size={16} className="text-emerald-400" />
                                    ) : (
                                        <Copy size={16} />
                                    )}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={copiarDatosCliente}
                                className={`
            inline-flex items-center gap-2
            px-3 py-2 rounded-lg
            text-sm font-medium
            border transition-all
            ${datosCopiados
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400"
                                    }
        `}
                            >
                                {datosCopiados ? (
                                    <>
                                        <Check size={16} />
                                        Copiado
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        Copiar datos
                                    </>
                                )}
                            </button>

                        </div>


                        <div className="flex items-center gap-2">
                            <p className="text-slate-400">
                                Cédula:  {perfil.cliente?.cedula}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    copiarDato(
                                        perfil.cliente?.cedula,
                                        "cedula"
                                    )
                                }
                                className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                                title="Copiar cédula"
                            >
                                {campoCopiado === "cedula" ? (
                                    <Check size={15} className="text-emerald-400" />
                                ) : (
                                    <Copy size={15} />
                                )}
                            </button>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mt-4">

                            {/* CLIENTE ID */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-slate-400 text-sm">
                                        Cliente ID
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            copiarDato(
                                                perfil.cliente?.clienteId,
                                                "clienteId"
                                            )
                                        }
                                        className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                                        title="Copiar Cliente ID"
                                    >
                                        {campoCopiado === "clienteId" ? (
                                            <Check size={15} className="text-emerald-400" />
                                        ) : (
                                            <Copy size={15} />
                                        )}
                                    </button>
                                </div>

                                <p className="font-mono text-cyan-400">
                                    {perfil.cliente?.clienteId}
                                </p>


                            </div>

                            {/* SERVICIO ID */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-slate-400 text-sm">
                                        Servicio ID
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            copiarDato(
                                                perfil.servicio?.servicioId,
                                                "servicioId"
                                            )
                                        }
                                        className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                                        title="Copiar Servicio ID"
                                    >
                                        {campoCopiado === "servicioId" ? (
                                            <Check size={15} className="text-emerald-400" />
                                        ) : (
                                            <Copy size={15} />
                                        )}
                                    </button>
                                </div>


                                <p className="font-mono text-cyan-400">
                                    {perfil.servicio?.servicioId}
                                </p>


                            </div>

                            {/* ESTADO CLIENTE */}
                            <div>
                                <p className="text-slate-400 text-sm">
                                    Estado Cliente
                                </p>

                                <p>
                                    {perfil.cliente?.estadoCliente}
                                </p>
                            </div>

                            {/* ESTADO SERVICIO */}
                            <div>
                                <p className="text-slate-400 text-sm">
                                    Estado Servicio
                                </p>

                                <p>
                                    {perfil.servicio?.estadoServicio}
                                </p>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">

                <button
                    onClick={() => onVolver()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-medium transition"
                >
                    <ArrowLeft size={18} />
                    Listado de clientes
                </button>

                <button
                    onClick={() => onAbrirListadoMorosos()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition"
                >
                    <BadgeDollarSign size={18} />
                    Listado de morosos
                </button>

            </div>

            {/* RESUMEN */}

            <div className="grid md:grid-cols-4 gap-4">

                <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">
                        Plan
                    </p>

                    <p className="text-xl font-bold">
                        {perfil.plan?.nombrePlan}
                    </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">
                        Velocidad
                    </p>

                    <p className="text-xl font-bold">
                        {perfil.plan?.velocidadBajada} /
                        {perfil.plan?.velocidadSubida}
                    </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">
                        Pendientes
                    </p>

                    <p className="text-xl font-bold text-red-400">
                        {perfil.facturacion?.totalPendientes}
                    </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-4">
                    <p className="text-slate-400 text-sm">
                        Tickets Abiertos
                    </p>

                    <p className="text-xl font-bold text-yellow-400">
                        {perfil.tickets?.resumen?.abiertos}
                    </p>
                </div>

            </div>

            {/* DATOS SERVICIO */}


            <div className="bg-slate-900 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-4">
                    Estado de Conectividad
                </h2>

                {cargandoPing && !estadoConexion ? (
                    <div className="text-slate-400">
                        Consultando...
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 mb-4">

                            <div
                                className={`w-4 h-4 rounded-full ${estadoConexion?.online
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-red-500"
                                    }`}
                            />

                            <span
                                className={`font-bold text-lg ${estadoConexion?.online
                                    ? "text-green-400"
                                    : "text-red-400"
                                    }`}
                            >
                                {estadoConexion?.online
                                    ? "ONLINE"
                                    : "OFFLINE"}
                            </span>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">

                            <div>
                                <div className="text-slate-400 text-sm">
                                    IP Cliente
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="font-mono">
                                        {estadoConexion?.ipCliente || "Sin IP"}
                                    </div>

                                    {estadoConexion?.ipCliente && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                copiarDato(
                                                    estadoConexion.ipCliente,
                                                    "ipCliente"
                                                )
                                            }
                                            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                                            title="Copiar IP del cliente"
                                        >
                                            {campoCopiado === "ipCliente" ? (
                                                <Check
                                                    size={15}
                                                    className="text-emerald-400"
                                                />
                                            ) : (
                                                <Copy size={15} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="text-slate-400 text-sm">
                                    Ping Promedio
                                </div>

                                <div>
                                    {estadoConexion?.pingPromedioMs
                                        ? `${estadoConexion.pingPromedioMs.toFixed(1)} ms`
                                        : "Sin respuesta"}
                                </div>
                            </div>

                            <div>
                                <div className="text-slate-400 text-sm">
                                    Latencia
                                </div>

                                <div>
                                    {estadoConexion?.latencia || "-"}
                                </div>
                            </div>

                            <div>
                                <div className="text-slate-400 text-sm">
                                    Paquetes
                                </div>

                                <div>
                                    {estadoConexion?.recibidos || 0}/
                                    {estadoConexion?.enviados || 0}
                                </div>
                            </div>

                        </div>

                        <div className="mt-4 text-xs text-slate-500">
                            Actualización automática cada 45 segundos
                        </div>
                    </>
                )}
            </div>
            <div className="bg-slate-900 rounded-2xl p-6">

                <h2 className="text-xl font-bold mb-4">
                    Información del Servicio
                </h2>

                <div className="grid md:grid-cols-2 gap-4">

                    <div>
                        <strong>IP Cliente:</strong>{" "}
                        {perfil.servicio?.ipCliente}
                    </div>

                    <div>
                        <strong>MAC:</strong>{" "}
                        {perfil.servicio?.mac}
                    </div>

                    <div>
                        <strong>Día Pago:</strong>{" "}
                        {perfil.servicio?.diaPago}
                    </div>

                    <div>
                        <strong>Fecha Instalación:</strong>{" "}
                        {perfil.servicio?.fechaInstalacion
                            ? new Date(perfil.servicio.fechaInstalacion)
                                .toISOString()
                                .split("T")[0]
                            : "N/A"}
                    </div>

                </div>

            </div>

            {/* MENSUALIDADES */}

            <div className="bg-slate-900 rounded-2xl p-6">

                <h2 className="text-xl font-bold mb-4">
                    Historial Mensualidades
                </h2>

                <div className="max-h-[360px] overflow-y-auto overflow-x-auto pr-1">

                    <table className="w-full">

                        <thead className="sticky top-0 z-10 bg-slate-900">
                            <tr className="border-b border-slate-700">
                                <th className="text-left p-2">
                                    Periodo
                                </th>

                                <th className="text-left p-2">
                                    Vencimiento
                                </th>

                                <th className="text-left p-2">
                                    Valor
                                </th>

                                <th className="text-left p-2">
                                    Estado
                                </th>

                                <th className="p-2 text-left">
                                    Acción
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {perfil.facturacion?.historial?.map(
                                (item: any) => (
                                    <tr
                                        key={item.mensualidadId}
                                        className="border-b border-slate-800"
                                    >
                                        <td className="p-2">
                                            {item.periodo}
                                        </td>

                                        <td className="p-2">
                                            {item.fechaVencimiento}
                                        </td>

                                        <td className="p-2">
                                            ${item.valorMensual}
                                        </td>

                                        <td className="p-2">
                                            {item.estado}
                                        </td>

                                        <td className="p-2">
                                            {item.estado !== "PAGADA" &&
                                                item.estado !== "ANULADA" ? (
                                                <button
                                                    onClick={() => {
                                                        setPagoSeleccionado(item);
                                                        setValorPagado(
                                                            String(item.valorMensual || "")
                                                        );
                                                        setFormaPago("EFECTIVO");
                                                        setReferenciaPago(
                                                            "PAGO EN EFECTIVO"
                                                        );
                                                    }}
                                                    className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-sm font-semibold"
                                                >
                                                    Pagar
                                                </button>
                                            ) : (
                                                <span className="text-slate-500">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>

                    </table>

                </div>

            </div>

            {/* FACTURAS INTERNET */}

            <div className="bg-slate-900 rounded-2xl p-6">

                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                        Facturas de Internet
                    </h2>

                    <span className="text-sm text-slate-400">
                        Total: {perfil.facturasInternet?.total || 0}
                    </span>
                </div>

                <div className="max-h-[360px] overflow-y-auto overflow-x-auto pr-1">

                    <table className="w-full">

                        <thead className="sticky top-0 z-10 bg-slate-900">
                            <tr className="border-b border-slate-700">
                                <th className="p-2 text-left">Factura</th>
                                <th className="p-2 text-left">Fecha</th>
                                <th className="p-2 text-left">Subtotal</th>
                                <th className="p-2 text-left">Impuestos</th>
                                <th className="p-2 text-left">Total</th>
                                <th className="p-2 text-left">Estado</th>
                                <th className="p-2 text-left">PDF</th>
                            </tr>
                        </thead>

                        <tbody>
                            {perfil.facturasInternet?.historial?.length > 0 ? (
                                perfil.facturasInternet.historial.map((factura: any) => (
                                    <tr
                                        key={factura.facturaId}
                                        className="border-b border-slate-800"
                                    >
                                        <td className="p-2 font-mono text-cyan-400">
                                            {factura.numeroFactura}
                                        </td>

                                        <td className="p-2">
                                            {formatearFecha(factura.fechaFactura)}
                                        </td>

                                        <td className="p-2">
                                            ${Number(factura.subtotal || 0).toFixed(2)}
                                        </td>

                                        <td className="p-2">
                                            ${Number(factura.totalImpuestos || 0).toFixed(2)}
                                        </td>

                                        <td className="p-2 font-bold">
                                            ${Number(factura.totalFinal || 0).toFixed(2)}
                                        </td>

                                        <td className="p-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${factura.estado === "PAGADA"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : factura.estado === "ANULADA"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : "bg-yellow-500/20 text-yellow-400"
                                                    }`}
                                            >
                                                {factura.estado}
                                            </span>
                                        </td>

                                        <td className="p-2">
                                            {factura.pdfUrl ? (
                                                <a
                                                    href={factura.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:underline"
                                                >
                                                    Ver PDF
                                                </a>
                                            ) : (
                                                <span className="text-slate-500">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-4 text-center text-slate-400"
                                    >
                                        Este cliente no tiene facturas registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                </div>

            </div>

            {/* TICKETS */}

            <div className="bg-slate-900 rounded-2xl p-6">

                <div className="flex items-center justify-between mb-4">

                    <h2 className="text-xl font-bold">
                        Últimos Tickets
                    </h2>

                    <button
                        onClick={() => setModalTicket(true)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500"
                    >
                        + Crear Ticket
                    </button>

                </div>

                <div className="max-h-[360px] overflow-y-auto overflow-x-auto pr-1">

                    <table className="w-full">

                        <thead className="sticky top-0 z-10 bg-slate-900">
                            <tr className="border-b border-slate-700">
                                <th className="p-2 text-left">
                                    Código
                                </th>

                                <th className="p-2 text-left">
                                    Título
                                </th>

                                <th className="p-2 text-left">
                                    Estado
                                </th>

                                <th className="p-2 text-left">
                                    Prioridad
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {perfil.tickets?.historial?.map(
                                (ticket: any) => (
                                    <tr
                                        key={ticket.ticketId}
                                        className="border-b border-slate-800"
                                    >
                                        <td className="p-2">
                                            {ticket.codigoTicket}
                                        </td>

                                        <td className="p-2">
                                            {ticket.titulo}
                                        </td>

                                        <td className="p-2">
                                            {ticket.estado}
                                        </td>

                                        <td className="p-2">
                                            {ticket.prioridad}
                                        </td>
                                    </tr>
                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {modalTicket && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

                    <div className="bg-slate-900 w-full max-w-2xl rounded-2xl p-6">

                        <h2 className="text-2xl font-bold mb-4">
                            Crear Ticket
                        </h2>

                        <div className="space-y-4">

                            <input
                                className="w-full p-3 rounded bg-slate-800"
                                placeholder="Título"
                                value={nuevoTicket.titulo}
                                onChange={(e) =>
                                    setNuevoTicket({
                                        ...nuevoTicket,
                                        titulo: e.target.value,
                                    })
                                }
                            />

                            <select
                                className="w-full p-3 rounded bg-slate-800"
                                value={nuevoTicket.categoria}
                                onChange={(e) =>
                                    setNuevoTicket({
                                        ...nuevoTicket,
                                        categoria: e.target.value,
                                    })
                                }
                            >
                                <option value="SOPORTE">SOPORTE</option>
                                <option value="INSTALACION">INSTALACION</option>
                                <option value="FACTURACION">FACTURACION</option>
                                <option value="RED">RED</option>
                            </select>

                            <select
                                className="w-full p-3 rounded bg-slate-800"
                                value={nuevoTicket.prioridad}
                                onChange={(e) =>
                                    setNuevoTicket({
                                        ...nuevoTicket,
                                        prioridad: e.target.value,
                                    })
                                }
                            >
                                <option value="BAJA">BAJA</option>
                                <option value="MEDIA">MEDIA</option>
                                <option value="ALTA">ALTA</option>
                                <option value="CRITICA">CRITICA</option>
                            </select>

                            <textarea
                                rows={5}
                                className="w-full p-3 rounded bg-slate-800"
                                placeholder="Descripción del problema"
                                value={nuevoTicket.descripcion}
                                onChange={(e) =>
                                    setNuevoTicket({
                                        ...nuevoTicket,
                                        descripcion: e.target.value,
                                    })
                                }
                            />

                            <div className="bg-slate-800 rounded-xl p-3 text-sm">
                                <div>
                                    Cliente: {perfil.cliente.nombres} {perfil.cliente.apellidos}
                                </div>

                                <div>
                                    Cédula: {perfil.cliente.cedula}
                                </div>

                                <div>
                                    Servicio: {perfil.servicio.servicioId}
                                </div>

                                <div>
                                    IP: {perfil.servicio.ipCliente}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">

                                <button
                                    onClick={() => setModalTicket(false)}
                                    className="px-4 py-2 rounded bg-slate-700"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={crearTicket}
                                    className="px-4 py-2 rounded bg-cyan-600"
                                >
                                    Crear Ticket
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

            {pagoSeleccionado && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                    <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700">

                        <h2 className="text-xl font-bold mb-4">
                            Registrar pago
                        </h2>

                        <div className="space-y-4">

                            <div className="bg-slate-800 rounded-xl p-3 text-sm">
                                <div>Periodo: {pagoSeleccionado.periodo}</div>
                                <div>Valor: ${Number(pagoSeleccionado.valorMensual).toFixed(2)}</div>
                                <div>Estado: {pagoSeleccionado.estado}</div>
                            </div>

                            <input
                                type="number"
                                className="w-full p-3 rounded-xl bg-slate-800"
                                value={valorPagado}
                                onChange={(e) => setValorPagado(e.target.value)}
                                placeholder="Valor pagado"
                            />

                            <select
                                className="w-full p-3 rounded-xl bg-slate-800"
                                value={formaPago}
                                onChange={(e) => cambiarFormaPago(e.target.value)}
                            >
                                <option value="EFECTIVO">EFECTIVO</option>
                                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                <option value="DEPOSITO">DEPÓSITO</option>
                                <option value="TARJETA">TARJETA</option>
                            </select>

                            <input
                                className="w-full p-3 rounded-xl bg-slate-800"
                                value={referenciaPago}
                                onChange={(e) => setReferenciaPago(e.target.value)}
                                placeholder="Referencia del pago"
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setPagoSeleccionado(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-700"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={registrarPagoMensualidad}
                                    disabled={loadingPago}
                                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50"
                                >
                                    {loadingPago ? "Registrando..." : "Confirmar pago"}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}