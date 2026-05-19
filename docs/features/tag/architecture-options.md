# 태그 기능 아키텍처 비교

> 참조 스펙: `docs/features/tag/spec-fixed.md`
> 비교 기준 코드: `src/types/note.ts`, `src/api/notes.ts`, `src/context/NotesContext.tsx`, `src/components/NoteEditor.tsx`, `src/components/NoteItem.tsx`

---

## 전제 조건 (공통)

세 안 모두 아래 변경이 공통으로 필요하다.

| 항목                | 변경 내용                                 |
| ------------------- | ----------------------------------------- |
| `src/types/note.ts` | `Note` 인터페이스에 `tags: string[]` 추가 |
| `db.json`           | 기존 노트에 `"tags": []` 필드 추가        |
| `NoteItem.tsx`      | `note.tags`가 있을 때 칩 목록 렌더링 추가 |

---

## 안 A — NoteEditor 인라인 확장

태그 상태와 입력 UI를 `NoteEditor` 내부에 직접 작성한다. 새 파일·새 훅 없음.

### 변경 파일

```
src/types/note.ts      — tags: string[] 추가
src/api/notes.ts       — 변경 없음
src/context/NotesContext.tsx — createNote 시그니처 확장
src/components/NoteEditor.tsx — tags 로컬 상태 + 입력 UI 인라인
src/components/NoteItem.tsx — 태그 칩 표시 추가
```

### 1. 데이터 구조

```ts
// src/types/note.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // 추가
  createdAt: string;
  updatedAt: string;
}
```

### 2. API 레이어 변경지점

`src/api/notes.ts` **무변경**.

`updateNote`는 이미 `Partial<Note>`를 받으므로 tags가 Note에 추가되면 자동으로 처리된다. `createNote`도 `Omit<Note, 'id'|'createdAt'|'updatedAt'>` 시그니처 덕분에 tags를 포함한 객체를 그대로 넘길 수 있다.

### 3. 상태관리 변경지점

Context의 `createNote` 메서드 시그니처만 변경한다.

```ts
// 변경 전
createNote: (title: string, content: string) => Promise<void>;

// 변경 후
createNote: (title: string, content: string, tags: string[]) => Promise<void>;
```

Context 내부 구현:

```ts
const createNote = async (title: string, content: string, tags: string[]) => {
  const newNote = await api.createNote({ title, content, tags });
  setNotes((prev) => [...prev, newNote]);
};
```

NoteEditor 로컬 상태에 `tags` 추가:

```ts
const [tags, setTags] = useState<string[]>([]);
const [tagInput, setTagInput] = useState('');
```

### 4. 태그 즉시 저장 동작

```
Enter 키
  → addTag() — trim / 중복 / 길이 검사 → setTags([...tags, newTag])
저장 버튼
  → createNote(title, content, tags)
     또는 updateNote(id, { title, content, tags })
  → onDone()
```

### 5. 컴포넌트 구조

```
NoteEditor (tags, tagInput 로컬 상태 보유)
  └── 태그 입력 블록 (인라인 JSX — 새 컴포넌트 없음)

NoteItem
  └── 태그 칩 목록 (인라인 JSX)
```

### 6. 기존 패턴과의 일관성

- `title`, `content`와 완전히 동일한 로컬 상태 패턴 → **일관성 높음**
- 새 파일·추상화 없음 → 코드베이스 규모에 맞는 단순함
- `createNote` 시그니처가 매개변수 나열 방식 유지 (기존 패턴 동일)

### 7. 테스트 용이성

| 항목        | 평가                                                            |
| ----------- | --------------------------------------------------------------- |
| 단위 테스트 | NoteEditor 내부에 태그 로직이 섞여 있어 태그만 독립 테스트 불가 |
| 통합 테스트 | NoteEditor 렌더 → 입력 → 저장 흐름으로 커버 가능                |
| e2e 테스트  | 문제 없음                                                       |

### 소결

> **최소 변경·가장 빠른 구현.** 태그 로직이 NoteEditor에 묶여 있어, 나중에 태그 관련 규칙(중복 체크, 길이 제한 등)이 복잡해지면 컴포넌트가 비대해진다.

