# El Investigador de Miquel 🔍

Una aplicación web ultra-sencilla pensada para Miquel Pairet (85 años).  
Escribe una pregunta, pulsa el botón naranja y recibe un informe de investigación generado con Google Gemini.  
Después puedes imprimirlo o guardarlo como PDF con un solo clic.

---

## Características

- **Interfaz accesible**: tipografía grande (≥ 20 px), alto contraste, fondo crema, sin distracciones.
- **Botón naranja** "🔍 Generar Informe de Investigación".
- **Indicador de carga** mientras Gemini procesa la solicitud.
- **Botón verde** "🖨️ Guardar o Imprimir Informe" que abre el diálogo de impresión del navegador (permite guardar como PDF).
- **Modelo** `gemini-1.5-pro` con un *system prompt* en español adaptado para Miquel.

---

## Requisitos

- Python 3.9 o superior
- Una clave de API de [Google AI Studio](https://aistudio.google.com/apikey) (gratuita)

---

## Instalación y ejecución local

```bash
# 1. Clona el repositorio
git clone https://github.com/martamateu/gemini-Informes-de-investigacion.git
cd gemini-Informes-de-investigacion

# 2. Instala las dependencias
pip install -r requirements.txt

# 3. Configura tu clave de API
cp .env.example .env
# Edita .env y reemplaza "your_google_gemini_api_key_here" por tu clave real

# 4. Inicia la aplicación
streamlit run app.py
```

Abre el navegador en `http://localhost:8501`.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Clave de API de Google Gemini (obligatoria) |

También puedes usar los [secretos de Streamlit](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/secrets-management):  
crea el fichero `.streamlit/secrets.toml` con el contenido:

```toml
GEMINI_API_KEY = "tu_clave_aqui"
```

---

## Despliegue en Streamlit Community Cloud

1. Haz *fork* del repositorio en tu cuenta de GitHub.
2. Ve a [share.streamlit.io](https://share.streamlit.io) y conecta el repositorio.
3. En **Advanced settings → Secrets**, añade `GEMINI_API_KEY = "tu_clave"`.
4. Pulsa **Deploy** y comparte la URL con Miquel.
