import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { db } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, where } from 'firebase/firestore';

function obtenerFechaHoyLocal() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

// Verifica si el socio ya cuenta con una cuota activa y no vencida
function tieneCuotaVigente(cliente, fechaHoy) {
    if (!cliente || cliente.estado !== 'Activo') return false;

    const fechaVenc = cliente.fecha_vencimiento;
    const dentroDeFecha = !fechaVenc || fechaVenc >= fechaHoy;

    if (!dentroDeFecha) return false;

    if (cliente.tiene_limite_clases) {
        return Number(cliente.clases_disponibles || 0) > 0;
    }

    return true;
}

function RegistrarCuotaPage() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [planes, setPlanes] = useState([]);
    // Controla si existe un turno de caja abierto antes de habilitar el cobro
    const [cajaAbierta, setCajaAbierta] = useState(false);
    const [verificandoCaja, setVerificandoCaja] = useState(true);

    const fechaHoy = obtenerFechaHoyLocal();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            dniCliente: '',
            idPlanSeleccionado: '',
            tipoPago: 'EFECTIVO',
            montoAbonado: '',
            fecha: fechaHoy,
            observacion: '',
        },
    });

    const dniWatch = watch('dniCliente');
    const planWatch = watch('idPlanSeleccionado');
    const montoWatch = watch('montoAbonado');

    useEffect(() => {
        let activa = true;

        const obtenerDatos = async () => {
            try {
                // 1. Verificar que haya una caja ABIERTA antes de cargar el formulario
                const consultaCaja = query(
                    collection(db, 'caja'),
                    where('estado', '==', 'ABIERTA')
                );
                const snapshotCaja = await getDocs(consultaCaja);
                if (!activa) return;

                if (snapshotCaja.empty) {
                    setCajaAbierta(false);
                    setVerificandoCaja(false);
                    return;
                }

                setCajaAbierta(true);

                // 2. Cargar socios y planes disponibles
                const snapshotClientes = await getDocs(collection(db, 'clientes'));
                if (!activa) return;
                setClientes(
                    snapshotClientes.docs.map((item) => ({ id: item.id, ...item.data() }))
                );

                const snapshotPlanes = await getDocs(collection(db, 'planes'));
                if (!activa) return;
                setPlanes(
                    snapshotPlanes.docs.map((item) => ({ id: item.id, ...item.data() }))
                );
            } catch (error) {
                console.error('Error al obtener datos: ', error);
            } finally {
                if (activa) setVerificandoCaja(false);
            }
        };

        obtenerDatos();

        return () => {
            activa = false;
        };
    }, []);

    // Sincroniza el monto a pagar cada vez que cambia el plan seleccionado
    useEffect(() => {
        if (!planWatch) {
            setValue('montoAbonado', '');
            return;
        }
        const planEncontrado = planes.find(
            (p) => String(p.id_planes) === String(planWatch) || p.id === planWatch
        );
        setValue('montoAbonado', planEncontrado ? Number(planEncontrado.precio || 0) : '');
    }, [planWatch, planes, setValue]);

    const onSubmit = async (data) => {
        try {
            // Revalidar estado de caja al enviar por si se cerró mientras el formulario estaba abierto
            const consultaCaja = query(collection(db, 'caja'), where('estado', '==', 'ABIERTA'));
            const snapshotCaja = await getDocs(consultaCaja);
            if (snapshotCaja.empty) {
                alert('No hay ninguna caja abierta. Debes abrir la caja antes de cobrar una cuota.');
                setCajaAbierta(false);
                return;
            }

            const dniLimpio = String(data.dniCliente || '').trim();
            const clienteSeleccionado = clientes.find((c) => String(c.dni) === dniLimpio);

            if (!clienteSeleccionado) {
                alert('No se encontró ningún socio registrado con ese DNI.');
                return;
            }

            const fechaActualPago = obtenerFechaHoyLocal();

            // Impedir registrar una segunda cuota mientras el socio tenga una vigente
            if (tieneCuotaVigente(clienteSeleccionado, fechaActualPago)) {
                alert(
                    `Este socio ya tiene una cuota activa vigente${
                        clienteSeleccionado.fecha_vencimiento
                            ? ` hasta el ${clienteSeleccionado.fecha_vencimiento}`
                            : ''
                    }. No puede tener dos cuotas al mismo tiempo.`
                );
                return;
            }

            const planEncontrado = planes.find(
                (p) =>
                    String(p.id_planes) === String(data.idPlanSeleccionado) ||
                    p.id === data.idPlanSeleccionado
            );

            if (!planEncontrado) {
                alert('Debes seleccionar un plan válido.');
                return;
            }

            // Tomar el precio oficial del plan y la fecha actual del día de hoy para evitar  que haya errores
            const montoOficialPlan = parseFloat(planEncontrado.precio || 0);

            const diasDuracion = Number(planEncontrado?.duracion || planEncontrado?.dias || 30);
            const fechaBase = new Date(`${fechaActualPago}T00:00:00`);
            fechaBase.setDate(fechaBase.getDate() + diasDuracion);
            const fechaVencimiento = fechaBase.toISOString().split('T')[0];

            const clasesDelPlan = Number(
                planEncontrado?.cantidad_de_clases ??
                    planEncontrado?.cantidad_clases ??
                    planEncontrado?.clases ??
                    0
            );
            const tieneLimiteClases = clasesDelPlan > 0;

            await addDoc(collection(db, 'cuotas'), {
                dni_clientes: dniLimpio,
                nombre_cliente: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
                id_plan: data.idPlanSeleccionado,
                nombre_plan: planEncontrado.nombre_plan || 'Plan general',
                tipo_de_pago: data.tipoPago,
                fecha: fechaActualPago,
                // Marca temporal exacta para el arqueo del cierre de caja
                fecha_hora_registro: new Date().toISOString(),
                fecha_vencimiento: fechaVencimiento,
                monto_abonado: montoOficialPlan,
                observacion: data.observacion?.trim() || '',
            });

            // Reactiva al socio y actualiza vencimiento y clases disponibles
            const docIdCliente = clienteSeleccionado.id || dniLimpio;
            await updateDoc(doc(db, 'clientes', docIdCliente), {
                estado: 'Activo',
                fecha_vencimiento: fechaVencimiento,
                tiene_limite_clases: tieneLimiteClases,
                clases_disponibles: clasesDelPlan,
            });

            reset();
            alert(
                `¡Cuota registrada con éxito! Clases asignadas: ${clasesDelPlan}. Vence el ${fechaVencimiento}.`
            );
            navigate('/Inicio');
        } catch (error) {
            console.error('Error al registrar cuota: ', error);
            alert('Ocurrió un error al registrar el pago.');
        }
    };

    if (verificandoCaja) {
        return <div style={styles.loading}>Verificando estado de caja...</div>;
    }

    // Bloquea el acceso al cobro si no hay caja abierta
    if (!cajaAbierta) {
        return (
            <div style={styles.emptyContainer}>
                <h3 style={styles.emptyTitle}>No hay ninguna caja abierta en este momento.</h3>
                <p style={styles.emptyText}>
                    Debes abrir la caja antes de poder registrar el cobro de una cuota.
                </p>
                <div style={styles.emptyActions}>
                    <button
                        type="button"
                        onClick={() => navigate('/Inicio')}
                        style={styles.cancelButton}
                    >
                        Volver al Inicio
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/caja/abrir')}
                        style={styles.goOpenButton}
                    >
                        Ir a Abrir Caja
                    </button>
                </div>
            </div>
        );
    }

    const dniLimpioActual = String(dniWatch || '').trim();
    const clienteEncontrado = clientes.find((c) => String(c.dni) === dniLimpioActual);
    const socioYaTieneCuota = tieneCuotaVigente(clienteEncontrado, fechaHoy);

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Registrar Cobro de Cuota</h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>DNI del Cliente:</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="Ej: 40123456"
                        onInput={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        }}
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
                    {dniLimpioActual && (
                        <div
                            style={{
                                ...styles.clientStatus,
                                color: clienteEncontrado ? '#16a34a' : '#dc2626',
                            }}
                        >
                            {clienteEncontrado
                                ? `✓ Socio: ${clienteEncontrado.nombre} ${clienteEncontrado.apellido} [${clienteEncontrado.estado || 'Inactivo'}]`
                                : '⚠ DNI no registrado'}
                        </div>
                    )}
                    {socioYaTieneCuota && (
                        <div style={styles.activeQuotaWarning}>
                            Este socio ya posee una cuota vigente
                            {clienteEncontrado.fecha_vencimiento
                                ? ` (vence el ${clienteEncontrado.fecha_vencimiento})`
                                : ''}
                            . No se puede registrar otra cuota hasta que venza o agote sus clases.
                        </div>
                    )}
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Plan:</label>
                    <select
                        {...register('idPlanSeleccionado', {
                            required: 'Debes seleccionar un plan',
                        })}
                        style={styles.select}
                    >
                        <option value="">Seleccione un plan...</option>
                        {planes.map((p) => {
                            const cantClases =
                                p.cantidad_de_clases ?? p.cantidad_clases ?? p.clases ?? 0;
                            return (
                                <option key={p.id_planes || p.id} value={p.id_planes || p.id}>
                                    {p.nombre_plan} (${p.precio}){' '}
                                    {cantClases > 0 ? `- ${cantClases} clases` : '- Pase libre'}
                                </option>
                            );
                        })}
                    </select>
                    {errors.idPlanSeleccionado && (
                        <p style={styles.errorText}>{errors.idPlanSeleccionado.message}</p>
                    )}
                </div>

                <div style={styles.rowGrid}>
                    <div>
                        <label style={styles.label}>Forma de Pago:</label>
                        <select
                            {...register('tipoPago', {
                                required: 'La forma de pago es obligatoria',
                            })}
                            style={styles.select}
                        >
                            <option value="EFECTIVO">EFECTIVO</option>
                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                            <option value="TARJETA">TARJETA</option>
                        </select>
                        {errors.tipoPago && (
                            <p style={styles.errorText}>{errors.tipoPago.message}</p>
                        )}
                    </div>

                    <div>
                        <label style={styles.label}>Monto a Pagar ($):</label>
                        {/* Campo de solo lectura: muestra el precio del plan sin permitir editarlo */}
                        <input
                            type="text"
                            readOnly
                            tabIndex={-1}
                            value={
                                montoWatch !== '' && montoWatch !== undefined
                                    ? `$${Number(montoWatch).toLocaleString('es-AR', {
                                           minimumFractionDigits: 2,
                                      })}`
                                    : 'Selecciona un plan'
                            }
                            {...register('montoAbonado', {
                                required: 'Selecciona un plan para ver el monto a pagar',
                            })}
                            style={styles.inputReadOnly}
                        />
                        {errors.montoAbonado && (
                            <p style={styles.errorText}>{errors.montoAbonado.message}</p>
                        )}
                    </div>

                    <div>
                        <label style={styles.label}>Fecha de Pago:</label>
                        {/* Fijada al día de hoy (min/max + readOnly) para impedir cobros con otra fecha */}
                        <input
                            type="date"
                            min={fechaHoy}
                            max={fechaHoy}
                            readOnly
                            tabIndex={-1}
                            {...register('fecha', {
                                required: 'La fecha de pago es obligatoria',
                            })}
                            style={styles.inputReadOnly}
                        />
                        {errors.fecha && <p style={styles.errorText}>{errors.fecha.message}</p>}
                    </div>
                </div>

                <div style={styles.textareaGroup}>
                    <label style={styles.label}>Descripción / Observación (Opcional):</label>
                    <textarea
                        rows="3"
                        maxLength={250}
                        placeholder="Notas adicionales del pago..."
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
                    <button
                        type="submit"
                        disabled={socioYaTieneCuota}
                        style={socioYaTieneCuota ? styles.submitButtonDisabled : styles.submitButton}
                    >
                        Registrar Pago
                    </button>
                </div>
            </form>
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
        backgroundColor: '#ffffff',
        maxWidth: '550px',
        margin: '40px auto',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #cbd5e1',
    },
    emptyTitle: {
        color: '#dc2626',
        marginTop: 0,
    },
    emptyText: {
        color: '#475569',
        fontSize: '14px',
        marginBottom: '20px',
    },
    emptyActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
    },
    goOpenButton: {
        padding: '9px 18px',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    container: {
        padding: '30px',
        fontFamily: 'sans-serif',
        maxWidth: '750px',
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
    },
    inputGroup: {
        marginBottom: '15px',
    },
    label: {
        fontSize: '13px',
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        padding: '8px',
        marginTop: '5px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
    },
    inputReadOnly: {
        width: '100%',
        padding: '8px',
        marginTop: '5px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        backgroundColor: '#f1f5f9',
        color: '#0f172a',
        fontWeight: 'bold',
        cursor: 'not-allowed',
    },
    select: {
        width: '100%',
        padding: '8px',
        marginTop: '5px',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
    },
    errorText: {
        color: 'red',
        fontSize: '12px',
        margin: '4px 0 0 0',
    },
    clientStatus: {
        fontSize: '12px',
        marginTop: '4px',
        fontWeight: 'bold',
    },
    activeQuotaWarning: {
        marginTop: '8px',
        padding: '10px 12px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '4px',
        color: '#b91c1c',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    rowGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '15px',
        marginBottom: '15px',
    },
    textareaGroup: {
        marginBottom: '20px',
    },
    textarea: {
        width: '100%',
        padding: '8px',
        marginTop: '5px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #cbd5e1',
        fontFamily: 'sans-serif',
    },
    actions: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    cancelButton: {
        padding: '9px 16px',
        background: '#64748b',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    submitButton: {
        padding: '9px 16px',
        background: '#16a34a',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    submitButtonDisabled: {
        padding: '9px 16px',
        background: '#94a3b8',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'not-allowed',
        fontWeight: 'bold',
    },
};

export default RegistrarCuotaPage;