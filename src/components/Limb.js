import React, { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import { convertTexturePathToBlobUrl } from '../utils/textureUtils';
import useCharacterStore from '../store/characterStore';
import './Limb.css';

const OVERRIDE_ORDER = {
  'hair': 7,
  'beard': 6,
  'moustache': 5,
  'faceattachment': 4,
  'husk': 3,
  'herpes': 2,
};

const Limb = ({ limb, onUpdate, onSelect, isSelected }) => {
  const {
    clothingSprites,
    limbs: allLimbs,
  } = useCharacterStore();

  const [x, y, width, height] = limb.sourceRect;
  const [processedTexturePath, setProcessedTexturePath] = useState(limb.texture);
  const [processedTextureCache, setProcessedTextureCache] = useState({});
  const nodeRef = useRef(null);

  // Process texture path for Electron production environment
  useEffect(() => {
    const processTexture = async () => {
      if (limb.texture) {
        const processed = await convertTexturePathToBlobUrl(limb.texture);
        setProcessedTexturePath(processed);
      }
    };
    processTexture();
  }, [limb.texture]);

  // Process all texture paths for overlays
  useEffect(() => {
    const processAllTextures = async () => {
      const cache = {};
      
      // Process clothing sprites textures
      for (const sprite of clothingSprites) {
        if (sprite.texturePath && sprite.texturePath.startsWith('assets://') && !cache[sprite.texturePath]) {
          try {
            cache[sprite.texturePath] = await convertTexturePathToBlobUrl(sprite.texturePath);
          } catch (error) {
            console.error('Error processing clothing texture:', error);
            cache[sprite.texturePath] = sprite.texturePath;
          }
        }
      }
      
      // Process attachment textures
      if (limb.name.includes('Head')) {
        Object.keys(limb).filter(key => key.startsWith('selected')).forEach(key => {
          const attachment = limb[key];
          if (attachment && attachment.texture && attachment.texture.startsWith('assets://') && !cache[attachment.texture]) {
            convertTexturePathToBlobUrl(attachment.texture).then(processed => {
              cache[attachment.texture] = processed;
            }).catch(error => {
              console.error('Error processing attachment texture:', error);
              cache[attachment.texture] = attachment.texture;
            });
          }
        });
      }
      
      setProcessedTextureCache(cache);
    };
    
    processAllTextures();
  }, [clothingSprites, limb]);

  // calculate z-index then addjust order
  const baseZIndex = Math.round((1 - limb.depth) * 1000);
  const overrideOrder = OVERRIDE_ORDER[limb.type?.toLowerCase()] || 1;
  const calculatedZIndex = baseZIndex + (overrideOrder * 1);

  // Check if the limb should be hidden
  const shouldHideLimb = clothingSprites.some(
    sprite => sprite.limb === limb.type && sprite.hidelimb === true
  );

  const innerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${processedTexturePath})`,
    backgroundPosition: `-${x}px -${y}px`,
    transform: `rotate(${limb.rotation}deg) scale(${limb.scale})`,
    transformOrigin: `${limb.origin.x * 100}% ${limb.origin.y * 100}%`,
    opacity: shouldHideLimb ? 0 : 1,
  };

  // Unified rendering function, handle attachments and clothing sprites
  const renderOverlay = (overlayItem, type = null) => {
    if (!overlayItem) return null;

    let sourceRect, origin, scale, depth, texturePath, zIndex;
    const isAttachment = type !== null; // Check if it's an attachment or clothing

    if (isAttachment) {
      // Attachment logic
      if (overlayItem.sheetIndex !== null && overlayItem.sheetIndex !== undefined && overlayItem.baseSize) {
        const [attX, attY] = overlayItem.sheetIndex;
        const [attBaseWidth, attBaseHeight] = overlayItem.baseSize;
        sourceRect = [
            attX * attBaseWidth,
            attY * attBaseHeight,
            attBaseWidth,
            attBaseHeight
        ];
        origin = [limb.origin.x, limb.origin.y] || [0.5, 0.5];
      } else if (overlayItem.sourceRect) {
        sourceRect = overlayItem.sourceRect;
        origin = overlayItem.origin || [0.5, 0.5];
      } else {
        sourceRect = [0, 0, 128, 128];
        origin = [0.5, 0.5];
      }
      texturePath = overlayItem.texture;
      scale = limb.scale;
      zIndex = calculatedZIndex + (OVERRIDE_ORDER[type] || 0);
    } else {
      // Clothing logic
      if (overlayItem.inheritSourceRect) {
        sourceRect = limb.sourceRect;
      } else if (overlayItem.sourceRect) {
        sourceRect = overlayItem.sourceRect;
      } else {
        sourceRect = [0, 0, 128, 128];
      }

      if (overlayItem.inheritOrigin) {
        origin = [limb.origin.x, limb.origin.y];
      } else if (overlayItem.origin) {
        origin = overlayItem.origin;
      } else {
        origin = [0.5, 0.5];
      }

      scale = overlayItem.scale;
      
      if (overlayItem.useLegacyScaleLogic) {
        if (overlayItem.inheritTextureScale) {
          scale *= 1.0;
          if (!overlayItem.ignoreRagdollScale) {
            scale *= 0.5;
          }
        }
        if (!overlayItem.ignoreLimbScale) {
          scale *= limb.scale;
        }
      } else {
        if (overlayItem.inheritScale) {
          if (!overlayItem.ignoreLimbScale) {
            scale *= limb.scale;
          }
          if (!overlayItem.ignoreRagdollScale) {
            scale *= 0.5;
          }
        }
      }
      scale = scale * 2.0;

      if (overlayItem.inheritLimbDepth) {
        if (overlayItem.depthLimb) {
          const targetLimb = allLimbs?.find(l => l.type === overlayItem.depthLimb || l.name === overlayItem.depthLimb);
          if (targetLimb) {
            depth = targetLimb.depth - 0.01;
          } else {
            depth = limb.depth - 0.01;
          }
        } else {
          depth = limb.depth - 0.01;
        }
      } else if (overlayItem.depth !== null) {
        depth = overlayItem.depth;
      } else {
        depth = 0.5;
      }

      texturePath = overlayItem.texturePath;
      zIndex = Math.round((1 - depth) * 1000);
    }

    const limbOriginX = limb.origin.x;
    const limbOriginY = limb.origin.y;

    const totalRotation = (limb.rotation || 0) + ( - overlayItem.rotation || 0);
    
    const finalTexturePath = processedTextureCache[texturePath] || texturePath;
    
    const overlayStyle = {
      width: `${sourceRect[2]}px`,
      height: `${sourceRect[3]}px`,
      backgroundImage: `url(${finalTexturePath})`,
      backgroundPosition: `-${sourceRect[0]}px -${sourceRect[1]}px`,
      zIndex: zIndex,
      left: `calc(100% * ${limbOriginX})`,
      top: `calc(100% * ${limbOriginY})`,
      transformOrigin: `${origin[0] * 100}% ${origin[1] * 100}%`,
      transform: `translate(calc(-100% * ${origin[0]}), calc(-100% * ${origin[1]})) scale(${scale}) rotate(${totalRotation}deg)`,
    };

    const key = isAttachment ? overlayItem.id : overlayItem.name;
    return <div key={key} className="limb-overlay" style={overlayStyle} />;
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{
        x: limb.position.x - limb.size.width * limb.origin.x,
        y: limb.position.y - limb.size.height * limb.origin.y,
      }}
      onDrag={(e, data) => {
        onUpdate({
          ...limb,
          position: {
            x: data.x + limb.size.width * limb.origin.x,
            y: data.y + limb.size.height * limb.origin.y,
          },
        })
      }}
      onStart={() => onSelect(limb)}
    >
      <div ref={nodeRef} className="limb-container" style={{ zIndex: calculatedZIndex }} onClick={() => onSelect(limb)}>
        <div className={`limb-inner ${isSelected ? 'selected' : ''}`} style={innerStyle} />
        <div title={`Limb Position: (${limb.position.x.toFixed(0)}, ${limb.position.y.toFixed(0)})`} />
        {limb.name.includes('Head') && (
            <>
                {Object.keys(limb).filter(key => key.startsWith('selected')).map(key => {
                    const type = key.replace('selected', '').toLowerCase();
                    
                    const shouldHideAttachment = clothingSprites.some(clothingSprite => 
                      clothingSprite.limb === limb.type && 
                      clothingSprite.hideOtherWearables === true
                    );
                    
                    const shouldHideByType = clothingSprites.some(clothingSprite => 
                      clothingSprite.limb === limb.type && 
                      clothingSprite.hideWearablesOfType && 
                      clothingSprite.hideWearablesOfType !== '' &&
                      type && 
                      type.toLowerCase().includes(clothingSprite.hideWearablesOfType.toLowerCase())
                    );
                    
                    if (shouldHideAttachment || shouldHideByType) return null;
                    
                    return renderOverlay(limb[key], type);
                })}
            </>
        )}
        {clothingSprites
          .filter(clothingSprite => {
            if (clothingSprite.limb !== limb.type) return false;
            
            const shouldHideThis = clothingSprites.some(otherSprite => 
              otherSprite.limb === limb.type && 
              otherSprite.hideOtherWearables === true &&
              otherSprite !== clothingSprite
            );
            
            if (shouldHideThis) return false;
            
            const shouldHideByType = clothingSprites.some(otherSprite => 
              otherSprite.limb === limb.type && 
              otherSprite.hideWearablesOfType && 
              otherSprite.hideWearablesOfType !== '' &&
              clothingSprite.name && 
              clothingSprite.name.toLowerCase().includes(otherSprite.hideWearablesOfType.toLowerCase())
            );
            
            return !shouldHideByType;
          })
          .map(clothingSprite => renderOverlay(clothingSprite, null))
        }
      </div>
    </Draggable>
  );
};

export default Limb;
