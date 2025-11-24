import { type ChangeEvent } from 'react';
import './toggleSwitch.css';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const ToggleSwitch = ({
  checked,
  onChange,
  label,
  disabled = false,
  'aria-label': ariaLabel
}: ToggleSwitchProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={`toggle-switch ${disabled ? 'toggle-switch--disabled' : ''}`}>
      {label && <span className="toggle-switch__label">{label}</span>}
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel || label}
        className="toggle-switch__input"
      />
      <span className="toggle-switch__slider" />
    </label>
  );
};

