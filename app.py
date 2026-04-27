import os
from datetime import date, timedelta

from dotenv import load_dotenv
load_dotenv()

import streamlit as st
from google import genai

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

    /* Today date badge */
    .today-date {
        background-color: #e8f4fd;
        border: 3px solid #3498db;
        border-radius: 14px;
        padding: 14px 24px;
        font-size: 24px !important;
        font-weight: bold;
        color: #1a5276;
        text-align: center;
        margin-bottom: 20px;
    }

    /* Quick-access (secondary) buttons */
    div.stButton > button[kind="secondary"] {
        font-size: 18px !important;
        border-radius: 12px !important;
        padding: 14px 16px !important;
        width: 100% !important;
        border: 2px solid #e67e22 !important;
        color: #c0392b !important;
        background-color: #fff8f0 !important;
        font-weight: bold !important;
        line-height: 1.4 !important;
        white-space: normal !important;
        height: auto !important;
    }
    div.stButton > button[kind="secondary"]:hover {
        background-color: #fdebd0 !important;
    }

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

# ── Date calculations ────────────────────────────────────────────────────────
_MONTHS_ES = {
    1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
    5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
    9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
}
_DAYS_ES = {
    0: "lunes", 1: "martes", 2: "miércoles", 3: "jueves",
    4: "viernes", 5: "sábado", 6: "domingo",
}

_today = date.today()
_monday = _today - timedelta(days=_today.weekday())
_tuesday = _monday + timedelta(days=1)
_friday = _monday + timedelta(days=4)


def _fmt(d: date) -> str:
    return f"{d.day} de {_MONTHS_ES[d.month]} de {d.year}"


_today_str = f"{_DAYS_ES[_today.weekday()].capitalize()}, {_fmt(_today)}"
_query_bursatil = (
    f"Hazme un informe de investigación de los mercados bursátiles "
    f"del {_fmt(_tuesday)} al {_fmt(_friday)}."
)
_query_financiero = (
    f"Hazme un informe de investigación de un análisis de los mercados financieros "
    f"del {_fmt(_tuesday)} al {_fmt(_friday)}."
)

# ── UI ───────────────────────────────────────────────────────────────────────
st.title("🔍 El Investigador de Miquel")

# Today's date — always visible, large
st.markdown(
    f'<div class="today-date">📅 Hoy es: {_today_str}</div>',
    unsafe_allow_html=True,
)

st.markdown("### Hola Miquel, ¿qué quieres investigar hoy?")
st.markdown("---")

if not api_key:
    st.error(
        "⚠️ No se ha encontrado la clave de API de Google Gemini. "
        "Por favor, añade GEMINI_API_KEY a tus variables de entorno o a "
        "los secretos de Streamlit antes de continuar."
    )

# ── Quick-access buttons ─────────────────────────────────────────────────────
st.markdown("**Acceso rápido — haz clic para rellenar la pregunta:**")


def _set_bursatil():
    st.session_state["query_input"] = _query_bursatil


def _set_financiero():
    st.session_state["query_input"] = _query_financiero


_col1, _col2 = st.columns(2)
with _col1:
    st.button(
        f"📈 Mercados bursátiles\n{_fmt(_tuesday)} → {_fmt(_friday)}",
        on_click=_set_bursatil,
        use_container_width=True,
    )
with _col2:
    st.button(
        f"📉 Mercados financieros\n{_fmt(_tuesday)} → {_fmt(_friday)}",
        on_click=_set_financiero,
        use_container_width=True,
    )

st.markdown("")

query = st.text_area(
    label="Escribe tu pregunta aquí:",
    height=130,
    key="query_input",
    placeholder="Por ejemplo: ¿Cuáles son los beneficios del aceite de oliva para la salud?",
)

generate_clicked = st.button(
    "🔍 Generar Informe de Investigación",
    type="primary",
    disabled=client is None,
)

# ── Session state: lista de trabajos ─────────────────────────────────────────
if "jobs" not in st.session_state:
    st.session_state["jobs"] = []

# ── PDF helper ────────────────────────────────────────────────────────────────
from fpdf import FPDF


def _build_pdf(title: str, body: str) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.multi_cell(0, 10, title.encode("latin-1", errors="replace").decode("latin-1"), align="C")
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 12)
    for line in body.splitlines():
        safe = line.encode("latin-1", errors="replace").decode("latin-1")
        pdf.multi_cell(0, 7, safe)
    return pdf.output()


# ── Lanzar nuevo trabajo al hacer clic ───────────────────────────────────────
if generate_clicked:
    if not query.strip():
        st.warning("✏️  Por favor, escribe qué quieres investigar antes de continuar.")
    else:
        full_prompt = (
            SYSTEM_PROMPT + "\n\n" + query.strip()
            + "\n\nPor favor, redacta el informe en español, "
            "con secciones numeradas, tablas donde sea útil, "
            "y un resumen final. Incluye las fuentes consultadas al final."
        )
        try:
            interaction = client.interactions.create(
                input=full_prompt,
                agent="deep-research-preview-04-2026",
                background=True,
            )
            st.session_state["jobs"].append({
                "id": interaction.id,
                "query": query.strip(),
                "status": "in_progress",
                "report": "",
                "num": len(st.session_state["jobs"]) + 1,
            })
            st.rerun()
        except Exception as exc:
            st.error(f"❌ Error al iniciar la investigación: {exc}")

# ── Panel de trabajos (se actualiza cada 10 s automáticamente) ───────────────
@st.fragment(run_every=10)
def _render_jobs():
    import html as html_lib

    jobs = st.session_state.get("jobs", [])
    if not jobs:
        return

    st.markdown("---")
    st.markdown("## 📋 Informes en curso y completados")

    for i, job in enumerate(jobs):
        # Polling si está en curso
        if job["status"] == "in_progress":
            try:
                result = client.interactions.get(job["id"])
                if result.status == "completed":
                    report_text = "".join(
                        o.text for o in result.outputs if hasattr(o, "text") and o.text
                    )
                    st.session_state["jobs"][i]["status"] = "completed"
                    st.session_state["jobs"][i]["report"] = report_text
                    job = st.session_state["jobs"][i]
                elif result.status == "failed":
                    st.session_state["jobs"][i]["status"] = "failed"
                    job = st.session_state["jobs"][i]
            except Exception:
                pass

        # Renderizar tarjeta
        with st.container(border=True):
            if job["status"] == "in_progress":
                st.progress(0.45, text=f"🔬 Informe {job['num']} — Investigando… (5-10 min)")
                st.caption(f"📝 {job['query'][:120]}")

            elif job["status"] == "completed":
                col_title, col_btn = st.columns([3, 1])
                with col_title:
                    st.markdown(f"**✅ Informe {job['num']}** — {job['query'][:80]}")
                with col_btn:
                    pdf_bytes = _build_pdf(job["query"], job["report"])
                    st.download_button(
                        label="🖨️ Imprimir",
                        data=pdf_bytes,
                        file_name=f"informe_{job['num']}.pdf",
                        mime="application/pdf",
                        key=f"pdf_{job['id']}",
                        use_container_width=True,
                    )
                safe = html_lib.escape(job["report"]).replace("\n", "<br>")
                st.markdown(f'<div id="area-informe">{safe}</div>', unsafe_allow_html=True)

            elif job["status"] == "failed":
                st.error(f"❌ Informe {job['num']} falló — {job['query'][:80]}")


_render_jobs()

