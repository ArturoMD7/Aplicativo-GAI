CAMPOS_EVALUADOS = [
    ### INFORMACION GENERAL
    {"campo": "nombre_corto", "obligatorio": True, "valor": 0.5},
    {"campo": "procedencia", "obligatorio": True, "valor": 0.5},
    {"campo": "gravedad", "obligatorio": True, "valor": 0.5},
    {"campo": "conductas", "obligatorio": True, "valor": 0.5},
    {"campo": "gerencia_responsable", "obligatorio": True, "valor": 0.5},
    

    ### TIEMPOS
    {"campo": "fecha_reporte", "obligatorio": True, "valor": 0.5},
    {"campo": "fecha_conocimiento_hechos", "obligatorio": True, "valor": 0.5},
    {"campo": "fecha_prescripcion", "obligatorio": True, "valor": 0.5},
   
    ### LUGAR
    {"campo": "lugar", "obligatorio": True, "valor": 0.5},
    {"campo": "centro_trabajo", "obligatorio": True, "valor": 0.5},
    {"campo": "observaciones", "obligatorio": True, "valor": 0.5},

    ### PERSONAS
    {"campo": "reportantes", "obligatorio": True, "valor": 0.5},
    {"campo": "involucrados", "obligatorio": True, "valor": 0.5},
    {"campo": "testigos", "obligatorio": True, "valor": 0.5},
    {"campo": "investigadores", "obligatorio": True, "valor": 1},


    ### SANCION (FINALIZAR)
    {"campo": "sancion", "obligatorio": True, "valor": 5},
]

DOCUMENTOS_REQUERIDOS = [
    {"tipo": "Reporte", "valor": 7.7},
    {"tipo": "Citatorio_Reportado", "valor": 7.7},
    {"tipo": "Citatorio_Ratificante", "valor": 7.7},
    {"tipo": "Citatorio_Testigo", "valor": 7.7},
    {"tipo": "Acta_Comparecencia_Ratificante", "valor": 7.7},
    {"tipo": "Acta_Testigo", "valor": 7.7},
    {"tipo": "Acta_Investigacion", "valor": 7.7},
    {"tipo": "Dictamen", "valor": 7.7},
    {"tipo": "Resultado", "valor": 7.7},
    {"tipo": "Pruebas", "valor": 7.7},
    {"tipo": "NotificacionConclusion", "valor": 10},
]


def calcular_completitud(investigacion):
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
            campos_faltantes.append(f"documento:{d['tipo']}")

    return {
        "porcentaje": round(valor_completo, 2),
        "faltantes": campos_faltantes
    }