const SLOT_COUNT = 10
const STORAGE_KEY = 'ftLayers'
const DEFAULT_SRC = 'assets/transparent.png'
const RIG_DEFAULT_SRC = {
  bang: 'assets/bang.png',
  eyes: 'assets/eyes.png',
  mouth: 'assets/mouth.png',
  face: 'assets/face.png',
  body: 'assets/body.png',
  back: 'assets/back.png'
}

const slotId = (index) => (index + 1) % SLOT_COUNT
const rigOptions = ['bang', 'eyes', 'mouth', 'face', 'body', 'back']
const roleOptions = ['none', 'blink', 'mouth']
const roleLabels = {
  none: '없음',
  blink: '눈(깜박임)',
  mouth: '입(말하기)'
}
const altLabels = {
  blink: '눈 감음',
  mouth: '입 열림'
}

let layerIdSeed = Date.now()

function createLayerId() {
  layerIdSeed += 1
  return `layer-${layerIdSeed}`
}

function getDefaultRigSrc(rig) {
  return RIG_DEFAULT_SRC[rig] || DEFAULT_SRC
}

function normalizeAssetPath(value) {
  if (typeof value !== 'string') {
    return value
  }
  if (value.indexOf('/assets/') === 0) {
    return value.slice(1)
  }
  return value
}

function resolveInputSrc(value, fallback) {
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (!trimmed) {
    return fallback
  }
  return normalizeAssetPath(trimmed)
}

function getDefaultRotatePivotY(rig) {
  if (rig === 'bang' || rig === 'back') {
    return 30
  }
  if (rig === 'eyes' || rig === 'mouth' || rig === 'face') {
    return 45
  }
  if (rig === 'body') {
    return 70
  }
  return 50
}

function normalizeRotatePivot(value, rig) {
  let nextValue = value
  if (!Number.isFinite(nextValue)) {
    nextValue = getDefaultRotatePivotY(rig)
  }
  return Math.min(100, Math.max(0, Math.round(nextValue)))
}

function getLegacyRotateKey(rig) {
  const keys = {
    bang: 'ftRigRotateBang',
    eyes: 'ftRigRotateEyes',
    mouth: 'ftRigRotateMouth',
    face: 'ftRigRotateFace',
    body: 'ftRigRotateBody',
    back: 'ftRigRotateBack'
  }
  return keys[rig] || null
}

function getLegacyRotateValue(rig) {
  const key = getLegacyRotateKey(rig)
  if (!key) {
    return null
  }
  const stored = localStorage.getItem(key)
  if (stored == null) {
    return null
  }
  const parsed = parseInt(stored, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeRotateValue(value, rig) {
  let nextValue = value
  if (!Number.isFinite(nextValue)) {
    nextValue = getLegacyRotateValue(rig)
  }
  if (!Number.isFinite(nextValue)) {
    nextValue = 100
  }
  return Math.min(100, Math.max(0, Math.round(nextValue)))
}

function readLegacyArray(key, fallback) {
  const stored = localStorage.getItem(key)
  let values
  if (!stored) {
    values = new Array(SLOT_COUNT).fill(fallback)
  } else if (stored[0] !== '[') {
    values = new Array(SLOT_COUNT).fill(normalizeAssetPath(stored))
  } else {
    const parsed = JSON.parse(stored)
    values = Array.isArray(parsed) ? parsed : new Array(SLOT_COUNT).fill(fallback)
  }
  const normalized = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const value = Array.isArray(values) ? values[i] : values
    const normalizedValue = normalizeAssetPath(value)
    normalized[i] = normalizedValue == null ? fallback : normalizedValue
  }
  return normalized
}

function readLegacyDisplayArray(key) {
  const stored = localStorage.getItem(key)
  let values
  if (!stored) {
    values = new Array(SLOT_COUNT).fill('')
  } else if (stored[0] !== '[') {
    values = new Array(SLOT_COUNT).fill(stored)
  } else {
    const parsed = JSON.parse(stored)
    values = Array.isArray(parsed) ? parsed : new Array(SLOT_COUNT).fill('')
  }
  const normalized = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const value = Array.isArray(values) ? values[i] : values
    normalized[i] = typeof value === 'string' ? value : ''
  }
  return normalized
}

