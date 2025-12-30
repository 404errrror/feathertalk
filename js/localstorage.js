const SLOT_COUNT = 10
const slotId = (index) => (index + 1) % SLOT_COUNT

const parts = [
  { key: 'Bang', id: 'bang', defaultSrc: 'assets/bang.png' },
  { key: 'Eyes', id: 'eyes', defaultSrc: 'assets/eyes.png' },
  { key: 'EyesClosed', id: 'eyesclosed', defaultSrc: 'assets/eyesclosed.png' },
  { key: 'Mouth', id: 'mouth', defaultSrc: 'assets/mouth.png' },
  { key: 'MouthOpen', id: 'mouthopen', defaultSrc: 'assets/mouthopen.png' },
  { key: 'Face', id: 'face', defaultSrc: 'assets/face.png' },
  { key: 'Body', id: 'body', defaultSrc: 'assets/body.png' },
  { key: 'Back', id: 'back', defaultSrc: 'assets/back.png' }
]

function normalizeAssetPath(value) {
  if (typeof value !== 'string') {
    return value
  }
  if (value.indexOf('/assets/') === 0) {
    return value.slice(1)
  }
  return value
}

function resolveInputSrc(part, value) {
  const trimmed = typeof value === 'string' ? value.trim() : value
  if (!trimmed) {
    return part.defaultSrc
  }
  return normalizeAssetPath(trimmed)
}

function loadPartArray(part) {
  const storageKey = `ft${part.key}`
  const stored = localStorage.getItem(storageKey)
  let values

  if (!stored) {
    values = new Array(SLOT_COUNT).fill(part.defaultSrc)
  } else if (stored[0] !== '[') {
    values = new Array(SLOT_COUNT).fill(normalizeAssetPath(stored))
  } else {
    values = JSON.parse(stored)
  }

  const normalized = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const value = Array.isArray(values) ? values[i] : values
    const normalizedValue = normalizeAssetPath(value)
    normalized[i] = normalizedValue == null ? part.defaultSrc : normalizedValue
  }

  localStorage.setItem(storageKey, JSON.stringify(normalized))

  for (let i = 0; i < SLOT_COUNT; i++) {
    const id = slotId(i)
    document.querySelector(`#${part.id}_img${id}`).setAttribute('src', normalized[i])
  }

  return normalized
}

function loadDisplayArray(part, values) {
  const storageKey = `ft${part.key}Display`
  const stored = localStorage.getItem(storageKey)
  let storedValues

  if (!stored) {
    storedValues = Array.isArray(values) ? values.slice() : new Array(SLOT_COUNT).fill('')
  } else if (stored[0] !== '[') {
    storedValues = new Array(SLOT_COUNT).fill(stored)
  } else {
    storedValues = JSON.parse(stored)
  }

  const normalized = new Array(SLOT_COUNT)
  for (let i = 0; i < SLOT_COUNT; i++) {
    const value = Array.isArray(storedValues) ? storedValues[i] : storedValues
    normalized[i] = typeof value === 'string' ? value : ''
  }

  localStorage.setItem(storageKey, JSON.stringify(normalized))

  return normalized
}

function applyStoredInputs(part, values, displayValues) {
  if (!Array.isArray(values)) {
    return
  }
  const displayArray = Array.isArray(displayValues) ? displayValues : values
  for (let i = 0; i < SLOT_COUNT; i++) {
    const id = slotId(i)
    const input = document.querySelector(`#${part.id}${id}`)
    if (!input) {
      continue
    }
    const actualValue = normalizeAssetPath(values[i])
    const displayValue = Array.isArray(displayArray) ? displayArray[i] : displayArray
    const trimmedDisplay = typeof displayValue === 'string' ? displayValue.trim() : ''
    if (trimmedDisplay && trimmedDisplay !== part.defaultSrc) {
      input.value = displayValue
    } else if (actualValue && actualValue !== part.defaultSrc) {
      input.value = actualValue
    } else {
      input.value = ''
    }

    if (trimmedDisplay && actualValue && trimmedDisplay !== actualValue) {
      input.dataset.actualSrc = actualValue
      input.dataset.displayValue = displayValue
    } else {
      delete input.dataset.actualSrc
      delete input.dataset.displayValue
    }
  }
}

function resolveInputValue(part, input) {
  const displayValue = input.value
  const displayMarker = input.dataset.displayValue
  if (input.dataset.actualSrc && displayMarker === displayValue) {
    return resolveInputSrc(part, input.dataset.actualSrc)
  }
  if (input.dataset.actualSrc) {
    delete input.dataset.actualSrc
    delete input.dataset.displayValue
  }
  return resolveInputSrc(part, displayValue)
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

  const row = document.createElement('div')
  row.className = 'input-row'
  parent.insertBefore(row, input)
  row.appendChild(input)

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

  row.appendChild(button)
  row.appendChild(fileInput)
}

const storedParts = {}
const storedDisplayParts = {}
parts.forEach(function(part) {
  storedParts[part.key] = loadPartArray(part)
})

parts.forEach(function(part) {
  storedDisplayParts[part.key] = loadDisplayArray(part, storedParts[part.key])
})

parts.forEach(function(part) {
  applyStoredInputs(part, storedParts[part.key], storedDisplayParts[part.key])
})

parts.forEach(function(part) {
  for (let i = 0; i < SLOT_COUNT; i++) {
    document.querySelector(`#${part.id}${i}`).addEventListener('input', function(e) {
      const target = e.target
      target.dataset.touched = '1'
      const resolvedSrc = resolveInputValue(part, target)
      document.querySelector(`#${part.id}_img${i}`).setAttribute('src', resolvedSrc)
    })
  }
})

document.querySelectorAll('.form input[type="text"]').forEach(function(input) {
  setupFilePicker(input)
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
  parts.forEach(function(part) {
    const storageKey = `ft${part.key}`
    const displayKey = `ft${part.key}Display`
    const currentValues = storedParts[part.key] || new Array(SLOT_COUNT).fill(part.defaultSrc)
    const currentDisplayValues = storedDisplayParts[part.key] || currentValues
    const values = new Array(SLOT_COUNT)
    const displayValues = new Array(SLOT_COUNT)

    for (let i = 0; i < SLOT_COUNT; i++) {
      const id = slotId(i)
      const input = document.querySelector(`#${part.id}${id}`)
      const touched = input.dataset.touched === '1'
      if (touched) {
        values[i] = resolveInputValue(part, input)
        displayValues[i] = input.value
      } else {
        values[i] = currentValues[i]
        displayValues[i] = currentDisplayValues[i]
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(values))
    localStorage.setItem(displayKey, JSON.stringify(displayValues))
  })

  location.href = 'live.html'
})
