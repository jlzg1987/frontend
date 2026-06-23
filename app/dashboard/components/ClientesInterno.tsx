'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type Cliente = {
    clienteId: string;
    usuarioId: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    fotoPerfil?: string | null;
    cedula: string;
    direccion: string;
    referencia?: string;
    provincia?: string;
    canton?: string;
    parroquia?: string;
    lat?: string;
    lng?: string;
    estadoCliente: 'ACTIVO' | 'SUSPENDIDO' | 'RETIRADO';
};

export default function ClientesInterno() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);

    const [modalPassword, setModalPassword] = useState(false);
    const [clientePassword, setClientePassword] = useState<Cliente | null>(null);
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');

    const [verPassword, setVerPassword] = useState(false);
    const [verConfirmarPassword, setVerConfirmarPassword] = useState(false);

    const [busqueda, setBusqueda] = useState('');


    const [form, setForm] = useState({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        telefono: '',
        cedula: '',
        direccion: '',
        referencia: '',
        provincia: '',
        canton: '',
        parroquia: '',
        lat: '',
        lng: '',
        estadoCliente: 'ACTIVO',
    });

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            setLoading(true);
            const token = getToken();

            const res = await fetch(`${API_BASE}/clientes`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (data.ok) {
                setClientes(data.clientes || []);
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
            alert('Error cargando clientes');
        } finally {
            setLoading(false);
        }
    };

    const limpiarForm = () => {
        setEditandoId(null);
        setForm({
            nombres: '',
            apellidos: '',
            email: '',
            password: '',
            telefono: '',
            cedula: '',
            direccion: '',
            referencia: '',
            provincia: '',
            canton: '',
            parroquia: '',
            lat: '',
            lng: '',
            estadoCliente: 'ACTIVO',
        });
    };

    const guardarCliente = async () => {
        try {
            if (!form.nombres || !form.apellidos || !form.email || !form.telefono || !form.cedula || !form.direccion) {
                alert('Complete los campos obligatorios');
                return;
            }

            if (!editandoId && !form.password) {
                alert('Ingrese una contraseña para el cliente');
                return;
            }

            const token = getToken();

            const url = editandoId
                ? `${API_BASE}/clientes/${editandoId}`
                : `${API_BASE}/clientes`;

            const method = editandoId ? 'PUT' : 'POST';

            const body: any = { ...form };

            if (editandoId) {
                delete body.password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo guardar el cliente');
                return;
            }

            alert(editandoId ? 'Cliente actualizado' : 'Cliente creado');
            limpiarForm();
            cargarClientes();
        } catch (error) {
            console.error('Error guardando cliente:', error);
            alert('Error guardando cliente');
        }
    };

    const editarCliente = (cliente: Cliente) => {
        setEditandoId(cliente.clienteId);

        setForm({
            nombres: cliente.nombres || '',
            apellidos: cliente.apellidos || '',
            email: cliente.email || '',
            password: '',
            telefono: cliente.telefono || '',
            cedula: cliente.cedula || '',
            direccion: cliente.direccion || '',
            referencia: cliente.referencia || '',
            provincia: cliente.provincia || '',
            canton: cliente.canton || '',
            parroquia: cliente.parroquia || '',
            lat: String(cliente.lat || ''),
            lng: String(cliente.lng || ''),
            estadoCliente: cliente.estadoCliente || 'ACTIVO',
        });
    };

    const cambiarEstado = async (cliente: Cliente, estadoCliente: string) => {
        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/clientes/${cliente.clienteId}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estadoCliente }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo cambiar el estado');
                return;
            }

            cargarClientes();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            alert('Error cambiando estado');
        }
    };

    const eliminarCliente = async (clienteId: string) => {
        if (!confirm('¿Seguro que desea eliminar este cliente? También se eliminará su usuario.')) return;

        try {
            const token = getToken();

            const res = await fetch(`${API_BASE}/clientes/${clienteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo eliminar');
                return;
            }

            cargarClientes();
        } catch (error) {
            console.error('Error eliminando cliente:', error);
            alert('Error eliminando cliente');
        }
    };


    const abrirModalPassword = (cliente: Cliente) => {
        setClientePassword(cliente);
        setNuevaPassword('');
        setConfirmarPassword('');
        setModalPassword(true);
    };

    const cerrarModalPassword = () => {
        setModalPassword(false);
        setClientePassword(null);
        setNuevaPassword('');
        setConfirmarPassword('');
    };

    const guardarNuevaPassword = async () => {
        try {
            if (!clientePassword) return;

            if (!nuevaPassword || nuevaPassword.length < 6) {
                alert('La contraseña debe tener mínimo 6 caracteres');
                return;
            }

            if (nuevaPassword !== confirmarPassword) {
                alert('Las contraseñas no coinciden');
                return;
            }

            const token = getToken();

            const res = await fetch(`${API_BASE}/clientes/${clientePassword.clienteId}/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    password: nuevaPassword,
                }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo cambiar la contraseña');
                return;
            }

            alert('Contraseña actualizada correctamente');
            cerrarModalPassword();

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            alert('Error cambiando contraseña');
        }
    };

    const clientesFiltrados = clientes.filter((cliente) => {
        const texto = busqueda.toLowerCase().trim();

        const nombreCompleto = `${cliente.nombres} ${cliente.apellidos}`.toLowerCase();
        const cedula = String(cliente.cedula || '').toLowerCase();
        const telefono = String(cliente.telefono || '').toLowerCase();
        const email = String(cliente.email || '').toLowerCase();

        return (
            nombreCompleto.includes(texto) ||
            cedula.includes(texto) ||
            telefono.includes(texto) ||
            email.includes(texto)
        );
    });

    return (
        <section style={styles.wrapper}>
            <div style={styles.formCard}>
                <h2 style={styles.formTitle}>
                    {editandoId ? 'Editar cliente' : 'Registrar cliente'}
                </h2>

                <div style={styles.formGrid}>
                    <input style={styles.input} placeholder="Nombres *" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
                    <input style={styles.input} placeholder="Apellidos *" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
                    <input style={styles.input} placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <input style={styles.input} placeholder="Teléfono *" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />

                    {!editandoId && (
                        <input
                            style={styles.input}
                            type="password"
                            placeholder="Contraseña *"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    )}

                    <input style={styles.input} placeholder="Cédula/RUC *" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
                    <input style={styles.input} placeholder="Provincia" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} />
                    <input style={styles.input} placeholder="Cantón" value={form.canton} onChange={(e) => setForm({ ...form, canton: e.target.value })} />
                    <input style={styles.input} placeholder="Parroquia" value={form.parroquia} onChange={(e) => setForm({ ...form, parroquia: e.target.value })} />
                    <input style={styles.input} placeholder="Latitud" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                    <input style={styles.input} placeholder="Longitud" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />

                    <select
                        style={styles.input}
                        value={form.estadoCliente}
                        onChange={(e) => setForm({ ...form, estadoCliente: e.target.value })}
                    >
                        <option value="ACTIVO">Activo</option>
                        <option value="SUSPENDIDO">Suspendido</option>
                        <option value="RETIRADO">Retirado</option>
                    </select>
                </div>

                <textarea
                    style={styles.textarea}
                    placeholder="Dirección *"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />

                <textarea
                    style={styles.textarea}
                    placeholder="Referencia"
                    value={form.referencia}
                    onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                />

                <div style={styles.actions}>
                    <button style={styles.primaryButton} onClick={guardarCliente}>
                        {editandoId ? 'Actualizar cliente' : 'Guardar cliente'}
                    </button>

                    {editandoId && (
                        <button style={styles.cancelButton} onClick={limpiarForm}>
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div style={styles.searchCard}>
                <div>
                    <h3 style={styles.searchTitle}>Buscar cliente</h3>
                    <p style={styles.searchSubtitle}>
                        Filtra por nombre, cédula, celular o email.
                    </p>
                </div>

                <input
                    style={styles.searchInput}
                    placeholder="Buscar cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>


            <div style={styles.listHeader}>
                <h2 style={styles.sectionTitle}>Clientes registrados</h2>
                <span style={styles.counter}>
                    {clientesFiltrados.length} de {clientes.length} clientes
                </span>
            </div>

            {loading ? (
                <p style={styles.loading}>Cargando clientes...</p>
            ) : (
                <div style={styles.grid}>
                    {clientesFiltrados.map((cliente) => (
                        <article key={cliente.clienteId} style={styles.card}>
                            <div style={styles.cardTop}>
                                {cliente.fotoPerfil ? (
                                    <img
                                        src={cliente.fotoPerfil}
                                        alt={`${cliente.nombres} ${cliente.apellidos}`}
                                        style={styles.avatarImg}
                                    />
                                ) : (
                                    <div style={styles.avatarFallback}>
                                        {cliente.nombres?.charAt(0)?.toUpperCase() || 'C'}
                                    </div>
                                )}

                                <div>
                                    <h3 style={styles.cardTitle}>
                                        {cliente.nombres} {cliente.apellidos}
                                    </h3>
                                    <p style={styles.cardSubtitle}>{cliente.email}</p>
                                </div>

                                <span
                                    style={{
                                        ...styles.badge,
                                        background:
                                            cliente.estadoCliente === 'ACTIVO'
                                                ? 'rgba(34,197,94,0.15)'
                                                : cliente.estadoCliente === 'SUSPENDIDO'
                                                    ? 'rgba(245,158,11,0.15)'
                                                    : 'rgba(239,68,68,0.15)',
                                        color:
                                            cliente.estadoCliente === 'ACTIVO'
                                                ? '#22c55e'
                                                : cliente.estadoCliente === 'SUSPENDIDO'
                                                    ? '#f59e0b'
                                                    : '#ef4444',
                                    }}
                                >
                                    {cliente.estadoCliente}
                                </span>
                            </div>

                            <div style={styles.infoBox}>
                                <p><strong>Cédula:</strong> {cliente.cedula}</p>
                                <p><strong>Teléfono:</strong> {cliente.telefono}</p>
                                <p><strong>Dirección:</strong> {cliente.direccion}</p>
                                <p><strong>Ubicación:</strong> {cliente.provincia || '-'} / {cliente.canton || '-'}</p>
                            </div>

                            <div style={styles.cardActions}>
                                <button style={styles.editButton} onClick={() => editarCliente(cliente)}>
                                    Editar
                                </button>
                                <button style={styles.passwordButton} onClick={() => abrirModalPassword(cliente)}>
                                    Cambiar contraseña
                                </button>

                                <button style={styles.warningButton} onClick={() => cambiarEstado(cliente, 'SUSPENDIDO')}>
                                    Suspender
                                </button>

                                <button style={styles.activeButton} onClick={() => cambiarEstado(cliente, 'ACTIVO')}>
                                    Activar
                                </button>

                                <button style={styles.deleteButton} onClick={() => eliminarCliente(cliente.clienteId)}>
                                    Eliminar
                                </button>

                            </div>
                        </article>
                    ))}
                </div>
            )}

            {modalPassword && clientePassword && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.modalHeader}>
                            <div>
                                <h2 style={styles.modalTitle}>Cambiar contraseña</h2>
                                <p style={styles.modalSubtitle}>
                                    Cliente: {clientePassword.nombres} {clientePassword.apellidos}
                                </p>
                            </div>

                            <button style={styles.closeButton} onClick={cerrarModalPassword}>
                                ×
                            </button>
                        </div>

                        <div style={styles.passwordWrapper}>
                            <input
                                style={styles.inputPassword}
                                type={verPassword ? 'text' : 'password'}
                                placeholder="Nueva contraseña"
                                value={nuevaPassword}
                                onChange={(e) => setNuevaPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                style={styles.eyeButton}
                                onClick={() => setVerPassword(!verPassword)}
                            >
                                {verPassword ? '🙈' : '👁️'}
                            </button>
                        </div>

                        <div style={styles.passwordWrapper}>
                            <input
                                style={styles.inputPassword}
                                type={verConfirmarPassword ? 'text' : 'password'}
                                placeholder="Confirmar contraseña"
                                value={confirmarPassword}
                                onChange={(e) => setConfirmarPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                style={styles.eyeButton}
                                onClick={() => setVerConfirmarPassword(!verConfirmarPassword)}
                            >
                                {verConfirmarPassword ? '🙈' : '👁️'}
                            </button>
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.cancelButton} onClick={cerrarModalPassword}>
                                Cancelar
                            </button>

                            <button style={styles.savePasswordButton} onClick={guardarNuevaPassword}>
                                Guardar contraseña
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    avatarImg: {
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #22d3ee',
        boxShadow: '0 0 14px rgba(34,211,238,0.35)',
    },

    avatarFallback: {
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0891b2, #2563eb)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: '20px',
        border: '2px solid #22d3ee',
    },

    searchCard: {
        background: '#0f172a',
        border: '1px solid rgba(34,211,238,0.20)',
        borderRadius: '18px',
        padding: '18px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
    },

    searchTitle: {
        margin: 0,
        color: '#fff',
        fontSize: '18px',
        fontWeight: 900,
    },

    searchSubtitle: {
        margin: '6px 0 0 0',
        color: '#94a3b8',
        fontSize: '13px',
    },

    searchInput: {
        width: '100%',
        maxWidth: '420px',
        background: '#020617',
        border: '1px solid #334155',
        color: '#fff',
        padding: '13px 14px',
        borderRadius: '12px',
        outline: 'none',
        fontSize: '14px',
    },
    passwordWrapper: {
        position: 'relative',
        width: '100%',
    },

    inputPassword: {
        width: '100%',
        background: '#020617',
        border: '1px solid #334155',
        color: '#fff',
        padding: '13px 48px 13px 14px',
        borderRadius: '12px',
        outline: 'none',
        fontSize: '14px',
    },

    eyeButton: {
        position: 'absolute',
        top: '50%',
        right: '10px',
        transform: 'translateY(-50%)',
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        border: 'none',
        background: '#1e293b',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '16px',
    },

    passwordButton: {
        background: '#7c3aed',
        color: '#fff',
        border: 'none',
        padding: '10px 13px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 700,
    },

    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
    },

    modalCard: {
        width: '100%',
        maxWidth: '460px',
        background: 'linear-gradient(180deg, #0f172a, #020617)',
        border: '1px solid rgba(124,58,237,0.45)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 80px rgba(124,58,237,0.25)',
    },

    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
    },

    modalTitle: {
        margin: 0,
        color: '#fff',
        fontSize: '24px',
        fontWeight: 900,
    },

    modalSubtitle: {
        marginTop: '8px',
        color: '#94a3b8',
        fontSize: '14px',
    },

    closeButton: {
        width: '36px',
        height: '36px',
        borderRadius: '999px',
        border: 'none',
        background: '#1e293b',
        color: '#fff',
        fontSize: '24px',
        cursor: 'pointer',
    },

    modalBody: {
        display: 'grid',
        gap: '14px',
        marginTop: '22px',
    },

    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px',
        flexWrap: 'wrap',
    },

    savePasswordButton: {
        background: '#7c3aed',
        color: '#fff',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '12px',
        fontWeight: 900,
        cursor: 'pointer',
    },
    wrapper: {
        width: '100%',
    },
    formCard: {
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: '20px',
        padding: '22px',
        marginBottom: '26px',
    },
    formTitle: {
        margin: '0 0 18px 0',
        fontSize: '22px',
        color: '#fff',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
    },
    input: {
        background: '#020617',
        border: '1px solid #334155',
        color: '#fff',
        padding: '13px 14px',
        borderRadius: '12px',
        outline: 'none',
        fontSize: '14px',
    },
    textarea: {
        width: '100%',
        marginTop: '14px',
        minHeight: '80px',
        background: '#020617',
        border: '1px solid #334155',
        color: '#fff',
        padding: '13px 14px',
        borderRadius: '12px',
        outline: 'none',
        fontSize: '14px',
        resize: 'vertical',
    },
    actions: {
        display: 'flex',
        gap: '12px',
        marginTop: '18px',
        flexWrap: 'wrap',
    },
    primaryButton: {
        background: '#06b6d4',
        color: '#001016',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '12px',
        fontWeight: 800,
        cursor: 'pointer',
    },
    cancelButton: {
        background: '#334155',
        color: '#fff',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '12px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
    },
    sectionTitle: {
        margin: 0,
        fontSize: '22px',
        color: '#fff',
    },
    counter: {
        background: 'rgba(34,211,238,0.12)',
        color: '#22d3ee',
        padding: '8px 12px',
        borderRadius: '999px',
        fontWeight: 700,
    },
    loading: {
        color: '#94a3b8',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '18px',
    },
    card: {
        background: 'linear-gradient(180deg, #0f172a, #020617)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
    },
    cardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        alignItems: 'flex-start',
    },
    cardTitle: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 900,
        color: '#fff',
    },
    cardSubtitle: {
        margin: '6px 0 0 0',
        color: '#38bdf8',
        fontWeight: 600,
        fontSize: '13px',
    },
    badge: {
        padding: '7px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 900,
    },
    infoBox: {
        marginTop: '16px',
        color: '#cbd5e1',
        fontSize: '14px',
        lineHeight: 1.7,
    },
    cardActions: {
        display: 'flex',
        gap: '9px',
        marginTop: '18px',
        flexWrap: 'wrap',
    },
    editButton: {
        background: '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '10px 13px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 700,
    },
    warningButton: {
        background: '#f59e0b',
        color: '#111827',
        border: 'none',
        padding: '10px 13px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 800,
    },
    activeButton: {
        background: '#22c55e',
        color: '#052e16',
        border: 'none',
        padding: '10px 13px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 800,
    },
    deleteButton: {
        background: '#dc2626',
        color: '#fff',
        border: 'none',
        padding: '10px 13px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 700,
    },
};