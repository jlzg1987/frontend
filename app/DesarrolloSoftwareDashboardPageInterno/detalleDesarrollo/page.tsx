'use client';

import { API_BASE } from '@/src/lib/api';
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';

type Props = {
    solicitudId: string;
    onVolver: () => void;
    onEditarSolicitud?: (solicitudId: string) => void;
};

type Pestaña = 'RESUMEN' | 'REQUISITOS' | 'AVANCES' | 'PENDIENTES' | 'REVISIONES' | 'ARCHIVOS' | 'PAGOS' | 'EQUIPO' | 'HISTORIAL';
type Recurso = 'requisitos' | 'avances' | 'pendientes' | 'revisiones' | 'archivos' | 'pagos' | 'asignaciones';

type Detalle = {
    solicitud: any;
    requisitos: any[];
    avances: any[];
    pendientes: any[];
    revisiones: any[];
    archivos: any[];
    pagos: any[];
    asignaciones: any[];
    historial: any[];
};

const DETALLE_VACIO: Detalle = {
    solicitud: null,
    requisitos: [],
    avances: [],
    pendientes: [],
    revisiones: [],
    archivos: [],
    pagos: [],
    asignaciones: [],
    historial: [],
};

const ETAPAS = [
    'SOLICITUD_RECIBIDA', 'LEVANTAMIENTO_INFORMACION', 'COTIZACION', 'APROBADO',
    'DISENO', 'DESARROLLO', 'REVISION_CLIENTE', 'CORRECCIONES', 'LISTO_ENTREGA',
    'ENTREGADO', 'SOPORTE', 'PAUSADO', 'ESPERANDO_INFORMACION', 'ESPERANDO_PAGO', 'CANCELADO',
];

const PESTAÑAS: Array<{ id: Pestaña; texto: string; icono: string; clave?: keyof Detalle }> = [
    { id: 'RESUMEN', texto: 'Resumen', icono: '📌' },
    { id: 'REQUISITOS', texto: 'Requisitos', icono: '📝', clave: 'requisitos' },
    { id: 'AVANCES', texto: 'Avances', icono: '📈', clave: 'avances' },
    { id: 'PENDIENTES', texto: 'Pendientes', icono: '⏳', clave: 'pendientes' },
    { id: 'REVISIONES', texto: 'Revisiones', icono: '👀', clave: 'revisiones' },
    { id: 'ARCHIVOS', texto: 'Archivos', icono: '📎', clave: 'archivos' },
    { id: 'PAGOS', texto: 'Pagos', icono: '💵', clave: 'pagos' },
    { id: 'EQUIPO', texto: 'Equipo', icono: '👥', clave: 'asignaciones' },
    { id: 'HISTORIAL', texto: 'Historial', icono: '🕘', clave: 'historial' },
];

function textoEnum(valor?: string | null) {
    if (!valor) return 'Sin definir';
    return valor.toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function fecha(valor?: string | null, conHora = false) {
    if (!valor) return 'Sin definir';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return 'Sin definir';
    return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit', month: 'short', year: 'numeric',
        ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(d);
}

function dinero(valor?: number | string | null) {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(valor || 0));
}

function colorEstado(estado?: string) {
    if (['COMPLETADO', 'APROBADO', 'CONFIRMADO', 'RESUELTO', 'ACTIVO', 'FINALIZADO', 'ENTREGADO'].includes(estado || '')) return '#22c55e';
    if (['PENDIENTE', 'PENDIENTE_CLIENTE', 'PENDIENTE_REVISION', 'RECIBIDO', 'EN_REVISION'].includes(estado || '')) return '#f59e0b';
    if (['RECHAZADO', 'CANCELADO', 'ANULADO', 'CORRECCION_SOLICITADA'].includes(estado || '')) return '#ef4444';
    return '#38bdf8';
}

