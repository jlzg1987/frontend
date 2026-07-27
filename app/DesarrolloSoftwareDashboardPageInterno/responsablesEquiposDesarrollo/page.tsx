'use client';

import { API_BASE } from '@/src/lib/api';
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';

type Props = { onVolver: () => void };

type Tecnico = {
    tecnicoId: string;
    nombre: string;
    especialidad?: string | null;
    email?: string | null;
    fotoPerfil?: string | null;
};

type Grupo = {
    grupoId: string;
    nombre: string;
    descripcion?: string | null;
    responsableTecnicoId?: string | null;
    responsable?: string | null;
    estado: 'ACTIVO' | 'INACTIVO';
    miembros?: number | string;
};

type Miembro = {
    miembroId: string;
    grupoId: string;
    tecnicoId: string;
    nombre: string;
    email?: string | null;
    fotoPerfil?: string | null;
    especialidad?: string | null;
    funcion?: string | null;
    esLider: number;
    estado: string;
};

export default function ResponsablesEquiposDesarrolloPageInterno({ onVolver }: Props) {
    const [vista, setVista] = useState<'GRUPOS' | 'PERSONAS'>('GRUPOS');
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [miembros, setMiembros] = useState<Miembro[]>([]);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(null);
    const [buscar, setBuscar] = useState('');
    const [cargando, setCargando] = useState(true);
    const [cargandoMiembros, setCargandoMiembros] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modalGrupo, setModalGrupo] = useState(false);
    const [modalMiembro, setModalMiembro] = useState(false);
    const [formGrupo, setFormGrupo] = useState<any>({ nombre: '', descripcion: '', responsableTecnicoId: '', estado: 'ACTIVO' });
    const [formMiembro, setFormMiembro] = useState<any>({ tecnicoId: '', funcion: '', esLider: 0 });

    const token = () => localStorage.getItem('isp_token');

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true); setError('');
            if (!token()) throw new Error('No se encontró la sesión del usuario');

            const [respuestaGrupos, respuestaCatalogos] = await Promise.all([
                fetch(`${API_BASE}/desarrollo-software/grupos`, { headers: { Authorization: `Bearer ${token()}` }, cache: 'no-store' }),
                fetch(`${API_BASE}/desarrollo-software/catalogos`, { headers: { Authorization: `Bearer ${token()}` }, cache: 'no-store' }),
            ]);
            const [dataGrupos, dataCatalogos] = await Promise.all([respuestaGrupos.json(), respuestaCatalogos.json()]);
            if (!respuestaGrupos.ok || dataGrupos.ok === false) throw new Error(dataGrupos.mensaje || 'No fue posible cargar los grupos');
            if (!respuestaCatalogos.ok || dataCatalogos.ok === false) throw new Error(dataCatalogos.mensaje || 'No fue posible cargar los técnicos');

            setGrupos(dataGrupos.grupos || []);
            setTecnicos(dataCatalogos.tecnicos || []);
        } catch (e: any) {
            console.error('Error cargando responsables:', e);
            setError(e?.message || 'No fue posible cargar responsables y equipos');
        } finally { setCargando(false); }
    }, []);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    async function cargarMiembros(grupo: Grupo) {
        try {
            setGrupoSeleccionado(grupo); setCargandoMiembros(true); setError('');
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/grupos/${grupo.grupoId}/miembros`, {
                headers: { Authorization: `Bearer ${token()}` }, cache: 'no-store',
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cargar los miembros');
            setMiembros(data.miembros || []);
        } catch (e: any) { setError(e?.message || 'No fue posible cargar los miembros'); }
        finally { setCargandoMiembros(false); }
    }

    function nuevoGrupo() {
        setFormGrupo({ nombre: '', descripcion: '', responsableTecnicoId: '', estado: 'ACTIVO' });
        setModalGrupo(true); setError(''); setMensaje('');
    }

    function editarGrupo(grupo: Grupo) {
        setFormGrupo({
            grupoId: grupo.grupoId,
            nombre: grupo.nombre,
            descripcion: grupo.descripcion || '',
            responsableTecnicoId: grupo.responsableTecnicoId || '',
            estado: grupo.estado,
        });
        setModalGrupo(true); setError(''); setMensaje('');
    }

    async function guardarGrupo(e: FormEvent) {
        e.preventDefault();
        try {
            setGuardando(true); setError('');
            const editando = Boolean(formGrupo.grupoId);
            const respuesta = await fetch(
                `${API_BASE}/desarrollo-software/grupos${editando ? `/${formGrupo.grupoId}` : ''}`,
                {
                    method: editando ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                    body: JSON.stringify({
                        nombre: formGrupo.nombre.trim(),
                        descripcion: formGrupo.descripcion.trim() || null,
                        responsableTecnicoId: formGrupo.responsableTecnicoId || null,
                        estado: formGrupo.estado,
                    }),
                }
            );
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible guardar el grupo');
            setModalGrupo(false); setMensaje(editando ? 'Grupo actualizado correctamente' : 'Grupo creado correctamente');
            await cargarDatos();
        } catch (e: any) { setError(e?.message || 'No fue posible guardar el grupo'); }
        finally { setGuardando(false); }
    }

    async function cambiarEstado(grupo: Grupo) {
        const nuevoEstado = grupo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        try {
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/grupos/${grupo.grupoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ estado: nuevoEstado }),
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cambiar el estado');
            setMensaje(`Grupo ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'} correctamente`);
            await cargarDatos();
        } catch (e: any) { setError(e?.message || 'No fue posible cambiar el estado'); }
    }

    function abrirAgregarMiembro() {
        setFormMiembro({ tecnicoId: '', funcion: '', esLider: 0 });
        setModalMiembro(true); setError(''); setMensaje('');
    }

    async function agregarMiembro(e: FormEvent) {
        e.preventDefault();
        if (!grupoSeleccionado) return;
        try {
            setGuardando(true); setError('');
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/grupos/${grupoSeleccionado.grupoId}/miembros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify(formMiembro),
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible agregar el miembro');
            setModalMiembro(false); setMensaje('Miembro agregado correctamente');
            await cargarMiembros(grupoSeleccionado); await cargarDatos();
        } catch (e: any) { setError(e?.message || 'No fue posible agregar el miembro'); }
        finally { setGuardando(false); }
    }

    async function retirarMiembro(miembro: Miembro) {
        if (!grupoSeleccionado || !window.confirm(`¿Retirar a ${miembro.nombre} del grupo?`)) return;
        try {
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/grupos/${grupoSeleccionado.grupoId}/miembros/${miembro.miembroId}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible retirar el miembro');
            setMensaje('Miembro retirado correctamente');
            await cargarMiembros(grupoSeleccionado); await cargarDatos();
        } catch (e: any) { setError(e?.message || 'No fue posible retirar el miembro'); }
    }

    const tecnicosDisponibles = useMemo(() => {
        const asignados = new Set(miembros.map((m) => m.tecnicoId));
        return tecnicos.filter((t) => !asignados.has(t.tecnicoId));
    }, [miembros, tecnicos]);

    const gruposFiltrados = useMemo(() => {
        const q = buscar.toLowerCase().trim();
        return grupos.filter((g) => !q || [g.nombre, g.descripcion, g.responsable].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
    }, [buscar, grupos]);

    const tecnicosFiltrados = useMemo(() => {
        const q = buscar.toLowerCase().trim();
        return tecnicos.filter((t) => !q || [t.nombre, t.especialidad, t.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
    }, [buscar, tecnicos]);

    return (
        <main style={styles.page}>
            <div style={styles.topBar}>
                <button style={styles.backButton} onClick={onVolver}>← Volver</button>
                <button style={styles.primaryButton} onClick={nuevoGrupo}>+ Crear grupo</button>
            </div>

            <header style={styles.header}>
                <span style={styles.eyebrow}>EQUIPO DE DESARROLLO</span>
                <h1 style={styles.title}>Responsables y equipos</h1>
                <p style={styles.subtitle}>Organiza programadores, técnicos y grupos responsables de los desarrollos.</p>
            </header>

            {error && <div style={styles.errorBox}>⚠️ {error}<button style={styles.retryButton} onClick={cargarDatos}>Reintentar</button></div>}
            {mensaje && <div style={styles.successBox}>✅ {mensaje}</div>}

            <section style={styles.statsGrid}>
                <Stat icono="👥" titulo="Grupos registrados" valor={cargando ? '...' : grupos.length} color="#38bdf8" />
                <Stat icono="✅" titulo="Grupos activos" valor={cargando ? '...' : grupos.filter((g) => g.estado === 'ACTIVO').length} color="#22c55e" />
                <Stat icono="💻" titulo="Personas disponibles" valor={cargando ? '...' : tecnicos.length} color="#a855f7" />
                <Stat icono="🧩" titulo="Miembros asignados" valor={cargando ? '...' : grupos.reduce((s, g) => s + Number(g.miembros || 0), 0)} color="#f59e0b" />
            </section>

            <section style={styles.toolbar}>
                <div style={styles.tabs}>
                    <button style={{ ...styles.tab, ...(vista === 'GRUPOS' ? styles.tabActive : {}) }} onClick={() => setVista('GRUPOS')}>👥 Grupos</button>
                    <button style={{ ...styles.tab, ...(vista === 'PERSONAS' ? styles.tabActive : {}) }} onClick={() => setVista('PERSONAS')}>💻 Personas</button>
                </div>
                <div style={styles.searchBox}><span>🔎</span><input style={styles.searchInput} value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar responsable o equipo..." /></div>
            </section>

            {cargando && <div style={styles.loading}>Cargando responsables...</div>}

            {!cargando && vista === 'GRUPOS' && (
                <section style={styles.grid}>
                    {gruposFiltrados.map((grupo) => (
                        <article key={grupo.grupoId} style={{ ...styles.groupCard, opacity: grupo.estado === 'INACTIVO' ? .65 : 1 }}>
                            <div style={styles.groupTop}>
                                <span style={styles.groupIcon}>👥</span>
                                <span style={{ ...styles.badge, color: grupo.estado === 'ACTIVO' ? '#4ade80' : '#94a3b8', background: grupo.estado === 'ACTIVO' ? 'rgba(34,197,94,.12)' : 'rgba(148,163,184,.1)' }}>{grupo.estado}</span>
                            </div>
                            <h2 style={styles.groupTitle}>{grupo.nombre}</h2>
                            <p style={styles.groupDescription}>{grupo.descripcion || 'Sin descripción'}</p>
                            <div style={styles.groupInfo}>
                                <Info label="Líder / responsable" value={grupo.responsable || 'Sin asignar'} />
                                <Info label="Miembros" value={String(grupo.miembros || 0)} />
                            </div>
                            <div style={styles.cardActions}>
                                <button style={styles.manageButton} onClick={() => cargarMiembros(grupo)}>Administrar miembros</button>
                                <button style={styles.iconButton} onClick={() => editarGrupo(grupo)} title="Editar">✏️</button>
                                <button style={styles.iconButton} onClick={() => cambiarEstado(grupo)} title={grupo.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}>{grupo.estado === 'ACTIVO' ? '⏸️' : '▶️'}</button>
                            </div>
                        </article>
                    ))}
                    {gruposFiltrados.length === 0 && <div style={styles.empty}>No encontramos grupos registrados.</div>}
                </section>
            )}

            {!cargando && vista === 'PERSONAS' && (
                <section style={styles.peopleGrid}>
                    {tecnicosFiltrados.map((tecnico) => (
                        <article key={tecnico.tecnicoId} style={styles.personCard}>
                            {tecnico.fotoPerfil ? <img src={tecnico.fotoPerfil} alt={tecnico.nombre} style={styles.avatarImage} /> : <div style={styles.avatar}>{tecnico.nombre?.charAt(0)?.toUpperCase() || 'T'}</div>}
                            <div style={styles.personData}><h2 style={styles.personName}>{tecnico.nombre}</h2><p style={styles.specialty}>{tecnico.especialidad || 'Sin especialidad registrada'}</p><p style={styles.email}>{tecnico.email || 'Sin correo'}</p></div>
                        </article>
                    ))}
                    {tecnicosFiltrados.length === 0 && <div style={styles.empty}>No encontramos personas disponibles.</div>}
                </section>
            )}

            {grupoSeleccionado && (
                <div style={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && setGrupoSeleccionado(null)}>
                    <section style={styles.membersModal}>
                        <div style={styles.modalHeader}>
                            <div><span style={styles.eyebrow}>MIEMBROS DEL GRUPO</span><h2 style={styles.modalTitle}>{grupoSeleccionado.nombre}</h2></div>
                            <button style={styles.closeButton} onClick={() => setGrupoSeleccionado(null)}>×</button>
                        </div>
                        <div style={styles.membersActions}><span style={styles.memberCount}>{miembros.length} miembro(s)</span><button style={styles.primaryButton} onClick={abrirAgregarMiembro}>+ Agregar miembro</button></div>
                        {cargandoMiembros ? <div style={styles.loading}>Cargando miembros...</div> : <div style={styles.membersList}>
                            {miembros.map((miembro) => (
                                <article key={miembro.miembroId} style={styles.memberCard}>
                                    <div style={styles.smallAvatar}>{miembro.nombre?.charAt(0)?.toUpperCase()}</div>
                                    <div style={styles.memberData}><strong>{miembro.nombre}</strong><span>{miembro.funcion || miembro.especialidad || 'Sin función'}</span>{Boolean(miembro.esLider) && <em>⭐ Líder del grupo</em>}</div>
                                    <button style={styles.removeButton} onClick={() => retirarMiembro(miembro)}>Retirar</button>
                                </article>
                            ))}
                            {miembros.length === 0 && <div style={styles.empty}>Este grupo todavía no tiene miembros.</div>}
                        </div>}
                    </section>
                </div>
            )}

            {modalGrupo && <Modal titulo={formGrupo.grupoId ? 'Editar grupo' : 'Crear grupo'} onCerrar={() => setModalGrupo(false)}>
                <form onSubmit={guardarGrupo}>
                    <Campo label="Nombre del grupo *" value={formGrupo.nombre} onChange={(v: string) => setFormGrupo({ ...formGrupo, nombre: v })} required />
                    <Area label="Descripción" value={formGrupo.descripcion} onChange={(v: string) => setFormGrupo({ ...formGrupo, descripcion: v })} />
                    <label style={styles.label}>Líder o responsable</label>
                    <select style={styles.input} value={formGrupo.responsableTecnicoId} onChange={(e) => setFormGrupo({ ...formGrupo, responsableTecnicoId: e.target.value })}><option value="">Sin asignar</option>{tecnicos.map((t) => <option key={t.tecnicoId} value={t.tecnicoId}>{t.nombre}</option>)}</select>
                    <label style={styles.label}>Estado</label><select style={styles.input} value={formGrupo.estado} onChange={(e) => setFormGrupo({ ...formGrupo, estado: e.target.value })}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select>
                    <Acciones guardando={guardando} onCancelar={() => setModalGrupo(false)} />
                </form>
            </Modal>}

            {modalMiembro && <Modal titulo={`Agregar miembro a ${grupoSeleccionado?.nombre || ''}`} onCerrar={() => setModalMiembro(false)}>
                <form onSubmit={agregarMiembro}>
                    <label style={styles.label}>Persona *</label><select style={styles.input} required value={formMiembro.tecnicoId} onChange={(e) => setFormMiembro({ ...formMiembro, tecnicoId: e.target.value })}><option value="">Seleccionar persona</option>{tecnicosDisponibles.map((t) => <option key={t.tecnicoId} value={t.tecnicoId}>{t.nombre} {t.especialidad ? `- ${t.especialidad}` : ''}</option>)}</select>
                    <Campo label="Función dentro del grupo" value={formMiembro.funcion} onChange={(v: string) => setFormMiembro({ ...formMiembro, funcion: v })} />
                    <label style={styles.checkLabel}><input type="checkbox" checked={Boolean(formMiembro.esLider)} onChange={(e) => setFormMiembro({ ...formMiembro, esLider: e.target.checked ? 1 : 0 })} /> Es líder del grupo</label>
                    <Acciones guardando={guardando} onCancelar={() => setModalMiembro(false)} />
                </form>
            </Modal>}
        </main>
    );
}

function Modal({ titulo, onCerrar, children }: any) { return <div style={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}><section style={styles.modal}><div style={styles.modalHeader}><h2 style={styles.modalTitle}>{titulo}</h2><button style={styles.closeButton} onClick={onCerrar}>×</button></div>{children}</section></div>; }
function Campo({ label, value, onChange, required = false }: any) { return <><label style={styles.label}>{label}</label><input style={styles.input} value={value || ''} onChange={(e) => onChange(e.target.value)} required={required} /></>; }
function Area({ label, value, onChange }: any) { return <><label style={styles.label}>{label}</label><textarea style={styles.textarea} value={value || ''} onChange={(e) => onChange(e.target.value)} /></>; }
function Acciones({ guardando, onCancelar }: any) { return <div style={styles.modalActions}><button type="button" style={styles.cancelButton} onClick={onCancelar}>Cancelar</button><button type="submit" style={styles.saveButton} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button></div>; }
function Stat({ icono, titulo, valor, color }: any) { return <div style={styles.statCard}><span style={{ ...styles.statIcon, boxShadow: `0 0 16px ${color}44` }}>{icono}</span><div><span style={styles.statTitle}>{titulo}</span><strong style={{ ...styles.statValue, color }}>{valor}</strong></div></div>; }
function Info({ label, value }: any) { return <div><span style={styles.infoLabel}>{label}</span><strong style={styles.infoValue}>{value}</strong></div>; }

const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', padding: 24, background: 'linear-gradient(135deg,#020617,#0f172a)', color: '#e5e7eb' }, topBar: { display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 18 }, backButton: { padding: '10px 14px', borderRadius: 11, border: '1px solid rgba(56,189,248,.35)', background: '#0f172a', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }, primaryButton: { padding: '10px 14px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', cursor: 'pointer', fontWeight: 800 }, header: { marginBottom: 24 }, eyebrow: { color: '#38bdf8', fontSize: 10, fontWeight: 900, letterSpacing: 1.5 }, title: { margin: '6px 0 0', fontSize: 31, color: '#f8fafc' }, subtitle: { margin: '8px 0 0', color: '#94a3b8' }, errorBox: { display: 'flex', alignItems: 'center', gap: 10, padding: 14, marginBottom: 16, borderRadius: 12, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(127,29,29,.2)', color: '#fecaca' }, successBox: { padding: 14, marginBottom: 16, borderRadius: 12, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(20,83,45,.2)', color: '#bbf7d0' }, retryButton: { marginLeft: 'auto', padding: '7px 11px', borderRadius: 8, border: '1px solid rgba(248,113,113,.35)', background: 'transparent', color: '#fecaca', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 13, marginBottom: 18 }, statCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)' }, statIcon: { display: 'grid', placeItems: 'center', width: 43, height: 43, borderRadius: 12, background: '#020617', fontSize: 20 }, statTitle: { display: 'block', color: '#94a3b8', fontSize: 12 }, statValue: { display: 'block', marginTop: 3, fontSize: 24 }, toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, marginBottom: 18, borderRadius: 15, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)', flexWrap: 'wrap' }, tabs: { display: 'flex', gap: 6 }, tab: { padding: '9px 13px', borderRadius: 9, border: '1px solid rgba(148,163,184,.18)', background: '#020617', color: '#94a3b8', cursor: 'pointer' }, tabActive: { color: '#38bdf8', borderColor: 'rgba(56,189,248,.4)', background: 'rgba(14,165,233,.12)' }, searchBox: { display: 'flex', alignItems: 'center', gap: 7, flex: '1 1 260px', maxWidth: 420, padding: '0 10px', borderRadius: 9, border: '1px solid rgba(148,163,184,.2)', background: '#020617' }, searchInput: { width: '100%', padding: '9px 0', border: 'none', outline: 'none', background: 'transparent', color: '#e5e7eb' }, loading: { padding: 35, textAlign: 'center', color: '#94a3b8' }, empty: { padding: 30, textAlign: 'center', color: '#64748b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 15 }, groupCard: { padding: 18, borderRadius: 17, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)' }, groupTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, groupIcon: { display: 'grid', placeItems: 'center', width: 43, height: 43, borderRadius: 12, background: '#020617', fontSize: 21 }, badge: { padding: '5px 8px', borderRadius: 999, fontSize: 9, fontWeight: 900 }, groupTitle: { margin: '13px 0 5px', fontSize: 18, color: '#f8fafc' }, groupDescription: { minHeight: 38, margin: '0 0 14px', color: '#94a3b8', fontSize: 12, lineHeight: 1.5 }, groupInfo: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, padding: 12, borderRadius: 10, background: '#020617' }, infoLabel: { display: 'block', color: '#64748b', fontSize: 9 }, infoValue: { display: 'block', marginTop: 3, color: '#cbd5e1', fontSize: 11 }, cardActions: { display: 'flex', gap: 7, marginTop: 13 }, manageButton: { flex: 1, padding: '9px 10px', borderRadius: 9, border: '1px solid rgba(56,189,248,.28)', background: 'rgba(14,165,233,.09)', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }, iconButton: { width: 38, borderRadius: 9, border: '1px solid rgba(148,163,184,.18)', background: '#020617', cursor: 'pointer' },
    peopleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 13 }, personCard: { display: 'flex', gap: 13, alignItems: 'center', padding: 16, borderRadius: 15, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)' }, avatar: { display: 'grid', placeItems: 'center', width: 50, height: 50, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#0284c7,#7c3aed)', color: '#fff', fontSize: 20, fontWeight: 900 }, avatarImage: { width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }, personData: { minWidth: 0 }, personName: { margin: 0, fontSize: 15, color: '#f8fafc' }, specialty: { margin: '4px 0', color: '#a78bfa', fontSize: 11 }, email: { margin: 0, color: '#64748b', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis' },
    overlay: { position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(2,6,23,.84)', backdropFilter: 'blur(4px)' }, modal: { width: 'min(520px,100%)', padding: 22, borderRadius: 18, border: '1px solid rgba(56,189,248,.24)', background: '#0f172a' }, membersModal: { width: 'min(700px,100%)', maxHeight: '88vh', overflowY: 'auto', padding: 22, borderRadius: 18, border: '1px solid rgba(56,189,248,.24)', background: '#0f172a' }, modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 }, modalTitle: { margin: '5px 0 10px', color: '#f8fafc' }, closeButton: { border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 27, cursor: 'pointer' }, label: { display: 'block', margin: '12px 0 6px', color: '#cbd5e1', fontSize: 12, fontWeight: 700 }, input: { width: '100%', boxSizing: 'border-box', padding: '10px 11px', borderRadius: 9, border: '1px solid rgba(148,163,184,.23)', background: '#020617', color: '#e5e7eb', outline: 'none' }, textarea: { width: '100%', minHeight: 85, boxSizing: 'border-box', padding: 11, borderRadius: 9, border: '1px solid rgba(148,163,184,.23)', background: '#020617', color: '#e5e7eb', fontFamily: 'inherit' }, checkLabel: { display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, color: '#cbd5e1', fontSize: 12 }, modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 19 }, cancelButton: { padding: '9px 13px', borderRadius: 9, border: '1px solid rgba(148,163,184,.22)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }, saveButton: { padding: '9px 14px', border: 'none', borderRadius: 9, background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', cursor: 'pointer', fontWeight: 800 }, membersActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, margin: '5px 0 14px' }, memberCount: { color: '#94a3b8', fontSize: 12 }, membersList: { display: 'grid', gap: 9 }, memberCard: { display: 'flex', alignItems: 'center', gap: 11, padding: 12, borderRadius: 11, border: '1px solid rgba(148,163,184,.13)', background: '#020617' }, smallAvatar: { display: 'grid', placeItems: 'center', width: 38, height: 38, flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#0284c7,#7c3aed)', fontWeight: 900 }, memberData: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }, memberDataSpan: { color: '#94a3b8' }, removeButton: { padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,.22)', background: 'rgba(239,68,68,.08)', color: '#f87171', cursor: 'pointer' },
};