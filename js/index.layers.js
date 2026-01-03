function normalizeAssetPath(value) {
  if (typeof value !== 'string') {
    return value
  }
  if (value.indexOf('/assets/') === 0) {
    return value.slice(1)
  }
  return value
}

function readAssetArray(key, fallback) {
  const stored = localStorage.getItem(key)
  let values
  if (!stored) {
    values = new Array(10).fill(fallback)
  } else if (stored[0] !== '[') {
    values = new Array(10).fill(normalizeAssetPath(stored))
  } else {
    const parsed = JSON.parse(stored)
    values = Array.isArray(parsed) ? parsed : new Array(10).fill(fallback)
  }
  const normalized = new Array(10)
  for (let i = 0; i < 10; i++) {
    const normalizedValue = normalizeAssetPath(values[i])
    normalized[i] = normalizedValue == null ? fallback : normalizedValue
  }
  localStorage.setItem(key, JSON.stringify(normalized))
  return normalized
}

const LAYER_STORAGE_KEY = 'ftLayers'
const DEFAULT_LAYER_SRC = 'assets/transparent.png'
const RIG_DEFAULT_SRC = {
  bang: 'assets/bang.png',
  eyes: 'assets/eyes.png',
  mouth: 'assets/mouth.png',
  face: 'assets/face.png',
  body: 'assets/body.png',
  back: 'assets/back.png'
}
const rigOptions = ['bang', 'eyes', 'mouth', 'face', 'body', 'back']
const splitRigOptions = ['bang', 'eyes', 'mouth', 'face']
const roleOptions = ['none', 'blink', 'mouth']

let layerIdSeed = Date.now()

function createLayerId() {
  layerIdSeed += 1
  return `layer-${layerIdSeed}`
}

function getDefaultRigSrc(rig) {
  return RIG_DEFAULT_SRC[rig] || DEFAULT_LAYER_SRC
}

function resolveLayerSrc(value, fallback) {
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (!trimmed) {
    return fallback
  }
  return normalizeAssetPath(trimmed)
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
  const srcFallback = typeof fallbackLayer.src === 'string' ? fallbackLayer.src : getDefaultRigSrc(rig)
  const altFallback = typeof fallbackLayer.altSrc === 'string' ? fallbackLayer.altSrc : ''
  return {
    id: typeof base.id === 'string' ? base.id : (fallbackLayer.id || createLayerId()),
    src: resolveLayerSrc(base.src, srcFallback),
    display: typeof base.display === 'string' ? base.display : (fallbackLayer.display || ''),
    altSrc: resolveLayerSrc(base.altSrc, altFallback),
    altDisplay: typeof base.altDisplay === 'string' ? base.altDisplay : (fallbackLayer.altDisplay || ''),
    rig,
    role
  }
}

function buildLegacyLayerSlots() {
  const bangArray = readAssetArray('ftBang', 'assets/bang.png')
  const eyesArray = readAssetArray('ftEyes', 'assets/eyes.png')
  const eyesClosedArray = readAssetArray('ftEyesClosed', 'assets/eyesclosed.png')
  const mouthArray = readAssetArray('ftMouth', 'assets/mouth.png')
  const mouthOpenArray = readAssetArray('ftMouthOpen', 'assets/mouthopen.png')
  const faceArray = readAssetArray('ftFace', 'assets/face.png')
  const bodyArray = readAssetArray('ftBody', 'assets/body.png')
  const backArray = readAssetArray('ftBack', 'assets/back.png')

  const slots = new Array(10)
  for (let i = 0; i < 10; i++) {
    slots[i] = [
      { id: createLayerId(), src: bangArray[i], rig: 'bang', role: 'none' },
      { id: createLayerId(), src: mouthArray[i], rig: 'mouth', role: 'mouth', altSrc: mouthOpenArray[i] },
      { id: createLayerId(), src: eyesArray[i], rig: 'eyes', role: 'blink', altSrc: eyesClosedArray[i] },
      { id: createLayerId(), src: faceArray[i], rig: 'face', role: 'none' },
      { id: createLayerId(), src: bodyArray[i], rig: 'body', role: 'none' },
      { id: createLayerId(), src: backArray[i], rig: 'back', role: 'none' }
    ]
  }
  return slots
}

