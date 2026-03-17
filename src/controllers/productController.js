const Product = require("../models/productModel");
const Store = require("../models/storeModel");

/* =========================
OBTENER PRODUCTOS
========================= */
exports.getProducts = async (req, res) => {
  try {
    const { store_id } = req.params;

    const products = await Product.getProductsByStore(store_id);

    for (const product of products) {
      const variants = await Product.getVariantsByProduct(product.id);
      const images = await Product.getImagesByProduct(product.id);

      product.variants = variants;
      product.images = images;
    }

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
      return res.status(403).json({ error: "product limit reached" });
    }

    let image = null;

    if (req.files) {
      const productImage = req.files.find(f => f.fieldname === "image");
      if (productImage) {
        image = productImage.path || productImage.secure_url;
      }
    }

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
    const product_id = product.id;

    /* =========================
    IMÁGENES POR COLOR
    ========================= */

    const colorImages = req.files
      ? req.files.filter(f => f.fieldname === "color_images")
      : [];

    let imageColors = [];
    if (req.body.image_colors) {
      try {
        imageColors = JSON.parse(req.body.image_colors);
      } catch (e) {
        imageColors = [];
      }
    }

    for (let i = 0; i < colorImages.length; i++) {
      const file = colorImages[i];
      const imageUrl = file.path || file.secure_url;

      const color = imageColors[i] || "default";

      await Product.createProductImage({
        product_id: product_id,
        color: color,
        image_url: imageUrl
      });
    }

    /* =========================
    VARIANTES
    ========================= */

    if (req.body.variants) {
      let variants = req.body.variants;

      if (typeof variants === "string") {
        variants = JSON.parse(variants);
      }

      for (const variant of variants) {
        if (!variant.color || !variant.size) continue;

        await Product.createVariant({
          product_id: product_id,
          color: variant.color,
          size: variant.size,
          price: variant.price
        });
      }
    }

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

    if (req.files) {
      const productImage = req.files.find(f => f.fieldname === "image");
      if (productImage) {
        image = productImage.path || productImage.secure_url;
      }
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

    /* =========================
    🔥 REEMPLAZAR VARIANTES BIEN
    ========================= */

    await Product.deleteVariantsByProduct(id);

    let variants = [];

    if (req.body.variants) {
      try {
        variants =
          typeof req.body.variants === "string"
            ? JSON.parse(req.body.variants)
            : req.body.variants;
      } catch (e) {
        variants = [];
      }
    }

    if (variants.length > 0) {
      for (const variant of variants) {
        if (!variant.color || !variant.size) continue;

        await Product.createVariant({
          product_id: id,
          color: variant.color,
          size: variant.size,
          price: variant.price
        });
      }
    }

    /* =========================
    REEMPLAZAR IMÁGENES POR COLOR
    ========================= */

    const colorImages = req.files
      ? req.files.filter(f => f.fieldname === "color_images")
      : [];

    let imageColors = [];
    if (req.body.image_colors) {
      try {
        imageColors = JSON.parse(req.body.image_colors);
      } catch (e) {
        imageColors = [];
      }
    }

    if (colorImages.length > 0) {

      await Product.deleteImagesByProduct(id);

      for (let i = 0; i < colorImages.length; i++) {
        const file = colorImages[i];
        const imageUrl = file.path || file.secure_url;

        const color = imageColors[i] || "default";

        await Product.createProductImage({
          product_id: id,
          color: color,
          image_url: imageUrl
        });
      }
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