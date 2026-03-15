const Store = require("../models/storeModel");
const Product = require("../models/productModel");

/* =========================
   OBTENER TIENDA POR SLUG
========================= */

exports.getStore = async (req, res) => {

  try {

    const { slug } = req.params;

    const store = await Store.getStoreBySlug(slug);

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json(store);

  } catch (error) {

    console.error("Error getting store:", error);
    res.status(500).json({ error: "Server error" });

  }

};


/* =========================
   OBTENER PRODUCTOS DE TIENDA
========================= */

exports.getStoreProducts = async (req, res) => {

  try {

    const { slug } = req.params;

    const store = await Store.getStoreBySlug(slug);

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const products = await Product.getProductsByStore(store.id);

    // IMPORTANTE: devolver solo productos
    res.json(products);

  } catch (error) {

    console.error("Error getting store products:", error);
    res.status(500).json({ error: "Server error" });

  }

};