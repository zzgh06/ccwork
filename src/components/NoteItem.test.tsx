import { render, screen } from '@testing-library/react';
import { NoteItem } from './NoteItem';
import type { Note } from '../types/note';

// Red phase: Note 타입에 tags가 없으므로 as unknown as Note 캐스팅 사용
const makeNote = (overrides: Record<string, unknown> = {}): Note =>
  ({
    id: '1',
    title: '테스트 노트',
    content: '내용',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }) as unknown as Note;

const defaultProps = {
  isSelected: false,
  onSelect: () => {},
  onDelete: () => {},
};

describe('NoteItem', () => {
  describe('태그가 있을 때', () => {
    it('태그 칩을 렌더링한다', () => {
      // Arrange
      const note = makeNote({ tags: ['react', 'study'] });
      // Act
      render(<NoteItem note={note} {...defaultProps} />);
      // Assert
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('study')).toBeInTheDocument();
    });

    it('태그 개수만큼 칩을 분리 렌더링한다', () => {
      const note = makeNote({ tags: ['react', 'ts', 'study'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('태그가 1개일 때 칩 1개를 렌더링한다', () => {
      const note = makeNote({ tags: ['react'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });

  describe('태그가 없을 때', () => {
    it('tags가 빈 배열이면 태그 영역을 렌더링하지 않는다', () => {
      render(<NoteItem note={makeNote({ tags: [] })} {...defaultProps} />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('tags가 undefined이면 태그 영역을 렌더링하지 않는다', () => {
      render(<NoteItem note={makeNote({ tags: undefined })} {...defaultProps} />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('저장 후 태그 반영', () => {
    // [정상] NoteItem — should display updated tags after save
    it('저장 후 변경된 tags를 카드에 반영한다', () => {
      const { rerender } = render(
        <NoteItem note={makeNote({ tags: ['react'] })} {...defaultProps} />,
      );
      rerender(<NoteItem note={makeNote({ tags: ['react', 'typescript'] })} {...defaultProps} />);
      expect(screen.getByText('typescript')).toBeInTheDocument();
    });

    // [정상] should display tags from updated note when note prop is re-received after save
    it('저장 후 업데이트된 note prop을 받으면 변경된 태그를 표시한다', () => {
      const { rerender } = render(
        <NoteItem note={makeNote({ tags: ['react'] })} {...defaultProps} />,
      );
      rerender(<NoteItem note={makeNote({ tags: ['typescript'] })} {...defaultProps} />);
      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.queryByText('react')).not.toBeInTheDocument();
    });
  });
});
