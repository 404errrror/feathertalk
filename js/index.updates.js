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
    version: 'v2026.02.17.06',
    date: '2026-02-17',
    summary: '설정 페이지를 더 간단하게 정리했어요.',
    details: [
      'index 페이지에서 캐릭터 설정 영역을 제거해서 이미지/레이어 설정에만 집중할 수 있어요.',
      '캐릭터 크기, 위치, 자동 모션 같은 조정은 라이브 화면의 설정 버튼에서 변경하면 돼요.',
      '기존 슬롯 저장 방식과 프리셋 가져오기/내보내기는 이전과 동일하게 사용할 수 있어요.'
    ]
  },
  {
    version: 'v2026.02.17.05',
    date: '2026-02-17',
    summary: '몸 회전 범위의 실제 움직임 폭을 더 넓혔어요.',
    details: [
      '몸 회전 범위 설정 UI는 기존과 동일하게 0~100%를 유지해요.',
      '같은 퍼센트 값에서도 캐릭터의 실제 회전 각도가 더 크게 적용되도록 조정했어요.',
      '마우스 리깅, 자동 모션, 카메라 추적 경로 모두 동일한 확대 폭으로 반영돼요.'
    ]
  },
  {
    version: 'v2026.02.17.04',
    date: '2026-02-17',
    summary: '캐릭터 아웃라인 기능을 추가했어요.',
    details: [
      '프리셋별로 아웃라인 켜기/끄기, 색상, 두께(0~20px)를 저장할 수 있어요.',
    ]
  },
  {
    version: 'v2026.02.17.03',
    date: '2026-02-17',
    summary: '캐릭터 크기 조절 기능을 추가했어요.',
    details: [
      '캐릭터 설정에 크기 조절 항목을 추가하고, 30~300% 범위로 조절할 수 있게 했어요.',
    ]
  },
  {
    version: 'v2026.02.17.02',
    date: '2026-02-17',
    summary: '카메라 추적 지연을 줄이기 위한 성능 프로필을 추가했어요.',
    details: [
      '카메라 성능 프로필(저지연/균형/저부하)을 추가 했어요.',
      '카메라 보간 강도 기본값을 30%로 줄였어요.'
    ]
  },
  {
    version: 'v2026.02.17.01',
    date: '2026-02-17',
    summary: '카메라 추적 반응 속도를 카메라 보간 강도로 전환하고 최소값 동작을 안정화했어요.',
    details: [
      '카메라 설정의 `카메라 추적 반응 속도`를 `카메라 보간 강도`로 바꾸고, 조절 범위를 1~200% 기준으로 재정의했어요.',
      '지터링 완화를 위해 보간 강도 최소값을 1%로 조정해, 가장 낮은 값에서도 과도한 떨림이 줄어들도록 보정했어요.'
    ]
  },
  {
    version: 'v2026.02.16.08',
    date: '2026-02-16',
    summary: '모션 범위 클램프가 리깅 강도와 독립적으로 동작하도록 보정했어요.',
    details: [
      '얼굴 좌/우, 얼굴 상/하, 몸 회전 범위를 리깅 강도와 분리된 기준으로 다시 계산하도록 조정했어요.',
      '마우스 입력, 자동 모션, 카메라 적용 경로가 동일한 클램프 계산을 사용하도록 정리했어요.'
    ]
  },
  {
    version: 'v2026.02.16.07',
    date: '2026-02-16',
    summary: '스크롤 시 캐릭터 설정 카드가 상단 제목(Feather-Talk)을 가리던 문제를 수정했어요.',
    details: [
      'index 상단 내비게이션(#navbar)에 z-index를 추가해 제목 영역이 항상 위에 표시되도록 정리했어요.',
      '이제 페이지를 아래로 스크롤해도 캐릭터 설정 카드가 제목을 덮지 않아요.'
    ]
  },
  {
    version: 'v2026.02.16.06',
    date: '2026-02-16',
    summary: '새로고침(F5) 이후 자동 모션 느낌이 달라지던 문제를 고쳤어요.',
    details: [
      '자동 모션 초기 시작 루틴을 스프링 기반 경로로 통일해, 새로고침 직후에도 기존과 같은 띠용 움직임을 유지해요.',
      '기존처럼 자동 모션 ON 상태에서 포인터 유휴 복귀와 초기 진입이 같은 동작 감각으로 이어지도록 정리했어요.'
    ]
  },
  {
    version: 'v2026.02.16.05',
    date: '2026-02-16',
    summary: '자동 모션 토글과 index 캐릭터 설정 레이아웃 개선을 적용했어요.',
    details: [
      'index/live 모두에 자동 모션 켜짐/꺼짐 토글을 추가하고, ON/OFF 상태가 슬롯별 설정으로 저장되도록 연결했어요.',
      '자동 모션이 꺼진 상태에서는 자동 모션 속도 컨트롤을 비활성화해 설정 의도를 더 명확하게 만들었어요.',
      '캐릭터 설정 행을 리깅/XY/자동모션/범위/배경색 흐름으로 재정렬하고, 항목 간 간격을 넓혀 읽기 쉽게 정리했어요.',
      '행 단위 구분선을 추가해 설정 그룹 경계를 더 명확하게 구분했어요.',
    ]
  },
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
