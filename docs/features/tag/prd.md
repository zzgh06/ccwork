# 태그 기능 PRD

## 1. 개요

노트 앱에 태그 기능을 추가한다. 사용자는 노트에 태그를 직접 입력·삭제할 수 있으며, 태그는 노트 저장 시 함께 영속된다. 태그 목록은 노트 편집 화면(NoteEditor)과 노트 목록 카드(NoteItem) 양쪽에서 확인할 수 있다.

---

## 2. 사용자 스토리

| ID   | 스토리                                                                                            | 인수 조건                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-1 | 노트 작성자로서, 노트에 태그를 추가하여 내용을 분류하고 싶다.                                     | - NoteEditor에 태그 입력창이 존재한다<br>- Enter 키 입력 시 태그 칩이 생성된다<br>- 앞뒤 공백은 trim된다<br>- 빈 값·공백만 입력 시 추가되지 않는다 |
| US-2 | 노트 작성자로서, 잘못 입력한 태그를 삭제하고 싶다.                                                | - 각 태그 칩에 `×` 버튼이 표시된다<br>- `×` 클릭 시 해당 태그만 제거된다<br>- 제거는 로컬 상태에서만 반영되며 저장 버튼 클릭 시 확정된다           |
| US-3 | 노트 작성자로서, 저장 버튼을 누를 때 태그도 함께 저장되기를 원한다.                               | - 저장 버튼 클릭 시 `updateNote({ ...note, tags })` API가 호출된다<br>- 저장 후 Context 상태가 갱신된다                                            |
| US-4 | 노트 목록을 보는 사용자로서, 각 노트에 붙은 태그를 카드에서 바로 확인하고 싶다.                   | - NoteItem 카드 하단에 태그 칩 목록이 표시된다(읽기 전용)<br>- 태그가 없으면 해당 영역이 렌더링되지 않는다                                         |
| US-5 | 노트 작성자로서, 같은 태그를 중복으로 추가해도 하나만 유지되기를 원한다(피드백 없이 조용히 무시). | - 대소문자 구분 없이 동일한 태그면 추가되지 않는다<br>- 에러 메시지나 토스트 표시 없음                                                             |
| US-6 | 노트 작성자로서, 태그가 너무 길어지지 않도록 입력 길이가 제한되기를 원한다.                       | - 20자 초과 입력 시 추가되지 않는다(또는 입력 자체를 차단한다)                                                                                     |

---

## 3. 기술 결정 (ADR)

> 채택 안: **안 B — TagInput 분리 컴포넌트**
> 참조 비교 문서: `docs/features/tag/architecture-options.md`

---

### ADR-1: 태그를 Note 객체 내 `string[]`으로 저장

**Context**

태그 데이터를 어느 위치에, 어떤 자료형으로 영속할지 결정해야 한다. JSON Server를 백엔드로 쓰는 현재 구조에서는 별도 컬렉션을 추가하거나, Note 객체 내 필드로 내재화하는 두 방향이 존재한다.

**Decision**

`Note` 인터페이스에 `tags: string[]` 필드를 추가하고, 태그를 Note 객체 안에 내재화한다. 별도의 `tags` 컬렉션(리소스)은 만들지 않는다.

```ts
// src/types/note.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // 추가
  createdAt: string;
  updatedAt: string;
}
```

**Alternatives**

- **별도 tags 컬렉션**: `db.json`에 `tags` 리소스를 분리하고 note-tag 관계를 관리. 태그 기반 검색·집계에 유리하지만, JSON Server 조인 한계와 과도한 구조 복잡도가 따른다.
- **`Set<string>` 자료형**: 중복 제거가 내장되지만 JSON 직렬화 시 배열로 변환해야 하고 기존 코드와 불일치가 생긴다.

**Consequences**

- (+) 스펙 요구사항(별도 컬렉션 분리 없음)과 일치
- (+) API·Context 변경 최소화 — `Partial<Note>` 시그니처가 tags를 자동 수용
- (+) Note를 단일 진실 공급원(SSOT)으로 유지
- (–) 태그 기반 필터링·집계가 필요해지면 전체 노트를 순회해야 함 (Out of Scope이므로 현재는 무관)

---

### ADR-2: API 레이어(`src/api/notes.ts`) 무변경

**Context**

태그 저장을 위해 `createNote`·`updateNote` API 함수 시그니처를 수정해야 하는지 판단이 필요하다.

**Decision**

`src/api/notes.ts`를 변경하지 않는다.

- `updateNote(id, updates: Partial<Note>)` — `Note`에 `tags`가 추가되면 `Partial<Note>`가 tags를 자동으로 포함하므로 무변경으로 동작한다.
- `createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>)` — 마찬가지로 tags를 포함한 객체를 그대로 전달할 수 있다.

**Alternatives**

- **`updateTags(id, tags)` 별도 함수 추가**: tags만 업데이트하는 전용 API 함수. 책임은 명확하지만 불필요한 엔드포인트 분화이며 스펙상 태그는 노트 저장 시 함께 전송한다.
- **`createNote` / `updateNote` 시그니처 명시적 수정**: tags 매개변수를 API 함수에 직접 노출. 타입 명시성은 높아지나 `Partial<Note>` 패턴이 이미 충분히 표현적이다.

**Consequences**

