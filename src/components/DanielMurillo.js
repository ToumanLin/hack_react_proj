import React, {useEffect, useState} from 'react';
import Panel from './Panel';
import "./DanielMurillo.css";

const DanielMurillo = () => {

const [hue, setHue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHue(prevHue => (prevHue + 0.5) % 180);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const nameStyle = {
    color: `hsl(${hue}, 100%, 50%)`,
    transition: 'color 0.1s linear'
  };

  return (
    <Panel title="Contact Info" isOpenInitially={true} position={{ x: 905, y: 550 }}>
      <div className="daniel-murillo-container">
        <h1 className="daniel-murillo-name" style={nameStyle}>Daniel Murillo</h1>
        <br />
        <img src="/DanielMurillo.jpg" alt="Daniel Murillo" />
      </div>
      <div className="daniel-murillo-info">
        <h2>Mechanical Engineer</h2>
        <h3><i>UCLA</i></h3>
        <h4>Email: danielmurillo@g.ucla.edu</h4>
        <h4>Github: <a className="daniel-murillo-link" href="https://github.com/danielmurillo11">danielmurillo</a></h4>
      </div>
    </Panel>
  );
};

export default DanielMurillo;