# 태그 필터링 이슈 목록

> 수직 슬라이싱 원칙 적용 — 필터 칩 표시·토글·필터링·빈 상태가 하나의 완결된 사용자 경험이므로 단일 이슈로 구성한다.

---

## 이슈 요약

| #                     | 제목                                  | 관련 스토리      | 선행 이슈         |
| --------------------- | ------------------------------------- | ---------------- | ----------------- | ------------------------------------------ |
| [FILTER-1](#filter-1) | 사이드바 태그 칩으로 노트 목록 필터링 | US-1, US-2, US-3 | TAG-1~4 완료 전제 | https://github.com/zzgh06/ccwork/issues/15 |

---

## FILTER-1

### 사이드바 태그 칩으로 노트 목록 필터링

**목표**: 사용자가 사이드바 상단의 태그 칩을 클릭해 해당 태그가 붙은 노트만 목록에서 볼 수 있다.

**범위**:

- 수정: `src/App.tsx` — `selectedTags: string[]` 상태·`handleTagToggle` 핸들러 추가; NoteList에 `selectedTags`·`onTagToggle` props 전달
- 수정: `src/components/NoteList.tsx` — `selectedTags`·`onTagToggle` props 추가; 전체 notes에서 중복 없이 태그 수집; 사이드바 상단 필터 칩 영역 렌더링; OR 필터링 로직; 필터 빈 상태 메시지

**의존성**: 없음 (TAG-1~4 완료 전제 — `Note.tags: string[]` 및 NoteItem 칩 스타일이 이미 존재)

## Acceptance Criteria

- [ ] Given 노트 목록에 "react"·"study" 태그를 가진 노트가 있을 때, When 사이드바를 로드하면, Then 사이드바 상단에 "react"·"study" 필터 칩이 표시된다
- [ ] Given 필터 칩이 표시될 때, When "react" 칩을 클릭하면, Then "react" 칩이 활성(색 반전) 상태로 변경되고 "react" 태그를 가진 노트만 목록에 표시된다
- [ ] Given "react" 칩이 활성 상태일 때, When "react" 칩을 다시 클릭하면, Then 칩이 비활성 상태로 돌아오고 전체 노트 목록이 표시된다
- [ ] Given "react"·"study" 칩이 모두 활성 상태일 때, When 목록을 확인하면, Then "react" 또는 "study" 태그를 하나라도 가진 노트(OR)가 표시된다
- [ ] Given 선택된 태그 조합과 일치하는 노트가 없을 때, When 목록을 확인하면, Then "해당 태그의 노트가 없습니다" 메시지가 표시된다
- [ ] Given 모든 노트의 tags가 빈 배열일 때, When 사이드바를 로드하면, Then 필터 칩 영역이 렌더링되지 않는다
