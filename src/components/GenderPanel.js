import React, { useState } from 'react';

const GenderPanel = ({ onGenderChange, currentGender }) => {
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
        <button
          onClick={() => onGenderChange('male')}
          style={{
            backgroundColor: currentGender === 'male' ? '#4CAF50' : '#555',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            cursor: 'pointer',
            flex: '1',
            fontSize: '10px'
          }}
        >
          Male
        </button>
        <button
          onClick={() => onGenderChange('female')}
          style={{
            backgroundColor: currentGender === 'female' ? '#4CAF50' : '#555',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            cursor: 'pointer',
            flex: '1',
            fontSize: '10px'
          }}
        >
          Female
        </button>
      </div>
      )}
    </div>
  );
};

export default GenderPanel;
