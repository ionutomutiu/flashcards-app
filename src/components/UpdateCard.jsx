import { useState, useEffect } from 'react';
import { getFlashcards, updateFlashcardContent, deleteFlashcard, getFolders } from '../utils/flashcardUtils';

function UpdateCard({ onCardUpdated, selectedFolderId, onFolderChange }) {
  const [flashcards, setFlashcards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    setFolders(getFolders());
    loadFlashcards();
  }, []);

  useEffect(() => {
    loadFlashcards();
  }, [selectedFolderId]);

  const loadFlashcards = () => {
    const allCards = getFlashcards();
    const filteredCards = selectedFolderId
      ? allCards.filter(card => card.folderId === selectedFolderId)
      : allCards;
    setFlashcards(filteredCards);
    setSelectedCard(null);
    setQuestion('');
    setAnswer('');
  };

  const handleSelectCard = (card) => {
    setSelectedCard(card);
    setQuestion(card.question);
    setAnswer(card.answer);
  };

  const handleUpdate = (e) => {
    e.preventDefault();

    if (!selectedCard || !question.trim() || !answer.trim()) {
      alert('Please select a card and fill in both fields');
      return;
    }

    updateFlashcardContent(selectedCard.id, question.trim(), answer.trim());
    loadFlashcards();

    if (onCardUpdated) {
      onCardUpdated();
    }
  };

  const handleDelete = () => {
    if (!selectedCard) return;

    if (window.confirm('Are you sure you want to delete this card?')) {
      deleteFlashcard(selectedCard.id);
      loadFlashcards();

      if (onCardUpdated) {
        onCardUpdated();
      }
    }
  };

  const folderSelector = (
    <div className="folder-filter">
      <label htmlFor="edit-folder-filter">Subject:</label>
      <select
        id="edit-folder-filter"
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

  return (
    <div className="update-card">
      <h2>Edit Flashcards</h2>

      {folderSelector}

      <div className="card-selector">
        <h3>Select a card to edit:</h3>
        <div className="card-list">
          {flashcards.length === 0 ? (
            <p className="no-cards-message">No cards available. Add some cards first!</p>
          ) : (
            flashcards.map((card) => (
              <div
                key={card.id}
                className={`card-item ${selectedCard?.id === card.id ? 'selected' : ''}`}
                onClick={() => handleSelectCard(card)}
              >
                <div className="card-item-question">{card.question}</div>
                <div className="card-item-preview">{card.answer.substring(0, 50)}...</div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedCard && (
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label htmlFor="edit-question">Question:</label>
            <textarea
              id="edit-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the question"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-answer">Answer:</label>
            <textarea
              id="edit-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer"
              required
            />
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary">
              Update Card
            </button>
            <button
              type="button"
              className="btn btn-delete"
              onClick={handleDelete}
            >
              Delete Card
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default UpdateCard;
