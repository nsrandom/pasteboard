# Pasteboard

A Node.js + Express website with email/password authentication and text notes management, built with PicoCSS.

## Features

- Email/password authentication
- Text notes management (CRUD operations via API)
- Light and dark mode support
- SQLite database for accounts, sessions, and notes
- Session management
- RESTful API for notes
- Modern, responsive UI with PicoCSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (optional):
   - Copy `.env.example` to `.env` if you want to customize settings
   - Default values are provided in `.env.example`

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Web Interface

- Register a new account at `/register`
- Login at `/login`
- View your home page at `/` (requires authentication)
- Toggle between light and dark mode using the button in the top-right corner

### API Endpoints

All API endpoints require authentication via session ID in the request header. You can provide the session ID in one of two ways:

- `X-Session-ID: <session-id>` header
- `Authorization: Bearer <session-id>` header

#### Get All Notes
```bash
GET /api/notes
```

Returns a list of all notes for the authenticated user.

**Response:**
```json
{
  "notes": [
    {
      "id": 1,
      "content": "My first note",
      "created_at": "2024-01-01 12:00:00",
      "updated_at": "2024-01-01 12:00:00"
    }
  ]
}
```

#### Get a Specific Note
```bash
GET /api/notes/:id
```

Returns a specific note by ID (only if it belongs to the authenticated user).

**Response:**
```json
{
  "note": {
    "id": 1,
    "content": "My first note",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

#### Create a Note
```bash
POST /api/notes
Content-Type: application/json

{
  "content": "My new note"
}
```

Creates a new note for the authenticated user.

**Response:**
```json
{
  "note": {
    "id": 1,
    "content": "My new note",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 12:00:00"
  }
}
```

#### Update a Note
```bash
PUT /api/notes/:id
Content-Type: application/json

{
  "content": "Updated note content"
}
```

Updates an existing note (only if it belongs to the authenticated user).

**Response:**
```json
{
  "note": {
    "id": 1,
    "content": "Updated note content",
    "created_at": "2024-01-01 12:00:00",
    "updated_at": "2024-01-01 13:00:00"
  }
}
```

#### Delete a Note
```bash
DELETE /api/notes/:id
```

Deletes a note (only if it belongs to the authenticated user).

**Response:** 204 No Content

### Example API Usage

```bash
# Get session ID from browser cookies after logging in, then:

# Get all notes
curl -H "X-Session-ID: <your-session-id>" http://localhost:3000/api/notes

# Create a note
curl -X POST \
  -H "X-Session-ID: <your-session-id>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, world!"}' \
  http://localhost:3000/api/notes

# Update a note
curl -X PUT \
  -H "X-Session-ID: <your-session-id>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated content"}' \
  http://localhost:3000/api/notes/1

# Delete a note
curl -X DELETE \
  -H "X-Session-ID: <your-session-id>" \
  http://localhost:3000/api/notes/1
```

## Database

The application uses SQLite with three tables:
- `accounts`: Stores user email and password hash
- `sessions`: Stores active user sessions
- `notes`: Stores user notes with content, timestamps, and user association

The database file (`pasteboard.db`) will be created automatically on first run.

## Environment Variables

The application uses environment variables for configuration. See `.env.example` for available options:

- `PORT`: Server port (default: 3000)
- `DB_PATH`: Path to SQLite database file (default: ./pasteboard.db)
- `SESSION_SECRET`: Secret key for session encryption (change in production!)
- `SESSION_SECURE`: Set to `true` for HTTPS cookies (default: false)
- `SESSION_MAX_AGE`: Session expiration time in milliseconds (default: 86400000 = 24 hours)
- `BCRYPT_ROUNDS`: Number of bcrypt rounds for password hashing (default: 10)

