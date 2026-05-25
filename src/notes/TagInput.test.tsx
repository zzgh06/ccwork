import { render, screen, fireEvent } from '@testing-library/react';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  const mockOnAdd = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // [정상] should render tag chips for each item in tags prop
  it('tags prop의 각 항목에 대해 칩을 렌더링한다', () => {
    render(<TagInput tags={['react', 'study']} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  // [정상] should call onAdd with trimmed value when Enter is pressed
  it('Enter 키 입력 시 trim된 값으로 onAdd를 호출한다', () => {
    render(<TagInput tags={[]} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: ' react ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnAdd).toHaveBeenCalledWith('react');
  });

  // [정상] should clear input field after Enter is pressed
  it('Enter 키 입력 후 입력창을 초기화한다', () => {
    render(<TagInput tags={[]} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('');
  });

  // [정상] should call onRemove with correct tag when × button is clicked
  it('× 버튼 클릭 시 해당 태그로 onRemove를 호출한다', () => {
    render(<TagInput tags={['react']} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnRemove).toHaveBeenCalledWith('react');
  });

  // [예외] should not call onAdd when Enter is pressed with empty input
  it('빈 입력에서 Enter 키 입력 시 onAdd를 호출하지 않는다', () => {
    render(<TagInput tags={[]} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  // [예외] should not call onAdd when Enter is pressed with whitespace-only input
  it('공백만 입력된 상태에서 Enter 키 입력 시 onAdd를 호출하지 않는다', () => {
    render(<TagInput tags={[]} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  // [정상] should reflect new tags when tags prop is updated externally
  it('tags prop이 외부에서 변경될 때 새 태그 목록을 즉시 반영한다', () => {
    const { rerender } = render(
      <TagInput tags={['react']} onAdd={mockOnAdd} onRemove={mockOnRemove} />,
    );
    rerender(<TagInput tags={['react', 'typescript']} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  // [경계] should render no chips when tags prop changes to empty array
  it('tags prop이 빈 배열로 변경될 때 칩이 모두 사라진다', () => {
    const { rerender } = render(
      <TagInput tags={['react']} onAdd={mockOnAdd} onRemove={mockOnRemove} />,
    );
    rerender(<TagInput tags={[]} onAdd={mockOnAdd} onRemove={mockOnRemove} />);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
