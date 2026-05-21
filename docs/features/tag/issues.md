# 태그 기능 이슈 목록

> 수직 슬라이싱 원칙 적용 — 각 이슈는 UI·로직·데이터 레이어를 모두 관통하며 독립적으로 배포 가능한 사용자 가치를 전달한다.

---

## 이슈 요약

| #                   | 제목                                                    | 관련 스토리      | 선행 이슈 |
| ------------------- | ------------------------------------------------------- | ---------------- | --------- |
| [TAG-1](#tag-1)     | 노트 목록 카드에서 태그 읽기 전용 표시                  | US-4             | 없음      |
| [TAG-2](#tag-2)     | 기존 노트에 태그 추가·삭제·저장                         | US-1, US-2, US-3 | TAG-1     |
| [TAG-3](#tag-3)     | 새 노트 생성 시 태그 포함 저장                          | US-3 (생성 흐름) | TAG-2     |
| [TAG-4](#tag-4)     | 태그 유효성 검사 — 중복 방지 및 길이 제한               | US-5, US-6       | TAG-2     |
| [Issue-6](#issue-6) | createNote 기본 tags 보장 — 새 노트 tags 필드 누락 방지 | —                | TAG-1     |

## 의존 순서

```
TAG-1
  └── TAG-2
        ├── TAG-3
        └── TAG-4
```

- TAG-1이 완료되어야 Note 타입과 NoteItem 렌더 기반이 생긴다.
- TAG-2가 완료되어야 TAG-3(생성 흐름)과 TAG-4(유효성)가 추가될 위치가 생긴다.
- TAG-3과 TAG-4는 TAG-2 완료 후 순서에 관계없이 병렬 진행 가능하다.
- Issue-6은 TAG-1 완료 직후 처리해야 한다. TAG-1이 배포되면 새 노트 생성 시 `tags` 필드가 누락되어 런타임 에러가 발생하기 때문이다.

---

## TAG-1

### 노트 목록 카드에서 태그 읽기 전용 표시

**관련 ADR**: ADR-1

**설명**

`Note` 타입에 `tags: string[]` 필드를 추가하고, NoteItem 카드 하단에 태그 칩 목록을 읽기 전용으로 렌더링한다. 이 이슈가 완료되면 db.json에 태그가 있는 노트를 목록에서 즉시 확인할 수 있다.

**완료 조건 (Acceptance Criteria)**

- [ ] `src/types/note.ts`의 `Note` 인터페이스에 `tags: string[]` 필드가 추가된다
- [ ] `db.json`의 기존 노트 객체에 `"tags": []` 필드가 포함된다
- [ ] NoteItem 카드 하단에 태그 칩 목록이 렌더링된다
- [ ] `tags`가 빈 배열이면 태그 영역이 DOM에 렌더링되지 않는다

**시나리오**

> 태그가 있는 노트 확인

- Given: 노트 목록이 로드되어 있고 특정 노트에 `tags: ["react", "study"]`가 있다
- When: 사용자가 노트 목록을 조회한다
- Then: 해당 NoteItem 카드 하단에 "react", "study" 칩이 표시된다

> 태그가 없는 노트 확인

- Given: 특정 노트의 `tags`가 빈 배열(`[]`)이다
- When: 사용자가 해당 노트 카드를 본다
- Then: NoteItem에 태그 영역이 렌더링되지 않는다

---

## TAG-2

### 기존 노트에 태그 추가·삭제·저장

**관련 ADR**: ADR-2, ADR-3

**설명**

`TagInput` controlled 컴포넌트를 신규 생성하고 NoteEditor에 통합한다. 사용자는 Enter 키로 태그를 추가하고 × 버튼으로 삭제할 수 있으며, 저장 버튼 클릭 시 태그가 노트와 함께 서버에 영속된다.

**완료 조건 (Acceptance Criteria)**

- [ ] `src/components/TagInput.tsx`가 생성된다 (props: `tags`, `onAdd`, `onRemove`)
- [ ] TagInput은 내부 상태 없이 props만으로 동작하는 controlled 컴포넌트다
- [ ] NoteEditor가 `tags: string[]` 로컬 상태를 소유하고 TagInput에 내려준다
- [ ] 노트를 전환할 때 NoteEditor의 `tags` 로컬 상태가 해당 노트의 tags로 초기화된다
- [ ] 입력창에서 Enter 키 입력 시 태그 칩이 생성되고 입력창이 초기화된다
- [ ] 입력값 앞뒤 공백이 trim된다
- [ ] 빈 값·공백만 입력 시 태그가 추가되지 않는다
- [ ] 각 칩의 × 버튼 클릭 시 해당 태그만 제거된다
- [ ] 저장 버튼 클릭 시 `updateNote({ ...note, tags })`가 호출된다
- [ ] 저장 후 NoteItem 카드에 변경된 태그가 반영된다

**시나리오**

> 태그 추가

- Given: 사용자가 기존 노트 편집 중이고 태그 입력창이 비어 있다
- When: " react "를 입력하고 Enter를 누른다
- Then: "react" 칩이 추가되고 입력창은 초기화된다

> 태그 삭제

- Given: 편집 중인 노트에 "react", "study" 칩이 있다
- When: "react" 칩의 × 버튼을 클릭한다
- Then: "react"만 제거되고 "study"는 유지된다

> 저장 시 태그 영속

- Given: NoteEditor에 "react" 태그가 추가되어 있고 아직 저장되지 않았다
- When: 저장 버튼을 클릭한다
- Then: `updateNote`가 `{ ...note, tags: ["react"] }`를 인수로 호출되고, NoteItem 카드에 "react" 칩이 표시된다

> 기존 태그가 있을 때 새 태그 추가

- Given: 편집 중인 노트에 "react" 태그 칩이 이미 존재한다
- When: 입력창에 "study"를 입력하고 Enter를 누른다
- Then: "react", "study" 두 칩이 모두 표시되고 입력창은 초기화된다

> 빈 값 무시

- Given: 사용자가 태그 입력창에 " "(공백만)을 입력한다
- When: Enter를 누른다
- Then: 태그 목록에 변화가 없고 입력창은 초기화된다

---

## TAG-3

### 새 노트 생성 시 태그 포함 저장

**관련 ADR**: ADR-4

**설명**

Context의 `createNote` 시그니처에 `tags` 매개변수를 추가해, 새 노트 생성 시 사용자가 입력한 태그가 함께 영속되도록 한다.

**완료 조건 (Acceptance Criteria)**

- [ ] `NotesContext`의 `createNote` 시그니처가 `(title, content, tags) => Promise<void>`로 변경된다
- [ ] NoteEditor 생성 모드에서도 TagInput이 표시된다
- [ ] 저장 버튼 클릭 시 `createNote(title, content, tags)`가 호출된다
- [ ] 생성된 노트의 NoteItem에 입력한 태그가 즉시 표시된다

**시나리오**

> 태그 포함 생성

- Given: 사용자가 새 노트 생성 모드에 있고 제목, 내용을 입력 후 "react" 태그를 추가했다
- When: 저장 버튼을 클릭한다
- Then: `createNote("제목", "내용", ["react"])`가 호출되고 NoteItem에 "react" 칩이 표시된다

> 태그 없이 생성

- Given: 사용자가 태그를 입력하지 않고 새 노트를 작성한다
- When: 저장 버튼을 클릭한다
- Then: `createNote("제목", "내용", [])`가 호출되고 NoteItem에 태그 영역이 렌더링되지 않는다

---

## TAG-4

### 태그 유효성 검사 — 중복 방지 및 길이 제한

**관련 ADR**: ADR-3 (유효성 검사는 `handleAddTag`에 위치)

**설명**

`handleAddTag`에 중복 체크(대소문자 무시)와 20자 길이 제한을 추가한다. 두 규칙 모두 사용자에게 에러 피드백 없이 조용히 무시한다.

**완료 조건 (Acceptance Criteria)**

- [ ] 기존 태그와 동일한 값(대소문자 무시) 입력 시 추가되지 않는다
- [ ] trim 후 21자 이상인 태그는 추가되지 않는다
- [ ] trim 후 20자 이하인 태그는 정상 추가된다
- [ ] 두 규칙 모두 에러 메시지·토스트·시각적 피드백 없이 동작한다

**시나리오**

> 대소문자 무관 중복 방지

- Given: 태그 목록에 "TypeScript"가 있다
- When: "typescript"를 입력하고 Enter를 누른다
- Then: 태그 목록에 변화가 없고 에러 메시지도 표시되지 않는다

> 20자 초과 차단

- Given: 사용자가 21자 문자열을 태그 입력창에 입력한다
- When: Enter를 누른다
- Then: 태그가 추가되지 않고 에러 메시지도 표시되지 않는다

> 20자 경계값 허용

- Given: 사용자가 정확히 20자 문자열을 태그 입력창에 입력한다
- When: Enter를 누른다
- Then: 태그가 정상 추가된다
