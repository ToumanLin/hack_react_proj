import React, { useState } from 'react';

const GenderPanel = ({ onGenderChange, currentGender, availableGenders }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{ background: '#2d2d2d', color: 'white', padding: '8px', width: '200px', textAlign: 'left' }}>
      <h3 style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '0 0 8px 0' }}>
        Gender
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
        <div style={{ display: 'flex', gap: '8px' }}>
        {availableGenders.map(gender => (
          <button
            key={gender}
            onClick={() => onGenderChange(gender)}
            style={{
              backgroundColor: currentGender === gender ? '#4CAF50' : '#555',
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              cursor: 'pointer',
              flex: '1',
              fontSize: '10px'
            }}
          >
            {gender.charAt(0).toUpperCase() + gender.slice(1)}
          </button>
        ))}
      </div>
      )}
    </div>
  );
};

export default GenderPanel;
