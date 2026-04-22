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
- **Portales Estelares (Standardized Gateway Network)**: Red de portales optimizada con coordenadas estandarizadas para facilitar la navegación táctica. Los portales de retroceso se ubican en **(1600, 1920)** y los de avance en **(17532, 14300)** en la mayoría de los sectores. Además, se han habilitado **Atajos de Salto de Emergencia** que conectan sectores estratégicos (como Nvl 5 directamente con Nvl 7), optimizando las rutas comerciales y militares. Los saltos requieren activación manual mediante la tecla **'J'**.
- **Zona Neutral 1 (Hub Central)**: Mapa central estratégico que actúa como nexo entre las tres facciones (**MARS, MOON, PLUTO**). Este sector ha sido designado como **Zona de Paz total**, donde no aparecen naves alienígenas hostiles, permitiendo el encuentro entre pilotos y la transición segura entre sistemas.
- **Minimapa Táctico**: Radar en tiempo real que incluye un **Radar de Proximidad** para detectar cofres especiales en un rango de 2500m y detección temprana de naves alienígenas.
- **Persistencia de Sesión y Sincronización Multi-Ventana**: Tu progreso (Nivel, XP, Créditos, Paladio, Naves y Equipo) se guarda automáticamente tanto en base de datos como en tiempo real. Se ha implementado un sistema de **Sincronización Multi-Pestaña** que asegura que, si realizas compras o cambios en una ventana, todas las demás se actualicen inmediatamente.
- **Sistema de Experiencia Total Acumulada**: Se ha refactorizado el sistema de progresión para que los puntos de experiencia (XP) sean un **total acumulado** de por vida. Al subir de nivel, los puntos no se consumen ni se reinician a cero, permitiendo una visualización continua del esfuerzo del piloto. Se ha implementado una fórmula de escalado cuadrático para los umbrales de nivel, asegurando un reto constante mientras se mantiene la integridad de los puntos ganados.
- **Inicio de Carrera Autorritativo**: Los nuevos pilotos comienzan su carrera en **Nivel 1** con equipamiento básico. Al unirse por primera vez o elegir empresa, los pilotos aparecen en su **Mapa de Inicio** dedicado (**Sector de Hierro** para MARS, **Bahía de Selene** para MOON, **Abismo de Caronte** para PLUTO) exactamente en las coordenadas de la base (1750, 1150).

### 👥 Sistema de Grupo Táctico (Party System)
- **Reclutamiento Rápido**: Fija el blanco en las naves de tus aliados haciendo clic en ellas e invítalos de forma remota a tu Grupo Táctico sin salir de la vista de combate.
- **HUD Integrado y Estado en Vivo**: Traslúcido y siempre accesible. Monitorea desde tu propia cabina la salud, los escudos y el estado de conexión de todo tu escuadrón en tiempo real.
- **Gestor de Invitaciones Dinámico**: Recibe solicitudes de grupo directamente en tu Interfaz (HUD). Acepta o rechaza inmediatamente mediante notificaciones emergentes in-game.
- **Recompensas Compartidas**: Pelear en grupo tiene sus beneficios; todas las victorias conseguidas estando en el mismo sector otorgan Créditos compartidos para acelerar el desarrollo del escuadrón.

### 🎯 Sistema de Misiones Tácticas
- **HUD de Seguimiento en Tiempo Real**: Nueva mini-ventana persistente en la cabina de combate que monitorea el progreso de tus misiones activas (tipo de alien, contador de bajas y recompensas). Su diseño *glassmorphism* permite leer los objetivos sin obstruir la vista del espacio.
- **Cobro Automático de Recompensas**: Las misiones ahora aplican sus beneficios (XP, Créditos, Munición) de forma **instantánea** al alcanzar el objetivo. Ya no es necesario navegar por los menús para cobrar tus premios.
- **Bitácora Dinámica**: La lista de objetivos se actualiza en tiempo real; las misiones completadas y cobradas desaparecen automáticamente del HUD para mantener una interfaz limpia y enfocada en el combate.
- **Sincronización Optimizada (On-Demand Sync)**: Sistema de comunicación inteligente que actualiza los datos de misiones solo cuando hay cambios significativos, garantizando que el HUD esté siempre al día con el mínimo impacto en la latencia.

