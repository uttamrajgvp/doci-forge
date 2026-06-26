import { 
  Highlighter, 
  MessageSquare, 
  Stamp, 
  PenTool, 
  Minus,
  Strikethrough
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import styles from './AnnotationTools.module.css';

export function AnnotationTools() {
  const { toolMode, setToolMode } = useEditorStore();

  return (
    <div className={styles.container}>
      <div className={styles.toolGroup}>
        <button
          className={`${styles.toolBtn} ${toolMode === 'highlight' ? styles.active : ''}`}
          onClick={() => setToolMode('highlight' as any)}
          title="Highlight"
        >
          <Highlighter size={16} />
        </button>
        <button
          className={`${styles.toolBtn} ${toolMode === 'underline' ? styles.active : ''}`}
          onClick={() => setToolMode('underline' as any)}
          title="Underline"
        >
          <Minus size={16} />
        </button>
        <button
          className={`${styles.toolBtn} ${toolMode === 'strikethrough' ? styles.active : ''}`}
          onClick={() => setToolMode('strikethrough' as any)}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.toolGroup}>
        <button
          className={`${styles.toolBtn} ${toolMode === 'note' ? styles.active : ''}`}
          onClick={() => setToolMode('note' as any)}
          title="Sticky Note"
        >
          <MessageSquare size={16} />
        </button>
        <button
          className={`${styles.toolBtn} ${toolMode === 'stamp' ? styles.active : ''}`}
          onClick={() => setToolMode('stamp' as any)}
          title="Stamp"
        >
          <Stamp size={16} />
        </button>
        <button
          className={`${styles.toolBtn} ${toolMode === 'draw' ? styles.active : ''}`}
          onClick={() => setToolMode('draw' as any)}
          title="Freehand Draw"
        >
          <PenTool size={16} />
        </button>
      </div>
    </div>
  );
}
