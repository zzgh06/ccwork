---
name: tdd-red
description: >
  TDD Red 단계 스킬: 승인된 테스트 시나리오(docs/features/tag/issue-{번호}.md)를
  Vitest + React Testing Library로 실패하는 테스트 코드로 변환한다.
  테스트 파일만 생성하고 구현 코드는 절대 건드리지 않는다.

  다음 상황에서 반드시 이 스킬을 사용한다:
  - "/tdd-red <이슈번호>" 형태로 직접 호출할 때
  - "red 단계 시작해줘", "실패하는 테스트 만들어줘", "테스트 코드 작성해줘"를 언급할 때
  - "시나리오를 테스트로 변환", "TDD 시작", "이슈 N번 테스트 작성"을 언급할 때
  - test-scenarios 스킬로 시나리오가 완성된 직후 테스트 코드 작성을 요청할 때
  - GitHub 이슈 기반 TDD 워크플로우에서 Red 단계를 진행할 때
---

# TDD Red — 실패하는 테스트 작성

## 입력

`$ARGUMENTS`로 이슈 번호를 받는다.

```
/tdd-red 5
```

이슈 문서 경로: `docs/features/tag/issue-{$ARGUMENTS}.md`

---

## 핵심 원칙

1. **테스트는 명세다** — 구현을 설명하는 주석이 아니라, "이 동작이 존재해야 한다"는 실행 가능한 요구사항이다.

2. **실패의 질이 중요하다** — 어떤 이유든 실패하면 Red지만, 실패 메시지가 구현 방향을 알려줄수록 좋은 테스트다.

   | 실패 유형       | 예시 메시지                                     | 품질                                     |
   | --------------- | ----------------------------------------------- | ---------------------------------------- |
   | Assertion 실패  | `Unable to find element with text: "react"`     | ✅ 좋음 (무엇을 구현할지 명확)           |
   | TypeScript 에러 | `Property 'tags' does not exist on type 'Note'` | ✅ 허용 (타입 레벨 시나리오)             |
   | 모듈 없음       | `Cannot find module './tags'`                   | ⚠️ 지양 (대상 파일이 이미 존재하는 경우) |

3. **구현 코드 수정 금지** — `src/`의 구현 파일(`.ts`, `.tsx`), `db.json`, 설정 파일은 일절 건드리지 않는다. 오직 테스트 파일만 생성·수정한다.

4. **시나리오 1:1 매핑** — 이슈 문서의 시나리오 하나가 `it` 블록 하나에 정확히 대응한다. 이슈에 없는 테스트를 추가하지 않는다.

5. **즉시 실행 원칙** — 시나리오 하나를 작성하는 즉시 실행해 실패를 확인한다. 모아서 나중에 확인하지 않는다.

6. **전체 실행으로 마무리** — 모든 시나리오 작성 완료 후 `npm test`를 실행해 신규 테스트가 전부 실패하고, 기존 테스트가 여전히 통과함을 확인한다.

---

## 테스트 파일 컨벤션

### 위치

테스트 파일은 대상 코드와 **같은 디렉토리**에 위치한다.

| 대상 코드                     | 테스트 파일                        |
| ----------------------------- | ---------------------------------- |
| `src/api/tags.ts`             | `src/api/tags.test.ts`             |
| `src/components/TagInput.tsx` | `src/components/TagInput.test.tsx` |
| `src/types/note.ts`           | `src/types/note.test.ts`           |
| `src/hooks/useTags.ts`        | `src/hooks/useTags.test.ts`        |
| `db.json`                     | `src/db.test.ts`                   |

### 네이밍

- TypeScript 파일: `{파일명}.test.ts`
- React 컴포넌트: `{파일명}.test.tsx`

### 사용 도구

| 도구                        | 역할                                       | import 필요 여부                           |
| --------------------------- | ------------------------------------------ | ------------------------------------------ |
| Vitest                      | 테스트 러너 (`describe` / `it` / `expect`) | ❌ (`globals: true`로 전역 설정됨)         |
| `expectTypeOf`              | 타입 레벨 assertion                        | ✅ `import { expectTypeOf } from 'vitest'` |
| `@testing-library/react`    | 컴포넌트 render + DOM 쿼리                 | ✅                                         |
| `@testing-library/jest-dom` | `toBeInTheDocument()` 등 matcher           | ❌ (`setupFiles`에서 전역 로드됨)          |
| `node:fs`                   | `db.json` 직접 읽기                        | ✅                                         |

