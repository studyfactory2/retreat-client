import * as THREE from 'three'

export interface RetreatSceneOptions {
  mobile: boolean
  reducedMotion: boolean
  onReady: () => void
  onError: () => void
}

export interface RetreatSceneStats {
  ready: boolean
  disposed: boolean
  mobile: boolean
  reducedMotion: boolean
  paused: boolean
  visible: boolean
  angle: number
  targetAngle: number
  renderedFrames: number
  drawCalls: number
  triangles: number
  geometries: number
  materials: number
  pixelRatio: number
}

export interface RetreatSceneController {
  setMobile: (mobile: boolean) => void
  setReducedMotion: (reducedMotion: boolean) => void
  setPaused: (paused: boolean) => void
  rotate: (delta: number) => void
  reset: () => void
  dispose: () => void
  getStats: () => RetreatSceneStats
}

interface PointerDrag {
  id: number
  x: number
  y: number
  initial: number
  horizontal: boolean
  canceled: boolean
}

const FULL_TURN = Math.PI * 2
const DESKTOP_TURN_SECONDS = 40
const MOBILE_CYCLE_SECONDS = 14
const MOBILE_AMPLITUDE = 0.22
const INTERACTION_PAUSE_MS = 3000
const FRAME_INTERVAL_MS = 1000 / 30

