import type { Note } from './note';
import { expectTypeOf } from 'vitest';

describe('Note 타입', () => {
  it('tags 필드가 string[] 타입으로 존재해야 한다', () => {
    expectTypeOf<Note>().toHaveProperty('tags').toEqualTypeOf<string[]>();
  });
});
