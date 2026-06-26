import { useState } from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESETS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', 
  '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'
];

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button 
        className={styles.trigger} 
        style={{ background: color }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pick color"
      />
      
      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.presetGrid}>
            {PRESETS.map((c) => (
              <button
                key={c}
                className={`${styles.presetBtn} ${c === color ? styles.active : ''}`}
                style={{ background: c }}
                onClick={() => {
                  onChange(c);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
          <div className={styles.customInput}>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => onChange(e.target.value)} 
              className={styles.nativeColor}
            />
            <input 
              type="text" 
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className={styles.hexInput}
            />
          </div>
        </div>
      )}
    </div>
  );
}
