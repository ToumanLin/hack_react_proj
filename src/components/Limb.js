
import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const Limb = ({ limb, onUpdate, isSelected }) => {
  const [x, y, width, height] = limb.sourceRect;
  const texturePath = limb.texture.replace('Content/Characters/Human/', '/assets/').replace('.png', '.png');
  const nodeRef = useRef(null);

  const style = {
    position: 'absolute',
    width: `${limb.size.width}px`,
    height: `${limb.size.height}px`,
    backgroundImage: `url(${texturePath})`,
    backgroundPosition: `-${x}px -${y}px`,
    zIndex: limb.depth,
    border: isSelected ? '2px solid red' : 'none',
    cursor: 'move',
    transform: `rotate(${limb.rotation}deg)`,
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: limb.position.x, y: limb.position.y }}
      onDrag={(e, data) => {
        onUpdate({ ...limb, position: { x: data.x, y: data.y } });
      }}
      onStart={() => onUpdate(limb)}
    >
      <div ref={nodeRef} style={style} />
    </Draggable>
  );
};

export default Limb;
