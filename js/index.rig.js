  let autoRig = null
  let autoResumeTimer = null
  let autoFrameTimers = []
  var pointerIdleDelay = 1500
  var bodyRotateRangeDeg = 36
  var mouthSplitDivFactor = 12
  var mouthSplitImgFactor = 20
  var mouthSeamOverlapPx = 2

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

  function scheduleAutoResume(fallbackX, fallbackY, fallbackRotateX) {
    if (!isAutoMotionEnabled()) {
      clearTimeout(autoResumeTimer)
      return
    }
    clearTimeout(autoResumeTimer)
    autoResumeTimer = setTimeout(function() {
      scheduleAutoRigFromPointer(fallbackX, fallbackY, fallbackRotateX)
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

  function clampPercentValue(value, fallback) {
    var nextValue = Number.isFinite(value) ? value : parseFloat(value)
    if (!Number.isFinite(nextValue)) {
      nextValue = fallback
    }
    return Math.min(100, Math.max(0, nextValue))
  }

  function resolveRigScale() {
    var rigValue = Number.isFinite(window.rig) ? window.rig : parseFloat(window.rig)
    if (!Number.isFinite(rigValue)) {
      rigValue = 100
    }
    return Math.max(0, rigValue / 100)
  }

  function toRigSpacePercent(sourcePercent, rigScale) {
    return 50 + (sourcePercent - 50) * rigScale
  }

  function toSourcePercent(rigSpacePercent, rigScale) {
    if (!Number.isFinite(rigScale) || rigScale <= 0) {
      return 50
    }
    return 50 + (rigSpacePercent - 50) / rigScale
  }

  function clampPointByRange(point, axisSize, minPercent, maxPercent, rigScale) {
    if (!Number.isFinite(point) || !Number.isFinite(axisSize) || axisSize <= 0) {
      return point
    }
    var normalizedRigScale = Number.isFinite(rigScale) ? Math.max(0, rigScale) : 1
    // Clamp is applied in rig-space so range settings stay independent from rig strength.
    var sourcePercent = point / axisSize * 100
    var rigSpacePercent = toRigSpacePercent(sourcePercent, normalizedRigScale)
    var clampedRigSpacePercent = Math.min(maxPercent, Math.max(minPercent, rigSpacePercent))
    var clampedSourcePercent = clampPercentValue(toSourcePercent(clampedRigSpacePercent, normalizedRigScale), 50)
    return clampedSourcePercent / 100 * axisSize
  }

  function clampFaceRigX(pointX) {
    var width = document.body.clientWidth
    var range = resolveMotionRange(window.faceXMin, window.faceXMax, 0, 100)
    var rigScale = resolveRigScale()
    return clampPointByRange(pointX, width, range.min, range.max, rigScale)
  }

  function clampFaceRigY(pointY) {
    var height = document.body.clientHeight
    var range = resolveMotionRange(window.faceYMin, window.faceYMax, 0, 100)
    var rigScale = resolveRigScale()
    return clampPointByRange(pointY, height, range.min, range.max, rigScale)
  }

  function clampBodyRotateRigX(sourceX) {
    var width = document.body.clientWidth
    var range = resolveMotionRange(window.bodyRotateMin, window.bodyRotateMax, 0, 100)
    var rigScale = resolveRigScale()
    return clampPointByRange(sourceX, width, range.min, range.max, rigScale)
  }

  function resolveMotionRangePixels(axisSize, minValue, maxValue, fallbackMin, fallbackMax, rigScale) {
    var normalizedSize = Number.isFinite(axisSize) && axisSize > 0 ? axisSize : 0
    var normalizedRigScale = Number.isFinite(rigScale) ? Math.max(0, rigScale) : 1
    var range = resolveMotionRange(minValue, maxValue, fallbackMin, fallbackMax)
    var sourceMinPercent = clampPercentValue(toSourcePercent(range.min, normalizedRigScale), 0)
    var sourceMaxPercent = clampPercentValue(toSourcePercent(range.max, normalizedRigScale), 100)
    if (sourceMinPercent > sourceMaxPercent) {
      var temp = sourceMinPercent
      sourceMinPercent = sourceMaxPercent
      sourceMaxPercent = temp
    }
    return {
      min: normalizedSize * sourceMinPercent / 100,
      max: normalizedSize * sourceMaxPercent / 100
    }
  }

  function resolveClampedRigPercent(point, axisSize, minValue, maxValue, fallbackMin, fallbackMax) {
    if (!Number.isFinite(axisSize) || axisSize <= 0) {
      return 50
    }
    var rigScale = resolveRigScale()
    var range = resolveMotionRange(minValue, maxValue, fallbackMin, fallbackMax)
    var sourcePercent = clampPercentValue(point / axisSize * 100, 50)
    var rigSpacePercent = toRigSpacePercent(sourcePercent, rigScale)
    return clampPercentValue(Math.min(range.max, Math.max(range.min, rigSpacePercent)), 50)
  }

  function resolveClampedRigPose(pointX, pointY, rotateX) {
    var width = document.body.clientWidth
    var height = document.body.clientHeight
    var clampedFaceXPercent = resolveClampedRigPercent(pointX, width, window.faceXMin, window.faceXMax, 0, 100)
    var clampedFaceYPercent = resolveClampedRigPercent(pointY, height, window.faceYMin, window.faceYMax, 0, 100)
    var clampedRotatePercent = resolveClampedRigPercent(rotateX, width, window.bodyRotateMin, window.bodyRotateMax, 0, 100)
    return {
      xDelta: (clampedFaceXPercent - 50) / 100,
      yDelta: (clampedFaceYPercent - 50) / 100,
      rotateDelta: (clampedRotatePercent - 50) / 100
    }
  }

  function resolveRigRotateDegrees(rotateX) {
    var width = document.body.clientWidth
    var clampedRotatePercent = resolveClampedRigPercent(rotateX, width, window.bodyRotateMin, window.bodyRotateMax, 0, 100)
    return (clampedRotatePercent - 50) / 100 * bodyRotateRangeDeg
  }

  function pickAutoTargetPoint() {
    var width = document.body.clientWidth
    var height = document.body.clientHeight
    var rigScale = resolveRigScale()
    var ratioX = Math.random()
    var ratioY = Math.random()
    var faceXRange = resolveMotionRangePixels(width, window.faceXMin, window.faceXMax, 0, 100, rigScale)
    var faceYRange = resolveMotionRangePixels(height, window.faceYMin, window.faceYMax, 0, 100, rigScale)
    var bodyRotateRange = resolveMotionRangePixels(width, window.bodyRotateMin, window.bodyRotateMax, 0, 100, rigScale)
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

  function resolveAutoSeedPoint(fallbackX, fallbackY, fallbackRotateX) {
    var width = document.body.clientWidth
    var height = document.body.clientHeight
    var seedFaceX = Number.isFinite(autoFaceX)
      ? autoFaceX
      : (Number.isFinite(fallbackX) ? fallbackX : width / 2)
    var seedFaceY = Number.isFinite(autoFaceY)
      ? autoFaceY
      : (Number.isFinite(fallbackY) ? fallbackY : height / 2)
    var seedRotateX = Number.isFinite(autoRotateX)
      ? autoRotateX
      : (Number.isFinite(fallbackRotateX) ? fallbackRotateX : seedFaceX)
    return {
      faceX: clampFaceRigX(seedFaceX),
      faceY: clampFaceRigY(seedFaceY),
      rotateX: clampBodyRotateRigX(seedRotateX)
    }
  }

  function applyBasicRigPose(xDelta, yDelta, rotateDelta) {
    var backStyle = `top: ${-yDelta * 10}px;`
    applyRigStyles('back', { img: backStyle })

    var bangDivLStyle = `width: calc(min(${50 + xDelta * 10}vw, ${50 + xDelta * 10}dvh) + 1px);`
    var bangDivRStyle = `width: calc(min(${50 - xDelta * 10}vw, ${50 - xDelta * 10}dvh) + 1px); left: calc(min(${50 + xDelta * 10}vw, ${50 + xDelta * 10}dvh) - 1px);`
    var bangImgLStyle = `width: min(${100 + xDelta * 20}vw, ${100 + xDelta * 20}dvh); top: ${yDelta * 20}px;`
    var bangImgRStyle = `width: min(${100 - xDelta * 20}vw, ${100 - xDelta * 20}dvh);top: ${yDelta * 20}px;`
    applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

    var eyesDivLStyle = `width: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) + 1px);`
    var eyesDivRStyle = `width: calc(min(${50 - xDelta * 15}vw, ${50 - xDelta * 15}dvh) + 1px); left: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) - 1px);`
    var eyesImgLStyle = `width: min(${100 + xDelta * 20}vw, ${100 + xDelta * 20}dvh);top: ${yDelta * 30}px;`
    var eyesImgRStyle = `width: min(${100 - xDelta * 20}vw, ${100 - xDelta * 20}dvh);top: ${yDelta * 30}px;`
    applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

    var mouthCenter = 50 + xDelta * mouthSplitDivFactor
    var mouthCenterSize = `min(${mouthCenter}vw, ${mouthCenter}dvh)`
    var mouthMirrorSize = `min(${100 - mouthCenter}vw, ${100 - mouthCenter}dvh)`
    var mouthDivLStyle = `width: calc(${mouthCenterSize} + ${mouthSeamOverlapPx}px);`
    var mouthDivRStyle = `width: calc(${mouthMirrorSize} + ${mouthSeamOverlapPx}px); left: calc(${mouthCenterSize} - ${mouthSeamOverlapPx}px);`
    var mouthImgLStyle = `width: min(${100 + xDelta * mouthSplitImgFactor}vw, ${100 + xDelta * mouthSplitImgFactor}dvh);top: ${yDelta * 20}px;`
    var mouthImgRStyle = `width: min(${100 - xDelta * mouthSplitImgFactor}vw, ${100 - xDelta * mouthSplitImgFactor}dvh);top: ${yDelta * 20}px;`
    applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

    var faceDivLStyle = `width: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) + 1px);`
    var faceDivRStyle = `width: calc(min(${50 - xDelta * 15}vw, ${50 - xDelta * 15}dvh) + 1px); left: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) - 1px);`
    var faceImgLStyle = `width: min(${100 + xDelta * 15}vw, ${100 + xDelta * 15}dvh);top: ${yDelta * 10}px;`
    var faceImgRStyle = `width: min(${100 - xDelta * 15}vw, ${100 - xDelta * 15}dvh);top: ${yDelta * 10}px;`
    applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

    setCharacterTransform(rotateDelta * bodyRotateRangeDeg)
  }

  function applyScaledRigPose(xDelta, yDelta, rotateDelta, scaleY, scaleX, scaleNegX) {
    var normalizedScaleY = Number.isFinite(scaleY) ? scaleY : 1
    var normalizedScaleX = Number.isFinite(scaleX) ? scaleX : 1
    var normalizedScaleNegX = Number.isFinite(scaleNegX) ? scaleNegX : 1
    var backStyle = `height: ${100 * normalizedScaleY}dvh; left: min(${50 - 50 * normalizedScaleX}vw, ${50 - 50 * normalizedScaleX}dvh); width: min(${100 * normalizedScaleX}vw, ${100 * normalizedScaleX}dvh); top: ${-yDelta * 10}px;`
    applyRigStyles('back', { img: backStyle })

    var bangDivLStyle = `width: calc(min(${50 + xDelta * 10}vw, ${50 + xDelta * 10}dvh) + 1px);`
    var bangDivRStyle = `width: calc(min(${50 - xDelta * 10}vw, ${50 - xDelta * 10}dvh) + 1px); left: calc(min(${50 + xDelta * 10}vw, ${50 + xDelta * 10}dvh) - 1px);`
    var bangImgLStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${(100 + xDelta * 20) * normalizedScaleNegX}vw, ${(100 + xDelta * 20) * normalizedScaleNegX}dvh); top: ${yDelta * 20}px;`
    var bangImgRStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${(100 - xDelta * 20) * normalizedScaleX}vw, ${(100 - xDelta * 20) * normalizedScaleX}dvh);top: ${yDelta * 20}px;`
    applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

    var eyesDivLStyle = `width: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) + 1px);`
    var eyesDivRStyle = `width: calc(min(${50 - xDelta * 15}vw, ${50 - xDelta * 15}dvh) + 1px); left: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) - 1px);`
    var eyesImgLStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${(100 + xDelta * 20) * normalizedScaleNegX}vw, ${(100 + xDelta * 20) * normalizedScaleNegX}dvh);top: ${yDelta * 30}px;`
    var eyesImgRStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${(100 - xDelta * 20) * normalizedScaleX}vw, ${(100 - xDelta * 20) * normalizedScaleX}dvh);top: ${yDelta * 30}px;`
    applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

    var mouthCenter = 50 + xDelta * mouthSplitDivFactor
    var mouthCenterSize = `min(${mouthCenter}vw, ${mouthCenter}dvh)`
    var mouthMirrorSize = `min(${100 - mouthCenter}vw, ${100 - mouthCenter}dvh)`
    var mouthDivLStyle = `width: calc(${mouthCenterSize} + ${mouthSeamOverlapPx}px);`
    var mouthDivRStyle = `width: calc(${mouthMirrorSize} + ${mouthSeamOverlapPx}px); left: calc(${mouthCenterSize} - ${mouthSeamOverlapPx}px);`
    var mouthImgLStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${100 + xDelta * mouthSplitImgFactor}vw, ${100 + xDelta * mouthSplitImgFactor}dvh);top: ${yDelta * 20}px;`
    var mouthImgRStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${100 - xDelta * mouthSplitImgFactor}vw, ${100 - xDelta * mouthSplitImgFactor}dvh);top: ${yDelta * 20}px;`
    applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

    var faceDivLStyle = `width: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) + 1px);`
    var faceDivRStyle = `width: calc(min(${50 - xDelta * 15}vw, ${50 - xDelta * 15}dvh) + 1px); left: calc(min(${50 + xDelta * 15}vw, ${50 + xDelta * 15}dvh) - 1px);`
    var faceImgLStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${(100 + xDelta * 15) * normalizedScaleNegX}vw, ${(100 + xDelta * 15) * normalizedScaleNegX}dvh);top: ${yDelta * 10}px;`
    var faceImgRStyle = `height: ${100 * normalizedScaleY}dvh; width: min(${(100 - xDelta * 15) * normalizedScaleX}vw, ${(100 - xDelta * 15) * normalizedScaleX}dvh);top: ${yDelta * 10}px;`
    applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

    setCharacterTransform(rotateDelta * bodyRotateRangeDeg)
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
      var rigPose = resolveClampedRigPose(X, Y, rotateX)
      applyBasicRigPose(rigPose.xDelta, rigPose.yDelta, rigPose.rotateDelta)
      }, i*12/20);
    }
    if (!cameraEnabled && isAutoMotionEnabled()) {
      autoRig = setTimeout(scheduleAutoRig, currentInterval)
    }
  }

audio()

let lastX = 0
let lastY = 0
var stiffness = 0.07
var damping = 0.8
let X = lastX
let Y = lastY
let velocity = 0

function scheduleAutoRigFromPointer(fallbackX, fallbackY, fallbackRotateX) {
  if (cameraEnabled || !isAutoMotionEnabled()) {
    return
  }
  clearAutoFrameTimers()
  var currentInterval = pickRandomInterval()
  var intervals = buildIntervals(currentInterval)
  var seedPoint = resolveAutoSeedPoint(fallbackX, fallbackY, fallbackRotateX)
  let X = seedPoint.faceX
  let Y = seedPoint.faceY
  let rotateX = seedPoint.rotateX
  var targetPoint = pickAutoTargetPoint()
  randomX = clampFaceRigX(targetPoint.faceX)
  randomY = clampFaceRigY(targetPoint.faceY)
  let velocityX = (randomX - X) * stiffness * damping
  let velocityY = (randomY - Y) * stiffness * damping
  let velocityRotateX = (clampBodyRotateRigX(targetPoint.rotateX) - rotateX) * stiffness * damping
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
    var currentScaleX = 1 - squashStretch;
    var currentScaleNegX = 1 + squashStretch;
    var rigPose = resolveClampedRigPose(X, Y, rotateX)
    applyScaledRigPose(rigPose.xDelta, rigPose.yDelta, rigPose.rotateDelta, currentScaleY, currentScaleX, currentScaleNegX)
    }, i*12/20);
  }
  if (!cameraEnabled && isAutoMotionEnabled()) {
    autoRig = setTimeout(() => {
      scheduleAutoRigFromPointer(fallbackX, fallbackY, fallbackRotateX)
    }, currentInterval)
  }
}

function syncAutoMotionRigState() {
  stopAutoRig()
  clearTimeout(autoResumeTimer)
  if (cameraEnabled || !isAutoMotionEnabled()) {
    return
  }
  scheduleAutoRigFromPointer(
    lastX || document.body.clientWidth / 2,
    lastY || document.body.clientHeight / 2,
    lastX || document.body.clientWidth / 2
  )
}

window.syncAutoMotionRigState = syncAutoMotionRigState
syncAutoMotionRigState()

function applyRigFromPoint(pointX, pointY, velocityX, rotateX) {
  var clampedPointX = clampFaceRigX(pointX)
  var clampedPointY = clampFaceRigY(pointY)
  var clampedRotateX = clampBodyRotateRigX(Number.isFinite(rotateX) ? rotateX : pointX)
  pointX = clampedPointX
  pointY = clampedPointY
  rememberAutoPose(pointX, pointY, clampedRotateX)
  var squashStretchM = Math.abs(velocityX) * 0.0005
  var currentScaleYM = 1 + 2 * squashStretchM
  var currentScaleXM = 1 - 4 * squashStretchM
  var currentScaleNegXM = 1 + 4 * squashStretchM

  var rigPose = resolveClampedRigPose(pointX, pointY, clampedRotateX)
  applyScaledRigPose(rigPose.xDelta, rigPose.yDelta, rigPose.rotateDelta, currentScaleYM, currentScaleXM, currentScaleNegXM)
}

document.addEventListener('mousemove', function(e) {
  if (cameraEnabled) {
    return
  }
  stopAutoRig()

  var nextX = clampFaceRigX(e.clientX)
  var nextY = clampFaceRigY(e.clientY)
  X = nextX
  Y = nextY
  velocity = (lastX - nextX) * stiffness * damping

  applyRigFromPoint(nextX, nextY, velocity, e.clientX)

  lastX = nextX
  lastY = nextY

  randomX = NaN
  randomY = NaN

  scheduleAutoResume(nextX, nextY, e.clientX)
})


