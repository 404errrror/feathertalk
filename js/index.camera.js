var cameraVideo = null
var cameraStream = null
var cameraTimer = null
var cameraDetecting = false
var cameraHasPosition = false
var cameraHasRoll = false
var cameraLastX = 0
var cameraLastY = 0
var cameraLastRollX = 0
var cameraSmoothing = 0.18
var cameraInferEmaMs = 0
var cameraInferEmaAlpha = 0.25
var cameraInvertX = typeof cameraInvertX === 'boolean' ? cameraInvertX : false
var motionCanvas = null
var motionCtx = null
var motionPrevFrame = null
var motionWidth = 160
var motionHeight = 120
var motionThreshold = 28
var motionMinPixels = 120
var faceMesh = null
var faceMeshReady = false
var faceMeshLoading = false
var faceMeshPromise = null
var faceMeshYawGain = 2.2
var faceMeshPitchGain = 3.4
var faceMeshPitchOffset = -2.0
var cameraBodyRollGain = 2.0
var faceMeshMinConfidence = 0.5
var faceMeshTrackingConfidence = 0.5
var faceMeshOverlayStep = 2
var faceMeshOverlaySize = 2
var faceMeshOverlayLineWidth = 1
var faceMeshOverlayLineColor = 'rgba(0, 255, 220, 0.85)'
var faceMeshOverlayPointColor = 'rgba(255, 255, 255, 0.85)'
var cameraAnimationId = null
var cameraTargetOffsetX = 0
var cameraTargetOffsetY = 0
var cameraTargetRollX = 0
var cameraTargetReady = false
var cameraLastApplyTime = 0
var cameraPreviewBound = false
var cameraPerformanceProfiles = {
  'low-latency': {
    baseMs: 33,
    maxMs: 80,
    maxWidth: 640,
    maxHeight: 360,
    idealFps: 30,
    maxFps: 30
  },
  balanced: {
    baseMs: 45,
    maxMs: 110,
    maxWidth: 640,
    maxHeight: 360,
    idealFps: 24,
    maxFps: 30
  },
  'low-cpu': {
    baseMs: 75,
    maxMs: 180,
    maxWidth: 480,
    maxHeight: 270,
    idealFps: 15,
    maxFps: 15
  }
}

function getNowMs() {
  if (typeof performance !== 'undefined' && performance && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

function getCameraPerformanceProfilePreset() {
  var key = typeof cameraPerformanceProfile === 'string' ? cameraPerformanceProfile : 'low-latency'
  if (!cameraPerformanceProfiles[key]) {
    key = 'low-latency'
  }
  return cameraPerformanceProfiles[key]
}

function getCameraVideoConstraintsForProfile() {
  var preset = getCameraPerformanceProfilePreset()
  return {
    facingMode: 'user',
    width: { ideal: preset.maxWidth, max: preset.maxWidth },
    height: { ideal: preset.maxHeight, max: preset.maxHeight },
    frameRate: { ideal: preset.idealFps, max: preset.maxFps }
  }
}

function resetCameraInferenceTiming() {
  cameraInferEmaMs = 0
}

function updateCameraInferenceEma(elapsedMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return
  }
  if (!cameraInferEmaMs) {
    cameraInferEmaMs = elapsedMs
    return
  }
  cameraInferEmaMs = cameraInferEmaMs * (1 - cameraInferEmaAlpha) + elapsedMs * cameraInferEmaAlpha
}

function getNextCameraDetectDelayMs(elapsedMs) {
  var preset = getCameraPerformanceProfilePreset()
  if (Number.isFinite(elapsedMs) && elapsedMs > 0) {
    updateCameraInferenceEma(elapsedMs)
  }
  var adaptiveMs = preset.baseMs
  if (cameraInferEmaMs > 0) {
    adaptiveMs = Math.round(cameraInferEmaMs * 1.2 + 4)
  }
  var targetMs = Math.max(preset.baseMs, adaptiveMs)
  return Math.max(preset.baseMs, Math.min(preset.maxMs, targetMs))
}

function clearCameraDetectionLoop() {
  if (cameraTimer) {
    clearTimeout(cameraTimer)
    cameraTimer = null
  }
}

function scheduleCameraDetectionLoop(delayMs) {
  clearCameraDetectionLoop()
  if (!cameraEnabled) {
    return
  }
  var waitMs = Number.isFinite(delayMs) ? delayMs : 0
  waitMs = Math.max(0, Math.round(waitMs))
  cameraTimer = setTimeout(runCameraDetectionLoop, waitMs)
}

async function runCameraDetectionLoop() {
  cameraTimer = null
  if (!cameraEnabled) {
    return
  }
  var elapsedMs = await detectCameraFrame()
  if (!cameraEnabled) {
    return
  }
  scheduleCameraDetectionLoop(getNextCameraDetectDelayMs(elapsedMs))
}

function startCameraDetectionLoop() {
  resetCameraInferenceTiming()
  scheduleCameraDetectionLoop(0)
}

function getPrimaryCameraVideoTrack(stream) {
  var targetStream = stream || cameraStream
  if (!targetStream || typeof targetStream.getVideoTracks !== 'function') {
    return null
  }
  var tracks = targetStream.getVideoTracks()
  if (!tracks || !tracks.length) {
    return null
  }
  return tracks[0]
}

function ensureCameraVideoElement() {
  if (!cameraVideo) {
    cameraVideo = cameraPreviewVideo || document.createElement('video')
    cameraVideo.setAttribute('playsinline', '')
    cameraVideo.muted = true
  }
  if (!cameraPreviewBound) {
    cameraVideo.addEventListener('loadedmetadata', function() {
      syncCameraOverlaySize()
    })
    cameraPreviewBound = true
  }
  return cameraVideo
}

async function requestCameraStreamForCurrentProfile() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: getCameraVideoConstraintsForProfile()
    })
  } catch (error) {
    console.warn('Constrained camera getUserMedia failed', error)
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    })
  }
}

