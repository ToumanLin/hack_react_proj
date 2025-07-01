import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import xml2js from 'xml2js';

const SpriteSheetViewer = ({ gender }) => {
  const [spriteSheet, setSpriteSheet] = useState(null);
  const [limbs, setLimbs] = useState([]);
  const [hoveredLimb, setHoveredLimb] = useState(null);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const fetchRagdollData = async () => {
      try {
        const response = await fetch('/assets/HumanDefaultRagdoll.xml');
        const xmlText = await response.text();
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        const result = await parser.parseStringPromise(xmlText);
        const limbData = result.Ragdoll.limb.map(limb => {
            const sourceRect = limb.sprite.SourceRect.split(',').map(Number);
            return {
                name: limb.Name,
                rect: {
                    x: sourceRect[0],
                    y: sourceRect[1],
                    width: sourceRect[2],
                    height: sourceRect[3],
                }
            };
        });
        setLimbs(limbData);
      } catch (error) {
        console.error('Error parsing XML:', error);
      }
    };

    fetchRagdollData();
  }, []);

  useEffect(() => {
    setSpriteSheet(`/assets/Human_${gender}.png`);
  }, [gender]);

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  return (
    <Draggable>
      <div style={{ position: 'absolute', top: '600px', left: '300px', zIndex: 1000, border: '1px solid grey' }}>{/* Make it transparent */}
        <div style={{ position: 'relative', cursor: 'move', width: imageSize.width, height: imageSize.height }}>
            {spriteSheet && <img ref={imageRef} src={spriteSheet} alt="Sprite Sheet" onLoad={handleImageLoad} />}
            {imageRef.current && limbs.map((limb, index) => (
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
      </div>
    </Draggable>
  );
};

export default SpriteSheetViewer;