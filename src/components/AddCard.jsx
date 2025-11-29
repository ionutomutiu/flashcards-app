import { useState, useEffect } from 'react';
import { addFlashcard, getFolders, addFolder } from '../utils/flashcardUtils';

function AddCard({ onCardAdded, selectedFolderId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [folderId, setFolderId] = useState(selectedFolderId);
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  useEffect(() => {
    setFolders(getFolders());
  }, []);

  useEffect(() => {
    setFolderId(selectedFolderId);
  }, [selectedFolderId]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folder = addFolder(newFolderName);
      if (folder) {
        setFolders(getFolders());
        setFolderId(folder.id);
        setNewFolderName('');
        setShowNewFolderInput(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim() && answer.trim()) {
      addFlashcard(question, answer, folderId || null);
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
          <label htmlFor="folder">Subject:</label>
          <div className="folder-select-wrapper">
            <select
              id="folder"
              value={folderId ? String(folderId) : ''}
              onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No folder</option>
              {folders.map(folder => (
                <option key={folder.id} value={String(folder.id)}>{folder.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-small btn-secondary"
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
            >
              {showNewFolderInput ? 'Cancel' : '+ New'}
            </button>
          </div>
          {showNewFolderInput && (
            <div className="new-folder-input">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateFolder())}
              />
              <button
                type="button"
                className="btn btn-small btn-primary"
                onClick={handleCreateFolder}
              >
                Create
              </button>
            </div>
          )}
        </div>
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
