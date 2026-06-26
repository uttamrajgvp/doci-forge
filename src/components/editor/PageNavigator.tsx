import { useEditorStore } from '../../stores/editorStore';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useState } from 'react';
import styles from './PageNavigator.module.css';

export function PageNavigator() {
  const { pageCount, currentPage, setCurrentPage } = useEditorStore();
  const [collapsed, setCollapsed] = useState(false);

  if (pageCount === 0) return null;

  return (
    <div className={`${styles.navigator} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        {!collapsed && (
          <div className={styles.titleWrap}>
            <Layers size={16} />
            <span className={styles.title}>Pages ({pageCount})</span>
          </div>
        )}
        <button 
          className={styles.collapseBtn} 
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle page navigator"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className={styles.pageList}>
          {Array.from({ length: pageCount }).map((_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === currentPage;
            
            return (
              <div 
                key={pageNum}
                className={`${styles.pageItem} ${isActive ? styles.active : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                <div className={styles.thumbnail}>
                  {/* Phase 3 will render actual page thumbnails here */}
                  <span className={styles.thumbPlaceholder}>{pageNum}</span>
                </div>
                <span className={styles.pageLabel}>Page {pageNum}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
