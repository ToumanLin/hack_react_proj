import React, { useState } from 'react';

const PropertiesPanel = ({ selectedLimb, onUpdate }) => {
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



    const [group, prop] = name.split('.');
    onUpdate({
      ...selectedLimb,
      [group]: { ...selectedLimb[group], [prop]: parsedValue },
    });
  };



  return (
    <div style={{ padding: '8px', width: '200px', color: 'white', textAlign: 'left' }}>
      <h3 style={{ color: 'white', textAlign: 'left', display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '0 0 8px 0' }}>
        {selectedLimb.name}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            padding: '3px 8px',
            borderRadius: '3px',
            fontSize: '10px'
          }}
        >
          {isCollapsed ? '+' : '-'}
        </button>
      </h3>
      {!isCollapsed && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>Position X:</label>
            <input
              type="number"
              name="position.x"
              value={selectedLimb.position.x}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '3px',
                backgroundColor: '#3a3a3a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '2px',
                fontSize: '10px'
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>Position Y:</label>
            <input
              type="number"
              name="position.y"
              value={selectedLimb.position.y}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '3px',
                backgroundColor: '#3a3a3a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '2px',
                fontSize: '10px'
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>Depth (z-index):</label>
            <input
              type="number"
              name="depth"
              step="0.0001" 
              value={selectedLimb.depth}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '3px',
                backgroundColor: '#3a3a3a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '2px',
                fontSize: '10px'
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>Rotation:</label>
            <input
              type="number"
              name="rotation"
              value={selectedLimb.rotation}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '3px',
                backgroundColor: '#3a3a3a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '2px',
                fontSize: '10px'
              }}
            />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>Scale:</label>
            <input
              type="number"
              name="scale"
              step="0.1"
              value={selectedLimb.scale}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '3px',
                backgroundColor: '#3a3a3a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '2px',
                fontSize: '10px'
              }}
            />
          </div>
          {(selectedLimb.name.includes('Head') || selectedLimb.type === 'Hair' || selectedLimb.type === 'Beard' || selectedLimb.type === 'FaceAttachment') && selectedLimb.sheetIndex && (
            <>
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>Sheet Index X:</label>
                    <input
                    type="number"
                    name="sheetIndex[0]"
                    value={selectedLimb.sheetIndex[0]}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '3px',
                      backgroundColor: '#3a3a3a',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '2px',
                      fontSize: '10px'
                    }}
                    />
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>Sheet Index Y:</label>
                    <input
                    type="number"
                    name="sheetIndex[1]"
                    value={selectedLimb.sheetIndex[1]}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '3px',
                      backgroundColor: '#3a3a3a',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '2px',
                      fontSize: '10px'
                    }}
                    />
                </div>
            </>
          )}

        </>
      )}
    </div>
  );
};

export default PropertiesPanel;