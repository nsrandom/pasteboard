const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

/**
 * Initialize the database with schema
 * @param {string} dbPath - Path to the database file
 * @returns {sqlite3.Database} - Database instance
 */
function initDatabase(dbPath) {
  const db = new sqlite3.Database(dbPath);
  
  // Read and execute schema SQL
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = schemaSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  db.serialize(() => {
    statements.forEach(statement => {
      if (statement) {
        db.run(statement, (err) => {
          if (err) {
            console.error('Error executing schema statement:', err);
            console.error('Statement:', statement);
          }
        });
      }
    });
  });
  
  return db;
}

module.exports = { initDatabase };
