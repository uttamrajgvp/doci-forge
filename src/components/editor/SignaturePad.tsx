import { useState, useRef, useEffect } from 'react';
import { X, PenTool, Type, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import styles from './SignaturePad.module.css';
import * as fabric from 'fabric';

interface SignaturePadProps {
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

type TabType = 'draw' | 'type' | 'upload';

export function SignaturePad({ onClose, onSave }: SignaturePadProps) {
  const [activeTab, setActiveTab] = useState<TabType>('draw');
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState('Caveat'); // Assuming some cursive fonts are loaded
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (activeTab !== 'draw' || !canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: 400,
      height: 200,
    });

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = '#000000';
      canvas.freeDrawingBrush.width = 3;
    }

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [activeTab]);

  const handleClear = () => {
    fabricCanvasRef.current?.clear();
  };

  const handleInsert = () => {
    if (activeTab === 'draw' && fabricCanvasRef.current) {
      const dataUrl = fabricCanvasRef.current.toDataURL({ format: 'png', multiplier: 1 });
      onSave(dataUrl);
      onClose();
    } else if (activeTab === 'type') {
      // In a real implementation, render text to an offscreen canvas and get dataURL
      // Or just return the text to be added as a text object instead of an image
      console.log('Inserting typed signature:', typedText);
      onClose();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Create Signature</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'draw' ? styles.active : ''}`}
          onClick={() => setActiveTab('draw')}
        >
          <PenTool size={16} /> Draw
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'type' ? styles.active : ''}`}
          onClick={() => setActiveTab('type')}
        >
          <Type size={16} /> Type
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={16} /> Upload
        </button>
      </div>

      <div className={styles.body}>
        {activeTab === 'draw' && (
          <div className={styles.drawArea}>
            <canvas ref={canvasRef} className={styles.canvas} />
            <button className={styles.clearBtn} onClick={handleClear}>Clear</button>
          </div>
        )}

        {activeTab === 'type' && (
          <div className={styles.typeArea}>
            <input 
              type="text" 
              placeholder="Type your name..." 
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className={styles.typeInput}
            />
            <div className={styles.fontOptions}>
              {['Caveat', 'Dancing Script', 'Pacifico'].map(font => (
                <button 
                  key={font}
                  className={`${styles.fontBtn} ${selectedFont === font ? styles.active : ''}`}
                  onClick={() => setSelectedFont(font)}
                  style={{ fontFamily: font }}
                >
                  {typedText || 'Signature'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleInsert}>Create</Button>
      </div>
    </div>
  );
}
