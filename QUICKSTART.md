# 🦃 What the Tuck? - Quick Start Guide

## Installation

1. Extract the files and navigate to the project:
```bash
cd what-the-tuck
```

2. Install dependencies:
```bash
npm install
```

3. **Replace placeholder images** (IMPORTANT!)
   - The game includes colorful placeholder images in `src/assets/images/answers/`
   - Replace these with your actual turkey combination photos
   - Keep the same filenames as listed in `src/assets/turkeys.json`

## Running the Game

**Development mode:**
```bash
npm start
```
Opens at http://localhost:5173

**Build for production:**
```bash
npm build
```
Creates optimized files in `dist/`

## Game Structure

```
what-the-tuck/
├── src/
│   ├── App.jsx              # Main game component
│   ├── App.scss             # Styles (BEM + retro comic aesthetic)
│   ├── main.jsx             # Entry point
│   └── assets/
│       ├── turkeys.json     # Questions & answers data
│       └── images/
│           └── answers/     # Your turkey images go here!
├── index.html
├── package.json
└── vite.config.js
```

## Customizing Questions

Edit `src/assets/turkeys.json` to add/modify questions:

```json
{
  "id": 11,
  "clue": "Turkizza",
  "description": "A turkey stuffed with pizza",
  "correctAnswer": "assets/images/answers/turkizza.png",
  "wrongAnswers": [
    "assets/images/answers/turkster.png",
    "assets/images/answers/turkioli.png",
    "assets/images/answers/turkonator.png"
  ]
}
```

## Features

✨ **10 hilarious turkey combinations**
🎲 **Random question & answer order each game**
⏱️ **10-second countdown timer**
🎯 **Score tracking with turkey emojis**
🎨 **Bold retro comic book aesthetic**
📱 **Optimized for tablet landscape mode**

## Tech Stack

- React 18
- Vite (super fast!)
- SCSS with BEM notation
- Google Fonts (Bangers & Fredoka)

---

Have fun and enjoy the tuck! 🦃
