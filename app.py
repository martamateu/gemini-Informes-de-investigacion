import os
import time
import threading
import uuid
import smtplib
import textwrap
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import date, timedelta

from google import genai
from dotenv import load_dotenv
load_dotenv()

import streamlit as st

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

# ── Gemini Deep Research configuration ──────────────────────────────────────
SYSTEM_PROMPT = (
    "Eres un asistente de investigación para Miquel, un señor de 85 años. "
    "Redacta siempre en español, con frases cortas y conclusiones directas. "
    "Evita el lenguaje técnico innecesario. "
    "Estructura el informe con secciones numeradas, tablas donde sea útil, "
    "y un breve resumen final. Incluye las fuentes consultadas al final."
)

_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not _GEMINI_API_KEY:
    try:
        _GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
    except Exception:
        pass

_genai_client = genai.Client(api_key=_GEMINI_API_KEY) if _GEMINI_API_KEY else None

# ── Email configuration ───────────────────────────────────────────────────────
_EMAIL_SENDER   = os.environ.get("EMAIL_SENDER", "")
_EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")
if not _EMAIL_SENDER:
    try:
        _EMAIL_SENDER = st.secrets["EMAIL_SENDER"]
    except Exception:
        pass
if not _EMAIL_PASSWORD:
    try:
        _EMAIL_PASSWORD = st.secrets["EMAIL_PASSWORD"]
    except Exception:
        pass

_EMAIL_RECIPIENT = "martamateu18@gmail.com"


def _send_report_email(subject: str, body: str, pdf_bytes: bytes | None = None):
    """Envía el informe por email. Silencioso si no hay credenciales."""
    if not _EMAIL_SENDER or not _EMAIL_PASSWORD:
        return
    try:
        msg = MIMEMultipart("mixed")
        msg["From"]    = _EMAIL_SENDER
        msg["To"]      = _EMAIL_RECIPIENT
        msg["Subject"] = f"📋 Informe: {subject[:80]}"

        # Cuerpo HTML con el texto del informe
        html_body = "<html><body style='font-family:Georgia,serif;font-size:16px;line-height:1.8;'>"
        html_body += f"<h2>📋 {subject}</h2>"
        for line in body.splitlines():
            html_body += f"<p>{line}</p>" if line.strip() else "<br>"
        html_body += "</body></html>"
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # PDF adjunto si está disponible
        if pdf_bytes:
            att = MIMEApplication(pdf_bytes, _subtype="pdf")
            att.add_header("Content-Disposition", "attachment", filename="informe.pdf")
            msg.attach(att)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
            server.login(_EMAIL_SENDER, _EMAIL_PASSWORD)
            server.sendmail(_EMAIL_SENDER, _EMAIL_RECIPIENT, msg.as_bytes())
    except Exception:
        pass  # No interrumpir la app si el email falla


def _run_deep_research(job_results: dict, job_id: str, query: str):
    """Hilo background: llama al Deep Research API de Google y guarda el resultado."""
    if _genai_client is None:
        job_results[job_id] = {"status": "failed", "error": "GEMINI_API_KEY no configurada."}
        return
    try:
        full_input = f"{SYSTEM_PROMPT}\n\n{query}"
        interaction = _genai_client.interactions.create(
            input=full_input,
            agent="deep-research-preview-04-2026",
            background=True,
        )
        for _ in range(120):  # máximo 20 minutos (120 × 10 s)
            result = _genai_client.interactions.get(interaction.id)
            status = str(result.status).lower()
            if "completed" in status:
                # Extraer todo el texto de los outputs
                report_parts = []
                for output in (result.outputs or []):
                    text = getattr(output, "text", None)
                    if text:
                        report_parts.append(text)
                report = "\n\n".join(report_parts)
                if not report:
                    report = "El informe se generó pero no contiene texto."
                job_results[job_id] = {"status": "completed", "report": report}
                _send_report_email(query, report)
                return
            elif "failed" in status or "error" in status:
                job_results[job_id] = {
                    "status": "failed",
                    "error": str(getattr(result, "error", "Error desconocido")),
                }
                return
            time.sleep(10)
        job_results[job_id] = {"status": "failed", "error": "Tiempo máximo superado (20 min)."}
    except Exception as exc:
        job_results[job_id] = {"status": "failed", "error": str(exc)}

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
)

# ── Session state: lista de trabajos ─────────────────────────────────────────────
if "jobs" not in st.session_state:
    st.session_state["jobs"] = []
if "_job_results" not in st.session_state:
    st.session_state["_job_results"] = {}

# ── PDF helper ────────────────────────────────────────────────────────────────
from fpdf import FPDF


def _build_pdf(title: str, body: str) -> bytes:
    pdf = FPDF()
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    safe_title = title.encode("latin-1", errors="replace").decode("latin-1")
    pdf.multi_cell(0, 10, safe_title, align="C")
    pdf.ln(6)
    pdf.set_font("Helvetica", "", 11)
    page_width = pdf.w - pdf.l_margin - pdf.r_margin
    for line in body.splitlines():
        # Break lines that are too long (e.g. URLs) into chunks of 90 chars
        safe = line.encode("latin-1", errors="replace").decode("latin-1")
        if not safe.strip():
            pdf.ln(4)
            continue
        # Split very long words so they don't overflow
        words = safe.split(" ")
        chunked = []
        for word in words:
            while len(word) > 90:
                chunked.append(word[:90])
                word = word[90:]
            chunked.append(word)
        safe = " ".join(chunked)
        pdf.multi_cell(page_width, 6, safe)
    return bytes(pdf.output())

# ── Lanzar nuevo trabajo al hacer clic ───────────────────────────────────────
if generate_clicked:
    if not query.strip():
        st.warning("✏️  Por favor, escribe qué quieres investigar antes de continuar.")
    else:
        job_id = str(uuid.uuid4())
        job_results = st.session_state["_job_results"]
        job_results[job_id] = {"status": "in_progress"}
        threading.Thread(
            target=_run_deep_research,
            args=(job_results, job_id, query.strip()),
            daemon=True,
        ).start()
        st.session_state["jobs"].append({
            "id": job_id,
            "query": query.strip(),
            "status": "in_progress",
            "report": "",
            "num": len(st.session_state["jobs"]) + 1,
        })
        st.rerun()

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
            result = st.session_state.get("_job_results", {}).get(job["id"], {})
            if result.get("status") == "completed":
                st.session_state["jobs"][i]["status"] = "completed"
                st.session_state["jobs"][i]["report"] = result.get("report", "")
                job = st.session_state["jobs"][i]
            elif result.get("status") == "failed":
                st.session_state["jobs"][i]["status"] = "failed"
                st.session_state["jobs"][i]["error"] = result.get("error", "")
                job = st.session_state["jobs"][i]

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
                st.caption("💰 Coste estimado de este informe: ~$1 – $3")
                safe = html_lib.escape(job["report"]).replace("\n", "<br>")
                st.markdown(f'<div id="area-informe">{safe}</div>', unsafe_allow_html=True)

            elif job["status"] == "failed":
                st.error(f"❌ Informe {job['num']} falló — {job['query'][:80]}")
                if job.get("error"):
                    st.caption(f"Error: {job['error'][:300]}")


_render_jobs()

