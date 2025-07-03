import React, { useEffect, useState, useRef } from 'react';
import xml2js from 'xml2js';
import Draggable from 'react-draggable';
import Limb from './Limb';
import PropertiesPanel from './PropertiesPanel';
import JointsPanel from './JointsPanel';
import GenderPanel from './GenderPanel';
import SpriteSheetViewer from './SpriteSheetViewer';
import HeadSheetViewer from './HeadSheetViewer';
import HeadPanel from './HeadPanel';
import { convertTexturePath } from '../utils/textureUtils';

const Editor = () => {
  const [limbs, setLimbs] = useState([]);
  const [joints, setJoints] = useState([]);
  const [selectedLimb, setSelectedLimb] = useState(null);
  const [headAttachments, setHeadAttachments] = useState({});
  const [headSprites, setHeadSprites] = useState([]);
  const [selectedHead, setSelectedHead] = useState('');
  const [selectedAttachments, setSelectedAttachments] = useState({});
  const [positionAdjustments, setPositionAdjustments] = useState({});

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
        // Handle both direct Character and Override.Character structures
        const character = characterResult.Character || characterResult.Override?.Character;
        

            // Get Ragdoll.LimbScale - handle both uppercase and lowercase
    // eslint-disable-next-line no-unused-vars
    const limbScale = parseFloat(ragdoll.$.LimbScale || ragdoll.$.limbscale || 1);

        const parsedLimbs = {};
        // Ensure limb is always an array
        const limbs = Array.isArray(ragdoll.limb) ? ragdoll.limb : [ragdoll.limb];
        

        limbs.forEach(limb => {
            const sprite = limb.sprite;
            
            // Handle both uppercase and lowercase attribute names
            const sourceRectStr = sprite.$.SourceRect || sprite.$.sourcerect;
            const originStr = sprite.$.Origin || sprite.$.origin;
            const depthStr = sprite.$.Depth || sprite.$.depth;
            const textureStr = sprite.$.Texture || sprite.$.texture;
            
            if (!sourceRectStr) {
              console.warn(`Missing SourceRect for limb ${limb.$.Name || limb.$.name}`);
              return; // Skip this limb if no source rect
            }
            
            let sourceRect = sourceRectStr.split(',').map(Number);
            let [, , width, height] = sourceRect;
            let origin = [0.5, 0.5]; // Default origin
            if (originStr) {
                origin = originStr.split(',').map(Number);
            }

            const scale = parseFloat(limb.$.Scale || limb.$.scale || 1);

            let texturePath = textureStr;
            if (!texturePath) {
              texturePath = ragdoll.$.Texture || ragdoll.$.texture;
            }
            texturePath = convertTexturePath(texturePath, gender);

            const limbData = {
              id: limb.$.ID || limb.$.id,
              name: limb.$.Name || limb.$.name,
              texture: texturePath,
              position: { x: 0, y: 0 }, // Will be calculated initially
              size: { width, height },
              origin: { x: origin[0], y: origin[1] },
              depth: parseFloat(depthStr || 0),
              rotation: parseFloat(0), // We are static display, so rotation is 0
              scale: scale,
              type: limb.$.Type || limb.$.type,
            };

            if ((limb.$.Type || limb.$.type) === 'Head') {
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
                    // Check if using SheetIndex or SourceRect
                    const hasSheetIndex = sprite.$.sheetindex || sprite.$.SheetIndex;
                    const hasSourceRect = sprite.$.sourcerect || sprite.$.SourceRect;
                    
                    let sheetIndex, baseSize, sourceRect, origin;
                    
                    if (hasSheetIndex) {
                        // Use SheetIndex - calculate based on Head sprite size from ragdoll
                        sheetIndex = (sprite.$.sheetindex || sprite.$.SheetIndex || '0,0').split(',').map(Number);
                        // Get Head sprite size from ragdoll (160x228)
                        const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
                        const headSize = headLimb ? headLimb.size : { width: 160, height: 228 };
                        baseSize = [headSize.width, headSize.height];
                        sourceRect = [
                            sheetIndex[0] * headSize.width,
                            sheetIndex[1] * headSize.height,
                            headSize.width,
                            headSize.height
                        ];
                        // Use the attachment's own origin from XML, not the head limb's origin
                        origin = (sprite.$.origin || sprite.$.Origin || '0.5,0.5').split(',').map(Number);
                    } else if (hasSourceRect) {
                        // Use SourceRect directly
                        sourceRect = (sprite.$.sourcerect || sprite.$.SourceRect).split(',').map(Number);
                        origin = (sprite.$.origin || sprite.$.Origin || '0.5,0.5').split(',').map(Number);
                        baseSize = [sourceRect[2], sourceRect[3]];
                        sheetIndex = [0, 0]; // Not used when using SourceRect
                    } else {
                        // Fallback
                        sheetIndex = [0, 0];
                        baseSize = [128, 128];
                        sourceRect = [0, 0, 128, 128];
                        origin = [0.5, 0.5];
                    }

                    const attachmentData = {
                        id: `${wearable.$.type}-${sprite.$.name}-${wearable.$.tags}`,
                        name: sprite.$.name,
                        texture: convertTexturePath(sprite.$.texture || sprite.$.Texture, gender),
                        sheetIndex: sheetIndex,
                        sourceRect: sourceRect,
                        origin: origin,
                        baseSize: baseSize,
                        type: wearable.$.type,
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
              sheetIndex: (head.$.sheetindex || head.$.SheetIndex || '0,0').split(',').map(Number),
              baseSize: [160, 228], // Use actual head sprite size from ragdoll
            }));
          setHeadSprites(parsedHeadSprites);
        }

        // Set default selected attachments for the head
        const headLimb = Object.values(parsedLimbs).find(l => l.name.includes('Head'));
        if (headLimb) {
            const exceptions = ['hair', 'beard', 'moustache', 'faceattachment', 'husk', 'herpes'];
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
        // Ensure joint is always an array
        const ragdollJoints = Array.isArray(ragdoll.joint) ? ragdoll.joint : [ragdoll.joint];

        setJoints(ragdollJoints);
        const limbGraph = {}; // Adjacency list for limbs
        ragdollJoints.forEach(joint => {
            // Handle both uppercase and lowercase attribute names for joints
            const limb1Id = joint.$.Limb1 || joint.$.limb1;
            const limb2Id = joint.$.Limb2 || joint.$.limb2;
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
                            // Handle both uppercase and lowercase attribute names for joint anchors
                            const limb1AnchorStr = joint.$.Limb1Anchor || joint.$.limb1anchor;
                            const limb2AnchorStr = joint.$.Limb2Anchor || joint.$.limb2anchor;
                            const limb1Anchor = limb1AnchorStr.split(',').map(Number);
                            const limb2Anchor = limb2AnchorStr.split(',').map(Number);

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
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
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

  const handleHeadChange = (headName) => {
    setSelectedHead(headName);
    // Find the head sprite and update the head limb
    const headSprite = headSprites.find(head => head.name === headName);
    if (headSprite) {
      const headLimb = limbs.find(l => l.name.includes('Head'));
      if (headLimb) {
        const updatedHeadLimb = {
          ...headLimb,
          sheetIndex: headSprite.sheetIndex,
          sourceRect: [
            headSprite.sheetIndex[0] * headSprite.baseSize[0],
            headSprite.sheetIndex[1] * headSprite.baseSize[1],
            headSprite.baseSize[0],
            headSprite.baseSize[1]
          ]
        };
        handleUpdateLimb(updatedHeadLimb);
      }
    }
  };

  const handleAttachmentChange = (type, attachment) => {
    const newSelectedAttachments = {
      ...selectedAttachments,
      [type]: attachment
    };
    setSelectedAttachments(newSelectedAttachments);

    // Update the head limb with the selected attachment
    const headLimb = limbs.find(l => l.name.includes('Head'));
    if (headLimb) {
      const updatedHeadLimb = {
        ...headLimb,
        [`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]: attachment
      };
      handleUpdateLimb(updatedHeadLimb);
    }
  };

  const handlePositionAdjustment = (adjustments) => {
    setPositionAdjustments(adjustments);
  };

  const handleConstructAll = () => {
    const rootLimb = limbs.find(l => l.type === 'Torso');
    if (!rootLimb) return;

    const limbGraph = {};
    joints.forEach(joint => {
        const limb1Id = joint.$.Limb1 || joint.$.limb1;
        const limb2Id = joint.$.Limb2 || joint.$.limb2;
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
                    const limb1Anchor = (joint.$.Limb1Anchor || joint.$.limb1anchor).split(',').map(Number);
                    const limb2Anchor = (joint.$.Limb2Anchor || joint.$.limb2anchor).split(',').map(Number);

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
    const limb1 = limbs.find(l => l.id === (joint.$.Limb1 || joint.$.limb1));
    const limb2 = limbs.find(l => l.id === (joint.$.Limb2 || joint.$.limb2));

    if (!limb1 || !limb2) return;

    const scale1 = limb1.scale;
    const scale2 = limb2.scale;
    const limb1Anchor = (joint.$.Limb1Anchor || joint.$.limb1anchor).split(',').map(Number);
    const limb2Anchor = (joint.$.Limb2Anchor || joint.$.limb2anchor).split(',').map(Number);

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
            positionAdjustments={positionAdjustments}
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
              <HeadPanel 
          gender={gender} 
          headSprites={headSprites} 
          headAttachments={headAttachments} 
          selectedHead={selectedHead} 
          selectedAttachments={selectedAttachments}
          onHeadChange={handleHeadChange}
          onAttachmentChange={handleAttachmentChange}
          onPositionAdjustment={handlePositionAdjustment}
        />
    </div>
  );
};

export default Editor;
