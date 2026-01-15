import { type ChangeEvent, type KeyboardEvent } from 'react';
import './searchInput.css';

interface Props {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export const SearchInput = ({ placeholder, value, onChange, onFocus, onKeyDown, autoFocus }: Props) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="search-input">
      <input
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
      />
    </div>
  );
};


