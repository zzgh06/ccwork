# Issue 6 — createNote 기본 tags 보장

> 발견일: 2026-05-20
> 선행 이슈: Issue 5 (TAG-1)
> 관련 이슈: TAG-3 (사용자 태그 입력 UX — 별도)

## 배경

TAG-1(Issue 5) 완료 후 `Note` 타입에 `tags: string[]`가 추가되면, 현재 `NotesContext.createNote` 구현이 두 가지 문제를 일으킨다.

```typescript
// NotesContext.tsx:30 — 현재 구현
const createNote = async (title: string, content: string) => {
  const newNote = await api.createNote({ title, content }); // tags 없음
  setNotes((prev) => [...prev, newNote]);
};
```

1. **TypeScript 에러**: `Note` 타입에 `tags` 필드가 생기면 `{ title, content }`만 넘기는 이 호출이 컴파일 에러가 된다 (`tags` 누락).
2. **데이터 무결성**: json-server에 `tags` 없는 노트가 저장된다. NoteItem이 `note.tags`에 접근할 때 `undefined`가 되어 런타임 에러 위험이 있다.

TAG-3는 "사용자가 생성 폼에서 태그를 입력하는 UX"를 다루므로 이 문제의 범위가 다르다.  
이 이슈는 **사용자 태그 입력과 무관하게**, `createNote`가 항상 `tags: []`를 포함해 저장하도록 보장하는 최소 픽스다.

---

## 시그니처 변경

```typescript
// NotesContext.tsx — 변경 후
const createNote = async (title: string, content: string) => {
  const newNote = await api.createNote({ title, content, tags: [] }); // tags: [] 추가
  setNotes((prev) => [...prev, newNote]);
};
```

`api.createNote`는 `Omit<Note, 'id' | 'createdAt' | 'updatedAt'>`를 받으므로  
`Note`에 `tags` 필드가 추가되는 즉시 `tags: []` 전달이 필수가 된다.

---

## 테스트 시나리오

### 정상

- [정상] api.createNote — POST body에 tags 필드가 포함된다
- [정상] api.createNote — 반환된 노트 객체에 tags 필드가 존재한다
- [정상] NotesContext.createNote — 상태에 추가된 새 노트에 tags 필드가 존재한다

### 경계

- [경계] api.createNote — tags를 명시하지 않아도 빈 배열로 저장된다

---

## AC 커버리지

| AC 항목                                  | 커버하는 시나리오                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| `createNote` POST body에 `tags: []` 포함 | `[정상] api.createNote — POST body에 tags 필드가 포함된다`                      |
| 반환 노트에 `tags` 존재                  | `[정상] api.createNote — 반환된 노트 객체에 tags 필드가 존재한다`               |
| Context 상태의 새 노트에 `tags` 존재     | `[정상] NotesContext.createNote — 상태에 추가된 새 노트에 tags 필드가 존재한다` |
| 빈 배열 기본값 보장                      | `[경계] api.createNote — tags를 명시하지 않아도 빈 배열로 저장된다`             |
