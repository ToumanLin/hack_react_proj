import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';

const ClothSheetViewer = ({ clothingSprites, gender, limbs }) => {
  const [textureGroups, setTextureGroups] = useState([]);
  const [hoveredSprite, setHoveredSprite] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedTexture, setSelectedTexture] = useState(null);
  const draggableRef = useRef(null);


  // Group sprites by texture file and calculate sourcerect positions
  useEffect(() => {
    if (!clothingSprites || clothingSprites.length === 0) {
      setTextureGroups([]);
      setSelectedTexture(null);
      return;
    }

    const groups = {};
    clothingSprites.forEach(sprite => {
      const texturePath = sprite.texturePath;
      if (!groups[texturePath]) {
        groups[texturePath] = {
          texturePath,
          fileName: texturePath.split('/').pop(),
          sprites: []
        };
      }
      
      // Calculate sourcerect position
      let rect = null;
      if (sprite.sourceRect && sprite.sourceRect.length === 4) {
        // Use direct sourceRect if available
        rect = {
          x: sprite.sourceRect[0],
          y: sprite.sourceRect[1],
          width: sprite.sourceRect[2],
          height: sprite.sourceRect[3],
        };
      } else if (sprite.inheritSourceRect && sprite.limb && limbs) {
        // If inheriting from limb, find the corresponding limb and use its sourcerect
        const targetLimb = limbs.find(l => l.type === sprite.limb || l.name === sprite.limb);
        if (targetLimb && targetLimb.sourceRect) {
          rect = {
            x: targetLimb.sourceRect[0],
            y: targetLimb.sourceRect[1],
            width: targetLimb.sourceRect[2],
            height: targetLimb.sourceRect[3],
          };
        } else {
          // Fallback to default sizes if limb not found
          const defaultSizes = {
            'head': { width: 160, height: 228 },
            'torso': { width: 64, height: 64 },
            'legs': { width: 32, height: 64 },
            'arms': { width: 32, height: 32 },
            'hands': { width: 16, height: 16 },
            'feet': { width: 16, height: 16 },
          };
          const defaultSize = defaultSizes[sprite.limb] || { width: 32, height: 32 };
          rect = {
            x: 0,
            y: 0,
            width: defaultSize.width,
            height: defaultSize.height,
          };
        }
      }
      
      groups[texturePath].sprites.push({
        ...sprite,
        rect: rect
      });
    });

    const groupsArray = Object.values(groups);
    setTextureGroups(groupsArray);
    
    // Always select the first texture when clothing changes
    if (groupsArray.length > 0) {
      setSelectedTexture(groupsArray[0].texturePath);
    }
  }, [clothingSprites, limbs]);



  const selectedGroup = textureGroups.find(group => group.texturePath === selectedTexture);

  return (
    <Draggable nodeRef={draggableRef}>
      <div 
        ref={draggableRef}
        style={{
          position: 'absolute',
          top: '100px', 
          left: '800px', 
          zIndex: 2000,
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderRadius: '5px',
          width: '200px',
          minWidth: '600px',
          color: 'white',
          padding: '8px',
          fontSize: '8px',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '8px',
          cursor: 'default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #555',
          backgroundColor: '#3a3a3a',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          <span>Clothing Sprites</span>
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
          <div style={{ padding: '8px 0 0 0' }}>
            {/* Texture selector */}
            {textureGroups.length > 1 && (
              <div style={{ marginBottom: '8px' }}>
                <select
                  value={selectedTexture || ''}
                  onChange={(e) => setSelectedTexture(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px',
                    fontSize: '10px',
                    backgroundColor: '#3a3a3a',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    color: 'white'
                  }}
                >
                  {textureGroups.map(group => (
                    <option key={group.texturePath} value={group.texturePath}>
                      {group.fileName} ({group.sprites.length} sprites)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sprite sheet viewer with sourcerect highlighting */}
            {selectedGroup && (
              <div style={{ 
                position: 'relative', 
                cursor: 'move',
                border: '1px solid #555',
                backgroundColor: '#808080',
                overflow: 'auto',
                maxWidth: '600px',
                maxHeight: '600px'
              }}>
                <img 
                  src={selectedGroup.texturePath} 
                  alt="Clothing Sprite Sheet" 
                  style={{ display: 'block' }}
                />
                {/* Sourcerect overlays */}
                {selectedGroup.sprites.map((sprite, index) => (
                  sprite.rect && (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredSprite(sprite)}
                      onMouseLeave={() => setHoveredSprite(null)}
                      style={{
                        position: 'absolute',
                        border: `1px solid ${hoveredSprite === sprite ? '#ffff00' : '#ff0000'}`,
                        left: sprite.rect.x,
                        top: sprite.rect.y,
                        width: sprite.rect.width,
                        height: sprite.rect.height,
                        pointerEvents: 'auto',
                      }}
                    >
                      {hoveredSprite === sprite && (
                        <div style={{
                          position: 'absolute',
                          top: '-25px',
                          left: '0px',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                          fontSize: '11px',
                          zIndex: 1000,
                        }}>
                          <div style={{ fontWeight: 'bold' }}>{sprite.name}</div>
                          <div style={{ fontSize: '9px', color: '#ccc' }}>Limb: {sprite.limb}</div>
                          <div style={{ fontSize: '9px', color: '#aaa' }}>
                            Rect: [{sprite.rect.x}, {sprite.rect.y}, {sprite.rect.width}, {sprite.rect.height}]
                          </div>
                          {sprite.inheritSourceRect && (
                            <div style={{ fontSize: '9px', color: '#888' }}>(Inherited from limb)</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}

            {/* No clothing message */}
            {textureGroups.length === 0 && (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#888',
                fontSize: '11px'
              }}>
                No clothing sprites loaded
              </div>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default ClothSheetViewer; 