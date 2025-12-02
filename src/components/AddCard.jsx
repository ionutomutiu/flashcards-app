import { useState, useEffect } from 'react';
import { addFlashcard, getFolders, addFolder } from '../utils/flashcardUtils';

// Sanitize text by removing special characters added by iOS Safari
const sanitizeText = (text) => {
  return text
    .replace(/\u00A0/g, ' ')      // Non-breaking space
    .replace(/\u200B/g, '')       // Zero-width space
    .replace(/\u200C/g, '')       // Zero-width non-joiner
    .replace(/\u200D/g, '')       // Zero-width joiner
    .replace(/\uFEFF/g, '')       // Byte order mark
    .replace(/\u2028/g, '\n')     // Line separator
    .replace(/\u2029/g, '\n')     // Paragraph separator
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"'); // Smart double quotes
};

function AddCard({ onCardAdded, selectedFolderId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [folderId, setFolderId] = useState(selectedFolderId);
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const handlePaste = (e, setter) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const sanitized = sanitizeText(pastedText);
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    const newValue = currentValue.substring(0, start) + sanitized + currentValue.substring(end);
    setter(newValue);
  };

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
            onPaste={(e) => handlePaste(e, setQuestion)}
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
            onPaste={(e) => handlePaste(e, setAnswer)}
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
