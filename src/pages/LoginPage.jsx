import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const [mensajeEstado, setMensajeEstado] = useState("");
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            setMensajeEstado("Iniciando sesión...");

            await signInWithEmailAndPassword(auth, data.email, data.password);

            setMensajeEstado("Acceso Exitoso");
            setTimeout(() => {
                navigate("/Inicio");
            }, 1000);
        } catch (error) {
            console.error(error);
            setMensajeEstado("Usuario o contraseña incorrectos");
        }
    };

    const esExito = mensajeEstado === "Acceso Exitoso";

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Iniciar Sesión</h2>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Email:</label>
                    <input
                        type="email"
                        {...register("email", {
                            required: "El email es obligatorio",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Ingresa un correo válido (debe incluir @ y un dominio)",
                            },
                        })}
                        style={styles.input}
                    />
                    {errors.email && <p style={styles.errorText}>{errors.email.message}</p>}
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Contraseña:</label>
                    <input
                        type="password"
                        {...register("password", {
                            required: "La contraseña es obligatoria",
                            minLength: { value: 8, message: "Mínimo 8 caracteres" },
                        })}
                        style={styles.input}
                    />
                    {errors.password && <p style={styles.errorText}>{errors.password.message}</p>}
                </div>

                <button type="submit" style={styles.submitButton}>
                    Iniciar sesión
                </button>
            </form>

            <div style={styles.footerContainer}>
                <button
                    type="button"
                    onClick={() => navigate("/registro")}
                    style={styles.linkButton}
                >
                    ¿No tienes cuenta? Crear una cuenta
                </button>
            </div>

            {mensajeEstado && (
                <p
                    style={{
                        ...styles.statusText,
                        color: esExito ? "green" : "red",
                    }}
                >
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
        maxWidth: "400px",
        margin: "50px auto",
        fontFamily: "sans-serif",
        padding: "20px",
        border: "1px solid #e86f46",
        borderRadius: "8px",
    },
    title: {
        marginTop: 0,
        color: "#1e293b",
    },
    inputGroup: {
        marginBottom: "15px",
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "bold",
        marginBottom: "4px",
        color: "#334155",
    },
    input: {
        width: "100%",
        padding: "8px",
        boxSizing: "border-box",
        borderRadius: "4px",
        border: "1px solid #cbd5e1",
    },
    errorText: {
        color: "red",
        fontSize: "12px",
        margin: "4px 0 0 0",
    },
    submitButton: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#2563eb",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    footerContainer: {
        marginTop: "15px",
        textAlign: "center",
    },
    linkButton: {
        background: "none",
        border: "none",
        color: "#2563eb",
        cursor: "pointer",
        textDecoration: "underline",
        fontSize: "14px",
    },
    statusText: {
        marginTop: "10px",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: "14px",
    },
};

export default LoginPage;