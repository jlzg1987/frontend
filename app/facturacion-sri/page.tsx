'use client';

import {
    ArrowLeft,
    ArrowRight,
    BadgeMinus,
    Ban,
    FileCheck2,
    FileLock2,
    FileText,
    FileX2,
    Landmark,
    MailCheck,
    Mails,
    ReceiptText,
    Settings2,
    ShieldCheck,
    type LucideIcon,
} from 'lucide-react';

type DashboardSriProps = {
    onVolver: () => void;
    onAbrirFacturasSRI: () => void;
    onAbrirConfiguraciónSRI: () => void;
    onAbrirCertificadodigital: () => void;
    onAbrirFacturasinternas: () => void;
    onAbrirConfiguraciónEmailSRI: () => void;
    onAbrirHistorialemailsSRI: () => void;
    onAbrirAnulacionesSRI: () => void;
    onAbrirAnulacionesInterna: () => void;
    onAbrirNotasCreditoSRI: () => void;
    onAbrirAnulaciónNotasCrédito: () => void;
};

type CardSri = {
    title: string;
    desc: string;
    icon: LucideIcon;
    onClick: () => void;
    color: string;
    colorFinal: string;
    borderColor: string;
};

export default function DashboardSriPage({
    onVolver,
    onAbrirFacturasSRI,
    onAbrirConfiguraciónSRI,
    onAbrirCertificadodigital,
    onAbrirFacturasinternas,
    onAbrirConfiguraciónEmailSRI,
    onAbrirHistorialemailsSRI,
    onAbrirAnulacionesSRI,
    onAbrirAnulacionesInterna,
    onAbrirNotasCreditoSRI,
    onAbrirAnulaciónNotasCrédito,
}: DashboardSriProps) {
    const cards: CardSri[] = [
        {
            title: 'Facturas SRI',
            desc: 'Procesar XML, firmar, enviar al SRI, consultar autorización y ver RIDE.',
            icon: ReceiptText,
            onClick: onAbrirFacturasSRI,
            color: '#06b6d4',
            colorFinal: '#2563eb',
            borderColor: 'rgba(34,211,238,0.28)',
        },
        {
            title: 'Configuración SRI',
            desc: 'Ambiente, establecimiento, punto de emisión, secuencial y datos tributarios.',
            icon: Settings2,
            onClick: onAbrirConfiguraciónSRI,
            color: '#a855f7',
            colorFinal: '#7c3aed',
            borderColor: 'rgba(192,132,252,0.28)',
        },
        {
            title: 'Certificado digital',
            desc: 'Subir certificado .p12 y clave para firmar electrónicamente los XML.',
            icon: FileLock2,
            onClick: onAbrirCertificadodigital,
            color: '#f59e0b',
            colorFinal: '#eab308',
            borderColor: 'rgba(251,191,36,0.28)',
        },
        {
            title: 'Facturas internas',
            desc: 'Buscar, filtrar, consultar, reimprimir y anular facturas internas.',
            icon: FileText,
            onClick: onAbrirFacturasinternas,
            color: '#10b981',
            colorFinal: '#16a34a',
            borderColor: 'rgba(52,211,153,0.28)',
        },
        {
            title: 'Configuración Email SRI',
            desc: 'Programar envíos automáticos, adjuntar PDF/XML y realizar envíos masivos.',
            icon: MailCheck,
            onClick: onAbrirConfiguraciónEmailSRI,
            color: '#14b8a6',
            colorFinal: '#2563eb',
            borderColor: 'rgba(45,212,191,0.28)',
        },
        {
            title: 'Historial emails SRI',
            desc: 'Ver correos enviados, errores, reenvíos y ejecuciones automáticas.',
            icon: Mails,
            onClick: onAbrirHistorialemailsSRI,
            color: '#22d3ee',
            colorFinal: '#0284c7',
            borderColor: 'rgba(34,211,238,0.28)',
        },
        {
            title: 'Anulaciones internas',
            desc: 'Gestionar solicitudes de anulación, confirmaciones y rechazos internos.',
            icon: FileX2,
            onClick: onAbrirAnulacionesInterna,
            color: '#ef4444',
            colorFinal: '#f97316',
            borderColor: 'rgba(248,113,113,0.28)',
        },
        {
            title: 'Anulaciones SRI',
            desc: 'Solicitudes, paquetes, confirmaciones y estados de anulación electrónica.',
            icon: Ban,
            onClick: onAbrirAnulacionesSRI,
            color: '#f97316',
            colorFinal: '#ea580c',
            borderColor: 'rgba(251,146,60,0.28)',
        },
        {
            title: 'Notas de crédito SRI',
            desc: 'Gestionar devoluciones parciales, reversos, correcciones y estados SRI.',
            icon: BadgeMinus,
            onClick: onAbrirNotasCreditoSRI,
            color: '#f43f5e',
            colorFinal: '#db2777',
            borderColor: 'rgba(251,113,133,0.28)',
        },
        {
            title: 'Anulación de notas de crédito',
            desc: 'Consultar historial, seguimiento y estados de anulaciones ante el SRI.',
            icon: FileCheck2,
            onClick: onAbrirAnulaciónNotasCrédito,
            color: '#e11d48',
            colorFinal: '#be185d',
            borderColor: 'rgba(244,63,94,0.28)',
        },
    ];

    return (
        <main
            className="min-h-screen p-4 text-white sm:p-6 lg:p-8"
            style={{
                background:
                    'radial-gradient(circle at top left, rgba(6,182,212,0.13), transparent 30%), radial-gradient(circle at bottom right, rgba(124,58,237,0.11), transparent 35%), #020617',
            }}
        >
            <div className="mx-auto max-w-[1600px]">
                {/* Encabezado */}
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                                background:
                                    'linear-gradient(135deg, #06b6d4, #2563eb)',
                                boxShadow:
                                    '0 12px 30px rgba(6,182,212,0.26)',
                            }}
                        >
                            <Landmark
                                className="h-7 w-7 text-white"
                                strokeWidth={2.2}
                            />
                        </div>

                        <div>
                            <h1
                                className="text-2xl font-black sm:text-3xl lg:text-4xl"
                                style={{
                                    background:
                                        'linear-gradient(90deg, #ffffff, #a5f3fc, #93c5fd)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Facturación electrónica SRI
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                                Administra comprobantes electrónicos,
                                certificados, correos, anulaciones y notas de
                                crédito.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onVolver}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-200 transition hover:border-cyan-400/30 hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Volver
                    </button>
                </div>

                {/* Tarjetas */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                type="button"
                                key={card.title}
                                onClick={card.onClick}
                                className="group flex min-h-[270px] min-w-0 flex-col rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                                style={{
                                    borderColor: card.borderColor,
                                    background: `
                                        radial-gradient(
                                            circle at top right,
                                            ${card.color}24,
                                            transparent 45%
                                        ),
                                        linear-gradient(
                                            145deg,
                                            rgba(15,23,42,0.98),
                                            rgba(8,15,30,0.96)
                                        )
                                    `,
                                    boxShadow: `0 16px 38px ${card.color}12`,
                                }}
                            >
                                <div
                                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${card.color}, ${card.colorFinal})`,
                                        boxShadow: `0 10px 25px ${card.color}38`,
                                    }}
                                >
                                    <Icon
                                        className="h-6 w-6 text-white"
                                        strokeWidth={2.2}
                                    />
                                </div>

                                <h2 className="text-lg font-black leading-tight text-white">
                                    {card.title}
                                </h2>

                                <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                                    {card.desc}
                                </p>

                                <div
                                    className="mt-5 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-white transition group-hover:brightness-110"
                                    style={{
                                        background: `linear-gradient(90deg, ${card.color}, ${card.colorFinal})`,
                                        boxShadow: `0 8px 20px ${card.color}20`,
                                    }}
                                >
                                    <span>Abrir módulo</span>

                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        );
                    })}
                </section>

                {/* Información inferior */}
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-400" />

                    Los comprobantes electrónicos deben contar con una
                    configuración y un certificado digital vigentes.
                </div>
            </div>
        </main>
    );
}