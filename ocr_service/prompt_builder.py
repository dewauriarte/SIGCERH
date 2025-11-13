"""
Construcción de prompts para Gemini OCR
Basado en SPRINT_01_SETUP_GEMINI.md
"""

def build_acta_prompt(metadata: dict) -> str:
    """
    Construye el prompt para Gemini basado en la metadata del acta
    
    Args:
        metadata: {
            'anio_lectivo': 1995,
            'grado': 'Quinto Grado',
            'seccion': 'A',
            'turno': 'MAÑANA',
            'tipo_evaluacion': 'FINAL',
            'areas': [
                {'posicion': 1, 'nombre': 'MATEMÁTICA', 'codigo': 'MAT'},
                {'posicion': 2, 'nombre': 'COMUNICACIÓN', 'codigo': 'COM'},
                ...
            ]
        }
    
    Returns:
        str: Prompt formateado para Gemini
    """
    
    anio = metadata.get('anio_lectivo', 'N/A')
    grado = metadata.get('grado', 'N/A')
    seccion = metadata.get('seccion', 'N/A')
    turno = metadata.get('turno', 'N/A')
    areas = metadata.get('areas', [])
    num_areas = len(areas)
    
    # Construir plantilla de áreas
    plantilla_areas = []
    for area in areas:
        posicion = area.get('posicion', 0)
        nombre = area.get('nombre', 'N/A')
        codigo = area.get('codigo', 'N/A')
        plantilla_areas.append(f"{posicion}. {nombre} ({codigo})")
    
    # Si no hay áreas, generar plantilla estándar de secundaria
    if not areas or len(areas) == 0:
        areas = [
            {'posicion': 1, 'nombre': 'MATEMÁTICA', 'codigo': 'MAT'},
            {'posicion': 2, 'nombre': 'COMUNICACIÓN', 'codigo': 'COM'},
            {'posicion': 3, 'nombre': 'INGLÉS', 'codigo': 'ING'},
            {'posicion': 4, 'nombre': 'ARTE', 'codigo': 'ART'},
            {'posicion': 5, 'nombre': 'HISTORIA, GEOGRAFÍA Y ECONOMÍA', 'codigo': 'HGE'},
            {'posicion': 6, 'nombre': 'FORMACIÓN CIUDADANA Y CÍVICA', 'codigo': 'FCC'},
            {'posicion': 7, 'nombre': 'PERSONA, FAMILIA Y RELACIONES HUMANAS', 'codigo': 'PFRH'},
            {'posicion': 8, 'nombre': 'EDUCACIÓN FÍSICA', 'codigo': 'EFI'},
            {'posicion': 9, 'nombre': 'EDUCACIÓN RELIGIOSA', 'codigo': 'ERE'},
            {'posicion': 10, 'nombre': 'CIENCIA, TECNOLOGÍA Y AMBIENTE', 'codigo': 'CTA'},
            {'posicion': 11, 'nombre': 'EDUCACIÓN PARA EL TRABAJO', 'codigo': 'EPT'},
        ]
        plantilla_areas = []
        for area in areas:
            posicion = area.get('posicion', 0)
            nombre = area.get('nombre', 'N/A')
            codigo = area.get('codigo', 'N/A')
            plantilla_areas.append(f"{posicion}. {nombre} ({codigo})")
        num_areas = len(areas)
    
    plantilla_areas_str = '\n'.join(plantilla_areas)
    
    prompt = f"""
🎯 ANÁLISIS OCR DE ACTA DE EVALUACIÓN ESCOLAR

📋 INFORMACIÓN DEL ACTA:
- Año Lectivo: {anio}
- Grado: {grado}
- Sección: {seccion}
- Turno: {turno}
- Número de áreas curriculares: {num_areas}

📚 ÁREAS CURRICULARES (EN ORDEN):
{plantilla_areas_str}

🔍 TU TAREA:
Analiza CUIDADOSAMENTE esta imagen de un acta de evaluación escolar peruana.
La imagen contiene una tabla con estudiantes y sus calificaciones.

⚠️ IMPORTANTE - LEE CON EXTREMA ATENCIÓN:
1. Esta es una imagen ESCANEADA con texto MANUSCRITO e IMPRESO mezclado
2. Algunos números pueden estar borrosos, tachados o mal escritos
3. Las notas están en una escala de 0-20 (sistema peruano)
4. DEBES extraer TODOS los estudiantes sin excepción
5. Lee fila por fila de arriba hacia abajo
6. Las notas van de izquierda a derecha siguiendo el orden de las áreas
7. Presta atención especial a:
   - Números manuscritos que pueden parecer otros números (ej: 3 vs 8, 1 vs 7)
   - Notas con decimales o barras diagonales (/)
   - Campos vacíos, tachados o con "//", "-"
   - La columna Situación Final: P (Promovido - sin desaprobadas), A (Aprobado - con arrastres), R (Reprobado/Retirado)

📊 ESTRUCTURA DE LA TABLA:
Columnas típicas (de izquierda a derecha):
1. Nº Orden
2. Código Alumno (opcional, puede no existir)
3. Apellidos y Nombres
4. Sexo (M/F o H/M)
5. Notas de las {num_areas} áreas (columnas con números 0-20)
6. Comportamiento (0-20)
7. Situación Final:
   - P = Promovido (aprobó TODAS las áreas sin ninguna desaprobada)
   - A = Aprobado con arrastres (aprobó el año PERO tiene algunas áreas desaprobadas)
   - R = Reprobado (desaprobó o se retiró)

🎯 EXTRACCIÓN REQUERIDA - CAMPOS OBLIGATORIOS:
Para CADA estudiante (CADA fila de la tabla), extrae EXACTAMENTE estos campos:

1. **numero** (int): Número de orden (1, 2, 3...)
2. **codigo** (string): Código del estudiante (puede ser "" si no existe)
3. **tipo** (string): "G" (Gratuito) o "P" (Pagante) - busca en la tabla, si no existe usa "G"
4. **apellido_paterno** (string): Primer apellido en MAYÚSCULAS - NUNCA VACÍO
5. **apellido_materno** (string): Segundo apellido en MAYÚSCULAS - NUNCA VACÍO
6. **nombres** (string): Nombres de pila en MAYÚSCULAS - NUNCA VACÍO
7. **sexo** (string): "M" o "F"
8. **notas** (array de números): EXACTAMENTE {num_areas} notas (0-20 o null)
9. **comportamiento** (string): Nota de comportamiento (puede ser letra A-D o número 0-20)
10. **asignaturas_desaprobadas** (int): Cantidad de notas menores a 11 (cuenta las desaprobadas)
11. **situacion_final** (string): "P", "A" o "R"
12. **observaciones** (string o null): Anotaciones especiales

⚠️ CRÍTICO - NOMBRES:
- La columna "Apellidos y Nombres" viene en formato: "APELLIDO_PAT APELLIDO_MAT, Nombres"
- Ejemplo: "GARCÍA LÓPEZ, Juan Carlos" → apellido_paterno="GARCÍA", apellido_materno="LÓPEZ", nombres="JUAN CARLOS"
- Si solo hay un apellido, repite el mismo: "PÉREZ" → apellido_paterno="PÉREZ", apellido_materno="PÉREZ"
- NUNCA dejes los nombres vacíos ("" o null)
- Si no puedes leer el nombre claramente, escribe "ILEGIBLE" pero NUNCA lo dejes vacío

✅ FORMATO DE RESPUESTA JSON (copia EXACTAMENTE esta estructura):

{{
  "estudiantes": [
    {{
      "numero": 1,
      "codigo": "12345",
      "tipo": "G",
      "apellido_paterno": "GARCÍA",
      "apellido_materno": "LÓPEZ",
      "nombres": "JUAN CARLOS",
      "sexo": "M",
      "notas": [14, 15, 16, 12, 11, 10, 13, 15, 14, 11, 12],
      "comportamiento": "18",
      "asignaturas_desaprobadas": 2,
      "situacion_final": "A",
      "observaciones": null
    }},
    {{
      "numero": 2,
      "codigo": "",
      "tipo": "G",
      "apellido_paterno": "MARTÍNEZ",
      "apellido_materno": "SILVA",
      "nombres": "MARÍA ELENA",
      "sexo": "F",
      "notas": [16, 17, 18, 15, 14, 13, 16, 17, 15, 14, 15],
      "comportamiento": "19",
      "asignaturas_desaprobadas": 0,
      "situacion_final": "P",
      "observaciones": null
    }}
  ]
}}

🚨 REGLAS CRÍTICAS:
✓ Extrae TODOS los estudiantes de la tabla (si hay 25 filas, extrae las 25)
✓ Mantén el orden exacto de las notas según las áreas curriculares
✓ Si una nota no es legible, usa null en lugar de adivinar
✓ Los nombres deben estar en MAYÚSCULAS
✓ NUNCA dejes apellido_paterno, apellido_materno o nombres vacíos ("" o null)
✓ Si no puedes leer un nombre, escribe "ILEGIBLE" pero NO lo dejes vacío
✓ NO inventes datos - solo extrae lo que ves
✓ NO agregues explicaciones - solo el JSON
✓ Verifica que el número de notas coincida con {num_areas} áreas
✓ Cuenta SIEMPRE las asignaturas desaprobadas (notas < 11)
✓ Cada estudiante DEBE tener exactamente estos campos: numero, codigo, tipo, apellido_paterno, apellido_materno, nombres, sexo, notas, comportamiento, asignaturas_desaprobadas, situacion_final, observaciones

🔍 CÓMO EXTRAER NOMBRES:
La columna "Apellidos y Nombres" típicamente tiene formato:
- "GARCÍA LÓPEZ, Juan Carlos" → separa por coma
- Antes de la coma = apellidos (separa primero del segundo)
- Después de la coma = nombres

Si solo ves un apellido:
- "PÉREZ, María" → apellido_paterno="PÉREZ", apellido_materno="PÉREZ", nombres="MARÍA"

Si el texto está muy borroso:
- Intenta descifrar lo máximo posible
- Si es imposible leer, usa "ILEGIBLE" pero NUNCA dejes vacío

🎓 CONOCIMIENTO CONTEXTUAL:
- Sistema peruano: notas de 0-20, siendo 11+ aprobado
- "//" significa que el curso no aplica o no tiene nota
- Situación Final:
  * P = Promovido (pase directo sin ninguna materia desaprobada)
  * A = Aprobado (terminó con algunas materias desaprobadas para recuperar)
  * R = Reprobado (no alcanzó el mínimo o se retiró)
- El comportamiento suele ser una letra (A, B, C, D) o número (0-20)

¡Adelante! Analiza la imagen con precisión quirúrgica.
"""
    
    return prompt.strip()


def validate_metadata(metadata: dict) -> tuple[bool, str]:
    """
    Valida que la metadata tenga los campos requeridos
    
    Returns:
        (is_valid, error_message)
    """
    required_fields = ['anio_lectivo', 'grado', 'seccion', 'turno', 'areas']
    
    for field in required_fields:
        if field not in metadata:
            return False, f"Campo requerido faltante: {field}"
    
    areas = metadata.get('areas', [])
    if not isinstance(areas, list) or len(areas) == 0:
        return False, "El campo 'areas' debe ser una lista no vacía"
    
    # Validar estructura de áreas
    for i, area in enumerate(areas):
        if not isinstance(area, dict):
            return False, f"Área {i} debe ser un objeto"
        if 'nombre' not in area:
            return False, f"Área {i} no tiene campo 'nombre'"
        if 'posicion' not in area:
            return False, f"Área {i} no tiene campo 'posicion'"
    
    return True, ""

