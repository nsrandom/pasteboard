require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { initDatabase } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = initDatabase(process.env.DB_PATH || './pasteboard.db');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.SESSION_SECURE === 'true', // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours default
  }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Routes
app.get('/', requireAuth, (req, res) => {
  db.get('SELECT email FROM accounts WHERE id = ?', [req.session.userId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('home', { email: row.email, title: 'Home - Pasteboard' });
  });
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { error: null, title: 'Login - Pasteboard' });
});

app.post('/login', (req, res) => {
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
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
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

app.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('register', { error: null, title: 'Register - Pasteboard' });
});

app.post('/register', (req, res) => {
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
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      db.run(
        'INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)',
        [req.sessionID, this.lastID, expiresAt]
      );
      res.redirect('/');
    });
  });
});

app.post('/logout', (req, res) => {
  // Remove session from database
  db.run('DELETE FROM sessions WHERE session_id = ?', [req.sessionID]);
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});

