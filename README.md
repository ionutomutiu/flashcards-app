# Flashcard App

A React-based flashcard application with spaced repetition learning. Create flashcards with questions and answers, review them, and track your progress using proven spaced repetition intervals.

## Features

- **Add Flashcards**: Create flashcards with questions and answers
- **Spaced Repetition**: SM-2 scheduling, the algorithm behind classic Anki
  - **Again**: no new date at all — back into the current session, 150 cards later (usually the end)
  - **Hard / Good / Easy**: scheduled forward, the interval growing with each success
- **Bundled decks**: 2000 cards across four law subjects, loaded on first run
- **Daily new-card limit**: new cards are introduced gradually, per subject
- **Local Storage**: All data is saved in your browser's local storage
- **Card Tracking**: Only shows cards that are due for review
- **Clean UI**: Simple, intuitive interface

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

## How to Use

1. **Add Cards**: Click on "Add Card" tab and enter your question and answer
2. **Review Cards**: Switch to "Review Cards" tab to see cards due for review
3. **Study**: Click on a card to reveal the answer
4. **Rate Your Performance**: Select one of the four feedback buttons:
   - **Again** (Red): You struggled with this card - review it tomorrow
   - **Hard** (Orange): It was difficult - review in 2 days
   - **Good** (Green): You got it right - review in 4 days
   - **Easy** (Blue): Too easy - mark as completed

## Technical Details

### Project Structure

```
src/
├── components/
│   ├── AddCard.jsx          # Component for adding new flashcards
│   ├── FlashcardViewer.jsx  # Component for reviewing flashcards
│   └── UpdateCard.jsx       # Editing cards and managing subjects
├── data/
│   ├── seedCards.json       # Bundled decks extracted from the fiche PDFs
│   └── seedFolders.js       # First-run seeding
├── utils/
│   ├── flashcardUtils.js    # Storage, SM-2 scheduling, daily limits
│   └── sessionQueue.js      # In-session relearning queue
├── App.jsx                  # Main application component
└── App.css                  # Application styles
```

### Technologies Used

- React 19
- Vite 5
- Local Storage API
- CSS3

## Spaced Repetition Algorithm

The app implements SM-2. Each card carries an ease factor (starting at 2.5), an
interval and a repetition count:

| Rating | Effect |
| --- | --- |
| Again | ease −0.20 (once a day), repetitions reset, **schedule untouched** — the card stays due and returns 150 cards later in the session |
| Hard | ease −0.15, interval × 1.2 |
| Good | interval × ease |
| Easy | ease +0.15, interval × ease × 1.3 |

The first two successful repetitions use fixed learning steps (1 day, then 6),
after which intervals grow multiplicatively. Ease never drops below 1.3.

Again is deliberately not a scheduling event: a failed card keeps the date it
already had, so it stays in the queue until you actually pass it, however many
attempts that takes. Only Hard, Good and Easy move a card into the future.

Only cards due today or earlier enter the queue. Cards you have never seen are
introduced at a limited rate — set **New/day** on the review screen, per subject,
or 0 to lift the cap. Without it an imported deck is introduced all on one day,
and those cards then come back in waves rather than spread out.

Every answer is appended to the card's `reviews` log, which is what a later move
to FSRS would need.

## Bundled Decks

`src/data/seedCards.json` holds 2000 cards (500 each: Drept penal, Procedură
civilă, Procedură penală, Drept civil), extracted from the printed duplex fiche
sheets. They load on first run and land in one folder per subject. Seeding is
idempotent: each card keeps the `ref` it had on its sheet, so raising `version`
in that file tops the decks up without duplicating or disturbing your progress.

## Data Persistence

All flashcard data is stored in your browser's local storage. This means:
- Your cards persist across browser sessions
- Data is specific to your browser and device
- Clearing browser data will delete your cards
- No account or internet connection required

## Future Enhancements

Potential features for future versions:
- Export/import flashcard decks
- Statistics and progress tracking
- Categories/tags for cards
- Search and filter functionality
- More advanced spaced repetition algorithms
