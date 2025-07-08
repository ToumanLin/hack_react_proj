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
    mainTexture,
    gender,
    loadCharacter,
    setSelectedLimb,
    setLimbs,
    getSpriteData,
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

  const { bodySprites, headSpriteData } = getSpriteData();

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
        position={{x: 600, y: 0}}
      />
      <GenericSpriteSheetViewer 
        title="Head Sprites"
        texture={headSheetTexture}
        sprites={headSpriteData[headSheetTexture] || []}
        isOpenInitially={false}
        position={{x: 600, y: 50}}
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