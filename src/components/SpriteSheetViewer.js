import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import xml2js from 'xml2js';
import { convertTexturePath } from '../utils/textureUtils';

const SpriteSheetViewer = ({ gender }) => {
  const [spriteSheet, setSpriteSheet] = useState(null);
  const [limbs, setLimbs] = useState([]);
  const [hoveredLimb, setHoveredLimb] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchRagdollData = async () => {
      try {
        const response = await fetch('/assets/Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml');
        const xmlText = await response.text();
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        const result = await parser.parseStringPromise(xmlText);
        const limbData = result.Ragdoll.limb.map(limb => {
            // Handle both uppercase and lowercase attribute names
            const sourceRectStr = limb.sprite.SourceRect || limb.sprite.sourcerect;
            
            if (!sourceRectStr) {
              console.warn(`Missing SourceRect for limb ${limb.Name}`);
              return null; // Skip this limb if no source rect
            }
            
            const sourceRect = sourceRectStr.split(',').map(Number);
            return {
                name: limb.Name || limb.name,
                rect: {
                    x: sourceRect[0],
                    y: sourceRect[1],
                    width: sourceRect[2],
                    height: sourceRect[3],
                }
            };
        }).filter(limb => limb !== null); // Remove null entries
        setLimbs(limbData);
      } catch (error) {
        console.error('Error parsing XML:', error);
      }
    };

    fetchRagdollData();
  }, []);

  useEffect(() => {
    // Get the main texture path from the ragdoll XML
    const fetchRagdollTexture = async () => {
      try {
        const response = await fetch('/assets/Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml');
        const xmlText = await response.text();
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        const result = await parser.parseStringPromise(xmlText);
        const mainTexture = result.Ragdoll.Texture;
        setSpriteSheet(convertTexturePath(mainTexture, gender));
      } catch (error) {
        console.error('Error fetching ragdoll texture:', error);
        // Fallback to default path
        setSpriteSheet(convertTexturePath('Content/Characters/Human/Human_[GENDER].png', gender));
      }
    };
    
    fetchRagdollTexture();
  }, [gender]);

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  return (
    <Draggable>
      <div style={{ position: 'absolute', top: '600px', left: '300px', zIndex: 1000, border: '1px solid grey' }}>
        <div style={{ padding: '5px', cursor: 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Body Sprites</span>
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
          <div style={{ position: 'relative', cursor: 'move', width: imageSize.width, height: imageSize.height }}>
              {spriteSheet && <img ref={imageRef} src={spriteSheet} alt="Sprite Sheet" onLoad={handleImageLoad} />}
              {limbs.map((limb, index) => (
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
    </Draggable>
  );
};

export default SpriteSheetViewer;