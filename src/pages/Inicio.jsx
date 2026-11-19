import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function Inicio() {
  useEffect(() => {
    document.title = 'Inicio | Panel del Gimnasio';
  }, []);

  return (
    <div style={styles.container}>
      {/* Banner de Bienvenida */}
      <div style={styles.banner}>
        <h1 style={styles.bannerTitle}>¡Hola, Usuario!</h1>
        <p style={styles.bannerText}>
          Perfil activo:{' '}
          <span style={styles.badge}>Administrador</span> — Seleccioná un módulo
          para comenzar a gestionar el gimnasio.
        </p>
      </div>

      {/* Título de la sección */}
      <h2 style={styles.sectionTitle}>Módulos del Sistema</h2>

      {/* Cuadrícula de Módulos */}
      <div style={styles.grid}>
        <Link to="/Clientes" style={styles.link}>
          <div style={{ ...styles.card, backgroundColor: '#ff7a00', color: '#fff' }}>
            <h3 style={styles.cardTitle}>Gestión de Clientes</h3>
            <p style={styles.cardDesc}>
              Administra socios, altas, bajas y estados de membresía.
            </p>
          </div>
        </Link>

        <Link to="/caja/abrir" style={styles.link}>
          <div style={{ ...styles.card, backgroundColor: '#e69500', color: '#fff' }}>
            <h3 style={styles.cardTitle}>Control de Caja</h3>
            <p style={styles.cardDesc}>
              Apertura, cierre, registro de cobros diarios y pagos.
            </p>
          </div>
        </Link>

        <Link to="/Asistencias" style={styles.link}>
          <div style={{ ...styles.card, backgroundColor: '#9ca3af', color: '#fff' }}>
            <h3 style={styles.cardTitle}>Control de Asistencia</h3>
            <p style={styles.cardDesc}>
              Registro por DNI y validación de créditos/cupos activos.
            </p>
          </div>
        </Link>

        <Link to="/PlanesPage" style={styles.link}>
          <div style={{ ...styles.card, backgroundColor: '#fde047', color: '#1f2937' }}>
            <h3 style={styles.cardTitle}>Gestión de Planes</h3>
            <p style={styles.cardDesc}>
              Configuración de pases mensuales, por clase y tarifas.
            </p>
          </div>
        </Link>

        <Link to="/RegistrarCuotasPage" style={styles.link}>
          <div style={{ ...styles.card, backgroundColor: '#fde047', color: '#1f2937' }}>
            <h3 style={styles.cardTitle}>Gestión de Cuotas</h3>
            <p style={styles.cardDesc}>
              Configuración de cuotas.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ==========================================
// ESTILOS DEL COMPONENTE
// ==========================================
const styles = {
  container: {
    maxWidth: '1000px',
    margin: '40px auto',
    fontFamily: 'sans-serif',
    padding: '0 20px',
  },
  banner: {
    backgroundColor: '#f3f4f6',
    padding: '20px 25px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  bannerTitle: {
    margin: '0 0 10px 0',
    fontSize: '24px',
    color: '#1f2937',
  },
  bannerText: {
    margin: 0,
    color: '#4b5563',
    fontSize: '14px',
  },
  badge: {
    backgroundColor: '#1f2937',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#374151',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  link: {
    textDecoration: 'none',
  },
  card: {
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    height: '100%',
    boxSizing: 'border-box',
  },
  cardTitle: {
    margin: '0 0 10px 0',
    fontSize: '18px',
  },
  cardDesc: {
    margin: 0,
    fontSize: '13px',
    opacity: 0.9,
  },
};

export default Inicio;