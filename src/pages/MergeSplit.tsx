import { useNavigate } from 'react-router-dom';
import { Combine } from 'lucide-react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import styles from './EditorPlaceholder.module.css';

export function MergeSplit() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrap} style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
          <Combine size={32} />
        </div>
        <h2 className={styles.title}>Merge & Split PDFs</h2>
        <p className={styles.desc}>
          Combine multiple PDFs into one, reorder pages with drag-and-drop,
          or extract specific page ranges into separate files.
        </p>

        <FileDropzone
          accept=".pdf"
          multiple
          onFiles={(files) => console.log('Merge files:', files.map(f => f.name))}
          label="Drop your PDF files here"
          hint="Upload multiple PDFs to merge or split"
        />

        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
