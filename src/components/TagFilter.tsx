import type { Tag } from '../lib/types';
import { TagPill } from './TagPill';
import './tagFilter.css';

interface Props {
  tags: Tag[];
  selected: string[];
  onToggle: (tagId: string) => void;
}

export const TagFilter = ({ tags, selected, onToggle }: Props) => (
  <div className="tag-filter">
    {tags.map((tag) => (
      <TagPill
        key={tag.id}
        label={tag.name}
        color={tag.color}
        active={selected.includes(tag.id)}
        onClick={() => onToggle(tag.id)}
      />
    ))}
  </div>
);


