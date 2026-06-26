import { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { FileDropzone } from '../ui/FileDropzone';
import * as fabric from 'fabric';
import styles from './ImageInserter.module.css';

interface ImageInserterProps {
  onClose: () => void;
  canvas: fabric.Canvas | null;
}

export function ImageInserter({ onClose, canvas }: ImageInserterProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInsert = () => {
    if (!preview || !canvas) return;

    fabric.Image.fromURL(preview).then((img) => {
      // Scale down if too large
      const maxWidth = canvas.width! * 0.5;
      const maxHeight = canvas.height! * 0.5;

      if (img.width! > maxWidth || img.height! > maxHeight) {
        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
        img.scale(scale);
      }

      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        cornerStyle: 'circle',
        transparentCorners: false,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      onClose();
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <ImageIcon size={18} />
          <h3>Insert Image</h3>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.body}>
        {!preview ? (
          <FileDropzone
            accept=".png,.jpg,.jpeg,.svg"
            onFiles={handleFiles}
            label="Drop image here or click to browse"
            hint="Supports PNG, JPG, SVG"
          />
        ) : (
          <div className={styles.previewContainer}>
            <img src={preview} alt="Preview" className={styles.previewImage} />
            <button 
              className={styles.removeBtn}
              onClick={() => setPreview(null)}
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button 
          variant="primary" 
          disabled={!preview} 
          onClick={handleInsert}
        >
          Insert to Document
        </Button>
      </div>
    </div>
  );
}
