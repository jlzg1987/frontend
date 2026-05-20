'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';


const BASE_URL = API_BASE.replace('/api', '');

type FacturaInterna = {
    facturaId: string;
    numeroFactura: string;
    clienteId: string | null;
    clienteExternoId?: number | null;
    tipoCliente?: 'ISP' | 'EXTERNO' | string;
    subtotal: number;
    totalImpuestos: number;
    totalDescuentos: number;
    totalFinal: number;
    estado: string;
    fechaFactura: string;
    fechaPago: string | null;
    observacion: string | null;
    pdfUrl: string | null;

    nombres?: string;
    apellidos?: string;
    cedula?: string;
    celular?: string;

    nombresExterno?: string;
    apellidosExterno?: string;
    cedulaExterno?: string;
    celularExterno?: string;
};

export default function ListadoFacturasInternasPage() {
    const [facturas, setFacturas] = useState<FacturaInterna[]>([]);
    const [buscar, setBuscar] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [estado, setEstado] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        cargarFacturas();
    }, []);

    async function cargarFacturas() {
        try {
            setLoading(true);

            const params = new URLSearchParams();

            if (buscar.trim()) params.append('buscar', buscar.trim());
            if (fechaDesde) params.append('fechaDesde', fechaDesde);
            if (fechaHasta) params.append('fechaHasta', fechaHasta);
            if (estado) params.append('estado', estado);

            const resp = await fetch(`${API_BASE}/facturacion-interna?${params.toString()}`);
            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error cargando facturas');
                return;
            }

            setFacturas(data.data || []);

        } catch (error) {
            console.error('Error cargando facturas:', error);
            alert('Error cargando facturas internas');
        } finally {
            setLoading(false);
        }
    }

    async function reimprimirFactura(factura: FacturaInterna) {
        try {
            if (factura.pdfUrl) {
                window.open(`${BASE_URL}${factura.pdfUrl}`, '_blank');
                return;
            }

            const resp = await fetch(`${API_BASE}/facturacion-interna/${factura.facturaId}/pdf`);
            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo generar el PDF');
                return;
            }

            if (data.pdfUrl) {
                window.open(`${BASE_URL}${data.pdfUrl}`, '_blank');
                cargarFacturas();
            }

        } catch (error) {
            console.error('Error reimprimiendo factura:', error);
            alert('Error reimprimiendo factura');
        }
    }

    async function anularFactura(factura: FacturaInterna) {
        if (factura.estado === 'ANULADA') {
            alert('Esta factura ya está anulada');
            return;
        }

        const motivo = prompt('Ingrese el motivo de anulación');

        if (!motivo) return;

        try {
            const resp = await fetch(`${API_BASE}/facturacion-interna/${factura.facturaId}/anular`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ motivo })
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error anulando factura');
                return;
            }

            alert('Factura anulada correctamente');
            cargarFacturas();

        } catch (error) {
            console.error('Error anulando factura:', error);
            alert('Error anulando factura');
        }
    }

    function limpiarFiltros() {
        setBuscar('');
        setFechaDesde('');
        setFechaHasta('');
        setEstado('');

        setTimeout(() => {
            cargarFacturas();
        }, 100);
    }

    function colorEstado(estado: string) {
        if (estado === 'PAGADA') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
        if (estado === 'ANULADA') return 'bg-red-500/15 text-red-300 border-red-500/30';
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
    }

    function nombreCliente(f: FacturaInterna) {
        if (f.tipoCliente === 'EXTERNO' || f.clienteExternoId) {
            const nombreExterno = `${f.nombresExterno || f.nombres || ''} ${f.apellidosExterno || f.apellidos || ''}`.trim();
            return nombreExterno || 'Consumidor final';
        }

        const nombreIsp = `${f.nombres || ''} ${f.apellidos || ''}`.trim();
        return nombreIsp || 'Consumidor final';
    }

    const enviarFacturaEmailListado = async (factura: FacturaInterna) => {

        try {

            const resp = await fetch(
                `${API_BASE}/facturacion-interna/${factura.facturaId}/enviar-email`,
                {
                    method: 'POST',
                }
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo enviar email');
                return;
            }

            alert('Factura enviada correctamente al email');

        } catch (error) {

            console.error(error);

            alert('Error enviando email');
        }
    };

    const enviarFacturaWhatsappListado = async (factura: FacturaInterna) => {

        const telefono =
            factura.celularExterno ||
            factura.celular ||
            '';

        if (!telefono) {
            alert('Cliente sin celular');
            return;
        }

        const pdfUrl = factura.pdfUrl;

        if (!pdfUrl) {
            alert('Factura sin PDF');
            return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        const urlCompleta = `${backendUrl}${pdfUrl}`;

        const numeroLimpio = telefono.replace(/\D/g, '');

        const numeroWhatsapp = numeroLimpio.startsWith('593')
            ? numeroLimpio
            : `593${numeroLimpio.replace(/^0/, '')}`;

        const nombreCliente =
            factura.tipoCliente === 'EXTERNO'
                ? `${factura.nombresExterno || ''} ${factura.apellidosExterno || ''}`.trim()
                : `${factura.nombres || ''} ${factura.apellidos || ''}`.trim();

        const mensaje = encodeURIComponent(
            `*NETCOMPRF ISP*\n` +
            `━━━━━━━━━━━━━━━\n\n` +
            `Hola ${nombreCliente || 'cliente'},\n\n` +
            `Su factura ya se encuentra disponible.\n\n` +
            `*Comprobante:* ${factura.numeroFactura}\n\n` +
            `*Ver factura PDF:*\n${urlCompleta}\n\n` +
            `Gracias por preferir nuestros servicios de internet.\n\n` +
            `NETCOMPRF ISP`
        );

        window.open(
            `https://wa.me/${numeroWhatsapp}?text=${mensaje}`,
            '_blank'
        );
    };
    return (
        <main className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto">

                <section className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5 shadow-lg shadow-cyan-500/10 mb-6">
                    <h2 className="text-xl font-bold mb-4">Filtros de búsqueda</h2>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-sm text-slate-300">
                                Nombre, cédula, celular o número factura
                            </label>
                            <input
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') cargarFacturas();
                                }}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                                placeholder="Buscar factura..."
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">Desde</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">Hasta</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">Estado</label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-cyan-400"
                            >
                                <option value="">Todos</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="PAGADA">Pagada</option>
                                <option value="ANULADA">Anulada</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mt-5">
                        <button
                            onClick={cargarFacturas}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold px-5 py-2 rounded-xl"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>

                        <button
                            onClick={limpiarFiltros}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold px-5 py-2 rounded-xl"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </section>

                <section className="bg-slate-900 border border-cyan-500/20 rounded-2xl shadow-lg shadow-cyan-500/10 overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            Resultado
                        </h2>

                        <span className="text-sm text-slate-400">
                            {facturas.length} factura(s)
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3 text-left">Factura</th>
                                    <th className="px-4 py-3 text-left">Cliente</th>
                                    <th className="px-4 py-3 text-left">Cédula</th>
                                    <th className="px-4 py-3 text-left">Celular</th>
                                    <th className="px-4 py-3 text-left">Fecha</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {facturas.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                                            No hay facturas internas registradas.
                                        </td>
                                    </tr>
                                )}

                                {facturas.map((factura) => (
                                    <tr
                                        key={factura.facturaId}
                                        className="border-t border-slate-800 hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-cyan-300">
                                                {factura.numeroFactura}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {factura.facturaId.slice(0, 8)}...
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="font-semibold">
                                                {nombreCliente(factura)}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {factura.observacion || 'Sin observación'}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-slate-300">
                                            {factura.cedulaExterno || factura.cedula || '-'}
                                        </td>

                                        <td className="px-4 py-4 text-slate-300">
                                            {factura.celularExterno || factura.celular || '-'}
                                        </td>

                                        <td className="px-4 py-4 text-slate-300">
                                            {new Date(factura.fechaFactura).toLocaleDateString()}
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            <div className="font-black text-emerald-300">
                                                ${Number(factura.totalFinal || 0).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Subtotal: ${Number(factura.subtotal || 0).toFixed(2)}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-bold ${colorEstado(factura.estado)}`}>
                                                {factura.estado}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex flex-col md:flex-row gap-2 justify-center">

                                                <button
                                                    onClick={() => enviarFacturaEmailListado(factura)}
                                                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs font-bold"
                                                >
                                                    Email
                                                </button>

                                                <button
                                                    onClick={() => enviarFacturaWhatsappListado(factura)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold"
                                                >
                                                    WhatsApp
                                                </button>

                                                <button
                                                    onClick={() => reimprimirFactura(factura)}
                                                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-2 rounded-lg"
                                                >
                                                    PDF
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        window.open(
                                                            `${API_BASE}/facturacion-interna/${factura.facturaId}/recibo`,
                                                            '_blank'
                                                        )
                                                    }
                                                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-3 py-2 rounded-lg"
                                                >
                                                    Recibo
                                                </button>

                                                <button
                                                    onClick={() => anularFactura(factura)}
                                                    disabled={factura.estado === 'ANULADA'}
                                                    className="bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold px-3 py-2 rounded-lg"
                                                >
                                                    Anular
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}