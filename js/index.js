var thres = 30
if (localStorage.getItem('ftThres')) {
  thres = parseInt(localStorage.getItem('ftThres'))
  document.querySelector('#threshold').value=thres
}

var rig = 100
if (localStorage.getItem('ftRig')) {
  rig = localStorage.getItem('ftRig')
  document.querySelector('#rig').value=rig
}

var color = '#00ff00'
if (localStorage.getItem('ftColor')) {
  color = localStorage.getItem('ftColor')
  document.querySelector('#color').value=color
}
document.body.setAttribute('style', `background: ${color};`)

var offsetX = 0
if (localStorage.getItem('ftOffsetX')) {
  offsetX = parseInt(localStorage.getItem('ftOffsetX'), 10)
}
if (!Number.isFinite(offsetX)) {
  offsetX = 0
}

var offsetY = 0
if (localStorage.getItem('ftOffsetY')) {
  offsetY = parseInt(localStorage.getItem('ftOffsetY'), 10)
}
if (!Number.isFinite(offsetY)) {
  offsetY = 0
}

var intervalLimitMin = 200
var intervalLimitMax = 3000
var intervalMin = 1500
var intervalMax = 1500
var storedInterval = localStorage.getItem('ftInterval')
if (storedInterval && !localStorage.getItem('ftIntervalMin') && !localStorage.getItem('ftIntervalMax')) {
  intervalMin = parseInt(storedInterval, 10)
  intervalMax = intervalMin
}
if (localStorage.getItem('ftIntervalMin')) {
  intervalMin = parseInt(localStorage.getItem('ftIntervalMin'), 10)
}
if (localStorage.getItem('ftIntervalMax')) {
  intervalMax = parseInt(localStorage.getItem('ftIntervalMax'), 10)
}

function clampInterval(value, minValue, maxValue) {
  return Math.min(Math.max(value, minValue), maxValue)
}

function normalizeIntervalRange() {
  if (!Number.isFinite(intervalMin)) {
    intervalMin = 1500
  }
  if (!Number.isFinite(intervalMax)) {
    intervalMax = 1500
  }
  intervalMin = clampInterval(intervalMin, intervalLimitMin, intervalLimitMax)
  intervalMax = clampInterval(intervalMax, intervalLimitMin, intervalLimitMax)
  if (intervalMin > intervalMax) {
    const temp = intervalMin
    intervalMin = intervalMax
    intervalMax = temp
  }
}

function clampIntervalRange(changedKey) {
  if (!Number.isFinite(intervalMin)) {
    intervalMin = 1500
  }
  if (!Number.isFinite(intervalMax)) {
    intervalMax = 1500
  }
  intervalMin = clampInterval(intervalMin, intervalLimitMin, intervalLimitMax)
  intervalMax = clampInterval(intervalMax, intervalLimitMin, intervalLimitMax)
  if (intervalMin > intervalMax) {
    if (changedKey === 'min') {
      intervalMin = intervalMax
    } else if (changedKey === 'max') {
      intervalMax = intervalMin
    } else {
      const temp = intervalMin
      intervalMin = intervalMax
      intervalMax = temp
    }
  }
}

function buildIntervals(duration) {
  var length = Math.max(1, parseInt(duration / 20, 10))
  return Array.from({ length }, (_, k) => 0 + k * 20)
}

function pickRandomInterval() {
  if (intervalMin === intervalMax) {
    return intervalMin
  }
  return Math.floor(Math.random() * (intervalMax - intervalMin + 1)) + intervalMin
}

normalizeIntervalRange()

var intervalMinInput = document.querySelector('#interval-min')
var intervalMaxInput = document.querySelector('#interval-max')
var intervalDisplay = document.querySelector('#interval-values')
var intervalRangeFill = document.querySelector('#interval-range-fill')
var intervalRange = document.querySelector('#interval-range')
var activeIntervalHandle = 'max'
var settingsToggle = document.querySelector('#settings-toggle')
var settingsPanel = document.querySelector('#settings-panel')
var offsetXInput = document.querySelector('#offset-x')
var offsetYInput = document.querySelector('#offset-y')
var offsetXValue = document.querySelector('#offset-x-value')
var offsetYValue = document.querySelector('#offset-y-value')
var character = document.querySelector('#character')
var currentRotate = 0

function formatIntervalMs(value) {
  return (value / 1000).toFixed(1)
}

