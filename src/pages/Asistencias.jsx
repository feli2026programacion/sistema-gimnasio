import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';

const obtenerFechaLocalISO = (fechaInput = new Date()) => {
    const fecha = fechaInput instanceof Date ? fechaInput : new Date(fechaInput);
    if (Number.isNaN(fecha.getTime())) return '';
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

const extraerFechaAsistencia = (registro) => {
    if (registro.fecha) return registro.fecha;
    if (registro.timestamp) {
        return obtenerFechaLocalISO(registro.timestamp);
    }
    if (typeof registro.fecha_hora === 'string') {
        const parteFecha = registro.fecha_hora.split(',')[0]?.trim();
        const partes = parteFecha?.split('/');
        if (partes && partes.length === 3) {
            return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
    }
    return '';
};

function Asistencias() {
    const [clientes, setClientes] = useState([]);
    const [asistenciasHoy, setAsistenciasHoy] = useState([]);
    const [cargando, setCargando] = useState(true);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            dniCliente: '',
        },
    });

    const obtenerDatos = async (esActivo = () => true) => {
        try {
            if (esActivo()) setCargando(true);

            const snapshotClientes = await getDocs(collection(db, 'clientes'));
            if (!esActivo()) return;
            setClientes(snapshotClientes.docs.map((item) => ({ id: item.id, ...item.data() })));

            const snapshotAsistencias = await getDocs(collection(db, 'asistencias'));
            if (!esActivo()) return;
            const listaAsistencias = snapshotAsistencias.docs.map((item) => ({
                id: item.id,
                ...item.data(),
            }));

            listaAsistencias.sort(
                (a, b) => new Date(b.timestamp || b.fecha_hora) - new Date(a.timestamp || a.fecha_hora)
            );
            setAsistenciasHoy(listaAsistencias);
        } catch (error) {
            console.error('Error al obtener datos: ', error);
        } finally {
            if (esActivo()) setCargando(false);
        }
    };

    useEffect(() => {
        let activa = true;
        obtenerDatos(() => activa);

        return () => {
            activa = false;
        };
    }, []);

    const onSubmit = async (data) => {
        const dniBuscado = String(data.dniCliente || '').trim();
        if (!dniBuscado) return;

        const clienteEncontrado = clientes.find((c) => String(c.dni) === dniBuscado);

        if (!clienteEncontrado) {
            alert('⚠ El DNI ingresado no se encuentra registrado en el sistema.');
            reset({ dniCliente: '' });
            return;
        }

        const docRefCliente = doc(db, 'clientes', dniBuscado);

        // 1. Verificar si ya está Inactivo
        if (clienteEncontrado.estado !== 'Activo') {
            alert(
                `Acceso denegado. El socio ${clienteEncontrado.nombre} ${clienteEncontrado.apellido} está Inactivo (Debe abonar su cuota).`
            );
            reset({ dniCliente: '' });
            return;
        }

        // 2. Verificar si venció por fecha
        const fechaHoy = obtenerFechaLocalISO();
        if (clienteEncontrado.fecha_vencimiento && fechaHoy > clienteEncontrado.fecha_vencimiento) {
            await updateDoc(docRefCliente, { estado: 'Inactivo' });
            alert(
                `Cuota vencida el ${clienteEncontrado.fecha_vencimiento}. El socio ${clienteEncontrado.nombre} pasó a estado Inactivo.`
            );
            reset({ dniCliente: '' });
            obtenerDatos();
            return;
        }

        // 3. Verificar que no haya registrado asistencia ya hoy
        const yaAsistioHoy = asistenciasHoy.some(
            (registro) =>
                String(registro.dni) === dniBuscado &&
                extraerFechaAsistencia(registro) === fechaHoy
        );

        if (yaAsistioHoy) {
            alert(
                `⚠ El socio ${clienteEncontrado.nombre} ${clienteEncontrado.apellido} ya tiene una asistencia registrada el día de hoy.`
            );
            reset({ dniCliente: '' });
            return;
        }

        // 4. Descontar clases si el socio tiene clases cargadas como número
        let mensajeExtra = '';
        if (typeof clienteEncontrado.clases_disponibles === 'number') {
            let clasesRestantes = Number(clienteEncontrado.clases_disponibles);

            if (clasesRestantes <= 0) {
                await updateDoc(docRefCliente, { estado: 'Inactivo', clases_disponibles: 0 });
                alert(
                    ` Sin clases disponibles. El socio ${clienteEncontrado.nombre} pasó a estado Inactivo.`
                );
                reset({ dniCliente: '' });
                obtenerDatos();
                return;
            }

            clasesRestantes = clasesRestantes - 1;
            const nuevoEstado = clasesRestantes <= 0 ? 'Inactivo' : 'Activo';

            await updateDoc(docRefCliente, {
                clases_disponibles: clasesRestantes,
                estado: nuevoEstado,
            });

            mensajeExtra =
                clasesRestantes === 0
                    ? '\n⚠ Esta fue su última clase. Su estado pasó a Inactivo.'
                    : `\nClases restantes: ${clasesRestantes}`;
        }

        try {
            const ahora = new Date();
            const fechaHoraFormateada = ahora.toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            await addDoc(collection(db, 'asistencias'), {
                dni: dniBuscado,
                cliente: `${clienteEncontrado.nombre} ${clienteEncontrado.apellido}`,
                fecha: fechaHoy,
                fecha_hora: fechaHoraFormateada,
                timestamp: ahora.toISOString(),
            });

            alert(`¡Asistencia registrada! Bienvenido/a ${clienteEncontrado.nombre}.${mensajeExtra}`);
            reset({ dniCliente: '' });
            obtenerDatos();
        } catch (error) {
            console.error('Error al registrar asistencia: ', error);
            alert('Hubo un error al registrar la asistencia.');
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Marcar Asistencia</h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>DNI del Cliente:</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ingrese o escanee el DNI y presione Enter"
                        {...register('dniCliente', {
                            required: 'El DNI es obligatorio',
                            minLength: { value: 7, message: 'Mínimo 7 dígitos' },
                            maxLength: { value: 9, message: 'Máximo 9 dígitos' },
                            pattern: {
                                value: /^[0-9]+$/,
                                message: 'Solo se permiten números',
                            },
                        })}
                        style={styles.input}
                    />
                    {errors.dniCliente && (
                        <p style={styles.errorText}>{errors.dniCliente.message}</p>
                    )}
                </div>

                <button type="submit" style={styles.submitButton}>
                    Registrar Ingreso
                </button>
            </form>

            <div style={styles.tableWrapper}>
                <div style={styles.tableHeaderBanner}>Ingresos Registrados</div>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.th}>Fecha y Hora</th>
                            <th style={styles.th}>Cliente</th>
                            <th style={styles.th}>DNI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="3" style={styles.tableMessage}>
                                    Cargando asistencias...
                                </td>
                            </tr>
                        ) : asistenciasHoy.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={styles.tableMessage}>
                                    No hay asistencias registradas.
                                </td>
                            </tr>
                        ) : (
                            asistenciasHoy.map((item, index) => (
                                <tr
                                    key={item.id || index}
                                    style={{
                                        ...styles.tableRow,
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                                    }}
                                >
                                    <td style={styles.tdFecha}>{item.fecha_hora}</td>
                                    <td style={styles.tdCliente}>{item.cliente}</td>
                                    <td style={styles.tdDni}>{item.dni}</td>
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
        maxWidth: '900px',
    },
    title: {
        color: '#1e293b',
        marginTop: 0,
    },
    form: {
        backgroundColor: '#fff',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '30px',
    },
    inputGroup: {
        marginBottom: '15px',
    },
    label: {
        fontSize: '13px',
        fontWeight: 'bold',
        display: 'block',
        marginBottom: '5px',
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
    submitButton: {
        width: '100%',
        padding: '11px',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '15px',
    },
    tableWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflowX: 'auto',
    },
    tableHeaderBanner: {
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: '12px 16px',
        fontWeight: 'bold',
        fontSize: '14px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '14px',
    },
    tableHeaderRow: {
        backgroundColor: '#f1f5f9',
        color: '#334155',
        borderBottom: '1px solid #cbd5e1',
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0',
    },
    th: {
        padding: '12px 16px',
    },
    tdFecha: {
        padding: '12px 16px',
        color: '#475569',
    },
    tdCliente: {
        padding: '12px 16px',
        fontWeight: '500',
    },
    tdDni: {
        padding: '12px 16px',
        color: '#334155',
    },
    tableMessage: {
        textAlign: 'center',
        padding: '20px',
        color: '#64748b',
    },
};

export default Asistencias;