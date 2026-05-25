---
name: e2e-write
description: >
  PRD(docs/features/{기능명}/prd.md)의 사용자 스토리를 읽어 Playwright E2E 테스트 코드를 생성하는 스킬.
  단위 테스트(Vitest)가 담당하는 검증은 E2E에서 중복하지 않고, 실제 사용자 플로우·서버 연동·
  컴포넌트 간 상태 전파만 검증한다.

  다음 상황에서 반드시 이 스킬을 사용한다:
  - "/e2e-write <기능명>" 형태로 직접 호출할 때
  - "e2e 테스트 작성해줘", "playwright 테스트 만들어줘", "e2e 시나리오 코드로 변환해줘"를 언급할 때
  - PRD 또는 사용자 스토리를 기반으로 E2E 테스트를 요청할 때
  - "사용자 플로우 테스트", "통합 테스트 코드 작성"을 언급할 때
---

# e2e-write — PRD → Playwright E2E 테스트 변환

## 입력

`$ARGUMENTS`로 기능명을 받는다.

```
/e2e-write tag
/e2e-write note
```

기능명은 `docs/features/{기능명}/prd.md` 경로에 사용된다.

---

## 단계 1 — 컨텍스트 수집

다음 파일들을 읽어 작업 맥락을 파악한다. 각 파일에서 무엇을 추출할지 명시한다.

| 파일                            | 추출 목적                                    |
| ------------------------------- | -------------------------------------------- |
| `docs/features/{기능명}/prd.md` | 사용자 스토리(US-N), 인수 조건(AC) 파악      |
| `playwright.config.ts`          | baseURL, webServer 설정 확인                 |
| `tests/` 디렉토리               | 기존 E2E 파일 구조·패턴 파악                 |
| `src/components/*.tsx`          | 실제 UI 텍스트, 역할(role), placeholder 확인 |
| `src/components/*.test.tsx`     | 단위 테스트가 이미 커버하는 검증 목록 파악   |

> **왜 단위 테스트를 읽는가?**
> 단위 테스트가 이미 검증한 조건(빈 입력 처리, 중복 방지, 길이 제한 등)을 E2E에서 반복하면
> 테스트 유지 비용만 늘고 신뢰성은 높아지지 않는다. 각 레이어가 고유한 영역을 담당해야 한다.

---

## 단계 2 — E2E 시나리오 설계 (승인 게이트)

### 포함 원칙 (E2E가 담당해야 하는 것)

- **전체 사용자 플로우**: 여러 컴포넌트를 거치는 인터랙션 시퀀스
- **서버 연동 결과 확인**: JSON Server에 실제로 저장되고 다시 읽혀 오는지
- **컴포넌트 간 상태 전파**: 저장 후 사이드바(NoteItem)가 즉시 갱신되는지
- **영속성**: 새로고침 후에도 데이터가 유지되는지

### 제외 원칙 (단위 테스트에 위임)

- 개별 컴포넌트의 props별 렌더링 변형 (TagInput, NoteItem 단위 테스트가 담당)
- 유효성 검사 세부 로직 (빈 값·공백·길이 초과·대소문자 중복 — NoteEditor.test.tsx가 담당)
- React key 경고, console.error 감지 등 내부 동작

### 설계 결과 형식

시나리오를 설계한 뒤 **반드시 아래 형식으로 사용자에게 보여주고 승인을 받는다.**
승인 없이 코드를 작성하지 않는다.

```
## E2E 시나리오 목록 — {기능명}

| # | describe 그룹 | 시나리오 설명 | 근거 US |
|---|---------------|---------------|---------|
| 1 | 노트 생성      | 태그와 함께 노트를 생성하면 사이드바 카드에 태그가 표시된다 | US-1, US-4 |
| 2 | ...           | ...           | ...     |

단위 테스트와 중복을 피하기 위해 아래 검증은 E2E에서 제외합니다:
- ...

승인하시면 tests/{기능명}.spec.ts 를 작성하겠습니다.
```

---

## 단계 3 — E2E 테스트 코드 작성

승인 후 `tests/{기능명}.spec.ts`를 생성한다.

### 파일 구조 템플릿

```typescript
import { test, expect, type Page } from '@playwright/test';

// 테스트 픽스처 상수 — 하드코딩된 값은 여기에 모아 관리
const FIXTURES = {
  note: { title: '테스트 노트', content: '테스트 내용' },
  tag: { valid: 'playwright', another: 'e2e' },
} as const;

// 사전 데이터 세팅 헬퍼 — API로 상태 준비
async function createNoteViaAPI(tags: string[] = []): Promise<string> {
  const res = await fetch('http://localhost:3001/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: FIXTURES.note.title,
      content: FIXTURES.note.content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  });
  const note = await res.json();
  return note.id as string;
}

async function cleanupNotes(): Promise<void> {
  const res = await fetch('http://localhost:3001/notes');
  const notes = (await res.json()) as Array<{ id: string }>;
  await Promise.all(
    notes.map((n) => fetch(`http://localhost:3001/notes/${n.id}`, { method: 'DELETE' })),
  );
}