function setCameraEnabled(enabled) {
  var nextEnabled = Boolean(enabled)
  if (!cameraSupported) {
    cameraEnabled = false
    localStorage.setItem('ftCameraEnabled', 'false')
    setCameraStatus('브라우저 미지원')
    updateCameraUI()
    return
  }
  if (cameraEnabled === nextEnabled) {
    if (cameraEnabled && !cameraStream) {
      startCameraTracking()
    }
    updateCameraUI()
    return
  }
  cameraEnabled = nextEnabled
  localStorage.setItem('ftCameraEnabled', String(cameraEnabled))
  setCameraStatus('')
  updateCameraUI()
  if (cameraEnabled) {
    startCameraTracking()
  } else {
    stopCameraTracking()
    scheduleAutoRigFromPointer(lastX || document.body.clientWidth / 2, lastY || document.body.clientHeight / 2)
  }
}

async function startCameraTracking(skipConfirm) {
  if (!cameraSupported || cameraStream) {
    return
  }
  if (!skipConfirm) {
    var confirmed = window.confirm('카메라 권한을 요청합니다.\n카메라에 비친 사람이 브라우저 화면에 표시될 수 있습니다.\n방송 중이면 실제 얼굴이 노출될 수 있으니 주의하세요.\n계속하시겠습니까?')
    if (!confirmed) {
      cameraEnabled = false
      localStorage.setItem('ftCameraEnabled', 'false')
      setCameraStatus('카메라 권한 요청 취소')
      updateCameraUI()
      scheduleAutoRigFromPointer(lastX || document.body.clientWidth / 2, lastY || document.body.clientHeight / 2)
      return
    }
  }
  try {
    cameraStream = await requestCameraStreamForCurrentProfile()
  } catch (error) {
    cameraEnabled = false
    localStorage.setItem('ftCameraEnabled', 'false')
    setCameraStatus('카메라 권한 필요')
    updateCameraUI()
    scheduleAutoRigFromPointer(lastX || document.body.clientWidth / 2, lastY || document.body.clientHeight / 2)
    return
  }

  if (!cameraEnabled) {
    stopCameraTracking()
    return
  }

  var nextVideo = ensureCameraVideoElement()
  nextVideo.srcObject = cameraStream
  try {
    await nextVideo.play()
  } catch (error) {
    console.warn('Camera play was blocked', error)
  }
  updateCameraPreviewVisibility()

  loadFaceMesh().then(function() {
    if (!cameraEnabled) {
      return
    }
    if (cameraMode === 'motion') {
      ensureMotionCanvas()
    }
  })

  stopAutoRig()
  clearTimeout(autoResumeTimer)
  cameraHasPosition = false
  cameraHasRoll = false
  cameraTargetReady = false
  startCameraDetectionLoop()
  startCameraAnimation()
}

