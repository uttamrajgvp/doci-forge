import { PDFModifier } from '../pdf/pdfModifier';
import { downloadZip } from 'client-zip';
import type { FieldMapping } from '../../stores/bulkStore';

export interface GenerationParams {
  pdfBytes: Uint8Array;
  dataRows: Record<string, any>[];
  mappings: FieldMapping[];
  filenamePattern: string;
  onProgress?: (progress: number) => void;
}

export async function generateBulkPdfs({
  pdfBytes,
  dataRows,
  mappings,
  filenamePattern,
  onProgress
}: GenerationParams): Promise<Blob> {
  const zipInput = [];
  const modifier = new PDFModifier();
  await modifier.loadDocument(pdfBytes);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const editsByPage = new Map<number, import('./pdfModifier').TextEdit[]>();

    // Map fields for the current row
    for (const mapping of mappings) {
      if (!mapping.csvHeader && !mapping.defaultValue) continue;

      const value = mapping.csvHeader && row[mapping.csvHeader] !== undefined 
        ? String(row[mapping.csvHeader]) 
        : mapping.defaultValue;

      if (!value) continue;

      const pageNum = mapping.originalItem.pageNumber;
      if (!editsByPage.has(pageNum)) {
        editsByPage.set(pageNum, []);
      }

      editsByPage.get(pageNum)!.push({
        originalItem: mapping.originalItem,
        newText: value,
      });
    }

    // Apply exact styling and replace text via PDFModifier
    const modifiedBytes = editsByPage.size > 0 
      ? await modifier.applyTextEdits(editsByPage)
      : pdfBytes;
    
    // Resolve filename
    let filename = filenamePattern || `Document_${i + 1}.pdf`;
    filename = filename.replace(/\{\{index\}\}/g, String(i + 1));
    for (const key of Object.keys(row)) {
      filename = filename.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(row[key]));
    }
    
    // Add to ZIP input
    zipInput.push({
      name: filename,
      lastModified: new Date(),
      input: modifiedBytes
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / dataRows.length) * 100));
    }
  }

  // Generate ZIP
  const zipResponse = await downloadZip(zipInput);
  return await zipResponse.blob();
}
