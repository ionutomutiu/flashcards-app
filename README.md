# Flashcard App

A React-based flashcard application with spaced repetition learning. Create flashcards with questions and answers, review them, and track your progress using proven spaced repetition intervals.

## Features

- **Add Flashcards**: Create flashcards with questions and answers
- **Spaced Repetition**: Review cards based on your performance
  - **Again**: Review again tomorrow (1 day)
  - **Hard**: Review after 2 days
  - **Good**: Review after 4 days
  - **Easy**: Mark as completed (won't show again unless reset)
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
│   └── FlashcardViewer.jsx  # Component for reviewing flashcards
├── utils/
│   └── flashcardUtils.js    # LocalStorage utilities and spaced repetition logic
├── App.jsx                  # Main application component
└── App.css                  # Application styles
```

### Technologies Used

- React 19
- Vite 5
- Local Storage API
- CSS3

## Spaced Repetition Algorithm

The app implements a simplified spaced repetition algorithm:

- Cards start with a review date of "today"
- Based on your feedback, cards are scheduled for future review:
  - **Again**: +1 day
  - **Hard**: +2 days
  - **Good**: +4 days
  - **Easy**: Marked as completed (no future reviews unless manually reset)
- Only cards that are due for review (today or earlier) are shown in the review queue

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
- Card editing and deletion interface
