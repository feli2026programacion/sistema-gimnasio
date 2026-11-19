import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function DashboardLayout() {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ marginLeft: '240px', width: 'calc(100% - 240px)', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
                <Outlet /> 
            </div>
        </div>
    );
}

export default DashboardLayout;