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
    version: 'v2026.02.16.04',
    date: '2026-02-16',
    summary: '내용 없음',
    details: [
      '내용 없음'
      ]
  },
  {
    version: 'v2026.02.16.03',
    date: '2026-02-16',
    summary: '슬롯별 모션 적용 범위(얼굴 좌/우·상/하·몸 회전) 설정을 추가했어요.',
    details: [
      '캐릭터 설정에서 얼굴 좌/우, 얼굴 상/하, 몸 회전의 최소~최대 범위를 각각 0~100%로 조절할 수 있어요.',
      '설정한 범위는 마우스, 자동 모션, 카메라 입력 전체에 동일하게 클램프로 적용돼요.',
      '새 범위 값은 슬롯별로 저장되고 프리셋 내보내기/가져오기에도 함께 포함돼요.'
    ]
  },
  {
    version: 'v2026.02.16.02',
    date: '2026-02-16',
    summary: '라이브 캐릭터 셋팅을 슬롯 별로 완전히 분리했어요.',
    details: [
      '리깅 강도, X/Y 위치, 자동 모션 속도 범위, 배경색을 각 슬롯에 독립적으로 저장하도록 바꿨어요.',
      '숫자키로 슬롯 전환 시 레이어와 캐릭터 셋팅이 동시에 즉시 반영되도록 동기화했어요.',
      '라이브에서 마지막으로 사용한 슬롯을 기억해 새로고침 후에도 같은 슬롯으로 시작해요.'
    ]
  },
  {
    version: 'v2026.02.16.01',
    date: '2026-02-16',
    summary: '슬롯 별 캐릭터 셋팅 분리 기능을 설정/불러오기 흐름까지 확장했어요.',
    details: [
      'index 페이지에서도 슬롯별 캐릭터 셋팅(리깅/X/Y/자동 모션/배경색)을 바로 조정할 수 있어요.',
      '슬롯 프리셋 내보내기/가져오기에 캐릭터 셋팅(`liveSettings`)이 함께 저장되도록 확장했어요.',
      '기존 프리셋 파일(`layers`만 포함)도 그대로 가져올 수 있게 구버전 호환을 유지했어요.',
      '슬롯 전환 UX와 자동 모션 컨트롤 정렬을 함께 다듬어 슬롯별 작업 흐름을 더 안정적으로 맞췄어요.'
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
