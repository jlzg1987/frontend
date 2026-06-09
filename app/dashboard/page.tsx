'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PerfilInterno from '../perfil/page';
import MikroTikDashboardPageInterno from '../mikrotik/page';
import MikrotikPageInterno from '../mikrotik/routers/page';
import AdminIspPageInterno from '../adnib-isp/page';
import PlanesInternetPage from '../adnib-isp/planes-internet/page';
import ClientesInterno from './components/ClientesInterno';
import ImportarClientesInterno from './components/ImportarClientesInterno';
import { API_BASE, getToken } from '@/src/lib/api';
import ContratosServiciosPage from '../contratos-servicios/page';
import InfraestructuraPage from '../infraestructura/page';
import TorresWispPage from '../infraestructura/torres-wips/page';
import SectorialesWispPage from '../infraestructura/sectoriales-wisp/page';
import NodosFibraPage from '../infraestructura/nodos-fibra/page';
import NapSplitterPage from '../infraestructura/nap-splitter/page';
import ContratosPdfPage from '../contratos-pdf/page';
import GestionIspPage from '../gestion-isp/page';
import FichasTecnicasPage from '../fichas-tecnicas/page';
import AutorizacionesInstalacionPage from '../autorizaciones-instalacion/page';
import ConfiguracionFacturacionPage from '../configuracion/page';
import EmpresaPage from '../configuracion/empresa/page';
import ImpuestosPage from '../configuracion/impuestos/page';
import DescuentosPage from '../configuracion/descuentos/page';
import DashboardFacturacionInternaPage from '../facturacion-interna/page';
import FacturaManualPage from '../facturacion-interna/manual/page';
import ListadoFacturasInternasPage from '../facturacion-interna/listado/page';
import FormasPagoPage from '../configuracion/formas-pago/page';
import ClientesExternosFacturacionPage from '../facturacion-interna/clientes-externos/page';
import InventarioPage from '../inventario/page';
import DashboardInventarioPage from '../inventario/page';
import ProductosServiciosPage from '../inventario/producto/page';
import CatalogoInventarioPage from '../inventario/catalogo/page';
import ImportarInventarioPage from '../inventario/importar/page';
import CodigosBarraPage from '../inventario/codigos-barra/page';
import MovimientosInventarioPage from '../inventario/movimiento/page';
import KitsInstalacionPage from '../inventario/kits/page';
import DashboardSriPage from '../facturacion-sri/page';
import FacturacionSriPage from '../facturacion-sri/listado-factura/page';
import ConfiguracionSriPage from '../facturacion-sri/configuracion/page';
import CertificadoSriPage from '../facturacion-sri/certificado/page';
import ConfiguracionEmailSriPage from '../facturacion-sri/configuracion-email/page';
import HistorialEmailsSriPage from '../facturacion-sri/emails/page';
import AnulacionesSriPage from '../facturacion-sri/anulacionesSri/page';
import AnulacionesInternatPage from '../facturacion-sri/anulaciones/page';
import NotasCreditoPage from '../facturacion-sri/notaCredito/page';
import HistorialAnulacionesNotasCreditoPage from '../facturacion-sri/anulaciones-historial/page';
import TicketsPage from '../tickets/page';
import DashboardTecnicosPage from '../dashboard-tecnicos/page';
import SoporteTecnicoPage from '../soporte-tecnico/page';
import DetalleTecnicoPage from '../dashboard-tecnicos/[tecnicoId]/page';
import ListadoTicketsPage from '../soporte-tecnico/Listado-tickets/page';
import DetalleFichaTecnicaClientePage from '../soporte-tecnico/ficha-tecnica-clientes/[servicioId]/page';
import FichaTecnicaClientesPage from '../soporte-tecnico/ficha-tecnica-clientes/page';
import AtencionCampoPage from '../soporte-tecnico/atencion-campo/page';
import FichaTecnicaClientePage from '../soporte-tecnico/atencion-campo/[ticketId]/page';
import MapaNeuronalMantenimientos from '../soporte-tecnico/mantenimineto/page';
import MisReportesTecnicoPage from '../soporte-tecnico/mis-reportes/page';
import ReportesTecnicosAdminPage from '../dashboard-tecnicos/reportes-admin/page';
import MikrotikCortesPage from '../mikrotik/mikrotik-cortes/page';
import ConfiguracionMikrotikPage from '../mikrotik/configuracionMikrotik/page';
import MensualidadesPage from '../pagos-mensuales/page';


type DashboardResponse = {
    ok: boolean;
    resumen: {
        tecnicosActivos: number;
        ticketsAsignados: number;
        abiertos: number;
        enProceso: number;
        resueltos: number;
        cerrados: number;
        criticosPendientes: number;
    };
    tecnicos: any[];
    ultimosTickets: any[];
};


