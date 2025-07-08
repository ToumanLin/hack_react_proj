import React, { useState, useEffect } from 'react';
import { convertTexturePathToBlobUrl } from '../utils/textureUtils';
import useCharacterStore from '../store/characterStore';
import Panel from './Panel';
import './ClothSheetViewer.css';

const ClothSheetViewer = () => {
  const {
    clothingSprites,
    limbs,
  } = useCharacterStore();

  const [textureGroups, setTextureGroups] = useState([]);
  const [hoveredSprite, setHoveredSprite] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  const [processedSelectedTexture, setProcessedSelectedTexture] = useState(null);

  // Process selected texture for Electron production environment
  useEffect(() => {
    const processTexture = async () => {
      if (selectedTexture) {
        const processed = await convertTexturePathToBlobUrl(selectedTexture);
        setProcessedSelectedTexture(processed);
      }
    };
    processTexture();
  }, [selectedTexture]);


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
    <Panel title="Clothing Sprites" isOpenInitially={false} position={{ x: 600, y: 100 }} collapsedWidth="600px">
      <div className="cloth-sheet-viewer-container">
        {/* Texture selector */}
        {textureGroups.length > 1 && (
          <div className="texture-selector">
            <select
              value={selectedTexture || ''}
              onChange={(e) => setSelectedTexture(e.target.value)}
              className="texture-select"
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
          <div className="sprite-sheet-container">
            <img 
              src={processedSelectedTexture || selectedGroup.texturePath} 
              alt="Clothing Sprite Sheet" 
              className="sprite-sheet-image"
            />
            {/* Sourcerect overlays */}
            {selectedGroup.sprites.map((sprite, index) => (
              sprite.rect && (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredSprite(sprite)}
                  onMouseLeave={() => setHoveredSprite(null)}
                  className={`sprite-overlay ${hoveredSprite === sprite ? 'hovered' : ''}`}
                  style={{
                    left: sprite.rect.x,
                    top: sprite.rect.y,
                    width: sprite.rect.width,
                    height: sprite.rect.height,
                  }}
                >
                  {hoveredSprite === sprite && (
                    <div className="sprite-tooltip">
                      <div className="name">{sprite.name}</div>
                      <div className="limb">Limb: {sprite.limb}</div>
                      <div className="rect">
                        Rect: [{sprite.rect.x}, {sprite.rect.y}, {sprite.rect.width}, {sprite.rect.height}]
                      </div>
                      {sprite.inheritSourceRect && (
                        <div className="inherited">(Inherited from limb)</div>
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
          <div className="no-clothing-message">
            No clothing sprites loaded
          </div>
        )}
      </div>
    </Panel>
  );
};

export default ClothSheetViewer;