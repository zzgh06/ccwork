---
name: mermaid-diagram
description: >
  프로젝트의 src/ 디렉토리를 분석해서 컴포넌트 의존성·상태 흐름·데이터 흐름을
  Mermaid 다이어그램으로 시각화하고 docs/architecture/index.html로 저장한 뒤
  브라우저에서 여는 스킬.
  사용자가 "아키텍처 다이어그램", "컴포넌트 의존성 시각화", "mermaid 다이어그램",
  "프로젝트 구조 시각화", "상태 흐름 다이어그램" 등을 언급할 때 반드시 이 스킬을 사용한다.
---

# mermaid-diagram

`src/` 디렉토리를 읽어 컴포넌트 의존성·상태 흐름·데이터 흐름 세 가지 Mermaid 다이어그램이 담긴
`docs/architecture/index.html`을 생성하고 브라우저에서 바로 열어 준다.

## 실행 절차

### 1. src/ 전체 파일 분석

`src/` 하위 모든 파일을 읽고 파일별로 다음을 파악한다.

| 항목 | 확인할 내용 |
|------|-------------|
| **import** | 어떤 로컬 모듈을 가져오는가 |
| **export** | 컴포넌트·훅·함수·타입 중 무엇을 내보내는가 |
| **Context** | `useContext` / 커스텀 `useXxx` 훅을 호출하는가 |
| **Props** | 어떤 props를 받고, 어떤 콜백을 위로 올리는가 |
| **State** | `useState`로 어떤 상태를 소유하는가 |
| **API** | API 레이어 함수를 직접 호출하는가 |

### 2. 세 가지 Mermaid 다이어그램 작성

#### 다이어그램 1 — 컴포넌트 의존성 그래프 (`graph TD`)

파일 단위 import 관계를 레이어별 subgraph로 시각화한다.

```
subgraph 진입점
subgraph 컴포넌트
subgraph Context
subgraph API
subgraph 타입
subgraph 백엔드
```

- 실선 `-->` : import / 렌더 관계
- 점선 `-..->` : 타입만 참조
- 노드 레이블에 파일명 + 한국어 역할 설명 병기 (`App["App.tsx\n선택 상태 소유"]`)

#### 다이어그램 2 — 상태 흐름 (`flowchart LR`)

상태가 어느 레이어에 있는지, props·callback·context로 어떻게 오가는지 표현한다.

- subgraph로 레이어 구분 (서버 데이터 / UI 선택 상태 / 폼 로컬 상태 등)
- 엣지 레이블에 prop 이름 또는 콜백 이름 명시

#### 다이어그램 3 — 데이터 흐름 (`sequenceDiagram`)

CRUD 한 사이클(읽기·생성·수정·삭제)을 순서도로 표현한다.

```
User → Component → Context → API 함수 → JSON Server → (응답 역방향)
```

### 3. HTML 파일 조립

요구사항:

- Mermaid CDN 사용: `https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js`
- 탭 UI로 세 다이어그램 전환 (순수 HTML/CSS/JS, 외부 라이브러리 금지)
- 각 다이어그램은 `<div class="mermaid">` 블록에 배치
- 페이지 제목, 프로젝트 설명, 생성 타임스탬프 포함
- 다크 배경 / 밝은 텍스트 스타일 권장
- **외부 의존성 없이 `open index.html` 만으로 렌더링** 가능해야 함

Mermaid 노드 레이블에 한국어를 쓸 때 따옴표로 감싼다 (`["이름\n설명"]`).
특수문자(`()`, `{}`)는 레이블 안에서 이스케이프하거나 제거한다.

#### 탭 렌더링 패턴 (필수)

`startOnLoad: true`를 쓰면 `display: none` 패널의 다이어그램이 렌더링되지 않는다.
반드시 아래 패턴을 사용한다.

```js
mermaid.initialize({ startOnLoad: false, ... });

const rendered = new Set();

function renderPanel(tabId) {
  if (rendered.has(tabId)) return;
  rendered.add(tabId);
  const panel = document.getElementById('tab-' + tabId);
  mermaid.run({ nodes: Array.from(panel.querySelectorAll('.mermaid')) });
}

// 첫 번째 탭 즉시 렌더링
renderPanel('dep');

// 탭 클릭 시 해당 패널 렌더링
btn.addEventListener('click', () => {
  // ... 탭 전환 로직 ...
  renderPanel(target);
});
```

#### SVG 크기

다이어그램이 작게 렌더링되지 않도록 CSS를 반드시 포함한다.

```css
.diagram-wrap .mermaid {
  min-width: 900px;
  width: 100%;
}
.diagram-wrap .mermaid svg {
  width: 100% !important;
  height: auto !important;
  min-height: 500px;
}
```

### 4. 저장 및 브라우저 열기

```bash
mkdir -p docs/architecture
# docs/architecture/index.html 저장
open docs/architecture/index.html
```

기존 파일이 있으면 덮어쓴다 (멱등 실행 가능).

## Flowchart 노드 레이블 금지 문자

`flowchart` 다이어그램 노드 레이블 안에 아래 문자가 들어가면 파싱 오류가 발생한다.

| 문자 | 이유 | 대체 |
|------|------|------|
| `\|` | 엣지 구분자(`-->\|...\|`)로 오인 | `/` 또는 생략 |
| `[]` | 노드 모양 구문과 혼동 | `배열` 또는 생략 |
| `()` | 노드 모양 구문과 혼동 | 생략 |

- 타입 어노테이션(`string\|null`, `Note[]`, `: boolean`)은 레이블에서 모두 제거한다.
- 서브그래프 ID를 엣지 소스/타깃으로 직접 쓰면 불안정하다. 서브그래프 내부에 명시적 노드 ID를 선언하고 그 노드에 연결한다.

  ```
  subgraph CTX["NotesContext"]
    CTX_data["notes / loading / error"]   ← 명시적 ID
  end
  CTX_data -->|notes| NoteList            ← 서브그래프 ID 대신 노드 ID 사용
  ```

## 품질 체크

저장 전 확인사항:

- [ ] Mermaid 구문 오류 없음 (따옴표 짝 맞음, 특수문자 이스케이프)
- [ ] flowchart 레이블에 `|`, `[]`, `()` 미포함
- [ ] `startOnLoad: false` + `renderPanel()` 패턴 사용
- [ ] SVG 크기 CSS 포함
- [ ] 탭 전환 JS 동작
- [ ] CDN만으로 렌더링 가능
- [ ] 소스 파일은 수정하지 않음

## 주의사항

- `src/` 가 없으면 실제 소스 루트를 찾아 적용한다
- 다이어그램은 실제 코드를 읽은 결과를 반영한다 (CLAUDE.md 구조도가 오래됐을 수 있으므로 코드 우선)
- `docs/architecture/index.html` 만 생성/수정한다