### 🛡️ Zonas Seguras y Estaciones
- **Estación Central: Mega-Estructura Industrial**: Rediseño completo de la base principal. Una imponente estructura isométrica vertical con plataformas de aterrizaje asimétricas, iluminación de balizas dinámica, paneles de advertencia ("hazard stripes") y un puente de mando hexagonal iluminado por neón.
- **Santuario Galáctico**: Tanto la Estación Central como los Portales Estelares cuentan con **Zonas Seguras** (anillo turquesa) donde eres invulnerable a los ataques.
- **Hangar de Mantenimiento**: La base es el único lugar habilitado para equipar y modificar módulos tácticos de la nave.

### 🏴 Gabinete de Alianzas (Sistema de Clanes)
- **Fundación y Gestión**: Crea o únete a un Clan. Los líderes tienen control absoluto para subir un logo de la alianza, editar la biografía, escribir un bloque táctico de Novedades y exhibir la sigla de la corporación públicamente.
- **Tripulación y Rangos**: Panel dedicado para revisar estadísticas en tiempo real (XP aportada por cada piloto) y asignar roles jerárquicos interactivos (Líder, Oficial, Piloto, Recluta).
- **Tesorería y Economía Interna**: Fija una **Tasa de Impuestos (0% al 5%)** con recaudación automática cada día a las **00:00 horas**.
- **Reparto de Fondos y Donaciones**: Los líderes pueden donar créditos desde la tesorería del clan directamente a las cuentas de cualquier miembro. El sistema verifica fondos y notifica al piloto mediante mensajes de sistema.
- **Auditoría Galáctica (Logs)**: Historial completo de movimientos de créditos. Registra cada impuesto cobrado y cada donación realizada con fecha, descripción y piloto involucrado.
- **Transmisiones (Correos)**: Sistema interno de mensajes con bandeja de entrada y enviados. Permite orquestar la alianza mandando correos privados o transmisiones masivas a toda la tripulación.
- **Centro de Diplomacia Galáctica**: Sistema avanzado de relaciones exteriores con buscador global de clanes.
    - **Menú Contextual Táctico**: Clic derecho sobre cualquier nombre de clan para proponer Alianzas, Pactos de No Agresión (PNA) o Declarar la Guerra.
    - **Aceptación Bilateral**: Las alianzas y guerras requieren la ratificación del clan receptor, asegurando una diplomacia formal y equilibrada.
    - **Panel de Relaciones**: Seguimiento en tiempo real de alianzas estratégicas y hostilidades activas directamente desde el dashboard.

### 💰 Economía y Recursos
- **Créditos (🔋)**: Moneda básica ganada al destruir naves enemigas o batallando en tu Escuadrón.
- **Paladio (🪐)**: Recurso valioso utilizado para compras avanzadas en la tienda y mejoras de élite.
- **Laboratorio de Minerales (Sincronización Total y Persistencia)**: Refina recursos (**Titanio, Plutonio, Silicio e Iridio**) para obtener mejoras **acumulables** en Ataque, Escudo, Velocidad e Integridad de Casco (HP). Ahora el sistema es 100% autorritativo: las mejoras se guardan en el servidor y persisten entre sesiones, aplicándose instantáneamente a tu nave activa mediante WebSockets y APIs de sincronización.
- **Beneficios VIP**: Los usuarios con estatus VIP disfrutan de **Reparación Gratuita** ilimitada y un **10% de descuento** en todas las compras de Paladio en la tienda.

### 📦 Cofres Especiales (Botín de Exploración)
Los **Cofres Especiales** (resaltados en el radar) aparecen de forma aleatoria en todos los sectores. Al recolectarlos, otorgan de forma aleatoria una de las siguientes recompensas:
- **💰 Créditos (40%)**: Entre **1,000 y 5,000** Créditos.
- **🔫 Munición Láser (25%)**: Entre **50 y 150** unidades de munición Térmica, Plasma o Sifón.
- **🚀 Misiles (15%)**: Entre **5 y 15** misiles (M-1, M-2 o M-3).
- **🪐 Paladio (20%)**: Entre **2 y 10** unidades de Paladio.

### ⛴️ Flota Estelar (Naves Disponibles)
Elige la nave que mejor se adapte a tu estilo de juego. Desde veloces interceptores hasta fortalezas pesadas:

