# Issue 10 — 시그니처

> 승인일: 2026-05-22

## 동작 변경 — NoteItem 태그 필터링

```ts
// NoteItem.tsx — 태그 칩 렌더링 (시그니처 불변, 동작만 변경)
// 이미 적용된: [...new Set(note.tags)].map(...)  → 중복 제거 (Issue #9)

// 변경 후: 빈 문자열·공백만인 태그 추가 필터링
// [...new Set(note.tags)]
//   .filter(tag => tag.trim() !== '')  ← 신규
//   .map((tag) => <li key={tag}>...)
```

## 변경 없음

| 항목               | 이유                     |
| ------------------ | ------------------------ |
| `NoteItemProps`    | props 시그니처 변경 없음 |
| 타입, API, Context | 변경 없음                |

---

## 테스트 시나리오

### 정상

- [x] [정상] NoteItem — should render only valid chips when tags contains both valid and empty strings

### 경계

- [x] [경계] NoteItem — should not render chip for empty string tag
- [x] [경계] NoteItem — should not render chip for whitespace-only tag
- [x] [경계] NoteItem — should not render tag area when all tags are empty or whitespace

### 예외

- [x] [예외] NoteItem — should render remaining valid chips when tags is ["react", "", "study"]

## AC 커버리지

| AC(제안) 항목                          | 커버하는 시나리오                                                                                                                                             | 커버 여부 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 빈 문자열 태그 칩 미렌더링             | `should not render chip for empty string tag`                                                                                                                 | ✅        |
| 공백만인 태그 칩 미렌더링              | `should not render chip for whitespace-only tag`                                                                                                              | ✅        |
| 유효 태그와 혼재 시 유효 태그만 렌더링 | `should render only valid chips when tags contains both valid and empty strings`<br>`should render remaining valid chips when tags is ["react", "", "study"]` | ✅        |
| 전체가 빈값이면 태그 영역 미렌더링     | `should not render tag area when all tags are empty or whitespace`                                                                                            | ✅        |
