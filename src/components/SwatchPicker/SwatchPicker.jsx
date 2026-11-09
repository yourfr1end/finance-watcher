import { paint } from '../../lib/palette.js';
import styles from './SwatchPicker.module.css';

/**
 * Single-choice grid (radio group semantics) used for both colors and icons.
 * renderOption(value) draws the content of one swatch.
 */
export function SwatchPicker({ label, options, value, onChange, renderOption, getOptionLabel = String }) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className="field-label">{label}</legend>
      <div className={styles.grid}>
        {options.map((option) => (
          <label key={option} className={styles.swatch} title={getOptionLabel(option)}>
            <input
              type="radio"
              className="visually-hidden"
              checked={option === value}
              onChange={() => onChange(option)}
              aria-label={getOptionLabel(option)}
            />
            <span className={styles.face}>{renderOption(option)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ColorDot({ color, size = 20 }) {
  return <span className={styles.dot} style={{ background: paint(color), width: size, height: size }} />;
}
