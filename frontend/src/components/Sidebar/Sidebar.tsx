// src/components/Sidebar/Sidebar.tsx
import React, { useState } from 'react';
import './Layout.css';
import { Link, useLocation } from 'react-router-dom';
import pemexLogo from '../../assets/logo_min.png';
import { GrDocumentTime } from "react-icons/gr";
import { LuLogs } from "react-icons/lu";

import {
  FiHome,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiFileText,
  FiSearch,
} from 'react-icons/fi';
import { GrDocumentVerified } from "react-icons/gr";

const navItems = [
  { label: "Inicio", icon: <FiHome />, href: "/" },
  { label: "Investigaciones", icon: <FiFileText />, href: "/investigaciones" },
  { label: "Seguimiento", icon: <GrDocumentTime />, href: "/investigaciones/seguimiento-lista" },
  { label: "Finalización", icon: <GrDocumentVerified />, href: "/investigaciones/finalizacion-lista" },
  { label: "Buscar Empleado", icon: <FiSearch />, href: "/buscar-empleado" },
  { label: "Usuarios", icon: <FiUsers />, href: "/users" },
  { label: "Logs", icon: <LuLogs />, href: "/logs" },


];

type SidebarProps = {
  onLogout: () => void;
};

function Sidebar({ onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const location = useLocation();

  React.useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    // Normalizar a minúsculas para comparación segura
    setUserRole(role.toLowerCase());
  }, []);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.label === 'Usuarios' || item.label === 'Logs') {
      return ['admin', 'admincentral'].includes(userRole);
    }
    return true;
  });

  return (
    <div
      className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header simplificado - solo logo */}
      <div className="sidebar-header">
        <img src={pemexLogo} alt="Pemex" />
        <span className="brand-text">GAI</span>
      </div>

      {/* Navegación principal */}
      <nav className="sidebar-nav">
        <ul className="sidebar-links">
          {filteredNavItems.map((item) => (
            <li key={item.label} className="nav-item">
              <Link
                to={item.href}
                className={`nav-link ${isActiveLink(item.href) ? 'active' : ''}`}
                data-tooltip={item.label}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <ul className="footer-links">
          <li className="nav-item">
            <button
              className="nav-link"
              onClick={onLogout}
              data-tooltip="Logout"
            >
              <span className="icon"><FiLogOut /></span>
              <span className="text">Cerrar Sesión</span>
            </button>
          </li>
          <li className="nav-item">
            <Link
              to="/settings"
              className="nav-link"
              data-tooltip="Settings"
            >
              <span className="icon"><FiSettings /></span>
              <span className="text">Ajustes</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;