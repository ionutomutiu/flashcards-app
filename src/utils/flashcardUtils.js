const STORAGE_KEY = 'flashcards';

export const getFlashcards = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveFlashcards = (flashcards) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flashcards));
};

export const addFlashcard = (question, answer) => {
  const flashcards = getFlashcards();
  const newCard = {
    id: Date.now(),
    question,
    answer,
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

export const getDueFlashcards = () => {
  const flashcards = getFlashcards();
  const today = new Date().toISOString().split('T')[0];

  const dueCards = flashcards.filter(card => {
    // Skip completed cards
    if (card.completed) return false;

    // If no nextReviewDate, it's due
    if (!card.nextReviewDate) return true;

    // Check if due date is today or before
    return card.nextReviewDate <= today;
  });

  // If no cards are due, return all cards to keep practicing
  if (dueCards.length === 0) {
    return flashcards;
  }

  return dueCards;
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