test.describe('{기능명} — 사용자 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupNotes();
    await page.goto('/');
  });

  test.afterAll(async () => {
    await cleanupNotes();
  });

  test('...', async ({ page }) => {
    // ...
  });
});
```

### Locator 규칙

| 우선순위 | 사용               | 예시                                         |
| -------- | ------------------ | -------------------------------------------- |
| 1순위    | `getByRole`        | `page.getByRole('button', { name: '저장' })` |
| 2순위    | `getByLabel`       | `page.getByLabel('제목')`                    |
| 3순위    | `getByPlaceholder` | `page.getByPlaceholder('태그 입력')`         |
| 4순위    | `getByText`        | `page.getByText('react')`                    |
| **금지** | CSS 선택자, XPath  | `.tag-chip`, `//div[@class]`                 |

> CSS 선택자와 XPath는 UI 구현 세부사항에 결합된다. 리팩토링 한 번에 테스트 전체가 깨지는 원인이
> 된다. 접근성 기반 locator는 사용자가 실제로 인지하는 방식으로 요소를 찾으므로 훨씬 안정적이다.

### 비동기 대기 규칙

```typescript
// ✅ 올바른 방법 — 네트워크 응답 대기
await page.waitForResponse((res) => res.url().includes('/notes') && res.status() === 200);

// ✅ 올바른 방법 — 요소 가시성 대기
await expect(page.getByText('react')).toBeVisible();

// ❌ 금지 — 임의 시간 대기 (타이밍 의존, flaky 원인)
await page.waitForTimeout(1000);
```

> `waitForTimeout`은 느린 환경에서는 실패하고 빠른 환경에서는 불필요하게 느리다.
> 항상 상태 변화를 직접 관찰하는 방식으로 대기한다.

### 테스트 독립성 규칙

- 각 `test`는 다른 테스트의 실행 순서·결과에 의존하면 안 된다.
- `beforeEach`에서 `cleanupNotes()`로 DB를 초기화한다.
- 사전 데이터가 필요하면 `cleanupNotes()` 이후 API 헬퍼로 직접 생성한다.
- `db.json` 파일을 직접 편집하지 않는다 — JSON Server REST API를 통해서만 상태를 조작한다.

### 프로젝트 컨벤션

- TypeScript 사용, `any` 타입 금지
- 파일 위치: `tests/{기능명}.spec.ts`
- `baseURL`은 `playwright.config.ts`에서 설정됨 — 테스트 파일에서 `http://localhost:5173` 하드코딩 금지
- JSON Server API: `http://localhost:3001/notes` (헬퍼 함수 안에서만 직접 참조)
- 테스트 설명은 한국어 허용: `test('태그와 함께 노트를 생성하면 사이드바 카드에 태그가 표시된다', ...)`
- 상수 및 헬퍼 함수는 파일 최상단에 선언

---

## Best Practices 참조

코드 작성 중 아래 상황에서 `references/playwright-best-practices.md`를 읽는다:

| 상황                                          | 참조 섹션                             |
| --------------------------------------------- | ------------------------------------- |
| POM 구조가 필요한 경우 (테스트 파일 3개 이상) | §4 Page Object Model                  |
| 복잡한 플로우를 단계로 나눠야 할 때           | §5 test.step                          |
| 에러·로딩 상태를 테스트할 때                  | §6 네트워크 모킹                      |
| DB 초기화 공통 fixture가 필요할 때            | §7 Fixture                            |
| 병렬 실행 설정이 필요할 때                    | §8 병렬 실행과 CI                     |
| 여러 매칭 요소를 좁혀야 할 때                 | §1 Locator 전략 > 여러 매칭 요소 처리 |

테스트 파일이 하나이고 플로우가 단순한 경우 참조 파일 없이 SKILL.md의 인라인 규칙만으로 충분하다.

---

## 단계 4 — 완료 보고

코드 작성 후 다음 내용을 안내한다.

1. 생성된 파일 경로: `tests/{기능명}.spec.ts`
2. 실행 방법:
   ```bash
   npm run test:e2e              # headless 전체 실행
   npm run test:e2e:ui           # UI 모드 (시각적 디버깅)
   npx playwright test {기능명}  # 특정 파일만 실행
   ```
3. 다음 단계 제안 (승인 대기):
   > ✓ E2E 테스트 작성 완료. `npm run test:e2e:ui` 로 UI 모드에서 실행 결과를 확인하시겠어요?
