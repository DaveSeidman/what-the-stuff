# What the Tuck? 🦃

A silly quiz game where players identify turducken-style creations by their punny names!

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add your images to the `src/assets/images/answers/` directory. The game expects these images based on `src/assets/turkeys.json`:
   - turkster.png
   - turkioli.png
   - turkrami.png
   - turkzilla.png
   - turkatouille.png
   - turkinator.png
   - turkonator.png
   - turk-n-roll.png
   - turkano.png
   - turkoccino.png

## Run the Game

### Development mode:
```bash
npm start
```
This will start the Vite dev server (usually at http://localhost:5173)

### Build for production:
```bash
npm build
```
This creates an optimized build in the `dist/` folder

### Preview production build:
```bash
npm preview
```

## Game Features

- 10 silly turkey combination questions
- Random question order each game
- Answers fade in one second apart in random positions
- 10-second countdown timer
- Score tracking with turkey emojis (✓ for correct, ✗ for wrong)
- Retro comic book aesthetic with bold colors and playful animations
- Designed for tablet landscape mode

## How to Play

1. A punny name appears in the center (e.g., "Turkster")
2. Four images fade in at the corners
3. Click the image that matches the combination described
4. Get points for correct answers!
5. Timer counts down from 10 - answer before it hits zero!

## Tech Stack

- **React** - Component-based UI
- **Vite** - Fast bundler and dev server
- **SCSS** - Styling with BEM notation
- **Google Fonts** - Bangers & Fredoka for that comic book vibe

Have fun! 🦃