function updateIntervalHandleZ() {
  if (!intervalMinInput || !intervalMaxInput) {
    return
  }
  if (intervalMin === intervalMax) {
    if (intervalMin <= intervalLimitMin) {
      intervalMinInput.style.zIndex = '3'
      intervalMaxInput.style.zIndex = '4'
    } else if (intervalMax >= intervalLimitMax) {
      intervalMinInput.style.zIndex = '4'
      intervalMaxInput.style.zIndex = '3'
    } else if (activeIntervalHandle === 'min') {
      intervalMinInput.style.zIndex = '4'
      intervalMaxInput.style.zIndex = '3'
    } else {
      intervalMinInput.style.zIndex = '3'
      intervalMaxInput.style.zIndex = '4'
    }
  } else {
    intervalMinInput.style.zIndex = '3'
    intervalMaxInput.style.zIndex = '4'
  }
}

function setIntervalHandleActive(handle) {
  activeIntervalHandle = handle
  updateIntervalHandleZ()
}

function bindIntervalHandleEvents(input, handle) {
  if (!input) {
    return
  }
  input.addEventListener('pointerdown', function() {
    setIntervalHandleActive(handle)
  })
  input.addEventListener('mousedown', function() {
    setIntervalHandleActive(handle)
  })
  input.addEventListener('touchstart', function() {
    setIntervalHandleActive(handle)
  }, { passive: true })
  input.addEventListener('focus', function() {
    setIntervalHandleActive(handle)
  })
}

function updateIntervalUI() {
  if (intervalMinInput) {
    intervalMinInput.value = intervalMin
  }
  if (intervalMaxInput) {
    intervalMaxInput.value = intervalMax
  }
  if (intervalDisplay) {
    intervalDisplay.textContent = `[${formatIntervalMs(intervalMin)}]~[${formatIntervalMs(intervalMax)}]s`
  }
  if (intervalRangeFill) {
    var rangeSpan = intervalLimitMax - intervalLimitMin
    var minPercent = ((intervalMin - intervalLimitMin) / rangeSpan) * 100
    var maxPercent = ((intervalMax - intervalLimitMin) / rangeSpan) * 100
    intervalRangeFill.style.left = `${minPercent}%`
    intervalRangeFill.style.width = `${maxPercent - minPercent}%`
  }
  updateIntervalHandleZ()
}

function updateOffsetUI() {
  if (offsetXInput) {
    offsetXInput.value = offsetX
  }
  if (offsetYInput) {
    offsetYInput.value = offsetY
  }
  if (offsetXValue) {
    offsetXValue.textContent = `${offsetX}px`
  }
  if (offsetYValue) {
    offsetYValue.textContent = `${offsetY}px`
  }
}

