import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3001';

const FIXTURES = {
  note: { title: '태그 E2E 테스트 노트', content: 'E2E 테스트 내용' },
  tags: { first: 'playwright', second: 'e2e' },
} as const;

async function cleanupNotes(): Promise<void> {
  const res = await fetch(`${API_BASE}/notes`);
  const notes = (await res.json()) as Array<{ id: string }>;
  await Promise.all(notes.map((n) => fetch(`${API_BASE}/notes/${n.id}`, { method: 'DELETE' })));
}

async function createNoteViaAPI(tags: string[] = []): Promise<string> {
  const res = await fetch(`${API_BASE}/notes`, {
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
  const note = (await res.json()) as { id: string };
  return note.id;
}

test.describe('태그 — 사용자 플로우', () => {
  // JSON Server가 db.json을 단일 파일로 공유하므로 워커 간 충돌 방지를 위해 직렬 실행
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await cleanupNotes();
    await page.goto('/');
  });

  test.afterAll(async () => {
    await cleanupNotes();
  });

  test.describe('노트 생성', () => {
    test('태그와 함께 새 노트를 만들면 저장 직후 사이드바 카드에 태그 칩이 표시된다', async ({
      page,
    }) => {
      await page.getByRole('button', { name: '+ 새 노트' }).click();
      await page.getByPlaceholder('제목').fill(FIXTURES.note.title);
      await page.getByPlaceholder('태그 입력').fill(FIXTURES.tags.first);
      await page.getByPlaceholder('태그 입력').press('Enter');

      const saveResponse = page.waitForResponse(
        (res) => res.url().includes('/notes') && res.status() === 201,
      );
      await page.getByRole('button', { name: '저장' }).click();
      await saveResponse;

      await expect(
        page.getByRole('listitem').filter({ hasText: FIXTURES.tags.first }),
      ).toBeVisible();
    });

    test('태그 없이 저장한 노트의 카드에는 태그 영역 자체가 없다', async ({ page }) => {
      await page.getByRole('button', { name: '+ 새 노트' }).click();
      await page.getByPlaceholder('제목').fill(FIXTURES.note.title);

      const saveResponse = page.waitForResponse(
        (res) => res.url().includes('/notes') && res.status() === 201,
      );
      await page.getByRole('button', { name: '저장' }).click();
      await saveResponse;

      // 사이드바에 노트가 나타난 뒤 태그 영역(ul) 없음 확인
      await expect(page.getByRole('heading', { name: FIXTURES.note.title })).toBeVisible();
      await expect(page.getByRole('list')).toHaveCount(0);
    });
  });

  test.describe('영속성', () => {
    test('태그가 있는 노트를 저장하고 페이지를 새로고침해도 태그가 유지된다', async ({ page }) => {
      await page.getByRole('button', { name: '+ 새 노트' }).click();
      await page.getByPlaceholder('제목').fill(FIXTURES.note.title);
      await page.getByPlaceholder('태그 입력').fill(FIXTURES.tags.first);
      await page.getByPlaceholder('태그 입력').press('Enter');

      const saveResponse = page.waitForResponse(
        (res) => res.url().includes('/notes') && res.status() === 201,
      );
      await page.getByRole('button', { name: '저장' }).click();
      await saveResponse;

      await page.reload();
      // 새로고침 후 노트 목록이 로드될 때까지 대기
      await expect(page.getByRole('heading', { name: FIXTURES.note.title })).toBeVisible();

      await expect(
        page.getByRole('listitem').filter({ hasText: FIXTURES.tags.first }),
      ).toBeVisible();
    });
  });

  test.describe('노트 편집', () => {
    test('태그가 저장된 노트를 사이드바에서 클릭하면 에디터에 태그 칩이 로드된다', async ({
      page,
    }) => {
      await createNoteViaAPI([FIXTURES.tags.first]);
      await page.reload();
      await expect(page.getByRole('heading', { name: FIXTURES.note.title })).toBeVisible();

      await page.getByRole('heading', { name: FIXTURES.note.title }).click();

      // 에디터의 태그 칩은 × 버튼 포함 (사이드바 읽기 전용 칩과 구분)
      const editableChip = page
        .getByRole('listitem')
        .filter({ hasText: FIXTURES.tags.first })
        .filter({ has: page.getByRole('button') });
      await expect(editableChip).toBeVisible();
    });

    test('기존 노트에 태그를 추가하고 저장하면 사이드바 카드가 즉시 갱신된다', async ({ page }) => {
      await createNoteViaAPI([]);
      await page.reload();
      await expect(page.getByRole('heading', { name: FIXTURES.note.title })).toBeVisible();

      await page.getByRole('heading', { name: FIXTURES.note.title }).click();
      await page.getByPlaceholder('태그 입력').fill(FIXTURES.tags.first);
      await page.getByPlaceholder('태그 입력').press('Enter');

      const saveResponse = page.waitForResponse(
        (res) =>
          res.url().includes('/notes/') &&
          res.request().method() === 'PATCH' &&
          res.status() === 200,
      );
      await page.getByRole('button', { name: '저장' }).click();
      await saveResponse;

      // 편집 저장 후 에디터가 열려 있어 사이드바·에디터 양쪽에 칩이 존재
      // hasNot으로 × 버튼 없는 것(사이드바 읽기 전용 칩)만 특정
      await expect(
        page
          .getByRole('listitem')
          .filter({ hasText: FIXTURES.tags.first })
          .filter({ hasNot: page.getByRole('button') }),
      ).toBeVisible();
    });
  });

  test.describe('취소 동작', () => {
    test('에디터에서 태그를 × 로 삭제한 뒤 취소하면 원래 태그가 사이드바에 유지된다', async ({
      page,
    }) => {
      await createNoteViaAPI([FIXTURES.tags.first]);
      await page.reload();
      await expect(page.getByRole('heading', { name: FIXTURES.note.title })).toBeVisible();

      await page.getByRole('heading', { name: FIXTURES.note.title }).click();

      // 에디터에서 태그 × 버튼 클릭 (로컬 상태만 변경)
      await page.getByRole('button', { name: '×' }).click();

      // 저장하지 않고 취소
      await page.getByRole('button', { name: '취소' }).click();

      // 서버 데이터 기반 사이드바에는 원래 태그가 유지됨
      await expect(
        page.getByRole('listitem').filter({ hasText: FIXTURES.tags.first }),
      ).toBeVisible();
    });
  });
});
