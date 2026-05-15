'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useEffect, useState } from 'react';

type PlanInternet = {
    planId: string;
    nombrePlan: string;
    velocidadBajada: string;
    velocidadSubida: string;
    precioMensual: string;
    tipoServicio: 'FIBRA' | 'RADIO' | 'MIXTO';
    descripcion?: string;
    estado: 'ACTIVO' | 'INACTIVO';
};

export default function PlanesInternetPage() {
    const [planes, setPlanes] = useState<PlanInternet[]>([]);
    const [loading, setLoading] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);

    const [form, setForm] = useState({
        nombrePlan: '',
        velocidadBajada: '',
        velocidadSubida: '',
        precioMensual: '',
        tipoServicio: 'FIBRA',
        descripcion: '',
        estado: 'ACTIVO',
    });

    useEffect(() => {
        cargarPlanes();
    }, []);

    const cargarPlanes = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const res = await fetch(`${API_BASE}/planes-internet`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.ok) {
                setPlanes(data.planes || []);
            }
        } catch (error) {
            console.error('Error cargando planes:', error);
            alert('Error cargando planes');
        } finally {
            setLoading(false);
        }
    };

    const limpiarForm = () => {
        setEditandoId(null);
        setForm({
            nombrePlan: '',
            velocidadBajada: '',
            velocidadSubida: '',
            precioMensual: '',
            tipoServicio: 'FIBRA',
            descripcion: '',
            estado: 'ACTIVO',
        });
    };

    const guardarPlan = async () => {
        try {
            if (!form.nombrePlan || !form.velocidadBajada || !form.velocidadSubida || !form.precioMensual) {
                alert('Complete los campos obligatorios');
                return;
            }

            const token = await getToken();

            const url = editandoId
                ? `${API_BASE}/planes-internet/${editandoId}`
                : `${API_BASE}/planes-internet`;

            const method = editandoId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo guardar el plan');
                return;
            }

            alert(editandoId ? 'Plan actualizado' : 'Plan creado');
            limpiarForm();
            cargarPlanes();
        } catch (error) {
            console.error('Error guardando plan:', error);
            alert('Error guardando plan');
        }
    };

    const editarPlan = (plan: PlanInternet) => {
        setEditandoId(plan.planId);
        setForm({
            nombrePlan: plan.nombrePlan || '',
            velocidadBajada: plan.velocidadBajada || '',
            velocidadSubida: plan.velocidadSubida || '',
            precioMensual: String(plan.precioMensual || ''),
            tipoServicio: plan.tipoServicio || 'FIBRA',
            descripcion: plan.descripcion || '',
            estado: plan.estado || 'ACTIVO',
        });
    };

    const cambiarEstado = async (plan: PlanInternet) => {
        try {
            const nuevoEstado = plan.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
            const token = await getToken();

            const res = await fetch(`${API_BASE}/planes-internet/${plan.planId}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estado: nuevoEstado }),
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo cambiar el estado');
                return;
            }

            cargarPlanes();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            alert('Error cambiando estado');
        }
    };

    const eliminarPlan = async (planId: string) => {
        if (!confirm('¿Seguro que desea eliminar este plan?')) return;

        try {
            const token = await getToken();

            const res = await fetch(`${API_BASE}/planes-internet/${planId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!data.ok) {
                alert(data.message || 'No se pudo eliminar');
                return;
            }

            cargarPlanes();
        } catch (error) {
            console.error('Error eliminando plan:', error);
            alert('Error eliminando plan');
        }
    };

    return (
        <main style={styles.page}>


            <section style={styles.formCard}>
                <h2 style={styles.formTitle}>
                    {editandoId ? 'Editar plan' : 'Nuevo plan'}
                </h2>

                <div style={styles.formGrid}>
                    <input
                        style={styles.input}
                        placeholder="Nombre del plan"
                        value={form.nombrePlan}
                        onChange={(e) => setForm({ ...form, nombrePlan: e.target.value })}
                    />

                    <input
                        style={styles.input}
                        placeholder="Velocidad bajada, ejemplo: 50 Mbps"
                        value={form.velocidadBajada}
                        onChange={(e) => setForm({ ...form, velocidadBajada: e.target.value })}
                    />

                    <input
                        style={styles.input}
                        placeholder="Velocidad subida, ejemplo: 20 Mbps"
                        value={form.velocidadSubida}
                        onChange={(e) => setForm({ ...form, velocidadSubida: e.target.value })}
                    />

                    <input
                        style={styles.input}
                        type="number"
                        step="0.01"
                        placeholder="Precio mensual"
                        value={form.precioMensual}
                        onChange={(e) => setForm({ ...form, precioMensual: e.target.value })}
                    />

                    <select
                        style={styles.input}
                        value={form.tipoServicio}
                        onChange={(e) => setForm({ ...form, tipoServicio: e.target.value })}
                    >
                        <option value="FIBRA">Fibra</option>
                        <option value="RADIO">Radio</option>
                        <option value="MIXTO">Mixto</option>
                    </select>

                    <select
                        style={styles.input}
                        value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    >
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                    </select>
                </div>

                <textarea
                    style={styles.textarea}
                    placeholder="Descripción"
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />

                <div style={styles.actions}>
                    <button style={styles.primaryButton} onClick={guardarPlan}>
                        {editandoId ? 'Actualizar plan' : 'Guardar plan'}
                    </button>

                    {editandoId && (
                        <button style={styles.cancelButton} onClick={limpiarForm}>
                            Cancelar
                        </button>
                    )}
                </div>
            </section>

            <section style={styles.listHeader}>
                <h2 style={styles.sectionTitle}>Listado de planes</h2>
                <span style={styles.counter}>{planes.length} planes</span>
            </section>

            {loading ? (
                <p style={styles.loading}>Cargando planes...</p>
            ) : (
                <section style={styles.grid}>
                    {planes.map((plan) => (
                        <article key={plan.planId} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div>
                                    <h3 style={styles.cardTitle}>{plan.nombrePlan}</h3>
                                    <p style={styles.cardSubtitle}>{plan.tipoServicio}</p>
                                </div>

                                <span
                                    style={{
                                        ...styles.badge,
                                        background:
                                            plan.estado === 'ACTIVO'
                                                ? 'rgba(34,197,94,0.15)'
                                                : 'rgba(239,68,68,0.15)',
                                        color:
                                            plan.estado === 'ACTIVO'
                                                ? '#22c55e'
                                                : '#ef4444',
                                    }}
                                >
                                    {plan.estado}
                                </span>
                            </div>

                            <div style={styles.speedBox}>
                                <div>
                                    <span style={styles.label}>Bajada</span>
                                    <strong style={styles.speed}>{plan.velocidadBajada}</strong>
                                </div>

                                <div>
                                    <span style={styles.label}>Subida</span>
                                    <strong style={styles.speed}>{plan.velocidadSubida}</strong>
                                </div>
                            </div>

                            <p style={styles.price}>
                                ${Number(plan.precioMensual).toFixed(2)}
                                <span style={styles.month}> / mes</span>
                            </p>

                            {plan.descripcion && (
                                <p style={styles.description}>{plan.descripcion}</p>
                            )}

                            <div style={styles.cardActions}>
                                <button style={styles.editButton} onClick={() => editarPlan(plan)}>
                                    Editar
                                </button>

                                <button style={styles.statusButton} onClick={() => cambiarEstado(plan)}>
                                    {plan.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                                </button>

                                <button style={styles.deleteButton} onClick={() => eliminarPlan(plan.planId)}>
                                    Eliminar
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: '100vh',
        background: '#020617',
        color: '#fff',
        padding: '28px',
    },
    header: {
        background: 'linear-gradient(135deg, #0f172a, #111827)',
        border: '1px solid rgba(34,211,238,0.25)',
        borderRadius: '22px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 20px 60px rgba(8,145,178,0.15)',
    },
    title: {
        fontSize: '30px',
        fontWeight: 900,
        margin: 0,
    },
    subtitle: {
        color: '#94a3b8',
        marginTop: '8px',
        fontSize: '15px',
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
        minHeight: '85px',
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
    },
    cardSubtitle: {
        margin: '6px 0 0 0',
        color: '#38bdf8',
        fontWeight: 700,
    },
    badge: {
        padding: '7px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 900,
    },
    speedBox: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '18px',
    },
    label: {
        display: 'block',
        color: '#94a3b8',
        fontSize: '12px',
        marginBottom: '5px',
    },
    speed: {
        fontSize: '17px',
    },
    price: {
        fontSize: '30px',
        fontWeight: 900,
        margin: '20px 0 8px',
        color: '#22c55e',
    },
    month: {
        fontSize: '14px',
        color: '#94a3b8',
    },
    description: {
        color: '#cbd5e1',
        fontSize: '14px',
        minHeight: '38px',
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
    statusButton: {
        background: '#f59e0b',
        color: '#111827',
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