---

## 안 B — TagInput 분리 컴포넌트

태그 입력 UI를 `TagInput` 컴포넌트로 분리한다. 태그 상태는 NoteEditor가 소유하고 TagInput에 controlled 방식으로 내려준다.

### 변경 파일

```
src/types/note.ts
src/context/NotesContext.tsx — createNote 시그니처 확장
src/components/NoteEditor.tsx — tags 상태 소유, <TagInput> 사용
src/components/TagInput.tsx   — 신규: 태그 입력 UI
src/components/NoteItem.tsx
```

### 1. 데이터 구조

안 A와 동일.

### 2. API 레이어 변경지점

안 A와 동일 — `src/api/notes.ts` 무변경.

### 3. 상태관리 변경지점

Context `createNote` 시그니처 확장은 안 A와 동일.

NoteEditor는 `tags` 상태를 소유하고 TagInput에 props로 전달:

```ts
// NoteEditor
const [tags, setTags] = useState<string[]>([]);

const handleAddTag = (tag: string) => {
  const trimmed = tag.trim().slice(0, 20);
  if (!trimmed) return;
  if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
  setTags([...tags, trimmed]);
};

const handleRemoveTag = (tag: string) => {
  setTags(tags.filter((t) => t !== tag));
};
```

### 4. 태그 즉시 저장 동작

안 A와 동일 — 저장 버튼 시 tags를 함께 전달.

### 5. 컴포넌트 구조

```
NoteEditor (tags 상태 소유)
  └── TagInput (controlled)
        props: tags, onAdd, onRemove
        — 입력창 + 칩 렌더링 + Enter 이벤트 처리

NoteItem
  └── 태그 칩 목록 (인라인 JSX 또는 별도 TagChip)
```

`TagInput` 인터페이스:

```ts
interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}
```

### 6. 기존 패턴과의 일관성

- `NoteItem` — props를 받아 렌더하는 컴포넌트 패턴과 동일
- `NoteEditor` — 기존 `title`/`content` 상태 패턴 유지
- 컴포넌트 파일 하나 추가 — 프로젝트 규모 대비 적절한 분리
- 태그 유효성 검사 로직이 NoteEditor에 있음 (TagInput은 순수 표현)

### 7. 테스트 용이성

| 항목             | 평가                                                     |
| ---------------- | -------------------------------------------------------- |
| 단위 테스트      | TagInput을 props만으로 독립 렌더 테스트 가능             |
| 로직 단위 테스트 | 유효성 검사(addTag)는 NoteEditor 내부 — 직접 테스트 불편 |
| 통합 테스트      | NoteEditor → TagInput 흐름 커버 가능                     |
| e2e 테스트       | 문제 없음                                                |

### 소결

> **UI 분리 + 상태는 NoteEditor에.** 프로젝트 패턴과 가장 자연스럽게 어울린다. 태그 로직(유효성 검사)이 NoteEditor에 남아 있어 테스트하려면 컴포넌트 렌더가 필요하다.

---

## 안 C — useTagEditor 커스텀 훅 + TagInput 분리 컴포넌트

태그 상태·유효성 검사·조작 로직을 `useTagEditor` 커스텀 훅으로 추출한다. `TagInput`은 순수 표현 컴포넌트(controlled)로만 동작한다.

### 변경 파일

```
src/types/note.ts
src/context/NotesContext.tsx — createNote 시그니처 확장
src/components/NoteEditor.tsx — useTagEditor 사용
src/components/TagInput.tsx   — 신규: 순수 표현 컴포넌트
src/hooks/useTagEditor.ts     — 신규: 태그 상태 + 로직
src/components/NoteItem.tsx
```

### 1. 데이터 구조

안 A와 동일.

### 2. API 레이어 변경지점

안 A와 동일.

### 3. 상태관리 변경지점

Context 변경은 안 A와 동일.

`useTagEditor` 훅이 태그 관련 상태와 로직 전체를 캡슐화:

