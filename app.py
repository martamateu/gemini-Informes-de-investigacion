import os

import streamlit as st
from google import genai
from google.genai import types

# ── Page configuration ──────────────────────────────────────────────────────
st.set_page_config(
    page_title="El Investigador de Miquel",
    page_icon="🔍",
    layout="centered",
)

# ── Accessibility & visual style ─────────────────────────────────────────────
st.markdown(
    """
    <style>
    /* Base font size for accessibility (≥ 20 px) */
    html, body, [class*="css"] {
        font-size: 20px !important;
        background-color: #fdf8f0 !important;
        color: #1a1a1a !important;
        font-family: Georgia, "Times New Roman", serif;
    }

    /* Title */
    h1 { font-size: 2rem !important; color: #2c3e50 !important; }
    h2 { font-size: 1.6rem !important; color: #2c3e50 !important; }
    h3 { font-size: 1.4rem !important; color: #34495e !important; }

    /* Text area */
    textarea {
        font-size: 20px !important;
        border: 2px solid #bdc3c7 !important;
        border-radius: 10px !important;
        padding: 12px !important;
    }

    /* Primary (orange) button – "Generar Informe" */
    div.stButton > button[kind="primary"] {
        background-color: #e67e22 !important;
        color: white !important;
        font-size: 22px !important;
        font-weight: bold !important;
        border: none !important;
        border-radius: 14px !important;
        padding: 16px 32px !important;
        width: 100% !important;
        cursor: pointer !important;
    }
    div.stButton > button[kind="primary"]:hover {
        background-color: #d35400 !important;
    }

    /* Warning / info messages */
    .stAlert { font-size: 20px !important; }

    /* Report content area */
    #area-informe {
        background-color: #ffffff;
        border: 1px solid #dde3e8;
        border-radius: 12px;
        padding: 28px 32px;
        font-size: 20px;
        line-height: 1.8;
        color: #1a1a1a;
        margin-top: 16px;
    }

    /* Green print button */
    .print-btn {
        background-color: #27ae60;
        color: white;
        font-size: 22px;
        font-weight: bold;
        border: none;
        border-radius: 14px;
        padding: 16px 32px;
        margin-top: 20px;
        cursor: pointer;
        width: 100%;
        display: block;
    }
    .print-btn:hover { background-color: #1e8449; }

    /* Print: keep only the report area */
    @media print {
        header, footer, .stApp > div:not(#print-area) { display: none !important; }
        #print-area { display: block !important; }
        body { background-color: #ffffff !important; }
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ── Gemini API configuration ─────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "Eres un asistente de investigación para Miquel, un señor de 85 años. "
    "Tu tarea es realizar una búsqueda exhaustiva, verificar hechos y redactar "
    "un informe en español claro, con frases cortas y conclusiones directas. "
    "Evita el lenguaje técnico innecesario. "
    "Estructura el informe con secciones numeradas y un breve resumen final."
)

# Resolve API key: env var → st.secrets
api_key = os.environ.get("GEMINI_API_KEY", "")
if not api_key:
    try:
        api_key = st.secrets["GEMINI_API_KEY"]
    except Exception:
        api_key = ""

if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None

# ── UI ───────────────────────────────────────────────────────────────────────
st.title("🔍 El Investigador de Miquel")
st.markdown("### Hola Miquel, ¿qué quieres investigar hoy?")
st.markdown("---")

if not api_key:
    st.error(
        "⚠️ No se ha encontrado la clave de API de Google Gemini. "
        "Por favor, añade GEMINI_API_KEY a tus variables de entorno o a "
        "los secretos de Streamlit antes de continuar."
    )

query = st.text_area(
    label="Escribe tu pregunta aquí:",
    height=130,
    placeholder="Por ejemplo: ¿Cuáles son los beneficios del aceite de oliva para la salud?",
)

generate_clicked = st.button(
    "🔍 Generar Informe de Investigación",
    type="primary",
    disabled=client is None,
)

# ── Generation logic ─────────────────────────────────────────────────────────
if generate_clicked:
    if not query.strip():
        st.warning("✏️  Por favor, escribe qué quieres investigar antes de continuar.")
    else:
        with st.spinner("🔄 Buscando información, por favor espere…"):
            try:
                response = client.models.generate_content(
                    model="gemini-1.5-pro",
                    contents=query.strip(),
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                    ),
                )
                st.session_state["report"] = response.text
                st.session_state["report_query"] = query.strip()
            except Exception as exc:
                st.error(f"❌ Error al generar el informe: {exc}")
                st.session_state.pop("report", None)

# ── Results ──────────────────────────────────────────────────────────────────
if st.session_state.get("report"):
    st.markdown("---")
    st.markdown("## 📄 Tu Informe de Investigación")
    st.markdown(
        f"*Tema investigado:* **{st.session_state.get('report_query', '')}**"
    )

    # Render the report inside a named div so @media print can target it
    import html as html_lib

    safe_report = html_lib.escape(st.session_state["report"]).replace(
        "\n", "<br>"
    )
    st.markdown(
        f'<div id="area-informe">{safe_report}</div>',
        unsafe_allow_html=True,
    )

    # Print / Save as PDF button (uses browser native print dialog)
    st.markdown(
        """
        <div id="print-area">
            <button class="print-btn" onclick="window.print()">
                🖨️ Guardar o Imprimir Informe
            </button>
        </div>
        """,
        unsafe_allow_html=True,
    )
