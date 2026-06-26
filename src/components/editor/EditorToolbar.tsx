import {
  MousePointer2,
  Type,
  Image as ImageIcon,
  Square,
  Undo2,
  Redo2,
  Save,
  ZoomIn,
  ZoomOut,
  Download
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { Button } from '../ui/Button';
import { AnnotationTools } from './AnnotationTools';
import { PDFModifier } from '../../lib/pdf/pdfModifier';
import styles from './EditorToolbar.module.css';

export function EditorToolbar() {
  const {
    toolMode,
    setToolMode,
    zoom,
    setZoom,
    canUndo,
    canRedo,
    pdfBytes,
    pdfFile,
    saveCurrentPageEdits,
    setIsProcessing,
    undo,
    redo,
  } = useEditorStore();

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.25, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.25, 0.5));

  const handleSave = async () => {
    const projectId = new URLSearchParams(window.location.search).get('project');
    if (!projectId || !pdfBytes) return;

    setIsProcessing(true);
    try {
      saveCurrentPageEdits();
      
      const { saveProject } = await import('../../lib/db');
      const now = Date.now();
      const project = {
        id: projectId,
        name: pdfFile?.name || 'document.pdf',
        type: 'single' as const,
        fileSize: pdfFile?.size || pdfBytes.byteLength,
        createdAt: now,
        updatedAt: now,
      };
      await saveProject(project);
      alert('Project saved successfully!');
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      saveCurrentPageEdits();
      
      const latestPageEdits = useEditorStore.getState().pageEdits;
      const canvas = useEditorStore.getState().fabricCanvas;
      if (!canvas) return;

      const allEdits: Record<number, any[]> = {};

      for (const pageNumStr of Object.keys(latestPageEdits)) {
        const pageNum = parseInt(pageNumStr);
        const objs = latestPageEdits[pageNum] || [];
        allEdits[pageNum] = objs
          .map((obj: any) => {
            const pdfX = obj.left;
            const pdfY = obj.top;

            if (obj.type === 'textbox') {
              return {
                type: 'text',
                id: obj.id,
                text: obj.text,
                x: pdfX,
                y: pdfY,
                width: obj.width * (obj.scaleX || 1),
                height: obj.height * (obj.scaleY || 1),
                fontSize: obj.fontSize * (obj.scaleY || 1),
                fontName: obj.fontFamily || 'Open Sans',
                fontStyle: obj.fontStyle || 'normal',
                fontWeight: obj.fontWeight || 'normal',
                color: typeof obj.fill === 'string' ? obj.fill : '#000000',
                originalItem: obj.data?.originalItem,
              };
            } else if (obj.type === 'image') {
              return {
                type: 'image',
                id: obj.id,
                dataUrl: obj.src || obj.data?.dataUrl,
                x: pdfX,
                y: pdfY,
                width: obj.width * (obj.scaleX || 1),
                height: obj.height * (obj.scaleY || 1),
              };
            }
            return null;
          })
          .filter(Boolean);
      }

      const modifier = new PDFModifier();
      await modifier.loadDocument(pdfBytes);
      const modifiedBytes = await modifier.applyAllEdits(allEdits, 2.0); // scale 2.0

      const blob = new Blob([modifiedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile?.name ? `edited-${pdfFile.name}` : 'edited-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolGroup}>
        <button
          className={`${styles.toolBtn} ${toolMode === 'select' ? styles.active : ''}`}
          onClick={() => setToolMode('select')}
          title="Select (V)"
        >
          <MousePointer2 size={18} />
        </button>
        <button
          className={`${styles.toolBtn} ${toolMode === 'text' ? styles.active : ''}`}
          onClick={() => setToolMode('text')}
          title="Text (T)"
        >
          <Type size={18} />
        </button>
        <button
          className={`${styles.toolBtn} ${toolMode === 'image' ? styles.active : ''}`}
          onClick={() => setToolMode('image')}
          title="Image (I)"
        >
          <ImageIcon size={18} />
        </button>
        <button
          className={`${styles.toolBtn} ${toolMode === 'shape' ? styles.active : ''}`}
          onClick={() => setToolMode('shape')}
          title="Shape (R)"
        >
          <Square size={18} />
        </button>
      </div>

      <div className={styles.divider} />

      <AnnotationTools />

      <div className={styles.divider} />

      <div className={styles.toolGroup}>
        <button
          className={styles.toolBtn}
          disabled={!canUndo}
          onClick={undo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          className={styles.toolBtn}
          disabled={!canRedo}
          onClick={redo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>
      </div>

      <div className={styles.spacer} />

      <div className={styles.toolGroup}>
        <button className={styles.toolBtn} onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <span className={styles.zoomText}>{Math.round(zoom * 100)}%</span>
        <button className={styles.toolBtn} onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={18} />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.actionGroup}>
        <Button variant="ghost" size="sm" icon={<Save size={16} />} onClick={handleSave}>
          Save
        </Button>
        <Button variant="primary" size="sm" icon={<Download size={16} />} onClick={handleExport}>
          Export PDF
        </Button>
      </div>
    </div>
  );
}
