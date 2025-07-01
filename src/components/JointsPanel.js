import React from 'react';

const JointsPanel = ({ joints, onConstruct }) => {
  return (
    <div style={{ background: '#2d2d2d', color: 'white', padding: '10px', width: '300px' }}>
      <h3>Joints</h3>
      <ul>
        {joints.map((joint, index) => (
          <li key={index} style={{ marginBottom: '5px' }}>
            <span>{`Joint ${joint.$.Limb1}-${joint.$.Limb2}`}</span>
            <button onClick={() => onConstruct(joint)} style={{ marginLeft: '10px' }}>
              Construct
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JointsPanel;
