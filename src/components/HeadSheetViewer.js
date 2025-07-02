import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';

const HeadSheetViewer = ({ gender, headAttachments, headSprites }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [textureOptions, setTextureOptions] = useState([]);
  const [selectedTexture, setSelectedTexture] = useState('');
  const [sprites, setSprites] = useState([]);
  const [hoveredSprite, setHoveredSprite] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    const defaultTexture = `/assets/Content/Characters/Human/Human_${gender}_heads.png`;
    if (!selectedTexture) { // Set default only if nothing is selected
      setImageSrc(defaultTexture);
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
          spriteData[attachment.texture].push({
            name: attachment.name,
            rect: {
              x: attachment.sheetIndex[0] * attachment.baseSize[0],
              y: attachment.sheetIndex[1] * attachment.baseSize[1],
              width: attachment.baseSize[0],
              height: attachment.baseSize[1],
            }
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

    const options = Array.from(textures).map(texture => ({
      value: texture,
      label: texture.split('/').pop().replace('.png', '').replace(/_/g, ' '),
    }));

    setTextureOptions(options);
  }, [gender, headAttachments, headSprites, selectedTexture]);

  useEffect(() => {
    setImageSrc(selectedTexture);
  }, [selectedTexture]);

  const handleTextureChange = (e) => {
    setSelectedTexture(e.target.value);
  };

  const currentSprites = sprites[selectedTexture] || [];

  return (
    <Draggable>
      <div style={{ position: 'absolute', top: '600px', left: '820px', zIndex: 1000, border: '1px solid grey' }}>
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
            padding: '4px 10px',
            borderRadius: '3px'
          }}
        >
          {isCollapsed ? '+' : '-'}
          </button>
        </div>
        {!isCollapsed && (
          <div style={{ position: 'relative', cursor: 'move' }}>
            {imageSrc && <img ref={imageRef} src={imageSrc} alt="Sprite Sheet" />}
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
