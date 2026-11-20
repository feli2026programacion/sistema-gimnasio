import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);

    // Estados para controlar el modal (crear vs. editar)
    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);

    // React Hook Form para gestionar campos, validaciones y errores
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const obtenerClientes = async () => {
        try {
            setCargando(true);
            const querySnapshot = await getDocs(collection(db, 'clientes'));
            const listaClientes = querySnapshot.docs.map((documento) => ({
                id: documento.id,
                ...documento.data(),
            }));
            setClientes(listaClientes);
        } catch (error) {
            console.error('Error al obtener clientes: ', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activa = true;

        const cargar = async () => {
            if (!activa) return;
            await obtenerClientes();
        };

        cargar();

        return () => {
            activa = false;
        };
    }, []);

    const onSubmit = async (data) => {
        try {
            const dniLimpio = String(data.dni).trim();
            const emergenciaLimpia = String(data.emergencia || '').trim();

            const clienteData = {
                dni: dniLimpio,
                nombre: data.nombre.trim(),
                apellido: data.apellido.trim(),
                telefono: String(data.telefono).trim(),
                correo: data.correo.trim(),
                emergencia: emergenciaLimpia || 'No registrado',
            };

            // Solo en inscripción nueva se inicializan estado y clases/vencimiento
            if (!modoEdicion) {
                clienteData.estado = 'Inactivo';
                clienteData.clases_disponibles = null;
                clienteData.tiene_limite_clases = false;
                clienteData.fecha_vencimiento = null;
            }

            await setDoc(doc(db, 'clientes', dniLimpio), clienteData, { merge: true });

            cerrarModal();
            obtenerClientes();
        } catch (error) {
            console.error('Error al guardar cliente: ', error);
        }
    };

    const abrirModalNuevo = () => {
        reset({
            dni: '',
            nombre: '',
            apellido: '',
            telefono: '',
            correo: '',
            emergencia: '',
        });
        setModoEdicion(false);
        setMostrarModal(true);
    };

    const abrirModalEditar = (cliente) => {
        reset({
            dni: cliente.dni || '',
            nombre: cliente.nombre || '',
            apellido: cliente.apellido || '',
            telefono: cliente.telefono || '',
            correo: cliente.correo || '',
            emergencia: cliente.emergencia === 'No registrado' ? '' : (cliente.emergencia || ''),
        });
        setModoEdicion(true);
        setMostrarModal(true);
    };

    const cerrarModal = () => {
        reset();
        setMostrarModal(false);
    };

    // Eliminar socio
    const handleEliminar = async (dniCliente) => {
        if (!window.confirm(`¿Estás seguro de eliminar al cliente con DNI ${dniCliente}?`)) return;

        try {
            await deleteDoc(doc(db, 'clientes', String(dniCliente)));
            setClientes((prev) => prev.filter((c) => c.dni !== dniCliente));
        } catch (error) {
            console.error('Error al eliminar: ', error);
        }
    };

    // Filtrar por DNI o Nombre completo
    const clientesFiltrados = clientes.filter((c) => {
        const textoBusqueda = busqueda.toLowerCase();
        const dniStr = String(c.dni || '').toLowerCase();
        const nombreCompleto = `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase();
        return dniStr.includes(textoBusqueda) || nombreCompleto.includes(textoBusqueda);
    });

    return (
        <div style={styles.container}>
            {/* Cabecera */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Gestión de Clientes</h2>
                    <p style={styles.subtitle}>
                        Administra las altas, modificaciones y estado de los socios.
                    </p>
                </div>
                <button type="button" onClick={abrirModalNuevo} style={styles.newButton}>
                    + Inscribir Cliente
                </button>
            </div>

            {/* Barra de Búsqueda */}
            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="🔍 Buscar cliente por nombre o DNI..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {/* Tabla de Clientes */}
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.th}>DNI</th>
                            <th style={styles.th}>Nombre completo</th>
                            <th style={styles.th}>Teléfono</th>
                            <th style={styles.th}>Estado</th>
                            <th style={styles.th}>Clases / Vencimiento</th>
                            <th style={styles.thCenter}>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="6" style={styles.tableMessage}>Cargando socios...</td>
                            </tr>
                        ) : clientesFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={styles.tableMessage}>
                                    No hay clientes registrados en el gimnasio.
                                </td>
                            </tr>
                        ) : (
                            clientesFiltrados.map((cliente, index) => {
                                const estado = cliente.estado || 'Inactivo';
                                const isActivo = estado === 'Activo';

                                let detallePlan = '-';
                                if (isActivo) {
                                    if (typeof cliente.clases_disponibles === 'number') {
                                        detallePlan = ` ${cliente.clases_disponibles} ${
                                            cliente.clases_disponibles === 1 ? 'clase restante' : 'clases restantes'
                                        }`;
                                    } else if (cliente.fecha_vencimiento) {
                                        detallePlan = ` Vence: ${cliente.fecha_vencimiento}`;
                                    } else {
                                        detallePlan = '🟢 Activo (Sin límite)';
                                    }
                                } else {
                                    detallePlan = '🔴 Sin cuota activa';
                                }

                                return (
                                    <tr
                                        key={cliente.id}
                                        style={{
                                            ...styles.tableRow,
                                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                        }}
                                    >
                                        <td style={styles.tdDni}>{cliente.dni} 📄</td>
                                        <td style={styles.td}>
                                            {cliente.nombre} {cliente.apellido}
                                        </td>
                                        <td style={styles.tdMuted}>{cliente.telefono || '-'}</td>
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.badge,
                                                    backgroundColor: isActivo ? '#dcfce7' : '#fee2e2',
                                                    color: isActivo ? '#166534' : '#991b1b',
                                                }}
                                            >
                                                {estado}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                ...styles.tdPlan,
                                                color: isActivo ? '#0f766e' : '#94a3b8',
                                            }}
                                        >
                                            {detallePlan}
                                        </td>
                                        <td style={styles.tdCenter}>
                                            {/* El estado se gestiona automáticamente por cuota, vencimiento o clases */}
                                            <div style={styles.actionButtonsContainer}>
                                                <button
                                                    type="button"
                                                    style={styles.editButton}
                                                    onClick={() => abrirModalEditar(cliente)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    style={styles.deleteButton}
                                                    onClick={() => handleEliminar(cliente.dni)}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal para Inscribir o Editar el Cliente */}
            {mostrarModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>
                            {modoEdicion ? 'Editar Cliente' : 'Inscribir Nuevo Socio'}
                        </h3>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>DNI:</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={9}
                                    disabled={modoEdicion}
                                    placeholder="Ej: 40123456"
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
                                    }}
                                    {...register('dni', {
                                        required: 'El DNI es obligatorio',
                                        minLength: { value: 7, message: 'Mínimo 7 dígitos' },
                                        maxLength: { value: 9, message: 'Máximo 9 dígitos' },
                                        pattern: {
                                            value: /^[0-9]{7,9}$/,
                                            message: 'Solo números (entre 7 y 9 dígitos)',
                                        },
                                    })}
                                    style={modoEdicion ? styles.inputDisabled : styles.input}
                                />
                                {errors.dni && <p style={styles.errorText}>{errors.dni.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nombre:</label>
                                <input
                                    type="text"
                                    maxLength={20}
                                    placeholder="Ej: Juan"
                                    onInput={(e) => {
                                        e.target.value = e.target.value
                                            .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
                                            .slice(0, 20);
                                    }}
                                    {...register('nombre', {
                                        required: 'El nombre es obligatorio',
                                        minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                                        maxLength: { value: 20, message: 'Máximo 20 caracteres' },
                                        pattern: {
                                            value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                                            message: 'Solo se permiten letras',
                                        },
                                    })}
                                    style={styles.input}
                                />
                                {errors.nombre && <p style={styles.errorText}>{errors.nombre.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Apellido:</label>
                                <input
                                    type="text"
                                    maxLength={20}
                                    placeholder="Ej: Pérez"
                                    onInput={(e) => {
                                        e.target.value = e.target.value
                                            .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
                                            .slice(0, 20);
                                    }}
                                    {...register('apellido', {
                                        required: 'El apellido es obligatorio',
                                        minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                                        maxLength: { value: 20, message: 'Máximo 20 caracteres' },
                                        pattern: {
                                            value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                                            message: 'Solo se permiten letras',
                                        },
                                    })}
                                    style={styles.input}
                                />
                                {errors.apellido && <p style={styles.errorText}>{errors.apellido.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Teléfono:</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="Ej: 3874123456"
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    }}
                                    {...register('telefono', {
                                        required: 'El teléfono es obligatorio',
                                        maxLength: { value: 10, message: 'Máximo 10 dígitos' },
                                        pattern: {
                                            value: /^[0-9]{10}$/,
                                            message: 'Debe tener 10 dígitos numéricos',
                                        },
                                    })}
                                    style={styles.input}
                                />
                                {errors.telefono && <p style={styles.errorText}>{errors.telefono.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Correo:</label>
                                <input
                                    type="email"
                                    maxLength={60}
                                    placeholder="Ej: socio@correo.com"
                                    {...register('correo', {
                                        required: 'El correo es obligatorio',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Ingresa un correo válido',
                                        },
                                    })}
                                    style={styles.input}
                                />
                                {errors.correo && <p style={styles.errorText}>{errors.correo.message}</p>}
                            </div>

                            <div style={styles.inputGroupLast}>
                                <label style={styles.label}>Teléfono de Emergencia:</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="Ej: 3876543210"
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    }}
                                    {...register('emergencia', {
                                        maxLength: { value: 10, message: 'Máximo 10 dígitos' },
                                        pattern: {
                                            value: /^([0-9]{10})?$/,
                                            message: 'Si lo completas, debe tener 10 dígitos numéricos',
                                        },
                                    })}
                                    style={styles.input}
                                />
                                {errors.emergencia && (
                                    <p style={styles.errorText}>{errors.emergencia.message}</p>
                                )}
                            </div>

                            <div style={styles.modalButtonsContainer}>
                                <button type="button" onClick={cerrarModal} style={styles.cancelButton}>
                                    Cancelar
                                </button>
                                <button type="submit" style={styles.saveButton}>
                                    {modoEdicion ? 'Guardar Cambios' : 'Registrar Socio'}
                                </button>
                            </div>
                        </form>
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
        backgroundColor: '#f4f6f8',
        minHeight: '100vh',
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
        backgroundColor: '#dc2626',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    searchContainer: {
        marginBottom: '20px',
    },
    searchInput: {
        width: '100%',
        maxWidth: '350px',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        outline: 'none',
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
    thCenter: {
        padding: '12px 16px',
        textAlign: 'center',
    },
    td: {
        padding: '12px 16px',
    },
    tdDni: {
        padding: '12px 16px',
        fontWeight: '500',
    },
    tdMuted: {
        padding: '12px 16px',
        color: '#475569',
    },
    tdPlan: {
        padding: '12px 16px',
        fontWeight: '500',
    },
    tdCenter: {
        padding: '12px 16px',
        textAlign: 'center',
    },
    tableMessage: {
        textAlign: 'center',
        padding: '20px',
        color: '#64748b',
    },
    badge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    actionButtonsContainer: {
        display: 'flex',
        gap: '6px',
        justifyContent: 'center',
    },
    editButton: {
        backgroundColor: '#eab308',
        color: '#000',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#dc2626',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
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
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '8px',
        width: '400px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    modalTitle: {
        marginTop: 0,
        color: '#1e293b',
    },
    inputGroup: {
        marginBottom: '10px',
    },
    inputGroupLast: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '4px',
        color: '#334155',
    },
    input: {
        width: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
    },
    inputDisabled: {
        width: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#e2e8f0',
        color: '#475569',
        fontWeight: 'bold',
    },
    errorText: {
        color: 'red',
        fontSize: '12px',
        margin: '4px 0 0 0',
    },
    modalButtonsContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
    cancelButton: {
        padding: '8px 12px',
        background: '#cbd5e1',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    saveButton: {
        padding: '8px 12px',
        background: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

export default ClientesPage;