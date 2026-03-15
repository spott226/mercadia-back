const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

// catálogo público por tienda
router.get("/:store_id", productController.getProducts);

// operaciones del panel (requieren token)

// crear producto con imagen
router.post("/", auth, upload.single("image"), productController.createProduct);

// editar producto con imagen
router.put("/:id", auth, upload.single("image"), productController.updateProduct);

// eliminar producto
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;