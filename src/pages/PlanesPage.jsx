import React, { useState, useEffect } from 'react'; // useState para estados, useEffect para efectos secundarios (ciclo de vida)[cite: 4, 5, 6]
import { useForm } from 'react-hook-form'; // Hook para gestionar formularios y validaciones[cite: 15, 16, 36]
import { db, auth } from '../firebase'; // Instancia de Firestore (base de datos) y Auth (autenticación)
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore'; // Funciones CRUD y filtros en Firestore

function PlanesPage() {
    // Estados principales de la vista y la tabla
    const [planes, setPlanes] = useState([]); // Lista de planes cargados desde Firestore
    const [busqueda, setBusqueda] = useState(''); // Texto actual del buscador para filtrar planes
    const [cargando, setCargando] = useState(true); // Indica si se están cargando los datos (efecto secundario inicial)[cite: 4, 8]

    // Estados para controlar la ventana modal (crear vs. editar)
    const [mostrarModal, setMostrarModal] = useState(false); // Muestra u oculta el modal
    const [modoEdicion, setModoEdicion] = useState(false); // true = editando plan existente, false = creando uno nuevo

    // Inicialización de React Hook Form:
    // - register: registra inputs y define reglas de validación (required, min, maxLength, etc.)[cite: 16, 36]
    // - handleSubmit: valida los campos antes de ejecutar onSubmit[cite: 17]
    // - setValue: asigna valores a campos programáticamente (ej. ID automático o datos al editar)
    // - reset: limpia o resetea los campos del formulario[cite: 17, 18]
    // - formState: { errors }: contiene los mensajes de error de validación de cada input[cite: 17, 38]
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

    // Consulta a Firestore trayendo solo los planes que pertenecen al usuario autenticado
    const obtenerPlanes = async () => {
        try {
            setCargando(true);

            // Si no hay sesión activa, limpiamos la lista y cortamos la consulta
            if (!auth.currentUser) {
                setPlanes([]);
                return;
            }

            // Filtra la colección "planes" por el UID del usuario actual
            const q = query(
                collection(db, 'planes'),
                where('userId', '==', auth.currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
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
            // Siempre apaga el estado de carga al finalizar (haya error o éxito)
            setCargando(false);
        }
    };

    // Efecto secundario al montar el componente ([]): carga los planes una vez[cite: 4, 8, 12]
    useEffect(() => {
        let activa = true; // Bandera para evitar actualizar estado si el componente se desmonta[cite: 7]

        const cargar = async () => {
            if (!activa) return;
            await obtenerPlanes();
        };

        cargar();

        // Función de limpieza al desmontar el componente[cite: 7, 10]
        return () => {
            activa = false;
        };
    }, []);

    // Se ejecuta únicamente cuando handleSubmit pasa todas las validaciones[cite: 17]
    const onSubmit = async (data) => {
        try {
            // Normaliza los tipos de datos y asocia el plan al usuario actual
            const planData = {
                userId: auth.currentUser.uid,
                id_planes: Number(data.id_planes),
                nombre_plan: data.nombre_plan,
                precio: parseFloat(data.precio),
                duracion: Number(data.duracion),
                cantidad_de_clases: Number(data.cantidad_de_clases)
            };

            // Crea o actualiza el documento usando el ID del plan como clave
            await setDoc(doc(db, 'planes', String(data.id_planes)), planData, { merge: true });

            cerrarModal(); // Limpia y cierra el modal
            obtenerPlanes(); // Refresca la lista desde Firestore
        } catch (error) {
            console.error('Error al guardar el plan: ', error);
        }
    };

    // Prepara el formulario para crear un plan asignando el siguiente ID disponible
    const abrirModalNuevo = () => {
        reset();
        const maxId = planes.length > 0
            ? Math.max(...planes.map(p => Number(p.id_planes) || 0))
            : 0;
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

    // Elimina un plan de Firestore y actualiza el estado usando el valor previo (prev)[cite: 30, 31]
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
            {/* Encabezado de la pantalla y botón para abrir el modal de creación */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Gestión de Planes</h2>
                    <p style={styles.subtitle}>
                        Administra los abonos, tarifas, duración y cantidad de clases disponibles.
                    </p>
                </div>
                {/* type="button" evita que actúe como botón de envío de formulario */}
                <button type="button" onClick={abrirModalNuevo} style={styles.newButton}>
                    + Nuevo Plan
                </button>
            </div>

            {/* Campo de búsqueda controlado por estado (onChange actualiza "busqueda")[cite: 28, 29] */}
            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="🔍 Buscar plan por nombre o ID..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {/* Contenedor de la tabla de planes */}
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
                        {/* Renderizado condicional según estado de carga, lista vacía o con datos */}
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
                                        // Estilo condicional con operador ternario para alternar color de fila[cite: 51, 52]
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                                    }}
                                >
                                    <td style={styles.tdId}>#{plan.id_planes}</td>
                                    <td style={styles.tdNombre}>{plan.nombre_plan}</td>
                                    <td style={styles.tdPrecio}>
                                        {/* Formatea el precio al formato monetario argentino */}
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

            {/* Modal condicional: solo se renderiza en el DOM cuando mostrarModal es true */}
            {mostrarModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        {/* Título dinámico según si se está editando o creando[cite: 51, 52] */}
                        <h3 style={styles.modalTitle}>
                            {modoEdicion ? 'Editar Plan' : 'Crear Nuevo Plan'}
                        </h3>

                        {/* noValidate desactiva la validación nativa del navegador para usar React Hook Form */}
                        <form onSubmit={handleSubmit(onSubmit)} noValidate>
                            {/* ID automático deshabilitado para que el usuario no lo altere */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>ID del Plan (Automático):</label>
                                <input
                                    type="number"
                                    disabled
                                    {...register('id_planes')}
                                    style={styles.inputDisabled}
                                />
                            </div>

                            {/* Campo Nombre con reglas required y maxLength[cite: 36, 37] */}
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
                                {/* Muestra el mensaje de error si falla la validación[cite: 17, 38] */}
                                {errors.nombre_plan && <p style={styles.errorText}>{errors.nombre_plan.message}</p>}
                            </div>

                            {/* Campo Precio con required, min y bloqueo de "-" o "e" en teclado[cite: 36] */}
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

                            {/* Campo Duración con validación obligatoria y mínima de 1 día[cite: 36] */}
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

                            {/* Campo Cantidad de clases con validación obligatoria y mínima de 1[cite: 36] */}
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

                            {/* Botones de acción del formulario */}
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

// ==========================================
// ESTILOS DEL COMPONENTE
// Objeto centralizado de estilos inline en camelCase (separado del JSX)
// ==========================================
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