export default function DashboardPage() {
    const router = useRouter();
    const [usuario, setUsuario] = useState<any>(null);
    const [extra, setExtra] = useState<any>({});
    const [clientesActivos, setClientesActivos] = useState(0);
    const [tecnicoSeleccionadoId, setTecnicoSeleccionadoId] = useState<string | null>(null);
    const [DetalleClienteId, setDetalleClienteId] = useState<string | null>(null);
    const [ticketsIdSeleccionadoId, setticketsIdSeleccionadoId] = useState<string | null>(null);

    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

    const [vistaActual, setVistaActual] = useState<
        'dashboard' | 'perfil' | 'mikrotik' | 'mikrotikRouters' | 'administracion' | 'PlanInternet'
        | 'Clientes' | 'ImportarClientes' | 'contratosServicios' | 'infraestructura' | 'torre' | 'sectorial'
        | 'nodofibra' | 'NapSplitter' | 'contratospdf' | 'gestionisp' | 'autorizacionesinstalacion' | 'fichastecnicas'
        | 'confg' | 'descuentos' | 'empresa' | 'impuestos' | 'facturacion' | 'facturasinternas' | 'facturamanual'
        | 'formaspago' | 'clientesexternos' | 'inventario' | 'importarinventario' | 'productoservicio' | 'catalogoinventario'
        | 'codigoBarra' | 'moviminetoStock' | 'kitsInstalacion' | 'configuraciónSRI' | 'FacturasSRI' | 'ConfiguraciónSRI'
        | 'Certificadodigital' | 'ConfiguraciónEmailSRI' | 'HistorialemailsSRI' | 'AnulacionesSRI' | 'AnulacionesInterna'
        | 'NotasCreditoSRI' | 'AnulaciónNotasCrédito' | 'tickets' | 'tecnico' | 'soporteTecnico' | 'fichatecnico'
        | 'ListadoTickets' | 'fichaCliente' | 'talleCliente' | 'detalletickets' | 'AtencionCampo' | 'AbrirMantenimiento'
        | 'AbrirReportes' | 'AbrirReporteAdmin' | 'mikrotikCortes' | 'mikroikconfiguracion' | 'pagos'
    >('dashboard');


    const cargarResumenClientes = async () => {
        try {
            const token = await getToken();

            const res = await fetch(`${API_BASE}/clientes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                const activos = (data.clientes || []).filter(
                    (c: any) => c.estadoCliente === 'ACTIVO'
                ).length;

                setClientesActivos(activos);
            }
        } catch (error) {
            console.error('Error cargando resumen clientes:', error);
        }
    };

    const [dashboardMensualidades, setDashboardMensualidades] = useState({
        pendientes: 0,
        pagadas: 0,
        vencidas: 0,
        cortadas: 0,
        totalPorCobrar: 0,
        totalCobrado: 0,
        proximasVencer: 0,
    });

    async function cargarDashboardMensualidades() {
        try {
            const token = getToken();

            const res = await fetch(
                `${API_BASE}/mensualidades/dashboard`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (data.ok) {
                setDashboardMensualidades(data.dashboard);
            }

        } catch (error) {
            console.error(
                'Error cargando dashboard mensualidades:',
                error
            );
        }
    }

    const cargarDashboard = async () => {
        try {
            const token = getToken();

            const res = await fetch(
                `${API_BASE}/tickets/dashboard/tecnicos`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await res.json();
            console.log("tickes: ", data)
            setDashboard(data);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        } finally {
        }
    };
    useEffect(() => {
        cargarDashboardMensualidades();
        cargarDashboard();
    }, []);

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('isp_usuario');

        if (usuarioStorage) {
            try {
                const usuarioParseado = JSON.parse(usuarioStorage);

                console.log('USUARIO PARSEADO:', usuarioParseado);
                console.log('USUARIO ID:', usuarioParseado.usuarioId);

                setUsuario(usuarioParseado)
            } catch {
                setUsuario(null);
            }
        }

        cargarResumenClientes();
    }, []);

    useEffect(() => {
        console.log('USUARIO STATE YA ACTUALIZADO:', usuario);
        console.log('USUARIO ID STATE:', usuario?.usuarioId);
    }, [usuario]);

    const nombreUsuario = usuario?.nombreCompleto || `${usuario?.nombres || ''} ${usuario?.apellidos || ''}`.trim() || usuario?.nombre || 'Usuario';

    const emailUsuario = usuario?.email || usuario?.correo || '';

    const fotoUsuario = usuario?.fotoPerfil || usuario?.foto || usuario?.avatar || usuario?.imagen ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreUsuario)}&background=2563eb&color=fff`;


    const cards = [
        {
            title: 'Clientes',
            desc: 'Registrar, buscar y administrar clientes ISP.',
            icon: '👥',
            href: '/Clientes',
            color: 'bg-blue-600',
        },

        {
            title: 'Contratos Servicios',
            desc: 'Administrar servicios de internet, planes, PPPoE, GPON y estados.',
            icon: '📡',
            href: '/contratos-servicios',
            color: 'bg-cyan-600',
        },

        {
            title: 'Pagos',
            desc: 'Control de mensualidades, deudas y cortes.',
            icon: '💳',
            href: '/pagos',
            color: 'bg-green-600',
        },
        {
            title: 'Facturación',
            desc: 'Facturas, notas de venta y comprobantes.',
            icon: '🧾',
            href: '/facturacion',
            color: 'bg-indigo-600',
        },
        {
            title: 'MikroTik',
            desc: 'Control de cortes, perfiles y clientes activos.',
            icon: '📡',
            color: 'bg-orange-600',
            href: '/mikrotik',
        },
        {
            title: 'Tickets',
            desc: 'Soporte técnico y atención al cliente.',
            icon: '🛠️',
            href: '/tickets',
            color: 'bg-red-600',
        },
        {
            title: 'Usuarios',
            desc: 'Administrar técnicos, cajeros y administradores.',
            icon: '🔐',
            href: '/usuarios',
            color: 'bg-slate-700',
        },
    ];

    function cerrarSesion() {
        localStorage.removeItem('isp_token');
        localStorage.removeItem('isp_usuario');
        router.push('/login');
    }

    function getHeaderInfo() {


        if (vistaActual === 'mikroikconfiguracion') {
            return {
                titulo: 'Configuración MikroTik',
                subtitulo: '  Servicios, firewall, NAT, listas, rutas y herramientas generales.',
            };
        }
        if (vistaActual === 'mikrotikCortes') {
            return {
                titulo: 'Cortes MikroTik',
                subtitulo: ' Gestión manual de cortes y activaciones por Address List MOROSOS.',
            };
        }
        if (vistaActual === 'AbrirReportes') {
            return {
                titulo: '  📋 Mis reportes',
                subtitulo: 'Reportes enviados por administración.',
            };
        }
        if (vistaActual === 'AbrirMantenimiento') {
            return {
                titulo: ' 🧠 Mapa neuronal de mantenimientos',
                subtitulo: 'Cada punto representa un mantenimiento asignado, en proceso o terminado.',
            };
        }
        if (vistaActual === 'detalletickets') {
            return {
                titulo: '  Ficha técnica de atención',
                subtitulo: 'Registro de mantenimiento, evidencia y cierre técnico.',
            };
        }

        if (vistaActual === 'AtencionCampo') {
            return {
                titulo: ' Atención en campo',
                subtitulo: '  Mantenimientos, tickets técnicos y ficha técnica del cliente.',
            };
        }
        if (vistaActual === 'fichaCliente') {
            return {
                titulo: 'Fichas técnicas de clientes',
                subtitulo: 'Clientes con instalación, mantenimiento o atención técnica asignada.',
            };
        }
        if (vistaActual === 'ListadoTickets') {
            return {
                titulo: '  Tickets disponibles',
                subtitulo: ' Tickets registrados que aún no han sido asignados a un técnico.',
            };
        }
        if (vistaActual === 'soporteTecnico') {
            return {
                titulo: ' 📞 Soporte Técnico',
                subtitulo: 'Centro de control para tickets, técnicos, atención en campo, mantenimientos y reportes del área técnica.',
            };
        }
        if (vistaActual === 'tecnico') {
            return {
                titulo: ' Dashboard Técnicos',
                subtitulo: 'Monitoreo general del departamento técnico',
            };
        }
        if (vistaActual === 'tickets') {
            return {
                titulo: 'Tickets de Soporte',
                subtitulo: 'Gestión de soporte técnico para clientes ISP y externos.',
            };
        }
        if (vistaActual === 'AnulaciónNotasCrédito') {
            return {
                titulo: 'Historial de Anulación de Notas de Crédito',
                subtitulo: 'Consulta solicitudes, estados, fechas, clientes y claves de acceso.',
            };
        }
        if (vistaActual === 'NotasCreditoSRI') {
            return {
                titulo: 'Notas de Crédito SRI',
                subtitulo: 'Devoluciones parciales o totales relacionadas a facturas autorizadas.',
            };
        }
        if (vistaActual === 'AnulacionesSRI') {
            return {
                titulo: ' Anulaciones SRI',
                subtitulo: 'Control de solicitudes, paquetes y confirmaciones de anulación.',
            };
        }
        if (vistaActual === 'AnulacionesInterna') {
            return {
                titulo: ' Anulaciones Interna',
                subtitulo: 'Control interno de solicitudes, confirmación y rechazo de anulaciones',
            };
        }
        if (vistaActual === 'HistorialemailsSRI') {
            return {
                titulo: ' Historial de emails SRI',
                subtitulo: '  Consulta correos enviados, errores, reenvíos y envíos automáticos.',
            };
        }
        if (vistaActual === 'ConfiguraciónEmailSRI') {
            return {
                titulo: '  Configuración de envío email SRI',
                subtitulo: ' Controla el envío automático de facturas autorizadas del día.',
            };
        }
        if (vistaActual === 'FacturasSRI') {
            return {
                titulo: ' Facturación Electrónica SRI',
                subtitulo: ' Procesa XML, firma, autorización y RIDE de facturas internas.',
            };
        }
        if (vistaActual === 'ConfiguraciónSRI') {
            return {
                titulo: '   Configuración SRI',
                subtitulo: ' Define ambiente, establecimiento, punto de emisión y secuencial de facturación electrónica.',
            };
        }
        if (vistaActual === 'Certificadodigital') {
            return {
                titulo: ' Certificado Digital SRI',
                subtitulo: 'Sube el archivo .p12 de la empresa para firmar electrónicamente los XML.',
            };
        }
        if (vistaActual === 'configuraciónSRI') {
            return {
                titulo: ' Dashboard Facturación Electrónica SRI',
                subtitulo: ' Centro de control para procesar facturas electrónicas, configurar el ambiente SRI,                    cargar certificado digital y consultar comprobantes autorizados.',
            };
        }
        if (vistaActual === 'perfil') {
            return {
                titulo: 'Perfil de usuario',
                subtitulo: 'Administra tu información personal, foto y datos del sistema',
            };
        }
        if (vistaActual === 'mikrotik') {
            return {
                titulo: 'Dashboard MikroTik',
                subtitulo: 'Centro de control para nodos, clientes, monitoreo, firewall y reportes',
            };
        }
        if (vistaActual === 'mikrotikRouters') {
            return {
                titulo: 'Administrar nodos MikroTik',
                subtitulo: 'Registrar, editar, probar conexión y validar WireGuard de tus routers',
            };
        }
        if (vistaActual === 'administracion') {
            return {
                titulo: 'Administración ISP',
                subtitulo: ' Centro de control para clientes, planes, pagos, publicidad, cortes y reportes.',
            };
        }
        if (vistaActual === 'PlanInternet') {
            return {
                titulo: 'Planes de Internet',
                subtitulo: 'Crear, editar y administrar planes, velocidades y precios.',
            };
        }
        if (vistaActual === 'Clientes') {
            return {
                titulo: 'Clientes',
                subtitulo: 'Registro, ubicación, estado y perfil de clientes ISP.',
            };
        }
        if (vistaActual === 'ImportarClientes') {
            return {
                titulo: 'Importar clientes',
                subtitulo: 'Descarga el formato Excel oficial e importa clientes masivamente.',
            };
        }
        if (vistaActual === 'contratosServicios') {
            return {
                titulo: 'Contratos de Servicios',
                subtitulo: ' Servicios de internet asignados a clientes, planes, MikroTik y datos técnicos.',
            };
        }
        if (vistaActual === 'infraestructura') {
            return {
                titulo: 'Infraestructura',
                subtitulo: '  Centro de control para WISP, fibra óptica, NAP, nodos, NAT y red física del ISP.',
            };

        }
        if (vistaActual === 'torre') {
            return {
                titulo: 'Torres WISP',
                subtitulo: 'Administración de torres inalámbricas, ubicación, IP pública y estado operativo.',
            };

        }
        if (vistaActual === 'sectorial') {
            return {
                titulo: 'Sectoriales WISP',
                subtitulo: 'Administra sectoriales, IP, SSID y frecuencia por cada torre',
            };

        }
        if (vistaActual === 'nodofibra') {
            return {
                titulo: 'Módulos de infraestructura',
                subtitulo: 'Selecciona un módulo para administrar la red física y lógica del ISP.',
            };

        }
        if (vistaActual === 'NapSplitter') {
            return {
                titulo: 'NAP / Splitter',
                subtitulo: 'Controla cajas NAP, splitters, capacidad de puertos y distribución GPON.',
            };

        }
        if (vistaActual === 'contratospdf') {
            return {
                titulo: 'Historial de Contratos PDF',
                subtitulo: ' Consulta, filtra y reimprime contratos generados.',
            };

        }
        if (vistaActual === 'gestionisp') {
            return {
                titulo: 'Centro de Gestión ISP',
                subtitulo: ' Panel premium para administrar clientes, contratos, autorizaciones, fichas técnicas y documentos operativos del servicio.',
            };

        }
        if (vistaActual === 'empresa') {
            return {
                titulo: 'Datos de empresa',
                subtitulo: 'Configuración de sistema información de local o empresa',
            };

        }
        if (vistaActual === 'impuestos') {
            return {
                titulo: 'Impuestos',
                subtitulo: 'Configuración de sistema contable',
            };

        }
        if (vistaActual === 'descuentos') {
            return {
                titulo: 'Descuentos',
                subtitulo: 'Configuración de sistema contable',
            };

        }
        if (vistaActual === 'facturasinternas') {
            return {
                titulo: 'Facturas Internas',
                subtitulo: ' Consulta, filtra y reimprime facturas internas del sistema ISP.',
            };

        }
        if (vistaActual === 'facturamanual') {
            return {
                titulo: ' Factura Manual Interna',
                subtitulo: 'Crear factura interna reusable para ventas, instalación, soporte o cobros manuales.',
            };

        }
        if (vistaActual === 'facturacion') {
            return {
                titulo: ' Dashboard de Facturación Interna',
                subtitulo: 'Centro de control para generar facturas internas, consultar comprobantes \n reimprimir PDF, configurar impuestos, descuentos y datos de empresa.',
            };

        }
        if (vistaActual === 'formaspago') {
            return {
                titulo: 'Formas de Pago',
                subtitulo: ' Crear, editar, eliminar, activar y desactivar formas de pago.',
            };

        }
        if (vistaActual === 'clientesexternos') {
            return {
                titulo: 'Clientes externos de facturación',
                subtitulo: ' Clientes que no pertenecen al servicio ISP pero pueden recibir facturas internas.',
            };

        }
        if (vistaActual === 'catalogoinventario') {
            return {
                titulo: 'Catálogo e Inventario',
                subtitulo: 'Consulta, filtra, edita y administra productos y servicios.',
            };

        }
        if (vistaActual === 'productoservicio') {
            return {
                titulo: 'Productos y Servicios',
                subtitulo: 'Registro base del inventario para facturación interna.',
            };

        }
        if (vistaActual === 'importarinventario') {
            return {
                titulo: ' Importar Inventario',
                subtitulo: 'Sube productos y servicios desde un archivo Excel.',
            };

        }
        if (vistaActual === 'inventario') {
            return {
                titulo: ' Dashboard Inventario',
                subtitulo: ' Centro de control para productos, servicios, stock, importaciones y kits.',
            };

        }
        if (vistaActual === 'codigoBarra') {
            return {
                titulo: ' Códigos de Barra',
                subtitulo: 'Selecciona productos o servicios para imprimir etiquetas.',
            };

        }
        if (vistaActual === 'moviminetoStock') {
            return {
                titulo: ' Movimientos de Stock',
                subtitulo: 'Registra entradas, salidas y ajustes de productos del inventario.',
            };

        }
        if (vistaActual === 'kitsInstalacion') {
            return {
                titulo: 'Kits de Instalación',
                subtitulo: '   Crea paquetes con equipos, materiales y servicios. Al usar un kit se descuenta stock.',
            };

        }

        return {
            titulo: 'Dashboard principal',
            subtitulo: 'Bienvenido al panel administrativo ISP NetComp RF',
        };
    }

    const headerInfo = getHeaderInfo();

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-blue-950">
            <div className="flex min-h-screen">
                <aside className="hidden md:flex w-72 bg-slate-900 border-r border-slate-800 p-6 flex-col">
                    <div className="mb-10">
                        <h1 className="text-2xl font-black text-white">Netcomp RF</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Sistema Web ISP
                        </p>
                    </div>

                    <nav className="space-y-3 flex-1">

                        <MenuItem
                            label="Dashboard"
                            active={vistaActual === 'dashboard'}
                            onClick={() => setVistaActual('dashboard')}
                        />

                        <MenuItem
                            label="Gestión ISP"
                            active={vistaActual === 'gestionisp'}
                            onClick={() => setVistaActual('gestionisp')}
                        />

                        <MenuItem
                            label="Pagos"
                            active={vistaActual === 'pagos'}
                            onClick={() => setVistaActual('pagos')}
                        />
                        <MenuItem
                            label="Aréa Técnica"
                            active={vistaActual === 'tecnico'}
                            onClick={() => setVistaActual('tecnico')}
                        />
                        <MenuItem
                            label="Soporte Técnica"
                            active={vistaActual === 'soporteTecnico'}
                            onClick={() => setVistaActual('soporteTecnico')}
                        />


                        <MenuItem
                            label="Facturación"
                            active={vistaActual === 'facturacion'}
                            onClick={() => setVistaActual('facturacion')}
                        />

                        <MenuItem
                            label="MikroTik"
                            active={vistaActual === 'mikrotik'}
                            onClick={() => setVistaActual('mikrotik')}
                        />
                        <MenuItem
                            label="Infraestructura"
                            active={vistaActual === 'infraestructura'}
                            onClick={() => setVistaActual('infraestructura')}

                        />
                        <MenuItem
                            label="Tickets"
                            active={vistaActual === 'tickets'}
                            onClick={() => setVistaActual('tickets')}
                        />
                        <MenuItem
                            label="Administración"
                            active={vistaActual === 'administracion'}
                            onClick={() => setVistaActual('administracion')}
                        />

                        <MenuItem
                            label="Usuarios"
                            href="/usuarios"
                        />

                        <MenuItem
                            label="Inventario"
                            active={vistaActual === 'inventario'}
                            onClick={() => setVistaActual('inventario')}
                        />

                        <MenuItem
                            label="Desarrollo Sistema"
                            href="/desarrollo-sistema"
                        />
                        <MenuItem
                            label="Configuración"
                            active={vistaActual === 'confg'}
                            onClick={() => setVistaActual('confg')}
                        />

                    </nav>

                    <button
                        onClick={cerrarSesion}
                        className="rounded-xl bg-red-600 px-4 py-3 text-white font-bold hover:bg-red-700"
                    >
                        Cerrar sesión
                    </button>
                </aside>

                <section className="flex-1">
                    <header className="bg-slate-950/90 border-b border-cyan-500/20 px-5 md:px-8 py-5 flex items-center justify-between gap-4 shadow-lg shadow-cyan-500/10">    <div>
                        <h2 className="text-2xl font-black text-white">
                            {headerInfo.titulo}
                        </h2>
                        <p className="text-cyan-200/70 text-sm">
                            {headerInfo.subtitulo}
                        </p>
                    </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"

                                onClick={() => setVistaActual('perfil')}
                                className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900 px-4 py-2 hover:bg-slate-800 transition shadow-lg shadow-cyan-500/10"
                            >
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-black text-white">
                                        {nombreUsuario}
                                    </p>
                                    <p className="text-xs text-cyan-200/70">
                                        {emailUsuario}
                                    </p>
                                </div>

                                <img
                                    src={fotoUsuario}
                                    alt="Avatar usuario"
                                    className="h-12 w-12 rounded-2xl object-cover border border-blue-200"
                                />
                            </button>

                            <button
                                onClick={cerrarSesion}
                                className="md:hidden rounded-xl bg-red-600 px-4 py-2 text-white font-bold"
                            >
                                Salir
                            </button>
                        </div>
                    </header>
                    <div className="p-5 md:p-8">
                        {vistaActual === 'dashboard' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5 mb-8">
                                    <StatCard title="Clientes activos" value={String(clientesActivos)} />
                                    <StatCard title="Pagos pendientes" value={String(dashboardMensualidades.pendientes)} />
                                    <StatCard title="Pagadas" value={String(dashboardMensualidades.pagadas)} />
                                    <StatCard title="Vencidas" value={String(dashboardMensualidades.vencidas)} />
                                    <StatCard title="Cortadas" value={String(dashboardMensualidades.cortadas)} />
                                    <StatCard title="Por cobrar" value={`$${String(dashboardMensualidades.totalPorCobrar.toFixed(2))}`} />
                                    <StatCard title="Cobrado" value={`$${String(dashboardMensualidades.totalCobrado.toFixed(2))}`} />
                                    <StatCard title="Tickets abiertos" value={String(dashboard?.resumen?.tecnicosActivos)} />

                                    <StatCard title="Equipos online" value="0" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {cards.map((item) => (
                                        <button
                                            key={item.title}
                                            onClick={() => {
                                                if (item.title === 'MikroTik') {
                                                    setVistaActual('mikrotik');
                                                    return;
                                                }
                                                if (item.title === 'Clientes') {
                                                    setVistaActual('Clientes');
                                                    return;
                                                }
                                                if (item.title === 'Contratos Servicios') {
                                                    setVistaActual('contratosServicios');
                                                    return;
                                                }
                                                if (item.title === 'Contratos ISP') {
                                                    setVistaActual('contratospdf');
                                                    return;
                                                }
                                                if (item.title === 'Facturación') {
                                                    setVistaActual('facturamanual');
                                                    return;
                                                }
                                                if (item.title === 'Tickets') {
                                                    setVistaActual('tickets');
                                                    return;
                                                }
                                                if (item.title === 'Pagos') {
                                                    setVistaActual('pagos');
                                                    return;
                                                }


                                                router.push(item.href);
                                            }}
                                            className="text-left rounded-3xl bg-slate-900/95 p-6 shadow-xl shadow-cyan-500/10 hover:scale-[1.02] transition border border-cyan-500/25 hover:border-cyan-400/60"
                                        >
                                            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                                                {item.icon}
                                            </div>

                                            <h3 className="text-xl font-black text-white">
                                                {item.title}
                                            </h3>

                                            <p className="text-cyan-100/70 mt-2 text-sm leading-6">
                                                {item.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                        {vistaActual === 'pagos' && (
                            <MensualidadesPage />
                        )}

                        {vistaActual === 'AtencionCampo' && (
                            <AtencionCampoPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirdetalletickets={(ticketId) => {
                                    setticketsIdSeleccionadoId(ticketId);
                                    setVistaActual('detalletickets');
                                }}
                            />
                        )}

                        {vistaActual === 'detalletickets' && ticketsIdSeleccionadoId && (
                            <FichaTecnicaClientePage
                                ticketsId={ticketsIdSeleccionadoId}
                                onVolver={() => setVistaActual('AtencionCampo')}
                            />
                        )}
                        {vistaActual === 'soporteTecnico' && (
                            <SoporteTecnicoPage
                                onVolver={() => setVistaActual('dashboard')}
                                OpenListadoTickets={() => setVistaActual('ListadoTickets')}
                                onAbrirfichatecnico={(usuarioId) => {
                                    setTecnicoSeleccionadoId(usuarioId);
                                    setVistaActual('fichatecnico');

                                }}
                                onAbrirfichaCliente={() => setVistaActual('fichaCliente')}
                                onAbrirAtencionCampo={(usuarioId) => {
                                    setTecnicoSeleccionadoId(usuarioId);
                                    setVistaActual('AtencionCampo');
                                }}
                                onAbrirMantenimiento={(usuarioId) => {
                                    setTecnicoSeleccionadoId(usuarioId);
                                    setVistaActual('AbrirMantenimiento');
                                }}
                                onAbrirReportes={(usuarioId) => {
                                    setTecnicoSeleccionadoId(usuarioId);
                                    setVistaActual('AbrirReportes');
                                }}

                            />
                        )}
                        {vistaActual === 'AbrirReportes' && tecnicoSeleccionadoId && (
                            <MisReportesTecnicoPage tecnicoId={tecnicoSeleccionadoId} />
                        )}
                        {vistaActual === 'fichaCliente' && (
                            <FichaTecnicaClientesPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirdetalleCliente={(servicioId) => {
                                    setDetalleClienteId(servicioId);
                                    setVistaActual('talleCliente');
                                }}

                            />
                        )}
                        {vistaActual === 'AbrirMantenimiento' && tecnicoSeleccionadoId && (
                            <MapaNeuronalMantenimientos tecnicoId={tecnicoSeleccionadoId} />
                        )}
                        {vistaActual === 'talleCliente' && (
                            <DetalleFichaTecnicaClientePage servicioId={DetalleClienteId} />
                        )}
                        {vistaActual === 'ListadoTickets' && (
                            <ListadoTicketsPage />
                        )}
                        {vistaActual === 'tecnico' && (
                            <DashboardTecnicosPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirfichatecnico={(tecnicoId) => {
                                    setTecnicoSeleccionadoId(tecnicoId);
                                    setVistaActual('fichatecnico');
                                }}

                                onAbrirReporteAdmin={() => setVistaActual('AbrirReporteAdmin')}
                            />
                        )}
                        {vistaActual === 'fichatecnico' && tecnicoSeleccionadoId && (
                            <DetalleTecnicoPage
                                tecnicoId={tecnicoSeleccionadoId}
                                onVolver={() => setVistaActual('dashboard')}
                            />
                        )}
                        {vistaActual === 'AbrirReporteAdmin' && (
                            <ReportesTecnicosAdminPage />
                        )}
                        {vistaActual === 'perfil' && (
                            <PerfilInterno onVolver={() => setVistaActual('dashboard')} />
                        )}
                        {vistaActual === 'mikrotik' && (
                            <MikroTikDashboardPageInterno
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirRouters={() => setVistaActual('mikrotikRouters')}
                                onAbrirmikroikCortes={() => setVistaActual('mikrotikCortes')}
                                onAbrirmikroikconfiguracion={() => setVistaActual('mikroikconfiguracion')}

                            />
                        )}
                        {vistaActual === 'mikroikconfiguracion' && (
                            <ConfiguracionMikrotikPage />
                        )}
                        {vistaActual === 'mikrotikCortes' && (
                            <MikrotikCortesPage />
                        )}
                        {vistaActual === 'mikrotikRouters' && (
                            <MikrotikPageInterno />
                        )}
                        {vistaActual === 'administracion' && (
                            <AdminIspPageInterno
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirAdministracion={() => setVistaActual('PlanInternet')}
                                onAbrirClientes={() => setVistaActual('Clientes')}
                                onAbrirImportarclientes={() => setVistaActual('ImportarClientes')}
                            />
                        )}
                        {vistaActual === 'PlanInternet' && (
                            <PlanesInternetPage />
                        )}
                        {vistaActual === 'Clientes' && (
                            <ClientesInterno />
                        )}
                        {vistaActual === 'ImportarClientes' && (
                            <ImportarClientesInterno />
                        )}
                        {vistaActual === 'contratosServicios' && (
                            <ContratosServiciosPage />
                        )}
                        {vistaActual === 'infraestructura' && (
                            <InfraestructuraPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirtorre={() => setVistaActual('torre')}
                                onAbrirsectorial={() => setVistaActual('sectorial')}
                                onAbrirnodofibra={() => setVistaActual('nodofibra')}
                                onAbrirNapSplitter={() => setVistaActual('NapSplitter')}
                            />
                        )}
                        {vistaActual === 'torre' && (
                            <TorresWispPage />
                        )}
                        {vistaActual === 'sectorial' && (
                            <SectorialesWispPage />
                        )}
                        {vistaActual === 'nodofibra' && (
                            <NodosFibraPage />
                        )}
                        {vistaActual === 'NapSplitter' && (
                            <NapSplitterPage />
                        )}
                        {vistaActual === 'contratospdf' && (
                            <ContratosPdfPage />
                        )}

                        {vistaActual === 'gestionisp' && (
                            <GestionIspPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirCliente={() => setVistaActual('Clientes')}
                                onAbrirServicioCliente={() => setVistaActual('contratosServicios')}
                                onAbrirImprimirServicioCliente={() => setVistaActual('contratospdf')}
                                onAbrirImprimirAutorizacionCliente={() => setVistaActual('autorizacionesinstalacion')}
                                onAbrirImprimirfichaCliente={() => setVistaActual('fichastecnicas')}
                                onAbrirclientesexternos={() => setVistaActual('clientesexternos')}


                            />
                        )}
                        {vistaActual === 'clientesexternos' && (
                            <ClientesExternosFacturacionPage />
                        )}
                        {vistaActual === 'autorizacionesinstalacion' && (
                            <AutorizacionesInstalacionPage />
                        )}
                        {vistaActual === 'fichastecnicas' && (
                            <FichasTecnicasPage />
                        )}

                        {vistaActual === 'confg' && (
                            <ConfiguracionFacturacionPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirDatoempresa={() => setVistaActual('empresa')}
                                onAbrirImpuestos={() => setVistaActual('impuestos')}
                                onAbrirDescuentos={() => setVistaActual('descuentos')}
                                onAbrirFormaspago={() => setVistaActual('formaspago')}
                            />
                        )}
                        {vistaActual === 'empresa' && (
                            <EmpresaPage />
                        )}
                        {vistaActual === 'impuestos' && (
                            <ImpuestosPage />
                        )}
                        {vistaActual === 'descuentos' && (
                            <DescuentosPage />
                        )}
                        {vistaActual === 'formaspago' && (
                            <FormasPagoPage />
                        )}
                        {vistaActual === 'facturacion' && (
                            <DashboardFacturacionInternaPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirFacturamanual={() => setVistaActual('facturamanual')}
                                onAbrirFacturasinternas={() => setVistaActual('facturasinternas')}
                                onAbrirConfiguraciónSRI={() => setVistaActual('configuraciónSRI')}
                            />
                        )}

                        {vistaActual === 'configuraciónSRI' && (
                            <DashboardSriPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirFacturasSRI={() => setVistaActual('FacturasSRI')}
                                onAbrirConfiguraciónSRI={() => setVistaActual('ConfiguraciónSRI')}
                                onAbrirCertificadodigital={() => setVistaActual('Certificadodigital')}
                                onAbrirFacturasinternas={() => setVistaActual('facturasinternas')}
                                onAbrirConfiguraciónEmailSRI={() => setVistaActual('ConfiguraciónEmailSRI')}
                                onAbrirHistorialemailsSRI={() => setVistaActual('HistorialemailsSRI')}
                                onAbrirAnulacionesSRI={() => setVistaActual('AnulacionesSRI')}
                                onAbrirAnulacionesInterna={() => setVistaActual('AnulacionesInterna')}
                                onAbrirNotasCreditoSRI={() => setVistaActual('NotasCreditoSRI')}
                                onAbrirAnulaciónNotasCrédito={() => setVistaActual('AnulaciónNotasCrédito')}
                            />
                        )}
                        {vistaActual === 'AnulaciónNotasCrédito' && (
                            <HistorialAnulacionesNotasCreditoPage />
                        )}
                        {vistaActual === 'NotasCreditoSRI' && (
                            <NotasCreditoPage />
                        )}
                        {vistaActual === 'AnulacionesSRI' && (
                            <AnulacionesSriPage />
                        )}
                        {vistaActual === 'AnulacionesInterna' && (
                            <AnulacionesInternatPage />
                        )}
                        {vistaActual === 'HistorialemailsSRI' && (
                            <HistorialEmailsSriPage />
                        )}
                        {vistaActual === 'ConfiguraciónEmailSRI' && (
                            <ConfiguracionEmailSriPage />
                        )}
                        {vistaActual === 'FacturasSRI' && (
                            <FacturacionSriPage />
                        )}
                        {vistaActual === 'ConfiguraciónSRI' && (
                            <ConfiguracionSriPage />
                        )}
                        {vistaActual === 'Certificadodigital' && (
                            <CertificadoSriPage />
                        )}



                        {vistaActual === 'facturamanual' && (
                            <FacturaManualPage />
                        )}
                        {vistaActual === 'facturasinternas' && (
                            <ListadoFacturasInternasPage />
                        )}
                        {vistaActual === 'inventario' && (
                            <DashboardInventarioPage
                                onVolver={() => setVistaActual('dashboard')}
                                onAbrirProductoServicio={() => setVistaActual('productoservicio')}
                                onAbrirCatalogoInventario={() => setVistaActual('catalogoinventario')}
                                onAbrirImportarInventario={() => setVistaActual('importarinventario')}
                                onAbrirCodigoBarra={() => setVistaActual('codigoBarra')}
                                onAbrirMoviminetoStock={() => setVistaActual('moviminetoStock')}
                                onAbrirKitsInstalacion={() => setVistaActual('kitsInstalacion')}

                            />
                        )}
                        {vistaActual === 'kitsInstalacion' && (
                            <KitsInstalacionPage />
                        )}
                        {vistaActual === 'productoservicio' && (
                            <ProductosServiciosPage />
                        )}
                        {vistaActual === 'catalogoinventario' && (
                            <CatalogoInventarioPage />
                        )}
                        {vistaActual === 'importarinventario' && (
                            <ImportarInventarioPage />
                        )}
                        {vistaActual === 'codigoBarra' && (
                            <CodigosBarraPage />
                        )}
                        {vistaActual === 'moviminetoStock' && (
                            <MovimientosInventarioPage />
                        )}
                        {vistaActual === 'tickets' && (
                            <TicketsPage />
                        )}

                    </div>
                </section>
            </div>
        </main>
    );
}

function MenuItem({
    label,
    href,
    active = false,
    onClick,
}: {
    label: string;
    href?: string;
    active?: boolean;
    onClick?: () => void;
}) {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => {
                if (onClick) {
                    onClick();
                    return;
                }

                if (href) {
                    router.push(href);
                }
            }}
            className={`w-full text-left rounded-xl px-4 py-3 font-bold transition ${active
                ? 'bg-blue-700 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
        >
            {label}
        </button>
    );
}
function StatCard({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-900/95 p-5 shadow-lg shadow-cyan-500/10 border border-cyan-500/25">
            <p className="text-sm font-bold text-cyan-200/70">{title}</p>
            <h3 className="text-3xl font-black text-cyan-400 mt-2">{value}</h3>
        </div>
    );
}