> `globals: true`이므로 `describe`, `it`, `expect`, `beforeEach` 등은 import 없이 사용한다.
> jest-dom의 `toBeInTheDocument()`, `toHaveAttribute()` 등도 import 없이 사용 가능하다.

### describe + it 블록

`describe`는 함수/컴포넌트명으로, `it`은 이슈 시나리오 이름 그대로 작성한다.
`it` 설명은 한글로 작성해도 무방하다. 시나리오가 많으면 `describe`를 중첩해 조건별로 묶는다.
각 `it` 블록은 Arrange → Act → Assert 순서로 작성하며, 공통 fixture는 `makeXxx` 헬퍼로 추출한다.

```typescript
describe('NoteItem', () => {
  describe('태그가 있을 때', () => {
    it('태그 칩을 렌더링한다', () => { ... })
    it('태그 개수만큼 칩을 분리 렌더링한다', () => { ... })
  })
  describe('태그가 없을 때', () => {
    it('태그 영역을 렌더링하지 않는다', () => { ... })
  })
})
```

---

## 파이프라인

```
이슈 문서 읽기
    ↓
테스트 파일 경로 결정
    ↓
┌─────────────────────────────────────┐
│  시나리오 하나씩 반복               │
│    1. 테스트 코드 작성              │
│    2. npx vitest run {파일}         │
│    3. 실패 확인 + 메시지 품질 점검  │
└─────────────────────────────────────┘
    ↓
npm test (전체 검증)
    ↓
완료 보고
```

---

## 단계별 상세

### 1단계 — 이슈 문서 읽기

`docs/features/tag/issue-{번호}.md`에서 파악할 것:

- **시그니처 섹션**: 변경 대상 파일 경로, 타입 추가/변경, 컴포넌트 props, API 함수 시그니처
- **테스트 시나리오 섹션**: `[정상]` / `[경계]` / `[예외]` 분류별 시나리오 전체 목록
- **AC 커버리지 테이블**: 시나리오가 어떤 인수 기준(AC)을 커버하는지 확인

### 2단계 — 테스트 파일 경로 결정

시그니처에 명시된 파일 경로를 기준으로 테스트 파일을 특정한다.
여러 대상 파일이 있으면 각각 별도 테스트 파일을 만든다.
파일 존재 여부를 확인하고, 있으면 append 모드로 진행한다.

### 3단계 — 시나리오별 테스트 작성

아래 "테스트 작성 패턴" 섹션에서 대상 유형에 맞는 패턴을 선택해 작성한다.

### 4단계 — 작성 직후 즉시 실행

```bash
npx vitest run src/경로/파일.test.ts
```

실패 확인 후 **메시지 품질 점검**:

- 실패 메시지가 "무엇이 없는지"를 말해주면 좋은 Red → 다음으로 이동
- "모듈 없음" 같은 인프라 에러면 fixture나 import 경로를 재확인해 assertion 레벨로 끌어내린다

### 5단계 — 전체 검증

```bash
npm test
```

확인 항목:

- 새로 작성한 테스트 → **전부 실패**
- 기존 통과 테스트 → **여전히 통과** (회귀 없음)

---

## 테스트 작성 패턴

### 패턴 A — 타입 레벨 (인터페이스 필드 추가/변경)

`expectTypeOf`는 런타임이 아닌 타입 수준에서 검사한다.
`tags: string[]`가 `Note` 인터페이스에 없으면 컴파일 단계에서 실패한다.

```typescript
// 대상 코드:  src/types/note.ts
// 테스트 파일: src/types/note.test.ts

import type { Note } from './note';
import { expectTypeOf } from 'vitest';

describe('Note 타입', () => {
  it('tags 필드가 string[] 타입으로 존재해야 한다', () => {
    expectTypeOf<Note>().toHaveProperty('tags').toEqualTypeOf<string[]>();
  });
});
```

### 패턴 B — 컴포넌트 (React Testing Library)

