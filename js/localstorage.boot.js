const layerSlots = loadLayerSlots()
renderAllSlots()

const LIVE_SLOT_SETTINGS_KEY = 'ftLiveSlotSettings'
const LIVE_SLOT_KEY = 'ftLiveSlot'
const LIVE_SLOT_DEFAULTS = {
  rig: 100,
  offsetX: 0,
  offsetY: 0,
  intervalMin: 1500,
  intervalMax: 1500,
  faceXMin: 0,
  faceXMax: 100,
  faceYMin: 0,
  faceYMax: 100,
  bodyRotateMin: 0,
  bodyRotateMax: 100,
  color: '#00ff00'
}
const SLOT_INTERVAL_LIMIT_MIN = 200
const SLOT_INTERVAL_LIMIT_MAX = 3000

function parseFiniteInt(value, fallback) {
  const parsed = Number.isFinite(value) ? value : parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clampValue(value, minValue, maxValue, fallback) {
  const nextValue = Number.isFinite(value) ? value : fallback
  const safeValue = Number.isFinite(nextValue) ? nextValue : fallback
  return Math.min(maxValue, Math.max(minValue, Math.round(safeValue)))
}

function normalizeColorValue(value, fallback) {
  const source = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!/^#[0-9a-f]{6}$/.test(source)) {
    return fallback
  }
  return source
}

function normalizeSlotIndex(value, fallback) {
  if (!Number.isFinite(value)) {
    return fallback
  }
  return ((Math.round(value) % SLOT_COUNT) + SLOT_COUNT) % SLOT_COUNT
}

function normalizeLiveSlotSettingsEntry(entry, fallback) {
  const source = entry && typeof entry === 'object' ? entry : {}
  const base = fallback && typeof fallback === 'object' ? fallback : LIVE_SLOT_DEFAULTS
  let nextIntervalMin = clampValue(parseFiniteInt(source.intervalMin, base.intervalMin), SLOT_INTERVAL_LIMIT_MIN, SLOT_INTERVAL_LIMIT_MAX, base.intervalMin)
  let nextIntervalMax = clampValue(parseFiniteInt(source.intervalMax, base.intervalMax), SLOT_INTERVAL_LIMIT_MIN, SLOT_INTERVAL_LIMIT_MAX, base.intervalMax)
  let nextFaceXMin = clampValue(parseFiniteInt(source.faceXMin, base.faceXMin), 0, 100, base.faceXMin)
  let nextFaceXMax = clampValue(parseFiniteInt(source.faceXMax, base.faceXMax), 0, 100, base.faceXMax)
  let nextFaceYMin = clampValue(parseFiniteInt(source.faceYMin, base.faceYMin), 0, 100, base.faceYMin)
  let nextFaceYMax = clampValue(parseFiniteInt(source.faceYMax, base.faceYMax), 0, 100, base.faceYMax)
  let nextBodyRotateMin = clampValue(parseFiniteInt(source.bodyRotateMin, base.bodyRotateMin), 0, 100, base.bodyRotateMin)
  let nextBodyRotateMax = clampValue(parseFiniteInt(source.bodyRotateMax, base.bodyRotateMax), 0, 100, base.bodyRotateMax)
  if (nextIntervalMin > nextIntervalMax) {
    const temp = nextIntervalMin
    nextIntervalMin = nextIntervalMax
    nextIntervalMax = temp
  }
  if (nextFaceXMin > nextFaceXMax) {
    const temp = nextFaceXMin
    nextFaceXMin = nextFaceXMax
    nextFaceXMax = temp
  }
  if (nextFaceYMin > nextFaceYMax) {
    const temp = nextFaceYMin
    nextFaceYMin = nextFaceYMax
    nextFaceYMax = temp
  }
  if (nextBodyRotateMin > nextBodyRotateMax) {
    const temp = nextBodyRotateMin
    nextBodyRotateMin = nextBodyRotateMax
    nextBodyRotateMax = temp
  }
  const fallbackColor = normalizeColorValue(base.color, LIVE_SLOT_DEFAULTS.color)
  return {
    rig: clampValue(parseFiniteInt(source.rig, base.rig), 0, 200, base.rig),
    offsetX: clampValue(parseFiniteInt(source.offsetX, base.offsetX), -500, 500, base.offsetX),
    offsetY: clampValue(parseFiniteInt(source.offsetY, base.offsetY), -500, 500, base.offsetY),
    intervalMin: nextIntervalMin,
    intervalMax: nextIntervalMax,
    faceXMin: nextFaceXMin,
    faceXMax: nextFaceXMax,
    faceYMin: nextFaceYMin,
    faceYMax: nextFaceYMax,
    bodyRotateMin: nextBodyRotateMin,
    bodyRotateMax: nextBodyRotateMax,
    color: normalizeColorValue(source.color, fallbackColor)
  }
}

