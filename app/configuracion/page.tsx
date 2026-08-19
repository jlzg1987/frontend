'use client';

import type { CSSProperties } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CreditCard,
    Percent,
    ReceiptText,
    Settings2,
    Tags,
    type LucideIcon,
} from 'lucide-react';

type ConfiguracionFacturacionProps = {
    onVolver: () => void;
    onAbrirDatoempresa: () => void;
    onAbrirImpuestos: () => void;
    onAbrirDescuentos: () => void;
    onAbrirFormaspago: () => void;
};

type CardConfiguracion = {
    titulo: string;
    descripcion: string;
    icono: LucideIcon;
    onClick: () => void;
    color: string;
    colorClaro: string;
    borde: string;
};

export default function ConfiguracionFacturacionPage({
    onVolver,
    onAbrirDatoempresa,
    onAbrirImpuestos,
    onAbrirDescuentos,
    onAbrirFormaspago,
}: ConfiguracionFacturacionProps) {
    const cards: CardConfiguracion[] = [
        {
            titulo: 'Datos de empresa',
            descripcion:
                'Configurar razón social, RUC, dirección, teléfono, correo y logo.',
            icono: Building2,
            onClick: onAbrirDatoempresa,
            color: '#06b6d4',
            colorClaro: '#3b82f6',
            borde: 'rgba(34, 211, 238, 0.28)',
        },
        {
            titulo: 'Impuestos',
            descripcion:
                'Crear, editar y activar IVA, ICE u otros impuestos del sistema.',
            icono: ReceiptText,
            onClick: onAbrirImpuestos,
            color: '#10b981',
            colorClaro: '#22c55e',
            borde: 'rgba(52, 211, 153, 0.28)',
        },
        {
            titulo: 'Descuentos',
            descripcion:
                'Administrar descuentos por valor fijo o porcentaje.',
            icono: Tags,
            onClick: onAbrirDescuentos,
            color: '#f59e0b',
            colorClaro: '#f97316',
            borde: 'rgba(251, 191, 36, 0.28)',
        },
        {
            titulo: 'Formas de pago',
            descripcion:
                'Administrar efectivo, transferencia, PayPhone, crédito y más.',
            icono: CreditCard,
            onClick: onAbrirFormaspago,
            color: '#6366f1',
            colorClaro: '#3b82f6',
            borde: 'rgba(129, 140, 248, 0.28)',
        },
    ];

    return (
        <div
            className="min-h-screen p-4 text-white sm:p-6 lg:p-8"
            style={{
                background:
                    'radial-gradient(circle at top left, rgba(6,182,212,0.12), transparent 32%), radial-gradient(circle at bottom right, rgba(99,102,241,0.10), transparent 35%), #020617',
            }}
        >
            <div className="mx-auto max-w-7xl">
                {/* Encabezado */}
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div
                            className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:flex"
                            style={{
                                background:
                                    'linear-gradient(135deg, #06b6d4, #2563eb)',
                                boxShadow:
                                    '0 12px 30px rgba(6, 182, 212, 0.22)',
                            }}
                        >
                            <Settings2 className="h-7 w-7 text-white" />
                        </div>


                    </div>


                </div>

                {/* Tarjetas */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                        const Icono = card.icono;

                        const cardStyle: CSSProperties = {
                            borderColor: card.borde,
                            background: `
                                radial-gradient(
                                    circle at top right,
                                    ${card.color}24,
                                    transparent 42%
                                ),
                                linear-gradient(
                                    145deg,
                                    rgba(15,23,42,0.98),
                                    rgba(8,15,30,0.96)
                                )
                            `,
                            boxShadow: `0 18px 45px ${card.color}12`,
                        };

                        return (
                            <button
                                type="button"
                                key={card.titulo}
                                onClick={card.onClick}
                                className="group flex min-h-[285px] cursor-pointer flex-col rounded-3xl border p-6 text-left transition duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                                style={cardStyle}
                            >
                                <div
                                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110"
                                    style={{
                                        background: `linear-gradient(135deg, ${card.color}, ${card.colorClaro})`,
                                        boxShadow: `0 12px 28px ${card.color}45`,
                                    }}
                                >
                                    <Icono
                                        className="h-7 w-7 text-white"
                                        strokeWidth={2.2}
                                    />
                                </div>

                                <h2 className="mb-2 text-xl font-black text-white">
                                    {card.titulo}
                                </h2>

                                <p className="mb-6 flex-1 text-sm leading-6 text-slate-400">
                                    {card.descripcion}
                                </p>

                                <div
                                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-bold text-white transition group-hover:brightness-110"
                                    style={{
                                        background: `linear-gradient(90deg, ${card.color}, ${card.colorClaro})`,
                                        boxShadow: `0 10px 24px ${card.color}25`,
                                    }}
                                >
                                    <span>Configurar</span>

                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Información adicional */}
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
                    <Percent className="h-5 w-5 shrink-0 text-cyan-400" />
                    Los cambios realizados aquí se aplicarán a las próximas
                    facturas generadas.
                </div>
            </div>
        </div>
    );
}