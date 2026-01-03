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

var cameraEnabled = false
if (localStorage.getItem('ftCameraEnabled')) {
  cameraEnabled = localStorage.getItem('ftCameraEnabled') === 'true'
}

var cameraPreviewMode = 'off'
var storedPreviewMode = localStorage.getItem('ftCameraPreviewMode')
if (storedPreviewMode) {
  cameraPreviewMode = storedPreviewMode
} else {
  var legacyPreviewEnabled = localStorage.getItem('ftCameraPreviewEnabled') === 'true'
  var legacyOverlayEnabled = localStorage.getItem('ftCameraOverlayEnabled') === 'true'
  if (legacyPreviewEnabled && legacyOverlayEnabled) {
    cameraPreviewMode = 'facemesh'
  } else if (legacyPreviewEnabled) {
    cameraPreviewMode = 'video'
  }
}
if (['off', 'video', 'facemesh'].indexOf(cameraPreviewMode) === -1) {
  cameraPreviewMode = 'off'
}

var cameraStrength = 100
if (localStorage.getItem('ftCameraStrength')) {
  cameraStrength = parseInt(localStorage.getItem('ftCameraStrength'), 10)
}
if (!Number.isFinite(cameraStrength)) {
  cameraStrength = 100
}

var cameraHeadOffsetX = 0
var storedHeadOffsetX = localStorage.getItem('ftCameraHeadOffsetX')
if (storedHeadOffsetX != null) {
  cameraHeadOffsetX = parseInt(storedHeadOffsetX, 10)
} else {
  var legacyHeadOffsetX = localStorage.getItem('ftCameraOffsetX')
  if (legacyHeadOffsetX != null) {
    cameraHeadOffsetX = parseInt(legacyHeadOffsetX, 10)
    if (Number.isFinite(cameraHeadOffsetX)) {
      localStorage.setItem('ftCameraHeadOffsetX', cameraHeadOffsetX)
    }
  }
}
if (!Number.isFinite(cameraHeadOffsetX)) {
  cameraHeadOffsetX = 0
}

var cameraHeadOffsetY = 0
var storedHeadOffsetY = localStorage.getItem('ftCameraHeadOffsetY')
if (storedHeadOffsetY != null) {
  cameraHeadOffsetY = parseInt(storedHeadOffsetY, 10)
} else {
  var legacyHeadOffsetY = localStorage.getItem('ftCameraOffsetY')
  if (legacyHeadOffsetY != null) {
    cameraHeadOffsetY = parseInt(legacyHeadOffsetY, 10)
    if (Number.isFinite(cameraHeadOffsetY)) {
      localStorage.setItem('ftCameraHeadOffsetY', cameraHeadOffsetY)
    }
  }
}
if (!Number.isFinite(cameraHeadOffsetY)) {
  cameraHeadOffsetY = 0
}

var cameraBodyRollOffsetX = 0
var storedBodyRollOffsetX = localStorage.getItem('ftCameraBodyRollOffsetX')
if (storedBodyRollOffsetX != null) {
  cameraBodyRollOffsetX = parseInt(storedBodyRollOffsetX, 10)
} else {
  var legacyBodyRollOffsetX = localStorage.getItem('ftCameraOffsetX')
  if (legacyBodyRollOffsetX != null) {
    cameraBodyRollOffsetX = parseInt(legacyBodyRollOffsetX, 10)
    if (Number.isFinite(cameraBodyRollOffsetX)) {
      localStorage.setItem('ftCameraBodyRollOffsetX', cameraBodyRollOffsetX)
    }
  }
}
if (!Number.isFinite(cameraBodyRollOffsetX)) {
  cameraBodyRollOffsetX = 0
}

var cameraBlinkEnabled = false
if (localStorage.getItem('ftCameraBlinkEnabled')) {
  cameraBlinkEnabled = localStorage.getItem('ftCameraBlinkEnabled') === 'true'
}

var cameraBlinkSensitivity = 100
if (localStorage.getItem('ftCameraBlinkSensitivity')) {
  cameraBlinkSensitivity = parseInt(localStorage.getItem('ftCameraBlinkSensitivity'), 10)
}
if (!Number.isFinite(cameraBlinkSensitivity)) {
  cameraBlinkSensitivity = 100
}

