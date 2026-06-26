import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  indeterminate?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showPercent = true,
  variant = 'primary',
  size = 'md',
  indeterminate = false,
  className = '',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {(label || showPercent) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {showPercent && !indeterminate && (
            <span className={styles.percent}>{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className={`${styles.track} ${styles[size]}`}>
        <div
          className={`${styles.fill} ${styles[variant]} ${indeterminate ? styles.indeterminate : ''}`}
          style={indeterminate ? undefined : { width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
