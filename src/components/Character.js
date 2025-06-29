import React, { useEffect, useState } from 'react';
import xml2js from 'xml2js';

const Character = () => {
  const [limbs, setLimbs] = useState([]);

  useEffect(() => {
    const parseXML = async () => {
      try {
        const response = await fetch('/assets/HumanDefaultRagdoll.xml');
        const xmlText = await response.text();
        
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlText);
        
        const ragdoll = result.Ragdoll;
        const gender = 'female'; // Or dynamically determine this

        const limbsById = {};
        ragdoll.limb.forEach(l => {
            limbsById[l.$.ID] = l;
        });

        const joints = ragdoll.joint;
        const children = {};
        joints.forEach(j => {
            const parent = j.$.Limb1;
            const child = j.$.Limb2;
            if (!children[parent]) children[parent] = [];
            children[parent].push(child);
        });

        const calculatedLimbs = [];
        const limbTransforms = {};

        function calculateLimbTransform(limbId, parentId) {
            const limb = limbsById[limbId];
            if (!limb) return;

            let parentTransform = { x: 0, y: 0, rot: 0 };
            if (parentId !== null) {
                parentTransform = limbTransforms[parentId];
            }

            const joint = joints.find(j => j.$.Limb2 === limbId && j.$.Limb1 === parentId);
            
            let localX = 0;
            let localY = 0;

            if (joint) {
                const limb1Anchor = joint.$.Limb1Anchor.split(',').map(Number);
                const limb2Anchor = joint.$.Limb2Anchor.split(',').map(Number);
                
                // Simple relative positioning based on anchors
                // This is a simplification and might need adjustments for rotation
                localX = limb1Anchor[0] - limb2Anchor[0];
                localY = limb1Anchor[1] - limb2Anchor[1];
            }

            const globalX = parentTransform.x + localX;
            const globalY = parentTransform.y + localY;
            const rotation = parseFloat(limb.$.SpriteOrientation) || 0;

            limbTransforms[limbId] = { x: globalX, y: globalY, rot: rotation };

            const sprite = limb.sprite;
            const sourceRect = sprite.$.SourceRect.split(',').map(Number);
            const origin = sprite.$.Origin.split(',').map(Number);
            const depth = parseFloat(sprite.$.Depth);
            let texturePath = sprite.$.Texture || ragdoll.$.Texture;
            texturePath = texturePath.replace('[GENDER]', gender).replace('Content/Characters/Human/', '/assets/');

            calculatedLimbs.push({
                name: limb.$.Name,
                sourceRect,
                origin,
                depth,
                texture: texturePath,
                transform: { x: globalX, y: globalY, rot: rotation }
            });

            if (children[limbId]) {
                children[limbId].forEach(childId => {
                    calculateLimbTransform(childId, limbId);
                });
            }
        }

        const rootLimbId = ragdoll.limb.find(l => l.$.Type === 'Torso').$.ID;
        calculateLimbTransform(rootLimbId, null);
        
        // Sort by depth for correct layering
        calculatedLimbs.sort((a, b) => a.depth - b.depth);

        setLimbs(calculatedLimbs);

      } catch (error) {
        console.error('Error fetching or parsing XML:', error);
      }
    };

    parseXML();
  }, []);

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
                left: `${limb.transform.x}px`,
                top: `${limb.transform.y}px`,
                width: `${width}px`,
                height: `${height}px`,
                backgroundImage: `url(${limb.texture})`,
                backgroundPosition: `-${x}px -${y}px`,
                transformOrigin: `${originX * 100}% ${originY * 100}%`,
                transform: `translate(-50%, -50%) rotate(${limb.transform.rot}deg)`,
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