function cloneLiveSlotSettings(entry) {
  return {
    rig: entry.rig,
    offsetX: entry.offsetX,
    offsetY: entry.offsetY,
    intervalMin: entry.intervalMin,
    intervalMax: entry.intervalMax,
    faceXMin: entry.faceXMin,
    faceXMax: entry.faceXMax,
    faceYMin: entry.faceYMin,
    faceYMax: entry.faceYMax,
    bodyRotateMin: entry.bodyRotateMin,
    bodyRotateMax: entry.bodyRotateMax,
    color: entry.color
  }
}

function buildLegacyLiveSettings() {
  const legacyRig = parseFiniteInt(localStorage.getItem('ftRig'), LIVE_SLOT_DEFAULTS.rig)
  const legacyOffsetX = parseFiniteInt(localStorage.getItem('ftOffsetX'), LIVE_SLOT_DEFAULTS.offsetX)
  const legacyOffsetY = parseFiniteInt(localStorage.getItem('ftOffsetY'), LIVE_SLOT_DEFAULTS.offsetY)
  const legacyColor = localStorage.getItem('ftColor')

  let legacyIntervalMin = parseFiniteInt(localStorage.getItem('ftIntervalMin'), NaN)
  let legacyIntervalMax = parseFiniteInt(localStorage.getItem('ftIntervalMax'), NaN)
  const legacyInterval = parseFiniteInt(localStorage.getItem('ftInterval'), LIVE_SLOT_DEFAULTS.intervalMin)
  if (!Number.isFinite(legacyIntervalMin)) {
    legacyIntervalMin = legacyInterval
  }
  if (!Number.isFinite(legacyIntervalMax)) {
    legacyIntervalMax = legacyIntervalMin
  }

  return normalizeLiveSlotSettingsEntry({
    rig: legacyRig,
    offsetX: legacyOffsetX,
    offsetY: legacyOffsetY,
    intervalMin: legacyIntervalMin,
    intervalMax: legacyIntervalMax,
    color: legacyColor
  }, LIVE_SLOT_DEFAULTS)
}

function loadLiveSlotSettings() {
  const fallback = buildLegacyLiveSettings()
  const stored = localStorage.getItem(LIVE_SLOT_SETTINGS_KEY)
  let parsed = null
  if (stored && stored[0] === '[') {
    try {
      parsed = JSON.parse(stored)
    } catch (error) {
      parsed = null
    }
  }
  const slots = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const entry = Array.isArray(parsed) ? parsed[i] : null
    slots[i] = normalizeLiveSlotSettingsEntry(entry, fallback)
  }
  localStorage.setItem(LIVE_SLOT_SETTINGS_KEY, JSON.stringify(slots))
  return slots
}

function saveLiveSlotSettings() {
  localStorage.setItem(LIVE_SLOT_SETTINGS_KEY, JSON.stringify(liveSlotSettings))
}

function getLiveSlotSettings(slotIndex) {
  const safeIndex = normalizeSlotIndex(slotIndex, 0)
  const entry = liveSlotSettings[safeIndex]
  return normalizeLiveSlotSettingsEntry(entry, buildLegacyLiveSettings())
}

function setLiveSlotSettings(slotIndex, patch) {
  const safeIndex = normalizeSlotIndex(slotIndex, 0)
  const current = getLiveSlotSettings(safeIndex)
  const merged = Object.assign({}, current, patch || {})
  liveSlotSettings[safeIndex] = normalizeLiveSlotSettingsEntry(merged, current)
  saveLiveSlotSettings()
}

let liveSlotSettings = loadLiveSlotSettings()

function saveLayerSlotsOrAlert() {
  const canSave = typeof trySaveLayerSlots === 'function' ? trySaveLayerSlots(layerSlots) : true
  if (!canSave) {
    alert('이미지 용량이 커서 브라우저 저장 공간을 초과했습니다. 이미지 용량을 줄이거나 파일 수를 줄인 뒤 다시 시도해주세요.')
  }
  return canSave
}

function buildLayersPayload(slotLayers) {
  return slotLayers.map(function(layer) {
    const normalized = normalizeLayer(layer)
    return {
      src: normalized.src,
      display: normalized.display,
      rig: normalized.rig,
      role: normalized.role,
      rotate: normalized.rotate,
      rotatePivotY: normalized.rotatePivotY,
      altSrc: normalized.altSrc,
      altDisplay: normalized.altDisplay
    }
  })
}

function buildPresetPayload(slotIndex) {
  const slotLayers = Array.isArray(layerSlots[slotIndex]) ? layerSlots[slotIndex] : []
  return {
    app: 'feather-talk',
    kind: 'slot-preset',
    version: 2,
    slotId: slotId(slotIndex),
    createdAt: new Date().toISOString(),
    layers: buildLayersPayload(slotLayers),
    liveSettings: getLiveSlotSettings(slotIndex)
  }
}

function normalizeImportedLayers(layers) {
  const normalized = []
  layers.forEach(function(layer) {
    if (!layer || typeof layer !== 'object') {
      return
    }
    const cleaned = Object.assign({}, layer)
    delete cleaned.id
    normalized.push(normalizeLayer(cleaned))
  })
  if (!normalized.length) {
    normalized.push(normalizeLayer({ rig: 'face', role: 'none' }))
  }
  return normalized
}

