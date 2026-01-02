const SLOT_COUNT = 10
const STORAGE_KEY = 'ftLayers'
const DEFAULT_SRC = 'assets/transparent.png'

const slotId = (index) => (index + 1) % SLOT_COUNT
const rigOptions = ['bang', 'eyes', 'mouth', 'face', 'body', 'back']
const roleOptions = ['none', 'blink', 'mouth']
const roleLabels = {
  none: '없음',
  blink: '눈(깜박임)',
  mouth: '입(말하기)'
}
const altLabels = {
  blink: '눈 감음',
  mouth: '입 열림'
}

let layerIdSeed = Date.now()

function createLayerId() {
  layerIdSeed += 1
  return `layer-${layerIdSeed}`
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

function resolveInputSrc(value, fallback) {
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (!trimmed) {
    return fallback
  }
  return normalizeAssetPath(trimmed)
}

function readLegacyArray(key, fallback) {
  const stored = localStorage.getItem(key)
  let values
  if (!stored) {
    values = new Array(SLOT_COUNT).fill(fallback)
  } else if (stored[0] !== '[') {
    values = new Array(SLOT_COUNT).fill(normalizeAssetPath(stored))
  } else {
    const parsed = JSON.parse(stored)
    values = Array.isArray(parsed) ? parsed : new Array(SLOT_COUNT).fill(fallback)
  }
  const normalized = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const value = Array.isArray(values) ? values[i] : values
    const normalizedValue = normalizeAssetPath(value)
    normalized[i] = normalizedValue == null ? fallback : normalizedValue
  }
  return normalized
}

function readLegacyDisplayArray(key) {
  const stored = localStorage.getItem(key)
  let values
  if (!stored) {
    values = new Array(SLOT_COUNT).fill('')
  } else if (stored[0] !== '[') {
    values = new Array(SLOT_COUNT).fill(stored)
  } else {
    const parsed = JSON.parse(stored)
    values = Array.isArray(parsed) ? parsed : new Array(SLOT_COUNT).fill('')
  }
  const normalized = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const value = Array.isArray(values) ? values[i] : values
    normalized[i] = typeof value === 'string' ? value : ''
  }
  return normalized
}

function normalizeLayer(layer, fallback) {
  const base = layer || {}
  const fallbackLayer = fallback || {}
  const src = resolveInputSrc(base.src, fallbackLayer.src || DEFAULT_SRC)
  const altSrc = resolveInputSrc(base.altSrc, fallbackLayer.altSrc || '')
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
    src,
    display: typeof base.display === 'string' ? base.display : (fallbackLayer.display || ''),
    rig,
    role,
    altSrc,
    altDisplay: typeof base.altDisplay === 'string' ? base.altDisplay : (fallbackLayer.altDisplay || '')
  }
}

function buildLegacyLayers() {
  const bangArray = readLegacyArray('ftBang', 'assets/bang.png')
  const eyesArray = readLegacyArray('ftEyes', 'assets/eyes.png')
  const eyesClosedArray = readLegacyArray('ftEyesClosed', 'assets/eyesclosed.png')
  const mouthArray = readLegacyArray('ftMouth', 'assets/mouth.png')
  const mouthOpenArray = readLegacyArray('ftMouthOpen', 'assets/mouthopen.png')
  const faceArray = readLegacyArray('ftFace', 'assets/face.png')
  const bodyArray = readLegacyArray('ftBody', 'assets/body.png')
  const backArray = readLegacyArray('ftBack', 'assets/back.png')

  const bangDisplay = readLegacyDisplayArray('ftBangDisplay')
  const eyesDisplay = readLegacyDisplayArray('ftEyesDisplay')
  const eyesClosedDisplay = readLegacyDisplayArray('ftEyesClosedDisplay')
  const mouthDisplay = readLegacyDisplayArray('ftMouthDisplay')
  const mouthOpenDisplay = readLegacyDisplayArray('ftMouthOpenDisplay')
  const faceDisplay = readLegacyDisplayArray('ftFaceDisplay')
  const bodyDisplay = readLegacyDisplayArray('ftBodyDisplay')
  const backDisplay = readLegacyDisplayArray('ftBackDisplay')

  const slots = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    slots[i] = [
      {
        id: createLayerId(),
        src: bangArray[i],
        display: bangDisplay[i],
        rig: 'bang',
        role: 'none'
      },
      {
        id: createLayerId(),
        src: mouthArray[i],
        display: mouthDisplay[i],
        rig: 'mouth',
        role: 'mouth',
        altSrc: mouthOpenArray[i],
        altDisplay: mouthOpenDisplay[i]
      },
      {
        id: createLayerId(),
        src: eyesArray[i],
        display: eyesDisplay[i],
        rig: 'eyes',
        role: 'blink',
        altSrc: eyesClosedArray[i],
        altDisplay: eyesClosedDisplay[i]
      },
      {
        id: createLayerId(),
        src: faceArray[i],
        display: faceDisplay[i],
        rig: 'face',
        role: 'none'
      },
      {
        id: createLayerId(),
        src: bodyArray[i],
        display: bodyDisplay[i],
        rig: 'body',
        role: 'none'
      },
      {
        id: createLayerId(),
        src: backArray[i],
        display: backDisplay[i],
        rig: 'back',
        role: 'none'
      }
    ]
  }
  return slots
}