function applyCharacterTransform() {
  if (!character) {
    return
  }
  character.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${currentRotate}deg)`
}

function setCharacterTransform(rotateDeg) {
  currentRotate = rotateDeg
  applyCharacterTransform()
}

if (storedInterval && (!localStorage.getItem('ftIntervalMin') || !localStorage.getItem('ftIntervalMax'))) {
  localStorage.setItem('ftIntervalMin', intervalMin)
  localStorage.setItem('ftIntervalMax', intervalMax)
}

bindIntervalHandleEvents(intervalMinInput, 'min')
bindIntervalHandleEvents(intervalMaxInput, 'max')
updateIntervalUI()
updateOffsetUI()
applyCharacterTransform()

if (settingsToggle && settingsPanel) {
  settingsToggle.addEventListener('click', function() {
    var willOpen = settingsPanel.hasAttribute('hidden')
    if (willOpen) {
      settingsPanel.removeAttribute('hidden')
    } else {
      settingsPanel.setAttribute('hidden', '')
    }
    settingsToggle.setAttribute('aria-expanded', String(willOpen))
  })
}

var randomX = document.body.clientWidth/2; 
var randomY= document.body.clientHeight/2;

document.querySelector('#threshold').addEventListener('change', function(e){
  thres = e.target.value
  localStorage.setItem('ftThres', thres)
})

document.querySelector('#rig').addEventListener('change', function(e){
  rig = e.target.value
  localStorage.setItem('ftRig', rig)
})

document.querySelector('#color').addEventListener('change', function(e){
  document.body.setAttribute('style', `background: ${e.target.value};`)
  color = e.target.value
  localStorage.setItem('ftColor', color)
})

if (offsetXInput) {
  offsetXInput.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    offsetX = Number.isFinite(nextValue) ? nextValue : 0
    localStorage.setItem('ftOffsetX', offsetX)
    updateOffsetUI()
    applyCharacterTransform()
  })
}

if (offsetYInput) {
  offsetYInput.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    offsetY = Number.isFinite(nextValue) ? nextValue : 0
    localStorage.setItem('ftOffsetY', offsetY)
    updateOffsetUI()
    applyCharacterTransform()
  })
}

if (intervalMinInput) {
  intervalMinInput.addEventListener('input', function(e){
    setIntervalHandleActive('min')
    intervalMin = parseInt(e.target.value, 10)
    clampIntervalRange('min')
    localStorage.setItem('ftIntervalMin', intervalMin)
    localStorage.setItem('ftIntervalMax', intervalMax)
    updateIntervalUI()
  })
}

if (intervalMaxInput) {
  intervalMaxInput.addEventListener('input', function(e){
    setIntervalHandleActive('max')
    intervalMax = parseInt(e.target.value, 10)
    clampIntervalRange('max')
    localStorage.setItem('ftIntervalMin', intervalMin)
    localStorage.setItem('ftIntervalMax', intervalMax)
    updateIntervalUI()
  })
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
const rigOptions = ['bang', 'eyes', 'mouth', 'face', 'body', 'back']
const splitRigOptions = ['bang', 'eyes', 'mouth', 'face']
const roleOptions = ['none', 'blink', 'mouth']

let layerIdSeed = Date.now()

function createLayerId() {
  layerIdSeed += 1
  return `layer-${layerIdSeed}`
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
  return {
    id: typeof base.id === 'string' ? base.id : (fallbackLayer.id || createLayerId()),
    src: resolveLayerSrc(base.src, fallbackLayer.src || DEFAULT_LAYER_SRC),
    altSrc: resolveLayerSrc(base.altSrc, fallbackLayer.altSrc || ''),
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
      normalizedSlots[i] = [normalizeLayer({ src: DEFAULT_LAYER_SRC, rig: 'face', role: 'none' })]
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
  const digit = parseInt(e.key, 10)
  if (Number.isNaN(digit)) {
    return
  }
  const index = (digit + 9) % 10
  applyPreset(index)
})

function updateExpression(volume) {
  const now = Date.now()
  const mouthActive = volume >= thres && now % 400 >= 200
  const blinkActive = now % 3000 >= 2800

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
      updateExpression(lastVolume)
    };
  }
  setInterval(() => {
    
  volumeCallback()
  }, 100);
}

  let autoRig = null
  let autoResumeTimer = null
  let autoFrameTimers = []
  var pointerIdleDelay = 1500

  function clearAutoFrameTimers() {
    for (let i = 0; i < autoFrameTimers.length; i++) {
      clearTimeout(autoFrameTimers[i])
    }
    autoFrameTimers = []
  }

  function scheduleAutoFrame(callback, delay) {
    var id = setTimeout(callback, delay)
    autoFrameTimers.push(id)
  }

  function stopAutoRig() {
    clearTimeout(autoRig)
    clearAutoFrameTimers()
  }

  function scheduleAutoResume(fallbackX, fallbackY) {
    clearTimeout(autoResumeTimer)
    autoResumeTimer = setTimeout(function() {
      scheduleAutoRigFromPointer(fallbackX, fallbackY)
    }, pointerIdleDelay)
  }

  function scheduleAutoRig() {
    clearAutoFrameTimers()
    var currentInterval = pickRandomInterval()
    var intervals = buildIntervals(currentInterval)
    var lastRandomX = randomX
    var lastRandomY = randomY
    randomX = Math.random() * document.body.clientWidth / 3 + document.body.clientWidth / 3
    randomY = Math.random() * document.body.clientHeight

    function wait(sec) {
        let start = Date.now(), now = start;
        while (now - start < sec) {
            now = Date.now();
        }
    }
    for (let i of intervals) {

      scheduleAutoFrame(() => {
        
      var X = lastRandomX + (randomX - lastRandomX) * i / currentInterval
      var Y = lastRandomY + (randomY - lastRandomY) * i / currentInterval
      
      var backStyle = `top: ${(5 - (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      applyRigStyles('back', { img: backStyle })

      var bangDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
      var bangDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
      var bangImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      var bangImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

      var eyesDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var eyesDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var eyesImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
      var eyesImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
      applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

      var mouthDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var mouthDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var mouthImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      var mouthImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

      var faceDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var faceDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var faceImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      var faceImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

      setCharacterTransform((X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)
      }, i*12/20);
    }
    autoRig = setTimeout(scheduleAutoRig, currentInterval)
  }

  scheduleAutoRig()
  
audio()

let lastX = 0
let lastY = 0
var stiffness = 0.07; // 강도 (값을수록 빠름)
var damping = 0.8;   // 감쇠 (값을수록 더 많이 출렁임)
let X = lastX
let Y = lastY
let velocity = 0

