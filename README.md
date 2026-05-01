# 🚀 Órbita Galáctica - Proyecto Espacial Multijugador

**Órbita Galáctica** es una plataforma de combate espacial masivo basado en web. Este repositorio sigue una estructura orientada a la **Metodología Scrum**, priorizando la entrega de valor incremental y la transparencia en el desarrollo de funcionalidades.

---

## 🎯 1. Visión del Producto (Product Vision)
Crear la experiencia de combate espacial definitiva en el navegador, combinando un motor de físicas autoritativo en Python con una interfaz de usuario premium en React, permitiendo a miles de pilotos competir, socializar y progresar en una galaxia persistente.

---

## 📋 2. Product Backlog (Funcionalidades Implementadas)

### 🛸 Épica: Navegación y Mundo Persistente
- **Core Engine**: Motor de renderizado en Canvas API con WebSockets para latencia mínima.
- **Atlas Galáctico**: Sistema de 24 sectores divididos por facciones (**MARS, MOON, PLUTO**) y una **Zona Neutral** de paz.
- **Gateway Network**: Portales estelares y atajos de salto de emergencia (Tecla 'J').
- **Persistencia Autoritativa**: Sincronización en tiempo real de XP (Total Acumulada), Créditos, Paladio y Equipamiento.

### ⚔️ Épica: Combate y Personalización
- **Flota Estelar**: 9 modelos de naves desde la básica *Phoenix* hasta la élite *Sovereign Exterminator*.
- **Diseños Legendarios (Premium Skins)**: Sistema de personalización con bonos de combate reales (HP, Escudo, Daño, Absorción).
- **Arsenal Inteligente**: Láseres de 4 niveles y misiles teledirigidos (Tecla 'E').
- **Módulo de Invisibilidad**: Tecnología de sigilo para maniobras tácticas.
- **Laboratorio de Minerales**: Refinado de recursos para buffs temporales de 2 horas con curación proporcional.

### 🤖 Épica: Sistemas de Apoyo (Drones & AI)
- **E.C.O. (Emergency Companion Observer)**: Drone inteligente con nivel propio, sistema de combustible y protocolos de auto-reparación.
- **Wips (Drones de Ataque)**: Escuadrón de hasta 8 unidades de soporte ofensivo sincronizado.

### 👥 Épica: Social y Diplomacia
- **Party System**: Grupos tácticos con HUD compartido y recompensas divididas.
- **Sindicatos (Clanes)**: Fundación de alianzas, gestión de tesorería (tasas de impuestos), rangos y diplomacia (Guerra/Alianza).
- **Comunicaciones**: Chat multicanal, sistema de correos asíncrono y dashboard social de amigos.
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
- **Sistema de Diseños Legendarios**: Integración completa de skins con bonos estadísticos.
- **Dashboard de Mando**: Nueva visualización de especificaciones en el Menú Principal.
- **Sincronización HUD**: Redondeo de valores de vida/escudo y visualización de bonos en verde.
- **Scaling autoritativo**: El servidor ahora escala la vida actual al equipar diseños de HP.

### 🏃 In Progress (Sprint Actual)
- Optimización de colisiones en sectores de alta densidad.
- Mejora de IA para naves alienígenas tipo "Drakon".
- Refactorización de persistencia de clanes para mayor escalabilidad.

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