대상 파일이 이미 존재하므로 실패는 반드시 **assertion 레벨**에서 일어나야 한다.
공통 fixture를 `makeNote` 헬퍼로 분리해 각 테스트가 필요한 필드만 override한다.

```typescript
// 대상 코드:  src/components/NoteItem.tsx
// 테스트 파일: src/components/NoteItem.test.tsx

import { render, screen } from '@testing-library/react'
import { NoteItem } from './NoteItem'
import type { Note } from '../types/note'

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: '테스트 노트',
  content: '내용',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

const defaultProps = {
  isSelected: false,
  onSelect: () => {},
  onDelete: () => {},
}

describe('NoteItem', () => {
  describe('태그가 있을 때', () => {
    it('태그 칩을 렌더링한다', () => {
      // Arrange
      const note = makeNote({ tags: ['react', 'study'] })
      // Act
      render(<NoteItem note={note} {...defaultProps} />)
      // Assert
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('study')).toBeInTheDocument()
    })

    it('태그 개수만큼 칩을 분리 렌더링한다', () => {
      const note = makeNote({ tags: ['react', 'ts', 'study'] })
      render(<NoteItem note={note} {...defaultProps} />)
      expect(screen.getAllByRole('listitem')).toHaveLength(3)
    })

    it('태그가 1개일 때 칩 1개를 렌더링한다', () => {
      const note = makeNote({ tags: ['react'] })
      render(<NoteItem note={note} {...defaultProps} />)
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
  })

  describe('태그가 없을 때', () => {
    it('tags가 빈 배열이면 태그 영역을 렌더링하지 않는다', () => {
      render(<NoteItem note={makeNote({ tags: [] })} {...defaultProps} />)
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('tags가 undefined이면 태그 영역을 렌더링하지 않는다', () => {
      // 하위 호환 시나리오 — undefined여도 크래시 없이 태그 영역 미렌더
      const note = makeNote({ tags: undefined as unknown as string[] })
      render(<NoteItem note={note} {...defaultProps} />)
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })
  })
})
```

### 패턴 C — 데이터 무결성 (db.json)

`readFileSync`로 직접 읽어 구조를 검사한다. `process.cwd()`는 프로젝트 루트를 가리킨다.

```typescript
// 대상 코드:  db.json (프로젝트 루트)
// 테스트 파일: src/db.test.ts

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('db.json', () => {
  it('모든 노트 객체에 tags 필드가 존재해야 한다', () => {
    // Arrange
    const raw = readFileSync(resolve(process.cwd(), 'db.json'), 'utf-8');
    const db = JSON.parse(raw) as { notes: Record<string, unknown>[] };

    // Assert
    expect(db.notes.length).toBeGreaterThan(0);
    db.notes.forEach((note, i) => {
      expect(note, `notes[${i}]에 tags 필드 없음`).toHaveProperty('tags');
      expect(Array.isArray(note.tags), `notes[${i}].tags가 배열이 아님`).toBe(true);
    });
  });
});
```

### 패턴 D — 순수 함수 / 유틸

```typescript
// 대상 코드:  src/utils/tags.ts
// 테스트 파일: src/utils/tags.test.ts

import { addTag, removeTag } from './tags';

describe('addTag', () => {
  it('유효한 태그를 추가하면 새 배열을 반환한다', () => {
    const result = addTag(['react'], 'typescript');
    expect(result).toEqual(['react', 'typescript']);
  });

  it('중복 태그를 추가하면 에러를 던진다', () => {
    expect(() => addTag(['react'], 'react')).toThrow();
  });
});

describe('removeTag', () => {
  it('존재하는 태그를 제거하면 해당 태그가 빠진 배열을 반환한다', () => {
    const result = removeTag(['react', 'typescript'], 'react');
    expect(result).toEqual(['typescript']);
  });
});
```

---

## 자주 하는 실수

### 1. 통과하는 테스트를 작성한다

Red 단계의 테스트는 반드시 실패해야 한다. 작성 후 실행했을 때 통과하면 assertion이 잘못된 것이다.

```typescript
// ❌ 항상 통과 — 아무것도 검증하지 않음
it('태그 칩을 렌더링한다', () => {
  render(<NoteItem note={note} {...defaultProps} />)
  expect(true).toBe(true)
})

// ✅ 구현이 없으면 실패
expect(screen.getByText('react')).toBeInTheDocument()
```

