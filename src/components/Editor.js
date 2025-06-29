import React, { useEffect, useState, useRef } from 'react';
import xml2js from 'xml2js';
import Draggable from 'react-draggable';
import Limb from './Limb';
import PropertiesPanel from './PropertiesPanel';

const Editor = () => {
  const [limbs, setLimbs] = useState([]);
  const [selectedLimb, setSelectedLimb] = useState(null);
  const [headAttachments, setHeadAttachments] = useState({
    hair: [],
    beard: [],
    faceAttachment: [],
  });

  const panelRef = useRef(null);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const parseXMLAndCalculatePose = async () => {
      try {
        const ragdollResponse = await fetch('/assets/HumanDefaultRagdoll.xml');
        const ragdollXmlText = await ragdollResponse.text();
        const characterResponse = await fetch('/assets/Human.xml');
        const characterXmlText = await characterResponse.text();

        const parser = new xml2js.Parser({ explicitArray: false }); 
        const ragdollResult = await parser.parseStringPromise(ragdollXmlText);
        const characterResult = await parser.parseStringPromise(characterXmlText);

        const ragdoll = ragdollResult.Ragdoll;
        const character = characterResult.Character;
        const gender = 'female';

        const parsedLimbs = {};
        ragdoll.limb.forEach(limb => {
            const sprite = limb.sprite; 
            let sourceRect = sprite.$.SourceRect.split(',').map(Number);
            let [x, y, width, height] = sourceRect;
            
            const scale = parseFloat(limb.$.Scale || 1); 

            let texturePath = (sprite.$.Texture || ragdoll.$.Texture).replace('[GENDER]', gender);
            texturePath = texturePath.replace('Content/Characters/Human/', '/assets/');

            const limbData = {
              id: limb.$.ID,
              name: limb.$.Name,
              texture: texturePath,
              position: { x: 0, y: 0 }, // Will be calculated initially
              size: { width, height }, 
              depth: parseFloat(sprite.$.Depth), 
              rotation: parseFloat(limb.$.SpriteOrientation || 0) || 0, // Default to 0 if NaN
              scale: scale,
              type: limb.$.Type,
            };

            if (limb.$.Type === 'Head') {
                limbData.sheetIndex = [0, 0];
                limbData.baseSize = [width, height]; 
                limbData.sourceRect = [0, 0, width, height]; 
                limbData.selectedHair = null;
                limbData.selectedBeard = null;
                limbData.selectedFaceAttachment = null;
            } else {
                limbData.sourceRect = sourceRect;
            }
            parsedLimbs[limbData.id] = limbData;
          });

        // Process Head Attachments from Human.xml
        const newHeadAttachments = { hair: [], beard: [], faceAttachment: [] };
        if (character.HeadAttachments && character.HeadAttachments.Wearable) {
            const wearables = Array.isArray(character.HeadAttachments.Wearable) 
                ? character.HeadAttachments.Wearable 
                : [character.HeadAttachments.Wearable];

            wearables.forEach((wearable) => {
                const type = wearable.$.type ? wearable.$.type.toLowerCase() : ''; 
                if (newHeadAttachments.hasOwnProperty(type)) { 
                    const sprite = wearable.sprite; 
                    if (sprite) {
                        const attachmentData = {
                            id: `${wearable.$.type}-${sprite.$.name}-${wearable.$.tags}`, 
                            name: sprite.$.name,
                            texture: sprite.$.texture.replace('Content/Characters/Human/', '/assets/'),
                            sheetIndex: sprite.$.sheetindex.split(',').map(Number),
                            type: wearable.$.type,
                            baseSize: [128, 128], 
                        };
                        newHeadAttachments[type].push(attachmentData);
                    }
                }
            });
        }
        setHeadAttachments(newHeadAttachments);

        // Set default selected attachments for the head
        const headLimb = Object.values(parsedLimbs).find(l => l.name.includes('Head'));
        if (headLimb) {
            if (newHeadAttachments.hair.length > 0) headLimb.selectedHair = newHeadAttachments.hair[0];
            if (newHeadAttachments.beard.length > 0) headLimb.selectedBeard = newHeadAttachments.beard[0];
            if (newHeadAttachments.faceAttachment.length > 0) headLimb.selectedFaceAttachment = newHeadAttachments.faceAttachment[0];
        }

        // --- Ragdoll Pose Calculation (Initial Pose) ---
        const joints = ragdoll.joint;
        const limbGraph = {}; // Adjacency list for limbs
        joints.forEach(joint => {
            const limb1Id = joint.$.Limb1;
            const limb2Id = joint.$.Limb2;
            if (!limbGraph[limb1Id]) limbGraph[limb1Id] = [];
            limbGraph[limb1Id].push({ joint, childId: limb2Id });
        });

        const calculatedLimbPositions = {};
        const rootLimb = Object.values(parsedLimbs).find(l => l.type === 'Torso');
        if (rootLimb) {
            calculatedLimbPositions[rootLimb.id] = {
                position: { x: 300, y: 500 },
                rotation: rootLimb.rotation,
            };

            const queue = [rootLimb.id];
            const visited = new Set();
            visited.add(rootLimb.id);

            while (queue.length > 0) {
                const parentLimbId = queue.shift();
                const parentLimb = parsedLimbs[parentLimbId];
                const parentTransform = calculatedLimbPositions[parentLimbId];

                if (limbGraph[parentLimbId]) {
                    limbGraph[parentLimbId].forEach(({ joint, childId }) => {
                        if (!visited.has(childId)) {
                            const childLimb = parsedLimbs[childId];
                            const limb1Anchor = joint.$.Limb1Anchor.split(',').map(Number);
                            const limb2Anchor = joint.$.Limb2Anchor.split(',').map(Number);

                            // Invert Y-coordinates for anchors to match web coordinate system
                            limb1Anchor[1] = -limb1Anchor[1];
                            limb2Anchor[1] = -limb2Anchor[1];

                            const parentRotationRad = parentTransform.rotation * (Math.PI / 180);
                            const childRotationRad = childLimb.rotation * (Math.PI / 180);

                            const globalAnchorX = parentTransform.position.x + 
                                (limb1Anchor[0] * Math.cos(parentRotationRad) - limb1Anchor[1] * Math.sin(parentRotationRad));
                            const globalAnchorY = parentTransform.position.y + 
                                (limb1Anchor[0] * Math.sin(parentRotationRad) + limb1Anchor[1] * Math.cos(parentRotationRad));

                            const childPosX = globalAnchorX - 
                                (limb2Anchor[0] * Math.cos(childRotationRad) - limb2Anchor[1] * Math.sin(childRotationRad));
                            const childPosY = globalAnchorY - 
                                (limb2Anchor[0] * Math.sin(childRotationRad) + limb2Anchor[1] * Math.cos(childRotationRad));

                            calculatedLimbPositions[childId] = {
                                position: { x: childPosX, y: childPosY },
                                rotation: childLimb.rotation,
                            };
                            queue.push(childId);
                            visited.add(childId);
                        }
                    });
                }
            }
        }

        // Apply calculated positions and rotations as initial state
        const finalLimbs = Object.values(parsedLimbs).map(limb => {
            const calculated = calculatedLimbPositions[limb.id];
            return {
                ...limb,
                position: calculated ? calculated.position : limb.position,
                rotation: calculated ? calculated.rotation : limb.rotation,
            };
        });
        setLimbs(finalLimbs);

      } catch (error) {
        console.error('Error fetching or parsing XML:', error);
      }
    };

    parseXMLAndCalculatePose();
  }, []); 

  const handleUpdateLimb = (updatedLimb) => {
    let finalLimb = { ...updatedLimb };

    if (finalLimb.name.includes('Head')) {
        const [baseWidth, baseHeight] = finalLimb.baseSize;
        finalLimb.sourceRect = [
            finalLimb.sheetIndex[0] * baseWidth,
            finalLimb.sheetIndex[1] * baseHeight,
            baseWidth,
            baseHeight
        ];
        finalLimb.size = { width: baseWidth, height: baseHeight }; 
    }

    setSelectedLimb(finalLimb);
    setLimbs(prevLimbs => prevLimbs.map(limb => limb.id === finalLimb.id ? finalLimb : limb));
  };

  const handleSelectLimb = (limb) => {
    setSelectedLimb(limb);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#3e3e3e' }}>
        {limbs.map(limb => (
          <Limb
            key={limb.id}
            limb={limb}
            onUpdate={handleUpdateLimb}
            onSelect={handleSelectLimb} 
            isSelected={selectedLimb && selectedLimb.id === limb.id}
            headAttachments={headAttachments} 
          />
        ))}
      </div>
      <Draggable
        nodeRef={panelRef}
        position={panelPosition}
        onStop={(e, data) => setPanelPosition({ x: data.x, y: data.y })}
      >
        <div ref={panelRef} style={{ position: 'absolute', right: 0, top: 0, zIndex: 1000 }}>
          <PropertiesPanel 
            selectedLimb={selectedLimb} 
            onUpdate={handleUpdateLimb}
            headAttachments={headAttachments} 
          />
        </div>
      </Draggable>
    </div>
  );
};

export default Editor;