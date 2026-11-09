
const productModel = require('../models/productModel');
const fs = require('fs');
const path = require('path');

/* =========================================================
 * Helper: standard response
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
 * Helper: validasi ID
 * ========================================================= */
const isValidId = (id) => {
  return /^\d+$/.test(String(id)) && Number(id) > 0;
};

/* =========================================================
 * Helper: hapus file foto
 * ========================================================= */
const removeImage = (image) => {
  if (!image) return;

  try {
    const filename = path.basename(image);
    const imagePath = path.join(
      __dirname,
      '../../uploads/products',
      filename
    );

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.error('Gagal menghapus foto:', error);
  }
};

/* =========================================================
 * Helper: mendapatkan path foto
 * ========================================================= */
const getImagePath = (req) => {
  return req.file
    ? `/uploads/products/${req.file.filename}`
    : undefined;
};

/* =========================================================
 * Helper: validasi input nama
 * ========================================================= */
const isValidName = (name) => {
  return typeof name === 'string' && name.trim() !== '';
};

/* =========================================================
 * Helper: validasi harga
 * ========================================================= */
const isValidPrice = (price) => {
  if (price === undefined || price === null || price === '') {
    return false;
  }

  const numericPrice = Number(price);

  return Number.isFinite(numericPrice) && numericPrice >= 0;
};

/* =========================================================
 * Helper: validasi stok
 * ========================================================= */
const isValidStock = (stock) => {
  if (stock === undefined || stock === null || stock === '') {
    return false;
  }

  const numericStock = Number(stock);

  return Number.isInteger(numericStock) && numericStock >= 0;
};

/* =========================================================
 * Helper: validasi gagal sekaligus hapus foto baru
 * ========================================================= */
const validationFail = (req, res, message, error = null) => {
  if (req.file) {
    removeImage(getImagePath(req));
  }

  return fail(res, 400, message, error);
};

/* =========================================================
 * GET /api/products
 * ========================================================= */
const getAllProducts = async (req, res) => {
  try {
    const products = await productModel.findAllProducts();

    return success(
      res,
      200,
      'Berhasil mengambil semua produk',
      products
    );
  } catch (error) {
    console.error('[getAllProducts]', error);

    return fail(
      res,
      500,
      'Gagal mengambil data produk dari server.'
    );
  }
};

/* =========================================================
 * GET /api/products/:id
 * ========================================================= */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return fail(res, 400, 'ID produk tidak valid.');
    }

    const product = await productModel.findProductById(id);

    if (!product) {
      return fail(res, 404, 'Produk tidak ditemukan.');
    }

    return success(
      res,
      200,
      'Berhasil mengambil produk',
      product
    );
  } catch (error) {
    console.error('[getProductById]', error);

    return fail(
      res,
      500,
      'Gagal mengambil data produk dari server.'
    );
  }
};

/* =========================================================
 * POST /api/products
 * ========================================================= */
const createProduct = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!isValidName(name)) {
      return validationFail(
        req,
        res,
        'Validasi gagal',
        'Nama produk wajib diisi.'
      );
    }

    if (!isValidPrice(price)) {
      return validationFail(
        req,
        res,
        'Validasi gagal',
        'Harga harus berupa angka lebih dari atau sama dengan 0.'
      );
    }

    const stock = req.body.stock ?? 0;

    if (!isValidStock(stock)) {
      return validationFail(
        req,
        res,
        'Validasi gagal',
        'Stok harus berupa angka bulat lebih dari atau sama dengan 0.'
      );
    }

    const productData = {
      name: name.trim(),
      price: Number(price),
      stock: Number(stock),
      image: getImagePath(req) ?? null,
    };

    const created = await productModel.createProduct(productData);

    return success(
      res,
      201,
      'Produk berhasil dibuat',
      created
    );
  } catch (error) {
    if (req.file) {
      removeImage(getImagePath(req));
    }

    console.error('[createProduct]', error);

    return fail(
      res,
      500,
      'Gagal menyimpan produk ke server.'
    );
  }
};

