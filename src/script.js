import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'lil-gui'

const gui = new dat.GUI()
gui.close()

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

// Set the scene's fog for atmospheric effect
const fogColor = '#87CEEB'  // Cielo azul claro
scene.fog = new THREE.Fog(fogColor, 50, 200)  // Niebla más lejana
scene.background = new THREE.Color(fogColor)

const textureLoader = new THREE.TextureLoader()

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
    
    // Habilitar sombras en todos los meshes del modelo
    modelo.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
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
  controls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()
