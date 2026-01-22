import React, { useState, useRef, useEffect } from 'react';
import '../../styles/CustomConductaSelect.css';

interface CustomConductaSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    descriptions: { [key: string]: string };
}

const CustomConductaSelect: React.FC<CustomConductaSelectProps> = ({
    value,
    onChange,
    options,
    descriptions
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredOption, setHoveredOption] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    const renderDescriptionList = (text: string) => {
        if (!text) return null;
        const items = text.split(',').map(i => i.trim()).filter(i => i);
        return (
            <ul className="conducta-info-list">
                {items.map((item, idx) => (
                    <li key={idx}>{item.charAt(0).toUpperCase() + item.slice(1)}</li>
                ))}
            </ul>
        );
    };

    return (
        <div className="custom-select-container" ref={containerRef}>
            <div
                className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {value ? (
                    <span>{value}</span>
                ) : (
                    <span className="placeholder">Seleccione...</span>
                )}
                <div className="custom-select-arrow" />
            </div>

            <div className={`custom-select-options ${isOpen ? 'open' : ''}`}>
                {options.map(option => (
                    <div
                        key={option}
                        className={`custom-select-option ${option === value ? 'selected' : ''}`}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHoveredOption(option)}
                        onMouseLeave={() => setHoveredOption(null)}
                    >
                        {option}
                    </div>
                ))}
            </div>

            {isOpen && hoveredOption && descriptions[hoveredOption] && (
                <div className="conducta-info-card">
                    <div className="conducta-info-title">Detalles de la conducta:</div>
                    {renderDescriptionList(descriptions[hoveredOption])}
                </div>
            )}
        </div>
    );
};

export default CustomConductaSelect;
