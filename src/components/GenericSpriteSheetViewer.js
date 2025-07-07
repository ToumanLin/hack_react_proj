import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { convertTexturePathToBlobUrl } from '../utils/textureUtils';

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
    <Draggable nodeRef={draggableRef} defaultPosition={position}>
      <div 
        ref={draggableRef}
        style={{
          position: 'absolute',
          zIndex: 2000,
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderRadius: '5px',
          width: '600px',
          maxWidth: '600px',
          maxHeight: '400px',
          color: 'white',
          padding: '8px',
          fontSize: '8px',
        }}
      >
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
          <span>{title}</span>
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
            {textureOptions.length > 1 && (
              <div style={{ marginBottom: '8px' }}>
                <select 
                  onChange={onTextureChange} 
                  value={selectedTexture} 
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
                  {textureOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {!processedTexture && <div style={{ padding: '10px', textAlign: 'center' }}>No texture available</div>}
            {processedTexture && (
              <div
                style={{
                  position: 'relative',
                  cursor: 'move',
                  maxHeight: '300px',
                  overflow: 'auto',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  backgroundColor: '#808080'
                }}
              >
                <img
                  ref={imageRef}
                  src={processedTexture}
                  alt={`${title} Sprite Sheet`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{
                    display: 'block',
                    width: imageSize.width ? imageSize.width : 'auto',
                    height: imageSize.height ? imageSize.height : 'auto',
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  draggable={false}
                />
                {imageSize.width > 0 && imageSize.height > 0 && sprites.map((sprite, index) => (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredSprite(sprite)}
                    onMouseLeave={() => setHoveredSprite(null)}
                    style={{
                      position: 'absolute',
                      border: `1px solid ${hoveredSprite && hoveredSprite.name === sprite.name ? 'yellow' : 'red'}`,
                      left: sprite.rect.x,
                      top: sprite.rect.y,
                      width: sprite.rect.width,
                      height: sprite.rect.height,
                      zIndex: 2000,
                      pointerEvents: 'auto',
                    }}
                  >
                    {hoveredSprite && hoveredSprite.name === sprite.name && (
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '0px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        fontSize: '11px',
                        zIndex: 2000,
                      }}>
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
