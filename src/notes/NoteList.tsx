import { Search } from 'lucide-react';
import { useNotes } from './NotesContext';
import { NoteItem } from './NoteItem';

interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NoteList({
  selectedNoteId,
  onSelect,
  selectedTags,
  onTagToggle,
  searchQuery,
  onSearchChange,
}: NoteListProps) {
  const { notes, loading, error, deleteNote } = useNotes();

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-8">로딩 중...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive text-center py-8">오류: {error}</p>;
  }

  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">노트가 없습니다</p>;
  }

  const allTags = [...new Set(notes.flatMap((note) => note.tags.filter((t) => t.trim() !== '')))];

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const tagFilteredNotes =
    selectedTags.length === 0
      ? notes
      : notes.filter((note) => selectedTags.some((tag) => note.tags.includes(tag)));

  const filteredNotes =
    trimmedQuery === ''
      ? tagFilteredNotes
      : tagFilteredNotes.filter(
          (note) =>
            note.title.toLowerCase().includes(trimmedQuery) ||
            note.content.toLowerCase().includes(trimmedQuery),
        );

  // 검색 결과 없음과 태그 필터 없음 구분
  const isSearchActive = trimmedQuery !== '';
  const isTagFilterActive = selectedTags.length > 0;

  return (
    <>
      {/* 검색 입력창 */}
      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-[#f0f4f5] text-[#2b3437] placeholder:text-[#586064] focus:outline-none focus:ring-2 focus:ring-[#0053dc]"
          data-testid="search-input"
        />
      </div>
      {allTags.length > 0 && (
        <div data-testid="tag-filter" className="flex flex-wrap gap-1 mb-3 px-1">
          {allTags.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                aria-pressed={isActive}
                onClick={() => onTagToggle(tag)}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-[#586064] text-[#dbe4e7]' : 'bg-[#dbe4e7] text-[#586064]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
      {filteredNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {isSearchActive
            ? `'${trimmedQuery}'에 대한 검색 결과가 없습니다`
            : isTagFilterActive
              ? '해당 태그의 노트가 없습니다'
              : '노트가 없습니다'}
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground px-1 pb-1">
            노트 {filteredNotes.length}개
          </p>
          {filteredNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={note.id === selectedNoteId}
              onSelect={onSelect}
              onDelete={deleteNote}
            />
          ))}
        </>
      )}
    </>
  );
}