/* =========================================================
 * PUT /api/products/:id
 * ========================================================= */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return validationFail(
        req,
        res,
        'ID produk tidak valid.'
      );
    }

    const existing = await productModel.findProductById(id);

    if (!existing) {
      return validationFail(
        req,
        res,
        'Produk tidak ditemukan.'
      );
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      if (!isValidName(req.body.name)) {
        return validationFail(
          req,
          res,
          'Validasi gagal',
          'Nama produk tidak boleh kosong.'
        );
      }

      updateData.name = req.body.name.trim();
    }

    if (req.body.price !== undefined) {
      if (!isValidPrice(req.body.price)) {
        return validationFail(
          req,
          res,
          'Validasi gagal',
          'Harga harus berupa angka lebih dari atau sama dengan 0.'
        );
      }

      updateData.price = Number(req.body.price);
    }

    if (req.body.stock !== undefined) {
      if (!isValidStock(req.body.stock)) {
        return validationFail(
          req,
          res,
          'Validasi gagal',
          'Stok harus berupa angka bulat lebih dari atau sama dengan 0.'
        );
      }

      updateData.stock = Number(req.body.stock);
    }

    const newImage = getImagePath(req);

    if (newImage) {
      updateData.image = newImage;
    }

    if (Object.keys(updateData).length === 0) {
      return fail(
        res,
        400,
        'Tidak ada data yang dapat diperbarui.'
      );
    }

    const updated = await productModel.updateProduct(id, updateData);

    if (!updated) {
      if (req.file) {
        removeImage(newImage);
      }

      return fail(
        res,
        404,
        'Produk tidak ditemukan atau gagal diperbarui.'
      );
    }

    if (newImage && existing.image) {
      removeImage(existing.image);
    }

    return success(
      res,
      200,
      'Produk berhasil diperbarui',
      updated
    );
  } catch (error) {
    if (req.file) {
      removeImage(getImagePath(req));
    }

    console.error('[updateProduct]', error);

    return fail(
      res,
      500,
      'Gagal memperbarui produk di server.'
    );
  }
};

/* =========================================================
 * DELETE /api/products/:id
 * ========================================================= */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return fail(res, 400, 'ID produk tidak valid.');
    }

    const existing = await productModel.findProductById(id);

    if (!existing) {
      return fail(res, 404, 'Produk tidak ditemukan.');
    }

    const deleted = await productModel.deleteProduct(id);

    if (!deleted) {
      return fail(
        res,
        404,
        'Produk tidak ditemukan atau gagal dihapus.'
      );
    }

    if (existing.image) {
      removeImage(existing.image);
    }

    return success(
      res,
      200,
      'Produk berhasil dihapus'
    );
  } catch (error) {
    console.error('[deleteProduct]', error);

    if (
      error.code === 'PRODUCT_IN_USE' ||
      error.code === 'SQLITE_CONSTRAINT' ||
      error.message?.includes('FOREIGN KEY constraint failed')
    ) {
      return fail(
        res,
        409,
        'Produk tidak dapat dihapus karena sudah digunakan dalam riwayat transaksi.',
        'Hapus atau pertahankan produk tanpa menghilangkan riwayat transaksi.'
      );
    }

    return fail(
      res,
      500,
      'Gagal menghapus produk dari server.'
    );
  }
};

/* =========================================================
 * POST /api/products/bulk
 * ========================================================= */
const bulkCreateProducts = async (req, res) => {
  try {
    let { products } = req.body;

    // Parsing JSON jika products dikirim melalui
    // x-www-form-urlencoded sebagai string.
    if (typeof products === 'string') {
      try {
        products = JSON.parse(products);
      } catch (error) {
        return fail(
          res,
          400,
          'Validasi gagal',
          'Format products harus berupa JSON array yang valid.'
        );
      }
    }

    // Validasi array products
    if (!Array.isArray(products) || products.length === 0) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'Products harus berupa array yang tidak kosong.'
      );
    }

    const validatedProducts = [];

    // Validasi setiap produk
    for (const [index, product] of products.entries()) {
      if (
        !product ||
        typeof product !== 'object' ||
        Array.isArray(product)
      ) {
        return fail(
          res,
          400,
          'Validasi gagal',
          `Data produk pada indeks ${index} tidak valid.`
        );
      }

      if (!isValidName(product.name)) {
        return fail(
          res,
          400,
          'Validasi gagal',
          `Nama produk pada indeks ${index} wajib diisi.`
        );
      }

      if (!isValidPrice(product.price)) {
        return fail(
          res,
          400,
          'Validasi gagal',
          `Harga produk pada indeks ${index} tidak valid.`
        );
      }

      const stock = product.stock ?? 0;

      if (!isValidStock(stock)) {
        return fail(
          res,
          400,
          'Validasi gagal',
          `Stok produk pada indeks ${index} tidak valid.`
        );
      }

      validatedProducts.push({
        name: product.name.trim(),
        price: Number(product.price),
        stock: Number(stock),
      });
    }

    // Simpan beberapa produk sekaligus
    const created = await productModel.bulkCreateProducts(
      validatedProducts
    );

    return success(
      res,
      201,
      `${created.length} produk berhasil dibuat`,
      created
    );
  } catch (error) {
    console.error('[bulkCreateProducts]', error);

    return fail(
      res,
      500,
      'Gagal menyimpan beberapa produk ke server.'
    );
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
};
