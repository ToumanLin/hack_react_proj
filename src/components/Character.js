import React from 'react';

const Character = ({ limbs = [] }) => {
  return (
    <div style={{ position: 'relative', width: '512px', height: '512px', margin: 'auto' }}>
      <div style={{ position: 'relative', top: '200px', left: '200px' }}>
        {limbs.map((limb, index) => {
          const [x, y, width, height] = limb.sourceRect;
          const [originX, originY] = limb.origin;

          return (
            <div
              key={index}
              title={limb.name}
              style={{
                position: 'absolute',
                left: `${limb.position.x}px`,
                top: `${limb.position.y}px`,
                width: `${width}px`,
                height: `${height}px`,
                backgroundImage: `url(${limb.texture})`,
                backgroundPosition: `-${x}px -${y}px`,
                transformOrigin: `${originX * 100}% ${originY * 100}%`,
                transform: `translate(-50%, -50%) rotate(${limb.rotation || 0}deg)`,
                zIndex: index, // Use sorted index for z-ordering
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Character;