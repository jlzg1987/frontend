'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useMemo, useState } from 'react';
import {
    Check,
    CircleCheckBig,
    Clock3,
    Copy,
    FileText,
    FileDown,
    Files,
    PauseCircle,
    TrendingDown,
    TrendingUp,
    UserMinus,
    CalendarDays,
} from 'lucide-react';
import { authHeaders } from '@/src/utils/authHeaders';

type Servicio = {
    servicioId: string;
    clienteId: string;
    planId: string;
    nombres: string;
    apellidos: string;
    cedula: string;
    email: string;
    telefono: string;
    fotoPerfil?: string | null;
    nombrePlan: string;
    velocidadBajada: string;
    velocidadSubida: string;
    precioMensual: number;
    tipoServicio: string;
    fechaInstalacion?: string;
    fechaCorte?: string;
    diaPago: number;
    estadoServicio: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO' | 'PENDIENTE';
    routerId?: string;
    pppSecret?: string;
    queueName?: string;
    ipCliente?: string;
    mac?: string;
    onuId?: string;
    vlan?: string;
    cajaNap?: string;
    senalRx?: string;
    senalTx?: string;
    puertoNap?: string;
    sectorial?: string;
    tipoContrato?: string;
    canalContrato?: string;
    precioInstalacion?: string;
    descuentoInstalacion?: string;
    instalacionGratis: number;
    tiempoContratoMeses?: string;
    cedulaFrontalUrl?: string;
    cedulaPosteriorUrl?: string;
    contratoPdfUrl?: string;
    fechaFirmaContrato?: string;
    torreId?: string;
    sectorialId?: string;
    nodoFibraId?: string;
    napId?: string;
    frecuencia?: string;
    ssid?: string;
    usuarioCpe?: string;
    ipAntena?: string;
    modeloAntena?: string;
    puertoOlt?: string;
    splitter?: string;

    nombreNodoFibra?: string;
    nombreNap?: string;
    nombreTorre?: string;
    nombreSectorial?: string;

    estadoAtencion:
    | 'SIN_ASIGNACION_TECNICO'
    | 'TECNICO_ASIGNADO'
    | 'EN_PROCESO_INSTALACION'
    | 'OPERATIVO'
    | 'REPROGRAMADO'
    | 'CANCELADO';
};
type Sede = {
    sedeId: string;
    nombre: string;
    provincia?: string;
    ciudadCanton?: string;
};

type SedeRouter = {
    sedeRouterId?: string;
    sedeId: string;
    routerMikrotikId: number;
    sedeNombre?: string;
    nombreSede?: string;
    routerNombre?: string;
};

