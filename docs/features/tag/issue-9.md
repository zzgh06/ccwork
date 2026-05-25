# Issue 9 — 시그니처

> 승인일: 2026-05-22

## 동작 변경 — NoteItem 태그 렌더링 (Policy B)

```ts
// NoteItem.tsx — 태그 칩 렌더링 (시그니처 불변, 동작만 변경)

// 변경 전: note.tags를 그대로 map → 중복 시 key 충돌
// {note.tags.map((tag) => <li key={tag}>...)}

// 변경 후: 렌더링 전 중복 제거 (Policy B 방어 코드)
// [...new Set(note.tags)].map((tag) => <li key={tag}>...)
// → 중복 태그가 있어도 고유 태그만 렌더링, key 중복 없음
```

## 변경 없음

| 항목               | 이유                     |
| ------------------ | ------------------------ |
| `NoteItemProps`    | props 시그니처 변경 없음 |
| 타입, API, Context | 변경 없음                |

---

## 테스트 시나리오

### 정상

- [x] [정상] NoteItem — should render only unique chips when tags contain exact duplicates

### 경계

- [x] [경계] NoteItem — should render 1 chip when tags is ["react", "react"]
- [x] [경계] NoteItem — should render 2 chips when tags is ["react", "React"] (Set은 case-sensitive)

### 예외

- [x] [예외] NoteItem — should not emit React key warning when tags contain duplicates

## AC 커버리지

| AC(제안) 항목                        | 커버하는 시나리오                                                                                                              | 커버 여부 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 중복 tags 시 고유 태그만 렌더링      | `should render only unique chips when tags contain exact duplicates`<br>`should render 1 chip when tags is ["react", "react"]` | ✅        |
| key 중복 경고 없음                   | `should not emit React key warning when tags contain duplicates`                                                               | ✅        |
| Set dedup의 case-sensitive 특성 명시 | `should render 2 chips when tags is ["react", "React"]`                                                                        | ✅        |
