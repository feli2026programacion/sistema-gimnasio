import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function RegistroPage() {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [mensajeEstado, setMensajeEstado] = useState('');
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            setMensajeEstado('Registrando usuario...');

            const userCredential = await createUserWithEmailAndPassword(auth, data.correo, data.password);
            const user = userCredential.user;

            await setDoc(doc(db, "usuarios", data.dni), {
                dni: data.dni,
                nombre: data.nombre,
                apellido: data.apellido,
                telefono: data.telefono,
                correo: data.correo,
                uid: user.uid
            });

            reset();
            setMensajeEstado('¡Cuenta creada con éxito! Redirigiendo...');
            setTimeout(() => {
                navigate('/');
            }, 1500);

        } catch (error) {
            console.error(error);
            setMensajeEstado('Error al registrar: ' + error.message);
        }
    };

    const esExito = mensajeEstado.includes('éxito');

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Crear Cuenta de Usuario</h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>DNI:</label>
                    <input
                        type="text"
                        {...register('dni', {
                            required: 'El DNI es obligatorio',
                            minLength: { value: 7, message: 'Mínimo 7 dígitos' },
                            maxLength: { value: 9, message: 'Máximo 9 dígitos' },
                            pattern: { value: /^[0-9]+$/, message: 'Solo se permiten números' }
                        })}
                        style={styles.input}
                    />
                    {errors.dni && <p style={styles.errorText}>{errors.dni.message}</p>}
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Nombre:</label>
                    <input
                        type="text"
                        {...register('nombre', { required: 'El nombre es obligatorio' })}
                        style={styles.input}
                    />
                    {errors.nombre && <p style={styles.errorText}>{errors.nombre.message}</p>}
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Apellido:</label>
                    <input
                        type="text"
                        {...register('apellido', { required: 'El apellido es obligatorio' })}
                        style={styles.input}
                    />
                    {errors.apellido && <p style={styles.errorText}>{errors.apellido.message}</p>}
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Teléfono:</label>
                    <input
                        type="tel"
                        {...register('telefono', {
                            required: 'El teléfono es obligatorio',
                            minLength: { value: 10, message: 'El teléfono debe tener exactamente 10 dígitos' },
                            maxLength: { value: 10, message: 'El teléfono debe tener exactamente 10 dígitos' },
                            pattern: { value: /^[0-9]{10}$/, message: 'Ingresa solo 10 números' }
                        })}
                        style={styles.input}
                    />
                    {errors.telefono && <p style={styles.errorText}>{errors.telefono.message}</p>}
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Correo:</label>
                    <input
                        type="email"
                        {...register('correo', {
                            required: 'El correo es obligatorio',
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Ingresa un correo válido'
                            }
                        })}
                        style={styles.input}
                    />
                    {errors.correo && <p style={styles.errorText}>{errors.correo.message}</p>}
                </div>

                <div style={styles.inputGroupLast}>
                    <label style={styles.label}>Contraseña:</label>
                    <input
                        type="password"
                        {...register('password', {
                            required: 'La contraseña es obligatoria',
                            minLength: { value: 8, message: 'Mínimo 8 caracteres' }
                        })}
                        style={styles.input}
                    />
                    {errors.password && <p style={styles.errorText}>{errors.password.message}</p>}
                </div>

                <button type="submit" style={styles.submitButton}>
                    Registrarse
                </button>
            </form>

            <div style={styles.footerContainer}>
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    style={styles.linkButton}
                >
                    Volver al Iniciar Sesión
                </button>
            </div>

            {mensajeEstado && (
                <p style={{
                    ...styles.statusText,
                    color: esExito ? 'green' : 'red'
                }}>
                    {mensajeEstado}
                </p>
            )}
        </div>
    );
}

// ==========================================
// ESTILOS DEL COMPONENTE
// ==========================================
const styles = {
    container: {
        maxWidth: '400px',
        margin: '30px auto',
        fontFamily: 'sans-serif',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px'
    },
    title: {
        marginTop: 0,
        color: '#1e293b'
    },
    inputGroup: {
        marginBottom: '12px'
    },
    inputGroupLast: {
        marginBottom: '15px'
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '4px',
        color: '#334155'
    },
    input: {
        width: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #eff1f3'
    },
    errorText: {
        color: 'red',
        fontSize: '12px',
        margin: '4px 0 0 0'
    },
    submitButton: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px'
    },
    footerContainer: {
        marginTop: '15px',
        textAlign: 'center'
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#2563eb',
        cursor: 'pointer',
        textDecoration: 'underline',
        fontSize: '14px'
    },
    statusText: {
        marginTop: '10px',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: '14px'
    }
};

export default RegistroPage;