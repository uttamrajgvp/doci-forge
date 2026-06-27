/**
 * TextEditorPage — The complete PDF text editor.
 *
 * Flow:
 *  1. Load PDF bytes → PDFRenderer reads object tree → extracts PdfTextItem[]
 *  2. User sees PDF preview with transparent text overlays
 *  3. Click any text → inline input appears at exact position
 *  4. Edits are stored in editMap keyed by item id
 *  5. "Save PDF" → PDFModifier.applyTextEdits() → download new file
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  RotateCcw, Loader2, FileText, PenLine, AlertCircle
} from 'lucide-react';
import { PDFRenderer } from '../../lib/pdf/pdfRenderer';
import { PDFModifier } from '../../lib/pdf/pdfModifier';
import { TextOverlayEditor, type TextEditMap } from './TextOverlayEditor';
import type { PdfPageInfo, PdfTextItem } from '../../types/pdf';
import styles from './TextEditorPage.module.css';

interface Props {
  pdfBytes: Uint8Array;
  fileName?: string;
}

type Status = 'loading' | 'ready' | 'saving' | 'error';

export function TextEditorPage({ pdfBytes, fileName }: Props) {
  const navigate = useNavigate();

  const rendererRef = useRef(new PDFRenderer());

  const [status,    setStatus]    = useState<Status>('loading');
  const [error,     setError]     = useState<string>('');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInfo,  setPageInfo]  = useState<PdfPageInfo | null>(null);
  const [dataUrl,   setDataUrl]   = useState<string>('');
  const [editMap,   setEditMap]   = useState<TextEditMap>({});
  const [editsByPage, setEditsByPage] = useState<Map<number, TextEditMap>>(new Map());
  const [zoom,      setZoom]      = useState(0.5); // 0.5 → canvas px * 0.5 = display px
  const [changedCount, setChangedCount] = useState(0);

  // ── Load PDF & render first page ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setStatus('loading');
      try {
        const count = await rendererRef.current.loadDocument(pdfBytes);
        if (cancelled) return;
        setPageCount(count);
        setCurrentPage(1);
        await loadPage(1);
      } catch (e: any) {
        if (!cancelled) { setError(e.message); setStatus('error'); }
      }
    }
    init();
    return () => { cancelled = true; };
  }, [pdfBytes]);

  // ── Load a specific page ─────────────────────────────────────────────────
  const loadPage = useCallback(async (pageNum: number) => {
    setStatus('loading');
    try {
      const offscreen = document.createElement('canvas');
      const info      = await rendererRef.current.renderPage(pageNum, offscreen, 2.0);
      setPageInfo(info);
      setDataUrl(offscreen.toDataURL('image/png'));
      // Restore edits for this page
      const saved = editsByPage.get(pageNum) ?? {};
      setEditMap(saved);
      setStatus('ready');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [editsByPage]);

  // ── Page navigation ──────────────────────────────────────────────────────
  const goToPage = useCallback(async (pageNum: number) => {
    if (pageNum < 1 || pageNum > pageCount) return;
    // Save current page edits
    setEditsByPage(prev => {
      const next = new Map(prev);
      next.set(currentPage, editMap);
      return next;
    });
    setCurrentPage(pageNum);
    await loadPage(pageNum);
  }, [pageCount, currentPage, editMap, loadPage]);

  // ── Record an edit ───────────────────────────────────────────────────────
  const handleEdit = useCallback((id: string, original: PdfTextItem, newText: string, weight?: string, style?: string) => {
    setEditMap(prev => {
      const next = { ...prev, [id]: { originalItem: original, newText, fontWeight: weight, fontStyle: style } };
      // Update changed count
      const changed = Object.values(next).filter(e => 
        e.newText !== e.originalItem.text || 
        e.fontWeight !== e.originalItem.fontWeight || 
        e.fontStyle !== e.originalItem.fontStyle
      ).length;
      setChangedCount(changed);
      return next;
    });
  }, []);

  // ── Export PDF ───────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    setStatus('saving');
    try {
      // Merge current page edits
      const allEdits = new Map(editsByPage);
      allEdits.set(currentPage, editMap);

      // Build TextEdit list per page
      const modifier     = new PDFModifier();
      await modifier.loadDocument(pdfBytes);

      const textEditsByPage = new Map<number, import('../../lib/pdf/pdfModifier').TextEdit[]>();

      for (const [pageNum, pageEditMap] of allEdits) {
        const pageEdits: import('../../lib/pdf/pdfModifier').TextEdit[] = [];
        for (const entry of Object.values(pageEditMap)) {
          if (
            entry.newText !== entry.originalItem.text ||
            entry.fontWeight !== entry.originalItem.fontWeight ||
            entry.fontStyle !== entry.originalItem.fontStyle
          ) {
            pageEdits.push({ 
              originalItem: entry.originalItem, 
              newText: entry.newText,
              fontWeight: entry.fontWeight,
              fontStyle: entry.fontStyle
            });
          }
        }
        if (pageEdits.length) textEditsByPage.set(pageNum, pageEdits);
      }

      if (textEditsByPage.size === 0) {
        setStatus('ready');
        return;
      }

      const bytes = await modifier.applyTextEdits(textEditsByPage);
      const blob  = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = url;
      a.download  = fileName ? `edited-${fileName}` : 'edited-document.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('ready');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  }, [pdfBytes, editsByPage, currentPage, editMap, fileName]);

  // ── Reset all edits ──────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setEditMap({});
    setEditsByPage(new Map());
    setChangedCount(0);
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // don't steal from inputs
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(currentPage + 1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goToPage(currentPage - 1);
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleExport(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentPage, goToPage, handleExport]);

  const displayScale = zoom;

  return (
    <div className={styles.layout}>
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={16} /> Back
          </button>
          <div className={styles.docTitle}>
            <FileText size={16} />
            <span>{fileName ?? 'document.pdf'}</span>
          </div>
        </div>

        <div className={styles.topCenter}>
          <button
            className={styles.navBtn}
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageLabel}>
            Page {currentPage} / {pageCount}
          </span>
          <button
            className={styles.navBtn}
            disabled={currentPage >= pageCount}
            onClick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className={styles.topRight}>
          {/* Zoom */}
          <button className={styles.iconBtn} onClick={() => setZoom(z => Math.max(0.25, z - 0.1))} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button className={styles.iconBtn} onClick={() => setZoom(z => Math.min(2, z + 0.1))} title="Zoom in">
            <ZoomIn size={16} />
          </button>

          <div className={styles.divider} />

          {/* Reset */}
          {changedCount > 0 && (
            <button className={styles.resetBtn} onClick={handleReset} title="Reset all edits">
              <RotateCcw size={14} />
              Reset
            </button>
          )}

          {/* Edit count badge */}
          {changedCount > 0 && (
            <span className={styles.editBadge}>
              <PenLine size={12} />
              {changedCount} edit{changedCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Export */}
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={status === 'saving' || changedCount === 0}
          >
            {status === 'saving' ? (
              <Loader2 size={16} className={styles.spin} />
            ) : (
              <Download size={16} />
            )}
            {status === 'saving' ? 'Saving…' : 'Save PDF'}
          </button>
        </div>
      </header>

      {/* ── Main canvas area ───────────────────────────────────────────── */}
      <main className={styles.canvasArea}>
        {status === 'loading' && (
          <div className={styles.centerMsg}>
            <Loader2 size={32} className={styles.spin} />
            <span>Analyzing PDF structure…</span>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.centerMsg}>
            <AlertCircle size={32} className={styles.errorIcon} />
            <span>{error}</span>
          </div>
        )}

        {(status === 'ready' || status === 'saving') && pageInfo && (
          <div className={styles.canvasScroller}>
            <div className={styles.canvasInner}>
              {/* The hint banner */}
              <div className={styles.hint}>
                <PenLine size={13} />
                Click any text on the page to edit it. Press <kbd>Enter</kbd> to confirm or <kbd>Esc</kbd> to cancel.
              </div>

              <TextOverlayEditor
                pageInfo={pageInfo}
                canvasDataUrl={dataUrl}
                editMap={editMap}
                onEdit={handleEdit}
                scale={displayScale}
              />
            </div>
          </div>
        )}
      </main>

      {/* ── Edit list sidebar ──────────────────────────────────────────── */}
      {changedCount > 0 && (
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Pending edits</h3>
          <div className={styles.editList}>
            {Object.entries(editMap)
              .filter(([, e]) => e.newText !== e.originalItem.text)
              .map(([id, e]) => (
                <div key={id} className={styles.editItem}>
                  <div className={styles.editOld}>{e.originalItem.text}</div>
                  <div className={styles.editArrow}>→</div>
                  <div className={styles.editNew}>{e.newText}</div>
                </div>
              ))}
          </div>
        </aside>
      )}
    </div>
  );
}
