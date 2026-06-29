import { useEffect, useRef, useState } from 'react';
import { useBulkStore } from '../../stores/bulkStore';
import { useEditorStore } from '../../stores/editorStore';
import { PDFRenderer } from '../../lib/pdf/pdfRenderer';
import type { PdfPageInfo } from '../../types/pdf';
import { LinkIcon, ChevronLeft, ChevronRight, PlusCircle, Bold } from 'lucide-react';
import styles from './VisualFieldMapper.module.css';

export function VisualFieldMapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageInfo, setPageInfo] = useState<PdfPageInfo | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [renderer] = useState(() => new PDFRenderer());
  const [addMode, setAddMode] = useState(false);

  const { pdfBytes } = useEditorStore();
  const { mappings, headers, currentPage, setPage, updateMapping, setMappings } = useBulkStore();

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

        const offscreen = document.createElement('canvas');
        const info = await renderer.renderPage(currentPage, offscreen, 1.5);

        if (isCancelled) return;

        const canvas = canvasRef.current;
        canvas.width = offscreen.width;
        canvas.height = offscreen.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(offscreen, 0, 0);

        setPageInfo(info);
      } catch (err) {
        console.error('Failed to render PDF for mapping', err);
      }
    }
    renderPdf();

    return () => { isCancelled = true; };
  }, [pdfBytes, currentPage, renderer]);

  const handleFieldClick = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPopoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top + 20 });
    setActiveFieldId(fieldId);
  };

  const closePopover = () => setActiveFieldId(null);

  // Handle click on the PDF canvas area to add a new custom field
  const handlePdfAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addMode) return;
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale = 1.5;
    // coords relative to the canvas
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const canvasBaseline = canvasY + 12;

    // convert to PDF-space (unscaled, y-axis flipped because PDF origin is bottom-left)
    const pdfX = canvasX / scale;
    const canvasH = pageInfo?.canvasHeight || rect.height;
    const pdfBaseline = (canvasH - canvasBaseline) / scale;

    // Store canvas coordinates at 1.0 scale (unscaled) to match auto-detected fields
    // which were extracted at 1.0 scale in BulkEdit.tsx
    const unscaledCanvasX = canvasX / scale;
    const unscaledCanvasY = canvasY / scale;
    const unscaledCanvasBaseline = canvasBaseline / scale;

    const newFieldId = `custom-field-${Date.now()}`;
    const newField = {
      pdfFieldId: newFieldId,
      pageNumber: currentPage,
      csvHeader: null as string | null,
      defaultValue: '',
      isCustom: true,
      originalItem: {
        id: newFieldId,
        pageNumber: currentPage,
        text: 'New Field',
        pdfX,
        pdfBaseline,
        pdfWidth: 80 / scale,
        pdfHeight: 12 / scale,
        pdfFontSize: 12, // pt size
        canvasX: unscaledCanvasX,
        canvasY: unscaledCanvasY,
        canvasWidth: 80 / scale,
        canvasHeight: 16 / scale,
        canvasBaseline: unscaledCanvasBaseline,
        fontName: 'Helvetica',
        color: '#000000',
      },
    };

    setMappings([...mappings, newField]);
    setAddMode(false);

    // Open popover for the new field
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setPopoverPos({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top + 20,
      });
    }
    setActiveFieldId(newFieldId);
  };

  // Click outside to close
  useEffect(() => {
    const handleGlobalClick = () => {
      closePopover();
      setAddMode(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  if (!pdfBytes) return null;

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Add Field button */}
      <button
        className={`${styles.addFieldBtn} ${addMode ? styles.addFieldBtnActive : ''}`}
        onClick={(e) => { e.stopPropagation(); setAddMode(!addMode); closePopover(); }}
        title={addMode ? 'Click anywhere on the PDF to place a field. Press Esc to cancel.' : 'Add a custom text field'}
      >
        <PlusCircle size={15} />
        {addMode ? 'Click on PDF to place...' : 'Add Custom Field'}
      </button>

      <div
        ref={canvasWrapperRef}
        className={`${styles.canvasWrapper} ${addMode ? styles.addCursor : ''}`}
        onClick={handlePdfAreaClick}
      >
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* Render interactive field overlays */}
        {pageInfo && mappings
          .filter(m => m.pageNumber === currentPage)
          .map(mapping => {
            const isMapped = !!mapping.csvHeader;
            const isActive = activeFieldId === mapping.pdfFieldId;
            const isCustom = !!(mapping as any).isCustom;

            const scale = 1.5;
            const x = mapping.originalItem.canvasX * scale;
            const y = mapping.originalItem.canvasY * scale;
            const width = mapping.originalItem.canvasWidth * scale;
            const height = mapping.originalItem.canvasHeight * scale;

            const label = mapping.csvHeader 
              ? `{{${mapping.csvHeader}}}`
              : mapping.defaultValue || '+ Map Column';

            return (
              <div
                key={mapping.pdfFieldId}
                className={`${styles.fieldOverlay} ${isMapped ? styles.mapped : ''} ${isActive ? styles.active : ''} ${isCustom ? styles.custom : ''}`}
                style={{ left: `${x}px`, top: `${y}px`, width: `${Math.max(width, 80)}px`, height: `${Math.max(height, 20)}px` }}
                onClick={(e) => handleFieldClick(e, mapping.pdfFieldId)}
                title={`${mapping.originalItem.text}\nFont: ${mapping.originalItem.fontName} (${Math.round(mapping.originalItem.pdfFontSize)}pt)`}
              >
                {isCustom && (
                  <span className={styles.overlayLabel}>{label}</span>
                )}
              </div>
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
            {/* Remove button for custom fields */}
            {mappings.find(m => m.pdfFieldId === activeFieldId && (m as any).isCustom) && (
              <button
                className={styles.removeBtn}
                onClick={() => {
                  setMappings(mappings.filter(m => m.pdfFieldId !== activeFieldId));
                  closePopover();
                }}
              >
                Remove
              </button>
            )}
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

            {/* Font & Size — shown for all fields, most useful for custom ones */}
            <div className={styles.fontControls}>
              <select
                className={styles.fontSelect}
                value={mappings.find(m => m.pdfFieldId === activeFieldId)?.originalItem.fontName || 'Helvetica'}
                onChange={(e) => {
                  const m = mappings.find(m => m.pdfFieldId === activeFieldId);
                  if (m) updateMapping(activeFieldId, { originalItem: { ...m.originalItem, fontName: e.target.value } });
                }}
              >
                <option value="Helvetica">Helvetica (Sans)</option>
                <option value="TimesRoman">Times Roman (Serif)</option>
                <option value="Courier">Courier (Mono)</option>
              </select>
              <input
                type="number"
                className={styles.sizeInput}
                title="Font Size (pt)"
                min={6}
                max={72}
                value={mappings.find(m => m.pdfFieldId === activeFieldId)?.originalItem.pdfFontSize || 12}
                onChange={(e) => {
                  const m = mappings.find(m => m.pdfFieldId === activeFieldId);
                  if (m) updateMapping(activeFieldId, { originalItem: { ...m.originalItem, pdfFontSize: parseInt(e.target.value) || 12 } });
                }}
              />
              <button 
                className={`${styles.styleBtn} ${mappings.find(m => m.pdfFieldId === activeFieldId)?.originalItem.fontWeight === 'bold' ? styles.styleBtnActive : ''}`}
                onClick={(e) => {
                  const m = mappings.find(m => m.pdfFieldId === activeFieldId);
                  if (m) {
                    const isCurrentlyBold = m.originalItem.fontWeight === 'bold';
                    updateMapping(activeFieldId, { originalItem: { ...m.originalItem, fontWeight: isCurrentlyBold ? 'normal' : 'bold' } });
                  }
                }}
                title="Toggle Bold"
              >
                <Bold size={14} />
              </button>
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
