# 🚀 Órbita Galáctica

**Órbita Galáctica** es un emocionante juego de disparos espacial multijugador online creado con tecnologías web modernas. Pilota tu nave, destruye alienígenas, recolecta recursos y personaliza tu arsenal para convertirte en el as del espacio.

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React + Vite**: Interfaz de usuario rápida y reactiva.
- **Canvas API**: Motor de renderizado 2D de alto rendimiento para el combate espacial.
- **WebSockets**: Comunicación bidireccional en tiempo real para el multijugador.
- **Vanilla CSS**: Estilizado personalizado para una estética de ciencia ficción "premium".

### Backend
- **Python + FastAPI**: Servidor de alto rendimiento para la gestión de la lógica del juego.
- **WebSockets**: Sincronización de estado entre múltiples clientes simultáneos.
- **Pydantic**: Gestión de esquemas de datos y validación.

---

## 🎮 Funcionalidades Principales

### 🛸 Navegación y Mundo Galáctico
- **Multimapa y Sectores**: Sistema de múltiples sectores (**Sector Alfa** y **Sector Beta**) con escalado de dificultad. El Sector Beta contiene enemigos de élite con blindaje pesado.
- **Portales Estelares (Wormholes)**: Agujeros de gusano funcionales para viajar entre sectores. Requieren activación manual mediante la tecla **'J'**, con animación de flash de salto hiperespacial.
- **Minimapa Táctico**: Radar en tiempo real que incluye un **Radar de Proximidad** para detectar cofres especiales en un rango de 2500m.
- **Persistencia de Sesión (Autoritativa)**: Tu progreso se guarda automáticamente. Incluye posición exacta (`X, Y`), sector actual, créditos, uridium, nivel, XP y munición. Retoma tu misión exactamente donde la dejaste.

### 🛡️ Zonas Seguras y Estaciones
- **Santuario Galáctico**: Tanto la Estación Central como los Portales Estelares cuentan con **Zonas Seguras** (anillo turquesa) donde eres invulnerable a los ataques.
- **Hangar de Mantenimiento**: La base es el único lugar habilitado para equipar y modificar módulos tácticos de la nave.

### 💰 Economía y Recursos
- **Uridium (💎)**: Moneda premium recolectable mediante **Cofres Especiales** que aparecen aleatoriamente por la galaxia.
- **Créditos (🔋)**: Ganados al destruir naves enemigas.
- **Laboratorio de Minerales**: Refina recursos (Titanio, Plutonio, Silicio) recolectados de restos enemigos para obtener mejoras permanentes en Ataque, Escudo y Velocidad.

### ⚔️ Combate y HUD Avanzado
- **Munición Finita**: Todas las municiones, incluida la **Estándar**, son limitadas y deben ser gestionadas. Puedes reabastecerte en la tienda (1000 disparos por 50 Créditos).
- **HUD Modernizado**: Interfaz limpia con cabeceras minimalistas en Menú, Tienda y Hangar. 
- **Hotbar Draggable & Lockable**: La barra de armas es arrastrable por el HUD y cuenta con un sistema de bloqueo (**🔒/🔓**) para evitar movimientos accidentales durante el combate.
- **Sincronización en Tiempo Real**: Sincronización fluida entre la Tienda y el Juego. Las compras realizadas en el menú se reflejan instantáneamente al despegar.

---

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js (v16+)
- Python (3.9+)

### Configuración del Backend
```bash
cd backend
pip install fastapi uvicorn
python main.py
```

### Configuración del Frontend
```bash
cd frontend
npm install
npm run dev
```

El juego estará disponible en `http://localhost:5173`.

---

## 🌌 Próximos Pasos
- Implementar clanes y escuadrones.
- Añadir jefes finales (Bosses) en zonas específicas del mapa.
- Eventos dinámicos en el servidor con recompensas exclusivas.