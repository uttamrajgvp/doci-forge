import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { mode, setMode } = useThemeStore();

  const cycle = () => {
    const order = ['light', 'dark', 'system'] as const;
    const idx = order.indexOf(mode);
    setMode(order[(idx + 1) % 3]);
  };

  return (
    <button
      className={styles.toggle}
      onClick={cycle}
      aria-label={`Current theme: ${mode}. Click to change.`}
      title={`Theme: ${mode}`}
    >
      <span className={`${styles.iconWrap} ${mode === 'light' ? styles.active : ''}`}>
        <Sun size={18} />
      </span>
      <span className={`${styles.iconWrap} ${mode === 'dark' ? styles.active : ''}`}>
        <Moon size={18} />
      </span>
      <span className={`${styles.iconWrap} ${mode === 'system' ? styles.active : ''}`}>
        <Monitor size={18} />
      </span>
    </button>
  );
}
