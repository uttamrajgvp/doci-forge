import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useEditorStore } from '../../stores/editorStore';
import { PDFRenderer } from '../../lib/pdf/pdfRenderer';
import { mapPdfFontToGoogle, loadGoogleFont } from '../../lib/pdf/fontManager';
import styles from './EditorCanvas.module.css';

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const pageInfoRef = useRef<any>(null);
  
  const historyRef = useRef<any[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isSuppressingHistoryRef = useRef<boolean>(false);
  const isDebug = new URLSearchParams(window.location.search).has('debug');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const {
    pdfBytes,
    currentPage,
    zoom,
    toolMode,
    setSelectedObjectIds,
    setPageCount,
    setFabricCanvas,
    setUndoRedo,
  } = useEditorStore();

  const [renderer] = useState(() => new PDFRenderer());

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 0,
      height: 0,
      preserveObjectStacking: true,
      selection: true,
    });

    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas);
    (canvas as any)._onDebugCallback = (info: any) => {
      setDebugInfo(info);
    };

    canvas.on('selection:created', (e) => {
      setSelectedObjectIds(e.selected?.map((obj) => (obj as any).id || '') || []);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObjectIds(e.selected?.map((obj) => (obj as any).id || '') || []);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObjectIds([]);
    });

    // History tracking helper
    const saveState = () => {
      if (isSuppressingHistoryRef.current) return;
      const state = canvas.getObjects()
        .filter((obj: any) => !obj.excludeFromExport)
        .map((obj) => obj.toObject(['id', 'data']));
      
      // Truncate any future history if we branched off
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(state);
      historyIndexRef.current = historyRef.current.length - 1;
      
      const { setHistoryState } = useEditorStore.getState();
      setHistoryState(
        historyIndexRef.current > 0,
        false  // no redo available after a new action
      );
    };

    // Push an initial blank state so index=0 is always a valid baseline
    historyRef.current = [[]];
    historyIndexRef.current = 0;

    canvas.on('object:added', saveState);
    canvas.on('object:modified', saveState);
    canvas.on('object:removed', saveState);

    // Click handler for text editing / canvas interaction
    canvas.on('mouse:down', (options) => {
      // If we clicked on an existing object, let fabric handle it
      if (options.target) return;
      
      const store = useEditorStore.getState();
      if (store.toolMode !== 'text') return;

      const pointer = canvas.getScenePoint(options.e);
      const bgImage = canvas.backgroundImage;
      if (!bgImage) return;

      const pageInfo = pageInfoRef.current;
      if (!pageInfo) return;

      const leftShift = 0;
      const topShift = 0;

      const pdfX = pointer.x;
      const pdfY = pointer.y;

      const clickedItem = pageInfo.textItems.find((item: any) => {
        const padding = 5;
        return (
          pdfX >= item.x - padding &&
          pdfX <= item.x + item.width + padding &&
          pdfY >= item.y - padding &&
          pdfY <= item.y + item.height + padding
        );
      });

      // Show coordinates on the window for easy verification
      const debugObj = {
        clickedItemX: clickedItem?.x,
        clickedItemY: clickedItem?.y,
        clickedItemWidth: clickedItem?.width,
        pointerX: pointer.x,
        pointerY: pointer.y,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        bgWidth: bgImage.width,
        bgHeight: bgImage.height,
        leftShift,
        topShift,
        clickedItemText: clickedItem?.text,
        clickedItemFontSize: clickedItem?.fontSize,
        clickedItemFontName: clickedItem?.fontName,
        clickedItemTransform: clickedItem?.transform,
        viewportTransform: canvas.viewportTransform,
      };
      (window as any).__lastDebugCoord = debugObj;
      if (isDebug) {
        console.log('CLICK COORDINATES DEBUG:', debugObj);
        (canvas as any)._onDebugCallback?.(debugObj);
      }

      let textbox: fabric.Textbox;

      if (clickedItem) {
        // Fix overlap: Check if we already have an edited textbox for this clicked item
        const existingTextbox = canvas.getObjects().find(
          (obj: any) => obj.type === 'textbox' && obj.id === `edited-${clickedItem.id}`
        );
        if (existingTextbox) {
          canvas.setActiveObject(existingTextbox);
          if (existingTextbox instanceof fabric.Textbox) {
            existingTextbox.enterEditing();
            existingTextbox.selectAll();
          }
          canvas.requestRenderAll();
          return;
        }

        // Cover the original text — extend past baseline to hide descenders
        // height = fontSize * 1.4 ensures full coverage including descenders
        const coverHeight = clickedItem.fontSize * 1.4;
        const coverRect = new fabric.Rect({
          left:  clickedItem.x + leftShift,
          top:   clickedItem.y + topShift,
          width: clickedItem.width + 4,      // tiny extra to cover glyph overflow
          height: coverHeight,
          fill: '#ffffff',
          selectable: false,
          evented: false,
          data: { type: 'cover', originalItem: clickedItem }
        } as any);
        canvas.add(coverRect);

        // Resolve Google font and load it
        const googleFont = mapPdfFontToGoogle(clickedItem.fontName);
        loadGoogleFont(googleFont);

        // Place the editable Textbox precisely over the original text.
        // clickedItem.y = baselineY - fontSize  (visual top of text)
        // Fabric renders text so baseline ≈ top + fontSize, matching our coordinate.
        textbox = new fabric.Textbox(clickedItem.text, {
          left:       clickedItem.x + leftShift,
          top:        clickedItem.y + topShift,
          width:      clickedItem.width + 100, // buffer to prevent wrapping
          fontSize:   clickedItem.fontSize,
          fill:       clickedItem.color || '#000000',
          fontFamily: googleFont,
          lineHeight: 1,                        // no extra line spacing
          id:   `edited-${clickedItem.id}`,
          data: { originalItem: clickedItem }
        } as any);
      } else {
        // Create a new standalone Textbox at the clicked position
        textbox = new fabric.Textbox('Type here...', {
          left: pointer.x,
          top: pointer.y,
          width: 200,
          fontSize: 16,
          fill: '#000000',
          fontFamily: 'Helvetica',
          backgroundColor: 'rgba(255,255,200,0.6)',  // pale yellow hint so it's visible
          splitByGrapheme: false,
          editable: true,
          id: `text-${Date.now()}`,
        } as any);
      }

      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      textbox.enterEditing();
      textbox.selectAll();
      canvas.requestRenderAll();
    });

    // Hover Highlight logic for existing text
    let hoverRect: fabric.Rect | null = null;

    canvas.on('mouse:move', (options) => {
      const store = useEditorStore.getState();
      if (store.toolMode !== 'text') {
        if (hoverRect) {
          canvas.remove(hoverRect);
          hoverRect = null;
          canvas.requestRenderAll();
        }
        return;
      }

      const pointer = canvas.getScenePoint(options.e);
      const bgImage = canvas.backgroundImage;
      if (!bgImage) return;

      const pageInfo = pageInfoRef.current;
      if (!pageInfo) return;

      const leftShift = 0;
      const topShift = 0;

      const pdfX = pointer.x;
      const pdfY = pointer.y;

      const hoveredItem = pageInfo.textItems.find((item: any) => {
        const padding = 5;
        return (
          pdfX >= item.x - padding &&
          pdfX <= item.x + item.width + padding &&
          pdfY >= item.y - padding &&
          pdfY <= item.y + item.height + padding
        );
      });

      if (hoveredItem) {
        canvas.defaultCursor = 'pointer';
        const left = hoveredItem.x + leftShift;
        const top = hoveredItem.y + topShift;
        const rectHeight = hoveredItem.height;

        if (hoverRect) {
          hoverRect.set({
            left,
            top,
            width: hoveredItem.width,
            height: rectHeight,
            visible: true
          });
        } else {
          hoverRect = new fabric.Rect({
            left,
            top,
            width: hoveredItem.width,
            height: rectHeight,
            fill: 'rgba(59, 130, 246, 0.15)', // transparent blue fill
            stroke: '#3b82f6', // blue border
            strokeWidth: 1,
            selectable: false,
            evented: false,
            excludeFromExport: true,
          } as any);
          canvas.add(hoverRect);
        }
        canvas.bringObjectToFront(hoverRect);
        canvas.requestRenderAll();
      } else {
        canvas.defaultCursor = 'default';
        if (hoverRect) {
          hoverRect.set({ visible: false });
          canvas.requestRenderAll();
        }
      }
    });

    // Canvas container handles layout, no manual resize needed

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;

      // Don't delete if we are in text editing mode
      if (activeObject instanceof fabric.Textbox && activeObject.isEditing) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((activeObject as any).data?.originalItem) {
          const origId = (activeObject as any).data.originalItem.id;
          const cover = canvas.getObjects().find(
            (obj) => (obj as any).data?.type === 'cover' && (obj as any).data?.originalItem?.id === origId
          );
          if (cover) canvas.remove(cover);
        }
        canvas.remove(activeObject);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }
    };

    const loadHistoryState = async () => {
      isSuppressingHistoryRef.current = true;

      // Remove all non-persistent objects (covers, textboxes etc.)
      canvas.getObjects().slice().forEach(o => {
        if (!(o as any).excludeFromExport) {
          canvas.remove(o);
        }
      });

      const state = historyRef.current[historyIndexRef.current] || [];
      if (state.length > 0) {
        const objects = await fabric.util.enlivenObjects(state);
        objects.forEach((obj) => {
          canvas.add(obj as any);
        });
      }

      canvas.discardActiveObject();
      canvas.requestRenderAll();
      const { setHistoryState } = useEditorStore.getState();
      setHistoryState(
        historyIndexRef.current > 0,
        historyIndexRef.current < historyRef.current.length - 1
      );
      isSuppressingHistoryRef.current = false;
    };

    const undo = () => {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
        loadHistoryState();
      }
    };

    const redo = () => {
      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current += 1;
        loadHistoryState();
      }
    };

    setUndoRedo(undo, redo);

    window.addEventListener('keydown', handleKeyDown);
 
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
      fabricCanvasRef.current = null;
      setFabricCanvas(null);
    };
  }, [setSelectedObjectIds, setFabricCanvas, setUndoRedo]);

  // Load PDF Page
  useEffect(() => {
    async function loadPage() {
      if (!pdfBytes || !fabricCanvasRef.current) return;

      try {
        isSuppressingHistoryRef.current = true;
        const pageCount = await renderer.loadDocument(pdfBytes);
        setPageCount(pageCount);

        // We render to an offscreen canvas first
        const offscreen = document.createElement('canvas');
        const pageInfo = await renderer.renderPage(currentPage, offscreen, 2.0); // 2.0 scale for clarity
        pageInfoRef.current = pageInfo;
        
        // Set background
        const bgImage = await fabric.Image.fromURL(offscreen.toDataURL('image/png'));
        bgImage.set({
          originX: 'left',
          originY: 'top',
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
        });
        
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        
        // Clear old objects and set background
        canvas.clear();
        
        // Set canvas dimensions to match the PDF page size at scale 2.0
        canvas.setDimensions({
          width: pageInfo.canvasWidth,
          height: pageInfo.canvasHeight,
        });
        
        canvas.backgroundImage = bgImage;

        // Restore saved edits for this page
        const savedEdits = useEditorStore.getState().pageEdits[currentPage];
        if (savedEdits && savedEdits.length > 0) {
          const objects = await fabric.util.enlivenObjects(savedEdits);
          objects.forEach((obj: any) => {
            canvas.add(obj);
          });
        }

        // Initialize history stack for the newly loaded page
        historyRef.current = [
          canvas.getObjects()
            .filter((obj: any) => !obj.excludeFromExport)
            .map((obj) => obj.toObject(['id', 'data']))
        ];
        historyIndexRef.current = 0;
        const { setHistoryState } = useEditorStore.getState();
        setHistoryState(false, false);

        canvas.requestRenderAll();
        isSuppressingHistoryRef.current = false;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    }

    loadPage();
  }, [pdfBytes, currentPage, renderer, setPageCount]);

  // Handle Zoom
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    
    // Zoom around center
    const center = canvas.getCenterPoint();
    canvas.zoomToPoint(center, zoom);
  }, [zoom]);

  // Handle Tool Mode
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;

    canvas.isDrawingMode = toolMode === 'draw';
    
    // Disable selection if not in select/text mode
    canvas.selection = toolMode === 'select' || toolMode === 'text';
    canvas.getObjects().forEach(obj => {
      obj.selectable = toolMode === 'select' || toolMode === 'text';
      obj.evented = toolMode === 'select' || toolMode === 'text';
    });
    
  }, [toolMode]);

  return (
    <div className={styles.canvasContainer} ref={containerRef}>
      {!pdfBytes && (
        <div className={styles.emptyState}>
          Please upload a PDF from the Dashboard or Editor home.
        </div>
      )}
      <canvas ref={canvasRef} />
      {isDebug && debugInfo && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#38bdf8',
          padding: '16px',
          borderRadius: '12px',
          fontFamily: 'Consolas, monospace',
          fontSize: '11px',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '220px',
        }}>
          <div style={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>📐 Coordinate Debugger</div>
          <div>text: <span style={{ color: '#38bdf8' }}>"{debugInfo.clickedItemText || 'none'}"</span></div>
          <div>clickedItemX: <span style={{ color: '#f43f5e' }}>{debugInfo.clickedItemX?.toFixed(1) || 'null'}</span></div>
          <div>clickedItemY: <span style={{ color: '#f43f5e' }}>{debugInfo.clickedItemY?.toFixed(1) || 'null'}</span></div>
          <div>clickedWidth: <span style={{ color: '#10b981' }}>{debugInfo.clickedItemWidth?.toFixed(1) || 'null'}</span></div>
          <div>pointerX: <span style={{ color: '#eab308' }}>{debugInfo.pointerX?.toFixed(1)}</span></div>
          <div>pointerY: <span style={{ color: '#eab308' }}>{debugInfo.pointerY?.toFixed(1)}</span></div>
          <div>canvasSize: <span style={{ color: '#a855f7' }}>{debugInfo.canvasWidth}x{debugInfo.canvasHeight}</span></div>
          <div>bgImageSize: <span style={{ color: '#a855f7' }}>{debugInfo.bgWidth}x{debugInfo.bgHeight}</span></div>
          <div style={{ wordBreak: 'break-all', fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>tx: {JSON.stringify(debugInfo.clickedItemTransform)}</div>
          <div style={{ wordBreak: 'break-all', fontSize: '9px', color: '#94a3b8' }}>vpTx: {JSON.stringify(debugInfo.viewportTransform)}</div>
        </div>
      )}
    </div>
  );
}


