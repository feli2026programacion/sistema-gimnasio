import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db, auth } from '../firebase'; // Instancia de Firestore (base de datos) y Auth (autenticación)
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'; // Funciones CRUD en Firestore

function PlanesPage() {
    const [planes, setPlanes] = useState([]); // Lista compartida de planes cargados desde Firestore
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

    // Consulta a Firestore trayendo todos los planes compartidos entre usuarios autenticados
    const obtenerPlanes = async () => {
        try {
            setCargando(true);

            // Si no hay sesión activa, no realiza consulta
            if (!auth.currentUser) {
                setPlanes([]);
                return;
            }

            const querySnapshot = await getDocs(collection(db, 'planes'));
            const listaPlanes = querySnapshot.docs.map(documento => ({
                id: documento.id,
                ...documento.data()
            }));

            // Ordena los planes de menor a mayor según su ID numérico
            listaPlanes.sort((a, b) => Number(a.id_planes) - Number(b.id_planes));
            setPlanes(listaPlanes);
        } catch (error) {
            console.error('Error al obtener planes: ', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let activa = true;

        const cargar = async () => {
            if (!activa) return;
            await obtenerPlanes();
        };

        cargar();

        return () => {
            activa = false;
        };
    }, []);

    const onSubmit = async (data) => {
        try {
            const planData = {
                id_planes: Number(data.id_planes),
                nombre_plan: data.nombre_plan.trim(),
                precio: parseFloat(data.precio),
                duracion: Number(data.duracion),
                cantidad_de_clases: Number(data.cantidad_de_clases)
            };

            await setDoc(doc(db, 'planes', String(data.id_planes)), planData, { merge: true });

            cerrarModal();
            obtenerPlanes(); // Refresca la lista compartida desde Firestore
        } catch (error) {
            console.error('Error al guardar el plan: ', error);
        }
    };

    // Prepara el formulario para crear un plan consultando el último ID en Firestore
    const abrirModalNuevo = async () => {
        reset();
        let maxId = planes.length > 0
            ? Math.max(...planes.map(p => Number(p.id_planes) || 0))
            : 0;

        try {
            const snapshotActual = await getDocs(collection(db, 'planes'));
            if (!snapshotActual.empty) {
                const maxRemoto = Math.max(
                    ...snapshotActual.docs.map(d => Number(d.data().id_planes ?? d.id) || 0)
                );
                maxId = Math.max(maxId, maxRemoto);
            }
        } catch (error) {
            console.error('Error al calcular el próximo ID de plan: ', error);
        }

        setValue('id_planes', maxId + 1);
        setModoEdicion(false);
        setMostrarModal(true);
    };

    // Prepara el formulario cargando los datos del plan seleccionado para editarlo
    const abrirModalEditar = (plan) => {
        setValue('id_planes', plan.id_planes);
        setValue('nombre_plan', plan.nombre_plan);
        setValue('precio', plan.precio);
        setValue('duracion', plan.duracion);
        setValue('cantidad_de_clases', plan.cantidad_de_clases);
        setModoEdicion(true);
        setMostrarModal(true);
    };

    // Resetea el formulario y oculta el modal
    const cerrarModal = () => {
        reset();
        setMostrarModal(false);
    };

    // Elimina un plan de Firestore y actualiza el estado usando el valor previo (prev)
    const handleEliminar = async (id) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el plan #${id}?`)) return;

        try {
            await deleteDoc(doc(db, 'planes', String(id)));
            setPlanes(prev => prev.filter(p => String(p.id_planes) !== String(id)));
        } catch (error) {
            console.error('Error al eliminar el plan: ', error);
        }
    };

    // Filtra la lista en memoria según lo escrito en la barra de búsqueda (por ID o nombre)
    const planesFiltrados = planes.filter(p => {
        const texto = busqueda.toLowerCase();
        const idStr = String(p.id_planes || '').toLowerCase();
        const nombreStr = String(p.nombre_plan || '').toLowerCase();
        return idStr.includes(texto) || nombreStr.includes(texto);
    });

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Gestión de Planes</h2>
                    <p style={styles.subtitle}>
                        Administra los abonos, tarifas, duración y cantidad de clases disponibles.
                    </p>
                </div>
                <button type="button" onClick={abrirModalNuevo} style={styles.newButton}>
                    + Nuevo Plan
                </button>
            </div>

            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="🔍 Buscar plan por nombre o ID..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.th}>ID Plan</th>
                            <th style={styles.th}>Nombre del Plan</th>
                            <th style={styles.th}>Precio</th>
                            <th style={styles.th}>Duración (Días)</th>
                            <th style={styles.th}>Cantidad de Clases</th>
                            <th style={styles.thCenter}>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="6" style={styles.tableMessage}>Cargando planes...</td>
                            </tr>
                        ) : planesFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={styles.tableMessage}>No hay planes registrados.</td>
                            </tr>
                        ) : (
                            planesFiltrados.map((plan, index) => (
                                <tr
                                    key={plan.id}
                                    style={{
                                        ...styles.tableRow,
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                                    }}
                                >
                                    <td style={styles.tdId}>#{plan.id_planes}</td>
                                    <td style={styles.tdNombre}>{plan.nombre_plan}</td>
                                    <td style={styles.tdPrecio}>
                                        ${Number(plan.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={styles.tdMuted}>{plan.duracion} días</td>
                                    <td style={styles.tdMuted}>{plan.cantidad_de_clases} clases</td>
                                    <td style={styles.tdCenter}>
                                        <div style={styles.actionButtonsContainer}>
                                            <button
                                                type="button"
                                                style={styles.editButton}
                                                onClick={() => abrirModalEditar(plan)}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.deleteButton}
                                                onClick={() => handleEliminar(plan.id_planes)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {mostrarModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>
                            {modoEdicion ? 'Editar Plan' : 'Crear Nuevo Plan'}
                        </h3>

                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>ID del Plan (Automático):</label>
                                <input
                                    type="number"
                                    disabled
                                    {...register('id_planes')}
                                    style={styles.inputDisabled}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Nombre del Plan:</label>
                                <input
                                    type="text"
                                    {...register('nombre_plan', {
                                        required: 'El nombre es obligatorio',
                                        maxLength: { value: 30, message: 'Máximo 30 caracteres' }
                                    })}
                                    maxLength={30}
                                    placeholder="Ej: Pase Libre Mensual"
                                    style={styles.input}
                                />
                                {errors.nombre_plan && <p style={styles.errorText}>{errors.nombre_plan.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Precio ($):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('precio', {
                                        required: 'El precio es obligatorio',
                                        min: { value: 0.01, message: 'Debe ser mayor a 0' }
                                    })}
                                    onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
                                    placeholder="Ej: 25000.00"
                                    style={styles.input}
                                />
                                {errors.precio && <p style={styles.errorText}>{errors.precio.message}</p>}
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Duración (en días):</label>
                                <input
                                    type="number"
                                    {...register('duracion', {
                                        required: 'La duración es obligatoria',
                                        min: { value: 1, message: 'Mínimo 1 día' }
                                    })}
                                    onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
                                    placeholder="Ej: 30"
                                    style={styles.input}
                                />
                                {errors.duracion && <p style={styles.errorText}>{errors.duracion.message}</p>}
                            </div>

                            <div style={styles.inputGroupLast}>
                                <label style={styles.label}>Cantidad de Clases:</label>
                                <input
                                    type="number"
                                    {...register('cantidad_de_clases', {
                                        required: 'La cantidad de clases es obligatoria',
                                        min: { value: 1, message: 'Mínimo 1 clase' }
                                    })}
                                    onKeyDown={(e) => (e.key === '-' || e.key === 'e') && e.preventDefault()}
                                    placeholder="Ej: 12"
                                    style={styles.input}
                                />
                                {errors.cantidad_de_clases && <p style={styles.errorText}>{errors.cantidad_de_clases.message}</p>}
                            </div>

                            <div style={styles.modalButtonsContainer}>
                                <button type="button" onClick={cerrarModal} style={styles.cancelButton}>
                                    Cancelar
                                </button>
                                <button type="submit" style={styles.saveButton}>
                                    {modoEdicion ? 'Guardar Cambios' : 'Crear Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: '30px',
        fontFamily: 'sans-serif',
        backgroundColor: '#f4f6f8',
        minHeight: '100vh'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    title: {
        margin: 0,
        color: '#1e293b'
    },
    subtitle: {
        margin: '5px 0 0 0',
        color: '#64748b',
        fontSize: '14px'
    },
    newButton: {
        backgroundColor: '#dc2626',
        color: '#fff',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    searchContainer: {
        marginBottom: '20px'
    },
    searchInput: {
        width: '100%',
        maxWidth: '350px',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #cbd5e1',
        outline: 'none'
    },
    tableWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '14px'
    },
    tableHeaderRow: {
        backgroundColor: '#1e293b',
        color: '#ffffff'
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0'
    },
    th: {
        padding: '12px 16px'
    },
    thCenter: {
        padding: '12px 16px',
        textAlign: 'center'
    },
    tdId: {
        padding: '12px 16px',
        fontWeight: 'bold',
        color: '#334155'
    },
    tdNombre: {
        padding: '12px 16px',
        fontWeight: '500'
    },
    tdPrecio: {
        padding: '12px 16px',
        color: '#16a34a',
        fontWeight: 'bold'
    },
    tdMuted: {
        padding: '12px 16px',
        color: '#475569'
    },
    tdCenter: {
        padding: '12px 16px',
        textAlign: 'center'
    },
    tableMessage: {
        textAlign: 'center',
        padding: '20px',
        color: '#64748b'
    },
    actionButtonsContainer: {
        display: 'flex',
        gap: '6px',
        justifyContent: 'center'
    },
    editButton: {
        backgroundColor: '#eab308',
        color: '#000',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    deleteButton: {
        backgroundColor: '#dc2626',
        color: '#fff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold'
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
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '8px',
        width: '400px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    modalTitle: {
        marginTop: 0,
        color: '#1e293b'
    },
    inputGroup: {
        marginBottom: '10px'
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
        border: '1px solid #cbd5e1'
    },
    inputDisabled: {
        width: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#e2e8f0',
        color: '#475569',
        fontWeight: 'bold'
    },
    errorText: {
        color: 'red',
        fontSize: '12px',
        margin: '4px 0 0 0'
    },
    modalButtonsContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    cancelButton: {
        padding: '8px 12px',
        background: '#cbd5e1',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    saveButton: {
        padding: '8px 12px',
        background: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};

export default PlanesPage;