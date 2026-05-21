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
    }
];

export default function DashboardSriPage({
    onVolver,
    onAbrirFacturasSRI,
    onAbrirConfiguraciónSRI,
    onAbrirCertificadodigital,
    onAbrirFacturasinternas
}: {
    onVolver: () => void;
    onAbrirFacturasSRI: () => void;
    onAbrirConfiguraciónSRI: () => void;
    onAbrirCertificadodigital: () => void;
    onAbrirFacturasinternas: () => void;
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