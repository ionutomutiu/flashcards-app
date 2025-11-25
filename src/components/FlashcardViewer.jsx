import { useState, useEffect } from 'react';
import { getDueFlashcards, updateFlashcard } from '../utils/flashcardUtils';

function FlashcardViewer({ refreshTrigger }) {
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    loadDueCards();
  }, [refreshTrigger]);

  const loadDueCards = () => {
    const cards = getDueFlashcards();
    setDueCards(cards);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const handleFeedback = (feedback) => {
    if (dueCards.length === 0) return;

    const currentCard = dueCards[currentIndex];
    updateFlashcard(currentCard.id, feedback);

    // Move to next card or reload
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // All cards reviewed
      loadDueCards();
    }
  };

  if (dueCards.length === 0) {
    return (
      <div className="flashcard-viewer">
        <div className="no-cards">
          <h2>No cards due for review!</h2>
          <p>Add new cards or come back later when cards are due.</p>
        </div>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <div className="flashcard-viewer">
      <div className="progress">
        Card {currentIndex + 1} of {dueCards.length}
      </div>

      <div className="flashcard" onClick={() => setShowAnswer(!showAnswer)}>
        <div className="flashcard-content">
          <h3>Question:</h3>
          <p className="question">{currentCard.question}</p>

          {showAnswer && (
            <div className="answer-section">
              <h3>Answer:</h3>
              <p className="answer">{currentCard.answer}</p>
            </div>
          )}

          {!showAnswer && (
            <p className="hint">Click to reveal answer</p>
          )}
        </div>
      </div>

      {showAnswer && (
        <div className="feedback-buttons">
          <button
            className="btn btn-again"
            onClick={() => handleFeedback('again')}
          >
            Again<br/>
            <span className="btn-subtext">1 day</span>
          </button>
          <button
            className="btn btn-hard"
            onClick={() => handleFeedback('hard')}
          >
            Hard<br/>
            <span className="btn-subtext">2 days</span>
          </button>
          <button
            className="btn btn-good"
            onClick={() => handleFeedback('good')}
          >
            Good<br/>
            <span className="btn-subtext">4 days</span>
          </button>
          <button
            className="btn btn-easy"
            onClick={() => handleFeedback('easy')}
          >
            Easy<br/>
            <span className="btn-subtext">Done</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default FlashcardViewer;