export default function ContratosServiciosPage({
    onAbrirFacturainterna,
    onAbrirPerfilAdministrativo,
}: {
    onAbrirFacturainterna: () => void;
    onAbrirPerfilAdministrativo: (servicioId: string) => void;
}) {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [estadoFiltro, setEstadoFiltro] = useState<
        'TODOS' | Servicio['estadoServicio']
    >('TODOS');
    const [routerFiltro, setRouterFiltro] = useState('');

    const [sedeFiltro, setSedeFiltro] = useState('');
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [sedeRouters, setSedeRouters] = useState<SedeRouter[]>([]);

    const [showModal, setShowModal] = useState(false);


    const [clientes, setClientes] = useState<any[]>([]);
    const [planes, setPlanes] = useState<any[]>([]);
    const [routers, setRouters] = useState<any[]>([]);

    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);

    const [torres, setTorres] = useState<any[]>([]);
    const [sectoriales, setSectoriales] = useState<any[]>([]);
    const [nodosFibra, setNodosFibra] = useState<any[]>([]);
    const [naps, setNaps] = useState<any[]>([]);

    const [modoEdicion, setModoEdicion] = useState(false);
    const [servicioEditandoId, setServicioEditandoId] = useState('');

    const [tipoServicioSeleccionado, setTipoServicioSeleccionado] =
        useState<'FIBRA' | 'RADIO' | 'MIXTO' | ''>('');

    const [showDetalleModal, setShowDetalleModal] = useState(false);

    const [servicioDetalle, setServicioDetalle] =
        useState<Servicio | null>(null);

    const abrirDetalleServicio = (servicio: Servicio) => {
        setServicioDetalle(servicio);
        setShowDetalleModal(true);
    };

    const [idCopiado, setIdCopiado] = useState<
        'SERVICIO' | 'CLIENTE' | 'CEDULA' | null
    >(null);

    const IVA = 0.15;
    const generarReporteServiciosPdf = async () => {
        try {
            const params = new URLSearchParams();

            if (busqueda.trim()) {
                params.append(
                    'buscar',
                    busqueda.trim()
                );
            }

            if (estadoFiltro !== 'TODOS') {
                params.append(
                    'estado',
                    estadoFiltro
                );
            }

            if (sedeFiltro) {
                params.append(
                    'sedeId',
                    sedeFiltro
                );
            }

            if (routerFiltro) {
                params.append(
                    'routerId',
                    routerFiltro
                );
            }

            const res = await fetch(
                `${API_BASE}/cliente-servicio/reporte-pdf?${params.toString()}`,
                {
                    headers: authHeaders(),
                }
            );

            if (!res.ok) {
                const texto = await res.text();

                console.error(
                    'Error reporte PDF:',
                    texto
                );

                alert(
                    'No se pudo generar el reporte'
                );

                return;
            }

            const blob = await res.blob();

            const url =
                URL.createObjectURL(blob);

            window.open(
                url,
                '_blank'
            );

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 60000);

        } catch (error) {
            console.error(
                'Error generando reporte:',
                error
            );

            alert(
                'Error generando reporte PDF'
            );
        }
    };

    const [formData, setFormData] = useState({
        clienteId: '',
        planId: '',
        routerId: '',

        fechaInstalacion: '',
        fechaCorte: '',

        diaPago: '',

        estadoServicio: 'PENDIENTE',

        pppSecret: '',
        queueName: '',
        ipCliente: '',
        mac: '',

        // GPON
        nodoFibraId: '',
        napId: '',

        onuId: '',
        vlan: '',
        puertoOlt: '',
        cajaNap: '',
        splitter: '',

        senalRx: '',
        senalTx: '',

        // WISP
        torreId: '',
        sectorialId: '',

        frecuencia: '',
        ssid: '',
        usuarioCpe: '',
        ipAntena: '',
        modeloAntena: '',
        puertoNap: '',
        sectorial: '',

        tipoContrato: '',
        canalContrato: '',
        precioInstalacion: '',
        descuentoInstalacion: '',
        instalacionGratis: '0',
        tiempoContratoMeses: '',
        cedulaFrontalUrl: '',
        cedulaPosteriorUrl: '',
        contratoPdfUrl: '',
        fechaFirmaContrato: '',
        estadoAtencion: 'SIN_ASIGNACION_TECNICO',
    });

    const limpiarFormulario = () => {
        setFormData({
            clienteId: '',
            planId: '',
            routerId: '',
            fechaInstalacion: '',
            fechaCorte: '',
            diaPago: '',
            estadoServicio: 'PENDIENTE',
            pppSecret: '',
            queueName: '',
            ipCliente: '',
            mac: '',
            nodoFibraId: '',
            napId: '',
            puertoNap: '',
            onuId: '',
            vlan: '',
            puertoOlt: '',
            cajaNap: '',
            splitter: '',
            senalRx: '',
            senalTx: '',
            torreId: '',
            sectorialId: '',
            sectorial: '',
            frecuencia: '',
            ssid: '',
            usuarioCpe: '',
            ipAntena: '',
            modeloAntena: '',
            tipoContrato: '',
            canalContrato: '',
            precioInstalacion: '',
            descuentoInstalacion: '',
            instalacionGratis: '0',
            tiempoContratoMeses: '',
            cedulaFrontalUrl: '',
            cedulaPosteriorUrl: '',
            contratoPdfUrl: '',
            fechaFirmaContrato: '',
            estadoAtencion: 'SIN_ASIGNACION_TECNICO',
        });

        setBusquedaCliente('');
        setClienteSeleccionado(null);
        setTipoServicioSeleccionado('');
        setModoEdicion(false);
        setServicioEditandoId('');
    };

    const cargarSedesFiltro = async () => {
        try {
            const [resSedes, resSedeRouters] = await Promise.all([
                fetch(
                    `${API_BASE}/gastos-mensuales/sedes?incluirInactivas=0`,
                    {
                        headers: authHeaders(),
                    }
                ),

                fetch(
                    `${API_BASE}/gastos-mensuales/sedes-routers`,
                    {
                        headers: authHeaders(),
                    }
                ),
            ]);

            const dataSedes = await resSedes.json();
            const dataSedeRouters = await resSedeRouters.json();

            console.log('SEDES:', dataSedes);
            console.log('SEDE ROUTERS:', dataSedeRouters);

            setSedes(
                Array.isArray(dataSedes.sedes)
                    ? dataSedes.sedes
                    : []
            );

            setSedeRouters(
                Array.isArray(dataSedeRouters.sedeRouters)
                    ? dataSedeRouters.sedeRouters
                    : Array.isArray(dataSedeRouters.routers)
                        ? dataSedeRouters.routers
                        : []
            );

        } catch (error) {
            console.error(
                'Error cargando sedes y routers:',
                error
            );
        }
    };

    const cargarDatosModal = async () => {
        try {

            const [
                resClientes,
                resPlanes,
                resRouters,
                resTorres,
                resNodosFibra,
                resNaps
            ] = await Promise.all([
                fetch(`${API_BASE}/clientes`),
                fetch(`${API_BASE}/planes-internet`),
                fetch(`${API_BASE}/mikrotik/routers`),
                fetch(`${API_BASE}/torres-wisp`),
                fetch(`${API_BASE}/nodos-fibra`),
                fetch(`${API_BASE}/nap-splitter`)
            ]);

            const clientesData = await resClientes.json();
            const planesData = await resPlanes.json();
            const routersData = await resRouters.json();
            const torresData = await resTorres.json();
            const nodosFibraData = await resNodosFibra.json();
            const napsData = await resNaps.json();

            setClientes(clientesData.clientes || []);
            setPlanes(planesData.planes || []);
            setRouters(routersData.routers || []);

            setTorres(torresData.torres || []);
            setNodosFibra(nodosFibraData.nodos || []);
            setNaps(napsData.naps || []);

        } catch (error) {
            console.error('Error cargarDatosModal:', error);
        }
    };
    const cargarSectorialesPorTorre = async (torreId: string) => {
        try {

            const res = await fetch(
                `${API_BASE}/sectoriales-wisp/torre/${torreId}`
            );

            const data = await res.json();

            setSectoriales(data.sectoriales || []);

        } catch (error) {
            console.error(error);
        }
    };

    const abrirModalNuevoServicio = async () => {
        limpiarFormulario();
        await cargarDatosModal();
        setShowModal(true);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const cargarServicios = async () => {
        try {
            setLoading(true);

            const res = await fetch(`${API_BASE}/cliente-servicio`);
            const data = await res.json();

            if (data.ok) {
                setServicios(data.servicios || []);
            }
        } catch (error) {
            console.error('Error cargando servicios:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarRoutersFiltro = async () => {
        try {
            const res = await fetch(`${API_BASE}/mikrotik/routers`);
            const data = await res.json();

            setRouters(data.routers || []);
        } catch (error) {
            console.error('Error cargando routers para el filtro:', error);
        }
    };

    useEffect(() => {
        cargarServicios();
        cargarRoutersFiltro();
        cargarSedesFiltro();
    }, []);

    const obtenerSedePorRouter = (routerId?: string) => {
        if (!routerId) return null;

        const relacion = sedeRouters.find(
            (item) =>
                String(item.routerMikrotikId) ===
                String(routerId)
        );

        if (!relacion) return null;

        const sede = sedes.find(
            (item) =>
                String(item.sedeId) ===
                String(relacion.sedeId)
        );

        if (sede) return sede;

        if (relacion.sedeNombre || relacion.nombreSede) {
            return {
                sedeId: relacion.sedeId,
                nombre:
                    relacion.sedeNombre ||
                    relacion.nombreSede ||
                    'Sede',
            } as Sede;
        }

        return null;
    };

    const obtenerNombreRouter = (routerId?: string) => {
        if (!routerId) return 'No asignado';

        const router = routers.find((item) =>
            String(
                item.routerId ||
                item.RouterId ||
                item.id ||
                ''
            ) === String(routerId)
        );

        return (
            router?.nombre ||
            router?.Nombre ||
            'Router no identificado'
        );
    };

    const serviciosFiltrados = servicios.filter((s) => {

        const texto = `
        ${s.nombres}
        ${s.apellidos}
        ${s.cedula}
        ${s.telefono}
        ${s.email}
        ${s.nombrePlan}
        ${s.pppSecret}
        ${s.ipCliente}
    `.toLowerCase();

        const coincideBusqueda =
            texto.includes(busqueda.toLowerCase());

        const coincideEstado =
            estadoFiltro === 'TODOS' ||
            s.estadoServicio === estadoFiltro;

        const coincideRouter =
            !routerFiltro ||
            String(s.routerId || '') === routerFiltro;

        const relacionSede = sedeRouters.find(
            (item) =>
                String(item.routerMikrotikId) ===
                String(s.routerId || '')
        );

        const coincideSede =
            !sedeFiltro ||
            String(relacionSede?.sedeId || '') ===
            sedeFiltro;

        return (
            coincideBusqueda &&
            coincideEstado &&
            coincideRouter &&
            coincideSede
        );
    });

    const serviciosResumen = useMemo(() => {

        return servicios.filter((servicio) => {

            const coincideRouter =
                !routerFiltro ||
                String(servicio.routerId || '') ===
                routerFiltro;

            const relacionSede = sedeRouters.find(
                (item) =>
                    String(item.routerMikrotikId) ===
                    String(servicio.routerId || '')
            );

            const coincideSede =
                !sedeFiltro ||
                String(relacionSede?.sedeId || '') ===
                sedeFiltro;

            return coincideRouter && coincideSede;
        });

    }, [
        servicios,
        routerFiltro,
        sedeFiltro,
        sedeRouters
    ]);

    const resumenContratos = useMemo(() => {
        const resumen = {
            total: serviciosResumen.length,
            ACTIVO: { cantidad: 0, subtotal: 0 },
            SUSPENDIDO: { cantidad: 0, subtotal: 0 },
            RETIRADO: { cantidad: 0, subtotal: 0 },
            PENDIENTE: { cantidad: 0, subtotal: 0 },
        };

        serviciosResumen.forEach((servicio) => {
            const estado = servicio.estadoServicio;

            if (resumen[estado]) {
                resumen[estado].cantidad += 1;
                resumen[estado].subtotal += Number(servicio.precioMensual || 0);
            }
        });

        return resumen;
    }, [serviciosResumen]);

    const nombreRouterSeleccionado = useMemo(() => {
        if (!routerFiltro) return 'Todos los routers';

        const router = routers.find((item) =>
            String(item.routerId || item.RouterId || item.id || '') === routerFiltro
        );

        return router?.nombre || router?.Nombre || 'Router seleccionado';
    }, [routers, routerFiltro]);

    const nombreSedeSeleccionada = useMemo(() => {
        if (!sedeFiltro) return 'Todas las sedes';

        const sede = sedes.find(
            (item) =>
                String(item.sedeId) ===
                String(sedeFiltro)
        );

        return sede?.nombre || 'Sede seleccionada';
    }, [sedes, sedeFiltro]);

    const formatearDinero = (valor: number) =>
        new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(valor);

    const obtenerValores = (subtotal: number) => ({
        subtotal,
        iva: subtotal * IVA,
        total: subtotal * (1 + IVA),
    });

    const tarjetasEstado = [
        {
            titulo: 'Total contratos',
            estado: 'TODOS' as const,
            valor: resumenContratos.total,
            detalle: 'Todos los contratos registrados',
            color: '#38bdf8',
            fondo: 'linear-gradient(145deg, rgba(14,165,233,0.22), rgba(2,132,199,0.06))',
            icono: Files,
        },
        {
            titulo: 'Activos',
            estado: 'ACTIVO' as const,
            valor: resumenContratos.ACTIVO.cantidad,
            detalle: 'Servicios que generan ingresos',
            color: '#4ade80',
            fondo: 'linear-gradient(145deg, rgba(34,197,94,0.22), rgba(22,163,74,0.06))',
            icono: CircleCheckBig,
        },
        {
            titulo: 'Suspendidos',
            estado: 'SUSPENDIDO' as const,
            valor: resumenContratos.SUSPENDIDO.cantidad,
            detalle: 'Servicios suspendidos',
            color: '#fb7185',
            fondo: 'linear-gradient(145deg, rgba(244,63,94,0.22), rgba(190,18,60,0.06))',
            icono: PauseCircle,
        },
        {
            titulo: 'Retirados',
            estado: 'RETIRADO' as const,
            valor: resumenContratos.RETIRADO.cantidad,
            detalle: 'Contratos fuera de servicio',
            color: '#cbd5e1',
            fondo: 'linear-gradient(145deg, rgba(100,116,139,0.24), rgba(51,65,85,0.08))',
            icono: UserMinus,
        },
        {
            titulo: 'Pendientes',
            estado: 'PENDIENTE' as const,
            valor: resumenContratos.PENDIENTE.cantidad,
            detalle: 'Pendientes de activación',
            color: '#fbbf24',
            fondo: 'linear-gradient(145deg, rgba(245,158,11,0.22), rgba(217,119,6,0.06))',
            icono: Clock3,
        },
    ];

    const tarjetasFinancieras = [
        {
            titulo: 'Ingreso mensual activo',
            descripcion: 'Ganancia de contratos activos',
            valores: obtenerValores(resumenContratos.ACTIVO.subtotal),
            color: '#4ade80',
            fondo: 'linear-gradient(145deg, rgba(22,163,74,0.19), rgba(5,46,22,0.25))',
            icono: TrendingUp,
        },
        {
            titulo: 'Pérdida por suspendidos',
            descripcion: 'Valor mensual que no se está cobrando',
            valores: obtenerValores(resumenContratos.SUSPENDIDO.subtotal),
            color: '#fb7185',
            fondo: 'linear-gradient(145deg, rgba(225,29,72,0.19), rgba(76,5,25,0.25))',
            icono: TrendingDown,
        },
        {
            titulo: 'Pérdida por retirados',
            descripcion: 'Valor mensual de contratos retirados',
            valores: obtenerValores(resumenContratos.RETIRADO.subtotal),
            color: '#cbd5e1',
            fondo: 'linear-gradient(145deg, rgba(100,116,139,0.20), rgba(30,41,59,0.28))',
            icono: TrendingDown,
        },
        {
            titulo: 'Ingreso pendiente',
            descripcion: 'Proyección de contratos por activar',
            valores: obtenerValores(resumenContratos.PENDIENTE.subtotal),
            color: '#fbbf24',
            fondo: 'linear-gradient(145deg, rgba(217,119,6,0.19), rgba(69,26,3,0.25))',
            icono: Clock3,
        },
    ];

    const colorEstado = (estado: string) => {
        switch (estado) {
            case 'ACTIVO':
                return '#16a34a';
            case 'SUSPENDIDO':
                return '#dc2626';
            case 'RETIRADO':
                return '#6b7280';
            default:
                return '#f59e0b';
        }
    };
    const colorEstadoAtencion = (estado: string) => {
        switch (estado) {

            case 'SIN_ASIGNACION_TECNICO':
                return '#f59e0b';

            case 'TECNICO_ASIGNADO':
                return '#2563eb';

            case 'EN_PROCESO_INSTALACION':
                return '#7c3aed';

            case 'OPERATIVO':
                return '#16a34a';

            case 'REPROGRAMADO':
                return '#ea580c';

            case 'CANCELADO':
                return '#dc2626';

            default:
                '#475569';
        }
    };
    const clientesFiltrados = clientes.filter((c) => {
        const texto = `${c.nombres} ${c.apellidos} ${c.cedula} ${c.telefono} ${c.email}`.toLowerCase();
        return texto.includes(busquedaCliente.toLowerCase());
    })
        .slice(0, 8);
    const guardarServicio = async () => {
        try {
            if (!formData.clienteId || !formData.planId || !formData.diaPago) {
                alert('Cliente, plan y día de pago son obligatorios');
                return;
            }

            const url = modoEdicion
                ? `${API_BASE}/cliente-servicio/${servicioEditandoId}`
                : `${API_BASE}/cliente-servicio`;

            const method = modoEdicion ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo guardar el servicio');
                return;
            }

            alert(
                modoEdicion
                    ? 'Servicio actualizado correctamente'
                    : 'Servicio guardado correctamente'
            );

            setShowModal(false);
            limpiarFormulario();
            cargarServicios();

        } catch (error) {
            console.error('Error guardando servicio:', error);
            alert('Error al guardar el servicio');
        }
    };

    const abrirModalEditarServicio = async (servicio: Servicio) => {
        await cargarDatosModal();

        setModoEdicion(true);
        setServicioEditandoId(servicio.servicioId);

        setBusquedaCliente(
            `${servicio.nombres || ''} ${servicio.apellidos || ''} - ${servicio.cedula || ''}`
        );

        setClienteSeleccionado({
            clienteId: servicio.clienteId,
            nombres: servicio.nombres,
            apellidos: servicio.apellidos,
            cedula: servicio.cedula,
        });

        setTipoServicioSeleccionado(
            (servicio.tipoServicio as 'FIBRA' | 'RADIO' | 'MIXTO') || ''
        );

        if (servicio.torreId) {
            await cargarSectorialesPorTorre(servicio.torreId);
        }

        setFormData({
            clienteId: servicio.clienteId || '',
            planId: servicio.planId || '',
            routerId: servicio.routerId || '',
            fechaInstalacion: servicio.fechaInstalacion?.substring(0, 10) || '',
            fechaCorte: servicio.fechaCorte?.substring(0, 10) || '',
            diaPago: servicio.diaPago?.toString() || '',
            estadoServicio: servicio.estadoServicio || 'PENDIENTE',
            pppSecret: servicio.pppSecret || '',
            queueName: servicio.queueName || '',
            ipCliente: servicio.ipCliente || '',
            mac: servicio.mac || '',
            nodoFibraId: servicio.nodoFibraId || '',
            napId: servicio.napId || '',
            puertoNap: servicio.puertoNap || '',
            onuId: servicio.onuId || '',
            vlan: servicio.vlan || '',
            puertoOlt: servicio.puertoOlt || '',
            cajaNap: servicio.cajaNap || '',
            splitter: servicio.splitter || '',
            senalRx: servicio.senalRx || '',
            senalTx: servicio.senalTx || '',
            torreId: servicio.torreId || '',
            sectorialId: servicio.sectorialId || '',
            sectorial: servicio.sectorial || '',
            frecuencia: servicio.frecuencia || '',
            ssid: servicio.ssid || '',
            usuarioCpe: servicio.usuarioCpe || '',
            ipAntena: servicio.ipAntena || '',
            modeloAntena: servicio.modeloAntena || '',
            tipoContrato: servicio.tipoContrato || '',
            canalContrato: servicio.canalContrato || '',
            precioInstalacion: servicio.precioInstalacion?.toString() || '',
            descuentoInstalacion: servicio.descuentoInstalacion?.toString() || '',
            instalacionGratis: servicio.instalacionGratis?.toString() || '0',
            tiempoContratoMeses: servicio.tiempoContratoMeses?.toString() || '',
            cedulaFrontalUrl: servicio.cedulaFrontalUrl || '',
            cedulaPosteriorUrl: servicio.cedulaPosteriorUrl || '',
            contratoPdfUrl: servicio.contratoPdfUrl || '',
            fechaFirmaContrato: servicio.fechaFirmaContrato?.substring(0, 10) || '',
            estadoAtencion: 'SIN_ASIGNACION_TECNICO',
        });

        setShowModal(true);
    };

    const cambiarEstadoServicio = async (
        servicioId: string,
        nuevoEstado: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO' | 'PENDIENTE'
    ) => {
        try {
            const confirmar = confirm(`¿Seguro que deseas cambiar el servicio a ${nuevoEstado}?`);

            if (!confirmar) return;

            const res = await fetch(`${API_BASE}/cliente-servicio/${servicioId}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    estadoServicio: nuevoEstado,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo cambiar el estado');
                return;
            }

            alert('Estado actualizado correctamente');
            cargarServicios();

        } catch (error) {
            console.error('Error cambiando estado:', error);
            alert('Error al cambiar estado del servicio');
        }
    };

    const eliminarServicioCliente = async (servicioId: string) => {
        try {
            const confirmar = confirm(
                '¿Seguro que deseas eliminar este servicio? Esta acción no se puede deshacer.'
            );

            if (!confirmar) return;

            const res = await fetch(`${API_BASE}/cliente-servicio/${servicioId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo eliminar el servicio');
                return;
            }

            alert('Servicio eliminado correctamente');
            cargarServicios();

        } catch (error) {
            console.error('Error eliminando servicio:', error);
            alert('Error al eliminar el servicio');
        }
    };
    const abrirContratoPdf = (servicio: Servicio) => {
        window.open(
            `${API_BASE}/cliente-servicio/${servicio.servicioId}/contrato-pdf`,
            '_blank'
        );
    };

    const abrirFacturacion = (servicio: Servicio, tipo: 'INTERNA' | 'SRI') => {
        alert(
            tipo === 'INTERNA'
                ? 'Facturación interna pendiente de implementar'
                : 'Facturación SRI pendiente de implementar'
        );

        console.log('Servicio para facturación:', tipo, servicio);
    };

    const formatearFecha = (fecha?: string | null) => {
        if (!fecha) return 'No definido';

        return new Date(fecha).toLocaleDateString('es-EC', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const abrirAutorizacionInstalacion = (servicio: Servicio) => {
        window.open(
            `${API_BASE}/cliente-servicio/${servicio.servicioId}/autorizacion-instalacion-pdf`,
            '_blank'
        );
    };
    const abrirFichaTecnicaPdf = (servicio: Servicio) => {
        window.open(
            `${API_BASE}/cliente-servicio/${servicio.servicioId}/ficha-tecnica-pdf`,
            '_blank'
        );
    };

    const copiarAlPortapapeles = async (
        texto: string,
        tipo: 'SERVICIO' | 'CLIENTE' | 'CEDULA'
    ) => {
        try {
            await navigator.clipboard.writeText(texto);

            setIdCopiado(tipo);

            setTimeout(() => {
                setIdCopiado(null);
            }, 1500);
        } catch (error) {
            console.error('Error al copiar:', error);
            alert('No se pudo copiar');
        }
    };


    return (
        <main style={styles.page}>


            <section style={styles.summarySection}>
                <div style={styles.summaryHeader}>
                    <div>
                        <p style={styles.summarySubtitle}>
                            Estado general:{' '}
                            <strong style={styles.summaryRouterName}>
                                {nombreSedeSeleccionada}
                            </strong>
                            {' · '}
                            <strong style={styles.summaryRouterName}>
                                {nombreRouterSeleccionado}
                            </strong>
                        </p>
                    </div>
                </div>

                <div style={styles.statusSummaryGrid}>
                    {tarjetasEstado.map((tarjeta) => {
                        const Icono = tarjeta.icono;

                        return (
                            <button
                                type="button"
                                key={tarjeta.titulo}
                                onClick={() => setEstadoFiltro(tarjeta.estado)}
                                aria-pressed={estadoFiltro === tarjeta.estado}
                                style={{
                                    ...styles.statusSummaryCard,
                                    background: tarjeta.fondo,
                                    borderColor:
                                        estadoFiltro === tarjeta.estado
                                            ? tarjeta.color
                                            : `${tarjeta.color}38`,
                                    boxShadow:
                                        estadoFiltro === tarjeta.estado
                                            ? `0 0 0 2px ${tarjeta.color}25, 0 16px 34px rgba(0,0,0,0.28)`
                                            : styles.statusSummaryCard.boxShadow,
                                    transform:
                                        estadoFiltro === tarjeta.estado
                                            ? 'translateY(-2px)'
                                            : 'translateY(0)',
                                }}
                            >
                                <div
                                    style={{
                                        ...styles.summaryIcon,
                                        color: tarjeta.color,
                                        background: `${tarjeta.color}18`,
                                        borderColor: `${tarjeta.color}30`,
                                    }}
                                >
                                    <Icono size={22} />
                                </div>
                                <div>
                                    <p style={styles.summaryCardLabel}>{tarjeta.titulo}</p>
                                    <strong style={{ ...styles.summaryCardValue, color: tarjeta.color }}>
                                        {tarjeta.valor}
                                    </strong>
                                    <p style={styles.summaryCardDetail}>{tarjeta.detalle}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div style={styles.financialSummaryGrid}>
                    {tarjetasFinancieras.map((tarjeta) => {
                        const Icono = tarjeta.icono;

                        return (
                            <article
                                key={tarjeta.titulo}
                                style={{
                                    ...styles.financialCard,
                                    background: tarjeta.fondo,
                                    borderColor: `${tarjeta.color}35`,
                                }}
                            >
                                <div style={styles.financialCardHeader}>
                                    <div>
                                        <p style={{ ...styles.financialTitle, color: tarjeta.color }}>
                                            {tarjeta.titulo}
                                        </p>
                                        <p style={styles.financialDescription}>{tarjeta.descripcion}</p>
                                    </div>
                                    <div
                                        style={{
                                            ...styles.summaryIcon,
                                            color: tarjeta.color,
                                            background: `${tarjeta.color}18`,
                                            borderColor: `${tarjeta.color}30`,
                                        }}
                                    >
                                        <Icono size={22} />
                                    </div>
                                </div>

                                <div style={styles.financialRows}>
                                    <div style={styles.financialRow}>
                                        <span>Subtotal sin IVA</span>
                                        <strong>{formatearDinero(tarjeta.valores.subtotal)}</strong>
                                    </div>
                                    <div style={styles.financialRow}>
                                        <span>IVA (15 %)</span>
                                        <strong>{formatearDinero(tarjeta.valores.iva)}</strong>
                                    </div>
                                    <div style={styles.financialTotalRow}>
                                        <span>Total con IVA</span>
                                        <strong style={{ color: tarjeta.color }}>
                                            {formatearDinero(tarjeta.valores.total)}
                                        </strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
            <section style={styles.header}>

                <button style={styles.primaryButton}

                    onClick={abrirModalNuevoServicio}
                >
                    + Nuevo servicio
                </button>

                <button
                    type="button"
                    style={{
                        ...styles.primaryButton,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background:
                            'linear-gradient(135deg, #0891b2, #2563eb)',
                    }}
                    onClick={generarReporteServiciosPdf}
                >
                    <FileDown size={18} />

                    Reporte PDF
                </button>
            </section>
            <section style={styles.filters}>
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por cliente, cédula, teléfono, plan, PPPoE o IP..."
                    style={styles.searchInput}
                />

                <select
                    value={sedeFiltro}
                    onChange={(e) => {
                        setSedeFiltro(e.target.value);
                    }}
                    style={styles.filterSelect}
                    aria-label="Filtrar contratos por sede"
                >
                    <option value="" style={styles.option}>
                        Todas las sedes
                    </option>

                    {sedes.map((sede) => (
                        <option
                            key={sede.sedeId}
                            value={sede.sedeId}
                            style={styles.option}
                        >
                            {sede.nombre}
                        </option>
                    ))}
                </select>

                <select
                    value={routerFiltro}
                    onChange={(e) => setRouterFiltro(e.target.value)}
                    style={styles.filterSelect}
                    aria-label="Filtrar contratos por router"
                >
                    <option value="" style={styles.option}>
                        Todos los routers
                    </option>

                    {routers.map((router, index) => {
                        const id =
                            router.routerId ||
                            router.RouterId ||
                            router.id;

                        const nombre =
                            router.nombre ||
                            router.Nombre ||
                            'Router';

                        return (
                            <option
                                key={id || index}
                                value={String(id || '')}
                                style={styles.option}
                            >
                                {nombre}
                            </option>
                        );
                    })}
                </select>

                {(
                    estadoFiltro !== 'TODOS' ||
                    routerFiltro ||
                    sedeFiltro ||
                    busqueda
                ) && (
                        <button
                            type="button"
                            style={styles.clearFiltersButton}
                            onClick={() => {
                                setEstadoFiltro('TODOS');
                                setRouterFiltro('');
                                setSedeFiltro('');
                                setBusqueda('');
                            }}
                        >
                            Limpiar filtros
                        </button>
                    )}
            </section>

            {!loading && (
                <p style={styles.resultsCount}>
                    Mostrando <strong>{serviciosFiltrados.length}</strong> de{' '}
                    <strong>{servicios.length}</strong> contratos
                </p>
            )}

            {loading ? (
                <p style={styles.loading}>Cargando servicios...</p>
            ) : (
                <section style={styles.grid}>
                    {serviciosFiltrados.map((servicio) => {
                        const tipoPlan = String(servicio.tipoServicio || '').toUpperCase();

                        const esFibra = tipoPlan === 'FIBRA' || tipoPlan === 'MIXTO';
                        const esWisp = tipoPlan === 'RADIO' || tipoPlan === 'WISP' || tipoPlan === 'MIXTO';
                        return (
                            <article key={servicio.servicioId} style={styles.card}>
                                <div style={styles.cardTop}>
                                    {servicio.fotoPerfil ? (
                                        <img
                                            src={servicio.fotoPerfil}
                                            alt={`${servicio.nombres} ${servicio.apellidos}`}
                                            style={styles.avatarImg}
                                        />
                                    ) : (
                                        <div style={styles.avatarFallback}>
                                            {servicio.nombres?.charAt(0)?.toUpperCase() || 'C'}
                                        </div>
                                    )}

                                    <div>
                                        <h3 style={styles.clientName}>
                                            {servicio.nombres} {servicio.apellidos}
                                        </h3>
                                        <div style={styles.cedulaRow}>
                                            <p style={styles.smallText}>
                                                Cédula: {servicio.cedula}
                                            </p>

                                            <button
                                                type="button"
                                                title="Copiar cédula"
                                                aria-label="Copiar cédula"
                                                style={{
                                                    ...styles.copyCedulaButton,
                                                    ...(idCopiado === 'CEDULA'
                                                        ? styles.copyButtonSuccess
                                                        : {}),
                                                }}
                                                onClick={() =>
                                                    copiarAlPortapapeles(
                                                        servicio.cedula,
                                                        'CEDULA'
                                                    )
                                                }
                                            >
                                                {idCopiado === 'CEDULA' ? (
                                                    <Check size={14} />
                                                ) : (
                                                    <Copy size={14} />
                                                )}
                                            </button>
                                        </div>
                                        <p style={styles.smallText}>Tel: {servicio.telefono}</p>
                                    </div>
                                </div>

                                <div style={styles.statusRow}>
                                    <span
                                        style={{
                                            ...styles.badge,
                                            backgroundColor: colorEstado(servicio.estadoServicio),
                                        }}
                                    >
                                        {servicio.estadoServicio}
                                    </span>

                                    <span style={styles.typeBadge}>
                                        {servicio.tipoServicio}
                                    </span>
                                    <span style={{
                                        ...styles.badge,
                                        backgroundColor: colorEstadoAtencion(servicio.estadoAtencion),
                                    }}>
                                        {servicio.estadoAtencion}
                                    </span>
                                </div>


                                <div style={styles.infoBox}>
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                            gap: '8px 6px',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            alignItems: 'start',
                                            marginBottom: 5,
                                        }}
                                    >
                                        {/* PLAN */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#ca9a33',
                                                }}
                                            >
                                                Plan
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    fontSize: '11px',
                                                    color: '#e2e8f0',
                                                    overflowWrap: 'anywhere',
                                                }}
                                            >
                                                {servicio.nombrePlan || 'Sin plan'}
                                            </strong>
                                        </div>

                                        {/* TIPO */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                                borderLeft: '1px solid rgba(148, 163, 184, 0.12)',
                                                borderRight: '1px solid rgba(148, 163, 184, 0.12)',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                Tipo
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    fontSize: '11px',
                                                    color: '#e2e8f0',
                                                    overflowWrap: 'anywhere',
                                                }}
                                            >
                                                {servicio.tipoServicio || '-'}
                                            </strong>
                                        </div>

                                        {/* IP */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                IP
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    fontSize: '11px',
                                                    color: '#e2e8f0',
                                                    overflowWrap: 'anywhere',
                                                }}
                                            >
                                                {servicio.ipCliente || 'No asignada'}
                                            </strong>
                                        </div>

                                        {/* DÍA PAGO */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                Día pago
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    fontSize: '11px',
                                                    color: '#e2e8f0',
                                                }}
                                            >
                                                {servicio.diaPago || '-'}
                                            </strong>
                                        </div>

                                        {/* SEDE */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                                borderLeft: '1px solid rgba(148, 163, 184, 0.12)',
                                                borderRight: '1px solid rgba(148, 163, 184, 0.12)',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#67e8f9',
                                                }}
                                            >
                                                Sede
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    fontSize: '11px',
                                                    color: '#e2e8f0',
                                                    overflowWrap: 'anywhere',
                                                }}
                                            >
                                                {obtenerSedePorRouter(servicio.routerId)?.nombre ||
                                                    'Sin sede asignada'}
                                            </strong>
                                        </div>

                                        {/* ROUTER */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#93c5fd',
                                                }}
                                            >
                                                Router
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    fontSize: '10px',
                                                    lineHeight: '13px',
                                                    color: '#e2e8f0',

                                                    // Evita que nombres largos salgan de la card
                                                    overflowWrap: 'anywhere',
                                                    wordBreak: 'break-word',
                                                    maxWidth: '100%',
                                                }}
                                            >
                                                {obtenerNombreRouter(servicio.routerId)}
                                            </strong>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                            gap: '6px',
                                            width: '100%',
                                            boxSizing: 'border-box',

                                            background: 'rgba(34, 211, 238, 0.06)',
                                            border: '1px solid rgba(34, 211, 238, 0.14)',
                                            borderRadius: '10px',
                                            padding: '8px 10px',
                                            marginBottom: 10
                                        }}
                                    >
                                        {/* SUBTOTAL */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#94a3b8',
                                                }}
                                            >
                                                Subtotal
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    color: '#e2e8f0',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                ${Number(servicio.precioMensual || 0).toFixed(2)}
                                            </strong>
                                        </div>

                                        {/* IVA */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                                borderLeft: '1px solid rgba(148, 163, 184, 0.15)',
                                                borderRight: '1px solid rgba(148, 163, 184, 0.15)',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#fbbf24',
                                                }}
                                            >
                                                IVA 15%
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    color: '#fbbf24',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                ${(Number(servicio.precioMensual || 0) * 0.15).toFixed(2)}
                                            </strong>
                                        </div>

                                        {/* TOTAL */}
                                        <div
                                            style={{
                                                minWidth: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: '10px',
                                                    color: '#4ade80',
                                                }}
                                            >
                                                Precio final
                                            </p>

                                            <strong
                                                style={{
                                                    display: 'block',
                                                    marginTop: '2px',
                                                    color: '#4ade80',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                ${(Number(servicio.precioMensual || 0) * 1.15).toFixed(2)}
                                            </strong>
                                        </div>
                                    </div>
                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => abrirDetalleServicio(servicio)}
                                    >
                                        Ver detalle
                                    </button>
                                    <button
                                        style={{
                                            ...styles.secondaryButton,
                                            background: '#0891b2',
                                            color: '#fff',
                                            marginLeft: 10,
                                        }}
                                        onClick={() =>
                                            onAbrirPerfilAdministrativo(servicio.servicioId)
                                        }
                                    >
                                        Perfil Admin
                                    </button>
                                </div>

                                <p><strong>Estado:</strong></p>
                                <div style={styles.actions}>

                                    <button
                                        style={styles.warningButton}
                                        onClick={() =>
                                            cambiarEstadoServicio(
                                                servicio.servicioId,
                                                servicio.estadoServicio === 'PENDIENTE' ? 'ACTIVO' : 'SUSPENDIDO'
                                            )
                                        }
                                    >
                                        {servicio.estadoServicio === 'PENDIENTE' ? 'Activar' : 'Suspender'}
                                    </button>

                                    <button
                                        style={styles.dangerButton}
                                        onClick={() => cambiarEstadoServicio(servicio.servicioId, 'RETIRADO')}
                                    >
                                        Retirar
                                    </button>
                                    {servicio.estadoServicio === 'RETIRADO' && (
                                        <button
                                            style={{
                                                ...styles.secondaryButton,
                                                background: '#16A34A',
                                                color: '#fff',
                                            }}
                                            onClick={() =>
                                                cambiarEstadoServicio(
                                                    servicio.servicioId,
                                                    'ACTIVO'
                                                )
                                            }
                                        >
                                            Reconexión
                                        </button>
                                    )}
                                </div>

                                <p><strong>Documnetacion PDF/ imprimir:</strong></p>
                                <div style={styles.actions}>

                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => abrirContratoPdf(servicio)}
                                    >
                                        Contrato
                                    </button>
                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() =>
                                            abrirAutorizacionInstalacion(servicio)
                                        }
                                    >
                                        Autorización
                                    </button>
                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => abrirFichaTecnicaPdf(servicio)}
                                    >
                                        Ficha técnica
                                    </button>

                                </div>


                                <p><strong>Acción:</strong></p>
                                <div style={styles.actions}>

                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => abrirModalEditarServicio(servicio)}
                                    >
                                        Editar
                                    </button>

                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => onAbrirFacturainterna()}
                                    >
                                        Fact. inter
                                    </button>

                                    <button
                                        style={styles.dangerButton}
                                        onClick={() => eliminarServicioCliente(servicio.servicioId)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        )
                    }
                    )}
                </section>
            )
            }

            {
                showModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modal}>
                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>
                                    {modoEdicion ? 'Editar Servicio ISP' : 'Nuevo Servicio ISP'}
                                </h2>

                                <button
                                    style={styles.closeButton}
                                    onClick={() => {
                                        setShowModal(false);
                                        limpiarFormulario();
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={styles.modalBody}>

                                {/* CLIENTE */}
                                <div style={styles.autocompleteBox}>
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente por nombre, cédula, teléfono o email..."
                                        value={busquedaCliente}
                                        onChange={(e) => {
                                            setBusquedaCliente(e.target.value);
                                            setClienteSeleccionado(null);

                                            setFormData({
                                                ...formData,
                                                clienteId: '',
                                            });
                                        }}
                                        style={styles.input}
                                    />

                                    {busquedaCliente && !clienteSeleccionado && (
                                        <div style={styles.resultadosClientes}>
                                            {clientesFiltrados.map((c) => (
                                                <button
                                                    key={c.clienteId}
                                                    type="button"
                                                    style={styles.clienteResultado}
                                                    onClick={() => {
                                                        setClienteSeleccionado(c);

                                                        setBusquedaCliente(
                                                            `${c.nombres} ${c.apellidos} - ${c.cedula}`
                                                        );

                                                        setFormData({
                                                            ...formData,
                                                            clienteId: c.clienteId,
                                                        });
                                                    }}
                                                >
                                                    <div>
                                                        <strong>
                                                            {c.nombres} {c.apellidos}
                                                        </strong>

                                                        <div style={styles.smallText}>
                                                            {c.cedula}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {clienteSeleccionado && (
                                        <div style={styles.clienteSeleccionado}>
                                            Cliente seleccionado:{' '}
                                            <strong>
                                                {clienteSeleccionado.nombres}{' '}
                                                {clienteSeleccionado.apellidos}
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                {/* PLAN */}
                                <select
                                    value={formData.planId}
                                    onChange={(e) => {
                                        const planId = e.target.value;

                                        const planSeleccionado = planes.find(
                                            (p) => p.planId === planId
                                        );

                                        const tipo =
                                            planSeleccionado?.tipoServicio || '';

                                        setTipoServicioSeleccionado(tipo);

                                        setFormData({
                                            ...formData,
                                            planId,

                                            ...(tipo === 'RADIO' && {
                                                nodoFibraId: '',
                                                napId: '',
                                                puertoNap: '',
                                                onuId: '',
                                                vlan: '',
                                                puertoOlt: '',
                                                cajaNap: '',
                                                splitter: '',
                                                senalRx: '',
                                                senalTx: '',
                                            }),

                                            ...(tipo === 'FIBRA' && {
                                                torreId: '',
                                                sectorialId: '',
                                                sectorial: '',
                                                frecuencia: '',
                                                ssid: '',
                                                usuarioCpe: '',
                                                ipAntena: '',
                                                modeloAntena: '',
                                            }),
                                        });
                                    }}
                                    style={styles.input}
                                >
                                    <option value="" style={styles.option}>
                                        Seleccionar plan
                                    </option>

                                    {planes.map((p) => {
                                        const precioBase = Number(p.precioMensual || 0);
                                        const valorIva = precioBase * IVA;
                                        const precioConIva = precioBase + valorIva;

                                        return (
                                            <option
                                                key={p.planId}
                                                value={p.planId}
                                                style={styles.option}
                                            >
                                                {p.nombrePlan} - {p.tipoServicio}
                                                {' | '}
                                                Base: ${precioBase.toFixed(2)}
                                                {' | '}
                                                IVA: ${valorIva.toFixed(2)}
                                                {' | '}
                                                Total: ${precioConIva.toFixed(2)}
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* ROUTER */}
                                <select
                                    name="routerId"
                                    value={formData.routerId}
                                    onChange={handleChange}
                                    style={styles.input}
                                >
                                    <option value="" style={styles.option}>
                                        Seleccionar router
                                    </option>

                                    {routers.map((r, index) => {
                                        const id =
                                            r.routerId ||
                                            r.RouterId ||
                                            r.id;

                                        const nombre =
                                            r.nombre ||
                                            r.Nombre ||
                                            'Router';

                                        return (
                                            <option
                                                key={id || index}
                                                value={id || ''}
                                                style={styles.option}
                                            >
                                                {nombre}
                                            </option>
                                        );
                                    })}
                                </select>

                                {/* Dias d epago */}
                                <input
                                    placeholder="Día de pago"
                                    name="diaPago"
                                    value={formData.diaPago}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                                {/* FECHAS */}
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Fecha de firma del contrato
                                    </label>

                                    <div style={styles.dateInputWrapper}>
                                        <input
                                            type="date"
                                            name="fechaFirmaContrato"
                                            value={formData.fechaFirmaContrato}
                                            onChange={handleChange}
                                            style={styles.inputDate}
                                            className="inputDateCustom"
                                        />

                                        <CalendarDays
                                            size={19}
                                            style={styles.dateIcon}
                                        />
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>
                                        Fecha de Instalación
                                    </label>

                                    <div style={styles.dateInputWrapper}>
                                        <input
                                            type="date"
                                            name="fechaInstalacion"
                                            value={formData.fechaInstalacion}
                                            onChange={handleChange}
                                            style={styles.inputDate}
                                            className="inputDateCustom"
                                        />

                                        <CalendarDays
                                            size={19}
                                            style={styles.dateIcon}
                                        />
                                    </div>
                                </div>

                                {/* WISP */}
                                {(tipoServicioSeleccionado === 'RADIO' ||
                                    tipoServicioSeleccionado === 'MIXTO') && (
                                        <>
                                            <div style={styles.sectionLabel}>
                                                📶 Configuración WISP
                                            </div>

                                            <select
                                                value={formData.torreId}
                                                onChange={async (e) => {

                                                    const torreId = e.target.value;

                                                    setFormData({
                                                        ...formData,
                                                        torreId,
                                                        sectorialId: '',
                                                    });

                                                    await cargarSectorialesPorTorre(torreId);
                                                }}
                                                style={styles.input}
                                            >
                                                <option value="" style={styles.option}>
                                                    Seleccionar torre
                                                </option>

                                                {torres.map((t) => (
                                                    <option
                                                        key={t.torreId}
                                                        value={t.torreId}
                                                        style={styles.option}
                                                    >
                                                        {t.nombreTorre}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={formData.sectorialId}
                                                onChange={(e) => {

                                                    const sectorialId = e.target.value;

                                                    const sectorialSeleccionada =
                                                        sectoriales.find(
                                                            (s) =>
                                                                s.sectorialId ===
                                                                sectorialId
                                                        );

                                                    setFormData({
                                                        ...formData,
                                                        sectorialId,
                                                        sectorial:
                                                            sectorialSeleccionada?.nombreSectorial || '',
                                                        frecuencia:
                                                            sectorialSeleccionada?.frecuencia || '',
                                                        ssid:
                                                            sectorialSeleccionada?.ssid || '',
                                                    });
                                                }}
                                                style={styles.input}
                                            >
                                                <option value="" style={styles.option}>
                                                    Seleccionar sectorial
                                                </option>

                                                {sectoriales.map((s) => (
                                                    <option
                                                        key={s.sectorialId}
                                                        value={s.sectorialId}
                                                        style={styles.option}
                                                    >
                                                        {s.nombreSectorial}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                placeholder="Frecuencia"
                                                name="frecuencia"
                                                value={formData.frecuencia}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="SSID"
                                                name="ssid"
                                                value={formData.ssid}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="Usuario CPE"
                                                name="usuarioCpe"
                                                value={formData.usuarioCpe}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="IP Antena"
                                                name="ipAntena"
                                                value={formData.ipAntena}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="Modelo Antena"
                                                name="modeloAntena"
                                                value={formData.modeloAntena}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />
                                        </>
                                    )}

                                {/* FIBRA */}
                                {(tipoServicioSeleccionado === 'FIBRA' ||
                                    tipoServicioSeleccionado === 'MIXTO') && (
                                        <>
                                            <div style={styles.sectionLabel}>
                                                🔌 Configuración GPON / Fibra
                                            </div>

                                            <select
                                                name="nodoFibraId"
                                                value={formData.nodoFibraId}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                <option value="" style={styles.option}>
                                                    Seleccionar nodo fibra
                                                </option>

                                                {nodosFibra.map((n) => (
                                                    <option
                                                        key={n.nodoFibraId}
                                                        value={n.nodoFibraId}
                                                        style={styles.option}
                                                    >
                                                        {n.nombreNodo}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                name="napId"
                                                value={formData.napId}
                                                onChange={handleChange}
                                                style={styles.input}
                                            >
                                                <option value="" style={styles.option}>
                                                    Seleccionar NAP
                                                </option>

                                                {naps.map((n) => (
                                                    <option
                                                        key={n.napId}
                                                        value={n.napId}
                                                        style={styles.option}
                                                    >
                                                        {n.nombreNap}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                placeholder="ONU ID"
                                                name="onuId"
                                                value={formData.onuId}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="VLAN"
                                                name="vlan"
                                                value={formData.vlan}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="Puerto OLT"
                                                name="puertoOlt"
                                                value={formData.puertoOlt}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="Caja NAP"
                                                name="cajaNap"
                                                value={formData.cajaNap}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="Splitter"
                                                name="splitter"
                                                value={formData.splitter}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="Señal RX"
                                                name="senalRx"
                                                value={formData.senalRx}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />

                                            <input
                                                placeholder="Señal TX"
                                                name="senalTx"
                                                value={formData.senalTx}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />
                                        </>
                                    )}

                                {/* GENERALES */}
                                <input
                                    placeholder="PPPoE Secret"
                                    name="pppSecret"
                                    value={formData.pppSecret}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                                <input
                                    placeholder="Queue Name"
                                    name="queueName"
                                    value={formData.queueName}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                                <input
                                    placeholder="IP Cliente"
                                    name="ipCliente"
                                    value={formData.ipCliente}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                                <input
                                    placeholder="MAC"
                                    name="mac"
                                    value={formData.mac}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                                <div style={styles.sectionLabel}>
                                    <FileText size={18} />
                                    Datos del contrato
                                </div>

                                <select
                                    name="tipoContrato"
                                    value={formData.tipoContrato}
                                    onChange={handleChange}
                                    style={styles.input}
                                >
                                    <option value="" style={styles.option}>Tipo de contrato</option>
                                    <option value="FISICO" style={styles.option}>Físico</option>
                                    <option value="DIGITAL" style={styles.option}>Digital</option>
                                </select>

                                <select
                                    name="canalContrato"
                                    value={formData.canalContrato}
                                    onChange={handleChange}
                                    style={styles.input}
                                >
                                    <option value="" style={styles.option}>Canal de contrato</option>
                                    <option value="PRESENCIAL" style={styles.option}>Presencial</option>
                                    <option value="LLAMADA" style={styles.option}>Llamada</option>
                                    <option value="VIDEO" style={styles.option}>Video</option>
                                    <option value="MSN" style={styles.option}>MSN</option>
                                    <option value="WHATSAPP" style={styles.option}>WhatsApp</option>
                                    <option value="EMAIL" style={styles.option}>Email</option>
                                </select>

                                <input
                                    type="number"
                                    name="precioInstalacion"
                                    placeholder="Precio instalación"
                                    value={formData.precioInstalacion}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                                <input
                                    type="number"
                                    name="descuentoInstalacion"
                                    placeholder="Descuento instalación"
                                    value={formData.descuentoInstalacion}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                                <select
                                    name="instalacionGratis"
                                    value={formData.instalacionGratis}
                                    onChange={handleChange}
                                    style={styles.input}
                                >
                                    <option value="0" style={styles.option}>Instalación con costo</option>
                                    <option value="1" style={styles.option}>Instalación gratis</option>
                                </select>

                                <input
                                    type="number"
                                    name="tiempoContratoMeses"
                                    placeholder="Tiempo contrato en meses"
                                    value={formData.tiempoContratoMeses}
                                    onChange={handleChange}
                                    style={styles.input}
                                />

                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    style={styles.secondaryButton}
                                    onClick={() => {
                                        setShowModal(false);
                                        limpiarFormulario();
                                    }}
                                >
                                    Cancelar
                                </button>

                                <button
                                    style={styles.primaryButton}
                                    onClick={guardarServicio}
                                >
                                    {modoEdicion ? 'Actualizar servicio' : 'Guardar servicio'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDetalleModal && servicioDetalle && (
                    <div style={styles.modalOverlay}>
                        <div
                            style={{
                                ...styles.modal,
                                maxWidth: '1000px',
                            }}
                        >
                            <div style={styles.modalHeader}>
                                <h2 style={styles.modalTitle}>
                                    Detalle del Servicio
                                </h2>

                                <button
                                    style={styles.closeButton}
                                    onClick={() => {
                                        setShowDetalleModal(false);
                                        setServicioDetalle(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={styles.detailModalBody}>

                                <div style={styles.infoBox}>
                                    <h3>General</h3>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <div style={styles.copyRow}>
                                            <div>
                                                <span style={styles.copyLabel}>Servicio ID</span>

                                                <p style={styles.copyValue}>
                                                    {servicioDetalle.servicioId}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                title="Copiar Servicio ID"
                                                aria-label="Copiar Servicio ID"
                                                style={{
                                                    ...styles.copyButton,
                                                    ...(idCopiado === 'SERVICIO'
                                                        ? styles.copyButtonSuccess
                                                        : {}),
                                                }}
                                                onClick={() =>
                                                    copiarAlPortapapeles(
                                                        servicioDetalle.servicioId,
                                                        'SERVICIO'
                                                    )
                                                }
                                            >
                                                {idCopiado === 'SERVICIO' ? (
                                                    <Check size={17} />
                                                ) : (
                                                    <Copy size={17} />
                                                )}
                                            </button>
                                        </div>

                                        <div style={styles.copyRow}>
                                            <div>
                                                <span style={styles.copyLabel}>Cliente ID</span>

                                                <p style={styles.copyValue}>
                                                    {servicioDetalle.clienteId}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                title="Copiar Cliente ID"
                                                aria-label="Copiar Cliente ID"
                                                style={{
                                                    ...styles.copyButton,
                                                    ...(idCopiado === 'CLIENTE'
                                                        ? styles.copyButtonSuccess
                                                        : {}),
                                                }}
                                                onClick={() =>
                                                    copiarAlPortapapeles(
                                                        servicioDetalle.clienteId,
                                                        'CLIENTE'
                                                    )
                                                }
                                            >
                                                {idCopiado === 'CLIENTE' ? (
                                                    <Check size={17} />
                                                ) : (
                                                    <Copy size={17} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <p><strong>Plan:</strong> {servicioDetalle.nombrePlan}</p>
                                    <p><strong>Bajada:</strong> {servicioDetalle.velocidadBajada}</p>
                                    <p><strong>Subida:</strong> {servicioDetalle.velocidadSubida}</p>
                                    <p><strong>Precio:</strong> ${Number(servicioDetalle.precioMensual || 0).toFixed(2)}</p>
                                    <p><strong>Día de pago:</strong> {servicioDetalle.diaPago}</p>
                                    <p>
                                        <strong>Sede:</strong>{' '}
                                        {obtenerSedePorRouter(servicioDetalle.routerId)?.nombre ||
                                            'Sin sede asignada'}
                                    </p>
                                    <p>
                                        <strong>Router:</strong>{' '}
                                        {obtenerNombreRouter(servicioDetalle.routerId)}
                                    </p>
                                </div>

                                <div style={styles.contractBox}>
                                    <p><strong>Contrato:</strong> {servicioDetalle.tipoContrato || 'No definido'}</p>
                                    <p>
                                        <strong>Fecha de firma:</strong> {formatearFecha(servicioDetalle.fechaFirmaContrato)}
                                    </p>
                                    <p>
                                        <strong>Fecha de instalación:</strong> {formatearFecha(servicioDetalle.fechaInstalacion)}
                                    </p>
                                    <p><strong>Canal:</strong> {servicioDetalle.canalContrato || 'No definido'}</p>
                                    <p><strong>Tiempo:</strong> {servicioDetalle.tiempoContratoMeses ? `${servicioDetalle.tiempoContratoMeses} meses` : 'No definido'}</p>

                                    <p><strong>Instalación:</strong> ${Number(servicioDetalle.precioInstalacion || 0).toFixed(2)}</p>
                                    <p><strong>Descuento:</strong> ${Number(servicioDetalle.descuentoInstalacion || 0).toFixed(2)}</p>
                                    <p><strong>Gratis:</strong> {servicioDetalle.instalacionGratis ? 'Sí' : 'No'}</p>
                                </div>
                                {servicioDetalle.tipoServicio !== 'RADIO' && (
                                    <div style={styles.techBox}>
                                        <p><strong>PPPoE:</strong> {servicioDetalle.pppSecret || 'No asignado'}</p>
                                        <p><strong>Queue:</strong> {servicioDetalle.queueName || 'No asignado'}</p>
                                        <p><strong>IP:</strong> {servicioDetalle.ipCliente || 'No asignada'}</p>
                                        <p><strong>MAC:</strong> {servicioDetalle.mac || 'No asignada'}</p>
                                    </div>
                                )}

                                {servicioDetalle.tipoServicio !== 'FIBRA' && (
                                    <div style={styles.gponBox}>
                                        <p><strong>Tipo técnico:</strong> Fibra óptica / GPON</p>
                                        <p><strong>Nodo fibra:</strong> {servicioDetalle.nombreNodoFibra || 'N/A'}</p>
                                        <p><strong>NAP:</strong> {servicioDetalle.nombreNap || servicioDetalle.cajaNap || 'N/A'}</p>
                                        <p><strong>Puerto NAP:</strong> {servicioDetalle.puertoNap || 'N/A'}</p>
                                        <p><strong>ONU:</strong> {servicioDetalle.onuId || 'N/A'}</p>
                                        <p><strong>VLAN:</strong> {servicioDetalle.vlan || 'N/A'}</p>
                                        <p><strong>RX/TX:</strong> {servicioDetalle.senalRx || '-'} / {servicioDetalle.senalTx || '-'}</p>
                                    </div>
                                )}

                                {servicioDetalle.tipoServicio !== 'RADIO' && (
                                    <div style={styles.gponBox}>
                                        <p><strong>Tipo técnico:</strong> WISP / Radio enlace</p>
                                        <p><strong>Torre:</strong> {servicioDetalle.nombreTorre || 'N/A'}</p>
                                        <p><strong>Sectorial:</strong> {servicioDetalle.nombreSectorial || servicioDetalle.sectorial || 'N/A'}</p>
                                        <p><strong>Frecuencia:</strong> {servicioDetalle.frecuencia || 'N/A'}</p>
                                        <p><strong>SSID:</strong> {servicioDetalle.ssid || 'N/A'}</p>
                                        <p><strong>IP antena:</strong> {servicioDetalle.ipAntena || 'N/A'}</p>
                                        <p><strong>Modelo antena:</strong> {servicioDetalle.modeloAntena || 'N/A'}</p>
                                        <p><strong>Usuario CPE:</strong> {servicioDetalle.usuarioCpe || 'N/A'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </main >
    );
}

const styles: { [key: string]: React.CSSProperties } = {

    dateInputWrapper: {
        position: 'relative',
        width: '100%',
    },

    dateIcon: {
        position: 'absolute',
        right: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#ffffff',
        pointerEvents: 'none',
    },

    inputDate: {
        width: '100%',
        padding: '13px 45px 13px 14px',
        borderRadius: '12px',
        border: '1px solid rgba(148,163,184,0.22)',
        background: 'rgba(15,23,42,0.92)',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        colorScheme: 'dark',
        boxSizing: 'border-box',
    },


    summarySection: {
        marginBottom: '24px',
    },
    summaryHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
    },
    summaryTitle: {
        margin: 0,
        color: '#f8fafc',
        fontSize: '21px',
        fontWeight: 900,
    },
    summarySubtitle: {
        margin: '4px 0 0',
        color: '#94a3b8',
        fontSize: '13px',
    },
    summaryRouterName: {
        color: '#67e8f9',
        fontWeight: 900,
    },
    statusSummaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '12px',
        marginBottom: '14px',
    },
    statusSummaryCard: {
        minWidth: 0,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        border: '1px solid',
        borderRadius: '18px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.04)',
        color: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
    },
    summaryIcon: {
        width: '42px',
        height: '42px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderRadius: '13px',
    },
    summaryCardLabel: {
        margin: 0,
        color: '#cbd5e1',
        fontSize: '13px',
        fontWeight: 800,
    },
    summaryCardValue: {
        display: 'block',
        marginTop: '3px',
        fontSize: '27px',
        lineHeight: 1,
        fontWeight: 900,
    },
    summaryCardDetail: {
        margin: '7px 0 0',
        color: '#94a3b8',
        fontSize: '11px',
        lineHeight: 1.35,
    },
    financialSummaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
        gap: '14px',
    },
    financialCard: {
        minWidth: 0,
        padding: '17px',
        border: '1px solid',
        borderRadius: '19px',
        boxShadow: '0 14px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)',
    },
    financialCardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '14px',
    },
    financialTitle: {
        margin: 0,
        fontSize: '14px',
        fontWeight: 900,
    },
    financialDescription: {
        margin: '4px 0 0',
        color: '#94a3b8',
        fontSize: '11px',
        lineHeight: 1.35,
    },
    financialRows: {
        display: 'grid',
        gap: '8px',
    },
    financialRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        color: '#cbd5e1',
        fontSize: '12px',
    },
    financialTotalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        paddingTop: '10px',
        marginTop: '2px',
        borderTop: '1px solid rgba(255,255,255,0.11)',
        color: '#f8fafc',
        fontSize: '14px',
        fontWeight: 900,
    },

    sectionLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        gridColumn: '1 / -1',
        color: '#67e8f9',
        fontWeight: 900,
    },

    cedulaRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
    },

    copyCedulaButton: {
        width: '27px',
        height: '27px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0,
        borderRadius: '8px',
        border: '1px solid rgba(34,211,238,0.18)',
        background: 'rgba(8,145,178,0.12)',
        color: '#67e8f9',
        cursor: 'pointer',
    },

    copyRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',

    },

    copyLabel: {

        marginBottom: '4px',
        color: '#67e8f9',
        fontSize: '11px',
        fontWeight: 900,
        textTransform: 'uppercase',

    },

    copyValue: {
        margin: 0,
        maxWidth: '220px',
        color: '#f8fafc',
        fontSize: '12px',
        fontWeight: 700,
        wordBreak: 'break-all',
    },

    copyButton: {
        flexShrink: 0,
        padding: '9px 12px',
        border: '1px solid rgba(34,211,238,0.24)',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #0891b2, #2563eb)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 800,
        cursor: 'pointer',
    },


    contractBox: {
        background: 'linear-gradient(145deg, rgba(30,64,175,0.20), rgba(8,145,178,0.10))',
        border: '1px solid rgba(96,165,250,0.25)',
        borderRadius: '18px',
        padding: '18px',
        fontSize: '14px',
        lineHeight: 1.65,
        color: '#dbeafe',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
    },

    input: {
        width: '100%',
        background: 'rgba(15,23,42,0.92)',
        border: '1px solid rgba(148,163,184,0.22)',
        borderRadius: '12px',
        padding: '13px 14px',
        color: '#fff',
        outline: 'none',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    autocompleteBox: {
        position: 'relative',
        gridColumn: '1 / -1',
    },


    resultadosClientes: {
        position: 'absolute',
        top: '52px',
        left: 0,
        right: 0,
        background: '#020617',
        border: '1px solid rgba(34,211,238,0.35)',
        borderRadius: '14px',
        overflow: 'hidden',
        zIndex: 10000,
        boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
    },

    clienteResultado: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
    },

    miniAvatar: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #22d3ee',
    },

    miniAvatarFallback: {
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0891b2, #2563eb)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
    },

    noResults: {
        padding: '14px',
        color: '#94a3b8',
    },

    clienteSeleccionado: {
        marginTop: '8px',
        color: '#67e8f9',
        fontSize: '13px',
    },

    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.84)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '16px',
    },

    modal: {
        width: '100%',
        maxWidth: '900px',
        maxHeight: '92vh',
        background: 'linear-gradient(155deg, #0b1428 0%, #020617 62%, #061224 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(34,211,238,0.30)',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.62), 0 0 0 1px rgba(59,130,246,0.06)',
    },

    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(34,211,238,0.14)',
        background: 'linear-gradient(90deg, rgba(8,145,178,0.18), rgba(37,99,235,0.10), transparent)',
    },

    modalTitle: {
        color: '#fff',
        margin: 0,
        fontSize: '22px',
        fontWeight: 900,
        letterSpacing: '-0.02em',
    },

    closeButton: {
        width: '38px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '12px',
        color: '#cbd5e1',
        fontSize: '18px',
        cursor: 'pointer',
    },

    modalBody: {
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
        gap: '16px',
        maxHeight: 'calc(92vh - 154px)',
        overflowY: 'auto',
    },

    detailModalBody: {
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
        gap: '16px',
        maxHeight: 'calc(92vh - 80px)',
        overflowY: 'auto',
    },

    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '18px 24px',
        borderTop: '1px solid rgba(34,211,238,0.12)',
        background: 'rgba(2,6,23,0.72)',
    },



    page: {
        minHeight: '100vh',
        background: 'radial-gradient(circle at 12% 0%, rgba(8,145,178,0.12), transparent 28%), #020617',
        color: '#e5e7eb',
        padding: '28px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px',
    },
    title: {
        fontSize: '30px',
        fontWeight: 900,
        color: '#fff',
        margin: 0,
    },
    subtitle: {
        color: '#94a3b8',
        marginTop: '6px',
    },
    primaryButton: {
        background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 18px',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 10px 24px rgba(37,99,235,0.24)',
    },
    filters: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '10px',
    },
    searchInput: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '14px',
        border: '1px solid rgba(34,211,238,0.35)',
        background: 'rgba(15,23,42,0.86)',
        color: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
    },
    filterSelect: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '14px',
        border: '1px solid rgba(34,211,238,0.35)',
        background: 'rgba(15,23,42,0.96)',
        color: '#fff',
        outline: 'none',
        boxSizing: 'border-box',
        cursor: 'pointer',
        colorScheme: 'dark',
    },
    clearFiltersButton: {
        minHeight: '47px',
        padding: '11px 15px',
        borderRadius: '13px',
        border: '1px solid rgba(248,113,113,0.28)',
        background: 'rgba(127,29,29,0.20)',
        color: '#fca5a5',
        fontWeight: 800,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
    },
    resultsCount: {
        margin: '0 0 18px',
        color: '#94a3b8',
        fontSize: '13px',
    },
    loading: {
        color: '#94a3b8',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
        gap: '22px',

    },
    card: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'linear-gradient(155deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))',
        border: '1px solid rgba(34,211,238,0.20)',
        borderRadius: '24px',
        padding: '20px',
        boxShadow: '0 18px 46px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
    },
    cardTop: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(148,163,184,0.12)',
    },
    avatarImg: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #22d3ee',
    },
    avatarFallback: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0891b2, #2563eb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 900,
        fontSize: '22px',
    },
    clientName: {
        margin: 0,
        color: '#fff',
        fontSize: '18px',
    },
    smallText: {
        margin: '2px 0',
        color: '#94a3b8',
        fontSize: '13px',
    },
    statusRow: {
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
    },
    badge: {
        padding: '6px 10px',
        borderRadius: '999px',
        color: '#fff',
        fontWeight: 800,
        fontSize: '11px',
        letterSpacing: '0.03em',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
    },
    typeBadge: {
        padding: '6px 10px',
        borderRadius: '999px',
        background: '#1e293b',
        color: '#67e8f9',
        fontWeight: 800,
        fontSize: '12px',
        border: '1px solid rgba(103,232,249,0.16)',
    },
    infoBox: {
        background: 'linear-gradient(145deg, rgba(30,41,59,0.74), rgba(15,23,42,0.78))',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: '18px',
        padding: '10px',
        marginBottom: '14px',
        fontSize: '14px',
        lineHeight: 1.55,
    },

    techBox: {
        background: 'linear-gradient(145deg, rgba(51,65,85,0.70), rgba(30,41,59,0.48))',
        border: '1px solid rgba(148,163,184,0.16)',
        borderRadius: '18px',
        padding: '18px',
        fontSize: '14px',
        lineHeight: 1.65,
    },
    gponBox: {
        background: 'linear-gradient(145deg, rgba(8,47,73,0.66), rgba(8,145,178,0.08))',
        border: '1px solid rgba(34,211,238,0.18)',
        borderRadius: '18px',
        padding: '18px',
        fontSize: '14px',
        lineHeight: 1.65,
    },
    actions: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    secondaryButton: {
        background: 'linear-gradient(135deg, #334155, #1e293b)',
        color: '#fff',
        border: '1px solid rgba(148,163,184,0.16)',
        borderRadius: '11px',
        padding: '10px 13px',
        cursor: 'pointer',
        fontWeight: 700,
    },
    warningButton: {
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        color: '#111827',
        border: 'none',
        borderRadius: '11px',
        padding: '10px 13px',
        fontWeight: 800,
        cursor: 'pointer',
    },
    dangerButton: {
        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
        color: '#fff',
        border: 'none',
        borderRadius: '11px',
        padding: '10px 13px',
        cursor: 'pointer',
        fontWeight: 700,
    },
};