function loadLayerSlots() {
  const stored = localStorage.getItem(LAYER_STORAGE_KEY)
  let slots
  if (stored && stored[0] === '[') {
    const parsed = JSON.parse(stored)
    slots = Array.isArray(parsed) ? parsed : null
  }
  if (!slots) {
    slots = buildLegacyLayerSlots()
  }
  const normalizedSlots = new Array(10)
  for (let i = 0; i < 10; i++) {
    const slotLayers = Array.isArray(slots[i]) ? slots[i] : []
    normalizedSlots[i] = slotLayers.map(function(layer) {
      return normalizeLayer(layer)
    })
    if (!normalizedSlots[i].length) {
      normalizedSlots[i] = [normalizeLayer({ rig: 'face', role: 'none' })]
    }
  }
  localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(normalizedSlots))
  return normalizedSlots
}

function getLayerType(rig) {
  return splitRigOptions.indexOf(rig) !== -1 ? 'split' : 'single'
}

function setLayerImage(layer, src) {
  const value = src || DEFAULT_LAYER_SRC
  if (layer.type === 'split') {
    if (layer.imgL) {
      layer.imgL.src = value
    }
    if (layer.imgR) {
      layer.imgR.src = value
    }
  } else if (layer.img) {
    layer.img.src = value
  }
}

function buildLayerElement(layer, zIndex) {
  const wrapper = document.createElement('div')
  wrapper.className = `layer layer--${layer.type}`
  wrapper.style.zIndex = zIndex
  layer.zIndex = zIndex

  if (layer.type === 'split') {
    const left = document.createElement('div')
    left.className = 'layer__split layer__split--left'
    const leftImg = document.createElement('img')
    leftImg.className = 'layer__img layer__img--left'
    left.appendChild(leftImg)

    const right = document.createElement('div')
    right.className = 'layer__split layer__split--right'
    const rightImg = document.createElement('img')
    rightImg.className = 'layer__img layer__img--right'
    right.appendChild(rightImg)

    wrapper.appendChild(left)
    wrapper.appendChild(right)

    layer.divL = left
    layer.divR = right
    layer.imgL = leftImg
    layer.imgR = rightImg
    setLayerImage(layer, layer.src)
  } else {
    const img = document.createElement('img')
    img.className = 'layer__img layer__img--single'
    wrapper.appendChild(img)
    layer.img = img
    setLayerImage(layer, layer.src)
  }

  return wrapper
}

function rebuildRigTargets(layers) {
  rigTargets = {
    bang: [],
    eyes: [],
    mouth: [],
    face: [],
    body: [],
    back: []
  }
  layers.forEach(function(layer) {
    if (rigTargets[layer.rig]) {
      rigTargets[layer.rig].push(layer)
    }
  })
}

function applyStyleWithZ(element, styleText, zIndex) {
  if (!element) {
    return
  }
  var zText = Number.isFinite(zIndex) ? `z-index: ${zIndex};` : ''
  element.setAttribute('style', `${styleText}${zText}`)
}

function applySplitStyles(target, styles) {
  if (!target) {
    return
  }
  if (styles.divL && target.divL) {
    target.divL.setAttribute('style', styles.divL)
  }
  if (styles.divR && target.divR) {
    target.divR.setAttribute('style', styles.divR)
  }
  if (styles.imgL && target.imgL) {
    applyStyleWithZ(target.imgL, styles.imgL, target.zIndex)
  }
  if (styles.imgR && target.imgR) {
    applyStyleWithZ(target.imgR, styles.imgR, target.zIndex)
  }
}

function applySingleStyles(target, styles) {
  if (!target || !target.img) {
    return
  }
  if (styles.img) {
    applyStyleWithZ(target.img, styles.img, target.zIndex)
  }
}

