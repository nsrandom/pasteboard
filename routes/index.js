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
 * Home page - displays user email
 */
router.get('/', requireAuth, (req, res) => {
  const db = req.app.get('db');
  db.get('SELECT email FROM accounts WHERE id = ?', [req.session.userId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('home', { email: row.email, title: 'Home - Pasteboard' });
  });
});

module.exports = router;