### 2. 막연한 assertion을 쓴다

`toBeTruthy()`, `toBeDefined()`는 구현이 없어도 통과하는 경우가 있다. 구체적인 값으로 검증한다.

```typescript
// ❌ 막연한 검증
expect(result).toBeDefined();

// ✅ 구체적인 기대값
expect(result).toEqual(['react', 'typescript']);
```

### 3. 모듈 없음 에러를 그대로 둔다

대상 파일이 이미 존재하는데 `Cannot find module` 에러가 나면 import 경로가 잘못된 것이다. 인프라 에러가 아닌 assertion 실패 상태로 만들어야 한다.

### 4. fixture의 타입 에러를 src/ 파일을 수정해서 해결한다

`makeNote`에서 `tags` 필드를 쓸 때 `Note` 타입에 `tags`가 없어 타입 에러가 나는 것은 **의도된 Red 상태**다. `src/types/note.ts`를 수정해 해결하려 하면 안 된다.

### 5. 기존 테스트 파일을 덮어쓴다

테스트 파일이 이미 존재하면 기존 `describe` 블록에 `it`만 추가한다. 파일 전체를 새로 쓰면 기존 테스트가 사라진다.

### 6. 시나리오에 없는 테스트를 추가한다

이슈 문서에 없는 케이스를 "있으면 좋을 것 같아서" 추가하지 않는다. 시나리오 1:1 매핑이 원칙이다.

### 7. 즉시 실행 단계를 건너뛴다

모든 시나리오를 먼저 작성하고 나중에 한 번에 실행하면, 어떤 테스트가 왜 실패하는지 파악하기 어렵다. 하나씩 작성하고 즉시 실행한다.

### 8. 마지막 `npm test` 를 생략한다

개별 파일 실행만으로 마무리하면 기존 테스트에 회귀가 생겼는지 확인할 수 없다. 반드시 `npm test`로 전체를 검증한다.

### 9. 부정 assertion 테스트가 통과해도 Red 실패로 착각한다

`not.toBeInTheDocument()` 같은 부정 assertion은 대상 요소가 **아예 존재하지 않는** 현재 상태에서 trivially 통과한다. 이는 Red 실패가 아니다.

```typescript
// tags 구현이 없는 상태에서 queryByRole('list')는 null 반환
// expect(null).not.toBeInTheDocument() → 통과 (Red 아님)
it('tags가 빈 배열이면 태그 영역을 렌더링하지 않는다', () => {
  render(<NoteItem note={makeNote({ tags: [] })} {...defaultProps} />)
  expect(screen.queryByRole('list')).not.toBeInTheDocument() // ← trivially 통과
})
```

이런 테스트는 **Red를 달성하지 못했지만 작성 자체는 올바르다**. 구현 전 마크업 구조가 확정되지 않은 시점에서 "없어야 한다"를 실패로 만들 방법이 없기 때문이다. 이 테스트들은 Green 단계에서 의미가 생긴다 — 태그 렌더링 구현 후 실수로 빈 리스트를 렌더링하면 그때 잡아낸다.

완료 보고 시 이런 테스트는 Red 카운트에서 분리해 명시한다:

```
실패 (Red): 5개 — 구현을 강제하는 테스트
통과 (회귀 방지): 2개 — Green 이후 의미 발생
```

---

## 완료 보고 형식

```
완료: src/types/note.test.ts           (1개 시나리오)
완료: src/components/NoteItem.test.tsx (5개 시나리오)
완료: src/db.test.ts                   (1개 시나리오)

실패 현황:
- Note 타입 / tags 필드가 string[] 타입으로 존재해야 한다
    → Property 'tags' does not exist on type 'Note'

- NoteItem / 태그 칩을 렌더링한다
    → Unable to find an element with the text: "react"

- NoteItem / tags가 빈 배열이면 태그 영역을 렌더링하지 않는다
    → Expected element not to be in document, but it was found

- db.json / 모든 노트 객체에 tags 필드가 존재해야 한다
    → notes[0]에 tags 필드 없음

npm test: 7 failed, 기존 테스트 모두 통과
```
