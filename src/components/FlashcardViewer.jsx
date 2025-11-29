import { useState, useEffect } from 'react';
import { getDueFlashcards, updateFlashcard, getFolders } from '../utils/flashcardUtils';

function FlashcardViewer({ refreshTrigger, selectedFolderId, onFolderChange }) {
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    setFolders(getFolders());
  }, [refreshTrigger]);

  useEffect(() => {
    loadDueCards();
  }, [refreshTrigger, selectedFolderId]);

  const loadDueCards = () => {
    const cards = getDueFlashcards(selectedFolderId || null);
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

  const folderSelector = (
    <div className="folder-filter">
      <label htmlFor="folder-filter">Subject:</label>
      <select
        id="folder-filter"
        value={selectedFolderId ? String(selectedFolderId) : ''}
        onChange={(e) => onFolderChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">All folders</option>
        {folders.map(folder => (
          <option key={folder.id} value={String(folder.id)}>{folder.name}</option>
        ))}
      </select>
    </div>
  );

  if (dueCards.length === 0) {
    return (
      <div className="flashcard-viewer">
        {folderSelector}
        <div className="no-cards">
          <h2>No cards due for review!</h2>
          <p>{selectedFolderId ? 'No cards in this folder. Try selecting a different folder or add new cards.' : 'Add new cards or come back later when cards are due.'}</p>
        </div>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];
  const currentFolder = folders.find(f => f.id === currentCard.folderId);

  return (
    <div className="flashcard-viewer">
      {folderSelector}
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
