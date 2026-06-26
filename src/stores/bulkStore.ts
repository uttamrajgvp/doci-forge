import { create } from 'zustand';
import type { PdfTextItem } from '../types/pdf';

export interface FieldMapping {
  pdfFieldId: string;
  originalItem: PdfTextItem; // The full text item found in PDF
  csvHeader: string | null;
  defaultValue: string;
  pageNumber: number;
}

export interface BulkState {
  // Spreadsheet state
  dataFile: File | null;
  headers: string[];
  dataRows: Record<string, any>[];
  totalRows: number;
  
  // Mapping state
  mappings: FieldMapping[];
  filenamePattern: string;
  
  // Generation state
  isGenerating: boolean;
  progress: number;
  generatedZipUrl: string | null;
  
  // View state
  currentPage: number;

  // Actions
  setDataFile: (file: File | null, headers?: string[], rows?: Record<string, any>[]) => void;
  setMappings: (mappings: FieldMapping[]) => void;
  updateMapping: (pdfFieldId: string, updates: Partial<FieldMapping>) => void;
  setFilenamePattern: (pattern: string) => void;
  setGenerating: (isGenerating: boolean, progress?: number) => void;
  setGeneratedZipUrl: (url: string | null) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useBulkStore = create<BulkState>((set) => ({
  dataFile: null,
  headers: [],
  dataRows: [],
  totalRows: 0,
  mappings: [],
  filenamePattern: 'Document_{{index}}.pdf',
  isGenerating: false,
  progress: 0,
  generatedZipUrl: null,
  currentPage: 1,

  setDataFile: (file, headers = [], rows = []) => set({ 
    dataFile: file, 
    headers, 
    dataRows: rows, 
    totalRows: rows.length 
  }),

  setMappings: (mappings) => set({ mappings }),

  updateMapping: (pdfFieldId, updates) => set((state) => ({
    mappings: state.mappings.map(m => 
      m.pdfFieldId === pdfFieldId ? { ...m, ...updates } : m
    )
  })),

  setFilenamePattern: (pattern) => set({ filenamePattern: pattern }),

  setGenerating: (isGenerating, progress = 0) => set({ 
    isGenerating, 
    progress 
  }),

  setGeneratedZipUrl: (url) => set({ generatedZipUrl: url }),

  setPage: (page) => set({ currentPage: page }),

  reset: () => set({
    dataFile: null,
    headers: [],
    dataRows: [],
    totalRows: 0,
    mappings: [],
    filenamePattern: 'Document_{{index}}.pdf',
    isGenerating: false,
    progress: 0,
    generatedZipUrl: null,
    currentPage: 1
  })
}));
