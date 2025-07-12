import React, { useEffect, useState } from 'react';
import Panel from './Panel';
import "./abrilzapata.css"; // Replace "Abril Zapata" with your actual name

const AbrilZapata = () => { // Replace "Abril Zapata" with your actual name
  const [hue, setHue] = useState(120); // Starting with green, you can change this
  
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
    <Panel title="Contact Info - Abril Zapata" isOpenInitially={true} position={{ x: 550, y: 550 }}>
      <div className="abril-zapata-container"> {/* Replace "your-name" with your actual name */}
        <h1 className="abril-zapata-name" style={nameStyle}>Abril Zapata</h1> {/* Replace with your actual name */}
        <br />
        <img src="/AbrilZapata.jpg" alt="Abril Zapata" /> {/* Replace with your actual photo filename */}
      </div>
      <div className="abril-zapata-info"> {/* Replace "your-name" with your actual name */}
        <h2>Mechanical Engineer</h2>
        <h3><i>El Camino College</i></h3> {/* Replace with your university */}
        <h4>Email: abrilcarizz@gmail.com</h4> {/* Replace with your email */}
        <h4>Github: <a className="Abril Zapata" href="https://github.com/acarizz">acarizz</a></h4> {/* Replace with your GitHub */}
      </div>
    </Panel>
  );
};

export default AbrilZapata; // Replace "Abril Zapata" with your actual name