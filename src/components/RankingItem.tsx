import { type ReactNode } from 'react';
import './rankingItem.css';

interface RankingItemProps {
  rank: number;
  children: ReactNode;
  onClick?: () => void;
}

export const RankingItem = ({ rank, children, onClick }: RankingItemProps) => {
  return (
    <div 
      className={`ranking-item ${onClick ? 'ranking-item--clickable' : ''}`}
      onClick={onClick}
    >
      <div className="ranking-item-rank">{rank}</div>
      <div className="ranking-item-content">{children}</div>
    </div>
  );
};
