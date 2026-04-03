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

### 🛸 Sistema de Naves y Combate
- **5 Clases de Naves**: Aegis Vanguard (Tanque), Nova Striker (Rápida), Orion Phantom (Sigilo), Titan Hammer (Pesada) y Helix Support (Soporte).
- **Armamento**: Munición estándar infinita y municiones especiales (Térmica para daño extra, Plasma penetrante y Sifón para robar escudos).
- **HUD Intuitivo**: Seguimiento en tiempo real de HP, Escudos, Munición, XP y Carga.

### 📈 Progresión y Personalización
- **Sistema de Niveles y Rangos**: Gana XP destruyendo enemigos para subir de nivel y ascender de rango (Cadete, Piloto, Capitán, Comandante, Almirante).
- **Hangar Avanzado**: Configura tu nave equipando módulos de Láseres, Escudos, Motores y Utilidad comprados en la tienda.
- **Estadísticas Visuales**: Diferenciación clara entre estadísticas base, bonos de módulos y mejoras permanentes (★).

### 💎 Economía y Recursos
- **Recolección de Minerales**: Los aliens sueltan Titanio, Plutonio y Silicio.
- **Gestión de Bodega**: Capacidad limitada de carga según el tipo de nave seleccionada.
- **Tienda Espacial**: Compra módulos tácticos y munición especial usando créditos ganados en combate.
- **Venta de Recursos**: Posibilidad de vender minerales sobrantes por créditos para financiar tu equipo.

### 🔬 Laboratorio de Minerales
- **Refinamiento**: Convierte tus minerales en mejoras permanentes para el Ataque (Plutonio), Escudo (Titanio) y Velocidad (Silicio) de todas tus naves.

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
- Eventos dinámicos en el servidor.