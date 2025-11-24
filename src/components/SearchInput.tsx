import { type ChangeEvent } from 'react';
import './searchInput.css';

interface Props {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({ placeholder, value, onChange }: Props) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="search-input">
      <input value={value} placeholder={placeholder} onChange={handleChange} />
    </div>
  );
};


