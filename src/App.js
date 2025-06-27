import logo from './MatthewLee.jpg';
import './App.css';
import {useState, useEffect} from 'react';



//  function LikeButton() {
//     const [likes, setLikes] = useState(0);

//     function likeFunction() {
//       setLikes(likes + 1)
//     }

//     return (
//       <div>
//       <button onClick={likeFunction}>Like my page!</button>
//          <p>Likes: {likes}</p>
//       </div>
//     )
//  }

function LikeButton(props) {
    const [likes, setLikes] = useState(0);

    function likeFunction() {
      setLikes(likes + 1)
    }

    function changeTitleColor() {
    const titleElement = document.querySelector('.Title');
      if (likes >= 5) {
        titleElement.style.color = 'red';
      } 
    }

  useEffect(changeTitleColor, [likes]);
    return (
      <div>
      <button onClick={likeFunction}>{props.description}</button>
         <p>{props.count}: {likes}</p>
      </div>
    )
 }

function App() {
  // const [likes, setLikes] = useState(0); // Used in example 2

  // function likeFunction() {
  //   setLikes(likes + 1);  
  // }

  return (
    <div className="App">
      <header className="App-header">
        <p className="Title">
          Hi, I'm Matthew
        </p>
        <img src={logo} className="App-logo" alt="logo" />

        <a
          className="App-link"
          href="https://github.com/matthewlee22"
          target="_blank"
          rel="noopener noreferrer"
        >
          This is my github!
        </a>
         {/* <button>Like my page!</button>  */}
         {/* <div>
            <button onClick={likeFunction}>Like my page!</button>
            <p>Likes: {likes}</p>
         </div> */}
         {/* <LikeButton /> */}
         <LikeButton description="Follow my page!" count="Follows" />
      </header>
    </div>
  );
}

export default App;
