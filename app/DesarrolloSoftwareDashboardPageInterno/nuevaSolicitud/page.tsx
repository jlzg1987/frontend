'use client';

import { API_BASE } from '@/src/lib/api';
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';

type Props = {
    onVolver: () => void;
    onSolicitudCreada?: (solicitudId: string) => void;
};

type ClienteCatalogo = {
    id: string | number;
    tipoCliente: 'ISP' | 'EXTERNO';
    nombre: string;
    email?: string | null;
    telefono?: string | null;
    cedula?: string | null;
};

type TecnicoCatalogo = {
    tecnicoId: string;
    nombre: string;
    especialidad?: string | null;
    email?: string | null;
    fotoPerfil?: string | null;
};

type GrupoCatalogo = {
    grupoId: string;
    nombre: string;
    descripcion?: string | null;
};

type Formulario = {
    clienteSeleccionado: string;
    nombreProyecto: string;
    tipoDesarrollo: string;
    descripcion: string;
    objetivo: string;
    alcance: string;
    prioridad: string;
    fechaSolicitud: string;
    fechaInicioEstimada: string;
    fechaEntregaEstimada: string;
    presupuestoAcordado: string;
    anticipoAcordado: string;
    observaciones: string;
    tipoResponsable: '' | 'TECNICO' | 'GRUPO';
    responsableId: string;
};

const fechaHoy = () => new Date().toISOString().slice(0, 10);

const FORMULARIO_INICIAL: Formulario = {
    clienteSeleccionado: '',
    nombreProyecto: '',
    tipoDesarrollo: '',
    descripcion: '',
    objetivo: '',
    alcance: '',
    prioridad: 'MEDIA',
    fechaSolicitud: fechaHoy(),
    fechaInicioEstimada: '',
    fechaEntregaEstimada: '',
    presupuestoAcordado: '',
    anticipoAcordado: '',
    observaciones: '',
    tipoResponsable: '',
    responsableId: '',
};

const TIPOS_DESARROLLO = [
    ['PAGINA_WEB', 'Página web'],
    ['TIENDA_VIRTUAL', 'Tienda virtual'],
    ['SISTEMA_WEB', 'Sistema web'],
    ['APLICACION_MOVIL', 'Aplicación móvil'],
    ['SOFTWARE_ESCRITORIO', 'Software de escritorio'],
    ['INTEGRACION', 'Integración con otro sistema'],
    ['MANTENIMIENTO', 'Mantenimiento o actualización'],
    ['DESARROLLO_PERSONALIZADO', 'Desarrollo personalizado'],
    ['OTRO', 'Otro'],
];

