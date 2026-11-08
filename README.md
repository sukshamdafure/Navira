# Cognify — AI Study Assistant

**Learn beyond limits.**

Cognify is a full-stack AI-powered study assistant designed to make learning easier and more effective. It helps students understand their study material through AI-generated summaries, concept explanations, and quizzes.

## Features

- **AI Notes Summarizer:** Convert lengthy study material into concise summaries.
- **AI Concept Explainer:** Understand difficult concepts through AI-generated explanations.
- **AI Quiz Generator:** Generate quizzes from your study material.
- **User Authentication:** Secure registration and login with password hashing and JWT authentication.
- **Study History:** Save, view, and delete previous learning sessions.
- **Personalized History:** Each user can access only their own study records.
- **Responsive Interface:** A clean, responsive dashboard for different screen sizes.

## Tech Stack

**Frontend**

- React.js
- Tailwind CSS
- Vite

**Backend**

- Node.js
- Express.js
- Google Gemini API

**Database and Security**

- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

## Project Structure

```text
Cognify/
├── public/
├── server/
│   ├── middleware/
│   ├── models/
│   ├── server.js
│   └── package.json
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB database
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/sukshamdafure/Cognify.git
cd Cognify
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Replace the placeholder values with your own credentials.

**Never upload your actual `.env` file or expose your API keys and secrets.**

### 5. Start the backend

From the `server` directory:

```bash
node server.js
```

### 6. Start the frontend

Open another terminal in the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Future Improvements

- Deployment for public access.
- Further improvements to the learning experience and user interface.

## Author

**Suksham Dafure**

Computer Science and Design Student

[GitHub](https://github.com/sukshamdafure)

---

_Built with the goal of making learning smarter, simpler, and more accessible._
