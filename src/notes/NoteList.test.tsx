import { render, screen, within, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { NoteList } from './NoteList';
import { useNotes } from './NotesContext';
import type { Note } from './types';

vi.mock('./NotesContext', () => ({
  useNotes: vi.fn(),
}));

const mockUseNotes = vi.mocked(useNotes);

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: '1',
  title: '테스트 노트',
  content: '내용',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const defaultContext = {
  notes: [] as Note[],
  loading: false,
  error: null,
  deleteNote: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
};

// NoteListProps — searchQuery·onSearchChange는 Issue #18에서 추가될 예정
type FutureNoteListProps = {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

const makeProps = (overrides: Partial<FutureNoteListProps> = {}): FutureNoteListProps => ({
  selectedNoteId: null,
  onSelect: vi.fn(),
  selectedTags: [],
  onTagToggle: vi.fn(),
  searchQuery: '',
  onSearchChange: vi.fn(),
  ...overrides,
});

const renderNoteList = (props = makeProps()) =>
  render(<NoteList {...(props as unknown as Parameters<typeof NoteList>[0])} />);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseNotes.mockReturnValue({ ...defaultContext });
});

describe('NoteList — 태그 필터 (Issue #15)', () => {
  describe('정상', () => {
    it('노트들에서 고유 태그를 수집해 필터 칩을 렌더링한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트1', tags: ['react', 'study'] }),
          makeNote({ id: '2', title: '노트2', tags: ['react', 'typescript'] }),
        ],
      });
      renderNoteList();

      const filterArea = screen.getByTestId('tag-filter');
      expect(within(filterArea).getByText('react')).toBeInTheDocument();
      expect(within(filterArea).getByText('study')).toBeInTheDocument();
      expect(within(filterArea).getByText('typescript')).toBeInTheDocument();
    });

    it('필터 칩 클릭 시 onTagToggle을 해당 태그로 호출하고, selectedTags=[react]이면 react 노트만 렌더링한다', () => {
      const onTagToggle = vi.fn();
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: 'react 노트', tags: ['react'] }),
          makeNote({ id: '2', title: 'study 노트', tags: ['study'] }),
        ],
      });
      const { rerender } = renderNoteList(makeProps({ selectedTags: [], onTagToggle }));

      const filterArea = screen.getByTestId('tag-filter');
      fireEvent.click(within(filterArea).getByRole('button', { name: 'react' }));
      expect(onTagToggle).toHaveBeenCalledWith('react');

      rerender(
        <NoteList
          {...(makeProps({ selectedTags: ['react'], onTagToggle }) as unknown as Parameters<
            typeof NoteList
          >[0])}
        />,
      );
      expect(screen.getByText('react 노트')).toBeInTheDocument();
      expect(screen.queryByText('study 노트')).not.toBeInTheDocument();
    });

    it('selectedTags가 빈 배열이면 전체 노트를 렌더링한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트1', tags: ['react'] }),
          makeNote({ id: '2', title: '노트2', tags: ['study'] }),
        ],
      });
      renderNoteList(makeProps({ selectedTags: [] }));

      expect(screen.getByText('노트1')).toBeInTheDocument();
      expect(screen.getByText('노트2')).toBeInTheDocument();
    });

    it('selectedTags에 여러 태그가 있을 때 하나라도 일치하는 노트를 렌더링한다 (OR)', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: 'react 노트', tags: ['react'] }),
          makeNote({ id: '2', title: 'study 노트', tags: ['study'] }),
          makeNote({ id: '3', title: 'vue 노트', tags: ['vue'] }),
        ],
      });
      renderNoteList(makeProps({ selectedTags: ['react', 'study'] }));

      expect(screen.getByText('react 노트')).toBeInTheDocument();
      expect(screen.getByText('study 노트')).toBeInTheDocument();
      expect(screen.queryByText('vue 노트')).not.toBeInTheDocument();
    });

    it('selectedTags에 포함된 태그 칩은 활성(aria-pressed=true) 상태이다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [makeNote({ id: '1', title: '노트1', tags: ['react', 'study'] })],
      });
      renderNoteList(makeProps({ selectedTags: ['react'] }));

      const filterArea = screen.getByTestId('tag-filter');
      const reactChip = within(filterArea).getByRole('button', { name: 'react' });
      expect(reactChip).toHaveAttribute('aria-pressed', 'true');
    });

    it('selectedTags에 없는 태그 칩은 비활성(aria-pressed=false) 상태이다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [makeNote({ id: '1', title: '노트1', tags: ['react', 'study'] })],
      });
      renderNoteList(makeProps({ selectedTags: ['react'] }));

      const filterArea = screen.getByTestId('tag-filter');
      const studyChip = within(filterArea).getByRole('button', { name: 'study' });
      expect(studyChip).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('경계', () => {
    it('모든 노트의 tags가 빈 배열이면 필터 칩 영역을 렌더링하지 않는다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트1', tags: [] }),
          makeNote({ id: '2', title: '노트2', tags: [] }),
        ],
      });
      renderNoteList();

      expect(screen.queryByTestId('tag-filter')).not.toBeInTheDocument();
    });

    it('여러 노트가 동일 태그를 가져도 필터 칩은 한 개만 렌더링한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트1', tags: ['react'] }),
          makeNote({ id: '2', title: '노트2', tags: ['react', 'typescript'] }),
        ],
      });
      renderNoteList();

      const filterArea = screen.getByTestId('tag-filter');
      expect(within(filterArea).getAllByRole('button')).toHaveLength(2);
    });
  });

  describe('예외', () => {
    it('선택된 태그와 일치하는 노트가 없으면 "해당 태그의 노트가 없습니다" 메시지를 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [makeNote({ id: '1', title: '노트1', tags: ['react'] })],
      });
      renderNoteList(makeProps({ selectedTags: ['vue'] }));

      expect(screen.getByText('해당 태그의 노트가 없습니다')).toBeInTheDocument();
    });

    it('노트 목록이 비어 있으면 필터 칩 영역을 렌더링하지 않는다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [],
      });
      renderNoteList();

      expect(screen.queryByTestId('tag-filter')).not.toBeInTheDocument();
    });
  });
});

