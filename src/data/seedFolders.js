import seed from './seedCards.json';

const SEED_KEY = 'flashcard_seed_version';

/**
 * Loads the bundled decks (extracted from the printed fiches) on first run.
 *
 * Idempotent: each card carries the `ref` it had on its sheet, so re-running
 * after a partial import — or after a later seed version adds cards — tops the
 * decks up instead of duplicating them. Cards you add or edit are never touched.
 */
export function seedFlashcards({ getFolders, saveFolders, getFlashcards, saveFlashcards }) {
  const done = Number(localStorage.getItem(SEED_KEY) || 0);
  if (done >= seed.version) return null;

  const folders = getFolders();
  const cards = getFlashcards();
  const existing = new Set(cards.map(c => `${c.folderId}::${c.seedRef}`));
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  let id = Math.max(0, ...cards.map(c => c.id), ...folders.map(f => f.id)) + 1;
  let added = 0;

  for (const subject of seed.subjects) {
    let folder = folders.find(f => f.name.toLowerCase() === subject.name.toLowerCase());
    if (!folder) {
      folder = { id: id++, name: subject.name, createdAt: now };
      folders.push(folder);
    }
    for (const card of subject.cards) {
      if (existing.has(`${folder.id}::${card.ref}`)) continue;
      cards.push({
        id: id++,
        question: card.q,
        answer: card.a,
        folderId: folder.id,
        seedRef: card.ref,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        reviews: [],
        nextReviewDate: today,
        createdAt: now,
      });
      added += 1;
    }
  }

  saveFolders(folders);
  saveFlashcards(cards);
  localStorage.setItem(SEED_KEY, String(seed.version));
  return { added, subjects: seed.subjects.length };
}
