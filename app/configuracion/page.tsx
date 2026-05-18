'use client';

import { useRouter } from 'next/navigation';

export default function ConfiguracionFacturacionPage({
    onVolver,
    onAbrirDatoempresa,
    onAbrirImpuestos,
    onAbrirDescuentos,
    onAbrirFormaspago,
}: {
    onVolver: () => void;
    onAbrirDatoempresa: () => void;
    onAbrirImpuestos: () => void;
    onAbrirDescuentos: () => void;
    onAbrirFormaspago: () => void;
}) {
    const router = useRouter();

    const cards = [
        {
            titulo: 'Datos de empresa',
            descripcion: 'Configurar razón social, RUC, dirección, teléfono, correo y logo.',
            icono: '🏢',
            ruta: '/facturacion/empresa',
            color: 'from-cyan-500 to-blue-600',
        },
        {
            titulo: 'Impuestos',
            descripcion: 'Crear, editar y activar IVA, ICE u otros impuestos del sistema.',
            icono: '🧾',
            ruta: '/facturacion/impuestos',
            color: 'from-emerald-500 to-green-600',
        },
        {
            titulo: 'Descuentos',
            descripcion: 'Administrar descuentos por valor fijo o porcentaje.',
            icono: '🏷️',
            ruta: '/facturacion/descuentos',
            color: 'from-amber-500 to-orange-600',
        },
        {
            titulo: 'Formas de pago',
            descripcion: 'Administrar efectivo, transferencia, PayPhone, crédito y más.',
            icono: '💳',
            ruta: '/formas-pago',
            color: 'from-indigo-500/20 to-blue-500/10 border-indigo-400/30'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-black">
                    Configuración de Facturación
                </h1>
                <p className="text-slate-400 mt-2">
                    Panel principal para configurar los datos base que usará el sistema al generar facturas internas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <div
                        key={card.ruta}
                        onClick={() => {
                            if (card.titulo === 'Datos de empresa') {
                                onAbrirDatoempresa();
                                return;
                            }
                            if (card.titulo === 'Impuestos') {
                                onAbrirImpuestos();
                                return;
                            }
                            if (card.titulo === 'Descuentos') {
                                onAbrirDescuentos();
                                return;
                            }
                            if (card.titulo === 'Formas de pago') {
                                onAbrirFormaspago();
                                return;
                            }

                            router.push(card.ruta)

                        }
                        }
                        className="cursor-pointer bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 shadow-lg shadow-cyan-500/10 hover:scale-[1.02] transition"
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-3xl mb-5`}>
                            {card.icono}
                        </div>

                        <h2 className="text-xl font-black mb-2">
                            {card.titulo}
                        </h2>

                        <p className="text-slate-400 text-sm mb-5">
                            {card.descripcion}
                        </p>

                        <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl">
                            Configurar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}