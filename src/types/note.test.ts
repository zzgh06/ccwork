import type { Note } from './note';

describe('Note 타입', () => {
  it('tags 필드가 string[] 타입으로 존재해야 한다', () => {
    // Note 인터페이스에 tags가 없으므로 객체 생성 시 tags가 포함되지 않음
    // → 런타임에서 undefined → Array.isArray(undefined) === false → 실패
    const note: Note = { id: '1', title: 'T', content: 'C', createdAt: '', updatedAt: '' };
    expect(Array.isArray((note as Record<string, unknown>).tags)).toBe(true);
  });
});
