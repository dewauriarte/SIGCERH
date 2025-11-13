"""
Script para probar la calidad de carga de imágenes
"""

import sys
from PIL import Image
import io
import base64

def test_base64_conversion(base64_str):
    """Prueba la conversión de base64 a imagen"""
    
    print("="*70)
    print("🧪 PRUEBA DE CALIDAD DE IMAGEN")
    print("="*70)
    
    # Remover prefijo si existe
    if ',' in base64_str:
        prefix = base64_str.split(',', 1)[0]
        base64_str = base64_str.split(',', 1)[1]
        print(f"✓ Prefijo detectado: {prefix}")
    
    # Decodificar
    image_data = base64.b64decode(base64_str)
    print(f"✓ Tamaño de datos: {len(image_data):,} bytes ({len(image_data)/1024:.2f} KB)")
    
    # Cargar imagen
    img = Image.open(io.BytesIO(image_data))
    
    print(f"\n📸 INFORMACIÓN DE LA IMAGEN:")
    print(f"   - Modo: {img.mode}")
    print(f"   - Tamaño: {img.size} ({img.size[0]}x{img.size[1]})")
    print(f"   - Formato: {img.format if hasattr(img, 'format') else 'desconocido'}")
    
    # Verificar si tiene transparencia
    if img.mode in ('RGBA', 'LA', 'P'):
        print(f"   ⚠️  ADVERTENCIA: Imagen con transparencia o paleta ({img.mode})")
        print(f"      Gemini puede no procesarla correctamente")
    else:
        print(f"   ✓ Modo compatible con Gemini")
    
    # Calcular ratio de compresión
    uncompressed_size = img.size[0] * img.size[1] * (4 if img.mode == 'RGBA' else 3)
    compression_ratio = len(image_data) / uncompressed_size * 100
    print(f"   - Tamaño sin comprimir estimado: {uncompressed_size:,} bytes")
    print(f"   - Ratio de compresión: {compression_ratio:.2f}%")
    
    print(f"\n✅ Imagen cargada correctamente")
    print("="*70)
    
    return img


if __name__ == '__main__':
    print("\n🔍 Este script verifica la calidad de carga de imágenes base64")
    print("   Para usar: proporciona una ruta a un archivo con base64 o el string directamente\n")
    
    if len(sys.argv) < 2:
        print("❌ Uso: python test_image_quality.py <archivo_base64 o string>")
        sys.exit(1)
    
    arg = sys.argv[1]
    
    # Verificar si es un archivo
    try:
        with open(arg, 'r') as f:
            base64_str = f.read().strip()
            print(f"✓ Leyendo desde archivo: {arg}\n")
    except:
        base64_str = arg
        print(f"✓ Usando string directo\n")
    
    try:
        img = test_base64_conversion(base64_str)
        print(f"\n✅ PRUEBA EXITOSA")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        sys.exit(1)

