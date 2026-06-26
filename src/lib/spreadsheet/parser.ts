import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParseResult {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          if (results.errors.length && results.data.length === 0) {
            reject(new Error(results.errors[0].message));
            return;
          }
          
          const headers = results.meta.fields || [];
          resolve({
            headers,
            rows: results.data as Record<string, any>[],
            totalRows: results.data.length
          });
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } else if (ext === 'xlsx' || ext === 'xls') {
    return new Promise(async (resolve, reject) => {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
        
        if (json.length === 0) {
          resolve({ headers: [], rows: [], totalRows: 0 });
          return;
        }

        const headers = Object.keys(json[0]);
        resolve({
          headers,
          rows: json,
          totalRows: json.length
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
