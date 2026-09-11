"use client";

import {
    createElement,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { API_BASE, getToken } from "@/src/lib/api";
import Image from "next/image";

import {
    BellRing,
    Bot,
    CheckCheck,
    CircleOff,
    CreditCard,
    Eye,
    FileText,
    Mail,
    Mic,
    MicOff,
    RadioTower,
    ReceiptText,
    Settings,
    TriangleAlert,
    Volume2,
    type LucideIcon,
} from "lucide-react";


// ============================================================
// TIPOS SPEECH RECOGNITION
// ============================================================

interface SpeechRecognitionEventLike extends Event {
    resultIndex: number;

    results: {
        [index: number]: {
            isFinal: boolean;

            [index: number]: {
                transcript: string;
                confidence: number;
            };
        };
        length: number;
    };
}

interface SpeechRecognitionErrorEventLike extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;

    start(): void;
    stop(): void;
    abort(): void;

    onstart: (() => void) | null;
    onend: (() => void) | null;

    onresult:
    | ((event: SpeechRecognitionEventLike) => void)
    | null;

    onerror:
    | ((event: SpeechRecognitionErrorEventLike) => void)
    | null;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognitionLike;
}


// ============================================================
// EXTENDER WINDOW
// ============================================================

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}


// ============================================================
// TIPOS NOTIFICACIONES
// ============================================================

type Notificacion = {

    notificacionId: string;

    modulo:
    | "WIRELESS"
    | "MENSUALIDADES"
    | "SRI_EMAIL"
    | "SRI_ANULACION"
    | "SRI_NOTA_CREDITO"
    | "SISTEMA";

    tipo: string;

    nivel:
    | "INFO"
    | "ADVERTENCIA"
    | "CRITICA";

    titulo: string;

    mensaje: string;

    total: number;

    estado:
    | "NUEVA"
    | "VISTA"
    | "RESUELTA";

    creadoEn: string;
};


type Resumen = {

    totalNuevas: number;

    criticas: number;

    advertencias: number;

    info: number;

    wireless: number;

    mensualidades: number;

    sriEmail: number;

    sriAnulacion: number;

    sriNotaCredito: number;
};


// ============================================================
// ESTADOS DANTE
// ============================================================

type EstadoDante =
    | "APAGADO"
    | "ESPERANDO_DANTE"
    | "ESCUCHANDO_COMANDO"
    | "PROCESANDO";


// ============================================================
// CORREGIR UTF8
// ============================================================

function corregirTextoUtf8(valor: unknown): string {

    const texto = String(valor ?? "");

    if (!/[ÃÂ]/.test(texto)) {
        return texto;
    }

    try {

        const bytes = Uint8Array.from(
            texto,
            (caracter) =>
                caracter.charCodeAt(0)
        );

        return new TextDecoder(
            "utf-8",
            {
                fatal: true,
            }
        ).decode(bytes);

    } catch {

        return texto;
    }
}


// ============================================================
// NORMALIZAR NOTIFICACION
// ============================================================

function normalizarNotificacion(
    item: Notificacion
): Notificacion {

    return {

        ...item,

        titulo:
            corregirTextoUtf8(
                item.titulo
            ),

        mensaje:
            corregirTextoUtf8(
                item.mensaje
            ),

        tipo:
            corregirTextoUtf8(
                item.tipo
            ),
    };
}


// ============================================================
// NORMALIZAR TEXTO PARA DANTE
// ============================================================

function normalizarTextoDante(
    texto: string
) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[¿?¡!.,;:]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

// ============================================================
// CLIENTE / SERVICIO SELECCIONADO POR DANTE
// ============================================================

type ServicioClienteDante = {
    servicioId: string;
    clienteId: string;
    nombres: string;
    apellidos: string;
    cedula: string;
    telefono?: string;
    email?: string;
    ipCliente?: string;
    pppSecret?: string;
    estadoServicio?: string;
    nombrePlan?: string;
};


type ContextoConversacionDante = {

    tema:
    | "CLIENTE"
    | "WIRELESS"
    | "MIKROTIK"
    | "AGENDA"
    | "PAGOS"
    | "GENERAL";

    entidadId?: string | null;

    entidadNombre?: string | null;

    ultimaIntencion?: string | null;

    esperandoRespuesta?: boolean;

    datoPendiente?: string | null;

    actualizadoEn: number;
};

type ResultadoFechaAgendaDante = {

    fecha: Date | null;

    encontroFecha: boolean;

    encontroHora: boolean;
};


type AgendaPendienteDante = {

    textoOriginal: string;

    fecha: Date | null;

    esperando:
    | "FECHA"
    | "HORA"
    | null;
};

// ============================================================
// COMPONENTE
// ============================================================

