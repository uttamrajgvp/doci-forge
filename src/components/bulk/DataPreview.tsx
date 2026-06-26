import { useBulkStore } from '../../stores/bulkStore';
import { Table } from 'lucide-react';
import styles from './DataPreview.module.css';

export function DataPreview() {
  const { headers, dataRows, totalRows } = useBulkStore();

  if (headers.length === 0) return null;

  const previewRows = dataRows.slice(0, 5);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <Table size={18} />
          <h3>Data Preview</h3>
        </div>
        <span className={styles.badge}>
          Showing {previewRows.length} of {totalRows} rows
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, idx) => (
              <tr key={idx}>
                {headers.map(header => (
                  <td key={`${idx}-${header}`}>
                    <span className={styles.cellContent} title={row[header]}>
                      {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
