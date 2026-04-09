import sqlite3
import sys

# Setup path
BP = r'c:\Users\jorge\OneDrive\Escritorio\Proyectos\OrbitaGalactica\backend'
if BP not in sys.path:
    sys.path.append(BP)

# pylint: disable=import-error, wrong-import-position
from database import donate_from_clan_db, get_connection, get_clan_logs_db  # noqa: E402 # type: ignore


def verify_donation_direct():
    """Verify that clan donations correctly attribute sender and receiver."""
    print("Iniciando verificación directa de atribución de donaciones...")

    clan_tag = "MARS"
    sender = "AdminDirect"
    receiver = "PilotDirect"
    amount = 750

    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE clans SET credits = MAX(credits, 1000) WHERE tag = ?", (clan_tag,))
    c.execute(
        "INSERT OR IGNORE INTO users (username, email, password_hash, salt, credits) "
        "VALUES (?, ?, 'x', 'x', 0)", (receiver, f"{receiver}@test.com")
    )
    conn.commit()
    conn.close()

    print(f"Llamando a donate_from_clan_db({clan_tag}, {receiver}, {amount}, {sender})...")
    result = donate_from_clan_db(clan_tag, receiver, amount, sender)

    if result["success"]:
        print("Función ejecutada exitosamente.")
        logs = get_clan_logs_db(clan_tag)
        found = False
        for log in logs:
            if log['type'] == 'DONACION' and sender in log['description'] and receiver in log['description']:
                print("Log encontrado!")
                print(f"- Piloto: {log['username']}")
                print(f"- Descripción: {log['description']}")
                found = True
                break
        if not found:
            print("No se encontró el log con el formato esperado.")
    else:
        print(f"Error en la función: {result.get('error')}")


if __name__ == "__main__":
    verify_donation_direct()
