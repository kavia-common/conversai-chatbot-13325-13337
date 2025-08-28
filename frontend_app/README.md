# ConversAI Frontend (React)

A lightweight React app with a minimal, modern chat UI that integrates Perplexity for real-time AI responses.

## Features
- Real-time streaming AI responses (Perplexity API)
- User-friendly message interface with typing indicator
- Responsive layout with future-features sidebar
- Theme toggle (light/dark)

## Setup

1) Install dependencies
   npm install

2) Configure Perplexity API key
   - Copy .env.example to .env
   - Set REACT_APP_PERPLEXITY_API_KEY to your Perplexity API key (do NOT commit the real key)

3) Run the app
   npm start

The app will be available at http://localhost:3000

## Notes
- The API key is read from environment variables and must not be hardcoded.
- The Perplexity client streams responses using the /chat/completions endpoint.
- For production builds, ensure the environment is configured with REACT_APP_PERPLEXITY_API_KEY.
