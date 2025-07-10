import React, { useState, useEffect } from 'react';
import { convertTexturePathToBlobUrl } from '../utils/textureUtils';
import useCharacterStore from '../store/characterStore';
import Panel from './Panel';
import SpriteEditorPanel from './SpriteEditorPanel'; // Import the new editor panel
import './ClothSheetViewer.css';

const ClothSheetViewer = () => {
  const {
    clothingSprites,
    limbs,
    updateClothingSprite, // Get the update action from the store
  } = useCharacterStore();

  const [textureGroups, setTextureGroups] = useState([]);
  const [hoveredSprite, setHoveredSprite] = useState(null);
  const [selectedTexture, setSelectedTexture] = useState(null);
  const [processedSelectedTexture, setProcessedSelectedTexture] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSprite, setEditingSprite] = useState(null);
  const [zoom, setZoom] = useState(1);
  const imageRef = React.useRef(null);

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
      
      let rect = null;
      let displayOrigin = sprite.origin;

      if (sprite.inheritOrigin && sprite.limb && limbs) {
        const targetLimb = limbs.find(l => l.type === sprite.limb || l.name === sprite.limb);
        if (targetLimb) {
          displayOrigin = [targetLimb.origin.x, targetLimb.origin.y];
        }
      }

      if (sprite.sourceRect && sprite.sourceRect.length === 4) {
        rect = {
          x: sprite.sourceRect[0],
          y: sprite.sourceRect[1],
          width: sprite.sourceRect[2],
          height: sprite.sourceRect[3],
        };
      } else if (sprite.inheritSourceRect && sprite.limb && limbs) {
        const targetLimb = limbs.find(l => l.type === sprite.limb || l.name === sprite.limb);
        if (targetLimb && targetLimb.sourceRect) {
          rect = {
            x: targetLimb.sourceRect[0],
            y: targetLimb.sourceRect[1],
            width: targetLimb.sourceRect[2],
            height: targetLimb.sourceRect[3],
          };
        }
      }
      
      groups[texturePath].sprites.push({
        ...sprite,
        rect: rect,
        displayOrigin: displayOrigin
      });
    });

    const groupsArray = Object.values(groups);
    setTextureGroups(groupsArray);
    
    if (groupsArray.length > 0) {
      setSelectedTexture(groupsArray[0].texturePath);
    }
  }, [clothingSprites, limbs]);

  const handleSpriteClick = (sprite) => {
    if (isEditMode) {
      setEditingSprite(sprite);
    }
  };

  const handleSaveSprite = (updatedAttributes) => {
    if (editingSprite) {
      updateClothingSprite(editingSprite.name, updatedAttributes);
    }
  };

  const selectedGroup = textureGroups.find(group => group.texturePath === selectedTexture);

  return (
    <>
      <Panel 
        title="Clothing Sprites" 
        isOpenInitially={false} 
        position={{ x: 600, y: 100 }} 
        collapsedWidth="600px"
        headerContent={
          <button onClick={() => setIsEditMode(!isEditMode)} className={`header-button ${isEditMode ? 'active' : ''}`}>
            {isEditMode ? 'Edit On' : 'Edit Off'}
          </button>
        }
      >
        <div className="cloth-sheet-controls">
          <label>Zoom: {Math.round(zoom * 100)}%</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
          />
        </div>
        <div className="cloth-sheet-viewer-container">
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

          {selectedGroup && (
            <div className="sprite-sheet-viewport">
              <div 
                className="sprite-sheet-container"
                style={{
                  width: imageRef.current ? imageRef.current.naturalWidth * zoom : 0,
                  height: imageRef.current ? imageRef.current.naturalHeight * zoom : 0,
                }}
              >
                <img 
                  ref={imageRef}
                  src={processedSelectedTexture || selectedGroup.texturePath} 
                  alt="Clothing Sprite Sheet" 
                  className="sprite-sheet-image"
                  onLoad={() => {
                    // Force a re-render to update the container size
                    setZoom(zoom);
                  }}
                  style={{ 
                    transform: `scale(${zoom})`, 
                    transformOrigin: 'top left' 
                  }}
                />
                {selectedGroup.sprites.map((sprite, index) => (
                  sprite.rect && (
                    <div
                      key={index}
                      onClick={() => handleSpriteClick(sprite)}
                      onMouseEnter={() => setHoveredSprite(sprite)}
                      onMouseLeave={() => setHoveredSprite(null)}
                      className={`sprite-overlay ${hoveredSprite === sprite ? 'hovered' : ''}`}
                      style={{
                        left: sprite.rect.x * zoom,
                        top: sprite.rect.y * zoom,
                        width: sprite.rect.width * zoom,
                        height: sprite.rect.height * zoom,
                      }}
                    >
                      {hoveredSprite === sprite && !editingSprite && (
                        <div className="sprite-tooltip">
                          <div className="name">{sprite.name}</div>
                          <div className="limb">Limb: {sprite.limb}</div>
                          <div className="rect" >
                            Rect: [{sprite.rect.x}, {sprite.rect.y}, {sprite.rect.width}, {sprite.rect.height}]
                            {sprite.inheritSourceRect && (
                              <span className="inherited">(inherited)</span>
                            )}
                          </div>
                          {sprite.displayOrigin && (
                            <div className="rect">
                              Origin: [{sprite.displayOrigin[0]}, {sprite.displayOrigin[1]}]
                              {sprite.inheritOrigin && (
                                <span className="inherited">(inherited)</span>
                              )}
                            </div>
                          )}
                          <div className="rect">
                            Calculated Scale: [{sprite.scale}]
                            {/* {sprite.inheritScale && (
                              <span className="inherited">(inherited)</span>
                            )} */}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {textureGroups.length === 0 && (
            <div className="no-clothing-message">
              No clothing sprites loaded
            </div>
          )}
        </div>
      </Panel>
      {editingSprite && (
        <SpriteEditorPanel 
          sprite={editingSprite}
          limbs={limbs}
          onSave={handleSaveSprite}
          onClose={() => setEditingSprite(null)}
          position={{ x: 600, y: 300 }}
        />
      )}
    </>
  );
};

export default ClothSheetViewer;