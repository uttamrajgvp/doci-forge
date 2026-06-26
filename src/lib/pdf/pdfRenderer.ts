import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem as PDFJSTextItem } from 'pdfjs-dist/types/src/display/api';
import type { PdfPageInfo, PdfTextItem } from '../../types/pdf';

import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export class PDFRenderer {
  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

  async loadDocument(bytes: Uint8Array): Promise<number> {
    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
    this.pdfDoc = await loadingTask.promise;
    return this.pdfDoc.numPages;
  }

  /**
   * Renders a page to a canvas and extracts all text items.
   *
   * Coordinate systems:
   * ─────────────────────────────────────────────────────────────────────────
   * PDF-space  : origin = bottom-left of page, unit = points (pt)
   *              Used by pdf-lib for writing. Stored as pdfX, pdfBaseline, etc.
   *
   * Canvas-space: origin = top-left of canvas, unit = canvas pixels (at scale)
   *              Used to position HTML overlay divs. Stored as canvasX, canvasY, etc.
   *
   * Conversion:
   *   viewport.transform = [scale, 0, 0, -scale, 0, pageHeight_canvas]
   *   tx = Util.transform(viewport.transform, item.transform)
   *   tx[4] = canvasX  (left edge, canvas px)
   *   tx[5] = canvasBaseline  (baseline y from top, canvas px)
   *
   *   pdfX        = tx[4] / scale   (= item.transform[4], the original PDF x)
   *   pdfBaseline = (canvasHeight - tx[5]) / scale   (flip y-axis)
   *   pdfFontSize = Math.abs(item.transform[3])       (original PDF font size in pt)
   * ─────────────────────────────────────────────────────────────────────────
   */
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 2.0
  ): Promise<PdfPageInfo> {
    if (!this.pdfDoc) throw new Error('PDF document not loaded');

    const page     = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    canvas.width  = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: canvas.getContext('2d')!, viewport } as any).promise;

    const textContent = await page.getTextContent();
    const textItems: PdfTextItem[] = [];

    console.log('[Font Debug] textContent.styles:', JSON.stringify(textContent.styles, null, 2));

    // Original page size in points (un-scaled)
    const pdfPageWidth  = viewport.width  / scale;
    const pdfPageHeight = viewport.height / scale;
    const canvasHeight  = viewport.height;

    for (let i = 0; i < textContent.items.length; i++) {
      const item = textContent.items[i] as PDFJSTextItem;
      if (!item.str || item.str.trim() === '') continue;

      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

      // Extract real font info from textContent.styles
      const fontStyleObj = textContent.styles[item.fontName];
      const realFontFamily = (fontStyleObj?.fontFamily || item.fontName).toLowerCase();
      
      const isBold = realFontFamily.includes('bold');
      const isItalic = realFontFamily.includes('italic') || realFontFamily.includes('oblique');

      if (item.str.includes('FORM NO. 16')) {
        try {
          const fontObj = page.commonObjs.get(item.fontName);
          console.log('[Font Debug] commonObjs for', item.fontName, fontObj);
        } catch(e){}
      }

      // ── Canvas-space ─────────────────────────────────────────────────────
      const canvasBaseline = tx[5];                       // canvas px, top→down
      const canvasFontH    = Math.abs(tx[3]);             // em-height in canvas px
      const canvasX        = tx[4];
      const canvasY        = canvasBaseline - canvasFontH; // visual top
      const canvasWidth    = item.width * scale;
      const canvasHeight_  = canvasFontH * 1.3;           // include descenders

      // ── PDF-space (points) ───────────────────────────────────────────────
      // item.transform[4] and [5] are already the PDF-space x, baseline-y.
      // We can also derive them directly from the canvas coords.
      const pdfX        = canvasX / scale;
      const pdfBaseline = (canvasHeight - canvasBaseline) / scale; // flip y
      const pdfFontSize = Math.abs(item.transform[3]);             // original pt size
      const pdfWidth    = item.width;                              // in pt
      const pdfHeight   = pdfFontSize * 1.3;                      // in pt

      textItems.push({
        id:             `text-${pageNumber}-${i}`,
        pageNumber,
        text:           item.str,
        // PDF-space
        pdfX,
        pdfBaseline,
        pdfWidth,
        pdfHeight,
        pdfFontSize,
        // Canvas-space
        canvasX,
        canvasY,
        canvasBaseline,
        canvasWidth,
        canvasHeight: canvasHeight_,
        fontName:     fontStyleObj?.fontFamily || item.fontName,
        fontWeight:   isBold ? 'bold' : 'normal',
        fontStyle:    isItalic ? 'italic' : 'normal',
        color:        '#000000',
        // legacy aliases
        x:         canvasX,
        y:         canvasY,
        baselineY: canvasBaseline,
        width:     canvasWidth,
        height:    canvasHeight_,
        fontSize:  canvasFontH,
        transform: tx,
      } as any);
    }

    return {
      pageNumber,
      canvasWidth:  viewport.width,
      canvasHeight: viewport.height,
      pdfWidth:     pdfPageWidth,
      pdfHeight:    pdfPageHeight,
      renderScale:  scale,
      rotation:     viewport.rotation,
      textItems,
      // legacy aliases
      width:         viewport.width,
      height:        viewport.height,
      viewportScale: scale,
    } as any;
  }
}
