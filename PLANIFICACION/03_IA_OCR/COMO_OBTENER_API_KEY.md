# 🔑 Cómo Obtener API Key de Google Gemini

Esta guía te ayudará a obtener una API Key de Google AI Studio para usar Gemini 2.5 Pro en el sistema SIGCERH.

---

## 📋 Pasos para Obtener la API Key

### 1. Acceder a Google AI Studio

1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Si es tu primera vez, acepta los términos de servicio

### 2. Crear API Key

1. En el panel izquierdo, busca la opción **"Get API key"** o **"API keys"**
2. Haz clic en **"Create API key"**
3. Selecciona un proyecto de Google Cloud existente o crea uno nuevo
4. La API Key se generará automáticamente

### 3. Copiar la API Key

1. Copia la API Key generada (formato: `AIzaSy...`)
2. **IMPORTANTE:** Guarda esta clave de forma segura. No la compartas públicamente.

### 4. Verificar Límites Gratuitos

Google Gemini ofrece un tier gratuito generoso:

- ✅ **60 requests por minuto**
- ✅ **1500 requests por día**
- ✅ Suficiente para desarrollo y pruebas
- ✅ Sin tarjeta de crédito requerida

Para proyectos en producción con mayor volumen, considera actualizar al tier pagado.

---

## ⚙️ Configurar en SIGCERH

### Backend

1. Abre el archivo `backend/.env`
2. Agrega tu API Key:

```env
GEMINI_API_KEY="AIzaSy_tu_api_key_aqui"
GEMINI_MODEL="gemini-2.5-pro"
OCR_SERVICE_URL="http://localhost:5000"
USE_REAL_OCR="true"
```

3. Guarda el archivo

### Servicio OCR Python

1. Abre el archivo `ocr_service/.env`
2. Agrega tu API Key:

```env
GEMINI_API_KEY="AIzaSy_tu_api_key_aqui"
GEMINI_MODEL="gemini-2.5-pro"
```

3. Guarda el archivo

---

## ✅ Verificar que Funciona

### 1. Iniciar Servicio OCR

```bash
cd ocr_service
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
python main.py
```

Deberías ver:
```
✓ Gemini API inicializada correctamente
✓ Servidor OCR iniciado en http://localhost:5000
```

### 2. Probar desde Backend

```bash
cd backend
npm run test:ocr:gemini
```

Si todo está configurado correctamente, verás la extracción de estudiantes de un acta de prueba.

---

## ⚠️ Troubleshooting

### Error: "API Key inválida"

- Verifica que copiaste la clave completa (sin espacios)
- Asegúrate de que la API Key no esté expirada
- Genera una nueva API Key si es necesario

### Error: "PERMISSION_DENIED"

- Verifica que tu proyecto de Google Cloud tenga habilitada la API de Gemini
- Ve a [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Library
- Busca "Generative Language API" y habilítala

### Error: "RESOURCE_EXHAUSTED" o "Quota exceeded"

- Has superado el límite de 60 requests/minuto o 1500/día
- Espera un tiempo o considera actualizar al tier pagado
- Verifica que no haya bucles infinitos haciendo requests

### Error: "Model not found"

- Verifica que `GEMINI_MODEL="gemini-2.5-pro"` esté correctamente configurado
- Modelos disponibles: `gemini-2.5-pro`, `gemini-1.5-pro`, `gemini-1.5-flash`

---

## 💰 Costos (Tier Pagado)

Si decides actualizar al tier pagado para producción:

| Concepto | Costo Estimado |
|----------|----------------|
| Procesamiento de imagen + texto | ~$0.001 por acta |
| 1000 actas/mes | ~$1.00 USD |
| 10,000 actas/mes | ~$10.00 USD |

**Muy económico** para el valor que proporciona en precisión de OCR.

---

## 🔒 Seguridad

### Mejores Prácticas

1. **NUNCA** subas tu API Key a Git o repositorios públicos
2. Usa variables de entorno (archivos `.env`)
3. Añade `.env` a tu `.gitignore`
4. Rota la API Key periódicamente (cada 3-6 meses)
5. Si la clave se filtra, revócala inmediatamente en Google AI Studio

### Revocar API Key

1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Sección "API keys"
3. Encuentra tu clave y haz clic en "Delete"
4. Genera una nueva clave

---

## 📚 Recursos Adicionales

- [Documentación oficial de Gemini](https://ai.google.dev/docs)
- [Guía de API de Gemini](https://ai.google.dev/api)
- [Precios de Gemini](https://ai.google.dev/pricing)
- [Google AI Studio](https://aistudio.google.com/)

---

## 🆘 Soporte

Si tienes problemas para obtener o configurar tu API Key:

1. Revisa la [documentación oficial](https://ai.google.dev/docs)
2. Consulta la sección de Troubleshooting arriba
3. Verifica los logs del servicio OCR (`ocr_service/logs/`)
4. Contacta al equipo de desarrollo de SIGCERH

---

**Última actualización:** Noviembre 2025