function parsePresetText(text) {
  const parsed = JSON.parse(text)
  if (Array.isArray(parsed)) {
    return { layers: parsed }
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.layers)) {
    return parsed
  }
  return null
}

function downloadPayload(payload, fileName) {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(function() {
    URL.revokeObjectURL(url)
  }, 1000)
}

const slotSettingsLabel = document.querySelector('#slot-settings-label')
const slotRigInput = document.querySelector('#slot-rig')
const slotRigValueInput = document.querySelector('#slot-rig-value')
const slotOffsetXInput = document.querySelector('#slot-offset-x')
const slotOffsetXValueInput = document.querySelector('#slot-offset-x-value')
const slotOffsetYInput = document.querySelector('#slot-offset-y')
const slotOffsetYValueInput = document.querySelector('#slot-offset-y-value')
const slotIntervalMinInput = document.querySelector('#slot-interval-min')
const slotIntervalMaxInput = document.querySelector('#slot-interval-max')
const slotIntervalMinValueInput = document.querySelector('#slot-interval-min-value')
const slotIntervalMaxValueInput = document.querySelector('#slot-interval-max-value')
const slotIntervalRangeFill = document.querySelector('#slot-interval-range-fill')
const slotFaceXMinInput = document.querySelector('#slot-face-x-min')
const slotFaceXMaxInput = document.querySelector('#slot-face-x-max')
const slotFaceXMinValueInput = document.querySelector('#slot-face-x-min-value')
const slotFaceXMaxValueInput = document.querySelector('#slot-face-x-max-value')
const slotFaceXRangeFill = document.querySelector('#slot-face-x-range-fill')
const slotFaceYMinInput = document.querySelector('#slot-face-y-min')
const slotFaceYMaxInput = document.querySelector('#slot-face-y-max')
const slotFaceYMinValueInput = document.querySelector('#slot-face-y-min-value')
const slotFaceYMaxValueInput = document.querySelector('#slot-face-y-max-value')
const slotFaceYRangeFill = document.querySelector('#slot-face-y-range-fill')
const slotBodyRotateMinInput = document.querySelector('#slot-body-rotate-min')
const slotBodyRotateMaxInput = document.querySelector('#slot-body-rotate-max')
const slotBodyRotateMinValueInput = document.querySelector('#slot-body-rotate-min-value')
const slotBodyRotateMaxValueInput = document.querySelector('#slot-body-rotate-max-value')
const slotBodyRotateRangeFill = document.querySelector('#slot-body-rotate-range-fill')
const slotColorInput = document.querySelector('#slot-color')

const presetExportButton = document.querySelector('#preset-export')
const presetImportButton = document.querySelector('#preset-import')
const presetImportInput = document.querySelector('#preset-import-file')

let currentSlotId = '1'
let activeSlotIntervalHandle = 'max'
let activeSlotFaceXHandle = 'max'
let activeSlotFaceYHandle = 'max'
let activeSlotBodyRotateHandle = 'max'

function getCurrentSlotIndex() {
  return slotIndexFromId(currentSlotId)
}

function formatIntervalMs(value) {
  return (value / 1000).toFixed(1)
}

function updateSlotIntervalHandleZ(slotSettings) {
  if (!slotIntervalMinInput || !slotIntervalMaxInput) {
    return
  }
  const settings = slotSettings && typeof slotSettings === 'object'
    ? slotSettings
    : getLiveSlotSettings(getCurrentSlotIndex())
  const intervalMin = settings.intervalMin
  const intervalMax = settings.intervalMax
  if (intervalMin === intervalMax) {
    if (intervalMin <= SLOT_INTERVAL_LIMIT_MIN) {
      slotIntervalMinInput.style.zIndex = '3'
      slotIntervalMaxInput.style.zIndex = '4'
    } else if (intervalMax >= SLOT_INTERVAL_LIMIT_MAX) {
      slotIntervalMinInput.style.zIndex = '4'
      slotIntervalMaxInput.style.zIndex = '3'
    } else if (activeSlotIntervalHandle === 'min') {
      slotIntervalMinInput.style.zIndex = '4'
      slotIntervalMaxInput.style.zIndex = '3'
    } else {
      slotIntervalMinInput.style.zIndex = '3'
      slotIntervalMaxInput.style.zIndex = '4'
    }
  } else {
    slotIntervalMinInput.style.zIndex = '3'
    slotIntervalMaxInput.style.zIndex = '4'
  }
}

function setSlotIntervalHandleActive(handle) {
  activeSlotIntervalHandle = handle
  updateSlotIntervalHandleZ()
}

function updateSlotIntervalRangeFill(slotSettings) {
  if (!slotIntervalRangeFill) {
    return
  }
  const settings = slotSettings && typeof slotSettings === 'object'
    ? slotSettings
    : getLiveSlotSettings(getCurrentSlotIndex())
  const rangeSpan = SLOT_INTERVAL_LIMIT_MAX - SLOT_INTERVAL_LIMIT_MIN
  const minPercent = ((settings.intervalMin - SLOT_INTERVAL_LIMIT_MIN) / rangeSpan) * 100
  const maxPercent = ((settings.intervalMax - SLOT_INTERVAL_LIMIT_MIN) / rangeSpan) * 100
  slotIntervalRangeFill.style.left = `${minPercent}%`
  slotIntervalRangeFill.style.width = `${maxPercent - minPercent}%`
}

