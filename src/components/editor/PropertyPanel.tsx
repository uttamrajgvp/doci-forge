import { useEffect, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { FontSelector } from './FontSelector';
import styles from './PropertyPanel.module.css';
import * as fabric from 'fabric';

export function PropertyPanel() {
  const { fabricCanvas, selectedObjectIds } = useEditorStore();
  const [activeObj, setActiveObj] = useState<fabric.Object | null>(null);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!fabricCanvas) {
      setActiveObj(null);
      return;
    }

    const updateActiveObj = () => {
      setActiveObj(fabricCanvas.getActiveObject() || null);
    };

    fabricCanvas.on('selection:created', updateActiveObj);
    fabricCanvas.on('selection:updated', updateActiveObj);
    fabricCanvas.on('selection:cleared', updateActiveObj);
    fabricCanvas.on('object:modified', updateActiveObj);

    updateActiveObj();

    return () => {
      fabricCanvas.off('selection:created', updateActiveObj);
      fabricCanvas.off('selection:updated', updateActiveObj);
      fabricCanvas.off('selection:cleared', updateActiveObj);
      fabricCanvas.off('object:modified', updateActiveObj);
    };
  }, [fabricCanvas, selectedObjectIds]);

  if (!activeObj) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <p>No object selected</p>
          <span>Select text or image to edit properties</span>
        </div>
      </div>
    );
  }

  const isText = activeObj instanceof fabric.Textbox || (activeObj as any).type === 'textbox' || (activeObj as any).type === 'i-text';
  const fontFamily = activeObj.get('fontFamily') || 'Open Sans';
  const fontSize = activeObj.get('fontSize') || 16;
  const fill = (activeObj.get('fill') as string) || '#000000';
  const textAlign = activeObj.get('textAlign') || 'left';
  const left = Math.round(activeObj.get('left') || 0);
  const top = Math.round(activeObj.get('top') || 0);

  const updateProp = (key: string, value: any) => {
    if (!activeObj || !fabricCanvas) return;
    activeObj.set(key as any, value);
    if (key === 'left' || key === 'top') {
      activeObj.setCoords();
    }
    fabricCanvas.requestRenderAll();
    forceUpdate({});
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Properties</h3>
      </div>
      
      {isText && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Text</h4>
          
          <div className={styles.field}>
            <label>Font Family</label>
            <FontSelector value={fontFamily} onChange={(font) => updateProp('fontFamily', font)} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Size</label>
              <input 
                type="number" 
                className={styles.input} 
                value={fontSize} 
                onChange={(e) => updateProp('fontSize', parseInt(e.target.value) || 12)}
              />
            </div>
            <div className={styles.field}>
              <label>Color</label>
              <ColorPicker color={fill} onChange={(color) => updateProp('fill', color)} />
            </div>
          </div>
          
          <div className={styles.field}>
            <label>Alignment</label>
            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.iconBtn} ${textAlign === 'left' ? styles.active : ''}`} 
                onClick={() => updateProp('textAlign', 'left')}
                title="Align Left"
              >
                <AlignLeft size={16} />
              </button>
              <button 
                className={`${styles.iconBtn} ${textAlign === 'center' ? styles.active : ''}`} 
                onClick={() => updateProp('textAlign', 'center')}
                title="Align Center"
              >
                <AlignCenter size={16} />
              </button>
              <button 
                className={`${styles.iconBtn} ${textAlign === 'right' ? styles.active : ''}`} 
                onClick={() => updateProp('textAlign', 'right')}
                title="Align Right"
              >
                <AlignRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Transform</h4>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>X Position</label>
            <input 
              type="number" 
              className={styles.input} 
              value={left} 
              onChange={(e) => updateProp('left', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={styles.field}>
            <label>Y Position</label>
            <input 
              type="number" 
              className={styles.input} 
              value={top} 
              onChange={(e) => updateProp('top', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

