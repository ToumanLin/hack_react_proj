import React, { useEffect, useState } from 'react';
import Panel from './Panel';
import "./ZesenZhang.css";

const ZesenZhang = () => {

  const [hue, setHue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHue(prevHue => (prevHue + 1) % 360);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const nameStyle = {
    color: `hsl(${hue}, 100%, 50%)`,
    transition: 'color 0.1s linear'
  };

  return (
    <Panel title="Contact Info" isOpenInitially={true} position={{ x: 220, y: 550 }}>
      <div className="zesen-zhang-container">
        <h1 className="zesen-zhang-name" style={nameStyle}>Zesen Zhang</h1>
        <br />
        <img src="/ZesenZhang.jpg" alt="Zesen Zhang" />
      </div>
      <div className="zesen-zhang-info">
        <h2>Aerospace Engineer</h2>
        <h3><i>UCLA</i></h3>
        <h4>Email: zixianz@g.ucla.edu</h4>
        <h4>Github: <a className="zesen-zhang-link" href="https://github.com/ToumanLin">zixianz</a></h4>
      </div>
    </Panel>
  );
};

export default ZesenZhang;