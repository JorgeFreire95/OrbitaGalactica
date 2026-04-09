from database import create_announcement_db, init_db

init_db()
create_announcement_db(
    title="SISTEMAS OPERATIVOS",
    content="Se ha implementado con éxito la terminal de comunicaciones estelares. Los comandantes ahora pueden emitir comunicados a toda la flota.",
    type="event"
)
print("Anuncio de prueba creado.")
