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

        onuId: '',
        vlan: '',
        puertoOlt: '',
        cajaNap: '',
        splitter: '',

        senalRx: '',
        senalTx: '',
    });
    const cargarDatosModal = async () => {
        try {

            const [resClientes, resPlanes, resRouters] = await Promise.all([
                fetch(`${API_BASE}/clientes`),
                fetch(`${API_BASE}/planes-internet`),
                fetch(`${API_BASE}/mikrotik/routers`)
            ]);

            const clientesData = await resClientes.json();
            const planesData = await resPlanes.json();
            const routersData = await resRouters.json();

            setClientes(clientesData.clientes || []);
            setPlanes(planesData.planes || []);
            setRouters(routersData.routers || []);

        } catch (error) {
            console.error('Error cargarDatosModal:', error);
        }
    };

    const abrirModalNuevoServicio = async () => {
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
                    {serviciosFiltrados.map((servicio) => (
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

                            <div style={styles.techBox}>
                                <p><strong>PPPoE:</strong> {servicio.pppSecret || 'No asignado'}</p>
                                <p><strong>Queue:</strong> {servicio.queueName || 'No asignado'}</p>
                                <p><strong>IP:</strong> {servicio.ipCliente || 'No asignada'}</p>
                                <p><strong>MAC:</strong> {servicio.mac || 'No asignada'}</p>
                            </div>

                            <div style={styles.gponBox}>
                                <p><strong>ONU:</strong> {servicio.onuId || 'N/A'}</p>
                                <p><strong>VLAN:</strong> {servicio.vlan || 'N/A'}</p>
                                <p><strong>Caja NAP:</strong> {servicio.cajaNap || 'N/A'}</p>
                                <p><strong>RX/TX:</strong> {servicio.senalRx || '-'} / {servicio.senalTx || '-'}</p>
                            </div>

                            <div style={styles.actions}>
                                <button style={styles.secondaryButton}>Editar</button>
                                <button style={styles.warningButton}>Suspender</button>
                                <button style={styles.dangerButton}>Retirar</button>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>

                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                Nuevo Servicio ISP
                            </h2>

                            <button
                                style={styles.closeButton}
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalBody}>

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
                                        {clientesFiltrados.length > 0 ? (
                                            clientesFiltrados.map((c) => (
                                                <button
                                                    key={c.clienteId}
                                                    type="button"
                                                    style={styles.clienteResultado}
                                                    onClick={() => {
                                                        setClienteSeleccionado(c);
                                                        setBusquedaCliente(`${c.nombres} ${c.apellidos} - ${c.cedula}`);
                                                        setFormData({
                                                            ...formData,
                                                            clienteId: c.clienteId,
                                                        });
                                                    }}
                                                >
                                                    {c.fotoPerfil ? (
                                                        <img
                                                            src={c.fotoPerfil}
                                                            alt={c.nombres}
                                                            style={styles.miniAvatar}
                                                        />
                                                    ) : (
                                                        <div style={styles.miniAvatarFallback}>
                                                            {c.nombres?.charAt(0)?.toUpperCase() || 'C'}
                                                        </div>
                                                    )}

                                                    <div style={{ textAlign: 'left' }}>
                                                        <strong style={{ color: '#fff' }}>
                                                            {c.nombres} {c.apellidos}
                                                        </strong>
                                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                                                            C.I: {c.cedula} · Tel: {c.telefono}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div style={styles.noResults}>
                                                No se encontraron clientes
                                            </div>
                                        )}
                                    </div>
                                )}

                                {clienteSeleccionado && (
                                    <div style={styles.clienteSeleccionado}>
                                        Cliente seleccionado: <strong>{clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}</strong>
                                    </div>
                                )}
                            </div>

                            <select
                                name="planId"
                                value={formData.planId}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                <option value="">Seleccionar plan</option>

                                {planes.map((p) => (
                                    <option
                                        key={p.planId}
                                        value={p.planId}
                                    >
                                        {p.nombrePlan}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="routerId"
                                value={formData.routerId}
                                onChange={handleChange}
                                style={styles.input}
                            >
                                <option
                                    value=""
                                    style={{ backgroundColor: '#0f172a', color: '#fff' }}
                                >
                                    Seleccionar router
                                </option>

                                {routers.map((r, index) => {
                                    const id = r.routerId || r.RouterId || r.id;
                                    const nombre = r.nombre || r.Nombre || r.name || 'Router sin nombre';

                                    return (
                                        <option
                                            key={id || index}
                                            value={id || ''}
                                            style={{
                                                backgroundColor: '#0f172a',
                                                color: '#fff',
                                            }}
                                        >
                                            {nombre}
                                        </option>
                                    );
                                })}
                            </select>

                            <input
                                type="date"
                                name="fechaInstalacion"
                                value={formData.fechaInstalacion}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="number"
                                name="diaPago"
                                placeholder="Día de pago"
                                value={formData.diaPago}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="pppSecret"
                                placeholder="PPPoE Secret"
                                value={formData.pppSecret}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="queueName"
                                placeholder="Queue Name"
                                value={formData.queueName}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="ipCliente"
                                placeholder="IP Cliente"
                                value={formData.ipCliente}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="mac"
                                placeholder="MAC"
                                value={formData.mac}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="onuId"
                                placeholder="ONU ID"
                                value={formData.onuId}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="vlan"
                                placeholder="VLAN"
                                value={formData.vlan}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="puertoOlt"
                                placeholder="Puerto OLT"
                                value={formData.puertoOlt}
                                onChange={handleChange}
                                style={styles.input}
                            />

                            <input
                                type="text"
                                name="cajaNap"
                                placeholder="Caja NAP"
                                value={formData.cajaNap}
                                onChange={handleChange}
                                style={styles.input}
                            />

                        </div>

                        <div style={styles.modalFooter}>
                            <button
                                style={styles.secondaryButton}
                                onClick={() => setShowModal(false)}
                            >
                                Cancelar
                            </button>

                            <button style={styles.primaryButton}>
                                Guardar servicio
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {

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