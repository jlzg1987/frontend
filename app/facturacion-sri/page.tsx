'use client';

import { useRouter } from 'next/navigation';

const cards = [
    {
        title: 'Facturas SRI',
        desc: 'Procesar XML, firmar, enviar al SRI, consultar autorización y ver RIDE.',
        icon: '🧾',
        path: '/facturacion-sri',
        color: 'from-cyan-500/20 to-blue-500/10 border-cyan-400/30'
    },
    {
        title: 'Configuración SRI',
        desc: 'Ambiente, establecimiento, punto de emisión, secuencial y datos tributarios.',
        icon: '⚙️',
        path: '/facturacion-sri/configuracion',
        color: 'from-purple-500/20 to-violet-500/10 border-purple-400/30'
    },
    {
        title: 'Certificado digital',
        desc: 'Subir certificado .p12 y clave para firmar electrónicamente los XML.',
        icon: '🔐',
        path: '/facturacion-sri/certificado',
        color: 'from-amber-500/20 to-yellow-500/10 border-amber-400/30'
    },
    {
        title: 'Facturas internas',
        desc: 'Buscar, filtrar, reimprimir y anular.',
        icon: '📄',
        path: '/facturacion-interna/listado',
        color: 'from-emerald-500/20 to-green-500/10 border-emerald-400/30'
    },
    {
        title: 'Configuración Email SRI',
        desc: 'Programar hora de envío automático, adjuntar PDF/XML y envío masivo del día.',
        icon: '📧',
        path: '/facturacion-interna/configuracion-email',
        color: 'from-emerald-500/20 to-blue-500/10 border-emerald-400/30'
    },
    {
        title: 'Historial emails SRI',
        desc: 'Ver correos enviados, errores, reenvíos y envíos automáticos.',
        icon: '📨',
        path: '/facturacion-sri/emails',
        color: 'from-turquesa-500/20 to-blue-500/10 border-emerald-400/30'
    },
    {
        title: 'Anulaciones Interna',
        desc: 'Gestionar solicitudes de anulación, confirmaciones y rechazos de comprobantes electrónicos.',
        icon: '🧾',
        path: '/facturacion-sri/anulaciones',
        color: 'from-red-500/20 to-orange-500/10 border-red-400/30'
    },
    {
        title: 'Anulaciones SRI',
        desc: 'Solicitudes, paquetes, confirmaciones y estados de anulación.',
        icon: '🧾',
        path: '//acturacion-sri/anulacionesSri',
        color: 'from-orange-500/20 to-orange-500/10 border-orange-400/30'
    },
    {
        title: 'Notas Crédito SRI',
        desc: 'Devoluciones parciales, reversos, correcciones y estados SRI.',
        icon: '💳',
        path: '/facturacion-sri/notasCreditoSri',
        color: 'from-rose-500/20 to-pink-500/10 border-rose-400/30'
    },
    {
        title: 'Anulación Notas Crédito',
        desc: 'Historial, filtros, seguimiento y estados de anulaciones SRI.',
        icon: '💳',
        path: '/sri/notas-credito/anulaciones',
        color: 'from-red-500/20 to-pink-500/10 border-rose-400/30'
    }
];

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
    onAbrirAnulaciónNotasCrédito
}: {
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
}) {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-slate-950 text-white p-5 md:p-8">


            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {cards.map((card) => (
                    <button
                        key={card.path}
                        onClick={() => {
                            if (card.title === 'Facturas SRI') {
                                onAbrirFacturasSRI();
                                return;
                            }

                            if (card.title === 'Configuración SRI') {
                                onAbrirConfiguraciónSRI();
                                return;
                            }

                            if (card.title === 'Certificado digital') {
                                onAbrirCertificadodigital();
                                return;
                            }
                            if (card.title === 'Facturas internas') {
                                onAbrirFacturasinternas();
                                return;
                            }
                            if (card.title === 'Configuración Email SRI') {
                                onAbrirConfiguraciónEmailSRI();
                                return;
                            }
                            if (card.title === 'Historial emails SRI') {
                                onAbrirHistorialemailsSRI();
                                return;
                            }
                            if (card.title === 'Anulaciones Interna') {
                                onAbrirAnulacionesInterna();
                                return;
                            }
                            if (card.title === 'Anulaciones SRI') {
                                onAbrirAnulacionesSRI();
                                return;
                            }
                            if (card.title === 'Notas Crédito SRI') {
                                onAbrirNotasCreditoSRI();
                                return;
                            }
                            if (card.title === 'Anulación Notas Crédito') {
                                onAbrirAnulaciónNotasCrédito();
                                return;
                            }

                            router.push(card.path)


                        }}
                        className={`text-left rounded-2xl border bg-gradient-to-br ${card.color} p-5 hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/5`}
                    >
                        <div className="text-4xl mb-4">
                            {card.icon}
                        </div>

                        <h2 className="text-xl font-black mb-2">
                            {card.title}
                        </h2>

                        <p className="text-sm text-slate-300 leading-relaxed">
                            {card.desc}
                        </p>

                        <div className="mt-5 text-cyan-300 text-sm font-bold">
                            Abrir módulo →
                        </div>
                    </button>
                ))}
            </section>
        </main>
    );
}