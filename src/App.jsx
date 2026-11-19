import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Inicio from './pages/Inicio';
import Clientes from './pages/Clientes';
import Asistencias from './pages/Asistencias';
import RegistrarCuotasPage from './pages/RegistrarCuotasPage';
import HistorialCuotasPage from './pages/HistorialCuotasPage';
import RegistroPage from './pages/RegistroPage';
import PlanesPage from './pages/PlanesPage';
import AbrirCajaPage from './pages/caja/abrir';
import CerrarCajaPage from './pages/caja/cerrar';
import HistorialTurnosPage from './pages/caja/historial';

import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

function NotFoundPage() {
  return (
    <div style={styles.notFoundContainer}>
      <h2 style={styles.notFoundTitle}>Error 404: Página No Encontrada</h2>
      <p style={styles.notFoundText}>
        Lo sentimos, la página que estás buscando no existe.
      </p>
      <Link to="/" style={styles.notFoundLink}>
        Volver al Inicio
      </Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />

        {/* Rutas privadas */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/Inicio" element={<Inicio />} />
          <Route path="/caja/abrir" element={<AbrirCajaPage />} />
          <Route path="/caja/cerrar" element={<CerrarCajaPage />} />
          <Route path="/caja/historial" element={<HistorialTurnosPage />} />
          <Route path="/Clientes" element={<Clientes />} />
          <Route path="/Asistencias" element={<Asistencias />} />
          <Route path="/RegistrarCuotasPage" element={<RegistrarCuotasPage />} />
          <Route path="/HistorialCuotasPage" element={<HistorialCuotasPage />} />
          <Route path="/PlanesPage" element={<PlanesPage />} />
        </Route>

        {/* Ruta 404 (Catch-All): SIEMPRE al final */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// ==========================================
// ESTILOS DEL COMPONENTE
// ==========================================
const styles = {
  notFoundContainer: {
    maxWidth: '420px',
    margin: '80px auto',
    padding: '24px',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
  },
  notFoundTitle: {
    marginTop: 0,
    color: '#1e293b',
  },
  notFoundText: {
    color: '#475569',
    marginBottom: '18px',
  },
  notFoundLink: {
    color: '#2563eb',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
};

export default App;