export default function DetalleDesarrolloPageInterno({ solicitudId, onVolver, onEditarSolicitud }: Props) {
    const [detalle, setDetalle] = useState<Detalle>(DETALLE_VACIO);
    const [pestaña, setPestaña] = useState<Pestaña>('RESUMEN');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modal, setModal] = useState<Recurso | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [formulario, setFormulario] = useState<Record<string, any>>({});
    const [catalogos, setCatalogos] = useState<any>({ tecnicos: [], grupos: [] });

    const token = () => localStorage.getItem('isp_token');

    const cargarDetalle = useCallback(async () => {
        try {
            setCargando(true);
            setError('');
            const jwt = token();
            if (!jwt) throw new Error('No se encontró la sesión del usuario');

            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes/${solicitudId}`, {
                headers: { Authorization: `Bearer ${jwt}` }, cache: 'no-store',
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cargar el desarrollo');

            setDetalle({
                solicitud: data.solicitud,
                requisitos: data.requisitos || [], avances: data.avances || [],
                pendientes: data.pendientes || [], revisiones: data.revisiones || [],
                archivos: data.archivos || [], pagos: data.pagos || [],
                asignaciones: data.asignaciones || [], historial: data.historial || [],
            });
        } catch (e: any) {
            console.error('Error cargando detalle del desarrollo:', e);
            setError(e?.message || 'No fue posible cargar la información');
        } finally { setCargando(false); }
    }, [solicitudId]);

    useEffect(() => { cargarDetalle(); }, [cargarDetalle]);

    const progresoRequisitos = useMemo(() => {
        if (!detalle.requisitos.length) return 0;
        return Math.round(detalle.requisitos.reduce((s, r) => s + Number(r.porcentajeAvance || (r.estado === 'COMPLETADO' ? 100 : 0)), 0) / detalle.requisitos.length);
    }, [detalle.requisitos]);

    async function cargarCatalogos() {
        if (catalogos.tecnicos.length || catalogos.grupos.length) return;
        try {
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/catalogos`, {
                headers: { Authorization: `Bearer ${token()}` }, cache: 'no-store',
            });
            const data = await respuesta.json();
            if (respuesta.ok) setCatalogos(data);
        } catch (e) { console.error('Error cargando responsables:', e); }
    }

    function abrirModal(recurso: Recurso) {
        const inicial: Record<string, any> = { visibleCliente: 1 };
        if (recurso === 'requisitos') Object.assign(inicial, { tipo: 'FUNCIONAL', prioridad: 'MEDIA', estado: 'PENDIENTE', porcentajeAvance: 0 });
        if (recurso === 'avances') Object.assign(inicial, { etapa: detalle.solicitud?.etapaActual || 'DESARROLLO', porcentajeAvance: detalle.solicitud?.porcentajeAvance || 0 });
        if (recurso === 'pendientes') Object.assign(inicial, { tipo: 'INFORMACION', prioridad: 'MEDIA' });
        if (recurso === 'revisiones') Object.assign(inicial, { tipoEntrega: 'DISENO' });
        if (recurso === 'archivos') Object.assign(inicial, { categoria: 'ENTREGABLE' });
        if (recurso === 'pagos') Object.assign(inicial, { tipo: 'ANTICIPO', metodo: 'TRANSFERENCIA', estado: 'PENDIENTE' });
        if (recurso === 'asignaciones') { Object.assign(inicial, { tipoResponsable: 'TECNICO', visibleCliente: 1 }); cargarCatalogos(); }
        setFormulario(inicial); setModal(recurso); setError(''); setMensaje('');
    }

    async function crearRegistro(evento: FormEvent) {
        evento.preventDefault();
        if (!modal) return;
        try {
            setGuardando(true); setError('');
            const payload = { ...formulario };
            if (modal === 'asignaciones') {
                payload.tecnicoId = payload.tipoResponsable === 'TECNICO' ? payload.responsableId : null;
                payload.grupoId = payload.tipoResponsable === 'GRUPO' ? payload.responsableId : null;
                delete payload.tipoResponsable; delete payload.responsableId;
            }
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes/${solicitudId}/${modal}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify(payload),
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible guardar el registro');
            setModal(null); setFormulario({}); setMensaje('Registro creado correctamente');
            await cargarDetalle();
        } catch (e: any) { setError(e?.message || 'No fue posible guardar el registro'); }
        finally { setGuardando(false); }
    }

    async function eliminarRegistro(recurso: Recurso, id: string) {
        if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
        try {
            setError('');
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes/${solicitudId}/${recurso}/${id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token()}` },
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible eliminar');
            setMensaje('Registro eliminado correctamente'); await cargarDetalle();
        } catch (e: any) { setError(e?.message || 'No fue posible eliminar el registro'); }
    }

    async function actualizarEtapa(etapaActual: string) {
        try {
            const respuesta = await fetch(`${API_BASE}/desarrollo-software/solicitudes/${solicitudId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ etapaActual }),
            });
            const data = await respuesta.json();
            if (!respuesta.ok || data.ok === false) throw new Error(data.mensaje || 'No fue posible cambiar la etapa');
            setMensaje('Etapa actualizada correctamente'); await cargarDetalle();
        } catch (e: any) { setError(e?.message || 'No fue posible cambiar la etapa'); }
    }

    if (cargando && !detalle.solicitud) return <main style={styles.page}><div style={styles.loading}>Cargando desarrollo...</div></main>;

    const s = detalle.solicitud;

    return (
        <main style={styles.page}>
            <div style={styles.topBar}>
                <button style={styles.backButton} onClick={onVolver}>← Volver</button>
                <button style={styles.refreshButton} onClick={cargarDetalle}>↻ Actualizar</button>
            </div>

            {error && <div style={styles.errorBox}>⚠️ {error}</div>}
            {mensaje && <div style={styles.successBox}>✅ {mensaje}</div>}

            {s && <>
                <header style={styles.hero}>
                    <div style={styles.heroMain}>
                        <div style={styles.heroTop}>
                            <span style={styles.code}>{s.codigo}</span>
                            <span style={{ ...styles.badge, color: colorEstado(s.estado), borderColor: `${colorEstado(s.estado)}66` }}>{textoEnum(s.estado)}</span>
                        </div>
                        <h1 style={styles.title}>{s.nombreProyecto}</h1>
                        <p style={styles.client}>👤 {s.nombreCliente} · {textoEnum(s.tipoDesarrollo)}</p>
                        <div style={styles.progressHeader}><span>Avance general</span><strong>{Number(s.porcentajeAvance || 0)}%</strong></div>
                        <div style={styles.progressTrack}><div style={{ ...styles.progressBar, width: `${Number(s.porcentajeAvance || 0)}%` }} /></div>
                    </div>
                    <div style={styles.heroSide}>
                        <label style={styles.label}>Etapa actual</label>
                        <select style={styles.input} value={s.etapaActual || ''} onChange={(e) => actualizarEtapa(e.target.value)}>
                            {ETAPAS.map((etapa) => <option key={etapa} value={etapa}>{textoEnum(etapa)}</option>)}
                        </select>
                        <button style={styles.editButton} onClick={() => onEditarSolicitud?.(solicitudId)}>✏️ Editar información</button>
                    </div>
                </header>

                <nav style={styles.tabs}>
                    {PESTAÑAS.map((tab) => {
                        const cantidad = tab.clave ? (detalle[tab.clave] as any[])?.length || 0 : null;
                        return <button key={tab.id} onClick={() => setPestaña(tab.id)} style={{ ...styles.tab, ...(pestaña === tab.id ? styles.tabActive : {}) }}>
                            {tab.icono} {tab.texto}{cantidad !== null ? ` (${cantidad})` : ''}
                        </button>;
                    })}
                </nav>

                {pestaña === 'RESUMEN' && <Resumen detalle={detalle} progresoRequisitos={progresoRequisitos} />}
                {pestaña === 'REQUISITOS' && <Listado titulo="Requisitos solicitados" descripcion="Funciones y características acordadas con el cliente." boton="+ Nuevo requisito" onNuevo={() => abrirModal('requisitos')} vacio="No hay requisitos registrados.">
                    {detalle.requisitos.map((r) => <Tarjeta key={r.requisitoId} titulo={`${r.codigo} · ${r.titulo}`} estado={r.estado} descripcion={r.descripcion} meta={`${textoEnum(r.tipo)} · Prioridad ${textoEnum(r.prioridad)} · ${r.porcentajeAvance || 0}%`} onEliminar={() => eliminarRegistro('requisitos', r.requisitoId)} />)}
                </Listado>}
                {pestaña === 'AVANCES' && <Listado titulo="Línea de avances" descripcion="Actualizaciones visibles para conocer cómo avanza el proyecto." boton="+ Publicar avance" onNuevo={() => abrirModal('avances')} vacio="No hay avances publicados.">
                    {detalle.avances.map((a) => <Tarjeta key={a.avanceId} titulo={a.titulo} estado={a.etapa} descripcion={a.descripcion} meta={`${fecha(a.fechaPublicacion, true)} · Avance ${a.porcentajeAvance ?? '-'}%`} onEliminar={() => eliminarRegistro('avances', a.avanceId)} />)}
                </Listado>}
                {pestaña === 'PENDIENTES' && <Listado titulo="Pendientes del cliente" descripcion="Información, archivos, decisiones o pagos que debe completar el cliente." boton="+ Solicitar información" onNuevo={() => abrirModal('pendientes')} vacio="El cliente no tiene pendientes.">
                    {detalle.pendientes.map((p) => <Tarjeta key={p.pendienteId} titulo={p.titulo} estado={p.estado} descripcion={p.descripcion} meta={`${textoEnum(p.tipo)} · Límite: ${fecha(p.fechaLimite)}`} extra={p.respuestaCliente ? `Respuesta: ${p.respuestaCliente}` : undefined} onEliminar={() => eliminarRegistro('pendientes', p.pendienteId)} />)}
                </Listado>}
                {pestaña === 'REVISIONES' && <Listado titulo="Revisiones y aprobaciones" descripcion="Entregas parciales enviadas para aprobación del cliente." boton="+ Enviar revisión" onNuevo={() => abrirModal('revisiones')} vacio="No hay revisiones enviadas.">
                    {detalle.revisiones.map((r) => <Tarjeta key={r.revisionId} titulo={r.titulo} estado={r.estado} descripcion={r.descripcion} meta={`${textoEnum(r.tipoEntrega)} · Enviado ${fecha(r.fechaEnvio, true)}`} extra={r.observacionCliente} enlace={r.urlRevision} onEliminar={() => eliminarRegistro('revisiones', r.revisionId)} />)}
                </Listado>}
                {pestaña === 'ARCHIVOS' && <Listado titulo="Archivos y entregables" descripcion="Enlaces a documentos, diseños, versiones y entregas." boton="+ Registrar archivo" onNuevo={() => abrirModal('archivos')} vacio="No hay archivos registrados.">
                    {detalle.archivos.map((a) => <Tarjeta key={a.archivoId} titulo={a.nombreOriginal} estado={a.categoria} descripcion={a.descripcion} meta={`${a.mimeType || 'Archivo'} · ${fecha(a.createdAt, true)}`} enlace={a.url} onEliminar={() => eliminarRegistro('archivos', a.archivoId)} />)}
                </Listado>}
                {pestaña === 'PAGOS' && <Listado titulo="Pagos informativos" descripcion={`Pagado: ${dinero(s.totalPagado)} · Saldo: ${dinero(s.saldoPendiente)}`} boton="+ Registrar pago" onNuevo={() => abrirModal('pagos')} vacio="No hay pagos registrados.">
                    {detalle.pagos.map((p) => <Tarjeta key={p.pagoId} titulo={`${p.concepto} · ${dinero(p.monto)}`} estado={p.estado} descripcion={`${textoEnum(p.tipo)} mediante ${textoEnum(p.metodo)}`} meta={`${fecha(p.fechaPago, true)}${p.numeroComprobante ? ` · Comp. ${p.numeroComprobante}` : ''}`} enlace={p.comprobanteUrl} onEliminar={() => eliminarRegistro('pagos', p.pagoId)} />)}
                </Listado>}
                {pestaña === 'EQUIPO' && <Listado titulo="Equipo responsable" descripcion={`Responsable principal: ${s.responsable || 'Sin asignar'}`} boton="+ Asignar responsable" onNuevo={() => abrirModal('asignaciones')} vacio="No hay asignaciones adicionales.">
                    {detalle.asignaciones.map((a) => <Tarjeta key={a.asignacionId} titulo={a.tecnicoNombre || a.grupoNombre || 'Responsable'} estado={a.estado} descripcion={a.funcion || 'Sin función especificada'} meta={a.esResponsablePrincipal ? 'Responsable principal' : 'Colaborador'} onEliminar={() => eliminarRegistro('asignaciones', a.asignacionId)} />)}
                </Listado>}
                {pestaña === 'HISTORIAL' && <Listado titulo="Historial del proyecto" descripcion="Registro cronológico de actividades y cambios." vacio="No hay actividad registrada.">
                    {detalle.historial.map((h) => <Tarjeta key={h.historialId} titulo={textoEnum(h.accion)} descripcion={h.descripcion} meta={`${h.usuarioNombre || 'Sistema'} · ${fecha(h.createdAt, true)}`} />)}
                </Listado>}
            </>}

            {modal && <ModalRegistro recurso={modal} formulario={formulario} setFormulario={setFormulario} catalogos={catalogos} onCerrar={() => setModal(null)} onGuardar={crearRegistro} guardando={guardando} />}
        </main>
    );
}

