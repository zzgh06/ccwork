# Issue 5 — 시그니처

> 승인일: 2026-05-19

## 타입 변경

```ts
// src/types/note.ts
// 변경 전
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 변경 후
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // 추가
  createdAt: string;
  updatedAt: string;
}
```

## 컴포넌트 Props — 변경 없음

`NoteItemProps`의 `note: Note` prop이 타입 변경만으로 tags를 자동 포함. Props 시그니처 수정 불필요.

```ts
// 변경 없음 — note.tags로 접근 가능해짐
interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
```

## API / Context — 변경 없음

ADR-2 결정에 따라 `api/notes.ts`의 `updateNote(id, updates: Partial<Note>)`는 tags를 자동 수용. 이슈 #5 범위에서 Context 메서드 변경 없음.

## 데이터 변경

```json
// db.json — 기존 노트 객체에 tags 필드 추가
{ "tags": [] }
```

---

## 테스트 시나리오

### 정상

- [정상] Note 타입 — should include tags field of type string[]
- [정상] NoteItem — should render tag chips when note.tags is ["react", "study"]
- [정상] NoteItem — should render each tag as a separate chip when multiple tags exist

### 경계

- [경계] NoteItem — should not render tag area when note.tags is []
- [경계] NoteItem — should render single chip when note.tags has exactly one element
- [경계] db.json — should have tags field on every existing note object

### 예외

- [예외] NoteItem — should not render tag area when note.tags is undefined (하위 호환)

---

## AC 커버리지

| AC 항목                                        | 커버하는 시나리오                                                                | 커버 여부 |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | --------- |
| `Note` 인터페이스에 `tags: string[]` 필드 추가 | `[정상] Note 타입 — should include tags field of type string[]`                  | ✅        |
| `db.json` 기존 노트에 `"tags": []` 필드 포함   | `[경계] db.json — should have tags field on every existing note object`          | ✅        |
| NoteItem 카드 하단에 태그 칩 목록 렌더링       | `[정상] NoteItem — should render tag chips when note.tags is ["react", "study"]` | ✅        |
| `tags`가 빈 배열이면 태그 영역 DOM 미렌더링    | `[경계] NoteItem — should not render tag area when note.tags is []`              | ✅        |
