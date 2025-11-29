const STORAGE_KEY = 'flashcards';
const FOLDERS_KEY = 'flashcard_folders';

export const getFlashcards = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveFlashcards = (flashcards) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flashcards));
};

// Folder management functions
export const getFolders = () => {
  const stored = localStorage.getItem(FOLDERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveFolders = (folders) => {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
};

export const addFolder = (name) => {
  const folders = getFolders();
  const trimmedName = name.trim();
  if (!trimmedName || folders.some(f => f.name.toLowerCase() === trimmedName.toLowerCase())) {
    return null;
  }
  const newFolder = {
    id: Date.now(),
    name: trimmedName,
    createdAt: new Date().toISOString(),
  };
  folders.push(newFolder);
  saveFolders(folders);
  return newFolder;
};

export const deleteFolder = (folderId) => {
  const folders = getFolders();
  const filtered = folders.filter(f => f.id !== folderId);
  saveFolders(filtered);

  // Remove folder reference from cards in that folder
  const flashcards = getFlashcards();
  const updatedCards = flashcards.map(card =>
    card.folderId === folderId ? { ...card, folderId: null } : card
  );
  saveFlashcards(updatedCards);
};

export const addFlashcard = (question, answer, folderId = null) => {
  const flashcards = getFlashcards();
  const newCard = {
    id: Date.now(),
    question,
    answer,
    folderId,
    nextReviewDate: new Date().toISOString().split('T')[0], // Today
    createdAt: new Date().toISOString(),
  };
  flashcards.push(newCard);
  saveFlashcards(flashcards);
  return newCard;
};

export const updateFlashcard = (id, feedback) => {
  const flashcards = getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);

  if (cardIndex === -1) return;

  const today = new Date();
  let nextReviewDate;

  switch (feedback) {
    case 'again':
      // Show again tomorrow
      nextReviewDate = new Date(today);
      nextReviewDate.setDate(today.getDate() + 1);
      flashcards[cardIndex].nextReviewDate = nextReviewDate.toISOString().split('T')[0];
      break;
    case 'hard':
      // Show after 2 days
      nextReviewDate = new Date(today);
      nextReviewDate.setDate(today.getDate() + 2);
      flashcards[cardIndex].nextReviewDate = nextReviewDate.toISOString().split('T')[0];
      break;
    case 'good':
      // Show after 4 days
      nextReviewDate = new Date(today);
      nextReviewDate.setDate(today.getDate() + 4);
      flashcards[cardIndex].nextReviewDate = nextReviewDate.toISOString().split('T')[0];
      break;
    case 'easy':
      // Mark as completed (set to null or far future date)
      flashcards[cardIndex].nextReviewDate = null;
      flashcards[cardIndex].completed = true;
      break;
    default:
      break;
  }

  saveFlashcards(flashcards);
};

export const getDueFlashcards = (folderId = null) => {
  const flashcards = getFlashcards();
  const today = new Date().toISOString().split('T')[0];

  // Filter by folder if specified
  const folderFilteredCards = folderId
    ? flashcards.filter(card => card.folderId === folderId)
    : flashcards;

  const dueCards = folderFilteredCards.filter(card => {
    // Skip completed cards
    if (card.completed) return false;

    // If no nextReviewDate, it's due
    if (!card.nextReviewDate) return true;

    // Check if due date is today or before
    return card.nextReviewDate <= today;
  });

  // If no cards are due, return all folder-filtered cards to keep practicing
  if (dueCards.length === 0) {
    return folderFilteredCards.filter(card => !card.completed);
  }

  return dueCards;
};

export const getFlashcardsByFolder = (folderId) => {
  const flashcards = getFlashcards();
  if (!folderId) return flashcards;
  return flashcards.filter(card => card.folderId === folderId);
};

export const updateFlashcardContent = (id, question, answer) => {
  const flashcards = getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);

  if (cardIndex === -1) return;

  flashcards[cardIndex].question = question;
  flashcards[cardIndex].answer = answer;

  saveFlashcards(flashcards);
};

export const deleteFlashcard = (id) => {
  const flashcards = getFlashcards();
  const filtered = flashcards.filter(card => card.id !== id);
  saveFlashcards(filtered);
};
