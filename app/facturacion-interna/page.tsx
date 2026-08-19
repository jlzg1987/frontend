'use client';

import {
    ArrowLeft,
    ArrowRight,
    FilePenLine,
    Files,
    Landmark,
    ReceiptText,
    Settings2,
    type LucideIcon,
} from 'lucide-react';

type DashboardFacturacionInternaProps = {
    onVolver: () => void;
    onAbrirFacturamanual: () => void;
    onAbrirFacturasinternas: () => void;
    onAbrirConfiguraciónSRI: () => void;
};

type CardFacturacion = {
    title: string;
    desc: string;
    icon: LucideIcon;
    onClick: () => void;
    color: string;
    colorFinal: string;
    borderColor: string;
};

export default function DashboardFacturacionInternaPage({
    onVolver,
    onAbrirFacturamanual,
    onAbrirFacturasinternas,
    onAbrirConfiguraciónSRI,
}: DashboardFacturacionInternaProps) {
    const cards: CardFacturacion[] = [
        {
            title: 'Factura manual',
            desc: 'Crear una factura interna desde cero, agregar productos, servicios, impuestos y descuentos.',
            icon: FilePenLine,
            onClick: onAbrirFacturamanual,
            color: '#06b6d4',
            colorFinal: '#2563eb',
            borderColor: 'rgba(34, 211, 238, 0.28)',
        },
        {
            title: 'Facturas internas',
            desc: 'Buscar, filtrar, consultar, reimprimir y anular las facturas registradas.',
            icon: Files,
            onClick: onAbrirFacturasinternas,
            color: '#10b981',
            colorFinal: '#16a34a',
            borderColor: 'rgba(52, 211, 153, 0.28)',
        },
        {
            title: 'Configuración SRI',
            desc: 'Configurar ambiente, establecimiento, punto de emisión, secuencial y datos tributarios.',
            icon: Landmark,
            onClick: onAbrirConfiguraciónSRI,
            color: '#a855f7',
            colorFinal: '#7c3aed',
            borderColor: 'rgba(192, 132, 252, 0.28)',
        },
    ];

    return (
        <main
            className="min-h-screen p-4 text-white sm:p-6 lg:p-8"
            style={{
                background:
                    'radial-gradient(circle at top left, rgba(6,182,212,0.13), transparent 30%), radial-gradient(circle at bottom right, rgba(124,58,237,0.12), transparent 35%), #020617',
            }}
        >
            <div className="mx-auto max-w-7xl">
                {/* Encabezado */}
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                                background:
                                    'linear-gradient(135deg, #06b6d4, #2563eb)',
                                boxShadow:
                                    '0 12px 30px rgba(6,182,212,0.25)',
                            }}
                        >
                            <ReceiptText
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
                                Facturación interna
                            </h1>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                                Crea, administra y configura las facturas
                                internas de Netcomp RF.
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
                <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                type="button"
                                key={card.title}
                                onClick={card.onClick}
                                className="group flex min-h-[290px] flex-col rounded-3xl border p-6 text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                                style={{
                                    borderColor: card.borderColor,
                                    background: `
                                        radial-gradient(
                                            circle at top right,
                                            ${card.color}25,
                                            transparent 45%
                                        ),
                                        linear-gradient(
                                            145deg,
                                            rgba(15,23,42,0.98),
                                            rgba(8,15,30,0.96)
                                        )
                                    `,
                                    boxShadow: `0 18px 45px ${card.color}12`,
                                }}
                            >
                                <div
                                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${card.color}, ${card.colorFinal})`,
                                        boxShadow: `0 12px 28px ${card.color}40`,
                                    }}
                                >
                                    <Icon
                                        className="h-7 w-7 text-white"
                                        strokeWidth={2.2}
                                    />
                                </div>

                                <h2 className="text-2xl font-black text-white">
                                    {card.title}
                                </h2>

                                <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                                    {card.desc}
                                </p>

                                <div
                                    className="mt-6 flex w-full items-center justify-between rounded-xl px-4 py-3 font-bold text-white transition group-hover:brightness-110"
                                    style={{
                                        background: `linear-gradient(90deg, ${card.color}, ${card.colorFinal})`,
                                        boxShadow: `0 10px 24px ${card.color}25`,
                                    }}
                                >
                                    <span>Entrar</span>

                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        );
                    })}
                </section>

                {/* Información */}
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
                    <Settings2 className="h-5 w-5 shrink-0 text-cyan-400" />

                    Selecciona una opción para administrar el módulo de
                    facturación.
                </div>
            </div>
        </main>
    );
}