import { type PropsWithChildren } from 'react';
import './pixelCard.css';

interface Props extends PropsWithChildren {
  title?: string;
  actions?: React.ReactNode;
}

export const PixelCard = ({ title, actions, children }: Props) => (
  <div className="pixel-card-shell">
    {title ? (
      <div className="pixel-card-header">
        <span>{title}</span>
        {actions ? <div className="pixel-card-actions">{actions}</div> : null}
      </div>
    ) : null}
    <div>{children}</div>
  </div>
);


