"""
Parseo de respuestas JSON de Gemini
"""

import re
import json
from typing import Dict, Any, List


def extract_json_from_response(response_text: str) -> dict:
    """
    Extrae JSON de la respuesta de Gemini
    Maneja markdown code blocks y JSON plano
    
    Args:
        response_text: Texto de respuesta de Gemini
    
    Returns:
        dict: Datos parseados
    
    Raises:
        ValueError: Si no se puede parsear el JSON
    """
    # Intentar extraer JSON de markdown code block
    json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL | re.IGNORECASE)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Intentar extraer JSON de cualquier code block
        code_match = re.search(r'```\s*(.*?)\s*```', response_text, re.DOTALL)
        if code_match:
            json_str = code_match.group(1)
        else:
            # Asumir que toda la respuesta es JSON
            json_str = response_text
    
    # Parsear JSON
    try:
        data = json.loads(json_str)
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"No se pudo parsear JSON: {e}")


def validate_ocr_response(data: dict) -> tuple[bool, str]:
    """
    Valida la estructura de la respuesta OCR
    
    Returns:
        (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "La respuesta debe ser un objeto JSON"
    
    if 'estudiantes' not in data:
        return False, "Falta el campo 'estudiantes'"
    
    estudiantes = data['estudiantes']
    if not isinstance(estudiantes, list):
        return False, "El campo 'estudiantes' debe ser una lista"
    
    if len(estudiantes) == 0:
        return False, "No se detectaron estudiantes en el acta"
    
    # Validar estructura de cada estudiante (solo campos críticos)
    for i, estudiante in enumerate(estudiantes):
        if not isinstance(estudiante, dict):
            return False, f"Estudiante {i+1} no es un objeto"
        
        # Validar que tenga al menos algún nombre o apellido
        tiene_nombre = any(key in estudiante for key in ['nombres', 'apellido_paterno', 'apellido_materno', 'nombre_completo'])
        if not tiene_nombre:
            return False, f"Estudiante {i+1}: debe tener al menos un campo de nombre"
        
        # Validar notas si existen
        if 'notas' in estudiante:
            if not isinstance(estudiante['notas'], list):
                return False, f"Estudiante {i+1}: 'notas' debe ser una lista"
            
            for j, nota in enumerate(estudiante['notas']):
                if nota is not None and (not isinstance(nota, (int, float)) or nota < 0 or nota > 20):
                    return False, f"Estudiante {i+1}, nota {j+1}: valor inválido ({nota}). Debe estar entre 0-20"
        
        # Validar sexo si existe (flexible)
        if 'sexo' in estudiante and estudiante['sexo'] is not None:
            sexo_str = str(estudiante['sexo']).upper().strip()
            if sexo_str not in ['M', 'F', 'MASCULINO', 'FEMENINO', 'MALE', 'FEMALE', 'H', 'HOMBRE', 'MUJER']:
                return False, f"Estudiante {i+1}: sexo inválido ({estudiante['sexo']})"
        
        # No validar situacion_final estrictamente, la normalizaremos después
    
    return True, ""


def normalize_sexo(sexo: Any) -> str:
    """
    Normaliza el sexo a 'M' o 'F'
    
    Args:
        sexo: Sexo en cualquier formato
    
    Returns:
        str: 'M' (Masculino) o 'F' (Femenino)
    """
    if sexo is None:
        return 'M'
    
    sexo_str = str(sexo).upper().strip()
    
    # Mapeo de variaciones comunes
    masculino_variaciones = ['M', 'MASCULINO', 'MALE', 'H', 'HOMBRE', 'VARON', 'V']
    femenino_variaciones = ['F', 'FEMENINO', 'FEMALE', 'MUJER', 'DAMA']
    
    if any(var in sexo_str for var in masculino_variaciones):
        return 'M'
    elif any(var in sexo_str for var in femenino_variaciones):
        return 'F'
    
    # Por defecto, retornar masculino
    return 'M'


def normalize_situacion_final(situacion: Any) -> str:
    """
    Normaliza la situación final del estudiante a 'P', 'A' o 'R'
    
    IMPORTANTE:
    - P (Promovido): Aprobó TODAS las áreas sin ninguna desaprobada
    - A (Aprobado con arrastres): Aprobó el año PERO tiene áreas desaprobadas
    - R (Reprobado): Desaprobó o se retiró
    
    Args:
        situacion: Puede venir como string, int, bool o None
    
    Returns:
        str: 'P' (Promovido), 'A' (Aprobado), 'R' (Reprobado/Retirado)
    """
    # Si viene vacío o es guión, retornar R (probablemente retirado)
    if situacion is None or str(situacion).strip() in ['', '-', 'N/A', 'NONE', 'NULL']:
        return 'R'
    
    situacion_str = str(situacion).upper().strip()
    
    # PROMOVIDO: Pase directo sin materias desaprobadas
    promovido_variaciones = ['P', 'PROMOVIDO', 'PROMOCIONADO', 'PASE DIRECTO', 'PASE', 'DIRECTO']
    
    # APROBADO CON ARRASTRES: Terminó con algunas desaprobadas
    aprobado_variaciones = ['A', 'APROBADO', 'APROBADA', 'PASS', 'OK']
    
    # REPROBADO: No alcanzó mínimo o muchas desaprobadas o retirado
    reprobado_variaciones = ['R', 'REPROBADO', 'REPROBADA', 'RETIRADO', 'RETIRADA', 'DESAPROBADO', 'DESAPROBADA', 'FAIL', 'NO', 'D', 'REPITENTE']
    
    # Verificar en orden: P, A, R
    if any(var in situacion_str for var in promovido_variaciones):
        return 'P'
    elif any(var in situacion_str for var in aprobado_variaciones):
        return 'A'
    elif any(var in situacion_str for var in reprobado_variaciones):
        return 'R'
    
    # Si no coincide con nada y llegó hasta aquí, asumir retirado
    return 'R'


def convert_to_backend_format(gemini_data: dict, metadata: dict) -> dict:
    """
    Convierte el formato de Gemini al formato esperado por el backend Node.js
    
    Args:
        gemini_data: Datos parseados de Gemini
        metadata: Metadata original del acta
    
    Returns:
        dict: Datos en formato compatible con backend
    """
    estudiantes_gemini = gemini_data.get('estudiantes', [])
    estudiantes_backend = []
    
    for i, est in enumerate(estudiantes_gemini):
        # DEBUG: Imprimir estudiante completo
        print(f"\n🔍 DEBUG - Estudiante #{i+1} RAW de Gemini:")
        print(f"{'-'*70}")
        import json
        print(json.dumps(est, indent=2, ensure_ascii=False))
        print(f"{'-'*70}")
        
        # Calcular asignaturas desaprobadas (notas < 11)
        notas = est.get('notas', [])
        
        # IMPORTANTE: Verificar si notas es array o dict
        if isinstance(notas, list):
            asignaturas_desaprobadas = sum(1 for nota in notas if nota is not None and nota < 11)
        elif isinstance(notas, dict):
            asignaturas_desaprobadas = sum(1 for nota in notas.values() if nota is not None and nota < 11)
        else:
            asignaturas_desaprobadas = 0
        
        # Construir nombre completo - INTENTAR MÚLTIPLES FORMATOS
        apellido_pat = str(est.get('apellido_paterno', '') or '').strip()
        apellido_mat = str(est.get('apellido_materno', '') or '').strip()
        nombres = str(est.get('nombres', '') or '').strip()
        
        # FALLBACK 1: nombre_completo
        if not apellido_pat and not nombres and 'nombre_completo' in est:
            nombre_completo = str(est.get('nombre_completo', '')).strip()
            if nombre_completo:
                # Intentar separar: "APELLIDO_PAT APELLIDO_MAT, Nombres"
                if ',' in nombre_completo:
                    apellidos, nombres = nombre_completo.split(',', 1)
                    partes_apellidos = apellidos.strip().split(' ', 1)
                    apellido_pat = partes_apellidos[0] if len(partes_apellidos) > 0 else ''
                    apellido_mat = partes_apellidos[1] if len(partes_apellidos) > 1 else ''
                    nombres = nombres.strip()
                else:
                    # Si no hay coma, asumir todo es el nombre completo
                    partes = nombre_completo.strip().split(' ')
                    apellido_pat = partes[0] if len(partes) > 0 else ''
                    apellido_mat = partes[1] if len(partes) > 1 else ''
                    nombres = ' '.join(partes[2:]) if len(partes) > 2 else ''
        
        # FALLBACK 2: apellidos_y_nombres (formato alternativo)
        if not apellido_pat and not nombres and 'apellidos_y_nombres' in est:
            apellidos_y_nombres = str(est.get('apellidos_y_nombres', '')).strip()
            if apellidos_y_nombres:
                if ',' in apellidos_y_nombres:
                    apellidos, nombres = apellidos_y_nombres.split(',', 1)
                    partes_apellidos = apellidos.strip().split(' ', 1)
                    apellido_pat = partes_apellidos[0] if len(partes_apellidos) > 0 else ''
                    apellido_mat = partes_apellidos[1] if len(partes_apellidos) > 1 else ''
                    nombres = nombres.strip()
                else:
                    partes = apellidos_y_nombres.strip().split(' ')
                    apellido_pat = partes[0] if len(partes) > 0 else ''
                    apellido_mat = partes[1] if len(partes) > 1 else ''
                    nombres = ' '.join(partes[2:]) if len(partes) > 2 else ''
        
        # FALLBACK 3: nombre (campo único)
        if not apellido_pat and not nombres and 'nombre' in est:
            nombre_unico = str(est.get('nombre', '')).strip()
            if nombre_unico:
                partes = nombre_unico.strip().split(' ')
                apellido_pat = partes[0] if len(partes) > 0 else ''
                apellido_mat = partes[1] if len(partes) > 1 else ''
                nombres = ' '.join(partes[2:]) if len(partes) > 2 else ''
        
        # Convertir formato
        # Construir nombreCompleto
        nombre_completo_str = f"{apellido_pat} {apellido_mat}, {nombres}".strip()
        
        # Limpiar espacios duplicados y comas sueltas
        nombre_completo_str = ' '.join(nombre_completo_str.split())
        nombre_completo_str = nombre_completo_str.replace(' ,', ',').replace(',  ', ', ')
        
        # Si quedó vacío o solo puntuación, usar fallback
        if not nombre_completo_str or nombre_completo_str in [',', ', ', '  ,  ', '  ']:
            nombre_completo_str = f"Sin nombre"
            apellido_pat = ''
            apellido_mat = ''
            nombres = ''
        
        estudiante_backend = {
            'numero': est.get('numero', 0),
            'codigo': est.get('codigo', ''),
            'tipo': est.get('tipo', 'G'),
            'nombreCompleto': nombre_completo_str,
            'apellidoPaterno': apellido_pat,
            'apellidoMaterno': apellido_mat,
            'nombres': nombres,
            'sexo': normalize_sexo(est.get('sexo')),
            'notas': notas,
            'comportamiento': str(est.get('comportamiento', '0')),
            'asignaturasDesaprobadas': asignaturas_desaprobadas,
            'situacionFinal': normalize_situacion_final(est.get('situacion_final')),
            'observaciones': est.get('observaciones'),
        }
        estudiantes_backend.append(estudiante_backend)
    
    # Construir respuesta final
    resultado = {
        'totalEstudiantes': len(estudiantes_backend),
        'estudiantes': estudiantes_backend,
        'metadataActa': {
            'anioLectivo': metadata.get('anio_lectivo', 0),
            'grado': metadata.get('grado', ''),
            'seccion': metadata.get('seccion', ''),
            'turno': metadata.get('turno', ''),
            'tipoEvaluacion': metadata.get('tipo_evaluacion', ''),
            'areas': metadata.get('areas', []),
        },
        'confianza': 95,  # Gemini generalmente tiene alta confianza
        'advertencias': [],
        'procesadoCon': 'gemini-2.5-pro',
    }
    
    # Agregar advertencias si hay estudiantes con muchas desaprobadas
    for est in estudiantes_backend:
        if est['asignaturasDesaprobadas'] > 3:
            resultado['advertencias'].append(
                f"Estudiante {est['numero']}: {est['asignaturasDesaprobadas']} asignaturas desaprobadas"
            )
    
    return resultado

