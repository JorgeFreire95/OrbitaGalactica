from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json
import traceback
import logging
import secrets
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from game_logic import GameState
from database import init_db, register_user, login_user, set_user_faction, get_all_users, update_user, delete_user, get_available_clans, create_clan_db, join_clan_db, get_user_clan_data, leave_clan_db, kick_member_db, get_user_messages_db, mark_message_read_db, sync_user_stats, update_clan_tax_db, collect_all_taxes, donate_from_clan_db, get_user_stats_db, get_clan_logs_db, get_user_by_email_db, set_reset_token_db, get_user_by_token_db, update_password_by_token_db, hash_password, get_leaderboard_db, get_announcements_db, create_announcement_db, delete_announcement_db

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class SetFactionRequest(BaseModel):
    username: str
    faction: str

class AdminUpdateRequest(BaseModel):
    username: str
    email: str
    faction: str
    level: int = None
    xp: int = None
    credits: int = None
    paladio: int = None
    is_admin: bool = None
    is_super_admin: bool = None

class SyncRequest(BaseModel):
    username: str
    level: int
    xp: int
    credits: int
    paladio: int

class ClanCreateRequest(BaseModel):
    tag: str
    name: str
    leader: str

class ClanJoinRequest(BaseModel):
    username: str
    clan_tag: str

class ClanLeaveRequest(BaseModel):
    username: str

class ClanKickRequest(BaseModel):
    username: str
    target_username: str

class ClanTaxRequest(BaseModel):
    clan_tag: str
    tax_rate: float

class ClanUpdateInfoRequest(BaseModel):
    old_tag: str
    new_tag: str
    name: str
    description: str = ""
    status: str = "Reclutando"
    news: str = "[]"
    logo: str = ""

class ClanDonateRequest(BaseModel):
    username: str # El que realiza la donación (admin/líder)
    clan_tag: str
    target_username: str
    amount: int

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class AnnouncementRequest(BaseModel):
    title: str
    content: str
    type: str = "info"

class RepairRequest(BaseModel):
    username: str

class MessageSendRequest(BaseModel):
    sender: str
    receiver: str
    subject: str
    body: str

class DiplomacyRequest(BaseModel):
    sender_tag: str
    receiver_tag: str
    type: str

class DiplomacyResponse(BaseModel):
    request_id: int
    response: str

# Configurar logging a archivo
logging.basicConfig(filename='app.log', level=logging.INFO, 
                    format='%(asctime)s %(levelname)s:%(message)s')
logger = logging.getLogger(__name__)

# Manejo de ciclo de vida de la app
game_state = GameState()
game_loop_task = None

async def game_loop():
    while True:
        try:
            game_state.update(1.0 / 60.0) # 60 FPS update
            async def send_to_client(cid, ws_client):
                try:
                    personalized_state = game_state.get_state(cid)
                    await ws_client.send_text(json.dumps({"type": "state", "state": personalized_state}))
                except Exception as e:
                    print(f"Error sending to {cid}: {e}", flush=True)
                    game_state.remove_player(cid)

            # Enviar estado a todos los clientes de forma paralela (No bloqueante)
            tasks = [asyncio.create_task(send_to_client(client_id, ws)) 
                     for client_id, ws in list(game_state.clients.items())]
            
            # Wait for short duration if needed, but the loop continues
            await asyncio.sleep(1.0 / 60.0)

        except Exception as e:
            print(f"Game loop master exception: {e}", flush=True)
            traceback.print_exc()
            await asyncio.sleep(1.0)

async def daily_scheduler():
    import datetime
    last_run = None
    print("Iniciador de programador diario listo...")
    while True:
        try:
            now = datetime.datetime.now()
            # Si son las 00:00 y no se ha ejecutado hoy
            if now.hour == 0 and now.minute == 0 and (last_run is None or last_run != now.date()):
                print(f"[{now}] EJECUTANDO RECAUDACIÓN DIARIA DE IMPUESTOS...")
                collect_all_taxes()
                last_run = now.date()
                logger.info("Recaudación diaria de impuestos completada.")
        except Exception as e:
            logger.error(f"Error en scheduler diario: {e}")
        
        await asyncio.sleep(30) # Comprobar cada 30 segundos

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Inicializando Base de Datos...")
    init_db()
    print("Iniciando bucle de juego...")
    global game_loop_task
    game_loop_task = asyncio.create_task(game_loop())
    
    print("Iniciando programador de impuestos...")
    asyncio.create_task(daily_scheduler())
    
    yield
    print("Deteniendo bucle de juego...")
    game_loop_task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/register")