var cameraMouthEnabled = false
if (localStorage.getItem('ftCameraMouthEnabled')) {
  cameraMouthEnabled = localStorage.getItem('ftCameraMouthEnabled') === 'true'
}

var cameraMouthSensitivity = 100
if (localStorage.getItem('ftCameraMouthSensitivity')) {
  cameraMouthSensitivity = parseInt(localStorage.getItem('ftCameraMouthSensitivity'), 10)
}
if (!Number.isFinite(cameraMouthSensitivity)) {
  cameraMouthSensitivity = 100
}

var cameraSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
var cameraMode = 'motion'
var cameraStatusMessage = ''
var cameraBlinkActive = false
var cameraBlinkLastUpdate = 0
var cameraBlinkThreshold = 0.22
var cameraBlinkHysteresis = 0.04
var cameraBlinkStaleMs = 800
var cameraBlinkBaseline = 0
var cameraBlinkBaselineAlpha = 0.08
var cameraBlinkCloseRatio = 0.8
var cameraBlinkOpenRatio = 0.93
var cameraMouthActive = false
var cameraMouthLastUpdate = 0
var cameraMouthStaleMs = 800
var cameraMouthBaseline = 0
var cameraMouthBaselineAlpha = 0.08
var cameraMouthOpenRatio = 1.7
var cameraMouthCloseRatio = 1.4
var lastVolumeValue = 0
var cameraStream
var faceMeshReady

function updateCameraBlinkSettings() {
  if (!Number.isFinite(cameraBlinkSensitivity)) {
    cameraBlinkSensitivity = 100
  }
  var adjusted = 0.8 + (cameraBlinkSensitivity - 100) * 0.002
  cameraBlinkCloseRatio = Math.min(0.9, Math.max(0.7, adjusted))
  cameraBlinkOpenRatio = Math.min(0.98, cameraBlinkCloseRatio + 0.05)
}

updateCameraBlinkSettings()

function updateCameraMouthSettings() {
  if (!Number.isFinite(cameraMouthSensitivity)) {
    cameraMouthSensitivity = 100
  }
  var clamped = Math.min(140, Math.max(60, cameraMouthSensitivity))
  var adjusted = 3.1 - (clamped - 60) * 0.0125
  cameraMouthOpenRatio = Math.min(3.1, Math.max(1.2, adjusted))
  cameraMouthCloseRatio = Math.max(1.05, cameraMouthOpenRatio - 0.3)
}

updateCameraMouthSettings()

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
var settingsTabs = document.querySelectorAll('[data-settings-tab]')
var settingsGroups = document.querySelectorAll('[data-settings-group]')
var offsetXInput = document.querySelector('#offset-x')
var offsetYInput = document.querySelector('#offset-y')
var offsetXValue = document.querySelector('#offset-x-value')
var offsetYValue = document.querySelector('#offset-y-value')
var cameraToggle = document.querySelector('#camera-toggle')
var cameraRange = document.querySelector('#camera-range')
var cameraRangeValue = document.querySelector('#camera-range-value')
var cameraStatus = document.querySelector('#camera-status')
var cameraPreviewModeSelect = document.querySelector('#camera-preview-mode')
var cameraBlinkToggle = document.querySelector('#camera-blink-toggle')
var cameraBlinkSensitivityInput = document.querySelector('#camera-blink-sensitivity')
var cameraBlinkSensitivityValue = document.querySelector('#camera-blink-sensitivity-value')
var cameraMouthToggle = document.querySelector('#camera-mouth-toggle')
var cameraMouthSensitivityInput = document.querySelector('#camera-mouth-sensitivity')
var cameraMouthSensitivityValue = document.querySelector('#camera-mouth-sensitivity-value')
var cameraHeadOffsetXInput = document.querySelector('#camera-head-offset-x')
var cameraHeadOffsetYInput = document.querySelector('#camera-head-offset-y')
var cameraBodyRollOffsetXInput = document.querySelector('#camera-body-roll-offset-x')
var cameraHeadOffsetXValue = document.querySelector('#camera-head-offset-x-value')
var cameraHeadOffsetYValue = document.querySelector('#camera-head-offset-y-value')
var cameraBodyRollOffsetXValue = document.querySelector('#camera-body-roll-offset-x-value')
var cameraPreview = document.querySelector('#camera-preview')
var cameraPreviewVideo = document.querySelector('#camera-preview-video')
var cameraPreviewOverlay = document.querySelector('#camera-preview-overlay')
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

