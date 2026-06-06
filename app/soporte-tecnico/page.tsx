'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


const opciones = [
    {
        titulo: 'Tickets',
        descripcion: 'Crear, listar y administrar tickets de soporte.',
        icono: '🎫',
        ruta: '/tickets',
        color: 'from-blue-600 to-cyan-500'
    },
    {
        titulo: 'Ficha Técnica de Clientes',
        descripcion: 'Monitoreo general de productividad y soporte técnico.',
        icono: '📊',
        ruta: '/tickets/dashboard-tecnicos',
        color: 'from-indigo-600 to-blue-500'
    },
    {
        titulo: 'Técnicos',
        descripcion: 'Gestión de técnicos, zonas, especialidades y estados.',
        icono: '👨‍🔧',
        ruta: '/tecnicos',
        color: 'from-emerald-600 to-teal-500'
    },
    {
        titulo: 'Atención en Campo',
        descripcion: 'Registrar visitas, diagnósticos, soluciones y evidencias.',
        icono: '📍',
        ruta: '/tickets/atencion-campo',
        color: 'from-orange-600 to-yellow-500'
    },
    {
        titulo: 'Mantenimientos',
        descripcion: 'Control de mantenimientos preventivos y correctivos.',
        icono: '🛠️',
        ruta: '/tickets/mantenimientos',
        color: 'from-slate-700 to-slate-500'
    },
    {
        titulo: 'Reportes',
        descripcion: 'Reportes técnicos, tickets resueltos y rendimiento.',
        icono: '📄',
        ruta: '/tickets/reportes',
        color: 'from-purple-600 to-pink-500'
    }
];

export default function SoporteTecnicoPage({

    onVolver,
    OpenListadoTickets,
    onAbrirfichatecnico,
    onAbrirfichaCliente,
    onAbrirAtencionCampo,
    onAbrirMantenimiento,
    onAbrirReportes
}: {
    onVolver: () => void;
    OpenListadoTickets: () => void;
    onAbrirfichatecnico: (usuarioId: string) => void;
    onAbrirfichaCliente: () => void;
    onAbrirAtencionCampo: (usuarioId: string) => void;
    onAbrirMantenimiento: (usuarioId: string) => void;
    onAbrirReportes: (usuarioId: string) => void;
}) {
    const [usuario, setUsuario] = useState<any>(null);
    const [resumen, setResumen] = useState({
        ticketsAbiertos: 0,
        enProceso: 0,
        resueltosHoy: 0,
        criticos: 0,
    });
    const cargarResumen = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${API_BASE}/cliente-servicio/resumen-soporte`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            console.table("resumen: ", data)
            if (data.ok) {
                setResumen({
                    ticketsAbiertos: Number(data.resumen.ticketsAbiertos || 0),
                    enProceso: Number(data.resumen.enProceso || 0),
                    resueltosHoy: Number(data.resumen.resueltosHoy || 0),
                    criticos: Number(data.resumen.criticos || 0),
                });
            }
        } catch (error) {
            console.error('Error cargando resumen soporte:', error);
        }
    };

    useEffect(() => {
        cargarResumen();
    }, []);
    useEffect(() => {
        const usuarioStorage = localStorage.getItem('isp_usuario');

        if (usuarioStorage) {
            try {
                const usuarioParseado = JSON.parse(usuarioStorage);

                setUsuario(usuarioParseado);
            } catch {
                setUsuario(null);
            }
        }

    }, []);

    useEffect(() => {
        console.log('USUARIO STATE YA ACTUALIZADO:', usuario);
        console.log('USUARIO ID STATE:', usuario?.usuarioId);
    }, [usuario]);

    const router = useRouter();
    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Resumen titulo="Tickets abiertos" valor={resumen.ticketsAbiertos} color="text-blue-600" />
                <Resumen titulo="En proceso" valor={resumen.enProceso} color="text-yellow-600" />
                <Resumen titulo="Resueltos hoy" valor={resumen.resueltosHoy} color="text-emerald-600" />
                <Resumen titulo="Críticos" valor={resumen.criticos} color="text-red-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {opciones.map((op) => (
                    <button

                        className="group bg-white rounded-3xl border shadow-sm hover:shadow-xl transition overflow-hidden"
                        key={op.titulo}
                        onClick={() => {
                            if (op.titulo === 'Tickets') {
                                OpenListadoTickets();
                                return;
                            }
                            if (op.titulo === 'Técnicos') {

                                onAbrirfichatecnico(usuario?.usuarioId);
                                return;
                            }
                            if (op.titulo === 'Ficha Técnica de Clientes') {
                                onAbrirfichaCliente();
                                return;
                            }
                            if (op.titulo === 'Atención en Campo') {
                                onAbrirAtencionCampo(usuario?.usuarioId);
                                return;
                            }
                            if (op.titulo === 'Mantenimientos') {
                                onAbrirMantenimiento(usuario?.usuarioId);
                                return;
                            }
                            if (op.titulo === 'Reportes') {
                                onAbrirReportes(usuario?.usuarioId);
                                return;
                            }

                            router.push(op.ruta)
                        }}                 >
                        <div className={`h-2 bg-gradient-to-r ${op.color}`} />

                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="text-5xl">
                                    {op.icono}
                                </div>

                                <span className="text-slate-400 group-hover:text-blue-600 text-2xl transition">
                                    →
                                </span>
                            </div>

                            <h2 className="text-xl font-black text-slate-800 mt-5">
                                {op.titulo}
                            </h2>

                            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                                {op.descripcion}
                            </p>
                        </div>
                    </button>
                ))}
            </div>



        </div>
    );
}

function Resumen({ titulo, valor, color }: any) {
    return (
        <div className="bg-white rounded-3xl border shadow-sm p-5">
            <p className="text-sm text-slate-500">
                {titulo}
            </p>

            <h3 className={`text-4xl font-black mt-2 ${color}`}>
                {valor}
            </h3>
        </div>
    );
}