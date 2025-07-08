import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import './Panel.css';

const Panel = ({ title, children, isOpenInitially = false, position, collapsedWidth, headerContent }) => {
  const [isCollapsed, setIsCollapsed] = useState(!isOpenInitially);
  const nodeRef = useRef(null);

  const panelStyle = {};
  if (isCollapsed && collapsedWidth) {
    panelStyle.width = collapsedWidth;
  }

  return (
    <Draggable nodeRef={nodeRef} defaultPosition={position} handle=".panel-header">
      <div
        ref={nodeRef}
        className="panel"
        style={panelStyle}
      >
        <div className="panel-header">
          <span>{title}</span>
          <div className="panel-header-content">{headerContent}</div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="panel-toggle-button"
          >
            {isCollapsed ? '+' : '-'}
          </button>
        </div>
        {!isCollapsed && (
          <div className="panel-content">
            {children}
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default Panel;