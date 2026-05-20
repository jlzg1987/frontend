'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';


type Detalle = {
    productoId?: number | null;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    impuestoId: string;
    descuentoId: string;

    codigo?: string;
    codigo_barra?: string;
    tipo_item?: 'PRODUCTO' | 'SERVICIO';
    stock?: number;
};

type FacturaCreada = {
    facturaId: string;
    numeroFactura?: string;
    pdfUrl?: string | null;
};
const BASE_URL = API_BASE.replace('/api', '');
export default function FacturaManualPage() {
    const [empresaId, setEmpresaId] = useState('');
    const [clienteId, setClienteId] = useState('');
    const [observacion, setObservacion] = useState('');

    const [empresas, setEmpresas] = useState<any[]>([]);
    const [impuestos, setImpuestos] = useState<any[]>([]);
    const [descuentos, setDescuentos] = useState<any[]>([]);
    const [formasPago, setFormasPago] = useState<any[]>([]);

    const [formaPagoId, setFormaPagoId] = useState('');
    const [referenciaPago, setReferenciaPago] = useState('');
    const [facturaCreada, setFacturaCreada] = useState<FacturaCreada | null>(null);

    const [impuestoDefaultId, setImpuestoDefaultId] = useState('');
    const [clienteEncontrado, setClienteEncontrado] = useState<any>(null);
    const [mostrarCrearClienteExterno, setMostrarCrearClienteExterno] = useState(false);
    const [abrirModalClienteExterno, setAbrirModalClienteExterno] = useState(false);

    const [abrirModalCobro, setAbrirModalCobro] = useState(false);
    const [montoRecibido, setMontoRecibido] = useState('');
    const [facturaParaCobrar, setFacturaParaCobrar] = useState<any>(null);

    const [nuevoClienteExterno, setNuevoClienteExterno] = useState({
        nombres: '',
        apellidos: '',
        cedula: '',
        celular: '',
        email: '',
        direccion: '',
        observacion: ''
    });
    const [detalles, setDetalles] = useState<Detalle[]>([
        {
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
            impuestoId: '',
            descuentoId: ''
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [productosInventario, setProductosInventario] = useState<any[]>([]);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [mostrarBusquedaProducto, setMostrarBusquedaProducto] = useState(false);


    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    async function cargarDatosIniciales() {
        try {

            const [empRes, impRes, descRes, fpRes, invRes] = await Promise.all([
                fetch(`${API_BASE}/facturacion/config/empresa`),
                fetch(`${API_BASE}/facturacion/config/impuestos`),
                fetch(`${API_BASE}/facturacion/config/descuentos`),
                fetch(`${API_BASE}/facturacion/config/formas-pago`),
                fetch(`${API_BASE}/inventario/productos`)
            ]);

            const emp = await empRes.json();
            const imp = await impRes.json();
            const desc = await descRes.json();
            const fp = await fpRes.json();
            const inv = await invRes.json();
            const inventarioData = inv.data || [];

            setProductosInventario(
                inventarioData.filter((x: any) => x.estado === 'ACTIVO')
            );


            const empresasData = emp.data || emp.empresas || [];
            const impuestosData = imp.data || imp.impuestos || [];
            const descuentosData = desc.data || desc.descuentos || [];
            const formasPagoData = fp.data || fp.formasPago || [];

            setEmpresas(empresasData);
            setImpuestos(impuestosData);
            setDescuentos(descuentosData);
            setFormasPago(formasPagoData);

            // EMPRESA AUTOMÁTICA
            // EMPRESA PRINCIPAL AUTOMÁTICA
            if (empresasData.length > 0) {
                const empresaPrincipal = empresasData.find(
                    (e: any) => Number(e.es_principal) === 1
                );

                setEmpresaId(
                    String(empresaPrincipal?.id || empresasData[0].id)
                );
            }

            // FORMA PAGO EFECTIVO AUTOMÁTICA
            const efectivo = formasPagoData.find(
                (x: any) =>
                    x.nombre?.trim().toUpperCase() === 'EFECTIVO'
            );

            if (efectivo) {
                setFormaPagoId(String(efectivo.formaPagoId));
            }

            setImpuestos(impuestosData);

            const iva15 = impuestosData.find(
                (x: any) =>
                    x.nombre?.toUpperCase().includes('IVA') &&
                    Number(x.valor || x.porcentaje) === 15
            );

            if (iva15) {
                setImpuestoDefaultId(String(iva15.id));
            }

        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    function agregarDetalle() {
        setDetalles([
            ...detalles,
            {
                descripcion: '',
                cantidad: 1,
                precioUnitario: 0,
                impuestoId: '',
                descuentoId: ''
            }
        ]);
    }

    function eliminarDetalle(index: number) {
        const nuevos = detalles.filter((_, i) => i !== index);
        setDetalles(nuevos);
    }

    function actualizarDetalle(index: number, campo: keyof Detalle, valor: any) {
        const nuevos = [...detalles];

        nuevos[index] = {
            ...nuevos[index],
            [campo]: campo === 'cantidad' || campo === 'precioUnitario'
                ? Number(valor)
                : valor
        };

        setDetalles(nuevos);
    }
    function agregarProductoFactura(producto: any) {

        const indexExistente = detalles.findIndex(
            d => d.productoId === producto.productoId
        );

        // SI YA EXISTE → AUMENTAR CANTIDAD
        if (indexExistente >= 0) {

            const nuevos = [...detalles];

            nuevos[indexExistente].cantidad += 1;

            setDetalles(nuevos);

            setBusquedaProducto('');
            setMostrarBusquedaProducto(false);

            return;
        }

        // AGREGAR NUEVO
        setDetalles([
            ...detalles,
            {
                productoId: producto.productoId,
                descripcion: producto.nombre,
                cantidad: 1,
                precioUnitario: Number(producto.precio_venta || 0),
                impuestoId: impuestoDefaultId,
                descuentoId: '',
                codigo: producto.codigo,
                codigo_barra: producto.codigo_barra,
                tipo_item: producto.tipo_item,
                stock: Number(producto.stock || 0)
            }
        ]);

        setBusquedaProducto('');
        setMostrarBusquedaProducto(false);
    }

    function calcularSubtotal() {
        return detalles.reduce((acc, item) => {
            return acc + Number(item.cantidad || 0) * Number(item.precioUnitario || 0);
        }, 0);
    }

    const obtenerMesActual = () => {
        return new Date().toLocaleDateString('es-EC', {
            month: 'long'
        });
    };

    const productosFiltrados = productosInventario.filter((p: any) => {
        const txt = busquedaProducto.toLowerCase();

        return (
            txt && (
                p.nombre?.toLowerCase().includes(txt) ||
                p.codigo?.toLowerCase().includes(txt) ||
                p.codigo_barra?.toLowerCase().includes(txt)
            )
        );
    });


    async function crearFactura() {
        try {
            if (!empresaId) {
                alert('Seleccione una empresa');
                return;
            }

            const detallesValidos = detalles.filter(d =>
                d.descripcion.trim() !== '' &&
                Number(d.precioUnitario) > 0 &&
                Number(d.cantidad) > 0
            );

            if (detallesValidos.length === 0) {
                alert('Debe agregar al menos un detalle válido a la factura');
                return;
            }
            setLoading(true);

            const subtotal = detallesValidos.reduce(
                (acc, d) => acc + Number(d.cantidad) * Number(d.precioUnitario),
                0
            );

            const body = {
                empresaId: Number(empresaId),

                clienteId: clienteEncontrado?.clienteId || null,
                clienteExternoId: clienteEncontrado?.clienteExternoId || null,

                tipoCliente: clienteEncontrado
                    ? clienteEncontrado.clienteExternoId
                        ? 'EXTERNO'
                        : 'ISP'
                    : 'CONSUMIDOR_FINAL',

                observacion,
                detalles: detallesValidos.map(d => ({
                    descripcion: d.descripcion,
                    cantidad: Number(d.cantidad),
                    precioUnitario: Number(d.precioUnitario),
                    impuestoId: d.impuestoId ? Number(d.impuestoId) : null,
                    descuentoId: d.descuentoId ? Number(d.descuentoId) : null
                })),
                pagos: formaPagoId
                    ? [
                        {
                            formaPagoId: Number(formaPagoId),
                            valor: subtotal,
                            referencia: referenciaPago || null
                        }
                    ]
                    : []
            };

            const resp = await fetch(`${API_BASE}/facturacion-interna`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error creando factura');
                return;
            }
            setFacturaCreada({
                facturaId: data.factura.facturaId,
                numeroFactura: data.factura.numeroFactura,
                pdfUrl: data.factura.pdfUrl || null,
            });

            alert('Factura creada correctamente');

            const pdfResp = await fetch(`${API_BASE}/facturacion-interna/${data.facturaId}/pdf`);
            const pdfData = await pdfResp.json();

            if (pdfData.ok && pdfData.pdfUrl) {
                window.open(`${API_BASE.replace('/api', '')}${pdfData.pdfUrl}`, '_blank');
            }

            setFacturaCreada(data.factura);
            setFacturaParaCobrar(data.factura);
            setAbrirModalCobro(true);
            limpiarFormulario();
        } catch (error) {
            console.error('Error creando factura:', error);
            alert('Error creando factura');
        } finally {
            setLoading(false);
        }
    }

    function limpiarFormulario() {
        setClienteId('');
        setObservacion('');
        setFormaPagoId('EFECTIVO');
        setReferenciaPago('');
        // LIMPIAR DETALLES

        setDetalles([
            {
                descripcion: '',
                cantidad: 1,
                precioUnitario: 0,
                impuestoId: '',
                descuentoId: ''
            }
        ]);

        setClienteEncontrado(null);

        // LIMPIAR FACTURA CREADA
        setFacturaCreada(null);

    }

    const buscarClienteFacturacion = async () => {
        try {
            if (!clienteId.trim()) {
                alert('Ingrese cédula, celular, email o ID del cliente');
                return;
            }

            const resp = await fetch(
                `${API_BASE}/facturacion-interna/buscar-cliente/${clienteId.trim()}`
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'Error buscando cliente');
                return;
            }

            if (data.encontrado) {
                setClienteEncontrado({
                    ...data.cliente,
                    tipo: data.tipo
                });

                setMostrarCrearClienteExterno(false);

                if (data.tipo === 'ISP' && data.cliente.valorPlan) {
                    const impuestoIVA = impuestos.find(
                        (i: any) =>
                            i.nombre?.toUpperCase().includes('IVA') &&
                            Number(i.valor || i.porcentaje) === 15
                    );

                    const yaExistePlan = detalles.some(d =>
                        d.descripcion.includes(data.cliente.nombrePlan)
                    );

                    if (!yaExistePlan) {
                        setDetalles([
                            ...detalles,
                            {
                                descripcion: `Servicio de internet - ${data.cliente.nombrePlan}: mes ${obtenerMesActual()}`,
                                cantidad: 1,
                                precioUnitario: Number(data.cliente.valorPlan),
                                impuestoId: impuestoDefaultId,
                                descuentoId: ''
                            }
                        ]);
                    }
                }

                return;
            }

            setClienteEncontrado(null);
            setMostrarCrearClienteExterno(true);

        } catch (error) {
            console.error('Error buscando cliente:', error);
            alert('Error buscando cliente');
        }
    };

    const crearClienteExterno = async () => {
        try {
            if (!nuevoClienteExterno.nombres.trim()) {
                alert('Ingrese los nombres del cliente externo');
                return;
            }

            const resp = await fetch(`${API_BASE}/facturacion-interna/clientes-externos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoClienteExterno)
            });

            const data = await resp.json();

            if (!resp.ok || !data.ok) {
                throw new Error(data.message || 'Error creando cliente externo');
            }

            alert('Cliente externo creado correctamente');

            setClienteEncontrado({
                clienteExternoId: data.clienteExternoId,
                nombres: nuevoClienteExterno.nombres,
                apellidos: nuevoClienteExterno.apellidos,
                cedula: nuevoClienteExterno.cedula,
                celular: nuevoClienteExterno.celular,
                email: nuevoClienteExterno.email,
                direccion: nuevoClienteExterno.direccion,
                tipo: 'EXTERNO'
            });

            setAbrirModalClienteExterno(false);
            setMostrarCrearClienteExterno(false);

            setNuevoClienteExterno({
                nombres: '',
                apellidos: '',
                cedula: '',
                celular: '',
                email: '',
                direccion: '',
                observacion: ''
            });

        } catch (error: any) {
            console.error('Error creando cliente externo:', error);
            alert(error.message || 'Error creando cliente externo');
        }
    };

    async function abrirPdfFacturaCreada() {
        try {
            if (!facturaCreada) return;

            const resp = await fetch(`${API_BASE}/facturacion-interna/${facturaCreada.facturaId}/pdf`);
            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo generar el PDF');
                return;
            }

            if (data.pdfUrl) {
                window.open(`${BASE_URL}${data.pdfUrl}`, '_blank');
            }
        } catch (error) {
            console.error('Error abriendo PDF:', error);
            alert('Error abriendo PDF');
        }
    }
    const totalFactura = Number(facturaParaCobrar?.totalFinal || 0);
    const recibido = Number(montoRecibido || 0);
    const cambio = recibido - totalFactura;
    async function cobrarFactura() {
        try {
            if (!facturaParaCobrar) return;

            if (Number(montoRecibido) < Number(facturaParaCobrar.totalFinal)) {
                alert('El dinero recibido no alcanza');
                return;
            }

            const resp = await fetch(
                `${API_BASE}/facturacion-interna/${facturaParaCobrar.facturaId}/pagar`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        montoRecibido: Number(montoRecibido),
                        cambio: Number(montoRecibido) - Number(facturaParaCobrar.totalFinal)
                    })
                }
            );

            const data = await resp.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo cobrar la factura');
                return;
            }

            alert('Factura marcada como pagada');

            setAbrirModalCobro(false);
            setMontoRecibido('');

        } catch (error) {
            console.error('Error cobrando factura:', error);
            alert('Error cobrando factura');
        }
    }

    const enviarFacturaEmail = async () => {
        const facturaId =
            facturaCreada?.facturaId;
        if (!facturaId) {
            console.log('facturaCreada actual:', facturaCreada);
            alert('No existe factura creada');
            return;
        }

        const resp = await fetch(
            `${API_BASE}/facturacion-interna/${facturaId}/enviar-email`,
            { method: 'POST' }
        );

        const data = await resp.json();

        if (!data.ok) {
            alert(data.message || 'No se pudo enviar el correo');
            return;
        }

        alert('Factura enviada correctamente');
    };

    const enviarFacturaWhatsApp = async () => {

        const telefono =
            clienteEncontrado?.celular ||
            clienteEncontrado?.telefono ||
            '';

        if (!telefono) {
            alert('Cliente sin celular');
            return;
        }

        const pdfUrl = facturaCreada?.pdfUrl;

        if (!pdfUrl) {
            alert('No existe PDF');
            return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '//localhost:4000';

        const urlCompleta = `${backendUrl}${pdfUrl}`;

        const numeroLimpio = telefono.replace(/\D/g, '');

        const numeroWhatsapp = numeroLimpio.startsWith('593')
            ? numeroLimpio
            : `593${numeroLimpio.replace(/^0/, '')}`;

        const mensaje = encodeURIComponent(
            `*NETCOMPRF ISP*\n` +
            `━━━━━━━━━━━━━━━\n\n` +
            `Hola ${clienteEncontrado?.nombres || 'cliente'},\n\n` +
            `Su factura ya se encuentra disponible.\n\n` +
            `*Comprobante:* ${facturaCreada.numeroFactura}\n\n` +
            `*Ver factura PDF:*\n${urlCompleta}\n\n` +
            `Gracias por preferir nuestros servicios de internet.\n\n` +
            `NETCOMPRF ISP\n` +
            `Soporte y atención al cliente`
        );

        window.open(
            `https://wa.me/${numeroWhatsapp}?text=${mensaje}`,
            '_blank'
        );
    };
    return (
        <main className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto">


                <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5 shadow-lg shadow-cyan-500/10 mb-6">
                    <h2 className="text-xl font-bold mb-4">Datos generales</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm text-slate-300">Empresa</label>
                            <select
                                value={empresaId}
                                onChange={(e) => setEmpresaId(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                            >
                                <option value="">Seleccione empresa</option>
                                {empresas.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nombre_comercial || e.razon_social}
                                        {Number(e.es_principal) === 1 ? ' - Principal' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">Cliente ID opcional</label>


                            <input
                                value={clienteId}
                                onChange={(e) => setClienteId(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                                placeholder="Cédula, celular o ID del cliente"
                            />
                            <button
                                type="button"
                                onClick={buscarClienteFacturacion}
                                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg"
                                style={{ marginTop: 8, marginRight: 12 }}
                            >
                                Buscar cliente
                            </button>
                            {mostrarCrearClienteExterno && (
                                <button
                                    type="button"
                                    onClick={() => setAbrirModalClienteExterno(true)}
                                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg"
                                >
                                    Crear cliente externo
                                </button>
                            )}
                        </div>


                        <div>
                            <label className="text-sm text-slate-300">Forma de pago</label>
                            <select
                                value={formaPagoId}
                                onChange={(e) => setFormaPagoId(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                            >
                                <option value="">Sin pago inicial</option>
                                {formasPago.map((fp) => (
                                    <option key={fp.formaPagoId} value={fp.formaPagoId}>
                                        {fp.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-300">Referencia pago</label>
                            <input
                                value={referenciaPago}
                                onChange={(e) => setReferenciaPago(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                                placeholder="Transferencia, comprobante, etc."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm text-slate-300">Observación</label>
                            <input
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"
                                placeholder="Observación de la factura"
                            />
                        </div>
                    </div>
                    {clienteEncontrado && (
                        <div className="mt-4 bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                    <p className="text-emerald-400 text-sm font-bold">
                                        Cliente seleccionado
                                    </p>

                                    <h3 className="text-white text-xl font-black">
                                        {clienteEncontrado.nombres} {clienteEncontrado.apellidos}
                                    </h3>
                                </div>

                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black">
                                    {clienteEncontrado.clienteExternoId ? 'EXTERNO' : 'ISP'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-500">Cédula</p>
                                    <p className="text-slate-200 font-bold">
                                        {clienteEncontrado.cedula || 'No registrada'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Celular</p>
                                    <p className="text-slate-200 font-bold">
                                        {clienteEncontrado.celular || 'No registrado'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Plan</p>
                                    <p className="text-cyan-300 font-bold">
                                        {clienteEncontrado.nombrePlan || 'Sin plan'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Valor plan</p>
                                    <p className="text-emerald-300 font-bold">
                                        ${Number(clienteEncontrado.valorPlan || 0).toFixed(2)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Cliente ID</p>
                                    <p className="text-slate-200 font-bold">
                                        {clienteEncontrado.clienteId || clienteEncontrado.clienteExternoId}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setClienteEncontrado(null);
                                    setClienteId('');
                                }}
                                className="mt-4 bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-xl"
                            >
                                Quitar cliente
                            </button>
                        </div>
                    )} {mostrarCrearClienteExterno && (
                        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                            <p className="text-amber-300 font-bold mb-3">
                                No se encontró ningún cliente con ese dato.
                            </p>

                            <button
                                type="button"
                                onClick={() => setAbrirModalClienteExterno(true)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-xl"
                            >
                                Crear cliente externo
                            </button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5 mb-5
relative">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-[280px]">
                            <label className="text-xs text-slate-400">
                                Escanear producto / buscar inventario
                            </label>
                            <input

                                value={busquedaProducto}
                                onChange={(e) => {
                                    setBusquedaProducto(e.target.value);
                                    setMostrarBusquedaProducto(true);
                                }}
                                onKeyDown={(e) => {
                                    // ENTER DESDE PISTOLA
                                    if (e.key === 'Enter') {
                                        const exacto = productosInventario.find((p: any) =>
                                            p.codigo === busquedaProducto ||
                                            p.codigo_barra === busquedaProducto
                                        );
                                        if (exacto) {
                                            agregarProductoFactura(exacto);
                                        }
                                    }
                                }}
                                placeholder="Escanee código de barra o escriba nombre"
                                className="w-full mt-1 bg-slate-950 border border-slate-700
rounded-xl px-4 py-3 outline-none focus:border-cyan-400"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setMostrarBusquedaProducto(!
                                mostrarBusquedaProducto)}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 fontblack px-5 py-3 rounded-xl mt-5"
                        >
                            Agregar producto
                        </button>
                    </div>
                    {
                        mostrarBusquedaProducto && productosFiltrados.length > 0 && (
                            <div className="absolute z-50 left-5 right-5 mt-2 bg-slate-950
border border-slate-700 rounded-2xl max-h-[350px] overflow-y-auto
shadow-2xl">
                                {
                                    productosFiltrados.slice(0, 15).map((p: any) => {
                                        const stockBajo =
                                            p.tipo_item === 'PRODUCTO' &&
                                            Number(p.stock || 0) <= 0;
                                        return (

                                            <button
                                                key={p.productoId}
                                                type="button"
                                                onClick={() => agregarProductoFactura(p)}
                                                className="w-full text-left px-4 py-4 borderb border-slate-800 hover:bg-slate-900 transition"
                                            >
                                                <div className="flex justify-between gap-4">
                                                    <div>
                                                        <p className="font-black text-white">
                                                            {p.nombre}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {p.codigo} | {p.codigo_barra ||
                                                                'Sin barra'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-cyan-300 fontblack">
                                                            ${Number(p.precio_venta ||
                                                                0).toFixed(2)}
                                                        </p>
                                                        {
                                                            p.tipo_item === 'PRODUCTO' && (
                                                                <p className={`text-xs mt-1 $ { stockBajo ? 'text-red-400': 'text-emerald-400'
}`}>
                                                                    Stock: {p.stock}
                                                                </p>
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                }
                            </div>
                        )
                    }
                </div>

                <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5 shadow-lg shadow-cyan-500/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Detalle de factura</h2>


                        <button
                            onClick={agregarDetalle}
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl"
                        >
                            + Agregar detalle
                        </button>
                    </div>

                    <div className="space-y-6">

                        {detalles.map((item, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-7 gap-3 bg-slate-950 border border-slate-700 rounded-xl p-4"
                            >

                                <div className="md:col-span-2">
                                    <label className="text-xs text-slate-400">Descripción</label>
                                    <input
                                        value={item.descripcion}
                                        onChange={(e) => actualizarDetalle(index, 'descripcion', e.target.value)}
                                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                                        placeholder="Servicio o producto"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400">Cantidad</label>
                                    <input
                                        type="number"
                                        value={item.cantidad}
                                        onChange={(e) => actualizarDetalle(index, 'cantidad', e.target.value)}
                                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400">Precio</label>
                                    <input
                                        type="number"
                                        value={item.precioUnitario}
                                        onChange={(e) => actualizarDetalle(index, 'precioUnitario', e.target.value)}
                                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400">Impuesto</label>
                                    <select
                                        value={item.impuestoId}
                                        onChange={(e) => actualizarDetalle(index, 'impuestoId', e.target.value)}
                                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Sin impuesto</option>
                                        {impuestos.map((imp) => (
                                            <option key={imp.id} value={imp.id}>
                                                {imp.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400">Descuento</label>
                                    <select
                                        value={item.descuentoId}
                                        onChange={(e) => actualizarDetalle(index, 'descuentoId', e.target.value)}
                                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Sin descuento</option>
                                        {descuentos.map((desc) => (
                                            <option key={desc.id} value={desc.id}>
                                                {desc.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => eliminarDetalle(index)}
                                        disabled={detalles.length === 1}
                                        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-700 px-3 py-2 rounded-lg font-bold"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row items-end justify-between mt-6 gap-4">
                        <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 w-full md:w-80">
                            <p className="text-slate-400 text-sm">Subtotal base</p>
                            <p className="text-3xl font-black text-cyan-300">
                                ${calcularSubtotal().toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-500">
                                El backend calculará impuestos, descuentos y total final.
                            </p>
                        </div>

                        <button
                            onClick={crearFactura}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-black px-8 py-3 rounded-xl shadow-lg"
                        >
                            {loading ? 'Creando factura...' : 'Pagar factura'}
                        </button>

                        {facturaCreada && (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={enviarFacturaWhatsApp}
                                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
                                >
                                    Enviar por WhatsApp
                                </button>
                                <button
                                    onClick={enviarFacturaEmail}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                >
                                    Enviar por email
                                </button>
                                <button
                                    onClick={abrirPdfFacturaCreada}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg"
                                >
                                    Abrir PDF
                                </button>
                                <button
                                    onClick={() =>
                                        window.open(
                                            `${API_BASE}/facturacion-interna/${facturaCreada.facturaId}/recibo`,
                                            '_blank'
                                        )
                                    }
                                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-3 rounded-xl shadow-lg"
                                >
                                    Imprimir recibo
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {abrirModalClienteExterno && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-cyan-500/20 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white">
                                    Crear cliente externo
                                </h2>

                                <p className="text-slate-400 text-sm mt-1">
                                    Cliente para facturación fuera del sistema ISP
                                </p>
                            </div>

                            <button
                                onClick={() => setAbrirModalClienteExterno(false)}
                                className="bg-red-500 hover:bg-red-400 text-white w-10 h-10 rounded-full font-black"
                            >
                                X
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                            <div>
                                <label className="text-slate-300 text-sm font-bold">
                                    Nombres
                                </label>

                                <input
                                    type="text"
                                    value={nuevoClienteExterno.nombres}
                                    onChange={(e) =>
                                        setNuevoClienteExterno({
                                            ...nuevoClienteExterno,
                                            nombres: e.target.value
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 text-sm font-bold">
                                    Apellidos
                                </label>

                                <input
                                    type="text"
                                    value={nuevoClienteExterno.apellidos}
                                    onChange={(e) =>
                                        setNuevoClienteExterno({
                                            ...nuevoClienteExterno,
                                            apellidos: e.target.value
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 text-sm font-bold">
                                    Cédula
                                </label>

                                <input
                                    type="text"
                                    value={nuevoClienteExterno.cedula}
                                    onChange={(e) =>
                                        setNuevoClienteExterno({
                                            ...nuevoClienteExterno,
                                            cedula: e.target.value
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 text-sm font-bold">
                                    Celular
                                </label>

                                <input
                                    type="text"
                                    value={nuevoClienteExterno.celular}
                                    onChange={(e) =>
                                        setNuevoClienteExterno({
                                            ...nuevoClienteExterno,
                                            celular: e.target.value
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 text-sm font-bold">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={nuevoClienteExterno.email}
                                    onChange={(e) =>
                                        setNuevoClienteExterno({
                                            ...nuevoClienteExterno,
                                            email: e.target.value
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 text-sm font-bold">
                                    Dirección
                                </label>

                                <input
                                    type="text"
                                    value={nuevoClienteExterno.direccion}
                                    onChange={(e) =>
                                        setNuevoClienteExterno({
                                            ...nuevoClienteExterno,
                                            direccion: e.target.value
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="text-slate-300 text-sm font-bold">
                                    Observación
                                </label>

                                <textarea
                                    rows={4}
                                    value={nuevoClienteExterno.observacion}
                                    onChange={(e) =>
                                        setNuevoClienteExterno({
                                            ...nuevoClienteExterno,
                                            observacion: e.target.value
                                        })
                                    }
                                    className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none"
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 border-t border-slate-800 flex items-center justify-end gap-4">

                            <button
                                onClick={() => setAbrirModalClienteExterno(false)}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-3 rounded-xl"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={crearClienteExterno}
                                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg"
                            >
                                Crear cliente
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {abrirModalCobro && facturaParaCobrar && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-2xl font-black text-white mb-2">
                            Cobrar factura
                        </h2>

                        <p className="text-slate-400 mb-5">
                            Factura: {facturaParaCobrar.numeroFactura}
                        </p>

                        <div className="bg-slate-950 rounded-2xl p-4 mb-4 border border-slate-700">
                            <p className="text-slate-400 text-sm">Total a pagar</p>
                            <p className="text-4xl font-black text-emerald-400">
                                ${totalFactura.toFixed(2)}
                            </p>
                        </div>

                        <label className="text-slate-300 font-bold text-sm">
                            Dinero recibido
                        </label>

                        <input
                            type="number"
                            step="0.01"
                            value={montoRecibido}
                            onChange={(e) => setMontoRecibido(e.target.value)}
                            className="w-full mt-2 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xl font-bold"
                            placeholder="Ej: 30.00"
                        />

                        <div className="mt-4 bg-slate-950 rounded-2xl p-4 border border-cyan-500/30">
                            <p className="text-slate-400 text-sm">Cambio a entregar</p>
                            <p className={`text-3xl font-black ${cambio >= 0 ? 'text-cyan-300' : 'text-red-400'}`}>
                                ${cambio >= 0 ? cambio.toFixed(2) : '0.00'}
                            </p>

                            {cambio < 0 && (
                                <p className="text-red-400 text-sm mt-2">
                                    El dinero recibido no alcanza para pagar la factura.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setAbrirModalCobro(false)}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-5 py-3 rounded-xl"
                            >
                                Cerrar
                            </button>

                            <button
                                disabled={cambio < 0}
                                onClick={cobrarFactura}
                                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-black px-6 py-3 rounded-xl"
                            >
                                Cobrar y marcar pagada
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main >
    );
}