- (+) API 레이어 변경 비용 0 — 기존 호출부 영향 없음
- (+) `Partial<Note>` 패턴의 유연성을 그대로 활용
- (–) API 함수 시그니처만 보면 tags 지원 여부가 명시적으로 드러나지 않음 (타입 추론으로만 확인 가능)

---

### ADR-3: 태그 입력 UI를 `TagInput` controlled 컴포넌트로 분리

**Context**

태그 입력 UI(칩 목록 + 입력창 + Enter 추가 + × 삭제)를 NoteEditor 내부에 인라인으로 작성하거나 별도 컴포넌트로 분리하는 선택이 있다.

**Decision**

`src/components/TagInput.tsx`를 신규 생성하고, 태그 상태(tags)는 NoteEditor가 소유한다. TagInput은 상태 없이 props만으로 동작하는 controlled 컴포넌트로 구현한다.

```ts
// src/components/TagInput.tsx
interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}
```

태그 유효성 검사(trim, 길이 제한, 중복 체크)는 NoteEditor의 핸들러(`handleAddTag`)에 위치한다.

**Alternatives**

- **안 A — NoteEditor 인라인**: 신규 파일 없이 빠르게 구현 가능. 태그 로직이 NoteEditor에 묶여 독립 테스트가 어렵고 컴포넌트가 비대해진다.
- **안 C — `useTagEditor` 훅 추가**: 유효성 검사까지 훅으로 추출해 테스트 용이성이 가장 높다. 그러나 현재 코드베이스에 커스텀 훅 레이어가 없어 새 패턴 도입 비용이 있다.

**Consequences**

- (+) TagInput을 props만 주입해 독립 렌더 테스트 가능
- (+) NoteItem의 읽기 전용 칩 표시와 스타일 코드를 재사용할 여지 확보
- (+) 기존 컴포넌트 분리 패턴(NoteItem 등)과 일관성 유지
- (–) 유효성 검사 로직이 NoteEditor에 남아 있어 로직만 단위 테스트하려면 컴포넌트 렌더가 필요

---

### ADR-4: Context `createNote` 시그니처에 `tags` 매개변수 추가

**Context**

현재 Context의 `createNote(title, content)`는 tags를 받지 않는다. 노트 생성 시 태그를 함께 저장하려면 시그니처를 변경해야 한다. (`updateNote`는 이미 `Partial<Note>`를 받으므로 무변경.)

**Decision**

위치 매개변수를 하나 추가해 `createNote(title, content, tags)` 형태로 확장한다.

```ts
// 변경 전
createNote: (title: string, content: string) => Promise<void>;

// 변경 후
createNote: (title: string, content: string, tags: string[]) => Promise<void>;
```

Context 내부 구현:

```ts
const createNote = async (title: string, content: string, tags: string[]) => {
  const newNote = await api.createNote({ title, content, tags });
  setNotes((prev) => [...prev, newNote]);
};
```

**Alternatives**

- **객체 시그니처로 교체** `createNote({ title, content, tags })`: 매개변수가 늘어날 때 유연하지만 기존 호출부(NoteEditor) 변경 폭이 더 크고 현재 패턴과 불일치.
- **tags 기본값 `[]` 유지, 시그니처 미변경**: `createNote(title, content)`에서 tags를 항상 `[]`로 고정하는 방안. 생성 시 태그를 추가해도 저장되지 않는 버그를 의도적으로 허용하는 것이므로 스펙 위반.

**Consequences**

- (+) 기존 위치 매개변수 패턴 유지 — 코드베이스 일관성 보존
- (+) 호출부(NoteEditor)만 수정하면 되고 Context 인터페이스 변경 최소화
- (–) 매개변수가 3개로 늘어나 가독성이 다소 떨어짐 (향후 항목이 더 추가될 경우 객체 시그니처 전환 검토)

---

## 4. Out of Scope

- 태그 기반 필터링·검색 — 이번 릴리스에서 구현하지 않는다
- 태그 자동완성 / 추천 — 별도 기획 없음
- 태그 전용 컬렉션(별도 DB 테이블/컬렉션) — 노트 객체 내 배열로만 관리
- 태그 글자 수 초과 시 인라인 에러 메시지 — 조용히 무시
- 태그 순서 변경(드래그 앤 드롭) — 입력 순서 유지만 보장

---

## 5. 용어 정의

| 용어         | 정의                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| 태그(Tag)    | 노트에 부착하는 짧은 문자열 레이블. 노트 객체 내 `tags: string[]` 필드에 저장된다.                      |
| 태그 칩      | 태그를 UI에서 표현하는 알약(pill) 형태의 컴포넌트. NoteEditor에서는 `×` 버튼을 포함한다.                |
| NoteEditor   | 노트 생성·편집 폼 컴포넌트 (`src/components/NoteEditor.tsx`). 태그 입력 UI가 위치한다.                  |
| NoteItem     | 노트 목록 사이드바의 카드 단위 컴포넌트 (`src/components/NoteItem.tsx`). 태그를 읽기 전용으로 표시한다. |
| 로컬 상태    | 저장 버튼을 누르기 전, 컴포넌트 내부에서만 유지되는 임시 태그 배열 상태.                                |
| Context 상태 | `NotesContext`가 관리하는 전역 노트 배열. 저장 API 호출 후 갱신된다.                                    |
