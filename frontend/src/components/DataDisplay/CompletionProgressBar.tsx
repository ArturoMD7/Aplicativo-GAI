import React from 'react';

interface CompletionProgressBarProps {
    percentage: number;
    missingFields?: string[];
    showMissingDetails?: boolean;
}

const CompletionProgressBar: React.FC<CompletionProgressBarProps> = ({
    percentage,
    missingFields = [],
    showMissingDetails = true
}) => {
    return (
        <div style={{ width: '100%', marginBottom: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: 600, color: '#444' }}>Progreso de la investigación</span>
                <span style={{
                    fontWeight: 'bold',
                    color: percentage === 100 ? '#1e5b4f' : '#840016',
                    fontSize: '1.2em'
                }}>
                    {percentage || 0}%
                </span>
            </div>

            <div style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#e9ecef',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    width: `${percentage || 0}%`,
                    height: '100%',
                    backgroundColor: percentage === 100 ? '#1e5b4f' : '#840016',
                    backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                    backgroundSize: '1rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'width 1s ease-in-out',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                </div>
            </div>

            {showMissingDetails && missingFields.length > 0 && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #ffe3e3' }}>
                    <p style={{ fontSize: '13px', color: '#840016', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <i className="fas fa-exclamation-circle"></i> Atención Requerida ({missingFields.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {missingFields.map((campo: string, idx: number) => (
                            <span key={idx} style={{
                                fontSize: '11px',
                                background: '#fff',
                                color: '#c0392b',
                                padding: '3px 10px',
                                borderRadius: '15px',
                                border: '1px solid #fab1a0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                {campo.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompletionProgressBar;
