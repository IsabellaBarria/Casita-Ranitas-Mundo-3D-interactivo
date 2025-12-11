import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'lil-gui'

const gui = new dat.GUI()
gui.close()

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Estado día/noche
let isDay = true

// Set the scene's fog for atmospheric effect
let fogColor = '#87CEEB'  // Cielo azul claro
scene.fog = new THREE.Fog(fogColor, 50, 200)  // Niebla más lejana
scene.background = new THREE.Color(fogColor)

const textureLoader = new THREE.TextureLoader()

// Variables para los personajes clickeables
let frogMale = null
let frogFemale = null
const clickableObjects = []

// Posición aproximada de la chimenea (ajusta estos valores si no coincide)
const chimneyPosition = new THREE.Vector3(0.1, 0.7, -0.1)

// Generar textura suave para humo
function createSmokeTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

// Partículas de humo para la chimenea
const smokeTexture = createSmokeTexture()
const smokeCount = 80
const smokeGeometry = new THREE.BufferGeometry()
const smokePositions = new Float32Array(smokeCount * 3)
const smokeVelocities = new Float32Array(smokeCount * 3)

const resetSmokeParticle = (i) => {
  const i3 = i * 3
  smokePositions[i3 + 0] = chimneyPosition.x + (Math.random() - 0.5) * 0.12
  smokePositions[i3 + 1] = chimneyPosition.y + Math.random() * 0.15
  smokePositions[i3 + 2] = chimneyPosition.z + (Math.random() - 0.5) * 0.12
  smokeVelocities[i3 + 0] = (Math.random() - 0.5) * 0.002
  smokeVelocities[i3 + 1] = 0.008 + Math.random() * 0.006
  smokeVelocities[i3 + 2] = (Math.random() - 0.5) * 0.002
}

for (let i = 0; i < smokeCount; i++) {
  resetSmokeParticle(i)
}

smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3))

const smokeMaterial = new THREE.PointsMaterial({
  map: smokeTexture,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  opacity: 0.35,
  size: 0.2,
  sizeAttenuation: true,
  color: '#dbe4ec'
})
const smoke = new THREE.Points(smokeGeometry, smokeMaterial)
smoke.frustumCulled = false
scene.add(smoke)

// ========================================
// CARGAR MODELO 3D DE BLENDER
// ========================================
const gltfLoader = new GLTFLoader()
gltfLoader.load(
  '/models/Casa_Ranitas_Final.glb',  // Tu modelo: casa, banquito, escala, ranas, árboles, rocas
  (gltf) => {
    console.log('✅ Casa Ranitas cargada correctamente')
    const modelo = gltf.scene
    
    // Ajustar posición y escala si es necesario
    modelo.position.set(0, 0, 0)
    modelo.scale.set(1, 1, 1)
    
    // Habilitar sombras y buscar personajes
    modelo.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Buscar ranas por nombre de material
        if (child.material && child.material.name) {
          if (child.material.name === 'Material.001') {
            frogMale = frogMale || child
            clickableObjects.push(child)
          } else if (child.material.name.includes('tripo_node')) {
            frogFemale = frogFemale || child
            clickableObjects.push(child)
          }
        }
      }
    })
    
    scene.add(modelo)
  },
  (progress) => {
    const percentComplete = (progress.loaded / progress.total * 100).toFixed(2)
    console.log(`⏳ Cargando: ${percentComplete}%`)
  },
  (error) => {
    console.error('❌ Error al cargar el modelo:', error)
  }
)

// Lighting setup - DÍA SOLEADO
const ambientLight = new THREE.AmbientLight('#ffffff', 0.8)  // Luz ambiente blanca fuerte
scene.add(ambientLight)

const sunLight = new THREE.DirectionalLight('#ffffff', 1.2)  // Luz solar
sunLight.position.set(10, 15, 5)
sunLight.castShadow = true
sunLight.shadow.mapSize.set(2048, 2048)
sunLight.shadow.camera.near = 0.5
sunLight.shadow.camera.far = 50
sunLight.shadow.camera.left = -30
sunLight.shadow.camera.right = 30
sunLight.shadow.camera.top = 30
sunLight.shadow.camera.bottom = -30
scene.add(sunLight)

