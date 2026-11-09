
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

/* =========================================================
 * HELPER: Standard response
 * ========================================================= */

const success = (res, code, message, data = null) =>
  res.status(code).json({
    success: true,
    message,
    data,
  });

const fail = (res, code, message, error = null) =>
  res.status(code).json({
    success: false,
    message,
    error,
  });

/* =========================================================
 * HELPER: Validasi email
 * ========================================================= */

const isValidEmail = (email) => {
  return (
    typeof email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
};

/* =========================================================
 * GET /api/users — semua pengguna
 * ========================================================= */

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.findAllUsers();

    return success(
      res,
      200,
      'Berhasil mengambil semua pengguna',
      users
    );
  } catch (error) {
    console.error('[getAllUsers]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* =========================================================
 * GET /api/users/:id — satu pengguna
 * ========================================================= */

const getUserById = async (req, res) => {
  try {
    const user = await userModel.findUserById(req.params.id);

    if (!user) {
      return fail(res, 404, 'Pengguna tidak ditemukan');
    }

    return success(
      res,
      200,
      'Berhasil mengambil pengguna',
      user
    );
  } catch (error) {
    console.error('[getUserById]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* =========================================================
 * POST /api/users — buat pengguna
 * ========================================================= */

const createUser = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (
      typeof full_name !== 'string' ||
      !full_name.trim()
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'Nama lengkap wajib diisi'
      );
    }

    if (!isValidEmail(email)) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'Format email tidak valid'
      );
    }

    if (
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'Password wajib minimal 8 karakter'
      );
    }

    // Role selalu pelanggan untuk registrasi umum.
    // Password akan di-hash di userModel.js.
    const created = await userModel.createUser({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'pelanggan',
    });

    return success(
      res,
      201,
      'Pengguna berhasil dibuat',
      created
    );
  } catch (error) {
    console.error('[createUser]', error);

    if (
      error.message?.includes('UNIQUE constraint failed')
    ) {
      return fail(res, 409, 'Email sudah terdaftar');
    }

    return fail(res, 500, 'Server Error');
  }
};

/* =========================================================
 * PUT /api/users/:id — update pengguna
 * ========================================================= */

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email } = req.body;

    if (
      full_name !== undefined &&
      (
        typeof full_name !== 'string' ||
        !full_name.trim()
      )
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'Nama lengkap tidak valid'
      );
    }

    if (
      email !== undefined &&
      !isValidEmail(email)
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'Format email tidak valid'
      );
    }

    if (
      full_name === undefined &&
      email === undefined
    ) {
      return fail(
        res,
        400,
        'Tidak ada data yang diperbarui'
      );
    }

    // Role tidak dapat diubah melalui endpoint ini.
    const updated = await userModel.updateUser(id, {
      ...(full_name !== undefined && {
        full_name: full_name.trim(),
      }),
      ...(email !== undefined && {
        email: email.trim().toLowerCase(),
      }),
    });

    if (!updated) {
      return fail(res, 404, 'Pengguna tidak ditemukan');
    }

    return success(
      res,
      200,
      'Pengguna berhasil diperbarui',
      updated
    );
  } catch (error) {
    console.error('[updateUser]', error);

    if (
      error.message?.includes('UNIQUE constraint failed')
    ) {
      return fail(res, 409, 'Email sudah terdaftar');
    }

    return fail(res, 500, 'Server Error');
  }
};

/* =========================================================
 * DELETE /api/users/:id — hapus pengguna
 * ========================================================= */

const deleteUser = async (req, res) => {
  try {
    const deleted = await userModel.deleteUser(req.params.id);

    if (!deleted) {
      return fail(res, 404, 'Pengguna tidak ditemukan');
    }

    return success(
      res,
      200,
      'Pengguna berhasil dihapus'
    );
  } catch (error) {
    console.error('[deleteUser]', error);

    if (
      error.message?.includes('FOREIGN KEY constraint failed')
    ) {
      return fail(
        res,
        409,
        'Pengguna masih memiliki transaksi terkait'
      );
    }

    return fail(res, 500, 'Server Error');
  }
};

/* =========================================================
 * POST /api/users/login — login admin
 * ========================================================= */

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return fail(
        res,
        400,
        'Email dan password wajib diisi'
      );
    }

    if (!isValidEmail(email)) {
      return fail(res, 400, 'Format email tidak valid');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await userModel.findUserByEmail(
      normalizedEmail
    );

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return fail(
        res,
        401,
        'Email atau password salah'
      );
    }

    if (user.role !== 'admin') {
      return fail(
        res,
        403,
        'Akun tidak memiliki akses admin'
      );
    }

    return success(res, 200, 'Login berhasil', {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('[login]', error);
    return fail(res, 500, 'Server Error');
  }
};

/* =========================================================
 * EXPORT
 * ========================================================= */

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
};
