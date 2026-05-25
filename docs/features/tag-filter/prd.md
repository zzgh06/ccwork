# 태그 필터링 PRD

## 개요

노트 작성자가 사이드바 상단의 필터 칩을 클릭해 특정 태그가 붙은 노트만 목록에 표시하는 기능이다. TAG-1~4 구현으로 노트에 태그 부착이 가능해졌고, 이번 기능은 그 태그를 탐색 도구로 활용한다. 기존 태그 칩 스타일과 NoteList 빈 상태 패턴을 재사용해 추가 CSS 없이 구현한다.

## 사용자 스토리

- As a 노트 작성자, I want to 사이드바 상단에서 태그를 클릭해 필터를 적용하고 싶다, so that 특정 주제의 노트만 빠르게 찾을 수 있다.
- As a 노트 작성자, I want to 선택된 태그를 다시 클릭해 필터를 해제하고 싶다, so that 전체 노트 목록으로 즉시 돌아올 수 있다.
- As a 노트 작성자, I want to 여러 태그를 동시에 선택하고 싶다(OR), so that 연관 주제의 노트를 한 번에 볼 수 있다.

## 기술 결정 (ADR)

### ADR-1: selectedTags는 App.tsx 소유, 필터링은 NoteList 내부에서 수행

**Context**

`selectedTags: string[]` UI 상태를 어느 레이어에 두는가에 따라 세 안이 있다. 현재 CLAUDE.md는 두 가지 원칙을 명시한다: (1) UI 선택 상태(`selectedNoteId`, `isCreating`)는 `App.tsx`가 소유한다. (2) 컴포넌트는 `useNotes()`로 Context를 직접 호출한다. 두 원칙을 동시에 지키는 안이 필요하다.

**Decision**

`App.tsx`에 `selectedTags: string[]`와 `handleTagToggle` 핸들러를 추가하고, `NoteList`에 `selectedTags`·`onTagToggle` props를 새로 추가한다. `NoteList`는 기존처럼 `useNotes()`로 전체 notes를 가져온 뒤 `selectedTags`를 기준으로 내부에서 필터링한다. 필터 칩 영역도 `NoteList` 상단에 인라인으로 렌더링한다.

```ts
// App.tsx 추가
const [selectedTags, setSelectedTags] = useState<string[]>([]);
const handleTagToggle = (tag: string) => {
  setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
};
```

```tsx
// NoteList 내부 필터링
const allTags = [...new Set(notes.flatMap((n) => n.tags))];
const displayed = selectedTags.length
  ? notes.filter((n) => selectedTags.some((t) => n.tags.includes(t)))
  : notes;
```

```tsx
// App.tsx → NoteList props
<NoteList
  selectedNoteId={selectedNoteId}
  onSelect={handleSelectNote}
  selectedTags={selectedTags}
  onTagToggle={handleTagToggle}
/>
```

**Alternatives**

- **안 A (App.tsx 완전 소유)**: `filteredNotes`·`allTags`를 App.tsx의 useMemo로 계산해 NoteList에 props로 전달. NoteList가 Context를 더 이상 직접 사용하지 않게 되어 "컴포넌트는 useNotes() 호출" 패턴이 이탈하고 NoteList 인터페이스가 4개 props 추가로 대폭 변경된다.
- **안 C (Context 포함)**: `selectedTags`·`toggleTag`·`filteredNotes`를 NotesContext에 추가. CLAUDE.md의 "서버 데이터는 Context, UI 선택 상태는 App.tsx" 원칙과 충돌하며, Context 테스트에 UI 로직이 섞인다.

**Consequences**

- (+) CLAUDE.md의 두 아키텍처 원칙(UI 상태 → App.tsx, Context 직접 사용 → 컴포넌트) 모두 유지
- (+) 기존 NoteList 인터페이스 변경 최소화 — props 2개 추가가 전부
- (+) `selectedTags` 상태가 `selectedNoteId`와 같은 레이어에 있어 코드 탐색 시 예측 가능
- (–) 필터 로직이 NoteList 내부에 인라인으로 존재해 로직만 단위 테스트하려면 별도 순수 함수 추출이 필요

## Out of Scope

이번 구현에서 다루지 않는 것:

- [ ] 텍스트 검색과의 조합 필터 — 제외 이유: 이번 요구사항 없음; `selectedTags` 단독 상태로 충분
- [ ] URL 파라미터 기반 필터 상태 유지(`?tag=react`) — 제외 이유: 페이지 새로고침 시 초기화가 현재 앱 수준에서 자연스러운 동작
- [ ] 서버사이드 필터링(JSON Server `?tags_like=`) — 제외 이유: 노트 수가 적어 클라이언트 필터로 충분; API 레이어 변경 비용 대비 이득 없음
- [ ] AND 로직 다중 필터 — 제외 이유: OR로 확정; 결과가 너무 좁아지는 AND는 현재 노트 수에서 실용성 낮음
- [ ] 태그 칩 영역 접기/펼치기 — 제외 이유: 태그 종류가 많아지는 시점에 별도 기획 필요; 현재는 단순 나열로 충분
- [ ] 필터 상태 유지 (노트 선택·생성 후 복귀 시) — 제외 이유: `selectedTags`가 App.tsx에 있으므로 노트 선택·생성 중에도 상태가 유지됨 (자동 해결)

## 용어 정의

| 용어                  | 정의                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| 활성 태그(Active Tag) | `selectedTags` 배열에 포함된 태그. 사이드바 칩에서 색 반전으로 표시된다.                                |
| 태그 필터(Tag Filter) | 활성 태그 기준으로 노트 목록을 좁히는 UI 상태. `selectedTags.length > 0`일 때 적용된다.                 |
| 필터 칩(Filter Chip)  | 사이드바 상단에 표시되는 클릭 가능한 태그 칩. NoteItem 칩과 스타일을 공유하나 클릭 상호작용이 추가된다. |
| 전체 노트 표시        | `selectedTags`가 빈 배열일 때의 상태. 모든 태그 토글 해제로 자동 진입한다.                              |
