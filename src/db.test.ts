import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('db.json', () => {
  it('모든 노트 객체에 tags 필드가 존재해야 한다', () => {
    // Arrange
    const raw = readFileSync(resolve(process.cwd(), 'db.json'), 'utf-8');
    const db = JSON.parse(raw) as { notes: Record<string, unknown>[] };

    // Assert — notes가 있을 때만 구조 검증 (빈 db도 유효한 상태)
    db.notes.forEach((note, i) => {
      expect(note, `notes[${i}]에 tags 필드 없음`).toHaveProperty('tags');
      expect(Array.isArray(note.tags), `notes[${i}].tags가 배열이 아님`).toBe(true);
    });
  });
});
