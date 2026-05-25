import { render, screen } from '@testing-library/react';
import { NoteItem } from './NoteItem';
import type { Note } from './types';

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

  describe('중복 태그 처리 (Issue #9)', () => {
    // [정상] should render only unique chips when tags contain exact duplicates
    it('중복 태그가 있으면 고유 태그 칩만 렌더링한다', () => {
      const note = makeNote({ tags: ['react', 'typescript', 'react'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    // [경계] should render 1 chip when tags is ["react", "react"]
    it('tags가 ["react", "react"]이면 칩 1개만 렌더링한다', () => {
      const note = makeNote({ tags: ['react', 'react'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    // [경계] should render 2 chips when tags is ["react", "React"] (Set은 case-sensitive)
    it('대소문자만 다른 태그는 중복으로 처리하지 않아 2개를 렌더링한다', () => {
      const note = makeNote({ tags: ['react', 'React'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    // [예외] should not emit React key warning when tags contain duplicates
    it('중복 태그가 있어도 React key 경고를 발생시키지 않는다', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const note = makeNote({ tags: ['react', 'react'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    // ac-verifier 갭 보완 — 후행 공백 포함 태그는 Set 기준 다른 값으로 2개 렌더링
    it('후행 공백이 다른 태그는 중복으로 처리하지 않아 2개를 렌더링한다', () => {
      const note = makeNote({ tags: ['react', 'react '] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    // ac-verifier 갭 보완 — 3개 이상 동일 태그 시 칩 1개로 dedup
    it('태그가 3개 모두 동일하면 칩 1개만 렌더링한다', () => {
      const note = makeNote({ tags: ['react', 'react', 'react'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });

  describe('빈 태그 필터링 (Issue #10)', () => {
    // [정상] should render only valid chips when tags contains both valid and empty strings
    it('유효 태그와 빈 문자열이 혼재할 때 유효 태그 칩만 렌더링한다', () => {
      const note = makeNote({ tags: ['react', '', 'study'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    // [경계] should not render chip for empty string tag
    it('빈 문자열 태그는 칩을 렌더링하지 않는다', () => {
      const note = makeNote({ tags: [''] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    // [경계] should not render chip for whitespace-only tag
    it('공백만인 태그는 칩을 렌더링하지 않는다', () => {
      const note = makeNote({ tags: [' '] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    // [경계] should not render tag area when all tags are empty or whitespace
    it('모든 태그가 빈 문자열·공백이면 태그 영역을 렌더링하지 않는다', () => {
      const note = makeNote({ tags: ['', ' ', '  '] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    // [예외] should render remaining valid chips when tags is ["react", "", "study"]
    it('tags가 ["react", "", "study"]이면 유효 태그 2개를 렌더링한다', () => {
      const note = makeNote({ tags: ['react', '', 'study'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('study')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    // ac-verifier 갭 보완 — 탭·줄바꿈만인 태그도 칩 미렌더링
    it('탭 문자만인 태그는 칩을 렌더링하지 않는다', () => {
      const note = makeNote({ tags: ['\t'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('줄바꿈 문자만인 태그는 칩을 렌더링하지 않는다', () => {
      const note = makeNote({ tags: ['\n'] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    // ac-verifier 갭 보완 — filter(#10) + dedup(#9) 동시 적용
    it('빈 태그와 중복 유효 태그가 혼재하면 유효 태그 칩 1개만 렌더링한다', () => {
      const note = makeNote({ tags: ['react', '', 'react', ' '] });
      render(<NoteItem note={note} {...defaultProps} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expect(screen.getByText('react')).toBeInTheDocument();
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
