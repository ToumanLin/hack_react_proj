import React, { useState } from 'react';
import useCharacterStore from '../store/characterStore';
import Panel from './Panel';
import './JointsPanel.css';

const JointsPanel = () => {
  const [hoveredJoint, setHoveredJoint] = useState(null);
  const { joints, limbs, setLimbs } = useCharacterStore();

  const handleUpdateLimb = (updatedLimb) => {
    setLimbs(limbs.map(limb => limb.id === updatedLimb.id ? updatedLimb : limb));
  };

  const onConstruct = (joint) => {
    const limb1 = limbs.find(l => l.id === (joint.$.Limb1 || joint.$.limb1));
    const limb2 = limbs.find(l => l.id === (joint.$.Limb2 || joint.$.limb2));

    if (!limb1 || !limb2) return;

    const scale1 = limb1.scale;
    const scale2 = limb2.scale;
    const limb1Anchor = (joint.$.Limb1Anchor || joint.$.limb1anchor).split(',').map(val => parseFloat(val.trim()));
    const limb2Anchor = (joint.$.Limb2Anchor || joint.$.limb2anchor).split(',').map(val => parseFloat(val.trim()));

    // Flip y axis
    const childPosX = limb1.position.x + limb1Anchor[0] * scale1 - limb2Anchor[0] * scale2;
    const childPosY = limb1.position.y - limb1Anchor[1] * scale1 + limb2Anchor[1] * scale2;

    const updatedLimb2 = { ...limb2, position: { x: childPosX, y: childPosY } };
    handleUpdateLimb(updatedLimb2);
  };

  const onConstructAll = () => {
    const rootLimb = limbs.find(l => l.type === 'Torso');
    if (!rootLimb) return;

    const limbGraph = {};
    joints.forEach(joint => {
        const limb1Id = joint.$.Limb1 || joint.$.limb1;
        const limb2Id = joint.$.Limb2 || joint.$.limb2;
        if (!limbGraph[limb1Id]) limbGraph[limb1Id] = [];
        limbGraph[limb1Id].push({ joint, childId: limb2Id });
    });

    const newLimbs = [...limbs];
    const queue = [rootLimb.id];
    const visited = new Set();
    visited.add(rootLimb.id);

    while (queue.length > 0) {
        const parentLimbId = queue.shift();
        const parentLimb = newLimbs.find(l => l.id === parentLimbId);

        if (limbGraph[parentLimbId]) {
            limbGraph[parentLimbId].forEach(({ joint, childId }) => {
                if (!visited.has(childId)) {
                    const childLimb = newLimbs.find(l => l.id === childId);
                    const limb1Anchor = (joint.$.Limb1Anchor || joint.$.limb1anchor).split(',').map(val => parseFloat(val.trim()));
                    const limb2Anchor = (joint.$.Limb2Anchor || joint.$.limb2anchor).split(',').map(val => parseFloat(val.trim()));

                    const scale1 = parentLimb.scale;
                    const scale2 = childLimb.scale;

                    const childPosX = parentLimb.position.x + limb1Anchor[0] * scale1 - limb2Anchor[0] * scale2;
                    const childPosY = parentLimb.position.y - limb1Anchor[1] * scale1 + limb2Anchor[1] * scale2;

                    const updatedChildLimb = { ...childLimb, position: { x: childPosX, y: childPosY } };
                    const index = newLimbs.findIndex(l => l.id === childId);
                    newLimbs[index] = updatedChildLimb;

                    queue.push(childId);
                    visited.add(childId);
                }
            });
        }
    }
    setLimbs(newLimbs);
  };

  return (
    <Panel 
      title="Joints" 
      isOpenInitially={false} 
      position={{ x: 0, y: 0 }}
      headerContent={
        <button onClick={onConstructAll} className="construct-all-button header-button">
          build
        </button>
      }
    >
      <div className="joints-panel-container">
        <ul className="joints-list">
          {joints.map((joint, index) => (
            <li
              key={index}
              className="joint-item"
              onMouseEnter={() => setHoveredJoint(joint)}
              onMouseLeave={() => setHoveredJoint(null)}
            >
              <span>{`Joint ${joint.$.Limb1 || joint.$.limb1}-${joint.$.Limb2 || joint.$.limb2}`}</span>
              <button onClick={() => onConstruct(joint)} className="construct-button">
                Construct
              </button>
              {hoveredJoint === joint && (
                <div className="joint-info">
                  <div>Limb1: {joint.$.Limb1Anchor || joint.$.limb1anchor}</div>
                  <div>Limb2: {joint.$.Limb2Anchor || joint.$.limb2anchor}</div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
};

export default JointsPanel;