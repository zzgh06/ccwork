# Playwright Best Practices 참조

## 목차

1. [Locator 전략](#1-locator-전략)
2. [자동 대기와 Assertion](#2-자동-대기와-assertion)
3. [테스트 독립성과 격리](#3-테스트-독립성과-격리)
4. [Page Object Model](#4-page-object-model)
5. [test.step — 복잡한 플로우 구조화](#5-teststep--복잡한-플로우-구조화)
6. [네트워크 모킹과 인터셉트](#6-네트워크-모킹과-인터셉트)
7. [Fixture — 공통 설정 재사용](#7-fixture--공통-설정-재사용)
8. [병렬 실행과 CI 격리](#8-병렬-실행과-ci-격리)
9. [디버깅 도구](#9-디버깅-도구)
10. [이 프로젝트 적용 가이드](#10-이-프로젝트-적용-가이드)

---

## 1. Locator 전략

### 우선순위

```
getByRole > getByLabel > getByPlaceholder > getByText > getByTestId > CSS/XPath(금지)
```

접근성 기반 locator가 안정적인 이유: 사용자가 화면을 인지하는 방식과 동일하게 동작한다.
CSS 클래스·태그 구조는 리팩토링으로 언제든 바뀌지만 role·label은 의미가 바뀌지 않는 한 유지된다.

```typescript
// ✅ role + accessible name
page.getByRole('button', { name: '저장' });
page.getByRole('textbox', { name: '제목' });
page.getByRole('listitem'); // li 요소

// ✅ label (input과 연결된 label 텍스트)
page.getByLabel('이메일');

// ✅ placeholder (label 없는 input)
page.getByPlaceholder('태그 입력');

// ✅ 텍스트 내용 (정적 텍스트)
page.getByText('저장되었습니다');

// ✅ data-testid — 접근성 속성이 없고 다른 방법으로 특정 불가능할 때만
page.getByTestId('note-card');

// ❌ 금지
page.locator('.tag-chip'); // CSS 클래스
page.locator('//div[@data-id]'); // XPath
page.locator('#save-button'); // id (테스트 전용 id도 getByTestId 사용)
```

### 여러 매칭 요소 처리

```typescript
// 여러 개 중 첫 번째
page.getByRole('listitem').first();

// n번째 (0-indexed)
page.getByRole('listitem').nth(1);

// 텍스트로 좁히기
page.getByRole('listitem').filter({ hasText: 'react' });
```

---

## 2. 자동 대기와 Assertion

Playwright는 모든 `expect(locator)` assertion에서 요소가 조건을 만족할 때까지 자동으로 재시도한다.
`waitForTimeout`이 필요한 경우는 거의 없다.

```typescript
// ✅ 요소가 나타날 때까지 자동 대기 (기본 timeout: 5000ms)
await expect(page.getByText('react')).toBeVisible();
await expect(page.getByRole('button', { name: '저장' })).toBeEnabled();

// ✅ 네트워크 응답 대기 — 저장 후 상태 갱신 확인
const responsePromise = page.waitForResponse(
  (res) => res.url().includes('/notes') && res.request().method() === 'POST',
);
await page.getByRole('button', { name: '저장' }).click();
await responsePromise;

// ✅ URL 변경 대기
await page.waitForURL('**/notes/**');

// ❌ 금지
await page.waitForTimeout(2000);
```

### 유용한 assertion 목록

```typescript
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toHaveText('정확한 텍스트');
await expect(locator).toContainText('일부 텍스트');
await expect(locator).toHaveValue('입력값');
await expect(locator).toHaveCount(3);
await expect(page).toHaveURL(/notes/);
await expect(page).toHaveTitle('노트 앱');
```

---

## 3. 테스트 독립성과 격리

각 `test`는 실행 순서나 다른 테스트의 결과에 의존하면 안 된다.

### DB 초기화 패턴

```typescript
test.beforeEach(async ({ page, request }) => {
  // API로 DB 초기화 (request fixture 사용 — 브라우저 컨텍스트 없이 HTTP 가능)
  const notes = await request.get('http://localhost:3001/notes');
  const data = (await notes.json()) as Array<{ id: string }>;
  await Promise.all(data.map((n) => request.delete(`http://localhost:3001/notes/${n.id}`)));
  await page.goto('/');
});
```

### 사전 데이터 생성 패턴

```typescript
// ✅ API 헬퍼로 상태 세팅 (UI 조작 없이 빠르게)
test('기존 노트에 태그를 추가할 수 있다', async ({ page, request }) => {
  // 사전: 태그 없는 노트 생성
  const res = await request.post('http://localhost:3001/notes', {
    data: {
      title: '테스트 노트',
      content: '',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  await page.reload();
  // 이후: UI 테스트
});

// ❌ 지양 — 테스트끼리 상태 공유
test.describe('공유 노트 사용', () => {
  let noteId: string;
  test.beforeAll(async () => {
    noteId = await createNote();
  }); // 순서 의존성 발생
});
```

---

## 4. Page Object Model

테스트 파일이 3개 이상이거나 반복되는 인터랙션이 많으면 POM으로 추출한다.
각 POM은 페이지/컴포넌트 단위로 인터랙션을 캡슐화하고, assertion은 테스트 파일에서 한다.

```typescript
// tests/pages/NoteEditorPage.ts
import { type Page, type Locator } from '@playwright/test';

export class NoteEditorPage {
  readonly titleInput: Locator;
  readonly contentInput: Locator;
  readonly tagInput: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.titleInput = page.getByPlaceholder('제목');
    this.contentInput = page.getByPlaceholder('내용을 입력하세요...');
    this.tagInput = page.getByPlaceholder('태그 입력');
    this.saveButton = page.getByRole('button', { name: '저장' });
  }

  async addTag(tag: string) {
    await this.tagInput.fill(tag);
    await this.tagInput.press('Enter');
  }

  async save() {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/notes') && res.status() === 200,
    );
    await this.saveButton.click();
    await responsePromise;
  }
}

// tests/tag.spec.ts
import { NoteEditorPage } from './pages/NoteEditorPage';

test('태그를 추가하고 저장한다', async ({ page }) => {
  const editor = new NoteEditorPage(page);
  await editor.addTag('react');
  await editor.save();
  await expect(page.getByText('react')).toBeVisible();
});
```

> **이 프로젝트 적용 시점**: 테스트 파일이 하나일 때는 POM 불필요. 기능이 늘어나 `tests/` 파일이
> 3개 이상 되면 `tests/pages/` 디렉토리를 만들어 공통 인터랙션을 추출한다.

---

## 5. test.step — 복잡한 플로우 구조화

여러 단계로 이루어진 테스트는 `test.step`으로 구조화하면 실패 시 어느 단계에서 실패했는지 즉시 확인할 수 있다.

```typescript
test('노트를 생성하고 태그를 추가한 뒤 저장하면 사이드바에 반영된다', async ({ page }) => {
  await test.step('새 노트 버튼 클릭', async () => {
    await page.getByRole('button', { name: '새 노트' }).click();
  });

  await test.step('제목과 태그 입력', async () => {
    await page.getByPlaceholder('제목').fill('테스트 노트');
    await page.getByPlaceholder('태그 입력').fill('react');
    await page.getByPlaceholder('태그 입력').press('Enter');
  });

  await test.step('저장 후 사이드바 확인', async () => {
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'react' })).toBeVisible();
  });
});
```

---

## 6. 네트워크 모킹과 인터셉트

실제 서버 응답을 사용하는 것이 원칙이지만, 에러 상태나 느린 네트워크를 시뮬레이션할 때 사용한다.

```typescript
// 특정 요청 가로채기 — 에러 응답 시뮬레이션
await page.route('**/notes', (route) => {
  route.fulfill({ status: 500, body: 'Internal Server Error' });
});

// 응답 지연 시뮬레이션
await page.route('**/notes', async (route) => {
  await new Promise((r) => setTimeout(r, 2000));
  await route.continue();
});

// 특정 요청 감시 (모킹 없이)
const saveRequest = page.waitForRequest(
  (req) => req.url().includes('/notes') && req.method() === 'PUT',
);
await page.getByRole('button', { name: '저장' }).click();
const req = await saveRequest;
// req.postDataJSON() 으로 요청 바디 검증 가능
```

> **이 프로젝트에서**: JSON Server가 실제로 실행되므로 정상 플로우는 모킹 불필요.
> 저장 실패·로딩 상태 등 예외 케이스에만 `page.route`를 사용한다.

---

## 7. Fixture — 공통 설정 재사용

Playwright의 `test.extend`로 공통 setup을 fixture로 만들면 `beforeEach` 중복을 줄일 수 있다.

```typescript
// tests/fixtures.ts
import { test as base, expect } from '@playwright/test';

type Fixtures = {
  cleanDb: void;
};

export const test = base.extend<Fixtures>({
  cleanDb: [
    async ({ request }, use) => {
      // 테스트 전: DB 초기화
      const notes = (await (await request.get('http://localhost:3001/notes')).json()) as Array<{
        id: string;
      }>;
      await Promise.all(notes.map((n) => request.delete(`http://localhost:3001/notes/${n.id}`)));
      await use();
      // 테스트 후: 정리 (선택)
    },
    { auto: true },
  ], // auto: true → 모든 테스트에 자동 적용
});

export { expect };

// tests/tag.spec.ts
import { test, expect } from './fixtures'; // base test 대신 확장된 test 사용

test('매 테스트마다 자동으로 DB가 초기화된다', async ({ page }) => {
  // cleanDb fixture가 자동으로 실행됨
});
```

> **이 프로젝트 적용 시점**: 테스트 파일이 2개 이상이고 `beforeEach` 내 DB 초기화 코드가 중복되면
> `tests/fixtures.ts`를 만들어 추출한다.

---

## 8. 병렬 실행과 CI 격리

### 병렬 실행 시 DB 충돌 방지

JSON Server는 단일 `db.json`을 공유하므로 테스트를 병렬로 실행하면 충돌이 발생한다.

```typescript
// playwright.config.ts
export default defineConfig({
  // 로컬: 파일 내 직렬 실행 (worker 간 격리는 유지)
  fullyParallel: true, // 파일 간 병렬 OK
  // 각 파일은 독립된 worker → DB 충돌 없음 (단, 파일 내 테스트는 순서대로)
});
```

파일 내 테스트 간 DB 공유를 피하려면 `beforeEach`에서 항상 초기화한다 (이미 스킬 템플릿에 포함).

### CI 환경 설정

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0, // CI에서만 재시도
  workers: process.env.CI ? 1 : undefined, // CI에서는 단일 worker (JSON Server 충돌 방지)
  reporter: process.env.CI ? 'github' : 'html',
});
```

---

## 9. 디버깅 도구

```bash
# UI 모드 — 타임트래블 디버깅, 각 단계 스크린샷 확인
npm run test:e2e:ui

# 특정 테스트만 headed 실행 (브라우저 창 열림)
npx playwright test tag --headed

# debug 모드 — 한 줄씩 실행
npx playwright test tag --debug

# trace 뷰어 — 실패한 테스트의 네트워크·스크린샷 재생
npx playwright show-trace test-results/*/trace.zip

# codegen — 브라우저 조작을 코드로 자동 생성 (초안 참고용, 그대로 쓰지 말 것)
npx playwright codegen http://localhost:5173
```

### VSCode 확장

Playwright Test for VSCode 확장을 설치하면 테스트를 에디터에서 직접 실행·디버깅할 수 있다.

---

## 10. 이 프로젝트 적용 가이드

| 상황                              | 권장 패턴                    |
| --------------------------------- | ---------------------------- |
| 테스트 파일 1개                   | 헬퍼 함수를 파일 상단에 선언 |
| 테스트 파일 2개 이상 + 중복 setup | `tests/fixtures.ts`로 추출   |
| 반복 인터랙션 패턴                | `tests/pages/`에 POM 추가    |
| 복잡한 단일 플로우 (5단계+)       | `test.step`으로 구조화       |
| 에러/로딩 상태 테스트             | `page.route`로 모킹          |
| 정상 CRUD 플로우                  | 실제 JSON Server 사용        |

### Playwright 공식 자료

- Best Practices: https://playwright.dev/docs/best-practices
- Locators: https://playwright.dev/docs/locators
- Assertions: https://playwright.dev/docs/test-assertions
- Fixtures: https://playwright.dev/docs/test-fixtures
- Page Object Models: https://playwright.dev/docs/pom
