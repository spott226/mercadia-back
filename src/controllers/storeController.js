const Store = require("../models/storeModel");
const Product = require("../models/productModel");

exports.getStore = async (req, res) => {

  const { slug } = req.params;

  const store = await Store.getStoreBySlug(slug);

  res.json(store);

};

exports.getStoreProducts = async (req, res) => {

  const { slug } = req.params;

  const store = await Store.getStoreBySlug(slug);

  if(!store){
    return res.status(404).json({ error: "store not found" });
  }

  const products = await Product.getProductsByStore(store.id);

  res.json({
    store,
    products
  });

};