function updateToggleButton(button, enabled) {
  if (!button) {
    return
  }
  var onLabel = button.getAttribute('data-on-label') || '켜짐'
  var offLabel = button.getAttribute('data-off-label') || '꺼짐'
  button.setAttribute('aria-pressed', enabled ? 'true' : 'false')
  button.textContent = enabled ? onLabel : offLabel
}

function setCameraStatus(message) {
  cameraStatusMessage = message || ''
  if (cameraStatus) {
    cameraStatus.textContent = cameraStatusMessage
  }
}

function updateCameraPreviewVisibility() {
  if (!cameraPreview) {
    return
  }
  if (cameraEnabled && cameraStream && cameraPreviewMode !== 'off') {
    cameraPreview.removeAttribute('hidden')
  } else {
    cameraPreview.setAttribute('hidden', '')
  }
  updateCameraOverlayVisibility()
}

function clearCameraOverlay() {
  if (!cameraPreviewOverlay) {
    return
  }
  var ctx = cameraPreviewOverlay.getContext('2d')
  if (!ctx) {
    return
  }
  ctx.clearRect(0, 0, cameraPreviewOverlay.width, cameraPreviewOverlay.height)
}

function updateCameraOverlayVisibility() {
  if (!cameraPreviewOverlay) {
    return
  }
  var shouldShow = cameraEnabled && cameraStream && cameraPreviewMode === 'facemesh' && cameraMode === 'face-mesh'
  if (shouldShow) {
    cameraPreviewOverlay.removeAttribute('hidden')
  } else {
    cameraPreviewOverlay.setAttribute('hidden', '')
    clearCameraOverlay()
  }
}

function syncCameraOverlaySize() {
  if (!cameraPreviewOverlay) {
    return
  }
  var width = cameraPreviewOverlay.clientWidth
  var height = cameraPreviewOverlay.clientHeight
  if (!width || !height) {
    return
  }
  var dpr = window.devicePixelRatio || 1
  var scaledWidth = Math.floor(width * dpr)
  var scaledHeight = Math.floor(height * dpr)
  if (cameraPreviewOverlay.width !== scaledWidth) {
    cameraPreviewOverlay.width = scaledWidth
  }
  if (cameraPreviewOverlay.height !== scaledHeight) {
    cameraPreviewOverlay.height = scaledHeight
  }
}

function getOverlayContext() {
  if (!cameraPreviewOverlay) {
    return null
  }
  var width = cameraPreviewOverlay.clientWidth
  var height = cameraPreviewOverlay.clientHeight
  if (!width || !height) {
    return null
  }
  var dpr = window.devicePixelRatio || 1
  var scaledWidth = Math.floor(width * dpr)
  var scaledHeight = Math.floor(height * dpr)
  if (cameraPreviewOverlay.width !== scaledWidth) {
    cameraPreviewOverlay.width = scaledWidth
  }
  if (cameraPreviewOverlay.height !== scaledHeight) {
    cameraPreviewOverlay.height = scaledHeight
  }
  var ctx = cameraPreviewOverlay.getContext('2d')
  if (!ctx) {
    return null
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, width, height }
}

function getCoverTransform(sourceWidth, sourceHeight, boxWidth, boxHeight) {
  var scale = Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight)
  var displayWidth = sourceWidth * scale
  var displayHeight = sourceHeight * scale
  var offsetX = (boxWidth - displayWidth) / 2
  var offsetY = (boxHeight - displayHeight) / 2
  return {
    scale,
    displayWidth,
    displayHeight,
    offsetX,
    offsetY
  }
}

