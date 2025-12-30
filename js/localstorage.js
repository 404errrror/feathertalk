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

const storedParts = {}
parts.forEach(function(part) {
  storedParts[part.key] = loadPartArray(part)
})

parts.forEach(function(part) {
  for (let i = 0; i < SLOT_COUNT; i++) {
    document.querySelector(`#${part.id}${i}`).addEventListener('input', function(e) {
      document.querySelector(`#${part.id}_img${i}`).setAttribute('src', normalizeAssetPath(e.target.value))
    })
  }
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
      values[i] = inputValue ? normalizeAssetPath(inputValue) : currentValues[i]
    }

    localStorage.setItem(storageKey, JSON.stringify(values))
  })

  location.href = 'live.html'
})
