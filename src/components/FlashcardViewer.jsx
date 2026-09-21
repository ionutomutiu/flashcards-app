import { useState, useEffect } from 'react';
import { applyRating, queueCounts } from '../utils/sessionQueue';
import {
  getDueFlashcards,
  updateFlashcard,
  getFolders,
  getReviewStats,
  getSettings,
  saveSettings,
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
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState(null);
  const [newPerDay, setNewPerDay] = useState(getSettings().newPerDay);

  useEffect(() => {
    setFolders(getFolders());
  }, [refreshTrigger]);

  useEffect(() => {
    loadQueue();
  }, [refreshTrigger, selectedFolderId]);

  const loadQueue = () => {
    const folderId = selectedFolderId || null;
    setQueue(getDueFlashcards(folderId));
    setStats(getReviewStats(folderId));
    setIndex(0);
    setShowAnswer(false);
  };

  const handleFeedback = (rating) => {
    if (queue.length === 0) return;

    const card = queue[index];
    const updated = updateFlashcard(card.id, rating) || card;
    const next = applyRating(queue, index, rating, updated);

    if (index + 1 < next.length) {
      setQueue(next);
      setIndex(index + 1);
      setShowAnswer(false);
    } else {
      loadQueue();
    }
  };

  const handleNewPerDay = (value) => {
    const n = Math.max(0, Number(value) || 0);
    setNewPerDay(n);
    saveSettings({ newPerDay: n });
    loadQueue();
  };

  const controls = (
    <div className="review-controls">
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
      <div className="folder-filter">
        <label htmlFor="new-per-day">New/day:</label>
        <input
          id="new-per-day"
          type="number"
          min="0"
          className="new-per-day"
          value={newPerDay}
          onChange={(e) => handleNewPerDay(e.target.value)}
          title="New cards introduced per subject each day. 0 means no limit."
        />
      </div>
    </div>
  );

  if (queue.length === 0) {
    return (
      <div className="flashcard-viewer">
        {controls}
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
                  {stats.heldBack > 0 && (
                    <p className="hint">
                      {stats.heldBack} new card{stats.heldBack === 1 ? '' : 's'} held back by
                      the daily limit — they start tomorrow.
                    </p>
                  )}
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

  const currentCard = queue[index];
  const counts = queueCounts(queue, index);

  return (
    <div className="flashcard-viewer">
      {controls}
      <div className="progress">
        {counts.left} left
        {counts.relearning > 0 && (
          <span className="relearn-badge">{counts.relearning} to redo</span>
        )}
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
                {key === 'again'
                  ? 'this session'
                  : formatInterval(scheduleCard(currentCard, key).interval)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FlashcardViewer;