function stopCameraTracking() {
  clearCameraDetectionLoop()
  cameraDetecting = false
  cameraHasPosition = false
  cameraHasRoll = false
  cameraLastRollX = 0
  motionPrevFrame = null
  cameraTargetReady = false
  cameraBlinkActive = false
  cameraBlinkLastUpdate = 0
  cameraBlinkBaseline = 0
  cameraMouthActive = false
  cameraMouthLastUpdate = 0
  cameraMouthBaseline = 0
  resetCameraInferenceTiming()
  stopCameraAnimation()
  if (cameraStream) {
    cameraStream.getTracks().forEach(function(track) {
      track.stop()
    })
    cameraStream = null
  }
  if (cameraVideo) {
    cameraVideo.srcObject = null
  }
  updateCameraPreviewVisibility()
}

async function applyCameraPerformanceProfileRuntime() {
  if (!cameraEnabled || !cameraStream) {
    return
  }
  var currentStream = cameraStream
  var track = getPrimaryCameraVideoTrack(currentStream)
  var constraints = getCameraVideoConstraintsForProfile()
  if (track && typeof track.applyConstraints === 'function') {
    try {
      await track.applyConstraints(constraints)
      resetCameraInferenceTiming()
      scheduleCameraDetectionLoop(0)
      setCameraStatus('')
      updateCameraUI()
      return
    } catch (error) {
      console.warn('Camera applyConstraints failed', error)
    }
  }

  try {
    var nextStream = await requestCameraStreamForCurrentProfile()
    if (!nextStream) {
      throw new Error('Camera stream unavailable')
    }
    if (!cameraEnabled) {
      nextStream.getTracks().forEach(function(nextTrack) {
        nextTrack.stop()
      })
      return
    }
    cameraStream = nextStream
    var nextVideo = ensureCameraVideoElement()
    nextVideo.srcObject = nextStream
    try {
      await nextVideo.play()
    } catch (error) {
      console.warn('Camera play was blocked', error)
    }
    if (currentStream && currentStream !== nextStream) {
      currentStream.getTracks().forEach(function(oldTrack) {
        oldTrack.stop()
      })
    }
    cameraHasPosition = false
    cameraHasRoll = false
    cameraTargetReady = false
    cameraDetecting = false
    resetCameraInferenceTiming()
    scheduleCameraDetectionLoop(0)
    updateCameraPreviewVisibility()
    setCameraStatus('')
    updateCameraUI()
  } catch (error) {
    console.warn('Camera stream restart failed', error)
    setCameraStatus('성능 프로필 적용 실패 (기존 스트림 유지)')
    updateCameraUI()
  }
}

function ensureMotionCanvas() {
  if (motionCanvas && motionCtx && motionPrevFrame) {
    return
  }
  motionCanvas = document.createElement('canvas')
  motionCanvas.width = motionWidth
  motionCanvas.height = motionHeight
  motionCtx = motionCanvas.getContext('2d', { willReadFrequently: true })
  motionPrevFrame = new Uint8ClampedArray(motionWidth * motionHeight)
}

function loadExternalScript(src, id) {
  return new Promise(function(resolve, reject) {
    var selector = `script[data-ft="${id}"]`
    var existing = document.querySelector(selector)
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', function() {
        existing.setAttribute('data-loaded', 'true')
        resolve()
      })
      existing.addEventListener('error', function() {
        reject(new Error('Failed to load script'))
      })
      return
    }
    var script = document.createElement('script')
    script.src = src
    script.async = true
    script.setAttribute('data-ft', id)
    script.addEventListener('load', function() {
      script.setAttribute('data-loaded', 'true')
      resolve()
    })
    script.addEventListener('error', function() {
      reject(new Error('Failed to load script'))
    })
    document.head.appendChild(script)
  })
}

