import './tagPill.css';

interface Props {
  label: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'default' | 'small';
}

export const TagPill = ({ label, color, active, onClick, size = 'default' }: Props) => {
  const className = `tag-pill ${active ? 'tag-pill--active' : ''} ${size === 'small' ? 'tag-pill--small' : ''}`;
  const style = { backgroundColor: color };
  
  if (onClick) {
    return (
      <button className={className} style={style} onClick={onClick} type="button">
        {label}
      </button>
    );
  }
  
  return (
    <span className={className} style={style}>
      {label}
    </span>
  );
};


