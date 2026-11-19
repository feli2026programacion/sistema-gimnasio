import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const esRutaCuotas = location.pathname.includes('/cuotas');
    const [cuotasAbierto, setCuotasAbierto] = useState(esRutaCuotas);

    const esRutaCaja = location.pathname.includes('/caja');
    const [cajaAbierto, setCajaAbierto] = useState(esRutaCaja);

    const handleCerrarSesion = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error al cerrar sesión: ", error);
        }
    };

    return (
        <div style={{
            width: '240px',
            backgroundColor: '#e2e8f0',
            height: '100vh',
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'fixed',
            left: 0,
            top: 0,
            borderRight: '1px solid #cbd5e1',
            fontFamily: 'sans-serif',
            zIndex: 100
        }}>
            
            <div>
                <h3 style={{ margin: '0 0 25px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🏋️‍♂️</span> Gimnasio
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                    <Link to="/Inicio" style={{ textDecoration: 'none', color: '#334155', fontWeight: 'bold', padding: '8px 10px', borderRadius: '4px' }}>🏠 Inicio</Link>

                    {/* SECCIÓN CAJA CON DESPLEGABLE FLOTANTE */}
                    <div style={{ position: 'relative', marginTop: '2px' }}>
                        <div 
                            onClick={() => setCajaAbierto(!cajaAbierto)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                color: '#334155', 
                                fontWeight: 'bold', 
                                padding: '8px 10px', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            <span>Caja</span>
                            <span>{cajaAbierto ? '▾' : '▸'}</span>
                        </div>

                        {cajaAbierto && (
                            <div style={{ 
                                marginTop: '4px',
                                backgroundColor: '#ffffff', 
                                borderRadius: '6px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                overflow: 'hidden',
                                border: '1px solid #cbd5e1'
                            }}>
                                <Link 
                                    to="/caja/abrir" 
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: '#334155', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        padding: '10px 15px', 
                                        borderBottom: '1px solid #f1f5f9'
                                    }}
                                >
                                    Abrir Caja
                                </Link>
                                <Link 
                                    to="/caja/cerrar" 
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: '#334155', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        padding: '10px 15px', 
                                        borderBottom: '1px solid #f1f5f9'
                                    }}
                                >
                                    Cerrar Caja
                                </Link>
                                <Link 
                                    to="/caja/historial" 
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: '#dc2626', 
                                        fontSize: '13px', 
                                        fontWeight: 'bold', 
                                        padding: '10px 15px'
                                    }}
                                >
                                    📊 Historial y Turnos
                                </Link>
                            </div>
                        )}
                    </div>

                    <Link to="/Clientes" style={{ textDecoration: 'none', color: '#334155', fontWeight: 'bold', padding: '8px 10px', borderRadius: '4px' }}>Clientes</Link>
                    <Link to="/PlanesPage" style={{ textDecoration: 'none', color: '#334155', fontWeight: 'bold', padding: '8px 10px', borderRadius: '4px' }}>Planes</Link>
                    <Link to="/Asistencias" style={{ textDecoration: 'none', color: '#334155', fontWeight: 'bold', padding: '8px 10px', borderRadius: '4px' }}>Asistencia</Link>

                    {/* SECCIÓN CUOTAS CON DESPLEGABLE FLOTANTE */}
                    <div style={{ position: 'relative', marginTop: '2px' }}>
                        <div 
                            onClick={() => setCuotasAbierto(!cuotasAbierto)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                color: '#ffffff', 
                                fontWeight: 'bold', 
                                padding: '10px 12px', 
                                borderRadius: '6px',
                                cursor: 'pointer',
                                backgroundColor: '#ea580c'
                            }}
                        >
                            <span>Cuotas</span>
                            <span>{cuotasAbierto ? '▾' : '▸'}</span>
                        </div>

                        {/* Menú flotante blanco */}
                        {cuotasAbierto && (
                            <div style={{ 
                                marginTop: '4px',
                                backgroundColor: '#ffffff', 
                                borderRadius: '6px', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                overflow: 'hidden',
                                border: '1px solid #cbd5e1'
                            }}>
                                <Link 
                                    to="/RegistrarCuotasPage" 
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: '#334155', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        padding: '10px 15px', 
                                        borderBottom: '1px solid #f1f5f9',
                                        backgroundColor: location.pathname === '/cuotas/registrar' ? '#f8fafc' : 'transparent'
                                    }}
                                >
                                    Registrar Pago
                                </Link>
                                <Link 
                                    to="/HistorialCuotasPage" 
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: '#334155', 
                                        fontSize: '13px', 
                                        fontWeight: '500', 
                                        padding: '10px 15px',
                                        backgroundColor: location.pathname === '/cuotas/historial' ? '#f8fafc' : 'transparent'
                                    }}
                                >
                                    Historial de Cuotas
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Botón para Cerrar Sesión */}
            <div>
                <button 
                    onClick={handleCerrarSesion}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#cbd5e1',
                        border: '1px solid #94a3b8',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: '#1e293b'
                    }}
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}

export default Sidebar;