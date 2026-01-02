const layerSlots = loadLayerSlots()
renderAllSlots()

document.querySelectorAll('.layer-add').forEach(function(button) {
  button.addEventListener('click', function() {
    const slotIndex = slotIndexFromId(button.dataset.slot)
    const newLayer = normalizeLayer({ rig: 'face', role: 'none' })
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
