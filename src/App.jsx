import { useState, useEffect } from 'react';
import './App.scss';
import questionsData from './assets/turkeys.json';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function App() {
  const [questions] = useState(() => shuffleArray(questionsData));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [visibleAnswers, setVisibleAnswers] = useState([]);
  const [timer, setTimer] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [results, setResults] = useState([]);
  const [gameOver, setGameOver] = useState(true);
  const [canAnswer, setCanAnswer] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (!currentQuestion || gameOver) {
      return;
    }

    // Reset state for new question
    setSelectedAnswer(null);
    setVisibleAnswers([]);
    setShowTimer(false);
    setTimer(10);
    setCanAnswer(false);

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
  }, [currentQuestionIndex, currentQuestion, gameOver]);

  useEffect(() => {
    if (showTimer && timer > 0 && selectedAnswer === null) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && selectedAnswer === null) {
      // Time's up - record as wrong
      handleAnswer(null, false);
    }
  }, [showTimer, timer, selectedAnswer]);

  const handleAnswer = (answer, isCorrect) => {
    if (selectedAnswer !== null || !canAnswer) return;

    setSelectedAnswer(answer);
    setResults(prev => [...prev, isCorrect]);

    // Blur the active button to remove focus/active state
    if (document.activeElement) {
      document.activeElement.blur();
    }

    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setGameOver(true);
      }
    }, 1500);
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
        <div className="game__results">
          <h1 className="game__results-title">What the Stuff?!</h1>
          {results.length > 0 && (<p className="game__results-score">
            You got <span>{correctCount}</span> out of <span>{questions.length}</span>!
          </p>)}
          <button className="game__restart" onClick={restartGame}>
            {results.length ? 'Play Again' : 'Let\'s Go!'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      {showTimer && (
        <div className="game__timer">
          <span className="game__timer-value">{timer}</span>
        </div>
      )}

      <div className="game__clue">
        <div className="game__clue-text">{currentQuestion.clue}</div>
        {selectedAnswer !== null && (
          <div className="game__clue-description">{currentQuestion.description}</div>
        )}
      </div>

      <div className="game__answers">
        {answers.map((answer, index) => {
          const isVisible = visibleAnswers.includes(index);
          const isSelected = selectedAnswer === answer;
          const showResult = selectedAnswer !== null;

          return (
            <button
              key={index}
              className={`game__answer game__answer--${['tl', 'tr', 'bl', 'br'][index]} ${isVisible ? 'game__answer--visible' : ''
                } ${isSelected ? 'game__answer--selected' : ''} ${showResult && answer.isCorrect ? 'game__answer--correct' : ''
                } ${showResult && isSelected && !answer.isCorrect ? 'game__answer--wrong' : ''} ${!canAnswer ? 'game__answer--disabled' : ''}`}
              onClick={() => handleAnswer(answer, answer.isCorrect)}
              disabled={!canAnswer || selectedAnswer !== null}
            >
              <img src={answer.image} alt="Answer option" />
            </button>
          );
        })}
      </div>

      <div className="game__score">
        {questions.map((_, index) => {
          const isAnswered = index < results.length;
          const isCorrect = isAnswered && results[index];

          return (
            <div
              key={index}
              className={`game__score-item ${!isAnswered ? 'game__score-item--pending' :
                  isCorrect ? 'game__score-item--correct' :
                    'game__score-item--wrong'
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