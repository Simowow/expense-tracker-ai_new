import { Category, CATEGORY_BG, CATEGORY_ICONS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  category: Category;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export default function CategoryBadge({ category, size = 'md', showIcon = false }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        CATEGORY_BG[category],
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'
      )}
    >
      {showIcon && <span className="text-xs">{CATEGORY_ICONS[category]}</span>}
      {category}
    </span>
  );
}
