import React, { useEffect, useState, useRef } from 'react';
import xml2js from 'xml2js';
import Draggable from 'react-draggable';
import Limb from './Limb';
import PropertiesPanel from './PropertiesPanel';
import JointsPanel from './JointsPanel';
import GenderPanel from './GenderPanel';
import SpriteSheetViewer from './SpriteSheetViewer';
import HeadSheetViewer from './HeadSheetViewer';
import { convertTexturePath } from '../utils/textureUtils';

const Editor = () => {
  const [limbs, setLimbs] = useState([]);
  const [joints, setJoints] = useState([]);
  const [selectedLimb, setSelectedLimb] = useState(null);
  const [ragdollLimbScale, setRagdollLimbScale] = useState(1);
  const [headAttachments, setHeadAttachments] = useState({});
  const [headSprites, setHeadSprites] = useState([]);

  const panelRef = useRef(null);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const jointsPanelRef = useRef(null);
  const [jointsPanelPosition, setJointsPanelPosition] = useState({ x: 0, y: 0 });
  const [gender, setGender] = useState('female');
  const genderPanelRef = useRef(null);
  const [genderPanelPosition, setGenderPanelPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const parseXMLAndCalculatePose = async (gender) => {
      try {
        const ragdollResponse = await fetch('/assets/Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml');
        const ragdollXmlText = await ragdollResponse.text();
        const characterResponse = await fetch('/assets/Content/Characters/Human/Human.xml');
        const characterXmlText = await characterResponse.text();

        const parser = new xml2js.Parser({ explicitArray: false }); 
        const ragdollResult = await parser.parseStringPromise(ragdollXmlText);
        const characterResult = await parser.parseStringPromise(characterXmlText);

        const ragdoll = ragdollResult.Ragdoll;
        const character = characterResult.Character;

        // Get Ragdoll.LimbScale
        const limbScale = parseFloat(ragdoll.$.LimbScale || 1);
        setRagdollLimbScale(limbScale);

        const parsedLimbs = {};
        ragdoll.limb.forEach(limb => {
            const sprite = limb.sprite;
            let sourceRect = sprite.$.SourceRect.split(',').map(Number);
            let [x, y, width, height] = sourceRect;
            let origin = [0.5, 0.5]; // Default origin
            if (sprite.$.Origin) {
                origin = sprite.$.Origin.split(',').map(Number);
            }

            const scale = parseFloat(limb.$.Scale || 1);

            let texturePath = sprite.$.Texture;
            if (!texturePath) {
              texturePath = ragdoll.$.Texture;
            }
            texturePath = convertTexturePath(texturePath, gender);

            const limbData = {
              id: limb.$.ID,
              name: limb.$.Name,
              texture: texturePath,
              position: { x: 0, y: 0 }, // Will be calculated initially
              size: { width, height },
              origin: { x: origin[0], y: origin[1] },
              depth: parseFloat(sprite.$.Depth),
              rotation: parseFloat(0), // We are static display, so rotation is 0
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
        const newHeadAttachments = {};
        if (character.HeadAttachments && character.HeadAttachments.Wearable) {
            const wearables = Array.isArray(character.HeadAttachments.Wearable) 
                ? character.HeadAttachments.Wearable 
                : [character.HeadAttachments.Wearable];

            wearables.forEach((wearable) => {
                const type = wearable.$.type ? wearable.$.type.toLowerCase() : '';
                const tags = wearable.$.tags ? wearable.$.tags.split(',') : [];

                // If tags exist, check if the current gender is included in the tags
                // If no tags, it's gender-neutral, so include it.
                if (tags.length > 0 && !tags.includes(gender)) {
                    return; // Skip this wearable if it's not for the current gender
                }

                if (!newHeadAttachments[type]) {
                    newHeadAttachments[type] = [];
                }

                const sprite = wearable.sprite;
                if (sprite) {
                    const attachmentData = {
                        id: `${wearable.$.type}-${sprite.$.name}-${wearable.$.tags}`,
                        name: sprite.$.name,
                        texture: convertTexturePath(sprite.$.texture, gender),
                        sheetIndex: sprite.$.sheetindex.split(',').map(Number),
                        type: wearable.$.type,
                        baseSize: [128, 128],
                    };
                    newHeadAttachments[type].push(attachmentData);
                }
            });
        }
        setHeadAttachments(newHeadAttachments);

        // Process Head sprites from Human.xml <Heads> section
        if (character.Heads && character.Heads.Head) {
          const heads = Array.isArray(character.Heads.Head) ? character.Heads.Head : [character.Heads.Head];
          const parsedHeadSprites = heads
            .filter(head => head.$.tags.includes(gender)) // Only include heads for current gender
            .map(head => ({
              name: `Head ${head.$.tags.split(',')[0]}`, // Extract head name from tags
              texture: convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', gender), // Use the heads texture from XML
              sheetIndex: head.$.sheetindex.split(',').map(Number),
              baseSize: [128, 128], // Assuming a fixed size for head sprites
            }));
          setHeadSprites(parsedHeadSprites);
        }

        // Set default selected attachments for the head
        const headLimb = Object.values(parsedLimbs).find(l => l.name.includes('Head'));
        if (headLimb) {
            const exceptions = ['hair', 'beard', 'moustache'];
            for (const type in newHeadAttachments) {
                if (newHeadAttachments[type].length > 0) {
                    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
                    if (exceptions.includes(type.toLowerCase())) {
                        headLimb[`selected${capitalizedType}`] = newHeadAttachments[type][0];
                    } else {
                        headLimb[`selected${capitalizedType}`] = null;
                    }
                }
            }
        }

        // --- Ragdoll Pose Calculation (Initial Pose) ---
        const ragdollJoints = ragdoll.joint;
        setJoints(ragdollJoints);
        const limbGraph = {}; // Adjacency list for limbs
        ragdollJoints.forEach(joint => {
            const limb1Id = joint.$.Limb1;
            const limb2Id = joint.$.Limb2;
            if (!limbGraph[limb1Id]) limbGraph[limb1Id] = [];
            limbGraph[limb1Id].push({ joint, childId: limb2Id });
        });

        const calculatedLimbPositions = {};
        const rootLimb = Object.values(parsedLimbs).find(l => l.type === 'Torso');
        if (rootLimb) {
            calculatedLimbPositions[rootLimb.id] = {
                position: { x: 320, y: 300 },
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

                            const scale1 = parentLimb.scale;
                            const scale2 = childLimb.scale;
                            // y轴翻转
                            const childPosX = parentTransform.position.x + limb1Anchor[0] * scale1 - limb2Anchor[0] * scale2;
                            const childPosY = parentTransform.position.y - limb1Anchor[1] * scale1 + limb2Anchor[1] * scale2;

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

    parseXMLAndCalculatePose(gender);
  }, [gender]); 

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

  const handleBackgroundClick = (e) => {
    // If the click is on the background (not on a limb), deselect the limb
    if (e.target.classList.contains('editor-background')) {
      setSelectedLimb(null);
    }
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
  };

  const handleConstructAll = () => {
    const rootLimb = limbs.find(l => l.type === 'Torso');
    if (!rootLimb) return;

    const limbGraph = {};
    joints.forEach(joint => {
        const limb1Id = joint.$.Limb1;
        const limb2Id = joint.$.Limb2;
        if (!limbGraph[limb1Id]) limbGraph[limb1Id] = [];
        limbGraph[limb1Id].push({ joint, childId: limb2Id });
    });

    const newLimbs = [...limbs];
    const queue = [rootLimb.id];
    const visited = new Set();
    visited.add(rootLimb.id);

    while (queue.length > 0) {
        const parentLimbId = queue.shift();
        const parentLimb = newLimbs.find(l => l.id === parentLimbId);

        if (limbGraph[parentLimbId]) {
            limbGraph[parentLimbId].forEach(({ joint, childId }) => {
                if (!visited.has(childId)) {
                    const childLimb = newLimbs.find(l => l.id === childId);
                    const limb1Anchor = joint.$.Limb1Anchor.split(',').map(Number);
                    const limb2Anchor = joint.$.Limb2Anchor.split(',').map(Number);

                    const scale1 = parentLimb.scale;
                    const scale2 = childLimb.scale;

                    const childPosX = parentLimb.position.x + limb1Anchor[0] * scale1 - limb2Anchor[0] * scale2;
                    const childPosY = parentLimb.position.y - limb1Anchor[1] * scale1 + limb2Anchor[1] * scale2;

                    const updatedChildLimb = { ...childLimb, position: { x: childPosX, y: childPosY } };
                    const index = newLimbs.findIndex(l => l.id === childId);
                    newLimbs[index] = updatedChildLimb;

                    queue.push(childId);
                    visited.add(childId);
                }
            });
        }
    }
    setLimbs(newLimbs);
  };

  const handleConstruct = (joint) => {
    const limb1 = limbs.find(l => l.id === joint.$.Limb1);
    const limb2 = limbs.find(l => l.id === joint.$.Limb2);

    if (!limb1 || !limb2) return;

    const scale1 = limb1.scale;
    const scale2 = limb2.scale;
    const limb1Anchor = joint.$.Limb1Anchor.split(',').map(Number);
    const limb2Anchor = joint.$.Limb2Anchor.split(',').map(Number);

    // Flip y axis
    const childPosX = limb1.position.x + limb1Anchor[0] * scale1 - limb2Anchor[0] * scale2;
    const childPosY = limb1.position.y - limb1Anchor[1] * scale1 + limb2Anchor[1] * scale2;

    const updatedLimb2 = { ...limb2, position: { x: childPosX, y: childPosY } };
    handleUpdateLimb(updatedLimb2);
  };

      return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#3e3e3e', overflow: 'hidden' }}>
        <div className="editor-background" style={{ flex: 1, position: 'relative', backgroundColor: '#3e3e3e' }} onClick={handleBackgroundClick}>
        {limbs.map(limb => (
          <Limb
            key={limb.id}
            limb={limb}
            onUpdate={handleUpdateLimb}
            onSelect={handleSelectLimb} 
            isSelected={selectedLimb && selectedLimb.id === limb.id}
            headAttachments={headAttachments}
            joints={joints}
            selectedLimb={selectedLimb}
          />
        ))}
      </div>
      <Draggable
        nodeRef={panelRef}
        position={panelPosition}
        onStop={(e, data) => setPanelPosition({ x: data.x, y: data.y })}
      >
        <div ref={panelRef} style={{ position: 'absolute', right: 0, top: 0, zIndex: 1000, backgroundColor: '#2D2D2D' }}>
          <PropertiesPanel 
            selectedLimb={selectedLimb} 
            onUpdate={handleUpdateLimb}
            headAttachments={headAttachments} 
          />
        </div>
      </Draggable>
      <Draggable
        nodeRef={jointsPanelRef}
        position={jointsPanelPosition}
        onStop={(e, data) => setJointsPanelPosition({ x: data.x, y: data.y })}
      >
        <div ref={jointsPanelRef} style={{ position: 'absolute', left: 0, top: 0, zIndex: 1000, backgroundColor: '#2D2D2D' }}>
          <JointsPanel joints={joints} onConstruct={handleConstruct} onConstructAll={handleConstructAll} />
        </div>
      </Draggable>
      <Draggable
        nodeRef={genderPanelRef}
        position={genderPanelPosition}
        onStop={(e, data) => setGenderPanelPosition({ x: data.x, y: data.y })}
      >
        <div ref={genderPanelRef} style={{ position: 'absolute', left: 0, top: '600px', zIndex: 1000, backgroundColor: '#2D2D2D' }}>
          <GenderPanel onGenderChange={handleGenderChange} currentGender={gender} />
        </div>
      </Draggable>
      <SpriteSheetViewer gender={gender} />
      <HeadSheetViewer gender={gender} headAttachments={headAttachments} headSprites={headSprites} />
    </div>
  );
};

export default Editor;