// Luz inferior para iluminar la parte de abajo
const bottomLight = new THREE.DirectionalLight('#ffffff', 0.5)
bottomLight.position.set(0, -10, 0)
scene.add(bottomLight)
// Luna para modo noche
const moonLight = new THREE.DirectionalLight('#9db4ff', 0.6)
moonLight.position.set(-10, 15, -5)
moonLight.castShadow = true
moonLight.shadow.mapSize.set(2048, 2048)
moonLight.shadow.camera.near = 0.5
moonLight.shadow.camera.far = 50
moonLight.shadow.camera.left = -30
moonLight.shadow.camera.right = 30
moonLight.shadow.camera.top = 30
moonLight.shadow.camera.bottom = -30
moonLight.visible = false  // Oculta al inicio (es de día)
scene.add(moonLight)

// Luna visual en el cielo
const moonGeo = new THREE.SphereGeometry(2, 32, 32)
const moonMat = new THREE.MeshStandardMaterial({
  color: '#e8e8e8',
  emissive: '#c7d4e8',
  emissiveIntensity: 1.5,
  roughness: 0.9
})
const moon = new THREE.Mesh(moonGeo, moonMat)
moon.position.set(-12, 8, -8)  // Más baja, cerca del horizonte
moon.visible = false  // Oculta al inicio (es de día)
scene.add(moon)

// ========================================
// LUCIÉRNAGAS (solo visibles de noche)
// ========================================
const fireflies = []
const fireflyCount = 15

for (let i = 0; i < fireflyCount; i++) {
  // Geometría de la luciérnaga (esfera pequeña)
  const fireflyGeo = new THREE.SphereGeometry(0.01, 6, 6)
  const fireflyMat = new THREE.MeshStandardMaterial({
    color: '#ffff99',
    emissive: '#ffff00',
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.8
  })
  const firefly = new THREE.Mesh(fireflyGeo, fireflyMat)
  
  // Posición aleatoria alrededor de la isla (más cerca del suelo)
  firefly.position.set(
    (Math.random() - 0.5) * 6,
    Math.random() * 1.5 + 0.2,  // Entre 0.2 y 1.7
    (Math.random() - 0.5) * 6
  )
  
  // Luz puntual para cada luciérnaga (más tenue y cercana)
  const fireflyLight = new THREE.PointLight('#ffff99', 0.3, 1.5)
  firefly.add(fireflyLight)
  
  // Guardar velocidad aleatoria para animación
  firefly.userData = {
    speedX: (Math.random() - 0.5) * 0.02,
    speedY: (Math.random() - 0.5) * 0.01,
    speedZ: (Math.random() - 0.5) * 0.02,
    rangeX: firefly.position.x,
    rangeZ: firefly.position.z
  }
  
  firefly.visible = false  // Ocultas al inicio (es de día)
  scene.add(firefly)
  fireflies.push(firefly)
}

// Water normal map
const waterNormal = textureLoader.load('/textures/agua/agua.jpeg')
waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping
waterNormal.repeat.set(2, 2)

// Water plane
const waterGeo = new THREE.CircleGeometry(0.8, 32) // radio, segmentos
const waterMat = new THREE.MeshStandardMaterial({
  color: '#6fb3d2',      // tono agua
  metalness: 0.1,
  roughness: 0.3,
  normalMap: waterNormal,
  transparent: true,
  opacity: 0.8
})
const water = new THREE.Mesh(waterGeo, waterMat)
water.rotation.x = -Math.PI / 2   // ponerlo horizontal
water.position.set(0.2, 0.03, 0.2)  // Posición ajustada del charco
water.scale.set(0.8, 0.7, 1)        // Escala ajustada
water.receiveShadow = true
scene.add(water)

// Botón de día/noche
const dayNightBtn = document.getElementById('dayNightBtn')
dayNightBtn.addEventListener('click', () => {
  isDay = !isDay
  
  if (isDay) {
    // Modo DÍA
    fogColor = '#87CEEB'
    scene.background.set(fogColor)
    scene.fog.color.set(fogColor)
    renderer.setClearColor(fogColor)
    
    ambientLight.intensity = 0.8
    ambientLight.color.set('#ffffff')
    sunLight.visible = true
    moonLight.visible = false
    moon.visible = false
    bottomLight.intensity = 0.5
    
    // Ocultar luciérnagas de día
    fireflies.forEach(firefly => firefly.visible = false)
    
    dayNightBtn.textContent = '🌙 Noche'
  } else {
    // Modo NOCHE
    fogColor = '#0a1628'
    scene.background.set(fogColor)
    scene.fog.color.set(fogColor)
    renderer.setClearColor(fogColor)
    
    ambientLight.intensity = 0.4
    ambientLight.color.set('#4a5f8f')
    sunLight.visible = false
    moonLight.visible = true
    moon.visible = true
    bottomLight.intensity = 0.1
    
    // Mostrar luciérnagas de noche
    fireflies.forEach(firefly => firefly.visible = true)
    
    dayNightBtn.textContent = '☀️ Día'
  }

})

