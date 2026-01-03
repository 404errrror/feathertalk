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
    if (cameraEnabled) {
      return
    }
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
    if (!cameraEnabled) {
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
  if (cameraEnabled) {
    return
  }
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
  if (!cameraEnabled) {
    autoRig = setTimeout(() => {
      scheduleAutoRigFromPointer(fallbackX, fallbackY)
    }, currentInterval)
  }
}

function applyRigFromPoint(pointX, pointY, velocityX, rotateX) {
  var squashStretchM = Math.abs(velocityX) * 0.0005; // 0.1 강도 조절값
  var currentScaleYM = 1 + 2 * squashStretchM; // 위아래로 늘어짐
  var currentScaleNegYM = 1 - 2 * squashStretchM; // 위아래로 줄어듦
  var currentScaleXM = 1 - 4 * squashStretchM; // 좌우로 줄어듦(부피 보존)
  var currentScaleNegXM = 1 + 4 * squashStretchM; // 좌우로 늘어남(부피 보존)

  var backStyle = `height: ${100 * currentScaleYM}dvh; left: min(${50 - 50 * currentScaleXM}vw, ${50 - 50 * currentScaleXM}dvh); width: min(${100 * currentScaleXM}vw, ${100 * currentScaleXM}dvh); top: ${(5 - (pointY / document.body.clientHeight) * 10) * rig / 100}px;`
  applyRigStyles('back', { img: backStyle })

  var bangDivLStyle = `width: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
  var bangDivRStyle = `width: min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh); left: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 5 * rig / 50}dvh);`
  var bangImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}vw, ${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}dvh); top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  var bangImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}vw, ${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}dvh);top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  applyRigStyles('bang', { divL: bangDivLStyle, divR: bangDivRStyle, imgL: bangImgLStyle, imgR: bangImgRStyle })

  var eyesDivLStyle = `width: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
  var eyesDivRStyle = `width: min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
  var eyesImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}vw, ${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleNegXM}dvh);top: ${(-15 + (pointY / document.body.clientHeight) * 30) * rig / 100}px;`
  var eyesImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}vw, ${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100) * currentScaleXM}dvh);top: ${(-15 + (pointY / document.body.clientHeight) * 30) * rig / 100}px;`
  applyRigStyles('eyes', { divL: eyesDivLStyle, divR: eyesDivRStyle, imgL: eyesImgLStyle, imgR: eyesImgRStyle })

  var mouthDivLStyle = `width: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
  var mouthDivRStyle = `width: min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
  var mouthImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  var mouthImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}vw, ${100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 20 * rig / 100}dvh);top: ${(-10 + (pointY / document.body.clientHeight) * 20) * rig / 100}px;`
  applyRigStyles('mouth', { divL: mouthDivLStyle, divR: mouthDivRStyle, imgL: mouthImgLStyle, imgR: mouthImgRStyle })

  var faceDivLStyle = `width: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
  var faceDivRStyle = `width: min(${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh); left: min(${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}vw, ${50 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 7.5 * rig / 50}dvh);`
  var faceImgLStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegXM}vw, ${(100 + (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleNegXM}dvh);top: ${(-5 + (pointY / document.body.clientHeight) * 10) * rig / 100}px;`
  var faceImgRStyle = `height: ${100 * currentScaleYM}dvh; width: min(${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleXM}vw, ${(100 - (pointX - document.body.clientWidth / 2) / document.body.clientWidth * 15 * rig / 100) * currentScaleXM}dvh);top: ${(-5 + (pointY / document.body.clientHeight) * 10) * rig / 100}px;`
  applyRigStyles('face', { divL: faceDivLStyle, divR: faceDivRStyle, imgL: faceImgLStyle, imgR: faceImgRStyle })

  var rotateSourceX = Number.isFinite(rotateX) ? rotateX : pointX
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

  randomX = 0
  randomY = 0

  scheduleAutoResume(X, Y)
})

