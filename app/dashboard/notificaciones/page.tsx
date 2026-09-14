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


// ========================================================
// DANTE FASE 1H - MOTOR CENTRAL DE INTENCIONES
// ========================================================
// Esta capa NO reemplaza los comandos anteriores.
// Solo reconoce expresiones más naturales y, cuando identifica
// una intención con seguridad, reutiliza las funciones que Dante
// ya tenía implementadas.

type IntencionCentralDante =
    | "PING_CLIENTE"
    | "BUSCAR_CLIENTE"
    | "PERFIL_CLIENTE"
    | "BUSCAR_INTERNET"
    | "DIAGNOSTICO_RED"
    | "MIKROTIK"
    | "NINGUNA";

type InterpretacionCentralDante = {
    intencion: IntencionCentralDante;
    entidad: string | null;
    usaContextoActual: boolean;
    confianza: number;
};

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

    let normalizado = texto
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

    // ========================================================
    // NORMALIZACIÓN FONÉTICA / TRANSCRIPCIÓN DE MIKROTIK
    // ========================================================
    // SpeechRecognition puede escribir la marca de diferentes
    // formas aunque la persona esté diciendo "MikroTik".
    // Internamente Dante trabaja siempre con una sola palabra.
    //
    // Ejemplos aceptados:
    // microtic, microtik, micro tic, micro tik, micro tics,
    // mikro tic, mikro tik, mikrotic, mikroti, microti, etc.
    normalizado = normalizado
        .replace(
            /\b(?:mikro|micro)\s*(?:tik|tic|tiks|tics|ti|tis)\b/g,
            "mikrotik"
        )
        .replace(
            /\bmikrotics?\b/g,
            "mikrotik"
        )
        .replace(
            /\bmikrotiks?\b/g,
            "mikrotik"
        );

    return normalizado;
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


type UsuarioActualDante = {
    nombres?: string | null;
    apellidos?: string | null;
    rol?: string | null;
    email?: string | null;
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
    | "CONTENIDO"
    | "FECHA"
    | "HORA"
    | null;
};

type RouterMikrotikDante = {
    id: number;

    nombre: string;

    parroquia?: string | null;

    sector?: string | null;

    host?: string | null;

    puerto?: number | null;

    usuario?: string | null;

    activo?: number | boolean | null;

    UsaWireGuard?: number | boolean | null;

    IpWireGuard?: string | null;

    RedesInternas?: string | null;

    usa_wireguard?: number | boolean | null;

    ip_wireguard?: string | null;

    redes_internas?: string | null;
};

type CorteClienteDante = {
    id: number;
    routerId: number;
    routerNombre: string;
    parroquia?: string | null;
    sector?: string | null;
    ipCliente: string;
    comentarioMikrotik?: string | null;
    estado: "ACTIVO" | "CORTADO" | string;
    disabled?: string | null;
};

type FlujoServicioMikrotikDante = {
    accion: "CORTAR" | "ACTIVAR";
    etapa: "BUSCAR" | "SELECCIONAR" | "CONFIRMAR";
    candidatos: CorteClienteDante[];
    seleccionado: CorteClienteDante | null;
};

type FlujoMorosoDante = {
    etapa: "IP" | "NOMBRE" | "ROUTER";
    ipCliente: string;
    comentario: string;
};

type TipoProblemaInternetDante =
    | "SIN_INTERNET"
    | "LENTITUD"
    | "INTERMITENCIA"
    | "GENERAL";

type FlujoDiagnosticoInternetDante = {
    etapa:
    | "BUSCAR_CLIENTE"
    | "SELECCIONAR_CLIENTE"
    | "CONFIRMAR_COMPROBACIONES"
    | "CONFIRMAR_CPE"
    | "COMANDOS_CPE"
    | "CONFIRMAR_REINICIO_CPE"
    | "ESPERAR_USUARIO_CPE"
    | "ESPERAR_CLAVE_CPE";
    candidatos: ServicioClienteDante[];
    seleccionado: ServicioClienteDante | null;
    router: RouterMikrotikDante | null;
};

type EquipoWirelessDante = {
    routerId?: number | string | null;
    equipoId?: string | null;
    nombre?: string | null;
    marca?: string | null;
    modelo?: string | null;
    tipoEquipo?: string | null;
    ipGestion?: string | null;
    mac?: string | null;
    routerNombre?: string | null;
    routerSector?: string | null;
};

type ContextoCpeDante = {
    equipo: EquipoWirelessDante;
    cliente: any;
    metricas: any;
    ipCliente: string;
};

type AccionPendienteCpeDante =
    | "REINICIAR"
    | "ESCANEAR"
    | null;