function updateDualRangeHandleZ(minInput, maxInput, minValue, maxValue, activeHandle, limitMin, limitMax) {
  if (!minInput || !maxInput) {
    return
  }
  if (minValue === maxValue) {
    if (minValue <= limitMin) {
      minInput.style.zIndex = '3'
      maxInput.style.zIndex = '4'
    } else if (maxValue >= limitMax) {
      minInput.style.zIndex = '4'
      maxInput.style.zIndex = '3'
    } else if (activeHandle === 'min') {
      minInput.style.zIndex = '4'
      maxInput.style.zIndex = '3'
    } else {
      minInput.style.zIndex = '3'
      maxInput.style.zIndex = '4'
    }
  } else {
    minInput.style.zIndex = '3'
    maxInput.style.zIndex = '4'
  }
}

function updateDualRangeFill(fillElement, minValue, maxValue, limitMin, limitMax) {
  if (!fillElement) {
    return
  }
  const span = limitMax - limitMin
  if (!span) {
    fillElement.style.left = '0%'
    fillElement.style.width = '0%'
    return
  }
  const minPercent = ((minValue - limitMin) / span) * 100
  const maxPercent = ((maxValue - limitMin) / span) * 100
  fillElement.style.left = `${minPercent}%`
  fillElement.style.width = `${maxPercent - minPercent}%`
}

function getSlotMotionRangePair(settings, rangeKey) {
  if (rangeKey === 'faceX') {
    return { min: settings.faceXMin, max: settings.faceXMax }
  }
  if (rangeKey === 'faceY') {
    return { min: settings.faceYMin, max: settings.faceYMax }
  }
  return { min: settings.bodyRotateMin, max: settings.bodyRotateMax }
}

function getSlotFaceYUiRangePair(settings) {
  return {
    min: 100 - settings.faceYMax,
    max: 100 - settings.faceYMin
  }
}

function setSlotMotionRangeHandleActive(rangeKey, handle) {
  if (rangeKey === 'faceX') {
    activeSlotFaceXHandle = handle
  } else if (rangeKey === 'faceY') {
    activeSlotFaceYHandle = handle
  } else {
    activeSlotBodyRotateHandle = handle
  }
  updateSlotMotionRangeHandleZ(null, rangeKey)
}

function updateSlotMotionRangeHandleZ(slotSettings, rangeKey) {
  const settings = slotSettings && typeof slotSettings === 'object'
    ? slotSettings
    : getLiveSlotSettings(getCurrentSlotIndex())
  if (!rangeKey || rangeKey === 'faceX') {
    updateDualRangeHandleZ(slotFaceXMinInput, slotFaceXMaxInput, settings.faceXMin, settings.faceXMax, activeSlotFaceXHandle, 0, 100)
  }
  if (!rangeKey || rangeKey === 'faceY') {
    const faceYUiPair = getSlotFaceYUiRangePair(settings)
    updateDualRangeHandleZ(slotFaceYMinInput, slotFaceYMaxInput, faceYUiPair.min, faceYUiPair.max, activeSlotFaceYHandle, 0, 100)
  }
  if (!rangeKey || rangeKey === 'bodyRotate') {
    updateDualRangeHandleZ(slotBodyRotateMinInput, slotBodyRotateMaxInput, settings.bodyRotateMin, settings.bodyRotateMax, activeSlotBodyRotateHandle, 0, 100)
  }
}

function updateSlotMotionRangeFill(slotSettings, rangeKey) {
  const settings = slotSettings && typeof slotSettings === 'object'
    ? slotSettings
    : getLiveSlotSettings(getCurrentSlotIndex())
  if (!rangeKey || rangeKey === 'faceX') {
    updateDualRangeFill(slotFaceXRangeFill, settings.faceXMin, settings.faceXMax, 0, 100)
  }
  if (!rangeKey || rangeKey === 'faceY') {
    const faceYUiPair = getSlotFaceYUiRangePair(settings)
    updateDualRangeFill(slotFaceYRangeFill, faceYUiPair.min, faceYUiPair.max, 0, 100)
  }
  if (!rangeKey || rangeKey === 'bodyRotate') {
    updateDualRangeFill(slotBodyRotateRangeFill, settings.bodyRotateMin, settings.bodyRotateMax, 0, 100)
  }
}

