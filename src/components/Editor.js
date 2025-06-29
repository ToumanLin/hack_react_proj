import React, { useEffect, useState } from 'react';
import xml2js from 'xml2js';
import Limb from './Limb';
import PropertiesPanel from './PropertiesPanel';

const Editor = () => {
  const [limbs, setLimbs] = useState([]);
  const [selectedLimb, setSelectedLimb] = useState(null);

  useEffect(() => {
    const parseXML = async () => {
      try {
        const response = await fetch('/assets/HumanDefaultRagdoll.xml');
        const xmlText = await response.text();
        const parser = new xml2js.Parser();
        parser.parseString(xmlText, (err, result) => {
          if (err) {
            console.error('Error parsing XML:', err);
            return;
          }
          const ragdoll = result.Ragdoll;
          const gender = 'female';
          setLimbs(ragdoll.limb.map((limb, index) => {
            const sprite = limb.sprite[0];
            let sourceRect = sprite.$.SourceRect.split(',').map(Number);
            let [x, y, width, height] = sourceRect;
            let texturePath = sprite.$.Texture || ragdoll.$.Texture.replace('[GENDER]', gender);
            texturePath = texturePath.replace('Content/Characters/Human/', '/assets/');

            const limbData = {
              id: limb.$.ID,
              name: limb.$.Name,
              texture: texturePath,
              position: { x: 150 + (index * 10), y: 200 },
              size: { width, height },
              depth: Math.round(parseFloat(sprite.$.Depth) * 100),
              rotation: 0,
            };

            if (limb.$.Type === 'Head') {
                limbData.sheetIndex = [0, 0];
                limbData.baseSize = [width, height];
                limbData.sourceRect = [0, 0, width, height];
            } else {
                limbData.sourceRect = sourceRect;
            }

            return limbData;
          }));
        });
      } catch (error) {
        console.error('Error fetching or parsing XML:', error);
      }
    };

    parseXML();
  }, []);

  const handleUpdateLimb = (updatedLimb) => {
    let finalLimb = { ...updatedLimb };

    if (finalLimb.name.includes('Head') && finalLimb.sheetIndex) {
        const [baseWidth, baseHeight] = finalLimb.baseSize;
        finalLimb.sourceRect = [
            finalLimb.sheetIndex[0] * baseWidth,
            finalLimb.sheetIndex[1] * baseHeight,
            baseWidth,
            baseHeight
        ];
    }

    setSelectedLimb(finalLimb);
    setLimbs(limbs.map(limb => limb.id === finalLimb.id ? finalLimb : limb));
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#3e3e3e' }}>
        {limbs.map(limb => (
          <Limb
            key={limb.id}
            limb={limb}
            onUpdate={handleUpdateLimb}
            isSelected={selectedLimb && selectedLimb.id === limb.id}
          />
        ))}
      </div>
      <PropertiesPanel selectedLimb={selectedLimb} onUpdate={handleUpdateLimb} />
    </div>
  );
};

export default Editor;