function updateCameraUI() {
  if (cameraRange) {
    cameraRange.value = cameraStrength
  }
  if (cameraRangeValue) {
    cameraRangeValue.textContent = `${cameraStrength}%`
  }
  if (cameraHeadOffsetXInput) {
    cameraHeadOffsetXInput.value = cameraHeadOffsetX
  }
  if (cameraHeadOffsetYInput) {
    cameraHeadOffsetYInput.value = cameraHeadOffsetY
  }
  if (cameraBodyRollOffsetXInput) {
    cameraBodyRollOffsetXInput.value = cameraBodyRollOffsetX
  }
  if (cameraHeadOffsetXValue) {
    cameraHeadOffsetXValue.textContent = `${cameraHeadOffsetX}%`
  }
  if (cameraHeadOffsetYValue) {
    cameraHeadOffsetYValue.textContent = `${cameraHeadOffsetY}%`
  }
  if (cameraBodyRollOffsetXValue) {
    cameraBodyRollOffsetXValue.textContent = `${cameraBodyRollOffsetX}%`
  }
  if (cameraToggle) {
    updateToggleButton(cameraToggle, cameraEnabled)
    cameraToggle.disabled = !cameraSupported
  }
  if (cameraPreviewModeSelect) {
    cameraPreviewModeSelect.value = cameraPreviewMode
    cameraPreviewModeSelect.disabled = !cameraSupported
  }
  if (cameraBlinkToggle) {
    updateToggleButton(cameraBlinkToggle, cameraBlinkEnabled)
    cameraBlinkToggle.disabled = !cameraSupported
  }
  if (cameraBlinkSensitivityInput) {
    cameraBlinkSensitivityInput.value = cameraBlinkSensitivity
    cameraBlinkSensitivityInput.disabled = !cameraSupported
  }
  if (cameraBlinkSensitivityValue) {
    cameraBlinkSensitivityValue.textContent = `${cameraBlinkSensitivity}%`
  }
  if (cameraMouthToggle) {
    updateToggleButton(cameraMouthToggle, cameraMouthEnabled)
    cameraMouthToggle.disabled = !cameraSupported
  }
  if (cameraMouthSensitivityInput) {
    cameraMouthSensitivityInput.value = cameraMouthSensitivity
    cameraMouthSensitivityInput.disabled = !cameraSupported
  }
  if (cameraMouthSensitivityValue) {
    cameraMouthSensitivityValue.textContent = `${cameraMouthSensitivity}%`
  }
  if (cameraStatus) {
    if (cameraStatusMessage) {
      cameraStatus.textContent = cameraStatusMessage
    } else if (!cameraSupported) {
      cameraStatus.textContent = '브라우저 미지원'
    } else {
      cameraStatus.textContent = ''
    }
  }
  updateCameraPreviewVisibility()
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

function setSettingsTab(nextTab) {
  if (!nextTab) {
    return
  }
  for (var i = 0; i < settingsTabs.length; i++) {
    var tab = settingsTabs[i]
    var isActive = tab.getAttribute('data-settings-tab') === nextTab
    if (isActive) {
      tab.classList.add('is-active')
      tab.setAttribute('aria-selected', 'true')
      tab.setAttribute('tabindex', '0')
    } else {
      tab.classList.remove('is-active')
      tab.setAttribute('aria-selected', 'false')
      tab.setAttribute('tabindex', '-1')
    }
  }
  for (var j = 0; j < settingsGroups.length; j++) {
    var group = settingsGroups[j]
    var isActiveGroup = group.getAttribute('data-settings-group') === nextTab
    if (isActiveGroup) {
      group.removeAttribute('hidden')
    } else {
      group.setAttribute('hidden', '')
    }
  }
}

if (storedInterval && (!localStorage.getItem('ftIntervalMin') || !localStorage.getItem('ftIntervalMax'))) {
  localStorage.setItem('ftIntervalMin', intervalMin)
  localStorage.setItem('ftIntervalMax', intervalMax)
}

bindIntervalHandleEvents(intervalMinInput, 'min')
bindIntervalHandleEvents(intervalMaxInput, 'max')
updateIntervalUI()
updateOffsetUI()
updateCameraUI()
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

if (settingsTabs.length && settingsGroups.length) {
  var initialSettingsTab = null
  for (var i = 0; i < settingsTabs.length; i++) {
    if (settingsTabs[i].classList.contains('is-active')) {
      initialSettingsTab = settingsTabs[i].getAttribute('data-settings-tab')
      break
    }
  }
  if (!initialSettingsTab && settingsTabs.length) {
    initialSettingsTab = settingsTabs[0].getAttribute('data-settings-tab')
  }
  setSettingsTab(initialSettingsTab)
  for (var j = 0; j < settingsTabs.length; j++) {
    settingsTabs[j].addEventListener('click', function(e) {
      setSettingsTab(e.currentTarget.getAttribute('data-settings-tab'))
    })
  }
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

if (cameraRange) {
  cameraRange.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    cameraStrength = Number.isFinite(nextValue) ? nextValue : 100
    localStorage.setItem('ftCameraStrength', cameraStrength)
    updateCameraUI()
  })
}