function syncSlotSettingsUI(slotIndex) {
  const safeIndex = normalizeSlotIndex(slotIndex, 0)
  const settings = getLiveSlotSettings(safeIndex)
  if (slotSettingsLabel) {
    slotSettingsLabel.textContent = `${slotId(safeIndex)}번 슬롯`
  }
  if (slotRigInput) {
    slotRigInput.value = settings.rig
  }
  if (slotRigValueInput) {
    slotRigValueInput.value = String(settings.rig)
  }
  if (slotOffsetXInput) {
    slotOffsetXInput.value = settings.offsetX
  }
  if (slotOffsetXValueInput) {
    slotOffsetXValueInput.value = String(settings.offsetX)
  }
  if (slotOffsetYInput) {
    slotOffsetYInput.value = settings.offsetY
  }
  if (slotOffsetYValueInput) {
    slotOffsetYValueInput.value = String(settings.offsetY)
  }
  if (slotIntervalMinInput) {
    slotIntervalMinInput.value = String(settings.intervalMin)
  }
  if (slotIntervalMaxInput) {
    slotIntervalMaxInput.value = String(settings.intervalMax)
  }
  if (slotIntervalMinValueInput) {
    slotIntervalMinValueInput.value = formatIntervalMs(settings.intervalMin)
  }
  if (slotIntervalMaxValueInput) {
    slotIntervalMaxValueInput.value = formatIntervalMs(settings.intervalMax)
  }
  updateSlotIntervalRangeFill(settings)
  updateSlotIntervalHandleZ(settings)
  if (slotFaceXMinInput) {
    slotFaceXMinInput.value = String(settings.faceXMin)
  }
  if (slotFaceXMaxInput) {
    slotFaceXMaxInput.value = String(settings.faceXMax)
  }
  if (slotFaceXMinValueInput) {
    slotFaceXMinValueInput.value = String(settings.faceXMin)
  }
  if (slotFaceXMaxValueInput) {
    slotFaceXMaxValueInput.value = String(settings.faceXMax)
  }
  const faceYUiPair = getSlotFaceYUiRangePair(settings)
  if (slotFaceYMinInput) {
    slotFaceYMinInput.value = String(faceYUiPair.min)
  }
  if (slotFaceYMaxInput) {
    slotFaceYMaxInput.value = String(faceYUiPair.max)
  }
  if (slotFaceYMinValueInput) {
    slotFaceYMinValueInput.value = String(faceYUiPair.min)
  }
  if (slotFaceYMaxValueInput) {
    slotFaceYMaxValueInput.value = String(faceYUiPair.max)
  }
  if (slotBodyRotateMinInput) {
    slotBodyRotateMinInput.value = String(settings.bodyRotateMin)
  }
  if (slotBodyRotateMaxInput) {
    slotBodyRotateMaxInput.value = String(settings.bodyRotateMax)
  }
  if (slotBodyRotateMinValueInput) {
    slotBodyRotateMinValueInput.value = String(settings.bodyRotateMin)
  }
  if (slotBodyRotateMaxValueInput) {
    slotBodyRotateMaxValueInput.value = String(settings.bodyRotateMax)
  }
  updateSlotMotionRangeFill(settings)
  updateSlotMotionRangeHandleZ(settings)
  if (slotColorInput) {
    slotColorInput.value = settings.color
  }
}

function syncCurrentSlotFromTab(tabId) {
  if (typeof tabId === 'string' && tabId.length) {
    currentSlotId = tabId
  } else {
    const selected = document.querySelector('#tablist .selected')
    if (selected && typeof selected.id === 'string' && selected.id.indexOf('tab') === 0) {
      currentSlotId = selected.id.slice(3)
    }
  }
  const currentSlotIndex = getCurrentSlotIndex()
  localStorage.setItem(LIVE_SLOT_KEY, String(currentSlotIndex))
  syncSlotSettingsUI(currentSlotIndex)
}

function activateSlotTabById(tabId) {
  const tab = document.querySelector(`#tab${tabId}`)
  const form = document.querySelector(`#form${tabId}`)
  if (!tab || !form) {
    return
  }
  const selected = document.querySelector('#tablist .selected')
  if (selected) {
    selected.classList.remove('selected')
  }
  const activated = document.querySelector('.form.activated')
  if (activated) {
    activated.classList.remove('activated')
  }
  tab.classList.add('selected')
  form.classList.add('activated')
  syncCurrentSlotFromTab(String(tabId))
}

function activateSlotTabByIndex(slotIndex) {
  const safeIndex = normalizeSlotIndex(slotIndex, 0)
  activateSlotTabById(slotId(safeIndex))
}

function commitSimpleSlotSetting(key, rawValue, minValue, maxValue) {
  const slotIndex = getCurrentSlotIndex()
  const current = getLiveSlotSettings(slotIndex)
  const fallback = current[key]
  const next = clampValue(parseFiniteInt(rawValue, fallback), minValue, maxValue, fallback)
  const patch = {}
  patch[key] = next
  setLiveSlotSettings(slotIndex, patch)
  syncSlotSettingsUI(slotIndex)
}

