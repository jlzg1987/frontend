// app/infraestructura/wireless/alertas-criticas/page.tsx
"use client";

import { API_BASE, getToken } from "@/src/lib/api";
import { useEffect, useState } from "react";


type AlertaWireless = {
    alertaId: string;
    equipoId?: string;
    tipo?: string;
    nivel?: string;
    mensaje?: string;
    estado?: string;
    creadoEn?: string;
    atendidoEn?: string;
    nombreEquipo?: string;
    ipGestion?: string;
    tipoEquipo?: string;

    ticketId?: string;
    codigoTicket?: string;
    ticketGenerado?: boolean;
};

export default function AlertasCriticasWirelessPage() {
    const [alertas, setAlertas] = useState<AlertaWireless[]>([]);
    const [loading, setLoading] = useState(true);

    async function cargarAlertasCriticas() {
        try {
            setLoading(true);

            const token = getToken();

            console.log("TOKEN:", token);
            console.log("URL:", `${API_BASE}/notificaciones-sistema/alertas/criticas`);

            const res = await fetch(`${API_BASE}/notificaciones-sistema/alertas/criticas`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("STATUS:", res.status);

            const texto = await res.text();
            console.log("RESPUESTA TEXTO:", texto);

            let data: any;

            try {
                data = JSON.parse(texto);
            } catch {
                console.error("La respuesta no es JSON:", texto);
                setAlertas([]);
                return;
            }

            console.log("DATA JSON:", data);

            const lista =
                Array.isArray(data.datos)
                    ? data.datos
                    : Array.isArray(data.alertas)
                        ? data.alertas
                        : Array.isArray(data)
                            ? data
                            : [];

            console.log("LISTA FINAL:", lista);

            setAlertas(lista);
        } catch (error) {
            console.error("Error cargando alertas críticas:", error);
            setAlertas([]);
        } finally {
            setLoading(false);
        }
    }
    async function crearTicketDesdeAlerta(alerta: AlertaWireless) {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    clienteTipo: "WIRELESS_ALERTA",
                    clienteId: alerta.alertaId,
                    titulo: `Alerta crítica Wireless: ${alerta.tipo || "SIN_TIPO"}`,
                    descripcion: `${alerta.mensaje || "Sin descripción"}

AlertaId: ${alerta.alertaId}
EquipoId: ${alerta.equipoId || ""}
Tipo: ${alerta.tipo || ""}
Nivel: ${alerta.nivel || ""}
Estado alerta: ${alerta.estado || ""}`,
                    categoria: "INTERNET",
                    prioridad: "ALTA",
                }),
            });

            const data = await res.json();

            if (!res.ok || data.ok === false) {
                throw new Error(data.mensaje || "No se pudo crear el ticket");
            }

            alert(`Ticket creado correctamente: ${data.codigoTicket || ""}`);
            cargarAlertasCriticas();
        } catch (error: any) {
            console.error("Error creando ticket:", error);
            alert(error.message || "Error creando ticket");
        }
    }

    useEffect(() => {
        cargarAlertasCriticas();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="flex items-center justify-between mb-6">


                <button
                    onClick={cargarAlertasCriticas}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold"
                >
                    Actualizar
                </button>
            </div>

            {loading ? (
                <div className="text-slate-400">Cargando alertas críticas...</div>
            ) : alertas.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-300">
                    No hay alertas críticas por el momento.
                </div>
            ) : (
                <div className="grid gap-4">
                    {alertas.map((alerta) => (
                        <div
                            key={alerta.alertaId}
                            className="rounded-2xl border border-red-500/40 bg-red-950/30 p-5 shadow-lg shadow-red-900/20"
                        >

                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-bold text-red-300">
                                    {alerta.tipo || "Alerta crítica"}
                                </h2>

                                <span className="text-xs bg-red-600 px-3 py-1 rounded-full font-bold">
                                    CRÍTICA
                                </span>
                                {alerta.ticketGenerado || alerta.ticketId ? (
                                    <div className="mt-4 px-4 py-2 rounded-xl bg-green-700/30 border border-green-500 text-green-300 font-semibold text-sm">
                                        Ticket ya generado
                                        {alerta.codigoTicket ? `: ${alerta.codigoTicket}` : ""}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => crearTicketDesdeAlerta(alerta)}
                                        className="mt-4 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl font-semibold text-white"
                                    >
                                        Crear ticket
                                    </button>
                                )}
                            </div>

                            <p className="text-sm text-slate-300 mb-3">
                                {alerta.mensaje || "Sin descripción"}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-500">Equipo</p>
                                    <p className="font-semibold">
                                        {alerta.nombreEquipo || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">IP</p>
                                    <p className="font-semibold text-cyan-300">
                                        {alerta.ipGestion || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Tipo</p>
                                    <p className="font-semibold">
                                        {alerta.tipoEquipo || "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Estado</p>
                                    <p className="font-semibold">
                                        {alerta.estado || "-"}
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 mt-3">
                                Fecha:{" "}
                                {alerta.creadoEn
                                    ? new Date(alerta.creadoEn).toLocaleString()
                                    : "-"}
                            </p>
                        </div>

                    ))}

                </div>
            )}
        </div>
    );
}