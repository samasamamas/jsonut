
const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');
const bcrypt = require('bcrypt');

/* =============== READ (all) =============== */
const findAllUsers = async () => {
  return await dbAll(`
    SELECT id, full_name, email, role, created_at
    FROM users
    ORDER BY id DESC
  `);
};

/* =============== READ (by id) =============== */
const findUserById = async (id) => {
  return await dbGet(`
    SELECT id, full_name, email, role, created_at
    FROM users
    WHERE id = ?
  `, [id]);
};

/* =============== READ (by email) =============== */
// Digunakan untuk login; password diperlukan untuk verifikasi hash.
const findUserByEmail = async (email) => {
  return await dbGet(`
    SELECT id, full_name, email, password, role, created_at
    FROM users
    WHERE email = ?
  `, [email]);
};

/* =============== CREATE =============== */
const createUser = async (body) => {
  const hashedPassword = await bcrypt.hash(body.password, 10);

  const query = `
    INSERT INTO users (full_name, email, password, role)
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    body.full_name,
    body.email,
    hashedPassword,
    body.role ?? 'pelanggan'
  ];

  const { lastID } = await dbRun(query, values);
  return await findUserById(lastID);
};

/* =============== UPDATE =============== */
const updateUser = async (id, body) => {
  const existing = await findUserById(id);
  if (!existing) return null;

  const query = `
    UPDATE users
    SET full_name = ?,
        email = ?
    WHERE id = ?
  `;

  const values = [
    body.full_name ?? existing.full_name,
    body.email ?? existing.email,
    id
  ];

  await dbRun(query, values);
  return await findUserById(id);
};

/* =============== UPDATE PASSWORD =============== */
// Menerima password biasa, lalu melakukan hashing sebelum disimpan.
const updateUserPassword = async (id, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const { changes } = await dbRun(
    'UPDATE users SET password = ? WHERE id = ?',
    [hashedPassword, id]
  );

  return changes > 0;
};

/* =============== DELETE =============== */
const deleteUser = async (id) => {
  const { changes } = await dbRun(
    'DELETE FROM users WHERE id = ?',
    [id]
  );

  return changes > 0;
};

module.exports = {
  findAllUsers,
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
};
