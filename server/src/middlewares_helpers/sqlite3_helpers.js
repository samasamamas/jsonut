
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
    console.error('Gagal konek SQLite:', err.message);
    process.exit(1);
    return;
  }

  console.log('Terhubung ke SQLite:', dbPath);

  db.run('PRAGMA foreign_keys = ON', (pragmaError) => {
    if (pragmaError) {
      console.error(
        'Gagal mengaktifkan foreign key:',
        pragmaError.message
      );
      process.exit(1);
      return;
    }
  });
});

/* ==========================================
 * Helper Promise untuk SQLite
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
      else {
        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
      }
    });
  });
};

/* ==========================================
 * Inisialisasi database dan migrasi kolom
 * ========================================== */

const initializeDatabase = () =>
  new Promise((resolve, reject) => {
    db.get('PRAGMA foreign_keys', (pragmaError, row) => {
      if (pragmaError) {
        return reject(pragmaError);
      }

      if (row.foreign_keys !== 1) {
        return reject(
          new Error('Foreign key SQLite belum aktif')
        );
      }

      db.exec(initSQL, async (err) => {
        if (err) {
          return reject(err);
        }

        try {
          const columns = await dbAll(
            'PRAGMA table_info(products)'
          );

          const imageColumnExists = columns.some(
            (column) => column.name === 'image'
          );

          if (!imageColumnExists) {
            await dbRun(
              'ALTER TABLE products ADD COLUMN image TEXT DEFAULT NULL'
            );

            console.log('Kolom image berhasil ditambahkan');
          }

          resolve();
        } catch (migrationError) {
          reject(migrationError);
        }
      });
    });
  });

module.exports = {
  db,
  initializeDatabase,
  dbAll,
  dbGet,
  dbRun,
};
