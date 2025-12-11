# 🐸 Hogar de Ranas Saltarinas - Documentación Completa

## 📖 Descripción General

**Hogar de Ranas Saltarinas** es un mundo 3D interactivo construido con Three.js que simula una isla mágica con una casa, personajes (ranas), entorno dinámico y múltiples características visuales e interactivas.

**Stack Tecnológico**:

- Three.js (motor 3D)
- Vite (bundler/dev server)
- Blender (modelado 3D)
- JavaScript ES6+
- CSS3

---

## ✨ Características Implementadas

### 1. Sistema Día/Noche

- **Botón Interactivo**: Ubicado arriba a la izquierda (🌙 Noche / ☀️ Día)
- **Modo Día**:
  - Cielo azul claro (#87CEEB)
  - Luz solar intensa (intensidad 1.2)
  - Luz ambiente fuerte (0.8)
  - Luciérnagas ocultas
  - Luna oculta
- **Modo Noche**:
  - Cielo azul oscuro (#0a1628)
  - Luz lunar suave (intensidad 0.6)
  - Luz ambiente tenue (0.4, color azulado)
  - Luciérnagas visibles
  - Luna visible en el horizonte

### 2. Agua Animada

- **Geometría**: CircleGeometry (círculo suave)
- **Material**: MeshStandardMaterial con normal map
- **Propiedades**:
  - Posición: (0.2, 0.03, 0.2)
  - Escala: 0.8 × 0.7
  - Color: Azul claro (#6fb3d2)
  - Transparencia: 80%
- **Animación**: Movimiento de UVs (+0.002 por frame)
- **Textura**: Archivo `agua.jpeg` (normal map)

### 3. Humo Procedural

- **Tipo**: Sistema de partículas con PointsMaterial
- **Cantidad**: 80 partículas
- **Posición Base**: (0.1, 0.7, -0.1) _ajustable_
- **Textura**: Generada proceduralmente (gradiente radial)
- **Movimiento**:
  - Sube constantemente
  - Se dispersa lateralmente
  - Se reinicia cuando alcanza altura máxima
- **Control de Posición**: Variable `chimneyPosition` en línea 28

### 4. Luciérnagas Nocturnas

- **Visibilidad**: Solo en modo noche
- **Cantidad**: 15 partículas
- **Propiedades Individuales**:
  - Tamaño: 0.01 unidades (muy pequeñas)
  - Color: Amarillo (#ffff99) con emisión
  - Altura: Entre 0.2 y 1.7 metros
  - Velocidades: Aleatorias en 3D
- **Movimiento**: Flotante suave con límites
- **Luz**: Cada una emite PointLight tenue
- **Parpadeo**: Efecto de brillo aleatorio

### 5. Luna Visual

- **Geometría**: SphereGeometry (2 unidades de radio)
- **Material**: MeshStandardMaterial con emisión
- **Color**: Blanco (#e8e8e8) + emisión azulada (#c7d4e8)
- **Posición**: (-12, 8, -8) - horizonte nocturno
- **Visibilidad**: Solo modo noche

### 6. Interactividad con Ranas

- **Detección**: Raycast desde cámara al hacer click
- **Objetos Interactuables**:
  - Rana Macho (Material.001)
  - Rana Hembra (tripo*node*\*)
- **Efecto al Clickear**:
  1. Corazón ❤️ flota sobre la rana
  2. Se reproduce sonido de beso (si existe)
  3. Animación de 1.5 segundos
- **Sonido**: Archivo `/sounds/kiss.mp3`
- **Desplazamiento Ajustable**: Variable `heartOffset`

### 7. Controles de Cámara

- **Tipo**: OrbitControls (Three.js)
- **Rotación**: Arrastrar mouse izquierdo
- **Zoom**: Rueda del mouse
- **Desplazamiento**: Mouse derecho + arrastrar
- **Dampening**: Movimiento suave

---

## 🔧 Documentación Técnica Detallada

### Variables Globales Importantes

```javascript
// Estado
let isDay = true                            // Modo actual
let fogColor = '#87CEEB'                   // Color dinámico

// Referencias a personajes
let frogMale = null                        // Rana macho
let frogFemale = null                      // Rana hembra
const clickableObjects = []                 // Objetos interactuables

// Luces principales
const ambientLight                         // Luz ambiente (día/noche)
const sunLight                             // Luz solar
const moonLight                            // Luz lunar
const bottomLight                          // Relleno inferior

// Agua
const waterNormal                          // Textura normal map
const water                                // Mesh del charco

// Humo
const smokeTexture                         // Textura (canvas)
const smoke                                // Points de partículas
const smokePositions = new Float32Array()  // Posiciones X,Y,Z
const smokeVelocities = new Float32Array() // Velocidades
const chimneyPosition = new Vector3()       // Origen del humo

// Luciérnagas
const fireflies = []                       // Array [15]
const fireflyCount = 15

// Luna
const moon                                 // Mesh esférico
```

### Funciones Principales

#### `createSmokeTexture()`

Genera una textura circular con gradiente radial para las partículas.

```javascript
// Proceso:
1. Crea canvas 128x128
2. Dibuja gradiente radial (blanco → transparente)
3. Convierte a THREE.CanvasTexture
4. Retorna textura lista para usar
```

#### `resetSmokeParticle(i)`

Reinicia una partícula de humo a su posición inicial.

```javascript
// Parámetro: i = índice (0-79)
// Acciones:
- Posición aleatoria cerca de chimneyPosition
- Velocidad aleatoria (subida + dispersión)
- Mantiene Y en altura inicial
```

#### `showHeartEmote(object)`

Crea un corazón flotante sobre un objeto 3D.

```javascript
// Parámetro: object = mesh 3D clickeado
// Proceso:
1. Obtiene posición 3D del objeto
2. Proyecta a coordenadas de pantalla
3. Crea div con ❤️
4. Anima: sube + desaparece (1.5s)
5. Reproduce audio de beso
6. Elimina elemento del DOM
```

### Loop de Animación (`tick()`)

Se ejecuta ~60 veces por segundo:

```javascript
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // 1. Actualizar controles
  controls.update();

  // 2. Animar agua
  waterNormal.offset.y += 0.002;

  // 3. Actualizar humo (80 partículas)
  for (let i = 0; i < 80; i++) {
    // Interpolar posición
    // Aplicar fricción a velocidades
    // Reiniciar si es necesario
  }
  smokeGeometry.attributes.position.needsUpdate = true;

  // 4. Animar luciérnagas (si es noche)
  if (!isDay) {
    fireflies.forEach((firefly) => {
      // Mover según velocidades
      // Mantener dentro de rango
      // Parpadear aleatoriamente
    });
  }

  // 5. Renderizar
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};
```

---

## 📊 Parámetros Ajustables

### Humo

```javascript
// Línea ~28
const chimneyPosition = new THREE.Vector3(0.1, 0.7, -0.1)
// Línea ~57: cantidad de partículas
const smokeCount = 80

// Línea ~61: velocidad de subida base
smokeVelocities[i3 + 1] = 0.008 + Math.random() * 0.006

// Línea ~388-390: fricción de dispersión lateral
smokeVelocities[i3 + 0] *= 0.995
smokeVelocities[i3 + 2] *= 0.995

// Línea ~393: altura máxima antes de reiniciar
if (smokePositions[i3 + 1] > chimneyPosition.y + 2.0)
```

### Agua

```javascript
// Línea ~215-220: propiedades visuales
color: "#6fb3d2";
metalness: 0.1;
roughness: 0.3;
opacity: 0.8;

// Línea ~223: tamaño del círculo (radio)
const waterGeo = new THREE.CircleGeometry(0.8, 32);

// Línea ~407: velocidad de animación
waterNormal.offset.y += 0.002;
```

### Iluminación Día

```javascript
// Línea ~147: luz ambiente
ambientLight.intensity = 0.8;

// Línea ~150: luz solar
sunLight.intensity = 1.2;

// Línea ~165: luz inferior
bottomLight.intensity = 0.5;
```

### Iluminación Noche

```javascript
// Línea ~259: luz ambiente nocturna
ambientLight.intensity = 0.4;

// Línea ~134: luz lunar
moonLight.intensity = 0.6;

// Línea ~162: luz inferior noche
bottomLight.intensity = 0.1;
```

### Luciérnagas

```javascript
// Línea ~208: cantidad
const fireflyCount = 15;

// Línea ~216: altura mínima y máxima
Math.random() * 1.5 + 0.2; // Entre 0.2 y 1.7

// Línea ~230: radio de luz emitida
const fireflyLight = new THREE.PointLight("#ffff99", 0.3, 1.5);
```

### Emote de Corazón

```javascript
// Línea ~312: desplazamiento en pantalla
const heartOffset = { x: 0, y: 0 };

// Línea ~343: duración de animación
setTimeout(() => {
  heart.remove();
}, 1500); // 1.5 segundos
```

---

## 🎯 Arquitectura de Clases y Objetos

### Estructura de Escena

```
scene
├── ambientLight (AmbientLight)
├── sunLight (DirectionalLight) [día]
├── moonLight (DirectionalLight) [noche]
├── bottomLight (DirectionalLight)
├── fireflies[] (Mesh × 15) [noche]
├── moon (Mesh)
├── water (Mesh)
├── smoke (Points)
└── modelo (Scene from glTF)
    ├── casa
    ├── frogMale (Mesh clickeable)
    ├── frogFemale (Mesh clickeable)
    ├── charco (Icosphere)
    ├── árboles
    ├── rocas
    └── ...más elementos
```

---

## 🚀 Instrucciones de Instalación y Uso

### Setup Inicial

```bash
# Descargar dependencias
npm install

# Iniciar servidor local
npm run dev

# Compilar para producción
npm run build
```

### Estructura de Archivos Requerida

```
static/
├── models/
│   └── Casa_Ranitas_Final.glb       [REQUERIDO]
├── textures/agua/
│   └── agua.jpeg                    [REQUERIDO]
└── sounds/
    └── kiss.mp3                     [OPCIONAL]
```

---

## 🔍 Debugging y Diagnóstico

### Consola del Navegador (F12)

Mensajes esperados al cargar:

```
✅ Casa Ranitas cargada correctamente
⏳ Cargando: 0.00%
⏳ Cargando: 25.00%
...
⏳ Cargando: 100.00%
🐸 Rana macho encontrada
🐸 Rana hembra encontrada
💕 Rana clickeada!  [al hacer clic]
```

### Verificar Objetos

```javascript
// En consola:
console.log(frogMale); // Debe mostrar Mesh
console.log(frogFemale); // Debe mostrar Mesh
console.log(clickableObjects); // Debe tener 2+ elementos
console.log(scene.children.length); // Número total de objetos
```

---

## 📝 Notas de Mantenimiento

- **Performance**: Reducir `smokeCount` y `fireflyCount` si hay lag
- **Compatibilidad**: Requiere navegador moderno con WebGL 2.0
- **Texturas**: Optimizar `agua.jpeg` si el tamaño es > 500KB
- **Modelo 3D**: Puede optimizarse removiendo texturas innecesarias en Blender

---

**¡Proyecto completado y documentado! 🐸✨**
