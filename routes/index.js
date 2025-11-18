const express = require('express');
const router = express.Router();

/**
 * Authentication middleware
 * Redirects to login if user is not authenticated
 */
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

/**
 * GET /
 * Home page - displays notes
 */
router.get('/', requireAuth, (req, res) => {
  const db = req.app.get('db');

  db.all(
    'SELECT id, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
    [req.session.userId],
    (err, notes) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Database error');
      }
      
      res.render('home', {
        notes: notes || [],
        sessionId: req.sessionID,
        title: 'Home - Pasteboard'
      });
    }
  );
});

module.exports = router;

