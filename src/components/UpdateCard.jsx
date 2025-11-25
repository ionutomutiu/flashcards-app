import { useState, useEffect } from 'react';
import { getFlashcards, updateFlashcardContent, deleteFlashcard } from '../utils/flashcardUtils';

function UpdateCard({ onCardUpdated }) {
  const [flashcards, setFlashcards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = () => {
    const cards = getFlashcards();
    setFlashcards(cards);
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

  return (
    <div className="update-card">
      <h2>Edit Flashcards</h2>

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
