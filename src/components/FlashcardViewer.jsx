import { useState, useEffect } from 'react';
import {
  getDueFlashcards,
  updateFlashcard,
  getFolders,
  getReviewStats,
  scheduleCard,
  formatInterval,
} from '../utils/flashcardUtils';

const RATINGS = [
  { key: 'again', label: 'Again', className: 'btn-again' },
  { key: 'hard', label: 'Hard', className: 'btn-hard' },
  { key: 'good', label: 'Good', className: 'btn-good' },
  { key: 'easy', label: 'Easy', className: 'btn-easy' },
];

function FlashcardViewer({ refreshTrigger, selectedFolderId, onFolderChange }) {
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setFolders(getFolders());
  }, [refreshTrigger]);

  useEffect(() => {
    loadDueCards();
  }, [refreshTrigger, selectedFolderId]);

  const loadDueCards = () => {
    const folderId = selectedFolderId || null;
    setDueCards(getDueFlashcards(folderId));
    setStats(getReviewStats(folderId));
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const handleFeedback = (rating) => {
    if (dueCards.length === 0) return;

    updateFlashcard(dueCards[currentIndex].id, rating);

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      // Session finished — reload so the session-ends screen reflects reality.
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
          {stats && stats.total === 0 ? (
            <>
              <h2>No cards yet</h2>
              <p>
                {selectedFolderId
                  ? 'This subject is empty. Add some cards to get started.'
                  : 'Add your first card to get started.'}
              </p>
            </>
          ) : (
            <>
              <h2>All done for today!</h2>
              {stats && (
                <div className="review-stats">
                  <p>
                    {stats.scheduled} card{stats.scheduled === 1 ? '' : 's'} scheduled
                    {stats.nextReviewDate && `, next one on ${stats.nextReviewDate}`}
                  </p>
                  {stats.completed > 0 && (
                    <p className="hint">
                      {stats.completed} card{stats.completed === 1 ? '' : 's'} marked done
                      under the old scheme — reset them from the Edit Cards tab to bring
                      them back.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

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
          {RATINGS.map(({ key, label, className }) => (
            <button
              key={key}
              className={`btn ${className}`}
              onClick={() => handleFeedback(key)}
            >
              {label}<br />
              <span className="btn-subtext">
                {formatInterval(scheduleCard(currentCard, key).interval)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FlashcardViewer;