function commitIntervalSlotSetting(changedKey, rawValue) {
  const slotIndex = getCurrentSlotIndex()
  const current = getLiveSlotSettings(slotIndex)
  let nextMin = current.intervalMin
  let nextMax = current.intervalMax
  if (changedKey === 'min') {
    setSlotIntervalHandleActive('min')
    nextMin = clampValue(parseFiniteInt(rawValue, nextMin), SLOT_INTERVAL_LIMIT_MIN, SLOT_INTERVAL_LIMIT_MAX, nextMin)
  } else {
    setSlotIntervalHandleActive('max')
    nextMax = clampValue(parseFiniteInt(rawValue, nextMax), SLOT_INTERVAL_LIMIT_MIN, SLOT_INTERVAL_LIMIT_MAX, nextMax)
  }
  if (nextMin > nextMax) {
    if (changedKey === 'min') {
      nextMax = nextMin
    } else {
      nextMin = nextMax
    }
  }
  setLiveSlotSettings(slotIndex, {
    intervalMin: nextMin,
    intervalMax: nextMax
  })
  syncSlotSettingsUI(slotIndex)
}

function commitSlotMotionRangeSetting(rangeKey, changedKey, rawValue) {
  const slotIndex = getCurrentSlotIndex()
  const current = getLiveSlotSettings(slotIndex)
  const pair = rangeKey === 'faceY'
    ? getSlotFaceYUiRangePair(current)
    : getSlotMotionRangePair(current, rangeKey)
  let nextMin = pair.min
  let nextMax = pair.max

  if (changedKey === 'min') {
    setSlotMotionRangeHandleActive(rangeKey, 'min')
    nextMin = clampValue(parseFiniteInt(rawValue, nextMin), 0, 100, nextMin)
  } else {
    setSlotMotionRangeHandleActive(rangeKey, 'max')
    nextMax = clampValue(parseFiniteInt(rawValue, nextMax), 0, 100, nextMax)
  }

  if (nextMin > nextMax) {
    if (changedKey === 'min') {
      nextMax = nextMin
    } else {
      nextMin = nextMax
    }
  }

  const patch = {}
  if (rangeKey === 'faceX') {
    patch.faceXMin = nextMin
    patch.faceXMax = nextMax
  } else if (rangeKey === 'faceY') {
    patch.faceYMin = 100 - nextMax
    patch.faceYMax = 100 - nextMin
  } else {
    patch.bodyRotateMin = nextMin
    patch.bodyRotateMax = nextMax
  }
  setLiveSlotSettings(slotIndex, patch)
  syncSlotSettingsUI(slotIndex)
}

function commitIntervalSlotSettingFromValue(changedKey, valueInput) {
  const slotIndex = getCurrentSlotIndex()
  if (!valueInput) {
    return
  }
  const raw = valueInput.value.trim()
  if (!raw) {
    syncSlotSettingsUI(slotIndex)
    return
  }
  const parsed = parseFloat(raw)
  if (!Number.isFinite(parsed)) {
    syncSlotSettingsUI(slotIndex)
    return
  }
  const nextMs = Math.round(parsed * 1000)
  commitIntervalSlotSetting(changedKey, nextMs)
}

function commitSlotMotionRangeSettingFromValue(rangeKey, changedKey, valueInput) {
  const slotIndex = getCurrentSlotIndex()
  if (!valueInput) {
    return
  }
  const raw = valueInput.value.trim()
  if (!raw) {
    syncSlotSettingsUI(slotIndex)
    return
  }
  const parsed = parseInt(raw, 10)
  if (!Number.isFinite(parsed)) {
    syncSlotSettingsUI(slotIndex)
    return
  }
  commitSlotMotionRangeSetting(rangeKey, changedKey, parsed)
}

function bindIntervalHandleEvents(input, handle) {
  if (!input) {
    return
  }
  input.addEventListener('pointerdown', function() {
    setSlotIntervalHandleActive(handle)
  })
  input.addEventListener('mousedown', function() {
    setSlotIntervalHandleActive(handle)
  })
  input.addEventListener('touchstart', function() {
    setSlotIntervalHandleActive(handle)
  }, { passive: true })
  input.addEventListener('focus', function() {
    setSlotIntervalHandleActive(handle)
  })
}

function bindDualRangeHandleEvents(input, callback) {
  if (!input || typeof callback !== 'function') {
    return
  }
  input.addEventListener('pointerdown', callback)
  input.addEventListener('mousedown', callback)
  input.addEventListener('touchstart', callback, { passive: true })
  input.addEventListener('focus', callback)
}

function bindRangeWithValueInput(rangeInput, valueInput, key, minValue, maxValue) {
  if (!rangeInput || !valueInput) {
    return
  }
  rangeInput.addEventListener('input', function(e) {
    commitSimpleSlotSetting(key, e.target.value, minValue, maxValue)
  })
  function commitFromText() {
    commitSimpleSlotSetting(key, valueInput.value, minValue, maxValue)
  }
  valueInput.addEventListener('change', commitFromText)
  valueInput.addEventListener('blur', commitFromText)
  valueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitFromText()
      valueInput.blur()
    }
  })
}

document.querySelectorAll('.layer-add').forEach(function(button) {
  button.addEventListener('click', function() {
    const slotIndex = slotIndexFromId(button.dataset.slot)
    const newLayer = normalizeLayer({ rig: 'face', role: 'none' })
    layerSlots[slotIndex].unshift(newLayer)
    renderSlot(slotIndex)
  })
})

