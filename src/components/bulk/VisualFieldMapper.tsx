import { useEffect, useRef, useState } from 'react';
import { useBulkStore } from '../../stores/bulkStore';
import { useEditorStore } from '../../stores/editorStore';
import { PDFRenderer } from '../../lib/pdf/pdfRenderer';
import type { PdfPageInfo } from '../../types/pdf';
import { LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './VisualFieldMapper.module.css';

export function VisualFieldMapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageInfo, setPageInfo] = useState<PdfPageInfo | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [renderer] = useState(() => new PDFRenderer());
  
  const { pdfBytes } = useEditorStore();
  const { mappings, headers, currentPage, setPage, updateMapping } = useBulkStore();
  
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  // Render PDF
  useEffect(() => {
    let isCancelled = false;

    async function renderPdf() {
      if (!pdfBytes || !canvasRef.current) return;
      
      try {
        const pages = await renderer.loadDocument(pdfBytes);
        setTotalPages(pages);
        
        // Render to an offscreen canvas to avoid React Strict Mode concurrent rendering corruption
        const offscreen = document.createElement('canvas');
        const info = await renderer.renderPage(currentPage, offscreen, 1.5);
        
        if (isCancelled) return;

        // Copy to visible canvas
        const canvas = canvasRef.current;
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(offscreen, 0, 0);
        }
        
        setPageInfo(info);
      } catch (err) {
        console.error("Failed to render PDF for mapping", err);
      }
    }
    renderPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, currentPage, renderer]);

  const handleFieldClick = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Position popover near the clicked element
    setPopoverPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top + 20,
    });
    setActiveFieldId(fieldId);
  };

  const closePopover = () => {
    setActiveFieldId(null);
  };

  // Click outside to close
  useEffect(() => {
    const handleGlobalClick = () => closePopover();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  if (!pdfBytes) return null;

  return (
    <div className={styles.container} ref={containerRef} onClick={closePopover}>
      <div className={styles.canvasWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} />
        
        {/* Render interactive field overlays */}
        {pageInfo && mappings
          .filter(m => m.pageNumber === currentPage)
          .map(mapping => {
            const isMapped = !!mapping.csvHeader;
            const isActive = activeFieldId === mapping.pdfFieldId;
            
            // Adjust coordinates based on the renderer's scale (1.5)
            const scale = 1.5;
            const x = mapping.originalItem.x * scale;
            const y = mapping.originalItem.y * scale;
            const width = mapping.originalItem.width * scale;
            const height = mapping.originalItem.height * scale;
            
            return (
              <div
                key={mapping.pdfFieldId}
                className={`${styles.fieldOverlay} ${isMapped ? styles.mapped : ''} ${isActive ? styles.active : ''}`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                onClick={(e) => handleFieldClick(e, mapping.pdfFieldId)}
                title={mapping.originalItem.text}
              />
            );
          })}
      </div>

      {/* Mapping Popover */}
      {activeFieldId && (
        <div 
          className={styles.popover} 
          style={{ left: popoverPos.x, top: popoverPos.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.popoverHeader}>
            <span>Map to Column</span>
          </div>
          <div className={styles.popoverBody}>
            <div className={styles.selectWrapper}>
              <LinkIcon size={14} className={styles.linkIcon} />
              <select
                className={styles.select}
                value={mappings.find(m => m.pdfFieldId === activeFieldId)?.csvHeader || ''}
                onChange={(e) => {
                  updateMapping(activeFieldId, { csvHeader: e.target.value || null });
                  closePopover();
                }}
              >
                <option value="">-- Do not map --</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
            <div className={styles.fallbackWrapper}>
              <input
                type="text"
                placeholder="Fallback/Default value"
                className={styles.input}
                value={mappings.find(m => m.pdfFieldId === activeFieldId)?.defaultValue || ''}
                onChange={(e) => updateMapping(activeFieldId, { defaultValue: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            disabled={currentPage <= 1}
            onClick={(e) => { e.stopPropagation(); setPage(currentPage - 1); }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageText}>Page {currentPage} of {totalPages}</span>
          <button 
            className={styles.pageBtn} 
            disabled={currentPage >= totalPages}
            onClick={(e) => { e.stopPropagation(); setPage(currentPage + 1); }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
