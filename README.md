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
- **Gateway Network**: Portales estelares y atajos de salto de emergencia (Tecla 'J').
- **Persistencia Autoritativa**: Sincronización en tiempo real de XP, Créditos, Paladio y Equipamiento.

### ⚔️ Épica: Combate y Personalización
- **Flota Estelar**: 10 modelos de naves, incluyendo la nueva **Helix Support** especializada en soporte táctico.
- **Diseños Legendarios (Premium Skins)**: Sistema de personalización con bonos de combate reales (HP, Escudo, Daño, Absorción).
- **Arsenal Inteligente**: Láseres de 4 niveles y misiles teledirigidos.
- **CPU de Misil Automático**: Sistema de fuego autónomo que prioriza objetivos fijados en PVP y PVE.
- **Módulo de Invisibilidad**: Tecnología de sigilo para maniobras tácticas.
- **Laboratorio de Minerales**: Refinado de recursos para buffs temporales de 2 horas.

### 🤖 Épica: Sistemas de Apoyo (Drones & AI)
- **E.C.O. (Emergency Companion Observer)**: Drone inteligente con nivel propio, sistema de combustible y protocolos de auto-reparación.
- **Wips (Drones de Ataque)**: Escuadrón de hasta 8 unidades. Ahora con **Sincronización de Utilidades** (Auto-reparación, Turbo-misiles).
- **Helix Beacons**: Despliegue de unidades tácticas de reparación de vida y escudo (10,000 unidades por tick).

### 👥 Épica: Social y Diplomacia
- **Comercio Eficiente**: Sistema de **Compra en Bloque** en la tienda para equipamiento y munición con validación de ranuras.
- **Party System**: Grupos tácticos con HUD compartido y recompensas divididas.
- **Sindicatos (Clanes)**: Fundación de alianzas, gestión de tesorería, rangos y diplomacia.
- **Mercado Estelar**: Casa de subastas sincronizada para items exclusivos.

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
- **Integración Helix Support**: Implementación completa de habilidades de reparación masiva (Beacons).
- **Sistema de Compra Múltiple**: Selector de cantidad y botón "MAX" funcional para todo el catálogo de la tienda.
- **PVP Targeting Fix**: Corrección de la limpieza de objetivos en el servidor; el fijado ahora persiste correctamente en combate entre jugadores.
- **Auto-Missile CPU**: Lógica de disparo autónoma totalmente funcional y sincronizada con el estado de invisibilidad.
- **Sincronización de Wips**: Los drones ahora transfieren correctamente sus habilidades de utilidad a la nave principal.

### 🏃 In Progress (Sprint Actual)
- Optimización de colisiones en sectores de alta densidad.
- Mejora de IA para naves alienígenas tipo "Drakon".
- Implementación de efectos visuales para las balizas de soporte de la Helix.

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
