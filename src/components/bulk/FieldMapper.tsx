import { useBulkStore } from '../../stores/bulkStore';
import { ArrowRight, Link as LinkIcon, AlertCircle } from 'lucide-react';
import styles from './FieldMapper.module.css';

export function FieldMapper() {
  const { mappings, headers, updateMapping, filenamePattern, setFilenamePattern } = useBulkStore();

  if (mappings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <AlertCircle size={24} className={styles.emptyIcon} />
        <p>No text fields detected in the PDF.</p>
        <span>Add text fields in the Editor first, or use a PDF with existing text.</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.configSection}>
        <h4 className={styles.configTitle}>Output Settings</h4>
        <div className={styles.field}>
          <label>Generated Filename Pattern</label>
          <div className={styles.filenameInputWrapper}>
            <input 
              type="text" 
              className={styles.input} 
              value={filenamePattern}
              onChange={e => setFilenamePattern(e.target.value)}
              placeholder="Document_{{index}}.pdf"
            />
            <p className={styles.helpText}>
              Use <code>{`{{index}}`}</code> for row number, or <code>{`{{ColumnName}}`}</code> to use data from your CSV.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.headerRow}>
        <div className={styles.colPdf}>PDF Field</div>
        <div className={styles.colIcon}></div>
        <div className={styles.colCsv}>Data Source Column</div>
        <div className={styles.colDefault}>Fallback / Default Value</div>
      </div>

      <div className={styles.mappingList}>
        {mappings.map((mapping) => {
          const isMapped = !!mapping.csvHeader;
          
          return (
            <div key={mapping.pdfFieldId} className={`${styles.mappingRow} ${isMapped ? styles.mapped : ''}`}>
              <div className={styles.colPdf}>
                <div className={styles.pdfFieldBadge}>
                  <span className={styles.pdfFieldName}>{mapping.originalItem.text}</span>
                  <span className={styles.pageBadge}>Pg {mapping.pageNumber}</span>
                </div>
              </div>
              
              <div className={styles.colIcon}>
                <ArrowRight size={16} className={isMapped ? styles.iconMapped : styles.iconUnmapped} />
              </div>
              
              <div className={styles.colCsv}>
                <div className={styles.selectWrapper}>
                  <LinkIcon size={14} className={styles.linkIcon} />
                  <select
                    className={styles.select}
                    value={mapping.csvHeader || ''}
                    onChange={(e) => updateMapping(mapping.pdfFieldId, { csvHeader: e.target.value || null })}
                  >
                    <option value="">-- Do not map --</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className={styles.colDefault}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Optional"
                  value={mapping.defaultValue}
                  onChange={(e) => updateMapping(mapping.pdfFieldId, { defaultValue: e.target.value })}
                  disabled={!isMapped}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