async def api_register(req: RegisterRequest):
    result = register_user(req.username, req.email, req.password)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Registro completado exitosamente."}

from database import (
    init_db, register_user, login_user, set_user_faction, get_all_users, update_user, delete_user, 
    create_clan_db, get_available_clans, join_clan_db, get_user_clan_data, update_clan_metadata_db,
    leave_clan_db, kick_member_db, get_user_messages_db, mark_message_read_db, sync_user_stats, 
    update_clan_tax_db, collect_all_taxes, donate_from_clan_db, get_user_stats_db, get_clan_logs_db, 
    get_user_by_email_db, set_reset_token_db, get_user_by_token_db, update_password_by_token_db, 
    hash_password, get_leaderboard_db, send_user_message_db,
    add_diplomacy_request, respond_diplomacy_request, get_clan_diplomacy_status, get_all_clans_detailed
)

@app.post("/api/login")
async def api_login(req: LoginRequest):
    result = login_user(req.username, req.password)
    if not result["success"]:
        raise HTTPException(status_code=401, detail=result["error"])
    
    # Get extra clan data
    clan_data = get_user_clan_data(req.username)
    
    return {
        "username": result["username"], 
        "faction": result["faction"], 
        "is_admin": result.get("is_admin", False),
        "is_super_admin": result.get("is_super_admin", False),
        "level": result.get("level", 1),
        "xp": result.get("xp", 0),
        "credits": result.get("credits", 2000),
        "paladio": result.get("paladio", 0),
        "clan": clan_data
    }

@app.get("/api/clan/my")
async def api_get_my_clan(username: str):
    clan_data = get_user_clan_data(username)
    return {"clan": clan_data}

@app.get("/api/clans")
async def api_get_clans(search: str = None):
    clans = get_available_clans(search)
    return {"clans": clans}

@app.post("/api/clans")
async def api_create_clan(req: ClanCreateRequest):
    result = create_clan_db(req.tag, req.name, req.leader)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Clan fundado exitosamente."}

@app.post("/api/clans/join")
async def api_join_clan(req: ClanJoinRequest):
    result = join_clan_db(req.username, req.clan_tag)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Return updated clan data
    updated_clan = get_user_clan_data(req.username)
    return {"message": "Te has unido al clan exitosamente.", "clan": updated_clan}

@app.post("/api/clans/leave")
async def api_leave_clan(req: ClanLeaveRequest):
    result = leave_clan_db(req.username)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": result.get("message", "Has abandonado el clan.")}

@app.post("/api/clans/kick")
async def api_kick_member(req: ClanKickRequest):
    result = kick_member_db(req.username, req.target_username)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Miembro expulsado exitosamente."}

@app.post("/api/clans/tax")
async def api_update_clan_tax(req: ClanTaxRequest):
    success = update_clan_tax_db(req.clan_tag, req.tax_rate)
    if not success:
        raise HTTPException(status_code=500, detail="Error al actualizar la tasa de impuestos.")
    return {"message": "Tasa de impuestos actualizada exitosamente."}