type TicketMantenimientoPendienteDante = {
    servicio: ServicioClienteDante;
    titulo: string;
    descripcion: string;
    categoria: "INTERNET" | "EQUIPO";
    prioridad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
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
        "Iniciando micrófono..."
    );


    const [
        errorMicrofono,
        setErrorMicrofono,
    ] = useState("");

    const [
        mostrarEntradaTextoDante,
        setMostrarEntradaTextoDante,
    ] = useState(false);


    const [
        entradaTextoDante,
        setEntradaTextoDante,
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

    // ========================================================
    // DANTE - PAUSA REAL DEL MICRÓFONO DURANTE ANÁLISIS TÉCNICO
    // ========================================================
    const pausaMicrofonoAnalisisDanteRef =
        useRef(false);

    const reactivarMicrofonoTrasAnalisisDanteRef =
        useRef(false);

    // Dante no debe interpretar su propia voz
    const danteHablandoRef =
        useRef(false);

    const vozDanteIdRef =
        useRef(0);

    // ========================================================
    // DANTE - CONTROL DE PROCESOS / CANCELACIÓN GLOBAL
    // ========================================================

    const procesoDanteIdRef =
        useRef(0);

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
    // ROUTER MIKROTIK ACTUAL EN CONTEXTO DE DANTE
    // ========================================================

    const routerMikrotikDanteRef =
        useRef<RouterMikrotikDante | null>(
            null
        );

    // ========================================================
    // CONTEXTO CONVERSACIONAL ACTUAL DE DANTE
    // ========================================================

    const contextoDanteRef =
        useRef<ContextoConversacionDante>({
            tema: "GENERAL",
            actualizadoEn: Date.now(),
        });

    // ========================================================
    // DANTE - USUARIO ACTUAL Y DIÁLOGO PERSONALIZADO
    // ========================================================

    const usuarioActualDanteRef =
        useRef<UsuarioActualDante | null>(null);

    const usuarioDanteCargadoRef =
        useRef(false);

    const ultimoTextoUsuarioDanteRef =
        useRef("");

    const ultimaRespuestaDanteRef =
        useRef("");

    // ========================================================
    // DANTE - MODO PRESENTACIÓN CONVERSACIONAL
    // ========================================================
    // Se activa con expresiones como "Dante, preséntate".
    // Mientras está activo, Dante conversa sobre sus capacidades
    // sin ejecutar acciones operativas reales por accidente.
    const modoPresentacionDanteRef =
        useRef(false);

    function obtenerNombreUsuarioDante(): string {

        let usuario =
            usuarioActualDanteRef.current;

        // Intentamos recuperar inmediatamente el usuario local
        // para que el saludo no dependa de que termine una consulta HTTP.
        if (!usuario && typeof window !== "undefined") {
            try {
                const guardado =
                    localStorage.getItem("isp_usuario");

                if (guardado) {
                    usuario = JSON.parse(guardado);
                    usuarioActualDanteRef.current = usuario;
                }
            } catch {
                // Si el almacenamiento no es válido, continuamos sin nombre.
            }
        }

        const nombres =
            String(usuario?.nombres || "").trim();

        if (!nombres) {
            return "";
        }

        // Dante utiliza el primer nombre para que el diálogo sea natural.
        return nombres.split(/\s+/)[0];
    }

    async function cargarUsuarioActualDante() {

        if (usuarioDanteCargadoRef.current) {
            return usuarioActualDanteRef.current;
        }

        usuarioDanteCargadoRef.current = true;

        // Primero usamos la sesión local.
        if (typeof window !== "undefined") {
            try {
                const guardado =
                    localStorage.getItem("isp_usuario");

                if (guardado) {
                    const usuario =
                        JSON.parse(guardado);

                    if (usuario?.nombres) {
                        usuarioActualDanteRef.current = {
                            nombres: usuario.nombres,
                            apellidos: usuario.apellidos,
                            rol: usuario.rol,
                            email: usuario.email,
                        };
                    }
                }
            } catch (error) {
                console.warn(
                    "DANTE: no se pudo leer isp_usuario:",
                    error
                );
            }
        }

        // El perfil del backend queda como respaldo/fuente actualizada.
        if (!usuarioActualDanteRef.current?.nombres) {
            try {
                const token = getToken();

                if (token) {
                    const res = await fetch(
                        `${API_BASE}/perfil`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                            cache: "no-store",
                        }
                    );

                    const data = await res.json();

                    if (res.ok && data?.ok && data?.usuario) {
                        usuarioActualDanteRef.current = {
                            nombres: data.usuario.nombres,
                            apellidos: data.usuario.apellidos,
                            rol: data.usuario.rol,
                            email: data.usuario.email,
                        };
                    }
                }
            } catch (error) {
                console.warn(
                    "DANTE: no se pudo cargar el perfil actual:",
                    error
                );
            }
        }

        console.log(
            "DANTE: usuario actual:",
            usuarioActualDanteRef.current
        );

        return usuarioActualDanteRef.current;
    }

    function personalizarSaludoDante(texto: string): string {

        const nombre = obtenerNombreUsuarioDante();

        if (!nombre) {
            return texto;
        }

        if (texto.startsWith("Hola, aquí estoy.")) {
            return texto.replace(
                "Hola, aquí estoy.",
                `Hola, ${nombre}. Aquí estoy.`
            );
        }

        if (texto.startsWith("Sí, aquí estoy.")) {
            return texto.replace(
                "Sí, aquí estoy.",
                `Sí, ${nombre}, aquí estoy.`
            );
        }

        if (texto.startsWith("Sí, te escucho.")) {
            return texto.replace(
                "Sí, te escucho.",
                `Sí, ${nombre}, te escucho.`
            );
        }

        if (texto.startsWith("Claro, dime qué necesitas.")) {
            return texto.replace(
                "Claro, dime qué necesitas.",
                `Claro, ${nombre}. Dime qué necesitas.`
            );
        }

        if (texto.startsWith("Listo, dime por dónde empezamos.")) {
            return texto.replace(
                "Listo, dime por dónde empezamos.",
                `Listo, ${nombre}. Dime por dónde empezamos.`
            );
        }

        return texto;
    }

    // ========================================================
    // DANTE - MONITOREO AUTOMÁTICO DE NOTIFICACIONES
    // ========================================================

    const notificacionesConocidasDanteRef =
        useRef<Set<string>>(new Set());

    const primeraRevisionNotificacionesDanteRef =
        useRef(true);

    const DANTE_NOTIFICACIONES_STORAGE_KEY =
        "dante_notificaciones_conocidas";


    async function enviarTextoDante() {

        const texto =
            entradaTextoDante.trim();

        if (!texto) {
            return;
        }


        setEntradaTextoDante(
            ""
        );


        await procesarComandoDante(
            texto
        );
    }

    // ========================================================
    // DANTE - CANCELAR TODO Y VOLVER AL INICIO
    // ========================================================

    function cancelarTodoDante() {

        console.log(
            "🛑 DANTE: CANCELACIÓN GENERAL"
        );


        // ====================================================
        // INVALIDAR TODO PROCESO ASÍNCRONO ANTERIOR
        // ====================================================

        procesoDanteIdRef.current += 1;


        // ====================================================
        // CANCELAR VOZ ACTUAL
        // ====================================================

        if (
            typeof window !== "undefined" &&
            "speechSynthesis" in window
        ) {

            try {

                // Invalida cualquier evento de la voz anterior
                vozDanteIdRef.current += 1;

                window.speechSynthesis.cancel();

            } catch (error) {

                console.log(
                    "DANTE: no había voz que cancelar"
                );
            }
        }


        // ====================================================
        // DETENER MOMENTÁNEAMENTE EL RECONOCIMIENTO
        // ====================================================

        try {

            reconocimientoRef.current?.abort();

        } catch {

            // Ya estaba detenido
        }


        // ====================================================
        // CANCELAR CONTINUIDADES
        // ====================================================

        agendaPendienteDanteRef.current =
            null;

        servicioClienteDanteRef.current =
            null;

        perfilClienteDanteRef.current =
            null;

        routerMikrotikDanteRef.current =
            null;

        flujoServicioMikrotikDanteRef.current =
            null;

        flujoMorosoDanteRef.current =
            null;

        flujoDiagnosticoInternetDanteRef.current =
            null;

        tipoProblemaDiagnosticoDanteRef.current =
            "GENERAL";

        cpeDiagnosticoDanteRef.current =
            null;

        accionPendienteCpeDanteRef.current =
            null;

        diagnosticoHumanoCpeDanteRef.current =
            "";

        ticketMantenimientoPendienteDanteRef.current =
            null;

        pausaMicrofonoAnalisisDanteRef.current =
            false;

        reactivarMicrofonoTrasAnalisisDanteRef.current =
            false;

        modoPresentacionDanteRef.current =
            false;


        // ====================================================
        // REINICIAR CONTEXTO
        // ====================================================

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


        // ====================================================
        // LIMPIAR ESTADO VISUAL
        // ====================================================

        setTextoEscuchado(
            ""
        );

        setTextoIntermedio(
            ""
        );

        setUltimoComando(
            "Dante cancela"
        );


        // ====================================================
        // LIBERAR ESTADOS DE VOZ
        // ====================================================

        danteHablandoRef.current =
            false;

        pausaReconocimientoPorVozDanteRef.current =
            false;


        // ====================================================
        // VOLVER AL ESTADO INICIAL
        // ====================================================

        setEstadoDante(
            "ESPERANDO_DANTE"
        );


        estadoDanteRef.current =
            "ESPERANDO_DANTE";


        // ====================================================
        // CONFIRMAR CANCELACIÓN
        // ====================================================

        responderDante(
            "Proceso cancelado. Estoy listo para una nueva consulta."
        );
    }

    // ========================================================
    // DANTE - FECHA EC
    // ========================================================

    function formatearFechaMysqlLocalDante(
        fecha: Date
    ) {

        const pad = (numero: number) =>
            String(numero).padStart(2, "0");


        return (
            `${fecha.getFullYear()}-` +
            `${pad(fecha.getMonth() + 1)}-` +
            `${pad(fecha.getDate())} ` +
            `${pad(fecha.getHours())}:` +
            `${pad(fecha.getMinutes())}:` +
            `${pad(fecha.getSeconds())}`
        );
    }

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
    // DANTE - OPERACIONES MATEMATICAS + PORCENTAJE
    // ========================================================
    function formatearResultadoMatematicoDante(numero: number): string {
        if (Number.isInteger(numero)) {
            return String(numero);
        }

        return String(Number(numero.toFixed(6)));
    }

    function obtenerRespuestaPorcentajeIvaDante(
        textoOriginal: string
    ): string | null {

        const texto = normalizarTextoDante(textoOriginal);

        // ============================================
        // IVA 15% - AGREGAR IVA AL VALOR
        // Ejemplo: "100 más IVA"
        //          "agrégale el IVA a 100"
        // ============================================
        let match = texto.match(
            /(?:agrega(?:le)?\s+(?:el\s+)?iva\s+(?:a|de)\s+|)(-?\d+(?:[.,]\d+)?)\s+mas\s+iva/i
        );

        if (!match) {
            match = texto.match(
                /agrega(?:le)?\s+(?:el\s+)?iva\s+(?:a|de)\s+(-?\d+(?:[.,]\d+)?)/i
            );
        }

        if (match) {
            const valor = Number(match[1].replace(',', '.'));

            const iva = valor * 0.15;
            const total = valor + iva;

            return `El valor es ${formatearResultadoMatematicoDante(valor)}, el IVA del 15 por ciento es ${formatearResultadoMatematicoDante(iva)} y el total con IVA es ${formatearResultadoMatematicoDante(total)}.`;
        }


        // ============================================
        // CALCULAR SOLO EL IVA 15%
        // Ejemplo: "saca el IVA de 200"
        //          "calcula el IVA de 500"
        // ============================================
        match = texto.match(
            /(?:saca|sacame|calcula|calculame|dime|cuanto es)\s+(?:el\s+)?iva\s+(?:de|del)\s+(-?\d+(?:[.,]\d+)?)/i
        );

        if (match) {
            const valor = Number(match[1].replace(',', '.'));

            const iva = valor * 0.15;

            return `El IVA del 15 por ciento de ${formatearResultadoMatematicoDante(valor)} es ${formatearResultadoMatematicoDante(iva)}.`;
        }


        // ============================================
        // PORCENTAJE GENERAL
        // Ejemplo: "saca el 15% de 200"
        //          "cuánto es el 8 por ciento de 500"
        // ============================================
        match = texto.match(
            /(?:saca|sacame|calcula|calculame|dime|cuanto es)?\s*(\d+(?:[.,]\d+)?)\s*(?:%|por ciento)\s+(?:de|del)\s+(-?\d+(?:[.,]\d+)?)/i
        );

        if (match) {
            const porcentaje = Number(match[1].replace(',', '.'));
            const valor = Number(match[2].replace(',', '.'));

            const resultado = valor * (porcentaje / 100);

            return `El ${formatearResultadoMatematicoDante(porcentaje)} por ciento de ${formatearResultadoMatematicoDante(valor)} es ${formatearResultadoMatematicoDante(resultado)}.`;
        }
        return null;
    }

    function obtenerRespuestaMatematicaDante(textoOriginal: string): string | null {
        let texto = normalizarTextoDante(textoOriginal);

        // Quitamos palabras de conversación que no afectan la operación
        texto = texto
            .replace(/\bdante\b/g, ' ')
            .replace(/\bcuanto es\b/g, ' ')
            .replace(/\bcuanto da\b/g, ' ')
            .replace(/\bcalcula\b/g, ' ')
            .replace(/\bcalculame\b/g, ' ')
            .replace(/\bresuelve\b/g, ' ')
            .replace(/\bpor favor\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        let numero1: number;
        let numero2: number;
        let resultado: number;

        // ============================================
        // SUMA
        // ============================================
        let match = texto.match(
            /(?:suma\s+)?(-?\d+(?:[.,]\d+)?)\s+(?:mas|\+)\s+(-?\d+(?:[.,]\d+)?)/i
        );

        if (match) {
            numero1 = Number(match[1].replace(',', '.'));
            numero2 = Number(match[2].replace(',', '.'));

            resultado = numero1 + numero2;

            return `${numero1} más ${numero2} es ${formatearResultadoMatematicoDante(resultado)}.`;
        }

        // ============================================
        // RESTA
        // ============================================
        match = texto.match(
            /(?:resta|restar|restame|resta\s+de)\s+(-?\d+(?:[.,]\d+)?)\s+(?:menos|-)\s+(-?\d+(?:[.,]\d+)?)/i
        );

        // "10 menos 4"
        // "10 - 4"
        if (!match) {
            match = texto.match(
                /(-?\d+(?:[.,]\d+)?)\s*(?:menos|-)\s*(-?\d+(?:[.,]\d+)?)/i
            );
        }

        // "quítale 4 a 10"
        // "quita 4 a 10"
        // "réstale 4 a 10"
        if (!match) {
            match = texto.match(
                /(?:quita|quitale|restale)\s+(-?\d+(?:[.,]\d+)?)\s+(?:a|de)\s+(-?\d+(?:[.,]\d+)?)/i
            );

            if (match) {
                // Aquí el orden se invierte:
                // "quítale 4 a 10" = 10 - 4
                numero1 = Number(match[2].replace(',', '.'));
                numero2 = Number(match[1].replace(',', '.'));

                resultado = numero1 - numero2;

                return `${numero1} menos ${numero2} es ${formatearResultadoMatematicoDante(resultado)}.`;
            }
        }

        if (match) {
            numero1 = Number(match[1].replace(',', '.'));
            numero2 = Number(match[2].replace(',', '.'));

            resultado = numero1 - numero2;

            return `${numero1} menos ${numero2} es ${formatearResultadoMatematicoDante(resultado)}.`;
        }
        // ============================================
        // DIVISIÓN
        // ============================================
        match = texto.match(
            /(?:divide|dividir|division\s+de)\s+(-?\d+(?:[.,]\d+)?)\s+(?:para|entre|por)\s+(-?\d+(?:[.,]\d+)?)/i
        );

        if (!match) {
            match = texto.match(
                /(-?\d+(?:[.,]\d+)?)\s+(?:dividido|divido|devidido|dividida)\s+(?:para|entre|por)\s+(-?\d+(?:[.,]\d+)?)/i
            );
        }

        if (!match) {
            match = texto.match(
                /(-?\d+(?:[.,]\d+)?)\s+entre\s+(-?\d+(?:[.,]\d+)?)/i
            );
        }

        if (!match) {
            match = texto.match(
                /(-?\d+(?:[.,]\d+)?)\s*\/\s*(-?\d+(?:[.,]\d+)?)/i
            );
        }

        if (match) {
            numero1 = Number(match[1].replace(',', '.'));
            numero2 = Number(match[2].replace(',', '.'));

            if (numero2 === 0) {
                return 'No puedo dividir un número para cero.';
            }

            resultado = numero1 / numero2;

            return `${numero1} dividido para ${numero2} es ${formatearResultadoMatematicoDante(resultado)}.`;
        }


        // ============================================
        // MULTIPLICACIÓN
        // ============================================
        match = texto.match(
            /(?:multiplica|multiplicar|multiplicame|multiplicacion\s+de)\s+(-?\d+(?:[.,]\d+)?)\s+(?:por|x|\*)\s+(-?\d+(?:[.,]\d+)?)/i
        );

        // "2 multiplicado por 1"
        // "2 multiplicado x 1"
        if (!match) {
            match = texto.match(
                /(-?\d+(?:[.,]\d+)?)\s+(?:multiplicado|multiplicada)\s+(?:por|x)\s+(-?\d+(?:[.,]\d+)?)/i
            );
        }

        // "2 por 1"
        // "2 x 1"
        // "2 * 1"
        if (!match) {
            match = texto.match(
                /(-?\d+(?:[.,]\d+)?)\s*(?:por|x|\*)\s*(-?\d+(?:[.,]\d+)?)/i
            );
        }

        if (match) {
            numero1 = Number(match[1].replace(',', '.'));
            numero2 = Number(match[2].replace(',', '.'));

            resultado = numero1 * numero2;

            return `${numero1} por ${numero2} es ${formatearResultadoMatematicoDante(resultado)}.`;
        }
        return null;
    }

    // ========================================================
    // DANTE - MODO PRESENTACIÓN CONVERSACIONAL
    // ========================================================

    function esInicioPresentacionDante(
        textoOriginal: string
    ): boolean {

        const texto =
            normalizarTextoDante(textoOriginal)
                .replace(/\bdante\b/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        return (
            texto === "presentate" ||
            texto === "presenta te" ||
            texto === "haz tu presentacion" ||
            texto === "haz una presentacion" ||
            texto === "quiero que te presentes" ||
            texto === "puedes presentarte" ||
            texto === "puede presentarse" ||
            texto === "inicia tu presentacion" ||
            texto === "comienza tu presentacion" ||
            texto === "modo presentacion"
        );
    }

    function esSalidaPresentacionDante(
        textoOriginal: string
    ): boolean {

        const texto =
            normalizarTextoDante(textoOriginal)
                .replace(/\bdante\b/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        return (
            texto === "termina la presentacion" ||
            texto === "terminar presentacion" ||
            texto === "fin de la presentacion" ||
            texto === "finaliza la presentacion" ||
            texto === "salir de presentacion" ||
            texto === "sal de presentacion" ||
            texto === "cerrar presentacion" ||
            texto === "gracias eso es todo" ||
            texto === "gracias dante eso es todo"
        );
    }

    function iniciarPresentacionDante(): void {

        modoPresentacionDanteRef.current =
            true;

        const nombre =
            obtenerNombreUsuarioDante();

        actualizarContextoDante({
            tema: "GENERAL",
            ultimaIntencion: "MODO_PRESENTACION",
            esperandoRespuesta: true,
            datoPendiente: "PREGUNTA_PRESENTACION",
        });

        const saludo =
            nombre
                ? `Hola, ${nombre}. `
                : "Hola. ";

        responderDante(
            saludo +
            "Soy Dante, el asistente inteligente de Netcomp RF. " +
            "Estoy integrado directamente con la plataforma para ayudarte en tareas administrativas y técnicas de un proveedor de internet. " +
            "Puedo conversar contigo, consultar clientes, revisar conexiones, trabajar con la infraestructura MikroTik, ayudarte con alertas, recordatorios y otras operaciones disponibles en el sistema. " +
            "Pero prefiero demostrártelo conversando. ¿Qué te gustaría conocer: mis funciones técnicas, la gestión de clientes o cómo puedo ayudarte en el trabajo diario?"
        );
    }

    function finalizarPresentacionDante(): void {

        modoPresentacionDanteRef.current =
            false;

        actualizarContextoDante({
            tema: "GENERAL",
            ultimaIntencion: "FIN_PRESENTACION",
            esperandoRespuesta: false,
            datoPendiente: null,
        });

        responderDante(
            "Gracias por conocerme. Soy Dante, el asistente inteligente de Netcomp RF. " +
            "Mi objetivo es convertir tareas técnicas y administrativas en conversaciones simples. " +
            "La presentación ha terminado y vuelvo al modo normal."
        );
    }

    function procesarModoPresentacionDante(
        textoOriginal: string
    ): boolean {

        const texto =
            normalizarTextoDante(textoOriginal);

        if (
            esInicioPresentacionDante(textoOriginal)
        ) {
            iniciarPresentacionDante();
            return true;
        }

        if (
            !modoPresentacionDanteRef.current
        ) {
            return false;
        }

        if (
            esSalidaPresentacionDante(textoOriginal)
        ) {
            finalizarPresentacionDante();
            return true;
        }

        // --------------------------------------------------------
        // PREGUNTAS SOBRE IDENTIDAD
        // --------------------------------------------------------
        if (
            texto.includes("quien eres") ||
            texto.includes("que eres") ||
            texto.includes("hablame de ti")
        ) {
            responderDante(
                "Soy Dante, el asistente inteligente integrado a Netcomp RF. " +
                "No estoy separado del sistema: utilizo las herramientas y la información que Netcomp RF ya tiene disponibles para ayudarte mediante una conversación natural. " +
                "Puedes hablarme o escribirme. ¿Quieres que te explique alguna función en particular?"
            );
            return true;
        }

        if (
            texto.includes("quien te creo") ||
            texto.includes("quien es tu creador") ||
            texto.includes("quien te desarrollo")
        ) {
            responderDante(
                "Fui creado por Jose como parte de Netcomp RF, con la idea de hacer más sencilla la operación de un proveedor de internet mediante conversaciones naturales. " +
                "¿Quieres que te explique cómo interactúo con el sistema?"
            );
            return true;
        }

        // --------------------------------------------------------
        // INTELIGENCIA / VOZ
        // --------------------------------------------------------
        if (
            texto.includes("eres una inteligencia artificial") ||
            texto.includes("eres una ia") ||
            texto.includes("eres inteligente")
        ) {
            responderDante(
                "Soy un asistente inteligente diseñado para interpretar lo que el usuario necesita y conectarlo con las funciones de Netcomp RF. " +
                "Mi trabajo no es solamente responder preguntas: también puedo guiar procesos y utilizar herramientas del sistema cuando corresponde."
            );
            return true;
        }

        if (
            texto.includes("trabajas con voz") ||
            texto.includes("puedes escuchar") ||
            texto.includes("puedo hablarte") ||
            texto.includes("funcionas por voz") ||
            texto.includes("usas microfono")
        ) {
            responderDante(
                "Sí. Puedes hablarme mediante el micrófono o escribirme. " +
                "La voz se transcribe a texto y después interpreto ese texto, de modo que las mismas funciones trabajan tanto por voz como por escritura. " +
                "Eso permite que el operador use el sistema de una forma mucho más natural."
            );
            return true;
        }

        // --------------------------------------------------------
        // CAPACIDADES GENERALES
        // --------------------------------------------------------
        if (
            texto.includes("que puedes hacer") ||
            texto.includes("que sabes hacer") ||
            texto.includes("cuales son tus funciones") ||
            texto.includes("que funciones tienes") ||
            texto.includes("capacidades")
        ) {
            responderDante(
                "Puedo ayudarte con varias áreas de Netcomp RF. " +
                "Por ejemplo, puedo localizar clientes, consultar su servicio, revisar conectividad, trabajar con routers MikroTik, apoyar procesos de corte y reactivación, manejar alertas, recordar información y consultar datos del sistema. " +
                "También puedo mantener el contexto de una conversación para no obligarte a repetir toda la información. " +
                "¿Quieres que te muestre un ejemplo con clientes o con la red?"
            );
            return true;
        }

        // --------------------------------------------------------
        // CLIENTES
        // --------------------------------------------------------
        if (
            texto.includes("cliente") ||
            texto.includes("clientes") ||
            texto.includes("gestion de clientes") ||
            texto.includes("buscar clientes")
        ) {
            if (
                texto.includes("cortar") ||
                texto.includes("suspender") ||
                texto.includes("activar") ||
                texto.includes("reactivar") ||
                texto.includes("reconectar")
            ) {
                responderDante(
                    "Sí. En operación normal puedo ayudarte a localizar al cliente por nombre o IP y acompañar el proceso de corte o reactivación. " +
                    "Antes de ejecutar una acción importante confirmo contigo el cliente y la operación. " +
                    "Como estamos en modo presentación, te lo explico sin ejecutar ningún cambio real."
                );
                return true;
            }

            responderDante(
                "Con los clientes puedo ayudarte a buscarlos por diferentes datos, consultar información de su servicio y mantener el contexto para continuar con otras preguntas sobre la misma persona. " +
                "Por ejemplo, después de localizar a un cliente puedes pedirme revisar su conexión sin volver a decirme todos sus datos. " +
                "¿Quieres que te explique cómo sería una consulta de conectividad?"
            );
            return true;
        }

        // --------------------------------------------------------
        // MIKROTIK / RED
        // --------------------------------------------------------
        if (
            texto.includes("mikrotik") ||
            texto.includes("router") ||
            texto.includes("red") ||
            texto.includes("infraestructura")
        ) {
            responderDante(
                "Puedo trabajar con la infraestructura que Netcomp RF tiene registrada. " +
                "Puedo identificar routers MikroTik por su nombre y por datos relacionados con su ubicación, consultar información técnica y utilizar las operaciones que el sistema tenga habilitadas. " +
                "La ventaja es que el operador no necesita memorizar comandos técnicos: puede pedirme la tarea de forma natural."
            );
            return true;
        }

        // --------------------------------------------------------
        // CORTE / REACTIVACIÓN EN DEMOSTRACIÓN
        // --------------------------------------------------------
        if (
            /\b(cortar|corte|suspender|desconectar)\b/.test(texto)
        ) {
            responderDante(
                "Sí, puedo ayudar con el corte de un servicio. " +
                "En el modo normal te preguntaría qué cliente deseas cortar, lo buscaría por nombre o IP, te mostraría el registro encontrado y pediría tu confirmación antes de ejecutar el corte. " +
                "Ahora estoy en modo presentación, así que no realizaré ninguna acción real."
            );
            return true;
        }

        if (
            /\b(activar|reactivar|reconectar|reconexion)\b/.test(texto)
        ) {
            responderDante(
                "También puedo ayudar con una reactivación. " +
                "Primero identifico al cliente, verifico su estado y solicito confirmación antes de activar el servicio. " +
                "Durante esta presentación solamente te explico el flujo y no modifico ningún servicio."
            );
            return true;
        }

        // --------------------------------------------------------
        // SEGURIDAD / CONFIRMACIÓN
        // --------------------------------------------------------
        if (
            texto.includes("seguro") ||
            texto.includes("seguridad") ||
            texto.includes("te equivocas") ||
            texto.includes("me equivoco") ||
            texto.includes("cliente equivocado") ||
            texto.includes("confirmacion")
        ) {
            responderDante(
                "Para las operaciones importantes no actúo a ciegas. " +
                "Primero identifico el registro, te indico lo que encontré y solicito confirmación antes de ejecutar acciones como un corte o una reactivación. " +
                "Además trabajo dentro del acceso que ya controla Netcomp RF."
            );
            return true;
        }

        // --------------------------------------------------------
        // BENEFICIO PARA ISP / OFERTA COMERCIAL
        // --------------------------------------------------------
        if (
            texto.includes("para que sirves") ||
            texto.includes("para que eres util") ||
            texto.includes("beneficio") ||
            texto.includes("ventaja") ||
            texto.includes("por que seria util") ||
            texto.includes("por que tenerte") ||
            texto.includes("por que usar dante") ||
            texto.includes("isp")
        ) {
            responderDante(
                "Mi principal beneficio es reducir pasos. " +
                "Muchas tareas que normalmente requieren abrir módulos, buscar clientes, identificar direcciones IP o localizar routers pueden comenzar simplemente hablándome. " +
                "Yo interpreto la intención, pido los datos que falten y utilizo las funciones disponibles en Netcomp RF. " +
                "Eso hace que la operación diaria sea más rápida y más fácil de aprender."
            );
            return true;
        }

        // --------------------------------------------------------
        // EJEMPLOS
        // --------------------------------------------------------
        if (
            texto.includes("dame un ejemplo") ||
            texto.includes("ponme un ejemplo") ||
            texto.includes("muestra un ejemplo") ||
            texto.includes("haz una demostracion") ||
            texto.includes("demuestralo")
        ) {
            responderDante(
                "Por ejemplo, un operador puede decirme: Dante, quiero cortar un servicio. " +
                "Yo preguntaría a quién vamos a cortar. Puede responderme con el nombre, una IP completa o parte de ella. " +
                "Después localizaría el registro, indicaría el cliente encontrado y preguntaría si desea confirmar el corte. " +
                "Solo después de la confirmación ejecutaría la operación. " +
                "En esta presentación no haré el corte real."
            );
            return true;
        }

        // --------------------------------------------------------
        // MEMORIA / CONTEXTO
        // --------------------------------------------------------
        if (
            texto.includes("recuerdas") ||
            texto.includes("memoria") ||
            texto.includes("recordar") ||
            texto.includes("contexto")
        ) {
            responderDante(
                "Sí. Netcomp RF me permite trabajar con contexto y con información que se haya guardado para Dante. " +
                "Eso me ayuda a continuar conversaciones y recuperar antecedentes útiles sin comenzar desde cero en cada consulta."
            );
            return true;
        }

        // --------------------------------------------------------
        // RESPUESTAS SOCIALES DENTRO DE LA PRESENTACIÓN
        // --------------------------------------------------------
        if (
            texto === "gracias" ||
            texto.includes("muchas gracias") ||
            texto.includes("interesante") ||
            texto.includes("muy bien") ||
            texto.includes("excelente")
        ) {
            responderDante(
                "Con gusto. Y todavía podemos seguir conversando. " +
                "Puedes preguntarme sobre clientes, MikroTik, voz, seguridad o sobre cómo puedo ayudar en la operación diaria de un ISP. " +
                "Cuando quieras terminar, dime: termina la presentación."
            );
            return true;
        }

        // --------------------------------------------------------
        // RESPUESTA ABIERTA DE CONTINUIDAD
        // --------------------------------------------------------
        responderDante(
            "Durante esta presentación puedo explicarte cómo trabajo dentro de Netcomp RF. " +
            "Puedes preguntarme, por ejemplo, qué puedo hacer con los clientes, cómo trabajo con MikroTik, cómo utilizo la voz, qué medidas tomo antes de una operación o qué beneficio aporto a un ISP."
        );

        return true;
    }

    // ========================================================
    // DANTE - OBTENER RESPUESTAS COTIDIANAS
    // ========================================================
    function obtenerRespuestaCotidianaDante(texto: string): string | null {
        const t = normalizarTextoDante(texto);

        if (
            t.includes('como estas') ||
            t.includes('como te encuentras')
        ) {
            return 'Estoy bien y listo para ayudarte.';
        }

        if (
            t.includes('quien eres') ||
            t.includes('que eres')
        ) {
            return 'Soy Dante, el asistente del sistema Netcomp RF. Puedo ayudarte con consultas técnicas, clientes, red y tareas del sistema.';
        }

        if (
            t.includes('quien te creo') ||
            t.includes('quien es tu creador')
        ) {
            return 'Fui creado por Jose para ayudar en la operación y administración de Netcomp RF.';
        }

        if (
            t === 'gracias' ||
            t.includes('muchas gracias')
        ) {
            return 'Con gusto. Para eso estoy.';
        }

        if (
            t.includes('estas cansado') ||
            t.includes('te cansas')
        ) {
            return 'No me canso. Puedo seguir trabajando contigo.';
        }

        if (
            t.includes('eres una inteligencia artificial') ||
            t.includes('eres una ia')
        ) {
            return 'Sí. Soy un asistente basado en inteligencia artificial, integrado al sistema Netcomp RF.';
        }

        if (
            t.includes('que puedes hacer') ||
            t.includes('que sabes hacer')
        ) {
            return 'Puedo ayudarte a consultar clientes, revisar conexiones, hacer pruebas técnicas, recordar tareas, consultar información del sistema y trabajar con la red.';
        }

        return null;
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

        clientesPendientesSeleccionDanteRef.current =
            [];

        flujoServicioMikrotikDanteRef.current =
            null;

        flujoMorosoDanteRef.current =
            null;


        perfilClienteDanteRef.current =
            null;


        console.log(
            "DANTE: contexto conversacional limpiado."
        );
    }

    // ========================================================
    // DANTE - CARGAR NOTIFICACIONES CONOCIDAS DEL NAVEGADOR
    // ========================================================

    function cargarNotificacionesConocidasDante() {

        if (typeof window === "undefined") {
            return;
        }

        try {

            const guardadas =
                localStorage.getItem(
                    DANTE_NOTIFICACIONES_STORAGE_KEY
                );

            if (!guardadas) {
                return;
            }

            const ids =
                JSON.parse(guardadas);

            if (!Array.isArray(ids)) {
                return;
            }

            notificacionesConocidasDanteRef.current =
                new Set(
                    ids.filter(
                        (id) =>
                            typeof id === "string" &&
                            id.trim() !== ""
                    )
                );

            console.log(
                "DANTE: Notificaciones conocidas recuperadas:",
                notificacionesConocidasDanteRef.current.size
            );

        } catch (error) {

            console.error(
                "DANTE: Error recuperando notificaciones conocidas:",
                error
            );
        }
    }


    // ========================================================
    // DANTE - MENSAJES DE PROCESAMIENTO
    // ========================================================

    async function informarProcesamientoDante(
        tipo:
            | "BUSCANDO"
            | "CONSULTANDO"
            | "PROCESANDO"
            | "CONECTANDO"
            | "ANALIZANDO"
    ): Promise<void> {

        const mensajes = {

            BUSCANDO: [
                "Un momento, estoy buscando en el sistema.",
                "Estoy buscando la información.",
                "Dame un momento, estoy revisando el sistema.",
            ],

            CONSULTANDO: [
                "Un momento, estoy consultando la información.",
                "Estoy realizando la consulta.",
                "Dame un momento, estoy verificando los datos.",
            ],

            PROCESANDO: [
                "Un momento, estoy procesando la solicitud.",
                "Estoy procesando el comando.",
                "Dame un momento mientras proceso la información.",
            ],

            CONECTANDO: [
                "Un momento, estoy conectándome al equipo.",
                "Estoy intentando comunicarme con el router.",
                "Dame un momento, estoy verificando la conexión.",
            ],

            ANALIZANDO: [
                "Un momento, estoy analizando la información.",
                "Estoy revisando los resultados.",
                "Dame un momento mientras verifico la información.",
            ],

        };


        const opciones =
            mensajes[tipo];


        const mensaje =
            opciones[
            Math.floor(
                Math.random() *
                opciones.length
            )
            ];


        await responderDante(
            mensaje
        );
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
    // DANTE - GUARDAR NOTIFICACIONES CONOCIDAS
    // ========================================================

    function guardarNotificacionesConocidasDante() {

        if (typeof window === "undefined") {
            return;
        }

        try {

            const ids =
                Array.from(
                    notificacionesConocidasDanteRef.current
                );

            localStorage.setItem(
                DANTE_NOTIFICACIONES_STORAGE_KEY,
                JSON.stringify(ids)
            );

        } catch (error) {

            console.error(
                "DANTE: Error guardando notificaciones conocidas:",
                error
            );
        }
    }


    // ========================================================
    // DANTE - AVISAR NOTIFICACIONES NUEVAS
    // ========================================================

    function avisarNotificacionesNuevasDante(
        lista: Notificacion[]
    ) {

        if (!Array.isArray(lista)) {
            return;
        }

        // ====================================================
        // PRIMERA REVISIÓN
        // Si Dante nunca ha visto el sistema, registra las
        // existentes para no leer de golpe notificaciones viejas.
        // ====================================================

        if (
            primeraRevisionNotificacionesDanteRef.current
        ) {

            if (
                notificacionesConocidasDanteRef.current.size === 0
            ) {

                lista.forEach(
                    (notificacion) => {

                        if (
                            notificacion.notificacionId
                        ) {

                            notificacionesConocidasDanteRef.current.add(
                                notificacion.notificacionId
                            );
                        }
                    }
                );

                guardarNotificacionesConocidasDante();

                primeraRevisionNotificacionesDanteRef.current =
                    false;

                console.log(
                    "DANTE: Primera carga. Notificaciones existentes registradas:",
                    lista.length
                );

                return;
            }

            primeraRevisionNotificacionesDanteRef.current =
                false;
        }


        // ====================================================
        // DETECTAR NOTIFICACIONES NUEVAS
        // ====================================================

        const nuevas =
            lista.filter(
                (notificacion) => {

                    const id =
                        String(
                            notificacion.notificacionId ||
                            ""
                        ).trim();

                    if (!id) {
                        return false;
                    }

                    return (
                        !notificacionesConocidasDanteRef.current.has(
                            id
                        )
                    );
                }
            );


        if (
            nuevas.length === 0
        ) {
            return;
        }


        // ====================================================
        // MARCARLAS COMO CONOCIDAS ANTES DE HABLAR
        // PARA EVITAR REPETICIONES
        // ====================================================

        nuevas.forEach(
            (notificacion) => {

                notificacionesConocidasDanteRef.current.add(
                    notificacion.notificacionId
                );
            }
        );

        guardarNotificacionesConocidasDante();


        // ====================================================
        // PRIORIZAR: CRÍTICAS -> ADVERTENCIAS -> INFO
        // ====================================================

        const prioridadNivel: Record<string, number> = {
            CRITICA: 3,
            ADVERTENCIA: 2,
            INFO: 1,
        };

        const ordenadas =
            [...nuevas].sort(
                (a, b) =>
                    (prioridadNivel[b.nivel] || 0) -
                    (prioridadNivel[a.nivel] || 0)
            );


        // ====================================================
        // GENERAR MENSAJE DE DANTE
        // ====================================================

        const mensajes =
            ordenadas
                .slice(0, 3)
                .map(
                    (notificacion) => {

                        const titulo =
                            String(
                                notificacion.titulo ||
                                "Notificación"
                            ).trim();

                        const mensaje =
                            String(
                                notificacion.mensaje ||
                                ""
                            ).trim();

                        let encabezado =
                            "Nueva notificación.";

                        if (
                            notificacion.nivel === "CRITICA"
                        ) {
                            encabezado =
                                "Atención. Nueva notificación crítica.";
                        } else if (
                            notificacion.nivel === "ADVERTENCIA"
                        ) {
                            encabezado =
                                "Aviso. Nueva advertencia.";
                        } else if (
                            notificacion.nivel === "INFO"
                        ) {
                            encabezado =
                                "Nueva notificación informativa.";
                        }

                        return (
                            `${encabezado} ${titulo}.` +
                            (
                                mensaje
                                    ? ` ${mensaje}.`
                                    : ""
                            )
                        );
                    }
                );


        if (
            ordenadas.length > 3
        ) {

            mensajes.push(
                `Además tienes ${ordenadas.length - 3} notificaciones nuevas adicionales.`
            );
        }


        console.log(
            "DANTE: NUEVAS NOTIFICACIONES:",
            ordenadas
        );

        responderDante(
            mensajes.join(" ")
        );
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
                                formatearFechaMysqlLocalDante(
                                    fechaCompromiso
                                ),

                            datosJson: {

                                estado:
                                    "PENDIENTE",

                                diasCompromiso:
                                    dias,

                                fechaCompromiso:
                                    formatearFechaMysqlLocalDante(
                                        fechaCompromiso
                                    ),

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
                                    formatearFechaMysqlLocalDante(
                                        fechaCompromiso
                                    ),

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
    // DANTE - CLIENTES EN ESPERA DE SELECCIÓN
    // Permite responder con "2", "el segundo" o el nombre completo
    // cuando una búsqueda devuelve varias personas.
    // ========================================================

    const clientesPendientesSeleccionDanteRef =
        useRef<ServicioClienteDante[]>([]);

    // ========================================================
    // DANTE - CORTE / RECONEXIÓN Y LISTA DE MOROSOS
    // ========================================================

    const flujoServicioMikrotikDanteRef =
        useRef<FlujoServicioMikrotikDante | null>(null);

    const flujoMorosoDanteRef =
        useRef<FlujoMorosoDante | null>(null);

    const flujoDiagnosticoInternetDanteRef =
        useRef<FlujoDiagnosticoInternetDante | null>(null);

    const tipoProblemaDiagnosticoDanteRef =
        useRef<TipoProblemaInternetDante>("GENERAL");

    // ========================================================
    // DANTE V3 - CONTEXTO DIRECTO DEL CPE DEL CLIENTE
    // ========================================================
    const cpeDiagnosticoDanteRef =
        useRef<ContextoCpeDante | null>(null);

    const credencialesCpeDanteRef =
        useRef({
            usuario: "ubnt",
            clave: "jlzg",
            puerto: 22,
        });

    const accionPendienteCpeDanteRef =
        useRef<AccionPendienteCpeDante>(null);

    // ========================================================
    // DANTE V3 - DIAGNÓSTICO HUMANO / EXPERIENCIA DE CAMPO CPE
    // ========================================================
    const diagnosticoHumanoCpeDanteRef =
        useRef<string>("");

    // ========================================================
    // DANTE - TICKET DE MANTENIMIENTO / VISITA TÉCNICA
    // ========================================================
    const ticketMantenimientoPendienteDanteRef =
        useRef<TicketMantenimientoPendienteDante | null>(
            null
        );


    // ========================================================
    // DANTE - RESUMEN GENERAL DE CLIENTES Y CONTRATOS
    // ========================================================

    type ResumenClientesContratosDante = {
        totalClientes: number;
        contratos: number;
        activos: number;
        suspendidos: number;
        retirados: number;
        pendientes: number;
        actualizadoEn: number;
    };

    const resumenClientesContratosDanteRef =
        useRef<ResumenClientesContratosDante | null>(null);

    const resumenClientesContratosCargandoDanteRef =
        useRef(false);

    async function cargarResumenClientesContratosDante() {
        if (resumenClientesContratosCargandoDanteRef.current) {
            return resumenClientesContratosDanteRef.current;
        }

        resumenClientesContratosCargandoDanteRef.current = true;
        try {
            const token = getToken();
            if (!token) return resumenClientesContratosDanteRef.current;

            const headers = {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            const [resClientes, resContratos] = await Promise.all([
                fetch(`${API_BASE}/clientes`, { headers, cache: "no-store" }),
                fetch(`${API_BASE}/cliente-servicio`, { headers, cache: "no-store" }),
            ]);

            const dataClientes = await resClientes.json().catch(() => ({}));
            const dataContratos = await resContratos.json().catch(() => ({}));

            const listaClientes =
                Array.isArray(dataClientes?.clientes) ? dataClientes.clientes :
                    Array.isArray(dataClientes?.data) ? dataClientes.data : [];

            const listaContratos =
                Array.isArray(dataContratos?.servicios) ? dataContratos.servicios :
                    Array.isArray(dataContratos?.clienteServicios) ? dataContratos.clienteServicios :
                        Array.isArray(dataContratos?.data) ? dataContratos.data :
                            Array.isArray(dataContratos) ? dataContratos : [];

            const contarEstado = (estado: string) =>
                listaContratos.filter((item: any) =>
                    String(item?.estadoServicio || "").trim().toUpperCase() === estado
                ).length;

            const resumen: ResumenClientesContratosDante = {
                totalClientes: listaClientes.length,
                contratos: listaContratos.length,
                activos: contarEstado("ACTIVO"),
                suspendidos: contarEstado("SUSPENDIDO"),
                retirados: contarEstado("RETIRADO"),
                pendientes: contarEstado("PENDIENTE"),
                actualizadoEn: Date.now(),
            };

            resumenClientesContratosDanteRef.current = resumen;
            return resumen;
        } catch (error) {
            console.error("DANTE: Error cargando resumen de clientes y contratos:", error);
            return resumenClientesContratosDanteRef.current;
        } finally {
            resumenClientesContratosCargandoDanteRef.current = false;
        }
    }

    function esConsultaResumenClientesDante(texto: string) {
        return [
            "cuantos clientes", "cantidad de clientes", "total de clientes",
            "total clientes", "numero de clientes", "numero total de clientes",
            "cuantos tenemos de clientes", "cuantos clientes tenemos"
        ].some(x => texto.includes(x));
    }

    function obtenerConsultaEstadoContratoDante(texto: string):
        "ACTIVO" | "SUSPENDIDO" | "RETIRADO" | "PENDIENTE" | "TOTAL" | null {
        if ([
            "cuantos contratos", "cuantos servicios", "total de contratos",
            "total contratos", "total de servicios", "total servicios",
            "resumen de contratos", "resumen de servicios"
        ].some(x => texto.includes(x))) return "TOTAL";

        if (["cuantos activos", "clientes activos", "contratos activos", "servicios activos", "cuantos clientes activos", "cuantos contratos activos"].some(x => texto.includes(x))) return "ACTIVO";
        if (["cuantos suspendidos", "clientes suspendidos", "contratos suspendidos", "servicios suspendidos", "cuantos clientes suspendidos", "cuantos contratos suspendidos"].some(x => texto.includes(x))) return "SUSPENDIDO";
        if (["cuantos retirados", "clientes retirados", "contratos retirados", "servicios retirados", "cuantos clientes retirados", "cuantos contratos retirados"].some(x => texto.includes(x))) return "RETIRADO";
        if (["cuantos pendientes", "clientes pendientes", "contratos pendientes", "servicios pendientes", "cuantos clientes pendientes", "cuantos contratos pendientes"].some(x => texto.includes(x))) return "PENDIENTE";
        return null;
    }

    async function procesarConsultaResumenClientesContratosDante(texto: string) {
        const consultaClientes = esConsultaResumenClientesDante(texto);
        const estado = obtenerConsultaEstadoContratoDante(texto);
        if (!consultaClientes && !estado) return false;

        const resumen = await cargarResumenClientesContratosDante();
        if (!resumen) {
            responderDante("No pude consultar en este momento el resumen de clientes y contratos.");
            return true;
        }

        if (consultaClientes && !estado) {
            responderDante(`Actualmente tenemos ${resumen.totalClientes} ${resumen.totalClientes === 1 ? "cliente" : "clientes"} registrados.`);
            actualizarContextoDante({ tema: "CLIENTE", ultimaIntencion: "CONSULTAR_TOTAL_CLIENTES", esperandoRespuesta: false, datoPendiente: null });
            return true;
        }

        if (estado === "TOTAL") {
            responderDante(`Tenemos ${resumen.contratos} contratos de servicio: ${resumen.activos} activos, ${resumen.suspendidos} suspendidos, ${resumen.retirados} retirados y ${resumen.pendientes} pendientes.`);
            actualizarContextoDante({ tema: "CLIENTE", ultimaIntencion: "CONSULTAR_RESUMEN_CONTRATOS", esperandoRespuesta: false, datoPendiente: null });
            return true;
        }

        const cantidad =
            estado === "ACTIVO" ? resumen.activos :
                estado === "SUSPENDIDO" ? resumen.suspendidos :
                    estado === "RETIRADO" ? resumen.retirados : resumen.pendientes;

        const etiqueta =
            estado === "ACTIVO" ? "activos" :
                estado === "SUSPENDIDO" ? "suspendidos" :
                    estado === "RETIRADO" ? "retirados" : "pendientes";

        responderDante(`Tenemos ${cantidad} ${etiqueta}.`);
        actualizarContextoDante({ tema: "CLIENTE", ultimaIntencion: `CONSULTAR_CONTRATOS_${estado}`, esperandoRespuesta: false, datoPendiente: null });
        return true;
    }

    // ========================================================
    // DANTE - CORTE / RECONEXIÓN DE SERVICIO MIKROTIK
    // Reutiliza exactamente los endpoints de MikrotikCortesPage.
    // ========================================================

    function esSiDante(textoOriginal: string): boolean {
        const texto = normalizarTextoDante(textoOriginal);
        return /^(si|sí|claro|correcto|confirmo|confirmar|hazlo|dale|de acuerdo|ok|okay|procede|proceder)$/.test(texto);
    }

    function esNoDante(textoOriginal: string): boolean {
        const texto = normalizarTextoDante(textoOriginal);
        return /^(no|cancelar|cancela|cancelalo|no gracias|mejor no|dejalo|déjalo)$/.test(texto);
    }

    function extraerIpParcialDante(textoOriginal: string): string | null {
        const texto = String(textoOriginal || "");
        const coincidencias = texto.match(/\b(?:\d{1,3}\.){1,3}\d{1,3}\b/g);
        if (!coincidencias?.length) return null;
        return coincidencias[0];
    }

    function limpiarBusquedaCorteDante(textoOriginal: string): string {
        let texto = normalizarTextoDante(textoOriginal)
            .replace(/\bdante\b/g, " ")
            .replace(/\b(servicio|internet|conexion|conexión|cliente|usuario|abonado)\b/g, " ")
            .replace(/\b(activar|activa|active|reactivar|reactiva|reconectar|reconecta|reconexion|reconexión|habilitar|habilita|restablecer|restablece)\b/g, " ")
            .replace(/\b(cortar|corta|corte|suspender|suspende|desconectar|desconecta|bloquear|bloquea)\b/g, " ")
            .replace(/\b(busca|buscar|buscame|encuentra|localiza|a|al|el|la|de|del|por|favor|que|termina|terminado|ip|nombre)\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        return texto;
    }

    async function obtenerCortesClientesDante(): Promise<CorteClienteDante[]> {
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/mikrotik-conf/cortes-clientes`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.ok === false) return [];
            const lista = Array.isArray(data?.datos)
                ? data.datos
                : Array.isArray(data?.cortes)
                    ? data.cortes
                    : Array.isArray(data)
                        ? data
                        : [];
            return lista as CorteClienteDante[];
        } catch (error) {
            console.error("DANTE: error consultando cortes-clientes:", error);
            return [];
        }
    }

    function buscarCortesClientesDante(
        terminoOriginal: string,
        lista: CorteClienteDante[]
    ): CorteClienteDante[] {
        const termino = normalizarTextoDante(terminoOriginal);
        const limpio = limpiarBusquedaCorteDante(terminoOriginal);
        const ipParcial = extraerIpParcialDante(terminoOriginal);

        return lista.filter((item) => {
            const ip = String(item.ipCliente || "").toLowerCase();
            if (ipParcial && (ip === ipParcial || ip.endsWith(ipParcial) || ip.includes(ipParcial))) {
                return true;
            }

            const campos = [
                item.comentarioMikrotik,
                item.ipCliente,
                item.routerNombre,
                item.parroquia,
                item.sector,
            ]
                .map((valor) => normalizarTextoDante(String(valor || "")))
                .filter(Boolean);

            if (limpio && campos.some((campo) => campo.includes(limpio) || limpio.includes(campo))) {
                return true;
            }

            return campos.some((campo) => termino && campo.includes(termino));
        });
    }

    function describirCorteClienteDante(item: CorteClienteDante): string {
        const nombre = String(item.comentarioMikrotik || "cliente").trim();
        return `${nombre}, IP ${item.ipCliente}`;
    }

    async function ejecutarAccionServicioMikrotikDante(
        item: CorteClienteDante,
        accion: "CORTAR" | "ACTIVAR"
    ) {
        const token = getToken();
        const endpoint = accion === "CORTAR" ? "cortar" : "activar";
        try {
            responderDante(
                accion === "CORTAR"
                    ? `De acuerdo. Estoy cortando el servicio de ${describirCorteClienteDante(item)}.`
                    : `De acuerdo. Estoy activando el servicio de ${describirCorteClienteDante(item)}.`
            );

            const res = await fetch(
                `${API_BASE}/mikrotik-conf/cortes-clientes/${item.id}/${endpoint}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                responderDante(
                    data?.mensaje || data?.message ||
                    (accion === "CORTAR"
                        ? "No pude cortar el servicio."
                        : "No pude activar el servicio.")
                );
                return;
            }

            const nombre = String(item.comentarioMikrotik || item.ipCliente).trim();
            responderDante(
                accion === "CORTAR"
                    ? `Te confirmo que el servicio de ${nombre} fue cortado correctamente. ¿En qué más te puedo ayudar?`
                    : `Te confirmo que el servicio de ${nombre} fue activado correctamente. ¿En qué más te puedo ayudar?`
            );
        } catch (error) {
            console.error("DANTE: error ejecutando corte/activación:", error);
            responderDante(
                accion === "CORTAR"
                    ? "Ocurrió un error al intentar cortar el servicio."
                    : "Ocurrió un error al intentar activar el servicio."
            );
        } finally {
            flujoServicioMikrotikDanteRef.current = null;
            actualizarContextoDante({
                tema: "MIKROTIK",
                ultimaIntencion: accion === "CORTAR" ? "CORTAR_SERVICIO" : "ACTIVAR_SERVICIO",
                esperandoRespuesta: false,
                datoPendiente: null,
            });
        }
    }

    function pedirConfirmacionEstadoServicioDante(
        item: CorteClienteDante,
        accion: "CORTAR" | "ACTIVAR"
    ) {
        const estado = String(item.estado || "").toUpperCase();
        const nombre = describirCorteClienteDante(item);

        if (accion === "CORTAR") {
            if (estado === "CORTADO") {
                flujoServicioMikrotikDanteRef.current = null;
                responderDante(`${nombre} ya se encuentra cortado.`);
                return;
            }
            flujoServicioMikrotikDanteRef.current = {
                accion,
                etapa: "CONFIRMAR",
                candidatos: [],
                seleccionado: item,
            };
            actualizarContextoDante({ tema: "MIKROTIK", ultimaIntencion: "CORTAR_SERVICIO", esperandoRespuesta: true, datoPendiente: "CONFIRMAR_CORTE" });
            responderDante(`Encontré a ${nombre}. Actualmente está en estado activo. ¿Deseas cortar el servicio?`);
            return;
        }

        if (estado === "ACTIVO") {
            flujoServicioMikrotikDanteRef.current = null;
            responderDante(`${nombre} ya se encuentra activo.`);
            return;
        }

        flujoServicioMikrotikDanteRef.current = {
            accion,
            etapa: "CONFIRMAR",
            candidatos: [],
            seleccionado: item,
        };
        actualizarContextoDante({ tema: "MIKROTIK", ultimaIntencion: "ACTIVAR_SERVICIO", esperandoRespuesta: true, datoPendiente: "CONFIRMAR_ACTIVACION" });
        responderDante(`Encontré a ${nombre}. Actualmente está cortado. ¿Deseas activar el servicio?`);
    }

    async function buscarParaAccionServicioDante(
        termino: string,
        accion: "CORTAR" | "ACTIVAR"
    ): Promise<void> {
        responderDante("Un momento, estoy buscando.");
        const lista = await obtenerCortesClientesDante();
        const coincidencias = buscarCortesClientesDante(termino, lista);

        if (!coincidencias.length) {
            flujoServicioMikrotikDanteRef.current = {
                accion,
                etapa: "BUSCAR",
                candidatos: [],
                seleccionado: null,
            };
            responderDante("No encontré coincidencias. Dime el nombre, la IP completa, los dos últimos bloques de la IP, el router o el sector.");
            return;
        }

        if (coincidencias.length === 1) {
            pedirConfirmacionEstadoServicioDante(coincidencias[0], accion);
            return;
        }

        const candidatos = coincidencias.slice(0, 9);
        flujoServicioMikrotikDanteRef.current = {
            accion,
            etapa: "SELECCIONAR",
            candidatos,
            seleccionado: null,
        };
        actualizarContextoDante({ tema: "MIKROTIK", ultimaIntencion: accion === "CORTAR" ? "CORTAR_SERVICIO" : "ACTIVAR_SERVICIO", esperandoRespuesta: true, datoPendiente: "SELECCIONAR_CLIENTE_CORTE" });
        const opciones = candidatos
            .map((item, index) => `${index + 1}. ${describirCorteClienteDante(item)}`)
            .join(". ");
        responderDante(
            `Encontré ${coincidencias.length} coincidencias. ${opciones}. ` +
            `¿Cuál deseas? Puedes decirme el número, el nombre o la IP. ` +
            `Si el cliente no aparece en estas opciones, dime directamente su nombre o su IP y lo buscaré en todos los registros.`
        );
    }

    function detectarAccionServicioMikrotikDante(textoOriginal: string): "CORTAR" | "ACTIVAR" | null {
        const texto = normalizarTextoDante(textoOriginal);
        const activar = /\b(activar|activa|active|reactivar|reactiva|reconectar|reconecta|reconexion|habilitar|habilita|restablecer|restablece)\b/.test(texto);
        const cortar = /\b(cortar|corta|corte|suspender|suspende|desconectar|desconecta|bloquear|bloquea)\b/.test(texto);
        const contextoServicio = /\b(servicio|internet|cliente|usuario|abonado|conexion|cortes?)\b/.test(texto);
        if (activar && (contextoServicio || texto.split(" ").length <= 5)) return "ACTIVAR";
        if (cortar && (contextoServicio || texto.split(" ").length <= 5)) return "CORTAR";
        return null;
    }

    async function iniciarFlujoServicioMikrotikDante(
        textoOriginal: string,
        accion: "CORTAR" | "ACTIVAR"
    ): Promise<boolean> {
        let termino = limpiarBusquedaCorteDante(textoOriginal);
        const ip = extraerIpParcialDante(textoOriginal);
        if (ip) termino = ip;

        flujoServicioMikrotikDanteRef.current = {
            accion,
            etapa: "BUSCAR",
            candidatos: [],
            seleccionado: null,
        };
        actualizarContextoDante({ tema: "MIKROTIK", ultimaIntencion: accion === "CORTAR" ? "CORTAR_SERVICIO" : "ACTIVAR_SERVICIO", esperandoRespuesta: true, datoPendiente: "CLIENTE_IP_CORTE" });

        if (!termino || termino.length < 2) {
            responderDante(
                accion === "CORTAR"
                    ? "¿A quién vamos a cortar? Dime el nombre, la IP completa, los dos últimos bloques de la IP, el router o el sector."
                    : "¿A quién vamos a activar? Dime el nombre, la IP completa, los dos últimos bloques de la IP, el router o el sector."
            );
            return true;
        }

        await buscarParaAccionServicioDante(termino, accion);
        return true;
    }

    async function procesarFlujoServicioMikrotikDante(textoOriginal: string): Promise<boolean> {
        const flujo = flujoServicioMikrotikDanteRef.current;
        if (!flujo) return false;

        if (flujo.etapa === "CONFIRMAR") {
            if (esSiDante(textoOriginal)) {
                if (flujo.seleccionado) {
                    await ejecutarAccionServicioMikrotikDante(flujo.seleccionado, flujo.accion);
                }
                return true;
            }
            if (esNoDante(textoOriginal)) {
                flujoServicioMikrotikDanteRef.current = null;
                actualizarContextoDante({ tema: "MIKROTIK", esperandoRespuesta: false, datoPendiente: null });
                responderDante("De acuerdo. Operación cancelada. ¿En qué más te puedo ayudar?");
                return true;
            }
            responderDante("Necesito tu confirmación. Dime sí para continuar o no para cancelar.");
            return true;
        }

        if (flujo.etapa === "SELECCIONAR") {
            const texto = normalizarTextoDante(textoOriginal);

            // --------------------------------------------------------
            // 1. SELECCIÓN POR NÚMERO ENTRE LAS OPCIONES MOSTRADAS
            // --------------------------------------------------------
            const numeroMatch =
                texto.match(/(?:opcion\s+|numero\s+|el\s+)?(\d{1,2})/);

            if (numeroMatch) {
                const numero = Number(numeroMatch[1]);

                if (
                    numero >= 1 &&
                    numero <= flujo.candidatos.length
                ) {
                    pedirConfirmacionEstadoServicioDante(
                        flujo.candidatos[numero - 1],
                        flujo.accion
                    );
                    return true;
                }
            }

            // --------------------------------------------------------
            // 2. PRIMERO INTENTAMOS IDENTIFICARLO ENTRE LOS CANDIDATOS
            //    QUE DANTE ACABA DE MOSTRAR.
            // --------------------------------------------------------
            const coincidenciasCandidatos =
                buscarCortesClientesDante(
                    textoOriginal,
                    flujo.candidatos
                );

            if (
                coincidenciasCandidatos.length === 1
            ) {
                pedirConfirmacionEstadoServicioDante(
                    coincidenciasCandidatos[0],
                    flujo.accion
                );
                return true;
            }

            if (
                coincidenciasCandidatos.length > 1
            ) {
                const opciones =
                    coincidenciasCandidatos
                        .slice(0, 9)
                        .map(
                            (item, index) =>
                                `${index + 1}. ${describirCorteClienteDante(item)}`
                        )
                        .join(". ");

                flujoServicioMikrotikDanteRef.current = {
                    accion: flujo.accion,
                    etapa: "SELECCIONAR",
                    candidatos: coincidenciasCandidatos.slice(0, 9),
                    seleccionado: null,
                };

                responderDante(
                    `Todavía encontré varias coincidencias. ${opciones}. ` +
                    `Dime el número, el nombre completo o la IP.`
                );

                return true;
            }

            // --------------------------------------------------------
            // 3. NO ESTÁ ENTRE LAS OPCIONES VISIBLES:
            //    VOLVEMOS A BUSCAR EN TODA LA LISTA DEL BACKEND.
            //
            //    Esto permite que el usuario diga directamente:
            //    "Juan Pérez", "192.168.84.156" o "84.156",
            //    aunque ese cliente no estuviera entre los primeros
            //    candidatos mostrados por Dante.
            // --------------------------------------------------------
            if (
                texto === "no esta en la lista" ||
                texto === "no aparece" ||
                texto === "no aparece en la lista" ||
                texto === "ninguno" ||
                texto === "ninguna"
            ) {
                flujoServicioMikrotikDanteRef.current = {
                    accion: flujo.accion,
                    etapa: "BUSCAR",
                    candidatos: [],
                    seleccionado: null,
                };

                actualizarContextoDante({
                    tema: "MIKROTIK",
                    ultimaIntencion:
                        flujo.accion === "CORTAR"
                            ? "CORTAR_SERVICIO"
                            : "ACTIVAR_SERVICIO",
                    esperandoRespuesta: true,
                    datoPendiente: "CLIENTE_IP_CORTE",
                });

                responderDante(
                    "De acuerdo. Dime directamente el nombre del cliente, la IP completa o los dos últimos bloques de la IP."
                );

                return true;
            }

            // El usuario ya pudo haber dicho aquí el nombre o la IP.
            // Reutilizamos el mismo flujo existente, pero ahora contra
            // TODOS los registros obtenidos desde cortes-clientes.
            await buscarParaAccionServicioDante(
                textoOriginal,
                flujo.accion
            );

            return true;
        }

        await buscarParaAccionServicioDante(textoOriginal, flujo.accion);
        return true;
    }

    // ========================================================
    // DANTE - AGREGAR CLIENTE A LISTA DE MOROSOS
    // ========================================================

    function esInicioAgregarMorosoDante(textoOriginal: string): boolean {
        const texto = normalizarTextoDante(textoOriginal);
        return (
            /\b(agrega|agregar|anade|añade|anadir|añadir|mete|meter|incluye|incluir|registra|registrar)\b/.test(texto) &&
            /\b(moroso|morosos|lista de morosos)\b/.test(texto)
        );
    }

    function extraerNombreMorosoDante(textoOriginal: string): string {
        return normalizarTextoDante(textoOriginal)
            .replace(/\bdante\b/g, " ")
            .replace(/\b(el|la|cliente|nombre|se llama|es|del|de|usuario)\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    async function agregarMorosoDesdeDante(
        router: RouterMikrotikDante,
        ipCliente: string,
        comentario: string
    ): Promise<void> {
        try {
            const token = getToken();
            responderDante(`Ok. Agregando a ${comentario} en ${router.nombre}.`);
            const res = await fetch(
                `${API_BASE}/mikrotik-conf/routers/${router.id}/morosos/agregar`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ipCliente: ipCliente.trim(), comentario: comentario.trim() }),
                }
            );
            const textoRespuesta = await res.text();
            let data: any = {};
            try { data = JSON.parse(textoRespuesta); } catch { data = {}; }

            if (!res.ok || data?.ok === false) {
                if (data?.requiereActivarSSH) {
                    responderDante(`No pude agregar a ${comentario} porque el SSH de ${router.nombre} está desactivado.`);
                } else {
                    responderDante(data?.message || data?.mensaje || `No pude agregar a ${comentario} a la lista de morosos.`);
                }
                return;
            }

            responderDante(`Te confirmo que el cliente ${comentario} fue agregado correctamente. ¿En qué más te puedo ayudar?`);
        } catch (error) {
            console.error("DANTE: error agregando moroso:", error);
            responderDante(`Ocurrió un error al agregar a ${comentario} a la lista de morosos.`);
        } finally {
            flujoMorosoDanteRef.current = null;
            actualizarContextoDante({ tema: "MIKROTIK", ultimaIntencion: "AGREGAR_MOROSO", esperandoRespuesta: false, datoPendiente: null });
        }
    }

    function iniciarFlujoMorosoDante(textoOriginal: string): boolean {
        const ip = extraerIpParcialDante(textoOriginal);
        flujoMorosoDanteRef.current = {
            etapa: ip ? "NOMBRE" : "IP",
            ipCliente: ip || "",
            comentario: "",
        };
        actualizarContextoDante({ tema: "MIKROTIK", ultimaIntencion: "AGREGAR_MOROSO", esperandoRespuesta: true, datoPendiente: ip ? "NOMBRE_MOROSO" : "IP_MOROSO" });
        responderDante(ip ? "Perfecto. Dame el nombre del cliente." : "Ok. Dame la IP que vamos a agregar.");
        return true;
    }

    async function procesarFlujoMorosoDante(textoOriginal: string): Promise<boolean> {
        const flujo = flujoMorosoDanteRef.current;
        if (!flujo) return false;

        if (esNoDante(textoOriginal) || normalizarTextoDante(textoOriginal) === "cancelar") {
            flujoMorosoDanteRef.current = null;
            actualizarContextoDante({ tema: "MIKROTIK", esperandoRespuesta: false, datoPendiente: null });
            responderDante("De acuerdo. Cancelé el registro en la lista de morosos.");
            return true;
        }

        if (flujo.etapa === "IP") {
            const ip = extraerIpParcialDante(textoOriginal);
            if (!ip || ip.split(".").length !== 4) {
                responderDante("No pude identificar una IP completa. Dímela, por ejemplo 192.168.84.156.");
                return true;
            }
            flujo.ipCliente = ip;
            flujo.etapa = "NOMBRE";
            actualizarContextoDante({ tema: "MIKROTIK", esperandoRespuesta: true, datoPendiente: "NOMBRE_MOROSO" });
            responderDante("Perfecto. Dame el nombre del cliente.");
            return true;
        }

        if (flujo.etapa === "NOMBRE") {
            const nombre = extraerNombreMorosoDante(textoOriginal);
            if (!nombre || nombre.length < 2) {
                responderDante("No pude identificar el nombre. Dime el nombre del cliente.");
                return true;
            }
            flujo.comentario = nombre;
            flujo.etapa = "ROUTER";
            actualizarContextoDante({ tema: "MIKROTIK", esperandoRespuesta: true, datoPendiente: "ROUTER_MOROSO" });
            responderDante("¿A qué router MikroTik pertenece?");
            return true;
        }

        const routers = await obtenerRoutersMikrotikDante();
        const router = buscarRouterMencionadoDante(textoOriginal, routers);
        if (!router) {
            responderDante("No pude identificar ese router. Dime el nombre, sector o parroquia del MikroTik.");
            return true;
        }
        seleccionarRouterMikrotikDante(router, "AGREGAR_MOROSO");
        await agregarMorosoDesdeDante(router, flujo.ipCliente, flujo.comentario);
        return true;
    }

    // ========================================================
    // DANTE V3 - DIAGNÓSTICO AUTOMÁTICO DE INTERNET DEL CLIENTE
    // Encadena herramientas existentes: cliente -> perfil -> cortes
    // -> MikroTik -> ping. No ejecuta acciones de escritura.
    // ========================================================

    function detectarTipoProblemaInternetDante(
        textoOriginal: string
    ): TipoProblemaInternetDante | null {
        const texto = normalizarTextoDante(textoOriginal);

        const contextoInternet =
            /\b(internet|servicio|conexion|red|navegacion|navegar)\b/.test(texto);

        const pideRevision =
            /\b(revisa|revisar|verifica|verificar|diagnostica|diagnosticar|comprueba|comprobar|mira|averigua|averiguar|chequea|chequear|por que|porque)\b/.test(texto);

        const sinInternet =
            /\b(no tiene internet|esta sin internet|sin internet|no le funciona internet|no funciona el internet|no funciona internet|sin conexion|no tiene conexion|esta desconectado|esta desconectada|no navega|no puede navegar|no tiene servicio|esta sin servicio|sin servicio|no le funciona el servicio|no funciona el servicio|no hay servicio)\b/.test(texto);

        const lentitud =
            /\b(esta lento|esta lenta|internet lento|internet lenta|servicio lento|servicio lenta|conexion lenta|conexion lento|navega lento|navega lenta|muy lento|muy lenta|lentitud|baja velocidad|poca velocidad)\b/.test(texto);

        const intermitencia =
            /\b(intermitente|intermitencia|se va y viene|va y viene|se cae|se corta|se desconecta|se conecta y desconecta|pierde conexion|pierde internet|cortes de internet|cortes en el servicio)\b/.test(texto);

        const hayClienteEnContexto =
            servicioClienteDanteRef.current !== null;

        if (
            sinInternet &&
            (
                pideRevision ||
                contextoInternet ||
                hayClienteEnContexto
            )
        ) {
            return "SIN_INTERNET";
        }

        if (
            lentitud &&
            (
                pideRevision ||
                contextoInternet ||
                hayClienteEnContexto
            )
        ) {
            return "LENTITUD";
        }

        if (
            intermitencia &&
            (
                pideRevision ||
                contextoInternet ||
                hayClienteEnContexto
            )
        ) {
            return "INTERMITENCIA";
        }

        // Consulta general: "revisa la conexión de Juan Pérez"
        if (
            pideRevision &&
            /\b(internet|servicio|conexion|conectividad)\b/.test(texto)
        ) {
            return "GENERAL";
        }

        return null;
    }

    function esInicioDiagnosticoInternetDante(
        textoOriginal: string
    ): boolean {
        return detectarTipoProblemaInternetDante(textoOriginal) !== null;
    }

    function extraerClienteDiagnosticoInternetDante(
        textoOriginal: string
    ): string {
        const texto = normalizarTextoDante(textoOriginal)
            .replace(/\bdante\b/g, " ")
            .replace(/\b(revisa|revisar|verifica|verificar|diagnostica|diagnosticar|comprueba|comprobar|mira|averigua|averiguar|chequea|chequear)\b/g, " ")
            .replace(/\b(por que|porque|dice que|reporta que|indica que|me dice que|me indica que|ahi dice que|ahí dice que|hay dice que|el dice que|ella dice que|dice|reporta|indica|me comenta que|comenta que)\b/g, " ")
            .replace(/\b(no tiene internet|esta sin internet|sin internet|no le funciona internet|no funciona el internet|no funciona internet|sin conexion|no tiene conexion|esta desconectado|esta desconectada|no navega|no puede navegar|no tiene servicio|esta sin servicio|sin servicio|no le funciona el servicio|no funciona el servicio|no hay servicio)\b/g, " ")
            .replace(/\b(esta lento|esta lenta|internet lento|internet lenta|servicio lento|servicio lenta|conexion lenta|conexion lento|navega lento|navega lenta|muy lento|muy lenta|lentitud|baja velocidad|poca velocidad)\b/g, " ")
            .replace(/\b(intermitente|intermitencia|se va y viene|va y viene|se cae|se corta|se desconecta|se conecta y desconecta|pierde conexion|pierde internet|cortes de internet|cortes en el servicio)\b/g, " ")
            .replace(/\b(el internet|la conexion|la conectividad|el servicio|internet|conexion|conectividad|servicio)\b/g, " ")
            .replace(/\b(el cliente|la cliente|cliente|usuario|abonado)\b/g, " ")
            .replace(/^\s*(a|al|de|del)\s+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        return texto;
    }

    async function obtenerServiciosParaDiagnosticoDante(): Promise<ServicioClienteDante[]> {
        try {
            const res = await fetch(
                `${API_BASE}/cliente-servicio`,
                { cache: "no-store" }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                return [];
            }

            return Array.isArray(data?.servicios)
                ? data.servicios
                : Array.isArray(data?.data)
                    ? data.data
                    : [];
        } catch (error) {
            console.error("DANTE V3: error consultando servicios:", error);
            return [];
        }
    }

    function buscarServiciosDiagnosticoDante(
        terminoOriginal: string,
        servicios: ServicioClienteDante[]
    ): ServicioClienteDante[] {
        const termino = normalizarTextoDante(terminoOriginal);

        if (!termino) return [];

        return servicios.filter((servicio) => {
            const nombre = `${servicio.nombres || ""} ${servicio.apellidos || ""}`.trim();
            const cedula = normalizarTextoDante(servicio.cedula || "");
            const telefono = normalizarTextoDante(servicio.telefono || "");
            const ip = normalizarTextoDante(servicio.ipCliente || "");
            const pppoe = normalizarTextoDante(servicio.pppSecret || "");

            return (
                nombreCoincideDante(termino, nombre) ||
                cedula.includes(termino) ||
                telefono.includes(termino) ||
                ip.includes(termino) ||
                pppoe.includes(termino)
            );
        });
    }

    async function consultarEstadoRouterDiagnosticoDante(
        router: RouterMikrotikDante
    ): Promise<boolean | null> {
        try {
            const token = getToken();
            const usaWireGuard =
                Number(router.UsaWireGuard ?? router.usa_wireguard ?? 0) === 1 ||
                Boolean(router.IpWireGuard || router.ip_wireguard);

            const url = usaWireGuard
                ? `${API_BASE}/mikrotik/routers/${router.id}/agent/estado`
                : `${API_BASE}/mikrotik/routers/${router.id}/test`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                return false;
            }

            return (
                data?.conectado === true ||
                data?.ok === true ||
                data?.data?.ok === true ||
                data?.router?.ok === true
            );
        } catch (error) {
            console.error("DANTE V3: error consultando estado del router:", error);
            return null;
        }
    }

    async function consultarPingDiagnosticoDante(
        servicio: ServicioClienteDante
    ): Promise<any | null> {
        try {
            const token = getToken();
            const res = await fetch(
                `${API_BASE}/clientes/perfiles/administrativo/${servicio.servicioId}/ping`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
                return null;
            }

            return data?.data || null;
        } catch (error) {
            console.error("DANTE V3: error haciendo ping al cliente:", error);
            return null;
        }
    }

    async function ejecutarComprobacionesTecnicasDante(
        router: RouterMikrotikDante | null
    ): Promise<void> {
        if (!router) {
            const flujoActual =
                flujoDiagnosticoInternetDanteRef.current;

            flujoDiagnosticoInternetDanteRef.current = {
                etapa: "CONFIRMAR_CPE",
                candidatos: [],
                seleccionado:
                    flujoActual?.seleccionado ||
                    servicioClienteDanteRef.current,
                router: null,
            };

            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion: "CONFIRMAR_DIAGNOSTICO_CPE",
                esperandoRespuesta: true,
                datoPendiente: "CONFIRMAR_CPE_CLIENTE",
            });

            responderDante(
                "No tengo un router MikroTik asociado para ampliar esa comprobación. ¿Quieres que continúe buscando directamente el equipo de enlace del cliente en los equipos wireless registrados?"
            );
            return;
        }

        try {
            responderDante(
                `De acuerdo. Voy a revisar también los recursos de ${router.nombre}.`
            );

            const token = getToken();
            const usaWireGuard =
                Number(router.UsaWireGuard ?? router.usa_wireguard ?? 0) === 1 ||
                Boolean(router.IpWireGuard || router.ip_wireguard);

            let recurso: any = null;

            if (!usaWireGuard) {
                const res = await fetch(
                    `${API_BASE}/mikrotik/routers/${router.id}/test`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: "no-store",
                    }
                );

                const data = await res.json().catch(() => ({}));

                if (res.ok && data?.ok !== false) {
                    recurso = data?.router || null;
                }
            } else {
                const resEstado = await fetch(
                    `${API_BASE}/mikrotik/routers/${router.id}/agent/estado`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: "no-store",
                    }
                );

                const estado = await resEstado.json().catch(() => ({}));
                const nodo = estado?.nodo;

                if (resEstado.ok && estado?.ok !== false && nodo) {
                    const res = await fetch(
                        `${API_BASE}/mikrotik/agent/resource`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ nodo }),
                        }
                    );

                    const data = await res.json().catch(() => ({}));

                    if (res.ok && data?.ok !== false) {
                        recurso =
                            data?.data?.resource?.[0] ||
                            data?.data?.resources?.[0] ||
                            data?.data?.[0] ||
                            data?.data?.resource ||
                            data?.data ||
                            null;
                    }
                }
            }

            if (!recurso) {
                const flujoActual =
                    flujoDiagnosticoInternetDanteRef.current;

                flujoDiagnosticoInternetDanteRef.current = {
                    etapa: "CONFIRMAR_CPE",
                    candidatos: [],
                    seleccionado:
                        flujoActual?.seleccionado ||
                        servicioClienteDanteRef.current,
                    router,
                };

                actualizarContextoDante({
                    tema: "CLIENTE",
                    ultimaIntencion: "CONFIRMAR_DIAGNOSTICO_CPE",
                    esperandoRespuesta: true,
                    datoPendiente: "CONFIRMAR_CPE_CLIENTE",
                });

                responderDante(
                    `No pude obtener los recursos de ${router.nombre}. El diagnóstico inicial queda disponible. ¿Quieres que continúe revisando directamente el equipo de enlace del cliente?`
                );
                return;
            }

            const cargaCpu =
                recurso?.cpuLoad ??
                recurso?.["cpu-load"] ??
                null;

            const uptime = recurso?.uptime || null;
            const memoriaLibre =
                recurso?.freeMemory ??
                recurso?.["free-memory"] ??
                null;

            let respuesta =
                `${router.nombre} respondió a la comprobación técnica.`;

            if (cargaCpu !== null && cargaCpu !== undefined) {
                respuesta += ` La carga de CPU es ${cargaCpu} por ciento.`;
            }

            if (uptime) {
                respuesta += ` Uptime ${uptime}.`;
            }

            if (memoriaLibre) {
                respuesta += ` Memoria libre ${memoriaLibre}.`;
            }

            respuesta +=
                " Con esto confirmamos que el MikroTik está accesible.";

            const flujoActual =
                flujoDiagnosticoInternetDanteRef.current;

            flujoDiagnosticoInternetDanteRef.current = {
                etapa: "CONFIRMAR_CPE",
                candidatos: [],
                seleccionado:
                    flujoActual?.seleccionado ||
                    servicioClienteDanteRef.current,
                router:
                    flujoActual?.router ||
                    router,
            };

            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion: "CONFIRMAR_DIAGNOSTICO_CPE",
                esperandoRespuesta: true,
                datoPendiente: "CONFIRMAR_CPE_CLIENTE",
            });

            respuesta +=
                " ¿Quieres que continúe y revise directamente el equipo de enlace del cliente?";

            responderDante(respuesta);
        } catch (error) {
            console.error("DANTE V3: error en comprobaciones técnicas:", error);
            responderDante(
                `No pude completar las comprobaciones técnicas de ${router.nombre}.`
            );
        }
    }

    async function ejecutarDiagnosticoInternetClienteDante(
        servicio: ServicioClienteDante
    ): Promise<void> {
        servicioClienteDanteRef.current = servicio;
        perfilClienteDanteRef.current = null;
        clientesPendientesSeleccionDanteRef.current = [];

        const nombre =
            `${servicio.nombres || ""} ${servicio.apellidos || ""}`.trim();

        actualizarContextoDante({
            tema: "CLIENTE",
            entidadId: servicio.clienteId,
            entidadNombre: nombre,
            ultimaIntencion: "DIAGNOSTICO_INTERNET_V3",
            esperandoRespuesta: false,
            datoPendiente: null,
        });

        const tipoProblema =
            tipoProblemaDiagnosticoDanteRef.current;

        const descripcionProblema =
            tipoProblema === "LENTITUD"
                ? "el reporte de lentitud"
                : tipoProblema === "INTERMITENCIA"
                    ? "el reporte de intermitencia"
                    : tipoProblema === "SIN_INTERNET"
                        ? "por qué no tiene internet"
                        : "el estado de su conexión";

        responderDante(
            `Encontré a ${nombre}. Voy a revisar ${descripcionProblema}, su servicio, MikroTik y conectividad.`
        );

        const [perfil, cortes, ping] = await Promise.all([
            obtenerPerfilActualDante(),
            obtenerCortesClientesDante(),
            consultarPingDiagnosticoDante(servicio),
        ]);

        const ip =
            String(
                perfil?.servicio?.ipCliente ||
                servicio.ipCliente ||
                ""
            ).trim();

        const registroCorte =
            cortes.find(
                (item) =>
                    ip &&
                    String(item.ipCliente || "").trim() === ip
            ) || null;

        const routers = await obtenerRoutersMikrotikDante();

        const router =
            registroCorte
                ? routers.find(
                    (item) =>
                        Number(item.id) === Number(registroCorte.routerId)
                ) ||
                buscarRouterMencionadoDante(
                    registroCorte.routerNombre || "",
                    routers
                )
                : null;

        const routerOnline =
            router
                ? await consultarEstadoRouterDiagnosticoDante(router)
                : null;

        const estadoServicio =
            String(
                perfil?.servicio?.estadoServicio ||
                servicio.estadoServicio ||
                "SIN_ESTADO"
            ).toUpperCase();

        const estadoCorte =
            String(
                registroCorte?.estado ||
                "SIN_REGISTRO"
            ).toUpperCase();

        const online = ping?.online === true;
        const routerNombre =
            router?.nombre ||
            registroCorte?.routerNombre ||
            "sin MikroTik identificado";

        const sector =
            router?.sector ||
            registroCorte?.sector ||
            "";

        let respuesta =
            `Diagnóstico de ${nombre}. `;

        if (routerNombre !== "sin MikroTik identificado") {
            respuesta += `Está asociado a ${routerNombre}`;
            if (sector) respuesta += `, sector ${sector}`;
            respuesta += ". ";
        }

        respuesta += `Su servicio aparece ${estadoServicio}. `;

        if (estadoCorte === "CORTADO") {
            respuesta +=
                "En MikroTik figura como CORTADO. Esa es la causa más probable de que no tenga internet.";

            flujoDiagnosticoInternetDanteRef.current = null;
            return responderDante(respuesta);
        }

        if (estadoServicio === "SUSPENDIDO") {
            respuesta +=
                "El servicio está SUSPENDIDO en el sistema. Antes de hacer más pruebas técnicas conviene revisar por qué fue suspendido.";

            flujoDiagnosticoInternetDanteRef.current = null;
            return responderDante(respuesta);
        }

        if (routerOnline === false) {
            respuesta +=
                `El MikroTik ${routerNombre} no está respondiendo. La falla puede estar en el router, nodo o enlace hacia ese equipo.`;

            flujoDiagnosticoInternetDanteRef.current = null;
            return responderDante(respuesta);
        }

        if (online) {
            const pingPromedio =
                typeof ping?.pingPromedioMs === "number"
                    ? ping.pingPromedioMs.toFixed(1)
                    : null;

            const latencia =
                String(ping?.latencia || "").trim();

            const enviados =
                Number(ping?.enviados || 0);

            const recibidos =
                Number(ping?.recibidos || 0);

            const perdidos =
                Number(
                    ping?.perdidos ??
                    (enviados > 0
                        ? Math.max(0, enviados - recibidos)
                        : 0)
                );

            const tipoProblema =
                tipoProblemaDiagnosticoDanteRef.current;

            respuesta +=
                "El cliente responde desde la red y aparece conectado.";

            if (pingPromedio) {
                respuesta += ` El ping promedio es ${pingPromedio} milisegundos.`;
            }

            if (latencia) {
                respuesta += ` La latencia está clasificada como ${latencia}.`;
            }

            if (enviados > 0) {
                respuesta += ` Respondió ${recibidos} de ${enviados} paquetes.`;
            }

            if (perdidos > 0) {
                respuesta += ` Se detectaron ${perdidos} paquetes perdidos.`;
            }

            if (
                tipoProblema === "LENTITUD" ||
                tipoProblema === "INTERMITENCIA"
            ) {
                respuesta +=
                    tipoProblema === "LENTITUD"
                        ? " Como el reporte es de lentitud, que responda al ping no descarta el problema."
                        : " Como el reporte es de intermitencia, una respuesta correcta en este momento no descarta cortes ocasionales.";

                respuesta +=
                    " ¿Quieres que continúe con las comprobaciones técnicas del MikroTik?";

                flujoDiagnosticoInternetDanteRef.current = {
                    etapa: "CONFIRMAR_COMPROBACIONES",
                    candidatos: [],
                    seleccionado: servicio,
                    router,
                };

                actualizarContextoDante({
                    tema: "CLIENTE",
                    ultimaIntencion:
                        tipoProblema === "LENTITUD"
                            ? "DIAGNOSTICO_LENTITUD_V3"
                            : "DIAGNOSTICO_INTERMITENCIA_V3",
                    esperandoRespuesta: true,
                    datoPendiente: "CONFIRMAR_COMPROBACIONES_TECNICAS",
                });

                return responderDante(respuesta);
            }

            if (tipoProblema === "SIN_INTERNET") {
                respuesta +=
                    " Si el usuario sigue reportando que no navega, la falla puede estar después de la conectividad básica.";

                flujoDiagnosticoInternetDanteRef.current = {
                    etapa: "CONFIRMAR_CPE",
                    candidatos: [],
                    seleccionado: servicio,
                    router,
                };

                actualizarContextoDante({
                    tema: "CLIENTE",
                    ultimaIntencion: "CONFIRMAR_DIAGNOSTICO_CPE",
                    esperandoRespuesta: true,
                    datoPendiente: "CONFIRMAR_CPE_CLIENTE",
                });

                respuesta +=
                    " ¿Quieres que continúe y revise directamente el equipo de enlace del cliente?";

                return responderDante(respuesta);
            }

            respuesta +=
                " La conectividad básica hacia el cliente está funcionando.";

            flujoDiagnosticoInternetDanteRef.current = null;
            return responderDante(respuesta);
        }

        if (estadoServicio === "ACTIVO") {
            respuesta +=
                "El servicio aparece ACTIVO, pero el cliente no responde desde la red.";

            if (routerOnline === true && router) {
                respuesta += ` El MikroTik ${router.nombre} sí está accesible.`;
            }

            respuesta +=
                " ¿Quieres que haga las siguientes comprobaciones técnicas?";

            flujoDiagnosticoInternetDanteRef.current = {
                etapa: "CONFIRMAR_COMPROBACIONES",
                candidatos: [],
                seleccionado: servicio,
                router,
            };

            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion: "DIAGNOSTICO_INTERNET_V3",
                esperandoRespuesta: true,
                datoPendiente: "CONFIRMAR_COMPROBACIONES_TECNICAS",
            });

            return responderDante(respuesta);
        }

        respuesta +=
            " No pude determinar una causa única con las comprobaciones actuales.";

        flujoDiagnosticoInternetDanteRef.current = {
            etapa: "CONFIRMAR_CPE",
            candidatos: [],
            seleccionado: servicio,
            router,
        };

        actualizarContextoDante({
            tema: "CLIENTE",
            ultimaIntencion: "CONFIRMAR_DIAGNOSTICO_CPE",
            esperandoRespuesta: true,
            datoPendiente: "CONFIRMAR_CPE_CLIENTE",
        });

        respuesta +=
            " ¿Quieres que continúe y revise directamente el equipo de enlace del cliente?";

        responderDante(respuesta);
    }

    async function buscarClienteParaDiagnosticoDante(
        termino: string
    ): Promise<void> {
        responderDante("Un momento. Estoy identificando al cliente para iniciar el diagnóstico.");

        const servicios = await obtenerServiciosParaDiagnosticoDante();
        const coincidencias = buscarServiciosDiagnosticoDante(
            termino,
            servicios
        );

        if (!coincidencias.length) {
            flujoDiagnosticoInternetDanteRef.current = {
                etapa: "BUSCAR_CLIENTE",
                candidatos: [],
                seleccionado: null,
                router: null,
            };

            responderDante(
                "No encontré ese cliente. Dime su nombre, cédula, teléfono o IP para continuar el diagnóstico."
            );
            return;
        }

        if (coincidencias.length === 1) {
            await ejecutarDiagnosticoInternetClienteDante(
                coincidencias[0]
            );
            return;
        }

        const candidatos = coincidencias.slice(0, 9);

        flujoDiagnosticoInternetDanteRef.current = {
            etapa: "SELECCIONAR_CLIENTE",
            candidatos,
            seleccionado: null,
            router: null,
        };

        const opciones = candidatos
            .map(
                (item, index) =>
                    `${index + 1}. ${item.nombres || ""} ${item.apellidos || ""}, IP ${item.ipCliente || "sin IP"}`.trim()
            )
            .join(". ");

        responderDante(
            `Encontré ${coincidencias.length} coincidencias. ${opciones}. Dime el número, el nombre completo o la IP y continuaré automáticamente con el diagnóstico.`
        );
    }

    async function iniciarDiagnosticoInternetDante(
        textoOriginal: string
    ): Promise<boolean> {
        const tipoProblema =
            detectarTipoProblemaInternetDante(textoOriginal) ||
            "GENERAL";

        tipoProblemaDiagnosticoDanteRef.current =
            tipoProblema;

        const termino = extraerClienteDiagnosticoInternetDante(
            textoOriginal
        );

        const clienteActual =
            servicioClienteDanteRef.current;

        const terminoContextual =
            normalizarTextoDante(
                termino
            )
                .replace(
                    /\b(ahi|ahí|hay|ese|esa|el|ella|este|esta|mismo|misma|cliente|usuario)\b/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (
            clienteActual &&
            !terminoContextual
        ) {
            flujoDiagnosticoInternetDanteRef.current = {
                etapa: "BUSCAR_CLIENTE",
                candidatos: [],
                seleccionado:
                    clienteActual,
                router: null,
            };

            await ejecutarDiagnosticoInternetClienteDante(
                clienteActual
            );

            return true;
        }

        flujoDiagnosticoInternetDanteRef.current = {
            etapa: "BUSCAR_CLIENTE",
            candidatos: [],
            seleccionado: null,
            router: null,
        };

        if (!termino || termino.length < 2) {
            responderDante(
                "¿Qué cliente deseas diagnosticar? Dime su nombre, cédula, teléfono o IP."
            );
            return true;
        }

        await buscarClienteParaDiagnosticoDante(termino);
        return true;
    }



    // ========================================================
    // DANTE - TICKETS DE MANTENIMIENTO
    // Reutiliza exactamente el módulo existente de /tickets.
    // ========================================================

    function esSolicitudTicketMantenimientoDante(
        textoOriginal: string
    ): boolean {
        const texto =
            normalizarTextoDante(
                textoOriginal
            )
                .replace(/\bdante\b/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        // La intención debe funcionar también inmediatamente después
        // de una búsqueda de cliente, por ejemplo:
        // "creale un ticket", "una visita de tecnico",
        // "manda un tecnico", "que vayan a revisarlo".
        const accion =
            /\b(crea|crear|creale|genera|generar|abre|abrir|haz|hacer|hazle|manda|mandar|mande|envia|enviar|envie|programa|programar|agenda|agendar|solicita|solicitar)\b/.test(
                texto
            );

        const mantenimiento =
            /\b(ticket|tiquet|tiket|mantenimiento|visita|tecnico|tecnica|orden de trabajo|revision fisica|revisar fisicamente|soporte tecnico)\b/.test(
                texto
            );

        const frasesDirectas = [
            "manda un tecnico",
            "mande un tecnico",
            "envia un tecnico",
            "envie un tecnico",
            "que vaya un tecnico",
            "que vayan a revisarlo",
            "que vayan a revisar",
            "que lo revise un tecnico",
            "que lo revisen",
            "hazle un mantenimiento",
            "creale un ticket",
            "crea un ticket",
            "genera un ticket",
            "abre un ticket",
            "ticket de mantenimiento",
            "ticket para mantenimiento",
            "una visita tecnica",
            "visita tecnica",
            "visita de tecnico",
            "una visita de tecnico",
            "necesita un tecnico",
            "necesito un tecnico",
            "necesito que vaya un tecnico",
            "necesito que lo revisen",
            "agenda una visita",
            "programa una visita",
            "orden de trabajo",
            "crea una orden de trabajo",
            "revision en sitio",
            "revision fisica",
            "revisar en sitio",
            "revisar fisicamente",
        ];

        return (
            (accion && mantenimiento) ||
            frasesDirectas.some(
                (frase) =>
                    texto.includes(
                        frase
                    )
            )
        );
    }

    function esPersistenciaProblemaDespuesDiagnosticoDante(
        textoOriginal: string
    ): boolean {
        const texto =
            normalizarTextoDante(
                textoOriginal
            );

        const sigueConProblema =
            /\b(sigue lento|sigue lenta|todavia esta lento|todavia esta lenta|aun esta lento|aun esta lenta|continua lento|continua lenta|sigue fallando|todavia falla|aun falla|sigue sin navegar|sigue sin servicio)\b/.test(
                texto
            );

        const dudaCausa =
            /\b(no entiendo|entonces por que|y por que sera|por que sera|si todo esta bien|si esta bien|si sale bien|si la senal esta bien|si la señal esta bien|que mas puede ser|que puede ser entonces|no encuentro la falla|no se que pasa)\b/.test(
                texto
            );

        const problema =
            /\b(lento|lenta|lentitud|falla|fallando|internet|servicio|conexion|conectividad|navega|navegar)\b/.test(
                texto
            );

        return (
            sigueConProblema ||
            (dudaCausa && problema)
        );
    }

    function obtenerPrioridadTicketMantenimientoDante():
        "BAJA" | "MEDIA" | "ALTA" | "CRITICA" {
        const tipo =
            tipoProblemaDiagnosticoDanteRef.current;

        if (
            tipo === "SIN_INTERNET" ||
            tipo === "INTERMITENCIA"
        ) {
            return "ALTA";
        }

        const contexto =
            cpeDiagnosticoDanteRef.current;

        if (contexto) {
            const cliente =
                contexto.cliente ||
                {};

            const remote =
                cliente.remote ||
                {};

            const senal =
                cliente.signal ??
                remote.signal;

            const clasificacion =
                clasificarSenalExperienciaDante(
                    senal
                );

            if (
                clasificacion === "MALO" ||
                clasificacion === "HORRIBLE"
            ) {
                return "ALTA";
            }
        }

        return "MEDIA";
    }

    function construirDescripcionTicketMantenimientoDante(
        servicio: ServicioClienteDante
    ): string {
        const nombre =
            `${servicio.nombres || ""} ${servicio.apellidos || ""}`
                .trim();

        const tipo =
            tipoProblemaDiagnosticoDanteRef.current;

        const problema =
            tipo === "LENTITUD"
                ? "lentitud"
                : tipo === "INTERMITENCIA"
                    ? "intermitencia"
                    : tipo === "SIN_INTERNET"
                        ? "falta de servicio"
                        : "problema de conectividad";

        const partes: string[] = [
            `Cliente ${nombre} reporta ${problema}.`,
            `IP ${servicio.ipCliente || "no disponible"}.`,
        ];

        const contexto =
            cpeDiagnosticoDanteRef.current;

        if (contexto) {
            const cliente =
                contexto.cliente ||
                {};

            const remote =
                cliente.remote ||
                {};

            const senal =
                cliente.signal ??
                remote.signal;

            const ruido =
                cliente.noisefloor ??
                remote.noisefloor;

            const clasificacionSenal =
                clasificarSenalExperienciaDante(
                    senal
                );

            if (
                senal !== undefined &&
                senal !== null &&
                senal !== ""
            ) {
                partes.push(
                    `Señal ${senal} dBm${clasificacionSenal ? ` (${clasificacionSenal.toLowerCase()})` : ""}.`
                );
            }

            if (
                ruido !== undefined &&
                ruido !== null &&
                ruido !== ""
            ) {
                partes.push(
                    `Ruido ${ruido} dBm.`
                );
            }

            if (
                cliente.tx !== undefined &&
                cliente.tx !== null
            ) {
                partes.push(
                    `TX ${cliente.tx} Mbps.`
                );
            }

            if (
                cliente.rx !== undefined &&
                cliente.rx !== null
            ) {
                partes.push(
                    `RX ${cliente.rx} Mbps.`
                );
            }
        }

        const diagnostico =
            String(
                diagnosticoHumanoCpeDanteRef.current ||
                ""
            ).trim();

        if (diagnostico) {
            partes.push(
                `Diagnóstico de Dante: ${diagnostico}`
            );
        }

        partes.push(
            "Se solicita revisión física en sitio para comprobar equipo de enlace, fijación, alineación, cableado, línea de vista y condiciones del entorno."
        );

        return partes.join(
            " "
        );
    }

    async function prepararTicketMantenimientoDante(
        servicio?: ServicioClienteDante | null
    ): Promise<boolean> {
        const cliente =
            servicio ||
            servicioClienteDanteRef.current;

        if (!cliente) {
            responderDante(
                "Primero necesito saber para qué cliente deseas generar el ticket de mantenimiento."
            );
            return true;
        }

        const nombre =
            `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                .trim();

        const prioridad =
            obtenerPrioridadTicketMantenimientoDante();

        const tipo =
            tipoProblemaDiagnosticoDanteRef.current;

        const categoria:
            "INTERNET" | "EQUIPO" =
            cpeDiagnosticoDanteRef.current
                ? "EQUIPO"
                : "INTERNET";

        const motivo =
            tipo === "LENTITUD"
                ? "Lentitud"
                : tipo === "INTERMITENCIA"
                    ? "Intermitencia"
                    : tipo === "SIN_INTERNET"
                        ? "Sin servicio"
                        : "Revisión técnica";

        const pendiente:
            TicketMantenimientoPendienteDante = {
            servicio: cliente,
            titulo:
                `${motivo} - mantenimiento ${nombre}`,
            descripcion:
                construirDescripcionTicketMantenimientoDante(
                    cliente
                ),
            categoria,
            prioridad,
        };

        ticketMantenimientoPendienteDanteRef.current =
            pendiente;

        actualizarContextoDante({
            tema: "CLIENTE",
            entidadId:
                cliente.clienteId,
            entidadNombre:
                nombre,
            ultimaIntencion:
                "CONFIRMAR_TICKET_MANTENIMIENTO",
            esperandoRespuesta:
                true,
            datoPendiente:
                "CONFIRMAR_TICKET_MANTENIMIENTO",
        });

        responderDante(
            `De acuerdo. Tomaré como referencia al cliente ${nombre} que tenemos en contexto. ` +
            `Puedo generar un ticket de mantenimiento, categoría ${categoria.toLowerCase()} y prioridad ${prioridad.toLowerCase()}. ¿Deseas que lo genere?`
        );

        return true;
    }

    async function crearTicketMantenimientoDesdeDante(): Promise<void> {
        const pendiente =
            ticketMantenimientoPendienteDanteRef.current;

        if (!pendiente) {
            responderDante(
                "No tengo un ticket de mantenimiento pendiente."
            );
            return;
        }

        try {
            const token =
                getToken();

            responderDante(
                "De acuerdo. Estoy generando el ticket de mantenimiento."
            );

            // La pantalla de tickets utiliza la empresa principal.
            const resEmpresa =
                await fetch(
                    `${API_BASE}/facturacion/config/empresa`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                        cache:
                            "no-store",
                    }
                );

            const dataEmpresa =
                await resEmpresa
                    .json()
                    .catch(
                        () => ({})
                    );

            const empresas =
                Array.isArray(
                    dataEmpresa?.data
                )
                    ? dataEmpresa.data
                    : [];

            const empresaPrincipal =
                empresas.find(
                    (item: any) =>
                        Number(
                            item?.es_principal
                        ) === 1
                ) ||
                empresas[0];

            if (
                !resEmpresa.ok ||
                !empresaPrincipal?.id
            ) {
                throw new Error(
                    "No pude identificar la empresa principal."
                );
            }

            const res =
                await fetch(
                    `${API_BASE}/tickets`,
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
                                empresaId:
                                    String(
                                        empresaPrincipal.id
                                    ),
                                clienteTipo:
                                    "ISP",
                                clienteId:
                                    pendiente.servicio
                                        .cedula ||
                                    null,
                                titulo:
                                    pendiente.titulo,
                                descripcion:
                                    pendiente.descripcion,
                                categoria:
                                    pendiente.categoria,
                                prioridad:
                                    pendiente.prioridad,
                            }),
                    }
                );

            const data =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );

            if (
                !res.ok ||
                data?.ok === false
            ) {
                throw new Error(
                    data?.mensaje ||
                    data?.message ||
                    "No pude crear el ticket."
                );
            }

            const codigo =
                String(
                    data?.codigoTicket ||
                    data?.data
                        ?.codigoTicket ||
                    ""
                ).trim();

            ticketMantenimientoPendienteDanteRef.current =
                null;

            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion:
                    "TICKET_MANTENIMIENTO_CREADO",
                esperandoRespuesta:
                    false,
                datoPendiente:
                    null,
            });

            responderDante(
                codigo
                    ? `Ticket de mantenimiento creado correctamente. Código ${codigo}.`
                    : "Ticket de mantenimiento creado correctamente."
            );
        } catch (error: any) {
            console.error(
                "DANTE: error creando ticket de mantenimiento:",
                error
            );

            responderDante(
                error?.message ||
                "No pude crear el ticket de mantenimiento."
            );
        }
    }

    async function procesarConfirmacionTicketMantenimientoDante(
        textoOriginal: string
    ): Promise<boolean> {
        if (
            !ticketMantenimientoPendienteDanteRef.current
        ) {
            return false;
        }

        const respuesta =
            normalizarTextoDante(
                textoOriginal
            )
                .replace(
                    /^\s*dante\s+/,
                    ""
                )
                .trim();

        if (esSiDante(respuesta)) {
            await crearTicketMantenimientoDesdeDante();
            return true;
        }

        if (esNoDante(respuesta)) {
            ticketMantenimientoPendienteDanteRef.current =
                null;

            actualizarContextoDante({
                tema: "CLIENTE",
                esperandoRespuesta:
                    false,
                datoPendiente:
                    null,
            });

            responderDante(
                "De acuerdo. No generaré el ticket de mantenimiento."
            );

            return true;
        }

        responderDante(
            "Necesito tu confirmación. Dime sí para generar el ticket de mantenimiento o no para cancelarlo."
        );

        return true;
    }

    // ========================================================
    // DANTE V3 - DIAGNÓSTICO DIRECTO DEL CPE DEL CLIENTE
    // Reutiliza las rutas existentes de EquiposWirelessPage.
    // IMPORTANTE: aquí NO usamos /estado ONLINE/OFFLINE.
    // ========================================================

    function parseMcaStatusCpeDante(salida: string) {
        const bloque =
            String(salida || "").split("---IWCONFIG---")[0] || "";

        const data: any = {};

        bloque
            .split("\n")
            .forEach((linea) => {
                const textoLinea = linea.trim();

                if (
                    !textoLinea ||
                    textoLinea.includes("---MCA_STATUS---")
                ) {
                    return;
                }

                textoLinea
                    .split(",")
                    .forEach((parte) => {
                        const [key, value] =
                            parte.split("=");

                        if (
                            key &&
                            value !== undefined
                        ) {
                            data[key.trim()] =
                                value.trim();
                        }
                    });
            });

        return data;
    }

    function parseStationsCpeDante(salida: string): any[] {
        const bloque =
            String(salida || "")
                .split("---STATIONS---")[1]
                ?.split("---IWCONFIG---")[0]
                ?.trim() || "";

        if (!bloque) {
            return [];
        }

        try {
            const inicioArray =
                bloque.indexOf("[");

            const finArray =
                bloque.lastIndexOf("]");

            if (
                inicioArray >= 0 &&
                finArray > inicioArray
            ) {
                const json =
                    JSON.parse(
                        bloque.substring(
                            inicioArray,
                            finArray + 1
                        )
                    );

                if (Array.isArray(json)) {
                    return json;
                }
            }

            const inicioObj =
                bloque.indexOf("{");

            const finObj =
                bloque.lastIndexOf("}");

            if (
                inicioObj >= 0 &&
                finObj > inicioObj
            ) {
                const json =
                    JSON.parse(
                        bloque.substring(
                            inicioObj,
                            finObj + 1
                        )
                    );

                if (Array.isArray(json)) {
                    return json;
                }

                if (Array.isArray(json?.stations)) {
                    return json.stations;
                }

                if (Array.isArray(json?.hosts)) {
                    return json.hosts;
                }

                if (Array.isArray(json?.data)) {
                    return json.data;
                }

                return [json];
            }
        } catch (error) {
            console.error(
                "DANTE V3 CPE: error parseando estaciones:",
                error
            );
        }

        return [];
    }

    function obtenerBloquesRedCpeDante(
        salidaOriginal: string
    ) {
        const salida =
            String(salidaOriginal || "");

        const cfg =
            salida
                .split("---CFG---")[1]
                ?.split("---ROUTES---")[0] ||
            "";

        const routes =
            salida
                .split("---ROUTES---")[1]
                ?.split("---DNS---")[0] ||
            "";

        const dns =
            salida
                .split("---DNS---")[1]
                ?.split("---NAT---")[0] ||
            "";

        const obtenerCfg = (
            clave: string
        ) => {
            const linea =
                cfg
                    .split("\n")
                    .find(
                        (item) =>
                            item.startsWith(
                                `${clave}=`
                            )
                    );

            return (
                linea
                    ?.split("=")[1]
                    ?.trim() ||
                ""
            );
        };

        const lineaGateway =
            routes
                .split("\n")
                .map(
                    (linea) =>
                        linea.trim()
                )
                .find(
                    (linea) =>
                        linea.startsWith(
                            "0.0.0.0"
                        ) ||
                        linea.includes(
                            " UG "
                        )
                );

        let gateway = "-";
        let interfaz = "-";

        if (lineaGateway) {
            const partes =
                lineaGateway.split(/\s+/);

            gateway =
                partes[1] || "-";

            interfaz =
                partes[7] ||
                partes[
                partes.length - 1
                ] ||
                "-";
        }

        const servidoresDns =
            dns
                .split("\n")
                .filter(
                    (linea) =>
                        linea.includes(
                            "nameserver"
                        )
                )
                .map(
                    (linea) =>
                        linea
                            .replace(
                                "nameserver",
                                ""
                            )
                            .trim()
                );

        return {
            frecuencia:
                obtenerCfg(
                    "radio.1.freq"
                ),
            anchoCanal:
                obtenerCfg(
                    "radio.1.chanbw"
                ),
            potenciaTx:
                obtenerCfg(
                    "radio.1.txpower"
                ),
            gateway,
            interfaz,
            dns1:
                servidoresDns[0] ||
                "-",
            dns2:
                servidoresDns[1] ||
                "-",
        };
    }

    function formatearUptimeCpeDante(
        segundosValor: unknown
    ): string {
        const segundos =
            Number(
                segundosValor ||
                0
            );

        if (
            !Number.isFinite(segundos) ||
            segundos <= 0
        ) {
            return "";
        }

        const dias =
            Math.floor(
                segundos /
                86400
            );

        const horas =
            Math.floor(
                (
                    segundos %
                    86400
                ) /
                3600
            );

        const minutos =
            Math.floor(
                (
                    segundos %
                    3600
                ) /
                60
            );

        return `${dias} días, ${horas} horas y ${minutos} minutos`;
    }

    async function obtenerEquiposWirelessDante(
        router: RouterMikrotikDante | null
    ): Promise<EquipoWirelessDante[]> {
        try {
            const token =
                getToken();

            const res =
                await fetch(
                    `${API_BASE}/wireless/equipos`,
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
                await res
                    .json()
                    .catch(
                        () => ({})
                    );

            if (
                !res.ok ||
                data?.ok === false
            ) {
                return [];
            }

            const lista =
                Array.isArray(
                    data?.equipos
                )
                    ? data.equipos
                    : Array.isArray(
                        data?.data
                    )
                        ? data.data
                        : [];

            if (!router) {
                return lista;
            }

            const mismoRouter =
                lista.filter(
                    (
                        equipo:
                            EquipoWirelessDante
                    ) =>
                        Number(
                            equipo.routerId
                        ) ===
                        Number(
                            router.id
                        )
                );

            return mismoRouter.length
                ? mismoRouter
                : lista;
        } catch (error) {
            console.error(
                "DANTE V3 CPE: error cargando equipos wireless:",
                error
            );

            return [];
        }
    }

    async function obtenerMetricasWirelessDante(
        equipoId: string
    ): Promise<any | null> {
        try {
            const token =
                getToken();

            const res =
                await fetch(
                    `${API_BASE}/wireless/equipos/${equipoId}/metricas`,
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
                await res
                    .json()
                    .catch(
                        () => ({})
                    );

            if (
                !res.ok ||
                data?.ok === false ||
                !data?.salida
            ) {
                return null;
            }

            return data;
        } catch (error) {
            console.error(
                "DANTE V3 CPE: error consultando métricas:",
                error
            );

            return null;
        }
    }

    async function localizarCpeClienteDante(
        servicio: ServicioClienteDante,
        router: RouterMikrotikDante | null
    ): Promise<ContextoCpeDante | null> {
        const perfil =
            await obtenerPerfilActualDante();

        const ipCliente =
            String(
                perfil?.servicio
                    ?.ipCliente ||
                servicio.ipCliente ||
                ""
            ).trim();

        if (!ipCliente) {
            return null;
        }

        const equipos =
            await obtenerEquiposWirelessDante(
                router
            );

        const ordenados =
            [...equipos].sort(
                (a, b) => {
                    const prioridad = (
                        equipo:
                            EquipoWirelessDante
                    ) => {
                        const tipo =
                            String(
                                equipo.tipoEquipo ||
                                ""
                            ).toUpperCase();

                        if (
                            tipo ===
                            "SECTORIAL"
                        ) {
                            return 0;
                        }

                        if (
                            tipo === "AP"
                        ) {
                            return 1;
                        }

                        if (
                            tipo === "ENLACE"
                        ) {
                            return 2;
                        }

                        if (
                            tipo ===
                            "CPE_CLIENTE"
                        ) {
                            return 3;
                        }

                        return 4;
                    };

                    return (
                        prioridad(a) -
                        prioridad(b)
                    );
                }
            );

        for (
            const equipo of
            ordenados
        ) {
            const equipoId =
                String(
                    equipo.equipoId ||
                    ""
                ).trim();

            if (!equipoId) {
                continue;
            }

            const metricas =
                await obtenerMetricasWirelessDante(
                    equipoId
                );

            if (!metricas?.salida) {
                continue;
            }

            const estaciones =
                parseStationsCpeDante(
                    metricas.salida
                );

            const cliente =
                estaciones.find(
                    (item: any) => {
                        const ips =
                            [
                                item?.lastip,
                                ...(Array.isArray(
                                    item?.remote
                                        ?.ipaddr
                                )
                                    ? item.remote.ipaddr
                                    : []),
                            ]
                                .map(
                                    (valor) =>
                                        String(
                                            valor ||
                                            ""
                                        ).trim()
                                )
                                .filter(
                                    Boolean
                                );

                        return ips.includes(
                            ipCliente
                        );
                    }
                );

            if (cliente) {
                return {
                    equipo,
                    cliente,
                    metricas,
                    ipCliente,
                };
            }

            // Respaldo: si el propio CPE está registrado directamente
            // con la misma IP de gestión, aprovechamos sus métricas.
            if (
                String(
                    equipo.ipGestion ||
                    ""
                ).trim() ===
                ipCliente
            ) {
                const mca =
                    parseMcaStatusCpeDante(
                        metricas.salida
                    );

                return {
                    equipo,
                    metricas,
                    ipCliente,
                    cliente: {
                        lastip:
                            ipCliente,
                        mac:
                            equipo.mac ||
                            mca.deviceId,
                        signal:
                            mca.signal,
                        noisefloor:
                            mca.noise,
                        tx:
                            mca.wlanTxRate,
                        rx:
                            mca.wlanRxRate,
                        remote: {
                            hostname:
                                mca.deviceName ||
                                equipo.nombre,
                            platform:
                                mca.platform ||
                                equipo.modelo,
                            cpuload:
                                mca.cpuUsage,
                            freeram:
                                mca.freeMemory,
                            uptime:
                                mca.uptime,
                        },
                    },
                };
            }
        }

        return null;
    }

    function construirResumenCpeDante(
        contexto:
            ContextoCpeDante
    ): string {
        const cliente =
            contexto.cliente ||
            {};

        const remote =
            cliente.remote ||
            {};

        const salida =
            String(
                contexto.metricas
                    ?.salida ||
                ""
            );

        const red =
            obtenerBloquesRedCpeDante(
                salida
            );

        const nombre =
            remote.hostname ||
            cliente.name ||
            contexto.equipo.nombre ||
            "equipo";

        const modelo =
            remote.platform ||
            cliente.platform ||
            contexto.equipo.modelo ||
            contexto.equipo.marca ||
            "";

        const firmware =
            remote.version ||
            cliente.version ||
            "";

        const signal =
            cliente.signal ??
            remote.signal;

        const noise =
            cliente.noisefloor ??
            remote.noisefloor;

        const ack =
            cliente.ack;

        const tx =
            cliente.tx;

        const rx =
            cliente.rx;

        const distancia =
            cliente.distance ??
            remote.distance;

        const cpu =
            remote.cpuload ??
            cliente.cpuload;

        const ram =
            remote.freeram ??
            cliente.freeram;

        const uptime =
            formatearUptimeCpeDante(
                remote.uptime ??
                cliente.uptime
            );

        const eth =
            remote?.ethlist?.[0] ||
            null;

        let respuesta =
            `Encontré el equipo de enlace ${nombre}, IP ${contexto.ipCliente}.`;

        if (modelo) {
            respuesta +=
                ` Modelo ${modelo}.`;
        }

        if (firmware) {
            respuesta +=
                ` Firmware ${firmware}.`;
        }

        if (
            signal !== undefined &&
            signal !== null &&
            signal !== ""
        ) {
            respuesta +=
                ` Señal ${signal} dBm.`;
        }

        if (
            noise !== undefined &&
            noise !== null &&
            noise !== ""
        ) {
            respuesta +=
                ` Ruido ${noise} dBm.`;
        }

        if (
            ack !== undefined &&
            ack !== null &&
            ack !== ""
        ) {
            respuesta +=
                ` ACK ${ack} microsegundos.`;
        }

        if (
            tx !== undefined &&
            tx !== null &&
            tx !== ""
        ) {
            respuesta +=
                ` TX ${tx} Mbps.`;
        }

        if (
            rx !== undefined &&
            rx !== null &&
            rx !== ""
        ) {
            respuesta +=
                ` RX ${rx} Mbps.`;
        }

        if (
            distancia !== undefined &&
            distancia !== null &&
            distancia !== ""
        ) {
            respuesta +=
                ` Distancia ${distancia} metros.`;
        }

        if (
            cpu !== undefined &&
            cpu !== null &&
            cpu !== ""
        ) {
            respuesta +=
                ` CPU ${cpu} por ciento.`;
        }

        if (
            ram !== undefined &&
            ram !== null &&
            ram !== ""
        ) {
            respuesta +=
                ` RAM libre ${ram} KB.`;
        }

        if (uptime) {
            respuesta +=
                ` Tiempo encendido ${uptime}.`;
        }

        if (eth) {
            respuesta +=
                eth.plugged
                    ? ` El puerto Ethernet está conectado${eth.speed ? ` a ${eth.speed} Mbps` : ""}${eth.duplex === true ? " Full Duplex" : eth.duplex === false ? " Half Duplex" : ""}.`
                    : " El puerto Ethernet aparece desconectado.";
        }

        if (
            red.frecuencia &&
            red.frecuencia !== "-"
        ) {
            respuesta +=
                ` Frecuencia ${red.frecuencia} MHz.`;
        }

        if (
            red.anchoCanal &&
            red.anchoCanal !== "-"
        ) {
            respuesta +=
                ` Ancho de canal ${red.anchoCanal} MHz.`;
        }

        if (
            red.potenciaTx &&
            red.potenciaTx !== "-"
        ) {
            respuesta +=
                ` Potencia TX ${red.potenciaTx} dBm.`;
        }

        return respuesta;
    }

    // ========================================================
    // DANTE V3 - MOTOR DE EXPERIENCIA HUMANA PARA CPE
    // Reglas aportadas desde experiencia de campo.
    // No reemplaza las métricas: las interpreta y busca patrones.
    // ========================================================

    function numeroCpeDante(
        valor: unknown
    ): number | null {
        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return null;
        }

        const numero =
            Number(
                String(valor)
                    .replace(/[^\d.-]/g, "")
            );

        return Number.isFinite(numero)
            ? numero
            : null;
    }

    function clasificarSenalExperienciaDante(
        senalValor: unknown
    ): string | null {
        const senal =
            numeroCpeDante(
                senalValor
            );

        if (senal === null) {
            return null;
        }

        if (senal <= -53 && senal >= -63) {
            return "EXCELENTE";
        }

        if (senal <= -64 && senal >= -72) {
            return "MUY BUENO";
        }

        if (senal <= -73 && senal >= -76) {
            return "BUENO";
        }

        if (senal <= -77 && senal >= -82) {
            return "REGULAR";
        }

        if (senal <= -83 && senal >= -87) {
            return "MALO";
        }

        if (senal <= -88) {
            return "HORRIBLE";
        }

        return null;
    }

    function clasificarRuidoExperienciaDante(
        ruidoValor: unknown
    ): string | null {
        const ruido =
            numeroCpeDante(
                ruidoValor
            );

        if (ruido === null) {
            return null;
        }

        if (ruido <= -96 && ruido >= -120) {
            return "EXCELENTE";
        }

        return null;
    }

    function encontrarClienteEnMetricasCpeDante(
        salida: string,
        contexto: ContextoCpeDante
    ): any | null {
        const estaciones =
            parseStationsCpeDante(
                salida
            );

        const mac =
            String(
                contexto.cliente?.mac ||
                ""
            )
                .trim()
                .toLowerCase();

        return (
            estaciones.find(
                (item: any) => {
                    const mismaMac =
                        mac &&
                        String(
                            item?.mac ||
                            ""
                        )
                            .trim()
                            .toLowerCase() === mac;

                    const ips =
                        [
                            item?.lastip,
                            ...(Array.isArray(
                                item?.remote
                                    ?.ipaddr
                            )
                                ? item.remote.ipaddr
                                : []),
                        ]
                            .map(
                                (valor) =>
                                    String(
                                        valor ||
                                        ""
                                    ).trim()
                            )
                            .filter(Boolean);

                    return (
                        mismaMac ||
                        ips.includes(
                            contexto.ipCliente
                        )
                    );
                }
            ) ||
            null
        );
    }

    type MuestraExperienciaCpeDante = {
        tx: number | null;
        rx: number | null;
        ruido: number | null;
        senal: number | null;
    };

    function extraerMuestraExperienciaCpeDante(
        cliente: any
    ): MuestraExperienciaCpeDante {
        const remote =
            cliente?.remote ||
            {};

        return {
            tx:
                numeroCpeDante(
                    cliente?.tx
                ),
            rx:
                numeroCpeDante(
                    cliente?.rx
                ),
            ruido:
                numeroCpeDante(
                    cliente?.noisefloor ??
                    remote?.noisefloor
                ),
            senal:
                numeroCpeDante(
                    cliente?.signal ??
                    remote?.signal
                ),
        };
    }

    async function tomarMuestrasExperienciaCpeDante(
        contexto: ContextoCpeDante,
        cantidad = 4
    ): Promise<MuestraExperienciaCpeDante[]> {
        const muestras:
            MuestraExperienciaCpeDante[] =
            [];

        const inicial =
            extraerMuestraExperienciaCpeDante(
                contexto.cliente
            );

        muestras.push(
            inicial
        );

        const equipoId =
            String(
                contexto.equipo
                    ?.equipoId ||
                ""
            ).trim();

        if (!equipoId) {
            return muestras;
        }

        for (
            let i = 1;
            i < cantidad;
            i++
        ) {
            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        900
                    )
            );

            const metricas =
                await obtenerMetricasWirelessDante(
                    equipoId
                );

            if (!metricas?.salida) {
                continue;
            }

            const cliente =
                encontrarClienteEnMetricasCpeDante(
                    metricas.salida,
                    contexto
                );

            if (!cliente) {
                continue;
            }

            muestras.push(
                extraerMuestraExperienciaCpeDante(
                    cliente
                )
            );
        }

        return muestras;
    }

    function cercaDeValorExperienciaDante(
        valor: number | null,
        objetivo: number,
        tolerancia = 1.5
    ): boolean {
        return (
            valor !== null &&
            Math.abs(
                valor -
                objetivo
            ) <= tolerancia
        );
    }

    function detectarVariacionBruscaExperienciaDante(
        valores:
            Array<number | null>,
        diferenciaMinima:
            number
    ): boolean {
        const validos =
            valores.filter(
                (
                    valor
                ): valor is number =>
                    valor !== null &&
                    Number.isFinite(
                        valor
                    )
            );

        if (validos.length < 2) {
            return false;
        }

        const minimo =
            Math.min(
                ...validos
            );

        const maximo =
            Math.max(
                ...validos
            );

        return (
            maximo -
            minimo >=
            diferenciaMinima
        );
    }

    function construirDiagnosticoHumanoCpeDante(
        contexto: ContextoCpeDante,
        muestras:
            MuestraExperienciaCpeDante[]
    ): string {
        const actual =
            muestras[muestras.length - 1] ||
            extraerMuestraExperienciaCpeDante(
                contexto.cliente
            );

        const senales =
            muestras.map(
                (muestra) => muestra.senal
            );

        const ruidos =
            muestras.map(
                (muestra) => muestra.ruido
            );

        const txs =
            muestras.map(
                (muestra) => muestra.tx
            );

        const rxs =
            muestras.map(
                (muestra) => muestra.rx
            );

        const senalActual =
            actual.senal;

        const ruidoActual =
            actual.ruido;

        const txActual =
            actual.tx;

        const rxActual =
            actual.rx;

        const clasificacionSenal =
            clasificarSenalExperienciaDante(
                senalActual
            );

        const clasificacionRuido =
            clasificarRuidoExperienciaDante(
                ruidoActual
            );

        const textos: string[] = [];

        if (
            senalActual !== null &&
            clasificacionSenal
        ) {
            textos.push(
                `La señal ${senalActual} dBm está clasificada como ${clasificacionSenal.toLowerCase()}.`
            );
        }

        if (
            ruidoActual !== null &&
            clasificacionRuido === "EXCELENTE"
        ) {
            textos.push(
                `El ruido ${ruidoActual} dBm está en un nivel excelente.`
            );
        }

        // MOVIMIENTO / DESALINEACIÓN:
        // cambios bruscos 6 <-> 18 Mbps + señal en zona -76 / -81.
        const cambiaTx =
            detectarVariacionBruscaExperienciaDante(
                txs,
                8
            );

        const cambiaRx =
            detectarVariacionBruscaExperienciaDante(
                rxs,
                8
            );

        const cambiaSenal =
            detectarVariacionBruscaExperienciaDante(
                senales,
                4
            );

        const apareceZonaSeis =
            muestras.some(
                (muestra) =>
                    cercaDeValorExperienciaDante(
                        muestra.tx,
                        6,
                        2
                    ) ||
                    cercaDeValorExperienciaDante(
                        muestra.rx,
                        6,
                        2
                    )
            );

        const apareceZonaDieciocho =
            muestras.some(
                (muestra) =>
                    cercaDeValorExperienciaDante(
                        muestra.tx,
                        18,
                        4
                    ) ||
                    cercaDeValorExperienciaDante(
                        muestra.rx,
                        18,
                        4
                    )
            );

        const senalZonaMovimiento =
            senales.some(
                (senal) =>
                    senal !== null &&
                    senal <= -76 &&
                    senal >= -82
            );

        const posibleMovimiento =
            (cambiaTx || cambiaRx) &&
            cambiaSenal &&
            apareceZonaSeis &&
            apareceZonaDieciocho &&
            senalZonaMovimiento;

        if (posibleMovimiento) {
            textos.push(
                "Detecto un patrón compatible con movimiento o desalineación física del equipo de enlace: TX y RX cambian bruscamente entre valores bajos cercanos a 6 Mbps y valores cercanos a 18 Mbps, mientras la señal también cambia y entra aproximadamente entre -76 y -81 dBm. En campo este comportamiento es muy común cuando el viento mueve el equipo o se pierde la alineación. Recomiendo revisar primero la fijación, orientación y alineación física."
            );
        }

        // OBSTÁCULO / INTERFERENCIA AMBIENTAL:
        // señal -60 / -63 excelente + TX/RX alrededor de 6/6.
        const senalExcelenteAmbiental =
            senalActual !== null &&
            senalActual <= -60 &&
            senalActual >= -63;

        const enlaceSeisSeis =
            cercaDeValorExperienciaDante(
                txActual,
                6,
                2
            ) &&
            cercaDeValorExperienciaDante(
                rxActual,
                6,
                2
            );

        const posibleObstaculo =
            senalExcelenteAmbiental &&
            enlaceSeisSeis;

        if (
            posibleObstaculo &&
            !posibleMovimiento
        ) {
            textos.push(
                "La señal es excelente, pero TX y RX permanecen aproximadamente en 6 Mbps. Este patrón indica que los datos están limitados aunque la señal sea buena y es compatible con algo interfiriendo u obstruyendo el trayecto del enlace. Conviene revisar la línea de vista por plantas, ramas, vegetación, construcciones, relieve o montaña."
            );
        }

        if (
            !posibleMovimiento &&
            !posibleObstaculo
        ) {
            if (
                clasificacionSenal === "HORRIBLE"
            ) {
                textos.push(
                    "La señal está en una zona horrible y no es recomendable mantener el enlace en estas condiciones. Conviene revisar alineación, obstáculos y una posible sectorial alternativa."
                );
            } else if (
                clasificacionSenal === "MALO"
            ) {
                textos.push(
                    "La señal está en una zona mala. Puede degradar de forma importante el enlace y conviene revisar alineación, obstáculos e interferencias."
                );
            } else if (
                clasificacionSenal === "REGULAR"
            ) {
                textos.push(
                    "La señal está en una zona regular. No confirma por sí sola la falla, pero debe revisarse junto con la estabilidad de TX y RX."
                );
            }
        }

        if (textos.length === 0) {
            return (
                "Con las lecturas actuales no encuentro todavía un patrón de experiencia suficientemente claro para atribuir la falla a movimiento del equipo u obstáculo ambiental."
            );
        }

        return textos.join(" ");
    }

    async function ejecutarDiagnosticoHumanoCpeDante(
        contexto: ContextoCpeDante
    ): Promise<string> {
        try {
            const muestras =
                await tomarMuestrasExperienciaCpeDante(
                    contexto,
                    4
                );

            const diagnostico =
                construirDiagnosticoHumanoCpeDante(
                    contexto,
                    muestras
                );

            diagnosticoHumanoCpeDanteRef.current =
                diagnostico;

            return diagnostico;
        } catch (error) {
            console.error(
                "DANTE V3 CPE: error en diagnóstico humano:",
                error
            );

            diagnosticoHumanoCpeDanteRef.current =
                "";

            return "";
        }
    }

    async function iniciarDiagnosticoCpeDante(
        servicio:
            ServicioClienteDante,
        router:
            RouterMikrotikDante |
            null
    ): Promise<void> {
        credencialesCpeDanteRef.current = {
            usuario: "ubnt",
            clave: "jlzg",
            puerto: 22,
        };

        accionPendienteCpeDanteRef.current =
            null;

        // Desde este punto Dante entra en análisis técnico real.
        // El micrófono se apaga para impedir que conversaciones cercanas
        // alteren el flujo mientras localiza y compara el equipo.
        pausarMicrofonoParaAnalisisDante();

        responderDante(
            "De acuerdo. Voy a localizar el equipo de enlace del cliente y revisar sus métricas."
        );

        const contexto =
            await localizarCpeClienteDante(
                servicio,
                router
            );

        if (!contexto) {
            flujoDiagnosticoInternetDanteRef.current =
                null;

            cpeDiagnosticoDanteRef.current =
                null;

            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion:
                    "DIAGNOSTICO_CPE_NO_ENCONTRADO",
                esperandoRespuesta:
                    false,
                datoPendiente:
                    null,
            });

            reanudarMicrofonoDespuesAnalisisDante();

            responderDante(
                "No pude localizar el equipo de enlace de este cliente dentro de las estaciones wireless registradas. El diagnóstico anterior se mantiene sin cambios."
            );

            return;
        }

        cpeDiagnosticoDanteRef.current =
            contexto;

        flujoDiagnosticoInternetDanteRef.current = {
            etapa:
                "COMANDOS_CPE",
            candidatos: [],
            seleccionado:
                servicio,
            router,
        };

        actualizarContextoDante({
            tema: "WIRELESS",
            entidadId:
                servicio.clienteId,
            entidadNombre:
                `${servicio.nombres || ""} ${servicio.apellidos || ""}`.trim(),
            ultimaIntencion:
                "DIAGNOSTICO_CPE_V3",
            esperandoRespuesta:
                true,
            datoPendiente:
                "COMANDOS_CPE",
        });

        responderDante(
            construirResumenCpeDante(
                contexto
            ) +
            " Voy a comparar varias lecturas para aplicar también el diagnóstico de experiencia de campo."
        );

        let diagnosticoHumano =
            "";

        try {
            diagnosticoHumano =
                await ejecutarDiagnosticoHumanoCpeDante(
                    contexto
                );
        } finally {
            reanudarMicrofonoDespuesAnalisisDante();
        }

        responderDante(
            (
                diagnosticoHumano
                    ? `Diagnóstico técnico: ${diagnosticoHumano} `
                    : ""
            ) +
            "Ya estoy dentro de la revisión técnica del equipo de enlace. Puedes preguntarme por señal, ruido, TX y RX, diagnóstico, CPU, RAM, firmware, Ethernet, frecuencia, DNS, gateway, consumo, escanear sectoriales o pedirme reiniciar el equipo."
        );
    }

    function esFalloCredencialesCpeDante(
        data: any
    ): boolean {
        const mensaje =
            normalizarTextoDante(
                String(
                    data?.mensaje ||
                    data?.message ||
                    data?.error ||
                    ""
                )
            );

        return (
            mensaje.includes(
                "ssh"
            ) ||
            mensaje.includes(
                "usuario"
            ) ||
            mensaje.includes(
                "clave"
            ) ||
            mensaje.includes(
                "password"
            ) ||
            mensaje.includes(
                "autentic"
            ) ||
            mensaje.includes(
                "login"
            ) ||
            mensaje.includes(
                "permiso"
            ) ||
            mensaje.includes(
                "acceso"
            )
        );
    }

    function pedirCredencialesCpeDante(
        accion:
            Exclude<
                AccionPendienteCpeDante,
                null
            >
    ) {
        accionPendienteCpeDanteRef.current =
            accion;

        const flujo =
            flujoDiagnosticoInternetDanteRef.current;

        if (flujo) {
            flujo.etapa =
                "ESPERAR_USUARIO_CPE";
        }

        setMostrarEntradaTextoDante(
            true
        );

        setEntradaTextoDante(
            ""
        );

        actualizarContextoDante({
            tema: "WIRELESS",
            esperandoRespuesta:
                true,
            datoPendiente:
                "USUARIO_CPE",
        });

        responderDante(
            "No pude ingresar al equipo de enlace con las credenciales predeterminadas. Te habilité la entrada de texto. Escribe el usuario del equipo."
        );
    }

    async function ejecutarAccionPendienteCpeDante() {
        const accion =
            accionPendienteCpeDanteRef.current;

        accionPendienteCpeDanteRef.current =
            null;

        if (
            accion ===
            "REINICIAR"
        ) {
            await reiniciarCpeDesdeDante();
            return;
        }

        if (
            accion ===
            "ESCANEAR"
        ) {
            await escanearSectorialesCpeDante();
        }
    }

    async function reiniciarCpeDesdeDante() {
        const contexto =
            cpeDiagnosticoDanteRef.current;

        const flujo =
            flujoDiagnosticoInternetDanteRef.current;

        if (
            !contexto ||
            !flujo
        ) {
            responderDante(
                "Ya no tengo un equipo de enlace seleccionado."
            );
            return;
        }

        const equipoId =
            String(
                contexto.equipo
                    .equipoId ||
                ""
            ).trim();

        if (!equipoId) {
            responderDante(
                "No tengo el identificador del equipo wireless para enviar el reinicio."
            );
            return;
        }

        try {
            const token =
                getToken();

            const credenciales =
                credencialesCpeDanteRef.current;

            responderDante(
                `Voy a enviar el reinicio al equipo ${contexto.ipCliente}.`
            );

            const res =
                await fetch(
                    `${API_BASE}/wireless/equipos/${equipoId}/reiniciar`,
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
                                ipCliente:
                                    contexto.ipCliente,
                                usuarioCliente:
                                    credenciales.usuario,
                                claveCliente:
                                    credenciales.clave,
                                puertoCliente:
                                    Number(
                                        credenciales.puerto ||
                                        22
                                    ),
                            }),
                    }
                );

            const data =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );

            if (
                !res.ok ||
                data?.ok === false
            ) {
                if (
                    esFalloCredencialesCpeDante(
                        data
                    )
                ) {
                    pedirCredencialesCpeDante(
                        "REINICIAR"
                    );
                    return;
                }

                responderDante(
                    data?.mensaje ||
                    data?.message ||
                    "No pude reiniciar el equipo de enlace."
                );

                flujo.etapa =
                    "COMANDOS_CPE";

                return;
            }

            flujo.etapa =
                "COMANDOS_CPE";

            setMostrarEntradaTextoDante(
                false
            );

            responderDante(
                data?.mensaje ||
                "El reinicio fue enviado correctamente al equipo de enlace. Puede tardar unos momentos en volver a responder."
            );
        } catch (error) {
            console.error(
                "DANTE V3 CPE: error reiniciando CPE:",
                error
            );

            flujo.etapa =
                "COMANDOS_CPE";

            responderDante(
                "Ocurrió un error al intentar reiniciar el equipo de enlace."
            );
        }
    }

    function parseScanSectorialesCpeDante(
        salidaOriginal: string
    ) {
        const bloque =
            String(
                salidaOriginal ||
                ""
            )
                .split("---SCAN---")[1]
                ?.split("---END---")[0] ||
            "";

        return bloque
            .split("Cell ")
            .slice(1)
            .map(
                (cell) => ({
                    mac:
                        cell.match(
                            /Address:\s*([A-Fa-f0-9:]+)/
                        )?.[1] ||
                        "",
                    ssid:
                        cell.match(
                            /ESSID:"([^"]+)"/
                        )?.[1] ||
                        "",
                    frecuencia:
                        cell.match(
                            /Frequency:([\d.]+)\s*GHz/
                        )?.[1] ||
                        "",
                    canal:
                        cell.match(
                            /Channel[:=]\s*(\d+)/
                        )?.[1] ||
                        "",
                    signal:
                        cell.match(
                            /Signal level=(-?\d+)/
                        )?.[1] ||
                        "",
                    noise:
                        cell.match(
                            /Noise level=(-?\d+)/
                        )?.[1] ||
                        "",
                })
            )
            .filter(
                (item) =>
                    item.mac ||
                    item.ssid
            );
    }

    async function escanearSectorialesCpeDante() {
        const contexto =
            cpeDiagnosticoDanteRef.current;

        const flujo =
            flujoDiagnosticoInternetDanteRef.current;

        if (
            !contexto ||
            !flujo
        ) {
            return;
        }

        const equipoId =
            String(
                contexto.equipo
                    .equipoId ||
                ""
            ).trim();

        if (!equipoId) {
            responderDante(
                "No tengo el identificador del equipo wireless para ejecutar el escaneo."
            );
            return;
        }

        try {
            const token =
                getToken();

            const credenciales =
                credencialesCpeDanteRef.current;

            responderDante(
                "De acuerdo. Voy a escanear las sectoriales visibles desde el equipo de enlace."
            );

            const res =
                await fetch(
                    `${API_BASE}/wireless/equipos/${equipoId}/cliente/scan-sectoriales`,
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
                                ipCliente:
                                    contexto.ipCliente,
                                usuarioCliente:
                                    credenciales.usuario,
                                claveCliente:
                                    credenciales.clave,
                                puertoCliente:
                                    Number(
                                        credenciales.puerto ||
                                        22
                                    ),
                            }),
                    }
                );

            const data =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );

            if (
                !res.ok ||
                data?.ok === false
            ) {
                if (
                    esFalloCredencialesCpeDante(
                        data
                    )
                ) {
                    pedirCredencialesCpeDante(
                        "ESCANEAR"
                    );
                    return;
                }

                responderDante(
                    data?.mensaje ||
                    data?.message ||
                    "No pude escanear las sectoriales desde el equipo de enlace."
                );

                flujo.etapa =
                    "COMANDOS_CPE";

                return;
            }

            const lista =
                parseScanSectorialesCpeDante(
                    data?.salida ||
                    ""
                );

            const sinRepetidos =
                Array.from(
                    new Map(
                        lista.map(
                            (item: any) => [
                                item.mac ||
                                item.ssid,
                                item,
                            ]
                        )
                    ).values()
                ) as any[];

            flujo.etapa =
                "COMANDOS_CPE";

            setMostrarEntradaTextoDante(
                false
            );

            if (
                sinRepetidos.length ===
                0
            ) {
                responderDante(
                    "El escaneo terminó, pero no encontré sectoriales visibles."
                );
                return;
            }

            const mejores =
                sinRepetidos
                    .sort(
                        (a, b) =>
                            Number(
                                b.signal ||
                                -999
                            ) -
                            Number(
                                a.signal ||
                                -999
                            )
                    )
                    .slice(0, 5)
                    .map(
                        (
                            item,
                            index
                        ) =>
                            `${index + 1}. ${item.ssid || "sin nombre"}, señal ${item.signal || "-"} dBm${item.noise ? `, ruido ${item.noise} dBm` : ""}${item.frecuencia ? `, frecuencia ${item.frecuencia} GHz` : ""}`
                    )
                    .join(". ");

            responderDante(
                `Encontré ${sinRepetidos.length} sectoriales visibles. Las principales son: ${mejores}.`
            );
        } catch (error) {
            console.error(
                "DANTE V3 CPE: error escaneando sectoriales:",
                error
            );

            flujo.etapa =
                "COMANDOS_CPE";

            responderDante(
                "Ocurrió un error al escanear las sectoriales."
            );
        }
    }

    async function medirConsumoClienteCpeDante() {
        const contexto =
            cpeDiagnosticoDanteRef.current;

        if (!contexto) {
            return;
        }

        const equipoId =
            String(
                contexto.equipo
                    .equipoId ||
                ""
            ).trim();

        if (!equipoId) {
            responderDante(
                "No tengo el identificador necesario para medir el consumo."
            );
            return;
        }

        responderDante(
            "Voy a tomar una muestra corta del tráfico real del cliente."
        );

        const muestra1 =
            await obtenerMetricasWirelessDante(
                equipoId
            );

        if (!muestra1?.salida) {
            responderDante(
                "No pude obtener la primera muestra de tráfico."
            );
            return;
        }

        const estaciones1 =
            parseStationsCpeDante(
                muestra1.salida
            );

        const mac =
            String(
                contexto.cliente
                    ?.mac ||
                ""
            ).toLowerCase();

        const buscarEstacion = (
            lista: any[]
        ) =>
            lista.find(
                (item: any) =>
                    (
                        mac &&
                        String(
                            item?.mac ||
                            ""
                        ).toLowerCase() ===
                        mac
                    ) ||
                    String(
                        item?.lastip ||
                        ""
                    ).trim() ===
                    contexto.ipCliente
            );

        const cliente1 =
            buscarEstacion(
                estaciones1
            );

        if (!cliente1?.stats) {
            responderDante(
                "El equipo de enlace responde, pero no recibí contadores de tráfico del cliente."
            );
            return;
        }

        await new Promise(
            (resolve) =>
                setTimeout(
                    resolve,
                    3000
                )
        );

        const muestra2 =
            await obtenerMetricasWirelessDante(
                equipoId
            );

        const cliente2 =
            muestra2?.salida
                ? buscarEstacion(
                    parseStationsCpeDante(
                        muestra2.salida
                    )
                )
                : null;

        if (!cliente2?.stats) {
            responderDante(
                "No pude completar la segunda muestra de tráfico."
            );
            return;
        }

        const rxDiff =
            Number(
                cliente2.stats
                    .rx_bytes ||
                0
            ) -
            Number(
                cliente1.stats
                    .rx_bytes ||
                0
            );

        const txDiff =
            Number(
                cliente2.stats
                    .tx_bytes ||
                0
            ) -
            Number(
                cliente1.stats
                    .tx_bytes ||
                0
            );

        const rxMbps =
            Math.max(
                0,
                Number(
                    (
                        (
                            rxDiff *
                            8
                        ) /
                        3 /
                        1000000
                    ).toFixed(2)
                )
            );

        const txMbps =
            Math.max(
                0,
                Number(
                    (
                        (
                            txDiff *
                            8
                        ) /
                        3 /
                        1000000
                    ).toFixed(2)
                )
            );

        responderDante(
            `Consumo real aproximado del cliente: RX ${rxMbps} Mbps y TX ${txMbps} Mbps durante la muestra.`
        );
    }

    function responderDatoCpeDante(
        textoOriginal: string
    ): boolean {
        const contexto =
            cpeDiagnosticoDanteRef.current;

        if (!contexto) {
            return false;
        }

        const texto =
            normalizarTextoDante(
                textoOriginal
            );

        const cliente =
            contexto.cliente ||
            {};

        const remote =
            cliente.remote ||
            {};

        const red =
            obtenerBloquesRedCpeDante(
                contexto.metricas
                    ?.salida ||
                ""
            );

        const eth =
            remote?.ethlist?.[0] ||
            null;

        if (
            /\b(diagnostico|diagnóstico|causa|problema|que encuentras|qué encuentras|que detectas|qué detectas|recomendacion|recomendación|movimiento|desalineado|desalineacion|desalineación|obstaculo|obstáculo|interferencia|plantas|vegetacion|vegetación|montana|montaña)\b/.test(
                texto
            )
        ) {
            const diagnostico =
                diagnosticoHumanoCpeDanteRef.current;

            responderDante(
                diagnostico ||
                "Con las lecturas actuales todavía no tengo un patrón de experiencia suficientemente claro. Puedo volver a revisar las métricas del equipo."
            );

            return true;
        }

        if (
            /\b(senal|señal|ruido|ack|radio|enlace)\b/.test(
                texto
            )
        ) {
            const senalActual =
                cliente.signal ??
                remote.signal;

            const ruidoActual =
                cliente.noisefloor ??
                remote.noisefloor;

            const clasificacionSenal =
                clasificarSenalExperienciaDante(
                    senalActual
                );

            const clasificacionRuido =
                clasificarRuidoExperienciaDante(
                    ruidoActual
                );

            responderDante(
                `En el equipo de enlace tengo señal ${senalActual ?? "-"} dBm${clasificacionSenal ? `, clasificada como ${clasificacionSenal.toLowerCase()}` : ""}, ruido ${ruidoActual ?? "-"} dBm${clasificacionRuido ? `, clasificado como ${clasificacionRuido.toLowerCase()}` : ""}, ACK ${cliente.ack ?? "-"} microsegundos, TX ${cliente.tx ?? "-"} Mbps y RX ${cliente.rx ?? "-"} Mbps.`
            );
            return true;
        }

        if (
            /\b(cpu|ram|memoria|recursos|uptime|encendido)\b/.test(
                texto
            )
        ) {
            const uptime =
                formatearUptimeCpeDante(
                    remote.uptime ??
                    cliente.uptime
                ) ||
                "sin dato";

            responderDante(
                `Recursos del equipo de enlace: CPU ${remote.cpuload ?? cliente.cpuload ?? "-"} por ciento, RAM libre ${remote.freeram ?? cliente.freeram ?? "-"} KB y tiempo encendido ${uptime}.`
            );
            return true;
        }

        if (
            /\b(modelo|firmware|version|versión|nombre del equipo|nombre cpe)\b/.test(
                texto
            )
        ) {
            responderDante(
                `El equipo de enlace se identifica como ${remote.hostname || cliente.name || contexto.equipo.nombre || "sin nombre"}, modelo ${remote.platform || cliente.platform || contexto.equipo.modelo || "-"}, firmware ${remote.version || cliente.version || "-"}.`
            );
            return true;
        }

        if (
            /\b(ethernet|lan|cable|duplex|puerto)\b/.test(
                texto
            )
        ) {
            if (!eth) {
                responderDante(
                    "No recibí información Ethernet del equipo de enlace."
                );
            } else {
                responderDante(
                    `Ethernet ${eth.ifname || ""}: ${eth.plugged ? "conectado" : "desconectado"}${eth.speed ? ` a ${eth.speed} Mbps` : ""}${eth.duplex === true ? ", Full Duplex" : eth.duplex === false ? ", Half Duplex" : ""}.`
                );
            }

            return true;
        }

        if (
            /\b(frecuencia|canal|potencia)\b/.test(
                texto
            )
        ) {
            responderDante(
                `Radio del enlace: frecuencia ${red.frecuencia || "-"} MHz, ancho de canal ${red.anchoCanal || "-"} MHz y potencia TX ${red.potenciaTx || "-"} dBm.`
            );
            return true;
        }

        if (
            /\b(dns|gateway|puerta de enlace|wan|configuracion de red|configuración de red)\b/.test(
                texto
            )
        ) {
            responderDante(
                `Configuración de red disponible: IP ${contexto.ipCliente}, gateway ${red.gateway}, interfaz ${red.interfaz}, DNS primario ${red.dns1} y DNS secundario ${red.dns2}.`
            );
            return true;
        }

        if (
            /\b(resumen|detalle|todo|diagnostico cpe|diagnóstico cpe)\b/.test(
                texto
            )
        ) {
            const diagnostico =
                diagnosticoHumanoCpeDanteRef.current;

            responderDante(
                construirResumenCpeDante(
                    contexto
                ) +
                (
                    diagnostico
                        ? ` Diagnóstico técnico: ${diagnostico}`
                        : ""
                )
            );
            return true;
        }

        return false;
    }

    async function procesarComandosCpeDante(
        textoOriginal: string
    ): Promise<boolean> {
        const flujo =
            flujoDiagnosticoInternetDanteRef.current;

        if (
            !flujo ||
            flujo.etapa !==
            "COMANDOS_CPE"
        ) {
            return false;
        }

        const texto =
            normalizarTextoDante(
                textoOriginal
            );

        if (
            texto === "salir" ||
            texto === "terminar" ||
            texto.includes(
                "termina la revision"
            ) ||
            texto.includes(
                "terminar la revision"
            ) ||
            texto.includes(
                "salir del cpe"
            ) ||
            texto.includes(
                "termina el diagnostico"
            )
        ) {
            flujoDiagnosticoInternetDanteRef.current =
                null;

            cpeDiagnosticoDanteRef.current =
                null;

            accionPendienteCpeDanteRef.current =
                null;

            actualizarContextoDante({
                tema: "CLIENTE",
                esperandoRespuesta:
                    false,
                datoPendiente:
                    null,
            });

            responderDante(
                "De acuerdo. Terminé la revisión directa del equipo de enlace. ¿En qué más te puedo ayudar?"
            );

            return true;
        }

        if (
            /\b(reinicia|reiniciar|reinicio|reboot)\b/.test(
                texto
            ) &&
            /\b(cpe|equipo|radio|antena|cliente)\b/.test(
                texto
            )
        ) {
            flujo.etapa =
                "CONFIRMAR_REINICIO_CPE";

            actualizarContextoDante({
                tema: "WIRELESS",
                esperandoRespuesta:
                    true,
                datoPendiente:
                    "CONFIRMAR_REINICIO_CPE",
            });

            responderDante(
                `¿Confirmas que deseas reiniciar el equipo ${cpeDiagnosticoDanteRef.current?.ipCliente || ""}?`
            );

            return true;
        }

        if (
            (
                texto.includes(
                    "escanear"
                ) ||
                texto.includes(
                    "escanea"
                ) ||
                texto.includes(
                    "scan"
                )
            ) &&
            (
                texto.includes(
                    "sectorial"
                ) ||
                texto.includes(
                    "ssid"
                ) ||
                texto.includes(
                    "redes"
                )
            )
        ) {
            await escanearSectorialesCpeDante();
            return true;
        }

        if (
            /\b(trafico|tráfico|consumo|consumiendo|velocidad real|uso actual)\b/.test(
                texto
            )
        ) {
            await medirConsumoClienteCpeDante();
            return true;
        }

        // --------------------------------------------------------
        // ESCALAMIENTO A VISITA TÉCNICA / MANTENIMIENTO
        // --------------------------------------------------------
        if (
            esSolicitudTicketMantenimientoDante(
                textoOriginal
            )
        ) {
            return await prepararTicketMantenimientoDante(
                flujo.seleccionado ||
                servicioClienteDanteRef.current
            );
        }

        if (
            esPersistenciaProblemaDespuesDiagnosticoDante(
                textoOriginal
            )
        ) {
            const contexto =
                cpeDiagnosticoDanteRef.current;

            const clienteEquipo =
                contexto?.cliente ||
                {};

            const remote =
                clienteEquipo?.remote ||
                {};

            const senal =
                clienteEquipo?.signal ??
                remote?.signal;

            const clasificacion =
                clasificarSenalExperienciaDante(
                    senal
                );

            const estadoSenalBueno =
                clasificacion === "EXCELENTE" ||
                clasificacion === "MUY BUENO" ||
                clasificacion === "BUENO";

            const nombre =
                `${flujo.seleccionado?.nombres || servicioClienteDanteRef.current?.nombres || ""} ${flujo.seleccionado?.apellidos || servicioClienteDanteRef.current?.apellidos || ""}`
                    .trim();

            responderDante(
                estadoSenalBueno
                    ? `Entiendo. La señal del equipo está ${String(clasificacion).toLowerCase()} y las comprobaciones remotas no muestran una causa concluyente para la lentitud. En este punto lo mejor es enviar un técnico para revisar físicamente el lugar, el cableado, la alineación y el entorno${nombre ? ` de ${nombre}` : ""}. ¿Deseas que genere un ticket de mantenimiento?`
                    : `Entiendo. Como el problema continúa y las comprobaciones remotas no permiten confirmar una causa única, lo mejor es enviar un técnico para revisar físicamente el lugar${nombre ? ` de ${nombre}` : ""}. ¿Deseas que genere un ticket de mantenimiento?`
            );

            const clienteTicket =
                flujo.seleccionado ||
                servicioClienteDanteRef.current;

            if (clienteTicket) {
                const prioridad =
                    obtenerPrioridadTicketMantenimientoDante();

                ticketMantenimientoPendienteDanteRef.current = {
                    servicio:
                        clienteTicket,
                    titulo:
                        `${tipoProblemaDiagnosticoDanteRef.current === "LENTITUD" ? "Lentitud" : tipoProblemaDiagnosticoDanteRef.current === "INTERMITENCIA" ? "Intermitencia" : tipoProblemaDiagnosticoDanteRef.current === "SIN_INTERNET" ? "Sin servicio" : "Revisión técnica"} - mantenimiento ${`${clienteTicket.nombres || ""} ${clienteTicket.apellidos || ""}`.trim()}`,
                    descripcion:
                        construirDescripcionTicketMantenimientoDante(
                            clienteTicket
                        ),
                    categoria:
                        contexto
                            ? "EQUIPO"
                            : "INTERNET",
                    prioridad,
                };

                actualizarContextoDante({
                    tema: "CLIENTE",
                    entidadId:
                        clienteTicket.clienteId,
                    entidadNombre:
                        `${clienteTicket.nombres || ""} ${clienteTicket.apellidos || ""}`.trim(),
                    ultimaIntencion:
                        "CONFIRMAR_TICKET_MANTENIMIENTO",
                    esperandoRespuesta:
                        true,
                    datoPendiente:
                        "CONFIRMAR_TICKET_MANTENIMIENTO",
                });
            }

            return true;
        }

        if (
            responderDatoCpeDante(
                textoOriginal
            )
        ) {
            return true;
        }

        responderDante(
            "Estoy en la revisión directa del equipo de enlace. Puedes preguntarme por el diagnóstico o causa probable, señal, ruido, TX y RX, CPU, RAM, firmware, Ethernet, frecuencia, DNS, gateway o consumo. También puedes pedirme escanear sectoriales o reiniciar el equipo."
        );

        return true;
    }

    async function procesarFlujoDiagnosticoInternetDante(
        textoOriginal: string
    ): Promise<boolean> {
        const flujo = flujoDiagnosticoInternetDanteRef.current;
        if (!flujo) return false;

        if (flujo.etapa === "CONFIRMAR_CPE") {
            if (esSiDante(textoOriginal)) {
                if (!flujo.seleccionado) {
                    flujoDiagnosticoInternetDanteRef.current = null;

                    responderDante(
                        "Perdí la referencia del cliente. Dime nuevamente qué cliente deseas revisar."
                    );

                    return true;
                }

                await iniciarDiagnosticoCpeDante(
                    flujo.seleccionado,
                    flujo.router
                );

                return true;
            }

            if (esNoDante(textoOriginal)) {
                flujoDiagnosticoInternetDanteRef.current = null;

                cpeDiagnosticoDanteRef.current = null;

                actualizarContextoDante({
                    tema: "CLIENTE",
                    esperandoRespuesta: false,
                    datoPendiente: null,
                });

                responderDante(
                    "De acuerdo. No entraré al equipo de enlace. Dejamos el diagnóstico hasta aquí. ¿En qué más te puedo ayudar?"
                );

                return true;
            }

            responderDante(
                "Dime sí para revisar directamente el equipo de enlace del cliente o no para terminar el diagnóstico."
            );

            return true;
        }

        if (flujo.etapa === "COMANDOS_CPE") {
            return await procesarComandosCpeDante(
                textoOriginal
            );
        }

        if (flujo.etapa === "CONFIRMAR_REINICIO_CPE") {
            if (esSiDante(textoOriginal)) {
                await reiniciarCpeDesdeDante();
                return true;
            }

            if (esNoDante(textoOriginal)) {
                flujo.etapa =
                    "COMANDOS_CPE";

                actualizarContextoDante({
                    tema: "WIRELESS",
                    esperandoRespuesta: true,
                    datoPendiente: "COMANDOS_CPE",
                });

                responderDante(
                    "De acuerdo. No reiniciaré el equipo. Podemos continuar revisando sus métricas."
                );

                return true;
            }

            responderDante(
                "Necesito tu confirmación. Dime sí para reiniciar el equipo o no para cancelar."
            );

            return true;
        }

        if (flujo.etapa === "ESPERAR_USUARIO_CPE") {
            const usuario =
                String(
                    textoOriginal ||
                    ""
                ).trim();

            if (!usuario) {
                responderDante(
                    "Escribe el usuario SSH del equipo."
                );
                return true;
            }

            credencialesCpeDanteRef.current.usuario =
                usuario;

            flujo.etapa =
                "ESPERAR_CLAVE_CPE";

            setMostrarEntradaTextoDante(
                true
            );

            setEntradaTextoDante(
                ""
            );

            actualizarContextoDante({
                tema: "WIRELESS",
                esperandoRespuesta: true,
                datoPendiente: "CLAVE_CPE",
            });

            responderDante(
                "Usuario recibido. Ahora escribe la clave SSH del equipo."
            );

            return true;
        }

        if (flujo.etapa === "ESPERAR_CLAVE_CPE") {
            const clave =
                String(
                    textoOriginal ||
                    ""
                ).trim();

            if (!clave) {
                responderDante(
                    "Escribe la clave SSH del equipo."
                );
                return true;
            }

            credencialesCpeDanteRef.current.clave =
                clave;

            flujo.etapa =
                "COMANDOS_CPE";

            actualizarContextoDante({
                tema: "WIRELESS",
                esperandoRespuesta: true,
                datoPendiente: "COMANDOS_CPE",
            });

            responderDante(
                "Credenciales recibidas. Voy a volver a intentar la operación."
            );

            await ejecutarAccionPendienteCpeDante();

            return true;
        }

        if (flujo.etapa === "CONFIRMAR_COMPROBACIONES") {
            if (esSiDante(textoOriginal)) {
                await ejecutarComprobacionesTecnicasDante(
                    flujo.router
                );
                return true;
            }

            if (esNoDante(textoOriginal)) {
                flujoDiagnosticoInternetDanteRef.current = null;
                actualizarContextoDante({
                    tema: "CLIENTE",
                    esperandoRespuesta: false,
                    datoPendiente: null,
                });
                responderDante(
                    "De acuerdo. Dejamos el diagnóstico hasta aquí. ¿En qué más te puedo ayudar?"
                );
                return true;
            }

            responderDante(
                "Dime sí para continuar con las comprobaciones técnicas o no para terminar el diagnóstico."
            );
            return true;
        }

        if (flujo.etapa === "SELECCIONAR_CLIENTE") {
            const numero = extraerNumeroSeleccionClienteDante(
                textoOriginal
            );

            if (
                numero !== null &&
                numero >= 1 &&
                numero <= flujo.candidatos.length
            ) {
                await ejecutarDiagnosticoInternetClienteDante(
                    flujo.candidatos[numero - 1]
                );
                return true;
            }

            const coincidencias = buscarServiciosDiagnosticoDante(
                textoOriginal,
                flujo.candidatos
            );

            if (coincidencias.length === 1) {
                await ejecutarDiagnosticoInternetClienteDante(
                    coincidencias[0]
                );
                return true;
            }

            if (coincidencias.length > 1) {
                responderDante(
                    "Todavía tengo varias coincidencias. Dime el número de la opción, el nombre completo o la IP."
                );
                return true;
            }

            await buscarClienteParaDiagnosticoDante(
                textoOriginal
            );
            return true;
        }

        await buscarClienteParaDiagnosticoDante(
            textoOriginal
        );
        return true;
    }

    // DANTE - ALERTAS DE PAGOS Y LÍMITE DE CORTE (2 DÍAS)
    type AlertaPagoDante = { id: string; clienteId?: string | number | null; nombres: string; apellidos: string; fecha: string; dias: number; tipo: "PAGO" | "CORTE"; };
    const alertasPagoDanteRef = useRef<{ pagos: AlertaPagoDante[]; cortes: AlertaPagoDante[] }>({ pagos: [], cortes: [] });
    const ultimaClaveAlertasPagoDanteRef = useRef("");
    const esperandoConfirmacionAlertasPagoDanteRef = useRef(false);
    const alertaPagoDanteYaAnunciadaRef = useRef(false);

    // ========================================================
    // DANTE - CONTROL DE ESPERA PARA ALERTAS DE PAGO / CORTE
    // ========================================================

    const timeoutConfirmacionAlertasPagoDanteRef =
        useRef<ReturnType<typeof setTimeout> | null>(null);

    const TIEMPO_CONFIRMACION_ALERTAS_DANTE =
        20000;


    // ========================================================
    // CERRAR ESPERA DE CONFIRMACIÓN
    // ========================================================

    function cerrarConfirmacionAlertasPagoDante() {

        esperandoConfirmacionAlertasPagoDanteRef.current =
            false;


        // ====================================================
        // CANCELAR TIMEOUT SI TODAVÍA EXISTE
        // ====================================================

        if (
            timeoutConfirmacionAlertasPagoDanteRef.current
        ) {

            clearTimeout(
                timeoutConfirmacionAlertasPagoDanteRef.current
            );

            timeoutConfirmacionAlertasPagoDanteRef.current =
                null;
        }


        // ====================================================
        // LIBERAR CONTEXTO CONVERSACIONAL
        // ====================================================

        if (
            contextoDanteRef.current.datoPendiente ===
            "CONFIRMAR_ALERTAS_PAGO"
        ) {

            actualizarContextoDante({

                esperandoRespuesta:
                    false,

                datoPendiente:
                    null,

            });
        }


        // ====================================================
        // VOLVER A ESCUCHA NORMAL
        // ====================================================

        if (
            microfonoActivoRef.current &&
            !pausaMicrofonoAnalisisDanteRef.current &&
            !danteHablandoRef.current
        ) {

            setEstadoDante(
                "ESPERANDO_DANTE"
            );

            estadoDanteRef.current =
                "ESPERANDO_DANTE";


            // ================================================
            // ASEGURAR QUE SPEECH RECOGNITION ESTÉ ACTIVO
            // ================================================

            try {

                reconocimientoRef.current?.start();

            } catch (error: any) {

                // InvalidStateError significa que ya estaba escuchando.
                if (
                    error?.name !==
                    "InvalidStateError"
                ) {

                    console.error(
                        "DANTE: error reactivando escucha después de alertas:",
                        error
                    );
                }
            }
        }
    }


    // ========================================================
    // INICIAR ESPERA DE CONFIRMACIÓN
    // ========================================================

    function iniciarConfirmacionAlertasPagoDante() {

        // ====================================================
        // LIMPIAR SOLAMENTE EL TIMEOUT ANTERIOR
        // NO LLAMAMOS cerrarConfirmacionAlertasPagoDante()
        // PORQUE ESTAMOS ABRIENDO UNA NUEVA CONVERSACIÓN.
        // ====================================================

        if (
            timeoutConfirmacionAlertasPagoDanteRef.current
        ) {

            clearTimeout(
                timeoutConfirmacionAlertasPagoDanteRef.current
            );

            timeoutConfirmacionAlertasPagoDanteRef.current =
                null;
        }


        // ====================================================
        // MARCAR CONFIRMACIÓN ACTIVA
        // ====================================================

        esperandoConfirmacionAlertasPagoDanteRef.current =
            true;


        // ====================================================
        // IMPORTANTE:
        // DANTE ESTÁ ESPERANDO RESPUESTA DEL OPERADOR
        // ESTO PERMITE RESPONDER "SÍ" / "NO"
        // SIN VOLVER A DECIR "DANTE"
        // ====================================================

        actualizarContextoDante({

            ultimaIntencion:
                "CONFIRMAR_ALERTAS_PAGO",

            esperandoRespuesta:
                true,

            datoPendiente:
                "CONFIRMAR_ALERTAS_PAGO",

        });


        console.log(
            "DANTE: esperando respuesta de alertas durante 20 segundos"
        );


        // ====================================================
        // TIMEOUT DE SEGURIDAD
        // ====================================================

        timeoutConfirmacionAlertasPagoDanteRef.current =
            setTimeout(

                () => {

                    // Si todavía seguimos esperando,
                    // cerramos la conversación.
                    if (
                        esperandoConfirmacionAlertasPagoDanteRef.current
                    ) {

                        cerrarConfirmacionAlertasPagoDante();

                        console.log(
                            "DANTE: confirmación de alertas vencida. " +
                            "La pregunta se cerró automáticamente."
                        );
                    }

                },

                TIEMPO_CONFIRMACION_ALERTAS_DANTE

            );
    }


    function seleccionarClientePendienteDante(
        servicio: ServicioClienteDante
    ) {
        servicioClienteDanteRef.current = servicio;

        clientesPendientesSeleccionDanteRef.current = [];

        actualizarContextoDante({
            tema: "CLIENTE",
            entidadId: servicio.clienteId,
            entidadNombre:
                `${servicio.nombres || ""} ${servicio.apellidos || ""}`
                    .trim(),
            ultimaIntencion: "BUSCAR_CLIENTE",
            esperandoRespuesta: false,
            datoPendiente: null,
        });

        responderDante(
            `Encontré a ${servicio.nombres || ""} ${servicio.apellidos || ""}. ` +
            `Su servicio está ${servicio.estadoServicio || "registrado"}.`
        );
    }

    function extraerNumeroSeleccionClienteDante(
        texto: string
    ): number | null {
        const normalizado = normalizarTextoDante(texto);

        const numeros: Record<string, number> = {
            primero: 1,
            primera: 1,
            uno: 1,
            una: 1,
            segundo: 2,
            segunda: 2,
            dos: 2,
            tercero: 3,
            tercera: 3,
            tres: 3,
            cuarto: 4,
            cuarta: 4,
            cuatro: 4,
            quinto: 5,
            quinta: 5,
            cinco: 5,
            sexto: 6,
            sexta: 6,
            seis: 6,
            septimo: 7,
            septima: 7,
            siete: 7,
            octavo: 8,
            octava: 8,
            ocho: 8,
            noveno: 9,
            novena: 9,
            nueve: 9,
        };

        const matchNumero =
            normalizado.match(/\b(?:opcion|opción|numero|número|el|la)\s*(\d{1,2})\b/);

        if (matchNumero?.[1]) {
            const numero = Number(matchNumero[1]);
            return Number.isInteger(numero) ? numero : null;
        }

        const matchSoloNumero =
            normalizado.match(/^\d{1,2}$/);

        if (matchSoloNumero) {
            return Number(matchSoloNumero[0]);
        }

        const palabras = normalizado.split(/\s+/).filter(Boolean);

        for (const palabra of palabras) {
            if (numeros[palabra]) {
                return numeros[palabra];
            }
        }

        return null;
    }

    async function procesarSeleccionClientePendienteDante(
        texto: string
    ): Promise<boolean> {
        const pendientes =
            clientesPendientesSeleccionDanteRef.current;

        if (!pendientes.length) {
            return false;
        }

        const normalizado = normalizarTextoDante(texto);

        if (!normalizado) {
            return false;
        }

        // Selección por número: "2", "el 2", "opción 2", "segundo", etc.
        const numero =
            extraerNumeroSeleccionClienteDante(normalizado);

        if (numero !== null) {
            if (numero < 1 || numero > pendientes.length) {
                responderDante(
                    `Tengo ${pendientes.length} opciones. Indícame un número entre 1 y ${pendientes.length}.`
                );
                return true;
            }

            seleccionarClientePendienteDante(
                pendientes[numero - 1]
            );
            return true;
        }

        // Selección por nombre completo o nombre dicho de forma natural.
        const coincidenciasPorNombre =
            pendientes.filter((servicio) => {
                const nombreCompleto =
                    `${servicio.nombres || ""} ${servicio.apellidos || ""}`.trim();

                return nombreCoincideDante(
                    normalizado,
                    nombreCompleto
                );
            });

        if (coincidenciasPorNombre.length === 1) {
            seleccionarClientePendienteDante(
                coincidenciasPorNombre[0]
            );
            return true;
        }

        if (coincidenciasPorNombre.length > 1) {
            responderDante(
                "Ese nombre coincide con más de una persona. Indícame el número de la opción que deseas consultar."
            );
            return true;
        }

        // Si todavía estamos esperando la elección, no dejamos que una
        // frase cualquiera pase al intérprete como si fuera un comando nuevo.
        responderDante(
            "No pude identificar la opción. Puedes decirme el número, por ejemplo 2, o el nombre completo del cliente."
        );

        return true;
    }

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

                clientesPendientesSeleccionDanteRef.current =
                    [];


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

                clientesPendientesSeleccionDanteRef.current =
                    coincidencias;

                actualizarContextoDante({
                    tema: "CLIENTE",
                    ultimaIntencion: "BUSCAR_CLIENTE",
                    esperandoRespuesta: true,
                    datoPendiente: "SELECCION_CLIENTE",
                });

                const opciones =
                    coincidencias
                        .slice(0, 9)
                        .map(
                            (servicio, index) =>
                                `${index + 1}. ${servicio.nombres || ""} ${servicio.apellidos || ""}`.trim()
                        )
                        .join(". ");

                const adicionales =
                    coincidencias.length > 9
                        ? ` Hay ${coincidencias.length - 9} coincidencias adicionales.`
                        : "";

                responderDante(
                    `Encontré ${coincidencias.length} clientes que coinciden con ${terminoBusqueda}. ` +
                    `Te los muestro para que elijas: ${opciones}. ` +
                    `${adicionales} ¿Cuál deseas consultar? Puedes decirme el número, por ejemplo 2, o el nombre completo.`
                );

                return;
            }


            // ====================================================
            // CLIENTE ENCONTRADO
            // ====================================================

            const servicio =
                coincidencias[0];


            clientesPendientesSeleccionDanteRef.current =
                [];

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
                                    formatearFechaMysqlLocalDante(
                                        fechaRecordatorio
                                    ),

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
                                        formatearFechaMysqlLocalDante(
                                            fechaRecordatorio
                                        ),

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
                                        formatearFechaMysqlLocalDante(
                                            fechaRecordatorio
                                        ),

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
                        formatearFechaMysqlLocalDante(
                            fechaRecordatorio
                        ),
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
    // DANTE - OBTENER MEMORIAS DEL CLIENTE ACTUAL
    // ========================================================

    async function obtenerMemoriasClienteActualDante() {

        const cliente =
            servicioClienteDanteRef.current;


        if (!cliente) {
            return [];
        }


        const nombre =
            `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                .trim();


        if (!nombre) {
            return [];
        }


        const memorias =
            await obtenerContextoHistoricoDante(
                nombre
            );


        if (
            !Array.isArray(memorias)
        ) {
            return [];
        }


        // Si la memoria trae entidadId,
        // aseguramos que corresponda al cliente seleccionado.
        // Las memorias antiguas que no tengan entidadId
        // se conservan porque fueron encontradas por nombre.

        return memorias.filter(
            (memoria: any) => {

                const entidadId =
                    memoria.entidadId ||
                    memoria.entidad_id ||
                    null;


                if (!entidadId) {
                    return true;
                }


                return (
                    String(entidadId) ===
                    String(cliente.clienteId)
                );
            }
        );
    }

    // ========================================================
    // DANTE - OBTENER PENDIENTES ACTIVOS DEL CLIENTE
    // ========================================================

    function obtenerPendientesClienteDante(
        memorias: any[]
    ) {

        if (
            !Array.isArray(memorias)
        ) {
            return [];
        }


        return memorias.filter(
            (memoria: any) => {

                const categoria =
                    String(
                        memoria.categoria ||
                        ""
                    ).toUpperCase();


                const datos =
                    memoria.datosJson ||
                    memoria.datos_json ||
                    {};


                const estado =
                    String(
                        datos?.estado ||
                        ""
                    ).toUpperCase();


                const activa =
                    memoria.activa === undefined
                        ? true
                        : Boolean(
                            Number(memoria.activa)
                        );


                if (!activa) {
                    return false;
                }


                // ====================================================
                // COMPROMISO DE PAGO ACTIVO
                // ====================================================

                if (
                    categoria ===
                    "COMPROMISO_PAGO" &&
                    estado ===
                    "PENDIENTE"
                ) {

                    return true;
                }


                // Aquí luego podremos agregar:
                // VISITA_PENDIENTE
                // SOPORTE_PENDIENTE
                // LLAMADA_PENDIENTE
                // etc.


                return false;
            }
        );
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
    ): Promise<void> {

        return new Promise((resolve) => {

            if (
                typeof window === "undefined"
            ) {
                resolve();
                return;
            }

            if (
                !("speechSynthesis" in window)
            ) {
                resolve();
                return;
            }

            // ====================================================
            // CADA VOZ TIENE UN ID
            // ====================================================

            const vozId =
                ++vozDanteIdRef.current;

            try {

                // ====================================================
                // BLOQUEAR AUTOESCUCHA INMEDIATAMENTE
                // ====================================================

                pausaReconocimientoPorVozDanteRef.current =
                    true;

                danteHablandoRef.current =
                    true;


                // ====================================================
                // DETENER RECONOCIMIENTO
                // ====================================================

                try {

                    reconocimientoRef.current?.abort();

                } catch {

                    // Ya estaba detenido.
                }


                // ====================================================
                // CANCELAR VOZ ANTERIOR
                //
                // IMPORTANTE:
                // La voz anterior tendrá otro vozId.
                // Su onerror NO podrá reactivar el micrófono.
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

                        // Si ya existe una voz más nueva,
                        // ignoramos este evento.
                        if (
                            vozId !==
                            vozDanteIdRef.current
                        ) {
                            return;
                        }

                        danteHablandoRef.current =
                            true;

                        pausaReconocimientoPorVozDanteRef.current =
                            true;

                        console.log(
                            "🔊 DANTE ESTÁ HABLANDO - MICRÓFONO PAUSADO"
                        );
                    };


                // ====================================================
                // TERMINÓ LA VOZ ACTUAL
                // ====================================================

                mensaje.onend =
                    () => {

                        // =================================================
                        // SI ESTA VOZ YA FUE REEMPLAZADA
                        // NO PUEDE LIBERAR EL MICRÓFONO
                        // =================================================

                        if (
                            vozId !==
                            vozDanteIdRef.current
                        ) {

                            console.log(
                                "🔇 DANTE: fin de voz anterior ignorado"
                            );
                            resolve();
                            return;
                        }


                        console.log(
                            "🔊 DANTE TERMINÓ DE HABLAR"
                        );


                        setTimeout(
                            () => {

                                // Otra voz pudo comenzar
                                // durante estos milisegundos.
                                if (
                                    vozId !==
                                    vozDanteIdRef.current
                                ) {
                                    return;
                                }


                                if (
                                    window.speechSynthesis.speaking
                                ) {
                                    return;
                                }


                                danteHablandoRef.current =
                                    false;

                                pausaReconocimientoPorVozDanteRef.current =
                                    false;


                                console.log(
                                    "🎤 DANTE LIBERADO PARA ESCUCHAR"
                                );


                                // ============================================
                                // REACTIVAR RECONOCIMIENTO
                                // ============================================

                                if (
                                    microfonoActivoRef.current &&
                                    !pausaMicrofonoAnalisisDanteRef.current &&
                                    reconocimientoRef.current
                                ) {

                                    try {

                                        reconocimientoRef.current.start();

                                        console.log(
                                            "🎤 Reconocimiento reactivado después de hablar"
                                        );

                                    } catch (error: any) {

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
                            1000
                        );
                    };


                // ====================================================
                // ERROR / CANCELACIÓN
                // ====================================================

                mensaje.onerror =
                    () => {

                        // =================================================
                        // ESTA ES LA CORRECCIÓN PRINCIPAL
                        //
                        // Si speechSynthesis.cancel() canceló una voz vieja,
                        // ESA VOZ NO PUEDE REACTIVAR EL MICRÓFONO.
                        // =================================================

                        if (
                            vozId !==
                            vozDanteIdRef.current
                        ) {
                            resolve();
                            console.log(
                                "🔇 DANTE: cancelación de voz anterior ignorada"
                            );

                            return;
                        }


                        console.log(
                            "🔊 Error en la voz actual de Dante"
                        );


                        setTimeout(
                            () => {

                                if (
                                    vozId !==
                                    vozDanteIdRef.current
                                ) {
                                    return;
                                }


                                if (
                                    window.speechSynthesis.speaking
                                ) {
                                    return;
                                }


                                danteHablandoRef.current =
                                    false;

                                pausaReconocimientoPorVozDanteRef.current =
                                    false;


                                if (
                                    microfonoActivoRef.current &&
                                    !pausaMicrofonoAnalisisDanteRef.current &&
                                    reconocimientoRef.current
                                ) {

                                    try {

                                        reconocimientoRef.current.start();

                                    } catch {
                                        // Ya iniciado.
                                    }
                                }

                            },
                            1000
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

                        // Solo la voz actualmente vigente
                        // puede desbloquear el sistema.
                        if (
                            vozId !==
                            vozDanteIdRef.current
                        ) {
                            return;
                        }


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

                // Solamente liberamos si sigue siendo
                // la voz actualmente vigente.
                if (
                    vozId ===
                    vozDanteIdRef.current
                ) {

                    danteHablandoRef.current =
                        false;

                    pausaReconocimientoPorVozDanteRef.current =
                        false;
                }


                console.error(
                    "Error reproduciendo voz Dante:",
                    error
                );
            }
        });
    }

    // ========================================================
    // RESPONDER DANTE
    // ========================================================
    function responderDante(
        texto: string,
        reproducirVoz = true
    ) {

        const respuesta =
            String(texto || "").trim();

        ultimaRespuestaDanteRef.current =
            respuesta;

        setRespuestaDante(
            respuesta
        );

        if (
            reproducirVoz &&
            respuesta
        ) {

            hablar(
                respuesta
            );
        }
    }


    function limpiarEntidadNaturalDante(valor: string) {
        return valor
            .replace(/^\s*(a|al|el|la|cliente|usuario|abonado)\s+/i, "")
            .replace(/\s+(por favor|ahora|porfa)\s*$/i, "")
            .trim();
    }

    function esReferenciaContextualDante(texto: string) {
        return (
            /\b(el|ella|ese cliente|esa cliente|este cliente|esta cliente|ese usuario|esa usuaria|el cliente|la cliente)\b/.test(texto) ||
            /\b(ese|esa|este|esta|anterior|mismo|misma)\b/.test(texto)
        );
    }

    function extraerEntidadClienteNaturalDante(textoOriginal: string) {
        let texto = normalizarTextoDante(textoOriginal)
            .replace(/\bdante\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (esReferenciaContextualDante(texto)) {
            return null;
        }

        const patrones = [
            /(?:haz|hacer|realiza|realizar|prueba|probar|revisa|revisar|comprueba|comprobar|verifica|verificar|mira|consultar|consulta)?\s*(?:un\s+)?ping\s+(?:a|al|del|de)?\s*(.+)$/,
            /(?:revisa|revisar|comprueba|comprobar|verifica|verificar|mira|consultar|consulta)\s+(?:la\s+)?(?:conexion|conectividad|estado|servicio)\s+(?:de|del)\s+(.+)$/,
            /(?:busca|buscar|buscame|búscame|encuentra|encuentrame|encuéntrame|encontrar|localiza|localizar)\s+(?:al|a la|el|la|cliente|usuario|abonado)?\s*(.+)$/,
            /(?:perfil|datos|informacion|informacion del cliente|ficha)\s+(?:de|del)\s+(.+)$/,
        ];

        for (const patron of patrones) {
            const match = texto.match(patron);
            if (match?.[1]) {
                const entidad = limpiarEntidadNaturalDante(match[1]);
                if (entidad && entidad.length >= 2) {
                    return entidad;
                }
            }
        }

        return null;
    }

    async function buscarInternetDesdeDante(
        consulta: string
    ): Promise<void> {

        const termino =
            String(
                consulta || ""
            ).trim();


        if (
            !termino
        ) {

            responderDante(
                "Indícame qué deseas buscar en Internet."
            );

            return;
        }


        try {

            await informarProcesamientoDante(
                "BUSCANDO"
            );


            const token =
                getToken();


            const res =
                await fetch(
                    `${API_BASE}/dante/internet/buscar`,
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
                                consulta:
                                    termino,
                            }),
                    }
                );


            const data =
                await res.json();


            if (
                !res.ok ||
                data?.ok === false
            ) {

                responderDante(
                    data?.message ||
                    "No pude realizar la búsqueda en Internet."
                );

                return;
            }


            console.log(
                "🌐 DANTE RESULTADO INTERNET:",
                data
            );


            // ====================================================
            // RESPUESTA GENERADA POR EL BACKEND / TAVILY
            // ====================================================

            const respuestaInternet =
                String(
                    data?.respuesta ||
                    ""
                ).trim();


            if (
                respuestaInternet
            ) {

                cambiarTemaDante(
                    "GENERAL",
                    {
                        ultimaIntencion:
                            "BUSCAR_INTERNET",
                    }
                );


                responderDante(
                    respuestaInternet
                );

                return;
            }


            // ====================================================
            // SI NO VINO RESPUESTA, USAMOS RESULTADOS
            // ====================================================

            const resultados =
                Array.isArray(
                    data?.resultados
                )
                    ? data.resultados
                    : [];


            if (
                resultados.length === 0
            ) {

                responderDante(
                    `No encontré resultados en Internet sobre ${termino}.`
                );

                return;
            }


            if (
                resultados.length === 0
            ) {

                responderDante(
                    `No encontré resultados en Internet sobre ${termino}.`
                );

                return;
            }


            const titulos =
                resultados
                    .slice(
                        0,
                        3
                    )
                    .map(
                        (
                            resultado: any,
                            index: number
                        ) => {

                            const titulo =
                                String(
                                    resultado?.titulo ||
                                    ""
                                ).trim();


                            return (
                                `Resultado ${index + 1}: ${titulo}`
                            );
                        }
                    )
                    .filter(Boolean)
                    .join(". ");


            responderDante(
                `Encontré información relacionada con ${termino}. ${titulos}.`
            );

        } catch (error) {

            console.error(
                "DANTE INTERNET FRONTEND:",
                error
            );


            responderDante(
                "Ocurrió un error mientras buscaba en Internet."
            );
        }
    }

    function interpretarIntencionCentralDante(
        textoOriginal: string
    ): InterpretacionCentralDante {
        const texto = normalizarTextoDante(textoOriginal)
            .replace(/\bdante\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        // ========================================================
        // DIAGNÓSTICO DE RED TIENE PRIORIDAD SOBRE INTERNET
        // ========================================================
        // Evita que expresiones como:
        // "averigua si hay problemas en la red de barrio_lindo"
        // sean interpretadas como una búsqueda web.
        const diagnosticoRed =
            interpretarDiagnosticoRedDante(
                textoOriginal
            );

        if (diagnosticoRed) {
            return {
                intencion: "DIAGNOSTICO_RED",
                entidad: diagnosticoRed.entidad,
                usaContextoActual: diagnosticoRed.usaContextoActual,
                confianza: diagnosticoRed.confianza,
            };
        }

        const consultaInternet =
            extraerConsultaInternetDante(
                textoOriginal
            );


        // ========================================================
        // INTERNET TIENE PRIORIDAD ANTES DE BUSCAR CLIENTES
        // ========================================================

        if (
            consultaInternet
        ) {

            return {
                intencion:
                    "BUSCAR_INTERNET",

                entidad:
                    consultaInternet,

                usaContextoActual:
                    false,

                confianza:
                    0.98,
            };
        }

        const usaContextoActual =
            esReferenciaContextualDante(texto) ||
            (!!servicioClienteDanteRef.current && (
                texto === "hazle ping" ||
                texto === "revisalo" ||
                texto === "revisala" ||
                texto === "revisa su conexion" ||
                texto === "como esta su conexion" ||
                texto === "esta conectado" ||
                texto === "esta conectada" ||
                texto === "esta en linea"
            ));

        const entidad =
            extraerEntidadClienteNaturalDante(textoOriginal);

        const palabrasPing =
            /\b(ping|conexion|conectividad|conectado|conectada|en linea|latencia|responde|respuesta)\b/;

        const palabrasAccionConsulta =
            /\b(revisa|revisar|comprueba|comprobar|verifica|verificar|consulta|consultar|mira|mirar|prueba|probar|haz|hacer|como esta|esta)\b/;

        if (
            palabrasPing.test(texto) &&
            (palabrasAccionConsulta.test(texto) || texto.includes("ping")) &&
            (entidad || usaContextoActual || servicioClienteDanteRef.current)
        ) {
            return {
                intencion: "PING_CLIENTE",
                entidad,
                usaContextoActual,
                confianza: 0.95,
            };
        }

        if (
            /\b(busca|buscar|buscame|encuentra|encuentrame|encontrar|localiza|localizar)\b/.test(texto) &&
            (entidad || /\b(cliente|usuario|abonado)\b/.test(texto))
        ) {
            return {
                intencion: "BUSCAR_CLIENTE",
                entidad,
                usaContextoActual: false,
                confianza: 0.92,
            };
        }

        if (
            /\b(perfil|ficha|datos|informacion)\b/.test(texto) &&
            /\b(cliente|usuario|abonado|de|del|el|ella|ese|este)\b/.test(texto)
        ) {
            return {
                intencion: "PERFIL_CLIENTE",
                entidad,
                usaContextoActual,
                confianza: 0.88,
            };
        }

        if (
            /\b(router|routers|mikrotik|microtik|microti|microtis)\b/.test(texto) &&
            /\b(revisa|revisar|consulta|consultar|estado|recursos|recurso|redes|red|ip|prueba|probar|lista|listar|cuales|que|como)\b/.test(texto)
        ) {
            return {
                intencion: "MIKROTIK",
                entidad: null,
                usaContextoActual: !!routerMikrotikDanteRef.current,
                confianza: 0.90,
            };
        }

        return {
            intencion: "NINGUNA",
            entidad: null,
            usaContextoActual: false,
            confianza: 0,
        };
    }

    function extraerConsultaInternetDante(
        textoOriginal: string
    ): string | null {

        let texto =
            normalizarTextoDante(
                textoOriginal
            )
                .replace(
                    /\bdante\b/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        const patrones = [

            /^busca\s+en\s+internet\s+(.+)$/,

            /^buscar\s+en\s+internet\s+(.+)$/,

            /^busca\s+en\s+la\s+web\s+(.+)$/,

            /^buscar\s+en\s+la\s+web\s+(.+)$/,

            /^consulta\s+en\s+internet\s+(.+)$/,

            /^consultar\s+en\s+internet\s+(.+)$/,

            /^investiga\s+en\s+internet\s+(.+)$/,

            /^investigar\s+en\s+internet\s+(.+)$/,

            /^averigua\s+en\s+internet\s+(.+)$/,

            /^averiguar\s+en\s+internet\s+(.+)$/,

            /^buscame\s+en\s+internet\s+(.+)$/,

            /^investiga\s+(.+)$/,

            /^averigua\s+(.+)$/,
        ];


        for (
            const patron
            of patrones
        ) {

            const match =
                texto.match(
                    patron
                );


            if (
                match?.[1]
            ) {

                const consulta =
                    match[1]
                        .trim();


                if (
                    consulta.length >= 2
                ) {

                    return consulta;
                }
            }
        }


        return null;
    }
    async function asegurarClienteNaturalDante(
        entidad: string | null
    ) {
        if (entidad) {
            const actual = servicioClienteDanteRef.current;
            const nombreActual = actual
                ? normalizarTextoDante(
                    `${actual.nombres || ""} ${actual.apellidos || ""}`
                )
                : "";
            const entidadNormalizada = normalizarTextoDante(entidad);

            if (
                !actual ||
                !nombreActual.includes(entidadNormalizada)
            ) {
                await buscarClienteDante(entidad);
            }
        }

        return servicioClienteDanteRef.current;
    }

    async function ejecutarIntencionCentralDante(
        textoOriginal: string
    ): Promise<boolean> {
        const interpretacion =
            interpretarIntencionCentralDante(textoOriginal);

        if (
            interpretacion.intencion === "NINGUNA" ||
            interpretacion.confianza < 0.80
        ) {
            return false;
        }

        console.log(
            "DANTE MOTOR CENTRAL:",
            interpretacion
        );

        //Busqueda a internet

        if (
            interpretacion.intencion ===
            "BUSCAR_INTERNET"
        ) {

            if (
                !interpretacion.entidad
            ) {

                responderDante(
                    "Indícame qué deseas buscar en Internet."
                );

                return true;
            }


            await buscarInternetDesdeDante(
                interpretacion.entidad
            );


            return true;
        }

        //Busqueda de cliente

        if (interpretacion.intencion === "BUSCAR_CLIENTE") {
            if (!interpretacion.entidad) {
                responderDante(
                    "Indícame el nombre, cédula, teléfono o IP del cliente que deseas buscar."
                );
                return true;
            }

            await buscarClienteDante(
                interpretacion.entidad
            );
            return true;
        }

        if (interpretacion.intencion === "PING_CLIENTE") {
            const cliente = await asegurarClienteNaturalDante(
                interpretacion.entidad
            );

            if (!cliente) {
                // buscarClienteDante ya explica si no encontró o si hubo
                // varias coincidencias. No ejecutamos ninguna acción a ciegas.
                return true;
            }

            await hacerPingClienteDante();
            return true;
        }

        if (interpretacion.intencion === "PERFIL_CLIENTE") {
            const cliente = await asegurarClienteNaturalDante(
                interpretacion.entidad
            );

            if (!cliente) {
                return true;
            }

            await consultarPerfilClienteDante();
            return true;
        }

        if (interpretacion.intencion === "DIAGNOSTICO_RED") {
            await procesarDiagnosticoRedDante(
                textoOriginal,
                interpretacion.entidad,
                interpretacion.usaContextoActual
            );
            return true;
        }

        if (interpretacion.intencion === "MIKROTIK") {
            // La lógica MikroTik original ya existe dentro de
            // procesarComandoDante(). No la duplicamos ni la movemos.
            // Devolvemos false para que continúe el flujo anterior y
            // procese todos los comandos MikroTik existentes.
            return false;
        }

        return false;
    }

    // ========================================================
    // DANTE FASE 1H - SEGURIDAD PARA ACCIONES DE ESCRITURA
    // ========================================================
    // Las consultas siguen siendo directas. Esta utilidad queda lista
    // para los comandos futuros que modifiquen estado (corte,
    // reconexión, eliminación, cambios de configuración, etc.).
    // No se conecta a ninguna ruta nueva y no altera los comandos
    // actuales porque todavía no hay una acción destructiva registrada
    // en este motor.

    function requiereConfirmacionDante(
        accion: string
    ) {
        const accionNormalizada =
            normalizarTextoDante(accion);

        return [
            "cortar",
            "suspender",
            "reconectar",
            "restaurar",
            "eliminar",
            "borrar",
            "cambiar configuracion",
            "modificar configuracion",
        ].some(
            palabra =>
                accionNormalizada.includes(
                    palabra
                )
        );
    }

    // ========================================================
    // PROCESAR COMANDO
    // ========================================================

    function fechaDanteComoDia(valor: any): Date | null {
        if (!valor) return null;
        const texto = String(valor).trim();
        const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
        const latam = texto.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
        if (latam) return new Date(Number(latam[3]), Number(latam[2]) - 1, Number(latam[1]));
        const fecha = new Date(texto);
        return Number.isNaN(fecha.getTime()) ? null : new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    }

    function diferenciaDiasDante(fechaObjetivo: Date) {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const objetivo = new Date(fechaObjetivo.getFullYear(), fechaObjetivo.getMonth(), fechaObjetivo.getDate());
        return Math.round((objetivo.getTime() - inicio.getTime()) / 86400000);
    }

    function obtenerNombreAlertaPagoDante(item: any) {
        const nombres = item?.nombres ?? item?.nombre ?? item?.cliente?.nombres ?? item?.cliente?.nombre ?? "";
        const apellidos = item?.apellidos ?? item?.apellido ?? item?.cliente?.apellidos ?? item?.cliente?.apellido ?? "";
        return { nombres: String(nombres || "").trim(), apellidos: String(apellidos || "").trim() };
    }

    function obtenerFechaAlertaPagoDante(item: any, tipo: "PAGO" | "CORTE") {
        return tipo === "PAGO"
            ? item?.fechaVencimiento ?? item?.fecha_vencimiento ?? item?.vencimiento ?? item?.fechaPago ?? item?.fecha_pago
            : item?.fechaLimiteCorte ?? item?.fecha_limite_corte ?? item?.limiteCorte ?? item?.fechaCorte ?? item?.fecha_corte;
    }

    function construirAlertasPagoDante(lista: any[], tipo: "PAGO" | "CORTE") {
        const mapa = new Map<string, AlertaPagoDante>();
        for (const item of lista) {
            const estado = normalizarTextoDante(String(item?.estado ?? item?.estadoPago ?? item?.estado_pago ?? ""));
            if (["pagado", "cancelado", "anulado", "anulada", "eliminado"].includes(estado)) continue;
            const fechaTexto = obtenerFechaAlertaPagoDante(item, tipo);
            const fecha = fechaDanteComoDia(fechaTexto);
            if (!fecha) continue;
            const dias = diferenciaDiasDante(fecha);
            if (dias < 0 || dias > 2) continue;
            const nombre = obtenerNombreAlertaPagoDante(item);
            const nombreCompleto = `${nombre.nombres} ${nombre.apellidos}`.trim();
            if (!nombreCompleto) continue;
            const clienteId = item?.clienteId ?? item?.cliente_id ?? item?.cliente?.clienteId ?? item?.cliente?.id ?? null;
            const clave = String(clienteId ?? nombreCompleto.toLowerCase());
            const anterior = mapa.get(clave);
            const alerta: AlertaPagoDante = { id: `${tipo}-${clave}-${String(fechaTexto)}`, clienteId, nombres: nombre.nombres, apellidos: nombre.apellidos, fecha: String(fechaTexto), dias, tipo };
            if (!anterior || dias < anterior.dias) mapa.set(clave, alerta);
        }
        return Array.from(mapa.values()).sort((a, b) => a.dias - b.dias || `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`));
    }

    function extraerListaMensualidadesDante(data: any): any[] {
        const candidatos = [data?.mensualidades, data?.todas, data?.result, data?.datos, data?.data];
        for (const c of candidatos) {
            if (Array.isArray(c)) return c;
            if (Array.isArray(c?.mensualidades)) return c.mensualidades;
            if (Array.isArray(c?.todas)) return c.todas;
            if (Array.isArray(c?.data)) return c.data;
        }
        return [];
    }

    function diasAlertaPagoDante(dias: number) { return dias === 0 ? "hoy" : dias === 1 ? "mañana" : "en 2 días"; }

    function nombresAlertasPagoDante(lista: AlertaPagoDante[]) {
        return lista.map((x, i) => `${i + 1}. ${x.nombres} ${x.apellidos}, ${diasAlertaPagoDante(x.dias)}.`).join(" ");
    }

    function limpiarRespuestaAlertasPagoDante(
        textoOriginal: string
    ): string {
        return normalizarTextoDante(
            textoOriginal
        )
            .replace(
                /^dante\s+/,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function esSiAlertasPagoDante(textoOriginal: string) {
        const texto =
            limpiarRespuestaAlertasPagoDante(
                textoOriginal
            );

        return /^(si|claro|ok|okay|adelante|dale|dime|dime los nombres|nombres|nombra|nombralos|nombralas|si dime|si claro|si por favor)$/.test(
            texto
        );
    }

    function esNoAlertasPagoDante(textoOriginal: string) {
        const texto =
            limpiarRespuestaAlertasPagoDante(
                textoOriginal
            );

        return /^(no|no gracias|cancelar|cancela|cancelalo|dejalo|mejor no|no quiero|no me los digas|no los nombres|no las nombres)$/.test(
            texto
        );
    }

    function procesarConfirmacionAlertasPagoDante(texto: string) {

        if (
            !esperandoConfirmacionAlertasPagoDanteRef.current
        ) {
            return false;
        }

        if (
            esSiAlertasPagoDante(texto)
        ) {

            cerrarConfirmacionAlertasPagoDante();

            const todas = [
                ...alertasPagoDanteRef.current.pagos,
                ...alertasPagoDanteRef.current.cortes,
            ];

            responderDante(
                `Claro. Te indico los clientes con aviso próximo. ${nombresAlertasPagoDante(todas)}`
            );

            return true;
        }

        if (
            esNoAlertasPagoDante(texto)
        ) {

            cerrarConfirmacionAlertasPagoDante();

            responderDante(
                "De acuerdo. Quedo listo para otra orden."
            );

            return true;
        }

        // IMPORTANTE: esta confirmación NO BLOQUEA a Dante.
        // Si el usuario dijo otra orden en lugar de sí/no, cerramos
        // inmediatamente la pregunta de alertas y devolvemos false.
        // Así, ESTE MISMO TEXTO continúa por procesarComandoDante()
        // y se ejecuta como una orden normal sin esperar los 20 segundos.
        cerrarConfirmacionAlertasPagoDante();

        return false;
    }

    function consultarNombreEnAlertasPagoDante(texto: string) {

        const normalizado =
            normalizarTextoDante(texto);

        // Solo entra aquí cuando el usuario pregunta expresamente
        // si una persona está dentro de las alertas.
        const esConsultaAlertaCliente =
            /^(dime si|consulta si|revisa si|esta|esta el|y que hay de|que hay de)\b/
                .test(normalizado);

        if (
            !esConsultaAlertaCliente
        ) {
            return false;
        }

        const todas = [
            ...alertasPagoDanteRef.current.pagos,
            ...alertasPagoDanteRef.current.cortes,
        ];

        if (
            !todas.length
        ) {
            return false;
        }

        const termino =
            normalizado
                .replace(
                    /^(dime si |consulta si |revisa si |esta |esta el |y que hay de |que hay de )/,
                    ""
                )
                .trim();

        if (
            termino.length < 3
        ) {
            return false;
        }

        const coincide =
            (x: AlertaPagoDante) => {

                const nombre =
                    normalizarTextoDante(
                        `${x.nombres} ${x.apellidos}`
                    );

                return (
                    nombre.includes(termino) ||
                    termino
                        .split(" ")
                        .every(
                            p =>
                                nombre.includes(p)
                        )
                );
            };

        const pagos =
            alertasPagoDanteRef.current.pagos
                .filter(coincide);

        const cortes =
            alertasPagoDanteRef.current.cortes
                .filter(coincide);

        if (
            !pagos.length &&
            !cortes.length
        ) {

            responderDante(
                `No, ${termino} no está dentro de los clientes con aviso de pago o límite de corte próximo.`
            );

            return true;
        }

        const respuestas: string[] = [];

        if (
            pagos.length
        ) {

            respuestas.push(
                `${pagos[0].nombres} ${pagos[0].apellidos} sí está en la lista de pagos próximos, ${diasAlertaPagoDante(pagos[0].dias)}.`
            );
        }

        if (
            cortes.length
        ) {

            respuestas.push(
                `${cortes[0].nombres} ${cortes[0].apellidos} sí está en la lista de límite de corte próximo, ${diasAlertaPagoDante(cortes[0].dias)}.`
            );
        }

        responderDante(
            respuestas.join(" ")
        );

        return true;
    }

    async function revisarAlertasPagoDante() {
        try {
            const token = getToken();
            if (!token) return;
            const res = await fetch(`${API_BASE}/mensualidades/todas`, { method: "GET", headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store" });
            const data = await res.json();
            if (!res.ok || data?.ok === false) return;
            const lista = extraerListaMensualidadesDante(data);
            const pagos = construirAlertasPagoDante(lista, "PAGO");
            const cortes = construirAlertasPagoDante(lista, "CORTE");
            alertasPagoDanteRef.current = { pagos, cortes };
            const clave = [...pagos.map(x => x.id), ...cortes.map(x => x.id)].sort().join("|");
            const cambio = clave !== ultimaClaveAlertasPagoDanteRef.current;
            ultimaClaveAlertasPagoDanteRef.current = clave;
            if (!cambio || alertaPagoDanteYaAnunciadaRef.current) return;
            alertaPagoDanteYaAnunciadaRef.current = true;
            if (!pagos.length && !cortes.length) return;
            const total = pagos.length + cortes.length;
            if (total <= 5) {
                const partes: string[] = [];
                if (pagos.length) partes.push(pagos.length === 1 ? "Hay 1 cliente con fecha de pago próxima." : `Hay ${pagos.length} clientes con fecha de pago próxima.`, nombresAlertasPagoDante(pagos));
                if (cortes.length) partes.push(cortes.length === 1 ? "Hay 1 cliente con límite de corte próximo." : `Hay ${cortes.length} clientes con límite de corte próximo.`, nombresAlertasPagoDante(cortes));
                responderDante(partes.join(" "));
                return;
            }
            let respuesta = "";
            if (pagos.length) respuesta += pagos.length === 1 ? "Hay 1 cliente con fecha de pago próxima. " : `Hay ${pagos.length} clientes con fecha de pago próxima. `;
            if (cortes.length) respuesta += cortes.length === 1 ? "Hay 1 cliente con límite de corte próximo. " : `Hay ${cortes.length} clientes con límite de corte próximo. `;
            // La confirmación queda abierta máximo 20 segundos, pero
            // durante ese tiempo Dante sigue aceptando cualquier otra orden.
            iniciarConfirmacionAlertasPagoDante();
            responderDante(`${respuesta}¿Deseas que te indique los nombres?`);
        } catch (error) { console.error("DANTE: Error revisando alertas de pagos:", error); }
    }




    // ========================================================
    // DANTE - NORMALIZAR NOMBRE / ALIAS DE ROUTER MIKROTIK
    // ========================================================

    function normalizarNombreRouterDante(
        valor: string
    ): string {

        return String(valor || "")

            // MikrotikViaAnchayacuA1
            // -> Mikrotik Via Anchayacu A1
            .replace(
                /([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g,
                "$1 $2"
            )

            .toLowerCase()

            // Quitar tildes
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            // Quitar palabra MikroTik
            .replace(
                /\bmikrotik\b/g,
                " "
            )

            // ============================================
            // ALIAS NATURALES DE ROUTERS
            // ============================================

            // Todas estas pronunciaciones significan Anchayacu
            .replace(
                /\bvia\s+anchayacu\b/g,
                "anchayacu"
            )
            .replace(
                /\bancahyacu\b/g,
                "anchayacu"
            )
            .replace(
                /\banchayaco\b/g,
                "anchayacu"
            )

            .replace(
                /\ba\s+chayaco\b/g,
                "anchayacu"
            )
            .replace(
                /\bancha\s+yaco\b/g,
                "anchayacu"
            )
            .replace(
                /\bchayaco\b/g,
                "anchayacu"
            )
            // Quitar códigos finales:
            // A1, T1, S1, etc.
            .replace(
                /\b[a-z]\s*\d+\b/g,
                " "
            )

            // Quitar caracteres especiales
            .replace(
                /[^a-z0-9\s]/g,
                " "
            )

            // Espacios
            .replace(
                /\s+/g,
                " "
            )

            .trim();
    }

    // ========================================================
    // DANTE - EXTRAER REFERENCIA DEL ROUTER DEL COMANDO
    // ========================================================

    function limpiarBusquedaRouterDante(
        textoOriginal: string
    ): string {

        return normalizarNombreRouterDante(
            textoOriginal
        )

            .replace(
                /\bdante\b/g,
                " "
            )

            .replace(
                /\brevisa(?:r|n)?\b/g,
                " "
            )

            .replace(
                /\bconsulta\b/g,
                " "
            )

            .replace(
                /\bconsultar\b/g,
                " "
            )

            .replace(
                /\bverifica\b/g,
                " "
            )

            .replace(
                /\bverificar\b/g,
                " "
            )

            .replace(
                /\brouter\b/g,
                " "
            )

            .replace(
                /\bestado\b/g,
                " "
            )

            .replace(
                /\bconexion\b/g,
                " "
            )

            .replace(
                /\bconectado\b/g,
                " "
            )

            .replace(
                /\bactivo\b/g,
                " "
            )

            .replace(
                /\bel\b/g,
                " "
            )

            .replace(
                /\bla\b/g,
                " "
            )

            .replace(
                /\bde\b/g,
                " "
            )

            .replace(
                /\s+/g,
                " "
            )

            .trim();
    }


    // ========================================================
    // DANTE - TEXTO COMPACTO PARA COMPARACIÓN
    // ========================================================

    function compactarTextoRouterDante(
        valor: string
    ) {

        return normalizarNombreRouterDante(
            valor
        )
            .replace(
                /\s+/g,
                ""
            );
    }


    // ========================================================
    // DANTE - PORCENTAJE DE SIMILITUD
    // ========================================================

    function similitudRouterDante(
        texto1: string,
        texto2: string
    ): number {

        const a =
            compactarTextoRouterDante(
                texto1
            );

        const b =
            compactarTextoRouterDante(
                texto2
            );


        if (
            !a ||
            !b
        ) {
            return 0;
        }


        if (
            a === b
        ) {
            return 1;
        }


        // Si uno contiene gran parte del otro,
        // lo consideramos una coincidencia fuerte.

        if (
            a.includes(b) ||
            b.includes(a)
        ) {

            const menor =
                Math.min(
                    a.length,
                    b.length
                );

            const mayor =
                Math.max(
                    a.length,
                    b.length
                );

            return menor / mayor;
        }


        const distancia =
            distanciaRouterDante(
                a,
                b
            );


        const longitud =
            Math.max(
                a.length,
                b.length
            );


        return (
            1 -
            distancia / longitud
        );
    }

    // ========================================================
    // DANTE - DISTANCIA LEVENSHTEIN PARA ROUTERS
    // ========================================================

    function distanciaRouterDante(
        a: string,
        b: string
    ): number {

        const matriz: number[][] =
            Array.from(
                {
                    length: b.length + 1
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

                        matriz[i - 1][j - 1] + costo
                    );
            }
        }


        return matriz[b.length][a.length];
    }


    // ========================================================
    // DANTE - OBTENER ROUTERS REGISTRADOS
    // ========================================================

    async function obtenerRoutersMikrotikDante():
        Promise<RouterMikrotikDante[]> {

        try {

            const token =
                getToken();

            const res =
                await fetch(
                    `${API_BASE}/mikrotik/routers`,
                    {
                        method:
                            "GET",

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

                console.error(
                    "DANTE: error obteniendo routers:",
                    data
                );

                return [];
            }


            return Array.isArray(
                data.routers
            )
                ? data.routers
                : [];

        } catch (error) {

            console.error(
                "DANTE: error consultando routers MikroTik:",
                error
            );

            return [];
        }
    }

    // ========================================================
    // DANTE - BUSCAR ROUTER MIKROTIK
    //
    // PRIORIDAD:
    // 1. NOMBRE EXACTO
    // 2. NOMBRE APROXIMADO >= 80%
    // 3. SECTOR
    // 4. PARROQUIA
    // 5. IP WIREGUARD
    //
    // IMPORTANTE:
    // El sector NUNCA debe ganar a un nombre parecido.
    // ========================================================

    function buscarRouterMencionadoDante(
        textoOriginal: string,
        routers: RouterMikrotikDante[]
    ): RouterMikrotikDante | null {

        const texto =
            normalizarNombreRouterDante(
                textoOriginal
            );


        const busqueda =
            limpiarBusquedaRouterDante(
                textoOriginal
            );


        const busquedaCompacta =
            compactarTextoRouterDante(
                busqueda
            );


        console.log(
            "DANTE BUSCANDO ROUTER:",
            {
                original:
                    textoOriginal,

                normalizado:
                    texto,

                busqueda,

                busquedaCompacta
            }
        );


        // ====================================================
        // 1. NOMBRE EXACTO
        // ====================================================

        for (
            const router
            of routers
        ) {

            const nombre =
                normalizarNombreRouterDante(
                    router.nombre || ""
                );


            const nombreCompacto =
                compactarTextoRouterDante(
                    router.nombre || ""
                );


            if (
                nombre &&
                (
                    busqueda === nombre ||

                    busquedaCompacta ===
                    nombreCompacto ||

                    (
                        nombreCompacto.length >= 4 &&
                        busquedaCompacta.includes(
                            nombreCompacto
                        )
                    )
                )
            ) {

                console.log(
                    "✅ DANTE ROUTER EXACTO POR NOMBRE:",
                    router.nombre
                );


                return router;
            }
        }


        // ====================================================
        // 2. NOMBRE APROXIMADO
        //
        // ESTO SE HACE ANTES DE MIRAR SECTOR.
        // ====================================================

        let mejorRouterNombre: RouterMikrotikDante | null = null;


        let mejorPuntajeNombre =
            0;


        for (
            const router
            of routers
        ) {

            const nombre =
                router.nombre || "";


            if (
                !nombre
            ) {
                continue;
            }


            const similitud =
                similitudRouterDante(
                    busqueda,
                    nombre
                );


            console.log(
                "DANTE SIMILITUD NOMBRE:",
                {
                    busqueda,

                    router:
                        router.nombre,

                    nombreNormalizado:
                        normalizarNombreRouterDante(
                            nombre
                        ),

                    similitud:
                        Math.round(
                            similitud * 100
                        ) + "%"
                }
            );


            if (
                similitud >
                mejorPuntajeNombre
            ) {

                mejorPuntajeNombre =
                    similitud;

                mejorRouterNombre =
                    router;
            }
        }


        // ====================================================
        // SI UN NOMBRE SUPERA 80%, ESE GANA.
        //
        // NO SEGUIMOS BUSCANDO POR SECTOR.
        // ====================================================

        if (
            mejorRouterNombre &&
            mejorPuntajeNombre >= 0.80
        ) {

            console.log(
                "✅ DANTE ROUTER POR NOMBRE APROXIMADO:",
                {
                    router:
                        mejorRouterNombre.nombre,

                    similitud:
                        Math.round(
                            mejorPuntajeNombre *
                            100
                        ) + "%"
                }
            );


            return mejorRouterNombre;
        }


        // ====================================================
        // 3. SECTOR
        //
        // SOLO LLEGAMOS AQUÍ SI NO HUBO
        // UN NOMBRE CON 80% O MÁS.
        // ====================================================

        for (
            const router
            of routers
        ) {

            const sector =
                normalizarNombreRouterDante(
                    router.sector || ""
                );


            if (
                sector.length >= 3 &&
                (
                    texto.includes(
                        sector
                    ) ||

                    sector.includes(
                        busqueda
                    ) ||

                    busqueda.includes(
                        sector
                    )
                )
            ) {

                console.log(
                    "⚠️ DANTE ROUTER ENCONTRADO POR SECTOR:",
                    {
                        router:
                            router.nombre,

                        sector:
                            router.sector
                    }
                );


                return router;
            }
        }


        // ====================================================
        // 4. PARROQUIA
        // ====================================================

        for (
            const router
            of routers
        ) {

            const parroquia =
                normalizarNombreRouterDante(
                    router.parroquia || ""
                );


            if (
                parroquia.length >= 3 &&
                (
                    texto.includes(
                        parroquia
                    ) ||

                    parroquia.includes(
                        busqueda
                    )
                )
            ) {

                console.log(
                    "⚠️ DANTE ROUTER ENCONTRADO POR PARROQUIA:",
                    {
                        router:
                            router.nombre,

                        parroquia:
                            router.parroquia
                    }
                );


                return router;
            }
        }


        // ====================================================
        // 5. IP WIREGUARD
        // ====================================================

        for (
            const router
            of routers
        ) {

            const ipWG =
                String(
                    router.IpWireGuard ||
                    router.ip_wireguard ||
                    ""
                ).trim();


            if (
                ipWG &&
                textoOriginal.includes(
                    ipWG
                )
            ) {

                console.log(
                    "✅ DANTE ROUTER POR IP WIREGUARD:",
                    router.nombre,
                    ipWG
                );


                return router;
            }
        }


        // ====================================================
        // NO ENCONTRADO
        // ====================================================

        console.log(
            "❌ DANTE: NO SE IDENTIFICÓ ROUTER",
            {
                busqueda,

                mejorNombre:
                    mejorRouterNombre
                        ? mejorRouterNombre.nombre
                        : null,

                mejorSimilitudNombre:
                    Math.round(
                        mejorPuntajeNombre *
                        100
                    ) + "%"
            }
        );


        return null;
    }


    // ========================================================
    // DANTE - GUARDAR ROUTER EN CONTEXTO
    // ========================================================

    function seleccionarRouterMikrotikDante(
        router: RouterMikrotikDante,
        intencion: string
    ) {

        routerMikrotikDanteRef.current =
            router;


        actualizarContextoDante({

            tema:
                "MIKROTIK",

            entidadId:
                String(
                    router.id
                ),

            entidadNombre:
                router.nombre,

            ultimaIntencion:
                intencion,

            esperandoRespuesta:
                false,

            datoPendiente:
                null,

        });


        console.log(
            "DANTE ROUTER ACTUAL:",
            router
        );
    }

    // ========================================================
    // DANTE V4 - DIAGNÓSTICO AUTÓNOMO DE RED / NODO
    // ========================================================
    // Flujo de interpretación:
    // frase natural -> intención DIAGNOSTICO_RED -> identificar router
    // -> comprobar estado -> recursos -> equipos wireless -> métricas
    // -> interpretar anomalías -> conclusión OK/ADVERTENCIA/CRITICO.
    //
    // IMPORTANTE:
    // - Solo consulta información. No cambia configuración.
    // - Reutiliza rutas y funciones que Dante ya utiliza.
    // ========================================================

    type NivelDiagnosticoRedDante =
        | "OK"
        | "ADVERTENCIA"
        | "CRITICO";

    type InterpretacionDiagnosticoRedDante = {
        entidad: string | null;
        usaContextoActual: boolean;
        confianza: number;
    };

    function interpretarDiagnosticoRedDante(
        textoOriginal: string
    ): InterpretacionDiagnosticoRedDante | null {
        const texto =
            normalizarTextoDante(textoOriginal)
                .replace(/\bdante\b/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        const accion =
            /\b(revisa|revisar|diagnostica|diagnosticar|analiza|analizar|verifica|verificar|comprueba|comprobar|chequea|chequear|mira|mirar|averigua|averiguar)\b/.test(texto);

        const hablaDeRed =
            /\b(red|nodo|mikrotik|router|sector|infraestructura)\b/.test(texto);

        const buscaProblema =
            /\b(problema|problemas|falla|fallas|error|errores|anomalia|anomalias|salud|estado|algo mal|esta bien|funciona bien|funcionando bien)\b/.test(texto);

        const fraseDiagnostico =
            /\b(diagnostico|diagnosticar|diagnostica)\b/.test(texto);

        const referenciaContextual =
            /\b(esa red|esta red|ese router|este router|ese nodo|este nodo|ahi|alli|el mismo|la misma)\b/.test(texto);

        // Debe existir una intención clara de revisión técnica.
        if (
            !(
                fraseDiagnostico ||
                (accion && hablaDeRed && buscaProblema) ||
                (accion && hablaDeRed) ||
                (referenciaContextual && (accion || buscaProblema))
            )
        ) {
            return null;
        }

        // Evitamos capturar diagnósticos claramente dirigidos a un cliente.
        if (
            /\b(cliente|abonado|usuario)\b/.test(texto) &&
            !hablaDeRed
        ) {
            return null;
        }

        let entidad = texto
            .replace(/\b(revisa|revisar|diagnostica|diagnosticar|analiza|analizar|verifica|verificar|comprueba|comprobar|chequea|chequear|mira|mirar|averigua|averiguar)\b/g, " ")
            .replace(/\b(la red|el nodo|el router|router|mikrotik|red|nodo|sector|infraestructura)\b/g, " ")
            .replace(/\b(dime|decime|indicame|me dices|me dice|si|ves|hay|existe|existen|algun|alguna|algunos|algunas|problema|problemas|falla|fallas|error|errores|anomalia|anomalias|salud|estado|algo|mal|funciona|funcionando|bien|por favor)\b/g, " ")
            .replace(/\b(de|del|en|a|al)\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (
            referenciaContextual ||
            entidad === "ese" ||
            entidad === "esa" ||
            entidad === "este" ||
            entidad === "esta"
        ) {
            entidad = "";
        }

        return {
            entidad: entidad || null,
            usaContextoActual:
                referenciaContextual ||
                (!entidad && !!routerMikrotikDanteRef.current),
            confianza:
                fraseDiagnostico
                    ? 0.98
                    : (accion && hablaDeRed && buscaProblema)
                        ? 0.97
                        : 0.92,
        };
    }

    function numeroTecnicoDante(
        valor: unknown
    ): number | null {
        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return null;
        }

        const numero = Number(
            String(valor)
                .replace(/[^\d.-]/g, "")
        );

        return Number.isFinite(numero)
            ? numero
            : null;
    }

    function uptimeMinutosDante(
        valor: unknown
    ): number | null {
        const texto =
            String(valor || "")
                .toLowerCase()
                .trim();

        if (!texto) {
            return null;
        }

        let minutos = 0;
        let encontro = false;

        const semanas = texto.match(/(\d+)w/);
        const dias = texto.match(/(\d+)d/);
        const horas = texto.match(/(\d+)h/);
        const mins = texto.match(/(\d+)m/);
        const segundos = texto.match(/(\d+)s/);

        if (semanas) {
            minutos += Number(semanas[1]) * 7 * 24 * 60;
            encontro = true;
        }

        if (dias) {
            minutos += Number(dias[1]) * 24 * 60;
            encontro = true;
        }

        if (horas) {
            minutos += Number(horas[1]) * 60;
            encontro = true;
        }

        if (mins) {
            minutos += Number(mins[1]);
            encontro = true;
        }

        if (segundos) {
            minutos += Number(segundos[1]) / 60;
            encontro = true;
        }

        return encontro
            ? minutos
            : null;
    }

    async function obtenerSaludRouterRedDante(
        router: RouterMikrotikDante
    ): Promise<{
        online: boolean;
        recurso: any | null;
        nodo: string | null;
        error: string | null;
    }> {
        try {
            const token = getToken();
            const usaWireGuard =
                Number(
                    router.UsaWireGuard ??
                    router.usa_wireguard ??
                    0
                ) === 1 ||
                Boolean(
                    router.IpWireGuard ||
                    router.ip_wireguard
                );

            if (!usaWireGuard) {
                const res = await fetch(
                    `${API_BASE}/mikrotik/routers/${router.id}/test`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                const data =
                    await res.json().catch(() => ({}));

                if (!res.ok || data?.ok === false) {
                    return {
                        online: false,
                        recurso: null,
                        nodo: null,
                        error:
                            data?.message ||
                            data?.mensaje ||
                            "El router no respondió a la prueba.",
                    };
                }

                return {
                    online: true,
                    recurso:
                        data?.router ||
                        data?.data?.router ||
                        data?.data ||
                        null,
                    nodo: null,
                    error: null,
                };
            }

            const resEstado = await fetch(
                `${API_BASE}/mikrotik/routers/${router.id}/agent/estado`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                }
            );

            const estado =
                await resEstado.json().catch(() => ({}));

            if (
                !resEstado.ok ||
                estado?.ok === false ||
                estado?.conectado === false
            ) {
                return {
                    online: false,
                    recurso: null,
                    nodo:
                        estado?.nodo ||
                        null,
                    error:
                        estado?.message ||
                        estado?.mensaje ||
                        "El nodo Agent no está respondiendo.",
                };
            }

            const nodo =
                String(estado?.nodo || "").trim();

            if (!nodo) {
                return {
                    online: true,
                    recurso: null,
                    nodo: null,
                    error:
                        "El router responde, pero no tiene nodo Agent identificado.",
                };
            }

            const resRecurso = await fetch(
                `${API_BASE}/mikrotik/agent/resource`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ nodo }),
                }
            );

            const dataRecurso =
                await resRecurso.json().catch(() => ({}));

            if (
                !resRecurso.ok ||
                dataRecurso?.ok === false
            ) {
                return {
                    online: true,
                    recurso: null,
                    nodo,
                    error:
                        dataRecurso?.message ||
                        dataRecurso?.mensaje ||
                        "No pude consultar los recursos del router.",
                };
            }

            const recurso =
                dataRecurso?.data?.resource?.[0] ||
                dataRecurso?.data?.resources?.[0] ||
                dataRecurso?.data?.[0] ||
                dataRecurso?.data?.resource ||
                dataRecurso?.data ||
                null;

            return {
                online: true,
                recurso,
                nodo,
                error: null,
            };
        } catch (error: any) {
            console.error(
                "DANTE RED: error consultando salud del router:",
                error
            );

            return {
                online: false,
                recurso: null,
                nodo: null,
                error:
                    error?.message ||
                    "No pude comunicarme con el router.",
            };
        }
    }

    async function obtenerEquiposWirelessRedDante(
        router: RouterMikrotikDante
    ): Promise<EquipoWirelessDante[]> {
        // Pedimos todos y filtramos estrictamente por routerId.
        // No usamos el fallback de obtenerEquiposWirelessDante(router),
        // porque para un diagnóstico de red no debemos mezclar equipos
        // de otros nodos si este router no tiene coincidencias.
        const todos =
            await obtenerEquiposWirelessDante(null);

        return todos.filter(
            (equipo) =>
                Number(equipo.routerId) ===
                Number(router.id)
        );
    }

    async function analizarWirelessRedDante(
        router: RouterMikrotikDante
    ): Promise<{
        totalEquipos: number;
        consultados: number;
        sinMetricas: number;
        estaciones: number;
        senalesRegulares: number;
        senalesMalas: number;
        peorSenal: number | null;
        equiposSinMetricas: string[];
    }> {
        const equipos =
            await obtenerEquiposWirelessRedDante(router);

        let consultados = 0;
        let sinMetricas = 0;
        let estaciones = 0;
        let senalesRegulares = 0;
        let senalesMalas = 0;
        let peorSenal: number | null = null;
        const equiposSinMetricas: string[] = [];

        const tamanoLote = 5;

        for (
            let inicio = 0;
            inicio < equipos.length;
            inicio += tamanoLote
        ) {
            const lote =
                equipos.slice(
                    inicio,
                    inicio + tamanoLote
                );

            const resultados =
                await Promise.all(
                    lote.map(async (equipo) => {
                        const equipoId =
                            String(
                                equipo.equipoId ||
                                ""
                            ).trim();

                        if (!equipoId) {
                            return {
                                equipo,
                                metricas: null,
                            };
                        }

                        const metricas =
                            await obtenerMetricasWirelessDante(
                                equipoId
                            );

                        return {
                            equipo,
                            metricas,
                        };
                    })
                );

            for (const resultado of resultados) {
                if (!resultado.metricas?.salida) {
                    sinMetricas += 1;
                    equiposSinMetricas.push(
                        String(
                            resultado.equipo.nombre ||
                            resultado.equipo.ipGestion ||
                            resultado.equipo.equipoId ||
                            "equipo"
                        )
                    );
                    continue;
                }

                consultados += 1;

                const listaEstaciones =
                    parseStationsCpeDante(
                        resultado.metricas.salida
                    );

                estaciones +=
                    listaEstaciones.length;

                for (const estacion of listaEstaciones) {
                    const senal =
                        numeroTecnicoDante(
                            estacion?.signal ??
                            estacion?.remote?.signal
                        );

                    if (senal === null) {
                        continue;
                    }

                    if (
                        peorSenal === null ||
                        senal < peorSenal
                    ) {
                        peorSenal = senal;
                    }

                    if (senal <= -83) {
                        senalesMalas += 1;
                    } else if (senal <= -77) {
                        senalesRegulares += 1;
                    }
                }
            }
        }

        return {
            totalEquipos: equipos.length,
            consultados,
            sinMetricas,
            estaciones,
            senalesRegulares,
            senalesMalas,
            peorSenal,
            equiposSinMetricas,
        };
    }

    async function ejecutarDiagnosticoRedDante(
        router: RouterMikrotikDante
    ): Promise<void> {
        const procesoId =
            procesoDanteIdRef.current;

        seleccionarRouterMikrotikDante(
            router,
            "DIAGNOSTICO_RED"
        );

        responderDante(
            `De acuerdo. Voy a revisar la red de ${router.nombre}: estado del MikroTik, recursos y equipos wireless asociados.`
        );

        const saludRouter =
            await obtenerSaludRouterRedDante(router);

        if (
            procesoId !==
            procesoDanteIdRef.current
        ) {
            return;
        }

        if (!saludRouter.online) {
            actualizarContextoDante({
                tema: "MIKROTIK",
                ultimaIntencion: "DIAGNOSTICO_RED_CRITICO",
                esperandoRespuesta: false,
                datoPendiente: null,
            });

            responderDante(
                `Diagnóstico CRÍTICO de ${router.nombre}. El MikroTik no está respondiendo. ${saludRouter.error || ""} La falla puede estar en el router, el nodo, WireGuard o el enlace principal hacia ese equipo.`
            );
            return;
        }

        const wireless =
            await analizarWirelessRedDante(router);

        if (
            procesoId !==
            procesoDanteIdRef.current
        ) {
            return;
        }

        const recurso =
            saludRouter.recurso || {};

        const cargaCpu =
            numeroTecnicoDante(
                recurso?.cpuLoad ??
                recurso?.["cpu-load"] ??
                recurso?.load
            );

        const memoriaLibre =
            numeroTecnicoDante(
                recurso?.freeMemory ??
                recurso?.["free-memory"]
            );

        const memoriaTotal =
            numeroTecnicoDante(
                recurso?.totalMemory ??
                recurso?.["total-memory"]
            );

        const uptime =
            recurso?.uptime ||
            null;

        const minutosUptime =
            uptimeMinutosDante(uptime);

        let nivel: NivelDiagnosticoRedDante =
            "OK";

        const problemas: string[] = [];
        const detalles: string[] = [];

        if (cargaCpu !== null) {
            detalles.push(
                `CPU ${cargaCpu} por ciento`
            );

            if (cargaCpu >= 90) {
                nivel = "CRITICO";
                problemas.push(
                    `la CPU está críticamente alta en ${cargaCpu} por ciento`
                );
            } else if (cargaCpu >= 75) {
                if (nivel === "OK") {
                    nivel = "ADVERTENCIA";
                }
                problemas.push(
                    `la CPU está elevada en ${cargaCpu} por ciento`
                );
            }
        }

        if (
            memoriaLibre !== null &&
            memoriaTotal !== null &&
            memoriaTotal > 0
        ) {
            const porcentajeLibre =
                (memoriaLibre / memoriaTotal) * 100;

            detalles.push(
                `memoria libre ${porcentajeLibre.toFixed(1)} por ciento`
            );

            if (porcentajeLibre < 8) {
                nivel = "CRITICO";
                problemas.push(
                    `la memoria libre está críticamente baja en ${porcentajeLibre.toFixed(1)} por ciento`
                );
            } else if (porcentajeLibre < 15) {
                if (nivel === "OK") {
                    nivel = "ADVERTENCIA";
                }
                problemas.push(
                    `la memoria libre está baja en ${porcentajeLibre.toFixed(1)} por ciento`
                );
            }
        }

        if (uptime) {
            detalles.push(
                `uptime ${uptime}`
            );
        }

        if (
            minutosUptime !== null &&
            minutosUptime < 15
        ) {
            if (nivel === "OK") {
                nivel = "ADVERTENCIA";
            }
            problemas.push(
                "el router parece haberse reiniciado recientemente"
            );
        }

        detalles.push(
            `${wireless.totalEquipos} equipos wireless asociados`
        );

        if (wireless.estaciones > 0) {
            detalles.push(
                `${wireless.estaciones} estaciones detectadas`
            );
        }

        if (wireless.senalesMalas > 0) {
            if (nivel === "OK") {
                nivel = "ADVERTENCIA";
            }

            problemas.push(
                `${wireless.senalesMalas} ${wireless.senalesMalas === 1 ? "estación presenta" : "estaciones presentan"} señal mala de -83 dBm o peor`
            );
        }

        if (wireless.senalesRegulares > 0) {
            if (nivel === "OK") {
                nivel = "ADVERTENCIA";
            }

            problemas.push(
                `${wireless.senalesRegulares} ${wireless.senalesRegulares === 1 ? "estación está" : "estaciones están"} en rango regular de señal`
            );
        }

        if (wireless.peorSenal !== null) {
            detalles.push(
                `peor señal ${wireless.peorSenal} dBm`
            );
        }

        if (wireless.sinMetricas > 0) {
            const proporcion =
                wireless.totalEquipos > 0
                    ? wireless.sinMetricas / wireless.totalEquipos
                    : 0;

            if (
                wireless.totalEquipos >= 3 &&
                proporcion >= 0.5
            ) {
                nivel = "CRITICO";
                problemas.push(
                    `${wireless.sinMetricas} de ${wireless.totalEquipos} equipos wireless no devolvieron métricas`
                );
            } else {
                if (nivel === "OK") {
                    nivel = "ADVERTENCIA";
                }
                problemas.push(
                    `${wireless.sinMetricas} ${wireless.sinMetricas === 1 ? "equipo wireless no devolvió" : "equipos wireless no devolvieron"} métricas`
                );
            }
        }

        if (
            saludRouter.error &&
            saludRouter.online
        ) {
            if (nivel === "OK") {
                nivel = "ADVERTENCIA";
            }
            problemas.push(
                saludRouter.error
            );
        }

        let respuesta =
            `Diagnóstico ${nivel} de ${router.nombre}. El MikroTik está accesible.`;

        if (detalles.length > 0) {
            respuesta +=
                ` Datos revisados: ${detalles.join(", ")}.`;
        }

        if (problemas.length === 0) {
            respuesta +=
                " No encontré anomalías con las comprobaciones disponibles. La red se ve estable en este momento.";
        } else {
            respuesta +=
                ` Encontré ${problemas.length === 1 ? "esta observación" : "estas observaciones"}: ${problemas.join("; ")}.`;

            if (nivel === "CRITICO") {
                respuesta +=
                    " Hay indicios de una afectación importante y conviene revisar primero el nodo o los equipos que no están respondiendo.";
            } else {
                respuesta +=
                    " No parece una caída total del nodo, pero sí hay puntos que conviene revisar.";
            }
        }

        actualizarContextoDante({
            tema: "MIKROTIK",
            entidadId: String(router.id),
            entidadNombre: router.nombre,
            ultimaIntencion:
                `DIAGNOSTICO_RED_${nivel}`,
            esperandoRespuesta: false,
            datoPendiente: null,
        });

        responderDante(respuesta);
    }

    async function procesarDiagnosticoRedDante(
        textoOriginal: string,
        entidadInterpretada?: string | null,
        usaContextoActual?: boolean
    ): Promise<boolean> {
        const routers =
            await obtenerRoutersMikrotikDante();

        if (!routers.length) {
            responderDante(
                "No pude obtener la lista de routers MikroTik para iniciar el diagnóstico de red."
            );
            return true;
        }

        let router =
            buscarRouterMencionadoDante(
                entidadInterpretada ||
                textoOriginal,
                routers
            );

        if (
            !router &&
            usaContextoActual &&
            routerMikrotikDanteRef.current
        ) {
            router =
                routerMikrotikDanteRef.current;
        }

        if (
            !router &&
            routers.length === 1
        ) {
            router = routers[0];
        }

        if (!router) {
            actualizarContextoDante({
                tema: "MIKROTIK",
                ultimaIntencion: "DIAGNOSTICO_RED",
                esperandoRespuesta: true,
                datoPendiente: "ROUTER_DIAGNOSTICO_RED",
            });

            responderDante(
                "¿Qué red o router deseas que diagnostique? Dime el nombre del MikroTik, sector o parroquia."
            );
            return true;
        }

        await ejecutarDiagnosticoRedDante(router);
        return true;
    }

    async function procesarComandoDante(
        comando: string
    ) {

        const limpio =
            comando.trim();

        if (!limpio) {
            return;
        }

        ultimoTextoUsuarioDanteRef.current =
            limpio;

        const texto =
            normalizarTextoDante(
                limpio
            );

        // ========================================================
        // DANTE - PRESENTACIÓN CONVERSACIONAL
        // Tiene prioridad para evitar ejecutar acciones reales
        // cuando Dante está siendo mostrado en una demostración.
        // ========================================================
        if (
            procesarModoPresentacionDante(
                limpio
            )
        ) {
            return;
        }

        const textoNormalizadoAlertasPago =
            texto;

        if (
            procesarConfirmacionAlertasPagoDante(
                textoNormalizadoAlertasPago
            )
        ) {
            return;
        }

        if (
            (
                alertasPagoDanteRef.current.pagos.length ||
                alertasPagoDanteRef.current.cortes.length
            ) &&
            consultarNombreEnAlertasPagoDante(
                limpio
            )
        ) {
            return;
        }

        console.log(
            "COMANDO DANTE:",
            limpio
        );

        // ========================================================
        // DANTE - ABRIR / CERRAR ENTRADA DE TEXTO
        // ========================================================

        const esAbrirTextoDante =

            texto === "abre texto" ||
            texto === "abrir texto" ||
            texto === "abre el texto" ||
            texto === "abrir el texto" ||
            texto === "modo texto" ||
            texto === "abre modo texto";


        if (
            esAbrirTextoDante
        ) {

            setMostrarEntradaTextoDante(
                true
            );


            responderDante(
                "Listo. Puedes escribir tu consulta."
            );


            return;
        }


        const esCerrarTextoDante =

            texto === "cierra texto" ||
            texto === "cerrar texto" ||
            texto === "cierra el texto" ||
            texto === "cerrar el texto";


        if (
            esCerrarTextoDante
        ) {

            setMostrarEntradaTextoDante(
                false
            );


            setEntradaTextoDante(
                ""
            );


            responderDante(
                "Entrada de texto cerrada."
            );


            return;
        }

        // ========================================================
        // DANTE - VOLVER A EJECUTAR ÚLTIMO COMANDO
        // ========================================================

        const esRepetirUltimoComando =

            texto === "vuelve a revisar" ||
            texto === "volver a revisar" ||

            texto === "revisa de nuevo" ||
            texto === "revisalo de nuevo" ||
            texto === "revisala de nuevo" ||

            texto === "revisa otra vez" ||
            texto === "revisalo otra vez" ||
            texto === "revisala otra vez" ||

            texto === "hazlo de nuevo" ||
            texto === "hazlo otra vez" ||

            texto === "otra vez" ||
            texto === "de nuevo";

        if (
            esRepetirUltimoComando
        ) {

            if (
                !ultimoComando ||
                normalizarTextoDante(
                    ultimoComando
                ) === "dante cancela"
            ) {

                responderDante(
                    "No tengo un comando anterior para volver a ejecutar."
                );

                return;
            }

            console.log(
                "DANTE REPITIENDO COMANDO:",
                ultimoComando
            );

            responderDante(
                "De acuerdo, vuelvo a revisarlo."
            );

            await procesarComandoDante(
                ultimoComando
            );

            return;
        }
        // ========================================================
        // GUARDAR ÚLTIMO COMANDO REAL
        // ========================================================

        setUltimoComando(
            limpio
        );

        // ========================================================
        // DANTE - CANCELAR TODO
        // TIENE PRIORIDAD SOBRE CUALQUIER OTRO COMANDO
        // ========================================================

        const esCancelarDante =

            texto === "cancela" ||
            texto === "cancelar" ||
            texto === "cancelalo" ||

            texto === "dante cancela" ||
            texto === "dante cancelar" ||
            texto === "dante cancelalo" ||

            texto === "detente" ||
            texto === "dante detente" ||

            texto === "para" ||
            texto === "dante para" ||

            texto === "olvida eso" ||
            texto === "dante olvida eso" ||

            texto === "cancelar proceso" ||
            texto === "cancela el proceso" ||
            texto === "dante cancela el proceso";


        if (
            esCancelarDante
        ) {

            cancelarTodoDante();

            return;
        }
        // ========================================================
        // NUEVO CICLO DE TRABAJO DE DANTE
        // ========================================================

        procesoDanteIdRef.current += 1;

        const procesoActualDante =
            procesoDanteIdRef.current;

        // ========================================================
        // DANTE - CONFIRMACIÓN DE TICKET DE MANTENIMIENTO
        // Tiene prioridad porque normalmente la respuesta será
        // simplemente "sí" o "no".
        // ========================================================
        if (
            ticketMantenimientoPendienteDanteRef.current
        ) {
            const procesadoTicket =
                await procesarConfirmacionTicketMantenimientoDante(
                    limpio
                );

            if (procesadoTicket) {
                return;
            }
        }

        // Solicitud directa de ticket con un cliente ya en contexto.
        // Esto permite:
        // "Dante busca a Pedro Cabezas" -> cliente queda seleccionado
        // "créale un ticket" / "una visita de técnico" / "manda un técnico"
        // -> reutiliza directamente a Pedro sin pedir el nombre otra vez.
        if (
            esSolicitudTicketMantenimientoDante(
                limpio
            ) &&
            servicioClienteDanteRef.current
        ) {
            await prepararTicketMantenimientoDante(
                servicioClienteDanteRef.current
            );
            return;
        }

        // ========================================================
        // DANTE V3 - DIAGNÓSTICO COMPUESTO DE INTERNET
        // Tiene prioridad antes de los comandos operativos porque
        // una frase como "revisa por qué Juan no tiene internet"
        // debe investigar, no ejecutar una acción de corte.
        // ========================================================

        if (flujoDiagnosticoInternetDanteRef.current) {
            const procesado =
                await procesarFlujoDiagnosticoInternetDante(
                    limpio
                );

            if (procesado) return;
        }

        if (esInicioDiagnosticoInternetDante(limpio)) {
            await iniciarDiagnosticoInternetDante(limpio);
            return;
        }

        // ========================================================
        // DANTE - FLUJOS CONVERSACIONALES MIKROTIK
        // Tienen prioridad para que respuestas como "sí", "84.156",
        // un nombre o un router continúen el diálogo actual.
        // ========================================================

        if (flujoServicioMikrotikDanteRef.current) {
            const procesado = await procesarFlujoServicioMikrotikDante(limpio);
            if (procesado) return;
        }

        if (flujoMorosoDanteRef.current) {
            const procesado = await procesarFlujoMorosoDante(limpio);
            if (procesado) return;
        }

        if (esInicioAgregarMorosoDante(limpio)) {
            iniciarFlujoMorosoDante(limpio);
            return;
        }

        const accionServicioMikrotik = detectarAccionServicioMikrotikDante(limpio);
        if (accionServicioMikrotik) {
            await iniciarFlujoServicioMikrotikDante(limpio, accionServicioMikrotik);
            return;
        }

        // ========================================================
        // DANTE - SELECCIÓN DE CLIENTE PENDIENTE
        // Debe procesarse antes del intérprete central para que
        // respuestas como "2" o un nombre completo continúen
        // exactamente la búsqueda que Dante acaba de presentar.
        // ========================================================

        if (
            clientesPendientesSeleccionDanteRef.current.length > 0
        ) {
            const seleccionProcesada =
                await procesarSeleccionClientePendienteDante(
                    limpio
                );

            if (seleccionProcesada) {
                return;
            }
        }

        // ========================================================
        // DANTE - RESUMEN DE CLIENTES Y CONTRATOS
        // ========================================================

        const resumenProcesado =
            await procesarConsultaResumenClientesContratosDante(
                textoNormalizadoAlertasPago
            );

        if (resumenProcesado) {
            return;
        }

        // ========================================================
        // DANTE FASE 1H - INTÉRPRETE CENTRAL
        // ========================================================
        // Si reconoce una expresión natural nueva, reutiliza la
        // función existente. Si no la reconoce, devuelve false y
        // continúa exactamente con todos los comandos antiguos.
        const procesadoPorMotorCentral =
            await ejecutarIntencionCentralDante(
                limpio
            );

        if (procesadoPorMotorCentral) {
            return;
        }

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
            // ESPERANDO CONTENIDO DEL RECORDATORIO
            // ====================================================

            if (
                pendiente.esperando ===
                "CONTENIDO"
            ) {

                const contenidoAgenda =
                    limpio.trim();


                if (!contenidoAgenda) {

                    responderDante(
                        "Dime qué deseas agendar o recordar."
                    );

                    return;
                }


                // Guardamos ahora la frase completa
                pendiente.textoOriginal =
                    contenidoAgenda;


                const resultado =
                    interpretarFechaAgendaDante(
                        contenidoAgenda
                    );


                // ====================================================
                // DIJO CONTENIDO PERO NO FECHA
                // ====================================================

                if (
                    !resultado.encontroFecha
                ) {

                    pendiente.fecha =
                        null;

                    pendiente.esperando =
                        "FECHA";


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
                        "Perfecto. ¿Para qué día deseas que lo agende?"
                    );


                    return;
                }


                // ====================================================
                // TENEMOS FECHA
                // ====================================================

                pendiente.fecha =
                    resultado.fecha;


                // ====================================================
                // TENEMOS FECHA PERO NO HORA
                // ====================================================

                if (
                    !resultado.encontroHora
                ) {

                    pendiente.esperando =
                        "HORA";


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
                        "Perfecto. ¿A qué hora deseas que te lo recuerde?"
                    );


                    return;
                }


                // ====================================================
                // YA TENEMOS CONTENIDO + FECHA + HORA
                // ====================================================

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


                actualizarContextoDante({

                    esperandoRespuesta:
                        false,

                    datoPendiente:
                        null,

                });


                await guardarEventoAgendaDante(

                    contenidoAgenda,

                    resultado.fecha

                );


                agendaPendienteDanteRef.current =
                    null;


                return;
            }


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

        const esReferenciaClienteActual =
            !!servicioClienteDanteRef.current &&
            (
                texto === "que sabes de el" ||
                texto === "que sabes de ella" ||
                texto === "que sabes de ese cliente" ||
                texto === "que sabes de este cliente" ||

                texto === "que recuerdas de el" ||
                texto === "que recuerdas de ella" ||
                texto === "que recuerdas de ese cliente" ||
                texto === "que recuerdas de este cliente"
            );


        if (
            !esReferenciaClienteActual &&
            (
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
                )
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
            texto.includes("ir a proforma") ||
            texto.includes("abre proformas") ||
            texto.includes("abre proforma") ||
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
        // DANTE - CONSULTA COMPLETA:
        // ESTADO ACTUAL + MEMORIA DEL CLIENTE
        // ========================================================

        if (

            texto === "que sabes de el" ||
            texto === "que sabes de ella" ||

            texto === "que sabes de este cliente" ||
            texto === "que sabes de ese cliente" ||

            texto === "que recuerdas de el" ||
            texto === "que recuerdas de ella" ||

            texto === "que recuerdas de este cliente" ||
            texto === "que recuerdas de ese cliente" ||

            texto === "hay antecedentes" ||
            texto === "tiene antecedentes" ||

            texto === "cuales son sus antecedentes" ||
            texto === "dime sus antecedentes"

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
                    "CONSULTAR_CONTEXTO_COMPLETO_CLIENTE",

                esperandoRespuesta:
                    false,

                datoPendiente:
                    null,

            });


            await consultarPerfilClienteDante();


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
        // DANTE - PAGOS PENDIENTES / VENCIDOS DEL CLIENTE
        // ========================================================

        if (
            texto === "tiene pago pendiente" ||
            texto === "tiene pagos pendientes" ||
            texto === "tiene algun pago pendiente" ||

            texto === "tiene pago vencido" ||
            texto === "tiene pagos vencidos" ||
            texto === "tiene algun pago vencido" ||

            texto === "tiene mensualidades pendientes" ||
            texto === "cuantas mensualidades debe"
        ) {

            const cliente =
                obtenerClienteActualDante();

            if (!cliente) {
                responderDante(
                    "No tengo un cliente seleccionado. Indícame primero qué cliente deseas consultar."
                );
                return;
            }

            const perfil =
                await obtenerPerfilActualDante();

            if (!perfil) {
                responderDante(
                    "No pude consultar la facturación del cliente."
                );
                return;
            }

            const pendientes =
                Number(
                    perfil.facturacion?.totalPendientes ||
                    0
                );

            if (pendientes === 0) {

                responderDante(
                    "Actualmente el cliente no tiene mensualidades pendientes."
                );

            } else if (pendientes === 1) {

                responderDante(
                    "Actualmente el cliente tiene una mensualidad pendiente."
                );

            } else {

                responderDante(
                    `Actualmente el cliente tiene ${pendientes} mensualidades pendientes.`
                );
            }

            actualizarContextoDante({
                tema: "PAGOS",
                ultimaIntencion: "CONSULTAR_PAGOS_PENDIENTES",
                esperandoRespuesta: false,
                datoPendiente: null,
            });

            return;
        }

        // ========================================================
        // DANTE - ESTADO DE CORTE / SUSPENSIÓN
        // ========================================================

        if (
            texto === "esta en corte" ||
            texto === "esta cortado" ||
            texto === "tiene corte" ||
            texto === "esta suspendido" ||

            texto === "el servicio esta cortado" ||
            texto === "el servicio esta suspendido" ||

            texto === "dime si esta en corte" ||
            texto === "dime si esta cortado" ||
            texto === "dime si esta suspendido"
        ) {

            const cliente =
                obtenerClienteActualDante();

            if (!cliente) {
                responderDante(
                    "No tengo un cliente seleccionado. Indícame primero qué cliente deseas consultar."
                );
                return;
            }

            const perfil =
                await obtenerPerfilActualDante();

            if (!perfil) {
                responderDante(
                    "No pude consultar el estado actual del servicio."
                );
                return;
            }

            const estadoServicio =
                String(
                    perfil.servicio?.estadoServicio ||
                    cliente.estadoServicio ||
                    ""
                ).toUpperCase();

            if (
                estadoServicio === "SUSPENDIDO" ||
                estadoServicio === "CORTADO"
            ) {

                responderDante(
                    `Sí. Actualmente el servicio se encuentra ${estadoServicio.toLowerCase()}.`
                );

            } else {

                responderDante(
                    `No. Actualmente el servicio está ${estadoServicio || "sin estado registrado"}.`
                );
            }

            actualizarContextoDante({
                tema: "CLIENTE",
                ultimaIntencion: "CONSULTAR_ESTADO_CORTE",
                esperandoRespuesta: false,
                datoPendiente: null,
            });

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
        // DANTE - INICIAR AGENDA / RECORDATORIO CON PAUSA
        // ========================================================

        if (
            texto === "agenda" ||
            texto === "agendar" ||
            texto === "agendame" ||

            texto === "recordar" ||
            texto === "recuerda" ||
            texto === "recuerdame" ||

            texto === "recordatorio"
        ) {

            agendaPendienteDanteRef.current = {

                textoOriginal:
                    "",

                fecha:
                    null,

                esperando:
                    "CONTENIDO",

            };


            actualizarContextoDante({

                tema:
                    "AGENDA",

                ultimaIntencion:
                    "ESPERANDO_CONTENIDO_AGENDA",

                esperandoRespuesta:
                    true,

                datoPendiente:
                    "CONTENIDO",

            });


            responderDante(
                "Claro. Dime qué deseas agendar o recordar."
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
        // DANTE - PENDIENTES DEL CLIENTE ACTUAL
        // ========================================================

        if (

            texto === "tiene algun pendiente" ||
            texto === "tiene algo pendiente" ||
            texto === "hay algo pendiente" ||

            texto === "que tiene pendiente" ||
            texto === "que pendientes tiene" ||
            texto === "cuales son sus pendientes" ||

            texto === "tiene algun compromiso" ||
            texto === "tiene compromisos pendientes" ||

            texto === "tiene compromiso de pago" ||
            texto === "tiene algun compromiso de pago" ||
            texto === "hay compromiso de pago" ||

            texto === "cuando dijo que iba a pagar" ||
            texto === "cuando va a pagar" ||
            texto === "cuando quedo de pagar"

        ) {

            const cliente =
                obtenerClienteActualDante();


            if (!cliente) {

                responderDante(
                    "No tengo un cliente seleccionado. Indícame primero qué cliente deseas consultar."
                );

                return;
            }


            cambiarTemaDante(
                "PAGOS",
                {
                    conservarCliente:
                        true,

                    ultimaIntencion:
                        "CONSULTAR_PENDIENTES_CLIENTE",
                }
            );


            const memorias =
                await obtenerMemoriasClienteActualDante();


            const pendientes =
                obtenerPendientesClienteDante(
                    memorias
                );


            const nombre =
                `${cliente.nombres || ""} ${cliente.apellidos || ""}`
                    .trim();


            if (
                pendientes.length === 0
            ) {

                responderDante(
                    `No tengo pendientes activos registrados para ${nombre}.`
                );

                return;
            }


            const principales =
                pendientes.slice(
                    0,
                    3
                );


            const detalle =
                principales
                    .map(
                        (memoria: any) =>
                            memoria.contenido ||
                            ""
                    )
                    .filter(Boolean)
                    .join(". ");


            let respuesta =
                pendientes.length === 1
                    ? `${nombre} tiene un pendiente activo. `
                    : `${nombre} tiene ${pendientes.length} pendientes activos. `;


            respuesta +=
                detalle;


            responderDante(
                respuesta
            );


            return;
        }

        // ========================================================
        // DANTE - CONSULTAS MIKROTIK
        // LISTAR / ESTADO / TEST / IP / REDES / RECURSOS
        // ========================================================

        function routerUsaWireGuardDante(
            router: RouterMikrotikDante
        ) {

            const valor =
                router.UsaWireGuard ??
                router.usa_wireguard;


            // ====================================================
            // BOOLEANO
            // ====================================================

            if (
                valor === true
            ) {
                return true;
            }


            // ====================================================
            // NÚMERO / STRING
            // ====================================================

            if (
                valor === 1 ||
                String(valor) === "1"
            ) {
                return true;
            }


            // ====================================================
            // MYSQL BIT / BUFFER SERIALIZADO
            //
            // Ejemplo:
            // {
            //     type: "Buffer",
            //     data: [1]
            // }
            // ====================================================

            if (
                valor &&
                typeof valor === "object"
            ) {

                const data =
                    (valor as any).data;


                if (
                    Array.isArray(data) &&
                    Number(data[0]) === 1
                ) {

                    return true;
                }
            }


            return false;
        }


        // ========================================================
        // DANTE - DISTANCIA LEVENSHTEIN
        // ========================================================

        function distanciaLevenshteinDante(
            a: string,
            b: string
        ): number {

            const matriz: number[][] =
                Array.from(
                    {
                        length:
                            b.length + 1
                    },
                    () =>
                        new Array(
                            a.length + 1
                        ).fill(0)
                );


            for (
                let i = 0;
                i <= b.length;
                i++
            ) {

                matriz[i][0] =
                    i;
            }


            for (
                let j = 0;
                j <= a.length;
                j++
            ) {

                matriz[0][j] =
                    j;
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

                    if (
                        b[i - 1] ===
                        a[j - 1]
                    ) {

                        matriz[i][j] =
                            matriz[i - 1][j - 1];

                    } else {

                        matriz[i][j] =
                            Math.min(

                                matriz[i - 1][j - 1] + 1,

                                matriz[i][j - 1] + 1,

                                matriz[i - 1][j] + 1
                            );
                    }
                }
            }


            return matriz[b.length][a.length];
        }

        // ========================================================
        // DANTE - PORCENTAJE DE SIMILITUD
        // ========================================================

        function similitudTextoDante(
            texto1: string,
            texto2: string
        ): number {

            const a =
                normalizarNombreRouterDante(
                    texto1
                );

            const b =
                normalizarNombreRouterDante(
                    texto2
                );


            if (
                !a ||
                !b
            ) {
                return 0;
            }


            if (
                a === b
            ) {
                return 1;
            }


            const longitud =
                Math.max(
                    a.length,
                    b.length
                );


            if (
                longitud === 0
            ) {
                return 1;
            }


            const distancia =
                distanciaLevenshteinDante(
                    a,
                    b
                );


            return (
                1 -
                distancia /
                longitud
            );
        }

        // ========================================================
        // DANTE - LIMPIAR COMANDO PARA BUSCAR ROUTER
        // ========================================================

        function extraerNombreRouterComandoDante(
            textoOriginal: string
        ): string {

            return normalizarNombreRouterDante(
                textoOriginal
            )
                .replace(
                    /\bdante\b/g,
                    " "
                )
                .replace(
                    /\brevisa\b/g,
                    " "
                )
                .replace(
                    /\brevisar\b/g,
                    " "
                )
                .replace(
                    /\brouter\b/g,
                    " "
                )
                .replace(
                    /\bmikrotik\b/g,
                    " "
                )
                .replace(
                    /\bestado\b/g,
                    " "
                )
                .replace(
                    /\bconexion\b/g,
                    " "
                )
                .replace(
                    /\bconectado\b/g,
                    " "
                )
                .replace(
                    /\bactivo\b/g,
                    " "
                )
                .replace(
                    /\bfuncionando\b/g,
                    " "
                )
                .replace(
                    /\bdime\b/g,
                    " "
                )
                .replace(
                    /\bconsulta\b/g,
                    " "
                )
                .replace(
                    /\bconsultar\b/g,
                    " "
                )
                .replace(
                    /\bde\b/g,
                    " "
                )
                .replace(
                    /\bel\b/g,
                    " "
                )
                .replace(
                    /\bla\b/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();
        }

        // ========================================================
        // DANTE - LISTAR ROUTERS
        // ========================================================

        async function listarRoutersDante() {
            const procesoId =
                procesoDanteIdRef.current;

            const vozProcesamiento =
                informarProcesamientoDante(
                    "BUSCANDO"
                );

            const consultaRouters =
                obtenerRoutersMikrotikDante();

            const routers =
                await consultaRouters;

            await vozProcesamiento;

            if (
                procesoId !==
                procesoDanteIdRef.current
            ) {

                console.log(
                    "DANTE: respuesta de proceso cancelado ignorada"
                );

                return;
            }

            if (
                routers.length === 0
            ) {

                responderDante(
                    "No encontré routers MikroTik registrados."
                );

                return;
            }


            const nombres =
                routers
                    .map(
                        (router) =>
                            router.nombre
                    )
                    .filter(
                        Boolean
                    );


            if (
                routers.length === 1
            ) {

                responderDante(
                    `Tengo un router MikroTik registrado: ${nombres[0]}.`
                );

                return;
            }


            responderDante(
                `Tengo ${routers.length} routers MikroTik registrados: ${nombres.join(", ")}.`
            );
        }


        // ========================================================
        // DANTE - ESTADO DEL ROUTER
        // ========================================================



        async function consultarEstadoRouterDante(
            router: RouterMikrotikDante
        ) {
            const procesoId =
                procesoDanteIdRef.current;

            const vozProcesamiento =
                informarProcesamientoDante(
                    "CONECTANDO"
                );
            try {

                const token =
                    getToken();


                const usaWireGuard =
                    routerUsaWireGuardDante(
                        router
                    );


                // MISMA LÓGICA QUE YA USA TU FRONTEND
                const url =
                    usaWireGuard

                        ? `${API_BASE}/mikrotik/routers/${router.id}/agent/estado`

                        : `${API_BASE}/mikrotik/routers/${router.id}/test`;

                console.log(
                    "DANTE MIKROTIK SELECCIONADO:",
                    {
                        id:
                            router.id,

                        nombre:
                            router.nombre,

                        sector:
                            router.sector,

                        host:
                            router.host,

                        usaWireGuard,

                        ipWireGuard:
                            router.IpWireGuard ||
                            router.ip_wireguard,
                    }
                );

                const res =
                    await fetch(
                        url,
                        {
                            method:
                                "GET",

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

                await vozProcesamiento;

                if (
                    procesoId !==
                    procesoDanteIdRef.current
                ) {

                    console.log(
                        "DANTE: respuesta de proceso cancelado ignorada"
                    );

                    return;
                }

                if (
                    !res.ok ||
                    data.ok === false
                ) {

                    responderDante(
                        `El router ${router.nombre} no está respondiendo. ${data.message || ""}`
                    );

                    return;
                }


                const conectado =
                    data.conectado === true ||
                    data.ok === true ||
                    data.data?.ok === true ||
                    data.router?.ok === true;


                if (
                    conectado
                ) {

                    seleccionarRouterMikrotikDante(
                        router,
                        "ESTADO_ROUTER"
                    );


                    responderDante(
                        `${router.nombre} está conectado y activo.`
                    );

                    return;
                }

                responderDante(
                    `${router.nombre} aparece inactivo o sin conexión.`
                );

            } catch (error) {

                console.error(
                    "DANTE: error consultando estado MikroTik:",
                    error
                );


                responderDante(
                    `No pude consultar el estado de ${router.nombre}.`
                );
            }
        }


        // ========================================================
        // DANTE - TEST COMPLETO DEL ROUTER
        // ========================================================

        async function probarRouterDante(
            router: RouterMikrotikDante
        ) {
            const procesoId =
                procesoDanteIdRef.current;
            const vozProcesamiento =
                informarProcesamientoDante(
                    "CONSULTANDO"
                );
            try {

                const token =
                    getToken();


                const usaWireGuard =
                    routerUsaWireGuardDante(
                        router
                    );


                const url =
                    usaWireGuard

                        ? `${API_BASE}/mikrotik/routers/${router.id}/agent/estado`

                        : `${API_BASE}/mikrotik/routers/${router.id}/test`;


                const res =
                    await fetch(
                        url,
                        {
                            method:
                                "GET",

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

                await vozProcesamiento;

                if (
                    procesoId !==
                    procesoDanteIdRef.current
                ) {

                    console.log(
                        "DANTE: respuesta de proceso cancelado ignorada"
                    );

                    return;
                }

                if (
                    !res.ok ||
                    data.ok === false
                ) {

                    responderDante(
                        `La prueba de conexión de ${router.nombre} falló. ${data.message || ""}`
                    );

                    return;
                }


                seleccionarRouterMikrotikDante(
                    router,
                    "TEST_ROUTER"
                );


                // ====================================================
                // ROUTER DIRECTO
                // ====================================================

                if (
                    !usaWireGuard
                ) {

                    const datos =
                        data.router || {};


                    let respuesta =
                        `${router.nombre} respondió correctamente a la prueba.`;


                    if (
                        datos.version
                    ) {

                        respuesta +=
                            ` Versión ${datos.version}.`;
                    }


                    if (
                        datos.board
                    ) {

                        respuesta +=
                            ` Equipo ${datos.board}.`;
                    }


                    if (
                        datos.cpu
                    ) {

                        respuesta +=
                            ` CPU ${datos.cpu}.`;
                    }


                    if (
                        datos.uptime
                    ) {

                        respuesta +=
                            ` Tiempo encendido ${datos.uptime}.`;
                    }


                    responderDante(
                        respuesta
                    );

                    return;
                }


                // ====================================================
                // ROUTER POR AGENT
                // ====================================================

                const nombreRouter =
                    data.router?.router?.identity?.[0]?.name ||
                    data.router?.identity?.[0]?.name ||
                    data.routerNombre ||
                    router.nombre;


                responderDante(
                    `${nombreRouter} respondió correctamente por el Agent MikroTik. Nodo ${data.nodo || router.sector || "configurado"}.`
                );

            } catch (error) {

                console.error(
                    "DANTE: error haciendo test MikroTik:",
                    error
                );


                responderDante(
                    `No pude completar la prueba del router ${router.nombre}.`
                );
            }
        }


        // ========================================================
        // DANTE - IP PÚBLICA
        // ========================================================

        async function consultarIpPublicaRouterDante(
            router: RouterMikrotikDante
        ) {
            const procesoId =
                procesoDanteIdRef.current;

            const vozProcesamiento =
                informarProcesamientoDante(
                    "CONSULTANDO"
                );

            try {

                const token =
                    getToken();


                const res =
                    await fetch(
                        `${API_BASE}/mikrotik/routers/${router.id}/ip-publica`,
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
                await vozProcesamiento;
                if (
                    procesoId !==
                    procesoDanteIdRef.current
                ) {

                    console.log(
                        "DANTE: respuesta de proceso cancelado ignorada"
                    );

                    return;
                }

                if (
                    !res.ok ||
                    data.ok === false
                ) {

                    responderDante(
                        `No pude obtener la IP pública de ${router.nombre}.`
                    );

                    return;
                }


                const ips =
                    Array.isArray(
                        data.ips
                    )
                        ? data.ips
                            .map(
                                (item: any) =>
                                    String(
                                        item.address || ""
                                    )
                                        .split("/")[0]
                            )
                            .filter(
                                Boolean
                            )
                        : [];


                seleccionarRouterMikrotikDante(
                    router,
                    "IP_PUBLICA_ROUTER"
                );


                if (
                    ips.length === 0
                ) {

                    responderDante(
                        `${router.nombre} no reportó una IP pública.`
                    );

                    return;
                }


                if (
                    ips.length === 1
                ) {

                    responderDante(
                        `La IP pública de ${router.nombre} es ${ips[0]}.`
                    );

                    return;
                }


                responderDante(
                    `${router.nombre} tiene ${ips.length} IP públicas: ${ips.join(", ")}.`
                );

            } catch (error) {

                console.error(
                    "DANTE: error consultando IP pública:",
                    error
                );


                responderDante(
                    `No pude consultar la IP pública de ${router.nombre}.`
                );
            }
        }


        // ========================================================
        // DANTE - REDES INTERNAS
        // ========================================================

        async function consultarRedesRouterDante(
            router: RouterMikrotikDante
        ) {

            const procesoId =
                procesoDanteIdRef.current;

            const vozProcesamiento =
                informarProcesamientoDante(
                    "CONSULTANDO"
                );
            try {

                const token =
                    getToken();


                const res =
                    await fetch(
                        `${API_BASE}/mikrotik/routers/${router.id}/redes-internas`,
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

                await vozProcesamiento;

                if (
                    procesoId !==
                    procesoDanteIdRef.current
                ) {

                    console.log(
                        "DANTE: respuesta de proceso cancelado ignorada"
                    );

                    return;
                }

                if (
                    !res.ok ||
                    data.ok === false
                ) {

                    responderDante(
                        `No pude consultar las redes internas de ${router.nombre}.`
                    );

                    return;
                }


                const redes =
                    Array.isArray(
                        data.redesInternas
                    )
                        ? data.redesInternas
                        : [];


                seleccionarRouterMikrotikDante(
                    router,
                    "REDES_ROUTER"
                );


                if (
                    redes.length === 0
                ) {

                    responderDante(
                        `${router.nombre} no tiene redes internas registradas.`
                    );

                    return;
                }


                responderDante(
                    `${router.nombre} tiene ${redes.length} redes internas: ${redes.join(", ")}.`
                );

            } catch (error) {

                console.error(
                    "DANTE: error consultando redes MikroTik:",
                    error
                );


                responderDante(
                    `No pude consultar las redes de ${router.nombre}.`
                );
            }
        }


        // ========================================================
        // DANTE - RECURSOS DEL ROUTER
        // ========================================================

        async function consultarRecursosRouterDante(
            router: RouterMikrotikDante
        ) {
            const procesoId =
                procesoDanteIdRef.current;

            const vozProcesamiento =
                informarProcesamientoDante(
                    "ANALIZANDO"
                );
            try {

                const token =
                    getToken();


                const usaWireGuard =
                    routerUsaWireGuardDante(
                        router
                    );


                // ====================================================
                // ROUTER DIRECTO
                // UTILIZAMOS /TEST PORQUE YA DEVUELVE RESOURCE
                // ====================================================

                if (
                    !usaWireGuard
                ) {

                    const res =
                        await fetch(
                            `${API_BASE}/mikrotik/routers/${router.id}/test`,
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
                    await vozProcesamiento;


                    if (
                        procesoId !==
                        procesoDanteIdRef.current
                    ) {

                        console.log(
                            "DANTE: respuesta de proceso cancelado ignorada"
                        );

                        return;
                    }

                    if (
                        !res.ok ||
                        data.ok === false
                    ) {

                        responderDante(
                            `No pude consultar los recursos de ${router.nombre}.`
                        );

                        return;
                    }


                    const recurso =
                        data.router || {};


                    seleccionarRouterMikrotikDante(
                        router,
                        "RECURSOS_ROUTER"
                    );


                    let respuesta =
                        `Recursos de ${router.nombre}.`;


                    if (
                        recurso.version
                    ) {

                        respuesta +=
                            ` Versión ${recurso.version}.`;
                    }


                    if (
                        recurso.board
                    ) {

                        respuesta +=
                            ` Board ${recurso.board}.`;
                    }


                    if (
                        recurso.cpu
                    ) {

                        respuesta +=
                            ` CPU ${recurso.cpu}.`;
                    }


                    if (
                        recurso.uptime
                    ) {

                        respuesta +=
                            ` Uptime ${recurso.uptime}.`;
                    }


                    responderDante(
                        respuesta
                    );

                    return;
                }


                // ====================================================
                // WIREGUARD / AGENT
                // PRIMERO OBTENEMOS EL NODO
                // ====================================================

                const resEstado =
                    await fetch(
                        `${API_BASE}/mikrotik/routers/${router.id}/agent/estado`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },

                            cache:
                                "no-store",
                        }
                    );


                const estado =
                    await resEstado.json();


                if (
                    !resEstado.ok ||
                    estado.ok === false
                ) {

                    responderDante(
                        `No pude conectar con ${router.nombre} para consultar sus recursos.`
                    );

                    return;
                }


                const nodo =
                    estado.nodo;


                if (
                    !nodo
                ) {

                    responderDante(
                        `${router.nombre} no tiene un nodo Agent identificado.`
                    );

                    return;
                }


                // ====================================================
                // CONSULTAR RESOURCE DEL AGENT
                // ====================================================

                const res =
                    await fetch(
                        `${API_BASE}/mikrotik/agent/resource`,
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
                                    nodo,
                                }),
                        }
                    );


                const data =
                    await res.json();
                await vozProcesamiento;

                if (
                    procesoId !==
                    procesoDanteIdRef.current
                ) {

                    console.log(
                        "DANTE: respuesta de proceso cancelado ignorada"
                    );

                    return;
                }


                if (
                    !res.ok ||
                    data.ok === false
                ) {

                    responderDante(
                        `No pude obtener los recursos de ${router.nombre}.`
                    );

                    return;
                }


                seleccionarRouterMikrotikDante(
                    router,
                    "RECURSOS_ROUTER"
                );


                // ====================================================
                // EL AGENT PUEDE RETORNAR RESOURCE EN DISTINTAS CAPAS
                // ====================================================

                const recurso =
                    data.data?.resource?.[0] ||
                    data.data?.resources?.[0] ||
                    data.data?.[0] ||
                    data.data?.resource ||
                    data.data ||
                    {};


                const version =
                    recurso.version ||
                    recurso.routerosVersion;


                const board =
                    recurso.boardName ||
                    recurso["board-name"] ||
                    recurso.board;


                const cpu =
                    recurso.cpu ||
                    recurso["cpu"];


                const cargaCpu =
                    recurso.cpuLoad ??
                    recurso["cpu-load"];


                const uptime =
                    recurso.uptime;


                const memoriaLibre =
                    recurso.freeMemory ??
                    recurso["free-memory"];


                const memoriaTotal =
                    recurso.totalMemory ??
                    recurso["total-memory"];


                let respuesta =
                    `Recursos de ${router.nombre}.`;


                if (
                    version
                ) {

                    respuesta +=
                        ` Versión ${version}.`;
                }


                if (
                    board
                ) {

                    respuesta +=
                        ` Board ${board}.`;
                }


                if (
                    cpu
                ) {

                    respuesta +=
                        ` CPU ${cpu}.`;
                }


                if (
                    cargaCpu !== undefined &&
                    cargaCpu !== null
                ) {

                    respuesta +=
                        ` Carga de CPU ${cargaCpu} por ciento.`;
                }


                if (
                    uptime
                ) {

                    respuesta +=
                        ` Uptime ${uptime}.`;
                }


                if (
                    memoriaLibre
                ) {

                    respuesta +=
                        ` Memoria libre ${memoriaLibre}.`;
                }


                if (
                    memoriaTotal
                ) {

                    respuesta +=
                        ` Memoria total ${memoriaTotal}.`;
                }


                responderDante(
                    respuesta
                );

            } catch (error) {

                console.error(
                    "DANTE: error consultando recursos MikroTik:",
                    error
                );


                responderDante(
                    `No pude consultar los recursos de ${router.nombre}.`
                );
            }
        }


        // ========================================================
        // DANTE - INTERPRETAR COMANDOS MIKROTIK
        // ========================================================

        async function procesarConsultaMikrotikDante(
            textoOriginal: string
        ): Promise<boolean> {
            informarProcesamientoDante(
                "CONSULTANDO"
            );
            let texto =
                normalizarTextoDante(
                    textoOriginal
                );


            texto =
                texto
                    .replace(
                        /\bdante\b/g,
                        " "
                    )
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();


            // ====================================================
            // LISTAR
            // ====================================================

            const esListar =

                texto === "lista los routers" ||

                texto === "listar routers" ||

                texto === "lista los mikrotik" ||

                texto === "listar mikrotik" ||

                texto === "dime los routers" ||

                texto === "dime que routers tenemos" ||

                texto === "que routers tenemos" ||
                texto === "que router tenemos" ||
                texto === "que mikrotik tenemos" ||
                texto === "que micro tenemos" ||
                texto === "que microti tenemos" ||
                texto === "que microtik tenemos" ||
                texto === "cuales son los routers" ||

                texto === "cuales son los mikrotik" ||

                texto === "routers registrados" ||

                texto === "mikrotik registrados" ||
                texto === "microtis registrados" ||
                texto === "microti registrados" ||
                texto === "microtik tenemos registrados" ||
                texto === "micro registrados" ||
                texto === "dime microtis registrados" ||
                texto === "dime microti registrados" ||
                texto === "dime microtik tenemos registrados" ||
                texto === "dime micro registrados" ||

                texto.includes(
                    "dime cuantos routers"
                ) ||

                texto.includes(
                    "cuantos routers tenemos"
                );


            if (
                esListar
            ) {

                cambiarTemaDante(
                    "MIKROTIK",
                    {
                        conservarCliente:
                            false,

                        ultimaIntencion:
                            "LISTAR_ROUTERS",
                    }
                );


                await listarRoutersDante();

                return true;
            }


            // ====================================================
            // DETERMINAR SI LA FRASE ES MIKROTIK
            // ====================================================

            const esIpPublica =
                texto.includes(
                    "ip publica"
                ) ||
                texto.includes(
                    "direccion publica"
                );


            const esRedes =
                texto.includes(
                    "redes internas"
                ) ||
                texto.includes(
                    "red interna"
                ) ||
                texto.includes(
                    "sus redes"
                ) ||
                texto ===
                "redes";


            const esRecursos =
                texto.includes(
                    "recursos"
                ) ||
                texto.includes(
                    "recurso"
                ) ||
                texto.includes(
                    "cpu"
                ) ||
                texto.includes(
                    "procesador"
                ) ||
                texto.includes(
                    "uptime"
                ) ||
                texto.includes(
                    "tiempo encendido"
                ) ||
                texto.includes(
                    "version"
                ) ||
                texto.includes(
                    "board"
                ) ||
                texto.includes(
                    "memoria del router"
                );


            const esTest =
                texto.includes(
                    "haz un test"
                ) ||
                texto.includes(
                    "hacer un test"
                ) ||
                texto.includes(
                    "prueba el router"
                ) ||
                texto.includes(
                    "probar el router"
                ) ||
                texto.includes(
                    "prueba la conexion"
                ) ||
                texto.includes(
                    "probar conexion"
                ) ||
                texto.includes(
                    "test de conexion"
                );


            const esEstado =
                texto.includes(
                    "estado del router"
                ) ||
                texto.includes(
                    "estado de"
                ) ||
                texto.includes(
                    "revisa el router"
                ) ||
                texto.includes(
                    "revisa el mikrotik"
                ) ||
                texto.includes(
                    "revisa "
                ) ||
                texto.includes(
                    "revisan "
                ) ||
                texto.includes(
                    "revisar "
                ) ||
                texto.includes(
                    "esta conectado"
                ) ||
                texto.includes(
                    "esta activo"
                ) ||
                texto.includes(
                    "esta funcionando"
                ) ||
                texto.includes(
                    "esta en linea"
                );


            if (
                !esIpPublica &&
                !esRedes &&
                !esRecursos &&
                !esTest &&
                !esEstado
            ) {

                return false;
            }


            // ====================================================
            // OBTENER ROUTERS
            // ====================================================

            const routers =
                await obtenerRoutersMikrotikDante();


            if (
                routers.length === 0
            ) {

                responderDante(
                    "No pude obtener la lista de routers MikroTik."
                );

                return true;
            }


            // ====================================================
            // BUSCAR ROUTER MENCIONADO
            // ====================================================

            let router =
                buscarRouterMencionadoDante(
                    texto,
                    routers
                );


            // ====================================================
            // SI NO LO MENCIONÓ, USAMOS EL ROUTER DEL CONTEXTO
            // ====================================================
            // ====================================================
            // SOLO USAR EL ROUTER ANTERIOR EN FRASES DE CONTINUACIÓN
            // ====================================================

            const esReferenciaRouterActual =

                texto === "sus redes" ||
                texto === "redes" ||

                texto === "sus recursos" ||
                texto === "recursos" ||

                texto === "su ip publica" ||
                texto === "ip publica" ||

                texto === "su estado" ||
                texto === "estado" ||

                texto === "haz un test" ||
                texto === "prueba la conexion" ||

                texto === "esta conectado" ||
                texto === "esta activo";


            if (
                !router &&
                esReferenciaRouterActual &&
                contextoDanteRef.current.tema ===
                "MIKROTIK" &&
                routerMikrotikDanteRef.current
            ) {

                router =
                    routerMikrotikDanteRef.current;


                console.log(
                    "DANTE: reutilizando router del contexto:",
                    router.nombre
                );
            }


            // ====================================================
            // SI SOLO EXISTE UNO, PODEMOS USARLO
            // ====================================================

            if (
                !router &&
                routers.length === 1
            ) {

                router =
                    routers[0];
            }


            // ====================================================
            // NO SABEMOS QUÉ ROUTER QUIERE
            // ====================================================

            if (
                !router
            ) {

                responderDante(
                    "¿De cuál router MikroTik deseas que haga la consulta?"
                );

                actualizarContextoDante({

                    tema:
                        "MIKROTIK",

                    ultimaIntencion:
                        esIpPublica
                            ? "IP_PUBLICA_ROUTER"
                            : esRedes
                                ? "REDES_ROUTER"
                                : esRecursos
                                    ? "RECURSOS_ROUTER"
                                    : esTest
                                        ? "TEST_ROUTER"
                                        : "ESTADO_ROUTER",

                    esperandoRespuesta:
                        true,

                    datoPendiente:
                        "ROUTER_MIKROTIK",

                });


                return true;
            }


            // ====================================================
            // GUARDAMOS ROUTER ACTUAL
            // ====================================================

            routerMikrotikDanteRef.current =
                router;


            // ====================================================
            // EJECUTAR OPERACIÓN
            // ====================================================

            if (
                esIpPublica
            ) {

                await consultarIpPublicaRouterDante(
                    router
                );

                return true;
            }


            if (
                esRedes
            ) {

                await consultarRedesRouterDante(
                    router
                );

                return true;
            }


            if (
                esRecursos
            ) {

                await consultarRecursosRouterDante(
                    router
                );

                return true;
            }


            if (
                esTest
            ) {

                await probarRouterDante(
                    router
                );

                return true;
            }


            if (
                esEstado
            ) {

                await consultarEstadoRouterDante(
                    router
                );

                return true;
            }


            return false;
        }

        // ========================================================
        // DANTE - CONSULTAS MIKROTIK
        // ========================================================

        const comandoMikrotikProcesado =
            await procesarConsultaMikrotikDante(
                limpio
            );

        if (
            comandoMikrotikProcesado
        ) {
            return;
        }

        // ========================================================
        // INFORMACIÓN / RESPUESTAS MATEMATICAS
        // ========================================================

        const respuestaMatematica = obtenerRespuestaMatematicaDante(texto);

        if (respuestaMatematica) {
            responderDante(respuestaMatematica);
            return;
        }


        // ============================================
        // PORCENTAJES / IVA
        // ============================================
        const respuestaPorcentajeIva =
            obtenerRespuestaPorcentajeIvaDante(texto);

        if (respuestaPorcentajeIva) {
            responderDante(respuestaPorcentajeIva);
            return;
        }


        // ========================================================
        // INFORMACIÓN / RESPUESTAS COMUNES
        // ========================================================
        const respuestaCotidiana = obtenerRespuestaCotidianaDante(texto);

        if (respuestaCotidiana) {
            responderDante(respuestaCotidiana);
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

            return personalizarSaludoDante("Sí, aquí estoy. ¿Qué vamos a hacer?");
        }


        // ====================================================
        // DANTE, ¿ME ESCUCHAS?
        // ====================================================

        if (
            texto.includes("dante me escuchas") ||
            texto.includes("dante escuchas")
        ) {

            return personalizarSaludoDante("Sí, te escucho. Dime.");
        }


        // ====================================================
        // HOLA DANTE
        // ====================================================

        if (
            texto.includes("hola dante") ||
            texto.includes("buenas dante") ||
            texto.includes("buen dia dante")
        ) {

            return personalizarSaludoDante("Hola, aquí estoy. ¿Qué vamos a hacer?");
        }


        // ====================================================
        // NECESITO TU AYUDA
        // ====================================================

        if (
            texto.includes("dante necesito tu ayuda") ||
            texto.includes("dante ayudame") ||
            texto.includes("dante necesito ayuda")
        ) {

            return personalizarSaludoDante("Claro, dime qué necesitas.");
        }


        // ====================================================
        // VAMOS A TRABAJAR
        // ====================================================

        if (
            texto.includes("dante vamos a trabajar") ||
            texto.includes("dante trabajemos") ||
            texto.includes("dante vamos a comenzar")
        ) {

            return personalizarSaludoDante("Listo, dime por dónde empezamos.");
        }


        // ====================================================
        // SOLO DANTE
        // ====================================================

        if (
            texto === "dante"
        ) {

            return personalizarSaludoDante("Sí, dime. Aquí estoy, te escucho.");
        }


        // ====================================================
        // RESPUESTA GENERAL
        // ====================================================

        return personalizarSaludoDante("Sí, aquí estoy. Te escucho.");
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

        if (
            danteHablandoRef.current ||
            pausaReconocimientoPorVozDanteRef.current ||
            (
                typeof window !== "undefined" &&
                "speechSynthesis" in window &&
                window.speechSynthesis.speaking
            )
        ) {

            console.log(
                "DANTE: audio ignorado porque Dante está hablando"
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
                normalizado === "estado del servicio" ||
                normalizado === "que sabes de el" ||

                normalizado === "que sabes de ella" ||
                normalizado === "que recuerdas de el" ||
                normalizado === "que recuerdas de ella" ||
                normalizado === "hay antecedentes" ||
                normalizado === "tiene antecedentes" ||
                normalizado === "tiene algun pendiente" ||
                normalizado === "tiene algo pendiente" ||
                normalizado === "que tiene pendiente" ||
                normalizado === "tiene compromiso de pago" ||
                normalizado === "hay compromiso de pago" ||
                normalizado === "cuando va a pagar" ||
                normalizado === "cuando quedo de pagar" ||

                normalizado === "que sabes de ese cliente" ||
                normalizado === "que sabes de este cliente" ||

                normalizado === "que recuerdas de ese cliente" ||
                normalizado === "que recuerdas de este cliente" ||

                normalizado === "que debe" ||
                normalizado === "tiene deudas" ||

                normalizado === "que pendientes tiene" ||
                normalizado === "cuales son sus pendientes" ||

                normalizado === "tiene algun compromiso" ||
                normalizado === "tiene compromisos pendientes" ||
                normalizado === "tiene algun compromiso de pago" ||

                normalizado === "cuantos tickets abiertos tiene" ||
                normalizado === "tiene tickets" ||
                normalizado === "tiene soporte pendiente" ||

                normalizado === "tiene pago pendiente" ||
                normalizado === "tiene pagos pendientes" ||
                normalizado === "tiene algun pago pendiente" ||

                normalizado === "tiene pago vencido" ||
                normalizado === "tiene pagos vencidos" ||
                normalizado === "tiene algun pago vencido" ||

                normalizado === "esta en corte" ||
                normalizado === "esta cortado" ||
                normalizado === "tiene corte" ||
                normalizado === "esta suspendido" ||
                normalizado === "el servicio esta cortado" ||
                normalizado === "el servicio esta suspendido" ||
                normalizado === "dime si esta en corte" ||
                normalizado === "dime si esta cortado" ||
                normalizado === "dime si esta suspendido"
            );

        // ====================================================
        // PUEDE HABLAR SIN DECIR DANTE SI:
        // 1. DANTE ESTÁ ESPERANDO UNA RESPUESTA
        // 2. ES UNA CONTINUACIÓN SEGURA DEL CLIENTE ACTUAL
        // ====================================================

        const puedeContinuarSinDante =

            contexto.esperandoRespuesta === true ||

            esperandoConfirmacionAlertasPagoDanteRef.current === true ||

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
            // ====================================================
            // DANTE - EVITAR AUTOESCUCHA
            // ====================================================

            if (
                danteHablandoRef.current ||
                pausaReconocimientoPorVozDanteRef.current ||
                (
                    typeof window !== "undefined" &&
                    "speechSynthesis" in window &&
                    window.speechSynthesis.speaking
                )
            ) {

                console.log(
                    "DANTE: audio ignorado porque Dante está hablando"
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

    function pausarMicrofonoParaAnalisisDante() {
        reactivarMicrofonoTrasAnalisisDanteRef.current =
            microfonoActivoRef.current === true;

        pausaMicrofonoAnalisisDanteRef.current =
            true;

        microfonoActivoRef.current =
            false;

        setMicrofonoActivo(false);
        setEscuchando(false);
        setTextoIntermedio("");

        try {
            reconocimientoRef.current?.abort();
        } catch {
            // Ya estaba detenido.
        }

        console.log("🔇 DANTE: micrófono pausado durante análisis técnico");
    }

    function reanudarMicrofonoDespuesAnalisisDante() {
        const debeReactivar =
            reactivarMicrofonoTrasAnalisisDanteRef.current;

        reactivarMicrofonoTrasAnalisisDanteRef.current =
            false;

        pausaMicrofonoAnalisisDanteRef.current =
            false;

        if (!debeReactivar || !reconocimientoRef.current) {
            return;
        }

        microfonoActivoRef.current =
            true;

        setMicrofonoActivo(true);
        setEstadoDante("ESPERANDO_DANTE");
        estadoDanteRef.current = "ESPERANDO_DANTE";

        try {
            reconocimientoRef.current.start();
            console.log("🎤 DANTE: micrófono reactivado después del análisis técnico");
        } catch (error: any) {
            if (error?.name !== "InvalidStateError") {
                console.error(
                    "DANTE: error reactivando micrófono después del análisis:",
                    error
                );
            }
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


        const esMovilDante =
            /Android|iPhone|iPad|iPod/i.test(
                navigator.userAgent
            );

        recognition.continuous =
            !esMovilDante;

        recognition.interimResults =
            true;

        recognition.lang =
            "es-EC";
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
                    !pausaMicrofonoAnalisisDanteRef.current &&
                    !danteHablandoRef.current
                ) {

                    console.log(
                        "🔄 Reiniciando Dante..."
                    );


                    setTimeout(
                        () => {

                            try {

                                if (
                                    !microfonoActivoRef.current ||
                                    pausaReconocimientoPorVozDanteRef.current ||
                                    pausaMicrofonoAnalisisDanteRef.current ||
                                    danteHablandoRef.current
                                ) {
                                    return;
                                }

                                setEstadoDante(
                                    "ESPERANDO_DANTE"
                                );

                                estadoDanteRef.current =
                                    "ESPERANDO_DANTE";

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
                        150
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


            const ultimasNotificaciones =
                Array.isArray(
                    data.ultimas
                )
                    ? data.ultimas.map(
                        normalizarNotificacion
                    )
                    : [];


            setNotificaciones(
                ultimasNotificaciones
            );


            // ====================================================
            // DANTE - AVISAR CUALQUIER NOTIFICACIÓN NUEVA
            // INFO / ADVERTENCIA / CRITICA
            // ====================================================

            avisarNotificacionesNuevasDante(
                ultimasNotificaciones
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


        // ====================================================
        // DANTE - IDENTIFICAR USUARIO ACTUAL
        // Usa isp_usuario y, si hace falta, /perfil.
        // ====================================================

        void cargarUsuarioActualDante();


        // ====================================================
        // DANTE - RECUPERAR HISTORIAL LOCAL ANTES DE CONSULTAR
        // ====================================================

        cargarNotificacionesConocidasDante();


        // ====================================================
        // CARGA INICIAL DE NOTIFICACIONES
        // ESTA MISMA FUNCIÓN AVISA A DANTE SI HAY NUEVAS
        // ====================================================

        cargarNotificaciones();
        void revisarAlertasPagoDante();
        void cargarResumenClientesContratosDante();

        // ====================================================
        // DANTE - MICRÓFONO ACTIVO AL INICIAR
        // ====================================================
        // Intentamos iniciar automáticamente el reconocimiento.
        // Si el navegador todavía no tiene permiso, mostrará su
        // solicitud normal de acceso al micrófono.
        const timeoutInicioMicrofonoDante =
            setTimeout(() => {
                if (!microfonoActivoRef.current) {
                    void iniciarMicrofono();
                }
            }, 700);


        const intervalo =
            setInterval(
                () => {

                    cargarNotificaciones();
                    void revisarAlertasPagoDante();
                    void cargarResumenClientesContratosDante();

                },
                60000
            );


        return () => {

            clearInterval(
                intervalo
            );

            clearTimeout(
                timeoutInicioMicrofonoDante
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
                                    {/* =====================================================
                                     DANTE - ENTRADA DE TEXTO
                                    ===================================================== */}

                                    {mostrarEntradaTextoDante && (

                                        <div
                                            className="
            mt-3
            rounded-xl
            border
            border-cyan-500/30
            bg-slate-950/40
            p-3
        "
                                        >

                                            <p
                                                className="
                mb-2
                text-[10px]
                font-bold
                uppercase
                tracking-wide
                text-cyan-400
            "
                                            >
                                                Consultar a Dante
                                            </p>


                                            <div
                                                className="
                flex
                items-center
                gap-2
            "
                                            >

                                                <input

                                                    type={
                                                        flujoDiagnosticoInternetDanteRef.current?.etapa === "ESPERAR_CLAVE_CPE"
                                                            ? "password"
                                                            : "text"
                                                    }

                                                    value={
                                                        entradaTextoDante
                                                    }

                                                    onChange={
                                                        (e) =>
                                                            setEntradaTextoDante(
                                                                e.target.value
                                                            )
                                                    }

                                                    onKeyDown={
                                                        (e) => {

                                                            if (
                                                                e.key ===
                                                                "Enter"
                                                            ) {

                                                                e.preventDefault();

                                                                void enviarTextoDante();
                                                            }
                                                        }
                                                    }

                                                    placeholder="Escribe una consulta..."

                                                    autoFocus

                                                    className="
                    flex-1
                    rounded-lg
                    border
                    border-slate-700
                    bg-slate-900
                    px-3
                    py-2
                    text-sm
                    text-white
                    outline-none
                    placeholder:text-slate-500
                    focus:border-cyan-500
                "
                                                />


                                                <button

                                                    type="button"

                                                    onClick={
                                                        () =>
                                                            void enviarTextoDante()
                                                    }

                                                    className="
                    rounded-lg
                    bg-cyan-600
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-cyan-500
                "
                                                >
                                                    Enviar
                                                </button>

                                            </div>

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