function loadFaceMesh() {
  if (faceMeshReady) {
    cameraMode = 'face-mesh'
    setCameraStatus('')
    updateCameraUI()
    return Promise.resolve(true)
  }
  if (faceMeshLoading && faceMeshPromise) {
    return faceMeshPromise
  }
  faceMeshLoading = true
  setCameraStatus('얼굴 모델 불러오는 중')
  updateCameraUI()
  var baseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh'
  var scriptUrl = `${baseUrl}/face_mesh.js`
  faceMeshPromise = loadExternalScript(scriptUrl, 'ft-face-mesh')
    .then(function() {
      if (typeof FaceMesh === 'undefined') {
        throw new Error('FaceMesh not available')
      }
      faceMesh = new FaceMesh({
        locateFile: function(file) {
          return `${baseUrl}/${file}`
        }
      })
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: faceMeshMinConfidence,
        minTrackingConfidence: faceMeshTrackingConfidence
      })
      faceMesh.onResults(onFaceMeshResults)
      faceMeshReady = true
      cameraMode = 'face-mesh'
      setCameraStatus('')
      updateCameraUI()
      return true
    })
    .catch(function(error) {
      console.warn('FaceMesh load failed', error)
      faceMeshReady = false
      faceMesh = null
      cameraMode = 'motion'
      setCameraStatus('모션 추적 사용')
      updateCameraUI()
      return false
    })
    .finally(function() {
      faceMeshLoading = false
    })
  return faceMeshPromise
}

function applyCameraDeadzone(value, zone) {
  var absValue = Math.abs(value)
  if (absValue <= zone) {
    return 0
  }
  return (absValue - zone) / (1 - zone) * Math.sign(value)
}

function getCameraInterpolationSmoothing() {
  var strength = typeof cameraInterpolationStrength === 'number' && Number.isFinite(cameraInterpolationStrength) ? cameraInterpolationStrength : 100
  strength = Math.max(0, Math.min(200, strength))
  if (strength <= 0) {
    return 1
  }
  var legacyResponse = 250 - strength
  return cameraSmoothing * (legacyResponse / 100)
}

function applyCameraOffset(offsetX, offsetY, rollX, deltaMs) {
  var headYawStrength = Math.max(0.5, Math.min(2, (Number.isFinite(cameraHeadYawStrength) ? cameraHeadYawStrength : 100) / 100))
  var headPitchStrength = Math.max(0.5, Math.min(2, (Number.isFinite(cameraHeadPitchStrength) ? cameraHeadPitchStrength : 100) / 100))
  var bodyStrength = Math.max(0.5, Math.min(2, cameraBodyStrength / 100))
  var deadzone = cameraMode === 'motion' ? 0.14 : 0.04
  var modeGain = cameraMode === 'motion' ? 0.7 : 1
  var adjustedX = applyCameraDeadzone(offsetX * headYawStrength, deadzone) * modeGain
  var adjustedY = applyCameraDeadzone(offsetY * headPitchStrength, deadzone) * modeGain
  var rollGain = cameraMode === 'face-mesh' ? cameraBodyRollGain : 1
  var adjustedRollX = applyCameraDeadzone(rollX * bodyStrength * rollGain, deadzone) * modeGain
  if (cameraInvertX) {
    adjustedX = -adjustedX
    adjustedRollX = -adjustedRollX
  }
  if (cameraMode === 'face-mesh') {
    adjustedX += cameraHeadOffsetX / 100
    adjustedY -= cameraHeadOffsetY / 100
  }
  adjustedX = Math.max(-1, Math.min(1, adjustedX))
  adjustedY = Math.max(-1, Math.min(1, adjustedY))
  adjustedRollX = Math.max(-1, Math.min(1, adjustedRollX))
  var width = document.body.clientWidth
  var height = document.body.clientHeight
  var targetX = (adjustedX + 1) / 2 * width
  var targetY = (adjustedY + 1) / 2 * height
  var rollTargetX = (adjustedRollX + 1) / 2 * width
  var pixelOffsetX = cameraMode === 'face-mesh' ? 0 : (cameraHeadOffsetX / 100) * (width / 2)
  var pixelOffsetY = cameraMode === 'face-mesh' ? 0 : -(cameraHeadOffsetY / 100) * (height / 2)
  var rollOffsetX = (cameraBodyRollOffsetX / 100) * (width / 2)
  targetX = Math.max(0, Math.min(width, targetX + pixelOffsetX))
  targetY = Math.max(0, Math.min(height, targetY + pixelOffsetY))
  rollTargetX = Math.max(0, Math.min(width, rollTargetX + rollOffsetX))
  if (typeof setRigRotationLagTarget === 'function' && typeof resolveRigRotateDegrees === 'function') {
    setRigRotationLagTarget(resolveRigRotateDegrees(rollTargetX))
  }

  var baseSmoothing = getCameraInterpolationSmoothing()
  var smoothing = baseSmoothing
  if (Number.isFinite(deltaMs) && deltaMs > 0) {
    var step = deltaMs / 60
    smoothing = 1 - Math.pow(1 - baseSmoothing, step)
  }
  if (!cameraHasPosition) {
    cameraLastX = targetX
    cameraLastY = targetY
    cameraHasPosition = true
  } else {
    cameraLastX += (targetX - cameraLastX) * smoothing
    cameraLastY += (targetY - cameraLastY) * smoothing
  }
  if (!cameraHasRoll) {
    cameraLastRollX = rollTargetX
    cameraHasRoll = true
  } else {
    cameraLastRollX += (rollTargetX - cameraLastRollX) * smoothing
  }

  var velocityX = (lastX - cameraLastX) * stiffness * damping
  applyRigFromPoint(cameraLastX, cameraLastY, velocityX, cameraLastRollX)

  lastX = cameraLastX
  lastY = cameraLastY
  randomX = NaN
  randomY = NaN
}

