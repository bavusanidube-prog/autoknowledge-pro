# AutoKnowledge Pro AI

AutoKnowledge Pro AI is a smart vehicle diagnostics web app built with Firebase Authentication and Cloud Firestore.

## Live Demo
https://bavusanidube-prog.github.io/autoknowledge-pro/

## Features
- Email and password authentication
- AI-style diagnostic analysis
- OBD fault code lookup
- Cloud report saving
- Personal report history
- Responsive dark dashboard UI

## Tech Stack
- HTML5
- CSS3
- JavaScript (ES Modules)
- Firebase Authentication
- Cloud Firestore
- GitHub Pages

## How It Works
1. Users create an account or log in
2. A vehicle fault symptom is selected
3. The app generates a likely diagnosis and recommended steps
4. Logged-in users can save reports to Firestore
5. Users can load their own saved report history

## Firebase Features Used
- Email/Password Authentication
- Firestore Database
- Firestore Security Rules

## Project Structure
```text
autoknowledge-pro/
├─ index.html
├─ styles.css
├─ app.js
├─ firebase.js
├─ firestore.rules
├─ .gitignore
└─ README.md