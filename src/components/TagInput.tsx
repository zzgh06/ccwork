import { useState } from 'react';

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function TagInput({ tags, onAdd, onRemove }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInputValue('');
  };

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#dbe4e7] text-[#586064]"
            >
              <span>{tag}</span>
              <button type="button" onClick={() => onRemove(tag)} className="leading-none">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="태그 입력"
        className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
