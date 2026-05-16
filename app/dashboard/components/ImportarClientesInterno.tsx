'use client';

import { API_BASE, getToken } from '@/src/lib/api';
import { useState } from 'react';

export default function ImportarClientesInterno() {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    const descargarFormato = async () => {
        try {
            const token = await getToken();

            const res = await fetch(`${API_BASE}/importador/formato-clientes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'formato_clientes_isp.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Error descargando formato');
        }
    };

    const importarExcel = async () => {
        if (!archivo) {
            alert('Seleccione un archivo Excel');
            return;
        }

        try {
            setLoading(true);
            setResultado(null);

            const token = await getToken();
            const formData = new FormData();
            formData.append('archivo', archivo);

            const res = await fetch(`${API_BASE}/importador/clientes/excel`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();
            setResultado(data);

            if (!data.ok) {
                alert(data.message || 'No se pudo importar');
                return;
            }

            alert('Importación finalizada');
            setArchivo(null);
        } catch (error) {
            console.error(error);
            alert('Error importando clientes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section style={styles.wrapper}>
            <div style={styles.card}>
                <h2 style={styles.title}>Importar clientes desde Excel</h2>
                <p style={styles.subtitle}>
                    Descarga el formato oficial, llena los datos de tus clientes y luego súbelo para importarlos al sistema.
                </p>

                <div style={styles.steps}>
                    <div style={styles.step}>
                        <strong>1</strong>
                        <span>Descargar formato Excel</span>
                    </div>

                    <div style={styles.step}>
                        <strong>2</strong>
                        <span>Llenar clientes</span>
                    </div>

                    <div style={styles.step}>
                        <strong>3</strong>
                        <span>Subir e importar</span>
                    </div>
                </div>

                <div style={styles.actions}>
                    <button style={styles.downloadButton} onClick={descargarFormato}>
                        Descargar formato Excel
                    </button>

                    <label style={styles.fileLabel}>
                        Seleccionar Excel
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                        />
                    </label>

                    <button
                        style={{
                            ...styles.importButton,
                            opacity: loading ? 0.6 : 1,
                        }}
                        onClick={importarExcel}
                        disabled={loading}
                    >
                        {loading ? 'Importando...' : 'Importar clientes'}
                    </button>
                </div>

                {archivo && (
                    <div style={styles.fileBox}>
                        Archivo seleccionado: <strong>{archivo.name}</strong>
                    </div>
                )}
            </div>

            {resultado && (
                <div style={styles.resultCard}>
                    <h3 style={styles.resultTitle}>Resultado de importación</h3>

                    <div style={styles.resultGrid}>
                        <div style={styles.resultItem}>
                            <span>Total filas</span>
                            <strong>{resultado.totalFilas ?? 0}</strong>
                        </div>

                        <div style={styles.resultItem}>
                            <span>Importados</span>
                            <strong style={{ color: '#22c55e' }}>
                                {resultado.importados ?? 0}
                            </strong>
                        </div>

                        <div style={styles.resultItem}>
                            <span>Errores</span>
                            <strong style={{ color: '#ef4444' }}>
                                {resultado.errores?.length ?? 0}
                            </strong>
                        </div>
                    </div>

                    {resultado.errores?.length > 0 && (
                        <div style={styles.errorBox}>
                            <h4>Errores encontrados</h4>

                            {resultado.errores.map((err: any, index: number) => (
                                <p key={index} style={styles.errorLine}>
                                    Fila {err.fila}: {err.error}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    wrapper: {
        width: '100%',
    },
    card: {
        background: '#0f172a',
        border: '1px solid rgba(34,211,238,0.25)',
        borderRadius: '22px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(8,145,178,0.15)',
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 900,
        color: '#fff',
    },
    subtitle: {
        color: '#94a3b8',
        marginTop: '8px',
        maxWidth: '720px',
    },
    steps: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginTop: '22px',
    },
    step: {
        background: '#020617',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#cbd5e1',
    },
    actions: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '24px',
    },
    downloadButton: {
        background: '#06b6d4',
        color: '#001016',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '13px',
        fontWeight: 900,
        cursor: 'pointer',
    },
    fileLabel: {
        background: '#334155',
        color: '#fff',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '13px',
        fontWeight: 800,
        cursor: 'pointer',
    },
    importButton: {
        background: '#22c55e',
        color: '#052e16',
        border: 'none',
        padding: '12px 18px',
        borderRadius: '13px',
        fontWeight: 900,
        cursor: 'pointer',
    },
    fileBox: {
        marginTop: '18px',
        background: 'rgba(34,197,94,0.12)',
        border: '1px solid rgba(34,197,94,0.35)',
        color: '#bbf7d0',
        padding: '12px 14px',
        borderRadius: '14px',
    },
    resultCard: {
        marginTop: '22px',
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: '22px',
        padding: '22px',
    },
    resultTitle: {
        margin: 0,
        fontSize: '21px',
        color: '#fff',
    },
    resultGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '14px',
        marginTop: '18px',
    },
    resultItem: {
        background: '#020617',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        color: '#94a3b8',
    },
    errorBox: {
        marginTop: '20px',
        background: 'rgba(239,68,68,0.10)',
        border: '1px solid rgba(239,68,68,0.35)',
        color: '#fecaca',
        padding: '16px',
        borderRadius: '16px',
    },
    errorLine: {
        margin: '6px 0',
        fontSize: '14px',
    },
};