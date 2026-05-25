# Issue 18 — 시그니처

> 승인일: 2026-05-25

## 타입 변경

타입 변경 없음. 기존 `Note` 인터페이스(`src/notes/types.ts`)는 그대로 사용한다.

## 컴포넌트 Props

### App.tsx (상태 추가)

```ts
// 기존 상태에 추가
const [searchQuery, setSearchQuery] = useState<string>('');
```

### NoteListProps (변경)

```ts
interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  searchQuery: string; // 추가
  onSearchChange: (query: string) => void; // 추가
}
```

## 함수 시그니처

### App.tsx

```ts
// handleSearchChange(query: string): void
// searchQuery 상태를 업데이트하는 핸들러
```

### NoteList.tsx 내부 필터링

```ts
// filteredNotes: Note[]
// 기존 selectedTags 필터에 searchQuery(trim 후) AND 조건으로 title·content substring 매칭 결합
```

## Context 메서드 변경

없음. `NotesContext`는 변경하지 않는다. 검색어는 순수 UI 상태이므로 `App.tsx` 로컬 상태로 관리한다.

---

## 테스트 시나리오

### 정상

- [정상] NoteList — should display only notes whose title contains the search query when searchQuery matches a title substring
- [정상] NoteList — should display only notes whose content contains the search query when searchQuery matches a content substring
- [정상] NoteList — should display all notes when searchQuery is cleared (empty string)
- [정상] NoteList — should apply AND condition when both searchQuery and selectedTags are active

### 경계

- [경계] NoteList — should display all notes when searchQuery contains only whitespace (trim() results in empty string)
- [경계] NoteList — should match case-insensitively when searchQuery uses different casing than note title or content
- [경계] NoteList — should display all notes when searchQuery is an empty string on initial render

### 예외

- [예외] NoteList — should display "'{검색어}'에 대한 검색 결과가 없습니다" message when no notes match the searchQuery
- [예외] NoteList — should display no-result message when searchQuery matches nothing even if selectedTags filter is empty

---

## AC 커버리지

| AC   | 설명                                        | 커버 시나리오                                                                         |
| ---- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| AC-1 | 제목 일부 입력 시 해당 노트만 표시          | [정상] NoteList — should display only notes whose title contains the search query     |
| AC-2 | 내용 일부 입력 시 해당 노트만 표시          | [정상] NoteList — should display only notes whose content contains the search query   |
| AC-3 | 검색창 지우면 전체 목록 복원                | [정상] NoteList — should display all notes when searchQuery is cleared (empty string) |
| AC-4 | 없는 키워드 입력 시 "결과 없음" 메시지 표시 | [예외] NoteList — should display "'{검색어}'에 대한 검색 결과가 없습니다" message     |
| AC-5 | 공백만 입력 시 전체 목록 표시               | [경계] NoteList — should display all notes when searchQuery contains only whitespace  |