function applyRigStyles(rigKey, styles) {
  var targets = rigTargets[rigKey]
  if (!targets || !targets.length) {
    return
  }
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]
    if (target.type === 'split') {
      applySplitStyles(target, styles)
    } else {
      applySingleStyles(target, styles)
    }
  }
}

var layerSlots = loadLayerSlots()
var currentLayers = []
var rigTargets = {
  bang: [],
  eyes: [],
  mouth: [],
  face: [],
  body: [],
  back: []
}

function applyPreset(index) {
  if (!Number.isFinite(index)) {
    return
  }
  const slotLayers = Array.isArray(layerSlots[index]) ? layerSlots[index] : []
  if (character) {
    character.innerHTML = ''
  }
  const total = slotLayers.length
  currentLayers = []
  for (let i = 0; i < slotLayers.length; i++) {
    const layer = normalizeLayer(slotLayers[i])
    layer.type = getLayerType(layer.rig)
    const zIndex = total - i
    const element = buildLayerElement(layer, zIndex)
    if (character) {
      character.appendChild(element)
    }
    currentLayers.push(layer)
  }
  rebuildRigTargets(currentLayers)
  updateExpression(0)
}

applyPreset(0)

window.addEventListener('keydown', function(e) {
  var target = e.target
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
    return
  }
  const digit = parseInt(e.key, 10)
  if (Number.isNaN(digit)) {
    return
  }
  const index = (digit + 9) % 10
  applyPreset(index)
})

function updateExpression(volume) {
  const now = Date.now()
  const useCameraMouth = cameraMouthEnabled && cameraEnabled && cameraMode === 'face-mesh' && faceMeshReady && now - cameraMouthLastUpdate <= cameraMouthStaleMs
  const mouthActive = useCameraMouth ? cameraMouthActive : volume >= thres && now % 400 >= 200
  const useCameraBlink = cameraBlinkEnabled && cameraEnabled && cameraMode === 'face-mesh' && faceMeshReady && now - cameraBlinkLastUpdate <= cameraBlinkStaleMs
  const blinkActive = useCameraBlink ? cameraBlinkActive : now % 3000 >= 2800

  for (let i = 0; i < currentLayers.length; i++) {
    const layer = currentLayers[i]
    if (layer.role === 'mouth') {
      const nextSrc = mouthActive && layer.altSrc ? layer.altSrc : layer.src
      setLayerImage(layer, nextSrc)
    } else if (layer.role === 'blink') {
      const nextSrc = blinkActive && layer.altSrc ? layer.altSrc : layer.src
      setLayerImage(layer, nextSrc)
    }
  }
}

async function audio () {
  let volumeCallback = null;
  // Initialize
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true
      }
    });
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaStreamSource(audioStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.minDecibels = -127;
    analyser.maxDecibels = 0;
    analyser.smoothingTimeConstant = 0.4;
    audioSource.connect(analyser);
    const volumes = new Uint8Array(analyser.frequencyBinCount);
    volumeCallback = () => {
      analyser.getByteFrequencyData(volumes);
      let volumeSum = 0;
      for(const volume of volumes)
        volumeSum += volume;
      const averageVolume = volumeSum / volumes.length;

      lastVolumeValue = averageVolume
      updateExpression(averageVolume)
      // Value range: 127 = analyser.maxDecibels - analyser.minDecibels;
    };
  } catch(e) {
    console.error('Failed to initialize volume visualizer, simulating instead...', e);
    // Simulation
    //TODO remove in production!
    let lastVolume = 50;
    volumeCallback = () => {
      const volume = Math.min(Math.max(Math.random() * 100, 0.8 * lastVolume), 1.2 * lastVolume);
      lastVolume = volume;
      lastVolumeValue = lastVolume
      updateExpression(lastVolume)
    };
  }
  setInterval(() => {
    
  volumeCallback()
  }, 100);
}

