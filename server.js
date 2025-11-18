require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = initDatabase(process.env.DB_PATH || './pasteboard.db');

// Make db available to routes
app.set('db', db);

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
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 7 * 24 * 60 * 60 * 1000 // 7 days default
  }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
app.use('/', indexRoutes);
app.use('/', authRoutes);

// API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

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

