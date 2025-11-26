import React from "react";
import "./index.scss";

export default function Intro({ onClose }) {

  return (
    <div className="intro-overlay" onClick={onClose}>
      <div className="intro" onClick={(e) => e.stopPropagation()}>
        <button className="intro__close" onClick={onClose}>×</button>

        <h2>What the Stuff?!</h2>

        <p>This game was invented to raise awareness of just how many animals need our help. Far too often animals are simply cooked on their own without first being stuffed inside other animals. The Turducken was a pioneer in its day but we need more options and ways to help these poor unstuffed animals.</p>

        <p>Do your best to identify these mythical creations and try to win big!</p>

        <p className="intro__history">The practice of "engastration" (stuffing one animal inside another) dates back centuries, with examples like a 1913 Spanish cookbook recipe and historical dishes from the Roman Empire.</p>

        <p>another digital stunt by <a href="http://daveseidman.com" target="_blank">Dave Seidman</a></p>
      </div>
    </div>
  );
}