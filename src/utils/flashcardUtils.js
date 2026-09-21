import { seedFlashcards } from '../data/seedFolders.js';

const STORAGE_KEY = 'flashcards';
const FOLDERS_KEY = 'flashcard_folders';

// SM-2 tuning constants
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const EASE_DELTA = {
  again: -0.20,
  hard: -0.15,
  good: 0,
  easy: 0.15,
};
const HARD_MULTIPLIER = 1.2;
const EASY_BONUS = 1.3;

export const getFlashcards = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const cards = stored ? JSON.parse(stored) : [];
  return cards.map(normalizeCard);
};

export const saveFlashcards = (flashcards) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flashcards));
};

// Cards created before SM-2 lack the scheduling fields; fill them in on read.
const normalizeCard = (card) => ({
  easeFactor: DEFAULT_EASE,
  interval: 0,
  repetitions: 0,
  reviews: [],
  ...card,
});

const today = () => new Date().toISOString().split('T')[0];

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
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
    easeFactor: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    reviews: [],
    nextReviewDate: today(),
    createdAt: new Date().toISOString(),
  };
  flashcards.push(newCard);
  saveFlashcards(flashcards);
  return newCard;
};

/**
 * SM-2 scheduling. Returns the card's next state without persisting it, so the
 * UI can preview what each rating would do before the user commits.
 */
export const scheduleCard = (card, rating) => {
  const normalized = normalizeCard(card);
  let ease = normalized.easeFactor;
  let repetitions = normalized.repetitions;
  let interval = normalized.interval;

  ease = Math.max(MIN_EASE, ease + (EASE_DELTA[rating] ?? 0));

  if (rating === 'again') {
    // Lapse: back to the start of the learning steps.
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = rating === 'easy' ? 4 : 1;
    } else if (repetitions === 2) {
      interval = rating === 'easy' ? 8 : 6;
    } else {
      const multiplier = rating === 'hard'
        ? HARD_MULTIPLIER
        : rating === 'easy'
          ? ease * EASY_BONUS
          : ease;
      interval = Math.round(interval * multiplier);
    }
  }

  interval = Math.max(1, interval);

  return {
    easeFactor: Number(ease.toFixed(2)),
    repetitions,
    interval,
    nextReviewDate: addDays(interval),
  };
};

export const updateFlashcard = (id, rating) => {
  const flashcards = getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);

  if (cardIndex === -1) return;

  const card = flashcards[cardIndex];
  const next = scheduleCard(card, rating);

  flashcards[cardIndex] = {
    ...card,
    ...next,
    completed: false,
    lastReviewedAt: new Date().toISOString(),
    reviews: [
      ...card.reviews,
      {
        date: today(),
        rating,
        interval: next.interval,
        easeFactor: next.easeFactor,
      },
    ],
  };

  saveFlashcards(flashcards);
  return flashcards[cardIndex];
};

/** Puts a card (including one completed under the old scheme) back in rotation. */
export const resetFlashcard = (id) => {
  const flashcards = getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);

  if (cardIndex === -1) return;

  flashcards[cardIndex] = {
    ...flashcards[cardIndex],
    easeFactor: DEFAULT_EASE,
    interval: 0,
    repetitions: 0,
    completed: false,
    nextReviewDate: today(),
  };

  saveFlashcards(flashcards);
  return flashcards[cardIndex];
};

const isDue = (card) => {
  if (card.completed) return false;
  if (!card.nextReviewDate) return true;
  return card.nextReviewDate <= today();
};

export const getDueFlashcards = (folderId = null) => {
  const flashcards = getFlashcards();

  const folderFilteredCards = folderId
    ? flashcards.filter(card => card.folderId === folderId)
    : flashcards;

  // Oldest due date first, so the most overdue cards come back soonest.
  return folderFilteredCards
    .filter(isDue)
    .sort((a, b) => (a.nextReviewDate || '').localeCompare(b.nextReviewDate || ''));
};

/** Counts for the "nothing due" screen: what is waiting and when. */
export const getReviewStats = (folderId = null) => {
  const flashcards = getFlashcards();
  const cards = folderId
    ? flashcards.filter(card => card.folderId === folderId)
    : flashcards;

  const scheduled = cards.filter(card => !card.completed && !isDue(card));
  const nextDate = scheduled
    .map(card => card.nextReviewDate)
    .sort()[0] || null;

  return {
    total: cards.length,
    due: cards.filter(isDue).length,
    scheduled: scheduled.length,
    completed: cards.filter(card => card.completed).length,
    nextReviewDate: nextDate,
  };
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

/** Loads the bundled decks on first run; safe to call on every start. */
export const seedIfNeeded = () =>
  seedFlashcards({ getFolders, saveFolders, getFlashcards, saveFlashcards });

/** "1 day", "6 days", "1.4 mo", "2.1 yr" — Anki-style compact intervals. */
export const formatInterval = (days) => {
  if (days < 1) return '<1 day';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${(days / 30).toFixed(1)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
};
