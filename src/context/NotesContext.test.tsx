import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { NotesProvider, useNotes } from './NotesContext';
import * as api from '../api/notes';
import type { Note } from '../types/note';

vi.mock('../api/notes');

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: '테스트 노트',
  content: '내용',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <NotesProvider>{children}</NotesProvider>
);

describe('NotesContext — createNote', () => {
  beforeEach(() => {
    vi.mocked(api.fetchNotes).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // [정상] should add note including provided tags to notes state after createNote is called
  it('전달한 tags를 포함한 노트가 notes 상태에 추가된다', async () => {
    vi.mocked(api.createNote).mockImplementation(async (note) => ({
      id: '2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...note,
    }));

    const { result } = renderHook(() => useNotes(), { wrapper });

    await act(async () => {
      await result.current.createNote('제목', '내용', ['react']);
    });

    expect(result.current.notes).toContainEqual(expect.objectContaining({ tags: ['react'] }));
  });

  // [예외] should not hardcode tags to [] when tags argument is provided
  it('tags 인수를 []로 고정하지 않고 전달받은 값을 사용한다', async () => {
    vi.mocked(api.createNote).mockResolvedValue(
      makeNote({ id: '2', tags: ['react', 'typescript'] }),
    );

    const { result } = renderHook(() => useNotes(), { wrapper });

    await act(async () => {
      await result.current.createNote('제목', '내용', ['react', 'typescript']);
    });

    expect(api.createNote).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['react', 'typescript'] }),
    );
  });
});
