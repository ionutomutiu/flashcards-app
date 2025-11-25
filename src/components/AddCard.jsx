import { useState } from 'react';
import { addFlashcard } from '../utils/flashcardUtils';

function AddCard({ onCardAdded }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && answer.trim()) {
      addFlashcard(question, answer);
      setQuestion('');
      setAnswer('');
      if (onCardAdded) {
        onCardAdded();
      }
    }
  };

  return (
    <div className="add-card">
      <h2>Add New Flashcard</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="question">Question:</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question..."
            rows="3"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="answer">Answer:</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter the answer..."
            rows="3"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Add Card</button>
      </form>
    </div>
  );
}

export default AddCard;
