import React, { useState } from 'react';

const PropertiesPanel = ({ selectedLimb, onUpdate, headAttachments }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!selectedLimb) {
    return (
      // <div style={{ padding: '10px', width: '300px', color: 'white' }}>
      //   Select a limb to edit properties.
      // </div>
      <div style={{ padding: '10px', width: '200px', color: 'white', textAlign: 'left' }}>
        <h3 style={{ color: 'white', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
          Limb
          <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '3px'
          }}
        >
          {isCollapsed ? '+' : '-'}
        </button>
        </h3>
      </div>
    );
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

  const handleRemove = (type) => {
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    const selectedAttachmentKey = `selected${capitalizedType}`;
    onUpdate({ ...selectedLimb, [selectedAttachmentKey]: null });
  };

  return (
    <div style={{ padding: '10px', width: '200px', color: 'white', textAlign: 'left' }}>
      <h3 style={{ color: 'white', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
        {selectedLimb.name}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: '3px'
          }}
        >
          {isCollapsed ? '+' : '-'}
        </button>
      </h3>
      {!isCollapsed && (
        <>
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
                        {Object.keys(headAttachments).map(type => {
                            const attachments = headAttachments[type];
                            if (attachments.length === 0) return null;

                            const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
                            const selectedAttachmentKey = `selected${capitalizedType}`;

                            return (
                                <div key={type} style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>{capitalizedType}:</label>
                                    <select 
                                        name={selectedAttachmentKey} 
                                        onChange={handleChange} 
                                        value={selectedLimb[selectedAttachmentKey] ? selectedLimb[selectedAttachmentKey].id : ''}
                                    > 
                                        <option value="">None</option>
                                        {attachments.map(att => (
                                            <option key={att.id} value={att.id}>{att.name}</option> 
                                        ))}
                                    </select>
                                    <button onClick={() => handleRemove(type)} style={{ marginLeft: '10px' }}>Remove</button>
                                </div>
                            );
                        })}
                    </>
                )}
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;