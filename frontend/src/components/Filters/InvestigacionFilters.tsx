import React from 'react';
import { FiFilter } from 'react-icons/fi';
import { CONDUCTAS_POSIBLES, GERENCIA_CHOICES } from '../../data/investigacionConstants';

interface InvestigacionFiltersProps {
    selectedGerencia: string;
    onGerenciaChange: (value: string) => void;
    selectedConducta: string;
    onConductaChange: (value: string) => void;
}

const InvestigacionFilters: React.FC<InvestigacionFiltersProps> = ({
    selectedGerencia,
    onGerenciaChange,
    selectedConducta,
    onConductaChange,
}) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '1px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
                <FiFilter style={{ color: '#666', marginRight: '5px' }} />
                <select
                    value={selectedGerencia}
                    onChange={(e) => onGerenciaChange(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    <option value="">Todas las Gerencias</option>
                    {GERENCIA_CHOICES.map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '20px' }}>
                <FiFilter style={{ color: '#666', marginRight: '5px' }} />
                <select
                    value={selectedConducta}
                    onChange={(e) => onConductaChange(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    <option value="">Todas las Conductas</option>
                    {CONDUCTAS_POSIBLES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default InvestigacionFilters;
