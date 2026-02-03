const layerSlots = loadLayerSlots()
renderAllSlots()

function saveLayerSlotsOrAlert() {
  const canSave = typeof trySaveLayerSlots === 'function' ? trySaveLayerSlots(layerSlots) : true
  if (!canSave) {
    alert('이미지 용량이 커서 브라우저 저장 공간을 초과했습니다. PNG 용량을 줄이거나 레이어 수를 줄인 뒤 다시 시도해주세요. 가능하면 이미지를 프로젝트 폴더에 두고 URL 입력(예: assets/BodyFront.png)으로 설정해 주세요.')
  }
  return canSave
}

function buildPresetPayload(slotIndex) {
  const slotLayers = Array.isArray(layerSlots[slotIndex]) ? layerSlots[slotIndex] : []
  const layers = slotLayers.map(function(layer) {
    const normalized = normalizeLayer(layer)
    return {
      src: normalized.src,
      display: normalized.display,
      rig: normalized.rig,
      role: normalized.role,
      rotate: normalized.rotate,
      rotatePivotY: normalized.rotatePivotY,
      altSrc: normalized.altSrc,
      altDisplay: normalized.altDisplay
    }
  })
  return {
    app: 'feather-talk',
    version: 1,
    slotId: slotId(slotIndex),
    createdAt: new Date().toISOString(),
    layers
  }
}

function normalizeImportedLayers(layers) {
  const normalized = []
  layers.forEach(function(layer) {
    if (!layer || typeof layer !== 'object') {
      return
    }
    const cleaned = Object.assign({}, layer)
    delete cleaned.id
    normalized.push(normalizeLayer(cleaned))
  })
  if (!normalized.length) {
    normalized.push(normalizeLayer({ rig: 'face', role: 'none' }))
  }
  return normalized
}

function parsePresetText(text) {
  const parsed = JSON.parse(text)
  if (Array.isArray(parsed)) {
    return { layers: parsed }
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.layers)) {
    return parsed
  }
  return null
}

function downloadPreset(payload, fileName) {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(function() {
    URL.revokeObjectURL(url)
  }, 1000)
}

document.querySelectorAll('.layer-add').forEach(function(button) {
  button.addEventListener('click', function() {
    const slotIndex = slotIndexFromId(button.dataset.slot)
    const newLayer = normalizeLayer({ rig: 'face', role: 'none' })
    layerSlots[slotIndex].unshift(newLayer)
    renderSlot(slotIndex)
  })
})

const presetExportButton = document.querySelector('#preset-export')
const presetImportButton = document.querySelector('#preset-import')
const presetImportInput = document.querySelector('#preset-import-file')
let currentSlotId = '1'

function syncCurrentSlotFromTab(tabId) {
  if (typeof tabId === 'string' && tabId.length) {
    currentSlotId = tabId
    return
  }
  const selected = document.querySelector('#tablist .selected')
  if (selected && typeof selected.id === 'string' && selected.id.indexOf('tab') === 0) {
    currentSlotId = selected.id.slice(3)
  }
}

syncCurrentSlotFromTab()

for (let i = 0; i < SLOT_COUNT; i++) {
  document.querySelector(`#tab${i}`).addEventListener('click', function() {
    if (document.querySelector(`#form${i}`)) {
      document.querySelector('.selected').classList.remove('selected')
      document.querySelector('.activated').classList.remove('activated')
      document.querySelector(`#tab${i}`).classList.add('selected')
      document.querySelector(`#form${i}`).classList.add('activated')
      syncCurrentSlotFromTab(String(i))
    }
  })
}

if (presetExportButton) {
  presetExportButton.addEventListener('click', function() {
    const slotIndex = slotIndexFromId(currentSlotId)
    const payload = buildPresetPayload(slotIndex)
    const fileName = `feathertalk-preset-slot${slotId(slotIndex)}.json`
    downloadPreset(payload, fileName)
  })
}

if (presetImportButton && presetImportInput) {
  presetImportButton.addEventListener('click', function() {
    presetImportInput.click()
  })

  presetImportInput.addEventListener('change', function() {
    const file = presetImportInput.files && presetImportInput.files[0]
    if (!file) {
      return
    }
    const reader = new FileReader()
    reader.onload = function() {
      const text = reader.result
      if (typeof text !== 'string') {
        alert('프리셋 파일을 읽을 수 없습니다.')
        presetImportInput.value = ''
        return
      }
      let payload
      try {
        payload = parsePresetText(text)
      } catch (error) {
        payload = null
      }
      if (!payload || !Array.isArray(payload.layers)) {
        alert('지원하지 않는 프리셋 파일입니다.')
        presetImportInput.value = ''
        return
      }
      const slotIndex = slotIndexFromId(currentSlotId)
      const slotLabel = slotId(slotIndex)
      if (!confirm(`${slotLabel}번 슬롯을 덮어쓸까요?`)) {
        presetImportInput.value = ''
        return
      }
      layerSlots[slotIndex] = normalizeImportedLayers(payload.layers)
      renderSlot(slotIndex)
      saveLayerSlotsOrAlert()
      alert(`${slotLabel}번 슬롯에 프리셋을 적용했어요.`)
      presetImportInput.value = ''
    }
    reader.readAsText(file)
  })
}

document.querySelector('#submit').addEventListener('click', function() {
  if (!saveLayerSlotsOrAlert()) {
    return
  }
  location.href = 'live.html'
})
