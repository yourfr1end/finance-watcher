import { memo } from 'react';
import { CategoryIcon } from '../../components/CategoryIcon/CategoryIcon.jsx';
import { TagChip } from '../../components/TagChip/TagChip.jsx';
import { tagColor } from '../../lib/palette.js';
import styles from './CategoryCard.module.css';

export const CategoryCard = memo(function CategoryCard({ category, onOpen }) {
  return (
    <li>
      <button type="button" className={styles.card} onClick={onOpen}>
        <CategoryIcon icon={category.icon} color={category.color} size={40} />

        <span className={styles.body}>
          <span className={styles.name}>{category.name}</span>
          {category.tags.length > 0 && (
            <span className={styles.tags}>
              {category.tags.map((tag) => (
                <TagChip key={tag.id} tag={{ ...tag, color: tagColor(category, tag.id) }} />
              ))}
            </span>
          )}
        </span>

        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  );
});
