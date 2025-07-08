import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import './SpriteEditorPanel.css';

const SpriteEditorPanel = ({ sprite, limbs, onSave, onClose, position }) => {
  // const [initialState, setInitialState] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (sprite) {
      const targetLimb = limbs.find(l => l.type === sprite.limb || l.name === sprite.limb);

      const effectiveSourceRect = sprite.inheritSourceRect && targetLimb 
        ? targetLimb.sourceRect 
        : sprite.sourceRect;

      const effectiveOrigin = sprite.inheritOrigin && targetLimb
        ? [targetLimb.origin.x, targetLimb.origin.y]
        : sprite.origin;

      const state = {
        sourceRect: effectiveSourceRect ? effectiveSourceRect.join(', ') : '',
        origin: effectiveOrigin ? effectiveOrigin.join(', ') : '',
        scale: sprite.scale || '1.0',
        inheritSourceRect: sprite.inheritSourceRect,
        inheritOrigin: sprite.inheritOrigin,
      };
      
      // setInitialState(state);
      setFormData(state);
    }
  }, [sprite, limbs]);

  if (!formData) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'sourceRect' && { inheritSourceRect: false }),
      ...(name === 'origin' && { inheritOrigin: false }),
    }));
  };

  const handleInheritClick = (field) => {
    const targetLimb = limbs.find(l => l.type === sprite.limb || l.name === sprite.limb);
    if (!targetLimb) return;

    if (field === 'sourceRect') {
      setFormData(prev => ({
        ...prev,
        sourceRect: targetLimb.sourceRect.join(', '),
        inheritSourceRect: true,
      }));
    } else if (field === 'origin') {
      setFormData(prev => ({
        ...prev,
        origin: [targetLimb.origin.x, targetLimb.origin.y].join(', '),
        inheritOrigin: true,
      }));
    }
  };

  const handleSave = () => {
    const updatedAttributes = {
      sourceRect: formData.sourceRect.split(',').map(s => parseFloat(s.trim())),
      origin: formData.origin.split(',').map(s => parseFloat(s.trim())),
      scale: parseFloat(formData.scale),
      inheritSourceRect: formData.inheritSourceRect,
      inheritOrigin: formData.inheritOrigin,
    };
    onSave(updatedAttributes);
  };

  const handleReset = () => {
    const targetLimb = limbs.find(l => l.type === sprite.limb || l.name === sprite.limb);
    const effectiveSourceRect = sprite.original.inheritSourceRect && targetLimb ? targetLimb.sourceRect : sprite.original.sourceRect;
    const effectiveOrigin = sprite.original.inheritOrigin && targetLimb ? [targetLimb.origin.x, targetLimb.origin.y] : sprite.original.origin;
    setFormData({
      sourceRect: effectiveSourceRect ? effectiveSourceRect.join(', ') : '',
      origin: effectiveOrigin ? effectiveOrigin.join(', ') : '',
      scale: sprite.original.scale || '1.0',
      inheritSourceRect: sprite.original.inheritSourceRect,
      inheritOrigin: sprite.original.inheritOrigin,
    });
  };

  return (
    <Draggable handle=".sprite-editor-header" defaultPosition={position}>
      <div className="sprite-editor-panel">
        <div className="sprite-editor-header">
          Edit Sprite: {sprite.name}
          <button onClick={onClose} className="close-button">X</button>
        </div>
        <div className="sprite-editor-content">
          <div className="form-group">
            <label>Source Rect</label>
            <div className="input-with-button">
              <input
                type="text"
                name="sourceRect"
                value={formData.sourceRect}
                onChange={handleInputChange}
                placeholder="x, y, width, height"
              />
              <button onClick={() => handleInheritClick('sourceRect')} className="inherit-button">Inherit</button>
            </div>
          </div>
          <div className="form-group">
            <label>Origin</label>
            <div className="input-with-button">
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
                placeholder="x, y"
              />
              <button onClick={() => handleInheritClick('origin')} className="inherit-button">Inherit</button>
            </div>
          </div>
          <div className="form-group">
            <label>Calculated Scale</label>
            <input
              type="text"
              name="scale"
              value={formData.scale}
              onChange={handleInputChange}
              placeholder="e.g., 1.0"
            />
          </div>
        </div>
        <div className="sprite-editor-footer">
          <button onClick={handleSave} className="action-button save">Save</button>
          <button onClick={handleReset} className="action-button reset">Reset</button>
        </div>
      </div>
    </Draggable>
  );
};

export default SpriteEditorPanel;
