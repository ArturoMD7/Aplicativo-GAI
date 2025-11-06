// src/components/Sidebar/Sidebar.tsx
import React, { useState } from 'react';
import './Layout.css';
// 1. Importa 'Link'
import { Link } from 'react-router-dom';
import {
  FiHome,
  FiBarChart2,
  FiFolder,
  FiCheckSquare,
  FiUsers,
  FiSettings,
  FiChevronsLeft,
  FiChevronsRight,
  FiLogOut,
  FiFileText
} from 'react-icons/fi';

const navItems = [
  // 2. Asegúrate que 'href' coincida con tus rutas
  { label: "Home", icon: <FiHome />, href: "/" },
  { label: "Dashboard", icon: <FiBarChart2 />, href: "/dashboard" },
  { label: "Projects", icon: <FiFolder />, href: "/projects" },
  { label: "Investigaciones", icon: <FiFileText />, href: "/investigaciones" },
  { label: "Tasks", icon: <FiCheckSquare />, href: "/tasks" },
  { label: "Users", icon: <FiUsers />, href: "/users" }, // Esta es la ruta clave
];

type SidebarProps = {
  onLogout: () => void;
};

function Sidebar({ onLogout }: SidebarProps) {
  // ... (tu lógica de 'isOpen' y 'toggleSidebar' no cambia) ...
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        {/* ... (botón de toggle no cambia) ... */}
      </div>

      <ul className="sidebar-links">
        {navItems.map((item) => (
          <li key={item.label}>
            {/* 3. Cambia <a> por <Link to=...> */}
            <Link to={item.href} className="nav-link">
              <span className="icon">{item.icon}</span>
              <span className="text">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="sidebar-footer">
        <button className="nav-link" onClick={onLogout}>
          <span className="icon"><FiLogOut /></span>
          <span className="text">Logout</span>
        </button>

        {/* 4. Cambia el 'Settings' también a un <Link> */}
        <Link to="/settings" className="nav-link">
          <span className="icon"><FiSettings /></span>
          <span className="text">Settings</span>
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;