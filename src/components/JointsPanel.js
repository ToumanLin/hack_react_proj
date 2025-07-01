import React, { useState } from 'react';

const JointsPanel = ({ joints, onConstruct, onConstructAll }) => {
  const [hoveredJoint, setHoveredJoint] = useState(null);

  return (
    <div style={{ background: '#2d2d2d', color: 'white', padding: '10px', width: '300px' }}>
      <h3>Joints</h3>
      <button onClick={onConstructAll} style={{ marginBottom: '10px' }}>
        Construct All Based on Torso
      </button>
      <ul>
        {joints.map((joint, index) => (
          <li 
            key={index} 
            style={{ marginBottom: '5px', position: 'relative' }} 
            onMouseEnter={() => setHoveredJoint(joint)}
            onMouseLeave={() => setHoveredJoint(null)}
          >
            <span>{`Joint ${joint.$.Limb1}-${joint.$.Limb2}`}</span>
            <button onClick={() => onConstruct(joint)} style={{ marginLeft: '10px' }}>
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
