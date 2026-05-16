'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';



type Torre = {
    torreId: string;
    nombreTorre: string;
};

type Sectorial = {
    sectorialId: string;
    torreId: string;
    nombreTorre: string;
    nombreSectorial: string;
    ipSectorial?: string;
    ssid?: string;
    frecuencia?: string;
    estado: 'ACTIVA' | 'INACTIVA' | 'MANTENIMIENTO';
    created_at?: string;
};

export default function SectorialesWispPage() {
    const [sectoriales, setSectoriales] = useState<Sectorial[]>([]);
    const [torres, setTorres] = useState<Torre[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<Sectorial | null>(null);
    const [busqueda, setBusqueda] = useState('');

    const [formData, setFormData] = useState({
        torreId: '',
        nombreSectorial: '',
        ipSectorial: '',
        ssid: '',
        frecuencia: '',
        estado: 'ACTIVA',
    });

    const cargarDatos = async () => {
        try {
            setLoading(true);

            const [resSectoriales, resTorres] = await Promise.all([
                fetch(`${API_BASE}/sectoriales-wisp`),
                fetch(`${API_BASE}/torres-wisp`),
            ]);

            const dataSectoriales = await resSectoriales.json();
            const dataTorres = await resTorres.json();

            setSectoriales(dataSectoriales.sectoriales || []);
            setTorres(dataTorres.torres || []);
        } catch (error) {
            console.error('Error cargando sectoriales:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const abrirNuevo = () => {
        setEditando(null);
        setFormData({
            torreId: '',
            nombreSectorial: '',
            ipSectorial: '',
            ssid: '',
            frecuencia: '',
            estado: 'ACTIVA',
        });
        setShowModal(true);
    };

    const abrirEditar = (s: Sectorial) => {
        setEditando(s);
        setFormData({
            torreId: s.torreId || '',
            nombreSectorial: s.nombreSectorial || '',
            ipSectorial: s.ipSectorial || '',
            ssid: s.ssid || '',
            frecuencia: s.frecuencia || '',
            estado: s.estado || 'ACTIVA',
        });
        setShowModal(true);
    };

    const guardarSectorial = async () => {
        try {
            if (!formData.torreId || !formData.nombreSectorial) {
                alert('Seleccione una torre y escriba el nombre de la sectorial');
                return;
            }

            const url = editando
                ? `${API_BASE}/sectoriales-wisp/${editando.sectorialId}`
                : `${API_BASE}/sectoriales-wisp`;

            const method = editando ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo guardar la sectorial');
                return;
            }

            setShowModal(false);
            cargarDatos();
        } catch (error) {
            console.error('Error guardando sectorial:', error);
            alert('Error al guardar sectorial');
        }
    };

    const cambiarEstado = async (sectorialId: string, estado: string) => {
        try {
            const res = await fetch(`${API_BASE}/sectoriales-wisp/${sectorialId}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado }),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo cambiar el estado');
                return;
            }

            cargarDatos();
        } catch (error) {
            console.error('Error cambiando estado:', error);
        }
    };

    const eliminarSectorial = async (sectorialId: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta sectorial?')) return;

        try {
            const res = await fetch(`${API_BASE}/sectoriales-wisp/${sectorialId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo eliminar');
                return;
            }

            cargarDatos();
        } catch (error) {
            console.error('Error eliminando sectorial:', error);
        }
    };

    const sectorialesFiltradas = sectoriales.filter((s) => {
        const texto = `${s.nombreSectorial} ${s.nombreTorre} ${s.ipSectorial} ${s.ssid} ${s.frecuencia} ${s.estado}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
    });

    const colorEstado = (estado: string) => {
        if (estado === 'ACTIVA') return '#16a34a';
        if (estado === 'MANTENIMIENTO') return '#f59e0b';
        return '#dc2626';
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>


                <button style={styles.primaryButton} onClick={abrirNuevo}>
                    + Nueva sectorial
                </button>
            </section>

            <section style={styles.filters}>
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por sectorial, torre, IP, SSID, frecuencia o estado..."
                    style={styles.input}
                />
            </section>

            {loading ? (
                <p style={styles.loading}>Cargando sectoriales...</p>
            ) : (
                <section style={styles.grid}>
                    {sectorialesFiltradas.map((s) => (
                        <article key={s.sectorialId} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={styles.iconBox}>📶</div>

                                <div>
                                    <h3 style={styles.cardTitle}>{s.nombreSectorial}</h3>
                                    <p style={styles.smallText}>Torre: {s.nombreTorre}</p>
                                </div>
                            </div>

                            <span
                                style={{
                                    ...styles.badge,
                                    backgroundColor: colorEstado(s.estado),
                                }}
                            >
                                {s.estado}
                            </span>

                            <div style={styles.infoBox}>
                                <p><strong>IP:</strong> {s.ipSectorial || 'No asignada'}</p>
                                <p><strong>SSID:</strong> {s.ssid || 'No asignado'}</p>
                                <p><strong>Frecuencia:</strong> {s.frecuencia || 'No asignada'}</p>
                            </div>

                            <div style={styles.actions}>
                                <button style={styles.secondaryButton} onClick={() => abrirEditar(s)}>
                                    Editar
                                </button>

                                <button
                                    style={styles.warningButton}
                                    onClick={() => cambiarEstado(s.sectorialId, 'MANTENIMIENTO')}
                                >
                                    Mantenimiento
                                </button>

                                <button
                                    style={styles.successButton}
                                    onClick={() => cambiarEstado(s.sectorialId, 'ACTIVA')}
                                >
                                    Activar
                                </button>

                                <button
                                    style={styles.dangerButton}
                                    onClick={() => eliminarSectorial(s.sectorialId)}
                                >
                                    Eliminar
                                </button>
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
                                {editando ? 'Editar sectorial' : 'Nueva sectorial'}
                            </h2>

                            <button style={styles.closeButton} onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <select
                                value={formData.torreId}
                                onChange={(e) => setFormData({ ...formData, torreId: e.target.value })}
                                style={styles.input}
                            >
                                <option value="" style={styles.option}>Seleccionar torre</option>
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

                            <input
                                placeholder="Nombre sectorial"
                                value={formData.nombreSectorial}
                                onChange={(e) => setFormData({ ...formData, nombreSectorial: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="IP sectorial"
                                value={formData.ipSectorial}
                                onChange={(e) => setFormData({ ...formData, ipSectorial: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="SSID"
                                value={formData.ssid}
                                onChange={(e) => setFormData({ ...formData, ssid: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="Frecuencia, ejemplo: 5.8 GHz"
                                value={formData.frecuencia}
                                onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
                                style={styles.input}
                            />

                            <select
                                value={formData.estado}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                style={styles.input}
                            >
                                <option value="ACTIVA" style={styles.option}>ACTIVA</option>
                                <option value="INACTIVA" style={styles.option}>INACTIVA</option>
                                <option value="MANTENIMIENTO" style={styles.option}>MANTENIMIENTO</option>
                            </select>
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.secondaryButton} onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>

                            <button style={styles.primaryButton} onClick={guardarSectorial}>
                                Guardar sectorial
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
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
        marginBottom: '22px',
        flexWrap: 'wrap',
    },
    title: {
        margin: 0,
        color: '#fff',
        fontSize: '32px',
        fontWeight: 900,
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
        fontWeight: 900,
        cursor: 'pointer',
    },
    filters: {
        marginBottom: '22px',
    },
    input: {
        width: '100%',
        background: '#0f172a',
        border: '1px solid rgba(34,211,238,0.26)',
        borderRadius: '12px',
        padding: '12px',
        color: '#fff',
        outline: 'none',
    },
    option: {
        backgroundColor: '#0f172a',
        color: '#fff',
    },
    loading: {
        color: '#94a3b8',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '18px',
    },
    card: {
        background: 'linear-gradient(180deg, #0f172a, #020617)',
        border: '1px solid rgba(34,211,238,0.2)',
        borderRadius: '22px',
        padding: '18px',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
    },
    cardTop: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    iconBox: {
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        background: 'rgba(6,182,212,0.15)',
        border: '1px solid rgba(34,211,238,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '26px',
    },
    cardTitle: {
        margin: 0,
        color: '#fff',
        fontSize: '18px',
        fontWeight: 900,
    },
    smallText: {
        margin: '4px 0 0',
        color: '#94a3b8',
        fontSize: '13px',
    },
    badge: {
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: '999px',
        color: '#fff',
        fontWeight: 900,
        fontSize: '12px',
        marginBottom: '12px',
    },
    infoBox: {
        background: 'rgba(15,23,42,0.9)',
        borderRadius: '14px',
        padding: '12px',
        fontSize: '14px',
        marginBottom: '14px',
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
        fontWeight: 900,
        cursor: 'pointer',
    },
    successButton: {
        background: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '9px 12px',
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
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 9999,
    },
    modal: {
        width: '100%',
        maxWidth: '760px',
        background: '#020617',
        borderRadius: '22px',
        border: '1px solid rgba(34,211,238,0.25)',
        overflow: 'hidden',
    },
    modalHeader: {
        padding: '18px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modalTitle: {
        margin: 0,
        color: '#fff',
    },
    closeButton: {
        background: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: '22px',
        cursor: 'pointer',
    },
    modalBody: {
        padding: '18px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '12px',
    },
    modalFooter: {
        padding: '18px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
};