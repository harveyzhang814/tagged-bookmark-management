import type { Tag } from '../lib/types';
import { TagPill } from './TagPill';
import './hotTagCard.css';

interface HotTagCardProps {
  tag: Tag;
  onClick: () => void;
}

export const HotTagCard = ({ tag, onClick }: HotTagCardProps) => {
  return (
    <div className="hot-tag-card" onClick={onClick}>
      <h4 className="hot-tag-title" title={tag.name}>
        {tag.name}
      </h4>
      <div className="hot-tag-stats">
        <TagPill label={`使用 ${tag.usageCount}`} color={tag.color} size="small" />
        <TagPill label={`点击 ${tag.clickCount}`} color={tag.color} size="small" />
      </div>
    </div>
  );
};

