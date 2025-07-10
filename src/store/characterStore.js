import { create } from 'zustand';
import {
  loadCharacterData,
  loadCharacterDataFallback,
  processLimbTexturePath,
  processAttachmentTexturePath,
} from '../utils/pathUtils';
import { convertTexturePath } from '../utils/textureUtils';
import { logInfo, logError, logWarn, logLimbError } from '../utils/logger';

const parseAndPrepareCharacterData = (character, ragdoll, gender) => {
  // logInfo('LimbParsing', 'Starting to parse and prepare character data', { gender });
  
  const parsedLimbs = {};
  const limbs = Array.isArray(ragdoll.limb) ? ragdoll.limb : [ragdoll.limb];
  
  // logInfo('LimbParsing', 'Processing limbs', { 
  //   totalLimbs: limbs.length,
  //   isArray: Array.isArray(ragdoll.limb)
  // });
  
  limbs.forEach((limb, index) => {
    const limbId = limb.$.ID || limb.$.id;
    const limbName = limb.$.Name || limb.$.name;
    
    // logInfo('LimbParsing', `Processing limb ${index + 1}/${limbs.length}`, { 
    //   limbId, 
    //   limbName,
    //   limbType: limb.$.Type || limb.$.type 
    // });
    
    try {
      const sprite = limb.sprite;
      if (!sprite) {
        const error = new Error(`Missing sprite data for limb ${limbName}`);
        logLimbError('LimbParsing', limbId, error, { limbName, limbIndex: index });
        return;
      }
      
      const sourceRectStr = sprite.$.SourceRect || sprite.$.sourcerect;
      const originStr = sprite.$.Origin || sprite.$.origin;
      const depthStr = sprite.$.Depth || sprite.$.depth;
      const textureStr = sprite.$.Texture || sprite.$.texture;
      
      if (!sourceRectStr) {
        const error = new Error(`Missing SourceRect for limb ${limbName}`);
        logLimbError('LimbParsing', limbId, error, { 
          limbName, 
          limbIndex: index,
          availableSpriteAttributes: Object.keys(sprite.$ || {})
        });
        return;
      }
      
      let sourceRect;
      try {
        sourceRect = sourceRectStr.split(',').map(val => parseFloat(val.trim()));
        if (sourceRect.length !== 4) {
          throw new Error(`Invalid SourceRect format: ${sourceRectStr}`);
        }
      } catch (parseError) {
        logLimbError('LimbParsing', limbId, parseError, { 
          limbName, 
          sourceRectStr,
          limbIndex: index 
        });
        return;
      }
      
      let [, , width, height] = sourceRect;
      let origin = [0.5, 0.5];
      
      if (originStr) {
        try {
          origin = originStr.split(',').map(val => parseFloat(val.trim()));
          if (origin.length !== 2) {
            logWarn('LimbParsing', `Invalid origin format for limb ${limbName}, using default`, { 
              originStr, 
              limbId 
            });
            origin = [0.5, 0.5];
          }
        } catch (parseError) {
          logWarn('LimbParsing', `Failed to parse origin for limb ${limbName}, using default`, { 
            originStr, 
            limbId,
            error: parseError.message 
          });
          origin = [0.5, 0.5];
        }
      }

      let scale = parseFloat(limb.$.Scale || limb.$.scale || 1);
      if (isNaN(scale)) {
        logWarn('LimbParsing', `Invalid scale value for limb ${limbName}, using default`, { 
          scaleValue: limb.$.Scale || limb.$.scale,
          limbId 
        });
        scale = 1;
      }
      
      const texturePath = processLimbTexturePath(textureStr, ragdoll.$.Texture || ragdoll.$.texture, gender);

      const limbData = {
        id: limbId,
        name: limbName,
        texture: texturePath,
        position: { x: 0, y: 0 },
        size: { width, height },
        origin: { x: origin[0], y: origin[1] },
        depth: parseFloat(depthStr || 0),
        rotation: parseFloat(0),
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
        
        // logInfo('LimbParsing', `Processed head limb`, { 
        //   limbId, 
        //   limbName,
        //   baseSize: [width, height]
        // });
      } else {
        limbData.sourceRect = sourceRect;
        
        // logInfo('LimbParsing', `Processed regular limb`, { 
        //   limbId, 
        //   limbName,
        //   sourceRect,
        //   size: { width, height }
        // });
      }
      
      parsedLimbs[limbData.id] = limbData;
      
    } catch (error) {
      logLimbError('LimbParsing', limbId, error, { 
        limbName, 
        limbIndex: index,
        limbData: limb 
      });
    }
  });

  // logInfo('LimbParsing', 'Processing head attachments', { 
  //   hasHeadAttachments: !!character.HeadAttachments,
  //   hasWearables: !!(character.HeadAttachments && character.HeadAttachments.Wearable)
  // });
  
  const newHeadAttachments = {};
  if (character.HeadAttachments && character.HeadAttachments.Wearable) {
      const wearables = Array.isArray(character.HeadAttachments.Wearable) 
          ? character.HeadAttachments.Wearable 
          : [character.HeadAttachments.Wearable];

      // logInfo('LimbParsing', 'Processing wearables', { 
      //   totalWearables: wearables.length,
      //   isArray: Array.isArray(character.HeadAttachments.Wearable)
      // });

      wearables.forEach((wearable, index) => {
          const type = wearable.$.type ? wearable.$.type.toLowerCase() : '';
          const tags = wearable.$.tags ? wearable.$.tags.split(',') : [];

          // logInfo('LimbParsing', `Processing wearable ${index + 1}/${wearables.length}`, { 
          //   type, 
          //   tags,
          //   wearableId: wearable.$.type 
          // });

          if (tags.length > 0 && !tags.includes(gender)) {
          //     logInfo('LimbParsing', `Skipping wearable due to gender mismatch`, { 
          //       type, 
          //       tags, 
          //       gender 
          //     });
              return;
          }

          if (!newHeadAttachments[type]) {
              newHeadAttachments[type] = [];
          }

          const sprite = wearable.sprite;
          if (sprite) {
              try {
                  const hasSheetIndex = sprite.$.sheetindex || sprite.$.SheetIndex;
                  const hasSourceRect = sprite.$.sourcerect || sprite.$.SourceRect;
                  
                  let sheetIndex, baseSize, sourceRect, origin;
                  
                  if (hasSheetIndex) {
                      try {
                          sheetIndex = (sprite.$.sheetindex || sprite.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim()));
                          if (sheetIndex.length !== 2) {
                              throw new Error(`Invalid sheetIndex format: ${sprite.$.sheetindex || sprite.$.SheetIndex}`);
                          }
                      } catch (parseError) {
                          logWarn('LimbParsing', `Failed to parse sheetIndex for wearable ${type}, using default`, { 
                              sheetIndexStr: sprite.$.sheetindex || sprite.$.SheetIndex,
                              error: parseError.message 
                          });
                          sheetIndex = [0, 0];
                      }
                      
                      const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
                      let headWidth = 128, headHeight = 128;
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
                      origin = headLimb ? [headLimb.origin.x, headLimb.origin.y] : [0.5, 0.5];
                      
                      // logInfo('LimbParsing', `Processed wearable with sheetIndex`, { 
                      //     type, 
                      //     sheetIndex, 
                      //     baseSize, 
                      //     sourceRect 
                      // });
                  } else if (hasSourceRect) {
                      try {
                          sourceRect = (sprite.$.sourcerect || sprite.$.SourceRect).split(',').map(val => parseFloat(val.trim()));
                          if (sourceRect.length !== 4) {
                              throw new Error(`Invalid sourceRect format: ${sprite.$.sourcerect || sprite.$.SourceRect}`);
                          }
                          origin = (sprite.$.origin || sprite.$.Origin || '0.5,0.5').split(',').map(val => parseFloat(val.trim()));
                          if (origin.length !== 2) {
                              logWarn('LimbParsing', `Invalid origin format for wearable ${type}, using default`, { 
                                  originStr: sprite.$.origin || sprite.$.Origin 
                              });
                              origin = [0.5, 0.5];
                          }
                          baseSize = [sourceRect[2], sourceRect[3]];
                          sheetIndex = null;
                          
                          // logInfo('LimbParsing', `Processed wearable with sourceRect`, { 
                          //     type, 
                          //     sourceRect, 
                          //     origin, 
                          //     baseSize 
                          // });
                      } catch (parseError) {
                          logWarn('LimbParsing', `Failed to parse sourceRect for wearable ${type}, using defaults`, { 
                              sourceRectStr: sprite.$.sourcerect || sprite.$.SourceRect,
                              error: parseError.message 
                          });
                          sheetIndex = [0, 0];
                          baseSize = [128, 128];
                          sourceRect = [0, 0, 128, 128];
                          origin = [0.5, 0.5];
                      }
                  } else {
                      sheetIndex = [0, 0];
                      baseSize = [128, 128];
                      sourceRect = [0, 0, 128, 128];
                      origin = [0.5, 0.5];
                      
                      // logInfo('LimbParsing', `Using default values for wearable ${type}`, { 
                      //     type, 
                      //     sheetIndex, 
                      //     baseSize, 
                      //     sourceRect, 
                      //     origin 
                      // });
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
                  
                  // logInfo('LimbParsing', `Successfully processed wearable`, { 
                  //     type, 
                  //     attachmentId: attachmentData.id,
                  //     attachmentName: attachmentData.name 
                  // });
              } catch (error) {
                  logError('LimbParsing', error, { 
                      wearableType: type, 
                      wearableIndex: index,
                      wearableData: wearable 
                  });
              }
          } else {
              logWarn('LimbParsing', `Missing sprite data for wearable ${type}`, { 
                  wearableType: type, 
                  wearableIndex: index 
              });
          }
      });
  }

  // logInfo('LimbParsing', 'Processing head sprites', { 
  //   hasHeads: !!character.Heads,
  //   hasHeadData: !!(character.Heads && character.Heads.Head)
  // });
  
  const parsedHeadSprites = [];
  if (character.Heads && character.Heads.Head) {
    const heads = Array.isArray(character.Heads.Head) ? character.Heads.Head : [character.Heads.Head];
    
    // logInfo('LimbParsing', 'Processing heads', { 
    //   totalHeads: heads.length,
    //   isArray: Array.isArray(character.Heads.Head)
    // });
    
    heads
      .filter(head => {
        if (head.$.tags) {
          const matches = head.$.tags.includes(gender);
          // logInfo('LimbParsing', `Filtering head by tags`, { 
          //   tags: head.$.tags, 
          //   gender, 
          //   matches 
          // });
          return matches;
        } else if (head.$.gender) {
          const matches = head.$.gender === gender;
          // logInfo('LimbParsing', `Filtering head by gender`, { 
          //   headGender: head.$.gender, 
          //   currentGender: gender, 
          //   matches 
          // });
          return matches;
        }
        logWarn('LimbParsing', `Head has no tags or gender, skipping`, { 
          headId: head.$.id,
          headData: head.$ 
        });
        return false;
      })
      .map((head, index) => {
        try {
          let headName;
          if (head.$.tags) {
            headName = `Head ${head.$.tags.split(',')[0]}`;
          } else if (head.$.id) {
            headName = `Head ${head.$.id}`;
          } else {
            headName = 'Head Unknown';
          }
          
          // logInfo('LimbParsing', `Processing head ${index + 1}`, { 
          //   headName, 
          //   headId: head.$.id,
          //   headTags: head.$.tags 
          // });
          
          const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
          let headWidth = 128, headHeight = 128;
          if (headLimb && headLimb.sourceRect) {
            headWidth = headLimb.sourceRect[2];
            headHeight = headLimb.sourceRect[3];
          }
          
          let sheetIndex;
          try {
            sheetIndex = (head.$.sheetindex || head.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim()));
            if (sheetIndex.length !== 2) {
              throw new Error(`Invalid sheetIndex format: ${head.$.sheetindex || head.$.SheetIndex}`);
            }
          } catch (parseError) {
            logWarn('LimbParsing', `Failed to parse sheetIndex for head ${headName}, using default`, { 
              sheetIndexStr: head.$.sheetindex || head.$.SheetIndex,
              error: parseError.message 
            });
            sheetIndex = [0, 0];
          }
          
          const headSprite = {
            name: headName,
            texture: convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', gender),
            sheetIndex: sheetIndex,
            baseSize: [headWidth, headHeight],
          };
          
          parsedHeadSprites.push(headSprite);
          
          // logInfo('LimbParsing', `Successfully processed head sprite`, { 
          //   headName, 
          //   sheetIndex, 
          //   baseSize: [headWidth, headHeight] 
          // });
          
          return headSprite;
        } catch (error) {
          logError('LimbParsing', error, { 
            headIndex: index,
            headData: head 
          });
          return null;
        }
      });
  }

  // logInfo('LimbParsing', 'Setting up head limb attachments');
  
  const headLimb = Object.values(parsedLimbs).find(l => l.name.includes('Head'));
  if (headLimb) {
      // logInfo('LimbParsing', 'Found head limb, setting up attachments', { 
      //   headLimbId: headLimb.id,
      //   headLimbName: headLimb.name 
      // });
      
      const exceptions = ['hair', 'beard', 'moustache'];
      for (const type in newHeadAttachments) {
          if (newHeadAttachments[type].length > 0) {
              const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
              if (exceptions.includes(type.toLowerCase())) {
                  headLimb[`selected${capitalizedType}`] = newHeadAttachments[type][0];
                  // logInfo('LimbParsing', `Set default ${type} attachment for head`, { 
                  //   type,
                  //   attachmentId: newHeadAttachments[type][0].id 
                  // });
              } else {
                  headLimb[`selected${capitalizedType}`] = null;
                  // logInfo('LimbParsing', `Set ${type} attachment to null for head`, { type });
              }
          }
      }
  } else {
      logWarn('LimbParsing', 'No head limb found, cannot set up attachments');
  }

  // logInfo('LimbParsing', 'Processing ragdoll joints');
  
  const ragdollJoints = Array.isArray(ragdoll.joint) ? ragdoll.joint : [ragdoll.joint];
  
  // logInfo('LimbParsing', 'Processing joints', { 
  //   totalJoints: ragdollJoints.length,
  //   isArray: Array.isArray(ragdoll.joint)
  // });
  
  const limbGraph = {};
  ragdollJoints.forEach((joint, index) => {
    try {
      const limb1Id = joint.$.Limb1 || joint.$.limb1;
      const limb2Id = joint.$.Limb2 || joint.$.limb2;
      
      if (!limb1Id || !limb2Id) {
        logWarn('LimbParsing', `Joint ${index} has missing limb IDs`, { 
          jointIndex: index,
          limb1Id, 
          limb2Id,
          jointData: joint.$ 
        });
        return;
      }
      
      if (!limbGraph[limb1Id]) limbGraph[limb1Id] = [];
      limbGraph[limb1Id].push({ joint, childId: limb2Id });
      
      // logInfo('LimbParsing', `Processed joint ${index + 1}/${ragdollJoints.length}`, { 
      //   jointIndex: index,
      //   limb1Id, 
      //   limb2Id 
      // });
    } catch (error) {
      logError('LimbParsing', error, { 
        jointIndex: index,
        jointData: joint 
      });
    }
  });

  // logInfo('LimbParsing', 'Calculating limb positions');
  
  const calculatedLimbPositions = {};
  const rootLimb = Object.values(parsedLimbs).find(l => l.type === 'Torso');
  
  if (rootLimb) {
      // logInfo('LimbParsing', 'Found root limb (Torso)', { 
      //   rootLimbId: rootLimb.id,
      //   rootLimbName: rootLimb.name 
      // });
      
      calculatedLimbPositions[rootLimb.id] = {
          position: { x: 400, y: 250 },
          rotation: rootLimb.rotation,
      };

      const queue = [rootLimb.id];
      const visited = new Set();
      visited.add(rootLimb.id);

      // logInfo('LimbParsing', 'Starting position calculation traversal');

      while (queue.length > 0) {
          const parentLimbId = queue.shift();
          const parentLimb = parsedLimbs[parentLimbId];
          const parentTransform = calculatedLimbPositions[parentLimbId];

          // logInfo('LimbParsing', `Processing parent limb for position calculation`, { 
          //   parentLimbId,
          //   parentLimbName: parentLimb.name,
          //   parentPosition: parentTransform.position 
          // });

          if (limbGraph[parentLimbId]) {
              limbGraph[parentLimbId].forEach(({ joint, childId }) => {
                  if (!visited.has(childId)) {
                      try {
                          const childLimb = parsedLimbs[childId];
                          if (!childLimb) {
                              logWarn('LimbParsing', `Child limb not found in parsed limbs`, { 
                                childId,
                                parentLimbId 
                              });
                              return;
                          }
                          
                          const limb1AnchorStr = joint.$.Limb1Anchor || joint.$.limb1anchor;
                          const limb2AnchorStr = joint.$.Limb2Anchor || joint.$.limb2anchor;
                          
                          if (!limb1AnchorStr || !limb2AnchorStr) {
                              logWarn('LimbParsing', `Joint missing anchor data`, { 
                                childId,
                                parentLimbId,
                                limb1AnchorStr,
                                limb2AnchorStr 
                              });
                              return;
                          }
                          
                          let limb1Anchor, limb2Anchor;
                          try {
                              limb1Anchor = limb1AnchorStr.split(',').map(val => parseFloat(val.trim()));
                              limb2Anchor = limb2AnchorStr.split(',').map(val => parseFloat(val.trim()));
                              
                              if (limb1Anchor.length !== 2 || limb2Anchor.length !== 2) {
                                  throw new Error('Invalid anchor format');
                              }
                          } catch (parseError) {
                              logWarn('LimbParsing', `Failed to parse anchor data`, { 
                                childId,
                                parentLimbId,
                                limb1AnchorStr,
                                limb2AnchorStr,
                                error: parseError.message 
                              });
                              return;
                          }

                          const scale1 = parentLimb.scale;
                          const childPosX = parentTransform.position.x + (limb1Anchor[0] - limb2Anchor[0]) * scale1;
                          const childPosY = parentTransform.position.y - (limb1Anchor[1] - limb2Anchor[1]) * scale1;

                          calculatedLimbPositions[childId] = {
                              position: { x: childPosX, y: childPosY },
                              rotation: childLimb.rotation,
                          };
                          
                          // logInfo('LimbParsing', `Calculated position for child limb`, { 
                            // childId,
                          //   childLimbName: childLimb.name,
                          //   position: { x: childPosX, y: childPosY },
                          //   parentLimbId 
                          // });
                          
                          queue.push(childId);
                          visited.add(childId);
                      } catch (error) {
                          logError('LimbParsing', error, { 
                            childId,
                            parentLimbId,
                            jointData: joint 
                          });
                      }
                  }
              });
          }
      }
      
      // logInfo('LimbParsing', 'Completed position calculation', { 
      //   calculatedPositions: Object.keys(calculatedLimbPositions).length 
      // });
  } else {
      logWarn('LimbParsing', 'No root limb (Torso) found, cannot calculate positions');
  }

  // logInfo('LimbParsing', 'Creating final limbs with calculated positions');
  
  const finalLimbs = Object.values(parsedLimbs).map(limb => {
      const calculated = calculatedLimbPositions[limb.id];
      const finalLimb = {
          ...limb,
          position: calculated ? calculated.position : limb.position,
          rotation: calculated ? calculated.rotation : limb.rotation,
      };
      
      if (calculated) {
          // logInfo('LimbParsing', `Applied calculated position to limb`, { 
          //   limbId: limb.id,
          //   limbName: limb.name,
          //   calculatedPosition: calculated.position 
          // });
      } else {
          logWarn('LimbParsing', `No calculated position for limb, using default`, { 
            limbId: limb.id,
            limbName: limb.name,
            defaultPosition: limb.position 
          });
      }
      
      return finalLimb;
  });

  // logInfo('LimbParsing', 'Successfully completed character data parsing', {
  //   totalLimbs: finalLimbs.length,
  //   totalJoints: ragdollJoints.length,
  //   totalHeadAttachments: Object.keys(newHeadAttachments).length,
  //   totalHeadSprites: parsedHeadSprites.length
  // });

  return { finalLimbs, ragdollJoints, newHeadAttachments, parsedHeadSprites };
};

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

  updateClothingSprite: (spriteName, updatedAttributes) => {
    set(state => ({
      clothingSprites: state.clothingSprites.map(sprite => 
        sprite.name === spriteName 
          ? { ...sprite, ...updatedAttributes } 
          : sprite
      )
    }));
  },

  // Async action for loading character data
  loadCharacter: async (gender) => {
    // logInfo('CharacterLoad', 'Starting character loading process', { gender });
    
    try {
      // logInfo('CharacterLoad', 'Attempting to load character data using primary method');
      const { character, ragdoll, mainTexture } = await loadCharacterData(gender);
      
      // logInfo('CharacterLoad', 'Successfully loaded character data, parsing and preparing');
      const { finalLimbs, ragdollJoints, newHeadAttachments, parsedHeadSprites } = parseAndPrepareCharacterData(character, ragdoll, gender);
      
      // logInfo('CharacterLoad', 'Successfully parsed character data, updating store', {
      //   limbsCount: finalLimbs.length,
      //   jointsCount: ragdollJoints.length,
      //   headAttachmentsCount: Object.keys(newHeadAttachments).length,
      //   headSpritesCount: parsedHeadSprites.length
      // });
      
      set({ 
        mainTexture, 
        limbs: finalLimbs, 
        joints: ragdollJoints, 
        headAttachments: newHeadAttachments, 
        headSprites: parsedHeadSprites 
      });
      
      // logInfo('CharacterLoad', 'Successfully loaded character using primary method', { gender });
    } catch (error) {
      logError('CharacterLoad', error, { 
        gender, 
        method: 'primary',
        errorMessage: error.message 
      });
      
      try {
        // logInfo('CharacterLoad', 'Primary method failed, attempting fallback method');
        const { character, ragdoll, mainTexture } = await loadCharacterDataFallback(gender);
        
        // logInfo('CharacterLoad', 'Successfully loaded character data using fallback, parsing and preparing');
        const { finalLimbs, ragdollJoints, newHeadAttachments, parsedHeadSprites } = parseAndPrepareCharacterData(character, ragdoll, gender);
        
        // logInfo('CharacterLoad', 'Successfully parsed character data using fallback, updating store', {
        //   limbsCount: finalLimbs.length,
        //   jointsCount: ragdollJoints.length,
        //   headAttachmentsCount: Object.keys(newHeadAttachments).length,
        //   headSpritesCount: parsedHeadSprites.length
        // });
        
        set({ 
          mainTexture, 
          limbs: finalLimbs, 
          joints: ragdollJoints, 
          headAttachments: newHeadAttachments, 
          headSprites: parsedHeadSprites 
        });
        
        // logInfo('CharacterLoad', 'Successfully loaded character using fallback method', { gender });
      } catch (fallbackError) {
        logError('CharacterLoad', fallbackError, { 
          gender, 
          method: 'fallback',
          errorMessage: fallbackError.message 
        });
        
        logWarn('CharacterLoad', 'Both primary and fallback methods failed, setting empty state');
        set({
          limbs: [],
          joints: [],
          headAttachments: {},
          headSprites: [],
        });
      }
    }
  },

  // Getters
  getSpriteData: () => {
    const { limbs, headAttachments, headSprites } = get();
    const bodySprites = limbs
      .filter(limb => limb.type !== 'Head')
      .map((limb) => ({
        name: limb.name,
        rect: {
          x: limb.sourceRect[0],
          y: limb.sourceRect[1],
          width: limb.sourceRect[2],
          height: limb.sourceRect[3],
        }
      }));

    const headSpriteData = {};
    if (headAttachments) {
      for (const type in headAttachments) {
        headAttachments[type].forEach(attachment => {
          if (!headSpriteData[attachment.texture]) {
            headSpriteData[attachment.texture] = [];
          }
          let rect;
          if (attachment.sourceRect) {
            rect = {
              x: attachment.sourceRect[0],
              y: attachment.sourceRect[1],
              width: attachment.sourceRect[2],
              height: attachment.sourceRect[3],
            };
          } else {
            rect = {
              x: attachment.sheetIndex[0] * attachment.baseSize[0],
              y: attachment.sheetIndex[1] * attachment.baseSize[1],
              width: attachment.baseSize[0],
              height: attachment.baseSize[1],
            };
          }
          headSpriteData[attachment.texture].push({ name: attachment.name, rect });
        });
      }
    }

    if (headSprites && headSprites.length > 0) {
      headSprites.forEach(sprite => {
        if (!headSpriteData[sprite.texture]) {
          headSpriteData[sprite.texture] = [];
        }
        headSpriteData[sprite.texture].push({
          name: sprite.name,
          rect: {
            x: sprite.sheetIndex[0] * sprite.baseSize[0],
            y: sprite.sheetIndex[1] * sprite.baseSize[1],
            width: sprite.baseSize[0],
            height: sprite.baseSize[1],
          }
        });
      });
    }

    return { bodySprites, headSpriteData };
  }
}));

export default useCharacterStore;