describe('NoteList — 검색 필터 (Issue #18)', () => {
  describe('정상', () => {
    it('searchQuery가 제목 substring과 일치하는 노트만 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: 'React 입문', content: '내용A', tags: [] }),
          makeNote({ id: '2', title: 'Vue 실습', content: '내용B', tags: [] }),
        ],
      });
      renderNoteList(makeProps({ searchQuery: 'React' }));

      expect(screen.getByText('React 입문')).toBeInTheDocument();
      expect(screen.queryByText('Vue 실습')).not.toBeInTheDocument();
    });

    it('searchQuery가 내용 substring과 일치하는 노트만 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트1', content: 'TypeScript 학습 내용', tags: [] }),
          makeNote({ id: '2', title: '노트2', content: '다른 내용', tags: [] }),
        ],
      });
      renderNoteList(makeProps({ searchQuery: 'TypeScript' }));

      expect(screen.getByText('노트1')).toBeInTheDocument();
      expect(screen.queryByText('노트2')).not.toBeInTheDocument();
    });

    it('searchQuery가 빈 문자열이면 전체 노트를 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트1', content: '내용1', tags: [] }),
          makeNote({ id: '2', title: '노트2', content: '내용2', tags: [] }),
        ],
      });
      renderNoteList(makeProps({ searchQuery: '' }));

      expect(screen.getByText('노트1')).toBeInTheDocument();
      expect(screen.getByText('노트2')).toBeInTheDocument();
    });

    it('searchQuery와 selectedTags가 모두 활성화되면 AND 조건으로 필터링한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: 'React 노트', content: '내용', tags: ['react'] }),
          makeNote({ id: '2', title: 'Vue 노트', content: '내용', tags: ['vue'] }),
          makeNote({ id: '3', title: 'React 심화', content: '내용', tags: ['react'] }),
        ],
      });
      renderNoteList(makeProps({ searchQuery: '심화', selectedTags: ['react'] }));

      expect(screen.getByText('React 심화')).toBeInTheDocument();
      expect(screen.queryByText('React 노트')).not.toBeInTheDocument();
      expect(screen.queryByText('Vue 노트')).not.toBeInTheDocument();
    });
  });

  describe('경계', () => {
    it('searchQuery가 공백만 있으면 trim() 후 빈 문자열로 처리해 전체 노트를 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트1', content: '내용1', tags: [] }),
          makeNote({ id: '2', title: '노트2', content: '내용2', tags: [] }),
        ],
      });
      renderNoteList(makeProps({ searchQuery: '   ' }));

      expect(screen.getByText('노트1')).toBeInTheDocument();
      expect(screen.getByText('노트2')).toBeInTheDocument();
    });

    it('searchQuery는 대소문자를 구분하지 않고 일치 여부를 판단한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: 'react 입문', content: '내용', tags: [] }),
          makeNote({ id: '2', title: 'Vue 실습', content: '내용', tags: [] }),
        ],
      });
      renderNoteList(makeProps({ searchQuery: 'REACT' }));

      expect(screen.getByText('react 입문')).toBeInTheDocument();
      expect(screen.queryByText('Vue 실습')).not.toBeInTheDocument();
    });

    it('초기 렌더 시 searchQuery가 빈 문자열이면 전체 노트를 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [
          makeNote({ id: '1', title: '노트A', content: '내용A', tags: [] }),
          makeNote({ id: '2', title: '노트B', content: '내용B', tags: [] }),
        ],
      });
      renderNoteList(makeProps({ searchQuery: '' }));

      expect(screen.getByText('노트A')).toBeInTheDocument();
      expect(screen.getByText('노트B')).toBeInTheDocument();
    });
  });

  describe('예외', () => {
    it('검색 결과가 없으면 "\'{검색어}\'에 대한 검색 결과가 없습니다" 메시지를 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [makeNote({ id: '1', title: '노트1', content: '내용1', tags: [] })],
      });
      renderNoteList(makeProps({ searchQuery: '존재하지않는키워드' }));

      expect(
        screen.getByText("'존재하지않는키워드'에 대한 검색 결과가 없습니다"),
      ).toBeInTheDocument();
    });

    it('selectedTags가 비어있어도 searchQuery가 일치하지 않으면 결과 없음 메시지를 표시한다', () => {
      mockUseNotes.mockReturnValue({
        ...defaultContext,
        notes: [makeNote({ id: '1', title: '노트1', content: '내용1', tags: [] })],
      });
      renderNoteList(makeProps({ searchQuery: 'zzz없음', selectedTags: [] }));

      expect(screen.getByText("'zzz없음'에 대한 검색 결과가 없습니다")).toBeInTheDocument();
    });
  });
});
