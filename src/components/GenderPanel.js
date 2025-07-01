import React from 'react';

const GenderPanel = ({ onGenderChange, currentGender }) => {
  return (
    <div style={{ background: '#2d2d2d', color: 'white', padding: '10px', width: '200px' }}>
      <h3>Gender</h3>
      <div>
        <button 
          onClick={() => onGenderChange('male')} 
          style={{ marginRight: '10px', backgroundColor: currentGender === 'male' ? '#4CAF50' : '#555', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer' }}
        >
          Male
        </button>
        <button 
          onClick={() => onGenderChange('female')}
          style={{ backgroundColor: currentGender === 'female' ? '#4CAF50' : '#555', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer' }}
        >
          Female
        </button>
      </div>
    </div>
  );
};

export default GenderPanel;