// ========================================
// INTERACCIÓN: CLICK EN RANAS
// ========================================
// Raycaster para detectar clics
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Audio de beso
const kissSound = new Audio('/sounds/kiss.mp3')
kissSound.volume = 0.5

// Desplazamiento manual del emote en pantalla (px)
const heartOffset = { x: 0, y: 0 }

// Función para mostrar corazón animado
function showHeartEmote(object) {
  // Obtener posición 3D del objeto
  const vector = new THREE.Vector3()
  object.getWorldPosition(vector)
  
  // Convertir a coordenadas 2D de pantalla
  vector.project(camera)
  const x = (vector.x * 0.5 + 0.5) * sizes.width + heartOffset.x
  const y = (-(vector.y * 0.5) + 0.5) * sizes.height + heartOffset.y
  
  // Crear elemento corazón
  const heart = document.createElement('div')
  heart.className = 'heart-emote'
  heart.textContent = '❤️'
  heart.style.left = `${x}px`
  heart.style.top = `${y}px`
  document.body.appendChild(heart)
  
  // Reproducir sonido
  kissSound.currentTime = 0
  kissSound.play()
  
  // Eliminar después de la animación
  setTimeout(() => {
    heart.remove()
  }, 1500)
}

// Event listener para clics
window.addEventListener('click', (event) => {
  // Calcular posición del mouse en coordenadas normalizadas (-1 a +1)
  mouse.x = (event.clientX / sizes.width) * 2 - 1
  mouse.y = -(event.clientY / sizes.height) * 2 + 1
  
  // Actualizar raycaster
  raycaster.setFromCamera(mouse, camera)
  
  // Detectar intersecciones
  const intersects = raycaster.intersectObjects(clickableObjects, false)
  
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object
    console.log('💕 Rana clickeada!')
    showHeartEmote(clickedObject)
  }
})

// Window resize handling
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Camera setup
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(6, 3, 8)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(0, 1.0, 0)
controls.maxPolarAngle = Math.PI * 0.495
controls.minDistance = 0.5
controls.maxDistance = 100
controls.update()

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(fogColor)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0

// Animation loop
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  
  controls.update()
  waterNormal.offset.y += 0.002  // Anima las ondas del charco
  
  // Actualizar humo de la chimenea
  for (let i = 0; i < smokeCount; i++) {
    const i3 = i * 3
    smokePositions[i3 + 0] += smokeVelocities[i3 + 0]
    smokePositions[i3 + 1] += smokeVelocities[i3 + 1]
    smokePositions[i3 + 2] += smokeVelocities[i3 + 2]
    // Pequeña disipación lateral
    smokeVelocities[i3 + 0] *= 0.995
    smokeVelocities[i3 + 2] *= 0.995
    // Reiniciar cuando sube demasiado
    if (smokePositions[i3 + 1] > chimneyPosition.y + 2.0) {
      resetSmokeParticle(i)
    }
  }
  smokeGeometry.attributes.position.needsUpdate = true
  
  // Animar luciérnagas (solo si están visibles)
  if (!isDay) {
    fireflies.forEach(firefly => {
      // Movimiento flotante
      firefly.position.x += firefly.userData.speedX
      firefly.position.y += Math.sin(elapsedTime + firefly.position.x * 10) * 0.005
      firefly.position.z += firefly.userData.speedZ
      
      // Mantener dentro del rango
      if (Math.abs(firefly.position.x - firefly.userData.rangeX) > 3) {
        firefly.userData.speedX *= -1
      }
      if (Math.abs(firefly.position.z - firefly.userData.rangeZ) > 3) {
        firefly.userData.speedZ *= -1
      }
      
      // Parpadeo aleatorio
      firefly.material.emissiveIntensity = 1.5 + Math.sin(elapsedTime * 5 + firefly.position.x * 100) * 0.5
    })
  }
  
  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()
