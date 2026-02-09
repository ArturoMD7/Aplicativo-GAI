CAMPOS_EVALUADOS = [
    
]

DOCUMENTOS_REQUERIDOS = [
    {"tipo": "Reporte", "valor": 20},
    {"tipo": "Citatorio_Reportado", "valor": 20},
    {"tipo": "Acta_Audiencia_Reportado", "valor": 20},
    {"tipo": "Dictamen", "valor": 20},
    {"tipo": "Notificacion_a_reportado", "valor": 20},
]

def calcular_completitud(investigacion):
    # Si es "Sin Elementos", la lógica es específica:
    # Solo Reporte(20%) y Dictamen(80%)
    if getattr(investigacion, 'sin_elementos', False):
        valor_completo = 0
        campos_faltantes = []
        
        docs = investigacion.documentos.all()
        tipos_presentes = {d.tipo for d in docs}

        # Reglas específicas para Sin Elementos
        # 1. Reporte (20%)
        if "Reporte" in tipos_presentes:
            valor_completo += 20
        else:
            campos_faltantes.append("Documento: Reporte")

        # 2. Dictamen (80%)
        if "Dictamen" in tipos_presentes:
            valor_completo += 80
        else:
            campos_faltantes.append("Documento: Dictamen")
            
        return {
            "porcentaje": round(valor_completo, 2),
            "faltantes": campos_faltantes
        }

    # Lógica Estándar (si no es sin_elementos)
    valor_completo = 0
    campos_faltantes = []

    for c in CAMPOS_EVALUADOS:
        valor = getattr(investigacion, c["campo"], None)

        if valor not in [None, "", []]:
            valor_completo += c["valor"]
        elif c["obligatorio"]:
            campos_faltantes.append(c["campo"])

    docs = investigacion.documentos.all()
    tipos_presentes = {d.tipo for d in docs}

    for d in DOCUMENTOS_REQUERIDOS:
        if d["tipo"] in tipos_presentes:
            valor_completo += d["valor"]
        else:
            campos_faltantes.append(f"Documento: {d['tipo']}")

    return {
        "porcentaje": round(valor_completo, 2),
        "faltantes": campos_faltantes
    }