function Resumen({ detalle, progresoRequisitos }: { detalle: Detalle; progresoRequisitos: number }) {
    const s = detalle.solicitud;
    return <section style={styles.contentGrid}>
        <div style={styles.cardWide}>
            <h2 style={styles.sectionTitle}>Descripción del proyecto</h2>
            <p style={styles.bodyText}>{s.descripcion || 'Sin descripción'}</p>
            <h3 style={styles.subTitle}>Objetivo</h3><p style={styles.bodyText}>{s.objetivo || 'Sin objetivo definido'}</p>
            <h3 style={styles.subTitle}>Alcance inicial</h3><p style={styles.bodyText}>{s.alcance || 'Sin alcance definido'}</p>
        </div>
        <div style={styles.summaryColumn}>
            <Info titulo="Responsable" valor={s.responsable || 'Sin asignar'} icono="👥" />
            <Info titulo="Entrega estimada" valor={fecha(s.fechaEntregaEstimada)} icono="📅" />
            <Info titulo="Presupuesto" valor={dinero(s.presupuestoAcordado)} icono="💵" />
            <Info titulo="Requisitos" valor={`${detalle.requisitos.length} · ${progresoRequisitos}% promedio`} icono="📝" />
            <Info titulo="Pendientes del cliente" valor={String(detalle.pendientes.filter((p) => p.estado === 'PENDIENTE').length)} icono="⏳" />
        </div>
    </section>;
}

