import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../stores/editorStore';
import { useProjectStore } from '../stores/projectStore';
import { getProject } from '../lib/db';
import { FileDropzone } from '../components/ui/FileDropzone';
import { TextEditorPage } from '../components/editor/TextEditorPage';
import { FileEdit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import styles from './Editor.module.css';

export function Editor() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { pdfBytes, pdfFile, setPdfFile, setPdfBytes, reset } = useEditorStore();
  const { addProject } = useProjectStore();

  // Load project if project ID is in URL
  useEffect(() => {
    const params    = new URLSearchParams(location.search);
    const projectId = params.get('project');

    if (projectId) {
      getProject(projectId).then((project) => {
        if (project && project.fileData) {
          setPdfBytes(new Uint8Array(project.fileData));
        }
      });
    }

    // We no longer reset on unmount to allow navigating to Bulk Edit without losing state
  }, [location.search, setPdfBytes]);

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setPdfFile(file);

      const buffer = await file.arrayBuffer();
      const bytes  = new Uint8Array(buffer);
      setPdfBytes(bytes);

      const newId = crypto.randomUUID();
      const now   = Date.now();
      const project = {
        id:        newId,
        name:      file.name,
        type:      'single' as const,
        fileSize:  file.size,
        createdAt: now,
        updatedAt: now,
      };

      const { saveProject, savePdfFile } = await import('../lib/db');
      await saveProject(project);
      await savePdfFile({
        id:        crypto.randomUUID(),
        projectId: newId,
        name:      file.name,
        data:      buffer,
        createdAt: now,
      });

      addProject(project);
      navigate(`/editor?project=${newId}`, { replace: true });
    }
  };

  // ── Upload screen ──────────────────────────────────────────────────────
  if (!pdfBytes) {
    return (
      <div className={styles.uploadContainer}>
        <div className={styles.uploadContent}>
          <div className={styles.iconWrap}>
            <FileEdit size={32} />
          </div>
          <h2 className={styles.title}>PDF Text Editor</h2>
          <p className={styles.desc}>
            Upload a PDF to start editing. Click any text on the page to modify it.
            Your changes are written directly into the PDF structure — no layout shifts.
          </p>
          <FileDropzone
            accept=".pdf"
            onFiles={handleFiles}
            label="Drop your PDF here to start editing"
            hint="Supports PDF files up to 50 MB"
          />
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Editor ─────────────────────────────────────────────────────────────
  return (
    <TextEditorPage
      pdfBytes={pdfBytes}
      fileName={pdfFile?.name}
    />
  );
}
