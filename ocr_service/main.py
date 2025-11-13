"""
Servicio Flask para procesamiento OCR con Gemini
"""

import os
import sys
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from gemini_client import GeminiOCRClient

# Cargar variables de entorno
load_dotenv()

# Inicializar Flask
app = Flask(__name__)
CORS(app)  # Permitir CORS para requests desde Node.js

# Configuración
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-pro')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))

# Inicializar cliente Gemini
gemini_client = None

try:
    if not GEMINI_API_KEY:
        print("⚠️  WARNING: GEMINI_API_KEY no configurada. El servicio no funcionará.")
        print("   Configure la API Key en el archivo .env")
    else:
        gemini_client = GeminiOCRClient(GEMINI_API_KEY, GEMINI_MODEL)
        print("✓ Cliente Gemini inicializado")
except Exception as e:
    print(f"❌ Error al inicializar Gemini: {e}")
    print("   El servicio estará disponible pero retornará errores.")


@app.route('/health', methods=['GET'])
def health():
    """
    Health check del servicio
    """
    status = {
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'gemini_configured': gemini_client is not None,
        'gemini_model': GEMINI_MODEL if gemini_client else None,
    }
    
    # Verificar que Gemini funcione (opcional, no bloqueante)
    if gemini_client:
        try:
            gemini_healthy = gemini_client.health_check()
            status['gemini_healthy'] = gemini_healthy
        except Exception as e:
            status['gemini_healthy'] = False
            status['gemini_error'] = str(e)
    
    # Devolver 200 si está configurado, aunque health check falle
    # El health check puede fallar pero el procesamiento real funcionar
    status_code = 200 if gemini_client is not None else 503
    return jsonify(status), status_code


@app.route('/api/ocr/test-image', methods=['POST'])
def test_image():
    """
    Test simple: ¿Puede Gemini ver la imagen?
    """
    if not gemini_client:
        return jsonify({
            'success': False,
            'error': 'Servicio OCR no disponible. API Key no configurada.',
        }), 503
    
    try:
        data = request.get_json()
        
        if not data or 'image_base64' not in data:
            return jsonify({
                'success': False,
                'error': 'Se requiere image_base64',
            }), 400
        
        # Cargar imagen
        image = gemini_client.load_image_from_base64(data['image_base64'])
        
        # Prompt SUPER simple
        simple_prompt = "Describe qué ves en esta imagen. ¿Es un documento? ¿Qué tipo? ¿Puedes leer algún texto?"
        
        print(f"\n🧪 TEST SIMPLE DE IMAGEN")
        print(f"Enviando imagen a Gemini con prompt simple...")
        
        response = gemini_client.model.generate_content([image, simple_prompt])
        
        return jsonify({
            'success': True,
            'response': response.text,
            'image_size': image.size,
            'image_mode': image.mode,
        }), 200
        
    except Exception as e:
        print(f"❌ Error en test: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
        }), 500


@app.route('/api/ocr/process', methods=['POST'])
def process_ocr():
    """
    Procesa un acta con OCR
    
    Request Body (JSON):
    {
        "image_base64": "...",  // o "image_path": "/path/to/image.jpg"
        "metadata": {
            "anio_lectivo": 1995,
            "grado": "Quinto Grado",
            "seccion": "A",
            "turno": "MAÑANA",
            "tipo_evaluacion": "FINAL",
            "colegio_origen": "I.E. San Martín",
            "areas": [
                {"posicion": 1, "nombre": "MATEMÁTICA", "codigo": "MAT"},
                ...
            ]
        }
    }
    
    Response:
    {
        "success": true,
        "data": {
            "totalEstudiantes": 30,
            "estudiantes": [...],
            "metadataActa": {...},
            "confianza": 95,
            "advertencias": [],
            "procesadoCon": "gemini-2.5-pro",
            "tiempoProcesamientoMs": 8500
        }
    }
    """
    if not gemini_client:
        return jsonify({
            'success': False,
            'error': 'Servicio OCR no disponible. API Key no configurada.',
        }), 503
    
    try:
        # Parsear request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body vacío',
            }), 400
        
        metadata = data.get('metadata')
        if not metadata:
            return jsonify({
                'success': False,
                'error': 'Metadata requerida',
            }), 400
        
        # Cargar imagen
        image = None
        
        if 'image_base64' in data:
            # Imagen como base64
            image_base64 = data['image_base64']
            image = gemini_client.load_image_from_base64(image_base64)
        elif 'image_path' in data:
            # Imagen como ruta
            image_path = data['image_path']
            if not os.path.exists(image_path):
                return jsonify({
                    'success': False,
                    'error': f'Imagen no encontrada: {image_path}',
                }), 404
            image = gemini_client.load_and_prepare_image(image_path)
        else:
            return jsonify({
                'success': False,
                'error': 'Imagen requerida (image_base64 o image_path)',
            }), 400
        
        # Procesar con Gemini
        resultado = gemini_client.process_acta(image, metadata)
        
        return jsonify({
            'success': True,
            'data': resultado,
        }), 200
    
    except ValueError as e:
        # Error de validación
        return jsonify({
            'success': False,
            'error': f'Error de validación: {str(e)}',
        }), 400
    
    except RuntimeError as e:
        # Error de procesamiento
        return jsonify({
            'success': False,
            'error': f'Error de procesamiento: {str(e)}',
        }), 500
    
    except Exception as e:
        # Error inesperado
        print(f"❌ Error inesperado: {e}")
        return jsonify({
            'success': False,
            'error': f'Error interno del servidor: {str(e)}',
        }), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint no encontrado',
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Error interno del servidor',
    }), 500


if __name__ == '__main__':
    print("=" * 60)
    print("🧠 SIGCERH - Servicio OCR con Gemini")
    print("=" * 60)
    print(f"Modelo: {GEMINI_MODEL}")
    print(f"Puerto: {FLASK_PORT}")
    print(f"API Key configurada: {'✓' if GEMINI_API_KEY else '✗'}")
    print("=" * 60)
    
    if not GEMINI_API_KEY:
        print("\n⚠️  ADVERTENCIA: Configura GEMINI_API_KEY en .env")
        print("   Ver: PLANIFICACION/03_IA_OCR/COMO_OBTENER_API_KEY.md\n")
    
    app.run(
        host='0.0.0.0',
        port=FLASK_PORT,
        debug=os.getenv('FLASK_ENV') == 'development'
    )

