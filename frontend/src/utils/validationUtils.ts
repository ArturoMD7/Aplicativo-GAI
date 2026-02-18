export const REQUIRED_DOCS_MAP: { [key: string]: string } = {
    'Reporte': 'Reporte',
    'Citatorio a persona reportada': 'Citatorio_Reportado',
    'Acta Audiencia a persona reportada': 'Acta_Audiencia_Reportado',
    'Dictamen': 'Dictamen',
    'Notificación a persona reportada': 'Notificacion_a_reportado'
};

export const getMissingDocuments = (investigacion: any, documentos: any[]): string[] => {
    const missing: string[] = [];

    // 0. Check for "Sin Elementos" Special Case
    if (investigacion?.sin_elementos) {
        // Only Reporte and Dictamen required
        const requiredSpecial = ['Reporte', 'Dictamen'];

        requiredSpecial.forEach(reqType => {
            const exists = documentos.some(d => d.tipo === reqType);
            if (!exists) missing.push(reqType);
        });

        return missing;
    }

    // 1. Check Mandatory Base Docs
    Object.entries(REQUIRED_DOCS_MAP).forEach(([friendlyName, backendKey]) => {
        // Check if doc exists by backendKey (tipo)
        // Note: Some backend implementations might store the friendly name or key. 
        // Based on previous code: doc.tipo === 'Reporte', 'Citatorio_Reportado' etc.
        // Also checking names just in case.
        const exists = documentos.some(d =>
            d.tipo === backendKey ||
            d.tipo === friendlyName // fallback
        );
        if (!exists) missing.push(friendlyName);
    });

    // 2. Conditional: Evidencia de medidas preventivas
    if (investigacion?.conductas && (
        investigacion.conductas.toLowerCase().includes('acoso sexual') ||
        investigacion.conductas.toLowerCase().includes('hostigamiento')
    )) {
        const exists = documentos.some(d =>
            d.tipo === 'Evidencia de medidas preventivas' ||
            d.nombre_archivo.toLowerCase().includes('evidencia')
        );
        if (!exists) missing.push('Evidencia de medidas preventivas');
    }

    // 3. Conditional: Convenio de pago -> Moved to Finalizacion Logic
    // if (investigacion?.economica) {
    //     const exists = documentos.some(d =>
    //         d.tipo === 'Convenio de pago' ||
    //         d.nombre_archivo.toLowerCase().includes('convenio')
    //     );
    //     if (!exists) missing.push('Convenio de pago');
    // }

    return missing;
};
