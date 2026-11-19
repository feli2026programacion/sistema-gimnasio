import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

function CerrarCajaPage() {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(true);
    const [cajaActiva, setCajaActiva] = useState(null);
    const [cajaId, setCajaId] = useState(null);

    const [totalEfectivo, setTotalEfectivo] = useState(0);
    const [totalTransferencia, setTotalTransferencia] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            montoRealContado: '',
            observacion: '',
        },
    });

    const montoRealWatch = watch('montoRealContado');

    useEffect(() => {
        let activa = true;

        const obtenerDatosCierre = async () => {
            try {
                const qCaja = query(collection(db, 'caja'), where('estado', '==', 'ABIERTA'));
                const snapshotCaja = await getDocs(qCaja);

                if (!activa) return;

                if (snapshotCaja.empty) {
                    setCargando(false);
                    return;
                }

                const docCaja = snapshotCaja.docs[0];
                const datosCaja = docCaja.data();
                setCajaId(docCaja.id);
                setCajaActiva(datosCaja);

                const snapshotCuotas = await getDocs(collection(db, 'cuotas'));
                if (!activa) return;

                const listaCuotas = snapshotCuotas.docs.map((item) => item.data());

                let sumaEfectivo = 0;
                let sumaTransferencia = 0;

                const fechaApertura = new Date(datosCaja.fecha_apertura);

                listaCuotas.forEach((cuota) => {
                    const fechaCuota = new Date(cuota.fecha_hora_registro || cuota.fecha);
                    if (fechaCuota >= fechaApertura) {
                        const monto = parseFloat(cuota.monto_abonado || 0);
                        const tipoPago = (cuota.tipo_de_pago || 'EFECTIVO').toUpperCase();

                        if (tipoPago.includes('TRANSFERENCIA')) {
                            sumaTransferencia += monto;
                        } else {
                            sumaEfectivo += monto;
                        }
                    }
                });

                setTotalEfectivo(sumaEfectivo);
                setTotalTransferencia(sumaTransferencia);
            } catch (error) {
                console.error('Error al calcular el cierre de caja:', error);
            } finally {
                if (activa) {
                    setCargando(false);
                }
            }
        };

        obtenerDatosCierre();

        return () => {
            activa = false;
        };
    }, []);

    const onSubmit = async (data) => {
        const realContado = parseFloat(data.montoRealContado);

        if (isNaN(realContado) || realContado < 0) {
            alert('Por favor ingresa un monto real contado válido.');
            return;
        }

        const montoInicial = parseFloat(cajaActiva.monto_inicial || 0);
        const montoEsperado = montoInicial + totalEfectivo;
        const diferencia = realContado - montoEsperado;

        try {
            const ahora = new Date();
            const docRef = doc(db, 'caja', cajaId);

            await updateDoc(docRef, {
                estado: 'CERRADA',
                monto_recaudado_efectivo: totalEfectivo,
                monto_recaudado_transferencia: totalTransferencia,
                monto_final_esperado: montoEsperado,
                monto_final_real: realContado,
                diferencia: diferencia,
                fecha_cierre: ahora.toISOString(),
                fecha_cierre_formateada: ahora.toLocaleString('es-AR'),
                observaciones_cierre: data.observacion?.trim() || 'Cierre de caja normal',
            });

            reset();
            alert(`¡Caja cerrada con éxito!\nDiferencia: $${diferencia.toFixed(2)}`);
            navigate('/Inicio');
        } catch (error) {
            console.error('Error al cerrar la caja: ', error);
            alert('Ocurrió un error al guardar el cierre de caja.');
        }
    };

    if (cargando) {
        return <div style={styles.loading}>Cargando datos de cierre...</div>;
    }

    if (!cajaActiva) {
        return (
            <div style={styles.emptyContainer}>
                <h3 style={styles.emptyTitle}>⚠ No hay ninguna caja abierta en este momento.</h3>
                <p style={styles.emptyText}>Debes abrir una caja antes de poder realizar el cierre.</p>
                <button
                    type="button"
                    onClick={() => navigate('/caja/abrir')}
                    style={styles.goOpenButton}
                >
                    Ir a Abrir Caja
                </button>
            </div>
        );
    }

    const montoInicial = parseFloat(cajaActiva.monto_inicial || 0);
    const totalRecaudadoGeneral = totalEfectivo + totalTransferencia;
    const montoEsperado = montoInicial + totalEfectivo;
    const realContadoNum = parseFloat(montoRealWatch || 0);
    const diferenciaCalculada = realContadoNum - montoEsperado;

    const colorDiferencia =
        diferenciaCalculada === 0
            ? '#16a34a'
            : diferenciaCalculada > 0
                ? '#2563eb'
                : '#dc2626';

    const textoDiferencia =
        diferenciaCalculada === 0
            ? '✓ Caja exacta (Sin diferencias)'
            : diferenciaCalculada > 0
                ? `+ Sobrante de: $${diferenciaCalculada.toFixed(2)}`
                : `⚠ Faltante de: $${Math.abs(diferenciaCalculada).toFixed(2)}`;

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.card}>
                <div style={styles.header}>Cierre de Caja - Turno Actual</div>

                <div style={styles.body}>
                    <div style={styles.infoBox}>
                        <div style={styles.infoRow}>
                            <strong>Usuario:</strong> {cajaActiva.usuario || 'Administrador'}
                        </div>
                        <div style={styles.infoRow}>
                            <strong>Apertura:</strong> {cajaActiva.fecha_apertura_formateada || 'N/A'}
                        </div>
                        <div>
                            <strong>Monto Inicial (Fondo):</strong> $
                            {montoInicial.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div style={styles.breakdownBox}>
                        <strong style={styles.breakdownTitle}>Desglose de Cobros:</strong>
                        <div style={styles.breakdownRow}>
                            💵 Efectivo:{' '}
                            <span style={styles.efectivoValue}>
                                ${totalEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div style={styles.breakdownRowLast}>
                            💳 Transferencia:{' '}
                            <span style={styles.transferenciaValue}>
                                ${totalTransferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div style={styles.totalRow}>
                            Total Recaudado General: $
                            {totalRecaudadoGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div style={styles.expectedBox}>
                        <div style={styles.expectedTitle}>
                            Monto Esperado en Caja: $
                            {montoEsperado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        <small style={styles.expectedHint}>
                            (Fondo inicial + Cobros en efectivo)
                        </small>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Monto Real Contado en Efectivo ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Ej: 28500.00"
                                onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
                                {...register('montoRealContado', {
                                    required: 'El monto real contado es obligatorio',
                                    min: { value: 0, message: 'El monto no puede ser negativo' },
                                })}
                                style={styles.input}
                            />
                            {errors.montoRealContado && (
                                <p style={styles.errorText}>{errors.montoRealContado.message}</p>
                            )}
                            {montoRealWatch !== '' && montoRealWatch !== undefined && (
                                <div style={{ ...styles.diffText, color: colorDiferencia }}>
                                    {textoDiferencia}
                                </div>
                            )}
                        </div>

                        <div style={styles.textareaGroup}>
                            <label style={styles.label}>Observaciones (Opcional)</label>
                            <textarea
                                rows="3"
                                placeholder="Detalle si hubo sobrantes, faltantes o notas..."
                                {...register('observacion', {
                                    maxLength: { value: 250, message: 'Máximo 250 caracteres' },
                                })}
                                style={styles.textarea}
                            />
                            {errors.observacion && (
                                <p style={styles.errorText}>{errors.observacion.message}</p>
                            )}
                        </div>

                        <button type="submit" style={styles.submitButton}>
                            Confirmar Cierre de Caja
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// ESTILOS DEL COMPONENTE
// ==========================================
const styles = {
    loading: {
        padding: '40px',
        fontFamily: 'sans-serif',
    },
    emptyContainer: {
        padding: '40px',
        fontFamily: 'sans-serif',
        textAlign: 'center',
    },
    emptyTitle: {
        color: '#dc2626',
    },
    emptyText: {
        color: '#64748b',
    },
    goOpenButton: {
        padding: '10px 20px',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
    },
    pageWrapper: {
        padding: '30px',
        fontFamily: 'sans-serif',
        display: 'flex',
        justifyContent: 'center',
    },
    card: {
        width: '100%',
        maxWidth: '650px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
    },
    header: {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        padding: '16px 20px',
        fontWeight: 'bold',
        fontSize: '16px',
    },
    body: {
        padding: '25px',
    },
    infoBox: {
        fontSize: '14px',
        color: '#334155',
        marginBottom: '15px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '12px',
    },
    infoRow: {
        marginBottom: '6px',
    },
    breakdownBox: {
        marginBottom: '20px',
        backgroundColor: '#f8fafc',
        padding: '15px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
    },
    breakdownTitle: {
        fontSize: '14px',
        color: '#1e293b',
        display: 'block',
        marginBottom: '8px',
    },
    breakdownRow: {
        fontSize: '14px',
        color: '#334155',
        marginBottom: '5px',
    },
    breakdownRowLast: {
        fontSize: '14px',
        color: '#334155',
        marginBottom: '10px',
    },
    efectivoValue: {
        fontWeight: 'bold',
        color: '#16a34a',
    },
    transferenciaValue: {
        fontWeight: 'bold',
        color: '#2563eb',
    },
    totalRow: {
        borderTop: '1px solid #cbd5e1',
        paddingTop: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#1e293b',
    },
    expectedBox: {
        marginBottom: '20px',
    },
    expectedTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: '4px',
    },
    expectedHint: {
        color: '#64748b',
        fontSize: '12px',
    },
    inputGroup: {
        marginBottom: '20px',
    },
    textareaGroup: {
        marginBottom: '25px',
    },
    label: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#1e293b',
        display: 'block',
        marginBottom: '6px',
    },
    input: {
        width: '100%',
        padding: '10px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        fontSize: '14px',
    },
    errorText: {
        color: 'red',
        fontSize: '12px',
        margin: '4px 0 0 0',
    },
    diffText: {
        marginTop: '6px',
        fontSize: '13px',
        fontWeight: 'bold',
    },
    textarea: {
        width: '100%',
        padding: '10px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        fontFamily: 'sans-serif',
        fontSize: '14px',
    },
    submitButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#dc2626',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '15px',
    },
};

export default CerrarCajaPage;