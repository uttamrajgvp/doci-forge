/**
 * TextOverlayEditor — shows a rendered PDF page with clickable text overlays.
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────────────────────
 * 1. PDF is rendered to a <canvas> (read-only bitmap).
 * 2. An absolutely-positioned <div> overlay sits on top of the canvas.
 * 3. Each text item gets a transparent <div> overlay positioned using
 *    canvas-space coords (canvasX, canvasY, canvasWidth, canvasHeight).
 * 4. Clicking a text item opens an <input> inline editor at the same position.
 * 5. On confirm (Enter / blur), the edit is stored in the parent's editMap.
 * 6. The parent calls PDFModifier.applyTextEdits() on export — using PDF-space
 *    coords directly, no coordinate conversion required.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PdfPageInfo, PdfTextItem } from '../../types/pdf';
import styles from './TextOverlayEditor.module.css';

export interface TextEditMap {
  [itemId: string]: {
    originalItem: PdfTextItem;
    newText: string;
    fontWeight?: string;
    fontStyle?: string;
  };
}

interface Props {
  pageInfo: PdfPageInfo;
  canvasDataUrl: string;   // The rendered page as a PNG data URL
  editMap: TextEditMap;
  onEdit: (id: string, original: PdfTextItem, newText: string, weight?: string, style?: string) => void;
  scale: number;           // display scale (1 = 1:1 with canvas pixels)
}

export function TextOverlayEditor({ pageInfo, canvasDataUrl, editMap, onEdit, scale }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft]     = useState('');
  const [draftWeight, setDraftWeight] = useState('normal');
  const [draftStyle, setDraftStyle]   = useState('normal');
  const inputRef              = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = (item: PdfTextItem) => {
    const edit = editMap[item.id];
    setDraft(edit?.newText ?? item.text);
    setDraftWeight(edit?.fontWeight ?? item.fontWeight ?? 'normal');
    setDraftStyle(edit?.fontStyle ?? item.fontStyle ?? 'normal');
    setEditing(item.id);
  };

  const commitEdit = useCallback(() => {
    if (!editing) return;
    const item = pageInfo.textItems.find(i => i.id === editing);
    if (item) {
      onEdit(editing, item, draft, draftWeight, draftStyle);
    }
    setEditing(null);
  }, [editing, draft, draftWeight, draftStyle, pageInfo.textItems, onEdit]);

  const cancelEdit = () => setEditing(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter')  commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const displayW = pageInfo.canvasWidth  * scale;
  const displayH = pageInfo.canvasHeight * scale;

  return (
    <div
      className={styles.wrapper}
      style={{ width: displayW, height: displayH }}
    >
      {/* ── Read-only PDF bitmap ─────────────────────────────────────── */}
      <img
        src={canvasDataUrl}
        alt="PDF page"
        className={styles.pageImage}
        style={{ width: displayW, height: displayH }}
        draggable={false}
      />

      {/* ── Text overlay ─────────────────────────────────────────────── */}
      <div className={styles.overlay}>
        {pageInfo.textItems.map(item => {
          const left   = item.canvasX * scale;
          const top    = item.canvasY * scale;
          const width  = item.canvasWidth  * scale;
          const height = item.canvasHeight * scale;
          const isEditing = editing === item.id;
          const editEntry = editMap[item.id];
          const isEdited  = !!editEntry && (
            editEntry.newText !== item.text || 
            editEntry.fontWeight !== item.fontWeight || 
            editEntry.fontStyle !== item.fontStyle
          );
          
          const displayText  = editEntry?.newText ?? item.text;
          const displayColor = editEntry?.originalItem?.color || item.color || '#000000';
          const displayWeight = isEditing ? draftWeight : (editEntry?.fontWeight ?? item.fontWeight ?? 'normal');
          const displayStyle  = isEditing ? draftStyle : (editEntry?.fontStyle ?? item.fontStyle ?? 'normal');

          return (
            <div
              key={item.id}
              className={`${styles.textZone} ${isEdited ? styles.edited : ''}`}
              style={{
                left,
                top,
                width: isEdited ? 'max-content' : width,
                minWidth: width,
                height,
                fontSize: item.canvasHeight * 0.72 * scale,
                color: displayColor,
                fontFamily: item.fontName || 'inherit',
                fontWeight: displayWeight,
                fontStyle: displayStyle,
              }}
              title={item.text}
              onClick={() => !isEditing && startEdit(item)}
            >
              {isEditing ? (
                <>
                  <div className={styles.formatToolbar} onMouseDown={e => e.preventDefault()}>
                    <button 
                      className={`${styles.formatBtn} ${draftWeight === 'bold' ? styles.activeFormat : ''}`}
                      onClick={() => setDraftWeight(w => w === 'bold' ? 'normal' : 'bold')}
                      title="Bold"
                    >B</button>
                    <button 
                      className={`${styles.formatBtn} ${draftStyle === 'italic' ? styles.activeFormat : ''}`}
                      onClick={() => setDraftStyle(s => s === 'italic' ? 'normal' : 'italic')}
                      title="Italic"
                    >I</button>
                  </div>
                  <input
                    ref={inputRef}
                    className={styles.inlineInput}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={commitEdit}
                    style={{ 
                      fontSize: item.canvasHeight * 0.72 * scale,
                      fontWeight: displayWeight,
                      fontStyle: displayStyle,
                      color: displayColor
                    }}
                  />
                </>
              ) : (
                <span className={styles.textLabel}>{displayText}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
