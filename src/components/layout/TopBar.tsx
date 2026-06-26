import { useLocation } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Menu } from 'lucide-react';
import styles from './TopBar.module.css';

interface TopBarProps {
  onMenuClick?: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/editor': 'PDF Editor',
  '/bulk': 'Bulk Edit',
  '/merge': 'Merge & Split',
  '/templates': 'Templates',
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] ?? '';

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        {title && <h1 className={styles.title}>{title}</h1>}
      </div>

      <div className={styles.right}>
        <ThemeToggle />
      </div>
    </header>
  );
}
