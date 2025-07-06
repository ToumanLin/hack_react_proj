import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { convertTexturePath } from '../utils/textureUtils';

const HeadSheetViewer = ({ gender, headAttachments, headSprites }) => {
  const [selectedTexture, setSelectedTexture] = useState('');
  const [sprites, setSprites] = useState({});
  const [hoveredSprite, setHoveredSprite] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const imageRef = useRef(null);
  const draggableRef = useRef(null);

  // Process data when props change
  React.useEffect(() => {
    const defaultTexture = convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', gender);
    if (!selectedTexture) {
      setSelectedTexture(defaultTexture);
    }

    const textures = new Set([defaultTexture]);
    const spriteData = {};

    // Process headAttachments
    if (headAttachments) {
      for (const type in headAttachments) {
        headAttachments[type].forEach(attachment => {
          textures.add(attachment.texture);
          if (!spriteData[attachment.texture]) {
            spriteData[attachment.texture] = [];
          }
          
          let rect;
          if (attachment.sourceRect) {
            // Use SourceRect directly
            rect = {
              x: attachment.sourceRect[0],
              y: attachment.sourceRect[1],
              width: attachment.sourceRect[2],
              height: attachment.sourceRect[3],
            };
          } else {
            // Use SheetIndex calculation
            rect = {
              x: attachment.sheetIndex[0] * attachment.baseSize[0],
              y: attachment.sheetIndex[1] * attachment.baseSize[1],
              width: attachment.baseSize[0],
              height: attachment.baseSize[1],
            };
          }
          
          spriteData[attachment.texture].push({
            name: attachment.name,
            rect: rect
          });
        });
      }
    }

    // Process headSprites
    if (headSprites && headSprites.length > 0) {
      headSprites.forEach(sprite => {
        // Ensure the texture path is added to textures set
        textures.add(sprite.texture);
        
        if (!spriteData[sprite.texture]) {
          spriteData[sprite.texture] = [];
        }
        spriteData[sprite.texture].push({
          name: sprite.name,
          rect: {
            x: sprite.sheetIndex[0] * sprite.baseSize[0],
            y: sprite.sheetIndex[1] * sprite.baseSize[1],
            width: sprite.baseSize[0],
            height: sprite.baseSize[1],
          }
        });
      });
    }

    setSprites(spriteData);
  }, [gender, headAttachments, headSprites, selectedTexture]);

  const handleTextureChange = (e) => {
    setSelectedTexture(e.target.value);
  };

  const currentSprites = sprites[selectedTexture] || [];
  const textureOptions = Object.keys(sprites).map(texture => ({
    value: texture,
    label: texture.split('/').pop().replace('.png', '').replace(/_/g, ' '),
  }));

  return (
    <Draggable nodeRef={draggableRef}>
      <div style={{ 
        position: 'absolute', 
        top: '0px', 
        left: '800px', 
        zIndex: 2000, 
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '5px',
        minWidth: '200px',
        color: 'white',
        padding: '8px',
        fontSize: '8px',
      }} ref={draggableRef}>
        <div style={{ padding: '5px', cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' }}>Head Sprites</span>
          <select onChange={handleTextureChange} value={selectedTexture} style={{ flex: 1, marginRight: '5px' }}>
            {textureOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 8px',
              borderRadius: '3px',
              fontSize: '10px',
            }}
          >
            {isCollapsed ? '+' : '-'}
          </button>
        </div>
        {!isCollapsed && (
          <div style={{ position: 'relative', cursor: 'move' }}>
            {selectedTexture && <img ref={imageRef} src={selectedTexture} alt="Sprite Sheet" />}
            {currentSprites.map((sprite, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredSprite(sprite)}
                onMouseLeave={() => setHoveredSprite(null)}
                style={{
                  position: 'absolute',
                  border: `1px solid ${hoveredSprite === sprite ? 'yellow' : 'red'}`,
                  left: sprite.rect.x,
                  top: sprite.rect.y,
                  width: sprite.rect.width,
                  height: sprite.rect.height,
                }}
              >
                {hoveredSprite === sprite && (
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '0px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '2px 5px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    fontSize: '12px',
                  }}>
                    {sprite.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default HeadSheetViewer;
