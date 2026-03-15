const db = require("../db/db");

exports.getProductsByStore = async (store_id) => {

  const result = await db.query(
    "SELECT * FROM products WHERE store_id = $1 ORDER BY id DESC",
    [store_id]
  );

  return result.rows;
};

exports.createProduct = async (data) => {

  const { name, description, price, image, category, store_id } = data;

  const result = await db.query(
    `INSERT INTO products
     (name, description, price, image, category, store_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [name, description, price, image, category, store_id]
  );

  return result.rows[0];
};

exports.updateProduct = async (id, store_id, data) => {

  const { name, description, price, image, category } = data;

  const result = await db.query(
    `UPDATE products
     SET name=$1,
         description=$2,
         price=$3,
         image=$4,
         category=$5
     WHERE id=$6 AND store_id=$7
     RETURNING *`,
    [name, description, price, image, category, id, store_id]
  );

  return result.rows[0];
};

exports.deleteProduct = async (id, store_id) => {

  const result = await db.query(
    "DELETE FROM products WHERE id=$1 AND store_id=$2 RETURNING id",
    [id, store_id]
  );

  return result.rows[0];
};

// NUEVO: contar productos por tienda
exports.countProductsByStore = async (store_id) => {

  const result = await db.query(
    "SELECT COUNT(*) FROM products WHERE store_id = $1",
    [store_id]
  );

  return parseInt(result.rows[0].count);

};
