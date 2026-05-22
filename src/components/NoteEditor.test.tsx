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
// handleSave — 생성 모드 (Issue #7)
// ──────────────────────────────────────────
describe('handleSave — 생성 모드', () => {
  // [정상] should render TagInput when isCreating is true
  it('생성 모드에서 TagInput을 렌더링한다', () => {
    setupMock([]);
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);
    expect(screen.getByPlaceholderText('태그 입력')).toBeInTheDocument();
  });

  // [정상] should call createNote(title, content, tags) when saving in create mode with tags
  it('태그를 입력 후 저장 시 createNote(title, content, tags)를 호출한다', async () => {
    setupMock([]);
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('제목'), { target: { value: '새 노트' } });
    const tagInput = screen.getByPlaceholderText('태그 입력');
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith('새 노트', '', ['react']);
    });
  });

  // [정상] should call createNote with title, content, and tags together in create mode
  it('생성 모드 저장 시 title·content·tags를 모두 포함해 createNote를 호출한다', async () => {
    setupMock([]);
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('제목'), { target: { value: '제목' } });
    fireEvent.change(screen.getByPlaceholderText('내용을 입력하세요...'), {
      target: { value: '내용' },
    });
    const tagInput = screen.getByPlaceholderText('태그 입력');
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith('제목', '내용', ['react']);
    });
  });

  // [경계] should call createNote with empty array when saving in create mode with no tags added
  it('태그 없이 저장 시 createNote를 빈 태그 배열로 호출한다', async () => {
    setupMock([]);
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('제목'), { target: { value: '새 노트' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith('새 노트', '', []);
    });
  });

  // [경계] should not call createNote when title is empty in create mode
  it('제목이 비어있으면 createNote를 호출하지 않는다', () => {
    setupMock([]);
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(mockCreateNote).not.toHaveBeenCalled();
  });

  // [예외] should not call updateNote when isCreating is true
  it('생성 모드에서 저장 시 updateNote를 호출하지 않는다', async () => {
    setupMock([]);
    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('제목'), { target: { value: '새 노트' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalled();
    });
    expect(mockUpdateNote).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────
// handleAddTag — 유효성 검사 (Issue #8)
// ──────────────────────────────────────────
describe('handleAddTag — 유효성 검사', () => {
  describe('길이 제한', () => {
    // [정상] should add tag when tag is exactly 20 characters
    it('정확히 20자인 태그는 정상 추가된다', () => {
      const note = makeNote({ id: '1', tags: [] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: 'a'.repeat(20) } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.getByText('a'.repeat(20))).toBeInTheDocument();
    });

    // [경계] should not add tag when tag is 21 characters after trim
    it('trim 후 21자인 태그는 추가되지 않는다', () => {
      const note = makeNote({ id: '1', tags: [] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: 'a'.repeat(21) } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    // [경계] should add tag when tag with surrounding spaces trims to exactly 20 characters
    it('앞뒤 공백 포함해도 trim 후 20자인 태그는 정상 추가된다', () => {
      const note = makeNote({ id: '1', tags: [] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: ' ' + 'a'.repeat(20) + ' ' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.getByText('a'.repeat(20))).toBeInTheDocument();
    });

    // [예외] should not display error message when tag exceeds 20 characters
    it('21자 태그 입력 시 에러 메시지를 표시하지 않는다', () => {
      const note = makeNote({ id: '1', tags: [] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: 'a'.repeat(21) } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('중복 방지', () => {
    // [정상] should add tag when existing tags contain similar value with different case
    it('기존 태그와 다른 값이면 정상 추가된다', () => {
      const note = makeNote({ id: '1', tags: ['TypeScript'] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: 'javascript' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    // [예외] should not add tag when exact same tag already exists
    it('동일한 태그가 이미 있으면 추가되지 않는다', () => {
      const note = makeNote({ id: '1', tags: ['react'] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: 'react' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    // [예외] should not add tag when same tag exists with different case
    it('대소문자만 다른 중복 태그는 추가되지 않는다 (e.g. "TypeScript" vs "typescript")', () => {
      const note = makeNote({ id: '1', tags: ['TypeScript'] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: 'typescript' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    // [예외] should not display error message when duplicate tag is entered
    it('중복 태그 입력 시 에러 메시지를 표시하지 않는다', () => {
      const note = makeNote({ id: '1', tags: ['react'] });
      setupMock([note]);
      render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
      const tagInput = screen.getByPlaceholderText('태그 입력');
      fireEvent.change(tagInput, { target: { value: 'react' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
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

  // [정상] should call updateNote with newly added tag when tag is added then saved
  it('태그 추가 후 저장 시 추가된 태그를 포함해 updateNote를 호출한다', async () => {
    const note = makeNote({ id: '1', tags: [] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const tagInput = screen.getByPlaceholderText(/태그/);
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ tags: ['react'] }),
      );
    });
  });

  // [정상] should call updateNote without removed tag when tag is removed then saved
  it('태그 삭제 후 저장 시 삭제된 태그 없이 updateNote를 호출한다', async () => {
    const note = makeNote({ id: '1', tags: ['react', 'study'] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    const reactChip = screen.getByText('react');
    const removeBtn = reactChip.parentElement!.querySelector('button')!;
    fireEvent.click(removeBtn);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ tags: ['study'] }),
      );
    });
  });

  // [정상] should call updateNote including title, content, and tags together
  it('저장 시 title·content·tags를 모두 포함해 updateNote를 호출한다', async () => {
    const note = makeNote({ id: '1', title: '테스트 노트', content: '내용', tags: ['react'] });
    setupMock([note]);
    render(<NoteEditor selectedNoteId="1" isCreating={false} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ title: '테스트 노트', content: '내용', tags: ['react'] }),
      );
    });
  });
});
