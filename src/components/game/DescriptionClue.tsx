import './DescriptionClue.css';

interface DescriptionClueProps {
  description: string;
}

export function DescriptionClue({ description }: DescriptionClueProps) {
  return (
    <div className="description-clue">
      <div className="description-clue-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C7.58 2 4 4.69 4 8c0 2.5 2.04 4.64 5 5.6V22l3-3 3 3v-8.4c2.96-.96 5-3.1 5-5.6 0-3.31-3.58-6-8-6z" />
        </svg>
      </div>
      <blockquote className="description-clue-text">{description}</blockquote>
    </div>
  );
}
