function setInputFromLayer(input, src, display, fallbackSrc) {
  const resolvedFallback = typeof fallbackSrc === 'string' ? fallbackSrc : DEFAULT_SRC
  const hasDisplay = typeof display === 'string' && display.trim()
  if (hasDisplay && display !== src) {
    input.value = display
    input.dataset.actualSrc = src
    input.dataset.displayValue = display
  } else if (src && src !== resolvedFallback) {
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
  setInputFromLayer(srcInput, layer.src, layer.display, getDefaultRigSrc(layer.rig))
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
  setInputFromLayer(altInput, layer.altSrc, layer.altDisplay, '')
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
    const resolved = readInputValue(srcInput, getDefaultRigSrc(layer.rig))
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
    const previousRig = layer.rig
    layer.rig = rigSelect.select.value
    const previousDefault = getDefaultRigSrc(previousRig)
    const nextDefault = getDefaultRigSrc(layer.rig)
    if (!srcInput.value || layer.src === previousDefault) {
      layer.src = nextDefault
      layer.display = ''
      setInputFromLayer(srcInput, layer.src, layer.display, nextDefault)
      preview.src = layer.src || DEFAULT_SRC
    }
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
      slotLayers.push(normalizeLayer({ rig: 'face', role: 'none' }))
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

