'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';



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

};

export default function ContratosServiciosPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

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
        });

        setBusquedaCliente('');
        setClienteSeleccionado(null);
        setTipoServicioSeleccionado('');
        setModoEdicion(false);
        setServicioEditandoId('');
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

    useEffect(() => {
        cargarServicios();
    }, []);

    const serviciosFiltrados = servicios.filter((s) => {
        const texto = `${s.nombres} ${s.apellidos} ${s.cedula} ${s.telefono} ${s.email} ${s.nombrePlan} ${s.pppSecret} ${s.ipCliente}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
    });

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


    const clientesFiltrados = clientes
        .filter((c) => {
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
    return (
        <main style={styles.page}>
            <section style={styles.header}>

                <button style={styles.primaryButton}

                    onClick={abrirModalNuevoServicio}
                >
                    + Nuevo servicio
                </button>
            </section>

            <section style={styles.filters}>
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por cliente, cédula, teléfono, plan, PPPoE o IP..."
                    style={styles.searchInput}
                />
            </section>

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
                                        <p style={styles.smallText}>Cédula: {servicio.cedula}</p>
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
                                </div>

                                <div style={styles.infoBox}>
                                    <p><strong>Plan:</strong> {servicio.nombrePlan}</p>
                                    <p><strong>Bajada:</strong> {servicio.velocidadBajada}</p>
                                    <p><strong>Subida:</strong> {servicio.velocidadSubida}</p>
                                    <p><strong>Precio:</strong> ${Number(servicio.precioMensual || 0).toFixed(2)}</p>
                                    <p><strong>Día de pago:</strong> {servicio.diaPago}</p>
                                </div>

                                <div style={styles.contractBox}>
                                    <p><strong>Contrato:</strong> {servicio.tipoContrato || 'No definido'}</p>
                                    <p>
                                        <strong>Fecha de firma/instalación:</strong> {formatearFecha(servicio.fechaInstalacion)}
                                    </p>
                                    <p><strong>Canal:</strong> {servicio.canalContrato || 'No definido'}</p>
                                    <p><strong>Tiempo:</strong> {servicio.tiempoContratoMeses ? `${servicio.tiempoContratoMeses} meses` : 'No definido'}</p>

                                    <p><strong>Instalación:</strong> ${Number(servicio.precioInstalacion || 0).toFixed(2)}</p>
                                    <p><strong>Descuento:</strong> ${Number(servicio.descuentoInstalacion || 0).toFixed(2)}</p>
                                    <p><strong>Gratis:</strong> {servicio.instalacionGratis ? 'Sí' : 'No'}</p>
                                </div>

                                <div style={styles.techBox}>
                                    <p><strong>PPPoE:</strong> {servicio.pppSecret || 'No asignado'}</p>
                                    <p><strong>Queue:</strong> {servicio.queueName || 'No asignado'}</p>
                                    <p><strong>IP:</strong> {servicio.ipCliente || 'No asignada'}</p>
                                    <p><strong>MAC:</strong> {servicio.mac || 'No asignada'}</p>
                                </div>


                                {esFibra && (
                                    <div style={styles.gponBox}>
                                        <p><strong>Tipo técnico:</strong> Fibra óptica / GPON</p>
                                        <p><strong>Nodo fibra:</strong> {servicio.nombreNodoFibra || 'N/A'}</p>
                                        <p><strong>NAP:</strong> {servicio.nombreNap || servicio.cajaNap || 'N/A'}</p>
                                        <p><strong>Puerto NAP:</strong> {servicio.puertoNap || 'N/A'}</p>
                                        <p><strong>ONU:</strong> {servicio.onuId || 'N/A'}</p>
                                        <p><strong>VLAN:</strong> {servicio.vlan || 'N/A'}</p>
                                        <p><strong>RX/TX:</strong> {servicio.senalRx || '-'} / {servicio.senalTx || '-'}</p>
                                    </div>
                                )}

                                {esWisp && (
                                    <div style={styles.gponBox}>
                                        <p><strong>Tipo técnico:</strong> WISP / Radio enlace</p>
                                        <p><strong>Torre:</strong> {servicio.nombreTorre || 'N/A'}</p>
                                        <p><strong>Sectorial:</strong> {servicio.nombreSectorial || servicio.sectorial || 'N/A'}</p>
                                        <p><strong>Frecuencia:</strong> {servicio.frecuencia || 'N/A'}</p>
                                        <p><strong>SSID:</strong> {servicio.ssid || 'N/A'}</p>
                                        <p><strong>IP antena:</strong> {servicio.ipAntena || 'N/A'}</p>
                                        <p><strong>Modelo antena:</strong> {servicio.modeloAntena || 'N/A'}</p>
                                        <p><strong>Usuario CPE:</strong> {servicio.usuarioCpe || 'N/A'}</p>
                                    </div>
                                )}
                                <p><strong>Estado:</strong></p>
                                <div style={styles.actions}>

                                    <button
                                        style={styles.warningButton}
                                        onClick={() =>
                                            cambiarEstadoServicio(
                                                servicio.servicioId,
                                                servicio.estadoServicio === 'SUSPENDIDO' ? 'ACTIVO' : 'SUSPENDIDO'
                                            )
                                        }
                                    >
                                        {servicio.estadoServicio === 'SUSPENDIDO' ? 'Activar' : 'Suspender'}
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
                                        onClick={() => abrirContratoPdf(servicio)}
                                    >
                                        PDF contrato
                                    </button>

                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => abrirFacturacion(servicio, 'INTERNA')}
                                    >
                                        Fact. interna
                                    </button>

                                    <button
                                        style={styles.secondaryButton}
                                        onClick={() => abrirFacturacion(servicio, 'SRI')}
                                    >
                                        Fact. SRI
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
            )}

            {showModal && (
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

                                {planes.map((p) => (
                                    <option
                                        key={p.planId}
                                        value={p.planId}
                                        style={styles.option}
                                    >
                                        {p.nombrePlan} - {p.tipoServicio}
                                    </option>
                                ))}
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

                            {/* FECHA */}
                            <input
                                type="date"
                                name="fechaInstalacion"
                                value={formData.fechaInstalacion}
                                onChange={handleChange}
                                style={styles.inputDate}
                            />

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
                                placeholder="Día de pago"
                                name="diaPago"
                                value={formData.diaPago}
                                onChange={handleChange}
                                style={styles.input}
                            />

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
                                📝 Datos del contrato
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
            )}
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {

    inputDate: {
        width: '100%',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #334155',
        background: '#0F172A',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        colorScheme: 'dark',
    },
    contractBox: {
        background: '#c1d9f1',
        border: '1px solid #a6c7f1',
        borderRadius: '12px',
        padding: '12px',
        marginTop: '10px',
        fontSize: '13px',
        color: '#334155',
        marginBottom: 10,
    },

    input: {
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px',
        color: '#fff',
        outline: 'none',

    },
    autocompleteBox: {
        position: 'relative',
        gridColumn: '1 / -1',
    },

    sectionLabel: {
        gridColumn: '1 / -1',
        color: '#67e8f9',
        fontWeight: 900,
        marginTop: '10px',
        marginBottom: '-4px',
        fontSize: '15px',
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
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '20px',
    },

    modal: {
        width: '100%',
        maxWidth: '900px',
        background: '#020617',
        borderRadius: '24px',
        border: '1px solid rgba(34,211,238,0.25)',
        overflow: 'hidden',
    },

    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
    },

    modalTitle: {
        color: '#fff',
        margin: 0,
    },

    closeButton: {
        background: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: '22px',
        cursor: 'pointer',
    },

    modalBody: {
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
        gap: '14px',
        maxHeight: '70vh',
        overflowY: 'auto',
    },

    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
    },



    page: {
        minHeight: '100vh',
        background: '#020617',
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
        borderRadius: '14px',
        padding: '12px 18px',
        fontWeight: 800,
        cursor: 'pointer',
    },
    filters: {
        marginBottom: '24px',
    },
    searchInput: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '14px',
        border: '1px solid rgba(34,211,238,0.35)',
        background: '#0f172a',
        color: '#fff',
        outline: 'none',
    },
    loading: {
        color: '#94a3b8',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
        gap: '20px',
    },
    card: {
        background: 'linear-gradient(180deg, #0f172a, #020617)',
        border: '1px solid rgba(34,211,238,0.22)',
        borderRadius: '22px',
        padding: '18px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
    },
    cardTop: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '14px',
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
        marginBottom: '14px',
    },
    badge: {
        padding: '6px 10px',
        borderRadius: '999px',
        color: '#fff',
        fontWeight: 800,
        fontSize: '12px',
    },
    typeBadge: {
        padding: '6px 10px',
        borderRadius: '999px',
        background: '#1e293b',
        color: '#67e8f9',
        fontWeight: 800,
        fontSize: '12px',
    },
    infoBox: {
        background: 'rgba(15,23,42,0.85)',
        borderRadius: '14px',
        padding: '12px',
        marginBottom: '10px',
        fontSize: '14px',
    },
    techBox: {
        background: 'rgba(30,41,59,0.75)',
        borderRadius: '14px',
        padding: '12px',
        marginBottom: '10px',
        fontSize: '14px',
    },
    gponBox: {
        background: 'rgba(8,47,73,0.45)',
        borderRadius: '14px',
        padding: '12px',
        marginBottom: '14px',
        fontSize: '14px',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    secondaryButton: {
        background: '#334155',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '9px 12px',
        cursor: 'pointer',
    },
    warningButton: {
        background: '#f59e0b',
        color: '#111827',
        border: 'none',
        borderRadius: '10px',
        padding: '9px 12px',
        fontWeight: 800,
        cursor: 'pointer',
    },
    dangerButton: {
        background: '#dc2626',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '9px 12px',
        cursor: 'pointer',
    },
};