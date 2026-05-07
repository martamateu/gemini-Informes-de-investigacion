"""
weekly.py — Genera los dos informes semanales y los envía por email.

Ejecutado automáticamente cada lunes a las 16:00 via GitHub Actions.
También se puede lanzar manualmente: python3 weekly.py
"""

import os
import smtplib
import time
from datetime import date, timedelta
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
from fpdf import FPDF
from google import genai

load_dotenv()

# ── Configuración ─────────────────────────────────────────────────────────────
_GEMINI_API_KEY  = os.environ["GEMINI_API_KEY"]
_EMAIL_SENDER    = os.environ["EMAIL_SENDER"]
_EMAIL_PASSWORD  = os.environ["EMAIL_PASSWORD"]
_EMAIL_RECIPIENT = os.environ.get("EMAIL_RECIPIENT", "martamateu18@gmail.com")

_genai_client = genai.Client(api_key=_GEMINI_API_KEY)

SYSTEM_PROMPT = (
    "Eres un asistente de investigación para Miquel, un señor de 85 años. "
    "Redacta siempre en español, con frases cortas y conclusiones directas. "
    "Evita el lenguaje técnico innecesario. "
    "Estructura el informe con secciones numeradas, tablas donde sea útil, "
    "y un breve resumen final. Incluye las fuentes consultadas al final."
)

_MONTHS_ES = {
    1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
    5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
    9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
}


def _fmt(d: date) -> str:
    return f"{d.day} de {_MONTHS_ES[d.month]} de {d.year}"


# ── PDF ───────────────────────────────────────────────────────────────────────
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
        safe = line.encode("latin-1", errors="replace").decode("latin-1")
        if not safe.strip():
            pdf.ln(4)
            continue
        words = safe.split(" ")
        chunked = []
        for word in words:
            while len(word) > 90:
                chunked.append(word[:90])
                word = word[90:]
            chunked.append(word)
        pdf.multi_cell(page_width, 6, " ".join(chunked))
    return bytes(pdf.output())


# ── Email ─────────────────────────────────────────────────────────────────────
def _send_email(subject: str, body: str, pdf_bytes: bytes):
    msg = MIMEMultipart("mixed")
    msg["From"]    = _EMAIL_SENDER
    msg["To"]      = _EMAIL_RECIPIENT
    msg["Subject"] = f"📋 Informe semanal: {subject[:80]}"

    html = (
        "<html><body style='font-family:Georgia,serif;font-size:16px;line-height:1.8;'>"
        f"<h2>📋 {subject}</h2>"
    )
    for line in body.splitlines():
        html += f"<p>{line}</p>" if line.strip() else "<br>"
    html += "</body></html>"
    msg.attach(MIMEText(html, "html", "utf-8"))

    att = MIMEApplication(pdf_bytes, _subtype="pdf")
    att.add_header("Content-Disposition", "attachment", filename="informe.pdf")
    msg.attach(att)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as server:
        server.login(_EMAIL_SENDER, _EMAIL_PASSWORD)
        server.sendmail(_EMAIL_SENDER, _EMAIL_RECIPIENT, msg.as_bytes())
    print(f"EMAIL enviado: {subject[:60]}")


# ── Deep Research ─────────────────────────────────────────────────────────────
def _run_and_send(query: str):
    print(f"RESEARCH: iniciando → '{query[:70]}'")
    full_input = f"{SYSTEM_PROMPT}\n\n{query}"
    interaction = _genai_client.interactions.create(
        input=full_input,
        agent="deep-research-preview-04-2026",
        background=True,
    )
    print(f"RESEARCH: interaction_id={interaction.id}")
    for i in range(120):  # máximo 20 min
        time.sleep(10)
        result = _genai_client.interactions.get(interaction.id)
        status = str(result.status).lower()
        print(f"RESEARCH: poll {i+1}/120 → {status}")
        if "completed" in status:
            parts = [
                getattr(o, "text", "")
                for o in (result.outputs or [])
                if getattr(o, "text", "")
            ]
            report = "\n\n".join(parts) or "El informe se generó pero no contiene texto."
            pdf_bytes = _build_pdf(query, report)
            _send_email(query, report, pdf_bytes)
            return
        elif "failed" in status or "error" in status:
            error = str(getattr(result, "error", "Error desconocido"))
            raise RuntimeError(f"Deep Research falló: {error}")
    raise TimeoutError("Deep Research tardó más de 20 min.")


# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    today   = date.today()
    monday  = today - timedelta(days=today.weekday())
    tuesday = monday + timedelta(days=1)
    friday  = monday + timedelta(days=4)

    queries = [
        f"Hazme un informe de investigación de los mercados bursátiles del {_fmt(tuesday)} al {_fmt(friday)}.",
        f"Hazme un informe de investigación de un análisis de los mercados financieros del {_fmt(tuesday)} al {_fmt(friday)}.",
    ]

    for q in queries:
        _run_and_send(q)

    print("Informes semanales enviados.")
