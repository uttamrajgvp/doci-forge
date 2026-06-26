import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Upload } from 'lucide-react';
import { DEFAULT_FONTS } from '../../lib/pdf/fontManager';
import styles from './FontSelector.module.css';

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

export function FontSelector({ value, onChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allFonts = [...DEFAULT_FONTS];
  const filtered = allFonts.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={styles.container} ref={containerRef}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontFamily: value }}
      >
        <span className={styles.value}>{value}</span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search fonts..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>
          
          <div className={styles.fontList}>
            {filtered.map(font => (
              <button
                key={font}
                className={`${styles.fontItem} ${font === value ? styles.active : ''}`}
                style={{ fontFamily: font }}
                onClick={() => {
                  onChange(font);
                  setIsOpen(false);
                }}
              >
                {font}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className={styles.noResults}>No fonts found</div>
            )}
          </div>

          <div className={styles.footer}>
            <button className={styles.uploadBtn}>
              <Upload size={14} />
              <span>Upload Custom Font</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
