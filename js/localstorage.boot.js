const layerSlots = loadLayerSlots()
renderAllSlots()

const LIVE_SLOT_SETTINGS_KEY = 'ftLiveSlotSettings'
const LIVE_SLOT_KEY = 'ftLiveSlot'
const LIVE_SLOT_DEFAULTS = {
  rig: 100,
  scale: 100,
  offsetX: 0,
  offsetY: 0,
  intervalMin: 1500,
  intervalMax: 1500,
  autoMotion: true,
  faceXMin: 0,
  faceXMax: 100,
  faceYMin: 0,
  faceYMax: 100,
  bodyRotateMin: 0,
  bodyRotateMax: 100,
  color: '#00ff00',
  outlineEnabled: false,
  outlineColor: '#000000',
  outlineWidth: 3
}
const SLOT_INTERVAL_LIMIT_MIN = 200
const SLOT_INTERVAL_LIMIT_MAX = 3000
const SLOT_OUTLINE_WIDTH_MIN = 0
const SLOT_OUTLINE_WIDTH_MAX = 20

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

function normalizeBooleanValue(value, fallback) {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    if (value === 'true') {
      return true
    }
    if (value === 'false') {
      return false
    }
  }
  return Boolean(fallback)
}

function normalizeOutlineWidthValue(value, fallback) {
  const base = parseFiniteInt(fallback, LIVE_SLOT_DEFAULTS.outlineWidth)
  return clampValue(parseFiniteInt(value, base), SLOT_OUTLINE_WIDTH_MIN, SLOT_OUTLINE_WIDTH_MAX, base)
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
  const baseOutlineEnabled = normalizeBooleanValue(base.outlineEnabled, LIVE_SLOT_DEFAULTS.outlineEnabled)
  const fallbackOutlineColor = normalizeColorValue(base.outlineColor, LIVE_SLOT_DEFAULTS.outlineColor)
  const baseOutlineWidth = normalizeOutlineWidthValue(base.outlineWidth, LIVE_SLOT_DEFAULTS.outlineWidth)
  return {
    rig: clampValue(parseFiniteInt(source.rig, base.rig), 0, 200, base.rig),
    scale: clampValue(parseFiniteInt(source.scale, base.scale), 30, 300, base.scale),
    offsetX: clampValue(parseFiniteInt(source.offsetX, base.offsetX), -500, 500, base.offsetX),
    offsetY: clampValue(parseFiniteInt(source.offsetY, base.offsetY), -500, 500, base.offsetY),
    intervalMin: nextIntervalMin,
    intervalMax: nextIntervalMax,
    autoMotion: normalizeBooleanValue(source.autoMotion, base.autoMotion),
    faceXMin: nextFaceXMin,
    faceXMax: nextFaceXMax,
    faceYMin: nextFaceYMin,
    faceYMax: nextFaceYMax,
    bodyRotateMin: nextBodyRotateMin,
    bodyRotateMax: nextBodyRotateMax,
    color: normalizeColorValue(source.color, fallbackColor),
    outlineEnabled: normalizeBooleanValue(source.outlineEnabled, baseOutlineEnabled),
    outlineColor: normalizeColorValue(source.outlineColor, fallbackOutlineColor),
    outlineWidth: normalizeOutlineWidthValue(source.outlineWidth, baseOutlineWidth)
  }
}

function cloneLiveSlotSettings(entry) {
  return {
    rig: entry.rig,
    scale: entry.scale,
    offsetX: entry.offsetX,
    offsetY: entry.offsetY,
    intervalMin: entry.intervalMin,
    intervalMax: entry.intervalMax,
    autoMotion: entry.autoMotion,
    faceXMin: entry.faceXMin,
    faceXMax: entry.faceXMax,
    faceYMin: entry.faceYMin,
    faceYMax: entry.faceYMax,
    bodyRotateMin: entry.bodyRotateMin,
    bodyRotateMax: entry.bodyRotateMax,
    color: entry.color,
    outlineEnabled: entry.outlineEnabled,
    outlineColor: entry.outlineColor,
    outlineWidth: entry.outlineWidth
  }
}

function buildLegacyLiveSettings() {
  const legacyRig = parseFiniteInt(localStorage.getItem('ftRig'), LIVE_SLOT_DEFAULTS.rig)
  const legacyScale = parseFiniteInt(localStorage.getItem('ftScale'), LIVE_SLOT_DEFAULTS.scale)
  const legacyOffsetX = parseFiniteInt(localStorage.getItem('ftOffsetX'), LIVE_SLOT_DEFAULTS.offsetX)
  const legacyOffsetY = parseFiniteInt(localStorage.getItem('ftOffsetY'), LIVE_SLOT_DEFAULTS.offsetY)
  const legacyColor = localStorage.getItem('ftColor')
  const legacyAutoMotion = normalizeBooleanValue(localStorage.getItem('ftAutoMotion'), LIVE_SLOT_DEFAULTS.autoMotion)
  const legacyOutlineEnabled = normalizeBooleanValue(localStorage.getItem('ftOutlineEnabled'), LIVE_SLOT_DEFAULTS.outlineEnabled)
  const legacyOutlineColor = localStorage.getItem('ftOutlineColor')
  const legacyOutlineWidth = parseFiniteInt(localStorage.getItem('ftOutlineWidth'), LIVE_SLOT_DEFAULTS.outlineWidth)

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
    scale: legacyScale,
    offsetX: legacyOffsetX,
    offsetY: legacyOffsetY,
    intervalMin: legacyIntervalMin,
    intervalMax: legacyIntervalMax,
    autoMotion: legacyAutoMotion,
    color: legacyColor,
    outlineEnabled: legacyOutlineEnabled,
    outlineColor: legacyOutlineColor,
    outlineWidth: legacyOutlineWidth
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

const presetExportButton = document.querySelector('#preset-export')
const presetImportButton = document.querySelector('#preset-import')
const presetImportInput = document.querySelector('#preset-import-file')

let currentSlotId = '1'

function getCurrentSlotIndex() {
  return slotIndexFromId(currentSlotId)
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
  localStorage.setItem(LIVE_SLOT_KEY, String(getCurrentSlotIndex()))
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