function scheduleAutoRigFromPointer(fallbackX, fallbackY) {
  clearAutoFrameTimers()
  var currentInterval = pickRandomInterval()
  var intervals = buildIntervals(currentInterval)
  var lastRandomX = randomX ? randomX : fallbackX
  var lastRandomY = randomY ? randomY : fallbackY
  randomX = Math.random() * document.body.clientWidth
  randomY = Math.random() * document.body.clientHeight

  let X = lastRandomX
  let Y = lastRandomY
  let velocity = (randomX - X) * stiffness * damping;
  let velocityY = (randomY - Y) * stiffness * damping;
  for (let i of intervals) {

    scheduleAutoFrame(() => {
        
    // var t = i / currentInterval;
    // var elasticT = Math.sin(-13 * (Math.PI / 2) * (t + 1)) * Math.pow(2, -10 * t) + 1;    
    //var X = lastRandomX + (randomX - lastRandomX) * elasticT;
    //var Y = lastRandomY + (randomY - lastRandomY) * elasticT;
    velocity = (velocity + (randomX - X) * stiffness) * damping;
    velocityY = (randomY - Y) * stiffness * damping;
    X += velocity;
    Y += velocityY;
    // Squash/stretch based on horizontal velocity.
    var squashStretch = Math.abs(velocity) * 0.0005;
    var currentScaleY = 1 + 0.5 * squashStretch;
    var currentScaleNegY = 1 - 0.5 * squashStretch;
    var currentScaleX = 1 - squashStretch;
    var currentScaleNegX = 1 + squashStretch;
    
    var backStyle = `height: ${100 * currentScaleY}dvh; left: min(${50 - 50 * currentScaleX}vw, ${50 - 50 * currentScaleX}dvh); width: min(${100 * currentScaleX}vw, ${100 * currentScaleX}dvh); top: ${(5 - (Y / document.body.clientHeight) * 10) * rig / 100}px;`
    applyRigStyles('back', { img: backStyle })

    var bangDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
    var bangDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
    var bangImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    var bangImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

    var eyesDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
    var eyesDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
    var eyesImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
    var eyesImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
    applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

    var mouthDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
    var mouthDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
    var mouthImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    var mouthImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

    var faceDivLStyle = `width: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
    var faceDivRStyle = `width: min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
    var faceImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegX}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
    var faceImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleX}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleX}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
    applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

    setCharacterTransform((X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)
    }, i*12/20);
  }
  autoRig = setTimeout(() => {
    scheduleAutoRigFromPointer(fallbackX, fallbackY)
  }, currentInterval)
}

document.addEventListener('mousemove',function(e){
    stopAutoRig()

    X = e.clientX
    Y = e.clientY
    velocity = (lastX - X) * stiffness * damping;

    var squashStretchM = Math.abs(velocity) * 0.0005; // 0.1 강도 조절값
    var currentScaleYM = 1 + 2 * squashStretchM; // 위아래로 늘어짐
    var currentScaleNegYM = 1 - 2 * squashStretchM; // 위아래로 줄어듦
    var currentScaleXM = 1 - 4 * squashStretchM; // 좌우로 줄어듦(부피 보존)
    var currentScaleNegXM = 1 + 4 * squashStretchM; // 좌우로 늘어남(부피 보존)

      var backStyle = `height: ${100 * currentScaleYM}dvh; left: min(${50 - 50 * currentScaleXM}vw, ${50 - 50 * currentScaleXM}dvh); width: min(${100 * currentScaleXM}vw, ${100 * currentScaleXM}dvh); top: ${(5 - (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      applyRigStyles('back', { img: backStyle })

      var bangDivLStyle = `width: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
      var bangDivRStyle = `width: min(${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
      var bangImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      var bangImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

      var eyesDivLStyle = `width: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var eyesDivRStyle = `width: min(${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var eyesImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
      var eyesImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
      applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

      var mouthDivLStyle = `width: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var mouthDivRStyle = `width: min(${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var mouthImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${100 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (e.clientY / document.body.clientHeight) * 20) * rig / 100}px;`
      var mouthImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${100 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (e.clientY / document.body.clientHeight) * 20) * rig / 100}px;`
      applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

      var faceDivLStyle = `width: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var faceDivRStyle = `width: min(${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (e.clientX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
      var faceImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegXM}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegXM}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      var faceImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleXM}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleXM}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

    setCharacterTransform((e.clientX - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)


    lastX = e.clientX
    lastY = e.clientY

    randomX = 0
    randomY = 0

    scheduleAutoResume(e.clientX, e.clientY)

})
