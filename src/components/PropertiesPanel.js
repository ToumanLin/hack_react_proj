import React from 'react';

const PropertiesPanel = ({ selectedLimb, onUpdate, headAttachments }) => {
  if (!selectedLimb) {
    return <div style={{ padding: '10px' }}>Select a limb to edit properties.</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = parseFloat(value);

    if (name.startsWith('sheetIndex')) {
        const index = parseInt(name.split('[')[1].replace(']', ''), 10);
        const newSheetIndex = [...selectedLimb.sheetIndex];
        newSheetIndex[index] = parsedValue;
        onUpdate({ ...selectedLimb, sheetIndex: newSheetIndex });
        return;
    }

    if (name === 'rotation' || name === 'scale' || name === 'depth') { // Make depth editable again
        onUpdate({ ...selectedLimb, [name]: parsedValue });
        return;
    }

    if (name.startsWith('selected')) {
        const attachmentType = name.replace('selected', '').toLowerCase();
        const selectedAttachment = headAttachments[attachmentType].find(att => att.id === value); 
        onUpdate({ ...selectedLimb, [name]: selectedAttachment });
        return;
    }

    const [group, prop] = name.split('.');
    onUpdate({
      ...selectedLimb,
      [group]: { ...selectedLimb[group], [prop]: parsedValue },
    });
  };

  return (
    <div style={{ padding: '10px', width: '300px', color: 'white', textAlign: 'left' }}>
      <h3 style={{ color: 'white', textAlign: 'left' }}>{selectedLimb.name}</h3>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Position X:</label>
        <input
          type="number"
          name="position.x"
          value={selectedLimb.position.x}
          onChange={handleChange}
          // readOnly // Remove read-only
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Position Y:</label>
        <input
          type="number"
          name="position.y"
          value={selectedLimb.position.y}
          onChange={handleChange}
          // readOnly // Remove read-only
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Depth (z-index):</label>
        <input
          type="number"
          name="depth"
          step="0.0001" 
          value={selectedLimb.depth}
          onChange={handleChange}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Rotation:</label>
        <input
          type="number"
          name="rotation"
          value={selectedLimb.rotation}
          onChange={handleChange}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Scale:</label>
        <input
          type="number"
          name="scale"
          step="0.1"
          value={selectedLimb.scale}
          onChange={handleChange}
        />
      </div>
      {(selectedLimb.name.includes('Head') || selectedLimb.type === 'Hair' || selectedLimb.type === 'Beard' || selectedLimb.type === 'FaceAttachment') && selectedLimb.sheetIndex && (
        <>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Sheet Index X:</label>
                <input
                type="number"
                name="sheetIndex[0]"
                value={selectedLimb.sheetIndex[0]}
                onChange={handleChange}
                />
            </div>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Sheet Index Y:</label>
                <input
                type="number"
                name="sheetIndex[1]"
                value={selectedLimb.sheetIndex[1]}
                onChange={handleChange}
                />
            </div>
        </>
      )}
            {selectedLimb.name.includes('Head') && (
                <>
                    {headAttachments.hair.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Hair:</label>
                            <select name="selectedHair" onChange={handleChange} value={selectedLimb.selectedHair ? selectedLimb.selectedHair.id : ''}> 
                                <option value="">None</option>
                                {headAttachments.hair.map(hair => (
                                    <option key={hair.id} value={hair.id}>{hair.name}</option> 
                                ))}
                            </select>
                        </div>
                    )}
                    {headAttachments.beard.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Beard:</label>
                            <select name="selectedBeard" onChange={handleChange} value={selectedLimb.selectedBeard ? selectedLimb.selectedBeard.id : ''}> 
                                <option value="">None</option>
                                {headAttachments.beard.map(beard => (
                                    <option key={beard.id} value={beard.id}>{beard.name}</option> 
                                ))}
                            </select>
                        </div>
                    )}
                    {headAttachments.faceAttachment.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Face Attachment:</label>
                            <select name="selectedFaceAttachment" onChange={handleChange} value={selectedLimb.selectedFaceAttachment ? selectedLimb.selectedFaceAttachment.id : ''}> 
                                <option value="">None</option>
                                {headAttachments.faceAttachment.map(att => (
                                    <option key={att.id} value={att.id}>{att.name}</option> 
                                ))}
                            </select>
                        </div>
                    )}
                </>
            )}
    </div>
  );
};

export default PropertiesPanel;