@app.post("/api/clans/update")
async def api_update_clan_info(req: ClanUpdateInfoRequest):
    result = update_clan_metadata_db(
        req.old_tag, req.new_tag, req.name, req.description, req.status, req.news, req.logo
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Información del clan actualizada correctamente."}

@app.post("/api/clans/donate")
async def api_clan_donate(req: ClanDonateRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0.")
        
    result = donate_from_clan_db(req.clan_tag, req.target_username, req.amount, req.username)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Donación realizada con éxito.", "new_clan_credits": result["new_clan_credits"]}

@app.get("/api/clans/logs")
async def api_get_clan_logs(clan_tag: str):
    logs = get_clan_logs_db(clan_tag)
    return {"logs": logs}

# --- ENDPOINTS DE DIPLOMACIA ---

@app.get("/api/clans/all")
async def api_get_all_clans():
    clans = get_all_clans_detailed()
    return {"clans": clans}

@app.post("/api/clans/diplomacy/request")
async def api_diplomacy_request(req: DiplomacyRequest):
    result = add_diplomacy_request(req.sender_tag, req.receiver_tag, req.type)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"message": "Petición enviada correctamente."}

@app.post("/api/clans/diplomacy/respond")
async def api_diplomacy_respond(req: DiplomacyResponse):
    success = respond_diplomacy_request(req.request_id, req.response)
    if not success:
        raise HTTPException(status_code=500, detail="Error al procesar la respuesta.")
    return {"message": "Respuesta enviada correctamente."}

@app.get("/api/clans/diplomacy")
async def api_get_diplomacy(clan_tag: str):
    data = get_clan_diplomacy_status(clan_tag)
    return data

@app.post("/api/set_faction")
async def api_set_faction(req: SetFactionRequest):
    updated = set_user_faction(req.username, req.faction)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return {"message": "Facción actualizada exitosamente."}

@app.get("/api/messages")
async def api_get_messages(username: str):
    msgs = get_user_messages_db(username)
    return {"messages": msgs}

@app.post("/api/messages/send")
async def api_send_message(req: MessageSendRequest):
    success = send_user_message_db(req.sender, req.receiver, req.subject, req.body)
    if not success:
        raise HTTPException(status_code=500, detail="Error al enviar el mensaje.")
    return {"message": "Mensaje enviado con éxito."}

@app.get("/api/user/stats")
async def api_get_user_stats(username: str):
    stats = get_user_stats_db(username)
    if not stats:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return stats

@app.post("/api/user/sync")
async def api_user_sync(req: SyncRequest):
    success = sync_user_stats(req.username, req.level, req.xp, req.credits, req.paladio)
    if not success:
        raise HTTPException(status_code=500, detail="Error al sincronizar datos.")
    return {"message": "Sincronización exitosa."}

@app.post("/api/user/repair")
async def api_repair_ship(req: RepairRequest):
    REPAIR_COST = 500
    stats = get_user_stats_db(req.username)
    if not stats:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if stats["credits"] < REPAIR_COST:
        raise HTTPException(status_code=400, detail="Créditos insuficientes (500 necesarios)")
    
    # Encontrar jugador en la sesión activa si existe
    target_pid = None
    for pid, p in game_state.players.items():
        if p.get("user_id") == req.username:
            target_pid = pid
            break
            
    # Descontar créditos en DB
    new_credits = stats["credits"] - REPAIR_COST
    sync_user_stats(req.username, stats["level"], stats["xp"], new_credits, stats["paladio"])
    
    if target_pid:
        player = game_state.players[target_pid]
        player["hp"] = player["max_hp"]
        player["shld"] = player["max_shld"]
        player["is_dead"] = False
        player["credits"] = new_credits
        
        # Reaparecer en la base de la facción
        faction = player.get("faction", "MARS")
        base_map = "mars_1"
        if faction == "MOON": base_map = "moon_1"
        if faction == "PLUTO": base_map = "pluto_1"
        
        player["current_map"] = base_map
        player["x"] = 1750
        player["y"] = 1150
        player["vx"] = 0
        player["vy"] = 0
        
        return {"success": True, "credits": new_credits}
    else:
        return {"success": True, "credits": new_credits, "note": "Créditos descontados, pero no estás en una partida activa."}
@app.post("/api/forgot-password")
async def api_forgot_password(req: ForgotPasswordRequest):
    username = get_user_by_email_db(req.email)
    if not username:
        # Por seguridad no indicamos si el correo existe o no
        return {"message": "Si el correo está registrado, recibirás un enlace de recuperación."}
    
    token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(hours=1)
    set_reset_token_db(username, token, expiry.isoformat())
    
    # Simulación de envío de correo
    reset_link = f"http://localhost:5173/?token={token}"
    print(f"\n[EMAIL SIMULATION] Para: {req.email}")
    print(f"[EMAIL SIMULATION] Enlace: {reset_link}\n")
    logger.info(f"Password reset requested for {username}. Token generated.")
    
    return {"message": "Si el correo está registrado, recibirás un enlace de recuperación."}

@app.post("/api/reset-password")
async def api_reset_password(req: ResetPasswordRequest):
    row = get_user_by_token_db(req.token)
    if not row:
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
    
    username, expiry_str = row
    expiry = datetime.fromisoformat(expiry_str)
    
    if datetime.now() > expiry:
        raise HTTPException(status_code=400, detail="El token ha expirado.")
    
    hashed, salt = hash_password(req.password)
    update_password_by_token_db(req.token, hashed, salt)
    
    logger.info(f"Password successfully reset for {username}.")
    return {"message": "Tu contraseña ha sido actualizada correctamente."}

@app.get("/api/leaderboard")
async def api_get_leaderboard():
    leaderboard = get_leaderboard_db()
    return {"leaderboard": leaderboard}

async def api_mark_message_read(msg_id: int):
    success = mark_message_read_db(msg_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado.")
    return {"message": "Mensaje marcado como leído."}

# --- RUTAS DE ADMINISTRACIÓN ---

@app.get("/api/admin/users")
async def api_admin_get_users():
    users = get_all_users()
    return {"users": users}

@app.put("/api/admin/users/{username}")
async def api_admin_update_user(username: str, req: AdminUpdateRequest):
    result = update_user(
        username, req.username, req.email, req.faction,
        level=req.level, xp=req.xp, credits=req.credits, paladio=req.paladio,
        is_admin=req.is_admin, is_super_admin=req.is_super_admin
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Error actualizando el usuario"))
    return {"message": "Usuario actualizado"}

@app.delete("/api/admin/users/{username}")
async def api_admin_delete_user(username: str):
    success = delete_user(username)
    if not success:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario eliminado"}

# --- ENDPOINTS DE ANUNCIOS ---

@app.get("/api/announcements")
async def get_announcements():
    return {"announcements": get_announcements_db()}

@app.post("/api/admin/announcements")
async def create_announcement(req: AnnouncementRequest):
    if create_announcement_db(req.title, req.content, req.type):
        return {"message": "Anuncio publicado con éxito"}
    raise HTTPException(status_code=400, detail="Error al publicar anuncio")

@app.delete("/api/admin/announcements/{id}")
async def delete_announcement(id: int):
    if delete_announcement_db(id):
        return {"message": "Anuncio eliminado"}
    raise HTTPException(status_code=404, detail="Anuncio no encontrado")

import traceback
import logging

# Configurar logging a archivo
logging.basicConfig(filename='app.log', level=logging.INFO, 
                    format='%(asctime)s %(levelname)s:%(message)s')
logger = logging.getLogger(__name__)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    client_id = str(id(websocket))
    
    logger.info(f"Client connected, waiting for join: {client_id}")
    player_added = False
    
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            
            if data.get("type") == "join" and not player_added:
                ship_type = data.get("ship_type", "tank")
                modules = data.get("modules", [])
                user_id = data.get("userId") # Extraer el ID persistente
                initial_ammo = data.get("initial_ammo", {})
                initial_level = data.get("level", 1)
                initial_xp = data.get("xp", 0)
                initial_credits = data.get("credits", 2000)
                initial_paladio = data.get("initialPaladio", data.get("initialUridium", 0))
                initial_minerals = data.get("minerals", None)
                initial_upgrades = data.get("upgrades", None)
                clan = data.get("clan", "MARS") # Is Faction
                clan_tag = data.get("clanTag", None) # Is Actual Clan
                
                game_state.add_player(client_id, websocket, ship_type, initial_level, initial_xp, initial_credits, initial_paladio, initial_minerals, initial_upgrades, modules, initial_ammo, user_id=user_id, faction=clan, clan_tag=clan_tag)
                player_added = True
                logger.info(f"Player joined: {client_id} with ship {ship_type}, {len(modules)} modules, ammo {initial_ammo}, minerals {initial_minerals} and upgrades {initial_upgrades}")
                
            elif data.get("type") == "input" and player_added:
                keys = data.get("keys", {})
                game_state.handle_input(client_id, keys)
                
            elif data.get("type") == "buy" and player_added:
                module_data = data.get("module")
                if module_data:
                    game_state.buy_module(client_id, module_data)
                
            elif data.get("type") == "switch_ammo" and player_added:
                ammo_id = data.get("ammo_id")
                game_state.switch_ammo(client_id, ammo_id)
                
            elif data.get("type") == "jump_portal" and player_added:
                game_state.jump_portal(client_id)

            elif data.get("type") == "chat" and player_added:
                text = data.get("text")
                channel = data.get("channel", "global")
                if text:
                    game_state.handle_chat(client_id, text, channel)

            elif data.get("type") == "party_invite" and player_added:
                target_id = data.get("target_id")
                if target_id:
                    game_state.invite_to_party(client_id, target_id)
            
            elif data.get("type") == "party_join" and player_added:
                party_id = data.get("party_id")
                if party_id:
                    game_state.join_party(client_id, party_id)
            
            elif data.get("type") == "party_reject" and player_added:
                leader_id = data.get("leader_id")
                if leader_id:
                    game_state.reject_party(client_id, leader_id)
            
            elif data.get("type") == "party_leave" and player_added:
                game_state.leave_party(client_id)
            
            elif data.get("type") == "update_equipment" and player_added:
                modules = data.get("modules", [])
                game_state.update_equipped_modules(client_id, modules)
            
            elif data.get("type") == "update_resources" and player_added:
                ammo_data = data.get("ammo_data", {})
                game_state.update_resources(client_id, ammo_data)
                
    except WebSocketDisconnect as e:
        logger.info(f"Client disconnected: {client_id} Code: {e.code} Reason: {e.reason}")
    except Exception as e:
        logger.error(f"WS Error {client_id}: {e}", exc_info=True)
    finally:
        if player_added:
            logger.info(f"Removing player: {client_id}")
            game_state.remove_player(client_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