if (cameraHeadOffsetXInput) {
  cameraHeadOffsetXInput.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    cameraHeadOffsetX = Number.isFinite(nextValue) ? nextValue : 0
    localStorage.setItem('ftCameraHeadOffsetX', cameraHeadOffsetX)
    updateCameraUI()
  })
}

if (cameraHeadOffsetYInput) {
  cameraHeadOffsetYInput.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    cameraHeadOffsetY = Number.isFinite(nextValue) ? nextValue : 0
    localStorage.setItem('ftCameraHeadOffsetY', cameraHeadOffsetY)
    updateCameraUI()
  })
}

if (cameraBodyRollOffsetXInput) {
  cameraBodyRollOffsetXInput.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    cameraBodyRollOffsetX = Number.isFinite(nextValue) ? nextValue : 0
    localStorage.setItem('ftCameraBodyRollOffsetX', cameraBodyRollOffsetX)
    updateCameraUI()
  })
}

if (cameraToggle) {
  cameraToggle.addEventListener('click', function() {
    if (cameraToggle.disabled) {
      return
    }
    setCameraEnabled(!cameraEnabled)
  })
}

if (cameraPreviewModeSelect) {
  cameraPreviewModeSelect.addEventListener('change', function(e) {
    var nextMode = e.target.value
    if (nextMode !== 'off' && cameraPreviewMode === 'off') {
      var confirmed = window.confirm('카메라에 비친 사람이 브라우저 화면에 표시될 수 있습니다.\n방송 중이면 실제 얼굴이 노출될 수 있으니 주의하세요.\n계속하시겠습니까?')
      if (!confirmed) {
        cameraPreviewMode = 'off'
        localStorage.setItem('ftCameraPreviewMode', cameraPreviewMode)
        cameraPreviewModeSelect.value = 'off'
        updateCameraPreviewVisibility()
        return
      }
    }
    if (['off', 'video', 'facemesh'].indexOf(nextMode) === -1) {
      nextMode = 'off'
    }
    cameraPreviewMode = nextMode
    localStorage.setItem('ftCameraPreviewMode', cameraPreviewMode)
    updateCameraPreviewVisibility()
  })
}

if (cameraBlinkToggle) {
  cameraBlinkToggle.addEventListener('click', function() {
    if (cameraBlinkToggle.disabled) {
      return
    }
    cameraBlinkEnabled = !cameraBlinkEnabled
    localStorage.setItem('ftCameraBlinkEnabled', String(cameraBlinkEnabled))
    if (!cameraBlinkEnabled) {
      cameraBlinkActive = false
      cameraBlinkLastUpdate = 0
      cameraBlinkBaseline = 0
    }
    updateCameraUI()
  })
}

if (cameraBlinkSensitivityInput) {
  cameraBlinkSensitivityInput.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    cameraBlinkSensitivity = Number.isFinite(nextValue) ? nextValue : 100
    localStorage.setItem('ftCameraBlinkSensitivity', cameraBlinkSensitivity)
    cameraBlinkBaseline = 0
    updateCameraBlinkSettings()
    updateCameraUI()
  })
}

if (cameraMouthToggle) {
  cameraMouthToggle.addEventListener('click', function() {
    if (cameraMouthToggle.disabled) {
      return
    }
    cameraMouthEnabled = !cameraMouthEnabled
    localStorage.setItem('ftCameraMouthEnabled', String(cameraMouthEnabled))
    if (!cameraMouthEnabled) {
      cameraMouthActive = false
      cameraMouthLastUpdate = 0
      cameraMouthBaseline = 0
    }
    updateCameraUI()
    updateExpression(lastVolumeValue)
  })
}

if (cameraMouthSensitivityInput) {
  cameraMouthSensitivityInput.addEventListener('input', function(e) {
    var nextValue = parseInt(e.target.value, 10)
    cameraMouthSensitivity = Number.isFinite(nextValue) ? nextValue : 100
    localStorage.setItem('ftCameraMouthSensitivity', cameraMouthSensitivity)
    cameraMouthBaseline = 0
    updateCameraMouthSettings()
    updateCameraUI()
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
