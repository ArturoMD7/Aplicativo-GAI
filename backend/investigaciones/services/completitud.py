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