function loadLayerSlots() {
  const stored = localStorage.getItem(STORAGE_KEY)
  let slots
  if (stored && stored[0] === '[') {
    const parsed = JSON.parse(stored)
    slots = Array.isArray(parsed) ? parsed : null
  }
  if (!slots) {
    slots = buildLegacyLayers()
  }
  const normalizedSlots = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slotLayers = Array.isArray(slots[i]) ? slots[i] : []
    normalizedSlots[i] = slotLayers.map(function(layer) {
      return normalizeLayer(layer)
    })
    if (!normalizedSlots[i].length) {
      normalizedSlots[i] = [normalizeLayer({ src: DEFAULT_SRC, rig: 'face', role: 'none' })]
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSlots))
  return normalizedSlots
}

function setInputFromLayer(input, src, display) {
  const hasDisplay = typeof display === 'string' && display.trim()
  if (hasDisplay && display !== src) {
    input.value = display
    input.dataset.actualSrc = src
    input.dataset.displayValue = display
  } else if (src && src !== DEFAULT_SRC) {
    input.value = src
    delete input.dataset.actualSrc
    delete input.dataset.displayValue
  } else {
    input.value = ''
    delete input.dataset.actualSrc
    delete input.dataset.displayValue
  }
}

function readInputValue(input, fallbackSrc) {
  const displayValue = input.value
  if (input.dataset.actualSrc && input.dataset.displayValue === displayValue) {
    return { actual: resolveInputSrc(input.dataset.actualSrc, fallbackSrc), display: displayValue }
  }
  if (input.dataset.actualSrc) {
    delete input.dataset.actualSrc
    delete input.dataset.displayValue
  }
  const resolved = resolveInputSrc(displayValue, fallbackSrc)
  return { actual: resolved, display: displayValue }
}

