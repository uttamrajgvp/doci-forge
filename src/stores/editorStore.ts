import { create } from 'zustand';
import * as fabric from 'fabric';

export type ToolMode = 'select' | 'text' | 'image' | 'shape' | 'draw' | 'redact' | 'highlight' | 'underline' | 'strikethrough' | 'note' | 'stamp';

export interface EditorState {
  // Document state
  pdfFile: File | null;
  pdfBytes: Uint8Array | null;
  pageCount: number;
  currentPage: number;
  zoom: number;

  // Editor state
  toolMode: ToolMode;
  selectedObjectIds: string[];
  isProcessing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  
  // Fabric Canvas & Page Edits
  fabricCanvas: fabric.Canvas | null;
  pageEdits: Record<number, any[]>;

  // Actions
  setPdfFile: (file: File | null) => void;
  setPdfBytes: (bytes: Uint8Array | null) => void;
  setPageCount: (count: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setToolMode: (mode: ToolMode) => void;
  setSelectedObjectIds: (ids: string[]) => void;
  setIsProcessing: (processing: boolean) => void;
  setHistoryState: (canUndo: boolean, canRedo: boolean) => void;
  setFabricCanvas: (canvas: fabric.Canvas | null) => void;
  setPageEdits: (edits: Record<number, any[]>) => void;
  saveCurrentPageEdits: () => void;
  undo: () => void;
  redo: () => void;
  setUndoRedo: (undo: () => void, redo: () => void) => void;
  reset: () => void;
}

const initialState = {
  pdfFile: null,
  pdfBytes: null,
  pageCount: 0,
  currentPage: 1,
  zoom: 1,
  toolMode: 'select' as ToolMode,
  selectedObjectIds: [],
  isProcessing: false,
  canUndo: false,
  canRedo: false,
  fabricCanvas: null,
  pageEdits: {},
  undo: () => {},
  redo: () => {},
};

export const useEditorStore = create<EditorState>()((set, get) => ({
  ...initialState,

  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfBytes: (bytes) => set({ pdfBytes: bytes }),
  setPageCount: (count) => set({ pageCount: count }),
  setCurrentPage: (page) => {
    // Save edits of the page we are leaving before switching
    get().saveCurrentPageEdits();
    set({ currentPage: page });
  },
  setZoom: (zoom) => set({ zoom }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setHistoryState: (canUndo, canRedo) => set({ canUndo, canRedo }),
  setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),
  setPageEdits: (edits) => set({ pageEdits: edits }),
  saveCurrentPageEdits: () => {
    const canvas = get().fabricCanvas;
    if (!canvas) return;
    const currentPage = get().currentPage;

    const objects = canvas.getObjects()
      .filter((obj: any) => !obj.excludeFromExport)
      .map((obj) => {
        // Serialize all properties needed for both display restoration and PDF export
        return obj.toObject(['id', 'data', 'fontFamily', 'fontStyle', 'fontWeight', 'fontSize', 'fill', 'textAlign']);
      });

    set((state) => ({
      pageEdits: {
        ...state.pageEdits,
        [currentPage]: objects,
      },
    }));
  },
  setUndoRedo: (undo, redo) => set({ undo, redo }),
  reset: () => set(initialState),
}));

