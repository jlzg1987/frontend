'use client';

import { useRouter } from 'next/navigation';

export default function DashboardFacturacionInternaPage({
    onVolver,
    onAbrirFacturamanual,
    onAbrirFacturasinternas,
}: {
    onVolver: () => void;
    onAbrirFacturamanual: () => void;
    onAbrirFacturasinternas: () => void;
}) {
    const router = useRouter();

    const cards = [
        {
            title: 'Factura manual',
            desc: 'Crear factura interna desde cero.',
            icon: '🧾',
            path: '/facturacion-interna/manual',
            color: 'from-cyan-500/20 to-blue-500/10 border-cyan-400/30'
        },
        {
            title: 'Facturas internas',
            desc: 'Buscar, filtrar, reimprimir y anular.',
            icon: '📄',
            path: '/facturacion-interna/listado',
            color: 'from-emerald-500/20 to-green-500/10 border-emerald-400/30'
        },

    ];

    return (
        <main className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto">



                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {cards.map((card) => (
                        <button
                            key={card.title}
                            onClick={() => {
                                if (card.title === 'Factura manual') {
                                    onAbrirFacturamanual();
                                    return;
                                } if (card.title === 'Facturas internas') {
                                    onAbrirFacturasinternas();
                                    return;
                                }

                                router.push(card.path)
                            }}
                            className={`text-left rounded-3xl border bg-gradient-to-br ${card.color} p-6 hover:scale-[1.02] transition-all shadow-lg`}
                        >
                            <div className="text-5xl mb-4">
                                {card.icon}
                            </div>

                            <h2 className="text-2xl font-black">
                                {card.title}
                            </h2>

                            <p className="text-slate-300 mt-2">
                                {card.desc}
                            </p>

                            <div className="mt-5 text-sm font-bold text-cyan-300">
                                Entrar →
                            </div>
                        </button>
                    ))}
                </section>

            </div>
        </main>
    );
}