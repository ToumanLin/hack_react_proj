import React from 'react';
import useCharacterStore from '../store/characterStore';
import Panel from './Panel';
import './GenderPanel.css';

const GenderPanel = () => {
  const { gender, availableGenders, setGender } = useCharacterStore();

  return (
    <Panel title="Gender" isOpenInitially={true} position={{ x: 0, y: 50 }}>
      <div className="gender-panel-container">
        {availableGenders.map(g => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`gender-button ${gender === g ? 'selected' : ''}`}>
            {g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}
      </div>
    </Panel>
  );
};

export default GenderPanel;
