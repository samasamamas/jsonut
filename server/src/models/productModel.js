
const {
  dbRun,
  dbGet,
  dbAll,
} = require('../middlewares_helpers/sqlite3_helpers');

/* =============== READ (all) =============== */
const findAllProducts = async () => {
  return await dbAll(
    'SELECT * FROM products ORDER BY id DESC'
  );
};

/* =============== READ (by id) =============== */
const findProductById = async (id) => {
  return await dbGet(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
};

/* =============== CREATE =============== */
const createProduct = async (body) => {
  const query = `
    INSERT INTO products (name, price, stock, image)
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    body.name,
    Number(body.price),
    Number(body.stock ?? 0),
    body.image ?? null,
  ];

  const result = await dbRun(query, values);

  return await findProductById(result.lastID);
};

/* =============== UPDATE =============== */
const updateProduct = async (id, body) => {
  const fields = [];
  const values = [];

  if (body.name !== undefined) {
    fields.push('name = ?');
    values.push(body.name);
  }

  if (body.price !== undefined) {
    fields.push('price = ?');
    values.push(Number(body.price));
  }

  if (body.stock !== undefined) {
    fields.push('stock = ?');
    values.push(Number(body.stock));
  }

  if (body.image !== undefined) {
    fields.push('image = ?');
    values.push(body.image);
  }

  if (fields.length === 0) {
    return null;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `
    UPDATE products
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  const result = await dbRun(query, values);

  if (result.changes === 0) {
    return null;
  }

  return await findProductById(id);
};

/* =============== DELETE =============== */
const deleteProduct = async (id) => {
  // Periksa apakah produk masih digunakan dalam transaksi
  const usage = await dbGet(
    `
      SELECT COUNT(*) AS total
      FROM transaction_details
      WHERE product_id = ?
    `,
    [id]
  );

  if (usage && usage.total > 0) {
    const error = new Error(
      'Produk tidak dapat dihapus karena masih digunakan dalam riwayat transaksi.'
    );

    error.code = 'PRODUCT_IN_USE';
    throw error;
  }

  try {
    const result = await dbRun(
      'DELETE FROM products WHERE id = ?',
      [id]
    );

    return result.changes > 0;
  } catch (error) {
    // Perlindungan tambahan jika terjadi konflik foreign key
    if (
      error.code === 'SQLITE_CONSTRAINT' ||
      error.message?.includes('FOREIGN KEY constraint failed')
    ) {
      const conflictError = new Error(
        'Produk tidak dapat dihapus karena masih memiliki relasi dengan data lain.'
      );

      conflictError.code = 'PRODUCT_IN_USE';
      throw conflictError;
    }

    throw error;
  }
};

/* =============== BULK CREATE =============== */
const bulkCreateProducts = async (products) => {
  await dbRun('BEGIN TRANSACTION');

  try {
    const createdProducts = [];

    for (const product of products) {
      const result = await dbRun(
        `INSERT INTO products (name, price, stock, image)
         VALUES (?, ?, ?, ?)`,
        [
          product.name,
          Number(product.price),
          Number(product.stock ?? 0),
          null,
        ]
      );

      const createdProduct = await findProductById(result.lastID);

      if (!createdProduct) {
        throw new Error(
          'Gagal mengambil data produk yang baru dibuat.'
        );
      }

      createdProducts.push(createdProduct);
    }

    await dbRun('COMMIT');

    return createdProducts;
  } catch (error) {
    try {
      await dbRun('ROLLBACK');
    } catch (rollbackError) {
      console.error('Gagal melakukan rollback:', rollbackError);
    }

    throw error;
  }
};

module.exports = {
  findAllProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
};
