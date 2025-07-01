import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const Limb = ({ limb, onUpdate, onSelect, isSelected, joints, selectedLimb }) => {
  const [x, y, width, height] = limb.sourceRect;
  const texturePath = limb.texture.replace('Content/Characters/Human/', '/assets/').replace('.png', '.png');
  const nodeRef = useRef(null);

  const calculatedZIndex = Math.round((1 - limb.depth) * 1000);

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

  const renderAttachment = (attachment) => {
    if (!attachment) return null;

    const [attX, attY] = attachment.sheetIndex;
    const [attBaseWidth, attBaseHeight] = attachment.baseSize;

    const attSourceRect = [
        attX * attBaseWidth,
        attY * attBaseHeight,
        attBaseWidth,
        attBaseHeight
    ];

    const attTexturePath = attachment.texture;

    const attStyle = {
        position: 'absolute',
        width: `${attBaseWidth}px`,
        height: `${attBaseHeight}px`,
        backgroundImage: `url(${attTexturePath})`,
        backgroundPosition: `-${attSourceRect[0]}px -${attSourceRect[1]}px`,
        zIndex: 1,
        left: '50%',
        top: '50%',
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
                {renderAttachment(limb.selectedHair)}
                {renderAttachment(limb.selectedBeard)}
                {renderAttachment(limb.selectedFaceAttachment)}
            </>
        )}
      </div>
    </Draggable>
  );
};

export default Limb;
