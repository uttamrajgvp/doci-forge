import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { PdfTextItem } from '../../types/pdf';

/**
 * A text edit to apply to the PDF.
 * All coordinates are in **PDF-space points** (origin bottom-left).
 */
export interface TextEdit {
  originalItem: PdfTextItem; // the source text item from pdfRenderer
  newText: string;           // user's replacement text
  color?: string;            // hex color override (default: original color)
  fontSize?: number;         // font size override in pt (default: original)
  fontWeight?: string;
  fontStyle?: string;
}

// ── Legacy aliases ──────────────────────────────────────────────────────────
export interface EditOpText {
  type: 'text';
  id: string;
  text: string;
  x: number; y: number;
  width: number; height: number;
  fontSize: number;
  fontName: string;
  fontStyle?: string;
  fontWeight?: string;
  color: string;
  originalItem?: PdfTextItem;
}
export interface EditOpImage {
  type: 'image';
  id: string;
  dataUrl: string;
  x: number; y: number;
  width: number; height: number;
}
export type EditOp = EditOpText | EditOpImage;
// ────────────────────────────────────────────────────────────────────────────

function mapToStandardFont(
  googleFont: string,
  bold = false,
  italic = false
): StandardFonts {
  const n = googleFont.toLowerCase().replace(/[^a-z]/g, '');

  const isSerif = (n.includes('serif') && !n.includes('sans')) || 
    n.includes('merriweather') || n.includes('playfair') ||
    n.includes('lora') || n.includes('ptserif') ||
    n.includes('times') || n.includes('georgia');

  const isMono = n.includes('firacode') || n.includes('robotomono') ||
    n.includes('sourcecodepro') || n.includes('courier');

  if (isMono) {
    if (bold && italic) return StandardFonts.CourierBoldOblique;
    if (bold)           return StandardFonts.CourierBold;
    if (italic)         return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }
  if (isSerif) {
    if (bold && italic) return StandardFonts.TimesRomanBoldItalic;
    if (bold)           return StandardFonts.TimesRomanBold;
    if (italic)         return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }
  if (bold && italic) return StandardFonts.HelveticaBoldOblique;
  if (bold)           return StandardFonts.HelveticaBold;
  if (italic)         return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? { r: parseInt(r[1], 16) / 255, g: parseInt(r[2], 16) / 255, b: parseInt(r[3], 16) / 255 }
    : { r: 0, g: 0, b: 0 };
}

export class PDFModifier {
  private originalBytes: Uint8Array | null = null;
  private fontCache: Map<StandardFonts, any> = new Map();

  async loadDocument(bytes: Uint8Array) {
    this.originalBytes = new Uint8Array(bytes);
  }

  private async fresh(): Promise<PDFDocument> {
    if (!this.originalBytes) throw new Error('Document not loaded');
    const doc = await PDFDocument.load(this.originalBytes);
    this.fontCache.clear();
    return doc;
  }

  private async getFont(doc: PDFDocument, sf: StandardFonts) {
    if (this.fontCache.has(sf)) return this.fontCache.get(sf);
    const font = await doc.embedFont(sf);
    this.fontCache.set(sf, font);
    return font;
  }

  /**
   * Apply a list of TextEdits (one per changed text item) and return new PDF bytes.
   *
   * For each edit:
   *  1. Draw a white rectangle over the original text (cover it up).
   *  2. Draw the new text at EXACTLY the same PDF-space baseline position.
   *
   * Coordinates used here are pdfX / pdfBaseline / pdfFontSize — all in points,
   * already in pdf-lib's coordinate system (origin bottom-left). NO conversion needed.
   */
  async applyTextEdits(
    editsByPage: Map<number, TextEdit[]>
  ): Promise<Uint8Array> {
    const doc   = await this.fresh();
    const pages = doc.getPages();

    for (const [pageNumber, edits] of editsByPage) {
      const page = pages[pageNumber - 1];
      if (!page) continue;

      for (const edit of edits) {
        const item = edit.originalItem;

        // ── 1. Cover original text ─────────────────────────────────────────
        // White rect from (baseline - ascent) to (baseline + descender)
        const coverX      = item.pdfX - 1;
        const coverY      = item.pdfBaseline - item.pdfFontSize * 0.25;
        const coverW      = item.pdfWidth + 2;
        const coverH      = item.pdfFontSize * 1.3;

        page.drawRectangle({
          x: coverX, y: coverY,
          width: coverW, height: coverH,
          color: rgb(1, 1, 1),
        });

        // ── 2. Draw new text at same baseline ─────────────────────────────
        const fontSize = edit.fontSize ?? item.pdfFontSize;
        const color    = hexToRgb(edit.color ?? item.color ?? '#000000');
        
        const nameLower = (item.fontName || '').toLowerCase();
        const isBold    = (edit.fontWeight ?? item.fontWeight) === 'bold' || nameLower.includes('bold');
        const isItalic  = (edit.fontStyle ?? item.fontStyle) === 'italic' || nameLower.includes('italic') || nameLower.includes('oblique');
        const standardFont = mapToStandardFont(item.fontName || 'Helvetica', isBold, isItalic);
        const font     = await this.getFont(doc, standardFont);

        if (fontSize >= 1 && edit.newText.trim()) {
          page.drawText(edit.newText, {
            x:     item.pdfX,
            y:     item.pdfBaseline,
            size:  fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
          });
        }
      }
    }

    return doc.save();
  }

