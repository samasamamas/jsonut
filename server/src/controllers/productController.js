
const productModel = require('../models/productModel');
const fs = require('fs');
const path = require('path');

/* =========================================================
 * Helper: standard response
 * ========================================================= */
const success = (res, code, message, data = null) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, code, message, error = null) =>
  res.status(code).json({ success: false, message, error });

/* =========================================================
 * Helper: hapus file foto
 * ========================================================= */
const removeImage = (image) => {
  if (!image) return;

  const filename = path.basename(image);
  const imagePath = path.join(
    __dirname,
    '../../uploads/products',
    filename
  );

  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
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
    return fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 * GET /api/products/:id
 * ========================================================= */
const getProductById = async (req, res) => {
  try {
    const product = await productModel.findProductById(req.params.id);

    if (!product) {
      return fail(res, 404, 'Produk tidak ditemukan');
    }

    return success(res, 200, 'Berhasil mengambil produk', product);
  } catch (error) {
    console.error('[getProductById]', error);
    return fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 * POST /api/products
 * ========================================================= */
const createProduct = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || name.trim() === '') {
      return fail(res, 400, 'Validasi gagal', 'name wajib diisi');
    }

    const numericPrice = Number(price);

    if (
      price === undefined ||
      price === null ||
      price === '' ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'price wajib angka >= 0'
      );
    }

    const numericStock = Number(req.body.stock ?? 0);

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'stock harus berupa angka bulat >= 0'
      );
    }

    const productData = {
      name: name.trim(),
      price: numericPrice,
      stock: numericStock,
      image: getImagePath(req) ?? null,
    };

    const created = await productModel.createProduct(productData);

    return success(res, 201, 'Produk berhasil dibuat', created);
  } catch (error) {
    // Jika penyimpanan database gagal, hapus foto yang baru diunggah.
    if (req.file) {
      removeImage(getImagePath(req));
    }

    console.error('[createProduct]', error);
    return fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 * PUT /api/products/:id
 * ========================================================= */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await productModel.findProductById(id);

    if (!existing) {
      return fail(res, 404, 'Produk tidak ditemukan');
    }

    if (
      req.body.name !== undefined &&
      (!req.body.name || req.body.name.trim() === '')
    ) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'name tidak boleh kosong'
      );
    }

    const updateData = { ...req.body };

    if (updateData.name !== undefined) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.price !== undefined) {
      const numericPrice = Number(updateData.price);

      if (
        updateData.price === '' ||
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
      ) {
        return fail(
          res,
          400,
          'Validasi gagal',
          'price harus angka >= 0'
        );
      }

      updateData.price = numericPrice;
    }

    if (updateData.stock !== undefined) {
      const numericStock = Number(updateData.stock);

      if (!Number.isInteger(numericStock) || numericStock < 0) {
        return fail(
          res,
          400,
          'Validasi gagal',
          'stock harus angka bulat >= 0'
        );
      }

      updateData.stock = numericStock;
    }

    // Jika ada foto baru, gunakan path foto baru.
    // Jika tidak ada, model tidak menerima perubahan kolom image.
    const newImage = getImagePath(req);

    if (newImage) {
      updateData.image = newImage;
    }

    const updated = await productModel.updateProduct(id, updateData);

    // Hapus foto lama hanya setelah update database berhasil.
    if (newImage && existing.image) {
      removeImage(existing.image);
    }

    return success(res, 200, 'Produk berhasil diupdate', updated);
  } catch (error) {
    // Jika update gagal, hapus foto baru agar tidak menjadi file yatim.
    if (req.file) {
      removeImage(getImagePath(req));
    }

    console.error('[updateProduct]', error);
    return fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 * DELETE /api/products/:id
 * ========================================================= */
const deleteProduct = async (req, res) => {
  try {
    const existing = await productModel.findProductById(req.params.id);

    if (!existing) {
      return fail(res, 404, 'Produk tidak ditemukan');
    }

    const deleted = await productModel.deleteProduct(req.params.id);

    if (!deleted) {
      return fail(res, 404, 'Produk tidak ditemukan');
    }

    // Hapus foto setelah produk berhasil dihapus dari database.
    if (existing.image) {
      removeImage(existing.image);
    }

    return success(res, 200, 'Produk berhasil dihapus');
  } catch (error) {
    console.error('[deleteProduct]', error);
    return fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 * POST /api/products/bulk
 * ========================================================= */
const bulkCreateProducts = async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return fail(
        res,
        400,
        'Validasi gagal',
        'products harus berupa array yang tidak kosong'
      );
    }

    for (const [index, product] of products.entries()) {
      if (
        !product ||
        typeof product.name !== 'string' ||
        product.name.trim() === ''
      ) {
        return fail(
          res,
          400,
          'Validasi gagal',
          `products[${index}].name wajib diisi`
        );
      }

      if (
        product.price === undefined ||
        product.price === null ||
        typeof product.price !== 'number' ||
        !Number.isFinite(product.price) ||
        product.price < 0
      ) {
        return fail(
          res,
          400,
          'Validasi gagal',
          `products[${index}].price harus berupa angka >= 0`
        );
      }
    }

    const created = await productModel.bulkCreateProducts(products);

    return success(
      res,
      201,
      `${created.length} produk berhasil dibuat`,
      created
    );
  } catch (error) {
    console.error('[bulkCreateProducts]', error);
    return fail(res, 500, 'Server Error', error.message);
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
