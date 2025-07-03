import React, { useState } from 'react';

const JointsPanel = ({ joints, onConstruct, onConstructAll }) => {
  const [hoveredJoint, setHoveredJoint] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{ background: '#2d2d2d', color: 'white', padding: '8px', width: '200px', textAlign: 'left' }}>
      <h3 style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', fontSize: '12px', margin: '0 0 8px 0' }}>
        Joints
        <button onClick={onConstructAll} style={{ display: 'block', width: '30%', border: 'none', backgroundColor: '#555', color: 'white', cursor: 'pointer', fontSize: '10px', padding: '3px 6px' }}>
          Build
        </button>
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
          <button onClick={onConstructAll} style={{ marginBottom: '8px', display: 'block', width: '100%', padding: '6px 10px', border: 'none', backgroundColor: '#555', color: 'white', cursor: 'pointer', fontSize: '10px' }}>
            Construct All Based on Torso
          </button>
          <ul style={{ paddingLeft: '0', listStyle: 'none' }}>
            {joints.map((joint, index) => (
              <li 
                key={index} 
                style={{ marginBottom: '4px', position: 'relative', fontSize: '10px' }} 
                onMouseEnter={() => setHoveredJoint(joint)}
                onMouseLeave={() => setHoveredJoint(null)}
              >
                <span>{`Joint ${joint.$.Limb1 || joint.$.limb1}-${joint.$.Limb2 || joint.$.limb2}`}</span>
                <button onClick={() => onConstruct(joint)} style={{ marginLeft: '8px', padding: '3px 8px', border: 'none', backgroundColor: '#555', color: 'white', cursor: 'pointer', fontSize: '10px' }}>
                  Construct
                </button>
                {hoveredJoint === joint && (
                  <div style={{ position: 'absolute', left: '100%', top: 0, background: 'black', padding: '5px', zIndex: 1, fontSize: '10px' }}>
                    <div>Limb1: {joint.$.Limb1Anchor || joint.$.limb1anchor}</div>
                    <div>Limb2: {joint.$.Limb2Anchor || joint.$.limb2anchor}</div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default JointsPanel;
