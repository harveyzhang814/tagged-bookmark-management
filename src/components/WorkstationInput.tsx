import { useEffect, useState, useRef, type KeyboardEvent, type FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Workstation } from '../lib/types';
import './workstationInput.css';

interface WorkstationInputProps {
  value: string[];
  workstations: Workstation[];
  onChange: (workstationIds: string[]) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
}

export const WorkstationInput = ({
  value,
  workstations,
  onChange,
  placeholder,
  className = '',
  onBlur
}: WorkstationInputProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Workstation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const query = input.trim().toLowerCase();
    const matched = workstations.filter(
      (w) => w.name.toLowerCase().includes(query) && !value.includes(w.id)
    );
    setSuggestions(matched.slice(0, 8));
  }, [input, workstations, value]);

  const handleAdd = (workstationId: string) => {
    if (!value.includes(workstationId)) {
      onChange([...value, workstationId]);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleRemove = (workstationId: string) => {
    onChange(value.filter((id) => id !== workstationId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !input && value.length > 0) {
      handleRemove(value[value.length - 1]);
    }
  };

  const selected = value
    .map((id) => workstations.find((w) => w.id === id))
    .filter((w): w is Workstation => w !== undefined);

  const handleWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      onBlur?.();
    }
  };

  return (
    <div className={`workstation-input-wrapper ${className}`} onBlur={handleWrapperBlur}>
      <div className="workstation-input-chips">
        {selected.map((ws) => (
          <div key={ws.id} className="workstation-chip">
            <span className="workstation-chip__name">{ws.name}</span>
            <button
              type="button"
              className="workstation-chip-remove"
              onClick={() => handleRemove(ws.id)}
              aria-label={t('workstation.removeFromIncluded')}
            >
              ×
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="workstation-input"
          placeholder={value.length === 0 ? (placeholder ?? t('workstation.addPlaceholder')) : ''}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={t('workstation.workstationIncluded')}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="workstation-input-suggestions">
          {suggestions.map((ws) => (
            <button
              key={ws.id}
              type="button"
              className="workstation-input-suggestion-item"
              onClick={() => handleAdd(ws.id)}
            >
              <span className="workstation-chip__name">{ws.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
