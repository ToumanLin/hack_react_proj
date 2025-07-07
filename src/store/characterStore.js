import { create } from 'zustand';
import {
  loadCharacterData,
  loadCharacterDataFallback,
  processLimbTexturePath,
  processAttachmentTexturePath,
  loadFilelistAndFindHumanXml,
  loadHumanXmlAndGetRagdollsPath
} from '../utils/pathUtils';
import {
  getXml2jsAttribute,
  parseFloat as parseFloatUtil
} from '../utils/xmlUtils';
import { convertTexturePath } from '../utils/textureUtils';

const useCharacterStore = create((set, get) => ({
  // State
  limbs: [],
  joints: [],
  selectedLimb: null,
  headAttachments: {},
  headSprites: [],
  selectedHead: '',
  selectedAttachments: {},
  mainTexture: null,
  clothingSprites: [],
  gender: 'female',
  availableGenders: ['female', 'male'],
  
  // Actions
  setLimbs: (limbs) => set({ limbs }),
  setJoints: (joints) => set({ joints }),
  setSelectedLimb: (selectedLimb) => set({ selectedLimb }),
  setHeadAttachments: (headAttachments) => set({ headAttachments }),
  setHeadSprites: (headSprites) => set({ headSprites }),
  setSelectedHead: (selectedHead) => set({ selectedHead }),
  setSelectedAttachments: (selectedAttachments) => set({ selectedAttachments }),
  setMainTexture: (mainTexture) => set({ mainTexture }),
  setClothingSprites: (clothingSprites) => set({ clothingSprites }),
  setGender: (gender) => {
    set({ gender });
    get().loadCharacter(gender);
  },
  setAvailableGenders: (availableGenders) => set({ availableGenders }),

  // Async action for loading character data
  loadCharacter: async (gender) => {
    try {
      // Load all character data using the new path utilities
      const { character, ragdoll, mainTexture } = await loadCharacterData(gender);
      set({ mainTexture });

      // Get Ragdoll.LimbScale - use robust parsing
      // eslint-disable-next-line no-unused-vars
      const limbScale = parseFloatUtil(getXml2jsAttribute(ragdoll, 'limbscale'), 1);

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
          
          let sourceRect = sourceRectStr.split(',').map(val => parseFloat(val.trim()));
          let [, , width, height] = sourceRect;
          let origin = [0.5, 0.5]; // Default origin
          if (originStr) {
              origin = originStr.split(',').map(val => parseFloat(val.trim()));
          }

          const scale = parseFloat(limb.$.Scale || limb.$.scale || 1);

          const texturePath = processLimbTexturePath(textureStr, ragdoll.$.Texture || ragdoll.$.texture, gender);

          const limbData = {
            id: limb.$.ID || limb.$.id,
            name: limb.$.Name || limb.$.name,
            texture: texturePath,
            position: { x: 0, y: 0 }, // Will be calculated initially
            size: { width, height },
            origin: { x: origin[0], y: origin[1] },
            depth: parseFloat(depthStr || 0),
            rotation: parseFloat(0), // We are static display, so initial rotation is 0
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
                      sheetIndex = (sprite.$.sheetindex || sprite.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim()));
                      // Get Head sprite size from ragdoll SourceRect
                      const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
                      let headWidth = 128, headHeight = 128; // Default fallback
                      if (headLimb && headLimb.sourceRect) {
                          headWidth = headLimb.sourceRect[2];
                          headHeight = headLimb.sourceRect[3];
                      }
                      baseSize = [headWidth, headHeight];
                      sourceRect = [
                          sheetIndex[0] * headWidth,
                          sheetIndex[1] * headHeight,
                          headWidth,
                          headHeight
                      ];
                      // Use the head limb's origin when using sheetindex (since attachment doesn't have its own origin)
                      origin = headLimb ? [headLimb.origin.x, headLimb.origin.y] : [0.5, 0.5];
                  } else if (hasSourceRect) {
                      // Use SourceRect directly
                      sourceRect = (sprite.$.sourcerect || sprite.$.SourceRect).split(',').map(val => parseFloat(val.trim()));
                      origin = (sprite.$.origin || sprite.$.Origin || '0.5,0.5').split(',').map(val => parseFloat(val.trim()));
                      baseSize = [sourceRect[2], sourceRect[3]];
                      sheetIndex = null; // Not used when using SourceRect
                  } else {
                      // Fallback
                      sheetIndex = [0, 0];
                      baseSize = [128, 128];
                      sourceRect = [0, 0, 128, 128];
                      origin = [0.5, 0.5];
                  }

                  const texturePath = processAttachmentTexturePath(sprite.$.texture || sprite.$.Texture, gender);

                  const attachmentData = {
                      id: `${wearable.$.type}-${sprite.$.name}`,
                      name: sprite.$.name,
                      texture: texturePath,
                      sheetIndex: sheetIndex,
                      sourceRect: sourceRect,
                      origin: origin,
                      baseSize: baseSize,
                      type: wearable.$.type,
                      tags: wearable.$.tags,
                  };
                  newHeadAttachments[type].push(attachmentData);
              }
          });
      }
      set({ headAttachments: newHeadAttachments });

      // Process Head sprites from Human.xml <Heads> section
      if (character.Heads && character.Heads.Head) {
        const heads = Array.isArray(character.Heads.Head) ? character.Heads.Head : [character.Heads.Head];
        const parsedHeadSprites = heads
          .filter(head => {
            // Support both tags and gender attributes
            if (head.$.tags) {
              // Old format: tags="head1,male"
              return head.$.tags.includes(gender);
            } else if (head.$.gender) {
              // New format: gender="male"
              return head.$.gender === gender;
            }
            return false; // Skip if neither tags nor gender is present
          })
          .map(head => {
            // Extract head name from either tags or id
            let headName;
            if (head.$.tags) {
              // Old format: extract from tags like "head1,male"
              headName = `Head ${head.$.tags.split(',')[0]}`;
            } else if (head.$.id) {
              // New format: use id as name
              headName = `Head ${head.$.id}`;
            } else {
              headName = 'Head Unknown';
            }
            
            // Get Head limb size from parsed limbs
            const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
            let headWidth = 128, headHeight = 128; // Default fallback
            if (headLimb && headLimb.sourceRect) {
              headWidth = headLimb.sourceRect[2];
              headHeight = headLimb.sourceRect[3];
            }
            
            return {
              name: headName,
              texture: convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', gender), // Use the heads texture from XML
              sheetIndex: (head.$.sheetindex || head.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim())),
              baseSize: [headWidth, headHeight], // Use actual head sprite size from ragdoll SourceRect
            };
          });
        set({ headSprites: parsedHeadSprites });
      }

      // Set default selected attachments for the head
      const headLimb = Object.values(parsedLimbs).find(l => l.name.includes('Head'));
      if (headLimb) {
          const exceptions = ['hair', 'beard', 'moustache']; // Other types use null intial value
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

      set({ joints: ragdollJoints });
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
              position: { x: 350, y: 200 },
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
                          const limb1Anchor = limb1AnchorStr.split(',').map(val => parseFloat(val.trim()));
                          const limb2Anchor = limb2AnchorStr.split(',').map(val => parseFloat(val.trim()));

                          const scale1 = parentLimb.scale;
                          // const scale2 = childLimb.scale;
                          // Flip y axis
                          const childPosX = parentTransform.position.x + (limb1Anchor[0] - limb2Anchor[0]) * scale1;
                          const childPosY = parentTransform.position.y - (limb1Anchor[1] - limb2Anchor[1]) * scale1;

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

      set({ limbs: finalLimbs });

    } catch (error) {
      console.error('Error with new loading logic:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Fallback to original hardcoded paths if the new logic fails
      console.log('Falling back to original hardcoded paths...');
      try {
        const { character, ragdoll, mainTexture } = await loadCharacterDataFallback(gender);
        set({ mainTexture });

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
          
          let sourceRect = sourceRectStr.split(',').map(val => parseFloat(val.trim()));
          let [, , width, height] = sourceRect;
          let origin = [0.5, 0.5]; // Default origin
          if (originStr) {
              origin = originStr.split(',').map(val => parseFloat(val.trim()));
          }

          const scale = parseFloat(limb.$.Scale || limb.$.scale || 1);

          const texturePath = processLimbTexturePath(textureStr, ragdoll.$.Texture || ragdoll.$.texture, gender);

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
                        sheetIndex = (sprite.$.sheetindex || sprite.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim()));
                        // Get Head sprite size from ragdoll SourceRect
                        const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
                        let headWidth = 128, headHeight = 128; // Default fallback
                        if (headLimb && headLimb.sourceRect) {
                            headWidth = headLimb.sourceRect[2];
                            headHeight = headLimb.sourceRect[3];
                        }
                        baseSize = [headWidth, headHeight];
                        sourceRect = [
                            sheetIndex[0] * headWidth,
                            sheetIndex[1] * headHeight,
                            headWidth,
                            headHeight
                        ];
                        // Use the head limb's origin when using sheetindex (since attachment doesn't have its own origin)
                        origin = headLimb ? [headLimb.origin.x, headLimb.origin.y] : [0.5, 0.5];
                    } else if (hasSourceRect) {
                        // Use SourceRect directly
                        sourceRect = (sprite.$.sourcerect || sprite.$.SourceRect).split(',').map(val => parseFloat(val.trim()));
                        origin = (sprite.$.origin || sprite.$.Origin || '0.5,0.5').split(',').map(val => parseFloat(val.trim()));
                        baseSize = [sourceRect[2], sourceRect[3]];
                        sheetIndex = null; // Not used when using SourceRect
                    } else {
                        // Fallback
                        sheetIndex = [0, 0];
                        baseSize = [128, 128];
                        sourceRect = [0, 0, 128, 128];
                        origin = [0.5, 0.5];
                    }

                    const texturePath = processAttachmentTexturePath(sprite.$.texture || sprite.$.Texture, gender);

                    const attachmentData = {
                        id: `${wearable.$.type}-${sprite.$.name}`,
                        name: sprite.$.name,
                        texture: texturePath,
                        sheetIndex: sheetIndex,
                        sourceRect: sourceRect,
                        origin: origin,
                        baseSize: baseSize,
                        type: wearable.$.type,
                        tags: wearable.$.tags,
                    };
                    newHeadAttachments[type].push(attachmentData);
                }
            });
        }
        set({ headAttachments: newHeadAttachments });

        // Process Head sprites from Human.xml <Heads> section
        if (character.Heads && character.Heads.Head) {
          const heads = Array.isArray(character.Heads.Head) ? character.Heads.Head : [character.Heads.Head];
          const parsedHeadSprites = heads
            .filter(head => {
              // Support both tags and gender attributes
              if (head.$.tags) {
                // Old format: tags="head1,male"
                return head.$.tags.includes(gender);
              } else if (head.$.gender) {
                // New format: gender="male"
                return head.$.gender === gender;
              }
              return false; // Skip if neither tags nor gender is present
            })
            .map(head => {
              // Extract head name from either tags or id
              let headName;
              if (head.$.tags) {
                // Old format: extract from tags like "head1,male"
                headName = `Head ${head.$.tags.split(',')[0]}`;
              } else if (head.$.id) {
                // New format: use id as name
                headName = `Head ${head.$.id}`;
              } else {
                headName = 'Head Unknown';
              }
              
              // Get Head limb size from parsed limbs
              const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
              let headWidth = 128, headHeight = 128; // Default fallback
              if (headLimb && headLimb.sourceRect) {
                headWidth = headLimb.sourceRect[2];
                headHeight = headLimb.sourceRect[3];
              }
              
              return {
                name: headName,
                texture: convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', gender), // Use the heads texture from XML
                sheetIndex: (head.$.sheetindex || head.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim())),
                baseSize: [headWidth, headHeight], // Use actual head sprite size from ragdoll SourceRect
              };
            });
          set({ headSprites: parsedHeadSprites });
        }

        // Set default selected attachments for the head
        const headLimb = Object.values(parsedLimbs).find(l => l.name.includes('Head'));
        if (headLimb) {
            const exceptions = ['hair', 'beard', 'moustache']; // Other types use null intial value
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

        set({ joints: ragdollJoints });
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
                position: { x: 320, y: 200 },
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
                            const limb1Anchor = limb1AnchorStr.split(',').map(val => parseFloat(val.trim()));
                            const limb2Anchor = limb2AnchorStr.split(',').map(val => parseFloat(val.trim()));

                            const scale1 = parentLimb.scale;
                            const scale2 = childLimb.scale;
                            // Flip y axis
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

        set({ limbs: finalLimbs });
        
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Set empty state to prevent crashes
        set({
          limbs: [],
          joints: [],
          headAttachments: {},
          headSprites: [],
        });
      }
    }
  },
}));

export default useCharacterStore;
""
