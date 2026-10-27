const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

/* =========================================================
 * Helper: standard response
 * ========================================================= */
const success = (res, code, message, data = null) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, code, message, error = null) =>
  res.status(code).json({ success: false, message, error });

/* =========================================================
 * GET /api/users — semua pengguna
 * ========================================================= */
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.findAllUsers();
    success(res, 200, 'Berhasil mengambil semua pengguna', users);
  } catch (error) {
    console.error('[getAllUsers]', error);
    fail(res, 500, 'Server Error', error.message);
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

    success(res, 200, 'Berhasil mengambil pengguna', user);
  } catch (error) {
    console.error('[getUserById]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 * POST /api/users — buat pengguna
 * ========================================================= */
const createUser = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (typeof full_name !== 'string' || !full_name.trim()) {
      return fail(res, 400, 'Validasi gagal', 'full_name wajib diisi');
    }

    if (typeof email !== 'string' || !email.trim()) {
      return fail(res, 400, 'Validasi gagal', 'email wajib diisi');
    }

    if (typeof password !== 'string' || password.length < 8) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'password wajib minimal 8 karakter'
      );
    }

    // Role tidak diambil dari request agar pengguna biasa
    // tidak dapat membuat akun admin dengan mengubah payload.
    const created = await userModel.createUser({
      full_name: full_name.trim(),
      email: email.trim(),
      password: password,
      role: 'pelanggan',
    });

    success(res, 201, 'Pengguna berhasil dibuat', created);
  } catch (error) {
    console.error('[createUser]', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return fail(res, 409, 'Email sudah terdaftar');
    }

    fail(res, 500, 'Server Error', error.message);
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
      (typeof full_name !== 'string' || !full_name.trim())
    ) {
      return fail(res, 400, 'Validasi gagal', 'full_name tidak valid');
    }

    if (
      email !== undefined &&
      (typeof email !== 'string' || !email.trim())
    ) {
      return fail(res, 400, 'Validasi gagal', 'email tidak valid');
    }

    // Jangan menerima perubahan role dari endpoint umum ini.
    const updated = await userModel.updateUser(id, {
      full_name: full_name?.trim(),
      email: email?.trim(),
    });

    if (!updated) {
      return fail(res, 404, 'Pengguna tidak ditemukan');
    }

    success(res, 200, 'Pengguna berhasil diperbarui', updated);
  } catch (error) {
    console.error('[updateUser]', error);

    if (error.message?.includes('UNIQUE constraint failed')) {
      return fail(res, 409, 'Email sudah terdaftar');
    }

    fail(res, 500, 'Server Error', error.message);
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

    success(res, 200, 'Pengguna berhasil dihapus');
  } catch (error) {
    console.error('[deleteUser]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, 400, 'Email dan password wajib diisi');
    }

    const user = await userModel.findUserByEmail(email.trim());

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return fail(res, 401, 'Email atau password salah');
    }

    if (user.role !== 'admin') {
      return fail(res, 403, 'Akun tidak memiliki akses admin');
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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
};
