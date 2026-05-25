import { useNotes } from './NotesContext';
import { NoteItem } from './NoteItem';

interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function NoteList({ selectedNoteId, onSelect, selectedTags, onTagToggle }: NoteListProps) {
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

  const filteredNotes =
    selectedTags.length === 0
      ? notes
      : notes.filter((note) => selectedTags.some((tag) => note.tags.includes(tag)));

  return (
    <>
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
          해당 태그의 노트가 없습니다
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
