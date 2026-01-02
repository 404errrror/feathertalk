# Repository Guidelines

## Project Context
- 이 프로젝트는 저사양 환경에서 VTuber 아바타를 쉽게 표현하는 프로그램이다.
- 작업자는 한국어를 사용한다. 가능한 경우 답변은 한국어로 한다.

## Project Structure & Module Organization
- `index.html` is the configuration UI and entry point.
- `live.html` renders the animated character.
- `js/` contains runtime logic (`js/index.js`) and localStorage wiring (`js/localstorage.js`).
- `css/` contains `css/index.css` and `css/main.css`.
- `assets/` stores default PNGs used for character parts and icons.
- `start-local.bat` is a Windows helper for running a local server; `CNAME` is for GitHub Pages.

## File Roles
- `index.html`: 설정 UI 엔트리, 레이어 입력/탭/라이브 버튼.
- `live.html`: 캐릭터 렌더링 화면 및 설정 패널.
- `js/index.js`: 공통 상태/초기 UI, 모듈 간 공유 변수/헬퍼.
- `js/index.layers.js`: 레이어 로딩/정규화, 프리셋 적용, 표정(눈/입) 스왑, 오디오 기반 업데이트.
- `js/index.rig.js`: 자동 리깅/마우스 리깅 로직, 캐릭터 변형 적용.
- `js/index.camera.js`: 카메라 트래킹, FaceMesh 로딩, 모션/얼굴 추적, 프리뷰/오버레이 렌더.
- `js/localstorage.js`: 레이어 슬롯 로딩/정규화/마이그레이션 등 core storage.
- `js/localstorage.ui.js`: 레이어 편집 UI 생성/이벤트/파일 선택 처리.
- `js/localstorage.boot.js`: 초기 렌더/탭 전환/저장 후 `live.html` 이동.
- `css/index.css`: 설정 UI 스타일.
- `css/main.css`: 라이브 화면 스타일.
- `assets/`: 기본 파츠 이미지와 아이콘.

## Build, Test, and Development Commands
- `start-local.bat`: launches `http://localhost:8000/index.html` and runs `python -m http.server 8000`.
- `python -m http.server 8000`: cross-platform static server; open `http://localhost:8000/index.html` manually.
- No build step or package install is required; changes are reflected on refresh.

## Coding Style & Naming Conventions
- Vanilla HTML/CSS/JS only; avoid adding build tooling unless necessary.
- Use 2-space indentation and follow the existing DOM-query style (`document.querySelector`).
- Keep asset filenames lower-case and descriptive (e.g., `assets/mouthopen.png`).
- localStorage keys are prefixed with `ft` (e.g., `ftMouthOpen`); preserve this pattern.

## Testing Guidelines
- No automated tests are configured.
- Manual checks: load `index.html`, enter image URLs, click "live", confirm `live.html` updates; verify number keys 1-0 swap presets and mic permission prompts work.

## Commit & Pull Request Guidelines
- Commit history uses short Korean descriptions, sometimes with a trailing period; keep messages brief and change-focused.
- For PRs, include a summary, screenshots for UI changes, and note any manual testing performed.

## Configuration & Data
- User settings persist in browser localStorage; avoid breaking existing key formats without a migration note.
