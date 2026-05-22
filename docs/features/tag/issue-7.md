# Issue 7 — 시그니처

> 승인일: 2026-05-22

## Context 메서드 변경

```ts
// NotesContext.tsx — NotesContextType 인터페이스
// 변경 전
createNote: (title: string, content: string) => Promise<void>;

// 변경 후
createNote: (title: string, content: string, tags: string[]) => Promise<void>;
```

```ts
// NotesContext.tsx — createNote 구현체
// 변경 전
const createNote = async (title: string, content: string) => {
  const newNote = await api.createNote({ title, content, tags: [] });
  setNotes((prev) => [...prev, newNote]);
};

// 변경 후
const createNote = async (title: string, content: string, tags: string[]) => {
  const newNote = await api.createNote({ title, content, tags });
  setNotes((prev) => [...prev, newNote]);
};
```

## NoteEditor 호출부 변경

```ts
// handleSave 내 isCreating 분기
// 변경 전
await createNote(title, content);

// 변경 후
await createNote(title, content, tags);
```

## 변경 없음

| 항목                         | 이유                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `src/api/notes.ts`           | ADR-2 결정대로 무변경 — `Omit<Note, 'id'\|'createdAt'\|'updatedAt'>`가 tags를 이미 수용 |
| `TagInput` 컴포넌트          | 이미 구현됨 (이슈 #6), props 시그니처 변경 없음                                         |
| `NoteEditor` TagInput 렌더링 | 이미 `isCreating` 조건 없이 항상 렌더됨 — AC #2 이미 충족                               |

---

## 테스트 시나리오

### 정상

- [정상] NoteEditor — should render TagInput when isCreating is true
- [정상] NoteEditor(handleSave) — should call createNote(title, content, tags) when saving in create mode with tags
- [정상] NoteEditor(handleSave) — should call createNote with title, content, and tags together in create mode
- [정상] NotesContext(createNote) — should add note including provided tags to notes state after createNote is called

### 경계

- [경계] NoteEditor(handleSave) — should call createNote with empty array when saving in create mode with no tags added
- [경계] NoteEditor(handleSave) — should not call createNote when title is empty in create mode

### 예외

- [예외] NoteEditor(handleSave) — should not call updateNote when isCreating is true
- [예외] NotesContext(createNote) — should not hardcode tags to [] when tags argument is provided

## AC 커버리지

| AC 항목                                                                  | 커버하는 시나리오                                                                                                                                                                                           | 커버 여부 |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `createNote` 시그니처가 `(title, content, tags) => Promise<void>`로 변경 | `NotesContext(createNote) — should not hardcode tags to [] when tags argument is provided`                                                                                                                  | ✅        |
| NoteEditor 생성 모드에서도 TagInput이 표시된다                           | `NoteEditor — should render TagInput when isCreating is true`                                                                                                                                               | ✅        |
| 저장 버튼 클릭 시 `createNote(title, content, tags)` 호출                | `NoteEditor(handleSave) — should call createNote(title, content, tags) when saving in create mode with tags`<br>`NoteEditor(handleSave) — should call createNote with empty array when saving with no tags` | ✅        |
| 생성된 노트의 NoteItem에 입력한 태그가 즉시 표시된다                     | `NotesContext(createNote) — should add note including provided tags to notes state`                                                                                                                         | ✅        |
