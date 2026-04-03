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
- **Portales Estelares (Wormholes)**: Agujeros de gusano funcionales para viajar entre sectores. Requieren activación manual mediante la tecla **'J'** o clic directo, con animación de flash de salto hiperespacial.
- **Minimapa Táctico**: Radar en tiempo real que ahora incluye un **Radar de Proximidad** para detectar cofres especiales en un rango de 2500m.
- **Persistencia Total**: Tu sesión guarda automáticamente tu posición exacta (`X, Y`) y el **sector (mapa)** donde te encuentras. Despega al espacio y retoma tu misión exactamente donde la dejaste.

### 🛡️ Zonas Seguras y Estaciones
- **Santuario Galáctico**: Tanto la Estación Central en Alfa como los Portales Estelares en ambos sectores cuentan con **Zonas Seguras** (anillo turquesa) donde eres invulnerable a los ataques.
- **Centro de Mantenimiento**: La base es el único lugar habilitado para equipar y modificar módulos tácticos de la nave.

### 💰 Economía y Tesoros
- **Moneda Especial (✨)**: Nueva divisa premium obtenible mediante la recolección de **Cofres Dorados** que aparecen aleatoriamente por la galaxia cada 30 segundos.
- **Filtro de Contexto**: Sistema inteligente que evita que la nave se mueva accidentalmente hacia coordenadas del mapa anterior tras realizar un salto estelar.
- **Laboratorio de Minerales**: Refina recursos (Titanio, Plutonio, Silicio) para obtener mejoras permanentes en Ataque, Escudo y Velocidad.

### ⚔️ Combate y Progresión
- **5 Clases de Naves**: Aegis Vanguard (Tanque), Nova Striker (Rápida), Orion Phantom (Sigilo), Titan Hammer (Pesada) y Helix Support (Soporte).
- **Armamento Avanzado**: Munición estándar infinita y proyectiles especiales (Térmica, Plasma, Sifón) con efectos visuales únicos.
- **Retícula Dinámica**: Sistema de lock-on con indicador de rango (Cian/Amarillo/Rojo) y alertas de proximidad crítica.

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