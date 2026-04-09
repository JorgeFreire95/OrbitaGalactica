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
- **Persistencia de Sesión (Autoritativa)**: Tu progreso se guarda automáticamente. Incluye posición exacta (`X, Y`), sector actual, créditos, paladio, nivel, XP y munición. Retoma tu misión exactamente donde la dejaste.

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
- **Paladio (🪐)**: Recurso valioso recolectable mediante **Cofres Especiales** que aparecen aleatoriamente por la galaxia.
- **Créditos (🔋)**: Moneda básica ganada al destruir naves enemigas o batallando en tu Escuadrón.
- **Laboratorio de Minerales**: Refina recursos (Titanio, Plutonio, Silicio) recolectados de restos enemigos para obtener mejoras permanentes en Ataque, Escudo y Velocidad.

### 👾 Bestiario Alienígena y Amenaza Activa
El universo de Órbita Galáctica es ahora más peligroso. Todos los alienígenas han sido reprogramados con un **Protocolo de Caza Activa**:
- **IA de Cazador (Hunter AI)**: Los alienígenas no solo deambulan; ahora detectan tu presencia, te persiguen y abren fuego de forma agresiva.
- **Escalado Táctico**: La velocidad de proyectiles y la cadencia de fuego de los aliens aumenta dinámicamente según el nivel del mapa.
- **Visualización de Daño Hostil**: Los impactos recibidos de naves alienígenas se muestran en **rojo brillante** en el HUD, permitiendo identificar rápidamente la gravedad del combate.

Razas detectadas:
- **Gryllos**: Depredadores básicos rápidos que atacan en enjambre (S1).
- **Xylos**: Blindaje ligero (Nvl 2).
- **Nykor**: Entidades acorazadas (Nvl 3).
- **Syrith**: Defensores pesados (Nvl 4).
- **Vexis**: Gran capacidad regenerativa (Nvl 5).
- **Kragos**: Guerreros de élite (Nvl 6).
- **Zoltan**: Comandantes fenomenales (Nvl 7).
- **Drakon**: Amenaza suprema de nivel 8. Solo para expertos.

### ⚔️ Combate y HUD Cinematográfico
- **Efectos de Destrucción Estelar**: Explosiones dinámicas con destello radial al destruir enemigos.
- **Protocolo de Emergencia (Reparación)**: Restauración de sistemas por **500 Créditos** con salto a la Sede Central.
- **HUD Dinámico**: Barras de **Vida (❤️)** y **Escudo (🛡️)** animadas con cambios de color según el estado crítico.
- **Sincronización Autorritativa**: Modificaciones en el Hangar se reflejan instantáneamente en las estadísticas de combate.
- **Feedback de Daño Dual**: Los daños infligidos por el jugador son blancos/amarillos, mientras que el daño recibido de aliens es **rojo**, mejorando la conciencia táctica.

### 💰 Economía y Suministros
- **Packs de Munición Masivos**: Toda la munición (Láser y Misiles) se vende ahora en **Packs de 1000 unidades**, permitiendo misiones de larga duración sin reabastecimientos constantes.
- **Reequilibrio de Misiles**: Precios de misiles ajustados para ser más competitivos y relativos a la munición láser, facilitando el uso de armamento pesado (M-1, M-2, M-3).
- **Minerales y Refinería**: Refina recursos (Titanio, Plutonio, Silicio) para obtener mejoras permanentes en Ataque, Escudo y Velocidad.

### 🎨 Identidad Visual y UI Premium
- **Nuevo Logo "Galactic Identity"**: Integración de un logo de alta fidelidad con efectos de resplandor neón en la cabecera.
- **Interfaz Glassmorphism**: Paneles de registro y navegación con efectos de cristal esmerilado y desenfoque dinámico.
- **Marca de Agua Táctica**: El logo principal se integra como marca de agua en los fondos de los paneles de acceso para una experiencia más inmersiva.
- **Título Estilizado**: Uso consistente de tipografía *Orbitron* con efectos de sombreado y neón en toda la identidad del juego.

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


