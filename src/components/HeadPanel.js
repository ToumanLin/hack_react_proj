import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';

const HeadPanel = ({ 
  gender, 
  headSprites, 
  headAttachments, 
  selectedHead, 
  selectedAttachments,
  onHeadChange,
  onAttachmentChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const draggableRef = useRef(null);

  const attachmentTypes = Object.keys(headAttachments || {});

  return (
    <Draggable nodeRef={draggableRef}>
      <div 
        ref={draggableRef}
        style={{ 
          position: 'absolute', 
          top: '130px',
          left: '0px',
          zIndex: 2000, 
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderRadius: '5px',
          maxWidth: '215px',
          color: 'white'
        }}
      >
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
          <div style={{ padding: '8px 10px 8px 10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Head Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', minWidth: '48px' }}>Head:</span>
                <select 
                  value={selectedHead || ''} 
                  onChange={(e) => onHeadChange(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '2px 4px',
                    backgroundColor: '#3a3a3a',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '3px',
                    fontSize: '10px',
                    minWidth: 0
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
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', minWidth: '48px', textTransform: 'capitalize' }}>
                      {type}:
                    </span>
                    <select 
                      value={selectedAttachment ? selectedAttachment.id : ''} 
                      onChange={(e) => {
                        const selected = attachments.find(att => att.id === e.target.value);
                        onAttachmentChange(type, selected);
                      }}
                      style={{
                        flex: 1,
                        padding: '2px 4px',
                        backgroundColor: '#3a3a3a',
                        color: 'white',
                        border: '1px solid #555',
                        borderRadius: '3px',
                        fontSize: '10px',
                        minWidth: 0
                      }}
                    >
                      <option value="">None</option>
                      {attachments.map((attachment, index) => (
                        <option key={index} value={attachment.id}>
                          {attachment.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default HeadPanel; 