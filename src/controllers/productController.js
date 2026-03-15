const db = require("../db/db");


/* =========================
OBTENER TODOS LOS PRODUCTOS
========================= */

exports.getProductsByStore = async (store_id) => {

  try {

    const result = await db.query(
      "SELECT * FROM products WHERE store_id = $1 ORDER BY id DESC",
      [store_id]
    );

    return result.rows;

  } catch (error) {

    console.error("Error getting products:", error);
    throw error;

  }

};


/* =========================
OBTENER PRODUCTOS DESTACADOS
========================= */

exports.getFeaturedProducts = async (store_id) => {

  try {

    const result = await db.query(
      "SELECT * FROM products WHERE store_id = $1 AND featured = true ORDER BY id DESC LIMIT 4",
      [store_id]
    );

    return result.rows;

  } catch (error) {

    console.error("Error getting featured products:", error);
    throw error;

  }

};


/* =========================
CREAR PRODUCTO
========================= */

exports.createProduct = async (data) => {

  try {

    const { name, description, price, image, category, store_id, featured } = data;

    const result = await db.query(
      `INSERT INTO products
       (name, description, price, image, category, store_id, featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        name,
        description,
        price,
        image,
        category,
        store_id,
        featured || false
      ]
    );

    return result.rows[0];

  } catch (error) {

    console.error("Error creating product:", error);
    throw error;

  }

};


/* =========================
ACTUALIZAR PRODUCTO
========================= */

exports.updateProduct = async (id, store_id, data) => {

  try {

    const { name, description, price, image, category, featured } = data;

    const result = await db.query(
      `UPDATE products
       SET name=$1,
           description=$2,
           price=$3,
           image = COALESCE($4, image),
           category=$5,
           featured=$6
       WHERE id=$7 AND store_id=$8
       RETURNING *`,
      [
        name,
        description,
        price,
        image,
        category,
        featured,
        id,
        store_id
      ]
    );

    return result.rows[0];

  } catch (error) {

    console.error("Error updating product:", error);
    throw error;

  }

};


/* =========================
ELIMINAR PRODUCTO
========================= */

exports.deleteProduct = async (id, store_id) => {

  try {

    const result = await db.query(
      "DELETE FROM products WHERE id=$1 AND store_id=$2 RETURNING id",
      [id, store_id]
    );

    return result.rows[0];

  } catch (error) {

    console.error("Error deleting product:", error);
    throw error;

  }

};


/* =========================
CONTAR PRODUCTOS
========================= */

exports.countProductsByStore = async (store_id) => {

  try {

    const result = await db.query(
      "SELECT COUNT(*) FROM products WHERE store_id = $1",
      [store_id]
    );

    return parseInt(result.rows[0].count);

  } catch (error) {

    console.error("Error counting products:", error);
    throw error;

  }

};