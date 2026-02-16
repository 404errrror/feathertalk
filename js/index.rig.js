  let autoRig = null
  let autoResumeTimer = null
  let autoFrameTimers = []
  var pointerIdleDelay = 1500

  function isAutoMotionEnabled() {
    if (typeof window.autoMotionEnabled === 'boolean') {
      return window.autoMotionEnabled
    }
    return true
  }

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
    if (!isAutoMotionEnabled()) {
      clearTimeout(autoResumeTimer)
      return
    }
    clearTimeout(autoResumeTimer)
    autoResumeTimer = setTimeout(function() {
      scheduleAutoRigFromPointer(fallbackX, fallbackY)
    }, pointerIdleDelay)
  }

  function readMotionRangeValue(value, fallback) {
    var nextValue = Number.isFinite(value) ? value : parseInt(value, 10)
    if (!Number.isFinite(nextValue)) {
      nextValue = fallback
    }
    return Math.min(100, Math.max(0, Math.round(nextValue)))
  }

  function resolveMotionRange(minValue, maxValue, fallbackMin, fallbackMax) {
    var min = readMotionRangeValue(minValue, fallbackMin)
    var max = readMotionRangeValue(maxValue, fallbackMax)
    if (min > max) {
      var temp = min
      min = max
      max = temp
    }
    return { min, max }
  }

  function clampPointByRange(point, axisSize, minPercent, maxPercent) {
    if (!Number.isFinite(point) || !Number.isFinite(axisSize) || axisSize <= 0) {
      return point
    }
    var percent = point / axisSize * 100
    var clampedPercent = Math.min(maxPercent, Math.max(minPercent, percent))
    return clampedPercent / 100 * axisSize
  }

  function clampFaceRigX(pointX) {
    var width = document.body.clientWidth
    var range = resolveMotionRange(window.faceXMin, window.faceXMax, 0, 100)
    return clampPointByRange(pointX, width, range.min, range.max)
  }

  function clampFaceRigY(pointY) {
    var height = document.body.clientHeight
    var range = resolveMotionRange(window.faceYMin, window.faceYMax, 0, 100)
    return clampPointByRange(pointY, height, range.min, range.max)
  }

  function clampBodyRotateRigX(sourceX) {
    var width = document.body.clientWidth
    var range = resolveMotionRange(window.bodyRotateMin, window.bodyRotateMax, 0, 100)
    return clampPointByRange(sourceX, width, range.min, range.max)
  }

  function resolveMotionRangePixels(axisSize, minValue, maxValue, fallbackMin, fallbackMax) {
    var normalizedSize = Number.isFinite(axisSize) && axisSize > 0 ? axisSize : 0
    var range = resolveMotionRange(minValue, maxValue, fallbackMin, fallbackMax)
    return {
      min: normalizedSize * range.min / 100,
      max: normalizedSize * range.max / 100
    }
  }

  function pickAutoTargetPoint() {
    var width = document.body.clientWidth
    var height = document.body.clientHeight
    var ratioX = Math.random()
    var ratioY = Math.random()
    var faceXRange = resolveMotionRangePixels(width, window.faceXMin, window.faceXMax, 0, 100)
    var faceYRange = resolveMotionRangePixels(height, window.faceYMin, window.faceYMax, 0, 100)
    var bodyRotateRange = resolveMotionRangePixels(width, window.bodyRotateMin, window.bodyRotateMax, 0, 100)
    return {
      faceX: faceXRange.min + (faceXRange.max - faceXRange.min) * ratioX,
      faceY: faceYRange.min + (faceYRange.max - faceYRange.min) * ratioY,
      rotateX: bodyRotateRange.min + (bodyRotateRange.max - bodyRotateRange.min) * ratioX
    }
  }

  let autoFaceX = NaN
  let autoFaceY = NaN
  let autoRotateX = NaN

  function rememberAutoPose(faceX, faceY, rotateX) {
    if (Number.isFinite(faceX)) {
      autoFaceX = faceX
    }
    if (Number.isFinite(faceY)) {
      autoFaceY = faceY
    }
    if (Number.isFinite(rotateX)) {
      autoRotateX = rotateX
    }
  }

  function resolveAutoSeedPoint(fallbackX, fallbackY) {
    var width = document.body.clientWidth
    var height = document.body.clientHeight
    var seedFaceX = Number.isFinite(autoFaceX)
      ? autoFaceX
      : (Number.isFinite(fallbackX) ? fallbackX : width / 2)
    var seedFaceY = Number.isFinite(autoFaceY)
      ? autoFaceY
      : (Number.isFinite(fallbackY) ? fallbackY : height / 2)
    var seedRotateX = Number.isFinite(autoRotateX) ? autoRotateX : seedFaceX
    return {
      faceX: clampFaceRigX(seedFaceX),
      faceY: clampFaceRigY(seedFaceY),
      rotateX: clampBodyRotateRigX(seedRotateX)
    }
  }

