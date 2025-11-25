import { useState } from 'react';
import AddCard from './components/AddCard';
import FlashcardViewer from './components/FlashcardViewer';
import UpdateCard from './components/UpdateCard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('review');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCardAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('review');
  };

  const handleCardUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app">
      <header>
        <h1>Flashcard App</h1>
        <p className="subtitle">Learn with spaced repetition</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          Review Cards
        </button>
        <button
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Add Card
        </button>
        <button
          className={`tab ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit Cards
        </button>
      </nav>

      <main>
        {activeTab === 'review' ? (
          <FlashcardViewer refreshTrigger={refreshTrigger} />
        ) : activeTab === 'add' ? (
          <AddCard onCardAdded={handleCardAdded} />
        ) : (
          <UpdateCard onCardUpdated={handleCardUpdated} />
        )}
      </main>
    </div>
  );
}

export default App;
