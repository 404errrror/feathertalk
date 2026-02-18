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
  try {
    localStorage.setItem(key, JSON.stringify(normalized))
  } catch (error) {
    if (isQuotaExceeded(error)) {
      console.warn('localStorage quota exceeded while saving legacy assets.')
    } else {
      throw error
    }
  }
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

function isQuotaExceeded(error) {
  return error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error.code === 22 || error.code === 1014)
}

function trySaveLayerSlots(slots) {
  try {
    localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(slots))
    return true
  } catch (error) {
    if (isQuotaExceeded(error)) {
      console.warn('localStorage quota exceeded while saving layers.')
      return false
    }
    throw error
  }
}

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

function normalizeRotateLagValue(value, fallback) {
  let nextValue = Number.isFinite(value) ? value : parseInt(value, 10)
  if (!Number.isFinite(nextValue)) {
    nextValue = Number.isFinite(fallback) ? fallback : 0
  }
  return Math.min(300, Math.max(0, Math.round(nextValue)))
}

function normalizeRotateBounceValue(value, fallback) {
  let nextValue = Number.isFinite(value) ? value : parseInt(value, 10)
  if (!Number.isFinite(nextValue)) {
    nextValue = Number.isFinite(fallback) ? fallback : 0
  }
  return Math.min(300, Math.max(0, Math.round(nextValue)))
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
  const rotateLag = normalizeRotateLagValue(base.rotateLag, fallbackLayer.rotateLag)
  const rotateBounce = normalizeRotateBounceValue(base.rotateBounce, fallbackLayer.rotateBounce)
  const srcFallback = typeof fallbackLayer.src === 'string' ? fallbackLayer.src : getDefaultRigSrc(rig)
  const altFallback = typeof fallbackLayer.altSrc === 'string' ? fallbackLayer.altSrc : ''
  return {
    id: typeof base.id === 'string' ? base.id : (fallbackLayer.id || createLayerId()),
    src: resolveLayerSrc(base.src, srcFallback),
    display: typeof base.display === 'string' ? base.display : (fallbackLayer.display || ''),
    altSrc: resolveLayerSrc(base.altSrc, altFallback),
    altDisplay: typeof base.altDisplay === 'string' ? base.altDisplay : (fallbackLayer.altDisplay || ''),
    rig,
    role,
    rotate,
    rotatePivotY,
    rotateLag,
    rotateBounce
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
  trySaveLayerSlots(normalizedSlots)
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
  layer.wrapper = wrapper

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
  resetRigRotateLagState()
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

var rotateLagAnimationFrameId = null
var rotateLagCurrentRotateDeg = 0
var rotateLagTargetRotateDeg = 0
var rotateLagSettleThreshold = 0.02

function getRotateLagNowMs() {
  if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

function stopRotateLagAnimationLoop() {
  if (rotateLagAnimationFrameId == null) {
    return
  }
  cancelAnimationFrame(rotateLagAnimationFrameId)
  rotateLagAnimationFrameId = null
}

function scheduleRotateLagAnimationLoop() {
  if (rotateLagAnimationFrameId != null || typeof requestAnimationFrame !== 'function') {
    return
  }
  rotateLagAnimationFrameId = requestAnimationFrame(runRotateLagAnimationFrame)
}

function runRotateLagAnimationFrame(nowMs) {
  rotateLagAnimationFrameId = null
  var frameNow = Number.isFinite(nowMs) ? nowMs : getRotateLagNowMs()
  var hasUnsettledLag = applyRigRotationSensitivityWithTimestamp(rotateLagCurrentRotateDeg, frameNow, rotateLagTargetRotateDeg)
  if (hasUnsettledLag) {
    scheduleRotateLagAnimationLoop()
  }
}

function resetRigRotateLagState() {
  stopRotateLagAnimationLoop()
  rotateLagCurrentRotateDeg = Number.isFinite(currentRotate) ? currentRotate : 0
  rotateLagTargetRotateDeg = rotateLagCurrentRotateDeg
  if (!rigTargets) {
    return
  }
  var rigKeys = Object.keys(rigTargets)
  for (let i = 0; i < rigKeys.length; i++) {
    var rigKey = rigKeys[i]
    var targets = rigTargets[rigKey]
    if (!targets || !targets.length) {
      continue
    }
    for (let j = 0; j < targets.length; j++) {
      targets[j].rotateLagState = null
    }
  }
}

function applyRigRotationSensitivityWithTimestamp(rotateDeg, nowMs, lagTargetDeg) {
  var hasUnsettledLag = false
  if (!Number.isFinite(rotateDeg)) {
    rotateDeg = 0
  }
  var lagTargetRotateDeg = Number.isFinite(lagTargetDeg) ? lagTargetDeg : rotateDeg
  var frameNow = Number.isFinite(nowMs) ? nowMs : getRotateLagNowMs()
  if (!rigTargets) {
    return hasUnsettledLag
  }
  var rigKeys = Object.keys(rigTargets)
  for (let i = 0; i < rigKeys.length; i++) {
    var rigKey = rigKeys[i]
    var targets = rigTargets[rigKey]
    if (!targets || !targets.length) {
      continue
    }
    for (let j = 0; j < targets.length; j++) {
      const target = targets[j]
      var sensitivity = Number.isFinite(target.rotate) ? target.rotate : 100
      sensitivity = Math.min(100, Math.max(0, sensitivity))
      var sensitivityRatio = sensitivity / 100
      var baseCompensation = rotateDeg * (sensitivityRatio - 1)
      var lagStrength = normalizeRotateLagValue(target.rotateLag, 0)
      var bounceStrength = lagStrength > 0 ? normalizeRotateBounceValue(target.rotateBounce, 0) : 0
      var finalCompensation = baseCompensation
      if (lagStrength > 0 && sensitivityRatio > 0) {
        var lagMs = 20 + lagStrength * 8
        var bounceRatio = bounceStrength / 100
        var zeta = bounceRatio <= 1
          ? (1 - 0.75 * bounceRatio)
          : (0.25 - 0.1 * (bounceRatio - 1))
        zeta = Math.min(1, Math.max(0.05, zeta))
        var lagSeconds = lagMs / 1000
        var wn = lagSeconds > 0 ? 4 / lagSeconds : 0
        var lagState = target.rotateLagState
        if (!lagState || !Number.isFinite(lagState.followRotate) || !Number.isFinite(lagState.velocityRotate)) {
          lagState = {
            followRotate: rotateDeg,
            velocityRotate: 0,
            timestamp: frameNow
          }
        }
        var previousTimestamp = Number.isFinite(lagState.timestamp) ? lagState.timestamp : frameNow
        var deltaMs = frameNow - previousTimestamp
        if (!Number.isFinite(deltaMs) || deltaMs < 0) {
          deltaMs = 0
        }
        deltaMs = Math.min(64, deltaMs)
        var steps = Math.max(1, Math.min(4, Math.ceil(deltaMs / 16)))
        var stepMs = steps > 0 ? deltaMs / steps : 0
        var dt = stepMs / 1000
        for (let step = 0; step < steps; step++) {
          var followRotate = Number.isFinite(lagState.followRotate) ? lagState.followRotate : rotateDeg
          var velocityRotate = Number.isFinite(lagState.velocityRotate) ? lagState.velocityRotate : 0
          var acceleration = wn * wn * (lagTargetRotateDeg - followRotate) - 2 * zeta * wn * velocityRotate
          velocityRotate += acceleration * dt
          followRotate += velocityRotate * dt
          if (!Number.isFinite(followRotate) || !Number.isFinite(velocityRotate)) {
            followRotate = rotateDeg
            velocityRotate = 0
          }
          lagState.followRotate = followRotate
          lagState.velocityRotate = velocityRotate
        }
        lagState.timestamp = frameNow
        target.rotateLagState = lagState
        var lagOffset = (lagState.followRotate - rotateDeg) * sensitivityRatio
        finalCompensation = baseCompensation + lagOffset
        if (Math.abs(lagState.followRotate - lagTargetRotateDeg) > rotateLagSettleThreshold || Math.abs(lagState.velocityRotate) > rotateLagSettleThreshold) {
          hasUnsettledLag = true
        }
      } else {
        target.rotateLagState = {
          followRotate: rotateDeg,
          velocityRotate: 0,
          timestamp: frameNow
        }
      }
      var transformText = Math.abs(finalCompensation) < 0.001 ? '0deg' : `${finalCompensation}deg`
      if (target.wrapper) {
        target.wrapper.style.setProperty('--rig-rotate-comp', transformText)
        var pivotY = Number.isFinite(target.rotatePivotY) ? target.rotatePivotY : 50
        pivotY = Math.min(100, Math.max(0, pivotY))
        target.wrapper.style.setProperty('--rig-rotate-origin-y', `${pivotY}%`)
        target.wrapper.style.setProperty('--rig-rotate-origin-x', '50%')
      }
    }
  }
  return hasUnsettledLag
}

function applyRigRotationSensitivity(rotateDeg, lagTargetDeg) {
  if (!Number.isFinite(rotateDeg)) {
    rotateDeg = 0
  }
  rotateLagCurrentRotateDeg = rotateDeg
  rotateLagTargetRotateDeg = Number.isFinite(lagTargetDeg) ? lagTargetDeg : rotateDeg
  var hasUnsettledLag = applyRigRotationSensitivityWithTimestamp(rotateDeg, getRotateLagNowMs(), rotateLagTargetRotateDeg)
  if (hasUnsettledLag) {
    scheduleRotateLagAnimationLoop()
  } else {
    stopRotateLagAnimationLoop()
  }
}

var layerSlots = loadLayerSlots()
var currentLayers = []
var micInputAvailable = false
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
  if (typeof currentRotate === 'number') {
    applyRigRotationSensitivity(currentRotate)
  }
}

function normalizeSlotIndex(value) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return ((Math.round(value) % 10) + 10) % 10
}

function applyPresetWithLiveSettings(index) {
  var nextIndex = normalizeSlotIndex(index)
  applyPreset(nextIndex)
  if (typeof window.applyLiveSlotByIndex === 'function') {
    window.applyLiveSlotByIndex(nextIndex)
  } else {
    localStorage.setItem('ftLiveSlot', String(nextIndex))
  }
}

var initialPresetIndex = 0
if (typeof window.getLiveActiveSlotIndex === 'function') {
  initialPresetIndex = normalizeSlotIndex(window.getLiveActiveSlotIndex())
} else {
  initialPresetIndex = normalizeSlotIndex(parseInt(localStorage.getItem('ftLiveSlot'), 10))
}
applyPresetWithLiveSettings(initialPresetIndex)

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
  applyPresetWithLiveSettings(index)
})

function updateExpression(volume) {
  const now = Date.now()
  const useCameraMouth = cameraMouthEnabled && cameraEnabled && cameraMode === 'face-mesh' && faceMeshReady && now - cameraMouthLastUpdate <= cameraMouthStaleMs
  const mouthActive = useCameraMouth ? cameraMouthActive : micInputAvailable && volume >= thres && now % 400 >= 200
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
  micInputAvailable = false
  // Initialize
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true
      }
    });
    micInputAvailable = true
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
    micInputAvailable = false
    console.error('Failed to initialize volume visualizer, microphone unavailable and mouth fallback disabled.', e);
    volumeCallback = () => {
      lastVolumeValue = 0
      updateExpression(0)
    };
  }
  setInterval(() => {
    
  volumeCallback()
  }, 100);
}

