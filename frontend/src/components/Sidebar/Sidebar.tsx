import React, { useState } from 'react';
import './Layout.css'; 
import {
  FiHome,
  FiBarChart2,
  FiFolder,
  FiCheckSquare,
  FiUsers,
  FiSettings,
  FiChevronsLeft,
  FiChevronsRight,
  FiLogOut 
} from 'react-icons/fi';

const navItems = [
  { label: "Home", icon: <FiHome />, href: "/" },
  { label: "Dashboard", icon: <FiBarChart2 />, href: "/dashboard" },
  { label: "Projects", icon: <FiFolder />, href: "/projects" },
  { label: "Tasks", icon: <FiCheckSquare />, href: "/tasks" },
  { label: "Users", icon: <FiUsers />, href: "/users" },
];

type SidebarProps = {
  onLogout: () => void;
};

function Sidebar({ onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <FiChevronsLeft /> : <FiChevronsRight />}
        </button>
      </div>

      <ul className="sidebar-links">
        {navItems.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="nav-link">
              <span className="icon">{item.icon}</span>
              <span className="text">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
      
      <div className="sidebar-footer">
        {/* --- ¡NUEVO! 4. Creamos el botón de Logout --- */}
        <button className="nav-link" onClick={onLogout}>
          <span className="icon"><FiLogOut /></span>
          <span className="text">Logout</span>
        </button>

        <a href="/settings" className="nav-link">
          <span className="icon"><FiSettings /></span>
          <span className="text">Settings</span>
        </a>
      </div>
    </div>
  );
}

export default Sidebar;