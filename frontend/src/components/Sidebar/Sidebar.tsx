// src/components/Sidebar/Sidebar.tsx
import React, { useState } from 'react';
import './Layout.css';
import { Link, useLocation } from 'react-router-dom';
import pemexLogo from '../../assets/logo_min.png';
import { auditoriaService } from '../../api/auditoriaService';
import { LuLogs } from "react-icons/lu";

import {
  FiHome,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiFileText,
  FiSearch,
  FiChevronDown
} from 'react-icons/fi';
import { LuFileDown } from "react-icons/lu";
// Define the interface for navigation items
interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  subItems?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Inicio", icon: <FiHome />, href: "/" },
  {
    label: "Investigaciones",
    icon: <FiFileText />,
    href: "#",
    subItems: [
      { label: "Investigaciones", href: "/investigaciones" },
      { label: "Seguimiento", href: "/investigaciones/seguimiento-lista" },
      { label: "Finalización", href: "/investigaciones/finalizacion-lista" },
    ]
  },
  {
    label: "Bajas",
    icon: <LuFileDown />,
    href: "#",
    subItems: [
      { label: "Bajas", href: "/bajas" }
    ]
  },
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
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
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

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
    // Ensure sidebar opens when a section is toggled (if it was collapsed)
    if (!isOpen) setIsOpen(true);
  };

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  const isSectionActive = (item: NavItem) => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.href);
    }
    return location.pathname === item.href;
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
          {filteredNavItems.map((item) => {
            const hasSubmenu = item.subItems && item.subItems.length > 0;
            const isExpanded = openSections[item.label] || false;

            return (
              <li key={item.label} className={`nav-item ${hasSubmenu ? 'has-submenu' : ''}`}>
                {hasSubmenu ? (
                  <>
                    <div
                      className={`nav-link ${isSectionActive(item) ? 'active' : ''} ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleSection(item.label)}
                      data-tooltip={item.label}
                    >
                      <span className="icon">{item.icon}</span>
                      <span className="text">{item.label}</span>
                      <FiChevronDown className="dropdown-icon" />
                    </div>
                    <ul className={`submenu ${isExpanded ? 'open' : ''}`}>
                      {item.subItems!.map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            to={subItem.href}
                            className={`submenu-link ${isActiveLink(subItem.href) ? 'active' : ''}`}
                            onClick={() => {
                              auditoriaService.logAction('VIEW', `Navegó al módulo ${subItem.label}`, undefined, subItem.href);
                            }}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={`nav-link ${isActiveLink(item.href) ? 'active' : ''}`}
                    data-tooltip={item.label}
                    onClick={() => {
                      if (item.label !== 'Inicio') {
                        auditoriaService.logAction('VIEW', `Navegó al módulo ${item.label}`, undefined, item.href);
                      }
                    }}
                  >
                    <span className="icon">{item.icon}</span>
                    <span className="text">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
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