function Info({ titulo, valor, icono }: any) { return <div style={styles.infoCard}><span style={styles.infoIcon}>{icono}</span><div><span style={styles.infoLabel}>{titulo}</span><strong style={styles.infoValue}>{valor}</strong></div></div>; }

function Listado({ titulo, descripcion, boton, onNuevo, vacio, children }: any) {
    const hay = Array.isArray(children) ? children.length > 0 : Boolean(children);
    return <section style={styles.listSection}>
        <div style={styles.sectionHeader}><div><h2 style={styles.sectionTitle}>{titulo}</h2><p style={styles.sectionDescription}>{descripcion}</p></div>{boton && <button style={styles.primaryButton} onClick={onNuevo}>{boton}</button>}</div>
        <div style={styles.list}>{hay ? children : <div style={styles.empty}>{vacio}</div>}</div>
    </section>;
}

function Tarjeta({ titulo, estado, descripcion, meta, extra, enlace, onEliminar }: any) {
    return <article style={styles.itemCard}>
        <div style={styles.itemMain}><div style={styles.itemTop}><h3 style={styles.itemTitle}>{titulo}</h3>{estado && <span style={{ ...styles.smallBadge, color: colorEstado(estado), background: `${colorEstado(estado)}18` }}>{textoEnum(estado)}</span>}</div>
            {descripcion && <p style={styles.itemDescription}>{descripcion}</p>}{extra && <p style={styles.extraText}>{extra}</p>}<p style={styles.itemMeta}>{meta}</p>
            {enlace && <a href={enlace} target="_blank" rel="noreferrer" style={styles.link}>Abrir enlace ↗</a>}
        </div>{onEliminar && <button style={styles.deleteButton} onClick={onEliminar} title="Eliminar">🗑️</button>}
    </article>;
}

