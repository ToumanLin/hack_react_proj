import { create } from 'zustand';
import {
  loadCharacterData,
  loadCharacterDataFallback,
  processLimbTexturePath,
  processAttachmentTexturePath,
} from '../utils/pathUtils';
import { convertTexturePath } from '../utils/textureUtils';

const parseAndPrepareCharacterData = (character, ragdoll, gender) => {
  const parsedLimbs = {};
  const limbs = Array.isArray(ragdoll.limb) ? ragdoll.limb : [ragdoll.limb];
  
  limbs.forEach(limb => {
      const sprite = limb.sprite;
      const sourceRectStr = sprite.$.SourceRect || sprite.$.sourcerect;
      const originStr = sprite.$.Origin || sprite.$.origin;
      const depthStr = sprite.$.Depth || sprite.$.depth;
      const textureStr = sprite.$.Texture || sprite.$.texture;
      
      if (!sourceRectStr) {
        console.warn(`Missing SourceRect for limb ${limb.$.Name || limb.$.name}`);
        return;
      }
      
      let sourceRect = sourceRectStr.split(',').map(val => parseFloat(val.trim()));
      let [, , width, height] = sourceRect;
      let origin = [0.5, 0.5];
      if (originStr) {
          origin = originStr.split(',').map(val => parseFloat(val.trim()));
      }

      const scale = parseFloat(limb.$.Scale || limb.$.scale || 1);
      const texturePath = processLimbTexturePath(textureStr, ragdoll.$.Texture || ragdoll.$.texture, gender);

      const limbData = {
        id: limb.$.ID || limb.$.id,
        name: limb.$.Name || limb.$.name,
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
      } else {
          limbData.sourceRect = sourceRect;
      }
      parsedLimbs[limbData.id] = limbData;
    });

  const newHeadAttachments = {};
  if (character.HeadAttachments && character.HeadAttachments.Wearable) {
      const wearables = Array.isArray(character.HeadAttachments.Wearable) 
          ? character.HeadAttachments.Wearable 
          : [character.HeadAttachments.Wearable];

      wearables.forEach((wearable) => {
          const type = wearable.$.type ? wearable.$.type.toLowerCase() : '';
          const tags = wearable.$.tags ? wearable.$.tags.split(',') : [];

          if (tags.length > 0 && !tags.includes(gender)) {
              return;
          }

          if (!newHeadAttachments[type]) {
              newHeadAttachments[type] = [];
          }

          const sprite = wearable.sprite;
          if (sprite) {
              const hasSheetIndex = sprite.$.sheetindex || sprite.$.SheetIndex;
              const hasSourceRect = sprite.$.sourcerect || sprite.$.SourceRect;
              
              let sheetIndex, baseSize, sourceRect, origin;
              
              if (hasSheetIndex) {
                  sheetIndex = (sprite.$.sheetindex || sprite.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim()));
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
              } else if (hasSourceRect) {
                  sourceRect = (sprite.$.sourcerect || sprite.$.SourceRect).split(',').map(val => parseFloat(val.trim()));
                  origin = (sprite.$.origin || sprite.$.Origin || '0.5,0.5').split(',').map(val => parseFloat(val.trim()));
                  baseSize = [sourceRect[2], sourceRect[3]];
                  sheetIndex = null;
              } else {
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

  const parsedHeadSprites = [];
  if (character.Heads && character.Heads.Head) {
    const heads = Array.isArray(character.Heads.Head) ? character.Heads.Head : [character.Heads.Head];
    heads
      .filter(head => {
        if (head.$.tags) {
          return head.$.tags.includes(gender);
        } else if (head.$.gender) {
          return head.$.gender === gender;
        }
        return false;
      })
      .map(head => {
        let headName;
        if (head.$.tags) {
          headName = `Head ${head.$.tags.split(',')[0]}`;
        } else if (head.$.id) {
          headName = `Head ${head.$.id}`;
        } else {
          headName = 'Head Unknown';
        }
        
        const headLimb = Object.values(parsedLimbs).find(l => l.type === 'Head');
        let headWidth = 128, headHeight = 128;
        if (headLimb && headLimb.sourceRect) {
          headWidth = headLimb.sourceRect[2];
          headHeight = headLimb.sourceRect[3];
        }
        
        return parsedHeadSprites.push({
          name: headName,
          texture: convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', gender),
          sheetIndex: (head.$.sheetindex || head.$.SheetIndex || '0,0').split(',').map(val => parseFloat(val.trim())),
          baseSize: [headWidth, headHeight],
        });
      });
  }

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

  const ragdollJoints = Array.isArray(ragdoll.joint) ? ragdoll.joint : [ragdoll.joint];
  const limbGraph = {};
  ragdollJoints.forEach(joint => {
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
                      const limb1AnchorStr = joint.$.Limb1Anchor || joint.$.limb1anchor;
                      const limb2AnchorStr = joint.$.Limb2Anchor || joint.$.limb2anchor;
                      const limb1Anchor = limb1AnchorStr.split(',').map(val => parseFloat(val.trim()));
                      const limb2Anchor = limb2AnchorStr.split(',').map(val => parseFloat(val.trim()));

                      const scale1 = parentLimb.scale;
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

  const finalLimbs = Object.values(parsedLimbs).map(limb => {
      const calculated = calculatedLimbPositions[limb.id];
      return {
          ...limb,
          position: calculated ? calculated.position : limb.position,
          rotation: calculated ? calculated.rotation : limb.rotation,
      };
  });

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

  // Async action for loading character data
  loadCharacter: async (gender) => {
    try {
      const { character, ragdoll, mainTexture } = await loadCharacterData(gender);
      const { finalLimbs, ragdollJoints, newHeadAttachments, parsedHeadSprites } = parseAndPrepareCharacterData(character, ragdoll, gender);
      set({ 
        mainTexture, 
        limbs: finalLimbs, 
        joints: ragdollJoints, 
        headAttachments: newHeadAttachments, 
        headSprites: parsedHeadSprites 
      });
    } catch (error) {
      console.error('Error with new loading logic:', error);
      try {
        const { character, ragdoll, mainTexture } = await loadCharacterDataFallback(gender);
        const { finalLimbs, ragdollJoints, newHeadAttachments, parsedHeadSprites } = parseAndPrepareCharacterData(character, ragdoll, gender);
        set({ 
          mainTexture, 
          limbs: finalLimbs, 
          joints: ragdollJoints, 
          headAttachments: newHeadAttachments, 
          headSprites: parsedHeadSprites 
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
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