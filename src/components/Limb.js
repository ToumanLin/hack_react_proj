import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const OVERRIDE_ORDER = {
  'hair': 7,
  'beard': 6,
  'moustache': 5,
  'faceattachment': 4,
  'husk': 3,
  'herpes': 2,
};

const Limb = ({ limb, onUpdate, onSelect, isSelected, joints, selectedLimb, positionAdjustments = {} }) => {
  const [x, y, width, height] = limb.sourceRect;
  const texturePath = limb.texture; // Use the texture path directly as it's already processed in Editor.js
  const nodeRef = useRef(null);

  // calculate z-index then addjust order
  const baseZIndex = Math.round((1 - limb.depth) * 1000);
  const overrideOrder = OVERRIDE_ORDER[limb.type?.toLowerCase()] || 1;
  const calculatedZIndex = baseZIndex + (overrideOrder * 100);

  const innerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${texturePath})`,
    backgroundPosition: `-${x}px -${y}px`,
    outline: isSelected ? '2px solid red' : 'none',
    cursor: 'move',
    transform: `rotate(${limb.rotation}deg) scale(${limb.scale})`,
    transformOrigin: `${limb.origin.x * 100}% ${limb.origin.y * 100}%`,
  };

  const renderAttachment = (attachment, type) => {
    if (!attachment) return null;

    let attSourceRect, attOrigin;
    
    if (attachment.sourceRect) {
      // Use SourceRect directly
      attSourceRect = attachment.sourceRect;
      attOrigin = attachment.origin || [0.5, 0.5];
    } else {
      // Use SheetIndex calculation
      const [attX, attY] = attachment.sheetIndex;
      const [attBaseWidth, attBaseHeight] = attachment.baseSize;
      attSourceRect = [
          attX * attBaseWidth,
          attY * attBaseHeight,
          attBaseWidth,
          attBaseHeight
      ];
      attOrigin = [0.5, 0.5]; // Default origin for sheet index
    }

    const attTexturePath = attachment.texture;

    // The attachment should be positioned so that its origin aligns with the head's origin
    // We need to calculate the offset from the center (50%, 50%) to the head's origin
    const headOriginX = limb.origin.x;
    const headOriginY = limb.origin.y;
    
    // Calculate the offset from center to align the attachment's origin with head's origin
    // The attachment's origin point should align with the head's origin point
    const offsetX = (headOriginX - attOrigin[0]) * attSourceRect[2];
    const offsetY = (headOriginY - attOrigin[1]) * attSourceRect[3];

    // Apply position adjustments from HeadPanel
    const adjustment = positionAdjustments[type] || { x: 0, y: 0 };
    const adjustedOffsetX = offsetX + adjustment.x;
    const adjustedOffsetY = offsetY + adjustment.y;

    // 计算 HeadAttachments 的 z-index，确保按照覆盖顺序渲染
    const attachmentZIndex = calculatedZIndex + (OVERRIDE_ORDER[type] || 0);

    const attStyle = {
        position: 'absolute',
        width: `${attSourceRect[2]}px`,
        height: `${attSourceRect[3]}px`,
        backgroundImage: `url(${attTexturePath})`,
        backgroundPosition: `-${attSourceRect[0]}px -${attSourceRect[1]}px`,
        zIndex: attachmentZIndex,
        left: `${50 + (adjustedOffsetX / attSourceRect[2]) * 100}%`,
        top: `${50 + (adjustedOffsetY / attSourceRect[3]) * 100}%`,
        transform: `translate(-50%, -50%) scale(${limb.scale})`,
    };

    return <div key={attachment.id} style={attStyle} />;
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
      <div ref={nodeRef} style={{ position: 'absolute', zIndex: calculatedZIndex }} onClick={() => onSelect(limb)}>
        {isSelected && (
            <div style={{
                position: 'absolute',
                top: `${-25 - (limb.size.height * limb.origin.y)}px`, // Position above the limb
                left: `${-limb.size.width * limb.origin.x}px`,
                color: 'white',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
            }}>
                {`x: ${limb.position.x.toFixed(0)}, y: ${limb.position.y.toFixed(0)}`}
            </div>
        )}
        <div style={innerStyle} />
        <div title={`Limb Position: (${limb.position.x.toFixed(0)}, ${limb.position.y.toFixed(0)})`} />
        {/* {renderJointAnchors()} */}
        {limb.name.includes('Head') && (
            <>
                {Object.keys(limb).filter(key => key.startsWith('selected')).map(key => {
                    const type = key.replace('selected', '').toLowerCase();
                    return renderAttachment(limb[key], type);
                })}
            </>
        )}
      </div>
    </Draggable>
  );
};

export default Limb;
