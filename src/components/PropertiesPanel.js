
import React from 'react';

const PropertiesPanel = ({ selectedLimb, onUpdate }) => {
  if (!selectedLimb) {
    return <div style={{ padding: '10px' }}>Select a limb to edit properties.</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = parseInt(value, 10);

    if (name.startsWith('sheetIndex')) {
        const index = parseInt(name.split('[')[1].replace(']', ''), 10);
        const newSheetIndex = [...selectedLimb.sheetIndex];
        newSheetIndex[index] = parsedValue;
        onUpdate({ ...selectedLimb, sheetIndex: newSheetIndex });
        return;
    }

    if (name === 'rotation' || name === 'depth') {
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
    <div style={{ padding: '10px', borderLeft: '1px solid #ccc', width: '250px' }}>
      <h3>{selectedLimb.name}</h3>
      <div>
        <label>Position X:</label>
        <input
          type="number"
          name="position.x"
          value={selectedLimb.position.x}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Position Y:</label>
        <input
          type="number"
          name="position.y"
          value={selectedLimb.position.y}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Width:</label>
        <input
          type="number"
          name="size.width"
          value={selectedLimb.size.width}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Height:</label>
        <input
          type="number"
          name="size.height"
          value={selectedLimb.size.height}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Depth (z-index):</label>
        <input
          type="number"
          name="depth"
          value={selectedLimb.depth}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>Rotation:</label>
        <input
          type="number"
          name="rotation"
          value={selectedLimb.rotation}
          onChange={handleChange}
        />
      </div>
      {selectedLimb.name.includes('Head') && (
        <>
            <div>
                <label>Sheet Index X:</label>
                <input
                type="number"
                name="sheetIndex[0]"
                value={selectedLimb.sheetIndex[0]}
                onChange={handleChange}
                />
            </div>
            <div>
                <label>Sheet Index Y:</label>
                <input
                type="number"
                name="sheetIndex[1]"
                value={selectedLimb.sheetIndex[1]}
                onChange={handleChange}
                />
            </div>
        </>
      )}
    </div>
  );
};

export default PropertiesPanel;
