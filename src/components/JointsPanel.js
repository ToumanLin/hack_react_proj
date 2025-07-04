import React, { useState } from 'react';

const JointsPanel = ({ joints, onConstruct, onConstructAll }) => {
  const [hoveredJoint, setHoveredJoint] = useState(null);

  return (
    <div style={{ background: '#2d2d2d', color: 'white', padding: '10px', width: '300px', textAlign: 'left' }}>
      <h3 style={{ textAlign: 'left' }}>Joints</h3>
      <button onClick={onConstructAll} style={{ marginBottom: '10px', display: 'block', width: '100%', padding: '8px 12px', border: 'none', backgroundColor: '#555', color: 'white', cursor: 'pointer' }}>
        Construct All Based on Torso
      </button>
      <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
        {joints.map((joint, index) => (
          <li 
            key={index} 
            style={{ marginBottom: '5px', position: 'relative' }} 
            onMouseEnter={() => setHoveredJoint(joint)}
            onMouseLeave={() => setHoveredJoint(null)}
          >
            <span>{`Joint ${joint.$.Limb1}-${joint.$.Limb2}`}</span>
            <button onClick={() => onConstruct(joint)} style={{ marginLeft: '10px', padding: '5px 10px', border: 'none', backgroundColor: '#555', color: 'white', cursor: 'pointer' }}>
              Construct
            </button>
            {hoveredJoint === joint && (
              <div style={{ position: 'absolute', left: '100%', top: 0, background: 'black', padding: '5px', zIndex: 1 }}>
                <div>Limb1: {joint.$.Limb1Anchor}</div>
                <div>Limb2: {joint.$.Limb2Anchor}</div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JointsPanel;
