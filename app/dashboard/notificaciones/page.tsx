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
// COMPONENTE
// ============================================================

export default function BotNotificaciones({
    onAbrirFacturaManual,
    onAbrirAlertas,
    onAbrirPagos,
}: {
    onAbrirFacturaManual: () => void;
    onAbrirAlertas: () => void;
    onAbrirPagos: () => void;
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

    const [nivelMicrofono, setNivelMicrofono] = useState(0);

    const audioContextRef =
        useRef<AudioContext | null>(null);

    const analyserRef =
        useRef<AnalyserNode | null>(null);

    const animationFrameRef =
        useRef<number | null>(null);

    const streamAudioRef =
        useRef<MediaStream | null>(null);

    // Dante no debe interpretar su propia voz
    const danteHablandoRef =
        useRef(false);


    const [
        mostrarDetallesDante,
        setMostrarDetallesDante,
    ] = useState(false);

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


    // ========================================================
    // HABLAR
    // ========================================================

    // ========================================================
    // HABLAR
    // ========================================================

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

            // Bloquear ANTES de mandar la voz.
            // No esperamos a onstart.
            danteHablandoRef.current =
                true;


            window.speechSynthesis.cancel();


            const mensaje =
                new SpeechSynthesisUtterance(
                    texto
                );


            mensaje.lang =
                "es-EC";

            mensaje.rate =
                0.92;

            mensaje.pitch =
                0.72;

            mensaje.volume =
                1;


            mensaje.onstart =
                () => {

                    console.log(
                        "🔊 DANTE ESTÁ HABLANDO"
                    );

                    danteHablandoRef.current =
                        true;
                };


            mensaje.onend =
                () => {

                    console.log(
                        "🔊 DANTE TERMINÓ DE HABLAR"
                    );


                    // Dejamos un pequeño margen para que
                    // SpeechRecognition no capture el final
                    // de la propia voz de Dante.

                    setTimeout(
                        () => {

                            danteHablandoRef.current =
                                false;


                            console.log(
                                "🎤 DANTE VUELVE A ESCUCHAR"
                            );

                        },
                        700
                    );
                };


            mensaje.onerror =
                () => {

                    danteHablandoRef.current =
                        false;
                };


            window.speechSynthesis.speak(
                mensaje
            );


        } catch (error) {

            danteHablandoRef.current =
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

    function procesarComandoDante(
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
        // IR A PAGOS / MENSUALIDADES
        // ========================================================

        if (
            texto === "pagos" ||
            texto === "mensualidades" ||
            texto.includes("llevame a pagos") ||
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
        // COMANDO NO IMPLEMENTADO TODAVÍA
        // ========================================================

        console.log(
            "DANTE: comando todavía no implementado:",
            limpio
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

        const normalizado =
            normalizarTextoDante(texto);

        console.log(
            "DANTE ESCUCHÓ:",
            texto
        );


        // ====================================================
        // TODA INTERACCIÓN DEBE CONTENER "DANTE"
        // ====================================================

        const posicion =
            normalizado.indexOf("dante");

        if (posicion === -1) {
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
            normalizado === "presentate" ||
            normalizado === "presentarte" ||
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
                            rms * 2500
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


                // Si nosotros todavía queremos
                // mantener el micrófono abierto,
                // arrancarlo otra vez.

                if (
                    microfonoActivoRef.current
                ) {

                    console.log(
                        "🔄 Reiniciando Dante..."
                    );


                    setTimeout(
                        () => {

                            try {
                                microfonoActivoRef.current =
                                    true;

                                setEstadoDante(
                                    "ESPERANDO_DANTE"
                                );

                                estadoDanteRef.current =
                                    "ESPERANDO_DANTE";

                                setRespuestaDante(
                                    'Micrófono activo. Esperando "Dante"...'
                                );

                                recognition.start();

                            } catch (error) {

                                console.error(
                                    "Error reiniciando reconocimiento:",
                                    error
                                );
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