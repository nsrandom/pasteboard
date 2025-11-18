const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

/**
 * GET /login
 * Display login page
 */
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { error: null, title: 'Login - Pasteboard' });
});

/**
 * POST /login
 * Handle user login
 */
router.post('/login', (req, res) => {
  const db = req.app.get('db');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email and password are required', title: 'Login - Pasteboard' });
  }

  db.get('SELECT id, email, password_hash FROM accounts WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error(err);
      return res.render('login', { error: 'Database error', title: 'Login - Pasteboard' });
    }

    if (!row) {
      return res.render('login', { error: 'Invalid email or password', title: 'Login - Pasteboard' });
    }

    bcrypt.compare(password, row.password_hash, (err, match) => {
      if (err) {
        console.error(err);
        return res.render('login', { error: 'Error verifying password', title: 'Login - Pasteboard' });
      }

      if (match) {
        req.session.userId = row.id;
        // Store session in database
        const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + sessionMaxAge).toISOString();
        db.run(
          'INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)',
          [req.sessionID, row.id, expiresAt]
        );
        res.redirect('/');
      } else {
        res.render('login', { error: 'Invalid email or password', title: 'Login - Pasteboard' });
      }
    });
  });
});

/**
 * GET /register
 * Display registration page
 */
router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('register', { error: null, title: 'Register - Pasteboard' });
});

/**
 * POST /register
 * Handle user registration
 */
router.post('/register', (req, res) => {
  const db = req.app.get('db');
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.render('register', { error: 'All fields are required', title: 'Register - Pasteboard' });
  }

  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match', title: 'Register - Pasteboard' });
  }

  if (password.length < 6) {
    return res.render('register', { error: 'Password must be at least 6 characters', title: 'Register - Pasteboard' });
  }

  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  bcrypt.hash(password, bcryptRounds, (err, hash) => {
    if (err) {
      console.error(err);
      return res.render('register', { error: 'Error hashing password', title: 'Register - Pasteboard' });
    }

    db.run('INSERT INTO accounts (email, password_hash) VALUES (?, ?)', [email, hash], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.render('register', { error: 'Email already registered', title: 'Register - Pasteboard' });
        }
        console.error(err);
        return res.render('register', { error: 'Database error', title: 'Register - Pasteboard' });
      }

      // Auto-login after registration
      req.session.userId = this.lastID;
      const sessionMaxAge = parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + sessionMaxAge).toISOString();
      db.run(
        'INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)',
        [req.sessionID, this.lastID, expiresAt]
      );
      res.redirect('/');
    });
  });
});

/**
 * POST /logout
 * Handle user logout
 */
router.post('/logout', (req, res) => {
  const db = req.app.get('db');
  // Remove session from database
  db.run('DELETE FROM sessions WHERE session_id = ?', [req.sessionID]);
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});

module.exports = router;