const storedActiveSlot = normalizeSlotIndex(parseFiniteInt(localStorage.getItem(LIVE_SLOT_KEY), 0), 0)
activateSlotTabByIndex(storedActiveSlot)

for (let i = 0; i < SLOT_COUNT; i++) {
  const tab = document.querySelector(`#tab${i}`)
  if (!tab) {
    continue
  }
  tab.addEventListener('click', function() {
    activateSlotTabById(i)
  })
}

bindRangeWithValueInput(slotRigInput, slotRigValueInput, 'rig', 0, 200)
bindRangeWithValueInput(slotOffsetXInput, slotOffsetXValueInput, 'offsetX', -500, 500)
bindRangeWithValueInput(slotOffsetYInput, slotOffsetYValueInput, 'offsetY', -500, 500)

if (slotIntervalMinInput) {
  bindIntervalHandleEvents(slotIntervalMinInput, 'min')
  slotIntervalMinInput.addEventListener('input', function(e) {
    commitIntervalSlotSetting('min', e.target.value)
  })
}

if (slotIntervalMaxInput) {
  bindIntervalHandleEvents(slotIntervalMaxInput, 'max')
  slotIntervalMaxInput.addEventListener('input', function(e) {
    commitIntervalSlotSetting('max', e.target.value)
  })
}

if (slotIntervalMinValueInput) {
  function commitIntervalMinFromValue() {
    commitIntervalSlotSettingFromValue('min', slotIntervalMinValueInput)
  }
  slotIntervalMinValueInput.addEventListener('change', commitIntervalMinFromValue)
  slotIntervalMinValueInput.addEventListener('blur', commitIntervalMinFromValue)
  slotIntervalMinValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitIntervalMinFromValue()
      slotIntervalMinValueInput.blur()
    }
  })
}

if (slotIntervalMaxValueInput) {
  function commitIntervalMaxFromValue() {
    commitIntervalSlotSettingFromValue('max', slotIntervalMaxValueInput)
  }
  slotIntervalMaxValueInput.addEventListener('change', commitIntervalMaxFromValue)
  slotIntervalMaxValueInput.addEventListener('blur', commitIntervalMaxFromValue)
  slotIntervalMaxValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitIntervalMaxFromValue()
      slotIntervalMaxValueInput.blur()
    }
  })
}

bindDualRangeHandleEvents(slotFaceXMinInput, function() {
  setSlotMotionRangeHandleActive('faceX', 'min')
})
bindDualRangeHandleEvents(slotFaceXMaxInput, function() {
  setSlotMotionRangeHandleActive('faceX', 'max')
})
bindDualRangeHandleEvents(slotFaceYMinInput, function() {
  setSlotMotionRangeHandleActive('faceY', 'min')
})
bindDualRangeHandleEvents(slotFaceYMaxInput, function() {
  setSlotMotionRangeHandleActive('faceY', 'max')
})
bindDualRangeHandleEvents(slotBodyRotateMinInput, function() {
  setSlotMotionRangeHandleActive('bodyRotate', 'min')
})
bindDualRangeHandleEvents(slotBodyRotateMaxInput, function() {
  setSlotMotionRangeHandleActive('bodyRotate', 'max')
})

if (slotFaceXMinInput) {
  slotFaceXMinInput.addEventListener('input', function(e) {
    commitSlotMotionRangeSetting('faceX', 'min', e.target.value)
  })
}

if (slotFaceXMaxInput) {
  slotFaceXMaxInput.addEventListener('input', function(e) {
    commitSlotMotionRangeSetting('faceX', 'max', e.target.value)
  })
}

if (slotFaceYMinInput) {
  slotFaceYMinInput.addEventListener('input', function(e) {
    commitSlotMotionRangeSetting('faceY', 'min', e.target.value)
  })
}

if (slotFaceYMaxInput) {
  slotFaceYMaxInput.addEventListener('input', function(e) {
    commitSlotMotionRangeSetting('faceY', 'max', e.target.value)
  })
}

if (slotBodyRotateMinInput) {
  slotBodyRotateMinInput.addEventListener('input', function(e) {
    commitSlotMotionRangeSetting('bodyRotate', 'min', e.target.value)
  })
}

if (slotBodyRotateMaxInput) {
  slotBodyRotateMaxInput.addEventListener('input', function(e) {
    commitSlotMotionRangeSetting('bodyRotate', 'max', e.target.value)
  })
}

if (slotFaceXMinValueInput) {
  function commitFaceXMinFromValue() {
    commitSlotMotionRangeSettingFromValue('faceX', 'min', slotFaceXMinValueInput)
  }
  slotFaceXMinValueInput.addEventListener('change', commitFaceXMinFromValue)
  slotFaceXMinValueInput.addEventListener('blur', commitFaceXMinFromValue)
  slotFaceXMinValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitFaceXMinFromValue()
      slotFaceXMinValueInput.blur()
    }
  })
}

