
const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

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

  const { lastID } = await dbRun(query, values);

  return await findProductById(lastID);
};

/* =============== UPDATE =============== */
const updateProduct = async (id, body) => {
  const existing = await findProductById(id);

  if (!existing) return null;

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
    return existing;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const query = `
    UPDATE products
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  await dbRun(query, values);

  return await findProductById(id);
};

/* =============== DELETE =============== */
const deleteProduct = async (id) => {
  const { changes } = await dbRun(
    'DELETE FROM products WHERE id = ?',
    [id]
  );

  return changes > 0;
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

      createdProducts.push(
        await findProductById(result.lastID)
      );
    }

    await dbRun('COMMIT');

    return createdProducts;
  } catch (error) {
    await dbRun('ROLLBACK');
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
