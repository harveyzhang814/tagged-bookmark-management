import { type ButtonHTMLAttributes } from 'react';
import './pixelButton.css';

type Variant = 'primary' | 'secondary' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export const PixelButton = ({ variant = 'primary', block, children, ...rest }: Props) => (
  <button className={`pixel-btn pixel-btn--${variant} ${block ? 'pixel-btn--block' : ''}`} {...rest}>
    <span>{children}</span>
  </button>
);


