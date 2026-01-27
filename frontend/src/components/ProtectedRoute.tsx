import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles: string[];
    redirectPath?: string;
    children?: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    redirectPath = '/',
    children,
}) => {
    // Obtener el rol del usuario desde localStorage
    const userRole = localStorage.getItem('userRole')?.toLowerCase() || '';

    // Verificar si el rol del usuario está permitido
    if (!allowedRoles.includes(userRole)) {
        return <Navigate to={redirectPath} replace />;
    }

    // Si tiene permiso, renderizar los hijos o el Outlet
    return children ? children : <Outlet />;
};

export default ProtectedRoute;
