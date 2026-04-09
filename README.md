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

### 👥 Sistema de Grupo Táctico (Party System)
- **Reclutamiento Rápido**: Fija el blanco en las naves de tus aliados haciendo clic en ellas e invítalos de forma remota a tu Grupo Táctico sin salir de la vista de combate.
- **HUD Integrado y Estado en Vivo**: Traslúcido y siempre accesible. Monitorea desde tu propia cabina la salud, los escudos y el estado de conexión de todo tu escuadrón en tiempo real.
- **Gestor de Invitaciones Dinámico**: Recibe solicitudes de grupo directamente en tu Interfaz (HUD). Acepta o rechaza inmediatamente mediante notificaciones emergentes in-game.
- **Recompensas Compartidas**: Pelear en grupo tiene sus beneficios; todas las victorias conseguidas estando en el mismo sector otorgan Créditos compartidos para acelerar el desarrollo del escuadrón.

### 🛡️ Zonas Seguras y Estaciones
- **Santuario Galáctico**: Tanto la Estación Central como los Portales Estelares cuentan con **Zonas Seguras** (anillo turquesa) donde eres invulnerable a los ataques.
- **Hangar de Mantenimiento**: La base es el único lugar habilitado para equipar y modificar módulos tácticos de la nave.

### 🏴 Gabinete de Alianzas (Sistema de Clanes)
- **Fundación y Gestión**: Crea o únete a un Clan. Los líderes tienen control absoluto para subir un logo de la alianza, editar la biografía, escribir un bloque táctico de Novedades y exhibir la sigla de la corporación públicamente.
- **Tripulación y Rangos**: Panel dedicado para revisar estadísticas en tiempo real (XP aportada por cada piloto) y asignar roles jerárquicos interactivos (Líder, Oficial, Piloto, Recluta).
- **Tesorería y Economía Interna**: Fija una **Tasa de Impuestos (0% al 5%)** con recaudación automática cada día a las **00:00 horas**.
- **Reparto de Fondos y Donaciones**: Los líderes pueden donar créditos desde la tesorería del clan directamente a las cuentas de cualquier miembro. El sistema verifica fondos y notifica al piloto mediante mensajes de sistema.
- **Auditoría Galáctica (Logs)**: Historial completo de movimientos de créditos. Registra cada impuesto cobrado y cada donación realizada con fecha, descripción y piloto involucrado.
- **Transmisiones (Correos)**: Sistema interno de mensajes con bandeja de entrada y enviados. Permite orquestar la alianza mandando correos privados o transmisiones masivas a toda la tripulación.

### 💰 Economía y Recursos
- **Uridium (💎)**: Moneda premium recolectable mediante **Cofres Especiales** que aparecen aleatoriamente por la galaxia.
- **Créditos (🔋)**: Ganados al destruir naves enemigas o batallando en tu Escuadrón.
- **Laboratorio de Minerales**: Refina recursos (Titanio, Plutonio, Silicio) recolectados de restos enemigos para obtener mejoras permanentes en Ataque, Escudo y Velocidad.

### ⚔️ Combate y HUD Cinematográfico
- **Efectos de Destrucción Estelar**: Sistema de partículas dinámicas que genera una explosión cinemática (destello radial y restos incandescentes) cuando una nave es destruida.
- **Protocolo de Emergencia (Reparación)**: Tras la derrota, los pilotos pueden restaurar su sistema de combate pagando **500 Créditos**. La reparación incluye el reabastecimiento total de salud/escudos y el salto automático a la **Sede Central de su Facción**.
- **HUD Dinámico de Nueva Generación**: Panel de estados equipado con barras de progreso animadas que muestran **Vida (❤️)** y **Escudo (🛡️)** en tiempo real. La barra de vida cambia de color dinámicamente según el estado crítico del casco.
- **Sincronización Total en Tiempo Real**: Sincronización bidireccional instantánea. Al equipar módulos de motor, armas o escudos en el Hangar, las estadísticas se recalculan y actualizan en el HUD del juego al milisegundo, permitiendo pruebas de equipo fluidas.
- **Hotbar Draggable & Lockable**: La barra de armas es arrastrable por el HUD y cuenta con un sistema de bloqueo (**🔒/🔓**) para evitar movimientos accidentales durante el combate.
- **Gestión de Munición**: Control de munición tanto para láseres como para misiles, con actualización en tiempo real desde la Tienda.

### ⚙️ Administración y Seguridad
- **Bases de Facción Autorritativas**: Puntos de reaparición estratégicos para **MARS**, **MOON** y **PLUTO**, cada uno con su propia Zona Segura dedicada.
- **Panel de Control de Servidor**: Herramientas para moderadores que permiten gestionar el estado de los sectores, expulsar usuarios conflictivos y monitorear la integridad de la base de datos en tiempo real.

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
- Completar las opciones de Diplomacia del Clan (alianzas/guerras formales) y Módulos de Estación.
- Añadir jefes finales (Bosses) en zonas específicas del mapa con botín de élite.
- Implementar Chat de Voz o Chat Global de Combate para mayor coordinación.
- Eventos dinámicos en el servidor con recompensas exclusivas.