export default function BotNotificaciones({
    onAbrirFacturaManual,
    onAbrirAlertas,
    onAbrirPagos,
    onAbrirFacturasInternas,
    onAbrirContratosServicios,
    onAbrirClientes,
    onAbrirProformas,
    onAbrirMikrotik,
    onAbrirConfiguracionMikrotik,
    onAbrirCortesMikrotik,
    onAbrirMonitoreoNodos,
    onAbrirRoutersMikrotik,
    onAbrirInfraestructura,
    onAbrirWirelessMonitoreo,
    onAbrirAlertasWireless,
    onAbrirEquiposOffline,
    onAbrirEquiposWireless,
    onAbrirTickets,
    onAbrirAdministracionISP,
    onAbrirPlanesInternet,
    onAbrirPublicidad,
    onAbrirImportarClientes,
    onAbrirSpeedTestAnalytics,
    onAbrirConfiguracionSedes,
    onAbrirCategoriasGastos,
    onAbrirGastosMensuales,
    onAbrirUsuarios,
    onAbrirMenuLateral,
    onAbrirListaUsuarios,
    onAbrirAdministrarRoles,
    onAbrirInventario,
    onAbrirProductosServicios,
    onAbrirTiendaOnline,
    onAbrirDesarrolloSistema,
    onAbrirConfiguracionFacturacion,
}: {
    onAbrirConfiguracionFacturacion: () => void;
    onAbrirFacturaManual: () => void;
    onAbrirAlertas: () => void;
    onAbrirPagos: () => void;
    onAbrirFacturasInternas: () => void;
    onAbrirContratosServicios: () => void;
    onAbrirClientes: () => void;
    onAbrirProformas: () => void;
    onAbrirMikrotik: () => void;
    onAbrirConfiguracionMikrotik: () => void;
    onAbrirCortesMikrotik: () => void;
    onAbrirMonitoreoNodos: () => void;
    onAbrirRoutersMikrotik: () => void;
    onAbrirInfraestructura: () => void;
    onAbrirWirelessMonitoreo: () => void;
    onAbrirAlertasWireless: () => void;
    onAbrirEquiposOffline: () => void;
    onAbrirEquiposWireless: () => void;
    onAbrirTickets: () => void;
    onAbrirAdministracionISP: () => void;
    onAbrirPlanesInternet: () => void;
    onAbrirPublicidad: () => void;
    onAbrirImportarClientes: () => void;
    onAbrirSpeedTestAnalytics: () => void;
    onAbrirConfiguracionSedes: () => void;
    onAbrirCategoriasGastos: () => void;
    onAbrirGastosMensuales: () => void;
    onAbrirUsuarios: () => void;
    onAbrirMenuLateral: () => void;
    onAbrirListaUsuarios: () => void;
    onAbrirAdministrarRoles: () => void;
    onAbrirInventario: () => void;
    onAbrirProductosServicios: () => void;
    onAbrirTiendaOnline: () => void;
    onAbrirDesarrolloSistema: () => void;
}) {


    // ========================================================
    // NOTIFICACIONES
    // ========================================================

    const [
        notificaciones,
        setNotificaciones,
    ] = useState<Notificacion[]>([]);


    const [
        resumen,
        setResumen,
    ] = useState<Resumen>({

        totalNuevas: 0,

        criticas: 0,

        advertencias: 0,

        info: 0,

        wireless: 0,

        mensualidades: 0,

        sriEmail: 0,

        sriAnulacion: 0,

        sriNotaCredito: 0,
    });


    // ========================================================
    // INTERFAZ
    // ========================================================

    const [
        abierto,
        setAbierto,
    ] = useState(false);


    const [
        pos,
        setPos,
    ] = useState({

        x: 24,
        y: 120,
    });


    const [
        drag,
        setDrag,
    ] = useState(false);


    const [
        moviendo,
        setMoviendo,
    ] = useState(false);


    const [
        offset,
        setOffset,
    ] = useState({

        x: 0,
        y: 0,
    });



    // ========================================================
    // DANTE
    // ========================================================

    const [
        microfonoActivo,
        setMicrofonoActivo,
    ] = useState(false);


    const [
        escuchando,
        setEscuchando,
    ] = useState(false);


    const [
        estadoDante,
        setEstadoDante,
    ] = useState<EstadoDante>(
        "APAGADO"
    );


    const [
        textoEscuchado,
        setTextoEscuchado,
    ] = useState("");


    const [
        textoIntermedio,
        setTextoIntermedio,
    ] = useState("");


    const [
        ultimoComando,
        setUltimoComando,
    ] = useState("");


    const [
        respuestaDante,
        setRespuestaDante,
    ] = useState(
        "Micrófono apagado."
    );


    const [
        errorMicrofono,
        setErrorMicrofono,
    ] = useState("");


    const reconocimientoRef =
        useRef<SpeechRecognitionLike | null>(
            null
        );


    const microfonoActivoRef =
        useRef(false);


    const estadoDanteRef =
        useRef<EstadoDante>(
            "APAGADO"
        );

    const monitoreoRedDanteRef =
        useRef(false);

    const [nivelMicrofono, setNivelMicrofono] = useState(0);

    const audioContextRef =
        useRef<AudioContext | null>(null);

    const analyserRef =
        useRef<AnalyserNode | null>(null);

    const animationFrameRef =
        useRef<number | null>(null);

    const streamAudioRef =
        useRef<MediaStream | null>(null);

    const agendaPendienteDanteRef =
        useRef<AgendaPendienteDante | null>(
            null
        );
    const pausaReconocimientoPorVozDanteRef =
        useRef(false);

    // Dante no debe interpretar su propia voz
    const danteHablandoRef =
        useRef(false);


    const [
        mostrarDetallesDante,
        setMostrarDetallesDante,
    ] = useState(false);


    // ========================================================
    // CLIENTE ACTUAL EN CONTEXTO DE DANTE
    // ========================================================

    const servicioClienteDanteRef =
        useRef<ServicioClienteDante | null>(null);

    // ========================================================
    // CONTEXTO CONVERSACIONAL ACTUAL DE DANTE
    // ========================================================

    const contextoDanteRef =
        useRef<ContextoConversacionDante>({
            tema: "GENERAL",
            actualizadoEn: Date.now(),
        });

    // ========================================================
    // DANTE - MONITOREO AUTOMÁTICO DE ALERTAS CRÍTICAS
    // ========================================================

    const alertasCriticasConocidasRef =
        useRef<Set<string>>(new Set());

    const primeraRevisionAlertasRef =
        useRef(true);

    const DANTE_ALERTAS_STORAGE_KEY =
        "dante_alertas_criticas_conocidas";

    // ========================================================
    // DANTE - ACTUALIZAR CONTEXTO CONVERSACIONAL
    // ========================================================

    function actualizarContextoDante(
        datos: Partial<ContextoConversacionDante>
    ) {

        contextoDanteRef.current = {

            ...contextoDanteRef.current,

            ...datos,

            actualizadoEn:
                Date.now(),

        };


        console.log(
            "DANTE CONTEXTO ACTUAL:",
            contextoDanteRef.current
        );
    }

    // ========================================================
    // DANTE - CAMBIAR TEMA DE CONVERSACIÓN
    // ========================================================

    function cambiarTemaDante(
        tema: ContextoConversacionDante["tema"],
        opciones?: {
            conservarCliente?: boolean;
            ultimaIntencion?: string | null;
        }
    ) {

        const cliente =
            servicioClienteDanteRef.current;


        const conservarCliente =
            opciones?.conservarCliente === true &&
            !!cliente;


        actualizarContextoDante({

            tema,

            entidadId:
                conservarCliente
                    ? cliente?.clienteId || null
                    : null,

            entidadNombre:
                conservarCliente
                    ? `${cliente?.nombres || ""} ${cliente?.apellidos || ""}`
                        .trim()
                    : null,

            ultimaIntencion:
                opciones?.ultimaIntencion ||
                null,

            esperandoRespuesta:
                false,

            datoPendiente:
                null,

        });
    }

    // ========================================================
    // DANTE - LIMPIAR CONTEXTO CONVERSACIONAL
    // ========================================================

    function limpiarContextoDante() {

        contextoDanteRef.current = {

            tema:
                "GENERAL",

            entidadId:
                null,

            entidadNombre:
                null,

            ultimaIntencion:
                null,

            esperandoRespuesta:
                false,

            datoPendiente:
                null,

            actualizadoEn:
                Date.now(),

        };


        servicioClienteDanteRef.current =
            null;


        perfilClienteDanteRef.current =
            null;


        console.log(
            "DANTE: contexto conversacional limpiado."
        );
    }

    // ========================================================
    // DANTE - CARGAR ALERTAS CONOCIDAS DEL NAVEGADOR
    // ========================================================

    function cargarAlertasConocidasDante() {

        if (typeof window === "undefined") {
            return;
        }

        try {

            const guardadas =
                localStorage.getItem(
                    DANTE_ALERTAS_STORAGE_KEY
                );

            if (!guardadas) {
                return;
            }

            const ids =
                JSON.parse(guardadas);

            if (!Array.isArray(ids)) {
                return;
            }

            alertasCriticasConocidasRef.current =
                new Set(
                    ids.filter(
                        (id) =>
                            typeof id === "string" &&
                            id.trim() !== ""
                    )
                );

            console.log(
                "DANTE: Alertas conocidas recuperadas:",
                alertasCriticasConocidasRef.current.size
            );

        } catch (error) {

            console.error(
                "DANTE: Error recuperando alertas conocidas:",
                error
            );
        }
    }
    // ========================================================
    // DANTE - REVISSA RECORDATORIOS
    // ========================================================
    async function revisarRecordatoriosDante() {

        try {

            const token =
                getToken();

            const res =
                await fetch(
                    `${API_BASE}/dante/recordatorios/pendientes`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },

                        cache:
                            "no-store",
                    }
                );

            const data =
                await res.json();

            if (
                !res.ok ||
                data.ok === false
            ) {
                return;
            }

            const recordatorios =
                Array.isArray(data.recordatorios)
                    ? data.recordatorios
                    : [];

            if (
                recordatorios.length === 0
            ) {
                return;
            }


            // ================================================
            // HABLAMOS EL PRIMER RECORDATORIO
            // ================================================

            const recordatorio =
                recordatorios[0];


            responderDante(
                `Tengo un recordatorio. ${recordatorio.contenido}`
            );


            // ================================================
            // MARCAR COMO NOTIFICADO
            // ================================================

            await fetch(
                `${API_BASE}/dante/recordatorios/${recordatorio.memoria_id}/notificado`,
                {
                    method:
                        "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


        } catch (error) {

            console.error(
                "DANTE: Error revisando recordatorios:",
                error
            );
        }
    }
    // ========================================================
    // DANTE - GUARDAR ALERTAS CONOCIDAS
    // ========================================================

    function guardarAlertasConocidasDante() {

        if (typeof window === "undefined") {
            return;
        }

        try {

            const ids =
                Array.from(
                    alertasCriticasConocidasRef.current
                );

            localStorage.setItem(
                DANTE_ALERTAS_STORAGE_KEY,
                JSON.stringify(ids)
            );

        } catch (error) {

            console.error(
                "DANTE: Error guardando alertas conocidas:",
                error
            );
        }
    }


    // ========================================================
    // DANTE - REVISAR ALERTAS CRÍTICAS NUEVAS
    // ========================================================

    async function revisarAlertasCriticasDante() {

        try {

            const token =
                getToken();


            const res =
                await fetch(
                    `${API_BASE}/notificaciones-sistema/alertas/criticas`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            if (!res.ok) {

                console.error(
                    "DANTE: Error consultando alertas críticas:",
                    res.status
                );

                return;
            }


            const data =
                await res.json();


            const lista =
                Array.isArray(data.datos)
                    ? data.datos
                    : Array.isArray(data.alertas)
                        ? data.alertas
                        : Array.isArray(data)
                            ? data
                            : [];


            // ====================================================
            // PRIMERA REVISIÓN
            // SOLO GUARDAMOS LAS ALERTAS EXISTENTES
            // NO LAS ANUNCIAMOS
            // ====================================================

            if (
                primeraRevisionAlertasRef.current
            ) {

                // ====================================================
                // SI NO EXISTE HISTORIAL EN LOCALSTORAGE
                // ESTA ES LA PRIMERA VEZ REAL QUE DANTE LAS VE
                // ====================================================

                if (
                    alertasCriticasConocidasRef.current.size === 0
                ) {

                    lista.forEach(
                        (alerta: any) => {

                            if (alerta.alertaId) {

                                alertasCriticasConocidasRef.current.add(
                                    alerta.alertaId
                                );
                            }
                        }
                    );


                    guardarAlertasConocidasDante();


                    console.log(
                        "DANTE: Primera carga. Alertas existentes registradas:",
                        lista.length
                    );


                    primeraRevisionAlertasRef.current =
                        false;

                    return;
                }


                // ====================================================
                // YA EXISTÍA HISTORIAL
                // ENTONCES SÍ DEBEMOS COMPARAR
                // ====================================================

                primeraRevisionAlertasRef.current =
                    false;
            }


            // ====================================================
            // DETECTAR ÚNICAMENTE ALERTAS NUEVAS
            // ====================================================

            const alertasNuevas =
                lista.filter(
                    (alerta: any) => {

                        if (
                            !alerta.alertaId
                        ) {

                            return false;
                        }


                        return (
                            !alertasCriticasConocidasRef.current.has(
                                alerta.alertaId
                            )
                        );
                    }
                );


            // ====================================================
            // NO HAY NADA NUEVO
            // DANTE NO HABLA
            // ====================================================

            if (
                alertasNuevas.length === 0
            ) {

                console.log(
                    "DANTE: No hay alertas críticas nuevas."
                );

                return;
            }


            // ====================================================
            // GUARDAR NUEVAS ALERTAS COMO CONOCIDAS
            // ====================================================

            alertasNuevas.forEach(
                (alerta: any) => {

                    alertasCriticasConocidasRef.current.add(
                        alerta.alertaId
                    );
                }
            );
            // GUARDAMOS TAMBIÉN EN EL NAVEGADOR
            guardarAlertasConocidasDante();

            console.log(
                "DANTE: NUEVAS ALERTAS CRÍTICAS:",
                alertasNuevas
            );


            // ====================================================
            // UNA ALERTA NUEVA
            // ====================================================

            if (
                alertasNuevas.length === 1
            ) {

                const alerta =
                    alertasNuevas[0];


                const equipo =
                    alerta.nombreEquipo ||
                    "un equipo Wireless";


                const mensaje =
                    alerta.mensaje ||
                    "se generó una alerta crítica";


                const ip =
                    alerta.ipGestion
                        ? ` IP ${alerta.ipGestion}.`
                        : "";


                responderDante(
                    `Atención. Tengo una nueva alerta crítica. ` +
                    `${equipo}. ${mensaje}.${ip}`
                );


                return;
            }


            // ====================================================
            // VARIAS ALERTAS NUEVAS
            // ====================================================

            responderDante(
                `Atención. Se han generado ${alertasNuevas.length} nuevas alertas críticas Wireless.`
            );

        } catch (error) {

            console.error(
                "DANTE: Error revisando alertas críticas:",
                error
            );
        }
    }
    // ========================================================
    // DANTE - GUARDA COMPROMISO DE PAGOS
    // ========================================================

    async function guardarCompromisoPagoDante(
        cliente: {
            clienteId?: string;
            nombres?: string;
            apellidos?: string;
            cedula?: string;
            servicioId?: string;
        },
        dias: number
    ) {

        try {

            const token =
                getToken();


            if (
                !cliente ||
                !dias ||
                dias <= 0
            ) {

                responderDante(
                    "No tengo suficiente información para guardar el compromiso de pago."
                );

                return;
            }


            const fechaCompromiso =
                new Date();


            fechaCompromiso.setDate(
                fechaCompromiso.getDate() +
                dias
            );


            const nombreCliente =
                `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                    .trim();


            const fechaTexto =
                fechaCompromiso.toLocaleDateString(
                    "es-EC"
                );


            const contenido =
                `${nombreCliente} indicó que realizará el pago en ${dias} días, con fecha prevista ${fechaTexto}.`;


            // =================================================
            // GUARDAR EN MEMORIA
            // =================================================

            const resMemoria =
                await fetch(
                    `${API_BASE}/dante/memorias`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body: JSON.stringify({

                            tipoMemoria:
                                "PAGOS",

                            categoria:
                                "COMPROMISO_PAGO",

                            contenido,

                            entidadTipo:
                                "CLIENTE",

                            entidadId:
                                cliente.clienteId || null,

                            importancia:
                                7,

                            recordarEn:
                                fechaCompromiso.toISOString(),

                            datosJson: {

                                estado:
                                    "PENDIENTE",

                                diasCompromiso:
                                    dias,

                                fechaCompromiso:
                                    fechaCompromiso.toISOString(),

                                clienteId:
                                    cliente.clienteId || null,

                                servicioId:
                                    cliente.servicioId || null,

                            },

                        }),
                    }
                );


            const dataMemoria =
                await resMemoria.json();


            if (
                !resMemoria.ok ||
                dataMemoria.ok === false
            ) {

                throw new Error(
                    dataMemoria.mensaje ||
                    dataMemoria.message ||
                    "No se pudo guardar el compromiso."
                );
            }


            // =================================================
            // GUARDAR TAMBIÉN EN HISTORIAL
            // =================================================

            await fetch(
                `${API_BASE}/dante/historial`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify({

                            tipo:
                                "MEMORIA",

                            textoUsuario:
                                `Cliente informa que pagará en ${dias} días.`,

                            respuestaDante:
                                `Compromiso de pago registrado para ${fechaTexto}.`,

                            accion:
                                "GUARDAR_COMPROMISO_PAGO",

                            resultado:
                                "OK",

                            datosJson: {

                                clienteId:
                                    cliente.clienteId ||
                                    null,

                                servicioId:
                                    cliente.servicioId ||
                                    null,

                                nombreCliente,

                                dias,

                                fechaCompromiso:
                                    fechaCompromiso.toISOString(),

                            },

                        }),
                }
            );


            responderDante(
                `De acuerdo. He registrado que ${nombreCliente} se comprometió a pagar en ${dias} días, aproximadamente el ${fechaTexto}.`
            );


        } catch (error) {

            console.error(
                "DANTE: Error guardando compromiso de pago:",
                error
            );


            responderDante(
                "No pude guardar el compromiso de pago."
            );
        }
    }
    // ========================================================
    // DANTE - Descripcion ANTECEDENTES HISTÓRICOS
    // ========================================================
    function descripcionHistoricaFechaDante(
        fechaValor: string | null
    ) {

        if (!fechaValor) {
            return "anteriormente";
        }


        const fecha =
            new Date(
                fechaValor
            );


        const ahora =
            new Date();


        const diferenciaMs =
            ahora.getTime() -
            fecha.getTime();


        const dias =
            Math.floor(
                diferenciaMs /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        if (
            dias <= 0
        ) {
            return "hoy";
        }


        if (
            dias === 1
        ) {
            return "ayer";
        }


        if (
            dias <= 7
        ) {
            return `hace ${dias} días`;
        }


        return `el ${fecha.toLocaleDateString(
            "es-EC"
        )}`;
    }

    // ========================================================
    // DANTE - OBTENER CLIENTE ACTUAL DEL CONTEXTO
    // ========================================================

    function obtenerClienteActualDante() {

        const cliente =
            servicioClienteDanteRef.current;


        if (!cliente) {
            return null;
        }


        return cliente;
    }
    // ============================================================
    // DISTANCIA LEVENSHTEIN
    // ============================================================

    function distanciaLevenshtein(
        a: string,
        b: string
    ) {

        const matriz: number[][] =
            Array.from(
                {
                    length: b.length + 1,
                },
                () =>
                    Array(
                        a.length + 1
                    ).fill(0)
            );


        for (
            let i = 0;
            i <= b.length;
            i++
        ) {

            matriz[i][0] = i;
        }


        for (
            let j = 0;
            j <= a.length;
            j++
        ) {

            matriz[0][j] = j;
        }


        for (
            let i = 1;
            i <= b.length;
            i++
        ) {

            for (
                let j = 1;
                j <= a.length;
                j++
            ) {

                const costo =
                    b[i - 1] === a[j - 1]
                        ? 0
                        : 1;


                matriz[i][j] =
                    Math.min(

                        matriz[i - 1][j] + 1,

                        matriz[i][j - 1] + 1,

                        matriz[i - 1][j - 1] +
                        costo
                    );
            }
        }


        return matriz[b.length][a.length];
    }


    // ============================================================
    // COMPARAR PALABRAS DE FORMA FLEXIBLE
    // ============================================================

    function palabrasSimilares(
        buscada: string,
        real: string
    ) {

        if (
            buscada === real
        ) {
            return true;
        }


        if (
            real.includes(buscada) ||
            buscada.includes(real)
        ) {
            return true;
        }


        const distancia =
            distanciaLevenshtein(
                buscada,
                real
            );


        // palabras cortas:
        // máximo 1 letra diferente

        if (
            buscada.length <= 5
        ) {

            return distancia <= 1;
        }


        // palabras medianas:
        // máximo 2 letras diferentes

        if (
            buscada.length <= 10
        ) {

            return distancia <= 2;
        }


        // palabras largas:
        // máximo 3 letras diferentes

        return distancia <= 3;
    }


    // ============================================================
    // COMPARAR NOMBRES COMPLETOS
    // ============================================================

    function nombreCoincideDante(
        busqueda: string,
        nombreSistema: string
    ) {

        const buscadas =
            normalizarTextoDante(
                busqueda
            )
                .split(" ")
                .filter(Boolean);


        const reales =
            normalizarTextoDante(
                nombreSistema
            )
                .split(" ")
                .filter(Boolean);


        if (
            buscadas.length === 0 ||
            reales.length === 0
        ) {

            return false;
        }


        return buscadas.every(
            palabraBuscada =>

                reales.some(
                    palabraReal =>
                        palabrasSimilares(
                            palabraBuscada,
                            palabraReal
                        )
                )
        );
    }

    // ========================================================
    // PERFIL ADMINISTRATIVO ACTUAL EN CONTEXTO DE DANTE
    // ========================================================

    const perfilClienteDanteRef =
        useRef<any | null>(null);

    // ========================================================
    // BUSCAR CLIENTE / SERVICIO
    // ========================================================

    async function buscarClienteDante(
        terminoBusqueda: string
    ) {

        const termino =
            normalizarTextoDante(
                terminoBusqueda
            );

        if (!termino) {

            responderDante(
                "Indícame el nombre, cédula, teléfono o IP del cliente."
            );

            return;
        }

        try {

            responderDante(
                `Buscando al cliente ${terminoBusqueda}.`
            );


            const res =
                await fetch(
                    `${API_BASE}/cliente-servicio`
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false
            ) {

                responderDante(
                    "No pude consultar los servicios de clientes."
                );

                return;
            }


            const servicios:
                ServicioClienteDante[] =
                Array.isArray(data.servicios)
                    ? data.servicios
                    : [];


            // ====================================================
            // BUSCAR COINCIDENCIAS
            // ====================================================
            const coincidencias =
                servicios.filter(
                    (servicio) => {

                        const nombreCompleto =
                            `${servicio.nombres || ""} ${servicio.apellidos || ""}`;


                        const cedula =
                            normalizarTextoDante(
                                servicio.cedula || ""
                            );


                        const telefono =
                            normalizarTextoDante(
                                servicio.telefono || ""
                            );


                        const email =
                            normalizarTextoDante(
                                servicio.email || ""
                            );


                        const ip =
                            normalizarTextoDante(
                                servicio.ipCliente || ""
                            );


                        const pppoe =
                            normalizarTextoDante(
                                servicio.pppSecret || ""
                            );


                        const coincideNombre =
                            nombreCoincideDante(
                                termino,
                                nombreCompleto
                            );


                        return (
                            coincideNombre ||
                            cedula.includes(termino) ||
                            telefono.includes(termino) ||
                            email.includes(termino) ||
                            ip.includes(termino) ||
                            pppoe.includes(termino)
                        );
                    }
                );

            // ====================================================
            // NO ENCONTRADO
            // ====================================================

            if (
                coincidencias.length === 0
            ) {

                servicioClienteDanteRef.current =
                    null;


                responderDante(
                    `No encontré ningún cliente que coincida con ${terminoBusqueda}.`
                );

                return;
            }


            // ====================================================
            // VARIAS COINCIDENCIAS
            // ====================================================

            if (
                coincidencias.length > 1
            ) {

                const nombres =
                    coincidencias
                        .slice(0, 4)
                        .map(
                            (servicio) =>
                                `${servicio.nombres} ${servicio.apellidos}`
                        )
                        .join(", ");


                responderDante(
                    `Encontré ${coincidencias.length} coincidencias. ` +
                    `Entre ellas: ${nombres}. ` +
                    `Indícame la cédula o la IP para identificar al cliente correctamente.`
                );

                return;
            }


            // ====================================================
            // CLIENTE ENCONTRADO
            // ====================================================

            const servicio =
                coincidencias[0];


            servicioClienteDanteRef.current =
                servicio;

            // ====================================================
            // DANTE - ACTUALIZAR CONTEXTO CONVERSACIONAL
            // ====================================================
            actualizarContextoDante({

                tema:
                    "CLIENTE",

                entidadId:
                    servicio.clienteId,

                entidadNombre:
                    `${servicio.nombres || ""} ${servicio.apellidos || ""}`
                        .trim(),

                ultimaIntencion:
                    "BUSCAR_CLIENTE",

                esperandoRespuesta:
                    false,

                datoPendiente:
                    null,

            });

            console.log(
                "DANTE CONTEXTO ACTUAL:",
                contextoDanteRef.current
            );

            console.log(
                "DANTE CLIENTE ENCONTRADO:",
                servicio
            );


            console.log(
                "DANTE SERVICIO ID:",
                servicio.servicioId
            );


            responderDante(
                `Encontré a ${servicio.nombres} ${servicio.apellidos}. ` +
                `Su servicio está ${servicio.estadoServicio || "registrado"}.`
            );


        } catch (error) {

            console.error(
                "Error buscando cliente con Dante:",
                error
            );


            responderDante(
                "Ocurrió un error al buscar al cliente."
            );
        }
    }

    // ========================================================
    // CONSULTAR PERFIL ADMINISTRATIVO DEL CLIENTE
    // ========================================================

    async function consultarPerfilClienteDante() {

        const servicio =
            servicioClienteDanteRef.current;


        if (
            !servicio?.servicioId
        ) {

            responderDante(
                "Primero debes indicarme qué cliente deseas consultar."
            );

            return;
        }


        try {

            const token =
                getToken();


            responderDante(
                `Consultando la información de ${servicio.nombres} ${servicio.apellidos}.`
            );


            const res =
                await fetch(
                    `${API_BASE}/clientes/perfiles/administrativo/${servicio.servicioId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false
            ) {

                responderDante(
                    "No pude consultar el perfil administrativo de este cliente."
                );

                return;
            }


            const perfil =
                data.datos;


            if (
                !perfil
            ) {

                responderDante(
                    "El cliente fue encontrado, pero no tiene información administrativa disponible."
                );

                return;
            }


            // GUARDAMOS EL PERFIL EN CONTEXTO
            perfilClienteDanteRef.current =
                perfil;
            actualizarContextoDante({

                tema:
                    "CLIENTE",

                entidadId:
                    perfil.cliente?.clienteId ||
                    servicio.clienteId ||
                    null,

                entidadNombre:
                    `${perfil.cliente?.nombres || servicio.nombres || ""} ${perfil.cliente?.apellidos || servicio.apellidos || ""}`
                        .trim(),

                ultimaIntencion:
                    "CONSULTAR_PERFIL_CLIENTE",

            });
            console.log(
                "DANTE PERFIL CLIENTE:",
                perfil
            );


            const nombre =
                `${perfil.cliente?.nombres || ""} ${perfil.cliente?.apellidos || ""}`
                    .trim();

            const memoriasHistoricas =
                await obtenerContextoHistoricoDante(
                    nombre
                );

            const cedula =
                perfil.cliente?.cedula ||
                "no registrada";


            const estadoCliente =
                perfil.cliente?.estadoCliente ||
                "sin estado";


            const estadoServicio =
                perfil.servicio?.estadoServicio ||
                "sin estado";


            const ip =
                perfil.servicio?.ipCliente ||
                "sin IP asignada";


            const plan =
                perfil.plan?.nombrePlan ||
                "sin plan asignado";


            const velocidadBajada =
                perfil.plan?.velocidadBajada;


            const velocidadSubida =
                perfil.plan?.velocidadSubida;


            const pendientes =
                Number(
                    perfil.facturacion?.totalPendientes ||
                    0
                );


            const ticketsAbiertos =
                Number(
                    perfil.tickets?.resumen?.abiertos ||
                    0
                );


            let respuesta =
                `Información de ${nombre}. ` +
                `Cédula ${cedula}. ` +
                `Cliente ${estadoCliente}. ` +
                `Servicio ${estadoServicio}. ` +
                `Plan ${plan}. `;


            if (
                velocidadBajada ||
                velocidadSubida
            ) {

                respuesta +=
                    `Velocidad ${velocidadBajada || "-"} de bajada y ${velocidadSubida || "-"} de subida. `;
            }


            respuesta +=
                `IP ${ip}. `;


            if (
                pendientes === 0
            ) {

                respuesta +=
                    "No tiene mensualidades pendientes. ";

            } else if (
                pendientes === 1
            ) {

                respuesta +=
                    "Tiene 1 mensualidad pendiente. ";

            } else {

                respuesta +=
                    `Tiene ${pendientes} mensualidades pendientes. `;
            }


            if (
                ticketsAbiertos === 0
            ) {

                respuesta +=
                    "No tiene tickets abiertos.";

            } else if (
                ticketsAbiertos === 1
            ) {

                respuesta +=
                    "Tiene 1 ticket abierto.";

            } else {

                respuesta +=
                    `Tiene ${ticketsAbiertos} tickets abiertos.`;
            }

            const contextoHistorico =
                construirAntecedentesHistoricosDante(
                    memoriasHistoricas
                );


            respuesta +=
                contextoHistorico;

            responderDante(
                respuesta
            );


        } catch (error) {

            console.error(
                "Error consultando perfil con Dante:",
                error
            );


            responderDante(
                "Ocurrió un error al consultar la información del cliente."
            );
        }
    }

    // ========================================================
    // DANTE - OBTENER PERFIL ACTUAL O CARGARLO
    // ========================================================

    async function obtenerPerfilActualDante() {

        // Si ya está cargado, lo reutilizamos
        if (perfilClienteDanteRef.current) {

            return perfilClienteDanteRef.current;
        }


        const servicio =
            servicioClienteDanteRef.current;


        if (!servicio?.servicioId) {

            return null;
        }


        try {

            const token =
                getToken();


            const res =
                await fetch(
                    `${API_BASE}/clientes/perfiles/administrativo/${servicio.servicioId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false ||
                !data.datos
            ) {

                return null;
            }


            perfilClienteDanteRef.current =
                data.datos;


            return data.datos;


        } catch (error) {

            console.error(
                "DANTE: Error obteniendo perfil actual:",
                error
            );


            return null;
        }
    }

    // ========================================================
    // DANTE - HACER PING AL CLIENTE ACTUAL
    // ========================================================

    async function hacerPingClienteDante() {

        const servicio =
            servicioClienteDanteRef.current;


        if (
            !servicio?.servicioId
        ) {

            responderDante(
                "Primero debes indicarme qué cliente deseas consultar."
            );

            return;
        }


        try {

            const token =
                getToken();


            responderDante(
                `Consultando la conexión de ${servicio.nombres} ${servicio.apellidos}.`
            );


            const res =
                await fetch(
                    `${API_BASE}/clientes/perfiles/administrativo/${servicio.servicioId}/ping`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false
            ) {

                responderDante(
                    data.mensaje ||
                    "No pude consultar la conexión de este cliente."
                );

                return;
            }


            const estado =
                data.data;


            console.log(
                "DANTE PING CLIENTE:",
                estado
            );


            if (
                !estado
            ) {

                responderDante(
                    "No recibí información de conexión para este cliente."
                );

                return;
            }


            const nombre =
                `${servicio.nombres} ${servicio.apellidos}`.trim();


            const ip =
                estado.ipCliente ||
                servicio.ipCliente ||
                "sin IP";


            // ====================================================
            // CLIENTE ONLINE
            // ====================================================

            if (
                estado.online
            ) {

                const ping =
                    typeof estado.pingPromedioMs === "number"
                        ? estado.pingPromedioMs.toFixed(1)
                        : null;


                const latencia =
                    estado.latencia ||
                    "sin clasificación";


                const recibidos =
                    Number(
                        estado.recibidos ||
                        0
                    );


                const enviados =
                    Number(
                        estado.enviados ||
                        0
                    );


                let respuesta =
                    `${nombre} está conectado. ` +
                    `IP ${ip}. `;


                if (
                    ping
                ) {

                    respuesta +=
                        `Ping promedio ${ping} milisegundos. `;
                }


                respuesta +=
                    `Latencia ${latencia}. ` +
                    `Paquetes recibidos ${recibidos} de ${enviados}.`;

                actualizarContextoDante({

                    tema:
                        "CLIENTE",

                    entidadId:
                        servicio.clienteId,

                    entidadNombre:
                        `${servicio.nombres || ""} ${servicio.apellidos || ""}`
                            .trim(),

                    ultimaIntencion:
                        "PING_CLIENTE",

                });

                responderDante(
                    respuesta
                );


                return;
            }


            // ====================================================
            // CLIENTE OFFLINE
            // ====================================================

            responderDante(
                `${nombre} está desconectado. ` +
                `La IP registrada es ${ip} y no respondió al ping.`
            );


        } catch (error) {

            console.error(
                "Error haciendo ping con Dante:",
                error
            );


            responderDante(
                "Ocurrió un error al consultar la conexión del cliente."
            );
        }
    }

    // ========================================================
    // DANTE - CLASIFICAR MEMORIA AUTOMÁTICAMENTE
    // ========================================================

    function clasificarMemoriaDante(
        contenido: string
    ) {

        const texto =
            normalizarTextoDante(
                contenido
            );


        let tipoMemoria =
            "GENERAL";


        let categoria =
            "OBSERVACION";


        let importancia =
            5;


        let entidadTipo:
            string | null =
            null;


        // ====================================================
        // WIRELESS
        // ====================================================

        if (
            texto.includes("wireless") ||
            texto.includes("antena") ||
            texto.includes("sectorial") ||
            texto.includes("access point") ||
            texto.includes("ap ") ||
            texto.includes("radio enlace") ||
            texto.includes("radioenlace")
        ) {

            tipoMemoria =
                "WIRELESS";

            entidadTipo =
                "EQUIPO_WIRELESS";
        }


        // ====================================================
        // MIKROTIK
        // ====================================================

        else if (
            texto.includes("mikrotik") ||
            texto.includes("router") ||
            texto.includes("pppoe") ||
            texto.includes("queue") ||
            texto.includes("simple queue") ||
            texto.includes("firewall")
        ) {

            tipoMemoria =
                "MIKROTIK";

            entidadTipo =
                "MIKROTIK";
        }


        // ====================================================
        // CLIENTES
        // ====================================================

        else if (
            texto.includes("cliente") ||
            texto.includes("abonado") ||
            texto.includes("usuario de internet") ||
            texto.includes("servicio del cliente")
        ) {

            tipoMemoria =
                "CLIENTE";

            entidadTipo =
                "CLIENTE";
        }


        // ====================================================
        // TICKETS / SOPORTE
        // ====================================================

        else if (
            texto.includes("ticket") ||
            texto.includes("soporte") ||
            texto.includes("reclamo") ||
            texto.includes("incidencia")
        ) {

            tipoMemoria =
                "SOPORTE";

            entidadTipo =
                "TICKET";
        }


        // ====================================================
        // INFRAESTRUCTURA
        // ====================================================

        else if (
            texto.includes("nodo") ||
            texto.includes("torre") ||
            texto.includes("nap") ||
            texto.includes("fibra") ||
            texto.includes("olt") ||
            texto.includes("onu") ||
            texto.includes("infraestructura")
        ) {

            tipoMemoria =
                "INFRAESTRUCTURA";

            entidadTipo =
                "INFRAESTRUCTURA";
        }


        // ====================================================
        // FACTURACIÓN
        // ====================================================

        else if (
            texto.includes("factura") ||
            texto.includes("facturacion") ||
            texto.includes("sri") ||
            texto.includes("nota de credito") ||
            texto.includes("comprobante")
        ) {

            tipoMemoria =
                "FACTURACION";

            entidadTipo =
                "FACTURA";
        }


        // ====================================================
        // PAGOS / COBRANZA
        // ====================================================

        else if (
            texto.includes("pago") ||
            texto.includes("mensualidad") ||
            texto.includes("deuda") ||
            texto.includes("moroso") ||
            texto.includes("cobro")
        ) {

            tipoMemoria =
                "PAGOS";

            entidadTipo =
                "PAGO";
        }


        // ====================================================
        // INVENTARIO
        // ====================================================

        else if (
            texto.includes("inventario") ||
            texto.includes("stock") ||
            texto.includes("bodega") ||
            texto.includes("producto") ||
            texto.includes("material")
        ) {

            tipoMemoria =
                "INVENTARIO";

            entidadTipo =
                "INVENTARIO";
        }


        // ====================================================
        // ADMINISTRATIVO
        // ====================================================

        else if (
            texto.includes("proveedor") ||
            texto.includes("reunion") ||
            texto.includes("administracion") ||
            texto.includes("personal") ||
            texto.includes("empleado") ||
            texto.includes("tarea")
        ) {

            tipoMemoria =
                "ADMINISTRATIVO";

            entidadTipo =
                "ADMINISTRATIVO";
        }


        // ====================================================
        // CATEGORÍA: INCIDENTE
        // ====================================================

        if (
            texto.includes("falla") ||
            texto.includes("fallo") ||
            texto.includes("error") ||
            texto.includes("offline") ||
            texto.includes("fuera de linea") ||
            texto.includes("caido") ||
            texto.includes("ping alto") ||
            texto.includes("latencia alta") ||
            texto.includes("sin conexion") ||
            texto.includes("perdida de paquetes")
        ) {

            categoria =
                "INCIDENTE";

            importancia =
                8;
        }


        // ====================================================
        // CATEGORÍA: MANTENIMIENTO
        // ====================================================

        else if (
            texto.includes("mantenimiento") ||
            texto.includes("revisar") ||
            texto.includes("revision tecnica")
        ) {

            categoria =
                "MANTENIMIENTO";

            importancia =
                7;
        }


        // ====================================================
        // CATEGORÍA: PENDIENTE
        // ====================================================

        else if (
            texto.includes("pendiente") ||
            texto.includes("debemos") ||
            texto.includes("hay que") ||
            texto.includes("recordar hacer") ||
            texto.includes("por hacer")
        ) {

            categoria =
                "PENDIENTE";

            importancia =
                6;
        }


        // ====================================================
        // CATEGORÍA: CONFIGURACIÓN
        // ====================================================

        else if (
            texto.includes("configuracion") ||
            texto.includes("configurar") ||
            texto.includes("parametro") ||
            texto.includes("ajuste")
        ) {

            categoria =
                "CONFIGURACION";

            importancia =
                6;
        }


        // ====================================================
        // CATEGORÍA: INFORMACIÓN
        // ====================================================

        else {

            categoria =
                "INFORMACION";
        }


        // ====================================================
        // IMPORTANCIA CRÍTICA
        // ====================================================

        if (
            texto.includes("critico") ||
            texto.includes("critica") ||
            texto.includes("urgente") ||
            texto.includes("grave")
        ) {

            importancia =
                10;
        }


        return {
            tipoMemoria,
            categoria,
            importancia,
            entidadTipo,
        };
    }
    // ========================================================
    // DANTE - GUARDAR MEMORIA PERSISTENTE
    // ========================================================

    async function guardarMemoriaDante(
        contenido: string
    ) {

        const textoMemoria =
            contenido.trim();


        if (!textoMemoria) {

            responderDante(
                "Indícame qué información deseas que recuerde."
            );

            return;
        }

        const clasificacion =
            clasificarMemoriaDante(
                textoMemoria
            );

        try {

            const token =
                getToken();


            const res =
                await fetch(
                    `${API_BASE}/dante/memorias`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },
                        body:
                            JSON.stringify({

                                tipoMemoria:
                                    clasificacion.tipoMemoria,

                                categoria:
                                    clasificacion.categoria,

                                clave:
                                    textoMemoria.slice(
                                        0,
                                        180
                                    ),

                                contenido:
                                    textoMemoria,

                                entidadTipo:
                                    clasificacion.entidadTipo,

                                importancia:
                                    clasificacion.importancia,

                                datosJson: {

                                    clasificacionAutomatica:
                                        true,

                                    tipoDetectado:
                                        clasificacion.tipoMemoria,

                                    categoriaDetectada:
                                        clasificacion.categoria,

                                },
                            }),
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false
            ) {

                throw new Error(
                    data.message ||
                    "No se pudo guardar la memoria"
                );
            }


            console.log(
                "DANTE MEMORIA GUARDADA:",
                data
            );


            responderDante(
                `De acuerdo. Guardaré esta información: ${textoMemoria}.`
            );


        } catch (error) {

            console.error(
                "DANTE: Error guardando memoria:",
                error
            );


            responderDante(
                "No pude guardar esa información en mi memoria."
            );
        }
    }

    // ========================================================
    // DANTE - OBTENER CONTEXTO HISTÓRICO DE SU MEMORIA
    // ========================================================

    async function obtenerContextoHistoricoDante(
        terminoBusqueda: string
    ) {

        const termino =
            terminoBusqueda.trim();


        if (!termino) {
            return [];
        }


        try {

            const token =
                getToken();


            const res =
                await fetch(
                    `${API_BASE}/dante/memorias/buscar?q=${encodeURIComponent(
                        termino
                    )}`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },

                        cache:
                            "no-store",
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false
            ) {

                return [];
            }


            const memorias =
                Array.isArray(
                    data.memorias
                )
                    ? data.memorias
                    : [];


            return memorias;


        } catch (error) {

            console.error(
                "DANTE: Error obteniendo contexto histórico:",
                error
            );


            return [];
        }
    }

    // ========================================================
    // DANTE - FORMATEAR ANTECEDENTES HISTÓRICOS
    // ========================================================

    function construirAntecedentesHistoricosDante(
        memorias: any[]
    ) {

        if (
            !Array.isArray(memorias) ||
            memorias.length === 0
        ) {
            return "";
        }


        const principales =
            memorias.slice(0, 3);


        const antecedentes =
            principales
                .map(
                    (memoria: any) => {

                        const contenido =
                            memoria.contenido ||
                            "";


                        const cuando =
                            descripcionHistoricaFechaDante(
                                memoria.fechaCreacion ||
                                memoria.fecha_creacion ||
                                null
                            );


                        return (
                            `${cuando}, ${contenido}`
                        );
                    }
                )
                .filter(Boolean);


        if (
            antecedentes.length === 0
        ) {
            return "";
        }


        return (
            " Como antecedente histórico tengo registrado que " +
            antecedentes.join(". ") +
            "."
        );
    }

    // ========================================================
    // DANTE - BUSCAR EN SU MEMORIA
    // ========================================================

    async function consultarMemoriaDante(
        terminoBusqueda: string
    ) {

        const termino =
            terminoBusqueda.trim();


        if (!termino) {

            responderDante(
                "Indícame qué deseas consultar en mi memoria."
            );

            return;
        }


        try {

            const token =
                getToken();


            responderDante(
                `Consultando lo que recuerdo sobre ${terminoBusqueda}.`
            );


            const res =
                await fetch(
                    `${API_BASE}/dante/memorias/buscar?q=${encodeURIComponent(
                        termino
                    )}`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },

                        cache:
                            "no-store",
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false
            ) {

                throw new Error(
                    data.message ||
                    "No se pudo consultar la memoria"
                );
            }


            const memorias =
                Array.isArray(
                    data.memorias
                )
                    ? data.memorias
                    : [];


            console.log(
                "DANTE MEMORIAS ENCONTRADAS:",
                memorias
            );


            if (
                memorias.length === 0
            ) {

                responderDante(
                    `No tengo información guardada sobre ${terminoBusqueda}.`
                );

                return;
            }


            // ====================================================
            // EVITAMOS QUE DANTE LEA 50 MEMORIAS DE GOLPE
            // ====================================================

            const principales =
                memorias.slice(
                    0,
                    5
                );


            const lectura =
                principales
                    .map(
                        (
                            memoria: any,
                            index: number
                        ) => {

                            return (
                                `Recuerdo ${index + 1}. ` +
                                `${memoria.contenido}.`
                            );
                        }
                    )
                    .join(" ");


            let respuesta =
                `Encontré ${memorias.length} ` +
                (
                    memorias.length === 1
                        ? "registro relacionado. "
                        : "registros relacionados. "
                ) +
                lectura;


            if (
                memorias.length > 5
            ) {

                respuesta +=
                    ` Hay ${memorias.length - 5} registros adicionales relacionados.`;
            }


            responderDante(
                respuesta
            );


        } catch (error) {

            console.error(
                "DANTE: Error consultando memoria:",
                error
            );


            responderDante(
                "No pude consultar mi memoria en este momento."
            );
        }
    }

    async function leerNodoWirelessDante(
        node: any
    ) {

        if (
            !monitoreoRedDanteRef.current
        ) {
            return;
        }


        // ====================================================
        // SISTEMA
        // ====================================================

        if (
            node.tipo === "SISTEMA"
        ) {

            responderDante(
                "Este es el nodo principal del sistema de infraestructura Wireless."
            );

            return;
        }


        // ====================================================
        // NODO AGENT
        // ====================================================

        if (
            node.tipo === "NODO"
        ) {

            responderDante(
                `Este es el nodo ${node.id}. Forma parte de la infraestructura Wireless monitoreada.`
            );

            return;
        }


        // ====================================================
        // DATA COMPLETA DEL EQUIPO
        // ====================================================

        const data =
            node.dataCompleta;


        if (
            !data
        ) {

            responderDante(
                "No tengo información completa de este equipo."
            );

            return;
        }


        const equipo =
            data.equipo || {};


        const resultado =
            data.resultado || {};


        const nombre =
            equipo.nombre ||
            node.id ||
            "equipo Wireless";

        const memoriasHistoricas =
            await obtenerContextoHistoricoDante(
                nombre
            );

        const tipoEquipo =
            equipo.tipoEquipo ||
            node.tipo ||
            "equipo";


        const ip =
            equipo.ipGestion ||
            node.ip ||
            "sin IP registrada";


        const nodoAgent =
            equipo.nodoAgent ||
            "sin nodo asignado";


        const estado =
            data.nuevoEstado ||
            resultado.estado ||
            node.estado ||
            "sin estado";


        const online =
            resultado.online;


        const sshOk =
            resultado.sshOk;


        const ping =
            resultado.pingPromedioMs;


        const recibidos =
            resultado.recibidos;


        const perdidos =
            resultado.perdidos;


        const modo =
            resultado.modo;


        const mensaje =
            data.mensaje ||
            node.mensaje ||
            null;


        // ====================================================
        // ARMAR RESPUESTA
        // ====================================================

        let respuesta =
            `Equipo ${nombre}. `;


        respuesta +=
            `Tipo ${tipoEquipo}. `;


        respuesta +=
            `IP ${ip}. `;


        respuesta +=
            `Nodo de comunicación ${nodoAgent}. `;


        // ====================================================
        // ESTADO
        // ====================================================

        if (
            estado === "ONLINE" ||
            online === true
        ) {

            respuesta +=
                "El equipo se encuentra en línea. ";

        } else if (
            estado === "OFFLINE" ||
            online === false
        ) {

            respuesta +=
                "Atención. El equipo se encuentra fuera de línea. ";

        } else if (
            estado === "PING_ALTO"
        ) {

            respuesta +=
                "Atención. El equipo presenta ping alto. ";

        } else if (
            estado === "SSH_FALLA"
        ) {

            respuesta +=
                "Atención. El equipo presenta una falla SSH. ";

        } else {

            respuesta +=
                `Estado ${estado}. `;
        }


        // ====================================================
        // PING
        // ====================================================

        if (
            ping !== null &&
            ping !== undefined
        ) {

            respuesta +=
                `El ping promedio es de ${Number(ping).toFixed(2)} milisegundos. `;
        }


        // ====================================================
        // SSH
        // ====================================================

        if (
            sshOk === true
        ) {

            respuesta +=
                "La conexión SSH está disponible. ";

        } else if (
            sshOk === false
        ) {

            respuesta +=
                "La conexión SSH presenta una falla. ";
        }


        // ====================================================
        // PAQUETES
        // ====================================================

        if (
            recibidos !== undefined ||
            perdidos !== undefined
        ) {

            const recibidosNumero =
                Number(recibidos || 0);


            const perdidosNumero =
                Number(perdidos || 0);


            const totalPaquetes =
                recibidosNumero +
                perdidosNumero;


            respuesta +=
                `Se recibieron ${recibidosNumero} de ${totalPaquetes} paquetes. `;


            if (
                perdidosNumero > 0
            ) {

                respuesta +=
                    `Se perdieron ${perdidosNumero} paquetes. `;
            }
        }


        // ====================================================
        // MODO DE CONEXIÓN
        // ====================================================

        if (
            modo
        ) {

            respuesta +=
                `El monitoreo se realizó mediante ${modo}. `;
        }


        // ====================================================
        // MENSAJE
        // ====================================================

        if (
            mensaje &&
            mensaje !== "-"
        ) {

            respuesta +=
                `Información adicional: ${mensaje}.`;
        }


        console.log(
            "DANTE DATA COMPLETA WIRELESS:",
            data
        );

        const contextoHistorico =
            construirAntecedentesHistoricosDante(
                memoriasHistoricas
            );


        respuesta +=
            contextoHistorico;

        responderDante(
            respuesta
        );
    }

    // ========================================================
    // DANTE - GUARDAR EVENTO DE AGENDA
    // ========================================================

    async function guardarEventoAgendaDante(
        textoOriginal: string,
        fechaRecordatorio: Date
    ) {

        try {

            const token =
                getToken();


            if (!textoOriginal?.trim()) {

                responderDante(
                    "No tengo información suficiente para crear el evento."
                );

                return;
            }


            if (
                !fechaRecordatorio ||
                Number.isNaN(
                    fechaRecordatorio.getTime()
                )
            ) {

                responderDante(
                    "No pude identificar correctamente la fecha del evento."
                );

                return;
            }


            if (
                fechaRecordatorio.getTime() <=
                Date.now()
            ) {

                responderDante(
                    "La fecha y hora indicadas ya pasaron."
                );

                return;
            }


            // =================================================
            // LIMPIAR EL TEXTO DEL COMANDO
            // =================================================

            let contenido =
                textoOriginal
                    .replace(
                        /^(agenda|agendame|recu[eé]rdame|anota\s+para)\s*/i,
                        ""
                    )
                    .trim();


            if (!contenido) {

                contenido =
                    "Evento agendado";
            }


            const fechaTexto =
                fechaRecordatorio.toLocaleDateString(
                    "es-EC"
                );


            const horaTexto =
                fechaRecordatorio.toLocaleTimeString(
                    "es-EC",
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        hour12:
                            true,
                    }
                );


            // =================================================
            // GUARDAR EN MEMORIA / AGENDA
            // =================================================

            const res =
                await fetch(
                    `${API_BASE}/dante/memorias`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            JSON.stringify({

                                tipoMemoria:
                                    "AGENDA",

                                categoria:
                                    "RECORDATORIO",

                                clave:
                                    contenido.slice(
                                        0,
                                        180
                                    ),

                                contenido,

                                entidadTipo:
                                    "AGENDA",

                                importancia:
                                    6,

                                recordarEn:
                                    fechaRecordatorio.toISOString(),

                                datosJson: {

                                    estado:
                                        "PENDIENTE",

                                    origen:
                                        "DANTE_AGENDA",

                                    fecha:
                                        fechaRecordatorio
                                            .toISOString()
                                            .slice(
                                                0,
                                                10
                                            ),

                                    hora:
                                        fechaRecordatorio
                                            .toTimeString()
                                            .slice(
                                                0,
                                                5
                                            ),

                                    fechaRecordatorio:
                                        fechaRecordatorio.toISOString(),

                                    textoOriginal,

                                },

                            }),
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data.ok === false
            ) {

                throw new Error(
                    data.mensaje ||
                    data.message ||
                    "No se pudo guardar el evento."
                );
            }


            // =================================================
            // GUARDAR TAMBIÉN EN HISTORIAL
            // =================================================

            try {

                await fetch(
                    `${API_BASE}/dante/historial`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            JSON.stringify({

                                tipo:
                                    "AGENDA",

                                textoUsuario:
                                    textoOriginal,

                                respuestaDante:
                                    `Evento agendado para ${fechaTexto} a las ${horaTexto}.`,

                                accion:
                                    "CREAR_EVENTO_AGENDA",

                                resultado:
                                    "OK",

                                datosJson: {

                                    contenido,

                                    fechaRecordatorio:
                                        fechaRecordatorio.toISOString(),

                                },

                            }),
                    }
                );

            } catch (errorHistorial) {

                console.error(
                    "DANTE: No se pudo registrar el historial de agenda:",
                    errorHistorial
                );

            }


            // =================================================
            // RESPUESTA DANTE
            // =================================================

            responderDante(
                `De acuerdo. He agendado ${contenido} para el ${fechaTexto} a las ${horaTexto}. Te lo recordaré cuando llegue el momento.`
            );


            console.log(
                "DANTE EVENTO AGENDADO:",
                {
                    contenido,
                    fechaRecordatorio:
                        fechaRecordatorio.toISOString(),
                }
            );


        } catch (error) {

            console.error(
                "DANTE: Error guardando evento de agenda:",
                error
            );


            responderDante(
                "No pude guardar el evento en mi agenda."
            );
        }
    }

    function interpretarHoraRespuestaDante(
        textoOriginal: string
    ): {
        hora: number;
        minutos: number;
    } | null {

        const texto =
            normalizarTextoDante(
                textoOriginal
            );


        let coincidencia =
            texto.match(
                /(?:a\s+las?|a\s+la)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/
            );


        if (
            !coincidencia
        ) {

            return null;
        }


        let hora =
            Number(
                coincidencia[1]
            );


        const minutos =
            coincidencia[2]
                ? Number(
                    coincidencia[2]
                )
                : 0;


        const periodo =
            coincidencia[3];


        // ====================================================
        // FORMAS NATURALES
        // ====================================================

        const esTarde =
            texto.includes(
                "de la tarde"
            );


        const esNoche =
            texto.includes(
                "de la noche"
            );


        const esManana =
            texto.includes(
                "de la manana"
            );


        if (
            (
                periodo === "pm" ||
                esTarde ||
                esNoche
            ) &&
            hora < 12
        ) {

            hora += 12;
        }


        if (
            (
                periodo === "am" ||
                esManana
            ) &&
            hora === 12
        ) {

            hora = 0;
        }


        if (
            hora < 0 ||
            hora > 23 ||
            minutos < 0 ||
            minutos > 59
        ) {

            return null;
        }


        return {
            hora,
            minutos,
        };
    }

    // ========================================================
    // SINCRONIZAR REF ESTADO
    // ========================================================

    useEffect(() => {

        estadoDanteRef.current =
            estadoDante;

    }, [estadoDante]);


    useEffect(() => {

        microfonoActivoRef.current =
            microfonoActivo;

    }, [microfonoActivo]);

    useEffect(() => {

        void revisarRecordatoriosDante();

        const intervalo =
            setInterval(
                () => {
                    void revisarRecordatoriosDante();
                },
                60 * 1000
            );

        return () => {
            clearInterval(intervalo);
        };

    }, []);

    // ========================================================
    // DANTE - MONITOREO AUTOMÁTICO DE ALERTAS CRÍTICAS
    // ========================================================

    useEffect(() => {

        // ====================================================
        // DANTE ESCUCHA CLICS DE LA RED NEURONAL WIRELESS
        // ====================================================

        function escucharNodoWirelessDante(
            event: Event
        ) {

            // Si el modo monitoreo de Dante
            // no está activo, no hacemos nada.

            if (
                !monitoreoRedDanteRef.current
            ) {

                return;
            }


            const customEvent =
                event as CustomEvent<any>;


            const node =
                customEvent.detail;


            if (
                !node
            ) {

                return;
            }


            console.log(
                "DANTE NODO WIRELESS SELECCIONADO:",
                node
            );


            leerNodoWirelessDante(
                node
            );
        }


        window.addEventListener(
            "dante:wireless-nodo-seleccionado",
            escucharNodoWirelessDante
        );


        return () => {

            window.removeEventListener(
                "dante:wireless-nodo-seleccionado",
                escucharNodoWirelessDante
            );
        };

    }, []);

    // ========================================================
    // HABLAR
    // ========================================================

    function obtenerVozMasculinaDante() {

        if (
            typeof window === "undefined" ||
            !("speechSynthesis" in window)
        ) {
            return null;
        }


        const voces =
            window.speechSynthesis.getVoices();


        if (
            voces.length === 0
        ) {
            return null;
        }


        // ====================================================
        // VOCES MASCULINAS CONOCIDAS
        // ====================================================

        const nombresMasculinos = [
            "pablo",
            "jorge",
            "diego",
            "carlos",
            "miguel",
            "juan",
            "raul",
            "enrique",
            "andres",
            "alvaro",
            "male"
        ];


        // ====================================================
        // PRIMERO: VOZ ESPAÑOLA + NOMBRE MASCULINO
        // ====================================================

        const masculinaEspanol =
            voces.find(
                voz => {

                    const nombre =
                        voz.name.toLowerCase();

                    const idioma =
                        voz.lang.toLowerCase();


                    const esEspanol =
                        idioma.startsWith("es");


                    const pareceMasculina =
                        nombresMasculinos.some(
                            nombreMasculino =>
                                nombre.includes(
                                    nombreMasculino
                                )
                        );


                    return (
                        esEspanol &&
                        pareceMasculina
                    );
                }
            );


        if (
            masculinaEspanol
        ) {
            return masculinaEspanol;
        }


        // ====================================================
        // SEGUNDO: CUALQUIER VOZ EN ESPAÑOL ECUADOR
        // ====================================================

        const vozEcuador =
            voces.find(
                voz =>
                    voz.lang
                        .toLowerCase()
                        .includes("es-ec")
            );


        if (
            vozEcuador
        ) {
            return vozEcuador;
        }


        // ====================================================
        // TERCERO: CUALQUIER VOZ ESPAÑOLA
        // ====================================================

        const vozEspanol =
            voces.find(
                voz =>
                    voz.lang
                        .toLowerCase()
                        .startsWith("es")
            );


        return (
            vozEspanol ||
            voces[0] ||
            null
        );
    }
    function hablar(
        texto: string
    ) {

        if (
            typeof window === "undefined"
        ) {
            return;
        }


        if (
            !("speechSynthesis" in window)
        ) {
            return;
        }


        try {

            // ====================================================
            // DANTE - BLOQUEAR AUTOESCUCHA ANTES DE HABLAR
            // ====================================================

            pausaReconocimientoPorVozDanteRef.current =
                true;

            danteHablandoRef.current =
                true;


            // ====================================================
            // DETENER RECONOCIMIENTO MIENTRAS DANTE HABLA
            // ====================================================

            try {

                reconocimientoRef.current?.abort();

            } catch (error) {

                console.log(
                    "DANTE: reconocimiento ya estaba detenido"
                );
            }


            // ====================================================
            // CANCELAR VOZ ANTERIOR
            // ====================================================

            window.speechSynthesis.cancel();


            const mensaje =
                new SpeechSynthesisUtterance(
                    texto
                );


            // ====================================================
            // VOZ DANTE
            // ====================================================

            const vozDante =
                obtenerVozMasculinaDante();


            if (
                vozDante
            ) {

                mensaje.voice =
                    vozDante;


                console.log(
                    "🔊 VOZ DANTE:",
                    vozDante.name,
                    vozDante.lang
                );
            }


            mensaje.lang =
                vozDante?.lang ||
                "es-EC";


            mensaje.rate =
                0.90;


            mensaje.pitch =
                0.62;


            mensaje.volume =
                1;


            // ====================================================
            // INICIO DE VOZ
            // ====================================================

            mensaje.onstart =
                () => {

                    danteHablandoRef.current =
                        true;


                    pausaReconocimientoPorVozDanteRef.current =
                        true;


                    console.log(
                        "🔊 DANTE ESTÁ HABLANDO - MICRÓFONO PAUSADO"
                    );
                };


            // ====================================================
            // TERMINÓ DE HABLAR
            // ====================================================

            mensaje.onend =
                () => {

                    console.log(
                        "🔊 DANTE TERMINÓ DE HABLAR"
                    );


                    // Dejamos pequeño margen para que
                    // no capture el final de su propia voz.
                    setTimeout(
                        () => {

                            danteHablandoRef.current =
                                false;


                            pausaReconocimientoPorVozDanteRef.current =
                                false;


                            console.log(
                                "🎤 DANTE LIBERADO PARA ESCUCHAR"
                            );


                            // ====================================================
                            // REACTIVAR RECONOCIMIENTO
                            // ====================================================

                            if (
                                microfonoActivoRef.current &&
                                reconocimientoRef.current
                            ) {

                                try {

                                    reconocimientoRef.current.start();


                                    console.log(
                                        "🎤 Reconocimiento reactivado después de hablar"
                                    );

                                } catch (error: any) {

                                    // Si Chrome dice que ya inició,
                                    // simplemente ignoramos.
                                    if (
                                        error?.name !==
                                        "InvalidStateError"
                                    ) {

                                        console.error(
                                            "Error reactivando reconocimiento:",
                                            error
                                        );
                                    }
                                }
                            }

                        },
                        800
                    );
                };


            // ====================================================
            // ERROR / CANCELACIÓN DE VOZ
            // ====================================================

            mensaje.onerror =
                () => {

                    console.log(
                        "🔊 Error/cancelación de voz Dante"
                    );


                    danteHablandoRef.current =
                        false;


                    pausaReconocimientoPorVozDanteRef.current =
                        false;


                    setTimeout(
                        () => {

                            if (
                                microfonoActivoRef.current &&
                                reconocimientoRef.current
                            ) {

                                try {

                                    reconocimientoRef.current.start();

                                } catch {
                                    // ignoramos si ya está iniciado
                                }
                            }

                        },
                        800
                    );
                };


            window.speechSynthesis.speak(
                mensaje
            );


            // ====================================================
            // SEGURO ANTI-BLOQUEO
            // ====================================================

            const tiempoSeguro =
                Math.max(
                    5000,
                    texto.length * 100
                );


            setTimeout(
                () => {

                    if (
                        danteHablandoRef.current &&
                        !window.speechSynthesis.speaking
                    ) {

                        console.warn(
                            "⚠️ DANTE: desbloqueo automático de voz"
                        );


                        danteHablandoRef.current =
                            false;


                        pausaReconocimientoPorVozDanteRef.current =
                            false;
                    }

                },
                tiempoSeguro
            );


        } catch (error) {

            danteHablandoRef.current =
                false;


            pausaReconocimientoPorVozDanteRef.current =
                false;


            console.error(
                "Error reproduciendo voz Dante:",
                error
            );
        }
    }

    // ========================================================
    // RESPONDER DANTE
    // ========================================================

    function responderDante(
        texto: string,
        reproducirVoz = true
    ) {

        setRespuestaDante(
            texto
        );


        if (
            reproducirVoz
        ) {

            hablar(
                texto
            );
        }
    }


    // ========================================================
    // PROCESAR COMANDO
    // ========================================================

    async function procesarComandoDante(
        comando: string
    ) {

        const limpio =
            comando.trim();

        if (!limpio) {
            return;
        }

        console.log(
            "COMANDO DANTE:",
            limpio
        );

        setUltimoComando(
            limpio
        );


        const texto =
            normalizarTextoDante(
                limpio
            );


        // ========================================================
        // DANTE - RESPUESTA PENDIENTE DE AGENDA
        // ========================================================

        if (
            contextoDanteRef.current.tema ===
            "AGENDA" &&
            contextoDanteRef.current.esperandoRespuesta ===
            true &&
            agendaPendienteDanteRef.current
        ) {

            const pendiente =
                agendaPendienteDanteRef.current;


            // ====================================================
            // ESPERANDO FECHA
            // ====================================================

            if (
                pendiente.esperando ===
                "FECHA"
            ) {

                const resultado =
                    interpretarFechaAgendaDante(
                        limpio
                    );


                if (
                    !resultado.encontroFecha ||
                    !resultado.fecha
                ) {

                    responderDante(
                        "No pude identificar el día. Puedes decirme, por ejemplo, mañana o el 15 de septiembre."
                    );

                    return;
                }


                pendiente.fecha =
                    resultado.fecha;


                // Si en la misma respuesta dijo también la hora
                if (
                    resultado.encontroHora
                ) {

                    if (
                        resultado.fecha.getTime() <=
                        Date.now()
                    ) {

                        responderDante(
                            "La fecha y hora indicadas ya pasaron."
                        );

                        return;
                    }


                    actualizarContextoDante({

                        esperandoRespuesta:
                            false,

                        datoPendiente:
                            null,

                    });


                    await guardarEventoAgendaDante(

                        pendiente.textoOriginal,

                        resultado.fecha

                    );


                    agendaPendienteDanteRef.current =
                        null;


                    return;
                }


                // Ya tenemos fecha.
                // Ahora falta hora.
                pendiente.esperando =
                    "HORA";


                actualizarContextoDante({

                    esperandoRespuesta:
                        true,

                    datoPendiente:
                        "HORA",

                });


                responderDante(
                    "Perfecto. ¿A qué hora deseas que te lo recuerde?"
                );


                return;
            }


            // ====================================================
            // ESPERANDO HORA
            // ====================================================

            if (
                pendiente.esperando ===
                "HORA"
            ) {

                if (
                    !pendiente.fecha
                ) {

                    responderDante(
                        "Perdí la fecha del recordatorio. Indícame nuevamente el día."
                    );


                    pendiente.esperando =
                        "FECHA";


                    actualizarContextoDante({

                        esperandoRespuesta:
                            true,

                        datoPendiente:
                            "FECHA",

                    });


                    return;
                }


                const resultadoHora =
                    interpretarHoraRespuestaDante(
                        limpio
                    );


                if (
                    !resultadoHora
                ) {

                    responderDante(
                        "No pude identificar la hora. Puedes decirme, por ejemplo, a las 10 de la mañana o a las 3 de la tarde."
                    );

                    return;
                }


                const fechaFinal =
                    new Date(
                        pendiente.fecha
                    );


                fechaFinal.setHours(
                    resultadoHora.hora,
                    resultadoHora.minutos,
                    0,
                    0
                );


                if (
                    fechaFinal.getTime() <=
                    Date.now()
                ) {

                    responderDante(
                        "Esa fecha y hora ya pasaron. Indícame otra hora."
                    );

                    return;
                }


                actualizarContextoDante({

                    esperandoRespuesta:
                        false,

                    datoPendiente:
                        null,

                });


                await guardarEventoAgendaDante(

                    pendiente.textoOriginal,

                    fechaFinal

                );


                agendaPendienteDanteRef.current =
                    null;


                return;
            }
        }





        // ========================================================
        // DANTE - GUARDAR INFORMACIÓN EN MEMORIA
        // ========================================================

        if (
            texto.startsWith(
                "recuerda que "
            ) ||
            texto.startsWith(
                "recuerda "
            ) ||
            texto.startsWith(
                "guarda que "
            ) ||
            texto.startsWith(
                "guarda esta informacion "
            ) ||
            texto.startsWith(
                "guarda la informacion "
            ) ||
            texto.startsWith(
                "anota que "
            )
        ) {

            let contenidoMemoria =
                limpio;


            const prefijosMemoria = [
                "recuerda que ",
                "recuerda ",
                "guarda que ",
                "guarda esta informacion ",
                "guarda la informacion ",
                "anota que ",
            ];


            const textoNormalizado =
                normalizarTextoDante(
                    limpio
                );


            for (
                const prefijo
                of prefijosMemoria
            ) {

                if (
                    textoNormalizado.startsWith(
                        prefijo
                    )
                ) {

                    /*
                     * Cortamos por cantidad de caracteres
                     * del prefijo.
                     *
                     * limpio conserva mejor el texto original.
                     */

                    contenidoMemoria =
                        limpio
                            .slice(
                                prefijo.length
                            )
                            .trim();

                    break;
                }
            }


            if (
                !contenidoMemoria
            ) {

                responderDante(
                    "Indícame qué deseas que recuerde."
                );

                return;
            }


            await guardarMemoriaDante(
                contenidoMemoria
            );


            return;
        }

        // ========================================================
        // DANTE - CONSULTAR INFORMACIÓN DE SU MEMORIA
        // ========================================================

        if (
            texto.startsWith(
                "que recuerdas de "
            ) ||
            texto.startsWith(
                "que sabes de "
            ) ||
            texto.startsWith(
                "busca en tu memoria "
            ) ||
            texto.startsWith(
                "consulta tu memoria sobre "
            ) ||
            texto.startsWith(
                "recuerdas algo de "
            ) ||
            texto.startsWith(
                "busca en tu memoria "
            ) ||
            texto.startsWith(
                "consulta tu memoria "
            )
        ) {

            let terminoBusqueda =
                texto;


            const prefijosConsulta = [
                "que recuerdas de ",
                "que sabes de ",
                "busca en tu memoria ",
                "consulta tu memoria sobre ",
                "recuerdas algo de ",
            ];


            for (
                const prefijo
                of prefijosConsulta
            ) {

                if (
                    terminoBusqueda.startsWith(
                        prefijo
                    )
                ) {

                    terminoBusqueda =
                        terminoBusqueda
                            .slice(
                                prefijo.length
                            )
                            .trim();

                    break;
                }
            }


            if (
                !terminoBusqueda
            ) {

                responderDante(
                    "Indícame sobre qué deseas que consulte mi memoria."
                );

                return;
            }


            await consultarMemoriaDante(
                terminoBusqueda
            );


            return;
        }

        // ========================================================
        // TOTAL GENERAL DE NOTIFICACIONES
        // ========================================================

        if (
            texto.includes("cuantas notificaciones hay") ||
            texto.includes("cuantas notificaciones tengo") ||
            texto.includes("total de notificaciones") ||
            texto === "notificaciones"
        ) {

            const total =
                Number(
                    resumen.totalNuevas ||
                    0
                );


            responderDante(
                total === 1
                    ? "Tienes 1 notificación."
                    : `Tienes ${total} notificaciones.`
            );

            return;
        }


        // ========================================================
        // TOTAL NOTIFICACIONES CRÍTICAS
        // ========================================================

        if (
            texto.includes("cuantas criticas hay") ||
            texto.includes("cuantas notificaciones criticas") ||
            texto.includes("notificaciones criticas") ||
            texto === "criticas" ||
            texto === "critica"
        ) {

            const totalCriticas =
                Number(
                    resumen.criticas ||
                    0
                );


            responderDante(
                totalCriticas === 1
                    ? "Tienes 1 notificación crítica."
                    : `Tienes ${totalCriticas} notificaciones críticas.`
            );

            return;
        }


        // ========================================================
        // LEER NOTIFICACIONES CRÍTICAS
        // ========================================================

        if (
            texto.includes("cuales son las criticas") ||
            texto.includes("dime cuales son las criticas") ||
            texto.includes("lee las criticas") ||
            texto.includes("leer las criticas") ||
            texto.includes("dime las criticas")
        ) {

            const criticas =
                notificaciones.filter(
                    item =>
                        item.nivel ===
                        "CRITICA"
                );


            if (
                criticas.length === 0
            ) {

                responderDante(
                    "No tienes notificaciones críticas."
                );

                return;
            }


            const lectura =
                criticas
                    .map(
                        (
                            item,
                            index
                        ) => {

                            return (
                                `Crítica ${index + 1}. ` +
                                `${item.titulo}. ` +
                                `${item.mensaje}.`
                            );
                        }
                    )
                    .join(" ");


            responderDante(
                `Tienes ${criticas.length} ` +
                (
                    criticas.length === 1
                        ? "notificación crítica. "
                        : "notificaciones críticas. "
                ) +
                lectura
            );

            return;
        }


        // ========================================================
        // TOTAL AVISOS / ADVERTENCIAS
        // ========================================================

        if (
            texto.includes("cuantos avisos hay") ||
            texto.includes("cuantas advertencias hay") ||
            texto.includes("cuantos avisos tengo") ||
            texto.includes("cuantas advertencias tengo") ||
            texto.includes("notificaciones de aviso") ||
            texto === "avisos" ||
            texto === "advertencias"
        ) {

            const totalAvisos =
                Number(
                    resumen.advertencias ||
                    0
                );


            responderDante(
                totalAvisos === 1
                    ? "Tienes 1 aviso."
                    : `Tienes ${totalAvisos} avisos.`
            );

            return;
        }

        // ========================================================
        // IR A NOTIFICACIONES
        // ========================================================

        if (
            texto.includes("llevame a notificaciones") ||
            texto.includes("llévame a notificaciones") ||
            texto.includes("ir a notificaciones") ||
            texto.includes("abre las notificaciones") ||
            texto.includes("abrir notificaciones") ||
            texto.includes("mostrar notificaciones") ||
            texto.includes("ver notificaciones") ||
            texto.includes("llevame a las alertas") ||
            texto.includes("abre las alertas")
        ) {

            responderDante(
                "Claro. Abriendo notificaciones."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirAlertas();
                },
                500
            );

            return;
        }
        // ========================================================
        // MARCAR NOTIFICACIONES COMO LEÍDAS
        // ========================================================

        if (
            texto === "marcalo como leido" ||
            texto === "marcalas como leidas" ||
            texto === "marcar como leido" ||
            texto === "marcar como leidas" ||
            texto.includes("marca las notificaciones como leidas") ||
            texto.includes("marca todas como leidas")
        ) {

            responderDante(
                "Listo. Marco las notificaciones como leídas."
            );

            marcarTodasVistas();

            return;
        }

        // ========================================================
        // IR A TICKETS / SOPORTE
        // ========================================================

        if (
            texto === "tickets" ||
            texto === "ticket" ||
            texto === "soporte" ||
            texto === "soporte tecnico" ||
            texto === "tickets de soporte" ||
            texto === "incidencias" ||
            texto === "reclamos" ||
            texto === "problemas de clientes" ||

            texto.includes("llevame a tickets") ||
            texto.includes("ir a tickets") ||
            texto.includes("abre tickets") ||
            texto.includes("abrir tickets") ||
            texto.includes("ver tickets") ||
            texto.includes("mostrar tickets") ||

            texto.includes("quiero ver los tickets") ||
            texto.includes("quiero revisar los tickets") ||
            texto.includes("revisar tickets") ||
            texto.includes("revisa los tickets") ||

            texto.includes("llevame a soporte") ||
            texto.includes("ir a soporte") ||
            texto.includes("abre soporte") ||
            texto.includes("abrir soporte") ||
            texto.includes("ver soporte") ||

            texto.includes("quiero ver soporte") ||
            texto.includes("quiero revisar soporte") ||
            texto.includes("soporte tecnico") ||

            texto.includes("crear un ticket") ||
            texto.includes("crear ticket") ||
            texto.includes("nuevo ticket") ||
            texto.includes("registrar ticket") ||
            texto.includes("registrar un ticket") ||
            texto.includes("agregar ticket") ||

            texto.includes("reportar un problema") ||
            texto.includes("reportar problema") ||
            texto.includes("registrar un problema") ||
            texto.includes("problema de un cliente") ||

            texto.includes("ver incidencias") ||
            texto.includes("revisar incidencias") ||
            texto.includes("abrir incidencias") ||

            texto.includes("ver reclamos") ||
            texto.includes("revisar reclamos") ||
            texto.includes("reclamos de clientes") ||

            texto.includes("tickets pendientes") ||
            texto.includes("tickets abiertos") ||
            texto.includes("tickets sin resolver") ||
            texto.includes("problemas pendientes")
        ) {

            responderDante(
                "Claro. Abriendo tickets de soporte."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirTickets();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A IMPORTAR CLIENTES
        // ========================================================

        if (
            texto === "importar clientes" ||
            texto === "importacion de clientes" ||
            texto === "cargar clientes" ||
            texto === "subir clientes" ||
            texto === "migrar clientes" ||
            texto === "traer clientes" ||

            texto.includes("llevame a importar clientes") ||
            texto.includes("ir a importar clientes") ||
            texto.includes("abre importar clientes") ||
            texto.includes("abrir importar clientes") ||
            texto.includes("quiero importar clientes") ||

            texto.includes("quiero cargar clientes") ||
            texto.includes("quiero subir clientes") ||
            texto.includes("quiero migrar clientes") ||
            texto.includes("quiero traer clientes") ||

            texto.includes("cargar una lista de clientes") ||
            texto.includes("cargar lista de clientes") ||
            texto.includes("subir una lista de clientes") ||
            texto.includes("subir lista de clientes") ||

            texto.includes("importar una lista de clientes") ||
            texto.includes("importar lista de clientes") ||
            texto.includes("importar archivo de clientes") ||
            texto.includes("subir archivo de clientes") ||

            texto.includes("importar clientes desde excel") ||
            texto.includes("cargar clientes desde excel") ||
            texto.includes("subir clientes desde excel") ||

            texto.includes("pasar clientes al sistema") ||
            texto.includes("meter clientes al sistema") ||
            texto.includes("cargar clientes al sistema") ||
            texto.includes("agregar clientes por archivo")
        ) {

            responderDante(
                "Claro. Abriendo importación de clientes."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirImportarClientes();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A LISTADO DE USUARIOS
        // ========================================================

        if (
            texto === "lista de usuarios" ||
            texto === "listado de usuarios" ||
            texto === "usuarios registrados" ||
            texto === "ver usuarios registrados" ||
            texto === "todos los usuarios" ||

            texto.includes("llevame a la lista de usuarios") ||
            texto.includes("llevame al listado de usuarios") ||
            texto.includes("ir a la lista de usuarios") ||
            texto.includes("abre la lista de usuarios") ||
            texto.includes("abrir lista de usuarios") ||

            texto.includes("quiero ver la lista de usuarios") ||
            texto.includes("quiero ver los usuarios registrados") ||
            texto.includes("quiero ver todos los usuarios") ||
            texto.includes("muestrame los usuarios") ||
            texto.includes("mostrar los usuarios") ||

            texto.includes("ver usuarios registrados") ||
            texto.includes("revisar usuarios registrados") ||
            texto.includes("consultar usuarios") ||
            texto.includes("buscar usuarios") ||
            texto.includes("buscar un usuario") ||

            texto.includes("lista de cuentas") ||
            texto.includes("ver las cuentas registradas") ||
            texto.includes("usuarios del sistema") ||
            texto.includes("ver usuarios del sistema") ||
            texto.includes("lista de usuarios del sistema")
        ) {

            responderDante(
                "Claro. Abriendo la lista de usuarios."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirListaUsuarios();
            }, 500);

            return;
        }

        // ========================================================
        // IR A ADMINISTRAR ROLES
        // ========================================================

        if (
            texto === "roles" ||
            texto === "rol" ||
            texto === "administrar roles" ||
            texto === "gestion de roles" ||
            texto === "roles de usuarios" ||
            texto === "permisos" ||
            texto === "permisos de usuarios" ||
            texto === "niveles de acceso" ||

            texto.includes("llevame a roles") ||
            texto.includes("ir a roles") ||
            texto.includes("abre roles") ||
            texto.includes("abrir roles") ||
            texto.includes("ver roles") ||
            texto.includes("mostrar roles") ||

            texto.includes("llevame a administrar roles") ||
            texto.includes("abre administrar roles") ||
            texto.includes("quiero administrar los roles") ||
            texto.includes("quiero gestionar los roles") ||

            texto.includes("quiero ver los roles") ||
            texto.includes("quiero revisar los roles") ||
            texto.includes("revisar roles") ||
            texto.includes("ver roles de usuarios") ||

            texto.includes("crear un rol") ||
            texto.includes("crear rol") ||
            texto.includes("nuevo rol") ||
            texto.includes("agregar un rol") ||
            texto.includes("agregar rol") ||
            texto.includes("registrar un rol") ||

            texto.includes("quiero crear un rol") ||
            texto.includes("quiero agregar un rol") ||

            texto.includes("ver permisos") ||
            texto.includes("administrar permisos") ||
            texto.includes("configurar permisos") ||
            texto.includes("permisos de los usuarios") ||
            texto.includes("cambiar permisos") ||

            texto.includes("ver niveles de acceso") ||
            texto.includes("administrar niveles de acceso") ||
            texto.includes("configurar niveles de acceso") ||

            texto.includes("quien tiene permiso") ||
            texto.includes("quienes tienen permiso") ||
            texto.includes("acceso de usuarios")
        ) {

            responderDante(
                "Claro. Abriendo administración de roles y permisos."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirAdministrarRoles();
            }, 500);

            return;
        }

        // ========================================================
        // IR A ADMINISTRAR MENÚ LATERAL
        // ========================================================

        if (
            texto === "menu" ||
            texto === "menu lateral" ||
            texto === "administrar menu" ||
            texto === "configurar menu" ||
            texto === "gestion de menu" ||
            texto === "opciones del menu" ||

            texto.includes("llevame al menu") ||
            texto.includes("ir al menu") ||
            texto.includes("abre el menu") ||
            texto.includes("abrir el menu") ||
            texto.includes("ver el menu") ||

            texto.includes("llevame al menu lateral") ||
            texto.includes("ir al menu lateral") ||
            texto.includes("abre el menu lateral") ||
            texto.includes("abrir menu lateral") ||
            texto.includes("ver menu lateral") ||

            texto.includes("quiero administrar el menu") ||
            texto.includes("quiero configurar el menu") ||
            texto.includes("administrar el menu lateral") ||
            texto.includes("configurar el menu lateral") ||
            texto.includes("editar el menu lateral") ||

            texto.includes("quiero editar el menu") ||
            texto.includes("editar el menu") ||
            texto.includes("modificar el menu") ||
            texto.includes("organizar el menu") ||

            texto.includes("ver opciones del menu") ||
            texto.includes("administrar opciones del menu") ||
            texto.includes("configurar opciones del menu") ||

            texto.includes("agregar opcion al menu") ||
            texto.includes("agregar una opcion al menu") ||
            texto.includes("crear opcion de menu") ||
            texto.includes("nueva opcion de menu")
        ) {

            responderDante(
                "Claro. Abriendo administración del menú."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirMenuLateral();
            }, 500);

            return;
        }

        // ========================================================
        // IR A CONFIGURACIÓN DE FACTURACIÓN
        // ========================================================

        if (
            texto === "configuracion de facturacion" ||
            texto === "configuracion facturacion" ||
            texto === "configurar facturacion" ||
            texto === "configurar facturas" ||
            texto === "datos de facturacion" ||
            texto === "configuracion sri" ||

            texto.includes("llevame a configuracion de facturacion") ||
            texto.includes("ir a configuracion de facturacion") ||
            texto.includes("abre configuracion de facturacion") ||
            texto.includes("abrir configuracion de facturacion") ||

            texto.includes("quiero configurar la facturacion") ||
            texto.includes("quiero configurar facturacion") ||
            texto.includes("configurar la facturacion") ||
            texto.includes("revisar configuracion de facturacion") ||

            texto.includes("llevame a configurar facturas") ||
            texto.includes("quiero configurar las facturas") ||
            texto.includes("configurar las facturas") ||
            texto.includes("configuracion de facturas") ||

            texto.includes("ver datos de facturacion") ||
            texto.includes("configurar datos de facturacion") ||
            texto.includes("cambiar datos de facturacion") ||
            texto.includes("editar datos de facturacion") ||

            texto.includes("llevame a configuracion sri") ||
            texto.includes("abre configuracion sri") ||
            texto.includes("configurar sri") ||
            texto.includes("configuracion del sri") ||

            texto.includes("configurar facturacion electronica") ||
            texto.includes("configuracion de facturacion electronica") ||
            texto.includes("quiero configurar facturacion electronica") ||

            texto.includes("configurar datos de la empresa para facturar") ||
            texto.includes("datos de la empresa para facturacion")
        ) {

            responderDante(
                "Claro. Abriendo configuración de facturación."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirConfiguracionFacturacion();
            }, 500);

            return;
        }

        // ========================================================
        // IR A SPEED TEST / TEST DE VELOCIDAD
        // ========================================================

        if (
            texto === "speed test" ||
            texto === "speedtest" ||
            texto === "test de velocidad" ||
            texto === "prueba de velocidad" ||
            texto === "medir velocidad" ||
            texto === "velocidad de internet" ||
            texto === "medir el internet" ||

            texto.includes("llevame al test de velocidad") ||
            texto.includes("llevame a test de velocidad") ||
            texto.includes("ir al test de velocidad") ||
            texto.includes("abre el test de velocidad") ||
            texto.includes("abrir test de velocidad") ||
            texto.includes("ver test de velocidad") ||

            texto.includes("llevame al speed test") ||
            texto.includes("ir al speed test") ||
            texto.includes("abre speed test") ||
            texto.includes("abrir speed test") ||
            texto.includes("ver speed test") ||

            texto.includes("quiero hacer un test de velocidad") ||
            texto.includes("quiero hacer el test de velocidad") ||
            texto.includes("hacer un test de velocidad") ||
            texto.includes("hacer prueba de velocidad") ||

            texto.includes("quiero medir la velocidad") ||
            texto.includes("medir la velocidad") ||
            texto.includes("medir velocidad de internet") ||
            texto.includes("quiero medir el internet") ||
            texto.includes("quiero medir mi internet") ||

            texto.includes("quiero ver la velocidad") ||
            texto.includes("ver velocidad de internet") ||
            texto.includes("revisar velocidad de internet") ||
            texto.includes("comprobar velocidad de internet") ||

            texto.includes("como esta la velocidad") ||
            texto.includes("como esta el internet") ||
            texto.includes("revisar el internet") ||

            texto.includes("ver resultados de velocidad") ||
            texto.includes("resultados del speed test") ||
            texto.includes("resultados del test de velocidad") ||
            texto.includes("analisis de velocidad") ||
            texto.includes("estadisticas de velocidad")
        ) {

            responderDante(
                "Claro. Abriendo el test de velocidad."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirSpeedTestAnalytics();
            }, 500);

            return;
        }

        // ========================================================
        // IR A CONFIGURACIÓN DE SEDES
        // ========================================================

        if (
            texto === "sedes" ||
            texto === "sede" ||
            texto === "sucursales" ||
            texto === "sucursal" ||
            texto === "configuracion de sedes" ||
            texto === "administrar sedes" ||
            texto === "gestion de sedes" ||

            texto.includes("llevame a sedes") ||
            texto.includes("ir a sedes") ||
            texto.includes("abre sedes") ||
            texto.includes("abrir sedes") ||
            texto.includes("ver sedes") ||
            texto.includes("mostrar sedes") ||

            texto.includes("llevame a configuracion de sedes") ||
            texto.includes("abre configuracion de sedes") ||
            texto.includes("ir a configuracion de sedes") ||

            texto.includes("quiero ver las sedes") ||
            texto.includes("quiero revisar las sedes") ||
            texto.includes("revisar las sedes") ||
            texto.includes("administrar las sedes") ||
            texto.includes("gestionar las sedes") ||

            texto.includes("agregar una sede") ||
            texto.includes("agregar sede") ||
            texto.includes("crear una sede") ||
            texto.includes("crear sede") ||
            texto.includes("nueva sede") ||
            texto.includes("registrar una sede") ||
            texto.includes("registrar sede") ||

            texto.includes("quiero agregar una sede") ||
            texto.includes("quiero crear una sede") ||
            texto.includes("quiero registrar una sede") ||

            texto.includes("ver sucursales") ||
            texto.includes("abre sucursales") ||
            texto.includes("administrar sucursales") ||
            texto.includes("configurar sucursales") ||
            texto.includes("agregar una sucursal") ||
            texto.includes("crear una sucursal") ||
            texto.includes("nueva sucursal") ||

            texto.includes("ver oficinas") ||
            texto.includes("administrar oficinas") ||
            texto.includes("agregar una oficina")
        ) {

            responderDante(
                "Claro. Abriendo configuración de sedes."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirConfiguracionSedes();
            }, 500);

            return;
        }

        // ========================================================
        // IR A CATEGORÍAS DE GASTOS
        // ========================================================

        if (
            texto === "categorias de gastos" ||
            texto === "categorias gastos" ||
            texto === "categoria de gastos" ||
            texto === "tipos de gastos" ||
            texto === "tipo de gasto" ||

            texto.includes("llevame a categorias de gastos") ||
            texto.includes("ir a categorias de gastos") ||
            texto.includes("abre categorias de gastos") ||
            texto.includes("abrir categorias de gastos") ||
            texto.includes("ver categorias de gastos") ||
            texto.includes("mostrar categorias de gastos") ||

            texto.includes("quiero ver las categorias de gastos") ||
            texto.includes("quiero revisar las categorias de gastos") ||
            texto.includes("revisar categorias de gastos") ||
            texto.includes("administrar categorias de gastos") ||
            texto.includes("gestionar categorias de gastos") ||

            texto.includes("crear categoria de gasto") ||
            texto.includes("crear una categoria de gasto") ||
            texto.includes("nueva categoria de gasto") ||
            texto.includes("agregar categoria de gasto") ||
            texto.includes("agregar una categoria de gasto") ||
            texto.includes("registrar categoria de gasto") ||

            texto.includes("quiero crear una categoria de gasto") ||
            texto.includes("quiero agregar una categoria de gasto") ||
            texto.includes("quiero registrar una categoria de gasto") ||

            texto.includes("ver tipos de gastos") ||
            texto.includes("crear tipo de gasto") ||
            texto.includes("agregar tipo de gasto") ||
            texto.includes("nuevo tipo de gasto") ||

            texto.includes("configurar gastos") ||
            texto.includes("organizar gastos") ||
            texto.includes("clasificar gastos") ||
            texto.includes("configurar categorias de gastos")
        ) {

            responderDante(
                "Claro. Abriendo categorías de gastos."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirCategoriasGastos();
            }, 500);

            return;
        }


        // ========================================================
        // IR A GASTOS MENSUALES
        // ========================================================

        if (
            texto === "gastos" ||
            texto === "gastos mensuales" ||
            texto === "gastos del mes" ||
            texto === "egresos" ||
            texto === "egresos mensuales" ||

            texto.includes("llevame a gastos") ||
            texto.includes("ir a gastos") ||
            texto.includes("abre gastos") ||
            texto.includes("abrir gastos") ||
            texto.includes("ver gastos") ||
            texto.includes("mostrar gastos") ||

            texto.includes("llevame a gastos mensuales") ||
            texto.includes("ir a gastos mensuales") ||
            texto.includes("abre gastos mensuales") ||
            texto.includes("ver gastos mensuales") ||

            texto.includes("quiero ver los gastos") ||
            texto.includes("quiero revisar los gastos") ||
            texto.includes("revisar los gastos") ||
            texto.includes("ver los gastos del mes") ||
            texto.includes("revisar los gastos del mes") ||

            texto.includes("registrar un gasto") ||
            texto.includes("registrar gasto") ||
            texto.includes("agregar un gasto") ||
            texto.includes("agregar gasto") ||
            texto.includes("nuevo gasto") ||
            texto.includes("crear un gasto") ||

            texto.includes("quiero registrar un gasto") ||
            texto.includes("quiero agregar un gasto") ||
            texto.includes("quiero ingresar un gasto") ||
            texto.includes("ingresar un gasto") ||

            texto.includes("ver egresos") ||
            texto.includes("revisar egresos") ||
            texto.includes("registrar egreso") ||
            texto.includes("registrar un egreso") ||

            texto.includes("cuanto hemos gastado") ||
            texto.includes("cuanto se ha gastado") ||
            texto.includes("gastos de este mes") ||
            texto.includes("gastos del negocio") ||
            texto.includes("gastos de la empresa")
        ) {

            responderDante(
                "Claro. Abriendo gastos mensuales."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirGastosMensuales();
            }, 500);

            return;
        }

        // ========================================================
        // IR A PLANES DE INTERNET
        // ========================================================

        if (
            texto === "planes" ||
            texto === "planes de internet" ||
            texto === "planes internet" ||
            texto === "plan de internet" ||
            texto === "plan internet" ||
            texto === "velocidades de internet" ||
            texto === "tarifas de internet" ||

            texto.includes("llevame a planes") ||
            texto.includes("ir a planes") ||
            texto.includes("abre planes") ||
            texto.includes("abrir planes") ||
            texto.includes("ver planes") ||
            texto.includes("mostrar planes") ||

            texto.includes("llevame a planes de internet") ||
            texto.includes("ir a planes de internet") ||
            texto.includes("abre planes de internet") ||
            texto.includes("ver planes de internet") ||

            texto.includes("quiero ver los planes") ||
            texto.includes("quiero ver los planes de internet") ||
            texto.includes("revisar planes de internet") ||
            texto.includes("administrar planes de internet") ||
            texto.includes("gestionar planes de internet") ||

            texto.includes("crear un plan de internet") ||
            texto.includes("crear plan de internet") ||
            texto.includes("nuevo plan de internet") ||
            texto.includes("nuevo plan") ||
            texto.includes("agregar un plan") ||
            texto.includes("agregar plan") ||
            texto.includes("registrar un plan") ||

            texto.includes("crear una velocidad") ||
            texto.includes("agregar una velocidad") ||
            texto.includes("ver velocidades") ||
            texto.includes("velocidades disponibles") ||

            texto.includes("ver los megas") ||
            texto.includes("planes por megas") ||
            texto.includes("planes de megas") ||

            texto.includes("ver tarifas") ||
            texto.includes("tarifas de los planes") ||
            texto.includes("precios de los planes") ||
            texto.includes("precio de los planes")
        ) {

            responderDante(
                "Claro. Abriendo planes de Internet."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirPlanesInternet();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A PUBLICIDAD
        // ========================================================

        if (
            texto === "publicidad" ||
            texto === "publicidades" ||
            texto === "anuncios" ||
            texto === "promociones" ||
            texto === "campañas" ||
            texto === "campañas publicitarias" ||
            texto === "ofertas" ||

            texto.includes("llevame a publicidad") ||
            texto.includes("ir a publicidad") ||
            texto.includes("abre publicidad") ||
            texto.includes("abrir publicidad") ||
            texto.includes("ver publicidad") ||
            texto.includes("mostrar publicidad") ||

            texto.includes("quiero ver la publicidad") ||
            texto.includes("quiero revisar la publicidad") ||
            texto.includes("revisar publicidad") ||
            texto.includes("administrar publicidad") ||
            texto.includes("gestionar publicidad") ||

            texto.includes("crear publicidad") ||
            texto.includes("crear una publicidad") ||
            texto.includes("nueva publicidad") ||
            texto.includes("agregar publicidad") ||
            texto.includes("registrar publicidad") ||

            texto.includes("crear un anuncio") ||
            texto.includes("nuevo anuncio") ||
            texto.includes("agregar un anuncio") ||
            texto.includes("publicar un anuncio") ||
            texto.includes("ver los anuncios") ||

            texto.includes("crear una promocion") ||
            texto.includes("nueva promocion") ||
            texto.includes("agregar una promocion") ||
            texto.includes("ver promociones") ||
            texto.includes("quiero hacer una promocion") ||

            texto.includes("crear una campaña") ||
            texto.includes("nueva campaña") ||
            texto.includes("ver campañas") ||
            texto.includes("administrar campañas") ||

            texto.includes("crear una oferta") ||
            texto.includes("nueva oferta") ||
            texto.includes("ver ofertas") ||
            texto.includes("publicar una oferta")
        ) {

            responderDante(
                "Claro. Abriendo publicidad."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirPublicidad();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A TIENDA ONLINE NETCOMP
        // ========================================================

        if (
            texto === "tienda" ||
            texto === "tienda online" ||
            texto === "tienda netcomp" ||
            texto === "tienda virtual" ||
            texto === "catalogo de la tienda" ||
            texto === "productos de la tienda" ||

            texto.includes("llevame a la tienda") ||
            texto.includes("ir a la tienda") ||
            texto.includes("abre la tienda") ||
            texto.includes("abrir la tienda") ||
            texto.includes("ver la tienda") ||
            texto.includes("mostrar la tienda") ||

            texto.includes("llevame a la tienda online") ||
            texto.includes("ir a la tienda online") ||
            texto.includes("abre la tienda online") ||
            texto.includes("abrir tienda online") ||
            texto.includes("ver tienda online") ||

            texto.includes("llevame a la tienda netcomp") ||
            texto.includes("abre la tienda netcomp") ||
            texto.includes("ver la tienda netcomp") ||

            texto.includes("quiero ver la tienda") ||
            texto.includes("quiero revisar la tienda") ||
            texto.includes("quiero entrar a la tienda") ||

            texto.includes("ver productos de la tienda") ||
            texto.includes("ver los productos en venta") ||
            texto.includes("productos en venta") ||
            texto.includes("que tenemos en la tienda") ||

            texto.includes("administrar la tienda") ||
            texto.includes("gestionar la tienda") ||
            texto.includes("administrar tienda online") ||

            texto.includes("agregar producto a la tienda") ||
            texto.includes("agregar un producto a la tienda") ||
            texto.includes("publicar un producto") ||
            texto.includes("vender un producto") ||
            texto.includes("poner un producto en venta") ||

            texto.includes("catalogo de la tienda") ||
            texto.includes("ver catalogo de la tienda") ||
            texto.includes("abre el catalogo de la tienda")
        ) {

            responderDante(
                "Claro. Abriendo la tienda online."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirTiendaOnline();
            }, 500);

            return;
        }

        // ========================================================
        // IR A PRODUCTOS Y SERVICIOS
        // ========================================================

        if (
            texto === "productos y servicios" ||
            texto === "productos servicios" ||
            texto === "producto y servicio" ||
            texto === "catalogo" ||
            texto === "catalogo de productos" ||
            texto === "catalogo de servicios" ||

            texto.includes("llevame a productos y servicios") ||
            texto.includes("ir a productos y servicios") ||
            texto.includes("abre productos y servicios") ||
            texto.includes("abrir productos y servicios") ||
            texto.includes("ver productos y servicios") ||
            texto.includes("mostrar productos y servicios") ||

            texto.includes("quiero ver los productos y servicios") ||
            texto.includes("quiero revisar los productos y servicios") ||
            texto.includes("administrar productos y servicios") ||
            texto.includes("gestionar productos y servicios") ||

            texto.includes("llevame al catalogo") ||
            texto.includes("abre el catalogo") ||
            texto.includes("ver el catalogo") ||
            texto.includes("quiero ver el catalogo") ||

            texto.includes("ver productos") ||
            texto.includes("revisar productos") ||
            texto.includes("administrar productos") ||
            texto.includes("gestionar productos") ||

            texto.includes("crear un producto") ||
            texto.includes("crear producto") ||
            texto.includes("nuevo producto") ||
            texto.includes("agregar un producto") ||
            texto.includes("registrar un producto") ||

            texto.includes("ver servicios") ||
            texto.includes("revisar servicios") ||
            texto.includes("administrar servicios") ||
            texto.includes("gestionar servicios") ||

            texto.includes("crear un servicio") ||
            texto.includes("crear servicio") ||
            texto.includes("nuevo servicio") ||
            texto.includes("agregar un servicio") ||
            texto.includes("registrar un servicio") ||

            texto.includes("que productos tenemos") ||
            texto.includes("que servicios tenemos") ||
            texto.includes("que productos ofrecemos") ||
            texto.includes("que servicios ofrecemos")
        ) {

            responderDante(
                "Claro. Abriendo productos y servicios."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirProductosServicios();
            }, 500);

            return;
        }

        // ========================================================
        // IR A INVENTARIO
        // ========================================================

        if (
            texto === "inventario" ||
            texto === "bodega" ||
            texto === "stock" ||
            texto === "existencias" ||
            texto === "materiales" ||
            texto === "inventario de equipos" ||

            texto.includes("llevame al inventario") ||
            texto.includes("ir al inventario") ||
            texto.includes("abre inventario") ||
            texto.includes("abre el inventario") ||
            texto.includes("abrir inventario") ||
            texto.includes("ver inventario") ||
            texto.includes("mostrar inventario") ||

            texto.includes("quiero ver el inventario") ||
            texto.includes("quiero revisar el inventario") ||
            texto.includes("revisar inventario") ||
            texto.includes("administrar inventario") ||
            texto.includes("gestionar inventario") ||

            texto.includes("llevame a bodega") ||
            texto.includes("abre la bodega") ||
            texto.includes("ir a bodega") ||
            texto.includes("ver la bodega") ||
            texto.includes("quiero ver la bodega") ||

            texto.includes("ver el stock") ||
            texto.includes("revisar el stock") ||
            texto.includes("cuanto stock hay") ||
            texto.includes("que tenemos en stock") ||
            texto.includes("ver existencias") ||
            texto.includes("revisar existencias") ||

            texto.includes("ver materiales") ||
            texto.includes("revisar materiales") ||
            texto.includes("que materiales tenemos") ||
            texto.includes("materiales disponibles") ||

            texto.includes("ver equipos en inventario") ||
            texto.includes("revisar equipos en inventario") ||
            texto.includes("equipos disponibles") ||

            texto.includes("registrar producto") ||
            texto.includes("registrar un producto") ||
            texto.includes("agregar producto") ||
            texto.includes("agregar un producto") ||

            texto.includes("registrar equipo") ||
            texto.includes("agregar equipo") ||
            texto.includes("registrar material") ||
            texto.includes("agregar material")
        ) {

            responderDante(
                "Claro. Abriendo inventario."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirInventario();
            }, 500);

            return;
        }

        // ========================================================
        // IR A DESARROLLO DE SISTEMAS / SOFTWARE
        // ========================================================

        if (
            texto === "desarrollo" ||
            texto === "desarrollo de software" ||
            texto === "desarrollo de sistemas" ||
            texto === "sistemas" ||
            texto === "software" ||
            texto === "proyectos de software" ||
            texto === "proyectos de desarrollo" ||

            texto.includes("llevame a desarrollo") ||
            texto.includes("ir a desarrollo") ||
            texto.includes("abre desarrollo") ||
            texto.includes("abrir desarrollo") ||
            texto.includes("ver desarrollo") ||

            texto.includes("llevame a desarrollo de software") ||
            texto.includes("ir a desarrollo de software") ||
            texto.includes("abre desarrollo de software") ||
            texto.includes("abrir desarrollo de software") ||
            texto.includes("quiero ver desarrollo de software") ||

            texto.includes("llevame a desarrollo de sistemas") ||
            texto.includes("abre desarrollo de sistemas") ||
            texto.includes("quiero ver desarrollo de sistemas") ||

            texto.includes("llevame a sistemas") ||
            texto.includes("abre sistemas") ||
            texto.includes("ir a sistemas") ||
            texto.includes("ver sistemas") ||

            texto.includes("quiero ver los proyectos de software") ||
            texto.includes("ver proyectos de software") ||
            texto.includes("revisar proyectos de software") ||
            texto.includes("proyectos de desarrollo") ||

            texto.includes("quiero ver los proyectos") ||
            texto.includes("revisar los proyectos de desarrollo") ||
            texto.includes("administrar proyectos de software") ||

            texto.includes("quiero desarrollar un sistema") ||
            texto.includes("crear un sistema") ||
            texto.includes("nuevo sistema") ||
            texto.includes("nuevo proyecto de software") ||
            texto.includes("crear proyecto de software") ||

            texto.includes("programacion") ||
            texto.includes("proyectos de programacion") ||
            texto.includes("trabajos de desarrollo")
        ) {

            responderDante(
                "Claro. Abriendo desarrollo de software."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirDesarrolloSistema();
            }, 500);

            return;
        }

        // ========================================================
        // IR A ALERTAS CRÍTICAS WIRELESS
        // ========================================================

        if (
            texto === "alertas criticas" ||
            texto === "alertas criticas wireless" ||
            texto === "equipos offline" ||
            texto === "equipos fuera de linea" ||
            texto === "equipos caidos" ||
            texto === "antenas caidas" ||
            texto === "nodos caidos" ||

            texto.includes("llevame a alertas criticas") ||
            texto.includes("ir a alertas criticas") ||
            texto.includes("abre alertas criticas") ||
            texto.includes("abrir alertas criticas") ||
            texto.includes("ver alertas criticas") ||

            texto.includes("quiero ver los equipos offline") ||
            texto.includes("quiero ver equipos offline") ||
            texto.includes("ver equipos offline") ||
            texto.includes("abre equipos offline") ||
            texto.includes("equipos sin conexion") ||

            texto.includes("que equipos estan caidos") ||
            texto.includes("que equipos estan offline") ||
            texto.includes("que equipos estan fuera de linea") ||

            texto.includes("hay equipos caidos") ||
            texto.includes("hay equipos offline") ||
            texto.includes("hay antenas caidas") ||

            texto.includes("revisar equipos caidos") ||
            texto.includes("revisar equipos offline") ||
            texto.includes("revisar equipos fuera de linea") ||

            texto.includes("problemas criticos wireless") ||
            texto.includes("fallas criticas wireless") ||
            texto.includes("fallas criticas de red")
        ) {

            responderDante(
                "Claro. Abriendo alertas críticas Wireless."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirEquiposOffline();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A ALERTAS WIRELESS
        // ========================================================

        if (
            texto === "alertas wireless" ||
            texto === "alertas de wireless" ||
            texto === "alertas de red" ||
            texto === "alertas inalambricas" ||
            texto === "avisos wireless" ||
            texto === "fallas wireless" ||

            texto.includes("llevame a alertas wireless") ||
            texto.includes("ir a alertas wireless") ||
            texto.includes("abre alertas wireless") ||
            texto.includes("abrir alertas wireless") ||
            texto.includes("ver alertas wireless") ||
            texto.includes("mostrar alertas wireless") ||

            texto.includes("quiero ver las alertas wireless") ||
            texto.includes("quiero revisar las alertas wireless") ||
            texto.includes("revisar alertas wireless") ||
            texto.includes("revisa las alertas wireless") ||

            texto.includes("que alertas hay en wireless") ||
            texto.includes("que alertas hay en la red") ||
            texto.includes("hay alertas wireless") ||

            texto.includes("que problemas hay en wireless") ||
            texto.includes("que problemas tiene wireless") ||
            texto.includes("que fallas hay en wireless") ||
            texto.includes("ver fallas wireless") ||

            texto.includes("revisar problemas wireless") ||
            texto.includes("revisar fallas wireless") ||
            texto.includes("ver problemas de red wireless")
        ) {

            responderDante(
                "Claro. Abriendo alertas Wireless."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirAlertasWireless();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A EQUIPOS WIRELESS
        // ========================================================

        if (
            texto === "equipos wireless" ||
            texto === "equipos inalambricos" ||
            texto === "equipos de wireless" ||
            texto === "antenas" ||
            texto === "antenas wireless" ||
            texto === "radios wireless" ||
            texto === "radios" ||

            texto.includes("llevame a equipos wireless") ||
            texto.includes("ir a equipos wireless") ||
            texto.includes("abre equipos wireless") ||
            texto.includes("abrir equipos wireless") ||
            texto.includes("ver equipos wireless") ||
            texto.includes("mostrar equipos wireless") ||

            texto.includes("quiero ver los equipos wireless") ||
            texto.includes("quiero revisar los equipos wireless") ||
            texto.includes("revisar equipos wireless") ||
            texto.includes("revisa los equipos wireless") ||

            texto.includes("quiero ver las antenas") ||
            texto.includes("ver las antenas") ||
            texto.includes("ver antenas") ||
            texto.includes("abre las antenas") ||
            texto.includes("revisar las antenas") ||
            texto.includes("revisa las antenas") ||

            texto.includes("quiero ver los radios") ||
            texto.includes("ver radios wireless") ||
            texto.includes("revisar radios wireless") ||

            texto.includes("administrar equipos wireless") ||
            texto.includes("gestionar equipos wireless") ||
            texto.includes("administrar antenas") ||

            texto.includes("registrar equipo wireless") ||
            texto.includes("registrar un equipo wireless") ||
            texto.includes("agregar equipo wireless") ||
            texto.includes("agregar un equipo wireless") ||
            texto.includes("nuevo equipo wireless") ||

            texto.includes("registrar una antena") ||
            texto.includes("agregar una antena") ||
            texto.includes("nueva antena")
        ) {

            responderDante(
                "Claro. Abriendo equipos Wireless."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirEquiposWireless();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A MONITOREO WIRELESS
        // ========================================================

        if (
            texto === "wireless" ||
            texto === "monitoreo wireless" ||
            texto === "monitoreo inalambrico" ||
            texto === "red wireless" ||
            texto === "red inalambrica" ||
            texto === "antenas wireless" ||

            texto.includes("llevame a wireless") ||
            texto.includes("ir a wireless") ||
            texto.includes("abre wireless") ||
            texto.includes("abrir wireless") ||
            texto.includes("ver wireless") ||

            texto.includes("llevame a monitoreo wireless") ||
            texto.includes("ir a monitoreo wireless") ||
            texto.includes("abre monitoreo wireless") ||
            texto.includes("abrir monitoreo wireless") ||
            texto.includes("ver monitoreo wireless") ||

            texto.includes("quiero monitorear wireless") ||
            texto.includes("quiero revisar wireless") ||
            texto.includes("revisar la red wireless") ||
            texto.includes("revisa la red wireless") ||

            texto.includes("quiero ver las antenas") ||
            texto.includes("revisar las antenas") ||
            texto.includes("estado de las antenas") ||

            texto.includes("quiero ver los clientes wireless") ||
            texto.includes("revisar clientes wireless") ||
            texto.includes("clientes inalambricos") ||

            texto.includes("revisar señal wireless") ||
            texto.includes("revisar la señal wireless") ||
            texto.includes("ver señal wireless") ||
            texto.includes("estado de la señal wireless") ||

            texto.includes("problemas de señal") ||
            texto.includes("revisar problemas wireless")
        ) {

            responderDante(
                "Claro. Abriendo monitoreo Wireless."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirWirelessMonitoreo();
                },
                500
            );

            return;
        }
        // ========================================================
        // IR A ADMINISTRAR / AGREGAR MIKROTIK
        // ========================================================

        if (
            texto === "agregar mikrotik" ||
            texto === "agregar un mikrotik" ||
            texto === "nuevo mikrotik" ||
            texto === "crear mikrotik" ||
            texto === "registrar mikrotik" ||
            texto === "registrar un mikrotik" ||
            texto === "administrar mikrotik" ||
            texto === "administrar routers" ||
            texto === "routers mikrotik" ||
            texto === "nodos mikrotik" ||

            texto.includes("quiero agregar un mikrotik") ||
            texto.includes("quiero agregar mikrotik") ||
            texto.includes("quiero registrar un mikrotik") ||
            texto.includes("quiero registrar mikrotik") ||

            texto.includes("agregar router mikrotik") ||
            texto.includes("agregar un router mikrotik") ||
            texto.includes("registrar router mikrotik") ||
            texto.includes("registrar un router mikrotik") ||

            texto.includes("nuevo router mikrotik") ||
            texto.includes("crear router mikrotik") ||
            texto.includes("crear un router mikrotik") ||

            texto.includes("llevame a routers mikrotik") ||
            texto.includes("ir a routers mikrotik") ||
            texto.includes("abre routers mikrotik") ||
            texto.includes("abrir routers mikrotik") ||

            texto.includes("llevame a administrar mikrotik") ||
            texto.includes("abre administrar mikrotik") ||
            texto.includes("administrar nodos mikrotik")
        ) {

            responderDante(
                "Claro. Abriendo administración de routers MikroTik."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirRoutersMikrotik();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A CONFIGURACIÓN MIKROTIK
        // ========================================================

        if (
            texto === "configuracion mikrotik" ||
            texto === "configurar mikrotik" ||
            texto.includes("llevame a configuracion mikrotik") ||
            texto.includes("ir a configuracion mikrotik") ||
            texto.includes("abre configuracion mikrotik") ||
            texto.includes("abrir configuracion mikrotik") ||
            texto.includes("configura mikrotik") ||
            texto.includes("configuracion de mikrotik")
        ) {

            responderDante(
                "Claro. Abriendo configuración MikroTik."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirConfiguracionMikrotik();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A CORTES / REACTIVACIÓN DE SERVICIOS
        // ========================================================

        if (
            texto === "cortes" ||
            texto === "corte" ||
            texto === "corte de sistema" ||
            texto === "corte de servicio" ||
            texto === "cortes de servicio" ||
            texto === "reactivar servicio" ||
            texto === "reactivar servicios" ||
            texto === "habilitar servicio" ||
            texto === "habilitar servicios" ||

            texto.includes("llevame a cortes") ||
            texto.includes("ir a cortes") ||
            texto.includes("abre cortes") ||
            texto.includes("abrir cortes") ||

            texto.includes("corte de sistema") ||
            texto.includes("corte del sistema") ||
            texto.includes("corte de servicio") ||
            texto.includes("cortes de servicios") ||

            texto.includes("reactivar un servicio") ||
            texto.includes("reactivar servicio") ||
            texto.includes("reactivar servicios") ||
            texto.includes("quiero reactivar un servicio") ||

            texto.includes("habilitar un servicio") ||
            texto.includes("habilitar servicio") ||
            texto.includes("habilitar servicios") ||
            texto.includes("quiero habilitar un servicio")
        ) {

            responderDante(
                "Claro. Abriendo cortes y reactivación de servicios."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirCortesMikrotik();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A MIKROTIK
        // ========================================================

        if (
            texto === "mikrotik" ||
            texto.includes("llevame a mikrotik") ||
            texto.includes("ir a mikrotik") ||
            texto.includes("abre mikrotik") ||
            texto.includes("abrir mikrotik") ||
            texto.includes("ver mikrotik") ||
            texto.includes("mikrotik")
        ) {

            responderDante(
                "Claro. Abriendo MikroTik."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirMikrotik();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A INFRAESTRUCTURA
        // ========================================================

        if (
            texto === "infraestructura" ||
            texto === "infraestructura de red" ||
            texto === "red fisica" ||
            texto === "red física" ||
            texto === "equipos de red" ||
            texto === "estructura de red" ||

            texto.includes("llevame a infraestructura") ||
            texto.includes("ir a infraestructura") ||
            texto.includes("abre infraestructura") ||
            texto.includes("abrir infraestructura") ||
            texto.includes("ver infraestructura") ||
            texto.includes("mostrar infraestructura") ||

            texto.includes("quiero ver la infraestructura") ||
            texto.includes("quiero revisar la infraestructura") ||
            texto.includes("revisar infraestructura") ||
            texto.includes("revisa la infraestructura") ||

            texto.includes("quiero ver la red fisica") ||
            texto.includes("quiero ver la red física") ||
            texto.includes("revisar la red fisica") ||
            texto.includes("revisar la red física") ||

            texto.includes("quiero ver torres") ||
            texto.includes("quiero ver fibra") ||
            texto.includes("quiero ver nap") ||
            texto.includes("quiero ver los equipos wireless") ||
            texto.includes("quiero revisar la infraestructura de red")
        ) {

            responderDante(
                "Claro. Abriendo infraestructura de red."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirInfraestructura();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A MONITOREO DE RED / NODOS
        // ========================================================

        if (
            texto === "monitoreo" ||
            texto === "monitoreo de red" ||
            texto === "monitoreo de nodos" ||
            texto === "monitorear red" ||
            texto === "monitorear la red" ||
            texto === "monitoreemos la red" ||
            texto === "supervisar red" ||
            texto === "supervisar la red" ||

            texto.includes("abrir monitoreo") ||
            texto.includes("abre monitoreo") ||
            texto.includes("ir a monitoreo") ||
            texto.includes("llevame a monitoreo") ||

            texto.includes("ver monitoreo") ||
            texto.includes("ver la red") ||
            texto.includes("revisar la red") ||
            texto.includes("revisa la red") ||

            texto.includes("monitorear los nodos") ||
            texto.includes("monitorear nodos") ||
            texto.includes("ver los nodos") ||
            texto.includes("revisar los nodos") ||

            texto.includes("estado de la red") ||
            texto.includes("estado de los nodos") ||
            texto.includes("supervisar los nodos")
        ) {

            responderDante(
                "Claro. Abriendo monitoreo de red."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirMonitoreoNodos();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A CONTRATOS / BUSCAR CLIENTES
        // ========================================================

        if (
            texto === "buscar clientes" ||
            texto === "buscar cliente" ||
            texto === "contratos" ||
            texto === "contratos de servicio" ||
            texto === "contrato de servicio" ||
            texto === "crear contrato" ||
            texto === "crear un contrato" ||
            texto === "nuevo contrato" ||
            texto === "nuevo contrato de servicio" ||
            texto.includes("quiero buscar un cliente") ||
            texto.includes("quiero buscar clientes") ||
            texto.includes("buscar clientes en sistema") ||
            texto.includes("busqueda de clientes") ||
            texto.includes("abre busqueda de clientes") ||
            texto.includes("busqueda de cliente") ||
            texto.includes("abre busqueda de cliente") ||
            texto.includes("buscar cliente en sistema") ||
            texto.includes("llevame a contratos") ||
            texto.includes("ir a contratos") ||
            texto.includes("abre contratos") ||
            texto.includes("abrir contratos") ||
            texto.includes("crear contrato de servicio") ||
            texto.includes("crear un contrato de servicio") ||
            texto.includes("quiero crear un contrato") ||
            texto.includes("quiero crear contrato") ||
            texto.includes("hacer un contrato") ||
            texto.includes("hacer contrato")
        ) {

            responderDante(
                "Claro. Abriendo contratos de servicio."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirContratosServicios();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A CLIENTES
        // ========================================================

        if (
            texto === "clientes" ||
            texto === "cliente" ||
            texto === "administrar clientes" ||
            texto === "gestion de clientes" ||
            texto.includes("llevame a clientes") ||
            texto.includes("ir a clientes") ||
            texto.includes("abre clientes") ||
            texto.includes("abrir clientes") ||
            texto.includes("ver clientes") ||
            texto.includes("mostrar clientes") ||
            texto.includes("administrar clientes") ||
            texto.includes("gestionar clientes") ||
            texto.includes("registrar cliente") ||
            texto.includes("registrar un cliente") ||
            texto.includes("nuevo cliente") ||
            texto.includes("crear cliente") ||
            texto.includes("crear un cliente")
        ) {

            responderDante(
                "Claro. Abriendo clientes."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirClientes();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A LISTADO DE FACTURAS INTERNAS
        // ========================================================

        if (
            texto === "facturas internas" ||
            texto === "listado de facturas" ||
            texto === "listado de facturas internas" ||
            texto.includes("llevame a facturas internas") ||
            texto.includes("llevame a listado de facturas") ||
            texto.includes("llevame a listado facturas") ||
            texto.includes("ir a facturas internas") ||
            texto.includes("ir a facturas") ||
            texto.includes("facturas") ||
            texto.includes("ir a listado de facturas") ||
            texto.includes("ir a listado facturas") ||
            texto.includes("quiero ir a listdo de factura") ||
            texto.includes("quiero ir a facturas") ||
            texto.includes("abre facturas internas") ||
            texto.includes("abre listado de facturas") ||
            texto.includes("abre listado de facturacion") ||
            texto.includes("abre listado de facturación") ||
            texto.includes("abrir facturas internas") ||
            texto.includes("ver facturas internas") ||
            texto.includes("llevame al listado de facturas") ||
            texto.includes("abre el listado de facturas") ||
            texto.includes("ver listado de facturas")
        ) {

            responderDante(
                "Claro. Abriendo el listado de facturas internas."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirFacturasInternas();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A FACTURA MANUAL
        // ========================================================

        if (
            texto === "factura manual" ||
            texto === "facturacion manual" ||
            texto.includes("llevame a factura manual") ||
            texto.includes("ir a factura manual") ||
            texto.includes("abre facturacion") ||
            texto.includes("abre facturación") ||
            texto.includes("ir facturacion") ||
            texto.includes("ir facturación") ||
            texto.includes("abre factura") ||
            texto.includes("abrir factura") ||
            texto.includes("crear factura") ||
            texto.includes("queiro crear factura") ||
            texto.includes("queiro a crear factura") ||
            texto.includes("nueva factura") ||
            texto.includes("facturar") ||
            texto.includes("hacer una factura")
        ) {

            responderDante(
                "Claro. Abriendo factura manual."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirFacturaManual();
                },
                500
            );

            return;
        }


        // ========================================================
        // IR A PAGOS / MENSUALIDADES
        // ========================================================

        if (
            texto === "pagos" ||
            texto === "mensualidades" ||
            texto.includes("llevame a pagos") ||
            texto.includes("llévame a pagos") ||
            texto.includes("Llévame a pagos") ||
            texto.includes("ir a pagos") ||
            texto.includes("abre pagos") ||
            texto.includes("abrir pagos") ||
            texto.includes("ver pagos") ||
            texto.includes("llevame a mensualidades") ||
            texto.includes("ir a mensualidades") ||
            texto.includes("abre mensualidades") ||
            texto.includes("ver mensualidades")
        ) {

            responderDante(
                "Claro. Abriendo pagos mensuales."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirPagos();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A ADMINISTRACIÓN ISP
        // ========================================================

        if (
            texto === "administracion" ||
            texto === "administracion isp" ||
            texto === "administrar isp" ||
            texto === "gestion isp" ||
            texto === "gestion del isp" ||
            texto === "panel isp" ||
            texto === "administrar internet" ||
            texto === "administrar el internet" ||
            texto === "administrar el negocio" ||
            texto === "gestion del negocio" ||

            texto.includes("llevame a administracion") ||
            texto.includes("ir a administracion") ||
            texto.includes("abre administracion") ||
            texto.includes("abrir administracion") ||
            texto.includes("ver administracion") ||

            texto.includes("llevame a administracion isp") ||
            texto.includes("abre administracion isp") ||
            texto.includes("ir a administracion isp") ||
            texto.includes("quiero administrar el isp") ||

            texto.includes("quiero administrar el internet") ||
            texto.includes("quiero administrar internet") ||
            texto.includes("quiero administrar mi isp") ||
            texto.includes("quiero gestionar el isp") ||

            texto.includes("abre gestion isp") ||
            texto.includes("ir a gestion isp") ||
            texto.includes("llevame a gestion isp") ||

            texto.includes("abre el panel isp") ||
            texto.includes("llevame al panel isp") ||
            texto.includes("ir al panel isp") ||

            texto.includes("quiero administrar el negocio") ||
            texto.includes("vamos a administrar el negocio") ||
            texto.includes("gestion del negocio") ||
            texto.includes("administracion del negocio") ||

            texto.includes("configurar mi isp") ||
            texto.includes("configurar el isp") ||
            texto.includes("administrar mi red isp")
        ) {

            responderDante(
                "Claro. Abriendo administración ISP."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirAdministracionISP();
                },
                500
            );

            return;
        }

        // ========================================================
        // IR A USUARIOS
        // ========================================================

        if (
            texto === "usuarios" ||
            texto === "usuario" ||
            texto === "administrar usuarios" ||
            texto === "gestion de usuarios" ||
            texto === "cuentas de usuarios" ||
            texto === "personal" ||

            texto.includes("llevame a usuarios") ||
            texto.includes("ir a usuarios") ||
            texto.includes("abre usuarios") ||
            texto.includes("abrir usuarios") ||
            texto.includes("ver usuarios") ||
            texto.includes("mostrar usuarios") ||

            texto.includes("quiero ver los usuarios") ||
            texto.includes("quiero revisar los usuarios") ||
            texto.includes("revisar usuarios") ||
            texto.includes("administrar usuarios") ||
            texto.includes("gestionar usuarios") ||

            texto.includes("crear un usuario") ||
            texto.includes("crear usuario") ||
            texto.includes("nuevo usuario") ||
            texto.includes("agregar un usuario") ||
            texto.includes("agregar usuario") ||
            texto.includes("registrar un usuario") ||
            texto.includes("registrar usuario") ||

            texto.includes("quiero crear un usuario") ||
            texto.includes("quiero agregar un usuario") ||
            texto.includes("quiero registrar un usuario") ||

            texto.includes("ver las cuentas") ||
            texto.includes("cuentas de usuarios") ||
            texto.includes("administrar cuentas") ||

            texto.includes("ver el personal") ||
            texto.includes("administrar personal") ||
            texto.includes("gestionar personal") ||

            texto.includes("ver accesos") ||
            texto.includes("administrar accesos") ||
            texto.includes("gestionar accesos") ||

            texto.includes("ver permisos de usuarios") ||
            texto.includes("administrar permisos") ||
            texto.includes("permisos de usuarios")
        ) {

            responderDante(
                "Claro. Abriendo administración de usuarios."
            );

            setAbierto(false);

            setTimeout(() => {
                onAbrirUsuarios();
            }, 500);

            return;
        }

        // ========================================================
        // IR A PROFORMAS
        // ========================================================

        if (
            texto === "proformas" ||
            texto === "proforma" ||
            texto === "crear proforma" ||
            texto === "crear una proforma" ||
            texto === "nueva proforma" ||
            texto.includes("llevame a proformas") ||
            texto.includes("ir a proformas") ||
            texto.includes("abre proformas") ||
            texto.includes("Abre proformas") ||
            texto.includes("abrir proformas") ||
            texto.includes("ver proformas") ||
            texto.includes("mostrar proformas") ||
            texto.includes("quiero crear una proforma") ||
            texto.includes("quiero hacer una proforma") ||
            texto.includes("hacer una proforma")
        ) {

            responderDante(
                "Claro. Abriendo proformas."
            );

            setAbierto(false);

            setTimeout(
                () => {
                    onAbrirProformas();
                },
                500
            );

            return;
        }

        // ========================================================
        // DANTE - BUSCAR CLIENTE REAL
        // ========================================================

        if (
            texto.startsWith("busca al cliente ") ||
            texto.startsWith("buscar al cliente ") ||
            texto.startsWith("busca cliente ") ||
            texto.startsWith("buscar cliente ") ||

            texto.startsWith("busca a ") ||
            texto.startsWith("buscar a ") ||
            texto.startsWith("buscame a ") ||

            texto.startsWith("encuentra al cliente ") ||
            texto.startsWith("encuentra cliente ") ||
            texto.startsWith("encuentra a ") ||

            texto.startsWith("localiza al cliente ") ||
            texto.startsWith("localiza cliente ") ||

            texto.startsWith("consulta al cliente ") ||
            texto.startsWith("consulta cliente ")
        ) {

            let terminoBusqueda =
                texto;


            const prefijos = [
                "busca al cliente ",
                "buscar al cliente ",
                "busca cliente ",
                "buscar cliente ",

                "busca a ",
                "buscar a ",

                "encuentra al cliente ",
                "encuentra cliente ",
                "encuentra a ",

                "localiza al cliente ",
                "localiza cliente ",

                "consulta al cliente ",
                "consulta cliente ",
            ];


            for (
                const prefijo of prefijos
            ) {

                if (
                    terminoBusqueda.startsWith(
                        prefijo
                    )
                ) {

                    terminoBusqueda =
                        terminoBusqueda
                            .slice(
                                prefijo.length
                            )
                            .trim();

                    break;
                }
            }


            if (
                !terminoBusqueda
            ) {

                responderDante(
                    "Indícame el nombre, cédula, teléfono o IP del cliente."
                );

                return;
            }

            void buscarClienteDante(
                terminoBusqueda
            );


            return;
        }

        // ========================================================
        // DANTE - INFORMACIÓN DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "informacion del cliente" ||
            texto === "informacion de ese cliente" ||
            texto === "informacion de este cliente" ||

            texto === "dame la informacion del cliente" ||
            texto === "dame informacion del cliente" ||
            texto === "dame la informacion de ese cliente" ||
            texto === "dame informacion de ese cliente" ||

            texto === "datos del cliente" ||
            texto === "datos de ese cliente" ||
            texto === "datos de este cliente" ||

            texto === "dame los datos del cliente" ||
            texto === "dame los datos de ese cliente" ||

            texto === "consulta el cliente" ||
            texto === "consulta ese cliente" ||

            texto === "revisa el cliente" ||
            texto === "revisa ese cliente" ||

            texto === "como esta el cliente" ||
            texto === "como esta ese cliente" ||
            texto === "como esta el" ||

            texto === "estado del cliente" ||
            texto === "estado de ese cliente" ||

            texto === "dame su informacion" ||
            texto === "dame sus datos" ||

            texto === "informacion de el" ||
            texto === "informacion de ella" ||

            texto === "que sabes de el" ||
            texto === "que sabes de ella" ||

            texto.includes("dime la informacion de ese cliente") ||
            texto.includes("dime los datos de ese cliente") ||
            texto.includes("quiero ver la informacion de ese cliente") ||
            texto.includes("quiero saber como esta ese cliente")

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado. Indícame primero qué cliente deseas consultar."
                );

                return;
            }


            actualizarContextoDante({

                tema:
                    "CLIENTE",

                entidadId:
                    cliente.clienteId,

                entidadNombre:
                    `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                        .trim(),

                ultimaIntencion:
                    "CONSULTAR_PERFIL_CLIENTE",

            });


            void consultarPerfilClienteDante();

            return;
        }

        // ========================================================
        // DANTE - PING / ESTADO DE CONEXIÓN DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "hazle ping" ||
            texto === "haz ping" ||
            texto === "hacer ping" ||

            texto === "hazle ping al cliente" ||
            texto === "haz ping al cliente" ||

            texto === "hazle ping a el" ||
            texto === "hazle ping a ella" ||

            texto === "revisa la conexion" ||
            texto === "revisa su conexion" ||
            texto === "revisar conexion" ||

            texto === "consulta la conexion" ||
            texto === "consulta su conexion" ||

            texto === "como esta la conexion" ||
            texto === "como esta conectado" ||

            texto === "esta conectado" ||
            texto === "esta conectado el cliente" ||
            texto === "esta conectado el" ||

            texto === "esta online" ||
            texto === "esta offline" ||

            texto === "tiene internet" ||
            texto === "ese cliente tiene internet" ||
            texto === "el tiene internet" ||
            texto === "ella tiene internet" ||

            texto === "revisa el internet del cliente" ||
            texto === "revisa su internet" ||

            texto === "como esta su internet" ||
            texto === "como esta su conexion" ||

            texto.includes("hazle un ping") ||
            texto.includes("hazle un pin") ||
            texto.includes("haz un pin") ||
            texto.includes("haz un ping al cliente") ||
            texto.includes("quiero saber si esta conectado") ||
            texto.includes("quiero saber si el cliente esta conectado") ||
            texto.includes("quiero revisar la conexion del cliente")

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado. Indícame primero qué cliente deseas consultar."
                );

                return;
            }


            actualizarContextoDante({

                tema:
                    "CLIENTE",

                entidadId:
                    cliente.clienteId,

                entidadNombre:
                    `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                        .trim(),

                ultimaIntencion:
                    "PING_CLIENTE",

            });


            void hacerPingClienteDante();

            return;
        }

        // ========================================================
        // DANTE - MENSUALIDADES PENDIENTES DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "cuanto debe" ||
            texto === "cuanto debe el" ||
            texto === "cuanto debe ella" ||
            texto === "cuanto debe ese cliente" ||

            texto === "que debe" ||
            texto === "tiene deuda" ||
            texto === "tiene deudas" ||

            texto === "tiene mensualidades pendientes" ||
            texto === "cuantas mensualidades debe" ||
            texto === "cuantas mensualidades tiene pendientes" ||
            texto === "cuantos pagos tiene pendientes" ||

            texto === "tiene pagos pendientes" ||
            texto === "pagos pendientes" ||
            texto === "mensualidades pendientes"

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado."
                );

                return;
            }


            const perfil =
                await obtenerPerfilActualDante();


            if (!perfil) {

                responderDante(
                    "No pude consultar la información de pagos de este cliente."
                );

                return;
            }


            const pendientes =
                Number(
                    perfil.facturacion?.totalPendientes ||
                    0
                );


            const nombre =
                `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                    .trim();


            cambiarTemaDante(
                "PAGOS",
                {
                    conservarCliente: true,
                    ultimaIntencion:
                        "CONSULTAR_DEUDA_CLIENTE",
                }
            );


            if (pendientes === 0) {

                responderDante(
                    `${nombre} no tiene mensualidades pendientes.`
                );

                return;
            }


            if (pendientes === 1) {

                responderDante(
                    `${nombre} tiene una mensualidad pendiente.`
                );

                return;
            }


            responderDante(
                `${nombre} tiene ${pendientes} mensualidades pendientes.`
            );

            return;
        }

        // ========================================================
        // DANTE - COMPROMISO DE PAGO DE CLIENTE
        // ========================================================

        if (
            texto.includes("paga en") ||
            texto.includes("pagara en") ||
            texto.includes("va a pagar en") ||
            texto.includes("se compromete a pagar en")
        ) {

            const cliente =
                servicioClienteDanteRef.current;


            if (!cliente) {

                responderDante(
                    "Primero necesito saber de qué cliente estamos hablando."
                );

                return;
            }


            const coincidenciaDias =
                texto.match(
                    /(\d+)\s+dias?/
                );


            if (!coincidenciaDias) {

                responderDante(
                    "Entendí que existe un compromiso de pago, pero necesito saber en cuántos días."
                );

                return;
            }


            const dias =
                Number(
                    coincidenciaDias[1]
                );

            cambiarTemaDante(
                "PAGOS",
                {
                    conservarCliente: true,
                    ultimaIntencion:
                        "GUARDAR_COMPROMISO_PAGO",
                }
            );

            await guardarCompromisoPagoDante(
                cliente,
                dias
            );

            return;
        }


        // ========================================================
        // DANTE - TICKETS DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "cuantos tickets tiene" ||
            texto === "cuantos tickets tiene el" ||
            texto === "cuantos tickets tiene ella" ||
            texto === "cuantos tickets tiene ese cliente" ||

            texto === "tiene tickets" ||
            texto === "tiene tickets abiertos" ||
            texto === "tickets abiertos" ||

            texto === "tiene problemas reportados" ||
            texto === "tiene soporte pendiente"

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado."
                );

                return;
            }


            const perfil =
                await obtenerPerfilActualDante();


            if (!perfil) {

                responderDante(
                    "No pude consultar los tickets de este cliente."
                );

                return;
            }


            const tickets =
                Number(
                    perfil.tickets?.resumen?.abiertos ||
                    0
                );


            const nombre =
                `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                    .trim();


            actualizarContextoDante({

                tema:
                    "CLIENTE",

                entidadId:
                    cliente.clienteId,

                entidadNombre:
                    nombre,

                ultimaIntencion:
                    "CONSULTAR_TICKETS_CLIENTE",

            });


            if (tickets === 0) {

                responderDante(
                    `${nombre} no tiene tickets abiertos.`
                );

                return;
            }


            if (tickets === 1) {

                responderDante(
                    `${nombre} tiene un ticket abierto.`
                );

                return;
            }


            responderDante(
                `${nombre} tiene ${tickets} tickets abiertos.`
            );

            return;
        }


        // ========================================================
        // DANTE - PLAN DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "cual es su plan" ||
            texto === "que plan tiene" ||
            texto === "que plan tiene el" ||
            texto === "que plan tiene ella" ||
            texto === "plan del cliente" ||
            texto === "dime su plan"

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado."
                );

                return;
            }


            const perfil =
                await obtenerPerfilActualDante();


            if (!perfil) {

                responderDante(
                    "No pude consultar el plan de este cliente."
                );

                return;
            }


            const plan =
                perfil.plan?.nombrePlan ||
                "sin plan asignado";


            const bajada =
                perfil.plan?.velocidadBajada;


            const subida =
                perfil.plan?.velocidadSubida;


            let respuesta =
                `${cliente.nombres} ${cliente.apellidos} tiene el plan ${plan}.`;


            if (
                bajada ||
                subida
            ) {

                respuesta +=
                    ` Velocidad ${bajada || "-"} de bajada y ${subida || "-"} de subida.`;
            }


            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion: "CONSULTAR_PLAN_CLIENTE",
            });


            responderDante(
                respuesta
            );

            return;
        }

        // ========================================================
        // DANTE - IP DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "cual es su ip" ||
            texto === "dime su ip" ||
            texto === "que ip tiene" ||
            texto === "ip del cliente" ||
            texto === "cual es la ip del cliente"

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado."
                );

                return;
            }


            const perfil =
                await obtenerPerfilActualDante();


            const ip =
                perfil?.servicio?.ipCliente ||
                cliente.ipCliente ||
                null;


            if (!ip) {

                responderDante(
                    `${cliente.nombres} ${cliente.apellidos} no tiene una IP registrada.`
                );

                return;
            }


            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion: "CONSULTAR_IP_CLIENTE",
            });


            responderDante(
                `La IP de ${cliente.nombres} ${cliente.apellidos} es ${ip}.`
            );

            return;
        }

        // ========================================================
        // DANTE - ESTADO DEL SERVICIO DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "esta activo" ||
            texto === "esta activo el servicio" ||
            texto === "su servicio esta activo" ||
            texto === "estado del servicio" ||
            texto === "como esta su servicio" ||
            texto === "que estado tiene el servicio"

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado."
                );

                return;
            }


            const perfil =
                await obtenerPerfilActualDante();


            const estado =
                perfil?.servicio?.estadoServicio ||
                cliente.estadoServicio ||
                "sin estado";


            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion: "CONSULTAR_ESTADO_SERVICIO",
            });


            responderDante(
                `El servicio de ${cliente.nombres} ${cliente.apellidos} está ${estado}.`
            );

            return;
        }

        // ====================================================
        // INICIAR MONITOREO DE RED WIRELESS
        // ====================================================

        const iniciarMonitoreoRed =
            comando.includes("iniciar monitoreo") ||
            comando.includes("inicia monitoreo") ||
            comando.includes("iniciar monitoreo de red") ||
            comando.includes("inicia monitoreo de red") ||
            comando.includes("realizar monitoreo") ||
            comando.includes("realiza monitoreo") ||
            comando.includes("monitorear nuestra red") ||
            comando.includes("monitorea nuestra red") ||
            comando.includes("revisar nuestra red") ||
            comando.includes("revisa nuestra red") ||
            comando.includes("escanear nuestra red") ||
            comando.includes("escanea nuestra red") ||
            comando.includes("analizar nuestra red") ||
            comando.includes("analiza nuestra red") ||
            comando.includes("monitorear red wireless") ||
            comando.includes("revisar red wireless");


        if (
            iniciarMonitoreoRed
        ) {

            if (
                monitoreoRedDanteRef.current
            ) {

                responderDante(
                    "El monitoreo de red ya se encuentra activo."
                );

                return;
            }

            monitoreoRedDanteRef.current =
                true;


            cambiarTemaDante(
                "WIRELESS",
                {
                    conservarCliente: false,
                    ultimaIntencion:
                        "INICIAR_MONITOREO_WIRELESS",
                }
            );


            responderDante(
                "De acuerdo. Modo de monitoreo de red activado. Selecciona un equipo de la red neuronal y te indicaré su estado."
            );


            console.log(
                "DANTE: MODO MONITOREO DE RED ACTIVADO"
            );


            return;
        }

        // ====================================================
        // CERRAR MONITOREO DE RED WIRELESS
        // ====================================================

        const cerrarMonitoreoRed =
            comando.includes("cerrar monitoreo") ||
            comando.includes("cierra monitoreo") ||
            comando.includes("cerrar monitoreo de red") ||
            comando.includes("cierra el monitoreo") ||
            comando.includes("finalizar monitoreo") ||
            comando.includes("finaliza monitoreo") ||
            comando.includes("terminar monitoreo") ||
            comando.includes("termina el monitoreo") ||
            comando.includes("detener monitoreo") ||
            comando.includes("deten el monitoreo") ||
            comando.includes("salir del monitoreo") ||
            comando.includes("sal del monitoreo de red");


        if (
            cerrarMonitoreoRed
        ) {

            if (
                !monitoreoRedDanteRef.current
            ) {

                responderDante(
                    "El monitoreo de red no se encuentra activo."
                );

                return;
            }


            monitoreoRedDanteRef.current =
                false;

            cambiarTemaDante(
                "GENERAL",
                {
                    conservarCliente: false,
                    ultimaIntencion:
                        "CERRAR_MONITOREO_WIRELESS",
                }
            );

            console.log(
                "DANTE: MODO MONITOREO DE RED CERRADO"
            );


            responderDante(
                "De acuerdo. Monitoreo de red finalizado. Regresando al modo normal."
            );


            return;
        }
        // ========================================================
        // DANTE - CREAR EVENTO DE AGENDA / RECORDATORIO
        // ========================================================

        const esComandoAgenda =

            texto.startsWith("agenda ") ||
            texto.startsWith("agendame ") ||
            texto.startsWith("agendar ") ||

            texto.includes("quiero agendar") ||
            texto.includes("quiero que agendes") ||
            texto.includes("puedes agendar") ||
            texto.includes("necesito agendar") ||

            texto.startsWith("programa ") ||
            texto.startsWith("programame ") ||
            texto.includes("quiero programar") ||

            texto.startsWith("recuerdame ") ||
            texto.includes("quiero que me recuerdes") ||
            texto.includes("necesito que me recuerdes") ||

            texto.startsWith("recordatorio ") ||
            texto.startsWith("crea un recordatorio") ||
            texto.startsWith("pon un recordatorio") ||
            texto.startsWith("ponme un recordatorio") ||

            texto.startsWith("anota para ") ||
            texto.startsWith("anota ");


        if (esComandoAgenda) {

            const resultado =
                interpretarFechaAgendaDante(
                    limpio
                );


            // ====================================================
            // NO INDICÓ FECHA
            // ====================================================

            if (
                !resultado.encontroFecha
            ) {

                agendaPendienteDanteRef.current = {

                    textoOriginal:
                        limpio,

                    fecha:
                        null,

                    esperando:
                        "FECHA",

                };


                actualizarContextoDante({

                    tema:
                        "AGENDA",

                    ultimaIntencion:
                        "CREAR_EVENTO_AGENDA",

                    esperandoRespuesta:
                        true,

                    datoPendiente:
                        "FECHA",

                });


                responderDante(
                    "¿Para qué día deseas que lo agende?"
                );


                return;
            }


            // ====================================================
            // INDICÓ FECHA PERO NO HORA
            // ====================================================

            if (
                !resultado.encontroHora
            ) {

                agendaPendienteDanteRef.current = {

                    textoOriginal:
                        limpio,

                    fecha:
                        resultado.fecha,

                    esperando:
                        "HORA",

                };


                actualizarContextoDante({

                    tema:
                        "AGENDA",

                    ultimaIntencion:
                        "CREAR_EVENTO_AGENDA",

                    esperandoRespuesta:
                        true,

                    datoPendiente:
                        "HORA",

                });


                responderDante(
                    "¿A qué hora deseas que te lo recuerde?"
                );


                return;
            }


            if (
                !resultado.fecha
            ) {

                responderDante(
                    "No pude identificar correctamente la fecha."
                );

                return;
            }


            if (
                resultado.fecha.getTime() <=
                Date.now()
            ) {

                responderDante(
                    "La fecha y hora indicadas ya pasaron."
                );

                return;
            }


            cambiarTemaDante(
                "AGENDA",
                {
                    conservarCliente:
                        false,

                    ultimaIntencion:
                        "CREAR_EVENTO_AGENDA",
                }
            );


            await guardarEventoAgendaDante(
                limpio,
                resultado.fecha
            );


            agendaPendienteDanteRef.current =
                null;


            return;
        }

        // ========================================================
        // INFORMACIÓN / COMANDO NO DISPONIBLE
        // ========================================================

        responderDante(
            "Aún no está procesada esa información. Solicítalo a mi creador Jose. "
        );

        console.log(
            "DANTE: solicitud fuera de los comandos disponibles:",
            limpio
        );

        return;
    }

    // ========================================================
    // DANTE - INTERPRETAR FECHA Y HORA DE AGENDA
    // ========================================================

    function interpretarFechaAgendaDante(
        textoOriginal: string
    ): ResultadoFechaAgendaDante {

        const texto =
            normalizarTextoDante(
                textoOriginal
            );


        const ahora =
            new Date();


        let encontroFecha =
            false;


        let encontroHora =
            false;


        let anio =
            ahora.getFullYear();


        let mes =
            ahora.getMonth();


        let dia =
            ahora.getDate();


        let hora =
            0;


        let minutos =
            0;


        // ====================================================
        // HOY
        // ====================================================

        if (
            texto.includes("hoy")
        ) {

            encontroFecha =
                true;
        }


        // ====================================================
        // MAÑANA
        // ====================================================

        if (
            texto.includes("manana")
        ) {

            const manana =
                new Date(ahora);


            manana.setDate(
                manana.getDate() + 1
            );


            anio =
                manana.getFullYear();

            mes =
                manana.getMonth();

            dia =
                manana.getDate();


            encontroFecha =
                true;
        }


        // ====================================================
        // EN X DÍAS
        // ====================================================

        const coincidenciaDias =
            texto.match(
                /en\s+(\d+)\s+dias?/
            );


        if (
            coincidenciaDias
        ) {

            const futura =
                new Date(ahora);


            futura.setDate(
                futura.getDate() +
                Number(
                    coincidenciaDias[1]
                )
            );


            anio =
                futura.getFullYear();

            mes =
                futura.getMonth();

            dia =
                futura.getDate();


            encontroFecha =
                true;
        }


        // ====================================================
        // MESES
        // ====================================================

        const meses:
            Record<string, number> = {

            enero: 0,
            febrero: 1,
            marzo: 2,
            abril: 3,
            mayo: 4,
            junio: 5,
            julio: 6,
            agosto: 7,
            septiembre: 8,
            octubre: 9,
            noviembre: 10,
            diciembre: 11,

        };


        // ====================================================
        // DÍA + MES
        // ====================================================

        const coincidenciaFecha =
            texto.match(
                /(?:dia\s+|el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/
            );


        if (
            coincidenciaFecha
        ) {

            dia =
                Number(
                    coincidenciaFecha[1]
                );


            mes =
                meses[
                coincidenciaFecha[2]
                ];


            encontroFecha =
                true;


            let fechaTemporal =
                new Date(
                    anio,
                    mes,
                    dia
                );


            // Si ya pasó este año,
            // usamos el próximo.
            if (
                fechaTemporal.getTime() <
                new Date(
                    ahora.getFullYear(),
                    ahora.getMonth(),
                    ahora.getDate()
                ).getTime()
            ) {

                anio++;
            }
        }


        // ====================================================
        // HORA
        // ====================================================

        const coincidenciaHora =
            texto.match(
                /(?:a\s+las?|a\s+la)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/
            );


        if (
            coincidenciaHora
        ) {

            hora =
                Number(
                    coincidenciaHora[1]
                );


            minutos =
                coincidenciaHora[2]
                    ? Number(
                        coincidenciaHora[2]
                    )
                    : 0;


            const periodo =
                coincidenciaHora[3];


            if (
                periodo === "pm" &&
                hora < 12
            ) {

                hora += 12;
            }


            if (
                periodo === "am" &&
                hora === 12
            ) {

                hora = 0;
            }


            encontroHora =
                true;
        }


        // ====================================================
        // SIN FECHA
        // ====================================================

        if (
            !encontroFecha
        ) {

            return {

                fecha:
                    null,

                encontroFecha:
                    false,

                encontroHora,

            };
        }


        // ====================================================
        // FECHA EXISTE PERO NO HORA
        // Conservamos día/mes pero aún NO es definitiva
        // ====================================================

        const fecha =
            new Date(
                anio,
                mes,
                dia,
                hora,
                minutos,
                0,
                0
            );


        return {

            fecha,

            encontroFecha,

            encontroHora,

        };
    }
    // ========================================================
    // DANTE - VERIFICAR CONTEXTO CONVERSACIONAL RECIENTE
    // ========================================================

    function contextoDanteEstaActivo(
        segundos = 45
    ) {

        const contexto =
            contextoDanteRef.current;


        if (
            contexto.tema === "GENERAL"
        ) {

            return false;
        }


        const diferencia =
            Date.now() -
            contexto.actualizadoEn;


        return (
            diferencia <=
            segundos * 1000
        );
    }
    // ========================================================
    // RESPUESTA AMIGABLE DE ACTIVACIÓN
    // ========================================================

    function obtenerSaludoDante(
        textoOriginal: string
    ): string {

        const texto =
            normalizarTextoDante(
                textoOriginal
            );


        // ====================================================
        // DANTE, ¿ESTÁS?
        // ====================================================

        if (
            texto.includes("dante estas") ||
            texto.includes("dante estas ahi") ||
            texto.includes("dante ahi estas")
        ) {

            return "Sí, aquí estoy. ¿Qué vamos a hacer?";
        }


        // ====================================================
        // DANTE, ¿ME ESCUCHAS?
        // ====================================================

        if (
            texto.includes("dante me escuchas") ||
            texto.includes("dante escuchas")
        ) {

            return "Sí, te escucho. Dime.";
        }


        // ====================================================
        // HOLA DANTE
        // ====================================================

        if (
            texto.includes("hola dante") ||
            texto.includes("buenas dante") ||
            texto.includes("buen dia dante")
        ) {

            return "Hola, aquí estoy. ¿Qué vamos a hacer?";
        }


        // ====================================================
        // NECESITO TU AYUDA
        // ====================================================

        if (
            texto.includes("dante necesito tu ayuda") ||
            texto.includes("dante ayudame") ||
            texto.includes("dante necesito ayuda")
        ) {

            return "Claro, dime qué necesitas.";
        }


        // ====================================================
        // VAMOS A TRABAJAR
        // ====================================================

        if (
            texto.includes("dante vamos a trabajar") ||
            texto.includes("dante trabajemos") ||
            texto.includes("dante vamos a comenzar")
        ) {

            return "Listo, dime por dónde empezamos.";
        }


        // ====================================================
        // SOLO DANTE
        // ====================================================

        if (
            texto === "dante"
        ) {

            return "Sí, dime. Aquí estoy, te escucho.";
        }


        // ====================================================
        // RESPUESTA GENERAL
        // ====================================================

        return "Sí, aquí estoy. Te escucho.";
    }

    // ========================================================
    // ANALIZAR TEXTO ESCUCHADO
    // ========================================================

    function analizarTextoDante(
        textoOriginal: string
    ) {

        const texto =
            textoOriginal.trim();

        if (!texto) {
            return;
        }

        // ====================================================
        // DANTE - EVITAR AUTOESCUCHA
        // ====================================================

        if (danteHablandoRef.current) {

            console.log(
                "DANTE: reconocimiento ignorado mientras habla"
            );

            return;
        }

        const normalizado =
            normalizarTextoDante(texto);

        console.log(
            "DANTE ESCUCHÓ:",
            texto
        );


        // ====================================================
        // DANTE - DETECTAR SI ES COMANDO NUEVO O CONTINUACIÓN
        // ====================================================

        const contexto =
            contextoDanteRef.current;

        const ahora =
            Date.now();

        const tiempoDesdeUltimoContexto =
            ahora -
            (
                contexto.actualizadoEn ||
                0
            );

        // ====================================================
        // DANTE - CONTINUACIÓN CONTROLADA
        // ====================================================

        // Frases seguras que pueden continuar una conversación
        // SIN volver a decir "Dante".
        const hayClienteActual =
            !!servicioClienteDanteRef.current;


        const esContinuacionCliente =

            hayClienteActual &&

            (
                normalizado === "hazle ping" ||
                normalizado === "haz ping" ||
                normalizado === "hazle un ping" ||
                normalizado === "hazle un pin" ||

                normalizado === "revisa su conexion" ||
                normalizado === "revisa la conexion" ||
                normalizado === "consulta su conexion" ||
                normalizado === "como esta su conexion" ||
                normalizado === "como esta su internet" ||
                normalizado === "tiene internet" ||
                normalizado === "esta conectado" ||

                normalizado === "dame su informacion" ||
                normalizado === "dame sus datos" ||
                normalizado === "como esta el" ||
                normalizado === "como esta ella" ||
                normalizado === "como esta ese cliente" ||

                normalizado === "cuanto debe" ||
                normalizado === "tiene deuda" ||
                normalizado === "tiene mensualidades pendientes" ||
                normalizado === "cuantas mensualidades debe" ||
                normalizado === "tiene pagos pendientes" ||

                normalizado === "cuantos tickets tiene" ||
                normalizado === "tiene tickets abiertos" ||

                normalizado === "cual es su plan" ||
                normalizado === "que plan tiene" ||
                normalizado === "dime su plan" ||

                normalizado === "cual es su ip" ||
                normalizado === "dime su ip" ||
                normalizado === "que ip tiene" ||

                normalizado === "esta activo" ||
                normalizado === "esta activo el servicio" ||
                normalizado === "como esta su servicio" ||
                normalizado === "estado del servicio"
            );

        // ====================================================
        // PUEDE HABLAR SIN DECIR DANTE SI:
        // 1. DANTE ESTÁ ESPERANDO UNA RESPUESTA
        // 2. ES UNA CONTINUACIÓN SEGURA DEL CLIENTE ACTUAL
        // ====================================================

        const puedeContinuarSinDante =

            contexto.esperandoRespuesta === true ||
            esContinuacionCliente;


        const posicion =
            normalizado.indexOf("dante");


        // ====================================================
        // NO DIJO "DANTE"
        // ====================================================

        if (posicion === -1) {

            if (!puedeContinuarSinDante) {

                console.log(
                    "DANTE: frase ignorada porque no es una continuación válida:",
                    normalizado
                );

                return;
            }


            // ====================================================
            // PROTECCIÓN CONTRA AUTOESCUCHA
            // ====================================================

            if (danteHablandoRef.current) {

                console.log(
                    "DANTE: ignorando audio porque está hablando"
                );

                return;
            }


            console.log(
                "DANTE: continuación contextual detectada:",
                texto
            );


            void procesarComandoDante(
                texto
            );

            return;
        }
        const despuesDeDante =
            normalizado
                .substring(
                    posicion + "dante".length
                )
                .trim();




        // ====================================================
        // SALUDOS / ACTIVACIONES AMIGABLES
        // ====================================================

        const esSaludo =
            despuesDeDante === "" ||
            despuesDeDante === "estas" ||
            despuesDeDante === "estas ahi" ||
            despuesDeDante === "ahi estas" ||
            despuesDeDante === "me escuchas" ||
            despuesDeDante === "escuchas" ||
            normalizado === "hola dante" ||
            normalizado === "buenas dante" ||
            normalizado === "buen dia dante" ||
            normalizado.includes(
                "dante necesito tu ayuda"
            ) ||
            normalizado.includes(
                "dante necesito ayuda"
            ) ||
            normalizado.includes(
                "dante ayudame"
            ) ||
            normalizado.includes(
                "dante vamos a trabajar"
            ) ||
            normalizado.includes(
                "dante trabajemos"
            );


        if (esSaludo) {

            responderDante(
                obtenerSaludoDante(texto)
            );

            return;
        }

        // ========================================================
        // COMANDO: DANTE PRESÉNTATE
        // ========================================================

        if (
            normalizado.includes("quien eres") ||
            normalizado.includes("preséntate") ||
            normalizado.includes("dime quien eres")
        ) {

            responderDante(
                "Hola, soy Dante, tu asistente técnico de NETCOMP. " +
                "Estoy diseñado para ayudarte en la gestión y supervisión de la red. " +
                "Puedo consultar routers, revisar conexiones, realizar pruebas de ping, " +
                "buscar clientes por dirección IP, comprobar latencia y señal, " +
                "consultar interfaces de MikroTik y ejecutar acciones técnicas autorizadas. " +
                "Mi objetivo es facilitar tu trabajo diario y ayudarte a detectar y resolver problemas de red de una forma más rápida. " +
                "Estoy en pleno desarrollo, mi crador me alimentara paso a paso para no cometer errores y ayudarte." +
                "Y Tengo Protocolos de Seguridad muy Altos" +
                "Dime qué necesitas y comenzamos."
            );

            return;
        }
        if (
            normalizado === "presentate" ||
            normalizado === "presentarte" ||
            normalizado.includes("presentate") ||
            normalizado.includes("puedes presentarte")
        ) {

            responderDante(
                "Hola, soy Dante V1, el asistente inteligente de NETCOMP RF. Fui creado por el Ing. Jose Zambrano para ayudarte a interactuar de forma más rápida y sencilla con el sistema. Actualmente estoy en modo de desarrollo, aprendiendo nuevas funciones y ampliando mis capacidades. Puedo interpretar tus instrucciones y ayudarte con las herramientas que estén habilitadas para tu usuario. Soy Dante. Dime qué necesitas y comenzamos."
            );

            return;
        }


        // ====================================================
        // DANTE + COMANDO REAL
        // ====================================================

        if (despuesDeDante) {

            procesarComandoDante(
                despuesDeDante
            );
            return;
        }
    }


    // ========================================================
    // INICIAR MICRÓFONO
    // ========================================================
    function detenerMedidorMicrofono() {

        if (animationFrameRef.current) {

            cancelAnimationFrame(
                animationFrameRef.current
            );

            animationFrameRef.current = null;
        }


        if (streamAudioRef.current) {

            streamAudioRef.current
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            streamAudioRef.current = null;
        }


        if (audioContextRef.current) {

            audioContextRef.current.close();

            audioContextRef.current = null;
        }


        setNivelMicrofono(0);
    }
    async function iniciarMedidorMicrofono() {

        try {

            detenerMedidorMicrofono();
            const dispositivos =
                await navigator.mediaDevices.enumerateDevices();

            const entradasAudio =
                dispositivos.filter(
                    dispositivo =>
                        dispositivo.kind === "audioinput"
                );

            console.log(
                "🎤 ENTRADAS DE AUDIO DISPONIBLES:",
                entradasAudio.map(d => ({
                    label: d.label,
                    deviceId: d.deviceId,
                }))
            );

            const microfonoReal =
                entradasAudio.find(
                    dispositivo => {

                        const nombre =
                            dispositivo.label
                                .toLowerCase();

                        return (
                            !nombre.includes("mezcla estéreo") &&
                            !nombre.includes("stereo mix") &&
                            !nombre.includes("mezcla estereo")
                        );
                    }
                );

            if (!microfonoReal) {

                throw new Error(
                    "No se encontró un micrófono físico."
                );
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({

                    audio: {

                        deviceId: {
                            exact:
                                microfonoReal.deviceId,
                        },

                        echoCancellation: true,

                        noiseSuppression: true,

                        autoGainControl: true,

                        channelCount: 1,
                    },
                });


            streamAudioRef.current =
                stream;


            const track =
                stream.getAudioTracks()[0];


            console.log(
                "🎤 MICRÓFONO DANTE:",
                {
                    nombre:
                        track?.label,

                    enabled:
                        track?.enabled,

                    muted:
                        track?.muted,

                    readyState:
                        track?.readyState,

                    settings:
                        track?.getSettings(),
                }
            );


            const AudioContextClass =
                window.AudioContext ||
                (window as any).webkitAudioContext;


            const audioContext =
                new AudioContextClass();


            audioContextRef.current =
                audioContext;


            if (
                audioContext.state ===
                "suspended"
            ) {

                await audioContext.resume();
            }


            const source =
                audioContext.createMediaStreamSource(
                    stream
                );


            const analyser =
                audioContext.createAnalyser();


            analyser.fftSize =
                2048;


            analyser.smoothingTimeConstant =
                0.1;


            analyserRef.current =
                analyser;


            source.connect(
                analyser
            );


            const data =
                new Uint8Array(
                    analyser.fftSize
                );


            function medir() {

                if (
                    !analyserRef.current
                ) {
                    return;
                }


                analyserRef.current
                    .getByteTimeDomainData(
                        data
                    );


                let suma =
                    0;


                for (
                    let i = 0;
                    i < data.length;
                    i++
                ) {

                    const muestra =
                        (
                            data[i] -
                            128
                        ) /
                        128;


                    suma +=
                        muestra *
                        muestra;
                }


                const rms =
                    Math.sqrt(
                        suma /
                        data.length
                    );


                /*
                 * Amplificación VISUAL.
                 * No modifica el audio real.
                 */

                const nivel =
                    Math.min(
                        100,
                        Math.round(
                            rms * 1200
                        )
                    );


                setNivelMicrofono(
                    nivel
                );


                animationFrameRef.current =
                    requestAnimationFrame(
                        medir
                    );
            }


            medir();


        } catch (error) {

            console.error(
                "❌ Error medidor Dante:",
                error
            );


            setErrorMicrofono(
                "No se pudo obtener audio del micrófono."
            );
        }
    }

    async function iniciarMicrofono() {

        setErrorMicrofono("");
        // ====================================================
        // ASEGURAR QUE DANTE NO QUEDE BLOQUEADO
        // ====================================================

        danteHablandoRef.current =
            false;

        if (typeof window === "undefined") {
            return;
        }

        // ====================================================
        // VERIFICAR CONTEXTO SEGURO
        // ====================================================

        if (!window.isSecureContext) {

            const mensaje =
                "El micrófono requiere HTTPS o localhost.";

            console.error(mensaje);

            setErrorMicrofono(mensaje);

            setRespuestaDante(mensaje);

            return;
        }


        // ====================================================
        // PEDIR PERMISO REAL AL MICRÓFONO
        // ====================================================

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });


            console.log(
                "✅ Permiso de micrófono concedido"
            );

            const tracks = stream.getAudioTracks();

            console.log(
                "MICRÓFONOS ACTIVOS:",
                tracks.map((track) => ({
                    label: track.label,
                    enabled: track.enabled,
                    muted: track.muted,
                    readyState: track.readyState,
                }))
            );

            // Solo necesitábamos comprobar acceso.
            // SpeechRecognition utilizará el micrófono.

            stream
                .getTracks()
                .forEach(
                    (track) => track.stop()
                );

        } catch (error: any) {

            console.error(
                "❌ No se pudo acceder al micrófono:",
                error
            );


            let mensaje =
                "No se pudo acceder al micrófono.";


            if (
                error?.name ===
                "NotAllowedError"
            ) {

                mensaje =
                    "El permiso del micrófono está bloqueado. Debes habilitarlo en el navegador.";
            }


            if (
                error?.name ===
                "NotFoundError"
            ) {

                mensaje =
                    "No se encontró ningún micrófono conectado.";
            }


            setErrorMicrofono(
                mensaje
            );


            setRespuestaDante(
                mensaje
            );


            return;
        }


        await iniciarMedidorMicrofono();

        // ====================================================
        // SPEECH RECOGNITION
        // ====================================================

        const SpeechRecognitionAPI =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognitionAPI) {

            const mensaje =
                "Este navegador no soporta reconocimiento de voz. Usa Google Chrome o Microsoft Edge.";

            console.error(mensaje);

            setErrorMicrofono(
                mensaje
            );

            setRespuestaDante(
                mensaje
            );

            return;
        }


        // ====================================================
        // SI EXISTÍA UN RECONOCIMIENTO ANTERIOR
        // LO ELIMINAMOS PARA EMPEZAR LIMPIO
        // ====================================================

        try {

            reconocimientoRef.current?.abort();

        } catch { }


        const recognition =
            new SpeechRecognitionAPI();


        recognition.continuous =
            true;

        recognition.interimResults =
            true;

        recognition.lang = "es-EC";

        recognition.continuous = true;
        recognition.interimResults = true;

        // ====================================================
        // INICIO REAL
        // ====================================================
        recognition.onstart =
            () => {

                console.log(
                    "🎤 DANTE ESTÁ ESCUCHANDO"
                );


                // Asegurar que ninguna voz anterior
                // deje bloqueado el reconocimiento.

                danteHablandoRef.current =
                    false;


                microfonoActivoRef.current =
                    true;


                setMicrofonoActivo(true);

                setEscuchando(true);


                setEstadoDante(
                    "ESPERANDO_DANTE"
                );


                estadoDanteRef.current =
                    "ESPERANDO_DANTE";
            };

        // ====================================================
        // TRANSCRIPCIÓN
        // ====================================================

        recognition.onresult = (
            event: SpeechRecognitionEventLike
        ) => {

            // ====================================================
            // NO PROCESAR LA PROPIA VOZ DE DANTE
            // ====================================================

            if (
                danteHablandoRef.current
            ) {

                console.log(
                    "🔇 IGNORADO: Dante estaba hablando"
                );

                return;
            }


            console.log(
                "🔥 ONRESULT DISPARADO",
                event.results.length
            );


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const resultado =
                    event.results[i];


                const texto =
                    resultado[0]
                        .transcript
                        .trim();


                console.log(
                    resultado.isFinal
                        ? "📝 FINAL:"
                        : "🗣️ INTERMEDIO:",
                    texto,
                    "confianza:",
                    resultado[0].confidence
                );


                if (
                    resultado.isFinal
                ) {

                    setTextoEscuchado(
                        texto
                    );


                    setTextoIntermedio(
                        ""
                    );


                    analizarTextoDante(
                        texto
                    );


                } else {

                    setTextoIntermedio(
                        texto
                    );
                }
            }
        };

        // ====================================================
        // ERRORES
        // ====================================================

        recognition.onerror = (
            event: SpeechRecognitionErrorEventLike
        ) => {

            // ====================================================
            // NO-SPEECH NO ES UN ERROR PARA DANTE
            // Chrome puede emitirlo cuando termina un ciclo
            // sin recibir una frase nueva.
            // ====================================================

            if (event.error === "no-speech") {

                console.log(
                    "🎤 Dante sigue esperando..."
                );

                return;
            }


            // ====================================================
            // ABORTED TAMPOCO ES ERROR
            // Puede ocurrir cuando reiniciamos SpeechRecognition.
            // ====================================================

            if (event.error === "aborted") {

                console.log(
                    "🔄 Reconocimiento reiniciado"
                );

                return;
            }


            // ====================================================
            // LOS DEMÁS SÍ SON ERRORES REALES
            // ====================================================

            console.error(
                "❌ Error SpeechRecognition:",
                event.error
            );


            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {

                microfonoActivoRef.current =
                    false;

                setMicrofonoActivo(
                    false
                );

                setEscuchando(
                    false
                );

                setEstadoDante(
                    "APAGADO"
                );

                setErrorMicrofono(
                    "El navegador bloqueó el acceso al micrófono."
                );

                setRespuestaDante(
                    "El navegador bloqueó el acceso al micrófono."
                );

                return;
            }


            if (event.error === "audio-capture") {

                setErrorMicrofono(
                    "No se está recibiendo audio del micrófono."
                );

                return;
            }


            if (event.error === "network") {

                setErrorMicrofono(
                    "No se pudo conectar con el servicio de reconocimiento de voz."
                );

                return;
            }


            setErrorMicrofono(
                `Error de reconocimiento: ${event.error}`
            );
        };


        // ====================================================
        // CUANDO CHROME DETIENE EL RECONOCIMIENTO
        // ====================================================

        recognition.onend =
            () => {

                console.log(
                    "⏹️ Reconocimiento detenido"
                );


                setEscuchando(
                    false
                );


                // ====================================================
                // SOLO REINICIAR SI DANTE NO ESTÁ HABLANDO
                // ====================================================

                if (
                    microfonoActivoRef.current &&
                    !pausaReconocimientoPorVozDanteRef.current &&
                    !danteHablandoRef.current
                ) {

                    console.log(
                        "🔄 Reiniciando Dante..."
                    );


                    setTimeout(
                        () => {

                            try {

                                // Volvemos a verificar después del delay
                                if (
                                    pausaReconocimientoPorVozDanteRef.current ||
                                    danteHablandoRef.current
                                ) {

                                    console.log(
                                        "🔇 Dante está hablando. No se reinicia reconocimiento."
                                    );

                                    return;
                                }


                                setEstadoDante(
                                    "ESPERANDO_DANTE"
                                );


                                estadoDanteRef.current =
                                    "ESPERANDO_DANTE";


                                setRespuestaDante(
                                    'Micrófono activo. Esperando "Dante"...'
                                );


                                recognition.start();


                            } catch (error: any) {

                                if (
                                    error?.name !==
                                    "InvalidStateError"
                                ) {

                                    console.error(
                                        "Error reiniciando reconocimiento:",
                                        error
                                    );
                                }
                            }

                        },
                        500
                    );
                }
            };

        reconocimientoRef.current =
            recognition;


        // ====================================================
        // ARRANCAR
        // ====================================================

        try {

            microfonoActivoRef.current =
                true;


            recognition.start();


        } catch (error) {

            console.error(
                "❌ No se pudo iniciar SpeechRecognition:",
                error
            );


            microfonoActivoRef.current =
                false;


            setMicrofonoActivo(
                false
            );


            setEstadoDante(
                "APAGADO"
            );


            setErrorMicrofono(
                "No se pudo iniciar el reconocimiento de voz."
            );
        }
    }

    // ========================================================
    // DETENER MICRÓFONO
    // ========================================================

    function detenerMicrofono() {

        microfonoActivoRef.current =
            false;

        detenerMedidorMicrofono();

        setMicrofonoActivo(
            false
        );


        setEscuchando(
            false
        );


        setEstadoDante(
            "APAGADO"
        );


        setTextoIntermedio(
            ""
        );


        setRespuestaDante(
            "Micrófono apagado."
        );


        try {

            reconocimientoRef.current?.stop();

        } catch {

            // Ignorar
        }
    }


    // ========================================================
    // TOGGLE MICRÓFONO
    // ========================================================

    function toggleMicrofono() {

        if (
            microfonoActivo
        ) {

            detenerMicrofono();

        } else {

            iniciarMicrofono();
        }
    }





    // ========================================================
    // CARGAR NOTIFICACIONES
    // ========================================================

    async function cargarNotificaciones() {

        const url =
            `${API_BASE}/notificaciones-sistema/resumen`;


        try {

            const token =
                getToken();


            if (
                !token
            ) {

                console.warn(
                    "No existe token para cargar notificaciones"
                );

                return;
            }


            const res =
                await fetch(
                    url,
                    {
                        method: "GET",

                        headers: {

                            Accept:
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        cache:
                            "no-store",
                    }
                );


            const texto =
                await res.text();


            let data: any;


            try {

                data =
                    texto
                        ? JSON.parse(
                            texto
                        )
                        : {};

            } catch {

                throw new Error(

                    `El servidor respondió contenido no JSON. HTTP ${res.status}: ${texto.slice(
                        0,
                        200
                    )}`
                );
            }


            if (
                !res.ok ||
                !data.ok
            ) {

                throw new Error(

                    data.message ||

                    `Error HTTP ${res.status} cargando notificaciones`
                );
            }


            setResumen({

                totalNuevas:
                    Number(
                        data.resumen
                            ?.totalNuevas ||
                        0
                    ),

                criticas:
                    Number(
                        data.resumen
                            ?.criticas ||
                        0
                    ),

                advertencias:
                    Number(
                        data.resumen
                            ?.advertencias ||
                        0
                    ),

                info:
                    Number(
                        data.resumen
                            ?.info ||
                        0
                    ),

                wireless:
                    Number(
                        data.resumen
                            ?.wireless ||
                        0
                    ),

                mensualidades:
                    Number(
                        data.resumen
                            ?.mensualidades ||
                        0
                    ),

                sriEmail:
                    Number(
                        data.resumen
                            ?.sriEmail ||
                        0
                    ),

                sriAnulacion:
                    Number(
                        data.resumen
                            ?.sriAnulacion ||
                        0
                    ),

                sriNotaCredito:
                    Number(
                        data.resumen
                            ?.sriNotaCredito ||
                        0
                    ),
            });


            setNotificaciones(

                Array.isArray(
                    data.ultimas
                )

                    ? data.ultimas.map(
                        normalizarNotificacion
                    )

                    : []
            );

        } catch (error) {

            console.error(
                "Error cargando notificaciones:",
                {
                    url,
                    API_BASE,
                    error,
                }
            );
        }
    }


    // ========================================================
    // MARCAR TODAS VISTAS
    // ========================================================

    async function marcarTodasVistas() {

        try {

            const token =
                getToken();


            await fetch(

                `${API_BASE}/notificaciones-sistema/marcar-todas-vistas`,

                {
                    method: "PUT",

                    headers: {

                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            await cargarNotificaciones();


        } catch (error) {

            console.error(
                "Error marcando notificaciones:",
                error
            );
        }
    }


    // ========================================================
    // CARGA INICIAL
    // ========================================================

    useEffect(() => {

        const guardado =
            localStorage.getItem(
                "bot_notificaciones_pos"
            );


        if (
            guardado
        ) {

            try {

                setPos(
                    JSON.parse(
                        guardado
                    )
                );

            } catch {

                // Ignorar
            }
        }


        cargarNotificaciones();


        const intervalo =
            setInterval(
                () => {

                    cargarNotificaciones();

                },
                60000
            );


        return () => {

            clearInterval(
                intervalo
            );


            microfonoActivoRef.current =
                false;


            try {

                reconocimientoRef.current
                    ?.stop();

            } catch {

                // Ignorar
            }
        };

    }, []);


    // ========================================================
    // GUARDAR POSICIÓN
    // ========================================================

    useEffect(() => {

        localStorage.setItem(

            "bot_notificaciones_pos",

            JSON.stringify(
                pos
            )
        );

    }, [pos]);


    // ========================================================
    // DRAG
    // ========================================================

    useEffect(() => {

        function mover(
            e: MouseEvent
        ) {

            if (
                !drag
            ) {
                return;
            }


            setMoviendo(
                true
            );


            setPos({

                x:
                    e.clientX -
                    offset.x,

                y:
                    e.clientY -
                    offset.y,
            });
        }


        function soltar() {

            setTimeout(
                () =>
                    setMoviendo(
                        false
                    ),
                50
            );


            setDrag(
                false
            );
        }


        window.addEventListener(
            "mousemove",
            mover
        );


        window.addEventListener(
            "mouseup",
            soltar
        );


        return () => {

            window.removeEventListener(
                "mousemove",
                mover
            );


            window.removeEventListener(
                "mouseup",
                soltar
            );
        };

    }, [
        drag,
        offset,
    ]);


    // ========================================================
    // CALCULADOS
    // ========================================================

    const ultima =
        notificaciones[0];


    const total =
        useMemo(
            () => {

                return Number(
                    resumen.totalNuevas ||
                    0
                );

            },
            [
                resumen,
            ]
        );


    // ========================================================
    // ESTILO NOTIFICACIONES
    // ========================================================

    function estiloNivel(
        nivel: string
    ): React.CSSProperties {

        if (
            nivel === "CRITICA"
        ) {

            return {

                color:
                    "#fca5a5",

                borderColor:
                    "rgba(239,68,68,0.42)",

                background:
                    "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(2,6,23,0.94))",
            };
        }


        if (
            nivel === "ADVERTENCIA"
        ) {

            return {

                color:
                    "#fde047",

                borderColor:
                    "rgba(234,179,8,0.42)",

                background:
                    "linear-gradient(135deg, rgba(234,179,8,0.16), rgba(2,6,23,0.94))",
            };
        }


        return {

            color:
                "#93c5fd",

            borderColor:
                "rgba(59,130,246,0.42)",

            background:
                "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(2,6,23,0.94))",
        };
    }


    // ========================================================
    // ICONO MODULO
    // ========================================================

    function iconoModulo(
        modulo: string
    ): LucideIcon {

        if (
            modulo ===
            "WIRELESS"
        ) {
            return RadioTower;
        }


        if (
            modulo ===
            "MENSUALIDADES"
        ) {
            return CreditCard;
        }


        if (
            modulo ===
            "SRI_EMAIL"
        ) {
            return Mail;
        }


        if (
            modulo ===
            "SRI_ANULACION"
        ) {
            return ReceiptText;
        }


        if (
            modulo ===
            "SRI_NOTA_CREDITO"
        ) {
            return FileText;
        }


        return Settings;
    }


    // ========================================================
    // TEXTO ESTADO DANTE
    // ========================================================

    function textoEstadoDante() {

        if (
            estadoDante ===
            "APAGADO"
        ) {

            return "Micrófono apagado";
        }


        if (
            estadoDante ===
            "ESPERANDO_DANTE"
        ) {

            return 'Esperando "Dante"';
        }


        if (
            estadoDante ===
            "ESCUCHANDO_COMANDO"
        ) {

            return "Te escucho";
        }


        if (
            estadoDante ===
            "PROCESANDO"
        ) {

            return "Procesando";
        }


        return "";
    }


    // ========================================================
    // COLOR ESTADO
    // ========================================================

    function colorEstadoDante() {

        if (
            estadoDante ===
            "ESCUCHANDO_COMANDO"
        ) {

            return "#22c55e";
        }


        if (
            estadoDante ===
            "PROCESANDO"
        ) {

            return "#f59e0b";
        }


        if (
            estadoDante ===
            "ESPERANDO_DANTE"
        ) {

            return "#22d3ee";
        }


        return "#64748b";
    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div

            className="fixed z-[9999]"

            style={{

                left:
                    pos.x,

                top:
                    pos.y,
            }}
        >

            {/* =================================================
                BOT FLOTANTE
            ================================================= */}

            <div

                onMouseDown={(
                    e
                ) => {

                    setDrag(
                        true
                    );


                    setOffset({

                        x:
                            e.clientX -
                            pos.x,

                        y:
                            e.clientY -
                            pos.y,
                    });
                }}


                onClick={() => {

                    if (
                        !moviendo
                    ) {

                        setAbierto(
                            !abierto
                        );
                    }
                }}


                className="
                    relative
                    cursor-grab
                    active:cursor-grabbing
                    select-none
                "
            >

                <div

                    className={`
                        flex
                        h-20
                        w-20
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-full
                        border-4
                        ${estadoDante ===
                            "ESCUCHANDO_COMANDO"

                            ? "border-green-400 animate-pulse"

                            : "border-cyan-300"
                        }
                    `}

                    style={{

                        background:
                            "linear-gradient(135deg, rgba(34,211,238,0.24), rgba(37,99,235,0.12))",

                        boxShadow:
                            estadoDante ===
                                "ESCUCHANDO_COMANDO"

                                ? "0 0 40px rgba(34,197,94,0.95)"

                                : "0 0 30px rgba(34,211,238,0.8)",
                    }}
                >

                    <Image

                        src="/bot.png"

                        alt="Dante Netcomp RF"

                        width={100}

                        height={130}

                        className="
                            w-[115%]
                            h-[115%]
                            object-cover
                            scale-125
                        "

                        priority
                    />

                </div>


                {/* CONTADOR */}

                {total > 0 && (

                    <div

                        className="
                            absolute
                            -right-2
                            -top-2
                            flex
                            h-8
                            min-w-8
                            items-center
                            justify-center
                            rounded-full
                            border-2
                            border-white
                            text-xs
                            font-black
                            text-white
                        "

                        style={{

                            background:
                                "linear-gradient(135deg, #ef4444, #b91c1c)",
                        }}
                    >

                        {total}

                    </div>
                )}


                {/* ESTADO MIC */}

                <div

                    className="
                        absolute
                        -bottom-3
                        left-1/2
                        -translate-x-1/2
                        whitespace-nowrap
                        rounded-full
                        px-2
                        py-1
                        text-[9px]
                        font-black
                        text-white
                    "

                    style={{

                        background:
                            colorEstadoDante(),
                    }}
                >

                    DANTE

                </div>

            </div>


            {/* =================================================
                PANEL
            ================================================= */}

            {abierto && (

                <div

                    className="
                        mt-5
                        w-96
                        overflow-hidden
                        rounded-2xl
                        border
                        border-cyan-500/40
                        shadow-2xl
                    "

                    style={{

                        background:
                            "linear-gradient(160deg, rgba(15,23,42,0.99), rgba(2,6,23,0.99))",

                        boxShadow:
                            "0 22px 55px rgba(6,182,212,0.18)",
                    }}
                >


                    {/* =================================================
                        CABECERA
                    ================================================= */}

                    <div

                        className="
                            p-4
                            border-b
                            border-slate-800
                        "
                    >

                        <h3

                            className="
                                flex
                                items-center
                                gap-2
                                font-black
                                text-white
                            "
                        >

                            <Bot

                                size={22}

                                className="
                                    text-cyan-400
                                "

                                strokeWidth={2.4}
                            />

                            Dante

                        </h3>


                        <p

                            className="
                                text-xs
                                text-slate-400
                                mt-1
                            "
                        >

                            Asistente técnico NETCOMP RF

                        </p>

                    </div>


                    <div

                        className="
                            p-4
                            space-y-4
                            max-h-[620px]
                            overflow-y-auto
                        "
                    >


                        {/* =================================================
                            PANEL DANTE
                        ================================================= */}

                        <div

                            className="
                                rounded-xl
                                border
                                border-cyan-500/30
                                p-4
                            "

                            style={{

                                background:
                                    "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(15,23,42,0.96))",
                            }}
                        >

                            <div

                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >

                                <div>

                                    <p

                                        className="
                                            text-sm
                                            font-black
                                            text-white
                                        "
                                    >

                                        Asistente de voz

                                    </p>


                                    <p

                                        className="
                                            text-xs
                                            mt-1
                                        "

                                        style={{

                                            color:
                                                colorEstadoDante(),
                                        }}
                                    >

                                        ● {textoEstadoDante()}

                                    </p>

                                </div>


                                <button

                                    type="button"

                                    onClick={
                                        toggleMicrofono
                                    }

                                    className="
                                        flex
                                        h-12
                                        w-12
                                        items-center
                                        justify-center
                                        rounded-full
                                        text-white
                                    "

                                    style={{

                                        background:
                                            microfonoActivo

                                                ? "linear-gradient(135deg, #dc2626, #991b1b)"

                                                : "linear-gradient(135deg, #0891b2, #2563eb)",

                                        boxShadow:
                                            microfonoActivo

                                                ? "0 0 22px rgba(239,68,68,0.35)"

                                                : "0 0 22px rgba(6,182,212,0.28)",
                                    }}
                                >

                                    {microfonoActivo
                                        ? (
                                            <MicOff
                                                size={21}
                                            />
                                        )
                                        : (
                                            <Mic
                                                size={21}
                                            />
                                        )}

                                </button>

                            </div>
                            {/* =================================================
    MOSTRAR DETALLES TÉCNICOS
================================================= */}

                            <label
                                className="
        mt-3
        flex
        items-center
        gap-2
        cursor-pointer
        select-none
        text-xs
        text-slate-400
    "
                            >
                                <input
                                    type="checkbox"
                                    checked={mostrarDetallesDante}
                                    onChange={(e) =>
                                        setMostrarDetallesDante(
                                            e.target.checked
                                        )
                                    }
                                    className="
            h-4
            w-4
            accent-cyan-500
            cursor-pointer
        "
                                />

                                Mostrar detalles técnicos
                            </label>



                            {/* RESPUESTA */}

                            {mostrarDetallesDante && (
                                <>
                                    <div

                                        className="
                                    mt-4
                                    rounded-lg
                                    border
                                    border-slate-700
                                    bg-slate-950/70
                                    p-3
                                "
                                    >

                                        <p

                                            className="
                                        flex
                                        items-center
                                        gap-2
                                        text-[10px]
                                        font-bold
                                        uppercase
                                        tracking-wide
                                        text-cyan-400
                                    "
                                        >

                                            <Volume2
                                                size={13}
                                            />

                                            Dante

                                        </p>

                                        <p
                                            className="
        mt-2
        text-sm
        text-white
        leading-relaxed
    "
                                        >
                                            {respuestaDante}
                                        </p>
                                        <div
                                            className="
        mt-3
        rounded-lg
        border
        border-slate-700
        bg-slate-950/60
        p-3
    "
                                        >

                                            <div
                                                className="
            flex
            items-center
            justify-between
            mb-2
        "
                                            >

                                                <span
                                                    className="
                text-[10px]
                uppercase
                font-bold
                text-slate-400
            "
                                                >
                                                    Nivel del micrófono
                                                </span>

                                                <span
                                                    className="
                text-[10px]
                text-cyan-400
                font-bold
            "
                                                >
                                                    {nivelMicrofono}%
                                                </span>

                                            </div>


                                            <div
                                                className="
            h-2
            w-full
            overflow-hidden
            rounded-full
            bg-slate-800
        "
                                            >

                                                <div
                                                    className="
                h-full
                rounded-full
                transition-all
                duration-75
            "
                                                    style={{
                                                        width:
                                                            `${nivelMicrofono}%`,

                                                        background:
                                                            nivelMicrofono > 10
                                                                ? "linear-gradient(90deg,#22d3ee,#22c55e)"
                                                                : "#475569",
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    </div>


                                    {/* TRANSCRIPCIÓN */}

                                    {(textoEscuchado ||
                                        textoIntermedio) && (

                                            <div

                                                className="
                                        mt-3
                                        rounded-lg
                                        border
                                        border-slate-700
                                        bg-slate-950/60
                                        p-3
                                    "
                                            >

                                                <p

                                                    className="
                                            text-[10px]
                                            font-bold
                                            uppercase
                                            tracking-wide
                                            text-slate-500
                                        "
                                                >

                                                    Transcripción

                                                </p>


                                                <p

                                                    className="
                                            mt-1
                                            text-xs
                                            text-slate-300
                                        "
                                                >

                                                    {textoIntermedio ||
                                                        textoEscuchado}

                                                </p>

                                            </div>
                                        )}


                                    {/* ÚLTIMO COMANDO */}

                                    {ultimoComando && (

                                        <div

                                            className="
                                        mt-3
                                        rounded-lg
                                        border
                                        border-green-500/30
                                        bg-green-950/10
                                        p-3
                                    "
                                        >

                                            <p

                                                className="
                                            text-[10px]
                                            font-bold
                                            uppercase
                                            tracking-wide
                                            text-green-400
                                        "
                                            >

                                                Último comando detectado

                                            </p>


                                            <p

                                                className="
                                            mt-1
                                            text-xs
                                            text-white
                                        "
                                            >

                                                {ultimoComando}

                                            </p>

                                        </div>
                                    )}

                                </>
                            )}
                            {/* ERROR */}

                            {errorMicrofono && (

                                <p

                                    className="
                                        mt-3
                                        text-xs
                                        text-red-400
                                    "
                                >

                                    {errorMicrofono}

                                </p>
                            )}


                            {/* AYUDA */}

                            <p

                                className="
                                    mt-3
                                    text-[10px]
                                    leading-relaxed
                                    text-slate-500
                                "
                            >

                                Activa el micrófono y di
                                {" "}
                                <strong
                                    className="text-cyan-400"
                                >
                                    “Dante”
                                </strong>
                                ,
                                {" "}
                                <strong
                                    className="text-cyan-400"
                                >
                                    “Hola Dante”
                                </strong>
                                {" "}
                                o
                                {" "}
                                <strong
                                    className="text-cyan-400"
                                >
                                    “Dante, estás”
                                </strong>
                                .

                            </p>

                        </div>


                        {/* =================================================
                            RESUMEN NOTIFICACIONES
                        ================================================= */}

                        <div

                            className="
                                grid
                                grid-cols-3
                                gap-2
                                text-center
                            "
                        >

                            <div

                                className="
                                    rounded-xl
                                    border
                                    border-slate-700
                                    p-2
                                "

                                style={{

                                    background:
                                        "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(15,23,42,0.96))",
                                }}
                            >

                                <p

                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        gap-1.5
                                        text-lg
                                        font-black
                                        text-white
                                    "
                                >

                                    <BellRing
                                        size={16}
                                        className="text-cyan-400"
                                    />

                                    {total}

                                </p>

                                <p
                                    className="text-[10px] text-slate-400"
                                >
                                    Total
                                </p>

                            </div>


                            <div

                                className="
                                    rounded-xl
                                    border
                                    border-red-500/40
                                    p-2
                                "
                            >

                                <p

                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        gap-1.5
                                        text-lg
                                        font-black
                                        text-red-400
                                    "
                                >

                                    <CircleOff
                                        size={16}
                                    />

                                    {resumen.criticas}

                                </p>

                                <p
                                    className="text-[10px] text-slate-400"
                                >
                                    Críticas
                                </p>

                            </div>


                            <div

                                className="
                                    rounded-xl
                                    border
                                    border-yellow-500/40
                                    p-2
                                "
                            >

                                <p

                                    className="
                                        flex
                                        items-center
                                        justify-center
                                        gap-1.5
                                        text-lg
                                        font-black
                                        text-yellow-400
                                    "
                                >

                                    <TriangleAlert
                                        size={16}
                                    />

                                    {resumen.advertencias}

                                </p>

                                <p
                                    className="text-[10px] text-slate-400"
                                >
                                    Avisos
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                            ULTIMA NOTIFICACION
                        ================================================= */}

                        {ultima && (

                            <div

                                className="
                                    rounded-xl
                                    border
                                    p-3
                                "

                                style={
                                    estiloNivel(
                                        ultima.nivel
                                    )
                                }
                            >

                                <p
                                    className="text-xs font-bold"
                                >

                                    Última notificación

                                </p>


                                <p

                                    className="
                                        mt-1
                                        flex
                                        items-center
                                        gap-2
                                        text-sm
                                        font-bold
                                        text-white
                                    "
                                >

                                    {createElement(

                                        iconoModulo(
                                            ultima.modulo
                                        ),

                                        {
                                            size: 17,

                                            strokeWidth:
                                                2.3,
                                        }
                                    )}

                                    {ultima.titulo}

                                </p>


                                <p
                                    className="text-xs text-slate-400 mt-2"
                                >

                                    {ultima.mensaje}

                                </p>

                            </div>
                        )}


                        {/* =================================================
                            LISTADO
                        ================================================= */}

                        {notificaciones.length > 0 && (

                            <div
                                className="space-y-2"
                            >

                                {notificaciones.map(
                                    (n) => (

                                        <div

                                            key={
                                                n.notificacionId
                                            }

                                            className="
                                                rounded-xl
                                                border
                                                p-3
                                            "

                                            style={
                                                estiloNivel(
                                                    n.nivel
                                                )
                                            }
                                        >

                                            <p

                                                className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                    text-sm
                                                    font-bold
                                                "
                                            >

                                                {createElement(

                                                    iconoModulo(
                                                        n.modulo
                                                    ),

                                                    {
                                                        size: 16,

                                                        strokeWidth:
                                                            2.3,
                                                    }
                                                )}

                                                {n.titulo}

                                            </p>


                                            <p
                                                className="text-xs text-slate-400 mt-1"
                                            >

                                                {n.mensaje}

                                            </p>

                                        </div>
                                    )
                                )}

                            </div>
                        )}


                        {/* =================================================
                            BOTONES NOTIFICACIONES
                        ================================================= */}

                        <div

                            className="
                                grid
                                grid-cols-2
                                gap-2
                            "
                        >

                            <button

                                onClick={
                                    onAbrirAlertas
                                }

                                className="
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    py-2
                                    font-bold
                                    text-white
                                "

                                style={{

                                    background:
                                        "linear-gradient(135deg, #0891b2, #2563eb)",
                                }}
                            >

                                <Eye
                                    size={17}
                                />

                                Ver alertas

                            </button>


                            <button

                                onClick={
                                    marcarTodasVistas
                                }

                                className="
                                    flex
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    py-2
                                    font-bold
                                    text-white
                                "

                                style={{

                                    background:
                                        "linear-gradient(135deg, #475569, #1e293b)",
                                }}
                            >

                                <CheckCheck
                                    size={17}
                                />

                                Marcar vistas

                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}