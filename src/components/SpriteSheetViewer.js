import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';

const SpriteSheetViewer = ({ gender, limbs, mainTexture }) => {
  const [hoveredLimb, setHoveredLimb] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);
  const draggableRef = useRef(null);

  // Convert limbs data to the format expected by the viewer
  const viewerLimbs = limbs.map(limb => ({
    name: limb.name,
    rect: {
      x: limb.sourceRect[0],
      y: limb.sourceRect[1],
      width: limb.sourceRect[2],
      height: limb.sourceRect[3],
    }
  }));

  const handleImageLoad = (e) => {
    console.log('Image loaded:', e.target.naturalWidth, 'x', e.target.naturalHeight);
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
  };

  return (
    <Draggable nodeRef={draggableRef}>
      <div style={{ 
        position: 'absolute', 
        top: '50px', 
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
          <span style={{ 
            color: 'white', 
            fontSize: '12px', 
            fontWeight: 'bold'
          }}>Body Sprites</span>
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
          <div>
            {!mainTexture && <div style={{ padding: '10px', textAlign: 'center' }}>No texture available</div>}
            {mainTexture && (
              <div style={{ position: 'relative', cursor: 'move', width: imageSize.width, height: imageSize.height }}>
                <img 
                  ref={imageRef} 
                  src={mainTexture} 
                  alt="Sprite Sheet" 
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                {viewerLimbs.map((limb, index) => (
                <div
                    key={index}
                    onMouseEnter={() => setHoveredLimb(limb)}
                    onMouseLeave={() => setHoveredLimb(null)}
                    style={{
                        position: 'absolute',
                        border: `1px solid ${hoveredLimb === limb ? 'yellow' : 'red'}`,
                        left: limb.rect.x,
                        top: limb.rect.y,
                        width: limb.rect.width,
                        height: limb.rect.height,
                    }}
                >
                    {hoveredLimb === limb && (
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