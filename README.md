# Pasteboard

A Node.js + Express website with email/password authentication, built with PicoCSS.

## Features

- Email/password authentication
- Light and dark mode support
- SQLite database for accounts and sessions
- Session management
- Modern, responsive UI with PicoCSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

- Register a new account at `/register`
- Login at `/login`
- View your home page at `/` (requires authentication)
- Toggle between light and dark mode using the button in the top-right corner

## Database

The application uses SQLite with two tables:
- `accounts`: Stores user email and password hash
- `sessions`: Stores active user sessions

The database file (`pasteboard.db`) will be created automatically on first run.

