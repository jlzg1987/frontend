'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';



type NodoFibra = {
    nodoFibraId: string;
    nombreNodo: string;
    ubicacion?: string;
    lat?: string;
    lng?: string;
    tipoNodo: 'PRINCIPAL' | 'DISTRIBUCION' | 'ACCESO';
    routerId?: string;
    estado: 'ACTIVO' | 'INACTIVO' | 'MANTENIMIENTO';
    observacion?: string;
};

export default function NodosFibraPage() {
    const [nodos, setNodos] = useState<NodoFibra[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<NodoFibra | null>(null);

    const [formData, setFormData] = useState({
        nombreNodo: '',
        ubicacion: '',
        lat: '',
        lng: '',
        tipoNodo: 'DISTRIBUCION',
        routerId: '',
        estado: 'ACTIVO',
        observacion: '',
    });

    const cargarNodos = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/nodos-fibra`);
            const data = await res.json();
            setNodos(data.nodos || []);
        } catch (error) {
            console.error('Error cargando nodos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarNodos();
    }, []);

    const abrirNuevo = () => {
        setEditando(null);
        setFormData({
            nombreNodo: '',
            ubicacion: '',
            lat: '',
            lng: '',
            tipoNodo: 'DISTRIBUCION',
            routerId: '',
            estado: 'ACTIVO',
            observacion: '',
        });
        setShowModal(true);
    };

    const abrirEditar = (n: NodoFibra) => {
        setEditando(n);
        setFormData({
            nombreNodo: n.nombreNodo || '',
            ubicacion: n.ubicacion || '',
            lat: n.lat || '',
            lng: n.lng || '',
            tipoNodo: n.tipoNodo || 'DISTRIBUCION',
            routerId: n.routerId || '',
            estado: n.estado || 'ACTIVO',
            observacion: n.observacion || '',
        });
        setShowModal(true);
    };

    const guardarNodo = async () => {
        if (!formData.nombreNodo) {
            alert('El nombre del nodo es obligatorio');
            return;
        }

        const url = editando
            ? `${API_BASE}/nodos-fibra/${editando.nodoFibraId}`
            : `${API_BASE}/nodos-fibra`;

        const method = editando ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
            alert(data.message || 'No se pudo guardar');
            return;
        }

        setShowModal(false);
        cargarNodos();
    };

    const cambiarEstado = async (id: string, estado: string) => {
        await fetch(`${API_BASE}/nodos-fibra/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado }),
        });

        cargarNodos();
    };

    const eliminarNodo = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este nodo de fibra?')) return;

        await fetch(`${API_BASE}/nodos-fibra/${id}`, {
            method: 'DELETE',
        });

        cargarNodos();
    };

    const nodosFiltrados = nodos.filter((n) => {
        const texto = `${n.nombreNodo} ${n.ubicacion} ${n.tipoNodo} ${n.estado}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
    });

    const colorEstado = (estado: string) => {
        if (estado === 'ACTIVO') return '#16a34a';
        if (estado === 'MANTENIMIENTO') return '#f59e0b';
        return '#dc2626';
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>
                <div>
                    <h1 style={styles.title}>Nodos de Fibra</h1>
                    <p style={styles.subtitle}>Administra nodos principales, distribución y acceso de fibra óptica.</p>
                </div>

                <button style={styles.primaryButton} onClick={abrirNuevo}>
                    + Nuevo nodo
                </button>
            </section>

            <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar nodo por nombre, ubicación, tipo o estado..."
                style={styles.input}
            />

            {loading ? (
                <p style={styles.loading}>Cargando nodos...</p>
            ) : (
                <section style={styles.grid}>
                    {nodosFiltrados.map((n) => (
                        <article key={n.nodoFibraId} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={styles.iconBox}>🔌</div>
                                <div>
                                    <h3 style={styles.cardTitle}>{n.nombreNodo}</h3>
                                    <p style={styles.smallText}>{n.ubicacion || 'Sin ubicación'}</p>
                                </div>
                            </div>

                            <span style={{ ...styles.badge, backgroundColor: colorEstado(n.estado) }}>
                                {n.estado}
                            </span>

                            <div style={styles.infoBox}>
                                <p><strong>Tipo:</strong> {n.tipoNodo}</p>
                                <p><strong>Lat/Lng:</strong> {n.lat || '-'} / {n.lng || '-'}</p>
                                <p><strong>RouterId:</strong> {n.routerId || 'No asignado'}</p>
                                <p><strong>Obs:</strong> {n.observacion || 'N/A'}</p>
                            </div>

                            <div style={styles.actions}>
                                <button style={styles.secondaryButton} onClick={() => abrirEditar(n)}>Editar</button>
                                <button style={styles.successButton} onClick={() => cambiarEstado(n.nodoFibraId, 'ACTIVO')}>Activar</button>
                                <button style={styles.warningButton} onClick={() => cambiarEstado(n.nodoFibraId, 'MANTENIMIENTO')}>Mantenimiento</button>
                                <button style={styles.dangerButton} onClick={() => eliminarNodo(n.nodoFibraId)}>Eliminar</button>
                            </div>
                        </article>
                    ))}
                </section>
            )}

            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>{editando ? 'Editar nodo' : 'Nuevo nodo de fibra'}</h2>
                            <button style={styles.closeButton} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div style={styles.modalBody}>
                            <input placeholder="Nombre nodo" value={formData.nombreNodo} onChange={(e) => setFormData({ ...formData, nombreNodo: e.target.value })} style={styles.input} />
                            <input placeholder="Ubicación" value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} style={styles.input} />
                            <input placeholder="Latitud" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} style={styles.input} />
                            <input placeholder="Longitud" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} style={styles.input} />

                            <select value={formData.tipoNodo} onChange={(e) => setFormData({ ...formData, tipoNodo: e.target.value })} style={styles.input}>
                                <option value="PRINCIPAL" style={styles.option}>PRINCIPAL</option>
                                <option value="DISTRIBUCION" style={styles.option}>DISTRIBUCIÓN</option>
                                <option value="ACCESO" style={styles.option}>ACCESO</option>
                            </select>

                            <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })} style={styles.input}>
                                <option value="ACTIVO" style={styles.option}>ACTIVO</option>
                                <option value="INACTIVO" style={styles.option}>INACTIVO</option>
                                <option value="MANTENIMIENTO" style={styles.option}>MANTENIMIENTO</option>
                            </select>

                            <input placeholder="RouterId opcional" value={formData.routerId} onChange={(e) => setFormData({ ...formData, routerId: e.target.value })} style={styles.input} />

                            <textarea placeholder="Observación" value={formData.observacion} onChange={(e) => setFormData({ ...formData, observacion: e.target.value })} style={{ ...styles.input, minHeight: 90 }} />
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.secondaryButton} onClick={() => setShowModal(false)}>Cancelar</button>
                            <button style={styles.primaryButton} onClick={guardarNodo}>Guardar nodo</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', background: '#020617', color: '#e5e7eb', padding: '28px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 22, flexWrap: 'wrap' },
    title: { margin: 0, color: '#fff', fontSize: 32, fontWeight: 900 },
    subtitle: { color: '#94a3b8', marginTop: 6 },
    primaryButton: { background: 'linear-gradient(135deg, #10b981, #2563eb)', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 18px', fontWeight: 900, cursor: 'pointer' },
    input: { width: '100%', background: '#0f172a', border: '1px solid rgba(34,211,238,0.26)', borderRadius: 12, padding: 12, color: '#fff', outline: 'none', marginBottom: 14 },
    option: { backgroundColor: '#0f172a', color: '#fff' },
    loading: { color: '#94a3b8' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18, marginTop: 20 },
    card: { background: 'linear-gradient(180deg, #0f172a, #020617)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 22, padding: 18 },
    cardTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
    iconBox: { width: 52, height: 52, borderRadius: 16, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 },
    cardTitle: { margin: 0, color: '#fff', fontSize: 18, fontWeight: 900 },
    smallText: { margin: '4px 0 0', color: '#94a3b8', fontSize: 13 },
    badge: { display: 'inline-block', padding: '6px 10px', borderRadius: 999, color: '#fff', fontWeight: 900, fontSize: 12, marginBottom: 12 },
    infoBox: { background: 'rgba(15,23,42,0.9)', borderRadius: 14, padding: 12, fontSize: 14, marginBottom: 14 },
    actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    secondaryButton: { background: '#334155', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' },
    warningButton: { background: '#f59e0b', color: '#111827', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 900, cursor: 'pointer' },
    successButton: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' },
    dangerButton: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 },
    modal: { width: '100%', maxWidth: 780, background: '#020617', borderRadius: 22, border: '1px solid rgba(34,211,238,0.25)', overflow: 'hidden' },
    modalHeader: { padding: 18, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' },
    modalTitle: { margin: 0, color: '#fff' },
    closeButton: { background: 'transparent', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' },
    modalBody: { padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 },
    modalFooter: { padding: 18, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 },
};