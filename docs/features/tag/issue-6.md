# Issue 6 — 시그니처 (TAG-2: 태그 추가·삭제·저장)

> 승인일: 2026-05-21

## 타입 변경

없음. `Note.tags: string[]`는 Issue 5(TAG-1)에서 이미 추가됨.

## 컴포넌트 Props

```ts
// src/components/TagInput.tsx (신규)
interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}
```

## NoteEditor 로컬 상태 추가

```ts
// 변경 후 (tags 추가)
const [tags, setTags] = useState<string[]>([]);
```

## 함수 시그니처

```ts
// NoteEditor 내부 핸들러 (신규)
handleAddTag(tag: string): void
// - tag.trim() 후 빈 값이면 아무것도 하지 않음
// - 정상이면 tags 배열에 추가

handleRemoveTag(tag: string): void
// - tags 배열에서 해당 tag 제거

// handleSave 변경
// 기존: updateNote(selectedNoteId, { title, content })
// 변경: updateNote(selectedNoteId, { title, content, tags })
```

## useEffect 변경

```ts
// 변경 후: tags도 함께 초기화
useEffect(() => {
  if (selectedNote) {
    setTitle(selectedNote.title);
    setContent(selectedNote.content);
    setTags(selectedNote.tags); // 추가
  } else if (isCreating) {
    setTitle('');
    setContent('');
    setTags([]); // 추가
  }
}, [selectedNoteId, isCreating]);
```

## API / Context 변경

없음. `updateNote(id, Partial<Note>)`가 이미 tags를 수용함 (ADR-2).

---

## 테스트 시나리오

### 정상

- [정상] TagInput — should render tag chips for each item in tags prop
- [정상] TagInput — should call onAdd with trimmed value when Enter is pressed
- [정상] TagInput — should clear input field after Enter is pressed
- [정상] TagInput — should call onRemove with correct tag when × button is clicked
- [정상] TagInput — should reflect new tags when tags prop is updated externally
- [정상] handleAddTag — should add trimmed tag to tags state when valid input given
- [정상] handleAddTag — should trim leading and trailing whitespace before adding
- [정상] handleRemoveTag — should remove only the specified tag from tags state
- [정상] handleRemoveTag — should keep remaining tags unchanged when one is removed
- [정상] NoteEditor — should initialize tags from selectedNote.tags when a note is selected
- [정상] NoteEditor — should reset tags to [] when switching to create mode
- [정상] NoteEditor — should update tags state when switching between different notes
- [정상] handleSave — should call updateNote with current tags when saving edited note
- [정상] handleSave — should call updateNote with newly added tag when tag is added then saved
- [정상] handleSave — should call updateNote without removed tag when tag is removed then saved
- [정상] handleSave — should call updateNote including title, content, and tags together
- [정상] NoteItem — should display updated tags after save
- [정상] NoteItem — should display tags from updated note when note prop is re-received after save

### 경계

- [경계] TagInput — should render no chips when tags prop changes to empty array
- [경계] handleAddTag — should not add tag when input is empty string after trim
- [경계] handleAddTag — should not add tag when input contains whitespace only
- [경계] handleRemoveTag — should result in empty array when the last tag is removed
- [경계] NoteEditor — should initialize tags to [] when selectedNote.tags is empty array

### 예외

- [예외] TagInput — should not call onAdd when Enter is pressed with empty input
- [예외] TagInput — should not call onAdd when Enter is pressed with whitespace-only input

---

## AC 커버리지

| AC 항목                                             | 커버하는 시나리오                                                                                                                                                                                                                                                                       | 커버 여부 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `TagInput.tsx` 생성 (props: tags, onAdd, onRemove)  | `[정상] TagInput — should render tag chips for each item in tags prop`                                                                                                                                                                                                                  | ✅        |
| TagInput은 controlled 컴포넌트                      | `[정상] TagInput — should reflect new tags when tags prop is updated externally` `[경계] TagInput — should render no chips when tags prop changes to empty array`                                                                                                                       | ✅        |
| NoteEditor가 tags 로컬 상태 소유, TagInput에 내려줌 | `[정상] NoteEditor — should initialize tags from selectedNote.tags when a note is selected`                                                                                                                                                                                             | ✅        |
| 노트 전환 시 tags 로컬 상태 초기화                  | `[정상] NoteEditor — should update tags state when switching between different notes`                                                                                                                                                                                                   | ✅        |
| Enter 키 입력 시 태그 칩 생성·입력창 초기화         | `[정상] TagInput — should call onAdd with trimmed value when Enter is pressed` `[정상] TagInput — should clear input field after Enter is pressed`                                                                                                                                      | ✅        |
| 입력값 앞뒤 공백 trim                               | `[정상] handleAddTag — should trim leading and trailing whitespace before adding`                                                                                                                                                                                                       | ✅        |
| 빈 값·공백만 입력 시 추가 안 됨                     | `[경계] handleAddTag — should not add tag when input is empty string after trim` `[경계] handleAddTag — should not add tag when input contains whitespace only`                                                                                                                         | ✅        |
| × 버튼 클릭 시 해당 태그만 제거                     | `[정상] TagInput — should call onRemove with correct tag when × button is clicked` `[정상] handleRemoveTag — should remove only the specified tag from tags state`                                                                                                                      | ✅        |
| 저장 시 `updateNote({ ...note, tags })` 호출        | `[정상] handleSave — should call updateNote with newly added tag when tag is added then saved` `[정상] handleSave — should call updateNote without removed tag when tag is removed then saved` `[정상] handleSave — should call updateNote including title, content, and tags together` | ✅        |
| 저장 후 NoteItem에 변경된 태그 반영                 | `[정상] NoteItem — should display tags from updated note when note prop is re-received after save`                                                                                                                                                                                      | ✅        |
