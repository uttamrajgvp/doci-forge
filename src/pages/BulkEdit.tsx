import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Download, CheckCircle, Loader2 } from 'lucide-react';
import { FileDropzone } from '../components/ui/FileDropzone';
import { Button } from '../components/ui/Button';
import { useBulkStore, type FieldMapping } from '../stores/bulkStore';
import { useEditorStore } from '../stores/editorStore';
import { PDFRenderer } from '../lib/pdf/pdfRenderer';
import { parseFile } from '../lib/spreadsheet/parser';
import { generateBulkPdfs } from '../lib/bulk/generator';
import { VisualFieldMapper } from '../components/bulk/VisualFieldMapper';
// import { DataPreview } from '../components/bulk/DataPreview';
import { useToast } from '../components/ui/Toast';
import { getProject } from '../lib/db';
import styles from './BulkEdit.module.css';

export function BulkEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast: addToast } = useToast();

  const {
    dataFile,
    setDataFile,
    setMappings,
    mappings,
    dataRows,
    isGenerating,
    progress,
    setGenerating,
    generatedZipUrl,
    setGeneratedZipUrl,
    reset: resetBulk,
    filenamePattern,
    setFilenamePattern,
  } = useBulkStore();

  const { pdfBytes, setPdfBytes, setPdfFile, reset: resetEditor } = useEditorStore();

  const [renderer] = useState(() => new PDFRenderer());

  // Load project if project ID is in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('project');

    if (projectId && !pdfBytes) {
      getProject(projectId).then((project) => {
        if (project && project.fileData) {
          setPdfBytes(new Uint8Array(project.fileData));
        }
      });
    }

    return () => {
      resetBulk();
      // We purposefully DO NOT reset the editor store here so navigating between editor and bulk edit keeps the PDF loaded
    };
  }, [location.search, setPdfBytes, resetBulk, pdfBytes]);

  // Extract text fields when a PDF is loaded
  useEffect(() => {
    async function extractFields() {
      if (!pdfBytes) return;

      try {
        const pageCount = await renderer.loadDocument(pdfBytes);
        const newMappings: FieldMapping[] = [];

        // We'll scan the first 3 pages or all pages for text items to act as fields
        const limit = Math.min(pageCount, 3);
        const offscreen = document.createElement('canvas');

        for (let i = 1; i <= limit; i++) {
          const pageInfo = await renderer.renderPage(i, offscreen, 1.0);

          // Filter text items that have content
          pageInfo.textItems.forEach(item => {
            if (item.text.trim().length > 0 && item.text.trim().length < 100) {
              newMappings.push({
                pdfFieldId: item.id,
                originalItem: item,
                csvHeader: null,
                defaultValue: '',
                pageNumber: i,
              });
            }
          });
        }

        setMappings(newMappings);
      } catch (err) {
        console.error('Failed to extract PDF fields', err);
        addToast('Failed to analyze PDF', 'error');
      }
    }

    extractFields();
  }, [pdfBytes, renderer, setMappings, addToast]);

  const handlePdfUpload = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setPdfFile(file);
      const buffer = await file.arrayBuffer();
      setPdfBytes(new Uint8Array(buffer));
    }
  };

  const handleDataUpload = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      try {
        const result = await parseFile(file);
        setDataFile(file, result.headers, result.rows);
        addToast(`Loaded ${result.totalRows} rows`, 'success');
      } catch (err: any) {
        addToast(`Failed to parse file: ${err.message}`, 'error');
      }
    }
  };

  const handleGenerate = async () => {
    if (!pdfBytes || dataRows.length === 0) return;

    setGenerating(true, 0);

    try {
      const blob = await generateBulkPdfs({
        pdfBytes,
        dataRows,
        mappings,
        filenamePattern,
        onProgress: (p) => setGenerating(true, p),
      });

      const url = URL.createObjectURL(blob);
      setGeneratedZipUrl(url);
      addToast('Generation complete!', 'success');
    } catch (err: any) {
      addToast(`Generation failed: ${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // State 1: Uploading files
  if (!pdfBytes || !dataFile) {
    return (
      <div className={styles.uploadContainer}>
        <div className={styles.uploadContent}>
          <div className={styles.iconWrap}>
            <Layers size={32} />
          </div>
          <h2 className={styles.title}>Bulk PDF Generation</h2>
          <p className={styles.desc}>
            Upload a template PDF and a data file to generate personalized documents in bulk.
          </p>

          <div className={styles.uploadGrid}>
            <div className={`${styles.uploadBox} ${pdfBytes ? styles.uploadSuccess : ''}`}>
              <h4>1. Template PDF</h4>
              {pdfBytes ? (
                <div className={styles.successState}>
                  <CheckCircle size={24} className={styles.successIcon} />
                  <span>PDF Loaded</span>
                </div>
              ) : (
                <FileDropzone
                  accept=".pdf"
                  onFiles={handlePdfUpload}
                  label="Drop PDF template"
                />
              )}
            </div>

            <div className={`${styles.uploadBox} ${dataFile ? styles.uploadSuccess : ''}`}>
              <h4>2. Data Source</h4>
              {dataFile ? (
                <div className={styles.successState}>
                  <CheckCircle size={24} className={styles.successIcon} />
                  <span>{dataFile.name}</span>
                </div>
              ) : (
                <FileDropzone
                  accept=".csv,.xlsx,.xls"
                  onFiles={handleDataUpload}
                  label="Drop CSV or Excel file"
                />
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Generating
  if (isGenerating) {
    return (
      <div className={styles.generatingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <h2>Generating PDFs...</h2>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span>{progress}%</span>
      </div>
    );
  }

  // State 3: Done
  if (generatedZipUrl) {
    return (
      <div className={styles.doneContainer}>
        <div className={styles.iconWrap} style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}>
          <CheckCircle size={48} />
        </div>
        <h2>Generation Complete!</h2>
        <p>Successfully generated {dataRows.length} PDFs.</p>

        <div className={styles.doneActions}>
          <Button
            variant="primary"
            size="lg"
            icon={<Download size={20} />}
            onClick={() => {
              const a = document.createElement('a');
              a.href = generatedZipUrl;
              a.download = 'bulk_generated_pdfs.zip';
              a.click();
            }}
          >
            Download ZIP
          </Button>
          <Button variant="ghost" onClick={() => {
            setGeneratedZipUrl(null);
            resetBulk();
            resetEditor();
          }}>
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // State 4: Mapping
  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>Back</Button>
          <h2>Map Fields</h2>
        </div>

        <div className={styles.headerCenter}>
          <div className={styles.filenameInput}>
            <span className={styles.filenameLabel}>Output Name:</span>
            <input
              type="text"
              value={filenamePattern}
              onChange={e => setFilenamePattern(e.target.value)}
              placeholder="Document_{{index}}.pdf"
              title="Use {{index}} or {{ColumnName}}"
            />
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.statsBadge}>{dataRows.length} rows</span>
          <Button variant="primary" onClick={handleGenerate} icon={<Layers size={18} />}>
            Generate PDFs
          </Button>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.visualMapperSection}>
          <VisualFieldMapper />
        </div>

        {/* <div className={styles.previewSection}>
          <DataPreview />
        </div> */}
      </div>
    </div>
  );
}
