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
    transformOrigin: 'center center',
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

    const joint = joints.find(j => j.$.Limb1 === limb.id || j.$.Limb2 === limb.id);
    if (!joint) return null;

    const limb1Anchor = joint.$.Limb1Anchor.split(',').map(Number);
    const limb2Anchor = joint.$.Limb2Anchor.split(',').map(Number);

    const anchorStyle = {
      position: 'absolute',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      zIndex: 9999, // Always on top
    };

    return (
      <>
        <div style={{ ...anchorStyle, backgroundColor: 'red', left: `${limb1Anchor[0]}px`, top: `${limb1Anchor[1]}px` }} title={`Limb1 Anchor: ${joint.$.Limb1}`} />
        <div style={{ ...anchorStyle, backgroundColor: 'blue', left: `${limb2Anchor[0]}px`, top: `${limb2Anchor[1]}px` }} title={`Limb2 Anchor: ${joint.$.Limb2}`} />
      </>
    );
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: limb.position.x, y: limb.position.y }} // Use limb's position
      onDrag={(e, data) => {
        onUpdate({ ...limb, position: { x: data.x, y: data.y } });
      }}
      onStart={() => onSelect(limb)}
    >
      <div ref={nodeRef} style={{ position: 'absolute', zIndex: calculatedZIndex }} onClick={() => onSelect(limb)}>
        <div style={innerStyle} />
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
