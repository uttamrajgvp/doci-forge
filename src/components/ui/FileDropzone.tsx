import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import styles from './FileDropzone.module.css';

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  className?: string;
}

const PDF_SIZE_WARNING_MB = 50;

export function FileDropzone({
  accept = '.pdf',
  multiple = false,
  maxSizeMB,
  onFiles,
  label = 'Drop your file here, or click to browse',
  hint,
  className = '',
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList);

      const warningThreshold = maxSizeMB ?? PDF_SIZE_WARNING_MB;
      const largeFiles = files.filter((f) => f.size > warningThreshold * 1024 * 1024);
      if (largeFiles.length > 0) {
        setWarning(
          `${largeFiles.map((f) => f.name).join(', ')} exceed${largeFiles.length > 1 ? '' : 's'} ${warningThreshold}MB. Processing may be slow.`,
        );
      } else {
        setWarning(null);
      }

      onFiles(files);
    },
    [onFiles, maxSizeMB],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onClick = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className={styles.input}
          tabIndex={-1}
        />

        <div className={styles.iconCircle}>
          {isDragging ? <FileText size={28} /> : <Upload size={28} />}
        </div>

        <p className={styles.label}>{label}</p>

        {hint && <p className={styles.hint}>{hint}</p>}

        <p className={styles.formats}>
          Supported: {accept.split(',').join(', ')}
        </p>
      </div>

      {warning && (
        <div className={styles.warning}>
          <AlertTriangle size={16} />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
