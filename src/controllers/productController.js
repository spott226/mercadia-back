const Product = require("../models/productModel");
const Store = require("../models/storeModel");


/* =========================
OBTENER PRODUCTOS
========================= */

exports.getProducts = async (req, res) => {

  try {

    const { store_id } = req.params;

    const products = await Product.getProductsByStore(store_id);

    res.json(products);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "server error" });

  }

};


/* =========================
CREAR PRODUCTO
========================= */

exports.createProduct = async (req, res) => {

  try {

    const store_id = req.user.store_id;

    const count = await Product.countProductsByStore(store_id);
    const limit = await Store.getProductLimit(store_id);

    if (count >= limit) {
      return res.status(403).json({
        error: "product limit reached"
      });
    }

    const image = req.file ? req.file.filename : null;

    const featured =
      req.body.featured === "true" ||
      req.body.featured === true ||
      req.body.featured === "on";

    const data = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image,
      store_id: store_id,
      featured: featured
    };

    const product = await Product.createProduct(data);

    res.status(201).json(product);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "server error" });

  }

};


/* =========================
ACTUALIZAR PRODUCTO
========================= */

exports.updateProduct = async (req, res) => {

  try {

    const { id } = req.params;

    let image = null;

    if (req.file) {
      image = req.file.filename;
    }

    let featured = null;

    if (req.body.featured !== undefined) {
      featured =
        req.body.featured === "true" ||
        req.body.featured === true ||
        req.body.featured === "on";
    }

    const data = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image,
      featured: featured
    };

    const product = await Product.updateProduct(
      id,
      req.user.store_id,
      data
    );

    if (!product) {
      return res.status(403).json({ error: "not allowed" });
    }

    res.json(product);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "server error" });

  }

};


/* =========================
ELIMINAR PRODUCTO
========================= */

exports.deleteProduct = async (req, res) => {

  try {

    const { id } = req.params;

    const deleted = await Product.deleteProduct(
      id,
      req.user.store_id
    );

    if (!deleted) {
      return res.status(403).json({ error: "not allowed" });
    }

    res.json({ message: "product deleted" });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "server error" });

  }

};