"""
Cliente de Google Gemini para procesamiento OCR de actas
"""

import os
import io
import time
import base64
from typing import Dict, Any, Union
from PIL import Image
import google.generativeai as genai

from prompt_builder import build_acta_prompt, validate_metadata
from response_parser import (
    extract_json_from_response,
    validate_ocr_response,
    convert_to_backend_format
)


class GeminiOCRClient:
    """Cliente para procesar actas con Google Gemini"""
    
    def __init__(self, api_key: str, model: str = "gemini-2.5-pro"):
        """
        Inicializa el cliente de Gemini

        Args:
            api_key: API Key de Google AI Studio
            model: Modelo de Gemini a usar (default: gemini-2.5-pro)
        """
        if not api_key:
            raise ValueError("API Key de Gemini es requerida")

        self.api_key = api_key
        self.model_name = model
        self.last_request_time = 0  # Control de rate limiting
        self.min_request_interval = 2  # Mínimo 2 segundos entre requests

        # Configurar Gemini
        genai.configure(api_key=api_key)

        # Guardar instrucciones de sistema para reutilizar en cada request
        self.system_instruction = """
Eres un sistema OCR de alta precisión especializado en documentos educativos peruanos.

TU OBJETIVO PRINCIPAL:
Extraer TODOS los datos de actas de evaluación escolar con 100% de precisión y completitud.

REGLAS INQUEBRANTABLES:
1. NUNCA omitas estudiantes - si hay 18 filas, extrae las 18
2. SIEMPRE verifica que el número de estudiantes extraídos coincida con las filas de la tabla
3. Lee con EXTREMO cuidado números manuscritos
4. Mantén el orden EXACTO de las columnas
5. Responde SOLO con JSON válido, sin explicaciones adicionales

CARACTERÍSTICAS DE TU EXTRACCIÓN:
- Precisión: 99%+
- Completitud: 100% de registros
- Formato: JSON estructurado
- Validación: Auto-verificación de conteo

Eres confiable, preciso y exhaustivo.
"""

        print(f"✓ Gemini {model} configurado correctamente (modelo fresco para cada request)")
    
    def load_and_prepare_image(self, image_path: str) -> Image.Image:
        """
        Carga y prepara una imagen para Gemini
        
        Args:
            image_path: Ruta de la imagen
        
        Returns:
            PIL.Image: Imagen preparada
        """
        try:
            img = Image.open(image_path)
            
            # NO convertir a RGB - Gemini funciona mejor con el formato original
            # Solo redimensionar si es EXTREMADAMENTE grande
            max_size = (8192, 8192)  # Aumentado para mantener más detalle
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                # Usar LANCZOS para mantener máxima calidad
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                print(f"⚠️  Imagen redimensionada a {img.size}")
            
            print(f"✓ Imagen cargada: Modo={img.mode}, Tamaño={img.size}, Formato={img.format}")
            
            return img
        except Exception as e:
            raise RuntimeError(f"Error al cargar imagen: {e}")
    
    def load_image_from_base64(self, base64_str: str) -> Image.Image:
        """
        Carga una imagen desde base64 manteniendo máxima calidad
        
        Args:
            base64_str: String base64 de la imagen
        
        Returns:
            PIL.Image: Imagen preparada
        """
        try:
            # Remover prefijo si existe (data:image/png;base64,)
            if ',' in base64_str:
                base64_str = base64_str.split(',', 1)[1]
            
            # Decodificar
            image_data = base64.b64decode(base64_str)
            img = Image.open(io.BytesIO(image_data))
            
            # NO convertir a RGB - mantener el formato original
            # Gemini funciona mejor con la imagen original sin procesamiento
            print(f"✓ Imagen cargada desde base64:")
            print(f"   - Modo: {img.mode}")
            print(f"   - Tamaño: {img.size}")
            print(f"   - Formato: {img.format if hasattr(img, 'format') else 'desconocido'}")
            print(f"   - Tamaño en bytes: {len(image_data):,}")
            
            return img
        except Exception as e:
            raise RuntimeError(f"Error al cargar imagen desde base64: {e}")
    
    def process_acta(
        self,
        image: Image.Image,
        metadata: Dict[str, Any],
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Procesa un acta con Gemini OCR
        
        Args:
            image: Imagen PIL del acta
            metadata: Metadata del acta (año, grado, sección, áreas, etc.)
            timeout: Timeout en segundos (default: 30)
        
        Returns:
            dict: Resultado OCR en formato backend
        
        Raises:
            ValueError: Si la metadata es inválida
            RuntimeError: Si hay error en el procesamiento
        """
        # Validar metadata
        is_valid, error_msg = validate_metadata(metadata)
        if not is_valid:
            raise ValueError(f"Metadata inválida: {error_msg}")
        
        # Construir prompt
        prompt = build_acta_prompt(metadata)
        
        # Procesar con Gemini
        print(f"\n{'='*70}")
        print(f"🤖 Procesando acta con Gemini {self.model_name}")
        print(f"{'='*70}")
        print(f"📚 Grado: {metadata.get('grado', 'N/A')} - Sección: {metadata.get('seccion', 'N/A')}")
        print(f"📅 Año: {metadata.get('anio', 'N/A')}")
        print(f"📊 Áreas curriculares: {len(metadata.get('areas', []))}")
        print(f"📷 Imagen: {type(image).__name__} - Tamaño: {image.size if hasattr(image, 'size') else 'N/A'}")
        print(f"\n📝 Prompt enviado:")
        print(f"{'-'*70}")
        print(prompt[:500])  # Primeros 500 caracteres
        print(f"...")
        print(f"{'-'*70}\n")
        
        start_time = time.time()
        
        try:
            # Rate limiting: Esperar si es necesario para evitar saturar API
            elapsed_since_last = time.time() - self.last_request_time
            if elapsed_since_last < self.min_request_interval:
                wait_time = self.min_request_interval - elapsed_since_last
                print(f"⏱️  Esperando {wait_time:.1f}s para evitar rate limit...")
                time.sleep(wait_time)
            
            self.last_request_time = time.time()
            
            # Logging de imagen antes de enviar
            print(f"📸 Enviando imagen a Gemini:")
            print(f"   - Modo: {image.mode}")
            print(f"   - Tamaño: {image.size}")
            print(f"   - Formato: {image.format if hasattr(image, 'format') else 'N/A'}")

            # ✅ CRÍTICO: Crear un modelo FRESCO para cada request
            # Esto evita acumulación de historial de chat que causa:
            # 1. Lentitud progresiva (124+ segundos)
            # 2. Bloqueos SAFETY por contexto acumulado
            # 3. Límites de tokens excedidos
            print(f"🔄 Creando modelo fresco (sin historial)...")
            fresh_model = genai.GenerativeModel(
                self.model_name,
                system_instruction=self.system_instruction
            )

            # ✅ CONFIGURACIÓN DE SEGURIDAD CORRECTA
            # Desactivar TODOS los filtros de seguridad
            # Categorías bloqueadas (según error): 7, 8, 9, 10
            # Categoría 7: HARM_CATEGORY_HARASSMENT
            # Categoría 8: HARM_CATEGORY_HATE_SPEECH
            # Categoría 9: HARM_CATEGORY_SEXUALLY_EXPLICIT
            # Categoría 10: HARM_CATEGORY_DANGEROUS_CONTENT
            #
            # IMPORTANTE: Usar formato de lista con strings para máxima compatibilidad
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]

            print(f"🛡️  Safety settings configurados: BLOCK_NONE para todas las categorías")

            # IMPORTANTE: Enviar la imagen con texto en el orden correcto
            # Gemini procesa mejor cuando la imagen va DESPUÉS del prompt
            response = fresh_model.generate_content(
                [image, prompt],  # Imagen PRIMERO para mejor procesamiento OCR
                generation_config={
                    'temperature': 0.1,  # Aumentado ligeramente para mejor interpretación
                    'top_p': 0.95,  # Ajustado para mejor balance
                    'top_k': 40,  # Aumentado para más opciones de tokens
                    'max_output_tokens': 16384,  # Suficiente para actas grandes
                },
                safety_settings=safety_settings  # ✅ Usar objeto de configuración correcto
            )
            
            processing_time = int((time.time() - start_time) * 1000)  # ms
            print(f"✓ Respuesta recibida en {processing_time}ms")
            
            # Verificar si la respuesta fue bloqueada por seguridad
            if not response.candidates or len(response.candidates) == 0:
                raise RuntimeError(
                    "Gemini bloqueó la respuesta. Esto puede deberse a:\n"
                    "1. Contenido de la imagen detectado como sensible\n"
                    "2. Límite de contexto excedido\n"
                    "3. Problema temporal con la API\n"
                    "Intenta con otra imagen o espera unos minutos."
                )
            
            candidate = response.candidates[0]
            
            # Verificar finish_reason
            if candidate.finish_reason not in [1, None]:  # 1 = STOP (normal)
                finish_reasons = {
                    2: "SAFETY - Contenido bloqueado por filtros de seguridad",
                    3: "RECITATION - Respuesta bloqueada por contener contenido con derechos de autor",
                    4: "MAX_TOKENS - Límite de tokens excedido",
                    5: "OTHER - Otro motivo de bloqueo"
                }
                reason_text = finish_reasons.get(candidate.finish_reason, f"Desconocido ({candidate.finish_reason})")
                
                error_msg = f"Gemini no completó la respuesta. Motivo: {reason_text}"
                
                # Si hay safety_ratings, mostrarlos
                if candidate.safety_ratings:
                    error_msg += "\n\nDetalles de seguridad:"
                    for rating in candidate.safety_ratings:
                        error_msg += f"\n  - {rating.category}: {rating.probability}"
                
                raise RuntimeError(error_msg)
            
            # Logging de respuesta recibida
            print(f"\n📤 Respuesta de Gemini (primeros 500 chars):")
            print(f"{'-'*70}")
            
            # Extraer texto de la respuesta
            response_text = response.text
            print(response_text[:500])
            print(f"...")
            print(f"{'-'*70}\n")
            
            # DEBUG: Imprimir JSON completo para depuración
            print(f"\n🔍 DEBUG - Respuesta JSON COMPLETA de Gemini:")
            print(f"{'-'*70}")
            print(response_text)
            print(f"{'-'*70}\n")
            
            # Parsear JSON
            gemini_data = extract_json_from_response(response_text)
            
            # DEBUG: Imprimir estructura parseada
            import json as json_lib
            print(f"\n🔍 DEBUG - Datos parseados (primeros 3 estudiantes):")
            print(f"{'-'*70}")
            estudiantes_sample = gemini_data.get('estudiantes', [])[:3]
            print(json_lib.dumps(estudiantes_sample, indent=2, ensure_ascii=False))
            print(f"{'-'*70}\n")
            
            # Validar respuesta
            is_valid, error_msg = validate_ocr_response(gemini_data)
            if not is_valid:
                raise ValueError(f"Respuesta OCR inválida: {error_msg}")
            
            # Convertir a formato backend
            resultado = convert_to_backend_format(gemini_data, metadata)
            
            # Agregar tiempo de procesamiento
            resultado['tiempoProcesamientoMs'] = processing_time
            
            # Logging detallado de resultados
            print(f"\n{'='*70}")
            print(f"✅ EXTRACCIÓN COMPLETADA")
            print(f"{'='*70}")
            print(f"👥 Estudiantes detectados: {resultado['totalEstudiantes']}")
            print(f"📊 Confianza: {resultado['confianza']}%")
            print(f"⏱️ Tiempo de procesamiento: {processing_time}ms ({processing_time/1000:.2f}s)")
            
            # Contar aprobados/desaprobados
            aprobados = sum(1 for est in resultado['estudiantes'] if est.get('situacionFinal') == 'A')
            desaprobados = resultado['totalEstudiantes'] - aprobados
            print(f"✓ Aprobados: {aprobados}")
            print(f"✗ Desaprobados: {desaprobados}")
            
            if resultado.get('advertencias'):
                print(f"⚠️  Advertencias: {len(resultado['advertencias'])}")
                for adv in resultado['advertencias'][:3]:  # Mostrar primeras 3
                    print(f"   - {adv}")
            
            print(f"{'='*70}\n")
            
            return resultado
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            raise RuntimeError(f"Error en procesamiento OCR (después de {processing_time}ms): {e}")
    
    def health_check(self) -> bool:
        """
        Verifica que el cliente de Gemini esté configurado

        Returns:
            bool: True si está configurado (no verifica la API directamente)
        """
        # Solo verificar que tengamos API key y modelo configurado
        # NO llamamos a Gemini porque puede dar falsos negativos
        return bool(self.api_key and self.model_name and self.system_instruction)

