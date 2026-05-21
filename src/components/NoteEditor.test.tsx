import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteEditor } from './NoteEditor';
import { useNotes } from '../context/NotesContext';
import type { Note } from '../types/note';

vi.mock('../context/NotesContext', () => ({
  useNotes: vi.fn(),
}));

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: '테스트 노트',
  content: '내용',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const mockUpdateNote = vi.fn().mockResolvedValue(undefined);
const mockCreateNote = vi.fn().mockResolvedValue(undefined);

function setupMock(notes: Note[] = []) {
  vi.mocked(useNotes).mockReturnValue({
    notes,
    loading: false,
    error: null,
    createNote: mockCreateNote,
    updateNote: mockUpdateNote,
    deleteNote: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateNote.mockResolvedValue(undefined);
  mockCreateNote.mockResolvedValue(undefined);
});

// ──────────────────────────────────────────
// handleAddTag
// ──────────────────────────────────────────
describe('handleAddTag', () => {
  // [정상] should add trimmed tag to tags state when valid input given
  it('유효한 입력 시 tags 상태에 태그를 추가한다', () => {
    const note = makeNote({ id: '1', tags: [] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const tagInput = screen.getByPlaceholderText(/태그/);
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  // [정상] should trim leading and trailing whitespace before adding
  it('앞뒤 공백을 trim한 후 태그를 추가한다', () => {
    const note = makeNote({ id: '1', tags: [] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const tagInput = screen.getByPlaceholderText(/태그/);
    fireEvent.change(tagInput, { target: { value: ' react ' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  // [경계] should not add tag when input is empty string after trim
  it('trim 후 빈 문자열이면 태그를 추가하지 않는다', () => {
    const note = makeNote({ id: '1', tags: [] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const tagInput = screen.getByPlaceholderText(/태그/);
    fireEvent.change(tagInput, { target: { value: '' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  // [경계] should not add tag when input contains whitespace only
  it('공백만 입력된 경우 태그를 추가하지 않는다', () => {
    const note = makeNote({ id: '1', tags: [] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const tagInput = screen.getByPlaceholderText(/태그/);
    fireEvent.change(tagInput, { target: { value: '   ' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────
// handleRemoveTag
// ──────────────────────────────────────────
describe('handleRemoveTag', () => {
  // [정상] should remove only the specified tag from tags state
  it('지정한 태그만 tags 상태에서 제거한다', () => {
    const note = makeNote({ id: '1', tags: ['react', 'study'] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const reactChip = screen.getByText('react');
    const removeBtn = reactChip.parentElement!.querySelector('button')!;
    fireEvent.click(removeBtn);
    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  // [정상] should keep remaining tags unchanged when one is removed
  it('태그 하나 제거 후 나머지 태그는 유지된다', () => {
    const note = makeNote({ id: '1', tags: ['react', 'study', 'typescript'] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const reactChip = screen.getByText('react');
    const removeBtn = reactChip.parentElement!.querySelector('button')!;
    fireEvent.click(removeBtn);
    expect(screen.getByText('study')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  // [경계] should result in empty array when the last tag is removed
  it('마지막 태그를 제거하면 tags 상태가 빈 배열이 된다', () => {
    const note = makeNote({ id: '1', tags: ['react'] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const reactChip = screen.getByText('react');
    const removeBtn = reactChip.parentElement!.querySelector('button')!;
    fireEvent.click(removeBtn);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────
// NoteEditor 초기화
// ──────────────────────────────────────────
describe('NoteEditor 초기화', () => {
  // [정상] should initialize tags from selectedNote.tags when a note is selected
  it('노트 선택 시 selectedNote.tags로 tags 상태를 초기화한다', () => {
    const note = makeNote({ id: '1', tags: ['react', 'study'] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  // [정상] should reset tags to [] when switching to create mode
  it('생성 모드로 전환 시 tags 상태를 []로 초기화한다', () => {
    const note = makeNote({ id: '1', tags: ['react'] });
    setupMock([note]);
    const { rerender } = render(
      <NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />,
    );
    rerender(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  // [정상] should update tags state when switching between different notes
  it('다른 노트로 전환 시 새 노트의 tags로 상태를 갱신한다', () => {
    const note1 = makeNote({ id: '1', tags: ['react'] });
    const note2 = makeNote({ id: '2', title: '두 번째 노트', tags: ['typescript'] });
    setupMock([note1, note2]);
    const { rerender } = render(
      <NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />,
    );
    rerender(<NoteEditor selectedNoteId="2" isCreating={false} onDone={vi.fn()} />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  // [경계] should initialize tags to [] when selectedNote.tags is empty array
  it('selectedNote.tags가 빈 배열이면 tags 상태를 []로 초기화한다', () => {
    const note = makeNote({ id: '1', tags: [] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────
// handleSave
// ──────────────────────────────────────────
describe('handleSave', () => {
  // [정상] should call updateNote with current tags when saving edited note
  it('저장 시 현재 tags를 포함해 updateNote를 호출한다', async () => {
    const note = makeNote({ id: '1', tags: ['react'] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ tags: ['react'] }),
      );
    });
  });
});
