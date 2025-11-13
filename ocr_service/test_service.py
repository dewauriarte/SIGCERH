"""
Script de prueba para el servicio OCR con Gemini
Prueba localmente sin depender del backend Node.js
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Importar módulos del servicio
from gemini_client import GeminiOCRClient
from prompt_builder import build_acta_prompt, validate_metadata
from response_parser import extract_json_from_response, validate_ocr_response, convert_to_backend_format

def print_separator():
    print("=" * 70)

def test_metadata_validation():
    """Prueba la validación de metadata"""
    print("\n🧪 TEST 1: Validación de Metadata")
    print_separator()
    
    # Metadata válida
    valid_metadata = {
        'anio_lectivo': 1995,
        'grado': 'Quinto Grado',
        'seccion': 'A',
        'turno': 'MAÑANA',
        'tipo_evaluacion': 'FINAL',
        'areas': [
            {'posicion': 1, 'nombre': 'MATEMÁTICA', 'codigo': 'MAT'},
            {'posicion': 2, 'nombre': 'COMUNICACIÓN', 'codigo': 'COM'},
        ]
    }
    
    is_valid, error_msg = validate_metadata(valid_metadata)
    print(f"   Metadata válida: {is_valid}")
    if not is_valid:
        print(f"   Error: {error_msg}")
        return False
    
    # Metadata inválida (sin áreas)
    invalid_metadata = {
        'anio_lectivo': 1995,
        'grado': 'Quinto Grado',
        'seccion': 'A',
        'turno': 'MAÑANA',
    }
    
    is_valid, error_msg = validate_metadata(invalid_metadata)
    print(f"   Metadata inválida detectada correctamente: {not is_valid}")
    if is_valid:
        print("   ❌ ERROR: Debería haber detectado metadata inválida")
        return False
    
    print("   ✅ Validación de metadata OK")
    return True

def test_prompt_builder():
    """Prueba la construcción de prompts"""
    print("\n🧪 TEST 2: Construcción de Prompts")
    print_separator()
    
    metadata = {
        'anio_lectivo': 1995,
        'grado': 'Quinto Grado',
        'seccion': 'A',
        'turno': 'MAÑANA',
        'tipo_evaluacion': 'FINAL',
        'colegio_origen': 'I.E. San Martín',
        'areas': [
            {'posicion': 1, 'nombre': 'MATEMÁTICA', 'codigo': 'MAT'},
            {'posicion': 2, 'nombre': 'COMUNICACIÓN', 'codigo': 'COM'},
            {'posicion': 3, 'nombre': 'CIENCIA Y AMBIENTE', 'codigo': 'CYA'},
        ]
    }
    
    prompt = build_acta_prompt(metadata)
    
    # Verificar que el prompt contiene información clave
    checks = [
        ('1995' in prompt, "Año lectivo"),
        ('Quinto Grado' in prompt, "Grado"),
        ('MATEMÁTICA' in prompt, "Área matemática"),
        ('COMUNICACIÓN' in prompt, "Área comunicación"),
        ('3 elementos numéricos' in prompt, "Número de áreas"),
    ]
    
    all_pass = True
    for check, desc in checks:
        status = "✓" if check else "✗"
        print(f"   {status} {desc}")
        if not check:
            all_pass = False
    
    if all_pass:
        print("   ✅ Construcción de prompts OK")
        return True
    else:
        print("   ❌ ERROR: Prompt incompleto")
        return False

def test_gemini_client():
    """Prueba el cliente de Gemini (requiere API Key)"""
    print("\n🧪 TEST 3: Cliente de Gemini")
    print_separator()
    
    api_key = os.getenv('GEMINI_API_KEY', '')
    
    if not api_key:
        print("   ⚠️  GEMINI_API_KEY no configurada")
        print("   Saltando test del cliente (esto es normal si no tienes API Key)")
        return True
    
    try:
        client = GeminiOCRClient(api_key)
        print("   ✓ Cliente inicializado")
        
        # Test de health check
        is_healthy = client.health_check()
        print(f"   ✓ Health check: {'OK' if is_healthy else 'FALLO'}")
        
        if not is_healthy:
            print("   ⚠️  Gemini no responde correctamente")
            print("   Verifica tu API Key y conexión a internet")
            return False
        
        print("   ✅ Cliente de Gemini OK")
        return True
        
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def test_response_parser():
    """Prueba el parser de respuestas JSON"""
    print("\n🧪 TEST 4: Parser de Respuestas")
    print_separator()
    
    # Respuesta simulada de Gemini
    mock_response = '''
```json
{
  "estudiantes": [
    {
      "numero": 1,
      "codigo": "12345",
      "tipo": "G",
      "apellido_paterno": "GARCÍA",
      "apellido_materno": "LÓPEZ",
      "nombres": "JUAN CARLOS",
      "sexo": "M",
      "notas": [14, 15, 16],
      "comportamiento": "18",
      "asignaturas_desaprobadas": 0,
      "situacion_final": "A",
      "observaciones": null
    }
  ]
}
```
    '''
    
    try:
        # Extraer JSON
        data = extract_json_from_response(mock_response)
        print("   ✓ JSON extraído correctamente")
        
        # Validar estructura
        is_valid, error_msg = validate_ocr_response(data)
        if not is_valid:
            print(f"   ❌ ERROR: {error_msg}")
            return False
        print("   ✓ Estructura validada")
        
        # Convertir a formato backend
        metadata = {
            'anio_lectivo': 1995,
            'grado': 'Quinto Grado',
            'seccion': 'A',
            'turno': 'MAÑANA',
            'tipo_evaluacion': 'FINAL',
            'colegio_origen': 'I.E. San Martín',
            'areas': [
                {'posicion': 1, 'nombre': 'MATEMÁTICA', 'codigo': 'MAT'},
                {'posicion': 2, 'nombre': 'COMUNICACIÓN', 'codigo': 'COM'},
                {'posicion': 3, 'nombre': 'CIENCIA Y AMBIENTE', 'codigo': 'CYA'},
            ]
        }
        
        resultado = convert_to_backend_format(data, metadata)
        print("   ✓ Conversión a formato backend OK")
        
        # Verificar campos clave
        assert resultado['totalEstudiantes'] == 1
        assert resultado['estudiantes'][0]['apellidoPaterno'] == 'GARCÍA'
        assert resultado['estudiantes'][0]['situacionFinal'] == 'A'
        print("   ✓ Datos convertidos correctamente")
        
        print("   ✅ Parser de respuestas OK")
        return True
        
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)}")
        return False

def main():
    """Ejecutar todos los tests"""
    print("\n")
    print("=" * 70)
    print("🧠 SIGCERH - Test del Servicio OCR con Gemini")
    print("=" * 70)
    
    tests = [
        test_metadata_validation,
        test_prompt_builder,
        test_response_parser,
        test_gemini_client,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"\n   ❌ ERROR INESPERADO: {str(e)}")
            results.append(False)
    
    # Resumen
    print("\n")
    print_separator()
    print("📊 RESUMEN DE TESTS")
    print_separator()
    
    total = len(results)
    passed = sum(results)
    
    print(f"\n   Total: {total}")
    print(f"   Pasados: {passed}")
    print(f"   Fallidos: {total - passed}")
    
    if passed == total:
        print("\n   ✅ TODOS LOS TESTS PASARON")
        print("\n   🎉 El servicio OCR está listo para usarse")
    else:
        print("\n   ⚠️  ALGUNOS TESTS FALLARON")
        print("\n   Revisa los errores arriba para más detalles")
    
    print("\n")
    print_separator()
    print("\n")
    
    sys.exit(0 if passed == total else 1)

if __name__ == '__main__':
    main()

