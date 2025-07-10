import React from 'react';
import Panel from './Panel';
import './Title.css';

const Title = () => {
    return (
        <Panel title="Title" isOpenInitially={true} position={{ x: 220, y: 0 }}>
            <div className="title-container">
                <div className="title-text">Barotrauma Character Editor</div>
                <div className="title-links">
                    Github: <a className="title-link" href="https://github.com/ToumanLin/hack_react_proj">ToumanLin/hack_react_proj</a>
                </div>
            </div>
        </Panel>
    );
};

export default Title;