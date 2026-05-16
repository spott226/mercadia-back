const db = require("../db/db");

/* =========================
   OBTENER PRODUCTOS ERP
   PAGINACIÓN + BÚSQUEDA + FILTRO
========================= */
exports.getProductsByStore = async (
  store_id,
  options = {}
) => {

  try {

    const page =
      parseInt(options.page) || 1;

    const limit =
      parseInt(options.limit) || 10;

    const offset =
      (page - 1) * limit;

    const search =
      options.search || "";

    const category =
      options.category || "";

    let where = `
      WHERE store_id = $1
    `;

    let values = [store_id];

    let index = 2;


    /* =========================
       BÚSQUEDA POR NOMBRE
    ========================= */

    if (search) {

      where += `
        AND LOWER(name)
        LIKE LOWER($${index})
      `;

      values.push(`%${search}%`);

      index++;

    }


    /* =========================
       FILTRO CATEGORÍA
    ========================= */

    if (category) {

      where += `
        AND LOWER(category)
        = LOWER($${index})
      `;

      values.push(category);

      index++;

    }


    /* =========================
       TOTAL PRODUCTOS
    ========================= */

    const totalQuery = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      ${where}
      `,
      values
    );

    const total =
      parseInt(totalQuery.rows[0].total);


    /* =========================
       PRODUCTOS PAGINADOS
    ========================= */

    values.push(limit);

    values.push(offset);

    const result = await db.query(
      `
      SELECT *
      FROM products
      ${where}
      ORDER BY id DESC
      LIMIT $${index}
      OFFSET $${index + 1}
      `,
      values
    );

    return {

      products: result.rows,

      pagination: {

        total,

        page,

        limit,

        totalPages:
          Math.ceil(total / limit),

        hasNext:
          page < Math.ceil(total / limit),

        hasPrev:
          page > 1

      }

    };

  } catch (error) {

    console.error(
      "Error getting products:",
      error
    );

    throw error;

  }

};


/* =========================
   OBTENER CATEGORÍAS ÚNICAS
========================= */
exports.getCategoriesByStore = async (
  store_id
) => {

  try {

    const result = await db.query(
      `
      SELECT DISTINCT category
      FROM products
      WHERE store_id = $1
      AND category IS NOT NULL
      AND category != ''
      ORDER BY category ASC
      `,
      [store_id]
    );

    return result.rows;

  } catch (error) {

    console.error(
      "Error getting categories:",
      error
    );

    throw error;

  }

};


/* =========================
   OBTENER PRODUCTOS DESTACADOS
========================= */
exports.getFeaturedProducts = async (
  store_id
) => {

  try {

    const result = await db.query(
      `
      SELECT *
      FROM products
      WHERE store_id = $1
      AND featured = true
      ORDER BY id DESC
      LIMIT 4
      `,
      [store_id]
    );

    return result.rows;

  } catch (error) {

    console.error(
      "Error getting featured products:",
      error
    );

    throw error;

  }

};


/* =========================
   CREAR PRODUCTO
========================= */
exports.createProduct = async (data) => {

  try {

    const {
      name,
      description,
      price,
      image,
      category,
      store_id,
      featured
    } = data;

    const result = await db.query(
      `
      INSERT INTO products
      (
        name,
        description,
        price,
        image,
        category,
        store_id,
        featured
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
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

    console.error(
      "Error creating product:",
      error
    );

    throw error;

  }

};


/* =========================
   ACTUALIZAR PRODUCTO
========================= */
exports.updateProduct = async (
  id,
  store_id,
  data
) => {

  try {

    const {
      name,
      description,
      price,
      image,
      category,
      featured
    } = data;

    const result = await db.query(
      `
      UPDATE products
      SET
        name=$1,
        description=$2,
        price=$3,
        image=COALESCE($4,image),
        category=$5,
        featured=COALESCE($6,featured)
      WHERE id=$7
      AND store_id=$8
      RETURNING *
      `,
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

    console.error(
      "Error updating product:",
      error
    );

    throw error;

  }

};


/* =========================
   ELIMINAR PRODUCTO
========================= */
exports.deleteProduct = async (
  id,
  store_id
) => {

  try {

    await db.query(
      `
      DELETE FROM product_images
      WHERE product_id = $1
      `,
      [id]
    );

    await db.query(
      `
      DELETE FROM product_variants
      WHERE product_id = $1
      `,
      [id]
    );

    const result = await db.query(
      `
      DELETE FROM products
      WHERE id=$1
      AND store_id=$2
      RETURNING id
      `,
      [id, store_id]
    );

    return result.rows[0];

  } catch (error) {

    console.error(
      "Error deleting product:",
      error
    );

    throw error;

  }

};


/* =========================
   CONTAR PRODUCTOS POR TIENDA
========================= */
exports.countProductsByStore = async (
  store_id
) => {

  try {

    const result = await db.query(
      `
      SELECT COUNT(*)
      FROM products
      WHERE store_id = $1
      `,
      [store_id]
    );

    return parseInt(
      result.rows[0].count
    );

  } catch (error) {

    console.error(
      "Error counting products:",
      error
    );

    throw error;

  }

};


/* =========================
   CREAR IMAGEN POR COLOR
========================= */
exports.createProductImage = async (
  data
) => {

  const {
    product_id,
    color,
    image_url
  } = data;

  const result = await db.query(
    `
    INSERT INTO product_images
    (
      product_id,
      color,
      image_url
    )
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [
      product_id,
      color,
      image_url
    ]
  );

  return result.rows[0];

};


/* =========================
   ELIMINAR IMÁGENES
========================= */
exports.deleteImagesByProduct = async (
  product_id
) => {

  await db.query(
    `
    DELETE FROM product_images
    WHERE product_id = $1
    `,
    [product_id]
  );

};


/* =========================
   CREAR VARIANTE ERP
========================= */
exports.createVariant = async (
  data
) => {

  const {
    product_id,
    color,
    size,
    price,
    stock,
    sku,
    cost
  } = data;

  const result = await db.query(
    `
    INSERT INTO product_variants
    (
      product_id,
      color,
      size,
      price,
      stock,
      reserved_stock,
      sku,
      cost
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
    [
      product_id,
      color,
      size,
      price,
      stock || 0,
      0,
      sku || null,
      cost || 0
    ]
  );

  return result.rows[0];

};


/* =========================
   OBTENER VARIANTES
========================= */
exports.getVariantsByProduct = async (
  product_id
) => {

  const result = await db.query(
    `
    SELECT *
    FROM product_variants
    WHERE product_id = $1
    `,
    [product_id]
  );

  return result.rows;

};


/* =========================
   OBTENER IMÁGENES
========================= */
exports.getImagesByProduct = async (
  product_id
) => {

  const result = await db.query(
    `
    SELECT *
    FROM product_images
    WHERE product_id = $1
    `,
    [product_id]
  );

  return result.rows;

};


/* =========================
   ELIMINAR VARIANTES
========================= */
exports.deleteVariantsByProduct = async (
  product_id
) => {

  await db.query(
    `
    DELETE FROM product_variants
    WHERE product_id = $1
    `,
    [product_id]
  );

};