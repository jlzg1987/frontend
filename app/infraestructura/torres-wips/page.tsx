'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type Torre = {
    torreId: string;
    nombreTorre: string;
    ubicacion?: string;
    lat?: string;
    lng?: string;
    ipPublica?: string;
    estado: 'ACTIVA' | 'INACTIVA' | 'MANTENIMIENTO';
    created_at?: string;
};

export default function TorresWispPage() {
    const [torres, setTorres] = useState<Torre[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<Torre | null>(null);

    const [formData, setFormData] = useState({
        nombreTorre: '',
        ubicacion: '',
        lat: '',
        lng: '',
        ipPublica: '',
        estado: 'ACTIVA',
    });

    const cargarTorres = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/torres-wisp`);
            const data = await res.json();
            setTorres(data.torres || []);
        } catch (error) {
            console.error('Error cargando torres:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarTorres();
    }, []);

    const abrirNuevo = () => {
        setEditando(null);
        setFormData({
            nombreTorre: '',
            ubicacion: '',
            lat: '',
            lng: '',
            ipPublica: '',
            estado: 'ACTIVA',
        });
        setShowModal(true);
    };

    const abrirEditar = (torre: Torre) => {
        setEditando(torre);
        setFormData({
            nombreTorre: torre.nombreTorre || '',
            ubicacion: torre.ubicacion || '',
            lat: torre.lat || '',
            lng: torre.lng || '',
            ipPublica: torre.ipPublica || '',
            estado: torre.estado || 'ACTIVA',
        });
        setShowModal(true);
    };

    const guardarTorre = async () => {
        try {
            const url = editando
                ? `${API_BASE}/torres-wisp/${editando.torreId}`
                : `${API_BASE}/torres-wisp`;

            const method = editando ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo guardar la torre');
                return;
            }

            setShowModal(false);
            await cargarTorres();
        } catch (error) {
            console.error('Error guardarTorre:', error);
            alert('Error al guardar torre');
        }
    };

    const eliminarTorre = async (torreId: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta torre?')) return;

        try {
            const res = await fetch(`${API_BASE}/torres-wisp/${torreId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo eliminar');
                return;
            }

            await cargarTorres();
        } catch (error) {
            console.error('Error eliminarTorre:', error);
        }
    };

    const colorEstado = (estado: string) => {
        if (estado === 'ACTIVA') return '#16a34a';
        if (estado === 'INACTIVA') return '#dc2626';
        return '#f59e0b';
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>

                <button style={styles.primaryButton} onClick={abrirNuevo}>
                    + Nueva torre
                </button>
            </section>

            {loading ? (
                <p style={styles.loading}>Cargando torres...</p>
            ) : (
                <section style={styles.grid}>
                    {torres.map((torre) => (
                        <article key={torre.torreId} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={styles.iconBox}>🗼</div>

                                <div>
                                    <h3 style={styles.cardTitle}>{torre.nombreTorre}</h3>
                                    <p style={styles.smallText}>{torre.ubicacion || 'Sin ubicación'}</p>
                                </div>
                            </div>

                            <span
                                style={{
                                    ...styles.badge,
                                    backgroundColor: colorEstado(torre.estado),
                                }}
                            >
                                {torre.estado}
                            </span>

                            <div style={styles.infoBox}>
                                <p><strong>IP pública:</strong> {torre.ipPublica || 'N/A'}</p>
                                <p><strong>Lat:</strong> {torre.lat || 'N/A'}</p>
                                <p><strong>Lng:</strong> {torre.lng || 'N/A'}</p>
                            </div>

                            <div style={styles.actions}>
                                <button style={styles.secondaryButton} onClick={() => abrirEditar(torre)}>
                                    Editar
                                </button>

                                <button style={styles.dangerButton} onClick={() => eliminarTorre(torre.torreId)}>
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
                                {editando ? 'Editar torre WISP' : 'Nueva torre WISP'}
                            </h2>

                            <button style={styles.closeButton} onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <input
                                placeholder="Nombre de torre"
                                value={formData.nombreTorre}
                                onChange={(e) => setFormData({ ...formData, nombreTorre: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="Ubicación / sector"
                                value={formData.ubicacion}
                                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="Latitud"
                                value={formData.lat}
                                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="Longitud"
                                value={formData.lng}
                                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="IP pública"
                                value={formData.ipPublica}
                                onChange={(e) => setFormData({ ...formData, ipPublica: e.target.value })}
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

                            <button style={styles.primaryButton} onClick={guardarTorre}>
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    page: { minHeight: '100vh', background: '#020617', color: '#e5e7eb', padding: '28px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px' },
    title: { margin: 0, color: '#fff', fontSize: '32px', fontWeight: 900 },
    subtitle: { color: '#94a3b8', marginTop: '8px' },
    primaryButton: { background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: '14px', padding: '12px 18px', fontWeight: 900, cursor: 'pointer' },
    loading: { color: '#94a3b8' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '18px' },
    card: { background: 'linear-gradient(180deg,#0f172a,#020617)', border: '1px solid rgba(249,115,22,0.28)', borderRadius: '22px', padding: '18px', boxShadow: '0 18px 40px rgba(0,0,0,0.35)' },
    cardTop: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' },
    iconBox: { width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(249,115,22,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' },
    cardTitle: { margin: 0, color: '#fff', fontSize: '19px', fontWeight: 900 },
    smallText: { margin: '4px 0', color: '#94a3b8', fontSize: '13px' },
    badge: { display: 'inline-block', color: '#fff', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 900, marginBottom: '12px' },
    infoBox: { background: '#0f172a', borderRadius: '14px', padding: '12px', fontSize: '14px', marginBottom: '14px' },
    actions: { display: 'flex', gap: '8px' },
    secondaryButton: { background: '#334155', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer' },
    dangerButton: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
    modal: { width: '100%', maxWidth: '760px', background: '#020617', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '24px', overflow: 'hidden' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    modalTitle: { margin: 0, color: '#fff' },
    closeButton: { background: 'transparent', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' },
    modalBody: { padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '14px' },
    input: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' },
    option: { backgroundColor: '#0f172a', color: '#fff' },
    modalFooter: { padding: '20px' }
}