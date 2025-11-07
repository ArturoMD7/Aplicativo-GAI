import React from 'react';
import { Link } from 'react-router-dom';
import './ButtonIcon.css';

// Tipos de botón disponibles
const BUTTON_VARIANTS = {
  view: {
    color: '#1e5b4f',
    hoverColor: '#154238',
    defaultIcon: '👁️'
  },
  edit: {
    color: '#840016',
    hoverColor: '#a50121',
    defaultIcon: '✏️'
  },
  delete: {
    color: '#dc3545',
    hoverColor: '#c82333',
    defaultIcon: '🗑️'
  },
  add: {
    color: '#28a745',
    hoverColor: '#218838',
    defaultIcon: '➕'
  },
  download: {
    color: '#17a2b8',
    hoverColor: '#138496',
    defaultIcon: '📥'
  },
  custom: {
    color: '#6c757d',
    hoverColor: '#545b62',
    defaultIcon: '⚡'
  }
};

// Props del componente
interface ButtonIconProps {
  // Tipo de botón (define colores por defecto)
  variant?: 'view' | 'edit' | 'delete' | 'add' | 'download' | 'custom';
  // URL para navegación (si es Link) o función onClick (si es button)
  to?: string;
  onClick?: () => void;
  // Contenido
  icon?: React.ReactNode;
  text?: string;
  // Colores personalizados (anulan los del variant)
  color?: string;
  hoverColor?: string;
  // Props adicionales
  title?: string;
  disabled?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  // Tipo de elemento (button o link)
  type?: 'button' | 'submit' | 'reset';
}

const ButtonIcon: React.FC<ButtonIconProps> = ({
  variant = 'custom',
  to,
  onClick,
  icon,
  text,
  color,
  hoverColor,
  title,
  disabled = false,
  className = '',
  size = 'medium',
  type = 'button'
}) => {
  // Obtener configuración del variant
  const variantConfig = BUTTON_VARIANTS[variant];
  
  // Colores finales (personalizados o del variant)
  const finalColor = color || variantConfig.color;
  const finalHoverColor = hoverColor || variantConfig.hoverColor;
  
  // Icono final (personalizado o del variant)
  const finalIcon = icon || variantConfig.defaultIcon;
  
  // Clases CSS
  const sizeClass = `btn-icon-${size}`;
  const disabledClass = disabled ? 'btn-icon-disabled' : '';
  const combinedClassName = `btn-icon ${sizeClass} ${disabledClass} ${className}`.trim();
  
  // Estilos inline
  const buttonStyle = {
    '--btn-color': finalColor,
    '--btn-hover-color': finalHoverColor
  } as React.CSSProperties;
  
  // Si tiene 'to', es un Link de React Router
  if (to && !disabled) {
    return (
      <Link
        to={to}
        className={combinedClassName}
        style={buttonStyle}
        title={title}
        onClick={onClick}
      >
        <span className="btn-icon-content">
          <span className="btn-icon-icon">{finalIcon}</span>
          {text && <span className="btn-icon-text">{text}</span>}
        </span>
      </Link>
    );
  }
  
  // Si no tiene 'to', es un button normal
  return (
    <button
      type={type}
      className={combinedClassName}
      style={buttonStyle}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="btn-icon-content">
        <span className="btn-icon-icon">{finalIcon}</span>
        {text && <span className="btn-icon-text">{text}</span>}
      </span>
    </button>
  );
};

export default ButtonIcon;