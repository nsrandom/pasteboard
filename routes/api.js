const express = require('express');
const router = express.Router();

/**
 * Middleware to authenticate API requests using session ID from header
 * Expects session ID in X-Session-ID header or Authorization header as "Bearer <session_id>"
 */
function authenticateAPI(req, res, next) {
  const db = req.app.get('db');
  
  // Get session ID from header
  const sessionId = req.headers['x-session-id'] || 
                   (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                     ? req.headers.authorization.substring(7) 
                     : null);

  if (!sessionId) {
    return res.status(401).json({ error: 'Session ID required in X-Session-ID header or Authorization header' });
  }

  // Check if session exists and is valid
  db.get(
    'SELECT user_id, expires_at FROM sessions WHERE session_id = ? AND expires_at > datetime("now")',
    [sessionId],
    (err, row) => {
      if (err) {
        console.error('Database error during authentication:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      // Attach user ID to request for use in routes
      req.userId = row.user_id;
      next();
    }
  );
}

/**
 * GET /api/notes
 * Get all notes for the authenticated user
 */
router.get('/notes', authenticateAPI, (req, res) => {
  const db = req.app.get('db');
  
  db.all(
    'SELECT id, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
    [req.userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching notes:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ notes: rows });
    }
  );
});

/**
 * GET /api/notes/:id
 * Get a specific note by ID
 */
router.get('/notes/:id', authenticateAPI, (req, res) => {
  const db = req.app.get('db');
  const noteId = parseInt(req.params.id);

  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  db.get(
    'SELECT id, content, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?',
    [noteId, req.userId],
    (err, row) => {
      if (err) {
        console.error('Error fetching note:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.json({ note: row });
    }
  );
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/notes', authenticateAPI, (req, res) => {
  const db = req.app.get('db');
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  db.run(
    'INSERT INTO notes (user_id, content) VALUES (?, ?)',
    [req.userId, content],
    function(err) {
      if (err) {
        console.error('Error creating note:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Fetch the created note
      db.get(
        'SELECT id, content, created_at, updated_at FROM notes WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('Error fetching created note:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          res.status(201).json({ note: row });
        }
      );
    }
  );
});

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
router.put('/notes/:id', authenticateAPI, (req, res) => {
  const db = req.app.get('db');
  const noteId = parseInt(req.params.id);
  const { content } = req.body;

  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // First check if note exists and belongs to user
  db.get(
    'SELECT id FROM notes WHERE id = ? AND user_id = ?',
    [noteId, req.userId],
    (err, row) => {
      if (err) {
        console.error('Error checking note:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Update the note
      db.run(
        'UPDATE notes SET content = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?',
        [content, noteId, req.userId],
        function(err) {
          if (err) {
            console.error('Error updating note:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Fetch the updated note
          db.get(
            'SELECT id, content, created_at, updated_at FROM notes WHERE id = ?',
            [noteId],
            (err, row) => {
              if (err) {
                console.error('Error fetching updated note:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              res.json({ note: row });
            }
          );
        }
      );
    }
  );
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/notes/:id', authenticateAPI, (req, res) => {
  const db = req.app.get('db');
  const noteId = parseInt(req.params.id);

  if (isNaN(noteId)) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }

  // First check if note exists and belongs to user
  db.get(
    'SELECT id FROM notes WHERE id = ? AND user_id = ?',
    [noteId, req.userId],
    (err, row) => {
      if (err) {
        console.error('Error checking note:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Note not found' });
      }

      // Delete the note
      db.run(
        'DELETE FROM notes WHERE id = ? AND user_id = ?',
        [noteId, req.userId],
        function(err) {
          if (err) {
            console.error('Error deleting note:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.status(204).send();
        }
      );
    }
  );
});

module.exports = router;

