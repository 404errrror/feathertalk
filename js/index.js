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

var interval = 1500
var length = parseInt(interval/20)
var intervals = Array.from({ length }, (_, k) => 0 + k * 20);
if (localStorage.getItem('ftInterval')) {
  interval = localStorage.getItem('ftInterval')
  length = parseInt(interval/20)
  intervals = Array.from({ length }, (_, k) => 0 + k * 20);
  document.querySelector('#interval').value=interval
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

document.querySelector('#interval').addEventListener('change', function(e){
  interval = e.target.value
  localStorage.setItem('ftInterval', interval)

  location.href=location.href;
})

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

var ftBangArray = readAssetArray('ftBang', 'assets/bang.png')
var ftEyesArray = readAssetArray('ftEyes', 'assets/eyes.png')
var ftEyesClosedArray = readAssetArray('ftEyesClosed', 'assets/eyesclosed.png')
var ftMouthArray = readAssetArray('ftMouth', 'assets/mouth.png')
var ftMouthOpenArray = readAssetArray('ftMouthOpen', 'assets/mouthopen.png')
var ftFaceArray = readAssetArray('ftFace', 'assets/face.png')
var ftBodyArray = readAssetArray('ftBody', 'assets/body.png')
var ftBackArray = readAssetArray('ftBack', 'assets/back.png')

let ftMouth = ftMouthArray[0]
let ftMouthOpen = ftMouthOpenArray[0]
let ftEyes = ftEyesArray[0]
let ftEyesClosed = ftEyesClosedArray[0]

function applyPreset(index) {
  document.querySelector('#bangl').setAttribute('src', ftBangArray[index])
  document.querySelector('#eyesl').setAttribute('src', ftEyesArray[index])
  document.querySelector('#mouthl').setAttribute('src', ftMouthArray[index])
  document.querySelector('#facel').setAttribute('src', ftFaceArray[index])
  document.querySelector('#bangr').setAttribute('src', ftBangArray[index])
  document.querySelector('#eyesr').setAttribute('src', ftEyesArray[index])
  document.querySelector('#mouthr').setAttribute('src', ftMouthArray[index])
  document.querySelector('#facer').setAttribute('src', ftFaceArray[index])
  document.querySelector('#body').setAttribute('src', ftBodyArray[index])
  document.querySelector('#back').setAttribute('src', ftBackArray[index])

  ftMouth = ftMouthArray[index]
  ftMouthOpen = ftMouthOpenArray[index]
  ftEyes = ftEyesArray[index]
  ftEyesClosed = ftEyesClosedArray[index]
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
  if (volume >= thres && now % 400 >= 200) {
    document.querySelector('#mouthl').setAttribute('src', ftMouthOpen)
    document.querySelector('#mouthr').setAttribute('src', ftMouthOpen)
  } else {
    document.querySelector('#mouthl').setAttribute('src', ftMouth)
    document.querySelector('#mouthr').setAttribute('src', ftMouth)
  }
  if (now % 3000 >= 2800) {
    document.querySelector('#eyesl').setAttribute('src', ftEyesClosed)
    document.querySelector('#eyesr').setAttribute('src', ftEyesClosed)
  } else {
    document.querySelector('#eyesl').setAttribute('src', ftEyes)
    document.querySelector('#eyesr').setAttribute('src', ftEyes)
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

  let autoRig = setInterval(async () => {
    
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
    for await (let i of intervals) {

      setTimeout(() => {
        
      var X = lastRandomX + (randomX - lastRandomX) * i / interval
      var Y = lastRandomY + (randomY - lastRandomY) * i / interval
      
      document.querySelector('#back').setAttribute('style', `top: ${(5 - (Y / document.body.clientHeight) * 10)*rig/100}px`)

      document.querySelector('#bangdivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh);`)

      document.querySelector('#bangdivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh);`)

      document.querySelector('#bangl').setAttribute('style', `width: min(${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#bangr').setAttribute('style', `width: min(${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)
      
      document.querySelector('#eyesdivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#eyesdivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#eyesl').setAttribute('style', `width: min(${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30)*rig/100}px;`)

      document.querySelector('#eyesr').setAttribute('style', `width: min(${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30)*rig/100}px;`)

      document.querySelector('#mouthdivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#mouthdivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#mouthl').setAttribute('style', `width: min(${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#mouthr').setAttribute('style', `width: min(${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#facedivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#facedivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#facel').setAttribute('style', `width: min(${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100}vw, ${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10)*rig/100}px;`)

      document.querySelector('#facer').setAttribute('style', `width: min(${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100}vw, ${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10)*rig/100}px;`)

      document.querySelector('#character').setAttribute('style', `transform: rotate(${(X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100}deg);`)
      }, i*12/20);
    }
  }, interval);
  
audio()

let lastX = 0
let lastY = 0
var stiffness = 0.07; // 강도 (높을수록 빠름)
var damping = 0.8;   // 감쇠 (낮을수록 더 많이 출렁임)
let X = lastX
let Y = lastY
let velocity = 0

document.addEventListener('mousemove',function(e){
    clearInterval(autoRig)

    X = e.clientX
    Y = e.clientY
    velocity = (lastX - X) * stiffness * damping;
    
    var squashStretchM = Math.abs(velocity) * 0.0005; // 0.1은 강도 조절용
    var currentScaleYM = 1 + 2*squashStretchM; // 위아래로 납작해짐
    var currentScaleNegYM = 1 - 2*squashStretchM; // 위아래로 납작해짐
    var currentScaleXM = 1 - 4* squashStretchM; // 좌우로 늘어남 (부피 유지)
    var currentScaleNegXM = 1 + 4* squashStretchM; // 좌우로 늘어남 (부피 유지)

      document.querySelector('#back').setAttribute('style', `height: ${100*currentScaleYM}dvh; left: min(${50 - 50*currentScaleXM}vw, ${50 - 50*currentScaleXM}dvh); width: min(${100*currentScaleXM}vw, ${100*currentScaleXM}dvh); top: ${(5 - (Y / document.body.clientHeight) * 10)*rig/100}px;`)

      document.querySelector('#bangdivl').setAttribute('style', `width: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh);`)

      document.querySelector('#bangdivr').setAttribute('style', `width: min(${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh);`)

      document.querySelector('#bangl').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegXM}vw, ${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegXM}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#bangr').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleXM}vw, ${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleXM}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)
      
      document.querySelector('#eyesdivl').setAttribute('style', `width: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#eyesdivr').setAttribute('style', `width: min(${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#eyesl').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegXM}vw, ${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegXM}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30)*rig/100}px;`)

      document.querySelector('#eyesr').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleXM}vw, ${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleXM}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30)*rig/100}px;`)

      document.querySelector('#mouthdivl').setAttribute('style', `width: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#mouthdivr').setAttribute('style', `width: min(${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#mouthl').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${100 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-10 + (e.clientY / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#mouthr').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${100 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-10 + (e.clientY / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#facedivl').setAttribute('style', `width: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#facedivr').setAttribute('style', `width: min(${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (e.clientX - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#facel').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleNegXM}vw, ${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleNegXM}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10)*rig/100}px;`)

      document.querySelector('#facer').setAttribute('style', `height: ${100*currentScaleYM}dvh; width: min(${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleXM}vw, ${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleXM}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10)*rig/100}px;`)

    document.querySelector('#character').setAttribute('style', `transform: rotate(${(e.clientX - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100}deg);`)


    lastX = e.clientX
    lastY = e.clientY

    randomX = 0
    randomY = 0

    autoRig = setInterval(async () => {

    var lastRandomX = randomX?randomX:e.clientX
    var lastRandomY = randomY?randomY:e.clientY
    randomX = Math.random() * document.body.clientWidth
    randomY = Math.random() * document.body.clientHeight
    
    function wait(sec) {
        let start = Date.now(), now = start;
        while (now - start < sec) {
            now = Date.now();
        }
    }
      let X = lastRandomX
      let Y = lastRandomY
      let velocity = (randomX - X) * stiffness * damping;
      let velocityY = (randomY - Y) * stiffness * damping;
    for await (let i of intervals) {

      setTimeout(() => {
        
      // var t = i / interval;
      // var elasticT = Math.sin(-13 * (Math.PI / 2) * (t + 1)) * Math.pow(2, -10 * t) + 1;    
      //var X = lastRandomX + (randomX - lastRandomX) * elasticT;
      //var Y = lastRandomY + (randomY - lastRandomY) * elasticT;
      velocity = (velocity + (randomX - X) * stiffness) * damping;
      velocityY = (randomY - Y) * stiffness * damping;
      X += velocity;
      Y += velocityY;
      var squashStretch = Math.abs(velocity) * 0.0005; // 0.1은 강도 조절용
      var currentScaleY = 1 + 0.5*squashStretch; // 위아래로 납작해짐
      var currentScaleNegY = 1 - 0.5*squashStretch; // 위아래로 납작해짐
      var currentScaleX = 1 - squashStretch; // 좌우로 늘어남 (부피 유지)
      var currentScaleNegX = 1 + squashStretch; // 좌우로 늘어남 (부피 유지)
      
      document.querySelector('#back').setAttribute('style', `height: ${100*currentScaleY}dvh; left: min(${50 - 50*currentScaleX}vw, ${50 - 50*currentScaleX}dvh); width: min(${100*currentScaleX}vw, ${100*currentScaleX}dvh); top: ${(5 - (Y / document.body.clientHeight) * 10)*rig/100}px`)

      document.querySelector('#bangdivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh);`)

      document.querySelector('#bangdivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*5*rig/50}dvh);`)

      document.querySelector('#bangl').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegX}dvh); top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#bangr').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleX}vw, ${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleX}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)
      
      document.querySelector('#eyesdivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#eyesdivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#eyesl').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleNegX}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30)*rig/100}px;`)

      document.querySelector('#eyesr').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleX}vw, ${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100)*currentScaleX}dvh);top: ${(-15 + (Y / document.body.clientHeight) * 30)*rig/100}px;`)

      document.querySelector('#mouthdivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#mouthdivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#mouthl').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 + (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#mouthr').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}vw, ${100 - (X - document.body.clientWidth/2)/document.body.clientWidth*20*rig/100}dvh);top: ${(-10 + (Y / document.body.clientHeight) * 20)*rig/100}px;`)

      document.querySelector('#facedivl').setAttribute('style', `width: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#facedivr').setAttribute('style', `width: min(${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 - (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh); left: min(${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}vw, ${50 + (X - document.body.clientWidth/2)/document.body.clientWidth*7.5*rig/50}dvh);`)

      document.querySelector('#facel').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleNegX}vw, ${(100 + (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleNegX}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10)*rig/100}px;`)

      document.querySelector('#facer').setAttribute('style', `height: ${100*currentScaleY}dvh; width: min(${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleX}vw, ${(100 - (X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100)*currentScaleX}dvh);top: ${(-5 + (Y / document.body.clientHeight) * 10)*rig/100}px;`)

      document.querySelector('#character').setAttribute('style', `transform: rotate(${(X - document.body.clientWidth/2)/document.body.clientWidth*15*rig/100}deg);`)
      }, i*12/20);
    }
  }, interval);
})
    