#### 🔸 Naves Regulares (Créditos)
- **Phoenix (Básica)**: La nave de inicio. Equilibrada y ligera, perfecta para aprender las mecánicas básicas del sector.
- **Aegis Vanguard (Tanque)**: Diseñada para absorber daño. Cuenta con **6 ranuras de escudo** y una integridad estructural superior.
- **Nova Striker (Rápida)**: Especialista en velocidad. Con **7 ranuras de motor**, es la nave ideal para misiones de transporte rápido y evasión.
- **Orion Phantom (Sigilo)**: Alta capacidad ofensiva. Sus **5 ranuras de láser** y bonos de sigilo la hacen perfecta para el combate táctico.
- **Titan Hammer (Pesada)**: Fuerza bruta. Sacrifica velocidad por un arsenal devastador de **8 ranuras de láser**.
- **Helix Support (Soporte)**: La reina de la versatilidad. Sus **6 ranuras de utilidad** permiten equipar una gran variedad de módulos tecnológicos.

#### 💎 Naves de Élite (Paladio)
- **Sovereign Exterminator**: El pináculo de la guerra. Equipada con **15 ranuras de láser**, es capaz de borrar flotas enteras del radar.
- **Cosmic Harvester**: La nave definitiva para mineros. Su bodega de **10,000 unidades** permite expediciones de recolección masivas.
- **Solar Wind (Interceptor)**: La nave más rápida de la galaxia. Su diseño de propulsión iónica permite una **velocidad de 65 base**, siendo virtualmente imposible de fijar.
- **Obsidian Bastion (Fortaleza)**: Una muralla impenetrable. Con **15 ranuras de escudo** e integridad reforzada, es la nave ideal para liderar asaltos a estaciones.

---

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

#### 👑 Variantes "Boss" (Jefes de Élite)
Cualquier especie alienígena tiene un **5% de probabilidad** de aparecer como una versión **Boss**. Estas naves son el terror de los pilotos solitarios:
- **Estadísticas Superiores**: Poseen un **20% más de vida, escudo y daño** sobre su versión base.
- **Identificación Visual**: Son un **60% más grandes** que los aliens normales y emiten una distintiva **Aura Púrpura** de energía inestable.
- **Recompensas Legendarias**: Destruir un Boss otorga **5 veces más XP y Créditos**, además de **3 veces más Paladio**.
- **Botín Compartido**: Si estás en un grupo (Party), las recompensas de un Boss se reparten entre todos los miembros cercanos, acelerando el progreso del escuadrón.

### 🌌 Atlas Galáctico (Sectores por Facción)
Explora la vasta extensión del espacio a través de los diversos sectores controlados por las tres grandes potencias:

#### 🔴 Corporación MARS (Fuerza y Expansión)
1. **Sector de Hierro** (Mars 1) - Base de Inicio
2. **Cañón del Óxido** (Mars 2)
3. **Fundición Ares** (Mars 3)
4. **Valles de Magma** (Mars 4)
5. **Base Dust-Storm** (Mars 5)
6. **Cantera Olympus** (Mars 6)
7. **Puesto de Avanzada Phobos** (Mars 7)
8. **Plataforma de Asedio** (Mars 8) - Avanzada Militar

#### 🔵 Orden de la MOON (Tecnología y Orden)
1. **Bahía de Selene** (Moon 1) - Base de Inicio
2. **Cráter de Cristal** (Moon 2)
3. **Estación de Relevo Zenit** (Moon 3)
4. **Mar de la Tranquilidad** (Moon 4)
5. **Observatorio L-1** (Moon 5)
6. **Domos de Biodiversidad** (Moon 6)
7. **Refinería de Helio-3** (Moon 7)
8. **Anillo de Plata** (Moon 8) - Avanzada Tecnológica

#### 🟣 Sindicato PLUTO (Supervivencia y Vacío)
1. **Abismo de Caronte** (Pluto 1) - Base de Inicio
2. **Glaciar Eterno** (Pluto 2)
3. **Nébula de Cobalto** (Pluto 3)
4. **Punta del Horizonte** (Pluto 4)
5. **Cripta de Escarcha** (Pluto 5)
6. **Vórtice Sombrío** (Pluto 6)
7. **Estación Exilio** (Pluto 7)
8. **Resplandor de Hielo** (Pluto 8) - Avanzada del Vacío

