# Issue 15 — 시그니처

> 승인일: 2026-05-25

## NoteListProps 변경

```ts
// 변경 전
interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
}

// 변경 후
interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}
```

## App.tsx — 새 상태 및 핸들러

```ts
const [selectedTags, setSelectedTags] = useState<string[]>([]);

// handleTagToggle(tag: string): void
// - selectedTags에 tag가 없으면 추가, 있으면 제거
```

## NoteList 내부 로직 시그니처

```ts
// allTags: string[] — notes 전체에서 중복 없이 수집한 태그 목록
// filteredNotes: Note[] — selectedTags가 비어 있으면 전체 notes,
//                         아니면 selectedTags 중 하나 이상을 가진 노트만(OR)
```

## Context / API 변경

없음 — NotesContext와 src/api/notes.ts는 이번 이슈에서 변경하지 않는다.

---

## 테스트 시나리오

### 정상

- [정상] NoteList — should render filter chips for all unique tags collected from notes when notes have tags
- [정상] NoteList — should show only notes that have the clicked tag when a filter chip is clicked
- [정상] NoteList — should show all notes when an active chip is clicked again (deactivated)
- [정상] NoteList — should show notes that have at least one of the selected tags (OR) when multiple chips are active
- [정상] NoteList — should display chip as active (visually distinct) when its tag is in selectedTags
- [정상] NoteList — should display chip as inactive when its tag is not in selectedTags

### 경계

- [경계] NoteList — should not render filter chip area when all notes have empty tags arrays
- [경계] NoteList — should collect unique tags without duplicates when multiple notes share the same tag

### 예외

- [예외] NoteList — should show "해당 태그의 노트가 없습니다" message when no notes match the selected tag combination
- [예외] NoteList — should not render filter chip area at all when notes list is empty

## AC 커버리지

| AC 항목                                                       | 커버하는 시나리오                                                                                  | 커버 여부 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| 사이드바 로드 시 "react"·"study" 필터 칩 표시                 | should render filter chips for all unique tags...                                                  | ✅        |
| "react" 칩 클릭 → 활성(색 반전) + "react" 태그 노트만 표시    | should display chip as active... + should show only notes that have the clicked tag...             | ✅        |
| "react" 칩 재클릭 → 비활성 + 전체 목록 표시                   | should show all notes when an active chip is clicked again... + should display chip as inactive... | ✅        |
| "react"·"study" 모두 활성 → OR 필터 노트 표시                 | should show notes that have at least one of the selected tags (OR)...                              | ✅        |
| 선택 태그 조합 일치 노트 없음 → "해당 태그의 노트가 없습니다" | should show "해당 태그의 노트가 없습니다" message...                                               | ✅        |
| 모든 notes.tags 빈 배열 → 필터 칩 영역 미렌더링               | should not render filter chip area when all notes have empty tags arrays                           | ✅        |