function updateCameraTarget(offsetX, offsetY, rollX) {
  cameraTargetOffsetX = offsetX
  cameraTargetOffsetY = offsetY
  cameraTargetRollX = Number.isFinite(rollX) ? rollX : offsetX
  cameraTargetReady = true
}

function startCameraAnimation() {
  if (cameraAnimationId) {
    return
  }
  cameraLastApplyTime = 0
  cameraAnimationId = requestAnimationFrame(runCameraAnimation)
}

function stopCameraAnimation() {
  if (cameraAnimationId) {
    cancelAnimationFrame(cameraAnimationId)
    cameraAnimationId = null
  }
  cameraLastApplyTime = 0
}

function runCameraAnimation(now) {
  if (!cameraEnabled) {
    stopCameraAnimation()
    return
  }
  if (cameraTargetReady) {
    var deltaMs = cameraLastApplyTime ? now - cameraLastApplyTime : 60
    applyCameraOffset(cameraTargetOffsetX, cameraTargetOffsetY, cameraTargetRollX, deltaMs)
    cameraLastApplyTime = now
  }
  cameraAnimationId = requestAnimationFrame(runCameraAnimation)
}

function getLandmarkDistance(a, b) {
  if (!a || !b) {
    return null
  }
  var dx = a.x - b.x
  var dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function getEyeAspectRatio(landmarks, outerIdx, innerIdx, topIdx, bottomIdx) {
  var outer = landmarks[outerIdx]
  var inner = landmarks[innerIdx]
  var top = landmarks[topIdx]
  var bottom = landmarks[bottomIdx]
  if (!outer || !inner || !top || !bottom) {
    return null
  }
  var horizontal = getLandmarkDistance(outer, inner)
  if (!horizontal) {
    return null
  }
  var vertical = getLandmarkDistance(top, bottom)
  if (!vertical) {
    return null
  }
  return vertical / horizontal
}

function getMouthAspectRatio(landmarks, leftIdx, rightIdx, topIdx, bottomIdx) {
  var left = landmarks[leftIdx]
  var right = landmarks[rightIdx]
  var top = landmarks[topIdx]
  var bottom = landmarks[bottomIdx]
  if (!left || !right || !top || !bottom) {
    return null
  }
  var horizontal = getLandmarkDistance(left, right)
  if (!horizontal) {
    return null
  }
  var vertical = getLandmarkDistance(top, bottom)
  if (!vertical) {
    return null
  }
  return vertical / horizontal
}

function updateCameraBlinkState(landmarks) {
  if (!cameraBlinkEnabled) {
    return
  }
  var leftRatio = getEyeAspectRatio(landmarks, 33, 133, 159, 145)
  var rightRatio = getEyeAspectRatio(landmarks, 362, 263, 386, 374)
  var ratioSum = 0
  var ratioCount = 0
  if (Number.isFinite(leftRatio)) {
    ratioSum += leftRatio
    ratioCount += 1
  }
  if (Number.isFinite(rightRatio)) {
    ratioSum += rightRatio
    ratioCount += 1
  }
  if (!ratioCount) {
    return
  }
  var ratio = ratioSum / ratioCount
  var minRatio = 0.03
  var maxRatio = 0.6
  if (ratio < minRatio || ratio > maxRatio) {
    return
  }
  cameraBlinkLastUpdate = Date.now()
  var baselineMax = 0.5
  if (!cameraBlinkBaseline) {
    cameraBlinkBaseline = ratio
  }
  if (cameraBlinkBaseline > baselineMax) {
    cameraBlinkBaseline = baselineMax
  }
  if (!cameraBlinkActive && ratio > cameraBlinkThreshold) {
    cameraBlinkBaseline = cameraBlinkBaseline * (1 - cameraBlinkBaselineAlpha) + ratio * cameraBlinkBaselineAlpha
    if (cameraBlinkBaseline > baselineMax) {
      cameraBlinkBaseline = baselineMax
    }
  }
  var closeThreshold = cameraBlinkBaseline ? cameraBlinkBaseline * cameraBlinkCloseRatio : cameraBlinkThreshold
  var openThreshold = cameraBlinkBaseline ? cameraBlinkBaseline * cameraBlinkOpenRatio : cameraBlinkThreshold + cameraBlinkHysteresis
  var nextBlinkActive = cameraBlinkActive
  if (cameraBlinkActive) {
    if (ratio > openThreshold) {
      nextBlinkActive = false
    }
  } else if (ratio < closeThreshold) {
    nextBlinkActive = true
  }
  if (nextBlinkActive !== cameraBlinkActive) {
    cameraBlinkActive = nextBlinkActive
    updateExpression(lastVolumeValue)
  }
}

function updateCameraMouthState(landmarks, yawValue) {
  if (!cameraMouthEnabled) {
    return
  }
  var ratio = getMouthAspectRatio(landmarks, 61, 291, 13, 14)
  if (!Number.isFinite(ratio)) {
    return
  }
  var adjustedRatio = ratio
  if (Number.isFinite(yawValue)) {
    var yawAbs = Math.abs(yawValue)
    var yawScale = 1 + Math.min(1, yawAbs * 1.6) * 1.4
    adjustedRatio = ratio / yawScale
  }
  cameraMouthLastUpdate = Date.now()
  if (!cameraMouthBaseline) {
    cameraMouthBaseline = adjustedRatio
  }
  if (!cameraMouthActive) {
    cameraMouthBaseline = cameraMouthBaseline * (1 - cameraMouthBaselineAlpha) + adjustedRatio * cameraMouthBaselineAlpha
  }
  var openThreshold = cameraMouthBaseline * cameraMouthOpenRatio
  var closeThreshold = cameraMouthBaseline * cameraMouthCloseRatio
  var nextMouthActive = cameraMouthActive
  if (cameraMouthActive) {
    if (adjustedRatio < closeThreshold) {
      nextMouthActive = false
    }
  } else if (adjustedRatio > openThreshold) {
    nextMouthActive = true
  }
  if (nextMouthActive !== cameraMouthActive) {
    cameraMouthActive = nextMouthActive
    updateExpression(lastVolumeValue)
  }
}

function onFaceMeshResults(results) {
  if (!cameraEnabled || cameraMode !== 'face-mesh') {
    return
  }
  var landmarks = results && results.multiFaceLandmarks && results.multiFaceLandmarks[0]
  if (!landmarks || !landmarks.length) {
    return
  }
  var leftEye = landmarks[33]
  var rightEye = landmarks[263]
  var noseTip = landmarks[1] || landmarks[4]
  if (!leftEye || !rightEye || !noseTip) {
    return
  }
  var midX = (leftEye.x + rightEye.x) / 2
  var midY = (leftEye.y + rightEye.y) / 2
  var eyeDx = rightEye.x - leftEye.x
  var eyeDy = rightEye.y - leftEye.y
  var eyeDist = Math.max(0.0001, Math.hypot(eyeDx, eyeDy))
  var rawX = (noseTip.x - midX) / eyeDist
  var rawY = (noseTip.y - midY) / eyeDist
  var positionX = (midX - 0.5) * 2
  var adjustedRawY = rawY
  var offsetX = rawX * faceMeshYawGain
  var offsetY = adjustedRawY * faceMeshPitchGain + faceMeshPitchOffset
  var rollX = Math.max(-1, Math.min(1, positionX))
  updateCameraTarget(offsetX, offsetY, rollX)
  updateCameraBlinkState(landmarks)
  updateCameraMouthState(landmarks, rawX)
  drawFaceMeshOverlay(landmarks)
}

function detectMotionFrame() {
  ensureMotionCanvas()
  if (!motionCtx) {
    return
  }
  motionCtx.drawImage(cameraVideo, 0, 0, motionWidth, motionHeight)
  var frame = motionCtx.getImageData(0, 0, motionWidth, motionHeight).data
  var count = 0
  var sumX = 0
  var sumY = 0
  var idx = 0
  for (var y = 0; y < motionHeight; y++) {
    for (var x = 0; x < motionWidth; x++) {
      var i = (y * motionWidth + x) * 4
      var gray = (frame[i] * 0.299 + frame[i + 1] * 0.587 + frame[i + 2] * 0.114) | 0
      var diff = Math.abs(gray - motionPrevFrame[idx])
      motionPrevFrame[idx] = gray
      if (diff > motionThreshold) {
        sumX += x
        sumY += y
        count += 1
      }
      idx += 1
    }
  }
  if (count < motionMinPixels) {
    return
  }
  var centerX = sumX / count
  var centerY = sumY / count
  var offsetX = (centerX / motionWidth - 0.5) * 2
  var offsetY = (centerY / motionHeight - 0.5) * 2
  updateCameraTarget(offsetX, offsetY)
}

function drawFaceMeshOverlay(landmarks) {
  if (cameraPreviewMode !== 'facemesh' || !cameraPreviewOverlay || cameraMode !== 'face-mesh') {
    return
  }
  if (!cameraPreviewVideo || !cameraPreviewVideo.videoWidth || !cameraPreviewVideo.videoHeight) {
    return
  }
  var overlay = getOverlayContext()
  if (!overlay) {
    return
  }
  var width = overlay.width
  var height = overlay.height
  if (!width || !height) {
    return
  }
  var ctx = overlay.ctx
  var transform = getCoverTransform(cameraPreviewVideo.videoWidth, cameraPreviewVideo.videoHeight, width, height)
  var offsetX = transform.offsetX
  var offsetY = transform.offsetY
  var displayWidth = transform.displayWidth
  var displayHeight = transform.displayHeight
  ctx.clearRect(0, 0, width, height)
  var connections = typeof FACEMESH_TESSELATION !== 'undefined' ? FACEMESH_TESSELATION : null
  if (connections && connections.length) {
    ctx.strokeStyle = faceMeshOverlayLineColor
    ctx.lineWidth = faceMeshOverlayLineWidth
    ctx.beginPath()
    for (var c = 0; c < connections.length; c++) {
      var connection = connections[c]
      var a = connection[0]
      var b = connection[1]
      var pointA = landmarks[a]
      var pointB = landmarks[b]
      if (!pointA || !pointB) {
        continue
      }
      ctx.moveTo(pointA.x * displayWidth + offsetX, pointA.y * displayHeight + offsetY)
      ctx.lineTo(pointB.x * displayWidth + offsetX, pointB.y * displayHeight + offsetY)
    }
    ctx.stroke()
  }

  ctx.fillStyle = faceMeshOverlayPointColor
  for (var i = 0; i < landmarks.length; i += faceMeshOverlayStep) {
    var point = landmarks[i]
    if (!point) {
      continue
    }
    var x = point.x * displayWidth + offsetX
    var y = point.y * displayHeight + offsetY
    ctx.fillRect(x - faceMeshOverlaySize / 2, y - faceMeshOverlaySize / 2, faceMeshOverlaySize, faceMeshOverlaySize)
  }
}

async function detectCameraFrame() {
  if (!cameraEnabled || !cameraVideo || cameraDetecting) {
    return null
  }
  if (cameraVideo.readyState < 2) {
    return null
  }
  var startedAt = getNowMs()
  if (cameraMode === 'motion' || !faceMeshReady || !faceMesh) {
    cameraDetecting = true
    try {
      detectMotionFrame()
    } finally {
      cameraDetecting = false
    }
    return Math.max(0, getNowMs() - startedAt)
  }
  cameraDetecting = true
  try {
    await faceMesh.send({ image: cameraVideo })
  } catch (error) {
    console.warn('FaceMesh detection failed', error)
    cameraMode = 'motion'
    setCameraStatus('모션 추적 사용')
    updateCameraUI()
    ensureMotionCanvas()
  } finally {
    cameraDetecting = false
  }
  return Math.max(0, getNowMs() - startedAt)
}

function initCameraControls() {
  if (!cameraSupported) {
    cameraEnabled = false
    localStorage.setItem('ftCameraEnabled', 'false')
  }
  updateCameraUI()
  if (cameraEnabled) {
    setCameraEnabled(true)
  }
}

initCameraControls()
