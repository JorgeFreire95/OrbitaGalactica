from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from contextlib import asynccontextmanager

from game_logic import GameState

# Manejo de ciclo de vida de la app
game_state = GameState()
game_loop_task = None

async def game_loop():
    while True:
        try:
            game_state.update(1.0 / 60.0) # 60 FPS update
            # Broadcast state
            state = game_state.get_state()
            
            # We need to send subjective state (who is "self") to each client
            disconnected_clients = []
            for client_id, ws in list(game_state.clients.items()):
                try:
                    # Modificamos el estado para que el cliente sepa cuál es su nave
                    personalized_state = state.copy()
                    personalized_state["players"] = [
                        {**p, "is_self": p["id"] == client_id} for p in state["players"]
                    ]
                    await ws.send_text(json.dumps({"type": "state", "state": personalized_state}))
                except Exception as e:
                    print(f"Error sending to {client_id}: {e}", flush=True)
                    traceback.print_exc()
                    disconnected_clients.append(client_id)
                    
            for client_id in disconnected_clients:
                game_state.remove_player(client_id)
                
            await asyncio.sleep(1.0 / 60.0)
        except Exception as e:
            print(f"Game loop master exception: {e}", flush=True)
            traceback.print_exc()
            await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando bucle de juego...")
    global game_loop_task
    game_loop_task = asyncio.create_task(game_loop())
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
                initial_ammo = data.get("initial_ammo", {}) # Corrected key
                initial_level = data.get("level", 1)
                initial_xp = data.get("xp", 0)
                initial_credits = data.get("credits", 2000)
                initial_minerals = data.get("minerals", None)
                initial_upgrades = data.get("upgrades", None)
                game_state.add_player(client_id, websocket, ship_type, initial_level, initial_xp, initial_credits, initial_minerals, initial_upgrades, modules, initial_ammo)
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