if (slotFaceXMaxValueInput) {
  function commitFaceXMaxFromValue() {
    commitSlotMotionRangeSettingFromValue('faceX', 'max', slotFaceXMaxValueInput)
  }
  slotFaceXMaxValueInput.addEventListener('change', commitFaceXMaxFromValue)
  slotFaceXMaxValueInput.addEventListener('blur', commitFaceXMaxFromValue)
  slotFaceXMaxValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitFaceXMaxFromValue()
      slotFaceXMaxValueInput.blur()
    }
  })
}

if (slotFaceYMinValueInput) {
  function commitFaceYMinFromValue() {
    commitSlotMotionRangeSettingFromValue('faceY', 'min', slotFaceYMinValueInput)
  }
  slotFaceYMinValueInput.addEventListener('change', commitFaceYMinFromValue)
  slotFaceYMinValueInput.addEventListener('blur', commitFaceYMinFromValue)
  slotFaceYMinValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitFaceYMinFromValue()
      slotFaceYMinValueInput.blur()
    }
  })
}

if (slotFaceYMaxValueInput) {
  function commitFaceYMaxFromValue() {
    commitSlotMotionRangeSettingFromValue('faceY', 'max', slotFaceYMaxValueInput)
  }
  slotFaceYMaxValueInput.addEventListener('change', commitFaceYMaxFromValue)
  slotFaceYMaxValueInput.addEventListener('blur', commitFaceYMaxFromValue)
  slotFaceYMaxValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitFaceYMaxFromValue()
      slotFaceYMaxValueInput.blur()
    }
  })
}

if (slotBodyRotateMinValueInput) {
  function commitBodyRotateMinFromValue() {
    commitSlotMotionRangeSettingFromValue('bodyRotate', 'min', slotBodyRotateMinValueInput)
  }
  slotBodyRotateMinValueInput.addEventListener('change', commitBodyRotateMinFromValue)
  slotBodyRotateMinValueInput.addEventListener('blur', commitBodyRotateMinFromValue)
  slotBodyRotateMinValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitBodyRotateMinFromValue()
      slotBodyRotateMinValueInput.blur()
    }
  })
}

if (slotBodyRotateMaxValueInput) {
  function commitBodyRotateMaxFromValue() {
    commitSlotMotionRangeSettingFromValue('bodyRotate', 'max', slotBodyRotateMaxValueInput)
  }
  slotBodyRotateMaxValueInput.addEventListener('change', commitBodyRotateMaxFromValue)
  slotBodyRotateMaxValueInput.addEventListener('blur', commitBodyRotateMaxFromValue)
  slotBodyRotateMaxValueInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      commitBodyRotateMaxFromValue()
      slotBodyRotateMaxValueInput.blur()
    }
  })
}

if (slotColorInput) {
  slotColorInput.addEventListener('change', function(e) {
    const slotIndex = getCurrentSlotIndex()
    const current = getLiveSlotSettings(slotIndex)
    const nextColor = normalizeColorValue(e.target.value, current.color)
    setLiveSlotSettings(slotIndex, { color: nextColor })
    syncSlotSettingsUI(slotIndex)
  })
}

if (presetExportButton) {
  presetExportButton.addEventListener('click', function() {
    const slotIndex = getCurrentSlotIndex()
    const payload = buildPresetPayload(slotIndex)
    const fileName = `feathertalk-preset-slot${slotId(slotIndex)}.json`
    downloadPayload(payload, fileName)
  })
}

if (presetImportButton && presetImportInput) {
  presetImportButton.addEventListener('click', function() {
    presetImportInput.click()
  })

  presetImportInput.addEventListener('change', function() {
    const file = presetImportInput.files && presetImportInput.files[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = function() {
      const text = reader.result
      if (typeof text !== 'string') {
        alert('프리셋 파일을 읽을 수 없습니다.')
        presetImportInput.value = ''
        return
      }
      let payload
      try {
        payload = parsePresetText(text)
      } catch (error) {
        payload = null
      }
      if (!payload || !Array.isArray(payload.layers)) {
        alert('지원하지 않는 프리셋 파일입니다.')
        presetImportInput.value = ''
        return
      }
      const slotIndex = getCurrentSlotIndex()
      const slotLabel = slotId(slotIndex)
      if (!confirm(`${slotLabel}번 슬롯을 덮어쓸까요?`)) {
        presetImportInput.value = ''
        return
      }
      layerSlots[slotIndex] = normalizeImportedLayers(payload.layers)
      if (payload.liveSettings && typeof payload.liveSettings === 'object') {
        setLiveSlotSettings(slotIndex, payload.liveSettings)
      }
      renderSlot(slotIndex)
      syncSlotSettingsUI(slotIndex)
      saveLayerSlotsOrAlert()
      alert(`${slotLabel}번 슬롯에 프리셋을 적용했어요.`)
      presetImportInput.value = ''
    }
    reader.readAsText(file)
  })
}

document.querySelector('#submit').addEventListener('click', function() {
  if (!saveLayerSlotsOrAlert()) {
    return
  }
  localStorage.setItem(LIVE_SLOT_KEY, String(getCurrentSlotIndex()))
  saveLiveSlotSettings()
  location.href = 'live.html'
})
