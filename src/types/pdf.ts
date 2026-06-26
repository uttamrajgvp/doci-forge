/** A single text run extracted from the PDF object tree. */
export interface PdfTextItem {
  id: string;
  pageNumber: number;
  text: string;

  // PDF-space coordinates (points, origin bottom-left of page)
  pdfX: number;       // left edge
  pdfBaseline: number; // text baseline
  pdfWidth: number;
  pdfHeight: number;  // approximate glyph height (font size)
  pdfFontSize: number; // em-size in points

  // Canvas-space coordinates at renderScale (origin top-left)
  // Used only for positioning the hover/edit overlay
  canvasX: number;
  canvasY: number;   // visual top (baseline - ascent)
  canvasWidth: number;
  canvasHeight: number;
  canvasBaseline: number;

  fontName: string;    // original PDF font name
  fontWeight?: string;
  fontStyle?: string;
  color: string;       // '#rrggbb'
}

export interface PdfPageInfo {
  pageNumber: number;
  canvasWidth: number;   // rendered canvas px width  (at renderScale)
  canvasHeight: number;  // rendered canvas px height (at renderScale)
  pdfWidth: number;      // page width  in points
  pdfHeight: number;     // page height in points
  renderScale: number;   // scale used when rendering
  rotation: number;
  textItems: PdfTextItem[];
}

// ── Legacy aliases kept for backward compat ──────────────────────────────────
export type TextItem = PdfTextItem;
export type PDFPageInfo = PdfPageInfo;
