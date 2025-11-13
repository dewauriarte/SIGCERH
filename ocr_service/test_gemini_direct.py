"""
Test directo de Gemini con imagen
Para verificar si el problema es el prompt o la imagen
"""

import os
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# Configurar Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

# Modelo
model = genai.GenerativeModel('gemini-2.5-pro')

def test_con_imagen_local():
    """Test con imagen local (si tienes una)"""
    print("=" * 70)
    print("🧪 TEST 1: Imagen local")
    print("=" * 70)
    
    # Pedir ruta de imagen
    image_path = input("Ingresa la ruta completa de la imagen del acta: ")
    
    if not os.path.exists(image_path):
        print("❌ Imagen no encontrada")
        return
    
    # Cargar imagen
    image = Image.open(image_path)
    print(f"✓ Imagen cargada: {image.size}, Modo: {image.mode}")
    
    # Prompt SUPER simple
    prompt = """
Describe esta imagen. ¿Qué tipo de documento es? ¿Puedes leer los nombres de los primeros 3 estudiantes?
"""
    
    print("\n🤖 Enviando a Gemini...")
    response = model.generate_content([image, prompt])
    
    print("\n📤 Respuesta de Gemini:")
    print("=" * 70)
    print(response.text)
    print("=" * 70)

def test_lectura_texto():
    """Test simple de lectura de texto"""
    print("\n=" * 70)
    print("🧪 TEST 2: Lectura de texto simple")
    print("=" * 70)
    
    image_path = input("Ingresa la ruta completa de la imagen del acta: ")
    
    if not os.path.exists(image_path):
        print("❌ Imagen no encontrada")
        return
    
    image = Image.open(image_path)
    print(f"✓ Imagen cargada: {image.size}, Modo: {image.mode}")
    
    prompt = """
Extrae el texto que ves en esta imagen, especialmente los nombres de los estudiantes.
Lista solo los nombres, uno por línea.
"""
    
    print("\n🤖 Enviando a Gemini...")
    response = model.generate_content([image, prompt])
    
    print("\n📤 Nombres extraídos:")
    print("=" * 70)
    print(response.text)
    print("=" * 70)

if __name__ == "__main__":
    print("\n🎯 PRUEBA DIRECTA DE GEMINI OCR")
    print("\nEste script prueba si Gemini puede leer la imagen correctamente")
    print("sin toda la complejidad del servicio.")
    print()
    
    try:
        test_con_imagen_local()
        
        continuar = input("\n¿Quieres hacer el test de lectura de texto? (s/n): ")
        if continuar.lower() == 's':
            test_lectura_texto()
            
    except KeyboardInterrupt:
        print("\n\n❌ Prueba cancelada")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

