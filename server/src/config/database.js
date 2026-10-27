const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const initSQL = fs.readFileSync(
  path.join(__dirname, '../sql_scripts/init.sql'),
  'utf8'
);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Gagal konek SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ Terhubung ke SQLite:', dbPath);
});

const initializeDatabase = () => 
  new Promise((resolve, reject) => {
    db.exec(initSQL, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

/* ==========================================
 * Helper Promise untuk SQLite (Async/Await)
 * ========================================== */
const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

module.exports = { 
  db, 
  initializeDatabase,
  dbAll,
  dbGet,
  dbRun 
};