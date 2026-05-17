import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración SMTP (Se recomienda usar variables de entorno)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "") # Ej: tu-email@gmail.com
SMTP_PASS = os.getenv("SMTP_PASS", "") # Ej: tu-contraseña-de-aplicación

def send_email(to_email, subject, body_html, body_text=""):
    """
    Función genérica para enviar correos electrónicos.
    Si no hay credenciales, simula el envío en los logs.
    """
    if not SMTP_USER or not SMTP_PASS:
        logger.warning(f"[EMAIL SIMULATION] No hay credenciales SMTP configuradas.")
        logger.info(f"[EMAIL SIMULATION] Destinatario: {to_email}")
        logger.info(f"[EMAIL SIMULATION] Asunto: {subject}")
        logger.info(f"[EMAIL SIMULATION] Cuerpo (Truncado): {body_text[:100]}...")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Órbita Galáctica <{SMTP_USER}>"
        msg["To"] = to_email

        # Versión de texto plano
        part1 = MIMEText(body_text, "plain")
        # Versión HTML
        part2 = MIMEText(body_html, "html")

        msg.attach(part1)
        msg.attach(part2)

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        
        logger.info(f"Email enviado exitosamente a {to_email}")
        return True
    except Exception as e:
        logger.error(f"Error al enviar email a {to_email}: {e}")
        return False

def send_welcome_email(to_email, username, faction):
    """
    Envía un correo de bienvenida personalizado según la facción elegida.
    """
    faction_names = {
        "MARS": "Industrias Mars (M.A.R.S.)",
        "MOON": "Corporación Lunar (M.O.O.N.)",
        "PLUTO": "Sindicato de Plutón (P.L.U.T.O.)"
    }
    
    faction_full_name = faction_names.get(faction, "la Alianza")
    
    subject = f"¡Bienvenido a Órbita Galáctica, Comandante {username}!"
    
    # Template HTML básico pero elegante
    body_html = f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0e14; color: #e0e0e0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden;">
            <div style="padding: 20px; background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%); text-align: center;">
                <h1 style="margin: 0; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">ÓRBITA GALÁCTICA</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #58a6ff;">¡Saludos, Comandante {username}!</h2>
                <p>Nos complace informarte que tu proceso de registro ha sido completado con éxito.</p>
                <p>Has sido asignado a la facción: <strong>{faction_full_name}</strong>.</p>
                <p>A partir de este momento, eres parte oficial de nuestra flota. Tu misión es explorar el espacio, recolectar recursos valiosos y defender nuestros sectores de las amenazas alienígenas y facciones enemigas.</p>
                
                <div style="margin: 30px 0; padding: 20px; background-color: #0d1117; border-left: 4px solid #238636; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #3fb950;">Tus primeros pasos:</h3>
                    <ul style="padding-left: 20px;">
                        <li>Equipa tu nave en el <strong>Hangar</strong>.</li>
                        <li>Acepta misiones en el panel de <strong>Misiones</strong> para ganar XP y créditos.</li>
                        <li>Explora los mapas y recolecta Titanium y Plutonium.</li>
                        <li>Únete a un <strong>Clan</strong> para colaborar con otros pilotos.</li>
                    </ul>
                </div>

                <p style="text-align: center; margin-top: 40px;">
                    <a href="http://localhost:5173" style="background-color: #238636; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">ENTRAR AL JUEGO</a>
                </p>
            </div>
            <div style="padding: 20px; background-color: #0d1117; text-align: center; font-size: 12px; color: #8b949e; border-top: 1px solid #30363d;">
                Este es un mensaje automático del sistema de control de Órbita Galáctica.<br>
                &copy; 2026 JorghitoTech - Todos los derechos reservados.
            </div>
        </div>
    </body>
    </html>
    """
    
    body_text = f"""
    ¡Bienvenido a Órbita Galáctica, Comandante {username}!
    
    Has sido asignado a la facción: {faction_full_name}.
    
    Tus primeros pasos:
    1. Equipa tu nave en el Hangar.
    2. Acepta misiones para ganar XP y créditos.
    3. Explora y recolecta recursos.
    4. Únete a un Clan.
    
    Entra ahora: http://localhost:5173
    
    Control de Misión, Órbita Galáctica.
    """
    
    return send_email(to_email, subject, body_html, body_text)
