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

  const renderJointAnchors = () => {
    if (!isSelected || !joints) return null;

    const relevantJoints = joints.filter(j => j.$.Limb1 === limb.id || j.$.Limb2 === limb.id);
    if (relevantJoints.length === 0) return null;

    const anchorStyle = {
      position: 'absolute',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      zIndex: 9999, // Always on top
    };

    return relevantJoints.map(joint => {
      const limb1Anchor = joint.$.Limb1Anchor.split(',').map(Number);
      const limb2Anchor = joint.$.Limb2Anchor.split(',').map(Number);

      const anchor1IsOnThisLimb = joint.$.Limb1 === limb.id;
      const anchor2IsOnThisLimb = joint.$.Limb2 === limb.id;

      const rotationRad = 0; // Force rotation to 0 for debugging
      const originPx = { x: limb.size.width * limb.origin.x, y: limb.size.height * limb.origin.y };

      const calculateWorldCoords = (anchor) => {
        const rotatedAnchor = {
            x: anchor[0] * Math.cos(rotationRad) - anchor[1] * Math.sin(rotationRad),
            y: anchor[0] * Math.sin(rotationRad) + anchor[1] * Math.cos(rotationRad)
        };
        return {
            x: limb.position.x + originPx.x + rotatedAnchor.x,
            y: limb.position.y + originPx.y + rotatedAnchor.y
        };
      };

      const worldCoords1 = calculateWorldCoords(limb1Anchor);
      const worldCoords2 = calculateWorldCoords(limb2Anchor);

      return (
        <React.Fragment key={`${joint.$.Limb1}-${joint.$.Limb2}`}>
          {anchor1IsOnThisLimb && (
            <div 
              style={{ 
                ...anchorStyle, 
                backgroundColor: 'red', 
                left: `${limb.size.width * limb.origin.x + limb1Anchor[0]}px`,
                top: `${limb.size.height * limb.origin.y + limb1Anchor[1]}px` 
              }} 
              title={`Joint ${joint.$.Limb1}-${joint.$.Limb2} Anchor:1 (${worldCoords1.x.toFixed(0)},${worldCoords1.y.toFixed(0)})`}
            />
          )}
          {anchor2IsOnThisLimb && (
            <div 
              style={{ 
                ...anchorStyle, 
                backgroundColor: 'blue', 
                left: `${limb.size.width * limb.origin.x + limb2Anchor[0]}px`,
                top: `${limb.size.height * limb.origin.y + limb2Anchor[1]}px` 
              }} 
              title={`Joint ${joint.$.Limb1}-${joint.$.Limb2} Anchor:2 (${worldCoords2.x.toFixed(0)},${worldCoords2.y.toFixed(0)})`}
            />
          )}
        </React.Fragment>
      );
    });
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
        <div style={{
            position: 'absolute',
            left: `${limb.size.width * limb.origin.x}px`,
            top: `${limb.size.height * limb.origin.y}px`,
            width: '8px',
            height: '8px',
            backgroundColor: 'white',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
        }} title={`Limb Position: (${limb.position.x.toFixed(0)}, ${limb.position.y.toFixed(0)})`} />
        {renderJointAnchors()}
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
