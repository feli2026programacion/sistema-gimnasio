import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

function AbrirCajaPage() {
    const navigate = useNavigate();
    const [cajaAbiertaExiste, setCajaAbiertaExiste] = useState(false);
    const [cargando, setCargando] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            montoInicial: '',
            observacion: '',
        },
    });

    useEffect(() => {
        let activa = true;

        const verificarCajaActiva = async () => {
            try {
                const q = query(collection(db, 'caja'), where('estado', '==', 'ABIERTA'));
                const querySnapshot = await getDocs(q);
                if (activa && !querySnapshot.empty) {
                    setCajaAbiertaExiste(true);
                }
            } catch (error) {
                console.error('Error al verificar estado de caja:', error);
            } finally {
                if (activa) {
                    setCargando(false);
                }
            }
        };

        verificarCajaActiva();

        return () => {
            activa = false;
        };
    }, []);

    const onSubmit = async (data) => {
        if (cajaAbiertaExiste) {
            alert('⚠ Ya existe una caja abierta en este momento. Debes cerrarla antes de abrir una nueva.');
            return;
        }

        const monto = parseFloat(data.montoInicial);
        if (isNaN(monto) || monto < 0) {
            alert('Por favor ingresa un monto inicial válido.');
            return;
        }

        try {
            const ahora = new Date();
            const usuarioActual = auth.currentUser ? auth.currentUser.email : 'Admin';

            await addDoc(collection(db, 'caja'), {
                userId: auth.currentUser ? auth.currentUser.uid : null,
                estado: 'ABIERTA',
                monto_inicial: monto,
                monto_final_esperado: monto,
                monto_final_real: null,
                diferencia: null,
                observaciones: data.observacion?.trim() || 'Sin observaciones',
                usuario: usuarioActual,
                fecha_apertura: ahora.toISOString(),
                fecha_apertura_formateada: ahora.toLocaleString('es-AR'),
            });

            reset();
            alert('¡Caja abierta exitosamente!');
            navigate('/Inicio');
        } catch (error) {
            console.error('Error al abrir la caja: ', error);
            alert('Ocurrió un error al intentar abrir la caja.');
        }
    };

    if (cargando) {
        return <div style={styles.loading}>Verificando estado de caja...</div>;
    }

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.card}>
                <div style={styles.header}>Apertura de Caja</div>

                {cajaAbiertaExiste ? (
                    <div style={styles.alertBox}>
                        <div style={styles.alertTitle}>
                            ⚠ ¡Atención! Ya hay una caja abierta actualmente.
                        </div>
                        <p style={styles.alertText}>
                            No puedes abrir otra caja hasta que realices el cierre de la caja actual.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/caja/cerrar')}
                            style={styles.primaryButton}
                        >
                            Ir a Cerrar Caja
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Monto Inicial (Fondo de Caja)</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.currencySymbol}>$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
                                    {...register('montoInicial', {
                                        required: 'El monto inicial es obligatorio',
                                        min: { value: 0, message: 'El monto no puede ser negativo' },
                                    })}
                                    style={styles.amountInput}
                                />
                            </div>
                            {errors.montoInicial && (
                                <p style={styles.errorText}>{errors.montoInicial.message}</p>
                            )}
                            <small style={styles.helperText}>
                                Ingresa el dinero en efectivo que dejas en caja como cambio inicial.
                            </small>
                        </div>

                        <div style={styles.textareaGroup}>
                            <label style={styles.label}>Observaciones (Opcional)</label>
                            <textarea
                                rows="3"
                                placeholder="Ej: Se inicia caja con cambio menudo..."
                                {...register('observacion', {
                                    maxLength: { value: 250, message: 'Máximo 250 caracteres' },
                                })}
                                style={styles.textarea}
                            />
                            {errors.observacion && (
                                <p style={styles.errorText}>{errors.observacion.message}</p>
                            )}
                        </div>

                        <div style={styles.actions}>
                            <button
                                type="button"
                                onClick={() => navigate('/Inicio')}
                                style={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                            <button type="submit" style={styles.submitButton}>
                                Abrir Caja
                            </button>
                        </div>
                    </form>
                )}
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
    pageWrapper: {
        padding: '30px',
        fontFamily: 'sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
    },
    card: {
        width: '100%',
        maxWidth: '550px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
    },
    header: {
        backgroundColor: '#2563eb',
        color: '#ffffff',
        padding: '16px 20px',
        fontWeight: 'bold',
        fontSize: '16px',
    },
    alertBox: {
        padding: '30px',
        textAlign: 'center',
    },
    alertTitle: {
        fontSize: '16px',
        color: '#dc2626',
        fontWeight: 'bold',
        marginBottom: '15px',
    },
    alertText: {
        color: '#475569',
        fontSize: '14px',
        marginBottom: '20px',
    },
    primaryButton: {
        padding: '10px 20px',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    form: {
        padding: '25px',
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
    inputWrapper: {
        position: 'relative',
    },
    currencySymbol: {
        position: 'absolute',
        left: '12px',
        top: '10px',
        color: '#64748b',
        fontWeight: 'bold',
    },
    amountInput: {
        width: '100%',
        padding: '10px 10px 10px 30px',
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
    helperText: {
        color: '#64748b',
        fontSize: '11px',
        marginTop: '4px',
        display: 'block',
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
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
    cancelButton: {
        padding: '10px 18px',
        backgroundColor: '#64748b',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
    },
    submitButton: {
        padding: '10px 18px',
        backgroundColor: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
    },
};

export default AbrirCajaPage;