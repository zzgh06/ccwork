import { Note } from '../types/note';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NoteItem({ note, isSelected, onSelect, onDelete }: NoteItemProps) {
  return (
    <div
      onClick={() => onSelect(note.id)}
      className={`rounded-2xl p-4 cursor-pointer transition-all ${
        isSelected ? 'bg-[#dbe4e7]' : 'bg-card hover:bg-[#f1f4f6]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 flex-1">
          {note.title || '(제목 없음)'}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-muted-foreground hover:text-destructive text-xs shrink-0 transition-colors cursor-pointer"
        >
          삭제
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
        {note.content || '(내용 없음)'}
      </p>
      {(() => {
        const visibleTags = [...new Set(note.tags)].filter((tag) => tag.trim() !== '');
        return (
          visibleTags.length > 0 && (
            <ul className="flex flex-wrap gap-1 mt-2">
              {visibleTags.map((tag) => (
                <li
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[#dbe4e7] text-[#586064]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )
        );
      })()}
      <p className="text-[10px] text-muted-foreground/70 mt-2">
        {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
      </p>
    </div>
  );
}