  // ── Legacy method kept for backward compat (Fabric-based export) ──────────
  async applyAllEdits(
    allEdits: Record<number, EditOp[]>,
    viewportScale: number = 2.0
  ): Promise<Uint8Array> {
    const doc   = await this.fresh();
    const pages = doc.getPages();

    for (const pageNumStr of Object.keys(allEdits)) {
      const pageNumber = parseInt(pageNumStr);
      const edits      = allEdits[pageNumber];
      if (!edits?.length) continue;

      const page         = pages[pageNumber - 1];
      if (!page) continue;
      const pageHeightPt = page.getHeight();

      for (const edit of edits) {
        if (edit.type === 'text') {
          const orig = edit.originalItem;
          if (orig) {
            // Use stored PDF-space coords directly
            page.drawRectangle({
              x: orig.pdfX - 1,
              y: orig.pdfBaseline - orig.pdfFontSize * 0.25,
              width:  orig.pdfWidth + 2,
              height: orig.pdfFontSize * 1.3,
              color:  rgb(1, 1, 1),
            });
            const isBold   = (edit.fontWeight || '') === 'bold' || (edit.fontWeight || '') === '700';
            const isItalic = (edit.fontStyle  || '') === 'italic';
            const sf       = mapToStandardFont(edit.fontName || 'Open Sans', isBold, isItalic);
            const font     = await this.getFont(doc, sf);
            const c        = hexToRgb(typeof edit.color === 'string' ? edit.color : '#000000');
            const sizePt   = orig.pdfFontSize;
            if (sizePt >= 1) {
              page.drawText(edit.text, {
                x: orig.pdfX, y: orig.pdfBaseline,
                size: sizePt, font,
                color: rgb(c.r, c.g, c.b),
              });
            }
          } else {
            // New text box (no original item) — fall back to canvas→pt conversion
            const isBold   = (edit.fontWeight || '') === 'bold' || (edit.fontWeight || '') === '700';
            const isItalic = (edit.fontStyle  || '') === 'italic';
            const sf       = mapToStandardFont(edit.fontName || 'Open Sans', isBold, isItalic);
            const font     = await this.getFont(doc, sf);
            const c        = hexToRgb(typeof edit.color === 'string' ? edit.color : '#000000');
            const sizePt   = edit.fontSize / viewportScale;
            const xPt      = edit.x / viewportScale;
            const yPt      = pageHeightPt - (edit.y + edit.fontSize) / viewportScale;
            if (sizePt >= 1) {
              page.drawText(edit.text, {
                x: xPt, y: yPt, size: sizePt, font,
                color: rgb(c.r, c.g, c.b),
              });
            }
          }
        } else if (edit.type === 'image') {
          let img;
          if (edit.dataUrl.startsWith('data:image/png'))         img = await doc.embedPng(edit.dataUrl);
          else if (edit.dataUrl.startsWith('data:image/jpeg') ||
                   edit.dataUrl.startsWith('data:image/jpg'))    img = await doc.embedJpg(edit.dataUrl);
          if (img) {
            page.drawImage(img, {
              x:      edit.x / viewportScale,
              y:      page.getHeight() - (edit.y + edit.height) / viewportScale,
              width:  edit.width  / viewportScale,
              height: edit.height / viewportScale,
            });
          }
        }
      }
    }
    return doc.save();
  }
}
