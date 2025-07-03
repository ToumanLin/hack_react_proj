import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';

const HeadPanel = ({ 
  gender, 
  headSprites, 
  headAttachments, 
  selectedHead, 
  selectedAttachments,
  onHeadChange,
  onAttachmentChange,
  onPositionAdjustment
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [positionAdjustments, setPositionAdjustments] = useState({
    hair: { x: 0, y: 0 },
    beard: { x: 0, y: 0 },
    moustache: { x: 0, y: 0 },
    faceattachment: { x: 0, y: 0 },
    husk: { x: 0, y: 0 },
    herpes: { x: 0, y: 0 },
    hat: { x: 0, y: 0 },
    mask: { x: 0, y: 0 }
  });
  const [globalOffset, setGlobalOffset] = useState({ x: 0, y: 0 });

  // Update position adjustments when they change
  useEffect(() => {
    // Apply global offset to all adjustments
    const adjustedPositions = {};
    Object.keys(positionAdjustments).forEach(type => {
      adjustedPositions[type] = {
        x: positionAdjustments[type].x + globalOffset.x,
        y: positionAdjustments[type].y + globalOffset.y
      };
    });
    onPositionAdjustment(adjustedPositions);
  }, [positionAdjustments, globalOffset, onPositionAdjustment]);

  const handlePositionChange = (type, axis, value) => {
    const newAdjustments = {
      ...positionAdjustments,
      [type]: {
        ...positionAdjustments[type],
        [axis]: parseFloat(value) || 0
      }
    };
    setPositionAdjustments(newAdjustments);
  };

  const handleGlobalOffsetChange = (axis, value) => {
    const newGlobalOffset = {
      ...globalOffset,
      [axis]: parseFloat(value) || 0
    };
    setGlobalOffset(newGlobalOffset);
  };

  const attachmentTypes = Object.keys(headAttachments || {});

  return (
    <Draggable>
      <div style={{ 
        position: 'absolute', 
        top: '50px', 
        left: '50px', 
        zIndex: 1000, 
        backgroundColor: '#2a2a2a',
        border: '1px solid #555',
        borderRadius: '5px',
        minWidth: '200px',
        color: 'white'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '8px', 
          cursor: 'default', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #555',
          backgroundColor: '#3a3a3a'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Head Panel</span>
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
        </div>

        {!isCollapsed && (
          <div style={{ padding: '10px' }}>
            {/* Global Offset */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                Head Attachments Global Offset:
                <br />
                For example: (8,5)
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '0.47fr 0.47fr', 
                gap: '5px',
                fontSize: '10px'
              }}>
                <div>
                  <label>X:</label>
                  <input
                    type="number"
                    value={globalOffset.x}
                    onChange={(e) => handleGlobalOffsetChange('x', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '3px',
                      backgroundColor: '#3a3a3a',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '2px',
                      fontSize: '10px'
                    }}
                  />
                </div>
                <div>
                  <label>Y:</label>
                  <input
                    type="number"
                    value={globalOffset.y}
                    onChange={(e) => handleGlobalOffsetChange('y', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '3px',
                      backgroundColor: '#3a3a3a',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '2px',
                      fontSize: '10px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Head Selection */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                Head:
              </label>
              <select 
                value={selectedHead || ''} 
                onChange={(e) => onHeadChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  backgroundColor: '#3a3a3a',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}
              >
                <option value="">Select Head</option>
                {headSprites && headSprites.map((head, index) => (
                  <option key={index} value={head.name}>
                    {head.name}
                  </option>
                ))}
              </select>
            </div>

            {/* HeadAttachments Selection */}
            {attachmentTypes.map(type => {
              const attachments = headAttachments[type];
              const selectedAttachment = selectedAttachments[type];
              
              return (
                <div key={type} style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {type}:
                  </label>
                  <select 
                    value={selectedAttachment ? selectedAttachment.id : ''} 
                    onChange={(e) => {
                      const selected = attachments.find(att => att.id === e.target.value);
                      onAttachmentChange(type, selected);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: '#3a3a3a',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '3px',
                      marginBottom: '3px',
                      fontSize: '10px'
                    }}
                  >
                    <option value="">None</option>
                    {attachments.map((attachment, index) => (
                      <option key={index} value={attachment.id}>
                        {attachment.name}
                      </option>
                    ))}
                  </select>

                  {/* Position Adjustment Controls */}
                  {selectedAttachment && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '0.47fr 0.47fr', 
                      gap: '5px',
                      fontSize: '10px'
                    }}>
                      <div>
                        <label>X Offset:</label>
                        <input
                          type="number"
                          value={positionAdjustments[type]?.x || 0}
                          onChange={(e) => handlePositionChange(type, 'x', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '3px',
                            backgroundColor: '#3a3a3a',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '2px',
                            fontSize: '10px'
                          }}
                        />
                      </div>
                      <div>
                        <label>Y Offset:</label>
                        <input
                          type="number"
                          value={positionAdjustments[type]?.y || 0}
                          onChange={(e) => handlePositionChange(type, 'y', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '3px',
                            backgroundColor: '#3a3a3a',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '2px',
                            fontSize: '10px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reset Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.47fr 0.47fr', gap: '5px', marginTop: '10px' }}>
              <button
                onClick={() => {
                  setPositionAdjustments({
                    hair: { x: 0, y: 0 },
                    beard: { x: 0, y: 0 },
                    moustache: { x: 0, y: 0 },
                    faceattachment: { x: 0, y: 0 },
                    husk: { x: 0, y: 0 },
                    herpes: { x: 0, y: 0 },
                    hat: { x: 0, y: 0 },
                    mask: { x: 0, y: 0 }
                  });
                }}
                style={{
                  padding: '6px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Reset Positions
              </button>
              <button
                onClick={() => {
                  setGlobalOffset({ x: 0, y: 0 });
                }}
                style={{
                  padding: '6px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Reset Global
              </button>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default HeadPanel; 