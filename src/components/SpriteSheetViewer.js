import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { convertTexturePathToBlobUrl } from '../utils/textureUtils';

const SpriteSheetViewer = ({ gender, limbs, mainTexture }) => {
  const [hoveredLimb, setHoveredLimb] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [processedTexture, setProcessedTexture] = useState(mainTexture);
  const imageRef = useRef(null);
  const draggableRef = useRef(null);

  // Process texture path for Electron production environment
  useEffect(() => {
    const processTexture = async () => {
      if (mainTexture) {
        const processed = await convertTexturePathToBlobUrl(mainTexture);
        setProcessedTexture(processed);
      }
    };
    processTexture();
  }, [mainTexture]);

  // Convert limbs data to the format expected by the viewer
  // Filter out Head type limbs as they are not in the body spritesheet
  const viewerLimbs = limbs
    .filter(limb => limb.type !== 'Head') // Exclude Head type limbs
    .map((limb, index) => ({
      id: index, // add unique ID for comparison
      name: limb.name,
      rect: {
        x: limb.sourceRect[0],
        y: limb.sourceRect[1],
        width: limb.sourceRect[2],
        height: limb.sourceRect[3],
      }
    }));

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  const handleImageError = (e) => {
    console.error('Body sprite image failed to load:', e.target.src);
  };

  // Prevent image from resizing with browser window
  // by using the image's natural size and not setting maxWidth/height:auto
  // Also, the overlay rects must use the same coordinate system

  return (
    <Draggable nodeRef={draggableRef}>
      <div 
        ref={draggableRef}
        style={{
          position: 'absolute',
          top: '50px',
          left: '600px',
          zIndex: 2000,
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderRadius: '5px',
          width: '600px',
          maxWidth: '600px',
          maxHeight: '300px',
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
          <span>Body Sprites</span>
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
            {!processedTexture && <div style={{ padding: '10px', textAlign: 'center' }}>No texture available</div>}
            {processedTexture && (
              <div
                style={{
                  position: 'relative',
                  cursor: 'move',
                  height: '265px',
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
                  alt="Sprite Sheet"
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
                {imageSize.width > 0 && imageSize.height > 0 && viewerLimbs.map((limb, index) => (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredLimb(limb)}
                    onMouseLeave={() => setHoveredLimb(null)}
                    style={{
                      position: 'absolute',
                      border: `1px solid ${hoveredLimb && hoveredLimb.id === limb.id ? 'yellow' : 'red'}`,
                      left: limb.rect.x,
                      top: limb.rect.y,
                      width: limb.rect.width,
                      height: limb.rect.height,
                      zIndex: 2000,
                      pointerEvents: 'auto',
                    }}
                  >
                    {hoveredLimb && hoveredLimb.id === limb.id && (
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
                        {limb.name}
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

export default SpriteSheetViewer;