function normalizeLayer(layer, fallback) {
  const base = layer || {}
  const fallbackLayer = fallback || {}
  let rig = typeof base.rig === 'string' ? base.rig : fallbackLayer.rig
  if (rigOptions.indexOf(rig) === -1) {
    rig = fallbackLayer.rig || 'face'
  }
  let role = typeof base.role === 'string' ? base.role : fallbackLayer.role
  if (roleOptions.indexOf(role) === -1) {
    role = fallbackLayer.role || 'none'
  }
  let rotate = Number.isFinite(base.rotate) ? base.rotate : parseInt(base.rotate, 10)
  if (!Number.isFinite(rotate)) {
    rotate = fallbackLayer.rotate
  }
  rotate = normalizeRotateValue(rotate, rig)
  let rotatePivotY = Number.isFinite(base.rotatePivotY) ? base.rotatePivotY : parseInt(base.rotatePivotY, 10)
  if (!Number.isFinite(rotatePivotY)) {
    rotatePivotY = fallbackLayer.rotatePivotY
  }
  rotatePivotY = normalizeRotatePivot(rotatePivotY, rig)
  const srcFallback = typeof fallbackLayer.src === 'string' ? fallbackLayer.src : getDefaultRigSrc(rig)
  const altFallback = typeof fallbackLayer.altSrc === 'string' ? fallbackLayer.altSrc : ''
  const src = resolveInputSrc(base.src, srcFallback)
  const altSrc = resolveInputSrc(base.altSrc, altFallback)
  return {
    id: typeof base.id === 'string' ? base.id : (fallbackLayer.id || createLayerId()),
    src,
    display: typeof base.display === 'string' ? base.display : (fallbackLayer.display || ''),
    rig,
    role,
    rotate,
    rotatePivotY,
    altSrc,
    altDisplay: typeof base.altDisplay === 'string' ? base.altDisplay : (fallbackLayer.altDisplay || '')
  }
}

function buildLegacyLayers() {
  const bangArray = readLegacyArray('ftBang', 'assets/bang.png')
  const eyesArray = readLegacyArray('ftEyes', 'assets/eyes.png')
  const eyesClosedArray = readLegacyArray('ftEyesClosed', 'assets/eyesclosed.png')
  const mouthArray = readLegacyArray('ftMouth', 'assets/mouth.png')
  const mouthOpenArray = readLegacyArray('ftMouthOpen', 'assets/mouthopen.png')
  const faceArray = readLegacyArray('ftFace', 'assets/face.png')
  const bodyArray = readLegacyArray('ftBody', 'assets/body.png')
  const backArray = readLegacyArray('ftBack', 'assets/back.png')

  const bangDisplay = readLegacyDisplayArray('ftBangDisplay')
  const eyesDisplay = readLegacyDisplayArray('ftEyesDisplay')
  const eyesClosedDisplay = readLegacyDisplayArray('ftEyesClosedDisplay')
  const mouthDisplay = readLegacyDisplayArray('ftMouthDisplay')
  const mouthOpenDisplay = readLegacyDisplayArray('ftMouthOpenDisplay')
  const faceDisplay = readLegacyDisplayArray('ftFaceDisplay')
  const bodyDisplay = readLegacyDisplayArray('ftBodyDisplay')
  const backDisplay = readLegacyDisplayArray('ftBackDisplay')

  const slots = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    slots[i] = [
      {
        id: createLayerId(),
        src: bangArray[i],
        display: bangDisplay[i],
        rig: 'bang',
        role: 'none'
      },
      {
        id: createLayerId(),
        src: mouthArray[i],
        display: mouthDisplay[i],
        rig: 'mouth',
        role: 'mouth',
        altSrc: mouthOpenArray[i],
        altDisplay: mouthOpenDisplay[i]
      },
      {
        id: createLayerId(),
        src: eyesArray[i],
        display: eyesDisplay[i],
        rig: 'eyes',
        role: 'blink',
        altSrc: eyesClosedArray[i],
        altDisplay: eyesClosedDisplay[i]
      },
      {
        id: createLayerId(),
        src: faceArray[i],
        display: faceDisplay[i],
        rig: 'face',
        role: 'none'
      },
      {
        id: createLayerId(),
        src: bodyArray[i],
        display: bodyDisplay[i],
        rig: 'body',
        role: 'none'
      },
      {
        id: createLayerId(),
        src: backArray[i],
        display: backDisplay[i],
        rig: 'back',
        role: 'none'
      }
    ]
  }
  return slots
}

function loadLayerSlots() {
  const stored = localStorage.getItem(STORAGE_KEY)
  let slots
  if (stored && stored[0] === '[') {
    const parsed = JSON.parse(stored)
    slots = Array.isArray(parsed) ? parsed : null
  }
  if (!slots) {
    slots = buildLegacyLayers()
  }
  const normalizedSlots = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slotLayers = Array.isArray(slots[i]) ? slots[i] : []
    normalizedSlots[i] = slotLayers.map(function(layer) {
      return normalizeLayer(layer)
    })
    if (!normalizedSlots[i].length) {
      normalizedSlots[i] = [normalizeLayer({ rig: 'face', role: 'none' })]
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSlots))
  return normalizedSlots
}

