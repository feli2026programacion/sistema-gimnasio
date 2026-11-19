import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

function HistorialCajaPage() {
    const [historialCajas, setHistorialCajas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Filtros de fecha
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // Modal de detalle
    const [cajaSeleccionada, setCajaSeleccionada] = useState(null);

    const obtenerHistorial = async (esActivo = () => true) => {
        try {
            if (esActivo()) setCargando(true);
            const snapshot = await getDocs(collection(db, 'caja'));
            if (!esActivo()) return;

            const lista = snapshot.docs.map((documento) => ({
                id: documento.id,
                ...documento.data(),
            }));

            lista.sort((a, b) => new Date(b.fecha_apertura) - new Date(a.fecha_apertura));
            setHistorialCajas(lista);
        } catch (error) {
            console.error('Error al obtener el historial de caja:', error);
        } finally {
            if (esActivo()) setCargando(false);
        }
    };

    useEffect(() => {
        let activa = true;
        obtenerHistorial(() => activa);

        return () => {
            activa = false;
        };
    }, []);

    // Filtrar por fechas
    const cajasFiltradas = historialCajas.filter((item) => {
        if (!item.fecha_apertura) return true;
        const fechaCaja = item.fecha_apertura.split('T')[0];

        if (fechaDesde && fechaCaja < fechaDesde) return false;
        if (fechaHasta && fechaCaja > fechaHasta) return false;
        return true;
    });

    const limpiarFiltros = () => {
        setFechaDesde('');
        setFechaHasta('');
    };

    const diferenciaNum = Number(cajaSeleccionada?.diferencia || 0);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Historial de Cajas</h2>

            {/* Barra de Filtros */}
            <div style={styles.filterBar}>
                <div>
                    <label style={styles.filterLabel}>Fecha Desde</label>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        style={styles.dateInput}
                    />
                </div>
                <div>
                    <label style={styles.filterLabel}>Fecha Hasta</label>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        style={styles.dateInput}
                    />
                </div>
                <div style={styles.filterActions}>
                    <button
                        type="button"
                        onClick={() => obtenerHistorial()}
                        style={styles.filterButton}
                    >
                        Filtrar
                    </button>
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        style={styles.clearButton}
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Tabla de Historial */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Fecha Apertura</th>
                            <th style={styles.th}>Fecha Cierre</th>
                            <th style={styles.th}>Monto Inicial</th>
                            <th style={styles.th}>Monto Final</th>
                            <th style={styles.th}>Estado</th>
                            <th style={styles.thCenter}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="7" style={styles.tableMessage}>
                                    Cargando historial...
                                </td>
                            </tr>
                        ) : cajasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={styles.tableMessage}>
                                    No hay registros de caja disponibles.
                                </td>
                            </tr>
                        ) : (
                            cajasFiltradas.map((item, index) => {
                                const esAbierta = item.estado === 'ABIERTA';
                                const montoFinalMostrar = esAbierta
                                    ? 'En curso'
                                    : `$${Number(item.monto_final_real || 0).toLocaleString('es-AR', {
                                          minimumFractionDigits: 2,
                                      })}`;

                                return (
                                    <tr
                                        key={item.id || index}
                                        style={{
                                            ...styles.tableRow,
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                        }}
                                    >
                                        <td style={styles.tdId}>#{item.id.slice(0, 6)}</td>
                                        <td style={styles.tdMuted}>
                                            {item.fecha_apertura_formateada || item.fecha_apertura || 'N/A'}
                                        </td>
                                        <td style={styles.tdMuted}>
                                            {item.fecha_cierre_formateada || item.fecha_cierre || '-'}
                                        </td>
                                        <td style={styles.td}>
                                            ${Number(item.monto_inicial || 0).toLocaleString('es-AR', {
                                                minimumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td style={styles.tdFinal}>{montoFinalMostrar}</td>
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.badge,
                                                    backgroundColor: esAbierta ? '#dcfce7' : '#f1f5f9',
                                                    color: esAbierta ? '#16a34a' : '#475569',
                                                    border: `1px solid ${esAbierta ? '#86efac' : '#cbd5e1'}`,
                                                }}
                                            >
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td style={styles.tdCenter}>
                                            <button
                                                type="button"
                                                onClick={() => setCajaSeleccionada(item)}
                                                style={styles.detailButton}
                                            >
                                                Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE DETALLE */}
            {cajaSeleccionada && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>
                            Detalle de Caja (#{cajaSeleccionada.id.slice(0, 6)})
                        </h3>

                        <div style={styles.modalBody}>
                            <div>
                                <strong>Estado:</strong>{' '}
                                <span
                                    style={{
                                        color: cajaSeleccionada.estado === 'ABIERTA' ? '#16a34a' : '#dc2626',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {cajaSeleccionada.estado}
                                </span>
                            </div>
                            <div>
                                <strong>Apertura:</strong>{' '}
                                {cajaSeleccionada.fecha_apertura_formateada || cajaSeleccionada.fecha_apertura}
                            </div>
                            <div>
                                <strong>Cierre:</strong>{' '}
                                {cajaSeleccionada.fecha_cierre_formateada ||
                                    cajaSeleccionada.fecha_cierre ||
                                    'En curso (Sin cerrar)'}
                            </div>
                            <hr style={styles.divider} />
                            <div>
                                <strong>Monto Inicial (Fondo):</strong> $
                                {Number(cajaSeleccionada.monto_inicial || 0).toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <div>
                                💵 <strong>Recaudado en Efectivo:</strong> $
                                {Number(cajaSeleccionada.monto_recaudado_efectivo || 0).toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <div>
                                💳 <strong>Recaudado en Transferencia:</strong> $
                                {Number(cajaSeleccionada.monto_recaudado_transferencia || 0).toLocaleString(
                                    'es-AR',
                                    { minimumFractionDigits: 2 }
                                )}
                            </div>
                            <div>
                                <strong>Monto Final Esperado:</strong> $
                                {Number(cajaSeleccionada.monto_final_esperado || 0).toLocaleString('es-AR', {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                            <div>
                                <strong>Monto Final Real (Contado):</strong>{' '}
                                {cajaSeleccionada.monto_final_real !== undefined &&
                                cajaSeleccionada.monto_final_real !== null
                                    ? `$${Number(cajaSeleccionada.monto_final_real).toLocaleString('es-AR', {
                                          minimumFractionDigits: 2,
                                      })}`
                                    : 'N/A'}
                            </div>
                            <div>
                                <strong>Diferencia:</strong>{' '}
                                <span
                                    style={{
                                        fontWeight: 'bold',
                                        color: diferenciaNum === 0 ? '#16a34a' : '#dc2626',
                                    }}
                                >
                                    ${diferenciaNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <hr style={styles.divider} />
                            <div>
                                <strong>Observaciones:</strong>{' '}
                                {cajaSeleccionada.observaciones ||
                                    cajaSeleccionada.observaciones_cierre ||
                                    'Ninguna'}
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={() => setCajaSeleccionada(null)}
                                style={styles.closeModalButton}
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// ESTILOS DEL COMPONENTE
// ==========================================
const styles = {
    container: {
        padding: '30px',
        fontFamily: 'sans-serif',
        maxWidth: '1100px',
        margin: '0 auto',
    },
    title: {
        color: '#1e293b',
        marginTop: 0,
        marginBottom: '20px',
    },
    filterBar: {
        backgroundColor: '#ffffff',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        display: 'flex',
        gap: '15px',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        border: '1px solid #cbd5e1',
    },
    filterLabel: {
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'block',
        marginBottom: '5px',
        color: '#475569',
    },
    dateInput: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        fontSize: '13px',
    },
    filterActions: {
        display: 'flex',
        gap: '8px',
    },
    filterButton: {
        padding: '9px 16px',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '13px',
    },
    clearButton: {
        padding: '9px 16px',
        backgroundColor: '#64748b',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '13px',
    },
    tableWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflowX: 'auto',
        border: '1px solid #cbd5e1',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '13px',
    },
    tableHeaderRow: {
        backgroundColor: '#1e293b',
        color: '#ffffff',
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0',
    },
    th: {
        padding: '12px 14px',
    },
    thCenter: {
        padding: '12px 14px',
        textAlign: 'center',
    },
    td: {
        padding: '12px 14px',
        color: '#1e293b',
    },
    tdId: {
        padding: '12px 14px',
        fontWeight: 'bold',
        color: '#334155',
    },
    tdMuted: {
        padding: '12px 14px',
        color: '#475569',
    },
    tdFinal: {
        padding: '12px 14px',
        fontWeight: '500',
        color: '#1e293b',
    },
    tdCenter: {
        padding: '12px 14px',
        textAlign: 'center',
    },
    tableMessage: {
        textAlign: 'center',
        padding: '25px',
        color: '#64748b',
    },
    badge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold',
    },
    detailButton: {
        padding: '6px 12px',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '500px',
        borderRadius: '8px',
        padding: '25px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        position: 'relative',
    },
    modalTitle: {
        marginTop: 0,
        color: '#1e293b',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '10px',
    },
    modalBody: {
        fontSize: '14px',
        color: '#334155',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        margin: '15px 0',
    },
    divider: {
        border: '0',
        borderTop: '1px solid #e2e8f0',
        margin: '5px 0',
    },
    modalFooter: {
        textAlign: 'right',
        marginTop: '20px',
    },
    closeModalButton: {
        padding: '8px 16px',
        backgroundColor: '#64748b',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
};

export default HistorialCajaPage;