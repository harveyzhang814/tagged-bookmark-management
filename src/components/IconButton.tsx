import { type ButtonHTMLAttributes } from 'react';
import './iconButton.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'danger' | 'secondary' | 'primary';
  icon: string | React.ReactNode;
  'aria-label': string;
}

export const IconButton = ({ variant = 'secondary', icon, className = '', ...rest }: IconButtonProps) => {
  return (
    <button
      className={`icon-button icon-button--${variant} ${className}`}
      type="button"
      {...rest}
    >
      {typeof icon === 'string' ? <span className="icon-button__icon">{icon}</span> : icon}
    </button>
  );
};

