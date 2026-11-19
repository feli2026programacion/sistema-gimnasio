import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

function ProtectedRoute({ children }) {
    const [user, setUser] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setCargando(false);
        });
        return () => unsubscribe();
    }, []);

    if (cargando) {
        return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>Verificando sesión...</div>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;