import apiClient from './apliClient';

export const auditoriaService = {
    /**
     * Registra una acción en el log de auditoría.
     * @param action Acción realizada (ej. 'UPDATE', 'VIEW', 'DELETE')
     * @param description Descripción legible de lo que hizo el usuario
     * @param investigacionId ID de la investigación relacionada (opcional)
     * @param endpoint Endpoint o ruta relacionada (opcional)
     */
    logAction: async (
        action: string,
        description: string,
        investigacionId?: number,
        endpoint?: string
    ) => {
        try {
            await apiClient.post('/api/auditoria/create-log/', {
                action,
                description,
                investigacion_id: investigacionId,
                endpoint: endpoint || window.location.pathname
            });
        } catch (error) {
            // Fallar silenciosamente para no interrumpir el flujo del usuario
            console.error('Error creating audit log:', error);
        }
    }
};
