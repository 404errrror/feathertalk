/**
 * @typedef {Object} UpdateLogEntry
 * @property {string} version
 * @property {string} date
 * @property {string} summary
 * @property {string[]} details
 */

const UPDATE_LOG_VISIBLE_COUNT = 5
const UPDATE_LOG_SEEN_KEY = 'ftSeenUpdateVersion'

/** @type {UpdateLogEntry[]} */
const UPDATE_LOG_ENTRIES = [
  {
    version: 'v2026.02.16.01',
    date: '2026-02-16',
    summary: '설정 페이지에 업데이트 로그 섹션을 추가했어요.',
    details: [
      '최근 변경 사항을 설정 페이지에서 바로 확인할 수 있어요.',
      '기본으로 최신 5개만 보여주고, 더보기/접기로 전체 내역을 펼칠 수 있어요.'
    ]
  }
];

(function initUpdateLog() {
  const bodyElement = document.querySelector('#update-log-body')
  const listElement = document.querySelector('#update-log-list')
  const toggleElement = document.querySelector('#update-log-toggle')
  const moreToggleElement = document.querySelector('#update-log-more-toggle')
  const dotElement = document.querySelector('#update-log-dot')

  if (!bodyElement || !listElement || !toggleElement || !moreToggleElement || !dotElement) {
    return
  }

  let isOpen = false
  let isExpanded = false

  function getLatestVersion() {
    if (!UPDATE_LOG_ENTRIES.length || !UPDATE_LOG_ENTRIES[0]) {
      return ''
    }
    const latestVersion = UPDATE_LOG_ENTRIES[0].version
    if (typeof latestVersion !== 'string') {
      return ''
    }
    return latestVersion
  }

  function getSeenVersion() {
    try {
      const seenVersion = localStorage.getItem(UPDATE_LOG_SEEN_KEY)
      return typeof seenVersion === 'string' ? seenVersion : ''
    } catch (error) {
      return ''
    }
  }

  function setSeenVersion(version) {
    if (!version) {
      return
    }
    try {
      localStorage.setItem(UPDATE_LOG_SEEN_KEY, version)
    } catch (error) {
      // ignore storage access errors
    }
  }

  function hasUnreadUpdate() {
    const latestVersion = getLatestVersion()
    if (!latestVersion) {
      return false
    }
    return getSeenVersion() !== latestVersion
  }

  function markAsSeenIfNeeded() {
    const latestVersion = getLatestVersion()
    if (!latestVersion) {
      return
    }
    if (getSeenVersion() === latestVersion) {
      return
    }
    setSeenVersion(latestVersion)
  }

  function getVisibleEntries() {
    if (isExpanded) {
      return UPDATE_LOG_ENTRIES
    }
    return UPDATE_LOG_ENTRIES.slice(0, UPDATE_LOG_VISIBLE_COUNT)
  }

  function createDetailsList(details) {
    if (!Array.isArray(details) || !details.length) {
      return null
    }

    const detailsList = document.createElement('ul')
    detailsList.className = 'update-log-item__details'

    details.forEach(function(detail) {
      const detailItem = document.createElement('li')
      detailItem.textContent = detail
      detailsList.appendChild(detailItem)
    })

    return detailsList
  }

  function createLogItem(entry) {
    const itemElement = document.createElement('article')
    itemElement.className = 'update-log-item'

    const metaElement = document.createElement('div')
    metaElement.className = 'update-log-item__meta'

    const versionText = entry && typeof entry.version === 'string' ? entry.version : '-'
    const dateText = entry && typeof entry.date === 'string' ? entry.date : '-'
    const summaryText = entry && typeof entry.summary === 'string' ? entry.summary : ''

    const versionElement = document.createElement('span')
    versionElement.className = 'update-log-item__version'
    versionElement.textContent = versionText

    const dateElement = document.createElement('time')
    dateElement.className = 'update-log-item__date'
    dateElement.dateTime = dateText === '-' ? '' : dateText
    dateElement.textContent = dateText

    const summaryElement = document.createElement('div')
    summaryElement.className = 'update-log-item__summary'
    summaryElement.textContent = summaryText

    metaElement.appendChild(versionElement)
    metaElement.appendChild(dateElement)
    itemElement.appendChild(metaElement)
    itemElement.appendChild(summaryElement)

    const details = entry && Array.isArray(entry.details) ? entry.details : []
    const detailsList = createDetailsList(details)
    if (detailsList) {
      itemElement.appendChild(detailsList)
    }

    return itemElement
  }

  function renderOpenState() {
    bodyElement.hidden = !isOpen
    toggleElement.textContent = isOpen ? '닫기' : '업데이트 보기'
    toggleElement.setAttribute('aria-expanded', isOpen ? 'true' : 'false')

    if (!isOpen) {
      isExpanded = false
    }
  }

  function renderRedDot() {
    dotElement.hidden = !hasUnreadUpdate()
  }

  function renderEntries() {
    listElement.innerHTML = ''

    if (!isOpen) {
      moreToggleElement.hidden = true
      moreToggleElement.setAttribute('aria-expanded', 'false')
      return
    }

    const visibleEntries = getVisibleEntries()
    if (!visibleEntries.length) {
      const emptyElement = document.createElement('div')
      emptyElement.className = 'update-log__empty'
      emptyElement.textContent = '아직 등록된 업데이트 로그가 없습니다.'
      listElement.appendChild(emptyElement)
    } else {
      visibleEntries.forEach(function(entry) {
        listElement.appendChild(createLogItem(entry))
      })
    }

    const hasMoreItems = UPDATE_LOG_ENTRIES.length > UPDATE_LOG_VISIBLE_COUNT
    moreToggleElement.hidden = !hasMoreItems
    moreToggleElement.textContent = isExpanded ? '접기' : '더보기'
    moreToggleElement.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
  }

  toggleElement.addEventListener('click', function() {
    isOpen = !isOpen
    if (isOpen) {
      markAsSeenIfNeeded()
    }
    renderOpenState()
    renderEntries()
    renderRedDot()
  })

  moreToggleElement.addEventListener('click', function() {
    isExpanded = !isExpanded
    renderEntries()
  })

  renderOpenState()
  renderEntries()
  renderRedDot()
})()