/** An isolated, lazily loaded canvas; all scene resources belong to this controller. */
export function createRetreatScene(
  mount: HTMLElement,
  options: RetreatSceneOptions,
): RetreatSceneController {
  let disposed = false
  let ready = false
  let visible = true
  let mobile = options.mobile
  let reducedMotion = options.reducedMotion
  let paused = false
  let frameId = 0
  let width = 1
  let height = 1
  let currentAngle = 0
  let targetAngle = 0
  let mobilePhase = 0
  let pointer: PointerDrag | null = null
  let holdUntil = 0
  let previousTick = 0
  let previousRender = 0
  let renderedFrames = 0
  const materials = new Set<THREE.Material>()
  const geometries = new Set<THREE.BufferGeometry>()
  const disposers: Array<() => void> = []
  const scene = new THREE.Scene()
  const stage = new THREE.Group()
  scene.add(stage)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.28
  const canvas = renderer.domElement
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;'
  // The React wrapper provides the scene description and keyboard controls.
  canvas.setAttribute('aria-hidden', 'true')
  mount.appendChild(canvas)

  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 60)
  camera.position.set(7.6, 6.5, 9.6)
  camera.lookAt(0, 1.0, 0)
  const hemi = new THREE.HemisphereLight(0xf6f8ff, 0xc5c5a7, 2.6)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xffefcd, 3.6)
  key.position.set(-3.5, 9, 6)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 24 })
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.025
  key.shadow.radius = 3
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xd7e8ff, 1.1)
  rim.position.set(5, 5, -5)
  scene.add(rim)

  function mat(color: THREE.ColorRepresentation, params: THREE.MeshStandardMaterialParameters = {}) {
    const material = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.83, metalness: 0 }, params || {}));
    materials.add(material);
    return material;
  }
  const palette = {
    wall: mat(0xf0e9dc), trim: mat(0xfaf5e9), roof: mat(0x1c3549), roofSeam: mat(0x314a5a),
    wood: mat(0xb98452), woodLight: mat(0xd7af79), woodDark: mat(0x79543b),
    glass: mat(0x98aeb3, { roughness: 0.2, metalness: 0.18 }),
    warmGlass: mat(0xe6ba72, { emissive: 0xe1a95f, emissiveIntensity: 0.18, roughness: 0.35 }),
    reflection: mat(0xd7e4df, { roughness: 0.28 }),
    stone: mat(0xdbdcd0), paving: mat(0xe9e6da), soil: mat(0xb6b8a1),
    grass: mat(0x9fae8e), grassDark: mat(0x889d7b),
    foliage: mat(0x627e65), foliageLight: mat(0x79977c), foliageDark: mat(0x496b57),
    bark: mat(0x9a7958), blue: mat(0x2c58cd), brass: mat(0xe5c37f, { metalness: 0.35, roughness: 0.4 }),
    pot: mat(0xb77055), cushion: mat(0xefede2)
  };
  function mesh<G extends THREE.BufferGeometry, M extends THREE.Material>(geometry: G, material: M, parent: THREE.Object3D = stage) {
    geometries.add(geometry);
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material, parent?: THREE.Object3D) {
    const m = mesh(new THREE.BoxGeometry(w, h, d), material, parent);
    m.position.set(x, y, z);
    return m;
  }
  function cylinder(rt: number, rb: number, h: number, x: number, y: number, z: number, material: THREE.Material, parent?: THREE.Object3D, segments = 16) {
    const m = mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material, parent);
    m.position.set(x, y, z);
    return m;
  }
  function orb(r: number, x: number, y: number, z: number, material: THREE.Material, parent?: THREE.Object3D, sx = 1, sy = 1, sz = 1) {
    const m = mesh(new THREE.IcosahedronGeometry(r, 2), material, parent);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    return m;
  }
  function roundedSlab(w: number, d: number, radius: number, depth: number, y: number, material: THREE.Material) {
    const s = new THREE.Shape();
    const x = -w / 2, z = -d / 2;
    s.moveTo(x + radius, z);
    s.lineTo(x + w - radius, z);
    s.quadraticCurveTo(x + w, z, x + w, z + radius);
    s.lineTo(x + w, z + d - radius);
    s.quadraticCurveTo(x + w, z + d, x + w - radius, z + d);
    s.lineTo(x + radius, z + d);
    s.quadraticCurveTo(x, z + d, x, z + d - radius);
    s.lineTo(x, z + radius);
    s.quadraticCurveTo(x, z, x + radius, z);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 8 });
    const m = mesh(g, material);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    return m;
  }

  // The scene is a miniature landscape, with a single clear architectural silhouette.
  const base = roundedSlab(7.0, 5.35, 1.28, 0.17, -0.12, palette.stone);
  const lawn = roundedSlab(6.88, 5.22, 1.24, 0.045, 0.06, palette.grass);
  base.receiveShadow = lawn.receiveShadow = true;

  // Main building: cream gable, standing-seam blue roof, timber joinery and porch.
  const house = new THREE.Group();
  house.position.set(-0.35, 0.12, -0.45);
  stage.add(house);
  box(3.42, 0.18, 2.54, 0, 0.1, 0, palette.stone, house);
  box(3.25, 1.74, 2.40, 0, 1.04, 0, palette.wall, house);
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-1.625, 0);
  gableShape.lineTo(0, 0.96);
  gableShape.lineTo(1.625, 0);
  gableShape.closePath();
  const gable = mesh(new THREE.ExtrudeGeometry(gableShape, { depth: 2.40, bevelEnabled: false }), palette.wall, house);
  gable.position.set(0, 1.91, -1.2);
  const roofAngle = Math.atan2(1.06, 1.86);
  const roofLength = Math.hypot(1.06, 1.86);
  [-1, 1].forEach(side => {
    const panel = box(roofLength, 0.14, 2.88, side * 0.93, 2.43, 0, palette.roof, house);
    panel.rotation.z = -side * roofAngle;
    for (let z = -1.3; z <= 1.31; z += 0.26) {
      const seam = box(roofLength, 0.035, 0.022, side * 0.93, 2.515, z, palette.roofSeam, house);
      seam.rotation.z = -side * roofAngle;
    }
  });
  box(0.11, 0.10, 2.91, 0, 2.995, 0, palette.roofSeam, house);
  box(0.30, 0.62, 0.35, -0.85, 2.74, -0.72, palette.wall, house);
  box(0.36, 0.075, 0.41, -0.85, 3.065, -0.72, palette.roof, house);

  // Recessed entrance and generously glazed sitting room.
  box(1.68, 1.31, 0.08, -0.57, 1.10, 1.225, palette.woodDark, house);
  box(1.53, 1.18, 0.09, -0.57, 1.10, 1.267, palette.warmGlass, house);
  box(0.055, 1.28, 0.11, -0.57, 1.10, 1.3, palette.woodDark, house);
  box(1.64, 0.055, 0.12, -0.57, 1.10, 1.3, palette.woodDark, house);
  box(0.13, 1.08, 0.015, -1.16, 1.12, 1.323, palette.reflection, house).rotation.z = -0.08;
  box(0.60, 1.62, 0.08, 0.90, 0.99, 1.23, palette.woodDark, house);
  box(0.49, 1.52, 0.09, 0.90, 0.99, 1.27, palette.wood, house);
  for (let x = 0.7; x < 1.15; x += 0.055) box(0.009, 1.45, 0.012, x, 0.99, 1.323, palette.woodDark, house);
  box(0.022, 0.20, 0.043, 1.04, 0.99, 1.35, palette.brass, house);
  box(0.15, 0.075, 0.06, 1.39, 1.42, 1.29, palette.blue, house);

  // Slatted facade on the visible right side and a second window.
  for (let z = -1.13; z <= 1.14; z += 0.105) box(0.032, 1.61, 0.038, 1.643, 1.035, z, palette.woodLight, house);
  box(0.08, 1.05, 1.21, 1.67, 1.11, -0.28, palette.woodDark, house);
  box(0.09, 0.92, 1.07, 1.719, 1.11, -0.28, palette.glass, house);
  box(0.12, 0.99, 0.055, 1.744, 1.11, -0.28, palette.woodDark, house);
  box(0.12, 0.05, 1.17, 1.744, 1.11, -0.28, palette.woodDark, house);
  box(0.018, 0.82, 0.10, 1.782, 1.12, -0.69, palette.reflection, house);
  // Simple rear and left joinery keeps the full orbit architecturally complete.
  for (const x of [-0.83, 0.83]) {
    box(0.92, 0.98, 0.075, x, 1.12, -1.225, palette.woodDark, house);
    box(0.79, 0.85, 0.085, x, 1.12, -1.27, palette.glass, house);
    box(0.045, 0.94, 0.1, x, 1.12, -1.30, palette.woodDark, house);
    box(0.88, 0.05, 0.11, x, 1.12, -1.30, palette.woodDark, house);
  }
  box(0.075, 1.01, 1.13, -1.65, 1.14, -0.20, palette.woodDark, house);
  box(0.085, 0.88, 0.99, -1.695, 1.14, -0.20, palette.glass, house);
  box(0.10, 0.97, 0.05, -1.72, 1.14, -0.20, palette.woodDark, house);
  box(0.11, 0.05, 1.08, -1.72, 1.14, -0.20, palette.woodDark, house);
  // High gable vent is a small architectural accent.
  cylinder(0.15, 0.15, 0.035, 0, 2.32, 1.22, palette.woodDark, house, 24).rotation.x = Math.PI / 2;
  cylinder(0.11, 0.11, 0.04, 0, 2.32, 1.247, palette.glass, house, 24).rotation.x = Math.PI / 2;

  box(3.60, 0.13, 0.86, 0, 0.18, 1.65, palette.wood, house);
  for (let z = 1.27; z < 2.08; z += 0.095) box(3.53, 0.012, 0.011, 0, 0.25, z, palette.woodDark, house);
  box(1.28, 0.10, 0.29, 0.90, 0.10, 2.19, palette.stone, house);
  box(3.63, 0.10, 0.76, 0, 1.88, 1.63, palette.woodLight, house);
  [-1.65, 1.65].forEach(x => box(0.072, 1.65, 0.072, x, 1.045, 1.97, palette.wood, house));
  // Porch bench, useful outdoor scale without excessive detail.
  box(0.82, 0.06, 0.29, -0.88, 0.50, 1.77, palette.woodDark, house);
  box(0.81, 0.11, 0.25, -0.88, 0.565, 1.77, palette.cushion, house);
  [-1.20, -0.56].forEach(x => box(0.045, 0.25, 0.21, x, 0.375, 1.77, palette.woodDark, house));

  // Path from the front edge up to the entrance.
  [1.99, 2.39].forEach((z, i) => box(0.93, 0.055, 0.30, 0.57 + i * 0.13, 0.155, z, palette.paving));
  box(0.66, 0.045, 0.27, 1.55, 0.15, 1.95, palette.paving).rotation.y = -0.12;

  function shrub(x: number, z: number, scale = 1, material = palette.foliage) {
    orb(0.27, x, 0.31, z, material, stage, scale * 1.2, scale * 0.85, scale);
    orb(0.23, x + 0.22 * scale, 0.27, z + 0.07, palette.foliageLight, stage, scale, scale * 0.9, scale);
  }
  function tree(x: number, z: number, h: number, scale: number, shade: THREE.Material) {
    const treeGroup = new THREE.Group();
    stage.add(treeGroup);
    treeGroup.position.set(x, 0.12, z);
    cylinder(0.055 * scale, 0.105 * scale, h * 0.63, 0, h * 0.315, 0, palette.bark, treeGroup, 10);
    const branch = cylinder(0.025 * scale, 0.04 * scale, h * 0.33, 0.13 * scale, h * 0.46, 0, palette.bark, treeGroup, 8);
    branch.rotation.z = -0.4;
    orb(0.62 * scale, -0.19 * scale, h * 0.71, 0, shade, treeGroup, 1, 1.14, 1);
    orb(0.58 * scale, 0.23 * scale, h * 0.81, -0.03, palette.foliageLight, treeGroup, 0.9, 1.08, 0.93);
    orb(0.48 * scale, 0.04, h * 0.62, 0.33 * scale, shade, treeGroup, 1.03, 0.93, 1);
    cylinder(0.37 * scale, 0.37 * scale, 0.025, 0, 0.025, 0, palette.grassDark, treeGroup, 24);
    return treeGroup;
  }
  tree(-2.55, -1.00, 2.80, 0.87, palette.foliage);
  tree(2.55, -1.45, 2.35, 0.87, palette.foliageDark);
  shrub(-2.5, 0.30, 1.1);
  shrub(2.70, 0.35, 1.0, palette.foliageDark);
  shrub(2.43, 1.18, 0.8);
  shrub(-1.88, -1.97, 0.8, palette.foliageDark);
  cylinder(0.17, 0.12, 0.30, 1.12, 0.40, 1.35, palette.pot);
  orb(0.23, 1.12, 0.66, 1.35, palette.foliageLight, stage, 1, 1.1, 1);

  // Low garden fence at the quiet rear edge.
  for (let x = 0.75; x < 2.92; x += 0.32) box(0.045, 0.52, 0.065, x, 0.38, -2.18, palette.woodLight);
  box(2.18, 0.055, 0.055, 1.80, 0.58, -2.18, palette.woodLight);
  box(2.18, 0.05, 0.055, 1.80, 0.31, -2.18, palette.woodLight);
  // A few natural stones and flowers keep the miniature warm but uncluttered.
  orb(0.18, -2.75, 0.18, 1.2, palette.stone, stage, 1.5, 0.62, 1);
  orb(0.12, -2.53, 0.17, 1.37, palette.stone, stage, 1.2, 0.55, 1);
  const flower = mat(0xe5ca9c);
  [-0.18, 0.0, 0.15].forEach((n, i) => {
    cylinder(0.013, 0.013, 0.17 + i * 0.02, 2.33 + n, 0.25, 0.94 + n, palette.foliageDark, stage, 6);
    orb(0.044, 2.33 + n, 0.35 + i * 0.02, 0.94 + n, flower);
  });

  // Three quiet human silhouettes: a family arriving together, not a character showcase.
  const skinLight = mat(0xd8ad88);
  const skinWarm = mat(0xbf8b69);
  const hair = mat(0x493c34);
  const trousers = mat(0x344959);
  const terracotta = mat(0xc47b5f);
  const creamSweater = mat(0xe5d4b6);
  const childTop = mat(0xd8b464);
  function familyMember(x: number, z: number, scale: number, top: THREE.Material, skin: THREE.Material, longHair: boolean, facing: number) {
    const p = new THREE.Group();
    p.position.set(x, 0.15, z);
    p.rotation.y = facing || 0;
    p.scale.setScalar(scale);
    stage.add(p);
    [-0.065, 0.065].forEach(lx => {
      cylinder(0.044, 0.04, 0.27, lx, 0.17, 0, trousers, p, 10);
      box(0.085, 0.045, 0.13, lx, 0.045, 0.025, palette.woodDark, p);
    });
    cylinder(0.115, 0.095, 0.29, 0, 0.45, 0, top, p, 16);
    orb(0.106, 0, 0.705, 0, skin, p, 0.92, 1.06, 0.94);
    orb(0.108, 0, 0.752, -0.018, hair, p, 0.94, 0.65, 0.95);
    if (longHair) orb(0.08, 0, 0.663, -0.073, hair, p, 1.1, 1.13, 0.65);
    const left = cylinder(0.034, 0.029, 0.25, -0.145, 0.43, 0, top, p, 10);
    left.rotation.z = -0.17;
    const right = cylinder(0.034, 0.029, 0.25, 0.145, 0.43, 0, top, p, 10);
    right.rotation.z = 0.17;
    orb(0.034, -0.166, 0.302, 0, skin, p);
    orb(0.034, 0.166, 0.302, 0, skin, p);
    return p;
  }
  familyMember(-1.70, 1.78, 1.06, palette.blue, skinWarm, false, -0.20);
  familyMember(-1.04, 1.98, 0.98, creamSweater, skinLight, true, 0.20);
  familyMember(-1.35, 2.27, 0.67, childTop, skinWarm, false, 0.0);
  // Small travel bag beside a parent.
  box(0.18, 0.24, 0.12, -1.98, 0.27, 1.83, terracotta).rotation.y = -0.14;
  box(0.078, 0.027, 0.042, -1.98, 0.408, 1.83, palette.woodDark);

  function autoEnabled() {
    return !reducedMotion && !paused
  }

  function stopFrames() {
    if (frameId) cancelAnimationFrame(frameId)
    frameId = 0
    previousTick = 0
    previousRender = 0
  }

  function requestFrame() {
    if (!disposed && visible && !document.hidden && !frameId) {
      frameId = requestAnimationFrame(tick)
    }
  }

  function renderFrame() {
    if (disposed || !visible || document.hidden) return
    stage.rotation.y = currentAngle
    try {
      renderer.render(scene, camera)
      renderedFrames += 1
      if (!ready) {
        ready = true
        options.onReady()
      }
    } catch {
      fail()
    }
  }

  function tick(now: number) {
    frameId = 0
    if (disposed || !visible || document.hidden) {
      previousTick = 0
      previousRender = 0
      return
    }
    // Keep simulation and rendering at 30fps, independent of screen refresh rate.
    if (previousRender && now - previousRender < FRAME_INTERVAL_MS - 0.5) {
      requestFrame()
      return
    }
    const dt = previousTick ? Math.min((now - previousTick) / 1000, 0.08) : 0
    previousTick = now
    previousRender = now
    const automatic = autoEnabled() && !pointer && now >= holdUntil
    const oldAngle = currentAngle
    if (automatic) {
      if (mobile) {
        mobilePhase += dt * FULL_TURN / MOBILE_CYCLE_SECONDS
        targetAngle = Math.sin(mobilePhase) * MOBILE_AMPLITUDE
      } else {
        targetAngle += dt * FULL_TURN / DESKTOP_TURN_SECONDS
      }
    }
    const delta = targetAngle - currentAngle
    if (reducedMotion || Math.abs(delta) < 0.0002) currentAngle = targetAngle
    else currentAngle += delta * (1 - Math.exp(-11 * dt))
    // Keep long sessions numerically stable without changing the view.
    if (!mobile && Math.abs(currentAngle) > FULL_TURN * 2) {
      const turns = Math.trunc(currentAngle / FULL_TURN) * FULL_TURN
      currentAngle -= turns
      targetAngle -= turns
    }
    if (!ready || oldAngle !== currentAngle) renderFrame()
    if (autoEnabled() || Math.abs(targetAngle - currentAngle) > 0.0002) requestFrame()
    else {
      previousTick = 0
      previousRender = 0
    }
  }

  function resize() {
    if (disposed) return
    const bounds = mount.getBoundingClientRect()
    width = Math.max(1, bounds.width)
    height = Math.max(1, bounds.height)
    const aspect = width / height
    // Full-orbit framing includes the garden corners, not just the front facade.
    const viewHeight = Math.max(6.65, 9.1 / aspect)
    camera.left = -viewHeight * aspect / 2
    camera.right = viewHeight * aspect / 2
    camera.top = viewHeight / 2
    camera.bottom = -viewHeight / 2
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5))
    renderer.setSize(width, height, false)
    if (visible && !document.hidden) renderFrame()
    requestFrame()
  }

  function clampAngle(value: number) {
    return mobile ? Math.max(-0.5, Math.min(0.5, value)) : value
  }

  function pauseAfterInteraction() {
    holdUntil = performance.now() + INTERACTION_PAUSE_MS
  }

  function rotate(delta: number) {
    if (disposed || !Number.isFinite(delta)) return
    pauseAfterInteraction()
    targetAngle = clampAngle(targetAngle + delta)
    requestFrame()
  }

  function reset() {
    if (disposed) return
    pauseAfterInteraction()
    if (!mobile) {
      // Return by the nearest turn, even after several automatic revolutions.
      targetAngle = Math.round(currentAngle / FULL_TURN) * FULL_TURN
    } else targetAngle = 0
    mobilePhase = 0
    requestFrame()
  }

  function setMobile(next: boolean) {
    if (disposed || mobile === next) return
    mobile = next
    if (mobile) {
      currentAngle = Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle))
      targetAngle = clampAngle(currentAngle)
      mobilePhase = 0
      pauseAfterInteraction()
    }
    resize()
  }

  function setReducedMotion(next: boolean) {
    if (disposed || reducedMotion === next) return
    reducedMotion = next
    targetAngle = currentAngle
    stopFrames()
    requestFrame()
  }

  function setPaused(next: boolean) {
    if (disposed || paused === next) return
    paused = next
    targetAngle = currentAngle
    stopFrames()
    requestFrame()
  }

  function onPointerDown(event: PointerEvent) {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      initial: currentAngle,
      horizontal: event.pointerType === 'mouse',
      canceled: false,
    }
    targetAngle = currentAngle
    pauseAfterInteraction()
    if (pointer.horizontal) canvas.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id || pointer.canceled) return
    const dx = event.clientX - pointer.x
    const dy = event.clientY - pointer.y
    if (!pointer.horizontal) {
      if (Math.abs(dy) > 7 && Math.abs(dy) >= Math.abs(dx)) {
        pointer.canceled = true
        return
      }
      if (Math.abs(dx) < 7 || Math.abs(dx) <= Math.abs(dy)) return
      pointer.horizontal = true
      canvas.setPointerCapture(event.pointerId)
    }
    if (event.cancelable) event.preventDefault()
    targetAngle = clampAngle(pointer.initial + dx / Math.max(width, 200) * (mobile ? 1.15 : 2.4))
    pauseAfterInteraction()
    requestFrame()
  }

  function onPointerEnd(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return
    pointer = null
    pauseAfterInteraction()
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    requestFrame()
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove, { passive: false })
  canvas.addEventListener('pointerup', onPointerEnd)
  canvas.addEventListener('pointercancel', onPointerEnd)
  canvas.addEventListener('lostpointercapture', onPointerEnd)
  disposers.push(() => {
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerEnd)
    canvas.removeEventListener('pointercancel', onPointerEnd)
    canvas.removeEventListener('lostpointercapture', onPointerEnd)
  })

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(mount)
  disposers.push(() => resizeObserver.disconnect())
  if (typeof IntersectionObserver === 'function') {
    const visibilityObserver = new IntersectionObserver(entries => {
      if (disposed) return
      visible = entries[0]?.isIntersecting ?? false
      if (visible) {
        previousTick = 0
        previousRender = 0
        renderFrame()
        requestFrame()
      } else stopFrames()
    }, { threshold: 0 })
    visibilityObserver.observe(mount)
    disposers.push(() => visibilityObserver.disconnect())
  }

  function onVisibility() {
    if (document.hidden) {
      pointer = null
      stopFrames()
    } else requestFrame()
  }
  document.addEventListener('visibilitychange', onVisibility)
  disposers.push(() => document.removeEventListener('visibilitychange', onVisibility))

  function onContextLost(event: Event) {
    event.preventDefault()
    fail()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  disposers.push(() => canvas.removeEventListener('webglcontextlost', onContextLost))

  function dispose() {
    if (disposed) return
    disposed = true
    stopFrames()
    pointer = null
    disposers.forEach(disposer => disposer())
    key.shadow.dispose()
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    scene.clear()
    renderer.renderLists.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
  }

  function fail() {
    if (disposed) return
    dispose()
    options.onError()
  }

  resize()

  return {
    setMobile,
    setReducedMotion,
    setPaused,
    rotate,
    reset,
    dispose,
    getStats() {
      return {
        ready,
        disposed,
        mobile,
        reducedMotion,
        paused,
        visible: visible && !document.hidden,
        angle: Number(currentAngle.toFixed(4)),
        targetAngle: Number(targetAngle.toFixed(4)),
        renderedFrames,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: geometries.size,
        materials: materials.size,
        pixelRatio: renderer.getPixelRatio(),
      }
    },
  }
}