```ts
// src/hooks/useTagEditor.ts
export function useTagEditor(initialTags: string[] = []) {
  const [tags, setTags] = useState<string[]>(initialTags);

  const addTag = (raw: string) => {
    const tag = raw.trim().slice(0, 20);
    if (!tag) return;
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    setTags((prev) => [...prev, tag]);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const resetTags = (next: string[]) => setTags(next);

  return { tags, addTag, removeTag, resetTags };
}
```

NoteEditor:

```ts
const { tags, addTag, removeTag, resetTags } = useTagEditor(selectedNote?.tags);
```

`selectedNoteId` 변경 시 useEffect에서 `resetTags` 호출해 초기화.

### 4. 태그 즉시 저장 동작

안 A와 동일. `handleSave`에서 `tags`를 그대로 전달.

### 5. 컴포넌트 구조

```
NoteEditor
  ├── useTagEditor() — 상태·로직 캡슐화
  └── TagInput (controlled, 순수 표현)
        props: tags, onAdd, onRemove

NoteItem
  └── 태그 칩 목록 (인라인 JSX)
```

### 6. 기존 패턴과의 일관성

- 현재 코드베이스에 커스텀 훅(`src/hooks/`)이 없음 → **새 패턴 도입**
- 유사한 프로젝트에서는 자연스러운 패턴이지만, 이 코드베이스 규모에서는 과도한 분리일 수 있음
- TagInput은 완전히 dumb — 재사용성 최대화

### 7. 테스트 용이성

| 항목             | 평가                                                   |
| ---------------- | ------------------------------------------------------ |
| 단위 테스트 (훅) | `renderHook(useTagEditor)`으로 로직만 독립 테스트 가능 |
| 단위 테스트 (UI) | TagInput은 props만으로 독립 렌더 테스트 가능           |
| 통합 테스트      | NoteEditor 전체 흐름 커버 가능                         |
| e2e 테스트       | 문제 없음                                              |

> **세 안 중 테스트 용이성이 가장 높다.**

### 소결

> **관심사 분리 최대화.** 태그 로직을 훅으로 빼면 컴포넌트가 얇아지고 단위 테스트가 쉬워진다. 단, 프로젝트에 훅 레이어가 없어서 팀 합의 없이 도입하면 패턴 불일치가 생긴다.

---

## 종합 비교표

| 기준                 | 안 A (인라인)            | 안 B (TagInput 분리) | 안 C (훅 + 컴포넌트 분리)   |
| -------------------- | ------------------------ | -------------------- | --------------------------- |
| **데이터 구조**      | Note에 tags 추가         | 동일                 | 동일                        |
| **API 레이어 변경**  | 없음                     | 없음                 | 없음                        |
| **Context 변경**     | createNote 시그니처 확장 | 동일                 | 동일                        |
| **로컬 상태 위치**   | NoteEditor               | NoteEditor           | useTagEditor 훅             |
| **태그 로직 위치**   | NoteEditor 내부          | NoteEditor 내부      | useTagEditor 훅             |
| **즉시 저장**        | 저장 버튼 시             | 저장 버튼 시         | 저장 버튼 시                |
| **신규 파일**        | 0                        | 1 (TagInput)         | 2 (TagInput + useTagEditor) |
| **기존 패턴 일관성** | 높음                     | 높음                 | 중간 (훅 레이어 신규)       |
| **단위 테스트**      | 어려움                   | TagInput 가능        | 훅·TagInput 모두 가능       |
| **e2e 테스트**       | 가능                     | 가능                 | 가능                        |
| **구현 속도**        | 빠름                     | 중간                 | 느림                        |

---

## 추천 기준

| 상황                                                                       | 추천     |
| -------------------------------------------------------------------------- | -------- |
| 태그가 이번 릴리스에만 필요하고 이후 확장 없음                             | **안 A** |
| 태그 UI 재사용 가능성이 있거나 테스트 커버를 높이고 싶음                   | **안 B** |
| 프로젝트에 훅 레이어를 도입할 계획이 있고 태그 로직이 복잡해질 가능성 있음 | **안 C** |
