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
  const [zoom, setZoom] = useState(1);
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
            <div className="generic-sheet-controls">
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
            {!processedTexture && <div style={{ padding: '10px', textAlign: 'center' }}>No texture available</div>}
            {processedTexture && (
              <div className="sprite-sheet-viewport">
                <div
                  className="sprite-sheet-container"
                  style={{
                    width: imageSize.width * zoom,
                    height: imageSize.height * zoom,
                  }}
                >
                  <img
                    ref={imageRef}
                    src={processedTexture}
                    alt={`${title} Sprite Sheet`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    className="sprite-sheet-image"
                    draggable={false}
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top left' 
                    }}
                  />
                  {imageSize.width > 0 && imageSize.height > 0 && sprites.map((sprite, index) => (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredSprite(sprite)}
                      onMouseLeave={() => setHoveredSprite(null)}
                      className={`sprite-overlay ${hoveredSprite && hoveredSprite.name === sprite.name ? 'hovered' : ''}`}
                      style={{
                        left: sprite.rect.x * zoom,
                        top: sprite.rect.y * zoom,
                        width: sprite.rect.width * zoom,
                        height: sprite.rect.height * zoom,
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
              </div>
            )}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default GenericSpriteSheetViewer;