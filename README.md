# 🚀 Órbita Galáctica - Proyecto Espacial Multijugador

**Órbita Galáctica** es una plataforma de combate espacial masivo basado en web. Este repositorio sigue una estructura orientada a la **Metodología Scrum**, priorizando la entrega de valor incremental y la transparencia en el desarrollo de funcionalidades.

---

## 🎯 1. Visión del Producto (Product Vision)
Crear la experiencia de combate espacial definitiva en el navegador, combinando un motor de físicas autoritativo en Python con una interfaz de usuario premium en React, permitiendo a miles de pilotos competir, socializar y progresar en una galaxia persistente con un enfoque en la personalización táctica y el juego en equipo.

---

## 📋 2. Product Backlog (Funcionalidades Implementadas)

### 🛸 Épica: Navegación y Mundo Persistente
- **Core Engine**: Motor de renderizado en Canvas API con WebSockets para latencia mínima.
- **Atlas Galáctico**: Sistema de 24 sectores divididos por facciones (**MARS, MOON, PLUTO**) y una **Zona Neutral** de paz.
- **Gateway Network**: Portales estelares reubicados dinámicamente para flujo táctico optimizado en sectores críticos (Cañón del Óxido).
- **Persistencia Autoritativa**: Sincronización instantánea de estadísticas (HP, Carga, Escudo) con recalculación inmediata en el servidor.

### ⚔️ Épica: Combate y Personalización
- **Flota Estelar**: 10 modelos de naves, incluyendo la nueva **Helix Support** especializada en soporte táctico.
- **Diseños Legendarios (Premium Skins)**: Sistema de personalización con bonos de combate reales (HP, Escudo, Daño, Absorción).
- **Arsenal Inteligente**: Láseres de 4 niveles y misiles teledirigidos (**M-1 Seta, M-2 Ciclón, M-3 Giga-Nuke**).
- **CPU de Misil Automático (CPU-MA)**: Sistema de fuego autónomo con seguimiento (Homing) y sincronización de stock.
- **Módulos de Sigilo**: Tecnología de invisibilidad estándar y **Invisibilidad Avanzada** (ataque sin revelación).
- **Habilidades de Clase**: Habilidades activas únicas (**Invulnerabilidad, Provocación, Refuerzo de Escudo**).
- **Laboratorio de Minerales**: Refinado de recursos con bonos porcentuales (**+15% HP, +10% SHLD, +8% SPD, +5% ATK**). Ahora con iconos de alta resolución (**Titanio, Plutonio**).
- **CPUs de Expansión**: Módulos de ranuras adicionales (Nivel 1, 2 y 3) con visuales premium que muestran la capacidad de slots.

### 🤖 Épica: Sistemas de Apoyo (Drones & AI)
- **E.C.O. (Emergency Companion Observer)**: Drone inteligente con nivel propio, sistema de combustible y protocolos de auto-reparación.
- **Wips (Drones de Ataque)**: Escuadrón de hasta 8 unidades. Ahora con **Sincronización de Utilidades** (Auto-reparación, Turbo-misiles).
- **Helix Beacons**: Despliegue de unidades tácticas de reparación de vida y escudo (10,000 unidades por tick).

### 👥 Épica: Social y Diplomacia
- **Comercio Eficiente**: Sistema de **Compra en Bloque** en la tienda para equipamiento y munición con validación de ranuras.
- **Party System**: Grupos tácticos con HUD compartido y recompensas divididas.
- **Sindicatos (Clanes)**: Fundación de alianzas, gestión de tesorería, rangos y diplomacia.
- **Mercado Estelar**: Casa de subastas sincronizada para items exclusivos.
- **HUD Táctico Modular**: Interfaz de combate con ChatBox movible, barra de habilidades dinámica y **Reloj Local Persistente** (Fecha/Hora).
- **Legibilidad Visual**: Sistema de siglas de alta visibilidad en hotbar con superposición inteligente de stock.
- **Insignias de Estatus**: Indicadores Visuales para usuarios **VIP** y estado **BETA** con animaciones dinámicas de pulso.
- **Identidad Corporativa**: Proceso de registro con logotipos oficiales de **MARS, MOON y PLUTO** y efectos visuales de facción.

