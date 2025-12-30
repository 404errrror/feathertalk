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

function applyStoredInputs(part, values) {
  if (!Array.isArray(values)) {
    return
  }
  for (let i = 0; i < SLOT_COUNT; i++) {
    const id = slotId(i)
    const input = document.querySelector(`#${part.id}${id}`)
    if (!input) {
      continue
    }
    const normalizedValue = normalizeAssetPath(values[i])
    if (normalizedValue && normalizedValue !== part.defaultSrc) {
      input.value = normalizedValue
    } else {
      input.value = ''
    }
  }
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
        input.value = result
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
parts.forEach(function(part) {
  storedParts[part.key] = loadPartArray(part)
})

parts.forEach(function(part) {
  applyStoredInputs(part, storedParts[part.key])
})

parts.forEach(function(part) {
  for (let i = 0; i < SLOT_COUNT; i++) {
    document.querySelector(`#${part.id}${i}`).addEventListener('input', function(e) {
      const target = e.target
      target.dataset.touched = '1'
      const resolvedSrc = resolveInputSrc(part, target.value)
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
    const currentValues = storedParts[part.key] || new Array(SLOT_COUNT).fill(part.defaultSrc)
    const values = new Array(SLOT_COUNT)

    for (let i = 0; i < SLOT_COUNT; i++) {
      const id = slotId(i)
      const input = document.querySelector(`#${part.id}${id}`)
      const inputValue = input.value
      const touched = input.dataset.touched === '1'
      values[i] = touched ? resolveInputSrc(part, inputValue) : currentValues[i]
    }

    localStorage.setItem(storageKey, JSON.stringify(values))
  })

  location.href = 'live.html'
})
