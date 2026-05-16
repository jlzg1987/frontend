'use client';

import { API_BASE } from '@/src/lib/api';
import { useEffect, useState } from 'react';


type NodoFibra = {
    nodoFibraId: string;
    nombreNodo: string;
};

type NapSplitter = {
    napId: string;
    nodoFibraId: string;
    nombreNodo?: string;
    nombreNap: string;
    codigoNap?: string;
    ubicacion?: string;
    lat?: string;
    lng?: string;
    tipoCaja: 'NAP' | 'SPLITTER' | 'MIXTA';
    capacidadPuertos: number;
    puertosUsados: number;
    splitterRatio?: string;
    estado: 'ACTIVA' | 'INACTIVA' | 'LLENA' | 'MANTENIMIENTO';
    observacion?: string;
};

export default function NapSplitterPage() {
    const [naps, setNaps] = useState<NapSplitter[]>([]);
    const [nodos, setNodos] = useState<NodoFibra[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando] = useState<NapSplitter | null>(null);

    const [formData, setFormData] = useState({
        nodoFibraId: '',
        nombreNap: '',
        codigoNap: '',
        ubicacion: '',
        lat: '',
        lng: '',
        tipoCaja: 'NAP',
        capacidadPuertos: '8',
        puertosUsados: '0',
        splitterRatio: '',
        estado: 'ACTIVA',
        observacion: '',
    });

    const cargarDatos = async () => {
        try {
            setLoading(true);

            const [resNaps, resNodos] = await Promise.all([
                fetch(`${API_BASE}/nap-splitter`),
                fetch(`${API_BASE}/nodos-fibra`),
            ]);

            const dataNaps = await resNaps.json();
            const dataNodos = await resNodos.json();

            setNaps(dataNaps.naps || []);
            setNodos(dataNodos.nodos || []);
        } catch (error) {
            console.error('Error cargando NAP/Splitter:', error);
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
            nodoFibraId: '',
            nombreNap: '',
            codigoNap: '',
            ubicacion: '',
            lat: '',
            lng: '',
            tipoCaja: 'NAP',
            capacidadPuertos: '8',
            puertosUsados: '0',
            splitterRatio: '',
            estado: 'ACTIVA',
            observacion: '',
        });
        setShowModal(true);
    };

    const abrirEditar = (nap: NapSplitter) => {
        setEditando(nap);
        setFormData({
            nodoFibraId: nap.nodoFibraId || '',
            nombreNap: nap.nombreNap || '',
            codigoNap: nap.codigoNap || '',
            ubicacion: nap.ubicacion || '',
            lat: nap.lat || '',
            lng: nap.lng || '',
            tipoCaja: nap.tipoCaja || 'NAP',
            capacidadPuertos: String(nap.capacidadPuertos || 8),
            puertosUsados: String(nap.puertosUsados || 0),
            splitterRatio: nap.splitterRatio || '',
            estado: nap.estado || 'ACTIVA',
            observacion: nap.observacion || '',
        });
        setShowModal(true);
    };

    const guardarNap = async () => {
        try {
            if (!formData.nodoFibraId || !formData.nombreNap) {
                alert('Seleccione un nodo de fibra y escriba el nombre de la NAP');
                return;
            }

            const payload = {
                ...formData,
                capacidadPuertos: Number(formData.capacidadPuertos || 8),
                puertosUsados: Number(formData.puertosUsados || 0),
            };

            const url = editando
                ? `${API_BASE}/nap-splitter/${editando.napId}`
                : `${API_BASE}/nap-splitter`;

            const method = editando ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo guardar NAP / Splitter');
                return;
            }

            setShowModal(false);
            cargarDatos();
        } catch (error) {
            console.error('Error guardando NAP:', error);
            alert('Error al guardar NAP / Splitter');
        }
    };

    const cambiarEstado = async (napId: string, estado: string) => {
        try {
            const res = await fetch(`${API_BASE}/nap-splitter/${napId}/estado`, {
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
            console.error('Error cambiando estado NAP:', error);
        }
    };

    const eliminarNap = async (napId: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta NAP / Splitter?')) return;

        try {
            const res = await fetch(`${API_BASE}/nap-splitter/${napId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                alert(data.message || 'No se pudo eliminar');
                return;
            }

            cargarDatos();
        } catch (error) {
            console.error('Error eliminando NAP:', error);
        }
    };

    const napsFiltradas = naps.filter((n) => {
        const texto = `${n.nombreNap} ${n.codigoNap} ${n.nombreNodo} ${n.ubicacion} ${n.tipoCaja} ${n.estado}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
    });

    const colorEstado = (estado: string) => {
        if (estado === 'ACTIVA') return '#16a34a';
        if (estado === 'LLENA') return '#9333ea';
        if (estado === 'MANTENIMIENTO') return '#f59e0b';
        return '#dc2626';
    };

    const porcentajeUso = (usados: number, capacidad: number) => {
        if (!capacidad || capacidad <= 0) return 0;
        return Math.min(100, Math.round((Number(usados || 0) / Number(capacidad)) * 100));
    };

    return (
        <main style={styles.page}>
            <section style={styles.header}>


                <button style={styles.primaryButton} onClick={abrirNuevo}>
                    + Nueva NAP
                </button>
            </section>

            <section style={styles.filters}>
                <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por NAP, código, nodo, ubicación, tipo o estado..."
                    style={styles.input}
                />
            </section>

            {loading ? (
                <p style={styles.loading}>Cargando NAP / Splitter...</p>
            ) : (
                <section style={styles.grid}>
                    {napsFiltradas.map((nap) => {
                        const uso = porcentajeUso(nap.puertosUsados, nap.capacidadPuertos);

                        return (
                            <article key={nap.napId} style={styles.card}>
                                <div style={styles.cardTop}>
                                    <div style={styles.iconBox}>📦</div>

                                    <div>
                                        <h3 style={styles.cardTitle}>{nap.nombreNap}</h3>
                                        <p style={styles.smallText}>
                                            Nodo: {nap.nombreNodo || 'No asignado'}
                                        </p>
                                    </div>
                                </div>

                                <div style={styles.badgeRow}>
                                    <span
                                        style={{
                                            ...styles.badge,
                                            backgroundColor: colorEstado(nap.estado),
                                        }}
                                    >
                                        {nap.estado}
                                    </span>

                                    <span style={styles.typeBadge}>
                                        {nap.tipoCaja}
                                    </span>
                                </div>

                                <div style={styles.infoBox}>
                                    <p><strong>Código:</strong> {nap.codigoNap || 'N/A'}</p>
                                    <p><strong>Ubicación:</strong> {nap.ubicacion || 'Sin ubicación'}</p>
                                    <p><strong>Splitter:</strong> {nap.splitterRatio || 'N/A'}</p>
                                    <p><strong>Lat/Lng:</strong> {nap.lat || '-'} / {nap.lng || '-'}</p>
                                </div>

                                <div style={styles.capacityBox}>
                                    <div style={styles.capacityHeader}>
                                        <span>Puertos usados</span>
                                        <strong>{nap.puertosUsados}/{nap.capacidadPuertos}</strong>
                                    </div>

                                    <div style={styles.progressTrack}>
                                        <div
                                            style={{
                                                ...styles.progressBar,
                                                width: `${uso}%`,
                                                background:
                                                    uso >= 100
                                                        ? '#dc2626'
                                                        : uso >= 75
                                                            ? '#f59e0b'
                                                            : '#16a34a',
                                            }}
                                        />
                                    </div>

                                    <small style={styles.smallText}>{uso}% ocupado</small>
                                </div>

                                <div style={styles.actions}>
                                    <button style={styles.secondaryButton} onClick={() => abrirEditar(nap)}>
                                        Editar
                                    </button>

                                    <button
                                        style={styles.successButton}
                                        onClick={() => cambiarEstado(nap.napId, 'ACTIVA')}
                                    >
                                        Activar
                                    </button>

                                    <button
                                        style={styles.warningButton}
                                        onClick={() => cambiarEstado(nap.napId, 'MANTENIMIENTO')}
                                    >
                                        Mantenimiento
                                    </button>

                                    <button
                                        style={styles.dangerButton}
                                        onClick={() => eliminarNap(nap.napId)}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {editando ? 'Editar NAP / Splitter' : 'Nueva NAP / Splitter'}
                            </h2>

                            <button style={styles.closeButton} onClick={() => setShowModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div style={styles.modalBody}>
                            <select
                                value={formData.nodoFibraId}
                                onChange={(e) => setFormData({ ...formData, nodoFibraId: e.target.value })}
                                style={styles.input}
                            >
                                <option value="" style={styles.option}>Seleccionar nodo de fibra</option>

                                {nodos.map((n) => (
                                    <option
                                        key={n.nodoFibraId}
                                        value={n.nodoFibraId}
                                        style={styles.option}
                                    >
                                        {n.nombreNodo}
                                    </option>
                                ))}
                            </select>

                            <input
                                placeholder="Nombre NAP / Splitter"
                                value={formData.nombreNap}
                                onChange={(e) => setFormData({ ...formData, nombreNap: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="Código NAP, ejemplo: NAP-TACH-001"
                                value={formData.codigoNap}
                                onChange={(e) => setFormData({ ...formData, codigoNap: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="Ubicación"
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

                            <select
                                value={formData.tipoCaja}
                                onChange={(e) => setFormData({ ...formData, tipoCaja: e.target.value })}
                                style={styles.input}
                            >
                                <option value="NAP" style={styles.option}>NAP</option>
                                <option value="SPLITTER" style={styles.option}>SPLITTER</option>
                                <option value="MIXTA" style={styles.option}>MIXTA</option>
                            </select>

                            <input
                                type="number"
                                placeholder="Capacidad de puertos"
                                value={formData.capacidadPuertos}
                                onChange={(e) => setFormData({ ...formData, capacidadPuertos: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                type="number"
                                placeholder="Puertos usados"
                                value={formData.puertosUsados}
                                onChange={(e) => setFormData({ ...formData, puertosUsados: e.target.value })}
                                style={styles.input}
                            />

                            <input
                                placeholder="Splitter Ratio, ejemplo: 1:8 / 1:16"
                                value={formData.splitterRatio}
                                onChange={(e) => setFormData({ ...formData, splitterRatio: e.target.value })}
                                style={styles.input}
                            />

                            <select
                                value={formData.estado}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                style={styles.input}
                            >
                                <option value="ACTIVA" style={styles.option}>ACTIVA</option>
                                <option value="INACTIVA" style={styles.option}>INACTIVA</option>
                                <option value="LLENA" style={styles.option}>LLENA</option>
                                <option value="MANTENIMIENTO" style={styles.option}>MANTENIMIENTO</option>
                            </select>

                            <textarea
                                placeholder="Observación"
                                value={formData.observacion}
                                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                                style={{ ...styles.input, minHeight: '90px', gridColumn: '1 / -1' }}
                            />
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.secondaryButton} onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>

                            <button style={styles.primaryButton} onClick={guardarNap}>
                                Guardar NAP
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
        background: 'linear-gradient(135deg, #8b5cf6, #2563eb)',
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
        gap: '18px',
    },
    card: {
        background: 'linear-gradient(180deg, #0f172a, #020617)',
        border: '1px solid rgba(139,92,246,0.28)',
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
        background: 'rgba(139,92,246,0.15)',
        border: '1px solid rgba(139,92,246,0.35)',
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
    badgeRow: {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
    },
    badge: {
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: '999px',
        color: '#fff',
        fontWeight: 900,
        fontSize: '12px',
    },
    typeBadge: {
        padding: '6px 10px',
        borderRadius: '999px',
        background: '#1e293b',
        color: '#c4b5fd',
        fontWeight: 900,
        fontSize: '12px',
    },
    infoBox: {
        background: 'rgba(15,23,42,0.9)',
        borderRadius: '14px',
        padding: '12px',
        fontSize: '14px',
        marginBottom: '14px',
    },
    capacityBox: {
        background: 'rgba(30,41,59,0.7)',
        borderRadius: '14px',
        padding: '12px',
        marginBottom: '14px',
    },
    capacityHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        color: '#e5e7eb',
        fontSize: '14px',
        marginBottom: '8px',
    },
    progressTrack: {
        width: '100%',
        height: '10px',
        borderRadius: '999px',
        background: '#020617',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
    },
    progressBar: {
        height: '100%',
        borderRadius: '999px',
        transition: 'width 0.2s ease',
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
        maxWidth: '880px',
        background: '#020617',
        borderRadius: '22px',
        border: '1px solid rgba(139,92,246,0.35)',
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
        maxHeight: '70vh',
        overflowY: 'auto',
    },
    modalFooter: {
        padding: '18px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
};