### 📜 Épica: Progresión y Desafíos (Misiones)
- **Nivelación Progresiva**: Sistema de progresión re-balanceado con curva de dificultad cuadrática (Base 15,000 XP) para un escalado de nivel más desafiante.
- **Centro de Operaciones**: Sistema de misiones con interfaz de **Cartas 3D (Flip Effect)** para visualización de recompensas.
- **Campaña Global**: +1000 misiones disponibles, incluyendo 240 misiones de **Invasión** categorizadas por facción.
- **Loyalty Filter**: Sistema de filtrado inteligente que bloquea misiones contra la propia empresa para mantener coherencia táctica.
- **Botín Proporcional**: Recompensas escaladas por dificultad de nave enemiga (Multiplicadores desde 1.0x hasta 45.0x).

---

## 🛠️ 3. Tech Stack (Herramientas de Desarrollo)

| Componente | Tecnología | Rol |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Interfaz de Usuario y Gestión de Estado |
| **Gráficos** | Canvas API | Motor de Renderizado 2D y Partículas |
| **Backend** | Python + FastAPI | Lógica Autoritativa y Gestión de Websockets |
| **Protocolo** | WebSockets (WS) | Sincronización de Baja Latencia |
| **Estilos** | Vanilla CSS | Estética "Glassmorphism" Premium |

---

## 📈 4. Sprint Status (Estado Actual del Desarrollo)

### ✅ Done (Terminado en el último incremento)
- **Sincronización de Carga (CMP-C)**: Sincronización instantánea de bodega tras equipar módulos de compresión.
- **Reloj del Sistema Local**: Integración de tiempo real del usuario en el HUD para sesiones persistentes.
- **Visuales de Vanguardia**: Eliminación de iconos genéricos (🔧) y uso de assets visuales de alta calidad para drones de reparación.
- **Localización Temporal**: Formato de fecha y hora estandarizado a nivel local en correos y HUD.
- **Red de Portales**: Reubicación estratégica de accesos en el sector Cañón del Óxido (mars_2).
- **Curva de Nivelación**: Implementación de progresión exponencial para un endgame más longevo.
- **Sistema de Invasión**: Despliegue de misiones por empresa con recompensas escaladas por dificultad.
- **UI de Misiones 2.0**: Navegación lateral por subcategorías (Aliens/Empresas) y tarjetas interactivas.
- **Premium Asset Overhaul**: Sustitución de emojis por assets de alta fidelidad (4K/Futuristas) para CPUs de Ranuras y Minerales Estratégicos.
- **Onboarding de Facción**: Integración de logotipos oficiales y micro-animaciones en la selección de empresa durante el registro.
- **Persistencia de Transacciones**: Corrección del flujo de sincronización de misiles y munición, asegurando deducción y guardado persistente (Cero-Bloqueo).
- **Sistema de XP Progresivo (V2)**: Refactorización completa del algoritmo de nivelación con base de 15,000 XP y escalado dinámico por nivel.
- **Visualizador de Progreso (HUD)**: Integración de una barra de XP táctica con gradiente dinámico y efectos de brillo para seguimiento en tiempo real.
- **Logística Galáctica (Pluto-8)**: Relocalización estratégica de la Estación Central en el sector Resplandor de Hielo para optimizar la defensa de la frontera.

### 🏃 In Progress (Sprint Actual)
- Optimización de colisiones en sectores de alta densidad.
- Mejora de IA para naves alienígenas tipo "Drakon".
- Implementación de efectos visuales (Aura de Invulnerabilidad y Beacons).
- Refactorización del motor de efectos especiales para partículas de alta densidad.

### 📅 To Do (Siguientes Sprints)
- **Módulos de Estación**: Bases conquistables por clanes.
- **Chat de Voz**: Integración de proximidad para escuadrones.
- **Eventos Globales**: Invasiones alienígenas programadas.

---

## 🚀 5. Definición de Listo (How to Run)

### Requisitos Previos
- Node.js (v16+)
- Python (3.9+)

### Ejecución del Proyecto
1. **Servidor (Backend)**:
   ```bash
   cd backend
   pip install fastapi uvicorn
   python main.py
   ```
2. **Cliente (Frontend)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
Acceso local: `http://localhost:5173`

---

## ⚖️ 6. Definición de Hecho (Definition of Done)
- Código limpio y documentado.
- Sincronización Servidor-Cliente validada (Autorritatividad).
- Interfaz responsiva y estética "Premium" garantizada.
- Sin errores de consola críticos en el motor de renderizado.

---

*Órbita Galáctica - Desarrollado bajo estándares de agilidad y excelencia tecnológica.*
