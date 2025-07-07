import React, { useEffect, useState } from 'react';
import Limb from './Limb';
import PropertiesPanel from './PropertiesPanel';
import JointsPanel from './JointsPanel';
import GenderPanel from './GenderPanel';
import GenericSpriteSheetViewer from './GenericSpriteSheetViewer';
import HeadPanel from './HeadPanel';
import ClothingManager from './ClothingManager';
import ClothSheetViewer from './ClothSheetViewer';
import useCharacterStore from '../store/characterStore';
import { convertTexturePath } from '../utils/textureUtils';

const Editor = () => {
  const {
    limbs,
    selectedLimb,
    headAttachments,
    headSprites,
    mainTexture,
    gender,
    loadCharacter,
    setSelectedLimb,
    setLimbs,
  } = useCharacterStore();

  const [headSheetTexture, setHeadSheetTexture] = useState('');

  useEffect(() => {
    loadCharacter(gender);
  }, [loadCharacter, gender]);

  useEffect(() => {
    const defaultTexture = convertTexturePath('Content/Characters/Human/Human_[GENDER]_heads.png', gender);
    setHeadSheetTexture(defaultTexture);
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
    setLimbs(limbs.map(limb => limb.id === finalLimb.id ? finalLimb : limb));
  };

  const handleSelectLimb = (limb) => {
    setSelectedLimb(limb);
  };

  const handleBackgroundClick = (e) => {
    if (e.target.classList.contains('editor-background')) {
      setSelectedLimb(null);
    }
  };

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

  const headTextureOptions = Object.keys(headSpriteData).map(texture => ({
    value: texture,
    label: texture.split('/').pop().replace('.png', '').replace(/_/g, ' '),
  }));

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
          />
        ))}
      </div>
      <PropertiesPanel />
      <JointsPanel />
      <GenderPanel />
      <GenericSpriteSheetViewer 
        title="Body Sprites"
        texture={mainTexture}
        sprites={bodySprites}
        isOpenInitially={false}
        position={{x: 600, y: 50}}
      />
      <GenericSpriteSheetViewer 
        title="Head Sprites"
        texture={headSheetTexture}
        sprites={headSpriteData[headSheetTexture] || []}
        isOpenInitially={true}
        position={{x: 600, y: 400}}
        textureOptions={headTextureOptions}
        selectedTexture={headSheetTexture}
        onTextureChange={(e) => setHeadSheetTexture(e.target.value)}
      />
      <HeadPanel />
      <ClothingManager />
      <ClothSheetViewer />
    </div>
  );
};

export default Editor;
