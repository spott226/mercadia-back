const db = require("../db/db");

exports.getStoreBySlug = async (slug) => {

  const result = await db.query(
    "SELECT * FROM stores WHERE slug = $1",
    [slug]
  );

  return result.rows[0];

};

exports.getProductLimit = async (store_id) => {

  const result = await db.query(
    "SELECT product_limit FROM stores WHERE id = $1",
    [store_id]
  );

  return result.rows[0].product_limit;

};
