import React, { useState, useEffect } from 'react';
import './App.scss';
import questionsData from './assets/turkeys.json';
import Intro from './components/intro';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function App() {
  // Always keep first question, shuffle the rest, take only 7 total
  const [questions] = useState(() => {
    const first = questionsData[0];
    const rest = shuffleArray(questionsData.slice(1));
    return [first, ...rest.slice(0, 6)]; // First question + 6 random = 7 total
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [visibleAnswers, setVisibleAnswers] = useState([]);
  const [timer, setTimer] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false); // New state to track if question was answered
  const [results, setResults] = useState([]);
  const [gameOver, setGameOver] = useState(true);
  const [canAnswer, setCanAnswer] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (!currentQuestion || gameOver) {
      return;
    }

    // Reset state for new question
    setSelectedAnswer(null);
    setAnswered(false); // Reset answered state
    setVisibleAnswers([]);
    setAnswers([]); // Clear answers immediately to prevent old images from showing
    setShowTimer(false);
    setTimer(10);
    setCanAnswer(false);

    // Small delay before creating new answers to ensure state is fully reset
    setTimeout(() => {
      // Create shuffled answers
      const allAnswers = [
        { image: currentQuestion.correctAnswer, isCorrect: true },
        ...currentQuestion.wrongAnswers.map(img => ({ image: img, isCorrect: false }))
      ];
      const shuffledAnswers = shuffleArray(allAnswers);
      setAnswers(shuffledAnswers);

      // Reveal answers one by one with random order, starting after 1 second delay
      const revealOrder = shuffleArray([0, 1, 2, 3]);
      revealOrder.forEach((index, i) => {
        setTimeout(() => {
          setVisibleAnswers(prev => [...prev, index]);
        }, 1000 + (i * 1000)); // Added 1000ms initial delay
      });

      // Start timer after all answers are visible and enable clicking
      setTimeout(() => {
        setShowTimer(true);
        setCanAnswer(true);
      }, 5000); // Updated to 5000ms (1000ms delay + 4000ms for reveals)
    }, 100); // Small delay to ensure clean slate
  }, [currentQuestionIndex, currentQuestion, gameOver]);

  useEffect(() => {
    if (showTimer && timer > 0 && !answered) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && !answered) {
      // Time's up - record as wrong
      handleAnswer(null, false);
    }
  }, [showTimer, timer, answered]);

  const handleAnswer = (answer, isCorrect) => {
    if (answered || !canAnswer) return;

    setSelectedAnswer(answer);
    setAnswered(true); // Mark as answered
    setResults(prev => [...prev, isCorrect]);

    // Blur the active button to remove focus/active state
    if (document.activeElement) {
      document.activeElement.blur();
    }

    // Move to next question after delay (2500ms for extra second)
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setGameOver(true);
      }
    }, 2500);
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setResults([]);
    setGameOver(false);
  };

  if (gameOver) {
    const correctCount = results.filter(r => r).length;
    return (
      <div className="game">
        {showIntro && <Intro onClose={() => setShowIntro(false)} />}
        <div className="game-results">
          <h1 className="game-results-title">What the Stuff?!</h1>
          <h2>They stuffed a What with a WHO!?</h2>
          {results.length > 0 && (<p className="game-results-score">
            You got <span>{correctCount}</span> out of <span>{questions.length}</span>!
          </p>)}
          <button className="game-restart" onClick={restartGame}>
            {results.length ? 'Play Again' : 'Let\'s Go!'}
          </button>
          <button className="game-restart game-restart--secondary" onClick={() => setShowIntro(true)}>
            Wait, What the Stuff?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      {showTimer && (
        <div className="game-timer">
          <span className="game-timer-value">{timer}</span>
        </div>
      )}

      <div className="game-clue">
        {!answered && <span>Find The:</span>}
        <div className="game-clue-text">{currentQuestion.clue}</div>
        {answered && (
          <div className="game-clue-description">{currentQuestion.description}</div>
        )}
      </div>

      <div className="game-answers">
        {answers.map((answer, index) => {
          const isVisible = visibleAnswers.includes(index);
          const isSelected = selectedAnswer === answer;
          const showResult = answered;

          return (
            <button
              key={index}
              className={`game-answer game-answer-${['tl', 'tr', 'bl', 'br'][index]} ${isVisible ? 'game-answer-visible' : ''
                } ${isSelected ? 'game-answer-selected' : ''} ${showResult && answer.isCorrect ? 'game-answer-correct' : ''
                } ${showResult && isSelected && !answer.isCorrect ? 'game-answer-wrong' : ''} ${!canAnswer ? 'game-answer-disabled' : ''
                }`}
              onClick={() => handleAnswer(answer, answer.isCorrect)}
              disabled={!canAnswer || answered}
            >
              {/* Only render img when this answer is visible */}
              {isVisible && <img src={answer.image} alt="Answer option" />}
            </button>
          );
        })}
      </div>

      <div className="game-score">
        {questions.map((_, index) => {
          const isAnswered = index < results.length;
          const isCorrect = isAnswered && results[index];

          return (
            <div
              key={index}
              className={`game-score-item ${!isAnswered ? 'game-score-item-pending' :
                isCorrect ? 'game-score-item-correct' :
                  'game-score-item-wrong'
                }`}
            >
              🦃
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;