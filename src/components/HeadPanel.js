import React from 'react';
import useCharacterStore from '../store/characterStore';
import Panel from './Panel';
import './HeadPanel.css';

const HeadPanel = () => {
  const {
    headSprites,
    headAttachments,
    selectedHead,
    selectedAttachments,
    setSelectedHead,
    setSelectedAttachments,
    limbs,
    setLimbs,
  } = useCharacterStore();

  const attachmentTypes = Object.keys(headAttachments || {});

  const handleHeadChange = (e) => {
    const headName = e.target.value;
    setSelectedHead(headName);
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
        setLimbs(limbs.map(l => l.id === updatedHeadLimb.id ? updatedHeadLimb : l));
      }
    }
  };

  const handleAttachmentChange = (type, value) => {
    const attachments = headAttachments[type];
    const selected = attachments.find(att => att.id === value);
    setSelectedAttachments({ ...selectedAttachments, [type]: selected });

    const headLimb = limbs.find(l => l.name.includes('Head'));
      if (headLimb) {
        const updatedHeadLimb = {
          ...headLimb,
          [`selected${type.charAt(0).toUpperCase() + type.slice(1)}`]: selected
        };
        setLimbs(limbs.map(l => l.id === updatedHeadLimb.id ? updatedHeadLimb : l));
      }
  };

  return (
    <Panel title="Head Panel" isOpenInitially={true} position={{ x: 0, y: 130 }}>
      <div className="head-panel-container">
        {/* Head Selection */}
        <div className="head-panel-row">
          <span className="head-panel-label">Head:</span>
          <select 
            value={selectedHead || ''} 
            onChange={handleHeadChange}
            className="head-panel-select"
          >
            <option value="">Select Head</option>
            {headSprites && headSprites.map((head, index) => (
              <option key={index} value={head.name}>
                {head.name}
              </option>
            ))}
          </select>
        </div>

        {/* HeadAttachments Selection */}
        {attachmentTypes.map(type => {
          const attachments = headAttachments[type];
          const selectedAttachment = selectedAttachments[type];
          return (
            <div key={type} className="head-panel-row">
              <span className="head-panel-label">
                {type}:
              </span>
              <select 
                value={selectedAttachment ? selectedAttachment.id : ''} 
                onChange={(e) => handleAttachmentChange(type, e.target.value)}
                className="head-panel-select"
              >
                <option value="">None</option>
                {attachments.map((attachment, index) => (
                  <option key={index} value={attachment.id}>
                    {attachment.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

export default HeadPanel;