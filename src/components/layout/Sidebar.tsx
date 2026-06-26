import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileEdit,
  Layers,
  Combine,
  BookTemplate,
  ChevronLeft,
  ChevronRight,
  Anvil,
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/editor', icon: FileEdit, label: 'Edit PDF' },
  { to: '/bulk', icon: Layers, label: 'Bulk Edit' },
  { to: '/merge', icon: Combine, label: 'Merge & Split' },
  { to: '/templates', icon: BookTemplate, label: 'Templates' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logoMark}>
          <Anvil size={22} />
        </div>
        {!collapsed && <span className={styles.brandText}>PDF Forge</span>}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.collapseBtn} onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
