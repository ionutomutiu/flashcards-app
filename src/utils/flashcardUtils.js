import { seedFlashcards } from '../data/seedFolders.js';

const STORAGE_KEY = 'flashcards';
const FOLDERS_KEY = 'flashcard_folders';
const SETTINGS_KEY = 'flashcard_settings';

const DEFAULT_SETTINGS = {
  newPerDay: 20,  // per subject; 0 means no limit
};

export const getSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored ? JSON.parse(stored) : {}) };
};

export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getSettings(), ...settings }));
};

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

/**
 * The deck is held in memory and written back on a short delay.
 *
 * Every answer used to re-parse and re-serialise the whole deck; at 2000 cards
 * that is most of a megabyte of JSON per button press. Writes are coalesced,
 * and flushed on the way out so nothing is lost when the tab closes.
 */
let cache = null;
let flushTimer = null;

export const getFlashcards = () => {
  if (!cache) {
    const stored = localStorage.getItem(STORAGE_KEY);
    cache = (stored ? JSON.parse(stored) : []).map(normalizeCard);
  }
  return cache;
};

export const flushFlashcards = () => {
  if (flushTimer === null) return;
  clearTimeout(flushTimer);
  flushTimer = null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
};

export const saveFlashcards = (flashcards) => {
  cache = flashcards;
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }, 400);
};

if (typeof window !== 'undefined') {
  // Another tab writing the deck makes our copy stale.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) cache = null;
  });
  window.addEventListener('pagehide', flushFlashcards);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushFlashcards();
  });
}

/**
 * Ids are unique across cards and folders.
 *
 * Date.now() handed the same id to everything created inside one millisecond,
 * and findIndex then resolved every lookup to whichever came first — so editing
 * or deleting one card hit another.
 */
const nextId = () => {
  const ids = [...getFlashcards(), ...getFolders()].map(x => x.id).filter(Number.isFinite);
  return (ids.length ? Math.max(...ids) : 0) + 1;
};

// Cards created before SM-2 lack the scheduling fields; fill them in on read.
const normalizeCard = (card) => ({
  easeFactor: DEFAULT_EASE,
  interval: 0,
  repetitions: 0,
  reviews: [],
  relearning: false,
  ...card,
});

// Both helpers must read the same calendar: toISOString() is UTC, while
// getDate() is local, and mixing them shifts every due date by a day for
// anyone studying between midnight and the UTC offset.
const isoDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const today = () => isoDate(new Date());

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
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
    id: nextId(),
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
    id: nextId(),
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

  if (rating === 'again') {
    // A lapse is not a scheduling event. The card keeps the date it already
    // had, which leaves it due, and only gets a new one once you pass it — so
    // failing a card cannot push it out of today's queue.
    return {
      // Charged once per card per day: under these rules a card can come round
      // several times in one session, and each pass should not cut the ease.
      easeFactor: isRelearning(normalized)
        ? ease
        : Number(Math.max(MIN_EASE, ease + EASE_DELTA.again).toFixed(2)),
      repetitions: 0,
      interval: 0,
      nextReviewDate: normalized.nextReviewDate,
    };
  }

  ease = Math.max(MIN_EASE, ease + (EASE_DELTA[rating] ?? 0));
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
    // The retry has to outlive the in-memory queue, so it is recorded on the
    // card: a reload rebuilds the session with this card still in it.
    relearning: rating === 'again',
    relearningDate: rating === 'again' ? today() : null,
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
    relearning: false,
    nextReviewDate: today(),
  };

  saveFlashcards(flashcards);
  return flashcards[cardIndex];
};

/** A card failed earlier today, still owed a retry before the day is out. */
const isRelearning = (card) => Boolean(card.relearning) && card.relearningDate === today();

const isDue = (card) => {
  if (card.completed) return false;
  if (isRelearning(card)) return true;
  if (!card.nextReviewDate) return true;
  return card.nextReviewDate <= today();
};

const isNew = (card) => !card.repetitions && !card.reviews.length;

/**
 * Today's queue: everything due for review, plus a capped number of cards seen
 * for the first time.
 *
 * Without the cap, a freshly imported deck is introduced all on one day, and
 * from then on those cards travel as one convoy — arriving in waves instead of
 * spread out. The budget is per subject and counts cards already introduced
 * today, so it survives a reload mid-session.
 */
export const getDueFlashcards = (folderId = null) => {
  const flashcards = getFlashcards();
  const { newPerDay } = getSettings();
  const t = today();

  const inScope = folderId
    ? flashcards.filter(card => card.folderId === folderId)
    : flashcards;

  const due = inScope.filter(isDue);
  // Retries go last: a card you just failed is no use to you again immediately.
  const retries = due.filter(isRelearning);
  const first = due.filter(card => !isRelearning(card));

  // Oldest due date first, so the most overdue cards come back soonest.
  const toReview = first
    .filter(card => !isNew(card))
    .sort((a, b) => (a.nextReviewDate || '').localeCompare(b.nextReviewDate || ''));

  if (!newPerDay) {
    return [...toReview, ...first.filter(isNew).sort((a, b) => a.id - b.id), ...retries];
  }

  const introducedToday = {};
  for (const card of flashcards) {
    if (card.reviews.length && card.reviews[0].date === t) {
      const key = card.folderId ?? 'none';
      introducedToday[key] = (introducedToday[key] || 0) + 1;
    }
  }

  const budget = {};
  const fresh = [];
  for (const card of first.filter(isNew).sort((a, b) => a.id - b.id)) {
    const key = card.folderId ?? 'none';
    if (!(key in budget)) {
      budget[key] = Math.max(0, newPerDay - (introducedToday[key] || 0));
    }
    if (budget[key] > 0) {
      budget[key] -= 1;
      fresh.push(card);
    }
  }

  return [...toReview, ...fresh, ...retries];
};

/** Counts for the "nothing due" screen: what is waiting and when. */
export const getReviewStats = (folderId = null) => {
  const flashcards = getFlashcards();
  const cards = folderId
    ? flashcards.filter(card => card.folderId === folderId)
    : flashcards;

  const inQueue = new Set(getDueFlashcards(folderId).map(card => card.id));
  const held = cards.filter(card => !card.completed && isDue(card) && !inQueue.has(card.id));
  const scheduled = cards.filter(card => !card.completed && !isDue(card));
  const nextDate = scheduled
    .map(card => card.nextReviewDate)
    .sort()[0] || null;

  return {
    total: cards.length,
    due: inQueue.size,
    heldBack: held.length,
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