#### ⚪ Zona Neutral (Hub de Interconexión)
1. **Zona Neutral 1** (Neutral 1) - **Santuario sin Aliens**. Conecta directamente con:
   - **Valles de Magma** (Mars 4)
   - **Base Dust-Storm** (Mars 5)
   - **Mar de la Tranquilidad** (Moon 4)
   - **Observatorio L-1** (Moon 5)
   - **Punta del Horizonte** (Pluto 4)
   - **Cripta de Escarcha** (Pluto 5)

### ⚔️ Combate y HUD Cinematográfico
- **Efectos de Destrucción Estelar**: Explosiones dinámicas con destello radial al destruir enemigos.
- **Protocolo de Emergencia (Reparación)**: Restauración de sistemas por **500 Créditos** con salto a la Sede Central.
- **HUD Dinámico**: Barras de **Vida (❤️)** y **Escudo (🛡️)** animadas con cambios de color según el estado crítico.
- **Sincronización Autorritativa**: Modificaciones en el Hangar se reflejan instantáneamente en las estadísticas de combate.
- **Feedback de Daño Dual**: Los daños infligidos por el jugador son blancos/amarillos, mientras que el daño recibido de aliens es **rojo**, mejorando la conciencia táctica.
- **Sistemas de Bio-Retroalimentación**: Las reparaciones en tiempo real muestran mensajes flotantes de curación (**+HP 💚**) en color turquesa neón, permitiendo monitorear la recuperación de integridad estructural sin apartar la vista del combate.
- **Sistema de Misiles Inteligentes**: Los misiles ahora son **teledirigidos**. Requieren que un alienígena esté marcado/fijado como blanco para ser disparados (Tecla 'E'), persiguiendo automáticamente al objetivo hasta el impacto.

### 💰 Economía y Suministros
- **Packs de Munición Masivos**: Toda la munición (Láser y Misiles) se vende ahora en **Packs de 1000 unidades**, permitiendo misiones de larga duración sin reabastecimientos constantes.
- **Reequilibrio de Misiles**: Precios de misiles ajustados para ser más competitivos y relativos a la munición láser, facilitando el uso de armamento pesado (M-1, M-2, M-3).
- **Minerales y Refinería (Arquitectura de Persistencia)**: Refina recursos (Titanio, Plutonio, Silicio e Iridio) para obtener mejoras instantáneas. El sistema utiliza una arquitectura **Server-Side** donde cada mejora se persiste en la base de datos y se sincroniza en tiempo real con el motor de físicas del servidor, garantizando que el incremento en velocidad, daño o resistencia sea inmediato y permanente hasta su expiración (2 horas).

### 🎨 Identidad Visual y UI Premium
- **Nuevo Logo "Galactic Identity"**: Integración de un logo de alta fidelidad con efectos de resplandor neón en la cabecera.
- **Interfaz Glassmorphism**: Paneles de registro y navegación con efectos de cristal esmerilado y desenfoque dinámico.
- **Marca de Agua Táctica**: El logo principal se integra como marca de agua en los fondos de los paneles de acceso para una experiencia más inmersiva.
- **Título Estilizado**: Uso consistente de tipografía *Orbitron* con efectos de sombreado y neón en toda la identidad del juego.

### ⚙️ Administración y Seguridad
- **Bases de Facción Autorritativas**: Puntos de reaparición estratégicos para **MARS**, **MOON** y **PLUTO**, cada uno con su propia Zona Segura dedicada.
- **Panel de Control de Servidor**: Herramientas para moderadores que permiten gestionar el estado de los sectores, expulsar usuarios conflictivos, revocar beneficios VIP y monitorear la integridad de la base de datos en tiempo real.
- **Privacidad de Hangar**: Sistema de inventario robusto que asegura que las naves y equipamiento comprados sean exclusivos de cada cuenta, evitando fugas de datos entre perfiles de usuario.

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
- Implementar Módulos de Estación y bases de clan conquistables.
- Implementar Chat de Voz o Chat Global de Combate para mayor coordinación.
- Eventos dinámicos en el servidor con recompensas exclusivas.


