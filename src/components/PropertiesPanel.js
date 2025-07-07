import React from 'react';
import useCharacterStore from '../store/characterStore';
import Panel from './Panel';
import './PropertiesPanel.css';

const PropertiesPanel = () => {
  const { selectedLimb, setLimbs, limbs } = useCharacterStore();

  const onUpdate = (updatedLimb) => {
    setLimbs(limbs.map(l => l.id === updatedLimb.id ? updatedLimb : l));
  };

  if (!selectedLimb) {
    return (
      <Panel title="Limb" isOpenInitially={true} position={{ x: 0, y: 360 }}>
        <div className="properties-panel-container" style={{color: '#ccc', marginTop: '10px', fontSize: '12px'}}>
          Select a limb to edit properties.
        </div>
      </Panel>
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
    <Panel title={selectedLimb.name} isOpenInitially={true} position={{ x: 0, y: 360 }}>
      <div className="properties-panel-container">
        <div className="property-row">
          <label className="property-label">Position X:</label>
          <input
            type="number"
            name="position.x"
            value={selectedLimb.position.x}
            onChange={handleChange}
            className="property-input"
          />
        </div>
        <div className="property-row">
          <label className="property-label">Position Y:</label>
          <input
            type="number"
            name="position.y"
            value={selectedLimb.position.y}
            onChange={handleChange}
            className="property-input"
          />
        </div>
        <div className="property-row">
          <label className="property-label">Depth (z-index):</label>
          <input
            type="number"
            name="depth"
            step="0.0001" 
            value={selectedLimb.depth}
            onChange={handleChange}
            className="property-input"
          />
        </div>
        <div className="property-row">
          <label className="property-label">Rotation:</label>
          <input
            type="number"
            name="rotation"
            value={selectedLimb.rotation}
            onChange={handleChange}
            className="property-input"
          />
        </div>
        <div className="property-row">
          <label className="property-label">Scale:</label>
          <input
            type="number"
            name="scale"
            step="0.1"
            value={selectedLimb.scale}
            onChange={handleChange}
            className="property-input"
          />
        </div>
      </div>
    </Panel>
  );
};

export default PropertiesPanel;
