import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { convertTexturePathToBlobUrl } from '../utils/textureUtils';
import './GenericSpriteSheetViewer.css';

const GenericSpriteSheetViewer = ({ 
  title,
  texture,
  sprites,
  isOpenInitially = false,
  position,
  textureOptions = [],
  selectedTexture,
  onTextureChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!isOpenInitially);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [processedTexture, setProcessedTexture] = useState(texture);
  const [hoveredSprite, setHoveredSprite] = useState(null);
  const imageRef = useRef(null);
  const draggableRef = useRef(null);

  useEffect(() => {
    const processTexture = async () => {
      if (texture) {
        const processed = await convertTexturePathToBlobUrl(texture);
        setProcessedTexture(processed);
      }
    };
    processTexture();
  }, [texture]);

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  const handleImageError = (e) => {
    console.error(`${title} sprite image failed to load:`, e.target.src);
  };

  return (
    <Draggable nodeRef={draggableRef} defaultPosition={position} handle=".panel-header">
      <div 
        ref={draggableRef}
        className="sprite-sheet-viewer"
      >
        <div className="panel-header">
          <span>{title}</span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="panel-toggle-button"
          >
            {isCollapsed ? '+' : '-'}
          </button>
        </div>
        {!isCollapsed && (
          <div className="panel-content">
            {textureOptions.length > 1 && (
              <div style={{ marginBottom: '8px' }}>
                <select 
                  onChange={onTextureChange} 
                  value={selectedTexture} 
                  className="head-panel-select"
                >
                  {textureOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {!processedTexture && <div style={{ padding: '10px', textAlign: 'center' }}>No texture available</div>}
            {processedTexture && (
              <div
                className="sprite-sheet-container"
              >
                <img
                  ref={imageRef}
                  src={processedTexture}
                  alt={`${title} Sprite Sheet`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className="sprite-sheet-image"
                  draggable={false}
                />
                {imageSize.width > 0 && imageSize.height > 0 && sprites.map((sprite, index) => (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredSprite(sprite)}
                    onMouseLeave={() => setHoveredSprite(null)}
                    className={`sprite-overlay ${hoveredSprite && hoveredSprite.name === sprite.name ? 'hovered' : ''}`}
                    style={{
                      left: sprite.rect.x,
                      top: sprite.rect.y,
                      width: sprite.rect.width,
                      height: sprite.rect.height,
                    }}
                  >
                    {hoveredSprite && hoveredSprite.name === sprite.name && (
                      <div className="sprite-tooltip">
                        {sprite.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default GenericSpriteSheetViewer;