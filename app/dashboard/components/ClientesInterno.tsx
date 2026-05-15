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
            const token = await getToken();

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

            const token = await getToken();

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
            const token = await getToken();

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
            const token = await getToken();

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

            <div style={styles.listHeader}>
                <h2 style={styles.sectionTitle}>Clientes registrados</h2>
                <span style={styles.counter}>{clientes.length} clientes</span>
            </div>

            {loading ? (
                <p style={styles.loading}>Cargando clientes...</p>
            ) : (
                <div style={styles.grid}>
                    {clientes.map((cliente) => (
                        <article key={cliente.clienteId} style={styles.card}>
                            <div style={styles.cardTop}>
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
        </section>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
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