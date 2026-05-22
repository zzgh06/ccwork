# Issue 8 — 시그니처

> 승인일: 2026-05-22

## 동작 변경 — NoteEditor.handleAddTag

```ts
// NoteEditor.tsx — handleAddTag (시그니처 불변, 동작만 변경)
// 시그니처: (tag: string) => void

// 변경 전: 유효성 검사 없이 tag를 바로 추가
// 변경 후: 아래 두 조건을 모두 통과할 때만 setTags 호출
//   1. tag.length <= 20 (trim 후 기준)
//   2. 기존 tags에 tag.toLowerCase()와 동일한 값이 없음
// 두 조건 모두 에러 메시지·피드백 없이 silent하게 처리
```

## 변경 없음

| 항목                | 이유                                    |
| ------------------- | --------------------------------------- |
| `src/types/note.ts` | 타입 변경 없음                          |
| `src/api/notes.ts`  | ADR-2 결정대로 무변경                   |
| `TagInputProps`     | 유효성 검사는 NoteEditor에 위치 (ADR-3) |
| `NotesContext`      | 변경 없음                               |

---

## 테스트 시나리오

### 정상

- [정상] NoteEditor(handleAddTag) — should add tag when tag is exactly 20 characters
- [정상] NoteEditor(handleAddTag) — should add tag when existing tags contain similar value with different case

### 경계

- [경계] NoteEditor(handleAddTag) — should not add tag when tag is 21 characters after trim
- [경계] NoteEditor(handleAddTag) — should add tag when tag with surrounding spaces trims to exactly 20 characters

### 예외

- [예외] NoteEditor(handleAddTag) — should not add tag when exact same tag already exists
- [예외] NoteEditor(handleAddTag) — should not add tag when same tag exists with different case (e.g. "TypeScript" vs "typescript")
- [예외] NoteEditor(handleAddTag) — should not display error message when duplicate tag is entered
- [예외] NoteEditor(handleAddTag) — should not display error message when tag exceeds 20 characters

## AC 커버리지

| AC 항목                                                 | 커버하는 시나리오                                                                                                                      | 커버 여부 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 기존 태그와 동일한 값(대소문자 무시) 입력 시 추가 안 됨 | `should not add tag when exact same tag already exists`<br>`should not add tag when same tag exists with different case`               | ✅        |
| trim 후 21자 이상 태그 추가 안 됨                       | `should not add tag when tag is 21 characters after trim`                                                                              | ✅        |
| trim 후 20자 이하 태그 정상 추가                        | `should add tag when tag is exactly 20 characters`<br>`should add tag when tag with surrounding spaces trims to exactly 20 characters` | ✅        |
| 두 규칙 모두 에러 메시지·피드백 없음                    | `should not display error message when duplicate tag is entered`<br>`should not display error message when tag exceeds 20 characters`  | ✅        |
