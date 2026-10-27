const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

/* =============== READ (all) =============== */
const findAllProducts = async () => {
  return await dbAll('SELECT * FROM products ORDER BY id DESC');
};

/* =============== READ (by id) =============== */
const findProductById = async (id) => {
  return await dbGet('SELECT * FROM products WHERE id = ?', [id]);
};

/* =============== CREATE =============== */
const createProduct = async (body) => {
  const query = `
    INSERT INTO products (name, price, stock)
    VALUES (?, ?, ?)
  `;
  const values = [
    body.name,
    body.price,
    body.stock ?? 0
  ];

  const { lastID } = await dbRun(query, values);
  return await findProductById(lastID);
};

/* =============== UPDATE =============== */
const updateProduct = async (id, body) => {
  const existing = await findProductById(id);
  if (!existing) return null;

  const query = `
    UPDATE products
    SET name = ?, 
        price = ?, 
        stock = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const values = [
    body.name ?? existing.name,
    body.price ?? existing.price,
    body.stock ?? existing.stock,
    id
  ];

  await dbRun(query, values);
  return await findProductById(id);
};

/* =============== DELETE =============== */
const deleteProduct = async (id) => {
  const { changes } = await dbRun('DELETE FROM products WHERE id = ?', [id]);
  return changes > 0;
};

/* =============== BULK CREATE =============== */
const bulkCreateProducts = async (products) => {
  await dbRun('BEGIN TRANSACTION');

  try {
    const createdProducts = [];

    for (const product of products) {
      const result = await dbRun(
        `INSERT INTO products (name, price, stock)
         VALUES (?, ?, ?)`,
        [
          product.name,
          product.price,
          product.stock ?? 0
        ]
      );

      createdProducts.push({
        id: result.lastID,
        ...product,
      });
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
  bulkCreateProducts
};