function ModalRegistro({ recurso, formulario, setFormulario, catalogos, onCerrar, onGuardar, guardando }: any) {
    const set = (campo: string, valor: any) => setFormulario((f: any) => ({ ...f, [campo]: valor, ...(campo === 'tipoResponsable' ? { responsableId: '' } : {}) }));
    const responsables = formulario.tipoResponsable === 'GRUPO' ? catalogos.grupos : catalogos.tecnicos;
    return <div style={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}><form style={styles.modal} onSubmit={onGuardar}>
        <div style={styles.modalHeader}><div><span style={styles.eyebrow}>NUEVO REGISTRO</span><h2 style={styles.modalTitle}>{textoEnum(recurso)}</h2></div><button type="button" style={styles.closeButton} onClick={onCerrar}>×</button></div>
        {recurso === 'requisitos' && <><Campo label="Título *" valor={formulario.titulo} set={(v: any) => set('titulo', v)} /><Area label="Descripción *" valor={formulario.descripcion} set={(v: any) => set('descripcion', v)} /><Select label="Tipo" valor={formulario.tipo} set={(v: any) => set('tipo', v)} opciones={['FUNCIONAL', 'DISENO', 'INTEGRACION', 'SEGURIDAD', 'CONTENIDO', 'OTRO']} /><Select label="Prioridad" valor={formulario.prioridad} set={(v: any) => set('prioridad', v)} opciones={['BAJA', 'MEDIA', 'ALTA', 'URGENTE']} /></>}
        {recurso === 'avances' && <><Campo label="Título *" valor={formulario.titulo} set={(v: any) => set('titulo', v)} /><Area label="Descripción *" valor={formulario.descripcion} set={(v: any) => set('descripcion', v)} /><Select label="Etapa" valor={formulario.etapa} set={(v: any) => set('etapa', v)} opciones={ETAPAS} /><Campo label="Porcentaje de avance" tipo="number" valor={formulario.porcentajeAvance} set={(v: any) => set('porcentajeAvance', Number(v))} /></>}
        {recurso === 'pendientes' && <><Campo label="Título *" valor={formulario.titulo} set={(v: any) => set('titulo', v)} /><Area label="Descripción *" valor={formulario.descripcion} set={(v: any) => set('descripcion', v)} /><Select label="Tipo" valor={formulario.tipo} set={(v: any) => set('tipo', v)} opciones={['INFORMACION', 'ARCHIVO', 'APROBACION', 'PAGO', 'ACCESO', 'DECISION', 'OTRO']} /><Campo label="Fecha límite" tipo="date" valor={formulario.fechaLimite} set={(v: any) => set('fechaLimite', v)} /></>}
        {recurso === 'revisiones' && <><Campo label="Título *" valor={formulario.titulo} set={(v: any) => set('titulo', v)} /><Area label="Descripción" valor={formulario.descripcion} set={(v: any) => set('descripcion', v)} /><Select label="Tipo de entrega" valor={formulario.tipoEntrega} set={(v: any) => set('tipoEntrega', v)} opciones={['DISENO', 'PANTALLA', 'VERSION_WEB', 'APK', 'DOCUMENTO', 'PROPUESTA', 'ENTREGA_FINAL', 'OTRO']} /><Campo label="URL para revisión" valor={formulario.urlRevision} set={(v: any) => set('urlRevision', v)} /></>}
        {recurso === 'archivos' && <><Campo label="Nombre del archivo *" valor={formulario.nombreOriginal} set={(v: any) => set('nombreOriginal', v)} /><Campo label="URL *" valor={formulario.url} set={(v: any) => set('url', v)} /><Select label="Categoría" valor={formulario.categoria} set={(v: any) => set('categoria', v)} opciones={['REQUISITO', 'AVANCE', 'PENDIENTE_CLIENTE', 'REVISION', 'ENTREGABLE', 'COMPROBANTE', 'CONTRATO', 'OTRO']} /><Area label="Descripción" valor={formulario.descripcion} set={(v: any) => set('descripcion', v)} /></>}
        {recurso === 'pagos' && <><Campo label="Concepto *" valor={formulario.concepto} set={(v: any) => set('concepto', v)} /><Campo label="Monto *" tipo="number" valor={formulario.monto} set={(v: any) => set('monto', Number(v))} /><Select label="Tipo" valor={formulario.tipo} set={(v: any) => set('tipo', v)} opciones={['ANTICIPO', 'ABONO', 'PAGO_FINAL', 'REEMBOLSO', 'OTRO']} /><Select label="Método" valor={formulario.metodo} set={(v: any) => set('metodo', v)} opciones={['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'PAYPHONE', 'OTRO']} /><Campo label="Número de comprobante" valor={formulario.numeroComprobante} set={(v: any) => set('numeroComprobante', v)} /><Campo label="URL del comprobante" valor={formulario.comprobanteUrl} set={(v: any) => set('comprobanteUrl', v)} /></>}
        {recurso === 'asignaciones' && <><Select label="Tipo" valor={formulario.tipoResponsable} set={(v: any) => set('tipoResponsable', v)} opciones={['TECNICO', 'GRUPO']} /><label style={styles.label}>Responsable *</label><select style={styles.input} value={formulario.responsableId || ''} onChange={(e) => set('responsableId', e.target.value)} required><option value="">Seleccionar</option>{(responsables || []).map((r: any) => <option key={r.tecnicoId || r.grupoId} value={r.tecnicoId || r.grupoId}>{r.nombre}</option>)}</select><Campo label="Función" valor={formulario.funcion} set={(v: any) => set('funcion', v)} /></>}
        {recurso !== 'pagos' && <label style={styles.checkLabel}><input type="checkbox" checked={Boolean(formulario.visibleCliente)} onChange={(e) => set('visibleCliente', e.target.checked ? 1 : 0)} /> Visible para el cliente</label>}
        <div style={styles.modalActions}><button type="button" style={styles.cancelButton} onClick={onCerrar}>Cancelar</button><button type="submit" style={styles.saveButton} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar registro'}</button></div>
    </form></div>;
}

function Campo({ label, valor, set, tipo = 'text' }: any) { return <><label style={styles.label}>{label}</label><input type={tipo} min={tipo === 'number' ? 0 : undefined} max={label.includes('Porcentaje') ? 100 : undefined} step={tipo === 'number' ? '0.01' : undefined} style={styles.input} value={valor ?? ''} onChange={(e) => set(e.target.value)} required={label.includes('*')} /></>; }
function Area({ label, valor, set }: any) { return <><label style={styles.label}>{label}</label><textarea style={styles.textarea} value={valor ?? ''} onChange={(e) => set(e.target.value)} required={label.includes('*')} /></>; }
function Select({ label, valor, set, opciones }: any) { return <><label style={styles.label}>{label}</label><select style={styles.input} value={valor || opciones[0]} onChange={(e) => set(e.target.value)}>{opciones.map((o: string) => <option key={o} value={o}>{textoEnum(o)}</option>)}</select></>; }

const styles: Record<string, CSSProperties> = {
    page: { minHeight: '100vh', padding: 24, background: 'linear-gradient(135deg,#020617,#0f172a)', color: '#e5e7eb' }, loading: { padding: 30, textAlign: 'center', color: '#94a3b8' },
    topBar: { display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 10 }, backButton: { background: '#0f172a', border: '1px solid rgba(56,189,248,.35)', color: '#38bdf8', padding: '10px 14px', borderRadius: 11, cursor: 'pointer', fontWeight: 700 }, refreshButton: { background: '#0f172a', border: '1px solid rgba(148,163,184,.25)', color: '#cbd5e1', padding: '10px 14px', borderRadius: 11, cursor: 'pointer' },
    errorBox: { padding: 14, marginBottom: 15, borderRadius: 12, border: '1px solid rgba(239,68,68,.35)', background: 'rgba(127,29,29,.2)', color: '#fecaca' }, successBox: { padding: 14, marginBottom: 15, borderRadius: 12, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(20,83,45,.2)', color: '#bbf7d0' },
    hero: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 22, padding: 24, borderRadius: 20, border: '1px solid rgba(56,189,248,.2)', background: 'rgba(15,23,42,.94)', boxShadow: '0 18px 40px rgba(0,0,0,.25)' }, heroMain: { minWidth: 0 }, heroSide: { display: 'flex', flexDirection: 'column', justifyContent: 'center' }, heroTop: { display: 'flex', gap: 10, alignItems: 'center' }, code: { color: '#38bdf8', fontWeight: 900, letterSpacing: .6 }, badge: { padding: '5px 9px', border: '1px solid', borderRadius: 999, fontSize: 11, fontWeight: 800 }, title: { margin: '10px 0 5px', fontSize: 30, color: '#f8fafc' }, client: { margin: '0 0 18px', color: '#94a3b8' }, progressHeader: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cbd5e1', marginBottom: 7 }, progressTrack: { height: 9, borderRadius: 999, overflow: 'hidden', background: '#020617' }, progressBar: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#0284c7,#22c55e)' },
    label: { display: 'block', margin: '12px 0 6px', color: '#cbd5e1', fontSize: 12, fontWeight: 700 }, input: { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,.25)', background: '#020617', color: '#e5e7eb', outline: 'none' }, textarea: { width: '100%', minHeight: 90, resize: 'vertical', boxSizing: 'border-box', padding: 11, borderRadius: 10, border: '1px solid rgba(148,163,184,.25)', background: '#020617', color: '#e5e7eb', fontFamily: 'inherit' }, editButton: { marginTop: 11, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(56,189,248,.25)', background: 'rgba(14,165,233,.1)', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 },
    tabs: { display: 'flex', gap: 8, overflowX: 'auto', padding: '18px 0 12px' }, tab: { whiteSpace: 'nowrap', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,.18)', background: '#0f172a', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }, tabActive: { borderColor: 'rgba(56,189,248,.45)', background: 'rgba(14,165,233,.15)', color: '#38bdf8' },
    contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 18, marginTop: 8 }, cardWide: { padding: 22, borderRadius: 18, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(15,23,42,.92)' }, summaryColumn: { display: 'grid', gap: 10 }, sectionTitle: { margin: 0, color: '#f8fafc', fontSize: 20 }, subTitle: { margin: '20px 0 5px', color: '#cbd5e1', fontSize: 14 }, bodyText: { color: '#94a3b8', lineHeight: 1.65, whiteSpace: 'pre-wrap' }, infoCard: { display: 'flex', gap: 12, alignItems: 'center', padding: 15, borderRadius: 14, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)' }, infoIcon: { fontSize: 22 }, infoLabel: { display: 'block', fontSize: 11, color: '#64748b' }, infoValue: { display: 'block', marginTop: 3, fontSize: 14, color: '#e2e8f0' },
    listSection: { marginTop: 8 }, sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, marginBottom: 16, flexWrap: 'wrap' }, sectionDescription: { margin: '5px 0 0', color: '#64748b', fontSize: 13 }, primaryButton: { padding: '10px 14px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', cursor: 'pointer', fontWeight: 800 }, list: { display: 'grid', gap: 11 }, empty: { padding: 35, textAlign: 'center', borderRadius: 16, border: '1px dashed rgba(148,163,184,.25)', color: '#64748b' }, itemCard: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 17, borderRadius: 15, border: '1px solid rgba(148,163,184,.15)', background: 'rgba(15,23,42,.92)' }, itemMain: { minWidth: 0, flex: 1 }, itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }, itemTitle: { margin: 0, color: '#f8fafc', fontSize: 16 }, smallBadge: { padding: '5px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800 }, itemDescription: { margin: '8px 0', color: '#94a3b8', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }, itemMeta: { margin: '7px 0 0', color: '#64748b', fontSize: 11 }, extraText: { padding: 9, borderRadius: 9, background: '#020617', color: '#cbd5e1', fontSize: 12 }, link: { display: 'inline-block', marginTop: 9, color: '#38bdf8', fontSize: 12, fontWeight: 700 }, deleteButton: { alignSelf: 'center', width: 36, height: 36, borderRadius: 9, border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.08)', cursor: 'pointer' },
    overlay: { position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(2,6,23,.82)', backdropFilter: 'blur(4px)' }, modal: { width: 'min(560px,100%)', maxHeight: '90vh', overflowY: 'auto', padding: 22, borderRadius: 18, border: '1px solid rgba(56,189,248,.25)', background: '#0f172a', boxShadow: '0 25px 70px rgba(0,0,0,.5)' }, modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'start' }, eyebrow: { color: '#38bdf8', fontSize: 10, fontWeight: 900, letterSpacing: 1.3 }, modalTitle: { margin: '5px 0 8px', color: '#f8fafc' }, closeButton: { border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 27, cursor: 'pointer' }, checkLabel: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 15, color: '#cbd5e1', fontSize: 13 }, modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 20 }, cancelButton: { padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,.25)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }, saveButton: { padding: '10px 15px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#0284c7,#2563eb)', color: '#fff', cursor: 'pointer', fontWeight: 800 },
};