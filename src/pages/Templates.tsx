import { useNavigate } from 'react-router-dom';
import { BookTemplate } from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from './EditorPlaceholder.module.css';

export function Templates() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrap} style={{ background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}>
          <BookTemplate size={32} />
        </div>
        <h2 className={styles.title}>Templates</h2>
        <p className={styles.desc}>
          Save your editor configurations as reusable templates.
          Quickly apply the same edits across multiple documents.
        </p>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
