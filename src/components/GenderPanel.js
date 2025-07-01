import React, { useState } from 'react';

const GenderPanel = ({ onGenderChange, currentGender }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{ background: '#2d2d2d', color: 'white', padding: '10px', width: '200px', textAlign: 'left' }}>
      <h3 style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
        Gender
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
        <div>
          <button 
            onClick={() => onGenderChange('male')} 
            style={{ marginRight: '10px', backgroundColor: currentGender === 'male' ? '#4CAF50' : '#555', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', display: 'block', width: '100%', marginBottom: '10px' }}
          >
            Male
          </button>
          <button 
            onClick={() => onGenderChange('female')}
            style={{ backgroundColor: currentGender === 'female' ? '#4CAF50' : '#555', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', display: 'block', width: '100%' }}
          >
            Female
          </button>
        </div>
      )}
    </div>
  );
};

export default GenderPanel;