function scheduleAutoRig() {
    if (cameraEnabled || !isAutoMotionEnabled()) {
      return
    }
    clearAutoFrameTimers()
    var currentInterval = pickRandomInterval()
    var intervals = buildIntervals(currentInterval)
    var seedPoint = resolveAutoSeedPoint(randomX, randomY)
    var startFaceX = seedPoint.faceX
    var startFaceY = seedPoint.faceY
    var startRotateX = seedPoint.rotateX
    var targetPoint = pickAutoTargetPoint()
    var targetFaceX = clampFaceRigX(targetPoint.faceX)
    var targetFaceY = clampFaceRigY(targetPoint.faceY)
    var targetRotateX = clampBodyRotateRigX(targetPoint.rotateX)
    randomX = targetFaceX
    randomY = targetFaceY
    for (let i of intervals) {

      scheduleAutoFrame(() => {
      var progress = currentInterval > 0 ? i / currentInterval : 1
      var X = startFaceX + (targetFaceX - startFaceX) * progress
      var Y = startFaceY + (targetFaceY - startFaceY) * progress
      var rotateX = startRotateX + (targetRotateX - startRotateX) * progress
      X = clampFaceRigX(X)
      Y = clampFaceRigY(Y)
      rotateX = clampBodyRotateRigX(rotateX)
      rememberAutoPose(X, Y, rotateX)
      
      var backStyle = `top: ${(5 - (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      applyRigStyles('back', { img: backStyle })

      var bangDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) + 1px);`
      var bangDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) - 1px);`
      var bangImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      var bangImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

      var eyesDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
      var eyesDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
      var eyesImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
      var eyesImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
      applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

      var mouthDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
      var mouthDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
      var mouthImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      var mouthImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
      applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

      var faceDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
      var faceDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
      var faceImgLStyle = `width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      var faceImgRStyle = `width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
      applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

      setCharacterTransform((rotateX - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)
      }, i*12/20);
    }
    if (!cameraEnabled && isAutoMotionEnabled()) {
      autoRig = setTimeout(scheduleAutoRig, currentInterval)
    }
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
  if (cameraEnabled || !isAutoMotionEnabled()) {
    return
  }
  clearAutoFrameTimers()
  var currentInterval = pickRandomInterval()
  var intervals = buildIntervals(currentInterval)
  var seedPoint = resolveAutoSeedPoint(fallbackX, fallbackY)
  let X = seedPoint.faceX
  let Y = seedPoint.faceY
  let rotateX = seedPoint.rotateX
  var targetPoint = pickAutoTargetPoint()
  randomX = clampFaceRigX(targetPoint.faceX)
  randomY = clampFaceRigY(targetPoint.faceY)
  let velocityX = (randomX - X) * stiffness * damping
  let velocityY = (randomY - Y) * stiffness * damping
  let velocityRotateX = (targetPoint.rotateX - rotateX) * stiffness * damping
  for (let i of intervals) {

    scheduleAutoFrame(() => {
    var faceTargetX = clampFaceRigX(randomX)
    var faceTargetY = clampFaceRigY(randomY)
    var rotateTargetX = clampBodyRotateRigX(targetPoint.rotateX)
    var previousX = X
    velocityX = (velocityX + (faceTargetX - X) * stiffness) * damping
    velocityY = (velocityY + (faceTargetY - Y) * stiffness) * damping
    velocityRotateX = (velocityRotateX + (rotateTargetX - rotateX) * stiffness) * damping
    X = clampFaceRigX(X + velocityX)
    Y = clampFaceRigY(Y + velocityY)
    rotateX = clampBodyRotateRigX(rotateX + velocityRotateX)
    rememberAutoPose(X, Y, rotateX)
    var effectiveDeltaX = X - previousX
    // Squash/stretch based on effective horizontal movement.
    var squashStretch = Math.abs(effectiveDeltaX) * 0.0005;
    var currentScaleY = 1 + 0.5 * squashStretch;
    var currentScaleNegY = 1 - 0.5 * squashStretch;
    var currentScaleX = 1 - squashStretch;
    var currentScaleNegX = 1 + squashStretch;
    
    var backStyle = `height: ${100 * currentScaleY}dvh; left: min(${50 - 50 * currentScaleX}vw, ${50 - 50 * currentScaleX}dvh); width: min(${100 * currentScaleX}vw, ${100 * currentScaleX}dvh); top: ${(5 - (Y / document.body.clientHeight) * 10) * rig / 100}px;`
    applyRigStyles('back', { img: backStyle })

    var bangDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) + 1px);`
    var bangDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) - 1px);`
    var bangImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    var bangImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

    var eyesDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
    var eyesDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
    var eyesImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegX}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
    var eyesImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleX}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30) * rig / 100}px;`
    applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

    var mouthDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
    var mouthDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
    var mouthImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    var mouthImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20) * rig / 100}px;`
    applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

    var faceDivLStyle = `width: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
    var faceDivRStyle = `width: calc(min(${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
    var faceImgLStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegX}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
    var faceImgRStyle = `height: ${100 * currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleX}vw, ${(100 - (X - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleX}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10) * rig / 100}px;`
    applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

    setCharacterTransform((rotateX - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)
    }, i*12/20);
  }
  if (!cameraEnabled && isAutoMotionEnabled()) {
    autoRig = setTimeout(() => {
      scheduleAutoRigFromPointer(fallbackX, fallbackY)
    }, currentInterval)
  }
}

function syncAutoMotionRigState() {
  stopAutoRig()
  clearTimeout(autoResumeTimer)
  if (cameraEnabled || !isAutoMotionEnabled()) {
    return
  }
  scheduleAutoRigFromPointer(lastX || document.body.clientWidth / 2, lastY || document.body.clientHeight / 2)
}

window.syncAutoMotionRigState = syncAutoMotionRigState

function applyRigFromPoint(pointX, pointY, velocityX, rotateX) {
  var clampedPointX = clampFaceRigX(pointX)
  var clampedPointY = clampFaceRigY(pointY)
  var clampedRotateX = clampBodyRotateRigX(Number.isFinite(rotateX) ? rotateX : pointX)
  pointX = clampedPointX
  pointY = clampedPointY
  rememberAutoPose(pointX, pointY, clampedRotateX)
  var squashStretchM = Math.abs(velocityX) * 0.0005; // 0.1 강도 조절값
  var currentScaleYM = 1 + 2 * squashStretchM; // 위아래로 늘어짐
  var currentScaleNegYM = 1 - 2 * squashStretchM; // 위아래로 줄어듦
  var currentScaleXM = 1 - 4 * squashStretchM; // 좌우로 줄어듦(부피 보존)
  var currentScaleNegXM = 1 + 4 * squashStretchM; // 좌우로 늘어남(부피 보존)

  var backStyle = `height: ${100 * currentScaleYM}dvh; left: min(${50 - 50 * currentScaleXM}vw, ${50 - 50 * currentScaleXM}dvh); width: min(${100 * currentScaleXM}vw, ${100 * currentScaleXM}dvh); top: ${(5 - (pointY / document.body.clientHeight) * 10) * rig / 100}px;`
  applyRigStyles('back', { img: backStyle })

  var bangDivLStyle = `width: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) + 1px);`
  var bangDivRStyle = `width: calc(min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh) - 1px);`
  var bangImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}vw, ${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}dvh); top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  var bangImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}vw, ${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}dvh);top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

  var eyesDivLStyle = `width: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
  var eyesDivRStyle = `width: calc(min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
  var eyesImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}vw, ${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}dvh);top: ${(-15 + (pointY / document.body.clientHeight) * 30) * rig / 100}px;`
  var eyesImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}vw, ${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}dvh);top: ${(-15 + (pointY / document.body.clientHeight) * 30) * rig / 100}px;`
  applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

  var mouthDivLStyle = `width: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
  var mouthDivRStyle = `width: calc(min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
  var mouthImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  var mouthImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

  var faceDivLStyle = `width: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px);`
  var faceDivRStyle = `width: calc(min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) + 1px); left: calc(min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh) - 1px);`
  var faceImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegXM}vw, ${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegXM}dvh);top: ${(-5 + (pointY / document.body.clientHeight) * 10) * rig / 100}px;`
  var faceImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleXM}vw, ${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleXM}dvh);top: ${(-5 + (pointY / document.body.clientHeight) * 10) * rig / 100}px;`
  applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

  var rotateSourceX = clampedRotateX
  setCharacterTransform((rotateSourceX - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)
}

document.addEventListener('mousemove', function(e) {
  if (cameraEnabled) {
    return
  }
  stopAutoRig()

  X = e.clientX
  Y = e.clientY
  velocity = (lastX - X) * stiffness * damping

  applyRigFromPoint(X, Y, velocity)

  lastX = X
  lastY = Y

  randomX = NaN
  randomY = NaN

  scheduleAutoResume(X, Y)
})