function setupFilePicker(input) {
  if (!input || input.dataset.filePicker === '1') {
    return
  }
  input.dataset.filePicker = '1'
  const parent = input.parentElement
  if (!parent) {
    return
  }

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'file-button'
  button.textContent = '파일'
  button.setAttribute('aria-label', '파일 선택')

  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.className = 'file-input'

  button.addEventListener('click', function() {
    fileInput.click()
  })

  fileInput.addEventListener('change', function() {
    const file = fileInput.files && fileInput.files[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = function() {
      const result = reader.result
      if (typeof result === 'string') {
        input.dataset.actualSrc = result
        input.dataset.displayValue = file.name
        input.value = file.name
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
      fileInput.value = ''
    }
    reader.readAsDataURL(file)
  })

  parent.appendChild(button)
  parent.appendChild(fileInput)
}

function buildSelect(labelText, options, value) {
  const row = document.createElement('div')
  row.className = 'layer-row'
  const label = document.createElement('label')
  label.textContent = labelText
  const select = document.createElement('select')
  select.className = 'layer-select'
  options.forEach(function(optionValue) {
    const option = document.createElement('option')
    option.value = optionValue
    option.textContent = roleLabels[optionValue] || optionValue
    select.appendChild(option)
  })
  select.value = value
  row.appendChild(label)
  row.appendChild(select)
  return { row, select, label }
}

function updateAltRow(role, row, label) {
  if (role === 'blink' || role === 'mouth') {
    row.classList.remove('is-hidden')
    label.textContent = altLabels[role]
  } else {
    row.classList.add('is-hidden')
    label.textContent = altLabels.blink
  }
}

function buildLayerItem(slotIndex, layer, layerIndex, slotLayers) {
  const item = document.createElement('div')
  item.className = 'layer-item'

  const preview = document.createElement('img')
  preview.className = 'layer-preview'
  preview.src = layer.src || DEFAULT_SRC

  const fields = document.createElement('div')
  fields.className = 'layer-fields'

  const srcRow = document.createElement('div')
  srcRow.className = 'layer-row'
  const srcLabel = document.createElement('label')
  srcLabel.textContent = '이미지'
  const srcInputRow = document.createElement('div')
  srcInputRow.className = 'input-row'
  const srcInput = document.createElement('input')
  srcInput.type = 'text'
  srcInput.placeholder = '이미지 주소'
  setInputFromLayer(srcInput, layer.src, layer.display)
  srcInputRow.appendChild(srcInput)
  srcRow.appendChild(srcLabel)
  srcRow.appendChild(srcInputRow)
  setupFilePicker(srcInput)

  const rigSelect = buildSelect('Rig', rigOptions, layer.rig)
  const roleSelect = buildSelect('표정', roleOptions, layer.role)

  const altRow = document.createElement('div')
  altRow.className = 'layer-row'
  const altLabel = document.createElement('label')
  altLabel.textContent = altLabels.blink
  const altInputRow = document.createElement('div')
  altInputRow.className = 'input-row'
  const altInput = document.createElement('input')
  altInput.type = 'text'
  altInput.placeholder = '표정 이미지 주소'
  setInputFromLayer(altInput, layer.altSrc, layer.altDisplay)
  altInputRow.appendChild(altInput)
  altRow.appendChild(altLabel)
  altRow.appendChild(altInputRow)
  setupFilePicker(altInput)
  updateAltRow(layer.role, altRow, altLabel)

  const actions = document.createElement('div')
  actions.className = 'layer-actions'
  const upButton = document.createElement('button')
  upButton.type = 'button'
  upButton.className = 'layer-btn'
  upButton.textContent = '위'
  upButton.disabled = layerIndex === 0
  const downButton = document.createElement('button')
  downButton.type = 'button'
  downButton.className = 'layer-btn'
  downButton.textContent = '아래'
  downButton.disabled = layerIndex === slotLayers.length - 1
  const deleteButton = document.createElement('button')
  deleteButton.type = 'button'
  deleteButton.className = 'layer-btn layer-btn--danger'
  deleteButton.textContent = '삭제'

  actions.appendChild(upButton)
  actions.appendChild(downButton)
  actions.appendChild(deleteButton)

  fields.appendChild(srcRow)
  fields.appendChild(rigSelect.row)
  fields.appendChild(roleSelect.row)
  fields.appendChild(altRow)
  fields.appendChild(actions)

  item.appendChild(preview)
  item.appendChild(fields)

  srcInput.addEventListener('input', function() {
    const resolved = readInputValue(srcInput, DEFAULT_SRC)
    layer.src = resolved.actual
    layer.display = resolved.display
    preview.src = layer.src || DEFAULT_SRC
  })

  altInput.addEventListener('input', function() {
    const resolved = readInputValue(altInput, '')
    layer.altSrc = resolved.actual
    layer.altDisplay = resolved.display
  })

  rigSelect.select.addEventListener('change', function() {
    layer.rig = rigSelect.select.value
  })

  roleSelect.select.addEventListener('change', function() {
    layer.role = roleSelect.select.value
    updateAltRow(layer.role, altRow, altLabel)
  })

  upButton.addEventListener('click', function() {
    if (layerIndex === 0) {
      return
    }
    const temp = slotLayers[layerIndex - 1]
    slotLayers[layerIndex - 1] = slotLayers[layerIndex]
    slotLayers[layerIndex] = temp
    renderSlot(slotIndex)
  })

  downButton.addEventListener('click', function() {
    if (layerIndex >= slotLayers.length - 1) {
      return
    }
    const temp = slotLayers[layerIndex + 1]
    slotLayers[layerIndex + 1] = slotLayers[layerIndex]
    slotLayers[layerIndex] = temp
    renderSlot(slotIndex)
  })

  deleteButton.addEventListener('click', function() {
    slotLayers.splice(layerIndex, 1)
    if (!slotLayers.length) {
      slotLayers.push(normalizeLayer({ src: DEFAULT_SRC, rig: 'face', role: 'none' }))
    }
    renderSlot(slotIndex)
  })

  return item
}

function slotIndexFromId(value) {
  const id = parseInt(value, 10)
  if (Number.isNaN(id)) {
    return 0
  }
  return (id + SLOT_COUNT - 1) % SLOT_COUNT
}

function renderSlot(slotIndex) {
  const id = slotId(slotIndex)
  const container = document.querySelector(`#layers${id}`)
  if (!container) {
    return
  }
  container.innerHTML = ''
  const slotLayers = layerSlots[slotIndex] || []
  slotLayers.forEach(function(layer, index) {
    container.appendChild(buildLayerItem(slotIndex, layer, index, slotLayers))
  })
}

function renderAllSlots() {
  for (let i = 0; i < SLOT_COUNT; i++) {
    renderSlot(i)
  }
}

const layerSlots = loadLayerSlots()
renderAllSlots()

document.querySelectorAll('.layer-add').forEach(function(button) {
  button.addEventListener('click', function() {
    const slotIndex = slotIndexFromId(button.dataset.slot)
    const newLayer = normalizeLayer({ src: DEFAULT_SRC, rig: 'face', role: 'none' })
    layerSlots[slotIndex].unshift(newLayer)
    renderSlot(slotIndex)
  })
})

for (let i = 0; i < SLOT_COUNT; i++) {
  document.querySelector(`#tab${i}`).addEventListener('click', function() {
    if (document.querySelector(`#form${i}`)) {
      document.querySelector('.selected').classList.remove('selected')
      document.querySelector('.activated').classList.remove('activated')
      document.querySelector(`#tab${i}`).classList.add('selected')
      document.querySelector(`#form${i}`).classList.add('activated')
    }
  })
}

document.querySelector('#submit').addEventListener('click', function() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layerSlots))
  location.href = 'live.html'
})
