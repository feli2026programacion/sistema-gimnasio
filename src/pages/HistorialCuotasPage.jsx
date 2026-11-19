import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function HistorialCuotasPage() {
    const navigate = useNavigate();
    const [cuotas, setCuotas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Filtros
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [formaPagoFiltro, setFormaPagoFiltro] = useState('');

    useEffect(() => {
        let activa = true;

        const obtenerCuotas = async () => {
            try {
                if (activa) setCargando(true);
                const snapshot = await getDocs(collection(db, 'cuotas'));
                if (!activa) return;

                const lista = snapshot.docs.map((documento) => ({
                    id: documento.id,
                    ...documento.data(),
                }));
                lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                setCuotas(lista);
            } catch (error) {
                console.error('Error al obtener historial: ', error);
            } finally {
                if (activa) setCargando(false);
            }
        };

        obtenerCuotas();

        return () => {
            activa = false;
        };
    }, []);

    const cuotasFiltradas = cuotas.filter((c) => {
        if (fechaDesde && c.fecha < fechaDesde) return false;
        if (fechaHasta && c.fecha > fechaHasta) return false;
        if (formaPagoFiltro && c.tipo_de_pago !== formaPagoFiltro) return false;
        return true;
    });

    const limpiarFiltros = () => {
        setFechaDesde('');
        setFechaHasta('');
        setFormaPagoFiltro('');
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Historial de Cuotas Cobradas</h2>
                    <p style={styles.subtitle}>
                        Control de ingresos, pagos de abonos y formas de cobro.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/RegistrarCuotasPage')}
                    style={styles.newButton}
                >
                    + Registrar Nueva Cuota
                </button>
            </div>

            {/* Filtros */}
            <div style={styles.filterPanel}>
                <h4 style={styles.filterTitle}>Filtros de Búsqueda</h4>
                <div style={styles.filterGrid}>
                    <div>
                        <label style={styles.filterLabel}>Fecha Desde:</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            style={styles.dateInput}
                        />
                    </div>
                    <div>
                        <label style={styles.filterLabel}>Fecha Hasta:</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            style={styles.dateInput}
                        />
                    </div>
                    <div>
                        <label style={styles.filterLabel}>Forma de Pago:</label>
                        <select
                            value={formaPagoFiltro}
                            onChange={(e) => setFormaPagoFiltro(e.target.value)}
                            style={styles.selectInput}
                        >
                            <option value="">-- Todas las formas de pago --</option>
                            <option value="EFECTIVO">EFECTIVO</option>
                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                            <option value="TARJETA">TARJETA</option>
                        </select>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            style={styles.clearButton}
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.th}>Fecha</th>
                            <th style={styles.th}>Cliente</th>
                            <th style={styles.th}>Plan</th>
                            <th style={styles.th}>Monto</th>
                            <th style={styles.th}>Forma de Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="5" style={styles.tableMessage}>
                                    Cargando historial...
                                </td>
                            </tr>
                        ) : cuotasFiltradas.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={styles.tableMessage}>
                                    No se encontraron cuotas registradas.
                                </td>
                            </tr>
                        ) : (
                            cuotasFiltradas.map((cuota, index) => (
                                <tr
                                    key={cuota.id}
                                    style={{
                                        ...styles.tableRow,
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                    }}
                                >
                                    <td style={styles.td}>{cuota.fecha}</td>
                                    <td style={styles.tdCliente}>{cuota.nombre_cliente}</td>
                                    <td style={styles.tdPlan}>{cuota.nombre_plan}</td>
                                    <td style={styles.tdMonto}>
                                        ${Number(cuota.monto_abonado || 0).toLocaleString('es-AR', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>{cuota.tipo_de_pago}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
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
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    title: {
        margin: 0,
        color: '#1e293b',
    },
    subtitle: {
        margin: '5px 0 0 0',
        color: '#64748b',
        fontSize: '14px',
    },
    newButton: {
        backgroundColor: '#16a34a',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    filterPanel: {
        backgroundColor: '#1e293b',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '25px',
        color: '#fff',
    },
    filterTitle: {
        margin: '0 0 15px 0',
        fontSize: '15px',
    },
    filterGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        alignItems: 'end',
    },
    filterLabel: {
        display: 'block',
        fontSize: '12px',
        marginBottom: '5px',
    },
    dateInput: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: 'none',
        boxSizing: 'border-box',
    },
    selectInput: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: 'none',
    },
    clearButton: {
        backgroundColor: '#64748b',
        color: '#fff',
        border: 'none',
        padding: '9px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        width: '100%',
    },
    tableWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '14px',
    },
    tableHeaderRow: {
        backgroundColor: '#1e293b',
        color: '#ffffff',
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0',
    },
    th: {
        padding: '12px 16px',
    },
    td: {
        padding: '12px 16px',
    },
    tdCliente: {
        padding: '12px 16px',
        fontWeight: '500',
    },
    tdPlan: {
        padding: '12px 16px',
        color: '#0f766e',
    },
    tdMonto: {
        padding: '12px 16px',
        fontWeight: 'bold',
        color: '#16a34a',
    },
    tableMessage: {
        textAlign: 'center',
        padding: '20px',
    },
    badge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold',
        backgroundColor: '#e0f2fe',
        color: '#0369a1',
    },
};

export default HistorialCuotasPage;