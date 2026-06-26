import { ShieldAlert, X } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from './RedactionTool.module.css';

interface RedactionToolProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function RedactionTool({ onClose, onConfirm }: RedactionToolProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <ShieldAlert size={18} className={styles.warningIcon} />
          <h3>Redact Content</h3>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.body}>
        <p className={styles.desc}>
          Draw rectangles over the content you want to permanently hide. 
          When the document is saved, the underlying text and images will be permanently removed.
        </p>

        <div className={styles.alertBox}>
          <ShieldAlert size={20} />
          <div className={styles.alertContent}>
            <h4>Warning</h4>
            <p>Redaction is permanent. The removed content cannot be recovered from the exported PDF.</p>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Start Redacting</Button>
      </div>
    </div>
  );
}