export default function NuevaSolicitudDesarrolloPageInterno({
    onVolver,
    onSolicitudCreada,
}: Props) {
    const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_INICIAL);
    const [clientes, setClientes] = useState<ClienteCatalogo[]>([]);
    const [tecnicos, setTecnicos] = useState<TecnicoCatalogo[]>([]);
    const [grupos, setGrupos] = useState<GrupoCatalogo[]>([]);
    const [buscarCliente, setBuscarCliente] = useState('');
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const cargarCatalogos = useCallback(async () => {
        try {
            setCargandoCatalogos(true);
            setError('');

            const token = localStorage.getItem('isp_token');
            if (!token) throw new Error('No se encontró la sesión del usuario');

            const respuesta = await fetch(`${API_BASE}/desarrollo-software/catalogos`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) {
                throw new Error(data.mensaje || 'No fue posible cargar clientes y responsables');
            }

            setClientes(data.clientes || []);
            setTecnicos(data.tecnicos || []);
            setGrupos(data.grupos || []);
        } catch (e: any) {
            console.error('Error cargando catálogos de desarrollo:', e);
            setError(e?.message || 'No fue posible cargar la información');
        } finally {
            setCargandoCatalogos(false);
        }
    }, []);

    useEffect(() => {
        cargarCatalogos();
    }, [cargarCatalogos]);

    const clientesFiltrados = useMemo(() => {
        const texto = buscarCliente.trim().toLowerCase();
        if (!texto) return clientes;

        return clientes.filter((cliente) =>
            [cliente.nombre, cliente.cedula, cliente.email, cliente.telefono, cliente.tipoCliente]
                .filter(Boolean)
                .some((valor) => String(valor).toLowerCase().includes(texto))
        );
    }, [buscarCliente, clientes]);

    const responsables = formulario.tipoResponsable === 'TECNICO' ? tecnicos : grupos;

    function actualizarCampo(campo: keyof Formulario, valor: string) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
            ...(campo === 'tipoResponsable' ? { responsableId: '' } : {}),
        }));
    }

    function validarFormulario() {
        if (!formulario.clienteSeleccionado) return 'Selecciona el cliente que solicita el desarrollo';
        if (!formulario.nombreProyecto.trim()) return 'Escribe el nombre del proyecto';
        if (!formulario.tipoDesarrollo) return 'Selecciona el tipo de desarrollo';
        if (!formulario.descripcion.trim()) return 'Describe lo que necesita el cliente';
        if (formulario.fechaInicioEstimada && formulario.fechaEntregaEstimada &&
            formulario.fechaEntregaEstimada < formulario.fechaInicioEstimada) {
            return 'La fecha de entrega no puede ser anterior a la fecha de inicio';
        }
        if (Number(formulario.presupuestoAcordado || 0) < 0 || Number(formulario.anticipoAcordado || 0) < 0) {
            return 'Los valores económicos no pueden ser negativos';
        }
        if (Number(formulario.anticipoAcordado || 0) > Number(formulario.presupuestoAcordado || 0)) {
            return 'El anticipo no puede superar el presupuesto acordado';
        }
        return '';
    }

    async function guardarSolicitud(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setError('');
        setMensaje('');

        const errorValidacion = validarFormulario();
        if (errorValidacion) {
            setError(errorValidacion);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            setGuardando(true);

            const token = localStorage.getItem('isp_token');
            if (!token) throw new Error('No se encontró la sesión del usuario');

            const [tipoCliente, clienteId] = formulario.clienteSeleccionado.split(':');

            const payload = {
                clienteId: tipoCliente === 'ISP' ? clienteId : null,
                clienteExternoId: tipoCliente === 'EXTERNO' ? Number(clienteId) : null,
                nombreProyecto: formulario.nombreProyecto.trim(),
                tipoDesarrollo: formulario.tipoDesarrollo,
                descripcion: formulario.descripcion.trim(),
                objetivo: formulario.objetivo.trim() || null,
                alcance: formulario.alcance.trim() || null,
                prioridad: formulario.prioridad,
                fechaSolicitud: formulario.fechaSolicitud,
                fechaInicioEstimada: formulario.fechaInicioEstimada || null,
                fechaEntregaEstimada: formulario.fechaEntregaEstimada || null,
                presupuestoAcordado: Number(formulario.presupuestoAcordado || 0),
                anticipoAcordado: Number(formulario.anticipoAcordado || 0),
                moneda: 'USD',
                observaciones: formulario.observaciones.trim() || null,
                responsableTecnicoId:
                    formulario.tipoResponsable === 'TECNICO' && formulario.responsableId
                        ? formulario.responsableId
                        : null,
                grupoResponsableId:
                    formulario.tipoResponsable === 'GRUPO' && formulario.responsableId
                        ? formulario.responsableId
                        : null,
            };

            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) {
                throw new Error(data.mensaje || 'No fue posible crear la solicitud');
            }

            setMensaje(`${data.codigo || 'Solicitud'} creada correctamente`);
            setFormulario(FORMULARIO_INICIAL);
            setBuscarCliente('');

            if (data.solicitudId && onSolicitudCreada) {
                window.setTimeout(() => onSolicitudCreada(String(data.solicitudId)), 700);
            }
        } catch (e: any) {
            console.error('Error creando solicitud de desarrollo:', e);
            setError(e?.message || 'No fue posible crear la solicitud');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setGuardando(false);
        }
    }

    return (
        <main style={styles.page}>


            <header style={styles.header}>
                <div>

                    <h1 style={styles.title}>Nueva solicitud</h1>

                </div>
            </header>

            {error && (
                <div style={styles.errorBox}>
                    <span>⚠️</span>
                    <div>
                        <strong>No se pudo continuar</strong>
                        <p style={styles.alertText}>{error}</p>
                    </div>
                    {cargandoCatalogos === false && clientes.length === 0 && (
                        <button type="button" style={styles.retryButton} onClick={cargarCatalogos}>Reintentar</button>
                    )}
                </div>
            )}

            {mensaje && (
                <div style={styles.successBox}>
                    <span>✅</span>
                    <strong>{mensaje}</strong>
                </div>
            )}

            <form onSubmit={guardarSolicitud}>
                <section style={styles.formGrid}>
                    <div style={styles.mainColumn}>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardIcon}>👤</span>
                                <div>
                                    <h2 style={styles.cardTitle}>Cliente solicitante</h2>
                                    <p style={styles.cardDescription}>Puede ser un cliente ISP o un cliente externo.</p>
                                </div>
                            </div>

                            <label style={styles.label}>Buscar cliente</label>
                            <input
                                style={styles.input}
                                value={buscarCliente}
                                onChange={(e) => setBuscarCliente(e.target.value)}
                                placeholder="Nombre, cédula, correo o teléfono"
                                disabled={cargandoCatalogos}
                            />

                            <label style={styles.label}>Cliente *</label>
                            <select
                                style={styles.input}
                                value={formulario.clienteSeleccionado}
                                onChange={(e) => actualizarCampo('clienteSeleccionado', e.target.value)}
                                disabled={cargandoCatalogos}
                                required
                            >
                                <option value="">{cargandoCatalogos ? 'Cargando clientes...' : 'Seleccionar cliente'}</option>
                                {clientesFiltrados.map((cliente) => (
                                    <option key={`${cliente.tipoCliente}:${cliente.id}`} value={`${cliente.tipoCliente}:${cliente.id}`}>
                                        [{cliente.tipoCliente}] {cliente.nombre} {cliente.cedula ? `- ${cliente.cedula}` : ''}
                                    </option>
                                ))}
                            </select>
                            {!cargandoCatalogos && clientesFiltrados.length === 0 && (
                                <p style={styles.helpText}>No encontramos clientes con esa búsqueda.</p>
                            )}
                        </div>

                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardIcon}>💻</span>
                                <div>
                                    <h2 style={styles.cardTitle}>Información del desarrollo</h2>
                                    <p style={styles.cardDescription}>Describe de forma clara lo que necesita el cliente.</p>
                                </div>
                            </div>

                            <div style={styles.twoColumns}>
                                <div>
                                    <label style={styles.label}>Nombre del proyecto *</label>
                                    <input style={styles.input} value={formulario.nombreProyecto}
                                        onChange={(e) => actualizarCampo('nombreProyecto', e.target.value)}
                                        placeholder="Ej. Sistema de reservas" required />
                                </div>
                                <div>
                                    <label style={styles.label}>Tipo de desarrollo *</label>
                                    <select style={styles.input} value={formulario.tipoDesarrollo}
                                        onChange={(e) => actualizarCampo('tipoDesarrollo', e.target.value)} required>
                                        <option value="">Seleccionar tipo</option>
                                        {TIPOS_DESARROLLO.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
                                    </select>
                                </div>
                            </div>

                            <label style={styles.label}>Descripción de la solicitud *</label>
                            <textarea style={styles.textarea} value={formulario.descripcion}
                                onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                                placeholder="Explica qué programa, aplicación o página necesita el cliente..." required />

                            <label style={styles.label}>Objetivo del proyecto</label>
                            <textarea style={styles.textareaSmall} value={formulario.objetivo}
                                onChange={(e) => actualizarCampo('objetivo', e.target.value)}
                                placeholder="¿Qué desea lograr el cliente con este desarrollo?" />

                            <label style={styles.label}>Alcance inicial</label>
                            <textarea style={styles.textareaSmall} value={formulario.alcance}
                                onChange={(e) => actualizarCampo('alcance', e.target.value)}
                                placeholder="Funciones, módulos o plataformas incluidas inicialmente" />
                        </div>

                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardIcon}>👥</span>
                                <div>
                                    <h2 style={styles.cardTitle}>Responsable inicial</h2>
                                    <p style={styles.cardDescription}>Puedes asignarlo ahora o dejarlo pendiente.</p>
                                </div>
                            </div>

                            <div style={styles.twoColumns}>
                                <div>
                                    <label style={styles.label}>Tipo de responsable</label>
                                    <select style={styles.input} value={formulario.tipoResponsable}
                                        onChange={(e) => actualizarCampo('tipoResponsable', e.target.value)}>
                                        <option value="">Sin asignar por ahora</option>
                                        <option value="TECNICO">Persona / programador</option>
                                        <option value="GRUPO">Grupo de trabajo</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.label}>Responsable</label>
                                    <select style={styles.input} value={formulario.responsableId}
                                        onChange={(e) => actualizarCampo('responsableId', e.target.value)}
                                        disabled={!formulario.tipoResponsable}>
                                        <option value="">Seleccionar responsable</option>
                                        {responsables.map((item: any) => (
                                            <option key={item.tecnicoId || item.grupoId} value={item.tecnicoId || item.grupoId}>
                                                {item.nombre}{item.especialidad ? ` - ${item.especialidad}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside style={styles.sideColumn}>
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardIcon}>📅</span>
                                <h2 style={styles.cardTitle}>Planificación</h2>
                            </div>

                            <label style={styles.label}>Prioridad</label>
                            <select style={styles.input} value={formulario.prioridad}
                                onChange={(e) => actualizarCampo('prioridad', e.target.value)}>
                                <option value="BAJA">Baja</option>
                                <option value="MEDIA">Media</option>
                                <option value="ALTA">Alta</option>
                                <option value="URGENTE">Urgente</option>
                            </select>

                            <label style={styles.label}>Fecha de solicitud</label>
                            <input type="date" style={styles.input} value={formulario.fechaSolicitud}
                                onChange={(e) => actualizarCampo('fechaSolicitud', e.target.value)} required />

                            <label style={styles.label}>Inicio estimado</label>
                            <input type="date" style={styles.input} value={formulario.fechaInicioEstimada}
                                onChange={(e) => actualizarCampo('fechaInicioEstimada', e.target.value)} />

                            <label style={styles.label}>Entrega estimada</label>
                            <input type="date" style={styles.input} value={formulario.fechaEntregaEstimada}
                                onChange={(e) => actualizarCampo('fechaEntregaEstimada', e.target.value)} />
                        </div>

                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardIcon}>💵</span>
                                <h2 style={styles.cardTitle}>Información económica</h2>
                            </div>

                            <label style={styles.label}>Presupuesto acordado</label>
                            <div style={styles.moneyBox}>
                                <span style={styles.moneyPrefix}>$</span>
                                <input type="number" min="0" step="0.01" style={styles.moneyInput}
                                    value={formulario.presupuestoAcordado}
                                    onChange={(e) => actualizarCampo('presupuestoAcordado', e.target.value)} placeholder="0.00" />
                            </div>

                            <label style={styles.label}>Anticipo acordado</label>
                            <div style={styles.moneyBox}>
                                <span style={styles.moneyPrefix}>$</span>
                                <input type="number" min="0" step="0.01" style={styles.moneyInput}
                                    value={formulario.anticipoAcordado}
                                    onChange={(e) => actualizarCampo('anticipoAcordado', e.target.value)} placeholder="0.00" />
                            </div>
                            <p style={styles.helpText}>Estos valores son informativos y podrán actualizarse después.</p>
                        </div>

                        <div style={styles.card}>
                            <label style={styles.label}>Observaciones internas</label>
                            <textarea style={styles.textareaSmall} value={formulario.observaciones}
                                onChange={(e) => actualizarCampo('observaciones', e.target.value)}
                                placeholder="Condiciones, acuerdos o información importante" />
                        </div>

                        <div style={styles.actionsCard}>
                            <button type="submit" style={{ ...styles.saveButton, opacity: guardando ? 0.65 : 1 }}
                                disabled={guardando || cargandoCatalogos}>
                                {guardando ? 'Guardando solicitud...' : '✓ Crear solicitud'}
                            </button>
                            <button type="button" style={styles.cancelButton} onClick={onVolver} disabled={guardando}>
                                Cancelar
                            </button>
                        </div>
                    </aside>
                </section>
            </form>
        </main>
    );
}

const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', padding: 24, background: 'linear-gradient(135deg,#020617,#0f172a)', color: '#e5e7eb' },
    topActions: { marginBottom: 14 },
    backButton: { background: 'rgba(15,23,42,.95)', border: '1px solid rgba(56,189,248,.35)', color: '#38bdf8', padding: '10px 14px', borderRadius: 12, cursor: 'pointer', fontWeight: 700 },
    header: { marginBottom: 25 },
    eyebrow: { color: '#38bdf8', fontSize: 11, fontWeight: 800, letterSpacing: 1.5 },
    title: { margin: '6px 0 0', fontSize: 32, fontWeight: 850, color: '#f8fafc' },
    subtitle: { margin: '8px 0 0', color: '#94a3b8', fontSize: 15 },
    errorBox: { display: 'flex', alignItems: 'center', gap: 12, padding: 15, marginBottom: 20, borderRadius: 14, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(127,29,29,.18)', color: '#fecaca', flexWrap: 'wrap' },
    successBox: { display: 'flex', alignItems: 'center', gap: 10, padding: 15, marginBottom: 20, borderRadius: 14, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(20,83,45,.2)', color: '#bbf7d0' },
    alertText: { margin: '3px 0 0', color: '#fca5a5', fontSize: 13 },
    retryButton: { marginLeft: 'auto', padding: '8px 13px', borderRadius: 9, border: '1px solid rgba(248,113,113,.4)', background: 'rgba(239,68,68,.15)', color: '#fecaca', cursor: 'pointer', fontWeight: 700 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 20, alignItems: 'start' },
    mainColumn: { display: 'grid', gap: 20 },
    sideColumn: { display: 'grid', gap: 20 },
    card: { padding: 21, borderRadius: 18, border: '1px solid rgba(148,163,184,.17)', background: 'rgba(15,23,42,.92)', boxShadow: '0 15px 35px rgba(0,0,0,.22)' },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 19 },
    cardIcon: { display: 'grid', placeItems: 'center', width: 40, height: 40, flexShrink: 0, borderRadius: 12, background: '#020617', fontSize: 20 },
    cardTitle: { margin: 0, color: '#f8fafc', fontSize: 17 },
    cardDescription: { margin: '4px 0 0', color: '#64748b', fontSize: 12 },
    twoColumns: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 15 },
    label: { display: 'block', margin: '14px 0 7px', color: '#cbd5e1', fontSize: 13, fontWeight: 700 },
    input: { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 11, border: '1px solid rgba(148,163,184,.25)', outline: 'none', background: '#020617', color: '#e5e7eb', fontSize: 14 },
    textarea: { width: '100%', minHeight: 115, resize: 'vertical', boxSizing: 'border-box', padding: 12, borderRadius: 11, border: '1px solid rgba(148,163,184,.25)', outline: 'none', background: '#020617', color: '#e5e7eb', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5 },
    textareaSmall: { width: '100%', minHeight: 82, resize: 'vertical', boxSizing: 'border-box', padding: 12, borderRadius: 11, border: '1px solid rgba(148,163,184,.25)', outline: 'none', background: '#020617', color: '#e5e7eb', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5 },
    helpText: { margin: '8px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.4 },
    moneyBox: { display: 'flex', alignItems: 'center', overflow: 'hidden', borderRadius: 11, border: '1px solid rgba(148,163,184,.25)', background: '#020617' },
    moneyPrefix: { padding: '0 0 0 12px', color: '#22c55e', fontWeight: 800 },
    moneyInput: { width: '100%', padding: '11px 12px 11px 7px', border: 'none', outline: 'none', background: 'transparent', color: '#e5e7eb', fontSize: 14 },
    actionsCard: { display: 'grid', gap: 10, padding: 16, borderRadius: 17, border: '1px solid rgba(56,189,248,.2)', background: 'rgba(15,23,42,.92)' },
    saveButton: { width: '100%', padding: '13px 16px', border: 'none', borderRadius: 11, background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', cursor: 'pointer', fontWeight: 800, boxShadow: '0 10px 24px rgba(37,99,235,.28)' },
    cancelButton: { width: '100%', padding: '11px 16px', border: '1px solid rgba(148,163,184,.22)', borderRadius: 11, background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 },
};